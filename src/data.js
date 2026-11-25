/*
 * TaxGo: 데이터
 * 규칙 숫자, 공항 정보, 화면 문구를 코드와 분리해 둔 파일입니다.
 * 공항을 늘리거나 문구를 고칠 때는 이 파일만 고치면 됩니다.
 * 문장은 '~합니다'로 씁니다. 할 일을 안내하는 문장만 '~하세요', '~해 주세요'로 씁니다.
 * 자정을 넘는 시각은 '25:30'이 아니라 '다음 날 01:30'처럼 씁니다.
 * 내용 확인일: 공항 정보 2026-11-13, 면세 QR·절차 소요 시간 2026-11-16 (출처는 맨 아래 sources)
 */
window.MYGO_DATA = {
  checkedAt: '2026.11.13',          // 공항별 키오스크 정보를 확인한 날
  sourcesCheckedAt: '2026.11.13~16', // 근거 자료를 확인한 기간

  rules: {
    minPreTax: 5000,      // 같은 매장에서 같은 날 산 세전 합계의 하한 (엔)
    deadlineDays: 90,     // 구매 다음 날부터 세어 90일째까지 출국 (11.1 구매 → 1.30)

    // 공항 도착 목표를 자동으로 정하는 기준.
    // 공식 안내는 '일찍 도착'만 권하고 몇 시간 전인지는 정해 두지 않아서, 아래 숫자는 팀에서 정한 값입니다.
    arrive: {
      baseHours: 3,          // 보통은 출발 3시간 전
      maxHours: 5,           // 가장 이르게 잡아도 5시간 전까지
      manyReceipts: 4,       // 면세 영수증이 이만큼 이상이면 1시간 앞당김
      manyItems: 15,         // 또는 면세품이 이만큼 이상이면 1시간 앞당김 (합계만 넣은 영수증은 1개로 셈)
      manyTotal: 100000,     // 또는 확인할 면세품의 결제액이 10만 엔 이상이면 1시간 앞당김
      busyWeekdays: [0, 6],  // 일요일(0)·토요일(6) 출발이면 1시간 앞당김
      busyPeriods: [         // 일본의 큰 연휴에 출발하면 1시간 앞당김 ('월-일', 해마다 비슷한 기간)
        { from: '12-28', to: '01-04', label: '연말연시' },
        { from: '04-29', to: '05-06', label: '골든위크' },
        { from: '08-10', to: '08-16', label: '오봉 연휴' }
      ]
    }
  },

  // 환급 방법 (매장에서 살 때 정하는 것)
  methods: [
    { id: 'card', label: '신용카드' },
    { id: 'bank', label: '계좌·QR결제' },
    { id: 'cash', label: '공항에서 현금' },
    { id: 'unknown', label: '아직 모름' }
  ],

  // 여행 시점별로 홈 맨 위 안내판에 띄울 내용
  phases: {
    setup: {
      chip: '시작', picto: 'plane',
      title: '출국일을 알려 주세요',
      body: '출국일에 맞춰 그때그때 할 일을 알려 드립니다.',
      cta: '여행 정보 입력', act: 'trip'
    },
    shop: {
      chip: '쇼핑 중', picto: 'bag',
      title: '여행 중 먹을 건 따로 계산하세요',
      body: '면세 영수증에 든 물건은 출국 전에 먹거나 쓰면 안 됩니다. 하나라도 없으면 그 영수증 전체를 환급받을 수 없습니다.',
      cta: '영수증 추가', act: 'add'
    },
    eve: {
      chip: '출국 전날', picto: 'case',
      title: '면세품은 영수증별로 묶어 담으세요',
      body: '먹거나 쓴 물건이 있으면 지금 표시해 두세요. 물품 중 하나라도 없으면 그 영수증 전체를 환급받을 수 없습니다.',
      cta: '공항 도착 시간 계산', act: 'arrival'
    },
    day: {
      chip: '출국 당일', picto: 'kiosk',
      title: '체크인보다 키오스크 먼저',
      body: '짐을 맡긴 뒤에는 세관 확인을 받을 수 없습니다.',
      cta: '출국 체크리스트 열기', act: 'tab', arg: 'departure'
    },
    after: {
      chip: '출국 후', picto: 'yen',
      title: '환급이 들어왔는지 확인하세요',
      body: '카드와 계좌 환급은 출국한 뒤에 들어옵니다. 안 보이면 구매한 매장이나 환급 대행사에 문의하세요.',
      cta: '영수증별 환급 방법 보기', act: 'tab', arg: 'receipts'
    }
  },

  // 알림 문구와 시각 (출국일 기준). 출국 당일 알림은 공항 도착 목표 시각에 울립니다.
  reminders: {
    eve: { time: '21:00', title: '면세품은 먹거나 쓰지 않기', body: '하나라도 없으면 그 영수증 전체를 환급받을 수 없습니다. 영수증별로 묶어 담으세요.' },
    day: { title: '체크인보다 키오스크 먼저', body: '짐을 맡긴 뒤에는 세관 확인을 받을 수 없습니다.' },
    refund: { daysAfter: 7, time: '10:00', title: '환급이 들어왔는지 확인', body: '카드와 계좌 환급은 출국한 뒤에 들어옵니다. 안 보이면 구매한 매장에 문의하세요.' },
    guard: { daysBefore: 7, time: '10:00', title: '90일 출국 기한 7일 전', body: '기한 안에 출국해야 환급받을 수 있습니다.' }
  },

  // 출국 공항·항구별 면세 절차 위치
  // red, cash: '본문 (운영 06:00–21:00, 단말 5대처럼 이름을 붙인 시간·대수, 쉼표로 여러 개). 덧붙임 문장' 모양으로 쓰면 안내판에서 본문은 크게, 괄호 속은 칩으로, 덧붙임은 작은 글씨로 나눠 보여 줍니다 (괄호와 덧붙임은 없어도 됨)
  // vjw: 휴대폰(Visit Japan Web)으로 판정을 받을 수 있는 공항이면 true
  // open: 키오스크 운영 시작 시각을 아는 곳만. 공항 도착 목표가 이보다 이르면 이 시각에 맞춥니다
  // ship: 배편이면 true ('비행기 출발' 대신 '배 출발'로 표시)
  airports: [
    {
      id: 'fuk', name: '후쿠오카공항 국제선', short: '후쿠오카',
      kiosk: '국제선 3F 남쪽 J–M 카운터 앞',
      count: '12대', hours: '06:00–21:00', open: '06:00',
      red: '키오스크 바로 옆 세관 확인 장소에서 여권과 물건을 보여 줍니다 (운영 06:00–21:00)',
      cash: '출국심사 뒤 면세점 구역, HAKATA FOOD HALL 입구 옆 (단말 06:00–21:00, 카운터 07:00–21:00)',
      vjw: true,
      note: '휴대폰 판정은 3F 출발 로비의 세관 전용 Wi-Fi에서만 됩니다.',
      src: '후쿠오카공항 공식 안내', url: 'https://www.fukuoka-airport.jp/taxrefund_info.html'
    },
    {
      id: 'hkt', name: '하카타항 국제터미널 (배)', short: '하카타항', ship: true,
      kiosk: '승선 수속 전 구역 (위치 확인 필요)',
      count: '확인 필요', hours: '확인 필요',
      red: '세관 직원에게 여권과 물건을 보여 줍니다',
      cash: '구매한 매장이 안내한 환급 방법을 확인하세요',
      vjw: false,
      note: '부산행 배편도 환급 대상입니다. 단말 위치는 공개 자료를 찾지 못해 현장 확인이 필요합니다.',
      src: '관광청 공통 안내', url: 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html'
    },
    {
      id: 'kix1', name: '간사이공항 제1터미널', short: '간사이 T1',
      kiosk: '4F 국제선 출발 로비, 짐 맡기기 전 구역',
      count: '12대', hours: '공항 안내 확인',
      red: '4F 세관 검사장에서 여권과 물건을 보여 줍니다',
      cash: '구매한 매장이 안내한 환급 방법을 확인하세요',
      vjw: true,
      note: '키오스크가 붐빌 수 있어서 전용 Wi-Fi에서 휴대폰으로 판정받는 것을 권합니다.',
      src: '오사카세관 안내', url: 'https://www.customs.go.jp/osaka/about/images/kix_tax%20refund_en.pdf'
    },
    {
      id: 'kix2', name: '간사이공항 제2터미널', short: '간사이 T2',
      kiosk: '체크인 로비, 보안검사 전 구역',
      count: '4대', hours: '공항 안내 확인',
      red: '체크인 로비의 세관 검사장에서 여권과 물건을 보여 줍니다',
      cash: '구매한 매장이 안내한 환급 방법을 확인하세요',
      vjw: true,
      note: '',
      src: '오사카세관 안내', url: 'https://www.customs.go.jp/osaka/about/images/kix_tax%20refund_en.pdf'
    },
    {
      id: 'hnd3', name: '하네다공항 제3터미널', short: '하네다 T3',
      kiosk: '3F 보안검사 전 구역',
      count: '13대', hours: '24시간',
      red: '출발 로비 세관 검사장에서 여권과 물건을 보여 줍니다',
      cash: 'Self Tax Refund 단말, 3F 보안검사 뒤 (단말 5대, 운영 24시간). 현금 환급을 지원하는 매장 구매분만 됩니다',
      vjw: true,
      note: '',
      src: '하네다공항 공식 안내', url: 'https://tokyo-haneda.com/service/facilities/tax_refund.html'
    },
    {
      id: 'hnd2', name: '하네다공항 제2터미널', short: '하네다 T2',
      kiosk: '3F 보안검사 전 구역',
      count: '8대', hours: '06:00–다음 날 02:00', open: '06:00',
      red: '출발 로비 세관 검사장에서 여권과 물건을 보여 줍니다',
      cash: 'Self Tax Refund 단말, 3F 보안검사 뒤 (단말 5대, 운영 06:45–다음 날 01:30). 현금 환급을 지원하는 매장 구매분만 됩니다',
      vjw: true,
      note: '제1터미널에는 면세 절차가 없습니다.',
      src: '하네다공항 공식 안내', url: 'https://tokyo-haneda.com/service/facilities/tax_refund.html'
    },
    {
      id: 'ngo1', name: '주부 센트레아 제1터미널', short: '주부 T1',
      kiosk: '국제선 체크인 카운터 앞',
      count: '공항 안내 확인', hours: '운항 일정에 맞춤',
      red: '키오스크 근처 세관 확인 장소에서 여권과 물건을 보여 줍니다',
      cash: '3F 출발 로비의 현금 환급 카운터와 단말 (엔화만)',
      vjw: true,
      note: '키오스크가 붐비면 키오스크 근처에서 휴대폰으로도 판정받을 수 있습니다.',
      src: '센트레아 공식 안내', url: 'https://www.centrair.jp/ko/taxrefund/'
    },
    {
      id: 'other', name: '그 밖의 공항·항구', short: '기타',
      kiosk: '국제선 출발 로비, 짐 맡기기 전 구역',
      count: '공항 안내 확인', hours: '공항 안내 확인',
      red: '키오스크 근처 세관 검사 장소에서 여권과 물건을 보여 줍니다',
      cash: '구매한 매장이 안내한 환급 방법을 확인하세요',
      vjw: false,
      note: '나리타, 신치토세, 나하 공항은 휴대폰(Visit Japan Web) 판정도 됩니다.',
      src: '관광청 공통 안내', url: 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html'
    }
  ],

  // 출국일 체크리스트. {arrive} {kiosk} {red} {cash}는 여행 정보와 선택한 공항에 맞춰 바뀝니다.
  checklist: [
    { title: '공항 도착', desc: '{arrive}' },
    { title: '면세품 꺼내 두기', desc: '영수증별로 묶어서 바로 보여 줄 수 있게 합니다.' },
    { title: '키오스크에 여권 스캔', desc: '{kiosk}', key: true },
    { title: 'RED가 나오면 세관 확인', desc: '{red}' },
    { title: '체크인, 짐 맡기기', desc: '판정을 받은 다음에 맡깁니다.' },
    { title: '보안검사, 출국심사', desc: '지나면 출발 로비로 돌아올 수 없습니다.' },
    { title: '현금 환급 받기', desc: '{cash}', only: '현금 환급을 고른 영수증만' }
  ],

  // 면세 QR 만들기: 가이드의 매장 단계 맨 위 안내판에 나옵니다 (guide에서 qr: true인 단계)
  qr: {
    title: '면세 QR 만들기',
    sub: '계산할 때 여권 대신 보여 줍니다',
    steps: [
      '출발 전에 Visit Japan Web에 로그인하고, 여권을 카메라로 읽어 등록합니다.',
      '일본에 입국한 뒤, 여권에 붙은 상륙 허가 스티커를 카메라로 읽습니다.',
      '계산할 때 면세 QR 화면을 띄워 보여 줍니다.'
    ],
    cta: 'Visit Japan Web에서 QR 만들기',
    url: 'https://www.vjw.digital.go.jp/',
    host: '공식 주소 vjw.digital.go.jp (무료)',
    notes: [
      'QR은 만든 뒤 24시간만 쓸 수 있습니다. 지나면 다시 띄우면 됩니다.',
      '스크린샷이나 인쇄본은 쓸 수 없습니다. 화면을 직접 보여 주세요.',
      '등록해 둔 정보는 출국할 때 공항에서 휴대폰으로 판정받는 데도 쓰입니다.'
    ]
  },

  // 절차 가이드 (순서가 있는 3단계)
  guide: [
    {
      tab: '매장', title: '매장에서 살 때', qr: true,
      items: [
        { icon: 'passport', title: '여권이나 면세 QR 보여 주기', desc: '계산할 때 여권이나 Visit Japan Web의 면세 QR 화면을 보여 줍니다. QR을 읽지 못하는 매장에서는 여권을 보여 주면 됩니다.' },
        { icon: 'yen', title: '세금 포함 가격으로 결제', desc: '세금은 출국한 뒤에 돌려받습니다. 일반 물품은 10%, 식품과 음료(술 제외)는 8%입니다.' },
        { icon: 'card', title: '환급 방법 정하기', desc: '신용카드, 계좌, QR결제, 공항 현금 가운데 그 매장에서 되는 방법으로 정합니다. 수수료도 이때 확인합니다.' },
        { icon: 'receipt', title: '세전 5,000엔 이상', desc: '같은 매장에서 같은 날 산 금액을 합친 기준입니다.' }
      ],
      tip: { tone: 'sign', title: '여행 중 먹을 건 따로 계산하세요', desc: '면세 영수증에 든 물건을 하나라도 먹거나 쓰면 그 영수증 전체를 환급받을 수 없습니다.' }
    },
    {
      tab: '공항', title: '공항에서 출국할 때',
      items: [
        { icon: 'kiosk', title: '짐 맡기기 전에 키오스크부터', desc: '출발 로비의 면세 키오스크에 여권을 스캔합니다. 짐을 맡긴 뒤에는 확인받을 수 없습니다.' },
        { icon: 'search', title: 'GREEN이면 끝, RED면 세관 검사', desc: 'RED가 나오면 세관 검사 장소에서 여권과 산 물건을 보여 줍니다.' },
        { icon: 'wifi', title: '휴대폰으로도 판정', desc: '나리타, 하네다, 간사이, 주부, 후쿠오카, 신치토세, 나하 공항은 출발 로비의 전용 Wi-Fi에서 Visit Japan Web으로 할 수 있습니다.' },
        { icon: 'cal', title: '구매일부터 90일 안에 출국', desc: '구매 다음 날부터 세어 90일째까지입니다. 국내선으로 갈아타면 마지막 출국 공항에서 합니다.' }
      ],
      tip: { tone: 'risk', title: '먹었거나 없는 물건이 있다면', desc: '키오스크 대신 세관 직원에게 먼저 말하세요. 출국심사를 지나면 출발 로비로 돌아올 수 없습니다.' }
    },
    {
      tab: '환급', title: '환급받기',
      items: [
        { icon: 'shield', title: '돈은 매장(환급 대행사)이 보냅니다', desc: '세관은 물건을 가지고 나가는지만 확인합니다.' },
        { icon: 'card', title: '카드, 계좌, QR결제', desc: '출국한 뒤에 들어옵니다. 시기와 수수료는 매장마다 다릅니다.' },
        { icon: 'yen', title: '공항에서 현금', desc: '키오스크 확인 뒤 공항의 환급 단말이나 카운터에서 받습니다. 현금 환급을 지원하는 매장에서 산 것만 됩니다.' }
      ],
      tip: null
    }
  ],

  // 한국에 들어올 때 면세한도 (1인 기준)
  allowance: [
    { label: '기본', value: '800달러' },
    { label: '술 (별도)', value: '합쳐서 2L, 400달러 이하 (병 수 제한 없음)' },
    { label: '향수 (별도)', value: '100mL' },
    { label: '담배 (별도)', value: '200개비' }
  ],

  // 공항 표지판 일본어. hun은 한자 훈음
  signs: [
    { ja: '免税手続', yomi: 'めんぜいてつづき', ko: '면세 절차', hun: '免 면할 면, 税 세금 세, 手 손 수, 続 이을 속' },
    { ja: '税関確認', yomi: 'ぜいかんかくにん', ko: '세관 확인', hun: '税 세금 세, 関 빗장 관, 確 굳을 확, 認 알 인' },
    { ja: '手荷物預け', yomi: 'てにもつあずけ', ko: '짐 맡기기', hun: '手 손 수, 荷 멜 하, 物 물건 물, 預 맡길 예' },
    { ja: '出国審査', yomi: 'しゅっこくしんさ', ko: '출국심사', hun: '出 날 출, 国 나라 국, 審 살필 심, 査 조사할 사' }
  ],

  sources: [
    { label: '관광청: 리펀드 방식 안내', url: 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html' },
    { label: '관광청: 여행자용 안내 (영어)', url: 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00028.html' },
    { label: '관광청: 자주 묻는 질문 (절차에 걸리는 시간)', url: 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00050.html' },
    { label: '국세청: 리펀드 방식 Q&A (90일 계산)', url: 'https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/pdf/0025003-110_02.pdf' },
    { label: '국세청: 온라인 세관 확인 FAQ (한국어)', url: 'https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/format/002/onlinetetsuzuki/faqkor.htm' },
    { label: '디지털청: Visit Japan Web 면세 QR 개요', url: 'https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/c35856f8-dffd-408d-ba8e-2bcc368b3061/de5d8152/20230203_policies_visit_japan_web_outline_01.pdf' },
    { label: '후쿠오카공항: 면세 절차 위치', url: 'https://www.fukuoka-airport.jp/taxrefund_info.html' },
    { label: '하네다공항: TAX REFUND', url: 'https://tokyo-haneda.com/service/facilities/tax_refund.html' },
    { label: '오사카세관: 간사이공항 면세 절차', url: 'https://www.customs.go.jp/osaka/about/images/kix_tax%20refund_en.pdf' },
    { label: '센트레아: 면세 절차 (한국어)', url: 'https://www.centrair.jp/ko/taxrefund/' }
  ]
};
