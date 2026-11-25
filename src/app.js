/*
 * TaxGo: 화면
 * state(저장되는 데이터)나 ui(화면 상태)를 바꾼 뒤 render()를 부르면 지금 탭을 다시 그립니다.
 * 계산은 logic.js, 문구와 공항 정보는 data.js에 있습니다.
 */
(function () {
  'use strict';

  var D = window.MYGO_DATA;
  var L = window.MYGO_LOGIC;
  var R = window.TAXGO_REMINDERS;
  var DETAILS = window.TAXGO_DETAILS;
  var PICKS = window.TAXGO_PICKS;
  var QUIZ = window.TAXGO_QUIZ;
  var QUIZ_ART = window.TAXGO_QUIZ_ART;
  var A = D.rules.arrive;
  var STORE_KEY = 'taxgo-v1';
  var OLD_STORE_KEY = 'mygo-taxfree-v1';   // 앱 이름을 바꾸기 전에 쓰던 저장 키
  var TABS = ['home', 'receipts', 'departure', 'calendar', 'wallet'];
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  var PREVIEWS = [['auto', '지금'], ['shop', '쇼핑 중'], ['eve', '전날'], ['day', '당일'], ['after', '출국 후']];
  var MAX_ITEMS = 50;   // 영수증 한 장에 넣을 수 있는 물품 수
  var MAX_YEN = 99999999;

  /* ---------- 작은 도구들 ---------- */
  function $(sel) { return document.querySelector(sel); }

  /* 사용자가 입력한 글자는 반드시 이 함수를 거쳐 화면에 넣습니다 (HTML로 해석되지 않게) */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function toInt(v) {
    var n = Number(v);
    return Number.isSafeInteger(n) && n >= 0 ? n : 0;
  }

  /* 엔화는 정수로 입력합니다. 통화 기호와 정상적인 천 단위 쉼표는 허용합니다. */
  function readYen(v) {
    if (typeof v === 'number') return Number.isSafeInteger(v) && v >= 0 && v <= MAX_YEN ? v : NaN;
    var text = String(v == null ? '' : v).normalize('NFKC').trim();
    if (!text) return 0;
    var match = /^(?:¥\s*)?(\d+|\d{1,3}(?:,\d{3})+)(?:\s*[円엔])?$/.exec(text);
    return match ? readYen(Number(match[1].replace(/,/g, ''))) : NaN;
  }

  function isISO(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && L.toISO(L.parseISO(s)) === s; }
  function isTime(s) { return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s); }
  function uid() { return 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

  function yen(n) { return '¥' + Number(n).toLocaleString('en-US'); }
  function mdw(iso) { var d = L.parseISO(iso); var day = tr(WEEK[d.getDay()], ['日','月','火','水','木','金','土'][d.getDay()], ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]); return (d.getMonth() + 1) + '.' + d.getDate() + '(' + day + ')'; }
  function ymd(iso) { var d = L.parseISO(iso); return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate(); }
  function hm(d) { return L.pad(d.getHours()) + ':' + L.pad(d.getMinutes()); }

  /* 분을 '3시간', '1시간 30분'처럼 */
  function span(min) {
    var h = Math.floor(min / 60);
    var m = min % 60;
    if (!h) return tr(m + '분', m + '分', m + ' min');
    return tr(h + '시간' + (m ? ' ' + m + '분' : ''), h + '時間' + (m ? m + '分' : ''), h + ' hr' + (m ? ' ' + m + ' min' : '')); 
  }

  function icon(name, size) {
    var s = size || 22;
    return '<svg class="ic" width="' + s + '" height="' + s + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  /* '{kiosk}' 같은 자리표시를 값으로 바꾸기 */
  /* 독립적인 UI 설정: 원본 환급 데이터(taxgo-v1)와 분리하여 보존합니다. */
  function readPreference(key, fallback) {
    try { return window.localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }
  function storePreference(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* 읽기 전용 브라우저 */ }
  }

  function tr(ko, ja, en) {
    return ui.language === 'ja' ? (ja || ko) : ui.language === 'en' ? (en || ko) : ko;
  }

  /* 렌더링할 때만 텍스트를 번역합니다. 계산 규칙과 저장한 영수증은 한국어 원본을 유지합니다. */
  function airportValue(a, field) {
    var loc = DETAILS.airports[a.id] && DETAILS.airports[a.id][field];
    return ui.language === 'ko' || !loc ? a[field] : loc[ui.language === 'ja' ? 0 : 1];
  }
  function airportSelectHTML(current) {
    return D.airports.map(function (x) { return '<option value="' + x.id + '"' + (x.id === current ? ' selected' : '') + '>' + esc(airportValue(x, 'name')) + '</option>'; }).join('');
  }
  function reminderLabel(r) {
    var loc = DETAILS.reminders[r.id];
    if (ui.language === 'ko' || !loc) return r;
    var i = ui.language === 'ja' ? 0 : 1;
    var suffix = r.id === 'day' ? tr('', ' キオスク: ' + airportValue(airportOf(state.trip.airport), 'kiosk'), ' Kiosk: ' + airportValue(airportOf(state.trip.airport), 'kiosk')) : '';
    var deadline = r.id === 'guard' ? tr('', ' 期限: ' + (contextDeadline() || ''), ' Deadline: ' + (contextDeadline() || '')) : '';
    return Object.assign({}, r, { title: loc.title[i], body: loc.body[i] + suffix + deadline });
  }
  function contextDeadline() { return L.summarize(state.receipts, D.rules, state.trip.depDate).earliestDue || ''; }
  function readReminders() {
    try { return R.clean(JSON.parse(window.localStorage.getItem('taxgo-reminder-prefs-v2') || '{}')); }
    catch (e) { return R.clean({}); }
  }
  function saveReminders() {
    try { window.localStorage.setItem('taxgo-reminder-prefs-v2', JSON.stringify(ui.reminderPrefs)); return true; }
    catch (e) { return false; }
  }
  function readMemos() {
    var out = Object.create(null);
    try {
      var raw = JSON.parse(window.localStorage.getItem('taxgo-calendar-memos-v1') || '{}');
      if (raw && typeof raw === 'object') Object.keys(raw).forEach(function (date) {
        if (isISO(date) && typeof raw[date] === 'string' && raw[date].trim()) out[date] = raw[date].trim().slice(0, 300);
      });
    } catch (e) { /* browser storage may be unavailable */ }
    return out;
  }
  function saveMemos() {
    try { window.localStorage.setItem('taxgo-calendar-memos-v1', JSON.stringify(ui.memos)); return true; }
    catch (e) { return false; }
  }
  function readQR() {
    try {
      var obj = JSON.parse(window.localStorage.getItem('taxgo-wallet-qr-v2') || 'null');
      return obj && typeof obj.data === 'string' && obj.data.length <= 4096 &&
        typeof obj.image === 'string' && obj.image.length < 650000 &&
        /^data:image\/(?:png|webp|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(obj.image) ? obj : null;
    } catch (e) { return null; }
  }
  function saveQR() {
    try {
      if (ui.qr) window.localStorage.setItem('taxgo-wallet-qr-v2', JSON.stringify(ui.qr));
      else window.localStorage.removeItem('taxgo-wallet-qr-v2');
      return true;
    } catch (e) { return false; }
  }

  function ensureQRReader() {
    if (typeof window.jsQR === 'function') return Promise.resolve(true);
    if (window.taxgoQRScriptPromise) return window.taxgoQRScriptPromise;
    window.taxgoQRScriptPromise = new Promise(function (resolve) {
      var script = document.createElement('script');
      var finished = false;
      /* The decoder runs locally in the browser; selected images are never uploaded. */
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      var timeout = window.setTimeout(function () { complete(false); }, 7500);
      function complete(ok) { if (finished) return; finished = true; window.clearTimeout(timeout); resolve(ok && typeof window.jsQR === 'function'); }
      script.onload = function () { complete(true); };
      script.onerror = function () { complete(false); };
      document.head.appendChild(script);
    }).then(function (loaded) {
      if (!loaded) window.taxgoQRScriptPromise = null;
      return loaded;
    });
    return window.taxgoQRScriptPromise;
  }
  function QRImageBitmap(file) {
    if (typeof createImageBitmap === 'function') return createImageBitmap(file);
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Invalid image')); };
      img.src = url;
    });
  }
  async function qrFileSelected(file) {
    if (!file || ui.qrBusy) return;
    if (!/^image\/(?:png|jpeg|webp|bmp|gif)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
      toast(tr('PNG, JPG, WebP 등 8MB 이하 이미지를 선택해 주세요.', '8MB以下の画像を選んでください。', 'Choose a PNG, JPG or WebP image under 8 MB.')); return;
    }
    ui.qrBusy = true;
    toast(tr('QR 이미지에서 코드를 읽는 중입니다…', 'QRコードを読み取っています…', 'Reading the QR image…'));
    var bitmap;
    try {
      bitmap = await QRImageBitmap(file);
      var side = 1200, scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      var decoded = '';
      if (typeof window.BarcodeDetector === 'function') {
        try {
          var detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          var found = await detector.detect(canvas);
          if (found && found.length) decoded = found[0].rawValue || '';
        } catch (e) { /* fall back to local JS decoder */ }
      }
      if (!decoded && (typeof window.jsQR === 'function' || await ensureQRReader())) {
        var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var code = window.jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
        if (code) decoded = code.data || '';
      }
      if (!decoded) {
        toast(tr('QR을 인식하지 못했습니다. 선명한 이미지로 다시 시도하거나 인터넷 연결 상태를 확인하세요.', 'QRを読み取れませんでした。鮮明な画像かネット接続をご確認ください。', 'Could not decode the QR. Try a clearer image or check your connection.'));
        return;
      }
      if (decoded.length > 4096) { toast(tr('QR 데이터가 너무 깁니다.', 'QRデータが長すぎます。', 'QR payload is too long.')); return; }
      var small = document.createElement('canvas');
      var fit = Math.min(1, 420 / Math.max(canvas.width, canvas.height));
      small.width = Math.max(1, Math.round(canvas.width * fit));
      small.height = Math.max(1, Math.round(canvas.height * fit));
      small.getContext('2d').drawImage(canvas, 0, 0, small.width, small.height);
      var imgData = small.toDataURL('image/webp', 0.86);
      if (imgData.length > 640000) imgData = small.toDataURL('image/jpeg', 0.75);
      if (imgData.length > 640000) throw new Error('Image too large to store');
      ui.qr = { data: decoded, image: imgData, savedAt: new Date().toISOString() };
      if (!saveQR()) toast(tr('QR은 인식했지만 저장 공간 부족으로 다시 열 때 사라질 수 있습니다.', 'QRを読み取りましたが、保存容量が不足しています。', 'QR decoded, but browser storage was unavailable.'));
      else toast(tr('QR 인식과 저장을 완료했습니다.', 'QRを読み取って保存しました。', 'QR decoded and saved.'));
      render();
      if ($('#dlg-wallet-qr').open) $('#wallet-qr-close').focus();
    } catch (e) { toast(tr('이미지를 처리할 수 없습니다. 다른 이미지를 선택해 주세요.', '画像を処理できません。別の画像を選んでください。', 'Could not process this image. Try another.')); }
    finally { ui.qrBusy = false; if (bitmap && typeof bitmap.close === 'function') bitmap.close(); }
  }

  function localeText(text) {
    if (ui.language === 'ko') return String(text);
    var entry = window.TAXGO_I18N && window.TAXGO_I18N[String(text).trim()];
    return entry ? entry[ui.language === 'ja' ? 0 : 1] : String(text);
  }
  function localizeDom(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest('script, style, svg, [data-user-text]')) continue;
      if (node.__taxgoOriginal === undefined) node.__taxgoOriginal = node.nodeValue;
      var original = node.__taxgoOriginal;
      var trimmed = original.trim();
      if (!trimmed) continue;
      var translated = localeText(trimmed);
      if (translated === trimmed && ui.language !== 'ko') {
        var mm = /^(\d{4})년 (\d{1,2})월$/.exec(trimmed);
        if (mm) translated = ui.language === 'ja' ? mm[1] + '年' + mm[2] + '月' :
          new Date(+mm[1], +mm[2] - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      }
      node.nodeValue = original.replace(trimmed, translated);
    }
    var controls = root.querySelectorAll('[placeholder]');
    for (var i = 0; i < controls.length; i++) {
      if (!controls[i].hasAttribute('data-original-placeholder')) controls[i].setAttribute('data-original-placeholder', controls[i].getAttribute('placeholder'));
      controls[i].setAttribute('placeholder', localeText(controls[i].getAttribute('data-original-placeholder')));
    }
  }
  function mascot(cls) {
    return '<svg class="mascot-art ' + (cls || '') + '" viewBox="0 0 156 164" aria-hidden="true"><use href="#i-mascot"></use></svg>';
  }
  function terminal(cls) {
    return '<svg class="terminal-art ' + (cls || '') + '" viewBox="0 0 380 120" aria-hidden="true"><use href="#i-terminal"></use></svg>';
  }

  function fill(tpl, map) {
    var out = tpl;
    Object.keys(map).forEach(function (k) { out = out.split('{' + k + '}').join(String(map[k])); });
    return out;
  }

  /* esc()와 같지만, 줄이 바뀌어도 쪼개지면 안 되는 말(시간대, 영문 이름)은 한 덩어리로 묶어 줍니다.
     '06:00–21:00', '06:45–다음 날 01:30', 'Visit Japan Web', 'HAKATA FOOD HALL', 'Wi-Fi', 'J–M', '8%입니다' 같은 것 */
  function nb(s) {
    var text = localeText(String(s));
    if (ui.language === 'en') return esc(text);
    var re = /\d{1,2}:\d{2}\s?[–-]\s?(?:다음 날 )?\d{1,2}:\d{2}|\d+(?:\.\d+)?%[가-힣]*|[A-Za-z0-9][A-Za-z0-9-]*(?: [A-Za-z0-9][A-Za-z0-9-]*)+|[A-Za-z0-9]+(?:[–-][A-Za-z0-9]+)+/g;
    var out = '';
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      out += esc(text.slice(last, m.index)) + '<span class="nb">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }

  function airportOf(id) {
    for (var i = 0; i < D.airports.length; i++) if (D.airports[i].id === id) return D.airports[i];
    return D.airports[0];
  }

  function methodLabel(id) {
    for (var i = 0; i < D.methods.length; i++) if (D.methods[i].id === id) return D.methods[i].label;
    return '';
  }

  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  /* ---------- 저장되는 데이터 ----------
     state = { sample, trip: { airport, depDate, depTime, lead }, receipts: [...], checks: { 단계번호: true } }
     trip.lead = 공항 도착 목표를 출발 몇 시간 전으로 할지 (0이면 자동)
     영수증 한 장 = { id, store, date, mode, total(세금 포함), rate(10|8), method, fee, consumed, items }
       mode 'total': 합계만 입력. 소비 여부는 consumed
       mode 'items': 물품별 입력. items = [{ id, name, price(세금 포함), used(소비 여부) }], total은 물품 금액의 합 */
  function sampleState() {
    var today = L.toISO(new Date());
    return cleanState({
      sample: true,
      trip: { airport: 'fuk', depDate: L.addDays(today, 2), depTime: '15:30', lead: 0 },
      receipts: [
        { id: 's1', store: '드럭스토어 텐진점', date: L.addDays(today, -1), mode: 'total', total: 16500, rate: 10, method: 'card', fee: 0, consumed: false },
        {
          id: 's2', store: '디스카운트숍 나카스점', date: L.addDays(today, -1), mode: 'items', rate: 8, method: 'card', fee: 0,
          items: [
            { id: 'a', name: '말차 초콜릿 4개 묶음', price: 2160, used: false },
            { id: 'b', name: '과자 버라이어티 팩', price: 1080, used: true },
            { id: 'c', name: '컵라면 6개 세트', price: 1944, used: false },
            { id: 'd', name: '곤약 젤리 3봉', price: 1296, used: false },
            { id: 'e', name: '드립 커피 세트', price: 3240, used: false },
            { id: 'f', name: '녹차 티백', price: 4320, used: false }
          ]
        },
        { id: 's3', store: '가전양판점 하카타역점', date: today, mode: 'total', total: 33000, rate: 10, method: 'cash', fee: 0, consumed: false }
      ],
      checks: {}
    });
  }

  function emptyState() {
    return { sample: false, trip: { airport: 'fuk', depDate: '', depTime: '12:00', lead: 0 }, receipts: [], checks: {} };
  }

  /* 저장소에서 읽은 값은 믿지 않고 형식을 다시 맞춥니다 */
  function cleanItems(list) {
    var out = [];
    var seen = new Set();
    (Array.isArray(list) ? list : []).slice(0, MAX_ITEMS).forEach(function (it) {
      if (!it || typeof it !== 'object') return;
      var price = readYen(it.price) || 0;
      if (!price) return;
      var id = String(it.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
      if (!id || seen.has(id)) id = 'i' + out.length + uid();
      seen.add(id);
      out.push({ id: id, name: String(it.name || '').trim().slice(0, 30) || '물품 ' + (out.length + 1), price: price, used: !!it.used });
    });
    return out;
  }

  function cleanReceipt(r) {
    var items = r.mode === 'items' ? cleanItems(r.items) : [];
    var out = {
      id: String(r.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || uid(),
      store: String(r.store || '').slice(0, 40),
      date: isISO(r.date) ? r.date : L.toISO(new Date()),
      mode: items.length ? 'items' : 'total',
      total: readYen(r.total) || 0,
      rate: +r.rate === 8 ? 8 : 10,
      method: methodLabel(r.method) ? r.method : 'unknown',
      fee: readYen(r.fee) || 0,
      consumed: items.length ? false : !!r.consumed,
      items: items
    };
    if (items.length) out.total = L.totalOf(out);
    return out;
  }

  function cleanState(s) {
    var trip = s.trip && typeof s.trip === 'object' ? s.trip : {};
    var lead = Math.floor(+trip.lead || 0);
    var out = {
      sample: !!s.sample,
      trip: {
        airport: airportOf(trip.airport).id,
        depDate: isISO(trip.depDate) ? trip.depDate : '',
        depTime: isTime(trip.depTime) ? trip.depTime : '12:00',
        lead: lead >= A.baseHours && lead <= A.maxHours ? lead : 0,
        arrivalReviewed: !!trip.arrivalReviewed
      },
      receipts: [],
      checks: {}
    };
    var seen = new Set();
    (Array.isArray(s.receipts) ? s.receipts : []).forEach(function (r) {
      if (!r || typeof r !== 'object' || Array.isArray(r)) return;
      var receipt = cleanReceipt(r);
      if (seen.has(receipt.id)) receipt.id = 'r' + out.receipts.length + uid();
      seen.add(receipt.id);
      out.receipts.push(receipt);
    });
    if (s.checks && typeof s.checks === 'object') {
      D.checklist.forEach(function (_, i) { if (s.checks[i]) out.checks[i] = true; });
    }
    return out;
  }

  function read(key) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return s && typeof s === 'object' && !Array.isArray(s) ? cleanState(s) : null;
    } catch (e) {
      return null;
    }
  }

  /* 저장된 데이터 읽기. 앱 이름을 바꾸기 전에 직접 입력해 둔 여행이 있으면 그대로 이어서 씁니다
     (예전 예시 데이터는 버리고 새 예시로 시작) */
  function load() {
    var s = read(STORE_KEY);
    if (s) return s;
    var old = read(OLD_STORE_KEY);
    if (!old || old.sample) return null;
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(old)); } catch (e) { /* 저장이 막힌 환경 */ }
    return old;
  }

  function save() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      /* 저장이 막힌 환경에서는 이번 방문 동안만 유지됩니다 */
      return false;
    }
  }

  var state = load() || sampleState();

  /* 화면 상태 (저장하지 않음) */
  var ui = {
    tab: 'home',
    quickIndex: 0,
    preview: 'auto',   // 시점 미리보기: auto / shop / eve / day / after
    calMonth: '',      // 'YYYY-MM' (비어 있으면 이번 달)
    calDay: '',
    guideStep: 0,
    walletGuide: -1,     // 월렛 안의 원본 절차 가이드 보기
    pick: null,
    quiz: null,
    receiptFilter: 'all',
    language: readPreference('taxgo-ui-language', 'ko'),
    reminderPrefs: readReminders(),
    memos: readMemos(),
    memoEdit: '',
    qr: readQR(),
    qrBusy: false,
    theme: readPreference('taxgo-ui-theme', 'light'),
    passport: { name: '', number: '', country: '', expires: '' },
    passportOpen: false,
    passportRevealed: false,
    depOpen: { prep: true },
    airportRevealed: false,
    arrival: null,
    arrivalAfterTrip: false,
    remEdit: '',  // 출국 체크리스트 펼침 상태
    undo: null,
    form: { editId: '', items: [] },   // 영수증 입력 시트에서 작업 중인 내용
    embedded: isEmbedded()
  };
  var toastTimer = 0;
  var celebrationTimer = 0;
  var lastPhase = '';
  var lastArrivalNotice = false;

  /* 지금 시각. 시점 미리보기를 켜면 출국일 기준으로 꾸민 시각을 돌려줍니다 */
  function now() {
    var t = state.trip;
    if (ui.preview === 'auto' || !t.depDate) return new Date();
    var dep = L.at(t.depDate, t.depTime);
    if (ui.preview === 'shop') return L.at(L.addDays(t.depDate, -2), '14:00');
    if (ui.preview === 'eve') return L.at(L.addDays(t.depDate, -1), '20:00');
    if (ui.preview === 'day') {
      var d = tripArrival(t, airportOf(t.airport)).at;
      return L.toISO(d) === t.depDate ? d : new Date(dep.getTime() - 60000);
    }
    return L.at(L.addDays(t.depDate, 1), '10:00');
  }

  /* 화면을 그릴 때 필요한 계산 결과를 한 번에 모읍니다 */
  function tripArrival(trip, airport) {
    return L.arrivalPlan(trip, [], D.rules, airport);
  }

  function context() {
    var n = now();
    var trip = state.trip;
    var airport = airportOf(trip.airport);
    var views = state.receipts.map(function (r) { return { r: r, v: L.receiptView(r, D.rules, trip.depDate) }; });
    views.sort(function (a, b) { return a.r.date < b.r.date ? -1 : a.r.date > b.r.date ? 1 : 0; });
    var plan = tripArrival(trip, airport);
    var reminders = L.buildReminders(trip, state.receipts, D.rules, D.reminders, airport, plan);
    return {
      now: n,
      todayISO: L.toISO(n),
      trip: trip,
      airport: airport,
      phase: L.phaseOf(n, trip),
      dlabel: trip.depDate ? L.dLabel(n, trip.depDate) : '',
      views: views,
      sum: L.summarize(state.receipts, D.rules, trip.depDate),
      plan: plan,
      remBase: reminders,
      rem: R.apply(reminders, ui.reminderPrefs, n).map(reminderLabel)
    };
  }

  /* ---------- 화면: 홈 ---------- */
  function repeatText(mode) {
    return ({ auto: tr('자동 설정', '自動設定', 'Automatic'), once: tr('한 번', '1回', 'Once'),
      weekly: tr('매주 반복', '毎週繰り返し', 'Every week'), monthly: tr('매월 반복', '毎月繰り返し', 'Every month'),
      daily: tr('매일 반복', '毎日繰り返し', 'Every day') })[mode] || tr('자동 설정', '自動設定', 'Automatic');
  }
  function arrivalTitle() {
    return tr('공항 도착 시간 계산', '空港到着時刻を計算', 'Calculate arrival time');
  }

  function mascotHint(text) {
    return '<div class="inline-mascot-hint">' + mascot('mascot-mini') + '<span class="speech-bubble">' + esc(text) + '</span></div>';
  }

  function needsArrivalNotice(phase, trip) {
    if (!trip.depDate || (trip.lead && trip.arrivalReviewed)) return false;
    if (ui.preview !== 'auto') return phase === 'eve';
    // 출국일은 일본 현지 날짜이므로 기기의 시간대와 관계없이 일본의 전날에 안내합니다.
    var japanToday = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    return L.addDays(japanToday, 1) === trip.depDate;
  }

  function arrivalNotice(c) {
    if (!needsArrivalNotice(c.phase, c.trip)) return '';
    return '<aside class="arrival-notice">' + icon('warn', 23) + '<div><strong>' +
      tr('내일 출국 · 영수증을 확인하세요', '明日出国・レシートを再確認', 'Departing tomorrow? Review your receipts') + '</strong><p>' +
      tr('가져갈 면세품을 다시 확인하고 공항 도착 목표 시간을 설정해 두세요.', '持ち出す免税品を再確認して、空港への到着時刻を決めましょう。', 'Double-check what you’re taking and set your airport arrival target.') + '</p>' +
      '<button type="button" class="btn-text" data-act="arrival" data-key="arrival-notice">' + arrivalTitle() + '</button></div></aside>';
  }

  function arrivalRows(c) {
    return c.views.filter(function (x) {
      return x.v.eligible && c.trip.depDate <= x.v.due;
    }).map(function (x) {
      return { store: x.r.store, lines: x.v.count ? x.r.items : [
        { name: tr('영수증 전체', 'レシート全体', 'Entire receipt'), price: x.v.total, used: x.r.consumed }
      ] };
    });
  }

  function reviewedGoods(rows, include) {
    var goods = { goodsReceipts: 0, goodsItems: 0, goodsTotal: 0 };
    rows.forEach(function (row, i) {
      var count = 0;
      row.lines.forEach(function (item, j) {
        if (!include(item, i + '-' + j)) return;
        count++;
        goods.goodsTotal += item.price;
      });
      goods.goodsItems += count;
      if (count) goods.goodsReceipts++;
    });
    return goods;
  }

  function drawArrival() {
    var draft = ui.arrival;
    var applied = state.trip.lead;
    var cancel = applied ? '<button type="button" class="btn btn-line btn-block" data-act="arrivalCancel">' +
      tr('적용한 권장 시간 취소', '適用した推奨時刻を取り消す', 'Remove applied arrival time') + '</button>' : '';
    $('#dlg-arrival-title').textContent = arrivalTitle();
    $('#arrival-close').setAttribute('aria-label', tr('닫기', '閉じる', 'Close'));
    if (!draft.plan) {
      $('#arrival-content').innerHTML = '<p class="lede">' +
        tr('공항에서 확인할 면세품만 선택하세요. 이 선택은 도착 시간 계산에만 사용됩니다.', '空港で確認する免税品だけを選んでください。選択は到着時刻の計算にのみ使われます。', 'Select the goods you will present at the airport. This selection only affects the arrival calculation.') +
        '</p><div class="arrival-review-list">' + draft.rows.map(function (row, i) {
          return '<fieldset><legend data-user-text>' + esc(row.store) + '</legend>' + row.lines.map(function (item, j) {
            return '<label class="arrival-review-line"><input type="checkbox" value="' + i + '-' + j + '"' +
              (item.used ? '' : ' checked') + '><span data-user-text>' + esc(item.name) + '</span><b>' + yen(item.price) + '</b></label>';
          }).join('') + '</fieldset>';
        }).join('') + '</div><button type="button" class="btn btn-sign btn-block" data-act="arrivalCalculate">' +
        tr('선택한 물품으로 계산', '選んだ品物で計算', 'Calculate with selected items') + '</button>' + cancel;
      return;
    }
    var p = draft.plan;
    var a = airportOf(state.trip.airport);
    $('#arrival-content').innerHTML = '<div class="arrival-result"><span>' +
      tr('권장 도착 시간', '推奨到着時刻', 'Recommended arrival') + '</span><strong>' + hm(p.at) + '</strong><span>' +
      esc(mdw(L.toISO(p.at))) + ' · ' + tr('출발 ' + span(p.leadMin) + ' 전', '出発' + span(p.leadMin) + '前', span(p.leadMin) + ' before departure') +
      '</span></div>' + planNotes(p, a) +
      '<button type="button" class="btn btn-sign btn-block" data-act="arrivalApply" data-key="arrival-apply">' +
      (applied ? tr('권장 시간으로 갱신', '推奨時刻に更新', 'Update to recommended time') :
        tr('이 권장 시간 사용', 'この推奨時刻を使用', 'Use recommended time')) + '</button>' + cancel;
  }

  function finishArrival(goods) {
    ui.arrival.plan = L.arrivalPlan(Object.assign({}, state.trip, {lead: 0}), [], D.rules, airportOf(state.trip.airport), goods);
    drawArrival();
  }

  function openArrival() {
    if (!state.trip.depDate) { openTrip(true); return; }
    var rows = arrivalRows(context());
    ui.arrival = { rows: rows, plan: null };
    if (L.hasManyGoods(reviewedGoods(rows, function () { return true; }), D.rules)) drawArrival();
    else finishArrival(reviewedGoods(rows, function (item) { return !item.used; }));
    openDlg($('#dlg-arrival'));
  }

  function viewHome(c) {
    var P = D.phases[c.phase];
    var s = c.sum;
    var h = [];

    /* 시점별 핵심 안내를 홈 상단 배너 하나에 통합합니다. */
    h.push('<section class="welcome" aria-label="' + tr('현재 환급 안내', '現在の還付案内', 'Your refund guidance') + '">' +
      '<div class="welcome-copy"><span class="pixel-eyebrow">' + nb(P.chip) + '</span>' +
      '<h1>' + nb(P.title) + '</h1>' +
      '<p>' + nb(P.body) + '</p>' +
      (P.act === 'add' ? '' : '<button type="button" class="welcome-cta" data-act="' + P.act + '" data-arg="' + (P.arg || '') + '" data-key="home-hero-cta">' + nb(P.act === 'arrival' ? arrivalTitle() : P.cta) + icon('right', 17) + '</button>') + '</div>' +
      mascot('mascot-welcome') + '<span class="welcome-spark" aria-hidden="true">✦</span>' + terminal('terminal-welcome') + '</section>');

    h.push('<section class="trip-overview" aria-label="여행 요약">' +
      '<div class="trip-overview-main"><div class="trip-destination">' + icon('plane', 26) + '<div><strong>' + (c.trip.depDate ? esc(airportValue(c.airport,'short')) + ' ' + tr('여행', '旅行', 'TRIP') : tr('여행 정보 등록', '旅行情報を登録', 'ADD YOUR TRIP')) + '</strong>' +
      '<span>' + (c.trip.depDate ? esc(ymd(c.trip.depDate) + ' ' + c.trip.depTime) : tr('출국일과 시간을 입력해 주세요', '出発日と時刻を入力してください', 'Enter your departure date and time')) + '</span></div></div>' +
      '<div class="trip-actions">' + (c.dlabel ? '<span class="trip-dday">' + esc(c.dlabel) + '</span>' : '') + '<button type="button" class="trip-more" data-act="trip" data-key="home-trip" aria-label="' + tr('여행 정보 수정', '旅程を編集', 'Edit trip') + '" title="' + tr('여행 정보 수정', '旅程を編集', 'Edit trip') + '">' + icon('pen', 18) + '</button></div></div>' +
      '<div class="trip-refund">' + icon('coin', 26) + '<div><span>' + tr('예상 환급액', '還付見込み額', 'ESTIMATED REFUND') + '</span><strong>' + yen(s.refund) + '</strong></div>' +
      '<button type="button" class="trip-more" data-act="tab" data-arg="receipts" data-key="refund-receipts" aria-label="' + tr('영수증 메뉴로 이동', 'レシートを見る', 'View receipts') + '" title="' + tr('영수증 메뉴로 이동', 'レシートを見る', 'View receipts') + '">' + icon('right', 20) + '</button></div></section>');

    var quick = [
      { key: 'receipt', icon: 'receipt', action: 'add', label: tr('영수증 등록', 'レシート登録', 'Add receipt') },
      { key: 'arrival', icon: 'plane', action: 'arrival', label: arrivalTitle() },
      { key: 'reminders', icon: 'cal', action: 'goReminders', label: tr('알림 일정', '通知予定', 'Reminder schedule') },
      { key: 'wallet', icon: 'wallet', action: 'tab', arg: 'wallet', label: tr('면세QR', '免税QR', 'Tax-free QR') }
    ];
    h.push('<section class="quick-section" aria-label="' + tr('빠른 메뉴', 'クイックメニュー', 'Quick menu') + '">' +
      '<div class="quick-track" id="quick-track">' + quick.map(function (item, i) {
        return '<button type="button" class="quick-tile' + (i === ui.quickIndex ? ' is-current' : '') + '" data-act="' + item.action + '" data-arg="' + (item.arg || '') + '" data-key="quick-' + item.key + '">' +
          icon(item.icon, 26) + '<span>' + item.label + '</span></button>';
      }).join('') + '</div>' +
      '<div class="quick-dots" role="group" aria-label="' + tr('빠른 메뉴 카드 선택', 'クイックメニューカードを選択', 'Choose a quick menu card') + '">' +
      quick.map(function (item, i) {
        return '<button type="button" data-act="quickPage" data-arg="' + i + '" aria-controls="quick-track" aria-current="' + (i === ui.quickIndex) +
          '" aria-label="' + esc(tr(item.label + ' 카드 보기', item.label + 'カードを表示', 'Show ' + item.label)) + '"></button>';
      }).join('') + '</div></section>');

    h.push(mascotHint(tr('영수증을 모으고 출국 전에 환급을 준비해요!', 'レシートを集めて出国前に確認しましょう！', 'Save receipts and prepare before departure!')));

    if (state.sample) {
      h.push('<div class="sample"><span>' + tr('예시 여행으로 둘러보는 중입니다.', 'サンプルの旅程を表示しています。', 'Viewing a sample trip.') + '</span>' +
        '<button type="button" class="btn-text" data-act="startMine" data-key="startMine">' + tr('내 여행으로 시작', '自分の旅程で始める', 'Start my trip') + '</button></div>');
    }

    /* 시점 미리보기 (테스트용) */
    if (c.trip.depDate) {
      h.push('<section class="sec" aria-labelledby="h-preview"><div class="sec-head"><h2 class="sec-title disp" id="h-preview">시점 미리보기</h2></div>' +
        '<p class="lede">테스트용 화면입니다. 여행 시점을 바꿔서 확인할 수 있습니다.</p>' +
        '<div class="seg" role="group" aria-labelledby="h-preview">' + PREVIEWS.map(function (p) {
          return '<button type="button" data-act="preview" data-arg="' + p[0] + '" data-key="pv-' + p[0] + '" aria-pressed="' + (ui.preview === p[0]) + '">' + p[1] + '</button>';
        }).join('') + '</div></section>');
    }
    return h.join('');
  }

  /* ---------- 화면: 영수증 ---------- */
  function line(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

  /* 물품별로 입력한 영수증의 물품 한 줄. 체크하면 '먹었거나 써서 없음' */
  function itemRow(r, it) {
    var key = 'used-' + r.id + '-' + it.id;
    return '<li><label class="item" for="' + key + '">' +
      '<input type="checkbox" id="' + key + '" data-change="itemUsed" data-arg="' + r.id + ':' + it.id + '" data-key="' + key + '"' + (it.used ? ' checked' : '') + '>' +
      '<span class="item-name"><span class="sr">먹었거나 써서 없음: </span><span class="item-text">' + esc(it.name) + '</span>' +
      (it.used ? '<span class="chip chip-risk">소비</span>' : '') + '</span>' +
      '<span class="item-price">' + yen(it.price) + '</span></label></li>';
  }

  function slip(r, v, c) {
    var ok = v.status === 'ok';
    var itemized = r.mode === 'items';
    var left = L.diffDays(c.todayISO, v.due);
    var msg = v.status === 'consumed' ? '먹었거나 없는 물건이 있어서 이 영수증은 통째로 환급이 안 됩니다. 공항에서는 키오스크 대신 세관 직원에게 먼저 말하세요.'
      : v.status === 'late' ? '출국일이 이 영수증의 출국 기한보다 늦습니다. 기한 안에 출국해야 환급받을 수 있습니다.'
      : v.status === 'under' ? '세전 ' + yen(D.rules.minPreTax) + ' 미만이라 면세 대상이 아닙니다.'
      : '';
    return '<article class="slip-wrap" aria-label="' + esc(r.store) + ' 영수증"><div class="slip">' +
      '<div class="slip-head"><div><h2 class="slip-store">' + esc(r.store) + '</h2><p class="slip-date">' + esc(mdw(r.date)) + ' 구매' + (itemized ? ', 물품 ' + v.count + '개' : '') + '</p></div>' +
      '<span class="stamp disp ' + (ok ? 'is-ok' : 'is-no') + '">' + (ok ? '환급 가능' : '환급 불가') + '</span></div>' +
      (itemized
        ? '<div class="items"><p class="items-head" id="items-' + r.id + '">먹었거나 쓴 물건에 체크하세요</p>' +
          '<ul aria-labelledby="items-' + r.id + '">' + r.items.map(function (it) { return itemRow(r, it); }).join('') + '</ul></div>'
        : '') +
      '<dl class="slip-lines">' +
      line('결제 금액', yen(v.total)) +
      line('세전 금액', yen(v.pre)) +
      (v.fee ? line('환급 수수료', '−' + yen(v.fee)) : '') +
      line('환급 방법', esc(methodLabel(r.method))) +
      line('출국 기한', ymd(v.due) + (left >= 0 ? ' (D-' + left + ')' : ' (지남)')) +
      '<div class="is-total' + (ok ? '' : ' is-void') + '"><dt>환급 예상</dt><dd>' + yen(v.net) + '</dd></div>' +
      '</dl>' +
      (msg ? '<p class="slip-msg">' + msg + '</p>' : '') +
      '<div class="slip-actions">' +
      (itemized
        ? '<span class="slip-count">' + (v.used ? '물품 ' + v.count + '개 가운데 ' + v.used + '개 소비' : '소비한 물건 없음') + '</span>'
        : '<button type="button" class="btn btn-line btn-sm" data-act="consume" data-arg="' + r.id + '" data-key="consume-' + r.id + '" aria-pressed="' + !!r.consumed + '">' +
          (r.consumed ? icon('check', 18) : '') + '물건 소비</button>') +
      '<span class="slip-tools">' +
      '<button type="button" class="iconbtn iconbtn-action" data-act="edit" data-arg="' + r.id + '" data-key="edit-' + r.id + '" aria-label="영수증 수정" title="영수증 수정">' + icon('pen', 20) + '</button>' +
      '<button type="button" class="iconbtn iconbtn-action is-danger" data-act="del" data-arg="' + r.id + '" data-key="del-' + r.id + '" aria-label="영수증 삭제" title="영수증 삭제">' + icon('trash', 20) + '</button>' +
      '</span></div></div></article>';
  }

  function viewReceipts(c) {
    var all = c.views;
    var filtered = all.filter(function (x) {
      return ui.receiptFilter === 'all' ||
        (ui.receiptFilter === 'ok' && x.v.status === 'ok') ||
        (ui.receiptFilter === 'review' && x.v.status !== 'ok') ||
        (ui.receiptFilter === 'excluded' && (x.v.status === 'consumed' || x.v.status === 'under' || x.v.status === 'late'));
    });
    var total = all.reduce(function (sum, x) { return sum + x.v.total; }, 0);
    var counts = {
      all: all.length,
      ok: all.filter(function (x) { return x.v.status === 'ok'; }).length,
      review: all.filter(function (x) { return x.v.status !== 'ok'; }).length,
      excluded: all.filter(function (x) { return x.v.status === 'consumed' || x.v.status === 'under' || x.v.status === 'late'; }).length
    };
    var filterLabels = [
      ['all', tr('전체', 'すべて', 'All')],
      ['ok', tr('환급 가능', '還付可能', 'Eligible')],
      ['review', tr('확인 필요', '要確認', 'Review')],
      ['excluded', tr('환급 불가', '還付不可', 'Excluded')]
    ];
    var percent = total ? Math.min(100, c.sum.refund / total * 100) : 0;
    var h = [];
    h.push('<div class="page-head"><h1 class="page-title disp">' + icon('receipt', 26) + tr('영수증', 'レシート', 'Receipts') + '</h1></div>');
    h.push('<p class="lede receipt-intro">세관은 영수증 한 장을 한 묶음으로 확인합니다. 한 장에서 하나라도 없으면 그 영수증 전체를 환급받을 수 없습니다.</p>');
    h.push('<section class="receipt-gauge" style="--refund-share:' + percent + '%" aria-label="' + tr('영수증 금액 요약', 'レシート金額の概要', 'Receipt amounts') + '">' +
      '<h2>' + tr('예상 환급액', '還付見込み額', 'Estimated refund') + '</h2><strong>' + yen(c.sum.refund) + '</strong>' +
      '<h2 class="receipt-gauge-total">' + tr('등록한 영수증 합계', 'レシートの合計', 'Receipt total') + '</h2><strong class="receipt-gauge-total">' + yen(total) + '</strong></section>');
    h.push(arrivalNotice(c));
    h.push('<div class="receipt-filters" role="group" aria-label="' + tr('영수증 필터', 'レシートの絞り込み', 'Filter receipts') + '">' + filterLabels.map(function (f) {
      return '<button type="button" data-act="receiptFilter" data-arg="' + f[0] + '" data-key="filter-' + f[0] + '" aria-pressed="' + (ui.receiptFilter === f[0]) + '">' + f[1] + ' <span>(' + counts[f[0]] + ')</span></button>';
    }).join('') + '</div>');
    if (!all.length) {
      h.push('<div class="panel empty-panel">' + mascot('mascot-empty') + '<p>아직 영수증이 없습니다. 면세로 살 때마다 추가해 두면 환급액과 출국 기한을 계산해 드립니다.</p></div>');
    } else if (!filtered.length) {
      h.push('<div class="panel empty-panel">' + mascot('mascot-empty') + '<p>' + tr('이 조건에 해당하는 영수증이 없습니다.', '該当するレシートはありません。', 'No receipts match this filter.') + '</p></div>');
    } else {
      var open = new Set(Array.from($('#view').querySelectorAll('.receipt-item[open]')).map(function (el) { return el.dataset.receipt; }));
      h.push('<div class="receipt-list">' + filtered.map(function (x) {
        var r = x.r; var v = x.v;
        return '<details class="receipt-item" data-receipt="' + r.id + '"' + (open.has(r.id) ? ' open' : '') +
          '><summary class="receipt-line"><span class="receipt-icon">' + icon('bag', 24) + '</span>' +
          '<span class="receipt-line-main"><strong data-user-text>' + esc(r.store) + '</strong><small>' + esc(ymd(r.date)) + '</small></span>' +
          '<span class="receipt-line-amount"><strong>' + yen(v.total) + '</strong><em class="receipt-status ' + (v.status === 'ok' ? 'is-eligible' : 'is-review') + '">' + (v.status === 'ok' ? tr('환급 가능', '還付可能', 'Eligible') : tr('확인 필요', '要確認', 'Review')) + '</em></span>' +
          '<span class="receipt-expand">' + icon('chevron-down', 19) + '</span>' +
          '<span class="receipt-line-refund' + (v.status === 'ok' ? '' : ' is-ineligible') + '"><span>' + tr('예상 환급액', '還付見込み額', 'Estimated refund') + '</span><strong>' + yen(v.status === 'ok' ? v.net : 0) + '</strong></span></summary><div class="receipt-detail">' + slip(r, v, c) + '</div></details>';
      }).join('') + '</div>');
    }
    h.push('<button type="button" class="btn btn-sign btn-block receipt-add" data-act="add" data-key="rc-add">' + icon('plus', 21) + tr('영수증 추가', 'レシートを追加', 'Add receipt') + '</button>');
    h.push(mascotHint(tr('영수증을 한 장씩 차곡차곡 모아 주세요!', 'レシートを忘れずに保管しましょう！', 'Keep your receipts together!')));
    return h.join('');
  }

  /* ---------- 화면: 캘린더 ---------- */
  function eventsByDay(c, month) {
    var map = {};
    function add(iso, kind, text) { (map[iso] = map[iso] || []).push({ kind: kind, text: text }); }
    c.views.forEach(function (x) {
      add(x.r.date, 'buy', tr('구매: ', '購入: ', 'Purchase: ') + x.r.store + ' ' + yen(x.v.total));
      if (x.v.status === 'ok' || x.v.status === 'late') add(x.v.due, 'due', tr('출국 기한: ', '出国期限: ', 'Departure deadline: ') + x.r.store);
    });
    if (c.trip.depDate) add(c.trip.depDate, 'dep', tr('출국: ', '出発: ', 'Departure: ') + c.trip.depTime + ' ' + airportValue(c.airport, 'name'));
    R.monthOccurrences(c.rem, month).forEach(function (r) {
      add(L.toISO(r.at), 'remind', tr('알림: ', '通知: ', 'Reminder: ') + r.title);
    });
    Object.keys(ui.memos).forEach(function (iso) {
      if (iso.slice(0, 7) === month) add(iso, 'memo', ui.memos[iso]);
    });
    return map;
  }

  function viewCalendar(c) {
    var month = ui.calMonth || c.todayISO.slice(0, 7);
    var y = +month.slice(0, 4);
    var m = +month.slice(5, 7);
    var lead = new Date(y, m - 1, 1, 12).getDay();
    var days = new Date(y, m, 0).getDate();
    var ev = eventsByDay(c, month);
    var selected = ui.calDay || (c.todayISO.slice(0, 7) === month ? c.todayISO : '');
    var cells = [];
    var i;
    var d;

    for (i = 0; i < lead; i++) cells.push('<span></span>');
    for (d = 1; d <= days; d++) {
      var iso = month + '-' + L.pad(d);
      var list = ev[iso] || [];
      var kinds = {};
      for (i = 0; i < list.length; i++) kinds[list[i].kind] = true;
      var marks = '';
      if (kinds.buy) marks += '<i class="mk mk-buy"></i>';
      if (kinds.remind) marks += '<i class="mk mk-remind"></i>';
      if (kinds.due) marks += '<i class="mk mk-due"></i>';
      if (kinds.memo) marks += '<i class="mk mk-memo"></i>';
      var label = tr(m + '월 ' + d + '일 ', m + '月' + d + '日 ', m + '/' + d + ' ') + tr(WEEK[(lead + d - 1) % 7], ['日','月','火','水','木','金','土'][(lead + d - 1) % 7], ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(lead + d - 1) % 7]) + (iso === c.todayISO ? tr(', 오늘', '・今日', ', today') : '') + (list.length ? tr(', 일정 ', '・予定 ', ', events ') + list.length : '');
      cells.push('<button type="button" class="day' + (kinds.dep ? ' is-dep' : '') + (iso === c.todayISO ? ' is-today' : '') + '" data-act="calDay" data-arg="' + iso + '" data-key="day-' + iso + '" aria-pressed="' + (iso === selected) + '" aria-label="' + label + '">' +
        '<span class="day-num">' + d + '</span><span class="marks">' + marks + '</span></button>');
    }

    var info;
    if (!selected) {
      info = '<p class="lede">' + tr('날짜를 누르면 그날 일정을 볼 수 있습니다.', '日付をタップするとその日の予定を確認できます。', 'Tap a date to see its events.') + '</p>' + '<button type="button" class="btn btn-line btn-sm" data-act="memoEdit" data-arg="' + month + '-01">' + icon('pen',18) + tr('일정 메모 추가', '予定メモを追加', 'Add schedule memo') + '</button>';
    } else {
      var sel = ev[selected] || [];
      info = '<div class="panel"><h2 class="dayinfo-title">' + esc(mdw(selected)) + (selected === c.todayISO ? tr(' 오늘', ' 今日', ' Today') : '') + '</h2>' +
        (sel.length
          ? '<ul class="dayinfo-list">' + sel.map(function (e) { return '<li><i class="mk mk-' + e.kind + '"></i><span' + (e.kind === 'memo' ? ' class="day-memo-text" data-user-text' : '') + '>' + esc(e.text) + '</span></li>'; }).join('') + '</ul>'
          : '<p class="lede">' + tr('이날은 면세 일정이 없습니다.', 'この日の免税予定はありません。', 'No tax-free events for this day.') + '</p>') +
        '<button type="button" class="btn btn-line btn-sm memo-add-button" data-act="memoEdit" data-arg="' + selected + '" data-key="memo-edit">' + icon('pen',18) + (ui.memos[selected] ? tr('일정 메모 수정', '予定メモを編集', 'Edit memo') : tr('일정 메모 추가', '予定メモを追加', 'Add schedule memo')) + '</button></div>';
    }

    var due = c.sum.earliestDue;
    var dueLeft = due ? L.diffDays(c.todayISO, due) : 0;
    var h = [];
    h.push('<div class="page-head"><h1 class="page-title disp">' + icon('cal', 27) + tr('캘린더', 'カレンダー', 'Calendar') + '</h1><p class="lede">' + tr('구매일, 출국일, 90일 출국 기한을 한눈에 볼 수 있습니다.', '購入日・出国日・90日以内の期限をまとめて確認できます。', 'See shopping dates, departure and the 90-day deadline at a glance.') + '</p></div>');
    h.push('<section class="calendar-trip" aria-label="출국일">' + icon('plane', 26) +
      '<div><span>' + tr('출국일', '出国日', 'DEPARTURE') + '</span><strong>' + (c.trip.depDate ? esc(ymd(c.trip.depDate)) : tr('여행 정보를 입력해 주세요', '旅行情報を入力', 'Add your trip')) + '</strong></div>' +
      (c.dlabel ? '<span class="trip-dday">' + esc(c.dlabel) + '</span>' : '') + '</section>');
    h.push('<section class="sec" aria-label="달력"><div class="cal">' +
      '<div class="cal-nav"><button type="button" class="iconbtn" data-act="calPrev" data-key="cal-prev" aria-label="이전 달">' + icon('left') + '</button>' +
      '<h2 class="cal-month disp">' + tr(y + '년 ' + m + '월', y + '年' + m + '月', new Date(y,m-1,1).toLocaleDateString('en-US',{year:'numeric',month:'long'})) + '</h2>' +
      '<button type="button" class="iconbtn" data-act="calNext" data-key="cal-next" aria-label="다음 달">' + icon('right') + '</button></div>' +
      '<div class="cal-dow" aria-hidden="true">' + WEEK.map(function (w,i) { return '<span>' + tr(w,['日','月','火','水','木','金','土'][i],['S','M','T','W','T','F','S'][i]) + '</span>'; }).join('') + '</div>' +
      '<div class="cal-grid">' + cells.join('') + '</div>' +
      '<ul class="cal-legend"><li><i class="mk mk-buy"></i>' + tr('구매','購入','Purchase') + '</li><li><i class="mk mk-dep"></i>' + tr('출국일','出国日','Departure') + '</li><li><i class="mk mk-remind"></i>' + tr('알림','通知','Alerts') + '</li><li><i class="mk mk-due"></i>' + tr('출국 기한','出国期限','Deadline') + '</li><li><i class="mk mk-memo"></i>' + tr('메모','メモ','Memo') + '</li></ul>' +
      '</div>' + info + '</section>');

    h.push('<section class="sec calendar-deadline" aria-labelledby="h-due"><div class="sec-head"><h2 class="sec-title disp" id="h-due">90일 출국 기한</h2></div>' +
      (due
        ? '<div class="money-row"><time class="money" datetime="' + due + '">' + ymd(due) + '</time><span class="chip chip-sign">' + (dueLeft >= 0 ? 'D-' + dueLeft : tr('지남', '期限切れ', 'Passed')) + '</span></div>' +
          '<p class="lede">가장 먼저 산 영수증 기준입니다. 구매 다음 날부터 세어 90일째까지 출국해야 환급받을 수 있습니다.</p>'
        : '<p class="lede">영수증을 추가하면 출국 기한을 계산합니다.</p>') +
      '</section>');

    h.push('<section class="sec reminder-section" id="reminder-settings" tabindex="-1" aria-labelledby="h-rem">' +
      '<div class="reminder-header"><div><h2 class="sec-title disp" id="h-rem">' + tr('알림 일정', '通知スケジュール', 'Reminder schedule') + '</h2>' +
      '<p class="lede">' + tr('기본은 출국일에 맞춰 자동 설정됩니다. 날짜와 반복을 바꿀 수 있어요.', '初期設定は出国日を基準に自動計算します。日付や繰り返しを変更できます。', 'Automatic by default; choose your own date or repeat frequency.') + '</p></div>' +
      '<label class="notification-switch"><input type="checkbox" role="switch" data-change="remGlobal" id="rem-global" aria-label="' + tr('전체 알림', 'すべての通知', 'All reminders') + '" ' + (ui.reminderPrefs.enabled ? 'checked' : '') + '><span class="switch-track"></span><strong>' + (ui.reminderPrefs.enabled ? 'ON' : 'OFF') + '</strong></label></div>');
    if (c.remBase.length) {
      h.push('<div class="reminder-list">' + c.remBase.map(function (raw) {
        var pref = ui.reminderPrefs.entries[raw.id];
        var on = pref.enabled && ui.reminderPrefs.enabled;
        var effective = R.apply([raw], {entries:{[raw.id]:Object.assign({}, pref, {enabled:true})}}, c.now)[0];
        var item = reminderLabel(effective);
        return '<article class="reminder-card' + (!pref.enabled || !ui.reminderPrefs.enabled ? ' is-disabled' : '') + '">' +
          '<div class="reminder-date-block"><span>' + tr('알림 날짜', '通知日', 'REMINDER DATE') + '</span><strong>' + esc(ymd(L.toISO(item.at))) + '</strong></div>' +
          '<div class="reminder-card-body"><h3>' + nb(item.title) + '</h3><span class="reminder-mode">' + repeatText(item.mode) +
          (item.untilISO ? ' · ' + tr(ymd(item.untilISO) + '까지', ymd(item.untilISO) + 'まで', 'until ' + ymd(item.untilISO)) : '') + '</span></div>' +
          '<div class="reminder-card-actions"><label class="notification-switch reminder-item-toggle"><input type="checkbox" role="switch" data-change="remItem" data-key="rem-toggle-' + raw.id + '" data-arg="' + raw.id + '"' + (on ? ' checked' : '') + (ui.reminderPrefs.enabled ? '' : ' disabled') + ' aria-label="' + tr('개별 알림 사용', '個別通知の有効化', 'Enable this reminder') + '"><span class="switch-track"></span><strong>' + (on ? 'ON' : 'OFF') + '</strong></label>' +
          '<button class="reminder-edit" data-act="remEdit" data-arg="' + raw.id + '" data-key="rem-edit-' + raw.id + '" aria-label="' + tr('알림 수정', '通知を編集', 'Edit reminder') + '">' + icon('pen', 19) + '</button></div></article>';
      }).join('') + '</div>' +
        (ui.reminderPrefs.enabled ?
          (ui.embedded ? '<button type="button" class="btn btn-line" data-act="exportRem">' + icon('copy',18) + tr('알림 일정 복사', '通知予定をコピー', 'Copy reminder schedule') + '</button>' :
          '<button type="button" class="btn btn-sign btn-block" data-act="exportRem">' + icon('cal',18) + tr('캘린더로 알림 내보내기', 'カレンダーに書き出す', 'Export reminders to calendar') + '</button>') : '') +
        '<p class="lede reminder-footnote">' + tr('알림을 끄면 일정 표시와 내보내기에서 제외됩니다. 웹앱을 닫아도 알림을 받으려면 캘린더 파일을 가져와 주세요.', '通知をOFFにすると予定表示と書き出しから除外されます。アプリ終了後も通知を受けるにはカレンダーに取り込んでください。', 'Disabled reminders are hidden and not exported. Import the calendar file to get alerts when the web app is closed.') + '</p>');
    } else {
      h.push('<div class="panel"><p>' + tr('출국일을 입력하면 알림 일정을 계산합니다.', '出国日を登録すると通知予定を自動生成します。', 'Add your departure date to generate reminders.') + '</p></div>');
    }
    h.push('</section>');
    h.push(mascotHint(tr('출국일과 환급 알림을 확인해 주세요!', '出国日と還付の予定を確認しましょう！', 'Check your departure and refund reminders!')));
    return h.join('');
  }

  /* ---------- 화면: 출국 ---------- */
  /* 키오스크 안내판 안의 안내 한 덩어리.
     제목 줄(아이콘, 이름, 상태 칩) → 한 줄 답 → 시간·대수 칩 → 덧붙임 문장 순서로 쌓아서
     문장 하나에 장소, 시간, 조건이 뒤섞이지 않게 합니다. */
  function infoBlock(ic, label, raw, status) {
    var p = L.splitInfo(raw);
    return '<li class="info"><div class="info-head">' + icon(ic, 20) + '<h3 class="info-label">' + esc(label) + '</h3>' +
      (status ? '<span class="chip chip-ok">' + esc(status) + '</span>' : '') + '</div>' +
      '<p class="info-main">' + nb(p.text) + '</p>' +
      (p.meta.length ? '<ul class="info-meta">' + p.meta.map(function (t) { return '<li class="chip chip-dark">' + nb(t) + '</li>'; }).join('') + '</ul>' : '') +
      (p.extra ? '<p class="info-extra">' + nb(p.extra) + '</p>' : '') +
      '</li>';
  }

  /* 안내판 칩 글자: 숫자가 있는 값은 '키오스크 12대', '운영 06:00–21:00'처럼,
     모르는 값은 '운영 시간: 공항 안내 확인'처럼 무엇을 확인하라는 건지 이름을 붙입니다 */
  function specChip(label, longLabel, v) {
    return /\d/.test(v) ? label + ' ' + v : longLabel + ': ' + v;
  }

  function timeBlock(cls, label, d, extra) {
    return '<div class="time ' + cls + '"><span class="time-label">' + label + '</span>' +
      '<span class="time-num disp">' + hm(d) + '</span>' +
      '<span class="time-date">' + esc(mdw(L.toISO(d))) + (extra || '') + '</span></div>';
  }

  /* 공항 도착 목표에 대한 근거. 계산은 기존 logic.js 값을 그대로 이용합니다. */
  function planNotes(p, a) {
    var rows = [];
    var h = '';
    if (p.auto) {
      rows.push([tr('기본', '基本', 'Base'), tr('보통은 출발 ' + A.baseHours + '시간 전을 권합니다.', '通常は出発' + A.baseHours + '時間前の到着を推奨します。', 'Normally arrive ' + A.baseHours + ' hours before departure.'), false]);
      if (p.busy) rows.push([tr('+1시간', '+1時間', '+1 hour'),
        tr('공항이 붐비는 시기여서 여유를 더합니다.', '混雑が予想されるため、余裕を追加します。', 'Allow extra time for busy travel periods.'), true]);
      if (p.many) rows.push([tr('+1시간', '+1時間', '+1 hour'),
        tr('면세품이나 영수증이 많아 확인 시간이 더 걸릴 수 있습니다.', '免税品やレシートが多いと確認に時間がかかります。', 'Many tax-free purchases or receipts may take longer to verify.'), true]);
      h += '<ul class="why">' + rows.map(function (r) {
        return '<li><span class="why-tag' + (r[2] ? ' is-add' : '') + '">' + r[0] + '</span><span>' + r[1] + '</span></li>';
      }).join('') + '</ul>';
    }
    if (p.clamped) {
      h += '<p class="note note-sign">' + icon('warn',20) + '<span><b>' + tr('키오스크 운영 시작: ', 'キオスク開始時刻: ', 'Kiosk opening: ') + esc(a.open) + '</b> ' +
        tr('키오스크 운영 시간에 맞춰 도착 목표를 조정했습니다.', '営業時間に合わせて到着目標を調整しました。', 'The target was adjusted to kiosk opening hours.') + '</span></p>';
    } else if (p.hours > A.baseHours) h += '<p class="lede">' + tr('체크인 카운터는 보통 출발 2~3시간 전에 열립니다.', 'チェックインカウンターは通常、出発の2～3時間前に開きます。', 'Check-in counters typically open 2–3 hours before departure.') + '</p>';
    return h;
  }
  function airportSpec(v) {
    if (ui.language === 'ko') return v;
    if (/^\d+대$/.test(v)) return v.replace('대', ui.language === 'ja' ? '台' : ' machines');
    if (v === '24시간') return tr(v, '24時間', '24 hours');
    if (v === '확인 필요' || v === '공항 안내 확인') return tr(v, '現地確認が必要', 'Check airport info');
    if (v === '운항 일정에 맞춤') return tr(v, '運航スケジュールによる', 'Depends on flight schedule');
    return v.replace('다음 날', ui.language === 'ja' ? '翌' : 'next day');
  }
  function allChecked() { return D.checklist.every(function (_, i) { return !!state.checks[i]; }); }
  function hideCelebration() {
    window.clearTimeout(celebrationTimer);
    $('#clear-celebration').hidden = true;
  }
  function showCelebration() {
    var el = $('#clear-celebration');
    window.clearTimeout(celebrationTimer);
    el.hidden = false;
    $('#clear-message').textContent = tr('모든 체크리스트 완료!', 'チェックリスト完了！', 'All checklist items complete!');
    el.setAttribute('aria-label', $('#clear-message').textContent);
    var parts = [];
    for (var i = 0; i < 26; i++) {
      var angle = i * Math.PI * 2 / 26;
      var radius = 105 + (i % 4) * 15;
      parts.push('<i style="--dx:' + Math.round(Math.cos(angle) * radius) + 'px;--dy:' + Math.round(Math.sin(angle) * radius) + 'px;--r:' + ((i * 47) % 360) + 'deg;--delay:' + (i % 5 * 35) + 'ms"></i>');
    }
    $('#clear-particles').innerHTML = parts.join('');
    celebrationTimer = window.setTimeout(hideCelebration, 3200);
  }
  function checklistHTML(c) {
    var a = c.airport, p = c.plan, done = 0;
    var arriveText = p
      ? tr(hm(p.at) + '까지 공항에 도착합니다. 출발 ' + span(p.leadMin) + ' 전입니다.',
          hm(p.at) + 'までに空港へ到着。出発' + span(p.leadMin) + '前です。',
          'Arrive at the airport by ' + hm(p.at) + ', ' + span(p.leadMin) + ' before departure.')
      : tr('출발 ' + A.baseHours + '시간 전 도착을 목표로 하세요.', '出発' + A.baseHours + '時間前を目安に到着してください。', 'Aim to arrive ' + A.baseHours + ' hours before departure.');
    var groups = [
      { id: 'prep', name: tr('기본 준비', '基本の準備', 'Essentials'), icon: 'case', ids: [0, 1] },
      { id: 'customs', name: tr('공항 수속 준비', '税関手続き', 'Customs check'), icon: 'kiosk', ids: [2, 3] },
      { id: 'boarding', name: tr('출국 수속', '出国手続き', 'Departure'), icon: 'plane', ids: [4, 5] },
      { id: 'refund', name: tr('환급 수단 확인', '還付方法の確認', 'Refund collection'), icon: 'card', ids: [6] }
    ];
    D.checklist.forEach(function (_, i) { if (state.checks[i]) done++; });
    return '<div class="checklist-dialog-intro"><div class="checklist-dialog-mascot">' + mascot('mascot-checklist') + '</div><div><h3>' + tr('출국 전 체크리스트', '出国前チェックリスト', 'Pre-departure checklist') + '</h3>' +
      '<p>' + tr('그룹별로 확인하고 준비하세요.', '項目ごとに確認しましょう。', 'Check each group before departure.') + '</p>' +
      '<span class="checklist-count">' + done + ' / ' + D.checklist.length + ' ' + tr('완료', '完了', 'done') + (done === D.checklist.length ? ' · CLEAR!' : '') + '</span></div></div>' +
      '<div class="checklist-groups">' + groups.map(function (g) {
        var count = g.ids.filter(function (id) { return !!state.checks[id]; }).length;
        var open = !!ui.depOpen[g.id];
        return '<section class="checklist-group' + (open ? ' is-open' : '') + '">' +
          '<button class="checklist-group-toggle" type="button" data-act="depGroup" data-arg="' + g.id + '" data-key="dep-group-' + g.id + '" aria-expanded="' + open + '" aria-controls="dep-group-content-' + g.id + '">' +
          '<span class="group-icon">' + icon(g.icon, 23) + '</span><span>' + g.name + ' (' + count + '/' + g.ids.length + ')</span>' + icon('chevron-down', 22) + '</button>' +
          (open ? '<ol class="steps" id="dep-group-content-' + g.id + '">' + g.ids.map(function (i) {
            var st = D.checklist[i], on = !!state.checks[i], loc = DETAILS.checklist[i];
            var name = ui.language === 'ko' ? st.title : loc.title[ui.language === 'ja' ? 0 : 1];
            var desc = fill(st.desc, { arrive: arriveText, kiosk: airportValue(a, 'kiosk'), red: airportValue(a, 'red'), cash: airportValue(a, 'cash') });
            if (ui.language !== 'ko' && loc.desc) desc = i === 0 ? arriveText : loc.desc[ui.language === 'ja' ? 0 : 1];
            return '<li class="step"><input type="checkbox" id="chk-' + i + '" data-change="check" data-arg="' + i + '" data-key="chk-' + i + '"' + (on ? ' checked' : '') + '>' +
              '<label for="chk-' + i + '"><span class="step-title"><span class="step-name">' + esc(name) + '</span>' +
              (st.key ? '<span class="chip chip-sign">' + tr('핵심','重要','Key') + '</span>' : '') +
              (st.only ? '<span class="chip chip-ghost">' + tr(st.only, '現金還付を選んだレシートのみ', 'Only for cash-refund receipts') + '</span>' : '') +
              '</span><span class="step-desc">' + nb(desc) + '</span></label></li>';
          }).join('') + '</ol>' : '') + '</section>';
      }).join('') + '</div>' +
      (done ? '<button type="button" class="btn-text reset-checks" data-act="clearChecks" data-key="clear-checks">' + tr('체크 모두 지우기', 'チェックをリセット', 'Reset checklist') + '</button>' : '') +
      terminal('terminal-departure');
  }
  function viewDeparture(c) {
    var a = c.airport, p = c.plan;
    var h = [];
    var done = 0;
    D.checklist.forEach(function (_, i) { if (state.checks[i]) done++; });
    h.push('<div class="page-head"><h1 class="page-title disp">' + icon('plane', 28) + tr('출국 환급', '出国・還付', 'Departure refund') + '</h1>' +
      '<button type="button" class="departure-mascot-peek" data-act="showChecklist" data-key="top-checklist" aria-label="' + tr('마스코트를 눌러 체크리스트 열기', 'マスコットでチェックリストを開く', 'Tap mascot to open checklist') + '">' + mascot('mascot-header') + '<span class="speech-bubble">' + tr('체크리스트', 'チェックリスト', 'Checklist') + ' (' + done + '/' + D.checklist.length + ')</span></button></div>');
    h.push(arrivalNotice(c));
    if (!ui.airportRevealed) {
      h.push('<div class="departure-picker"><label for="dep-airport" class="departure-picker-title disp">' + icon('pin', 18) +
        '<span>' + tr('출국 공항·항구', '出国する空港・港', 'Departure airport / port') + '</span></label>' +
        '<div class="departure-picker-body">' + terminal('terminal-picker') +
        '<select class="input" id="dep-airport" data-change="airport" data-key="dep-airport"><option value="" disabled selected>' + tr('공항·항구를 선택하세요', '空港・港を選択してください', 'Select an airport or port') + '</option>' + airportSelectHTML('') + '</select></div></div>');
      return h.join('');
    }
    h.push('<div class="departure-results"><div class="dep-more-heading" id="dep-airport-title" tabindex="-1"><h2 class="sec-title disp">' + icon('pin', 19) + esc(airportValue(a, 'name')) +
      '</h2><button type="button" class="btn-text" data-act="changeAirport">' + tr('공항·항구 변경', '空港・港を変更', 'Change airport or port') + '</button></div>');
    h.push('<section class="sec" aria-labelledby="h-times"><div class="sec-head"><h2 class="sec-title disp" id="h-times">' + tr('공항 도착 목표', '空港到着目標', 'Airport arrival target') + '</h2>' +
      '<button type="button" class="btn-text" data-act="trip" data-key="dep-trip">' + (p ? tr('출발 시각 변경', '出発時刻を変更', 'Edit departure time') : tr('여행 정보 입력', '旅行情報を入力', 'Add your trip')) + '</button></div>');
    if (!p) {
      h.push('<div class="panel"><p>' + tr('출국일과 출발 시각을 입력하면 공항 도착 목표를 계산합니다.', '出国日と出発時刻から空港到着目標を計算します。', 'Set a departure date and time to calculate your arrival target.') + '</p></div>');
    } else {
      h.push('<div class="panel arrival-panel">' +
        '<div class="times">' +
        timeBlock('is-goal', '<span class="chip chip-sign">' + tr('공항 도착 목표', '空港到着目標', 'Arrival target') + '</span>', p.at, '<span class="sr">, ' + span(p.leadMin) + '</span>') +
        '<div class="time-gap" aria-hidden="true"><span>' + span(p.leadMin) + '</span><i></i></div>' +
        timeBlock('is-dep', a.ship ? tr('배 출발', '船の出発', 'Ferry departs') : tr('비행기 출발', '飛行機の出発', 'Flight departs'), p.dep, '') +
        '</div>' +
        (c.trip.lead && c.trip.arrivalReviewed ? '<p class="arrival-applied">' + icon('check', 17) +
          tr('계산한 권장 시간을 사용 중입니다.', '計算した推奨時刻を使用しています。', 'Using your calculated recommendation.') + '</p>' : '') +
        planNotes(p, a) + '</div>');
    }
    h.push('</section>');
    var spec = a.hours === a.count
      ? [tr('대수·운영 시간', '台数・営業時間', 'Machines / hours') + ': ' + airportSpec(a.count)]
      : [tr('키오스크', 'キオスク', 'Kiosks') + ' ' + airportSpec(a.count), tr('운영', '営業時間', 'Hours') + ' ' + airportSpec(a.hours)];
    h.push('<section class="board kiosk-board" aria-label="' + tr('면세 키오스크 위치', '免税キオスクの場所', 'Tax refund kiosk location') + '">' +
      '<div class="kiosk-sign"><span class="picto">' + icon('kiosk',30) + '</span><div><p class="kiosk-ja" lang="ja">免税手続 TAX REFUND</p><p class="kiosk-ko">' + tr('면세 절차 키오스크', '免税手続きキオスク', 'Tax refund kiosk') + '</p></div></div>' +
      '<p class="kiosk-where disp">' + nb(airportValue(a, 'kiosk')) + '</p>' +
      '<ul class="kiosk-spec" aria-label="' + tr('키오스크 대수와 운영 시간', '台数と営業時間', 'Machine count and hours') + '">' + spec.map(function (t) { return '<li class="chip chip-dark">' + nb(t) + '</li>'; }).join('') + '</ul>' +
      '<ul class="infos">' +
      (a.vjw ? infoBlock('wifi', tr('휴대폰 판정', 'スマホで確認', 'Mobile verification'),
        tr('출발 로비의 전용 Wi-Fi에서 Visit Japan Web으로', '出発ロビーの専用Wi-FiでVisit Japan Webを利用', 'Use Visit Japan Web on the dedicated departure-lobby Wi-Fi'),
        tr('가능','可能','Available')) : '') +
      infoBlock('search', tr('RED일 때', 'REDの場合', 'If RED'), airportValue(a, 'red')) +
      infoBlock('yen', tr('현금 환급', '現金還付', 'Cash refund'), airportValue(a, 'cash')) +
      '</ul>' +
      (a.note ? '<p class="board-note"><b>' + tr('참고', '備考', 'Note') + '</b>' + nb(airportValue(a, 'note')) + '</p>' : '') +
      '<a class="board-src" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">' + tr('출처', '出典', 'Source') + ': ' + nb(a.src) + ' · ' + esc(D.checkedAt) + icon('ext',14) + '</a></section>');
    var bad = c.views.filter(function (x) { return x.v.status === 'consumed'; });
    if (bad.length) h.push('<p class="note note-risk">' + icon('warn',20) + '<span><b>' + tr('세관 직원에게 먼저 알려야 할 영수증', '税関職員に先に伝えるレシート', 'Receipts to report to customs') + ': ' + bad.length + '</b><span>' + esc(bad.map(function (x) { return x.r.store; }).join(', ')) + ' · ' + tr('먹거나 쓴 물건은 키오스크 대신 세관 직원에게 먼저 말하세요.', '消費した品物がある場合、先に税関職員に申し出てください。', 'Tell customs first about used or consumed items.') + '</span></span></p>');
    h.push('<section class="checklist-launch-card"><div class="checklist-launch-copy"><span class="pixel-eyebrow">CHECK LIST</span>' +
      '<h2>' + tr('출국 전 체크리스트', '出国前チェックリスト', 'Pre-departure checklist') + '</h2>' +
      '<p>' + tr('마스코트를 터치해 체크리스트를 펼쳐 보세요.', 'マスコットをタップするとチェックリストが開きます。', 'Tap the mascot to open your checklist.') + '</p>' +
      '<span class="checklist-count">' + done + ' / ' + D.checklist.length + ' ' + tr('완료', '完了', 'done') + '</span></div>' +
      '<button type="button" class="mascot-open" data-act="showChecklist" data-key="showChecklist" aria-label="' + tr('체크리스트 열기', 'チェックリストを開く', 'Open checklist') + '">' + mascot('mascot-checklist') + '<span class="speech-bubble">' + tr('눌러 보기', 'タップ', 'TAP ME') + ' ' + icon('arrow', 16) + '</span></button></section></div>');
    return h.join('');
  }

  /* ---------- 화면: 가이드 ---------- */

  /* 면세 QR 만들기 안내판: Visit Japan Web 바로가기 */
  function qrBoard() {
    var q = D.qr;
    return '<section class="board qr" aria-labelledby="h-qr">' +
      '<div class="kiosk-sign"><span class="picto">' + icon('qr', 30) + '</span>' +
      '<div><h3 class="qr-title disp" id="h-qr">' + esc(q.title) + '</h3><p class="kiosk-ko">' + esc(q.sub) + '</p></div></div>' +
      '<ol class="qr-steps">' + q.steps.map(function (s) { return '<li><span>' + nb(s) + '</span></li>'; }).join('') + '</ol>' +
      '<a class="btn btn-sign btn-block" href="' + esc(q.url) + '" target="_blank" rel="noopener noreferrer" data-key="qr-cta">' + esc(q.cta) + icon('ext', 18) + '</a>' +
      '<p class="qr-host">' + esc(q.host) + '</p>' +
      '<ul class="qr-notes">' + q.notes.map(function (n) { return '<li>' + nb(n) + '</li>'; }).join('') + '</ul>' +
      '</section>';
  }

  function viewGuide() {
    var g = D.guide[ui.guideStep] || D.guide[0];
    var next = D.guide[ui.guideStep + 1];
    var h = [];

    h.push('<div class="page-head"><h1 class="page-title disp">절차 가이드</h1>' +
      '<p class="lede">2026년 11월 1일 구매분부터는 살 때 세금까지 내고, 출국할 때 확인을 받은 뒤 돌려받습니다.</p></div>');

    h.push('<section class="sec" aria-labelledby="h-guide">' +
      '<div class="seg" role="group" aria-label="절차 단계">' + D.guide.map(function (x, i) {
        return '<button type="button" data-act="guide" data-arg="' + i + '" data-key="guide-' + i + '" aria-pressed="' + (i === ui.guideStep) + '">' + (i + 1) + ' ' + esc(localeText(x.tab)) + '</button>';
      }).join('') + '</div>' +
      '<div class="sec-head"><h2 class="sec-title disp" id="h-guide">' + esc(g.title) + '</h2></div>' +
      (g.qr ? qrBoard() : '') +
      '<ul class="guide-list">' + g.items.map(function (it) {
        return '<li class="guide-item"><span class="guide-ic">' + icon(it.icon, 20) + '</span><div class="guide-text"><h3>' + esc(it.title) + '</h3><p>' + nb(it.desc) + '</p>' +
          (it.link ? '<a class="link" href="' + esc(it.link.url) + '" target="_blank" rel="noopener noreferrer">' + esc(it.link.label) + icon('ext', 14) + '</a>' : '') +
          '</div></li>';
      }).join('') + '</ul>' +
      (g.tip ? '<p class="note note-' + g.tip.tone + '">' + icon('warn', 20) + '<span><span class="note-title">' + esc(g.tip.title) + '</span>' + nb(g.tip.desc) + '</span></p>' : '') +
      (next ? '<div class="guide-nav"><button type="button" class="arrowbtn" data-act="guideNext" data-arg="' + (ui.guideStep + 1) + '" data-key="guide-next">' +
        icon('arrow', 24) + '<span class="sr">다음: ' + esc(next.title) + '</span></button></div>' : '') +
      '</section>');

    h.push('<section class="sec" aria-labelledby="h-allow"><div class="sec-head"><h2 class="sec-title disp" id="h-allow">한국에 들어올 때 면세한도</h2></div>' +
      '<div class="panel"><dl class="allow">' + D.allowance.map(function (x) { return '<div><dt>' + esc(x.label) + '</dt><dd>' + esc(x.value) + '</dd></div>'; }).join('') + '</dl>' +
      '<p class="lede">1인 기준입니다.</p></div></section>');

    h.push('<section class="sec" aria-labelledby="h-src"><div class="sec-head"><h2 class="sec-title disp" id="h-src">근거 자료</h2><span class="sec-side">' + esc(D.sourcesCheckedAt) + ' 확인</span></div>' +
      '<ul class="sources">' + D.sources.map(function (x) {
        return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.label) + icon('ext', 14) + '</a></li>';
      }).join('') + '</ul></section>');

    return h.join('');
  }

  /* 가이드의 기존 설명·원문은 월렛 카드 안에서 그대로 이어서 볼 수 있습니다. */
  function renderWalletQR() {
    $('#dlg-wallet-qr-title').textContent = tr('내 QR 이미지', '保存したQR画像', 'My saved QR image');
    $('#wallet-qr-close').setAttribute('aria-label', tr('닫기', '閉じる', 'Close'));
    $('#wallet-qr-content').innerHTML = (ui.qr
      ? '<div class="saved-qr-body"><div class="qr-saved"><img alt="' + tr('저장한 QR 이미지', '保存したQR画像', 'Saved QR image') + '" src="' + ui.qr.image + '">' +
        '<button type="button" class="btn btn-line btn-sm" data-act="qrCopy">' + icon('copy',17) + tr('QR 내용 복사', 'QRの内容をコピー', 'Copy QR contents') + '</button></div>' +
        '<details class="qr-payload"><summary>' + tr('인식한 QR 내용 확인', '読み取ったQRの内容を確認', 'View decoded contents') + '</summary><code data-user-text>' + esc(ui.qr.data) + '</code></details>' +
        '<div class="qr-saved-actions"><button type="button" class="btn btn-line" data-act="qrUpload">' + icon('qr',19) + tr('QR 바꾸기', 'QRを変更', 'Replace QR') + '</button>' +
        '<button type="button" class="btn btn-line" data-act="qrRemove">' + icon('trash',18) + tr('저장 삭제', '保存を削除', 'Remove saved QR') + '</button></div></div>'
      : '<div class="qr-empty"><button type="button" class="qr-upload-button" data-act="qrUpload" data-key="qr-upload">' + icon('plus',26) + '<strong>' +
        tr('갤러리에서 QR 이미지 선택', '写真からQR画像を選択', 'Choose a QR image from photos') + '</strong><span>' +
        tr('이미지를 읽어 QR 데이터를 확인한 후 저장합니다.', '画像からQRコードを読み取って保存します。', 'Decode the QR image before saving it.') + '</span></button></div>') +
      '<p class="qr-safety">' + tr('이미지는 이 브라우저에만 저장됩니다. 현장에서 사용할 최신 면세 QR은 Visit Japan Web에서 직접 열어 주세요.',
        '画像はこのブラウザにのみ保存されます。現地ではVisit Japan Webで最新の免税QRを表示してください。',
        'The image is stored in this browser. Open your latest official QR in Visit Japan Web when presenting it.') + '</p>';
  }

  function pickTitle() {
    return tr('당신을 위한 면세품 PICK!', 'あなたへの免税品PICK！', 'Duty-Free Picks for You!');
  }

  function pickSprite(category, item) {
    if (item && window.TAXGO_PICK_ART[item.mark]) return window.TAXGO_PICK_ART[item.mark];
    var shapes = {
      liquor: 'M11 3h10v9l5 4v13H6V16l5-4z',
      fragrance: 'M10 4h12v7h4v17H6V11h4z',
      beauty: 'M11 3h10v5h4v21H7V8h4z',
      food: 'M4 8h24v3h2v14H2V11h2z',
      fashion: 'M2 11h12v3h4v-3h12v9h-3v3h-8v-3h-2v-4h-2v4h-2v3H5v-3H2z',
      aviator: 'M2 10h12v3h4v-3h12v7h-2v4h-3v3h-5v-3h-2v-5h-4v5h-2v3H7v-3H4v-4H2z',
      brow: 'M2 9h12v3h4V9h12v10h-2v3h-9v-3h-2v-4h-2v4h-2v3H4v-3H2z'
    };
    var fashion = category.id === 'fashion';
    var shape = fashion && item && item.mark !== 'square' ? shapes[item.mark] : shapes[category.id];
    return '<svg class="pick-sprite" viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">' +
      '<path d="' + shape + '" fill="' + (item ? item.color : category.color) + '" stroke="#222436" stroke-width="2"/>' +
      (fashion ? '<path d="M5 14h6m10 0h6" stroke="#f4eed9" stroke-width="2"/>' :
        '<path d="M9 16h14v9H9z" fill="#fff3c8"/>' +
        (item ? '<text x="16" y="22" text-anchor="middle" fill="#222436" font-size="3.6" font-weight="800">' + esc(item.mark) + '</text>' :
          '<path d="M12 19h8v2h-8z" fill="#222436"/>')) + '</svg>';
  }

  function viewPick() {
    var pick = ui.pick;
    var category = pick.category;
    var item = pick.item;
    var back = category ? tr('종류 다시 고르기', '種類を選び直す', 'Choose another category') :
      tr('월렛으로 돌아가기', 'ウォレットに戻る', 'Back to wallet');
    var content;
    if (!category) {
      content = '<p class="pick-prompt">' + tr('추천받을 면세품 종류를 골라 주세요.', 'おすすめを見たい種類を選んでください。', 'Choose a category to discover a pick.') + '</p>' +
        '<div class="pick-categories">' + PICKS.categories.map(function (cat) {
          return '<button class="pick-category" type="button" data-act="pickCategory" data-arg="' + cat.id + '" data-key="pick-' + cat.id + '">' +
            pickSprite(cat) + '<strong>' + esc(tr.apply(null, cat.label)) + '</strong></button>';
        }).join('') + '</div>';
    } else if (pick.pending) {
      content = '<div class="pick-loading" role="status">' + pickSprite(category) +
        '<strong>' + tr('면세품을 찾는 중…', '免税品を探しています…', 'Finding your pick…') +
        '</strong><span class="pick-progress" aria-hidden="true"></span></div>';
    } else {
      var source = PICKS.sources[item.source];
      var evidence = {
        airport: tr('공항 면세점 추천', '空港免税店のおすすめ', 'Airport retailer’s selection'),
        sales: tr('공항 면세점 인기 판매 목록', '空港免税店の売れ筋', 'Airport duty-free top sellers'),
        bestseller: tr('브랜드 베스트셀러', 'ブランドのベストセラー', 'Brand bestseller'),
        popular: tr('브랜드 인기 상품 목록', 'ブランドの人気商品', 'Brand’s popular products')
      };
      content = '<div class="pick-result"><div class="pick-discovery">' + mascot('mascot-pick') +
        '<div class="pick-item-art">' + pickSprite(category, item) + '</div></div>' +
        '<h2 class="pick-product" tabindex="-1">' + esc(tr.apply(null, item.name)) + '</h2>' +
        '<p class="pick-speech">' + esc(tr.apply(null, item.detail)) + '</p>' +
        '<p class="pick-source">' + evidence[source.type] + ' · <a href="' + source.url + '" target="_blank" rel="noopener noreferrer">' +
        esc(source.label) + '</a></p>' +
        (item.community ? '<p class="pick-community"><strong>' + tr('개인 후기', '個人の感想', 'Personal experience') + '</strong> ' +
          esc(tr.apply(null, item.community.note)) + ' <a href="' + esc(item.community.url) + '" target="_blank" rel="noopener noreferrer">' +
          esc(item.community.label) + '</a></p>' : '') +
        '<div class="pick-reroll"><button type="button" data-act="pickAgain" class="iconbtn" aria-label="' +
        tr('왼쪽으로 넘겨 다시 추천', '左へ送って再抽選', 'Reroll left') + '">' + icon('left', 20) + '</button><span>' +
        tr('좌우로 넘겨 다른 추천 보기', '左右にスワイプして再抽選', 'Swipe either way for another pick') +
        '</span><button type="button" data-act="pickAgain" class="iconbtn" aria-label="' +
        tr('오른쪽으로 넘겨 다시 추천', '右へ送って再抽選', 'Reroll right') + '">' + icon('right', 20) + '</button></div></div>';
    }
    return '<section class="pick-game' + (category ? ' pick-game-detail' : '') + '">' + window.TAXGO_PICK_SCENE +
      '<button type="button" class="wallet-back pick-back" data-act="pickBack" data-key="pick-back">' + icon('left', 20) + back + '</button>' +
      '<h1 class="pick-title">' + pickTitle() + '</h1>' + content + '</section>';
  }

  function quizTitle() {
    return tr('면세, 어디까지 알아?', '免税、どこまで知ってる？', 'How Well Do You Know Tax-Free?');
  }

  function quizMascot(mood) {
    if (mood === 'neutral') return mascot('quiz-mascot');
    return '<svg class="mascot-art quiz-mascot" viewBox="0 0 156 164" aria-hidden="true"><use href="#i-mascot' +
      (mood === 'happy' ? '-happy' : '') + '"></use>' +
      (mood === 'sad' ? '<path d="M52 79h55v22H95v15H70v-10H52z" fill="#fff"/>' +
        '<path d="m54 86 6 5 6-5m27-4 6 5 6-5m-32 23q9-9 17-1" fill="none" stroke="#111116" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M103 94h5v6h-5z" fill="#369fce"/>' : '') + '</svg>';
  }

  function quizFinale(quiz) {
    var loaded = quiz.score > 0;
    var bags = Array.from({ length: loaded ? quiz.score : quiz.deck.length }, function (_, i) {
      return '<span class="' + (loaded ? 'quiz-load-bag' : 'quiz-crash-bag') + '" style="--load-index:' + i + '">' +
        QUIZ_ART.bag(loaded ? quiz.loaded[i] : i) + '</span>';
    }).join('');
    return '<div class="quiz-finale"><h2 tabindex="-1">' + (loaded
      ? tr(quiz.score + '개 정답! 짐을 싣고 출발!', quiz.score + '問正解！荷物を載せて出発！', quiz.score + ' correct! Load up and take off!')
      : tr('이번 비행은 짐 없이 출발…', '今回は荷物なしで出発…', 'No bags made this flight…')) + '</h2>' +
      '<div class="quiz-finale-scene' + (loaded ? '' : ' quiz-crash') + '" style="--quiz-load-count:' + quiz.score + '" aria-hidden="true">' +
      (loaded ? QUIZ_ART.plane + '<div class="quiz-loaded">' + bags + '</div>' : bags + quizMascot('sad')) + '</div>' +
      '<div class="quiz-end-actions"><button type="button" class="btn btn-sign" data-act="quizRestart">' +
      tr('다시 도전', 'もう一度挑戦', 'Play again') + '</button><button type="button" class="btn btn-line" data-act="quizExit">' +
      tr('월렛으로', 'ウォレットへ', 'Back to wallet') + '</button></div></div>';
  }

  function viewQuiz() {
    var quiz = ui.quiz;
    var total = quiz.deck.length;
    var finished = quiz.phase === 'finished';
    var round = Math.min(quiz.index + 1, total);
    var html = '<section class="quiz-game"><button type="button" class="wallet-back quiz-back" data-act="quizExit" data-key="quiz-back">' +
      icon('left', 20) + tr('월렛으로 돌아가기', 'ウォレットに戻る', 'Back to wallet') + '</button>' +
      '<header class="quiz-heading"><h1>' + quizTitle() + '</h1><div class="quiz-hud">' +
      '<span>' + tr('문제', '問題', 'Round') + ' ' + round + '/' + total + '</span><span>' +
      tr('정답', '正解', 'Correct') + ' ' + quiz.score + '/' + total + '</span></div></header>';
    if (finished) return html + quizFinale(quiz) + '</section>';

    var bag = QUIZ_ART.bag(quiz.index);
    var ready = quiz.phase === 'ready';
    var feedback = quiz.phase === 'feedback';
    html += '<div class="quiz-stage">' + QUIZ_ART.scene + (ready
      ? '<button type="button" class="quiz-bag is-arriving" data-act="quizOpenBag" data-key="quiz-bag" aria-label="' +
        tr('캐리어를 열어 문제 보기', 'スーツケースを開いて問題を見る', 'Open the suitcase for a question') + '">' +
        bag + '<span class="quiz-click" aria-hidden="true">CLICK</span></button>'
      : '<div class="quiz-bag' + (feedback ? (quiz.correct ? ' is-correct' : ' is-wrong') : '') + '" aria-hidden="true">' + bag + '</div>') + '</div>';
    if (ready) return html + '<p class="quiz-scope">' +
      tr('캐리어를 눌러 OX 퀴즈를 시작하세요. 2026년 11월 1일부터의 일본 면세 환급 제도 기준입니다.',
        'スーツケースを押して○×クイズを開始。2026年11月1日以降の日本の免税制度が対象です。',
        'Tap the suitcase for a true-or-false question. The quiz covers Japan’s refund system from November 1, 2026.') + '</p></section>';

    var question = quiz.deck[quiz.index];
    html += '<article class="quiz-panel' + (feedback ? ' quiz-feedback' : '') + '">' +
      quizMascot(feedback ? (quiz.correct ? 'happy' : 'sad') : 'neutral');
    if (feedback) {
      html += '<h2 tabindex="-1">' + (quiz.correct ? tr('정답!', '正解！', 'Correct!') : tr('아쉬워요!', '残念！', 'Not quite!')) +
        ' · ' + tr('정답은', '答えは', 'Answer:') + ' ' + (question.answer ? 'O' : 'X') + '</h2>' +
        '<p>' + esc(tr.apply(null, question.why)) + '</p>' +
        '<p class="quiz-source">' + tr('공식 출처', '公式資料', 'Official source') + ' · <a href="' + esc(question.source.url) +
        '" target="_blank" rel="noopener noreferrer">' + esc(question.source.label) + '</a></p>' +
        '<button type="button" class="btn btn-sign quiz-next" data-act="quizNext">' +
        (round === total ? tr('결과 보기', '結果を見る', 'See results') : tr('다음 캐리어', '次の荷物へ', 'Next suitcase')) + '</button>';
    } else {
      html += '<h2 tabindex="-1">' + esc(tr.apply(null, question.q)) + '</h2>' +
        '<div class="quiz-options"><button type="button" class="btn" data-act="quizAnswer" data-arg="true" aria-label="' +
        tr('O, 맞다', '○、正しい', 'O, True') + '">O</button><button type="button" class="btn" data-act="quizAnswer" data-arg="false" aria-label="' +
        tr('X, 틀리다', '×、誤り', 'X, False') + '">X</button></div>';
    }
    return html + '</article></section>';
  }

  function viewWallet() {
    if (ui.quiz) return viewQuiz();
    if (ui.pick) return viewPick();
    var p = ui.passport;
    var number = p.number ? (ui.passportRevealed ? esc(p.number) : '•••• ' + esc(p.number.slice(-4))) : '—';
    if (ui.walletGuide >= 0) {
      return '<button type="button" class="wallet-back" data-act="walletHome">' + icon('left', 21) + tr('월렛으로 돌아가기', 'ウォレットに戻る', 'Back to wallet') + '</button>' +
        '<div class="wallet-detail">' + viewGuide() + '</div>';
    }
    return '<div class="page-head"><h1 class="page-title disp">' + icon('wallet', 29) + tr('월렛', 'ウォレット', 'Wallet') + '</h1></div>' +
      mascotHint(tr('출국 전에 여권과 QR을 다시 확인해 주세요!', '出国前にパスポートとQRを確認しましょう！', 'Check your passport and QR before departure!')) +
      '<div class="wallet-stack"><section class="wallet-stack-card wallet-qr"><div class="wallet-qr-left">' +
      '<h2>' + icon('bag', 24) + tr('면세 QR 카드', '免税QRカード', 'Tax-free QR card') + '</h2>' +
      '<a class="wallet-qr-link" href="' + esc(D.qr.url) + '" target="_blank" rel="noopener noreferrer">' + tr('면세 QR 신청', '免税QRを申請', 'Apply for tax-free QR') + icon('ext', 16) + '</a></div>' +
      '<button type="button" class="wallet-qr-art" data-act="walletQR" data-key="wallet-qr" aria-haspopup="dialog" aria-label="' + tr('내 QR 이미지 열기', '保存したQR画像を開く', 'Open my QR image') + '">' +
      icon('qr', 49) + '<span>' + (ui.qr ? tr('저장됨', '保存済み', 'Saved') : tr('QR 저장', 'QRを保存', 'Save QR')) + '</span></button></section>' +
      '<details class="wallet-stack-card wallet-passport"' + (ui.passportOpen ? ' open' : '') + '><summary class="wallet-service">' +
      '<span class="wallet-guide-icon">' + icon('passport', 25) + '</span><h2>' + tr('여권 정보', 'パスポート情報', 'Passport details') + '</h2>' + icon('chevron-down',20) + '</summary>' +
      '<div class="wallet-passport-detail"><div class="passport-body"><div class="passport-sticker">' + icon('globe', 27) + '<small>PASSPORT</small></div>' +
      '<dl><div><dt>' + tr('이름', '氏名', 'Name') + '</dt><dd data-user-text>' + (p.name ? esc(p.name) : '—') + '</dd></div>' +
      '<div><dt>' + tr('여권번호', '旅券番号', 'Passport No.') + '</dt><dd data-user-text>' + number + (p.number ? '<button type="button" data-act="passportReveal" data-key="pass-reveal" class="pass-reveal" aria-label="' +
      tr('여권 번호 보이기 또는 가리기', '旅券番号を表示または非表示', 'Show or hide passport number') + '">' + (ui.passportRevealed ? '◉' : '◎') + '</button>' : '') + '</dd></div>' +
      '<div><dt>' + tr('국적', '国籍', 'Nationality') + '</dt><dd data-user-text>' + (p.country ? esc(p.country) : '—') + '</dd></div>' +
      '<div><dt>' + tr('만료일', '有効期限', 'Expiry') + '</dt><dd>' + (p.expires ? esc(ymd(p.expires)) : '—') + '</dd></div></dl></div>' +
      '<div class="wallet-passport-footer"><p class="passport-privacy">' + tr('여권 정보는 현재 브라우저 탭에서만 임시 보관합니다.', '旅券情報はこのタブでのみ一時的に保持されます。', 'Passport data is kept only for this browser tab.') + '</p>' +
      '<button type="button" class="wallet-edit" data-act="passportEdit" data-key="passport-edit">' + tr('입력 / 수정', '編集する', 'Edit passport info') + icon('right', 16) + '</button></div></div></details>' +
      '<section class="wallet-stack-card wallet-guide-service"><h2><button type="button" class="wallet-service" data-act="walletGuide" data-arg="0" data-key="wallet-guide"><span class="wallet-guide-icon">' + icon('guide', 26) + '</span>' +
      '<span>' + tr('환급 절차 가이드', '還付手続きガイド', 'Refund process guide') + '</span>' + icon('right', 20) + '</button></h2></section>' +
      '<section class="wallet-stack-card wallet-pick-service"><h2><button type="button" class="wallet-service" data-act="openPick" data-key="wallet-pick">' +
      '<span class="wallet-guide-icon">' + icon('bag', 24) + '</span><span>' + pickTitle() + '</span>' + icon('right', 20) + '</button></h2></section>' +
      '<section class="wallet-stack-card wallet-quiz-service"><h2><button type="button" class="wallet-service" data-act="openQuiz" data-key="wallet-quiz">' +
      '<span class="wallet-guide-icon">' + icon('case', 24) + '</span><span>' + quizTitle() + '</span>' + icon('right', 20) + '</button></h2></section></div>';
  }

  var VIEWS = { home: viewHome, receipts: viewReceipts, calendar: viewCalendar, departure: viewDeparture, wallet: viewWallet };

  /* ---------- 그리기 ---------- */
  function renderMemoChrome() {
    $('#memo-title').textContent = tr('일정 메모', '予定メモ', 'Schedule memo');
    $('#memo-date-label').textContent = tr('날짜', '日付', 'Date');
    $('#memo-text-label').textContent = tr('메모', 'メモ', 'Memo');
    $('#memo-text').placeholder = tr('예: 공항 가기 전 선물 사기', '例：空港に行く前にお土産を買う', 'e.g. Buy gifts before the airport');
    $('#memo-cancel').textContent = tr('취소', 'キャンセル', 'Cancel');
    $('#memo-save').textContent = tr('저장', '保存', 'Save');
    $('#memo-delete').textContent = tr('메모 삭제', 'メモを削除', 'Delete memo');
    $('#memo-close').setAttribute('aria-label', tr('닫기', '閉じる', 'Close'));
  }
  function renderChrome(c) {
    document.documentElement.setAttribute('data-theme', ui.theme);
    document.documentElement.setAttribute('lang', ui.language);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', ui.theme === 'dark' ? '#101d31' : '#ffffff');
    $('#tripchip').innerHTML = c.trip.depDate
      ? icon('plane', 15) + esc(airportValue(c.airport, 'short')) + ' <span class="num">' + esc(c.dlabel) + '</span>'
      : icon('plane', 15) + tr('여행 정보 입력', '旅程を入力', 'Add trip');
    $('.top-slogan').textContent = tr('해외여행 세금환급 도우미', '海外旅行の免税還付アシスタント', 'Travel tax refund helper');
    $('.theme-btn').setAttribute('aria-label', ui.theme === 'dark' ? tr('라이트 모드 전환', 'ライトモードに切替', 'Switch to light theme') : tr('다크 모드 전환', 'ダークモードに切替', 'Switch to dark theme'));
    $('#t-airport').innerHTML = airportSelectHTML(c.trip.airport);
    var reminderOptions = [
      ['auto', tr('자동 설정 (기본)', '自動設定（初期値）', 'Automatic (default)')],
      ['once', tr('지정 날짜에 한 번', '指定日に1回', 'Once on chosen date')],
      ['weekly', tr('지정일부터 매주 반복', '指定日から毎週', 'Repeat weekly')],
      ['monthly', tr('지정일부터 매월 반복', '指定日から毎月', 'Repeat monthly')],
      ['daily', tr('지정한 기한까지 매일 반복', '終了日まで毎日繰り返す', 'Repeat daily through end date')]
    ];
    var rm = $('#rem-mode'), valueBefore = rm.value;
    rm.innerHTML = reminderOptions.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('');
    rm.value = valueBefore || 'auto';
    syncReminderFields();

    var langButtons = document.querySelectorAll('.languages button');
    for (var j = 0; j < langButtons.length; j++) {
      langButtons[j].setAttribute('aria-pressed', String(langButtons[j].getAttribute('data-arg') === ui.language));
    }
    var bar = $('#previewbar');
    if (ui.preview === 'auto' || !c.trip.depDate) {
      bar.hidden = true;
    } else {
      bar.hidden = false;
      $('#previewtext').textContent = tr('미리보기: ', 'プレビュー: ', 'Preview: ') + localeText(D.phases[ui.preview].chip) + tr(' 시점의 화면', ' の画面', ' view');
    }
    var labels = {
      home: tr('홈', 'ホーム', 'Home'), receipts: tr('영수증', 'レシート', 'Receipts'),
      departure: tr('출국', '出国', 'Depart'), calendar: tr('캘린더', 'カレンダー', 'Calendar'), wallet: tr('월렛', 'ウォレット', 'Wallet')
    };
    $('.tabs').setAttribute('aria-label', tr('주요 메뉴', 'メインメニュー', 'Main menu'));
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      var name = tabs[i].getAttribute('data-arg');
      tabs[i].querySelector('span').textContent = labels[name];
      if (name === ui.tab) tabs[i].setAttribute('aria-current', 'page');
      else tabs[i].removeAttribute('aria-current');
    }
  }

  function render() {
    var oldScroll = $('#view').scrollTop;
    var active = document.activeElement;
    var key = active && active.getAttribute ? active.getAttribute('data-key') : '';
    var c = context();
    $('#view').innerHTML = VIEWS[ui.tab](c);
    if ($('#dlg-wallet-qr').open) renderWalletQR();
    lastPhase = c.phase;
    lastArrivalNotice = needsArrivalNotice(c.phase, c.trip);
    $('#checklist-content').innerHTML = checklistHTML(c);
    renderChrome(c);
    localizeDom($('#view'));
    localizeDom($('#dlg-checklist'));
    localizeDom($('#previewbar'));
    localizeDom($('#dlg-receipt'));
    localizeDom($('#dlg-trip'));
    localizeDom($('#dlg-passport'));
    localizeDom($('#dlg-reminder'));
    $('#view').scrollTop = oldScroll;
    var quickTrack = $('#quick-track');
    if (quickTrack && ui.quickIndex) quickTrack.scrollLeft = quickOffset(quickTrack, ui.quickIndex);
    renderMemoChrome();
    if (key) {
      /* 다시 그린 뒤에도 방금 누른 버튼에 포커스가 남게 */
      var again = document.querySelector('[data-key="' + key + '"]');
      if (again && again !== document.activeElement) {
        try { again.focus({ preventScroll: true }); } catch (e) { again.focus(); }
      }
    }
  }

  function tabFromHash() {
    var h = String(window.location.hash || '').replace('#', '');
    if (h === 'guide') {
      ui.walletGuide = 0;
      ui.guideStep = 0;
      ui.pick = null;
      ui.quiz = null;
      return 'wallet';
    }
    return TABS.indexOf(h) >= 0 ? h : '';
  }

  function canAnimate(element) {
    return typeof element.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function quickOffset(track, index) {
    return track.children[index].offsetLeft - track.firstElementChild.offsetLeft;
  }

  function updateQuickPage(track) {
    var max = track.scrollWidth - track.clientWidth;
    var index = 0;
    var nearest = Infinity;
    for (var i = 0; i < track.children.length; i++) {
      var distance = Math.abs(track.scrollLeft - Math.min(max, quickOffset(track, i)));
      if (distance < nearest) { nearest = distance; index = i; }
    }
    if (ui.quickIndex === index) return;
    ui.quickIndex = index;
    Array.from(track.children).forEach(function (tile, i) {
      tile.classList.toggle('is-current', i === index);
    });
    track.nextElementSibling.querySelectorAll('button').forEach(function (dot, i) {
      dot.setAttribute('aria-current', String(i === index));
    });
  }

  function animateMenuEntry() {
    var view = $('#view');
    if (!canAnimate(view)) return;
    Array.from(view.children).forEach(function (element, i) {
      if (element.classList.contains('departure-picker')) return;
      var startTransform = element.classList.contains('wallet-stack') ? 'none' : 'translateY(9px)';
      element.animate(
        [{ opacity: 0, transform: startTransform }, { opacity: 1, transform: 'none' }],
        { duration: 320, delay: Math.min(i * 28, 112), easing: 'cubic-bezier(.2, .8, .28, 1)', fill: 'backwards' }
      );
    });
  }

  function go(tab, fromHash) {
    if (TABS.indexOf(tab) < 0) tab = 'home';
    var view = $('#view');
    var inside = view.contains(document.activeElement);
    var changedTab = ui.tab !== tab;
    if (!fromHash || tab !== 'wallet') {
      ui.walletGuide = -1;
      ui.pick = null;
      ui.quiz = null;
    }
    if (tab === 'departure') ui.airportRevealed = false;
    ui.tab = tab;
    if (!fromHash) {
      try {
        if (window.location.hash !== '#' + tab) window.location.hash = tab;
      } catch (e) {
        /* 주소를 바꿀 수 없는 환경에서는 화면만 바꿉니다 */
      }
    }
    render();
    view.scrollTop = 0;
    if (changedTab) animateMenuEntry();
    if (inside && !view.contains(document.activeElement)) {
      try { view.focus({ preventScroll: true }); } catch (e) { view.focus(); }
    }
  }

  function toast(text, label, act) {
    var popup = $('#dlg-wallet-qr').open;
    var t = popup ? $('#wallet-qr-status') : $('#toast');
    $(popup ? '#toast' : '#wallet-qr-status').textContent = '';
    t.innerHTML = '<span>' + esc(text) + '</span>' +
      (label ? '<button type="button" class="btn-text" data-act="' + act + '">' + esc(label) + '</button>' : '');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { t.innerHTML = ''; }, label ? 7000 : 3200);
  }

  function storageMessage() {
    return tr('브라우저 저장에 실패했습니다. 이 화면을 닫으면 변경 내용이 사라질 수 있습니다.',
      'ブラウザーに保存できませんでした。この画面を閉じると変更が失われることがあります。',
      'Browser storage failed. Changes may be lost when you close this page.');
  }

  function saveWithWarning() {
    if (!save()) toast(storageMessage());
  }

  /* ---------- 입력 시트 공통 ---------- */
  function openDlg(d) {
    try {
      if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    } catch (e) {
      d.setAttribute('open', '');
    }
  }

  function closeDlg(d) {
    if (!d) return;
    try {
      if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
    } catch (e) {
      d.removeAttribute('open');
    }
  }

  function fail(msgEl, text, focusSel) {
    msgEl.textContent = text;
    var el = $(focusSel);
    if (el) el.focus();
    return false;
  }

  function indexOfReceipt(id) {
    for (var i = 0; i < state.receipts.length; i++) if (state.receipts[i].id === id) return i;
    return -1;
  }

  /* ---------- 영수증 입력 시트 (추가·수정) ----------
     ui.form에 지금 시트에서 작업 중인 내용을 둡니다.
     editId가 있으면 그 영수증을 수정하고, 없으면 새로 추가합니다.
     물품 금액(price)은 입력한 글자 그대로 들고 있다가 저장할 때 숫자로 바꿉니다. */
  function blankItem() { return { id: uid(), name: '', price: '', used: false }; }

  /* 시트에 입력한 물품 금액의 합 */
  function formTotal() {
    var sum = 0;
    ui.form.items.forEach(function (it) { sum += readYen(it.price); });
    return sum;
  }

  function renderFormItems() {
    $('#r-items').innerHTML = ui.form.items.map(function (it, i) {
      var n = i + 1;
      return '<li class="item-row">' +
        '<input class="input" id="it-name-' + i + '" data-item="' + i + '" data-field="name" type="text" maxlength="30" autocomplete="off" placeholder="' + tr('물품 이름', '品名', 'Item name') + '" aria-label="' + tr('물품 ' + n + ' 이름', '品物' + n + 'の名前', 'Item ' + n + ' name') + '" value="' + esc(it.name) + '">' +
        '<input class="input num" id="it-price-' + i + '" data-item="' + i + '" data-field="price" type="text" inputmode="numeric" autocomplete="off" placeholder="' + tr('금액', '金額', 'Price') + '" aria-label="' + tr('물품 ' + n + ' 금액', '品物' + n + 'の金額', 'Item ' + n + ' price') + '" value="' + esc(it.price) + '">' +
        '<button type="button" class="iconbtn" data-act="formDelItem" data-arg="' + i + '" aria-label="' + tr('물품 ' + n + ' 삭제', '品物' + n + 'を削除', 'Remove item ' + n) + '">' + icon('close', 20) + '</button></li>';
    }).join('');
    $('#r-add-item').hidden = ui.form.items.length >= MAX_ITEMS;
  }

  function syncForm() {
    $('#dlg-receipt-title').textContent = ui.form.editId ? tr('영수증 수정', 'レシートを編集', 'Edit receipt') : tr('영수증 추가', 'レシートを追加', 'Add receipt');
    $('#r-submit').textContent = ui.form.editId ? tr('수정 저장', '変更を保存', 'Save changes') : tr('영수증 저장', 'レシートを保存', 'Save receipt');
  }

  /* 금액을 넣는 동안 면세 대상인지 바로 계산해서 보여 줍니다 */
  function updateCalc() {
    var total = formTotal();
    var rate = +$('#r-rate').value === 8 ? 8 : 10;
    var date = $('#r-date').value;
    var fee = readYen($('#r-fee').value);
    var box = $('#r-calc');
    $('#r-items-sum').textContent = tr('합계 ', '合計 ', 'Total ') + (isNaN(total) ? '—' : yen(total));
    if (isNaN(total) || isNaN(fee)) {
      box.innerHTML = '<p class="calc-sub">' + tr('입력한 엔화 금액을 확인해 주세요.', '入力した円の金額を確認してください。', 'Check the yen amounts you entered.') + '</p>';
      return;
    }
    if (!total) {
      box.innerHTML = '<p class="calc-sub">' + tr('물품 금액을 넣으면 면세 대상인지 바로 계산합니다.', '品物の金額を入力すると免税対象か確認できます。', 'Enter item prices to check tax-free eligibility.') + '</p>';
      return;
    }
    var v = L.receiptView({ total: total, rate: rate, fee: fee, date: isISO(date) ? date : L.toISO(new Date()), consumed: false }, D.rules, '');
    if (!v.eligible) {
      var pct = Math.min(100, Math.round(v.pre * 100 / D.rules.minPreTax));
      box.innerHTML = '<p><b>아직 면세 대상이 아닙니다.</b> 세전 ' + yen(v.pre) + '이라 ' + yen(D.rules.minPreTax - v.pre) + ' 더 담아야 합니다.</p>' +
        '<div class="meter"><span style="width:' + pct + '%"></span></div>';
    } else {
      box.innerHTML = '<p>환급 예상<b class="calc-big">' + yen(v.net) + '</b></p>' +
        '<p class="calc-sub">세전 ' + yen(v.pre) + ', 출국 기한 ' + ymd(v.due) + '까지</p>' +
        '<div class="meter is-ok"><span style="width:100%"></span></div>';
    }
  }

  /* 스캔(OCR)을 붙일 때는 서버가 돌려준 결과를 이 함수에 넘기면 입력칸이 채워집니다.
     data = { store: '매장 이름', date: 'YYYY-MM-DD', total: 세금 포함 합계, tax: 소비세,
              items: [{ name: '물품 이름', price: 세금 포함 금액 }] } */
  function fillReceiptForm(data) {
    if (!data) return;
    var total = readYen(data.total);
    var tax = readYen(data.tax);
    if (data.store) $('#r-store').value = String(data.store).slice(0, 40);
    if (isISO(data.date)) $('#r-date').value = data.date;
    if (Array.isArray(data.items) && data.items.length) {
      ui.form.items = data.items.slice(0, MAX_ITEMS).map(function (it) {
        var price = readYen(it && it.price);
        return { id: uid(), name: String((it && it.name) || '').slice(0, 30), price: price ? String(price) : '', used: false };
      });
    } else if (total) {
      ui.form.items = [Object.assign(blankItem(), { price: String(total) })];
    }
    if (tax > 0 && tax < total) {
      /* 세액 비율이 8%에 가까우면 식품·음료로 봅니다 */
      var ratio = tax / (total - tax);
      $('#r-rate').value = ratio < 0.09 ? '8' : '10';
    }
    renderFormItems();
    syncForm();
    updateCalc();
  }

  /* id를 주면 그 영수증을 수정하는 시트, 없으면 새 영수증 시트 */
  function openReceipt(id) {
    var today = L.toISO(new Date());
    var i = id ? indexOfReceipt(id) : -1;
    var r = i >= 0 ? state.receipts[i] : null;
    $('#form-receipt').reset();
    $('#r-date').max = today;
    $('#r-msg').textContent = '';
    if (r) {
      ui.form = {
        editId: r.id,
        items: r.items.map(function (it) { return { id: it.id, name: it.name, price: String(it.price), used: it.used }; })
      };
      if (r.mode === 'total') {
        ui.form.items = [Object.assign(blankItem(), {
          name: tr('기존 영수증 금액', '保存済みレシートの金額', 'Existing receipt amount'),
          price: r.total ? String(r.total) : '', used: r.consumed
        })];
      }
      $('#r-store').value = r.store;
      $('#r-date').value = r.date;
      $('#r-rate').value = String(r.rate);
      $('#r-method').value = r.method;
      $('#r-fee').value = r.fee ? String(r.fee) : '';
    } else {
      ui.form = { editId: '', items: [blankItem()] };
      $('#r-date').value = today;
    }
    renderFormItems();
    syncForm();
    updateCalc();
    openDlg($('#dlg-receipt'));
    if (!r) $('#r-store').focus();
  }

  function submitReceipt(e) {
    e.preventDefault();
    var f = ui.form;
    var store = $('#r-store').value.trim();
    var date = $('#r-date').value;
    var rate = +$('#r-rate').value === 8 ? 8 : 10;
    var msg = $('#r-msg');
    var items = [];
    var total = 0;
    var fee = readYen($('#r-fee').value);
    var i;

    if (!store) return fail(msg, '매장 이름을 넣어 주세요.', '#r-store');
    if (!isISO(date)) return fail(msg, '구매일을 골라 주세요.', '#r-date');
    if (date > L.toISO(new Date())) return fail(msg, '구매일이 오늘보다 뒤입니다. 날짜를 확인해 주세요.', '#r-date');

    for (i = 0; i < f.items.length; i++) {
      var item = f.items[i];
      var name = String(item.name || '').trim();
      var price = readYen(item.price);
      if (!name && String(item.price).trim() === '') continue;
      if (!price) return fail(msg, tr('물품 금액을 1~99,999,999엔 사이의 정수로 넣어 주세요.', '品物の金額は1～99,999,999円の整数で入力してください。', 'Enter a whole-yen item price from 1 to 99,999,999.'), '#it-price-' + i);
      var n = items.length + 1;
      items.push({ id: item.id, name: name || tr('물품 ' + n, '品物 ' + n, 'Item ' + n), price: price, used: !!item.used });
      total += price;
    }
    if (!items.length) return fail(msg, tr('물품을 하나 이상 넣어 주세요.', '品物を1つ以上入力してください。', 'Enter at least one item.'), '#it-name-0');
    if (isNaN(fee)) return fail(msg, tr('수수료를 0~99,999,999엔 사이의 정수로 넣어 주세요.', '手数料は0～99,999,999円の整数で入力してください。', 'Enter a whole-yen fee from 0 to 99,999,999.'), '#r-fee');
    if (L.preTaxOf(total, rate) < D.rules.minPreTax) {
      return fail(msg, '세전 ' + yen(D.rules.minPreTax) + ' 미만이라 면세 영수증으로 저장할 수 없습니다.', '#r-add-item');
    }

    var idx = f.editId ? indexOfReceipt(f.editId) : -1;
    var old = idx >= 0 ? state.receipts[idx] : null;
    var next = cleanReceipt({
      id: old ? old.id : uid(),
      store: store, date: date, mode: 'items', total: total, rate: rate,
      method: $('#r-method').value, fee: fee,
      items: items
    });

    if (old) state.receipts[idx] = next; else state.receipts.push(next);
    var saved = save();
    closeDlg($('#dlg-receipt'));
    if (old && ui.tab === 'receipts') render(); else go('receipts');
    toast(saved ? (old ? tr('수정한 내용을 저장했습니다.', '変更を保存しました。', 'Changes saved.') :
      tr('영수증을 저장했습니다.', 'レシートを保存しました。', 'Receipt saved.')) : storageMessage());
    return true;
  }

  /* 물품 칸에 글자를 넣을 때마다 작업 중인 내용에 반영 */
  function onFormInput(e) {
    var el = e.target;
    var idx = el && el.getAttribute ? el.getAttribute('data-item') : null;
    if (idx !== null && ui.form.items[+idx]) {
      ui.form.items[+idx][el.getAttribute('data-field') === 'price' ? 'price' : 'name'] = el.value;
    }
    updateCalc();
  }

  /* 물품 칸에서 Enter: 이름 → 금액 → 다음 줄(마지막 줄이면 새 줄)로 이동. 한글 조합 중에는 건드리지 않음 */
  function onItemKey(e) {
    if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
    var el = e.target;
    var idx = el && el.getAttribute ? el.getAttribute('data-item') : null;
    if (idx === null) return;
    e.preventDefault();
    var target;
    if (el.getAttribute('data-field') === 'name') target = $('#it-price-' + idx);
    else if (+idx < ui.form.items.length - 1) target = $('#it-name-' + (+idx + 1));
    else { ACT.formAddItem(); return; }
    if (target) target.focus();
  }

  /* ---------- 여행 정보 시트 ---------- */
  function openTrip(afterArrival) {
    ui.arrivalAfterTrip = afterArrival === true;
    $('#t-airport').value = state.trip.airport;
    $('#t-date').value = state.trip.depDate;
    $('#t-time').value = state.trip.depTime;
    $('#t-msg').textContent = '';
    openDlg($('#dlg-trip'));
  }

  function submitTrip(e) {
    e.preventDefault();
    var date = $('#t-date').value;
    var time = $('#t-time').value;
    var msg = $('#t-msg');
    if (!isISO(date)) return fail(msg, '출국일을 골라 주세요.', '#t-date');
    if (!isTime(time)) return fail(msg, '출발 시각을 넣어 주세요.', '#t-time');
    var sameDeparture = state.trip.depDate === date && state.trip.depTime === time;
    state.trip = {
      airport: airportOf($('#t-airport').value).id, depDate: date, depTime: time,
      lead: sameDeparture ? state.trip.lead : 0,
      arrivalReviewed: sameDeparture && !!state.trip.arrivalReviewed
    };
    ui.preview = 'auto';
    ui.calMonth = '';
    ui.calDay = '';
    var saved = save();
    closeDlg($('#dlg-trip'));
    render();
    if (ui.arrivalAfterTrip) {
      ui.arrivalAfterTrip = false;
      openArrival();
    } else if (saved) toast(tr('여행 정보를 저장했습니다.', '旅行情報を保存しました。', 'Trip information saved.'));
    if (!saved) toast(storageMessage());
    return true;
  }

  /* ---------- 알림 일정 내보내기 ---------- */
  function exportRem() {
    var c = context();
    if (!c.rem.length) { toast(tr('활성화된 알림이 없습니다.', '有効な通知がありません。', 'No active reminders.')); return; }

    if (ui.embedded) {
      /* 다른 페이지 안에 끼워진 화면에서는 파일 저장이 막혀 있어 글자로 복사합니다 */
      var text = [tr('[면세 알림 일정]', '[免税通知予定]', '[Tax-free reminders]')].concat(c.rem.map(function (r) { return mdw(L.toISO(r.at)) + ' ' + hm(r.at) + ' ' + r.title; })).join('\n');
      var sorry = tr('복사하지 못했습니다. 일정을 길게 눌러 직접 복사해 주세요.', 'コピーできませんでした。長押ししてコピーしてください。', 'Could not copy. Long-press the schedule to copy it.');
      try {
        navigator.clipboard.writeText(text).then(function () { toast(tr('알림 일정을 복사했습니다.', '通知予定をコピーしました。', 'Reminder schedule copied.')); }, function () { toast(sorry); });
      } catch (e) {
        toast(sorry);
      }
      return;
    }

    try {
      var icsItems = c.rem.map(function (r) { return Object.assign({}, r, { at: r.anchorAt || r.at }); });
      var blob = new Blob([L.toICS(icsItems, new Date())], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'taxgo.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      toast(tr('캘린더 파일을 저장했습니다. 파일을 열어 캘린더에 추가하세요.', 'カレンダーファイルを保存しました。ファイルを開いて取り込んでください。', 'Calendar file saved. Open it to import the reminders.'));
    } catch (e) {
      toast(tr('파일을 저장하지 못했습니다.', 'ファイルを保存できませんでした。', 'Could not save the file.'));
    }
  }

  /* ---------- 버튼 동작 (data-act="이름") ---------- */
  function shiftMonth(n) {
    var cur = ui.calMonth || L.toISO(now()).slice(0, 7);
    var d = new Date(+cur.slice(0, 4), +cur.slice(5, 7) - 1 + n, 1, 12);
    ui.calMonth = d.getFullYear() + '-' + L.pad(d.getMonth() + 1);
    ui.calDay = '';
    render();
  }

  function focusEl(sel) {
    var el = $(sel);
    if (el) el.focus();
  }

  function syncReminderFields() {
    var mode = $('#rem-mode').value;
    $('#rem-date-field').hidden = mode === 'auto';
    $('#rem-until-field').hidden = mode !== 'daily';
    $('#rem-date-label').textContent = mode === 'daily'
      ? tr('반복 시작일', '繰り返し開始日', 'Repeat from')
      : tr('날짜 선택', '日付を選択', 'Choose date');
    $('#rem-until-label').textContent = tr('반복 종료일', '繰り返し終了日', 'Repeat through');
    $('#rem-until').min = $('#rem-date').value;
  }

  function selectDepartureAirport(select) {
    if (!select.value) return;
    var airport = airportOf(select.value);
    select.disabled = true;
    var picker = select.closest('.departure-picker');
    var motion = canAnimate(picker);
    function reveal() {
      if (ui.tab !== 'departure' || !picker.isConnected) return;
      state.trip.airport = airport.id;
      saveWithWarning();
      ui.airportRevealed = true;
      render();
      $('#dep-airport-title').focus({ preventScroll: true });
      if (motion) $('.departure-results').animate(
        [{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}],
        {duration: 260, easing: 'ease-out'}
      );
    }
    if (motion) {
      picker.animate([{opacity: 1, transform: 'translateY(0)'}, {opacity: 0, transform: 'translateY(-12px)'}],
        {duration: 210, easing: 'ease-in', fill: 'forwards'}).finished.then(reveal, reveal);
    } else reveal();
  }

  function playWalletPull(button, art, show) {
    var card = button.closest('.wallet-stack-card');
    if (card.classList.contains('is-lifting')) return;
    function reveal() {
      if (ui.tab !== 'wallet' || !card.isConnected) return;
      show();
    }
    if (!canAnimate(card)) { reveal(); return; }
    card.classList.add('is-lifting');
    card.insertAdjacentHTML('afterbegin', '<div class="wallet-guide-reveal" aria-hidden="true">' + art + '</div>');
    card.firstElementChild.firstElementChild.animate([
      { opacity: 1, transform: 'translate(-50%, 100%)', easing: 'ease-out' },
      { opacity: 1, transform: 'translate(-50%, 18px)', offset: 0.84 },
      { opacity: 0, transform: 'translate(-50%, 14px)' }
    ], { duration: 720, fill: 'forwards' }).finished.then(reveal, reveal);
  }

  function renderWalletScreen(selector) {
    render();
    $('#view').scrollTop = 0;
    $(selector).focus({ preventScroll: true });
    animateMenuEntry();
  }

  function drawPick(category) {
    var pick = ui.pick;
    if (!pick || pick.pending) return;
    var available = category.items.filter(function (item) { return !pick.drawn.includes(item); });
    if (!available.length) {
      available = category.items.filter(function (item) { return item !== pick.item; });
      pick.drawn = [];
    }
    var item = available[Math.floor(Math.random() * available.length)];
    pick.category = category;
    pick.pending = true;
    render();
    $('#view').scrollTop = 0;
    $('[data-key="pick-back"]').focus({ preventScroll: true });
    window.setTimeout(function () {
      if (ui.pick !== pick || ui.tab !== 'wallet') return;
      pick.item = item;
      pick.drawn.push(item);
      pick.pending = false;
      render();
      $('.pick-product').focus({ preventScroll: true });
    }, canAnimate($('#view')) ? 650 : 150);
  }

  function startQuiz() {
    var pool = QUIZ.slice();
    var deck = Array.from({ length: 5 }, function () {
      return pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    });
    ui.quiz = { deck: deck, score: 0, index: 0, phase: 'ready', loaded: [] };
    renderWalletScreen('[data-key="quiz-bag"]');
  }

  function renderQuizStep(selector) {
    render();
    var target = $(selector);
    target.focus({ preventScroll: true });
    var view = $('#view');
    var targetBox = target.getBoundingClientRect();
    var viewBox = view.getBoundingClientRect();
    if (targetBox.bottom > viewBox.bottom) view.scrollTop += targetBox.bottom - viewBox.bottom + 12;
    if (targetBox.top < viewBox.top) view.scrollTop += targetBox.top - viewBox.top - 12;
  }

  var ACT = {
    tab: function (arg) { go(arg); },
    quickPage: function (arg) {
      var track = $('#quick-track');
      track.scrollTo({ left: quickOffset(track, +arg), behavior: canAnimate(track) ? 'smooth' : 'auto' });
    },
    goReminders: function () {
      go('calendar');
      var section = $('#reminder-settings');
      if (section) { var view = $('#view'); section.focus({preventScroll:true}); view.scrollTop += section.getBoundingClientRect().top - view.getBoundingClientRect().top - 12; }
    },
    memoEdit: function (iso) {
      if (!isISO(iso)) iso = context().todayISO;
      ui.memoEdit = iso;
      $('#memo-date').value = iso;
      $('#memo-text').value = ui.memos[iso] || '';
      $('#memo-delete').hidden = !ui.memos[iso];
      $('#memo-error').textContent = '';
      renderMemoChrome();
      openDlg($('#dlg-memo'));
    },
    memoDelete: function () {
      if (!ui.memoEdit || !ui.memos[ui.memoEdit]) return;
      delete ui.memos[ui.memoEdit];
      var saved = saveMemos();
      closeDlg($('#dlg-memo')); render();
      toast(saved ? tr('일정 메모를 삭제했습니다.', '予定メモを削除しました。', 'Memo deleted.') : tr('이번 세션에만 반영됩니다.', 'このセッションのみ反映されます。', 'Applied for this session only.'));
    },
    dismissClear: function () { hideCelebration(); },
    language: function (arg) {
      if (['ko', 'ja', 'en'].indexOf(arg) < 0) return;
      ui.language = arg;
      storePreference('taxgo-ui-language', arg);
      $('#toast').textContent = '';
      render();
    },
    theme: function () {
      ui.theme = ui.theme === 'dark' ? 'light' : 'dark';
      storePreference('taxgo-ui-theme', ui.theme);
      render();
    },
    receiptFilter: function (arg) {
      ui.receiptFilter = ['all', 'ok', 'review', 'excluded'].indexOf(arg) >= 0 ? arg : 'all';
      render();
    },
    depGroup: function (arg) {
      if (['prep', 'customs', 'boarding', 'refund'].indexOf(arg) < 0) return;
      ui.depOpen[arg] = !ui.depOpen[arg];
      render();
    },
    arrival: openArrival,
    arrivalCalculate: function () {
      var selected = {};
      $('#arrival-content').querySelectorAll('input:checked').forEach(function (input) { selected[input.value] = true; });
      finishArrival(reviewedGoods(ui.arrival.rows, function (_, key) { return selected[key]; }));
      focusEl('[data-key="arrival-apply"]');
    },
    arrivalApply: function () {
      if (!ui.arrival || !ui.arrival.plan) return;
      state.trip.lead = ui.arrival.plan.hours;
      state.trip.arrivalReviewed = true;
      var saved = save();
      closeDlg($('#dlg-arrival'));
      render();
      toast(saved ? tr('출국 화면에 권장 도착 시간을 적용했습니다.', '出国画面に推奨到着時刻を適用しました。',
        'Recommended time applied to the departure screen.') : storageMessage());
    },
    arrivalCancel: function () {
      state.trip.lead = 0;
      state.trip.arrivalReviewed = false;
      var saved = save();
      closeDlg($('#dlg-arrival'));
      render();
      toast(saved ? tr('적용한 권장 시간을 취소했습니다.', '適用した推奨時刻を取り消しました。', 'Applied arrival time removed.') : storageMessage());
    },
    changeAirport: function () {
      ui.airportRevealed = false;
      render();
      focusEl('#dep-airport');
    },
    showChecklist: function () { openDlg($('#dlg-checklist')); },
    walletHome: function () {
      ui.walletGuide = -1;
      render();
      $('#view').scrollTop = 0;
      $('[data-key="wallet-guide"]').focus({ preventScroll: true });
      animateMenuEntry();
    },
    walletGuide: function (arg, button) {
      playWalletPull(button, '<div class="wallet-guide-sheet">' + icon('guide', 18) + '<span></span></div>', function () {
        ui.walletGuide = Math.max(0, Math.min(D.guide.length - 1, toInt(arg)));
        ui.guideStep = ui.walletGuide;
        renderWalletScreen('.wallet-back');
      });
    },
    openPick: function (_, button) {
      playWalletPull(button, '<div class="pick-window-preview">' + icon('bag', 40) + '</div>', function () {
        ui.pick = { category: null, item: null, pending: false, drawn: [] };
        renderWalletScreen('[data-key="pick-back"]');
      });
    },
    openQuiz: function (_, button) {
      playWalletPull(button, '<div class="quiz-window-preview">' + icon('case', 38) + '</div>', startQuiz);
    },
    quizOpenBag: function () {
      if (!ui.quiz || ui.quiz.phase !== 'ready') return;
      ui.quiz.phase = 'question';
      renderQuizStep('.quiz-panel h2');
    },
    quizAnswer: function (arg) {
      var quiz = ui.quiz;
      if (!quiz || quiz.phase !== 'question') return;
      quiz.correct = (arg === 'true') === quiz.deck[quiz.index].answer;
      if (quiz.correct) {
        quiz.score++;
        quiz.loaded.push(quiz.index);
      }
      quiz.phase = 'feedback';
      renderQuizStep('.quiz-feedback h2');
    },
    quizNext: function () {
      var quiz = ui.quiz;
      if (!quiz || quiz.phase !== 'feedback') return;
      quiz.index++;
      quiz.phase = quiz.index === quiz.deck.length ? 'finished' : 'ready';
      $('#view').scrollTop = 0;
      renderQuizStep(quiz.phase === 'finished' ? '.quiz-finale h2' : '[data-key="quiz-bag"]');
    },
    quizRestart: startQuiz,
    quizExit: function () {
      ui.quiz = null;
      renderWalletScreen('[data-key="wallet-quiz"]');
    },
    pickCategory: function (id) {
      var category = PICKS.categories.find(function (cat) { return cat.id === id; });
      if (category) drawPick(category);
    },
    pickAgain: function () { if (ui.pick && ui.pick.category) drawPick(ui.pick.category); },
    pickBack: function () {
      if (!ui.pick) return;
      if (ui.pick.category) {
        var category = ui.pick.category.id;
        ui.pick = { category: null, item: null, pending: false, drawn: [] };
        renderWalletScreen('[data-key="pick-' + category + '"]');
      } else {
        ui.pick = null;
        renderWalletScreen('[data-key="wallet-pick"]');
      }
    },
    passportEdit: function () {
      $('#p-name').value = ui.passport.name;
      $('#p-number').value = ui.passport.number;
      $('#p-country').value = ui.passport.country;
      $('#p-expires').value = ui.passport.expires;
      openDlg($('#dlg-passport'));
    },
    passportReveal: function () { ui.passportRevealed = !ui.passportRevealed; render(); },
    walletQR: function () {
      $('#wallet-qr-status').textContent = '';
      renderWalletQR();
      openDlg($('#dlg-wallet-qr'));
    },
    qrUpload: function () { if (!ui.qrBusy) { var f = $('#qr-image-input'); f.value = ''; f.click(); } },
    qrRemove: function () {
      if (ui.qrBusy) return;
      var previous = ui.qr;
      ui.qr = null;
      if (!saveQR()) {
        ui.qr = previous;
        toast(tr('QR을 삭제할 수 없습니다.', 'QRを削除できません。', 'Could not remove saved QR.'));
        return;
      }
      render();
      focusEl('[data-key="qr-upload"]');
      toast(tr('저장된 QR을 삭제했습니다.', '保存したQRを削除しました。', 'Saved QR removed.'));
    },
    qrCopy: function () {
      if (!ui.qr) return;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.qr.data).then(function () {
        toast(tr('QR 내용을 복사했습니다.', 'QRの内容をコピーしました。', 'QR contents copied.'));
      }, function () { toast(tr('복사할 수 없습니다.', 'コピーできません。', 'Copy unavailable.')); });
      else toast(tr('이 브라우저에서 복사를 지원하지 않습니다.', 'このブラウザではコピーできません。', 'Clipboard unsupported.'));
    },

    add: function () { openReceipt(''); },
    edit: function (id) { openReceipt(id); },
    trip: function () { openTrip(); },
    close: function (arg) { closeDlg(document.getElementById(arg)); },

    formAddItem: function () {
      if (ui.form.items.length >= MAX_ITEMS) return;
      ui.form.items.push(blankItem());
      renderFormItems();
      updateCalc();
      focusEl('#it-name-' + (ui.form.items.length - 1));
    },

    formDelItem: function (arg) {
      var i = toInt(arg);
      ui.form.items.splice(i, 1);
      if (!ui.form.items.length) ui.form.items.push(blankItem());
      renderFormItems();
      updateCalc();
      focusEl('#it-name-' + Math.min(i, ui.form.items.length - 1));
    },

    /* 합계만 넣은 영수증: 영수증 단위로 소비 표시 */
    consume: function (id) {
      var i = indexOfReceipt(id);
      if (i < 0) return;
      state.receipts[i].consumed = !state.receipts[i].consumed;
      saveWithWarning();
      render();
    },

    del: function (id) {
      var i = indexOfReceipt(id);
      if (i < 0) return;
      ui.undo = { r: state.receipts[i], i: i };
      state.receipts.splice(i, 1);
      var saved = save();
      render();
      toast(saved ? tr('영수증을 삭제했습니다.', 'レシートを削除しました。', 'Receipt deleted.') : storageMessage(),
        tr('되돌리기', '元に戻す', 'Undo'), 'undo');
    },

    undo: function () {
      if (!ui.undo) return;
      state.receipts.splice(Math.min(ui.undo.i, state.receipts.length), 0, ui.undo.r);
      ui.undo = null;
      var saved = save();
      render();
      toast(saved ? tr('영수증을 되돌렸습니다.', 'レシートを元に戻しました。', 'Receipt restored.') : storageMessage());
    },

    preview: function (arg) {
      ui.preview = arg;
      ui.calMonth = '';
      ui.calDay = '';
      render();
      if (ui.tab === 'home') $('#view').scrollTop = 0;
    },

    calPrev: function () { shiftMonth(-1); },
    calNext: function () { shiftMonth(1); },
    calDay: function (iso) { ui.calDay = iso; render(); },
    remEdit: function (id) {
      var base = context().remBase.filter(function (x) { return x.id === id; })[0];
      if (!base) return;
      ui.remEdit = id;
      var pref = ui.reminderPrefs.entries[id];
      $('#dlg-reminder-title').textContent = tr('알림 일정 수정', '通知予定を編集', 'Edit reminder');
      $('#rem-description').textContent = reminderLabel(base).title;
      $('#rem-mode').value = pref.mode;
      $('#rem-date').value = pref.date || L.toISO(base.at);
      $('#rem-until').value = pref.until || '';
      syncReminderFields();
      $('#rem-error').textContent = '';
      openDlg($('#dlg-reminder'));
    },
    guide: function (arg) { ui.guideStep = Math.max(0, Math.min(D.guide.length - 1, toInt(arg))); render(); },
    /* 화살표로 다음 단계에 가면 그 단계의 맨 위부터 보이게 (아래쪽에서 눌렀으니 그대로 두면 새 단계 중간에 떨어짐) */
    guideNext: function (arg) { ACT.guide(arg); $('#view').scrollTop = 0; },
    exportRem: exportRem,
    clearChecks: function () { state.checks = {}; hideCelebration(); saveWithWarning(); render(); },

    startMine: function () {
      state = emptyState();
      ui.undo = null;
      ui.preview = 'auto';
      ui.calMonth = '';
      ui.calDay = '';
      saveWithWarning();
      render();
      openTrip();
    },

    resetSample: function () {
      var removed = true;
      try {
        window.localStorage.removeItem(STORE_KEY);
        window.localStorage.removeItem(OLD_STORE_KEY);
      } catch (e) {
        removed = false;
      }
      state = sampleState();
      ui.undo = null;
      ui.preview = 'auto';
      ui.calMonth = '';
      ui.calDay = '';
      closeDlg($('#dlg-trip'));
      render();
      toast(removed ? tr('예시 데이터로 되돌렸습니다.', 'サンプルデータに戻しました。', 'Sample data restored.') : storageMessage());
    }
  };

  /* ---------- 이벤트 연결 ---------- */
  var pickGesture = null;
  $('#view').addEventListener('pointerdown', function (e) {
    var result = e.target.closest('.pick-result');
    if (!result || e.button !== 0 || e.target.closest('a, button')) return;
    pickGesture = { id: e.pointerId, x: e.clientX, y: e.clientY, result: result };
    result.setPointerCapture(e.pointerId);
  });
  $('#view').addEventListener('pointercancel', function () { pickGesture = null; });
  $('#view').addEventListener('pointerup', function (e) {
    var start = pickGesture;
    if (!start || start.id !== e.pointerId) return;
    pickGesture = null;
    var dx = Math.abs(e.clientX - start.x);
    var dy = Math.abs(e.clientY - start.y);
    if (start.result.isConnected && dx > 45 && dx > dy * 1.3) ACT.pickAgain();
  });
  $('#view').addEventListener('scroll', function (e) {
    if (e.target.id === 'quick-track') updateQuickPage(e.target);
  }, true);
  $('#view').addEventListener('toggle', function (e) {
    if (e.target.classList.contains('wallet-passport') && e.target.isConnected) {
      ui.passportOpen = e.target.open;
      if (!ui.passportOpen && ui.passportRevealed) {
        ui.passportRevealed = false;
        render();
      }
    }
  }, true);
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el) return;
    var fn = ACT[el.getAttribute('data-act')];
    if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    fn(el.getAttribute('data-arg') || '', el);
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    var kind = el && el.getAttribute ? el.getAttribute('data-change') : '';
    if (kind === 'check') {
      var i = toInt(el.getAttribute('data-arg'));
      var wasComplete = allChecked();
      if (i >= D.checklist.length) return;
      if (el.checked) state.checks[i] = true; else delete state.checks[i];
      saveWithWarning();
      render();
      if (!wasComplete && allChecked()) showCelebration();
      if (!allChecked()) hideCelebration();
    } else if (kind === 'remGlobal') {
      ui.reminderPrefs.enabled = !!el.checked;
      if (!saveReminders()) toast(storageMessage());
      render();
    } else if (kind === 'remItem') {
      var remid = el.getAttribute('data-arg');
      if (ui.reminderPrefs.enabled && ui.reminderPrefs.entries[remid]) {
        ui.reminderPrefs.entries[remid].enabled = !!el.checked;
        if (!saveReminders()) toast(storageMessage());
        render();
      }
    } else if (kind === 'airport') {
      selectDepartureAirport(el);
    } else if (kind === 'itemUsed') {
      /* 물품별 영수증에서 물품 하나를 소비로 체크하거나 풀기 (data-arg = '영수증id:물품id') */
      var parts = String(el.getAttribute('data-arg') || '').split(':');
      var ri = indexOfReceipt(parts[0]);
      if (ri < 0) return;
      var r = state.receipts[ri];
      r.items.forEach(function (it) { if (it.id === parts[1]) it.used = !!el.checked; });
      saveWithWarning();
      render();
    }
  });

  $('#form-receipt').addEventListener('input', onFormInput);
  $('#form-receipt').addEventListener('change', updateCalc);
  $('#form-receipt').addEventListener('submit', submitReceipt);
  $('#r-items').addEventListener('keydown', onItemKey);
  $('#form-trip').addEventListener('submit', submitTrip);
  $('#rem-mode').addEventListener('change', function () {
    syncReminderFields();
    $('#rem-error').textContent = '';
  });
  $('#rem-date').addEventListener('change', syncReminderFields);
  $('#form-reminder').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = ui.remEdit;
    if (!id || !ui.reminderPrefs.entries[id]) return;
    var mode = $('#rem-mode').value;
    var date = $('#rem-date').value;
    var until = $('#rem-until').value;
    if (mode !== 'auto' && !R.validISO(date)) {
      $('#rem-error').textContent = tr('올바른 날짜를 선택해 주세요.', '正しい日付を選んでください。', 'Choose a valid date.');
      $('#rem-date').focus(); return;
    }
    if (mode === 'daily' && (!R.validISO(until) || until < date)) {
      $('#rem-error').textContent = tr('시작일과 같거나 그 이후의 종료일을 선택해 주세요.', '開始日と同じ日か、それ以降の終了日を選んでください。', 'Choose an end date on or after the start date.');
      $('#rem-until').focus(); return;
    }
    ui.reminderPrefs.entries[id].mode = mode;
    ui.reminderPrefs.entries[id].date = mode === 'auto' ? '' : date;
    ui.reminderPrefs.entries[id].until = mode === 'daily' ? until : '';
    var saved = saveReminders();
    closeDlg($('#dlg-reminder'));
    render();
    toast(saved ? tr('알림 일정을 저장했습니다.', '通知予定を保存しました。', 'Reminder schedule saved.') : storageMessage());
  });

  $('#memo-date').addEventListener('change', function () {
    var iso = this.value;
    if (!isISO(iso)) return;
    ui.memoEdit = iso;
    $('#memo-text').value = ui.memos[iso] || '';
    $('#memo-delete').hidden = !ui.memos[iso];
  });
  $('#form-memo').addEventListener('submit', function (e) {
    e.preventDefault();
    var date = $('#memo-date').value, value = $('#memo-text').value.trim();
    if (!isISO(date) || !value) {
      $('#memo-error').textContent = tr('날짜와 메모를 입력해 주세요.', '日付とメモを入力してください。', 'Enter a date and a memo.');
      return;
    }
    ui.memos[date] = value.slice(0, 300);
    var saved = saveMemos();
    ui.calMonth = date.slice(0, 7); ui.calDay = date;
    closeDlg($('#dlg-memo')); render();
    toast(saved ? tr('일정 메모를 저장했습니다.', '予定メモを保存しました。', 'Schedule memo saved.') : tr('저장 공간이 없어 이번 세션에만 반영됩니다.', '保存できないためこのセッションのみ反映されます。', 'Storage unavailable; saved for this session only.'));
  });
  $('#dlg-checklist').addEventListener('close', hideCelebration);
  $('#qr-image-input').addEventListener('change', function (e) { if (e.target.files && e.target.files[0]) qrFileSelected(e.target.files[0]); });

  /* 여권 번호는 원본 환급 데이터와 분리한 sessionStorage에만 저장합니다. */
  try {
    var passportSaved = window.sessionStorage.getItem('taxgo-passport-session');
    if (passportSaved) {
      var ps = JSON.parse(passportSaved);
      if (ps && typeof ps === 'object') ui.passport = {
        name: String(ps.name || '').slice(0, 70), number: String(ps.number || '').slice(0, 30),
        country: String(ps.country || '').slice(0, 50), expires: isISO(ps.expires) ? ps.expires : ''
      };
    }
  } catch (e) { /* 세션 저장 기능을 사용할 수 없는 환경에서는 메모리에만 보관합니다 */ }
  $('#form-passport').addEventListener('submit', function (e) {
    e.preventDefault();
    ui.passport = {
      name: $('#p-name').value.trim().slice(0, 70),
      number: $('#p-number').value.trim().slice(0, 30),
      country: $('#p-country').value.trim().slice(0, 50),
      expires: isISO($('#p-expires').value) ? $('#p-expires').value : ''
    };
    ui.passportRevealed = false;
    try { window.sessionStorage.setItem('taxgo-passport-session', JSON.stringify(ui.passport)); } catch (err) { /* 세션에만 표시 */ }
    closeDlg($('#dlg-passport'));
    render();
  });


  ['#dlg-receipt', '#dlg-trip', '#dlg-passport', '#dlg-checklist', '#dlg-reminder', '#dlg-memo', '#dlg-arrival', '#dlg-wallet-qr'].forEach(function (sel) {
    var d = $(sel);
    /* 시트 바깥(어두운 부분)을 누르면 닫기 */
    d.addEventListener('click', function (e) { if (e.target === d) closeDlg(d); });
  });

  window.addEventListener('hashchange', function (e) {
    var t = tabFromHash() || (!window.location.hash ? 'home' : '');
    if (t && (t !== ui.tab || window.location.hash === '#guide')) go(t, true);
    else if (window.location.hash === '#wallet' && e.oldURL.endsWith('#guide') && ui.walletGuide >= 0) {
      ui.walletGuide = -1;
      go(t, true);
    }
  });

  /* ---------- 시작 ---------- */
  $('#r-method').innerHTML = D.methods.map(function (x) { return '<option value="' + x.id + '">' + esc(x.label) + '</option>'; }).join('');
  $('#t-airport').innerHTML = airportSelectHTML(state.trip.airport);
  ui.tab = tabFromHash() || 'home';
  render();
  animateMenuEntry();

  /* 자정이나 출발 시각에 시점별 안내를 갱신합니다. */
  function refreshPhase() {
    if (['home', 'receipts', 'departure'].indexOf(ui.tab) >= 0 && ui.preview === 'auto' &&
        !document.querySelector('dialog[open]')) {
      var phase = L.phaseOf(new Date(), state.trip);
      if (phase !== lastPhase || needsArrivalNotice(phase, state.trip) !== lastArrivalNotice) render();
    }
  }
  window.setInterval(refreshPhase, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshPhase(); });

  /* 스캔 기능을 붙일 때 쓰는 연결점 */
  window.MYGO_APP = { fillReceiptForm: fillReceiptForm, openReceipt: openReceipt };
})();
