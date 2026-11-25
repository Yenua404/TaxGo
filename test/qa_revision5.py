"""Browser checks for the v5 UI. QR import tests mock the decoder only, with a real test QR image."""
from pathlib import Path
import json, re, io, base64
import qrcode
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
shots=ROOT/'preview';shots.mkdir(exist_ok=True)
html=re.sub(r'<link[^>]+https://[^>]+>', '', (ROOT/'dist/index.html').read_text(encoding='utf-8'))
qr_payload='https://example.org/taxgo-test'
buf=io.BytesIO();qrcode.make(qr_payload).save(buf,format='PNG');qr_bytes=buf.getvalue()
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
 ctx.set_default_timeout(5000)
 page=ctx.new_page();page.on('pageerror',lambda exc: errors.append(str(exc)))
 page.route('https://**',lambda route:route.abort())
 def load(storage=None,fragment=''):
  pre='<script>window.__qaStorage='+json.dumps(storage or {},ensure_ascii=False)+';Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem(k){return Object.prototype.hasOwnProperty.call(window.__qaStorage,k)?window.__qaStorage[k]:null},setItem(k,v){window.__qaStorage[k]=String(v)},removeItem(k){delete window.__qaStorage[k]}}});'+('location.hash='+json.dumps(fragment)+';' if fragment else '')+'</script>'
  page.set_content(html.replace('<head>','<head>'+pre,1),wait_until='domcontentloaded',timeout=12000)
 def tab(name):page.locator('.tabs [data-arg='+name+']').click()
 def lang(name):page.locator('[data-act=language][data-arg='+name+']').click()
 def shot(name):
  page.locator('#toast').evaluate('(e)=>e.innerHTML=""')
  page.screenshot(path=str(shots/(name+'.png')),animations='disabled')
 load()
 # Home: every phase / language at multiple phone widths, no translated text spilling into mascot.
 for width in [320,390,430]:
  page.set_viewport_size({'width':width,'height':844})
  for language in ['ko','ja','en']:
   lang(language)
   for phase in ['shop','eve','day','after']:
    page.locator('[data-key=pv-'+phase+']').click()
    result=page.locator('.welcome-copy').evaluate('''(e)=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e),right=b.right-parseFloat(s.paddingRight),bad=[];const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.nodeValue.trim())continue;let r=document.createRange();r.selectNodeContents(n);for(let a of r.getClientRects())if(a.right>right+2||a.left<b.left-2)bad.push(n.nodeValue)}return bad}''')
    assert not result,(width,language,phase,result)
    if width==320 and language=='en' and phase=='shop':
     page.locator('#view').evaluate('(e)=>e.scrollTop=0');shot('v5-home-en-320')
    if width==390 and language=='ko' and phase=='shop':
     page.locator('#view').evaluate('(e)=>e.scrollTop=0');shot('v5-home')
   page.locator('[data-key=pv-auto]').click()
 # Responsive nav: real notch, departure center, tab switching with correct active label.
 page.set_viewport_size({'width':390,'height':844});lang('ko');tab('receipts')
 assert page.locator('.nav-surface').count()==1
 assert page.locator('.tab-departure .ic').bounding_box()['y'] < page.locator('.tab[data-arg=home] .ic').bounding_box()['y']
 assert page.locator('.receipt-item:not([open]) .receipt-line-refund').count()==3
 assert page.locator('.receipt-line-refund strong').all_inner_texts()==['¥1,500','¥0','¥3,000']
 border=page.locator('.summary-refund-highlight').evaluate('(e)=>({border:getComputedStyle(e).borderTopWidth,radius:getComputedStyle(e).borderRadius,b:e.getBoundingClientRect(),parent:e.parentElement.getBoundingClientRect()})')
 assert border['border']=='0px' and border['radius']=='0px' and abs(border['b']['top']-border['parent']['top'])<3
 assert float(page.locator('.receipt-line-main strong').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)'))>=16
 shot('v5-receipts')
 page.locator('.receipt-line').first.click();assert page.locator('.receipt-item[open]').count()==1
 page.locator('.receipt-line').first.click();assert not page.locator('.receipt-item[open]').count()
 # Font tokens apply to body, headings, buttons and Japanese language selector.
 lang('ja');assert 'Noto Sans JP' in page.locator('body').evaluate('(e)=>getComputedStyle(e).fontFamily')
 assert 'Noto Sans JP' in page.locator('.page-title').evaluate('(e)=>getComputedStyle(e).fontFamily')
 assert 'Noto Sans JP' in page.locator('[data-key=rc-add]').evaluate('(e)=>getComputedStyle(e).fontFamily')
 page.locator('[data-act=theme]').click()
 assert page.locator('.receipt-icon .ic').first.evaluate('(e)=>getComputedStyle(e).stroke')=='rgb(22, 27, 36)'
 assert page.locator('.page-title .ic').evaluate('(e)=>getComputedStyle(e).stroke')=='rgb(22, 27, 36)'
 shot('v5-receipts-ja-dark')
 tab('departure');shot('v5-departure-ja-dark');lang('en')
 assert 'system-ui' in page.locator('body').evaluate('(e)=>getComputedStyle(e).fontFamily')
 tab('wallet');lang('ko');page.locator('[data-act=theme]').click()
 # Imported QR is test data only; decoder is mocked to test UI and storage, not scan accuracy.
 page.evaluate('''payload=>{window.BarcodeDetector=class{async detect(){return [{rawValue:payload}]}}}''',qr_payload)
 page.locator('#qr-image-input').set_input_files({'name':'test-qr.png','mimeType':'image/png','buffer':qr_bytes})
 page.locator('#saved-qr-disclosure[open]').wait_for();assert page.locator('.qr-saved img').is_visible()
 page.locator('.qr-saved img').evaluate('(e)=>e.decode()')
 for width in [320,390,430]:
  page.set_viewport_size({'width':width,'height':844})
  qr=page.locator('.qr-saved img').bounding_box();box=page.locator('.wallet-qr-storage').bounding_box()
  assert qr['width']>=235 and abs(qr['x']+qr['width']/2-box['x']-box['width']/2)<1.5,(width,qr,box)
  assert abs(qr['width']-qr['height'])<1
 page.set_viewport_size({'width':390,'height':844})
 page.locator('.wallet-qr-storage').evaluate('(e)=>e.scrollIntoView({block:"start"})');shot('v5-qr-expanded')
 page.locator('.qr-disclosure-head').click();assert not page.locator('.qr-saved img').is_visible();shot('v5-qr-collapsed')
 page.locator('.qr-disclosure-head').click();assert page.locator('.qr-saved img').is_visible()
 lang('ja');assert page.locator('#saved-qr-disclosure').evaluate('(e)=>e.open')
 storage=page.evaluate('window.__qaStorage');assert json.loads(storage['taxgo-wallet-qr-v2'])['data']==qr_payload
 load(storage,'#wallet');assert not page.locator('#saved-qr-disclosure').evaluate('(e)=>e.open')
 page.locator('.qr-disclosure-head').click();assert page.locator('.qr-saved img').is_visible()
 page.locator('[data-act=qrRemove]').click();assert page.locator('.qr-upload-button').is_visible()
 assert not page.evaluate('localStorage.getItem("taxgo-wallet-qr-v2")')
 assert not errors,errors
 print('PASS v5: all phases x 3 languages x 3 widths, nav, receipt amounts, QR import UI (mock decoder), disclosure, persistence, deletion, font tokens, dark strokes. Browser errors:',errors)
 b.close()
