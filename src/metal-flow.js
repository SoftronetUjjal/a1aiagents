/* Kinetic Metal Flow — an animated liquid-metal sheen for the hero.

   Gold ribbons drifting over a near-black hero: the bands carry the colour
   and the gaps fall away to the dark background, so it reads as liquid metal
   smoke rather than an even wash.

   The canvas carries alpha and pointer-events:none, so it stacks over the
   paper background and under the hero copy without intercepting clicks. It
   releases its own GL buffers on teardown, and never starts at all under
   reduced motion or when WebGL is unavailable. */

const CONTROLS = {
 // How fast the liquid moves: a slow, heavy crawl rather than a quick ripple.
 flowSpeed: 0.22,
 // Frequency of the shapes: broad sweeping sheets, not tight detailed waves.
 waveDensity: 1.15,
 // Balance between the bright highlights and the deeper shadows. High on the
 // dark field so the gold reads as separated ribbons rather than a wash.
 contrastPower: 0.9
};

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

/* Layered domain-warped noise. Each octave drags the next one's coordinates,
   which is what gives the flow its heavy, folding-metal motion rather than a
   plain scrolling wave. */
const FRAG = `precision highp float;
uniform vec2 u_res;uniform float u_time;
uniform float u_density;uniform float u_contrast;

vec2 hash(vec2 p){
 p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
 return -1.+2.*fract(sin(p)*43758.5453123);
}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);
 vec2 u=f*f*(3.-2.*f);
 return mix(mix(dot(hash(i),f),dot(hash(i+vec2(1,0)),f-vec2(1,0)),u.x),
            mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)),dot(hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
 float v=0.,a=.5;
 // Three octaves rather than five: the fine ones only add mottling at this
 // scale, and the broad folds are what read as large sweeping ribbons.
 for(int i=0;i<4;i++){v+=a*noise(p);p*=2.05;a*=.5;}
 return v;
}

void main(){
 vec2 uv=(gl_FragCoord.xy-.5*u_res)/u_res.y;
 float t=u_time;

 // Warp the sampling point by another noise field, then again — the folds
 // this produces are what read as molten metal rather than drifting fog.
 // Time enters as bounded drift, not a growing offset: with a raw +t the
 // sampled field wandered into a permanently brighter region and the gold
 // coverage kept climbing the longer the page stayed open.
 vec2 d1=vec2(sin(t*.42),cos(t*.31))*0.8;
 vec2 d2=vec2(cos(t*.26),sin(t*.37))*0.62;
 vec2 q=vec2(fbm(uv*u_density+d1),
             fbm(uv*u_density+vec2(5.2,1.3)+d1*.7));
 // A lighter warp keeps the folds broad; the 4x version curled them into
 // small eddies that read as texture rather than ribbons.
 vec2 r=vec2(fbm(uv*u_density+1.9*q+vec2(1.7,9.2)+d2),
             fbm(uv*u_density+1.9*q+vec2(8.3,2.8)-d2));
 float f=fbm(uv*u_density+2.4*r);

 // Fold the field so bright bands repeat like reflections off a curved
 // surface, which is where the "chrome" reading comes from.
 float band=abs(sin(f*3.14159*.62+sin(t*.44)*.8));
 band=pow(band,mix(1.7,3.0,u_contrast));

 // Gold ribbons over near-black: the bands carry the colour and the gaps
 // fall away to the dark background, which is what gives the smoke-like
 // separation rather than an even wash.
 vec3 deep=vec3(.055,.051,.047);
 vec3 gold=vec3(.839,.714,.459);
 vec3 warm=vec3(.553,.427,.216);

 // Two-stop ramp: dark -> deep gold -> bright gold at the ribbon crests.
 vec3 col=mix(deep,warm,smoothstep(.05,.36,band));
 col=mix(col,gold,smoothstep(.38,.88,band));

 // A wide bright core with soft falloff: the ribbons need presence against
 // the dark field, and thinning them too far leaves only faint mottling.
 float body=smoothstep(.06,.44,band);
 body*=.6+.4*smoothstep(.2,.95,f);

 float vig=smoothstep(1.55,.15,length(uv*vec2(.72,1.)));
 // Hold the middle of the frame back so the headline sits on near-black
 // rather than competing with a bright ribbon.
 float clear=smoothstep(.06,.62,length(uv*vec2(.62,1.15)));
 float alpha=clamp(body*vig*clear*1.75,0.,1.);

 gl_FragColor=vec4(col,alpha);
}`;

function compile(gl, type, src) {
 const sh = gl.createShader(type);
 gl.shaderSource(sh, src);
 gl.compileShader(sh);
 if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
  gl.deleteShader(sh);
  return null;
 }
 return sh;
}

export function initMetalFlow(host, opts = {}) {
 if (!host) return null;
 const reduced = window.matchMedia('(prefers-reduced-motion:reduce)');
 if (reduced.matches) return null;

 const cfg = { ...CONTROLS, ...opts };

 const canvas = document.createElement('canvas');
 canvas.className = 'metal-flow';
 canvas.setAttribute('aria-hidden', 'true');

 // alpha:true so the paper shows through; premultipliedAlpha:false keeps the
 // champagne from darkening where the field is faint.
 const gl = canvas.getContext('webgl', {
  alpha: true, premultipliedAlpha: false, antialias: false,
  depth: false, stencil: false, powerPreference: 'low-power'
 }) || canvas.getContext('experimental-webgl', { alpha: true });

 if (!gl) return null;

 const vs = compile(gl, gl.VERTEX_SHADER, VERT);
 const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
 if (!vs || !fs) return null;

 const prog = gl.createProgram();
 gl.attachShader(prog, vs);
 gl.attachShader(prog, fs);
 gl.linkProgram(prog);
 if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
 gl.useProgram(prog);

 const buf = gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER, buf);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
 const loc = gl.getAttribLocation(prog, 'p');
 gl.enableVertexAttribArray(loc);
 gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

 const uRes = gl.getUniformLocation(prog, 'u_res');
 const uTime = gl.getUniformLocation(prog, 'u_time');
 const uDensity = gl.getUniformLocation(prog, 'u_density');
 const uContrast = gl.getUniformLocation(prog, 'u_contrast');

 gl.enable(gl.BLEND);
 gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

 host.appendChild(canvas);

 // Retina: back the canvas with real device pixels so the highlights stay
 // sharp, but cap the ratio — a 3x buffer on a large hero costs more than it
 // shows.
 const resize = () => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(host.clientWidth * dpr));
  const h = Math.max(1, Math.round(host.clientHeight * dpr));
  if (canvas.width === w && canvas.height === h) return;
  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, w, h);
 };
 resize();

 // Begin partway into the cycle. At t=0 the sin/cos drift terms are all at
 // their zero crossing, which is the field's darkest phase — the hero opened
 // on pure black before any gold appeared.
 const PHASE = 9.4;
 let raf = 0, start = performance.now(), running = true;
 const frame = now => {
  if (!running) return;
  resize();
  gl.uniform2f(uRes, canvas.width, canvas.height);
  gl.uniform1f(uTime, PHASE + (now - start) * 0.001 * cfg.flowSpeed);
  gl.uniform1f(uDensity, cfg.waveDensity);
  gl.uniform1f(uContrast, cfg.contrastPower);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  raf = requestAnimationFrame(frame);
 };
 raf = requestAnimationFrame(frame);

 // Stop drawing when the tab is hidden or the hero is scrolled away: a
 // fragment shader running full-tilt behind other content is wasted battery.
 let elapsed = 0;
 const setRunning = on => {
  if (on === running) return;
  if (!on) elapsed = performance.now() - start;
  running = on;
  if (on) { start = performance.now() - elapsed; raf = requestAnimationFrame(frame); }
  else cancelAnimationFrame(raf);
 };
 const onVis = () => setRunning(!document.hidden);
 document.addEventListener('visibilitychange', onVis);

 let io = null;
 if ('IntersectionObserver' in window) {
  io = new IntersectionObserver(es => setRunning(es[0].isIntersecting && !document.hidden), { threshold: 0 });
  io.observe(host);
 }
 const onResize = () => resize();
 window.addEventListener('resize', onResize);

 // Purge the GL objects rather than leaving them for the GC: long sessions
 // with repeated teardown would otherwise accumulate buffers and contexts.
 return function destroy() {
  running = false;
  cancelAnimationFrame(raf);
  document.removeEventListener('visibilitychange', onVis);
  window.removeEventListener('resize', onResize);
  io && io.disconnect();
  gl.deleteBuffer(buf);
  gl.deleteProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  const lose = gl.getExtension('WEBGL_lose_context');
  lose && lose.loseContext();
  canvas.remove();
 };
}
