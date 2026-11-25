from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
h=(root/'dist/index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});page.set_content(h,wait_until='domcontentloaded');page.locator('[data-act=language][data-arg=en]').click()
 for tab in ['home','receipts','departure','calendar','wallet']:
  page.locator('.tabs [data-arg='+tab+']').click()
  print('\n===',tab,'===')
  lines=[s.strip() for s in page.locator('#view').inner_text().splitlines() if __import__('re').search('[가-힣]',s)]
  print('\n'.join(lines[:80]))
  if tab=='wallet':
   for i in range(3):
    page.locator('[data-act=walletGuide][data-arg="'+str(i)+'"]').click()
    lines=[s.strip() for s in page.locator('#view').inner_text().splitlines() if __import__('re').search('[가-힣]',s)]
    print('GUIDE',i,':',lines[:45])
    page.locator('[data-act=walletHome]').click()
 b.close()
