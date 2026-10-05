import './styles.css';
import {industryPanel,principlePanel} from './render.js';
import {initScroll,animatePanel} from './scroll.js';
initScroll();
const toggle=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('#mobile-nav');
const trigger=document.querySelector('.nav-trigger');
const dropdown=document.querySelector('#solutions-menu');
function closeMenus(){toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Open navigation');if(mobileNav)mobileNav.hidden=true;trigger?.setAttribute('aria-expanded','false');if(dropdown)dropdown.hidden=true;}
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';closeMenus();toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');mobileNav.hidden=!open;});
trigger?.addEventListener('click',()=>{const open=trigger.getAttribute('aria-expanded')!=='true';closeMenus();trigger.setAttribute('aria-expanded',String(open));dropdown.hidden=!open;});
// Hover opens the Solutions menu on pointer devices. Touch is excluded so a
// tap still toggles rather than opening and instantly closing, and a short
// close delay lets the pointer travel the gap into the panel.
const navDropdown=trigger?.closest('.nav-dropdown');
if(navDropdown&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){
 let hoverTimer=null,hoverOpened=false;
 const openNav=()=>{clearTimeout(hoverTimer);
  if(trigger.getAttribute('aria-expanded')==='true')return;
  closeMenus();trigger.setAttribute('aria-expanded','true');dropdown.hidden=false;hoverOpened=true;};
 const closeNav=()=>{clearTimeout(hoverTimer);
  hoverTimer=setTimeout(()=>{trigger.setAttribute('aria-expanded','false');dropdown.hidden=true;hoverOpened=false;},180);};
 // A click while hover already opened it would otherwise toggle it shut.
 trigger.addEventListener('click',e=>{if(hoverOpened){e.stopImmediatePropagation();hoverOpened=false;}},true);
 navDropdown.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')openNav();});
 navDropdown.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')closeNav();});
 // Keyboard focus inside the menu keeps it open.
 navDropdown.addEventListener('focusin',()=>clearTimeout(hoverTimer));
 navDropdown.addEventListener('focusout',e=>{if(!navDropdown.contains(e.relatedTarget))closeNav();});
}
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(trigger?.getAttribute('aria-expanded')==='true')trigger.focus();else if(toggle?.getAttribute('aria-expanded')==='true')toggle.focus();closeMenus();}});
window.matchMedia('(min-width:801px)').addEventListener('change',closeMenus);
const tabs=[...document.querySelectorAll('[data-industry]')];
/* Switching industries replaces the panel's markup, which throws away the
   current <img> and starts the next one downloading from scratch. The panel
   then faded in around an image that had not decoded yet, so the photo popped
   in halfway through over the dark placeholder.

   Warming every panel's image once means the swap hits a decoded image in
   cache. Each entry resolves when its image is ready, so a switch can wait on
   exactly the one it needs. */
const warmed=new Map();
function warmPanel(i){
 if(warmed.has(i)) return warmed.get(i);
 const html=industryPanel(i);
 const src=(html.match(/<img[^>]+src="([^"]+)"/)||[])[1];
 const done=src
  ? new Promise(res=>{const im=new Image();im.onload=im.onerror=()=>res();im.src=src;})
  : Promise.resolve();
 warmed.set(i,done);
 return done;
}
tabs.forEach(t=>warmPanel(Number(t.dataset.industry)));

/* Guards against a second switch landing while the first is still settling —
   the later click wins and the earlier one is abandoned. */
let switchSeq=0;
function selectIndustry(tab){
 tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});
 const panel=document.querySelector('#industry-panel');
 const idx=Number(tab.dataset.industry);
 const seq=++switchSeq;
 const swap=()=>{
  if(seq!==switchSeq) return;
  panel.innerHTML=industryPanel(idx);
  panel.setAttribute('aria-labelledby',tab.id);
  animatePanel(panel);
 };
 // A warmed image resolves on the microtask queue, so this is not a delay in
 // practice — it only ever waits when the image genuinely is not ready.
 // Never hold the panel hostage to a slow network either: whichever of the
 // two settles first performs the swap, and `raced` keeps it to one.
 let raced=false;
 const go=()=>{if(raced) return;raced=true;swap();};
 warmPanel(idx).then(go);
 setTimeout(go,180);
}
window.__selectIndustry=i=>{const t=tabs[i];if(t&&t.getAttribute('aria-selected')!=='true')selectIndustry(t);};
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectIndustry(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%tabs.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i-1+tabs.length)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectIndustry(tabs[next]);tabs[next].focus();}});});
/* Principle tabs (company page): the same interaction as the industries
   section — click or arrow-key to select, with the panel's image warmed so
   the swap does not flash. */
const pTabs=[...document.querySelectorAll('[data-principle]')];
if(pTabs.length){
 const pWarm=new Map();
 const warmPrinciple=i=>{
  if(pWarm.has(i)) return pWarm.get(i);
  const html=principlePanel(i);
  const src=(html.match(/<img[^>]+src="([^"]+)"/)||[])[1];
  const done=src
   ? new Promise(res=>{const im=new Image();im.onload=im.onerror=()=>res();im.src=src;})
   : Promise.resolve();
  pWarm.set(i,done);
  return done;
 };
 pTabs.forEach(t=>warmPrinciple(Number(t.dataset.principle)));

 let pSeq=0;
 const selectPrinciple=tab=>{
  pTabs.forEach(t=>{const on=t===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;});
  const panel=document.querySelector('#principle-panel');
  const idx=Number(tab.dataset.principle);
  const seq=++pSeq;
  let raced=false;
  const go=()=>{
   if(raced||seq!==pSeq) return;
   raced=true;
   panel.innerHTML=principlePanel(idx);
   panel.setAttribute('aria-labelledby',tab.id);
   animatePanel(panel);
  };
  warmPrinciple(idx).then(go);
  setTimeout(go,180);
 };
 pTabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>selectPrinciple(tab));
  tab.addEventListener('keydown',e=>{
   let next;
   if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%pTabs.length;
   if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i-1+pTabs.length)%pTabs.length;
   if(e.key==='Home')next=0;
   if(e.key==='End')next=pTabs.length-1;
   if(next!==undefined){e.preventDefault();selectPrinciple(pTabs[next]);pTabs[next].focus();}
  });
 });
}

/* --- Contact form --------------------------------------------------------
   The form posts form-encoded fields to /microservice/contact on the site's
   own origin, which verifies the reCAPTCHA token, stores the enquiry and
   emails it on.

   This file carries:

     - a reCAPTCHA v3 token, minted at submit time with action "contact",
     - a honeypot field no human is shown and no screen reader announces,
     - the fill time, as `elapsed`,
     - field validation, so malformed enquiries never leave the page,
     - a five-an-hour cap per browser.

   Only the first of those is checked anywhere but here. The endpoint verifies
   the token against Google; everything else in that list is a courtesy to the
   person filling the form and a way to keep accidental noise down, not a
   control — a bot posting straight at the endpoint runs none of it.

   Worth being precise about what the token buys, because it is less than it
   looks: the endpoint reports a failed captcha but still stores and emails
   the submission, since `return` does not halt execution there. Until that
   endpoint can be changed, the captcha tells a visitor their message went
   through and tells us the score in the response, but it does not keep spam
   out of the inbox. server/platform-endpoint.txt has the detail.

   If the request fails the form falls back to the mailto: draft it used
   before the endpoint existed, so a genuine enquiry is never swallowed by a
   network error. */
/* Same-origin, so a path rather than a URL: no CORS preflight and nothing to
   configure per environment. In development Vite serves a stand-in at this
   same path (scripts/dev-contact.mjs). Override with VITE_CONTACT_ENDPOINT
   only if the site is ever served from a different host than the endpoint. */
const ENDPOINT=import.meta.env.VITE_CONTACT_ENDPOINT||'/microservice/contact';
const RECAPTCHA_KEY=import.meta.env.VITE_RECAPTCHA_SITE_KEY||'';

const form=document.querySelector('#contact-form');
if(form){
 const interest=new URLSearchParams(location.search).get('interest');
 if([...form.elements.interest.options].some(o=>o.value===interest))form.elements.interest.value=interest;

 const status=document.querySelector('#form-status');
 const submitBtn=form.querySelector('[data-submit]');
 const started=Date.now();
 let draft='';

 /* --- reCAPTCHA v3 -------------------------------------------------------
    Invisible: no checkbox and no puzzle. Google scores the session in the
    background and hands back a token, which the Worker posts to siteverify
    along with the secret key.

    The badge is hidden in CSS. Google allows that only where the disclosure
    text appears instead, which is the .recaptcha-note line under the form —
    the two have to stay together.

    The script loads only when a site key is configured, so a build without
    one still makes no third-party request. */
 const recaptchaReady=RECAPTCHA_KEY?new Promise(resolve=>{
  const s=document.createElement('script');
  s.src=`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_KEY)}`;
  s.async=true;s.defer=true;
  s.onload=()=>window.grecaptcha?.ready(()=>resolve(true));
  s.onerror=()=>resolve(false);
  document.head.appendChild(s);
 }):Promise.resolve(false);

 /* Minted at submit time, not on page load: a v3 token expires after about
    two minutes, so one taken on load would be stale by the time somebody has
    finished writing their message. The action is what lets the Worker tell a
    token meant for this form from one lifted off another page. */
 async function recaptchaToken(){
  if(!RECAPTCHA_KEY)return '';
  if(!await recaptchaReady)return '';
  try{
   return await window.grecaptcha.execute(RECAPTCHA_KEY,{action:'contact'});
  }catch{
   return '';
  }
 }

 const setStatus=(text,kind='')=>{status.textContent=text;status.dataset.kind=kind;};

 /* --- Browser-side validation --------------------------------------------
    A first pass so a person gets told about a typo without a round trip.
    Every one of these is repeated in the Worker, which is what actually
    decides: a bot posting straight at the endpoint runs none of this, so
    nothing here is relied upon.

    Each check names the field it failed on, so the message lands on the input
    rather than in a general error line. */
 const EMAIL=/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
 const linkCount=s=>(s.match(/https?:\/\/|www\./gi)||[]).length;

 function findProblem(d){
  const name=d.get('name').trim();
  const email=d.get('email').trim();
  const message=d.get('message').trim();

  if(name.length<2)return['name','Please enter your name.'];
  if(linkCount(name))return['name','Please enter a name, not a web address.'];
  if(!EMAIL.test(email))return['email','Please check your email address — it does not look complete.'];
  if(message.length<10)return['message','Please describe your project in at least 10 characters.'];
  /* Matches LIMITS.maxLinksInMessage in the Worker. If one changes, change
     the other: a browser rule that is looser than the server rule sends the
     person on a round trip to be told no. */
  if(linkCount(message)>2)return['message','That is a lot of links. Please describe the work in your own words.'];
  return null;
 }

 const flag=(field,text)=>{
  const input=form.elements[field];
  input.setCustomValidity(text);
  input.reportValidity();
  input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});
 };

 /* --- Per-browser throttle ------------------------------------------------
    Five submissions an hour, counted in this browser. It stops a person
    resubmitting because they were not sure the first one went through, which
    is the common case and the one worth handling kindly.

    It is not the rate limit. Anything stored here is the sender's to delete,
    and a bot posting at the endpoint never sees it. The endpoint counts its
    own rows and is the number that binds.

    Storage can be unavailable or throw outright — private windows, blocked
    site data — so every read and write is guarded and a failure means the
    throttle simply does not apply rather than the form breaking. */
 const THROTTLE_KEY='a1-contact-sends';
 const THROTTLE_MAX=5;
 const HOUR=3600000;

 function recentSends(){
  try{
   const raw=localStorage.getItem(THROTTLE_KEY);
   if(!raw)return [];
   const cutoff=Date.now()-HOUR;
   return JSON.parse(raw).filter(t=>typeof t==='number'&&t>cutoff);
  }catch{return [];}
 }

 function recordSend(){
  try{
   localStorage.setItem(THROTTLE_KEY,JSON.stringify([...recentSends(),Date.now()]));
  }catch{/* nothing to do; the endpoint still counts */}
 }

 const showDraft=()=>{
  document.querySelector('#email-preview').textContent=draft;
  form.hidden=true;
  const result=document.querySelector('#contact-result');
  result.hidden=false;result.focus();
  location.href=`mailto:info@a1aiagents.com?subject=${encodeURIComponent('Website inquiry: '+form.elements.interest.value)}&body=${encodeURIComponent(draft)}`;
 };

 /* Disabling the button leaves a gap: a double-click, or Enter held down, can
    fire submit twice before the first handler reaches it. This closes it. */
 let sending=false;

 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(sending)return;
  if(!form.reportValidity())return;
  const d=new FormData(form);
  const problem=findProblem(d);
  if(problem){flag(problem[0],problem[1]);return;}

  const sendTimes=recentSends();
  if(sendTimes.length>=THROTTLE_MAX){
   const waitMins=Math.max(1,Math.ceil((sendTimes[0]+HOUR-Date.now())/60000));
   setStatus(`You have sent ${THROTTLE_MAX} messages in the past hour. Please try again in about ${waitMins} minute${waitMins===1?'':'s'}, or email info@a1aiagents.com directly.`,'error');
   return;
  }
  const name=d.get('name').trim();
  const message=d.get('message').trim();
  draft=`Hello A1 AI Agents,\n\n${message}\n\nInterested in: ${d.get('interest')}\nName: ${name}\nEmail: ${d.get('email').trim()}\nCompany: ${d.get('company').trim()||'Not specified'}`;


  sending=true;
  submitBtn.disabled=true;
  setStatus('Sending your message…');
  try{
   const token=await recaptchaToken();
   if(RECAPTCHA_KEY&&!token){
    /* Google is unreachable or blocked. The Worker would refuse an empty
       token, so hand over the draft rather than failing in place. */
    setStatus('');
    showDraft();
    return;
   }

   /* Form-encoded. `website` is the honeypot and `elapsed` the fill time:
      both are sent for the Worker to judge, never acted on here. */
   const payload=new URLSearchParams({
    name,
    email:d.get('email').trim(),
    company:d.get('company').trim(),
    interest:d.get('interest'),
    message,
    website:d.get('website')||'',
    elapsed:String(Date.now()-started),
    'g-recaptcha-response':token
   });

   const res=await fetch(ENDPOINT,{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:payload
   });
   /* The endpoint answers 200 whether it accepted the enquiry or refused it,
      with the verdict in the body — a failed captcha comes back as an `error`
      field, not a status code. So the body decides, not res.ok.

      Checked against a live reply, which arrives as
        {"error":"reCAPTCHA verification failed. Please try again.",
         "success":true, "hasError":false, "contact":{...}}
      `success` and `hasError` describe the endpoint run rather than the
      enquiry, so neither can be trusted here. `error` is the field that says
      whether the submission was accepted. */
   if(!res.ok)throw new Error(`endpoint returned ${res.status}`);

   let body={};
   try{body=JSON.parse((await res.text()).trim());}catch{/* not JSON */}

   if(body.error){
    setStatus(String(body.error),'error');
    return;
   }

   recordSend();
   form.hidden=true;setStatus('');
   const sent=document.querySelector('#contact-sent');
   sent.hidden=false;sent.focus();
  }catch{
   /* Unreachable, blocked by CORS, or erroring. Rather than lose the
      enquiry, hand the visitor the same draft the site offered before the
      endpoint existed. */
   setStatus('');
   showDraft();
  }finally{
   sending=false;
   submitBtn.disabled=false;
   /* A solution is single use, so the next attempt needs a fresh challenge
      whatever happened to this one. */

  }
 });

 document.querySelector('#edit-message').addEventListener('click',()=>{document.querySelector('#contact-result').hidden=true;form.hidden=false;form.elements.name.focus();});
 document.querySelector('#copy-message').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(draft);document.querySelector('#copy-status').textContent='Message copied. Paste it into your email app to send.';}catch{document.querySelector('#copy-status').textContent='Select and copy the message above to send it from your email app.';}});
 document.querySelector('#send-another').addEventListener('click',()=>{
  document.querySelector('#contact-sent').hidden=true;
  form.reset();form.hidden=false;form.elements.name.focus();
 });
}
