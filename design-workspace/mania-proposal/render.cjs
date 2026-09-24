const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
 await page.goto('file:///'+path.join(__dirname,'proposal.html').replaceAll('\\','/'));
 await page.evaluate(()=>document.fonts.ready);
 await page.pdf({path:path.resolve(__dirname,'../../output/pdf/Mania UI Redesign Proposal.pdf'),width:'1440px',height:'1080px',printBackground:true,preferCSSPageSize:true});
 const audit=await page.evaluate(()=>[...document.querySelectorAll('.slide')].map((s,i)=>{
  const errors=[];const sr=s.getBoundingClientRect();
  s.querySelectorAll('main p,main h2,main h3,main .btn,main .field').forEach(e=>{const r=e.getBoundingClientRect(); if(r.bottom>sr.top+965 || r.right>sr.right-35)errors.push(e.textContent.slice(0,75));});
  s.querySelectorAll('.phone').forEach(p=>{const body=p.querySelector('.phonebody');if(body.getBoundingClientRect().bottom>p.getBoundingClientRect().bottom-16)errors.push('PHONE OVERFLOW '+(body.getBoundingClientRect().bottom-p.getBoundingClientRect().bottom));});
  return {page:i+1,errors};
 }));
 fs.writeFileSync(path.join(__dirname,'layout-audit.json'),JSON.stringify(audit,null,2));
 console.log(JSON.stringify(audit));
 // Static design stress checks. These do not exercise production behavior.
 await page.setViewportSize({width:320,height:850});
 await page.evaluate(()=>{
  const sample=document.querySelectorAll('.slide')[9].querySelector('.phone').cloneNode(true);
  document.body.replaceChildren(sample);
  sample.style.cssText='width:320px;height:auto;min-height:746px;overflow:visible;padding-bottom:30px';
  sample.querySelector('h2').textContent='All the Roads We Took Before the Morning Came';
  sample.querySelector('.review p').textContent=('The quiet opening won me over.\nI kept returning to the detailed percussion and the patient final track. ').repeat(50).slice(0,5000);
  const style=document.createElement('style');style.textContent='body{width:320px;background:white}.phonebody{overflow-wrap:anywhere}.review p{white-space:pre-wrap}.result-top h2{font-size:22px}.result-top>*{min-width:0}.homebar{display:none}';document.head.append(style);
 });
 const stress=await page.evaluate(()=>({width:320,documentWidth:document.documentElement.scrollWidth,reviewLength:document.querySelector('.review p').textContent.length}));
 await page.screenshot({path:path.join(__dirname,'rendered/stress-phone.png'),fullPage:true});
 fs.writeFileSync(path.join(__dirname,'stress-audit.json'),JSON.stringify(stress,null,2));
 console.log(stress);
 await browser.close();
})();
