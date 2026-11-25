/* 계산 로직 확인: node test/logic.test.js */
const assert = require('assert');
const path = require('path');

globalThis.window = globalThis;
require(path.join(__dirname, '..', 'src', 'data.js'));
require(path.join(__dirname, '..', 'src', 'logic.js'));

const D = globalThis.MYGO_DATA;
const L = globalThis.MYGO_LOGIC;
const R = D.rules;
const A = R.arrive;
let n = 0;
function eq(actual, expected, label) { assert.deepStrictEqual(actual, expected, label); n += 1; }
function stamp(d) { return L.toISO(d) + ' ' + L.pad(d.getHours()) + ':' + L.pad(d.getMinutes()); }

// 90일 기한: 구매 다음 날부터 90일째 (국세청 예시: 11.1 구매 → 1.30)
eq(L.deadlineOf('2026-11-01', R.deadlineDays), '2027-01-30', '11.1 → 1.30');
eq(L.deadlineOf('2026-11-12', R.deadlineDays), '2027-02-10', '11.12 → 2.10');
eq(L.deadlineOf('2026-12-31', R.deadlineDays), '2027-03-31', '연말 구매');
eq(L.diffDays('2026-11-15', '2026-11-17'), 2, '남은 날 수');
eq(L.diffDays('2026-11-17', '2026-11-15'), -2, '지난 날 수');

// 세금: 세금 포함 금액 → 세전, 세액
eq([L.preTaxOf(16500, 10), L.taxOf(16500, 10)], [15000, 1500], '10% 16,500');
eq([L.preTaxOf(14040, 8), L.taxOf(14040, 8)], [13000, 1040], '8% 14,040');
eq([L.preTaxOf(33000, 10), L.taxOf(33000, 10)], [30000, 3000], '10% 33,000');
eq(L.preTaxOf(5500, 10), 5000, '10% 경계: 5,500 → 세전 5,000');
eq(L.preTaxOf(5499, 10), 4999, '10% 경계 바로 아래');
eq(L.preTaxOf(5400, 8), 5000, '8% 경계: 5,400 → 세전 5,000');

// 영수증 상태 (합계만 입력)
const base = { store: 'A', date: '2026-11-14', mode: 'total', total: 16500, rate: 10, fee: 0, consumed: false, items: [] };
eq(L.receiptView(base, R, '2026-11-17').status, 'ok', '정상');
eq(L.receiptView(base, R, '2026-11-17').due, '2027-02-12', '기한');
eq(L.receiptView({ ...base, consumed: true }, R, '2026-11-17').status, 'consumed', '소비');
eq(L.receiptView({ ...base, total: 5000 }, R, '2026-11-17').status, 'under', '기준 미달');
eq(L.receiptView(base, R, '2027-02-12').status, 'ok', '기한 당일 출국');
eq(L.receiptView(base, R, '2027-02-13').status, 'late', '기한 다음 날 출국');
eq(L.receiptView({ ...base, fee: 300 }, R, '').net, 1200, '수수료 반영');
eq(L.receiptView({ ...base, fee: 99999 }, R, '').net, 0, '수수료가 세액보다 클 수 없음');
eq([L.receiptView(base, R, '').count, L.receiptView(base, R, '').used], [0, 0], '합계만 넣은 영수증은 물품 수 0');

// 영수증 상태 (물품별 입력): 합계는 물품 금액의 합, 하나라도 소비하면 영수증 전체가 환급 불가
const prices = [2160, 1080, 1944, 1296, 3240, 4320];   // 합 14,040
const items = (usedIndex) => prices.map((p, i) => ({ id: 'i' + i, name: '물품 ' + (i + 1), price: p, used: i === usedIndex }));
const itemized = { store: 'B', date: '2026-11-14', mode: 'items', total: 0, rate: 8, fee: 0, consumed: false, items: items(-1) };
eq(L.totalOf(itemized), 14040, '물품 금액의 합');
const iv = L.receiptView(itemized, R, '2026-11-17');
eq([iv.total, iv.pre, iv.net, iv.status, iv.count, iv.used], [14040, 13000, 1040, 'ok', 6, 0], '물품별 영수증');
const used1 = { ...itemized, items: items(1) };
eq([L.isConsumed(used1), L.usedCountOf(used1), L.receiptView(used1, R, '2026-11-17').status], [true, 1, 'consumed'], '물품 하나 소비 → 환급 불가');
eq(L.isConsumed({ ...itemized, consumed: true }), false, '물품별 영수증은 물품 체크만 봄');
eq(L.receiptView({ ...itemized, rate: 10, items: [{ id: 'x', name: '티셔츠', price: 5000, used: false }] }, R, '').status, 'under', '물품 합이 기준 미달');
eq(L.totalOf({ ...base, mode: 'items', items: [] }), 16500, '물품이 없으면 합계 금액을 씀');
eq(L.isConsumed({ ...base, mode: 'items', items: [], consumed: true }), true, '물품이 없으면 영수증 단위 표시를 씀');

// 합계 (예시 데이터와 같은 구성)
const receipts = [
  { ...base, date: '2026-11-14' },
  used1,
  { ...base, date: '2026-11-15', total: 33000 }
];
const sum = L.summarize(receipts, R, '2026-11-17');
eq([sum.refund, sum.risk, sum.okCount, sum.riskCount, sum.earliestDue], [4500, 1040, 2, 1, '2027-02-12'], '합계');
eq([sum.goodsReceipts, sum.goodsItems], [3, 8], '공항에서 확인받을 영수증 3장, 물품 8개 (합계만 넣은 영수증은 1개로)');

// 여행 시점
const trip = { airport: 'fuk', depDate: '2026-11-17', depTime: '15:30', lead: 0 };   // 화요일
eq(L.phaseOf(new Date(2026, 10, 15, 18, 0), trip), 'shop', '이틀 전');
eq(L.phaseOf(new Date(2026, 10, 16, 0, 5), trip), 'eve', '전날 자정 직후');
eq(L.phaseOf(new Date(2026, 10, 16, 23, 59), trip), 'eve', '전날 밤');
eq(L.phaseOf(new Date(2026, 10, 17, 0, 1), trip), 'day', '당일 새벽');
eq(L.phaseOf(new Date(2026, 10, 17, 15, 29), trip), 'day', '출발 1분 전');
eq(L.phaseOf(new Date(2026, 10, 17, 15, 30), trip), 'after', '출발 시각');
eq(L.phaseOf(new Date(2026, 10, 20, 9, 0), trip), 'after', '출국 후');
eq(L.phaseOf(new Date(2026, 10, 15), { depDate: '' }), 'setup', '출국일 없음');
eq(L.dLabel(new Date(2026, 10, 15, 18, 0), '2026-11-17'), 'D-2', 'D-2');
eq(L.dLabel(new Date(2026, 10, 17, 8, 0), '2026-11-17'), 'D-day', 'D-day');
eq(L.dLabel(new Date(2026, 10, 18, 8, 0), '2026-11-17'), 'D+1', 'D+1');

// 붐비는 날: 주말, 일본의 큰 연휴
eq(L.busyOf('2026-11-17', A), '', '평일');
eq(L.busyOf('2026-11-15', A), 'weekend', '일요일');
eq(L.busyOf('2026-11-21', A), 'weekend', '토요일');
eq(L.busyOf('2026-12-27', A), 'weekend', '연말연시 하루 전 일요일');
eq(L.busyOf('2026-12-28', A), '연말연시', '연말연시 첫날');
eq(L.busyOf('2027-01-02', A), '연말연시', '해를 넘긴 기간 (토요일이어도 연휴 이름)');
eq(L.busyOf('2027-01-04', A), '연말연시', '연말연시 마지막 날');
eq(L.busyOf('2027-01-05', A), '', '연말연시 다음 날 화요일');
eq(L.busyOf('2027-04-29', A), '골든위크', '골든위크 첫날');
eq(L.busyOf('2027-05-07', A), '', '골든위크 다음 날 금요일');
eq(L.busyOf('2027-08-12', A), '오봉 연휴', '오봉');

// 공항 도착 목표: 기본 3시간 전, 붐비는 날 +1, 면세품이 많으면 +1, 최대 5시간 전
const fuk = D.airports.find((a) => a.id === 'fuk');     // 키오스크 06:00부터
const hnd3 = D.airports.find((a) => a.id === 'hnd3');   // 24시간
const four = receipts.concat([{ ...base, date: '2026-11-15', total: 8800 }]);
const plan = (t, rs, ap) => L.arrivalPlan({ ...trip, ...t }, rs || receipts, R, ap || fuk);
let p = plan({});
eq([stamp(p.at), p.hours, p.auto, p.busy, p.many, p.clamped, p.leadMin], ['2026-11-17 12:30', 3, true, '', false, false, 180], '평일, 면세품 적음 → 3시간 전');
eq([p.receipts, p.items, stamp(p.dep)], [3, 8, '2026-11-17 15:30'], '면세 영수증·물품 수와 출발 시각');
p = plan({ depDate: '2026-11-15' });
eq([stamp(p.at), p.hours, p.busy, p.many], ['2026-11-15 11:30', 4, 'weekend', false], '주말 → 4시간 전');
p = plan({}, four);
eq([stamp(p.at), p.hours, p.busy, p.many], ['2026-11-17 11:30', 4, '', true], '면세 영수증 4장 → 4시간 전');
p = plan({ depDate: '2026-11-15' }, four);
eq([stamp(p.at), p.hours], ['2026-11-15 10:30', 5], '주말이고 면세품도 많음 → 5시간 전');
p = plan({ depDate: '2026-12-30' }, four);
eq([stamp(p.at), p.hours, p.busy], ['2026-12-30 10:30', 5, '연말연시'], '연휴이고 면세품도 많음 → 5시간 전 (그보다 이르게 잡지 않음)');
const fifteen = [{ ...itemized, rate: 10, items: Array.from({ length: A.manyItems }, (_, i) => ({ id: 'k' + i, name: '물품', price: 400, used: false })) }];
p = plan({}, fifteen);
eq([p.hours, p.many, p.receipts, p.items], [4, true, 1, 15], '영수증은 한 장이어도 면세품 15개 → 4시간 전');
p = L.arrivalPlan({ ...trip, depDate: '2026-12-30' }, [], R, fuk,
  { goodsReceipts: 1, goodsItems: 2, goodsTotal: A.manyTotal });
eq([p.hours, p.busy, p.many], [5, '연말연시', true], '최종 확인한 결제액이 기준 이상이고 연휴이면 5시간 전');
p = L.arrivalPlan(trip, fifteen, R, fuk, { goodsReceipts: 1, goodsItems: 1, goodsTotal: 400 });
eq([p.hours, p.many], [3, false], '최종 확인한 물품만으로 도착 목표 계산');
p = plan({}, [1, 2, 3, 4].map(() => ({ ...base, total: 1000 })));
eq([p.hours, p.many, p.receipts], [3, false, 0], '면세 기준에 못 미친 영수증은 세지 않음');
p = plan({}, []);
eq([stamp(p.at), p.hours], ['2026-11-17 12:30', 3], '영수증이 없어도 계산');
eq(L.arrivalPlan({ depDate: '' }, receipts, R, fuk), null, '출국일이 없으면 계산하지 않음');

// 직접 고른 시간(3~5)은 그대로, 그 밖의 값은 자동
p = plan({ lead: 5 });
eq([stamp(p.at), p.hours, p.auto, p.busy, p.many], ['2026-11-17 10:30', 5, false, '', false], '5시간 전을 직접 고름');
p = plan({ depDate: '2026-11-15', lead: 3 }, four);
eq([stamp(p.at), p.hours, p.auto], ['2026-11-15 12:30', 3, false], '붐비는 날이어도 직접 고른 3시간 전');
eq([plan({ lead: 2 }).auto, plan({ lead: 9 }).auto, plan({ lead: 'x' }).auto], [true, true, true], '범위를 벗어난 값은 자동');

// 키오스크 운영 시작보다 이르면 운영 시작 시각에 맞춤
p = plan({ depTime: '07:30' });
eq([stamp(p.at), p.clamped, p.leadMin, p.hours], ['2026-11-17 06:00', true, 90, 3], '07:30 출발, 키오스크 06:00 → 06:00');
p = plan({ depTime: '09:00' });
eq([stamp(p.at), p.clamped], ['2026-11-17 06:00', false], '목표가 운영 시작과 같으면 그대로');
p = plan({ depTime: '07:30' }, receipts, hnd3);
eq([stamp(p.at), p.clamped], ['2026-11-17 04:30', false], '24시간 운영 공항은 맞추지 않음');
p = plan({ depTime: '01:30' });
eq([stamp(p.at), p.clamped], ['2026-11-16 22:30', false], '새벽 출발이면 전날 밤');

// 알림 일정: 출국 당일 알림은 공항 도착 목표 시각
const rem = L.buildReminders(trip, receipts, R, D.reminders, fuk);
eq(rem.map((r) => r.id), ['eve', 'day', 'refund'], '알림 순서 (기한이 멀면 안전장치 없음)');
eq(rem.map((r) => stamp(r.at)), ['2026-11-16 21:00', '2026-11-17 12:30', '2026-11-24 10:00'], '알림 시각');
const dayOf = (t, rs) => stamp(L.buildReminders({ ...trip, ...t }, rs || receipts, R, D.reminders, fuk).find((r) => r.id === 'day').at);
eq(dayOf({ depDate: '2026-11-15' }, four), '2026-11-15 10:30', '붐비는 날 + 면세품 많음 → 당일 알림도 5시간 전');
eq(dayOf({ lead: 4 }), '2026-11-17 11:30', '직접 고른 4시간 전에 당일 알림');
eq(dayOf({ depTime: '01:30' }), '2026-11-16 22:30', '새벽 출발이면 전날 밤 알림');
const lateTrip = { ...trip, depDate: '2027-02-10' };
eq(L.buildReminders(lateTrip, receipts, R, D.reminders, fuk).map((r) => r.id).includes('guard'), true, '출국이 기한에 가까우면 안전장치 알림');
eq(L.buildReminders({ depDate: '' }, receipts, R, D.reminders, fuk).map((r) => r.id), ['guard'], '출국일이 없으면 기한 안전장치만');

// 캘린더 파일
const ics = L.toICS(rem, new Date(Date.UTC(2026, 10, 15, 9, 0, 0)));
eq((ics.match(/BEGIN:VEVENT/g) || []).length, 3, '이벤트 3개');
eq((ics.match(/BEGIN:VALARM/g) || []).length, 3, '알람 3개');
eq(ics.includes('DTSTART:20261116T210000'), true, '시작 시각');
eq(ics.includes('DTSTART:20261117T123000'), true, '당일 알림 시작 시각');
eq(ics.includes('PRODID:-//MAIGO//TaxGo//KO'), true, '앱 이름');
eq((ics.match(/@taxgo\r\n/g) || []).length, 3, 'UID');
eq(ics.split('\r\n').every((line) => Buffer.byteLength(line, 'utf8') <= 75), true, '한 줄 75옥텟 이하');
const unicodeBody = 'a'.repeat(58) + '🧳✈️\r' + '출국 일정'.repeat(30);
const unicodeICS = L.toICS([{ ...rem[0], body: unicodeBody }], new Date()).split('\r\n');
eq(unicodeICS.every((line) => Buffer.byteLength(line, 'utf8') <= 75), true, '문자 길이와 관계없이 한 줄 75옥텟 이하');
eq(Buffer.from(unicodeICS.join('\r\n')).toString('utf8').replace(/\r\n /g, '').includes('DESCRIPTION:' + unicodeBody.replace('\r', '\\n')), true, 'UTF-8 문자 사이에서만 접고 줄바꿈을 이스케이프');
eq(ics.endsWith('END:VCALENDAR\r\n'), true, '끝');

// 데이터 모양
const isTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const isMD = (s) => /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s);
eq(D.airports.every((a) => a.id && a.name && a.short && a.kiosk && a.count && a.hours && a.red && a.cash && a.url), true, '공항 필수 항목');
eq(D.airports.every((a) => a.open === undefined || isTime(a.open)), true, '키오스크 운영 시작 시각 형식');
eq(new Set(D.airports.map((a) => a.id)).size, D.airports.length, '공항 id가 겹치지 않음');
eq(Object.keys(D.phases).sort(), ['after', 'day', 'eve', 'setup', 'shop'], '시점 5개');
eq(A.baseHours <= A.maxHours && A.manyReceipts > 0 && A.manyItems > 0, true, '도착 목표 기준 숫자');
eq(A.busyPeriods.every((x) => isMD(x.from) && isMD(x.to) && !!x.label), true, '연휴 기간 형식');
eq(D.checklist[0].desc.includes('{arrive}'), true, '체크리스트 첫 단계는 공항 도착 목표');
eq(D.guide.filter((g) => g.qr).length, 1, '면세 QR 안내판은 한 단계에만');
eq([D.qr.url, D.qr.steps.length], ['https://www.vjw.digital.go.jp/', 3], '면세 QR 바로가기 주소와 단계');
eq(D.sources.every((s) => s.label && /^https:\/\//.test(s.url)), true, '근거 자료 주소');

// 공항 안내 문장 나누기: 본문 / 괄호 속 부가 정보 / 덧붙임 문장 (출국 화면 키오스크 안내판)
eq(L.splitInfo('세관 직원에게 여권과 물건을 보여 줘요'), { text: '세관 직원에게 여권과 물건을 보여 줘요', meta: [], extra: '' }, '괄호 없는 문장은 그대로');
eq(L.splitInfo('세관 확인 장소 (06:00–21:00)'), { text: '세관 확인 장소', meta: ['06:00–21:00'], extra: '' }, '괄호 속 시간');
eq(L.splitInfo('출국심사 뒤 면세점 구역 (단말 06:00–21:00, 카운터 07:00–21:00)').meta, ['단말 06:00–21:00', '카운터 07:00–21:00'], '쉼표로 부가 정보 나누기');
eq(L.splitInfo('Self Tax Refund 단말 (5대, 24시간). 현금 환급 매장만 돼요'), { text: 'Self Tax Refund 단말', meta: ['5대', '24시간'], extra: '현금 환급 매장만 돼요' }, '괄호와 덧붙임 문장');
eq(L.splitInfo('A.'), { text: 'A', meta: [], extra: '' }, '끝 마침표 떼기');
eq(L.splitInfo(''), { text: '', meta: [], extra: '' }, '빈 문장');
eq(D.airports.every((a) => L.splitInfo(a.red).text && L.splitInfo(a.cash).text), true, '모든 공항의 RED·현금 안내에 본문이 있음');
eq(D.airports.every((a) => !/[()]/.test(L.splitInfo(a.red).text + L.splitInfo(a.cash).text)), true, '본문에 괄호가 남지 않음');

// 화면 문장은 '~합니다'로 통일 (안내하는 문장만 '~하세요', '~해 주세요')
const strings = [];
(function walk(v) { if (typeof v === 'string') strings.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); })(D);
eq(strings.filter((s) => /(?<![세필개중])요(?=[\s.,!?)]|$)/.test(s)), [], "데이터 문장에 '~요' 끝맺음이 없음");
eq(strings.filter((s) => /(불가|가능|주의)\.$/.test(s)), [], '문장이 명사로 끝나지 않음');
// 자정을 넘는 시각은 '25:30'이 아니라 '다음 날 01:30'처럼
eq(strings.filter((s) => /\b(2[4-9]|3\d):[0-5]\d\b/.test(s)), [], '24시를 넘는 시각 표기가 없음');

console.log('ok', n, 'checks');
