(() => {
  const footer = document.querySelector('body > .footer');
  if (!footer) return;
  const wordmarkMotion = matchMedia('(prefers-reduced-motion:reduce)');
  let wordmarkFrame = 0;
  function updateWordmark() {
    wordmarkFrame = 0;
    const main = document.querySelector('body > main');
    const edge = main ? main.getBoundingClientRect().bottom : footer.getBoundingClientRect().top;
    const progress = Math.max(0, Math.min(1, (innerHeight - edge) / Math.min(innerHeight, footer.offsetHeight)));
    const shift = wordmarkMotion.matches ? 0 : (1 - progress) * Math.min(24, innerWidth * .025);
    footer.style.setProperty('--wordmark-shift', shift + 'px');
  }
  const queueWordmark = () => { if (!wordmarkFrame) wordmarkFrame = requestAnimationFrame(updateWordmark); };
  addEventListener('scroll', queueWordmark, {passive:true});
  addEventListener('resize', queueWordmark);
  wordmarkMotion.addEventListener('change', queueWordmark);
  updateWordmark();
  const layer = document.createElement('div');
  layer.className = 'footer-shader';
  layer.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  layer.append(canvas); footer.prepend(layer);
  footer.classList.add('footer--shader');
  const gl = canvas.getContext('webgl', {alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
  if (!gl) { canvas.remove(); return; }
  const vertex = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const fragment = `
    precision mediump float;
    uniform vec2 resolution;
    uniform float time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
    }
    float cloud(vec2 p){
      float n=0.,amp=.5;
      for(int i=0;i<4;i++){n+=amp*noise(p);p=p*2.03+vec2(7.1,3.8);amp*=.5;}
      return n;
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/resolution;
      float t=time*.18;
      vec2 p=uv*vec2(2.5,2.0);
      vec2 warp=vec2(cloud(p+vec2(t,-t*.3)),cloud(p+vec2(-t*.4,t*.6)+9.));
      float mist=cloud(p+warp*1.4+vec2(-t*.25,t*.12));
      float center=.69+.12*sin(t*.6);
      vec2 d=(uv-vec2(center,-.12))*vec2(1.05,.85);
      float glow=exp(-dot(d,d)*2.7);
      float plume=smoothstep(.16,.85,mist)*glow;
      float lower=1.-smoothstep(.05,1.15,uv.y);
      vec3 color=vec3(.025,.016,.02);
      float fold=sin(uv.x*13.+uv.y*7.+warp.x*3.-t);
      float silk=pow(.5+.5*fold,4.);
      color+=vec3(.14,.018,.026)*glow*lower;
      color+=vec3(.10,.035,.038)*plume;
      color+=vec3(.065,.032,.038)*silk*glow;
      // A very fine dither prevents visible bands in the dark gradients.
      color+=(hash(gl_FragCoord.xy)-.5)/255.;
      gl_FragColor=vec4(color,1.);
    }`;
  let program;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); throw new Error('Footer shader unavailable'); }
    return s;
  }
  try {
    const vs = shader(gl.VERTEX_SHADER,vertex), fs = shader(gl.FRAGMENT_SHADER,fragment);
    program = gl.createProgram(); gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Footer shader unavailable');
    gl.useProgram(program);
  } catch (_) { if(program) gl.deleteProgram(program); canvas.remove(); return; }
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'a');
  gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
  const resolution=gl.getUniformLocation(program,'resolution'),clock=gl.getUniformLocation(program,'time');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const main=document.querySelector('body > main');
  let frame=0,checkFrame=0,last=0,elapsed=0,inView=false,lost=false;
  function draw(){
    if(lost)return;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(resolution,canvas.width,canvas.height);
    gl.uniform1f(clock,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function resize(){
    const rect=footer.getBoundingClientRect();
    const scale=Math.min(.75,900/Math.max(1,rect.width));
    canvas.width=Math.max(1,Math.round(rect.width*scale));
    canvas.height=Math.max(1,Math.min(700,Math.round(rect.height*scale)));
    draw();sync();
  }
  function visible(){
    if(!inView||document.hidden||lost)return false;
    // Fixed footers can intersect the viewport while still covered by main.
    return !main || main.getBoundingClientRect().bottom < innerHeight - 1;
  }
  function tick(now){
    frame=0;
    if(!visible()||reduced.matches){last=0;return;}
    if(!last)last=now;
    if(now-last>=33){elapsed+=Math.min(now-last,80)/1000;last=now;draw();}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;last=0;
    if(visible()&&!reduced.matches)frame=requestAnimationFrame(tick);
  }
  function check(){if(!checkFrame)checkFrame=requestAnimationFrame(()=>{checkFrame=0;sync();});}
  new ResizeObserver(resize).observe(footer);
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();}).observe(footer);
  addEventListener('scroll',check,{passive:true});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{draw();sync();});
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();lost=true;canvas.style.opacity='0';sync();
  });
  // A static gradient remains available if the graphics context is lost.
  resize();
})();
