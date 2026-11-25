/* TaxGo reminder preferences and recurrence — independent of refund/tax calculation. */
(function (root) {
  'use strict';
  var IDS = ['eve', 'day', 'refund', 'guard'];
  var MODES = ['auto', 'once', 'daily', 'weekly', 'monthly'];
  function validISO(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + 'T12:00:00');
    return !isNaN(d.getTime()) && d.getFullYear() === +s.slice(0, 4) && d.getMonth() + 1 === +s.slice(5, 7) && d.getDate() === +s.slice(8);
  }
  function clean(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var out = { enabled: raw.enabled !== false, entries: {} };
    IDS.forEach(function (id) {
      var e = raw.entries && raw.entries[id] || {};
      var date = validISO(e.date) ? e.date : '';
      var until = validISO(e.until) && date && e.until >= date ? e.until : '';
      var mode = e.mode === 'yearly' ? 'once' : e.mode;
      out.entries[id] = {
        enabled: e.enabled !== false,
        mode: MODES.indexOf(mode) >= 0 && (mode !== 'daily' || until) ? mode : 'auto',
        date: date,
        until: until
      };
    });
    return out;
  }
  function atISO(iso, original) {
    var d = new Date(iso + 'T12:00:00');
    d.setHours(original.getHours(), original.getMinutes(), 0, 0);
    return d;
  }
  function plusMonth(anchor, step) {
    var y = anchor.getFullYear();
    var m = anchor.getMonth() + step;
    var day = anchor.getDate();
    var max = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(day, max), anchor.getHours(), anchor.getMinutes());
  }
  function calendarDay(d) {
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
  }
  function onDay(date, days, anchor) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, anchor.getHours(), anchor.getMinutes());
  }
  function next(anchor, mode, now) {
    if (mode === 'auto' || mode === 'once' || anchor >= now) return new Date(anchor.getTime());
    if (mode === 'daily') {
      var day = onDay(now, 0, anchor);
      return day >= now ? day : onDay(now, 1, anchor);
    }
    if (mode === 'weekly') {
      /* Compare calendar dates so DST cannot skip a week's occurrence. */
      var n = Math.floor((calendarDay(now) - calendarDay(anchor)) / 7);
      var week = onDay(anchor, n * 7, anchor);
      return week >= now ? week : onDay(anchor, (n + 1) * 7, anchor);
    }
    var diff = (now.getFullYear() - anchor.getFullYear()) * 12 + now.getMonth() - anchor.getMonth();
    var month = plusMonth(anchor, Math.max(0, diff));
    return month >= now ? month : plusMonth(anchor, diff + 1);
  }
  function apply(base, prefs, now) {
    var config = clean(prefs);
    if (!config.enabled) return [];
    return (base || []).filter(function (r) { return config.entries[r.id] && config.entries[r.id].enabled; }).map(function (r) {
      var c = config.entries[r.id];
      var mode = c.mode !== 'auto' && c.date ? c.mode : 'auto';
      var anchor = mode === 'auto' ? new Date(r.at.getTime()) : atISO(c.date, r.at);
      var upcoming = next(anchor, mode, now);
      var until = mode === 'daily' ? atISO(c.until, anchor) : null;
      return Object.assign({}, r, {
        at: until && upcoming > until ? until : upcoming, anchorAt: anchor, mode: mode,
        repeat: ['daily', 'weekly', 'monthly'].indexOf(mode) >= 0 ? mode : '',
        untilISO: until ? c.until : ''
      });
    }).sort(function (a, b) { return a.at - b.at; });
  }
  function monthOccurrences(reminders, month) {
    var y = +month.slice(0, 4), m = +month.slice(5, 7) - 1;
    var start = new Date(y, m, 1), end = new Date(y, m + 1, 1);
    var result = [];
    (reminders || []).forEach(function (r) {
      var anchor = r.anchorAt || r.at;
      if (!r.repeat) {
        if (anchor >= start && anchor < end) result.push(Object.assign({}, r, { at: anchor }));
        return;
      }
      var current = next(anchor, r.repeat, start);
      var until = r.untilISO ? atISO(r.untilISO, anchor) : null;
      for (var guard = 0; current < end && (!until || current <= until) && guard < 35; guard++) {
        if (current >= start) result.push(Object.assign({}, r, { at: current }));
        if (r.repeat === 'monthly') {
          var diff = (current.getFullYear() - anchor.getFullYear()) * 12 + current.getMonth() - anchor.getMonth();
          current = plusMonth(anchor, diff + 1);
        } else {
          current = onDay(current, r.repeat === 'weekly' ? 7 : 1, anchor);
        }
      }
    });
    return result;
  }
  root.TAXGO_REMINDERS = { clean: clean, apply: apply, monthOccurrences: monthOccurrences, validISO: validISO };
})(typeof window !== 'undefined' ? window : globalThis);
