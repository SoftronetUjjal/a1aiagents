import {gsap} from 'gsap';
import {initMetalFlow} from './metal-flow.js';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion:reduce)');
const desktop = window.matchMedia('(min-width:801px)');
const root = document.documentElement;

// Only claim the "motion" classes once we know JS is running. The stylesheet
// hides revealable elements behind these classes, so without them — no JS,
// a script error — the page renders fully visible and static.
export function initScroll(){
 // The carousel still works under reduced motion — it just doesn't advance
 // by itself. Leaving it uninitialised would strand the reader on slide one
 // with controls that do nothing.
 philosophyBand();
 headerScroll();
 if(reduced.matches){principleSlider();return;}
 root.classList.add('js-motion');
 progressBar();
 heroIntro();
 marquee();
 cardStack();
 showcase();
 principleSlider();
 agentRail();
 productsBg();
 processSteps();
 industryScroll();
 parallaxFooter();
 reveals();
 ScrollTrigger.refresh();
}

/* Thin champagne bar across the top tracking page scroll. */
function progressBar(){
 const bar=document.createElement('div');
 bar.className='scroll-progress';
 document.body.appendChild(bar);
 gsap.to(bar,{scaleX:1,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:.3}});
}

/* Hero: headline lines rise out of a mask, art drifts on scroll (parallax). */
function heroIntro(){
 const hero=document.querySelector('[data-hero]');
 if(!hero) return;

 const title=hero.querySelector('[data-hero-title]');
 const lines=title?splitLines(title):[];
 const tl=gsap.timeline({defaults:{ease:'power3.out'}});

 if(lines.length) tl.from(lines,{yPercent:115,duration:1.05,stagger:.1},.1);
 tl.from(hero.querySelectorAll('[data-hero-line]'),{y:22,opacity:0,duration:.8,stagger:.12},'-=.6');

 // The liquid-metal sheen sits behind the hero art. It bails out on its own
 // under reduced motion or without WebGL, so no guard is needed here.
 textReveal();

 const flow=hero.querySelector('[data-metal-flow]');
 if(flow) initMetalFlow(flow);

 // The overlay styling only works over the dark hero; past it the page is
 // light again and the light nav type would disappear.
 const head=document.querySelector('.header-overlay');
 if(head) ScrollTrigger.create({trigger:hero,start:'bottom top+=94',
  onEnter:()=>head.classList.add('is-solid'),
  onLeaveBack:()=>head.classList.remove('is-solid'),
  refreshPriority:-3});

 const art=hero.querySelector('[data-hero-art]');
 if(art){
  tl.from(art,{opacity:0,scale:1.06,duration:1.4,ease:'power2.out'},0);
  // Parallax: art travels slower than the page, so the hero gains depth.
  gsap.to(art,{yPercent:14,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.6}});
 }
}

/* Wrap each visual line of a heading in a mask so it can rise into view.
   Splits on <br> only — never mid-word — so text stays selectable and the
   accessible name is unchanged. */
function splitLines(el){
 const parts=el.innerHTML.split(/<br\s*\/?>/i);
 if(parts.length<2) return [];
 // Each mask is block-level, so it holds exactly one line and the original
 // <br> breaks survive. The space sits outside the inner span — it separates
 // the words for copy and for a screen reader without widening the line box
 // that the animation measures.
 el.innerHTML=parts.map((p,i)=>`<span class="line-mask">${i?' ':''}<span class="line-inner">${p.trim()}</span></span>`).join('');
 return [...el.querySelectorAll('.line-inner')];
}

/* Infinite ticker. The track holds the run twice; we scroll one run width
   then wrap, which reads as continuous movement. */
function marquee(){
 const rail=document.querySelector('[data-marquee]');
 const track=rail?.querySelector('.rail-track');
 const run=track?.querySelector('.rail-run');
 if(!track||!run) return;

 const loop=gsap.to(track,{
  x:()=>-run.offsetWidth,
  duration:22,
  ease:'none',
  repeat:-1,
  modifiers:{x:gsap.utils.unitize(x=>parseFloat(x)%run.offsetWidth)}
 });

 // Nudge speed with scroll direction, and rest when off screen.
 ScrollTrigger.create({
  trigger:rail,
  start:'top bottom',
  end:'bottom top',
  onUpdate:s=>gsap.to(loop,{timeScale:s.direction===-1?-1:1,overwrite:true,duration:.4}),
  onToggle:s=>s.isActive?loop.play():loop.pause()
 });
}

/* Height of the sticky masthead, which the pinned section sits beneath. */
function header(){
 const h=document.querySelector('.header');
 return h?h.getBoundingClientRect().height:0;
}

/* The masthead overlays a dark hero, so its type is light. Once the reader
   scrolls past that hero onto the pale sections below, light-on-light is
   unreadable — the header takes a solid dark pill from that point on.

   Driven by the hero's own height rather than a fixed offset, so it flips at
   the right moment on every page. Runs in all motion modes: this is
   legibility, not decoration. */
function headerScroll(){
 const h=document.querySelector('.header');
 if(!h) return;
 const hero=document.querySelector('.page-hero-dark,.hero');
 let queued=false;
 const apply=()=>{
  queued=false;
  // Flip once the hero has all but left the viewport behind the header.
  const limit=hero
   ? hero.offsetTop+hero.offsetHeight-h.getBoundingClientRect().height-8
   : 40;
  h.classList.toggle('is-solid',window.scrollY>Math.max(40,limit));
 };
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(apply);}};
 apply();
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule);
 ScrollTrigger.addEventListener('refresh',apply);
}

/* Pinned card stack. The section holds still while each card slides up over
   the one before, then the whole stack releases. Desktop only: on narrow
   screens the cards stay in normal document flow. */
function cardStack(){
 const wrapEl=document.querySelector('[data-stack]');
 if(!wrapEl) return;
 const cards=[...wrapEl.querySelectorAll('[data-stack-card]')];
 if(cards.length<2) return;

 ScrollTrigger.matchMedia({
  '(min-width:801px)':()=>{
   // Pin the whole section, not just the card container, so the heading
   // stays on screen above the cards for the length of the stack.
   const section=wrapEl.closest('.stack-section')||wrapEl;

   // Measure while the cards are still in normal flow — once js-stack makes
   // them absolute they all collapse onto one slot and report the same box.
   // The slot is then centred in whatever viewport space the heading leaves,
   // so an incoming card can rise into it from off-screen without the stack
   // ever hanging past the fold.
   let slot=0;
   const measure=()=>{
    root.classList.remove('js-stack');
    slot=Math.ceil(Math.max(...cards.map(c=>c.getBoundingClientRect().height)));
    root.classList.add('js-stack');
    wrapEl.style.height=slot+'px';
    // Clear the previous offset first: `above` is read from the live box, so
    // a leftover margin from an earlier measure would compound each time and
    // walk the stack down under the masthead.
    wrapEl.style.marginTop='0px';
    const above=wrapEl.getBoundingClientRect().top-section.getBoundingClientRect().top;
    // Space under the masthead once the section is pinned. The heading scrolls
    // up out of the way, so only the masthead is subtracted — counting the
    // heading too left the card hanging past the bottom of the screen.
    const free=window.innerHeight-header();
    // Centre the slot in the space the heading leaves. `free` already excludes
    // the masthead, so the halved remainder keeps the card clear of it.
    // `free` is the space under the masthead; `above` is what the heading
    // takes inside the section. What is left has to hold the card plus a
    // little breathing room, so the offset is capped by the real remainder
    // rather than a fixed number that overflowed shorter windows.
    const room=Math.max(0,free-above-slot-24);
    wrapEl.style.marginTop=Math.min(Math.max(0,(free-slot)/2),room,72)+'px';
   };
   measure();

   const tl=gsap.timeline({
    scrollTrigger:{
     trigger:section,
     start:()=>'top top+='+header(),
     // One full viewport of scroll per incoming card, so each transition
     // gets the same travel and none of them feels rushed.
     end:()=>'+='+(window.innerHeight*(cards.length-1)),
     pin:section,
     pinSpacing:true,
     scrub:.7,
     anticipatePin:1,
     invalidateOnRefresh:true,
     refreshPriority:2
    }
   });

   cards.forEach((card,i)=>{
    if(i===0) return;
    // Incoming card rises from a full card-height below; the one beneath
    // settles back and dims, which is what reads as a physical stack.
    // Start below the clipped stack window, so a waiting card is out of
    // sight until it rises into place.
    tl.fromTo(card,{y:()=>slot+80,opacity:1},{y:0,ease:'none'},i-1)
      .to(cards[i-1],{y:-16,opacity:.4,ease:'none'},i-1);
   });

   const setHeight=measure;
   ScrollTrigger.addEventListener('refreshInit',setHeight);
   return ()=>{
    root.classList.remove('js-stack');
    wrapEl.style.height='';
    gsap.set(cards,{clearProps:'all'});
    ScrollTrigger.removeEventListener('refreshInit',setHeight);
   };
  }
 });
}

/* Section reveals: headings and grouped items fade up as they enter. */
function reveals(){
 document.querySelectorAll('[data-reveal]').forEach(el=>{
  // The showcase pins at the top of the viewport, so anything inside it stops
  // moving before it could cross a reveal line — it would sit blank while the
  // section is already on screen. It is shown outright instead of revealed.
  if(el.closest('.products-showcase')){gsap.set(el,{opacity:1,y:0});return;}
  gsap.to(el,{opacity:1,y:0,duration:.85,ease:'power3.out',
   scrollTrigger:{trigger:el,start:'top 85%',once:true}});
 });

 // Items sharing a parent animate together in sequence.
 const groups=new Map();
 document.querySelectorAll('[data-reveal-item]').forEach(el=>{
  // The homepage approach steps have their own rise, handled by
  // processSteps(): they travel further and each waits for the one before it
  // rather than all five firing off a single trigger.
  if(el.hasAttribute('data-process-step')) return;
  const parent=el.parentElement;
  if(!groups.has(parent)) groups.set(parent,[]);
  groups.get(parent).push(el);
 });
 groups.forEach(items=>{
  gsap.to(items,{opacity:1,y:0,duration:.75,ease:'power3.out',stagger:.09,
   scrollTrigger:{trigger:items[0].parentElement,start:'top 82%',once:true}});
 });

 // Process step numbers count up to their value as the row arrives.
 document.querySelectorAll('[data-count]').forEach(el=>{
  const target=Number(el.dataset.count);
  if(!Number.isFinite(target)) return;
  const obj={v:0};
  gsap.to(obj,{v:target,duration:1.1,ease:'power2.out',
   onUpdate:()=>{el.textContent='0'+Math.round(obj.v);},
   scrollTrigger:{trigger:el,start:'top 88%',once:true}});
 });

 // Headings split into masked lines that rise in.
 document.querySelectorAll('[data-split]').forEach(el=>{
  const lines=splitLines(el);
  if(!lines.length) return;
  gsap.from(lines,{yPercent:110,duration:.9,ease:'power3.out',stagger:.09,
   scrollTrigger:{trigger:el,start:'top 86%',once:true}});
 });
}

// Recompute pin distances once images have settled, and on breakpoint change.
window.addEventListener('load',()=>ScrollTrigger.refresh());
desktop.addEventListener('change',()=>ScrollTrigger.refresh());

/* Crossfade the industry detail card when a different industry is picked.
   Exported so main.js can call it after it swaps the panel's markup. */
export function animatePanel(panel){
 if(reduced.matches||!panel) return;
 const body=panel.querySelector('[data-panel-body]')||panel;

 // The photograph holds its position and cross-dissolves. Sliding it 16px
 // with the rest of the content was what made the switch read as a jerk: the
 // card is the largest thing on screen, so any movement in it dominates.
 const media=body.querySelector('.industry-media');
 // Inside the media, only the text over the scrim moves, and only slightly.
 const overlay=body.querySelector('.industry-overlay');
 const copy=overlay?[...overlay.children]:[];

 gsap.killTweensOf([body,media,...copy]);
 // A switch that lands mid-tween replaces these nodes, and GSAP's last write
 // — often opacity:0 — stays on the markup as an inline style, leaving the
 // panel invisible. clearProps on completion hands the element back to the
 // stylesheet so nothing can be stranded.
 gsap.fromTo(body,{opacity:0},{opacity:1,duration:.34,ease:'power1.out',
  clearProps:'opacity'});
 if(media) gsap.fromTo(media,{scale:1.012},{scale:1,duration:.7,ease:'power2.out',
  clearProps:'transform'});
 if(copy.length) gsap.from(copy,{y:10,opacity:0,duration:.44,
  stagger:.045,ease:'power2.out',delay:.06,clearProps:'opacity,transform'});
}

/* Product showcase. The section pins, the left visual stays put and the
   right-hand steps advance one at a time while a rail fills alongside them.
   Desktop only — below 800px everything reads in normal flow. */
function showcase(){
 const el=document.querySelector('[data-showcase]');
 if(!el) return;
 const frames=[...el.querySelectorAll('[data-frame]')];
 const steps=[...el.querySelectorAll('[data-step]')];
 const fill=el.querySelector('[data-rail-fill]');
 if(steps.length<2) return;

 ScrollTrigger.matchMedia({
  '(min-width:801px)':()=>{
   // Pin the inner wrapper, not the section. Pinning the section makes GSAP
   // reserve the end distance PLUS the section's own height, and the pin
   // covers only the former — the remainder left the finished section
   // scrolling past a second time with a blank gap before it.
   const section=document.querySelector('[data-showcase-pin]')||el.closest('.products-showcase')||el;
   root.classList.add('js-showcase');
   let current=-1;
   const show=i=>{
    if(i===current) return;
    current=i;
    steps.forEach((s,n)=>s.classList.toggle('is-active',n===i));
    // Drive both sides of the crossfade here. Toggling a class alone would
    // leave the outgoing frame carrying an inline opacity from its own
    // entrance tween, so two marks would sit on top of each other.
    frames.forEach((f,n)=>{
     const on=n===i;
     f.classList.toggle('is-active',on);
     gsap.to(f,{opacity:on?1:0,y:on?0:14,duration:.45,ease:'power2.out',overwrite:'auto'});
    });
    const frame=frames[i];
    if(frame) gsap.fromTo(frame,{y:18},{y:0,duration:.5,ease:'power2.out',overwrite:'auto'});
   };
   show(0);

   const st=ScrollTrigger.create({
    trigger:section,
    // Pins earlier in the page must be measured first, or this one's start is
    // computed against a layout that later shifts, engaging the pin before
    // its own spacer and leaving the remainder as orphaned scroll after it.
    refreshPriority:-1,
    start:()=>'top top+='+header(),
    // Hold the pin for the whole run, including the last step, so the
    // section never scrolls out from under the heading while a step is
    // still being read.
    // pinSpacing reserves this distance PLUS the pinned element's height, so
    // that height is subtracted here — otherwise the surplus is scroll the
    // pin never covers, and the finished section drifts through it again
    // after a blank gap.
    end:()=>'+='+(window.innerHeight*(steps.length-1)),
    pin:section,
    pinSpacing:true,
    scrub:.6,
    anticipatePin:1,
    invalidateOnRefresh:true,
    onUpdate:s=>{
     // Each step owns an equal slice of the pinned scroll. Nudged by half a
     // slice so a step becomes active as it reaches the middle of its slice,
     // which keeps the switch in step with what the reader sees.
     // The run is divided into one slice per step. Each step is active for
     // its own slice, and the last slice doubles as a rest before the
     // section unpins, so the final product is not cut short.
     const slice=1/steps.length;
     const i=gsap.utils.clamp(0,steps.length-1,Math.floor(s.progress/slice));
     show(i);
     // The rail reads as progress through the steps, not through the pin.
     const railP=gsap.utils.clamp(0,1,(i+ (s.progress-i*slice)/slice)/(steps.length-1));
     if(fill) gsap.set(fill,{height:(railP*100)+'%'});
    }
   });
   return ()=>{
    st.kill();
    root.classList.remove('js-showcase');
    frames.forEach((f,n)=>{f.classList.toggle('is-active',n===0);gsap.set(f,{clearProps:'opacity,transform'});});
    steps.forEach(s=>s.classList.add('is-active'));
    if(fill) gsap.set(fill,{clearProps:'height'});
   };
  }
 });
}

/* Text Reveallo — the hero headline reveals word by word as the page scrolls.
   Words start in the dim champagne gradient and turn solid white in sequence;
   scrolling back up reverses it. The hero pins for the duration because it
   sits at the top of the page and would otherwise have almost no scroll
   distance to play over. Desktop only, and skipped under reduced motion. */
function textReveal(){
 const title=document.querySelector('[data-hero-title]');
 const hero=document.querySelector('[data-hero]');
 if(!title||!hero||reduced.matches) return;

 // Wrap each word. The gradient lives on the h1 via background-clip, so a
 // word can only take its own colour once it is its own element.
 const words=[];
 title.querySelectorAll('.line-inner').forEach(line=>{
  const frag=document.createDocumentFragment();
  line.textContent.split(/(\s+)/).forEach(tok=>{
   if(!tok.trim()){frag.appendChild(document.createTextNode(tok));return;}
   const w=document.createElement('span');
   w.className='reveal-word';
   w.textContent=tok;
   frag.appendChild(w);
   words.push(w);
  });
  line.textContent='';
  line.appendChild(frag);
 });
 if(!words.length) return;

 root.classList.add('js-reveal');

 // No pin: the hero sits under a fixed header, and a pin spacer displaced
 // both the header and the page top. The reveal is driven directly by scroll
 // position over the hero's own exit instead, which needs no extra height.
 ScrollTrigger.matchMedia({'(min-width:901px)':()=>{
  const st=ScrollTrigger.create({
   trigger:hero,
   start:'top top',
   end:()=>'+='+Math.round(window.innerHeight*.2),
   scrub:.4,
   invalidateOnRefresh:true,
   onUpdate:s=>{
    const p=gsap.utils.clamp(0,1,s.progress/.92);
    const lit=p*words.length;
    words.forEach((w,i)=>w.classList.toggle('is-lit',i<lit));
   }
  });
  return ()=>{st.kill();words.forEach(w=>w.classList.remove('is-lit'));};
 }});
}

/* The products section's background photograph drifts against the page as the
   section crosses the viewport. The layer is oversized top and bottom so the
   travel never exposes an edge. Skipped under reduced motion. */
function productsBg(){
 const bg=document.querySelector('[data-products-bg]');
 const section=bg&&bg.closest('.products-showcase');
 if(!bg||!section||reduced.matches) return;
 gsap.fromTo(bg,{yPercent:-8},{yPercent:8,ease:'none',
  scrollTrigger:{trigger:section.closest('.pin-spacer')||section,
   start:'top bottom',end:'bottom top',scrub:.6,
   invalidateOnRefresh:true,refreshPriority:-1}});
}

/* The philosophy background is a position:fixed layer, so it escapes the
   section's overflow:hidden and spans the full viewport width on any screen.
   The trade-off is that fixed layers ignore the document flow, so the band it
   paints has to be clipped to wherever the section currently sits. These two
   custom properties carry that band, recomputed on scroll and resize.

   This runs under reduced motion as well: it is not an animation, it is what
   makes the background visible at all. */
function fixedBand(selector,prefix,usePinSpacer){
 fixedBandEl(document.querySelector(selector),prefix,usePinSpacer);
}
function fixedBandEl(sec,prefix,usePinSpacer){
 if(!sec) return;
 let queued=false;
 const apply=()=>{
  queued=false;
  // A pinned section reports the viewport while it is held, so its own box
  // stops describing the band the reader is travelling through. The spacer
  // keeps the full range.
  const box=usePinSpacer?(sec.closest('.pin-spacer')||sec):sec;
  const r=box.getBoundingClientRect();
  const vh=window.innerHeight;
  // Distance from each viewport edge to the section, never negative: an inset
  // below zero would expand the clip rather than tighten it.
  sec.style.setProperty('--'+prefix+'-top',Math.max(0,r.top)+'px');
  sec.style.setProperty('--'+prefix+'-bottom',Math.max(0,vh-r.bottom)+'px');
 };
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(apply);}};
 apply();
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule);
 ScrollTrigger.addEventListener('refresh',apply);
}
function philosophyBand(){
 fixedBand('.philosophy-carousel','phil');
 fixedBand('.process-feature','appr');
 // The inner pages' dark hero uses the same fixed-layer treatment.
 fixedBand('.page-hero-dark','ph');
 fixedBand('.philosophy-tabs','ptab');
 fixedBand('.products-light','plight');
 fixedBand('.product-stack','pstack',true);
 // Shared surfaces: several sections can carry each class, so every match
 // gets its own tracker rather than only the first.
 document.querySelectorAll('.bg-light-a').forEach((el,i)=>fixedBandEl(el,'bga'));
 document.querySelectorAll('.bg-light-b').forEach(el=>fixedBandEl(el,'bgb'));
 document.querySelectorAll('.bg-dark-a').forEach(el=>fixedBandEl(el,'bgd'));
}

/* The homepage approach steps rise one by one as the section arrives.

   A longer travel and a per-item stagger off a single section-level trigger,
   so they read as a sequence rather than five things appearing at once. The
   stylesheet holds them down via .js-motion, which means they stay visible
   with no JS rather than stranded at opacity 0. */
function processSteps(){
 const list=document.querySelector('[data-process-steps]');
 if(!list) return;
 const steps=[...list.querySelectorAll('[data-process-step]')];
 if(!steps.length) return;
 if(reduced.matches){gsap.set(steps,{opacity:1,y:0});return;}
 // Trigger off the section, not the list, and wait until it is genuinely on
 // screen: 'top 84%' on the list fired while the section had barely crossed
 // the bottom edge, so the steps had finished rising before the reader ever
 // saw them. 'top 45%' holds until the section fills the lower half of the
 // viewport, which is the point at which it reads as having arrived.
 const section=list.closest('.process-feature')||list;
 gsap.to(steps,{opacity:1,y:0,duration:.72,ease:'power3.out',stagger:.14,
  scrollTrigger:{trigger:section,start:'top 45%',once:true,
   // This section sits below several pinned ones. Their spacers only reach
   // full height once those triggers have been measured, so a start computed
   // before that lands far too high on the page and the steps had already
   // finished rising by the time the section arrived. A negative priority
   // puts this measurement last, and invalidateOnRefresh recomputes it on
   // every resize rather than trusting the first value.
   refreshPriority:-3,invalidateOnRefresh:true}});
}

/* The industries section pins while each tab becomes active in turn, then
   releases. Desktop only: on a phone the pin fights the address-bar resize,
   and the tabs remain tappable there instead. */
function industryScroll(){
 const section=document.querySelector('.industries-section');
 const tabs=[...document.querySelectorAll('[data-industry]')];
 if(!section||tabs.length<2) return;

 // The section scrolls normally — no pin, no scroll hijacking. Without one,
 // scroll position can no longer advance the tabs, so they rotate on their
 // own while the section is in view. Any click or keypress stops the rotation
 // for good: once the reader is choosing, the section should stay put.
 if(reduced.matches) return;
 let timer=0,stopped=false,i=0;
 const stop=()=>{stopped=true;clearInterval(timer);timer=0;};
 const tick=()=>{
  if(stopped) return;
  i=(i+1)%tabs.length;
  window.__selectIndustry&&window.__selectIndustry(i);
 };
 const run=on=>{
  if(stopped) return;
  if(on&&!timer) timer=setInterval(tick,3800);
  else if(!on&&timer){clearInterval(timer);timer=0;}
 };
 tabs.forEach((t,n)=>{
  t.addEventListener('click',()=>{i=n;stop();});
  t.addEventListener('keydown',stop);
 });
 // Only rotate while the section is actually on screen.
 if('IntersectionObserver' in window){
  new IntersectionObserver(es=>run(es[0].isIntersecting),{threshold:.35})
   .observe(section);
 }
 // Pause with the tab hidden rather than racing through industries unseen.
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden) run(false);
  else if(section.getBoundingClientRect().top<window.innerHeight) run(true);
 });
}

/* The agent rail: the section pins and the cards travel sideways as the page
   scrolls down. Desktop only — on a phone the pin fights the address-bar
   resize, so the track stays a normal swipeable scroller. The distance is
   measured from the real overflow so it always lands on the last card. */
function agentRail(){
 const section=document.querySelector('[data-rail]');
 const track=document.querySelector('[data-rail-track]');
 if(!section||!track) return;
 ScrollTrigger.matchMedia({'(min-width:901px)':()=>{
  section.classList.add('js-rail-on');
  root.classList.add('js-rail');
  const col=track.parentElement;
 const distance=()=>Math.max(0,track.scrollWidth-col.clientWidth);
  if(!distance()) return ()=>{section.classList.remove('js-rail-on');root.classList.remove('js-rail');};
  // A timeline rather than a bare tween: the track travels, then a hold keeps
  // the section pinned for a beat so the last card can actually be read
  // before the page moves on. Remapping progress in onUpdate fought the
  // tween and released the pin early.
  const REST=()=>Math.round(window.innerHeight*.5);
  const tween=gsap.timeline({
   scrollTrigger:{trigger:section,start:'top top',
    end:()=>'+='+(distance()+REST()),
    pin:true,scrub:.6,anticipatePin:1,invalidateOnRefresh:true,
    refreshPriority:1}})
   .to(track,{x:()=>-distance(),ease:'none',duration:()=>distance()})
   .to({},{duration:()=>REST()});
  return ()=>{tween.scrollTrigger&&tween.scrollTrigger.kill();tween.kill();
   gsap.set(track,{clearProps:'transform'});
   section.classList.remove('js-rail-on');root.classList.remove('js-rail');};
 }});
}

/* The CTA lifts away as the footer is revealed behind it, and its photograph
   drifts at a slower rate for depth. Desktop only: on a phone the sticky
   footer fights the address-bar resize, so both sections just stack. */
function parallaxFooter(){
 const cta=document.querySelector('[data-parallax]');
 const foot=document.querySelector('[data-footer]');
 if(!cta||!foot) return;
 ScrollTrigger.matchMedia({'(min-width:901px)':()=>{
  root.classList.add('js-parallax');
  // The footer starts tucked up behind the CTA and slides down into place as
  // the CTA scrolls away, so the footer appears from underneath it. The
  // offset is capped at the footer's own height so nothing is left hanging.
  // A modest lift. The footer is taller than the viewport and sits at the very
  // end of the page, so there is little scroll left to recover a large offset
  // — an ambitious lift simply strands it. The reveal reads as the footer
  // easing up into place rather than travelling a long way.
  const lift=()=>Math.round(Math.min(foot.offsetHeight*.28,window.innerHeight*.22));
  // The travel has to happen while the footer is actually on screen. Driven
  // off the CTA's pass it finished at ~95% of the page, with the footer still
  // several hundred pixels below the fold — the movement was over before the
  // reader could see any of it.
  //
  // Anchored to the footer itself instead: it starts lifted as its top edge
  // reaches the bottom of the viewport and settles once it is properly in
  // view, so the whole travel is visible.
  // The end has to be reachable: the page stops scrolling once the footer's
  // bottom meets the viewport bottom, so an end the reader can never scroll
  // to leaves the footer stranded part-way through its travel. 'bottom
  // bottom' is exactly the last scroll position that exists, so the footer
  // always arrives at rest.
  gsap.fromTo(foot,{y:()=>lift()},{y:0,ease:'none',scrollTrigger:{
   trigger:foot,start:'top bottom',end:()=>'+='+Math.max(1,foot.offsetTop
    +foot.offsetHeight-window.innerHeight-(foot.offsetTop-window.innerHeight)-lift()),
   scrub:.6,invalidateOnRefresh:true,refreshPriority:-2}});
  const media=cta.querySelector('[data-parallax-media]');
  if(media) gsap.fromTo(media,{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{
   trigger:cta,start:'top bottom',end:'bottom top',scrub:true,
   invalidateOnRefresh:true,refreshPriority:-2}});
  return ()=>root.classList.remove('js-parallax');
 }});

 // The watermark rises and fades in as the footer arrives. This runs at every
 // width — the reveal above is desktop-only, but the mark is on show on a
 // phone too. GSAP's yPercent composes with the -50% centring in the
 // stylesheet, so the mark stays centred while it travels.
 const mark=foot.querySelector('.footer-mark');
 if(mark) gsap.fromTo(mark,{yPercent:-50+38,opacity:0},
  {yPercent:-50,opacity:1,ease:'power2.out',duration:1.1,
   // Trigger on the mark, not the footer: the footer is tall enough that its
   // top crosses the viewport long before the mark is anywhere near view,
   // which would run the animation off-screen.
   scrollTrigger:{trigger:mark,start:'top 95%',once:true}});
}

/* Principles carousel. Advances on its own and yields to the reader: drag
   with a mouse, swipe on touch, the arrow keys, or the buttons below the
   card. Autoplay runs continuously — hovering or focusing no longer pauses
   it — and the progress strip below the card drives it: each slide changes
   the moment its segment finishes filling. It still stands down during a
   drag, while the page is hidden, and under reduced motion. */
function principleSlider(){
 const root_=document.querySelector('[data-slider]');
 if(!root_) return;
 const viewport=root_.querySelector('[data-slider-viewport]');
 const track=root_.querySelector('[data-slider-track]');
 const real=[...root_.querySelectorAll('[data-slide]')];
 const status=root_.querySelector('[data-slider-status]');
 const bars=[...root_.querySelectorAll('[data-bar-fill]')];
 const n=real.length;
 if(n<2) return;

 const DELAY=5000;

 // True loop: a clone of the last slide sits before the first and a clone of
 // the first sits after the last. The track only ever moves forward, and when
 // it lands on a clone we jump to the matching real slide with the animation
 // off — so the seam is invisible and it never rewinds through every card.
 // Enough clones to fill the visible run. One tail clone is fine when a
 // single card shows at a time, but a slider showing several (the agent cards
 // show three) runs out of slides near the end and leaves empty space on the
 // right. `perView` is measured from the live layout, so it follows the
 // breakpoints.
 const slideBox=()=>{
  const el=real[0];
  const w=el.getBoundingClientRect().width;
  const g=parseFloat(getComputedStyle(track).columnGap||getComputedStyle(track).gap)||0;
  return {w,g,step:w+g};
 };
 const perView=Math.max(1,Math.round(viewport.clientWidth/slideBox().step));
 const clone=el=>{
  const c=el.cloneNode(true);
  c.setAttribute('aria-hidden','true');
  c.removeAttribute('data-slide');
  c.querySelectorAll('a,button').forEach(x=>x.tabIndex=-1);
  return c;
 };
 // One leading clone keeps the backward step seamless; `perView` trailing
 // clones keep the forward run full right through the wrap.
 track.insertBefore(clone(real[n-1]),real[0]);
 for(let i=0;i<perView;i++) track.appendChild(clone(real[i%n]));

 // pos counts the clones: pos 0 is the head clone, 1..n the real slides.
 let index=0, pos=1, paused=false, barTween=null, animating=false;
 // One step is one slide, not one viewport. A slider showing several cards at
 // once (the agent cards show three) would otherwise jump nearly a full set
 // per click and run the track into empty space. Measured from the live box
 // so it stays correct through resizes and breakpoint changes.
 // Measured from a real slide rather than track.children[0], which is a
 // clone — and from the live box, so it follows resizes and breakpoints.
 const width=()=>slideBox().step;
 const place=(animate,done)=>{
  gsap.to(track,{x:-pos*width(),duration:animate?.6:0,ease:'power3.out',overwrite:true,
   onComplete:()=>{animating=false;done&&done();}});
 };

 const runBar=()=>{
  barTween&&barTween.kill();
  // Segments before the current one read as done and the rest as not begun,
  // so the strip reads as one bar filling across the whole set.
  bars.forEach((f,i)=>{if(i!==index)gsap.set(f,{width:i<index?'100%':'0%'});});
  const bar=bars[index];
  if(!bar) return;
  gsap.set(bar,{width:'0%'});
  if(paused||reduced.matches||document.hidden) return;
  // The bar is the clock: the slide changes when the segment finishes.
  barTween=gsap.to(bar,{width:'100%',duration:DELAY/1000,ease:'none',
   onComplete:()=>{
    if(paused||reduced.matches||document.hidden) return;
    // move() refuses while a slide is still travelling. Rather than drop the
    // turn and stall autoplay for good, wait out the animation and go then.
    if(animating) return gsap.delayedCall(.2,()=>{if(!paused&&!document.hidden)move(1);});
    move(1);
   }});
 };

 const paint=()=>{
  real.forEach((s,i)=>{
   s.setAttribute('aria-hidden',String(i!==index));
   s.querySelectorAll('a,button').forEach(el=>el.tabIndex=i===index?0:-1);
  });
  if(status) status.textContent=`${index+1} of ${n}`;
 };

 // step:+1/-1 moves one slide, continuing past the ends onto a clone and
 // then snapping back to the real slide at the same visual position.
 const move=step=>{
  if(animating) return;
  animating=true;
  pos+=step;
  index=(index+step+n)%n;
  paint();
  place(true,()=>{
   if(pos===0){pos=n;place(false);}
   else if(pos===n+1){pos=1;place(false);}
  });
  runBar();
 };

 const stop=()=>{barTween&&barTween.kill();barTween=null;};
 const play=()=>{
  stop();
  if(paused||reduced.matches||document.hidden) return;
  runBar();
 };
 const hold=on=>{paused=on;on?stop():play();};


 // Autoplay is continuous: hovering or focusing the carousel no longer
 // stops it. Only a hidden page or an in-progress drag does.
 document.addEventListener('visibilitychange',()=>document.hidden?stop():play());

 root_.querySelector('[data-slider-prev]')?.addEventListener('click',()=>{move(-1);play();});
 root_.querySelector('[data-slider-next]')?.addEventListener('click',()=>{move(1);play();});

 // The viewport is also a keyboard target, so the carousel stays operable
 // for someone who tabs to the track rather than the buttons.
 viewport.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){e.preventDefault();move(-1);play();}
  if(e.key==='ArrowRight'){e.preventDefault();move(1);play();}
 });

 // Pointer drag doubles as touch swipe: pointer events cover mouse, pen and
 // finger, and touch-action:pan-y leaves vertical scrolling to the page.
 let startX=0, dx=0, dragging=false, pid=null;
 viewport.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0) return;
  if(animating) return;
  dragging=true;pid=e.pointerId;startX=e.clientX;dx=0;
  hold(true);
  viewport.classList.add('is-dragging');
  viewport.setPointerCapture(pid);
 });
 viewport.addEventListener('pointermove',e=>{
  if(!dragging||e.pointerId!==pid) return;
  dx=e.clientX-startX;
  // With clones either side there is always a slide to reveal, so the drag
  // needs no edge resistance.
  gsap.set(track,{x:-pos*width()+dx});
 });
 const endDrag=e=>{
  if(!dragging||(e&&e.pointerId!==pid)) return;
  dragging=false;
  viewport.classList.remove('is-dragging');
  if(pid!==null&&viewport.hasPointerCapture?.(pid)) viewport.releasePointerCapture(pid);
  pid=null;
  const threshold=Math.min(120,width()*.18);
  const moved=dx;
  dx=0;
  if(moved<=-threshold) move(1);
  else if(moved>=threshold) move(-1);
  else place(true);
  hold(false);
 };
 viewport.addEventListener('pointerup',endDrag);
 viewport.addEventListener('pointercancel',endDrag);
 viewport.addEventListener('click',e=>{if(Math.abs(dx)>6)e.preventDefault();},true);

 window.addEventListener('resize',()=>place(false));
 paint();place(false);
 play();
}
