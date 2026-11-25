'use strict';
const assert = require('node:assert/strict');
require('../src/reminders.js');
require('../src/logic.js');
const R = globalThis.TAXGO_REMINDERS;
const L = globalThis.MYGO_LOGIC;
const at = (s) => new Date(s + 'T10:00:00');
const base = [{id:'day', title:'Before departure', body:'Check passport', at:at('2026-11-25')}];
let cases = 0;
function eq(a,b) { assert.deepEqual(a,b); cases++; }
eq(R.clean({}).enabled, true);
eq(R.clean({}).entries.day.mode, 'auto');
eq(R.validISO('2026-02-29'), false);
eq(R.validISO('2028-02-29'), true);
eq(R.validISO(['2028-02-29']), false);
eq(L.toISO(R.apply(base, R.clean({}), at('2026-11-21'))[0].at), '2026-11-25');
let prefs=R.clean({entries:{day:{mode:'once',date:'2026-12-13'}}});
eq(L.toISO(R.apply(base,prefs,at('2026-11-21'))[0].at),'2026-12-13');
prefs=R.clean({entries:{day:{mode:'weekly',date:'2026-11-01'}}});
let live=R.apply(base,prefs,at('2026-11-20'));
eq(L.toISO(live[0].at),'2026-11-22');
eq(R.monthOccurrences(live,'2026-11').length, 5);
prefs=R.clean({entries:{day:{mode:'monthly',date:'2026-01-31'}}});
live=R.apply(base,prefs,at('2026-02-06'));
eq(L.toISO(live[0].at),'2026-02-28');
eq(L.toISO(R.monthOccurrences(live,'2026-04')[0].at),'2026-04-30');
eq(L.toICS([{...live[0],at:live[0].anchorAt}],at('2026-01-01')).includes('RRULE:FREQ=MONTHLY;BYMONTHDAY=31,-1;BYSETPOS=1'),true);
prefs=R.clean({entries:{day:{mode:'yearly',date:'2024-02-29'}}});
live=R.apply(base,prefs,at('2026-02-06'));
eq(live[0].mode,'once');
eq(L.toISO(live[0].at),'2024-02-29');
eq(R.monthOccurrences(live,'2027-02').length,0);
prefs=R.clean({entries:{day:{mode:'daily',date:'2026-11-28',until:'2026-12-02'}}});
live=R.apply(base,prefs,at('2026-11-29'));
eq(L.toISO(live[0].at),'2026-11-29');
eq(R.monthOccurrences(live,'2026-11').map(r=>L.toISO(r.at)),['2026-11-28','2026-11-29','2026-11-30']);
eq(R.monthOccurrences(live,'2026-12').map(r=>L.toISO(r.at)),['2026-12-01','2026-12-02']);
eq(R.monthOccurrences(live,'2027-01').length,0);
eq(L.toISO(R.apply(base,prefs,at('2026-12-03'))[0].at),'2026-12-02');
eq(L.toICS([{...live[0],at:live[0].anchorAt}],at('2026-11-25')).includes('RRULE:FREQ=DAILY;COUNT=5'),true);
eq(R.clean({entries:{day:{mode:'daily',date:'2026-12-03',until:'2026-12-02'}}}).entries.day.mode,'auto');
eq(R.apply(base,{enabled:false},at('2026-11-21')).length,0);
eq(R.apply(base,{entries:{day:{enabled:false}}},at('2026-11-21')).length,0);
const ics=L.toICS([{id:'x',title:'Tea',body:'Prepare',at:at('2026-11-24'),repeat:'weekly'}],at('2026-11-23'));
eq(ics.includes('RRULE:FREQ=WEEKLY'),true);
eq(ics.includes('BEGIN:VALARM'),true);

const previousTZ = process.env.TZ;
try {
  process.env.TZ = 'America/New_York';
  const weekly = {entries:{day:{mode:'weekly',date:'2026-10-25'}}};
  const afterFallChange = new Date('2026-11-01T10:00:00');
  eq(R.apply(base.map(r=>({...r,at:at('2026-11-25')})),weekly,afterFallChange)[0].at,afterFallChange);

  const springBase = [{...base[0],at:new Date('2026-03-06T02:30:00')}];
  const daily = {entries:{day:{mode:'daily',date:'2026-03-06',until:'2026-03-10'}}};
  const localTimes = R.monthOccurrences(R.apply(springBase,daily,at('2026-03-06')),'2026-03');
  eq(localTimes.map(r=>[L.toISO(r.at),r.at.getHours(),r.at.getMinutes()]),[
    ['2026-03-06',2,30],['2026-03-07',2,30],['2026-03-08',3,30],['2026-03-09',2,30],['2026-03-10',2,30]
  ]);
  eq(R.apply(springBase,daily,at('2026-03-08'))[0].at,new Date('2026-03-09T02:30:00'));
} finally {
  if (previousTZ === undefined) delete process.env.TZ;
  else process.env.TZ = previousTZ;
}
console.log('ok ' + cases + ' reminder / recurrence checks');
