from pathlib import Path
import json, re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
URL='http://localhost:8765/index.html'
shots=ROOT/'preview';shots.mkdir(exist_ok=True)
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
 ctx.set_default_timeout(4000)
 page=ctx.new_page();page.on('pageerror',lambda exc:errors.append(str(exc)))
 page.route('https://**',lambda route:route.abort())
 # The sandbox disallows file and HTTP navigation. Emulate browser storage while testing the actual built document.
 html=re.sub(r'<link[^>]+https://[^>]+>', '', (ROOT/'dist/index.html').read_text(encoding='utf-8'))
 def load(storage=None, fragment=''):
  pre='<script>window.__qaStorage='+json.dumps(storage or {},ensure_ascii=False)+';Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem(k){return Object.prototype.hasOwnProperty.call(window.__qaStorage,k)?window.__qaStorage[k]:null},setItem(k,v){window.__qaStorage[k]=String(v)},removeItem(k){delete window.__qaStorage[k]}}});'+('location.hash='+json.dumps(fragment)+';' if fragment else '')+'</script>'
  page.set_content(html.replace('<head>','<head>'+pre,1),wait_until='domcontentloaded',timeout=12000)
 def reload_page():
  global page
  storage=page.evaluate('window.__qaStorage');frag=page.evaluate('location.hash');print('Reinitializing',frag, list(storage.keys()),flush=True);old=page
  page=ctx.new_page();page.on('pageerror',lambda exc:errors.append(str(exc)));load(storage,frag)
 load()
 def tab(name):page.locator('.tabs [data-arg='+name+']').click()
 def shot(name):print('screenshot',name,flush=True);page.screenshot(path=str(shots/(name+'.png')),animations='disabled')
 assert page.locator('.welcome [data-act=add]').count()==0
 for phase,n in [('shop',0),('eve',1),('day',2),('after',3)]:
  page.locator('[data-key=pv-'+phase+']').click()
  assert page.locator('.progress-step').nth(n).get_attribute('aria-current')=='step',phase
  assert page.locator('.progress-step.is-done').count()==n+(n==3)
 page.locator('[data-key=pv-shop]').click();shot('v4-home')
 page.locator('[data-key=pv-auto]').click()
 page.locator('[data-key=quick-reminders]').click()
 assert page.locator('.tabs [data-arg=calendar]').get_attribute('aria-current')=='page'
 assert page.locator('#view').evaluate('(el)=>el.scrollTop')>0
 assert page.locator('#reminder-settings').evaluate('(el)=>el.getBoundingClientRect().top')<220
 shot('v4-reminders')
 before=page.locator('.tabs').bounding_box()
 # toggle by label (hidden native input, visual switch track is the click target)
 page.locator('label:has(#rem-global) .switch-track').click()
 assert not page.locator('#rem-global').is_checked()
 print('nav before',before,'after',page.locator('.tabs').bounding_box(),'view',page.locator('#view').bounding_box(),'body scroll',page.evaluate('({x:scrollX,y:scrollY, app:document.querySelector(".app").scrollTop})')); assert page.locator('.tabs').bounding_box()==before
 assert page.locator('#view').bounding_box()['height']>500
 shot('v4-calendar-off')
 sw=page.locator('.reminder-item-toggle').first
 old=sw.locator('input').is_checked();sw.locator('.switch-track').click()
 assert page.locator('.reminder-item-toggle input').first.is_checked()!=old
 page.locator('label:has(#rem-global) .switch-track').click()
 # Add a memo for arbitrary date; verify safe HTML rendering and persistence.
 page.locator('.day').nth(9).click()
 day=page.locator('.day[aria-pressed=true]').get_attribute('data-arg')
 page.locator('[data-act=memoEdit]').click()
 page.locator('#memo-text').fill('공항 전 선물 구입 <test>')
 page.locator('#memo-save').click()
 assert page.locator('.day-memo-text').inner_text()=='공항 전 선물 구입 <test>'
 assert page.locator('.day[aria-pressed=true] .mk-memo').count()==1
 shot('v4-memo')
 reload_page();page.locator('[data-act=calDay][data-arg="'+day+'"]').click()
 assert page.locator('.day-memo-text').inner_text()=='공항 전 선물 구입 <test>'
 page.locator('[data-act=memoEdit]').click();page.locator('#memo-text').fill('새 메모');page.locator('#memo-save').click()
 assert page.locator('.day-memo-text').inner_text()=='새 메모'
 page.locator('[data-act=memoEdit]').click();page.locator('#memo-delete').click();assert page.locator('.day-memo-text').count()==0
 # receipt tier tests, seed only test browser storage
 tab('receipts');assert page.locator('[data-key=rc-add-bottom]').count()==0
 shot('v4-receipts')
 for amount,n in [(0,0),(5000,2),(30000,5),(50000,8),(100000,18)]:
  page.evaluate('''(amount)=>{ const st=JSON.parse(localStorage.getItem('taxgo-v1')||'null')||{sample:false,trip:{airport:'fuk',depDate:'2026-12-15',depTime:'15:30',lead:0},checks:{}}; st.receipts=amount?[{id:'test',store:'Test Store',date:'2026-11-24',mode:'total',total:amount,rate:10,method:'card',fee:0,consumed:false}]:[];localStorage.setItem('taxgo-v1',JSON.stringify(st)); }''',amount)
  reload_page();assert page.locator('.coin-piece').count()==n,(amount,page.locator('.coin-piece').count())
 shot('v4-coins')
 # Verify kiosk overflow for all airports, English, narrow screen.
 tab('departure');page.locator('[data-act=language][data-arg=en]').click()
 for width in [320,390,430]:
  page.set_viewport_size({'width':width,'height':844})
  for v in page.locator('#dep-airport option').evaluate_all('(els)=>els.map(e=>e.value)'):
   page.locator('#dep-airport').select_option(v)
   overflow=page.locator('.kiosk-board').evaluate('''(e)=>{const b=e.getBoundingClientRect();return [...e.querySelectorAll('p,span,li,a,h3')].filter(x=>{let r=x.getBoundingClientRect();return r.right>b.right+1||r.left<b.left-1}).map(x=>x.className)}''')
   assert not overflow,(width,v,overflow)
 page.set_viewport_size({'width':390,'height':844});page.locator('[data-act=language][data-arg=ko]').click();page.locator('#dep-airport').select_option('fuk')
 page.locator('[data-act=showChecklist]').first.click()
 for group in ['prep','customs','boarding','refund']:
  btn=page.locator('[data-key=dep-group-'+group+']')
  if btn.get_attribute('aria-expanded')!='true':btn.click()
 for i in range(7): page.locator('#chk-'+str(i)).check()
 assert page.locator('#clear-celebration').is_visible();assert page.locator('#clear-particles i').count()==26
 page.wait_for_timeout(300);shot('v4-clear')
 page.locator('#clear-celebration').click();assert not page.locator('#clear-celebration').is_visible()
 page.locator('#dlg-checklist [data-act=close]').first.click();page.locator('[data-act=showChecklist]').first.click();assert not page.locator('#clear-celebration').is_visible()
 page.locator('#chk-6').uncheck();page.locator('#chk-6').check();assert page.locator('#clear-celebration').is_visible()
 page.locator('#clear-celebration').click();page.locator('#dlg-checklist [data-act=close]').first.click()
 page.locator('[data-act=language][data-arg=ja]').click();page.locator('[data-act=theme]').click();tab('calendar');page.locator('[data-act=memoEdit]').click();assert page.locator('#memo-title').inner_text()=='予定メモ';page.locator('#memo-cancel').click()
 page.locator('#reminder-settings').scroll_into_view_if_needed();shot('v4-reminders-dark-ja')
 print('PASS: phase states, direct reminder navigation, stable bottom navigation, switches, memo CRUD/reload, coin thresholds, EN kiosk wrap at 320/390/430, celebration, JP memo UI')
 print('Browser errors:',errors);assert not errors
 b.close()
