/* Generates the four abstract visuals for the principles carousel.
   Brand palette only: warm paper, graphite ink and champagne gold, matching
   the existing generated imagery. Run: node scripts/prepare-principle-assets.mjs */
import sharp from 'sharp';

const PAPER='#f4f2ec', INK='#242624';
const W=1200, H=900;

const frame=inner=>`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
 <defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stop-color="#fbfaf6"/><stop offset="1" stop-color="#e9e7de"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stop-color="#c9b48c"/><stop offset="1" stop-color="#9c855c"/>
  </linearGradient>
 </defs>
 <rect width="${W}" height="${H}" fill="url(#bg)"/>
 ${inner}
</svg>`;

/* 01 Business first — many strands converging on a single outcome. */
const businessFirst=()=>{
 let p='';
 for(let i=0;i<14;i++){
  const y=120+i*52, t=i/13;
  p+=`<path d="M120 ${y} C 480 ${y}, 620 450, 1040 450"
       fill="none" stroke="${i%3===0?'#9c855c':'#cfcabb'}"
       stroke-width="${i%3===0?2.4:1.2}" opacity="${0.35+t*0.5}"/>`;
 }
 p+=`<circle cx="1040" cy="450" r="26" fill="#9c855c"/>
     <circle cx="1040" cy="450" r="54" fill="none" stroke="#9c855c" stroke-width="1.5" opacity=".5"/>`;
 return frame(p);
};

/* 02 Human + AI — two forms overlapping, the shared area emphasised. */
const humanAi=()=>{
 let p=`<circle cx="470" cy="450" r="240" fill="none" stroke="${INK}" stroke-width="2" opacity=".55"/>
        <circle cx="730" cy="450" r="240" fill="none" stroke="#9c855c" stroke-width="2.4"/>`;
 for(let i=1;i<=7;i++){
  const r=240-i*28;
  p+=`<circle cx="470" cy="450" r="${r}" fill="none" stroke="${INK}" stroke-width="1" opacity="${0.06+i*0.02}"/>
      <circle cx="730" cy="450" r="${r}" fill="none" stroke="#9c855c" stroke-width="1" opacity="${0.08+i*0.03}"/>`;
 }
 p+=`<path d="M600 232 A 240 240 0 0 1 600 668 A 240 240 0 0 1 600 232 Z" fill="#9c855c" opacity=".14"/>`;
 return frame(p);
};

/* 03 Connected by design — a mesh of linked nodes. */
const connected=()=>{
 const pts=[[240,250],[520,180],[840,290],[980,520],[700,470],[420,520],[260,640],[600,700],[900,720]];
 let p='';
 pts.forEach(([x1,y1],i)=>pts.forEach(([x2,y2],j)=>{
  if(j<=i) return;
  const d=Math.hypot(x1-x2,y1-y2);
  if(d>330) return;
  p+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="1" opacity=".22"/>`;
 }));
 pts.forEach(([x,y],i)=>{
  const gold=i%3===0;
  p+=`<circle cx="${x}" cy="${y}" r="${gold?17:10}" fill="${gold?'#9c855c':PAPER}" stroke="${gold?'none':INK}" stroke-width="1.6"/>`;
 });
 return frame(p);
};

/* 04 Built to evolve — arcs expanding outward in sequence. */
const evolve=()=>{
 let p='';
 for(let i=0;i<9;i++){
  const r=90+i*64, o=0.9-i*0.09;
  p+=`<path d="M 600 ${450+r} A ${r} ${r} 0 0 1 ${600+r} 450"
       fill="none" stroke="${i<4?'#9c855c':INK}" stroke-width="${i<4?3:1.4}"
       opacity="${o.toFixed(2)}" stroke-linecap="round"/>`;
 }
 p+=`<circle cx="600" cy="450" r="30" fill="#9c855c"/>`;
 return frame(p);
};

const art={'principle-business':businessFirst(),'principle-human':humanAi(),
 'principle-connected':connected(),'principle-evolve':evolve()};

for(const [name,svg] of Object.entries(art)){
 const buf=Buffer.from(svg);
 await sharp(buf).resize({width:1200}).webp({quality:88}).toFile(`public/assets/${name}.webp`);
 await sharp(buf).resize({width:760}).webp({quality:85}).toFile(`public/assets/${name}-mobile.webp`);
 console.log('wrote',name);
}
