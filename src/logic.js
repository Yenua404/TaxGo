/*
 * TaxGo: 계산 로직
 * 화면과 무관한 순수 함수만 모았습니다. 날짜, 세금, 영수증, 여행 시점, 공항 도착 목표, 알림 일정을 계산합니다.
 * node에서도 그대로 실행되므로 test/logic.test.js로 바로 검증할 수 있습니다.
 */
(function (root) {
  'use strict';

  var DAY = 86400000;
  var HOUR = 3600000;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- 날짜 ----------
     날짜는 'YYYY-MM-DD' 문자열로 주고받고, 계산할 때만 현지 시각 정오의 Date로 바꿉니다.
     (한국과 일본은 같은 시간대라 기기 시각을 그대로 씁니다.) */
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function parseISO(iso) {
    var p = String(iso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0);
  }

  function addDays(iso, n) {
    var d = parseISO(iso);
    d.setDate(d.getDate() + n);
    return toISO(d);
  }

  /* fromISO에서 untilISO까지 남은 날 수 (같은 날이면 0) */
  function diffDays(fromISO, untilISO) {
    return Math.round((parseISO(untilISO).getTime() - parseISO(fromISO).getTime()) / DAY);
  }

  /* 날짜와 'HH:MM'을 합쳐 Date로 */
  function at(iso, hhmm) {
    var d = parseISO(iso);
    var m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
    d.setHours(m ? +m[1] : 12, m ? +m[2] : 0, 0, 0);
    return d;
  }

  /* ---------- 세금 ----------
     세금 포함 금액에서 세전 금액을 구합니다(엔 미만 버림). 면세 기준(세전 5,000엔)을
     넉넉하게 보지 않으려고 세전 쪽을 버림합니다. 영수증에 적힌 세액과 1엔쯤 다를 수 있습니다. */
  function preTaxOf(total, rate) { return Math.floor(total * 100 / (100 + rate)); }
  function taxOf(total, rate) { return total - preTaxOf(total, rate); }

  /* 구매 다음 날부터 세어 days일째 = 구매일 + days (11.1 구매, 90일 → 1.30) */
  function deadlineOf(buyISO, days) { return addDays(buyISO, days); }

  /* ---------- 영수증 ----------
     영수증은 두 가지 방식으로 입력합니다.
     - mode 'total': 결제 금액 합계만 넣음. 소비 여부는 영수증 단위(consumed)
     - mode 'items': 물품을 하나씩 넣음. 합계는 물품 금액의 합, 소비 여부는 물품 단위(items[i].used) */
  function isItemized(r) { return !!r && r.mode === 'items' && Array.isArray(r.items) && r.items.length > 0; }

  /* 세금 포함 결제 금액 */
  function totalOf(r) {
    if (!isItemized(r)) return Math.max(0, Math.floor(+r.total || 0));
    var sum = 0;
    for (var i = 0; i < r.items.length; i++) sum += Math.max(0, Math.floor(+r.items[i].price || 0));
    return sum;
  }

  /* 먹었거나 써서 없다고 체크한 물품 수 (물품별 입력일 때만) */
  function usedCountOf(r) {
    var n = 0;
    if (isItemized(r)) for (var i = 0; i < r.items.length; i++) if (r.items[i].used) n += 1;
    return n;
  }

  /* 먹었거나 써서 없는 물건이 하나라도 있으면 그 영수증 전체가 환급 불가 */
  function isConsumed(r) { return isItemized(r) ? usedCountOf(r) > 0 : !!r.consumed; }

  /* 영수증 한 장의 계산 결과
     status: ok(환급 가능) / consumed(먹었거나 없는 물건 있음) / late(출국일이 기한 뒤) / under(면세 기준 미달)
     count: 물품 수(합계만 넣은 영수증은 0), used: 그중 소비한 물품 수 */
  function receiptView(r, rules, depISO) {
    var rate = +r.rate === 8 ? 8 : 10;
    var total = totalOf(r);
    var pre = preTaxOf(total, rate);
    var tax = total - pre;
    var fee = Math.min(Math.max(0, Math.floor(+r.fee || 0)), tax);
    var eligible = pre >= rules.minPreTax;
    var due = deadlineOf(r.date, rules.deadlineDays);
    var late = !!depISO && depISO > due;
    var status = !eligible ? 'under' : isConsumed(r) ? 'consumed' : late ? 'late' : 'ok';
    return {
      total: total, pre: pre, tax: tax, fee: fee, net: tax - fee, eligible: eligible, due: due, status: status,
      count: isItemized(r) ? r.items.length : 0, used: usedCountOf(r)
    };
  }

  /* 영수증 전체 합계
     goodsReceipts / goodsItems: 공항에서 확인받을 면세 영수증 수와 물품 수 (합계만 넣은 영수증은 물품 1개로 셈) */
  function summarize(receipts, rules, depISO) {
    var s = { count: receipts.length, refund: 0, risk: 0, okCount: 0, riskCount: 0, goodsReceipts: 0, goodsItems: 0, goodsTotal: 0, earliestDue: '' };
    receipts.forEach(function (r) {
      var v = receiptView(r, rules, depISO);
      if (v.status === 'ok') {
        s.refund += v.net; s.okCount += 1;
      } else if (v.status !== 'under') {
        s.risk += v.net; s.riskCount += 1;
      }
      if (v.status !== 'under') {
        s.goodsReceipts += 1;
        s.goodsItems += v.count || 1;
        s.goodsTotal += v.total;
      }
      if ((v.status === 'ok' || v.status === 'late') && (!s.earliestDue || v.due < s.earliestDue)) s.earliestDue = v.due;
    });
    return s;
  }

  /* ---------- 여행 시점 ----------
     setup(출국일 없음) / shop(쇼핑 중) / eve(출국 전날) / day(출국 당일) / after(출국 후) */
  function phaseOf(now, trip) {
    if (!trip || !trip.depDate) return 'setup';
    if (now.getTime() >= at(trip.depDate, trip.depTime).getTime()) return 'after';
    var left = diffDays(toISO(now), trip.depDate);
    if (left <= 0) return 'day';
    if (left === 1) return 'eve';
    return 'shop';
  }

  function dLabel(now, depISO) {
    var left = diffDays(toISO(now), depISO);
    return left > 0 ? 'D-' + left : left === 0 ? 'D-day' : 'D+' + (-left);
  }

  /* ---------- 공항 도착 목표 ----------
     보통은 출발 3시간 전. 붐비는 날(주말, 일본의 큰 연휴)에 출발하거나 면세품이 많으면
     1시간씩 앞당겨 최대 5시간 전까지 자동으로 정합니다. 기준 숫자는 data.js의 rules.arrive에 있습니다.
     trip.lead가 3~5이면 사용자가 직접 고른 값이라 그대로 씁니다(0이면 자동).
     키오스크 운영 시작(airport.open)보다 이르면 운영 시작 시각에 맞춥니다. */

  /* 붐비는 날이면 이유를 돌려줍니다: 연휴 이름, 'weekend', 또는 ''(평소) */
  function busyOf(depISO, a) {
    var md = depISO.slice(5);
    var periods = a.busyPeriods || [];
    for (var i = 0; i < periods.length; i++) {
      var p = periods[i];
      /* from이 to보다 크면 해를 넘기는 기간 (예: 12-28 ~ 01-04) */
      var inside = p.from <= p.to ? (md >= p.from && md <= p.to) : (md >= p.from || md <= p.to);
      if (inside) return p.label;
    }
    return (a.busyWeekdays || []).indexOf(parseISO(depISO).getDay()) >= 0 ? 'weekend' : '';
  }

  /* 결과: at(도착 목표), dep(출발), hours(몇 시간 전), auto(자동인지), busy·many(앞당긴 이유),
     receipts·items(면세 영수증·물품 수), clamped(키오스크 운영 시작에 맞췄는지), leadMin(실제로 출발 몇 분 전인지) */
  function hasManyGoods(goods, rules) {
    return goods.goodsReceipts >= rules.arrive.manyReceipts ||
      goods.goodsItems >= rules.arrive.manyItems || goods.goodsTotal >= rules.arrive.manyTotal;
  }

  function arrivalPlan(trip, receipts, rules, airport, goods) {
    if (!trip || !trip.depDate) return null;
    var a = rules.arrive;
    var dep = at(trip.depDate, trip.depTime);
    var lead = Math.floor(+trip.lead || 0);
    var manual = lead >= a.baseHours && lead <= a.maxHours;
    var sum = goods || summarize(receipts || [], rules, trip.depDate);
    var busy = manual ? '' : busyOf(trip.depDate, a);
    var many = !manual && hasManyGoods(sum, rules);
    var hours = manual ? lead : Math.min(a.maxHours, a.baseHours + (busy ? 1 : 0) + (many ? 1 : 0));
    var target = new Date(dep.getTime() - hours * HOUR);
    var clamped = false;
    if (airport && airport.open) {
      var openAt = at(trip.depDate, airport.open);
      if (openAt.getTime() < dep.getTime() && target.getTime() < openAt.getTime()) {
        target = openAt;
        clamped = true;
      }
    }
    return {
      at: target, dep: dep, hours: hours, auto: !manual, busy: busy, many: many,
      receipts: sum.goodsReceipts, items: sum.goodsItems, clamped: clamped,
      leadMin: Math.round((dep.getTime() - target.getTime()) / 60000)
    };
  }

  /* ---------- 알림 일정 ----------
     출국일 기준 알림 3개 + 90일 기한 안전장치(출국일이 기한 7일 전보다 늦을 때만)
     출국 당일 알림은 공항 도착 목표 시각에 맞춥니다. */
  function buildReminders(trip, receipts, rules, texts, airport, plan) {
    var list = [];
    var dep = trip && trip.depDate ? trip.depDate : '';
    if (dep) {
      plan = plan || arrivalPlan(trip, receipts, rules, airport);
      list.push({ id: 'eve', at: at(addDays(dep, -1), texts.eve.time), title: texts.eve.title, body: texts.eve.body });
      list.push({ id: 'day', at: plan.at, title: texts.day.title, body: texts.day.body + (airport ? ' 키오스크: ' + airport.kiosk : '') });
      list.push({ id: 'refund', at: at(addDays(dep, texts.refund.daysAfter), texts.refund.time), title: texts.refund.title, body: texts.refund.body });
    }
    var due = summarize(receipts, rules, dep).earliestDue;
    if (due) {
      var guardISO = addDays(due, -texts.guard.daysBefore);
      if (!dep || dep >= guardISO) {
        list.push({ id: 'guard', at: at(guardISO, texts.guard.time), title: texts.guard.title, body: texts.guard.body + ' 기한: ' + due });
      }
    }
    list.sort(function (a, b) { return a.at.getTime() - b.at.getTime(); });
    return list;
  }

  /* ---------- 캘린더 파일(.ics) ----------
     휴대폰 캘린더에 넣으면 앱을 닫아도 같은 시각에 알림이 울립니다. */
  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n?|\n/g, '\\n');
  }

  /* 한 줄이 75옥텟을 넘지 않게 접기 (한글은 UTF-8에서 3바이트) */
  function icsFold(line) {
    var out = '';
    var bytes = 0;
    for (var character of line) {
      var code = character.codePointAt(0);
      var b = code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
      if (bytes + b > 75) { out += '\r\n '; bytes = 1; }
      out += character;
      bytes += b;
    }
    return out;
  }

  function icsLocal(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  }

  function icsUTC(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }

  function icsRepeat(r) {
    var rule = 'RRULE:FREQ=' + r.repeat.toUpperCase();
    if (r.repeat === 'daily' && r.untilISO) {
      return rule + ';COUNT=' + (diffDays(toISO(r.at), r.untilISO) + 1);
    }
    if (r.repeat === 'monthly' && r.at.getDate() > 28) {
      /* Use the original day when present, falling back to the last day of a shorter month. */
      return rule + ';BYMONTHDAY=' + r.at.getDate() + ',-1;BYSETPOS=1';
    }
    return rule;
  }

  function toICS(reminders, stamp) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MAIGO//TaxGo//KO', 'CALSCALE:GREGORIAN'];
    reminders.forEach(function (r) {
      var end = new Date(r.at.getTime() + 15 * 60000);
      lines.push(
        'BEGIN:VEVENT',
        'UID:' + r.id + '-' + icsLocal(r.at) + '@taxgo',
        'DTSTAMP:' + icsUTC(stamp),
        'DTSTART:' + icsLocal(r.at),
        'DTEND:' + icsLocal(end),
        'SUMMARY:' + icsEscape('[면세] ' + r.title),
        'DESCRIPTION:' + icsEscape(r.body),
        ...(r.repeat ? [icsRepeat(r)] : []),
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:' + icsEscape(r.title),
        'TRIGGER:-PT0M',
        'END:VALARM',
        'END:VEVENT'
      );
    });
    lines.push('END:VCALENDAR');
    return lines.map(icsFold).join('\r\n') + '\r\n';
  }

  /* 공항 안내 문장(data.js의 red, cash)을 화면에서 따로따로 보여 주려고 세 덩어리로 나눕니다.
     '본문 (괄호 속 부가 정보, 쉼표로 여러 개). 덧붙임 문장' 모양이고, 괄호와 덧붙임은 없어도 됩니다.
     예) '출국심사 뒤 면세점 구역 (단말 06:00–21:00, 카운터 07:00–21:00). 현금 환급 매장만 돼요'
         → { text: '출국심사 뒤 면세점 구역', meta: ['단말 06:00–21:00', '카운터 07:00–21:00'], extra: '현금 환급 매장만 돼요' } */
  function splitInfo(str) {
    var m = /^(.*?)(?:\s*\(([^()]*)\))?(?:\.\s+(.+?))?\.?$/.exec(String(str == null ? '' : str).trim());
    var meta = [];
    (m[2] || '').split(',').forEach(function (t) {
      t = t.trim();
      if (t) meta.push(t);
    });
    return { text: m[1], meta: meta, extra: m[3] || '' };
  }

  root.MYGO_LOGIC = {
    pad: pad, toISO: toISO, parseISO: parseISO, addDays: addDays, diffDays: diffDays, at: at,
    splitInfo: splitInfo,
    preTaxOf: preTaxOf, taxOf: taxOf, deadlineOf: deadlineOf,
    totalOf: totalOf, usedCountOf: usedCountOf, isConsumed: isConsumed,
    receiptView: receiptView, summarize: summarize,
    phaseOf: phaseOf, dLabel: dLabel,
    busyOf: busyOf, hasManyGoods: hasManyGoods, arrivalPlan: arrivalPlan,
    buildReminders: buildReminders, toICS: toICS
  };
})(typeof window !== 'undefined' ? window : globalThis);
