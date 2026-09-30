const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/index.html');
 await page.locator('#statsGrid .stat-card').first().waitFor();
 assert.equal(await page.getByText('จัดการจากศูนย์กลาง',{exact:true}).count(),0);
 assert.equal(await page.locator('#quickGrid').count(),0);
 const cards=await page.locator('#statsGrid .stat-card').all();
 for(const card of cards){
  const n=Number(await card.locator('.val').innerText());
  await card.click();
  await page.locator('#metricOverlay.show').waitFor();
  assert.equal(await page.locator('#metricList .metric-item').count(),n);
  await page.getByRole('button',{name:'ปิดรายการ',exact:true}).click();
 }
 await page.locator('#mindmapArea .focus-card').first().click();
 await page.locator('#expertiseDetail .expertise-work').first().click();
 await page.locator('#workDetailOverlay.show').waitFor();
 await page.getByRole('button',{name:'ปิดรายละเอียด',exact:true}).click();
 assert.equal(await page.locator('.field-video-box #fieldVideoPlayer').isVisible(),true);
 assert.equal(await page.locator('#fieldVideoPlayer').getAttribute('controls'),'');
 await page.locator('[data-font-level="xxlarge"]').click();
 assert.equal(await page.locator('[data-font-level="xxlarge"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.fontSize),'xxlarge');
 const out=path.resolve('../../outputs');fs.mkdirSync(out,{recursive:true});
 for(const width of [1440,900,390]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(()=>window.scrollTo(0,0));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`horizontal overflow ${width}`);
  // The portrait PNG contains transparent padding; its box is not the visible person.
  // Verify text remains in its own normal-flow column, then inspect saved screenshots.
  const textFlow=await page.evaluate(()=>{const el=document.querySelector('.hero-role'),a=el.getBoundingClientRect(),b=document.querySelector('.hero-left').getBoundingClientRect();return !['absolute','fixed'].includes(getComputedStyle(el).position)&&a.left>=b.left-1&&a.right<=b.right+1;});
  await page.screenshot({path:path.join(out,`website-v4-${width}.png`)});
  assert.equal(textFlow,true,`hero role outside normal text flow ${width}`);
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('#mindmapArea').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(out,'website-v4-expertise.png')});
 await page.route('**/admin.html',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec','http://127.0.0.1:4173/mock-api')});});
 const mockRows=[];
 await page.route('**/mock-api',async route=>{
  const b=route.request().postDataJSON();let result={status:'ok',data:[],total:0};
  if(b.action==='verifyAdminCredentials')result={status:'ok',token:'local-test-token',username:'preview-test'};
  if(b.action==='adminList')result={status:'ok',data:b.sheet==='Research'?mockRows:[],total:b.sheet==='Research'?mockRows.length:0};
  if(b.action==='create'){mockRows.push({...b.data,ID:'local-record'});result={status:'ok',id:'local-record'};}
  if(b.action==='update')Object.assign(mockRows[0],b.data);
  if(b.action==='delete')mockRows.length=0;
  await route.fulfill({json:result});
 });
 await page.goto('http://127.0.0.1:4173/admin.html');
 assert.equal(await page.locator('#adminUsername').inputValue(),'');
 await page.locator('#adminUsername').fill('preview-test');
 await page.locator('#adminPassword').fill('local-test-only');
 await page.locator('#loginScreen button').click();
 await page.locator('[data-sheet="Research"]').click();
 await page.getByRole('button',{name:'เพิ่มข้อมูล',exact:false}).click();
 await page.locator('#modalFields [data-key="Title"]').fill('ทดสอบฟอร์มในเครื่อง');
 assert.equal(await page.locator('#modalFields [data-key="Status"]').inputValue(),'draft');
 await page.locator('#modalOverlay').getByRole('button',{name:'บันทึก',exact:false}).click();
 await page.locator('#dataTable tbody tr').waitFor();
 await page.getByRole('button',{name:'แก้ไขรายการ',exact:true}).click();
 await page.locator('#modalFields [data-key="Title"]').fill('แก้ไขแล้ว');
 await page.locator('#modalOverlay').getByRole('button',{name:'บันทึก',exact:false}).click();
 await page.getByText('แก้ไขแล้ว',{exact:true}).waitFor();
 page.once('dialog',d=>d.accept());
 await page.getByRole('button',{name:'ลบรายการ',exact:true}).click();
 await page.locator('#emptyState').waitFor({state:'visible'});
 assert.equal(mockRows.length,0);
 assert.deepEqual(errors,[]);
 await browser.close();console.log('browser-v4: PASS desktop/tablet/mobile, metrics, evidence detail, floating video, login');
})().catch(e=>{console.error(e);process.exit(1)});
