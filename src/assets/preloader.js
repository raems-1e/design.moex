(() => {
  'use strict';

  const body = document.body;
  if (!body || document.querySelector('[data-moex-preloader]')) return;
  const componentBase = document.currentScript?.src
    ? new URL('.', document.currentScript.src)
    : new URL('assets/', document.baseURI);
  const asset = (name) => new URL(name, componentBase).href;

  const items = [
    ['DESIGNSYS', 'v3.0', '+120 компонентов'],
    ['ICON40', '40 экранов', '+12%'],
    ['SPEED', '2x быстрее', '+100%'],
    ['TOKENS', '1 200 фреймов', '+45%'],
    ['TOKENS', '360 токенов', '+60%'],
    ['A11Y', 'AA+', '+25%'],
    ['PHOTOS', '24 фото', '+6 новых']
  ];

  const tickerItems = items.map(([label, value, positive]) => `
    <span class="moex-preloader__ticker-cluster">
      <span class="moex-preloader__ticker-item"><strong>${label}</strong><span>${value}</span></span>
      <span class="moex-preloader__ticker-item moex-preloader__ticker-item--positive"><span>${positive}</span></span>
    </span>`).join('');

  const preloader = document.createElement('div');
  preloader.className = 'moex-preloader';
  preloader.dataset.moexPreloader = '';
  preloader.setAttribute('role', 'status');
  preloader.setAttribute('aria-label', 'Загрузка MOEX Design');
  preloader.innerHTML = `
    <div class="moex-preloader__gradient" aria-hidden="true">
      <canvas class="moex-preloader__gradient-canvas"></canvas>
    </div>
    <div class="moex-preloader__stage">
      <div class="moex-preloader__counter" aria-hidden="true">
        <span class="moex-preloader__slot moex-preloader__slot--tens is-empty"><span class="moex-preloader__digit">0</span></span>
        <span class="moex-preloader__slot moex-preloader__slot--units"><span class="moex-preloader__digit">0</span></span>
        <span class="moex-preloader__percent">%</span>
      </div>
      <span class="moex-preloader__value" aria-live="polite">Загрузка 0 процентов</span>
      <div class="moex-preloader__mark" aria-hidden="true">
        <img class="moex-preloader__mark-piece moex-preloader__mark-piece--left" src="${asset('moex-logotype-left.svg')}" alt="" />
        <img class="moex-preloader__mark-piece moex-preloader__mark-piece--right" src="${asset('moex-logotype-right.svg')}" alt="" />
      </div>
      <div class="moex-preloader__logo-text" aria-hidden="true"><img src="${asset('moex-logotype.svg')}" alt="" /></div>
    </div>
    <img class="moex-preloader__brand" src="${asset('moex-logotype.svg')}" alt="MOEX Design" />
    <div class="moex-preloader__veil" aria-hidden="true"></div>
    <div class="moex-preloader__ticker" aria-hidden="true">
      <div class="moex-preloader__ticker-track">
        <div class="moex-preloader__ticker-group">${tickerItems}</div>
        <div class="moex-preloader__ticker-group">${tickerItems}</div>
      </div>
    </div>
    <button class="moex-preloader__scroll-cue" type="button" aria-label="Перейти на сайт">
      <svg viewBox="0 0 24 24" fill="none" focusable="false">
        <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>`;

  body.prepend(preloader);

  // Keep the ticker outside the moving curtain so it becomes the site header.
  const curtain = document.createElement('div');
  curtain.className = 'moex-preloader__curtain';
  [...preloader.children].forEach((child) => {
    if (!child.classList.contains('moex-preloader__ticker')) curtain.append(child);
  });
  preloader.append(curtain);
  // Reserve the final header spacing while the opaque curtain still covers it.
  body.classList.add('has-site-ticker');

  const showSiteShell = () => {
    preloader.classList.add('is-leaving', 'is-site-shell');
    preloader.removeAttribute('role');
    preloader.setAttribute('aria-hidden', 'true');
    body.classList.add('has-site-ticker');
    body.classList.remove('is-preloader-active', 'is-site-entering');
    // Let the other deferred page scripts register their listeners first.
    window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
      document.dispatchEvent(new CustomEvent('moex:preloader-complete'));
    }, 0);
  };

  let skipIntro = false;
  try {
    const sessionKey = 'moex:intro-seen:v1';
    skipIntro = window.sessionStorage.getItem(sessionKey) === '1';
    // Reserve this visit immediately, including reloads during the intro.
    window.sessionStorage.setItem(sessionKey, '1');
  } catch {
    // If storage is blocked, keep navigation usable without repeat intros.
    skipIntro = true;
  }

  if (skipIntro) {
    window.MOEXPreloader = { finish: () => {} };
    showSiteShell();
    return;
  }

  let gradient = null;
  const startGradient = () => {
    if (gradient) return;
    gradient = mountRibbons(preloader.querySelector('.moex-preloader__gradient-canvas'));
    preloader.classList.add('is-gradient-ready');
  };
  const tens = preloader.querySelector('.moex-preloader__slot--tens');
  const units = preloader.querySelector('.moex-preloader__slot--units');
  const accessibleValue = preloader.querySelector('.moex-preloader__value');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A self-contained, red silk/ribbed surface; no external media dependency.
  function mountRibbons(canvas) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) return null;
    const shaders = [];
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Intro shader unavailable');
      return shader;
    };
    let program;
    let buffer;
    let frame = 0;
    let stopped = false;
    let last = 0;
    let capture = null;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
        precision mediump float;
        uniform vec2 resolution;
        uniform float time;
        void main(){
          vec2 uv=gl_FragCoord.xy/resolution;
          vec2 p=(uv-.5)*vec2(resolution.x/resolution.y,1.);
          float t=time*.28;
          // Broad fabric folds with a narrow lit lip, not repeating stripes.
          float curve=p.x*.72+p.y*.86+.16*sin(p.y*2.8+t)+.12*sin(p.x*2.-t);
          float ridge=curve-.30-.13*sin(t);
          float lip=exp(-abs(ridge)*70.);
          float shoulder=exp(-pow((ridge-.13)*5.,2.));
          float sweep=p.y-p.x*.36+.18*sin(p.x*2.2+t)+.23;
          float silk=exp(-pow(sweep*3.4,2.));
          float valley=exp(-pow((sweep-.29)*6.,2.));
          float overhang=smoothstep(-.025,.045,ridge)*(1.-smoothstep(.045,.28,ridge));
          float light=clamp(silk*.88+shoulder*.48,0.,1.);
          light*=1.-valley*.78;
          light*=1.-overhang*.85;
          // Same #FF0508 hue as the mission artwork; only lightness varies.
          vec3 brandRed=vec3(1.,5./255.,8./255.);
          vec3 highlight=mix(brandRed,vec3(1.),.22);
          vec3 color=mix(brandRed*.018,brandRed,light);
          color=mix(color,highlight,pow(light,3.)*.63);
          color=mix(color,highlight,lip*.83);
          float ribs=sin((curve+.008*sin(sweep*8.))*690.);
          color*=.965+.035*ribs;
          float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
          color+=(grain-.5)*.015;
          gl_FragColor=vec4(color,1.);
        }`));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Intro shader unavailable');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'p');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const resolution = gl.getUniformLocation(program, 'resolution');
      const time = gl.getUniformLocation(program, 'time');
      // Render and copy in the same task: WebGL's default drawing buffer is
      // cleared after compositing, so reading a previous frame can be blank.
      // Exact local logo contours, embedded so file:// exports remain origin-clean.
      // Source: assets/moex-logotype.svg, viewBox 0 0 257 35.
      const wallpaperLogoPaths = ["M4.46094 29.1989V15.1724H18.4204V6.75977H40.7412V29.2045H4.46094V29.1989Z","M51.5446 6.75977H56.4931L63.1205 23.0153H63.3848L70.0122 6.75977H74.9607V29.1934H71.0801V13.7786H70.8709L64.7003 29.127H61.7995L55.6289 13.7454H55.4197V29.1879H51.5391V6.75977H51.5446Z","M98.3958 17.9763C98.3958 20.3933 97.9444 22.4619 97.0472 24.182C96.15 25.9021 94.928 27.2185 93.3867 28.1311C91.8399 29.0437 90.095 29.5028 88.1354 29.5028C86.1758 29.5028 84.4309 29.0437 82.8841 28.1256C81.3373 27.2074 80.1208 25.8911 79.2236 24.1709C78.3264 22.4508 77.875 20.3878 77.875 17.9763C77.875 15.5648 78.3209 13.4906 79.2236 11.7705C80.1263 10.0504 81.3428 8.734 82.8841 7.82139C84.4309 6.90878 86.1758 6.44971 88.1354 6.44971C90.095 6.44971 91.8399 6.90878 93.3867 7.82139C94.9335 8.734 96.15 10.0504 97.0472 11.7705C97.9444 13.4906 98.3958 15.5592 98.3958 17.9763ZM94.3335 17.9763C94.3335 16.2727 94.0693 14.8402 93.5408 13.6676C93.0124 12.4951 92.2858 11.6101 91.3555 11.0072C90.4253 10.4044 89.3519 10.1057 88.1409 10.1057C86.9299 10.1057 85.8565 10.4044 84.9263 11.0072C83.996 11.6101 83.2694 12.4951 82.741 13.6676C82.2126 14.8402 81.9483 16.2782 81.9483 17.9763C81.9483 19.6743 82.2126 21.1123 82.741 22.2849C83.2694 23.4574 83.996 24.3424 84.9263 24.9453C85.8565 25.5482 86.9299 25.8468 88.1409 25.8468C89.3519 25.8468 90.4253 25.5482 91.3555 24.9453C92.2858 24.3424 93.0124 23.4574 93.5408 22.2849C94.0693 21.1123 94.3335 19.6743 94.3335 17.9763Z","M101.305 29.1929V6.75928H115.826V10.1664H105.351V16.256H115.077V19.663H105.351V25.7858H115.914V29.1929H101.305Z","M122.416 6.75928L127.331 14.9728H127.508L132.445 6.75928H137.058L130.177 17.9761L137.162 29.1929H132.473L127.502 21.0347H127.326L122.355 29.1929H117.688L124.739 17.9761L117.77 6.75928H122.405H122.416Z","M153.584 29.1929H146.016V6.75928H153.733C155.951 6.75928 157.856 7.20729 159.452 8.1033C161.048 8.99932 162.276 10.2825 163.129 11.9529C163.988 13.6232 164.417 15.6254 164.417 17.954C164.417 20.2825 163.988 22.3013 163.124 23.9772C162.265 25.6586 161.021 26.9473 159.408 27.8433C157.79 28.7394 155.847 29.1929 153.579 29.1929H153.584ZM150.061 25.6752H153.386C154.944 25.6752 156.238 25.3876 157.278 24.8179C158.318 24.2427 159.1 23.3854 159.623 22.246C160.146 21.1011 160.41 19.6741 160.41 17.9595C160.41 16.2449 160.151 14.8179 159.623 13.6841C159.1 12.5502 158.329 11.6984 157.305 11.1343C156.282 10.5701 155.016 10.2825 153.507 10.2825H150.061V25.6863V25.6752Z","M167.328 29.1929V6.75928H181.849V10.1664H171.374V16.256H181.1V19.663H171.374V25.7858H181.937V29.1929H167.328Z","M197.194 12.9265C197.09 11.9696 196.666 11.2229 195.912 10.692C195.158 10.161 194.183 9.88997 192.983 9.88997C192.141 9.88997 191.415 10.0172 190.815 10.2716C190.215 10.526 189.752 10.8745 189.427 11.3114C189.108 11.7484 188.943 12.2517 188.938 12.8103C188.938 13.2749 189.042 13.6842 189.257 14.0271C189.471 14.3701 189.763 14.6632 190.132 14.8955C190.501 15.1333 190.914 15.3325 191.365 15.4928C191.816 15.6532 192.268 15.786 192.73 15.8966L194.822 16.4221C195.664 16.6212 196.479 16.8867 197.26 17.224C198.042 17.5614 198.741 17.9818 199.363 18.4962C199.985 19.005 200.475 19.6245 200.838 20.349C201.202 21.0736 201.383 21.9198 201.383 22.8878C201.383 24.2041 201.047 25.3601 200.381 26.3557C199.715 27.3513 198.747 28.1311 197.486 28.6897C196.226 29.2484 194.701 29.5305 192.912 29.5305C191.123 29.5305 189.67 29.2594 188.393 28.7174C187.116 28.1754 186.119 27.39 185.404 26.3501C184.688 25.3159 184.303 24.0493 184.242 22.5614H188.222C188.282 23.3413 188.519 23.994 188.943 24.5139C189.367 25.0338 189.917 25.4209 190.594 25.6754C191.271 25.9298 192.037 26.057 192.879 26.057C193.721 26.057 194.53 25.9243 195.196 25.6588C195.862 25.3933 196.385 25.0172 196.759 24.5415C197.139 24.0659 197.332 23.5017 197.337 22.8601C197.332 22.2738 197.161 21.7926 196.825 21.411C196.49 21.0294 196.022 20.7086 195.427 20.4486C194.827 20.1886 194.128 19.9563 193.33 19.7517L190.787 19.0935C188.949 18.6178 187.495 17.8988 186.433 16.9309C185.371 15.963 184.837 14.6743 184.837 13.0703C184.837 11.7484 185.194 10.5924 185.91 9.59683C186.626 8.60679 187.6 7.83245 188.838 7.27935C190.077 6.72626 191.475 6.44971 193.033 6.44971C194.591 6.44971 196.005 6.72626 197.205 7.27935C198.405 7.83245 199.341 8.59572 200.024 9.56918C200.706 10.5426 201.058 11.6654 201.08 12.9265H197.189H197.194Z","M208.116 6.75928V29.1929H204.07V6.75928H208.116Z","M226.541 13.9222C226.359 13.3304 226.111 12.7994 225.792 12.3293C225.473 11.8592 225.098 11.4554 224.658 11.118C224.218 10.7806 223.717 10.5262 223.15 10.3547C222.583 10.1833 221.966 10.0948 221.295 10.0948C220.095 10.0948 219.027 10.399 218.091 11.0018C217.155 11.6047 216.418 12.4952 215.884 13.6678C215.35 14.8403 215.08 16.2673 215.08 17.9432C215.08 19.6191 215.344 21.0738 215.878 22.2463C216.412 23.4189 217.144 24.3149 218.091 24.9233C219.038 25.5317 220.133 25.8359 221.383 25.8359C222.517 25.8359 223.497 25.6147 224.333 25.1777C225.165 24.7408 225.809 24.1158 226.26 23.3083C226.711 22.5007 226.937 21.5549 226.937 20.4653L227.851 20.6091H221.79V17.4344H230.851V20.128C230.851 22.0472 230.443 23.712 229.629 25.1114C228.814 26.5107 227.697 27.5948 226.271 28.347C224.845 29.1047 223.21 29.4808 221.366 29.4808C219.308 29.4808 217.508 29.0162 215.955 28.0815C214.403 27.1468 213.192 25.8249 212.328 24.1047C211.458 22.3846 211.023 20.3437 211.023 17.9764C211.023 16.1678 211.282 14.5472 211.794 13.1257C212.306 11.7043 213.022 10.493 213.946 9.49189C214.871 8.49632 215.95 7.73858 217.194 7.21313C218.438 6.69322 219.787 6.42773 221.251 6.42773C222.489 6.42773 223.64 6.61026 224.708 6.96977C225.776 7.32928 226.728 7.84366 227.559 8.50738C228.39 9.1711 229.078 9.96203 229.612 10.8746C230.152 11.7872 230.504 12.7939 230.669 13.9001H226.546L226.541 13.9222Z","M252.188 6.75928V29.1929H248.588L238.069 13.9108H237.882V29.1929H233.836V6.75928H237.458L247.966 22.0524H248.164V6.75928H252.188Z"];
      capture = (format) => new Promise((resolve, reject) => {
        if (stopped || gl.isContextLost()) return reject(new Error('Wallpaper unavailable'));
        const width = canvas.width;
        const height = canvas.height;
        const limit = Math.min(2560, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
        const mobile = format === 'mobile';
        const targetWidth = mobile ? 1440 : 2560;
        const targetHeight = mobile ? 2560 : 1440;
        const scale = limit / 2560;
        const output = document.createElement('canvas');
        output.width = Math.round(targetWidth * scale);
        output.height = Math.round(targetHeight * scale);
        try {
          canvas.width = output.width;
          canvas.height = output.height;
          gl.viewport(0, 0, output.width, output.height);
          gl.uniform2f(resolution, output.width, output.height);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          const context = output.getContext('2d');
          context.drawImage(canvas, 0, 0);
          const logoWidth = output.width * (mobile ? .72 : .46);
          const logoHeight = logoWidth * 35 / 257;
          context.save();
          context.fillStyle = '#ffffff';
          context.globalCompositeOperation = 'soft-light';
          context.translate((output.width - logoWidth) / 2, (output.height - logoHeight) / 2);
          context.scale(logoWidth / 257, logoWidth / 257);
          wallpaperLogoPaths.forEach(path => context.fill(new Path2D(path)));
          context.restore();
          output.toBlob(blob => blob ? resolve(blob) : reject(new Error('Wallpaper export failed')), 'image/png');
        } catch (error) {
          reject(error);
        } finally {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
          gl.uniform2f(resolution, width, height);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      });
      const draw = (now) => {
        if (stopped) return;
        if (!document.hidden && (!last || now-last>32)) {
          last=now;
          const scale=Math.min(1,1280/window.innerWidth);
          const width=Math.round(window.innerWidth*scale);
          const height=Math.round(window.innerHeight*scale);
          if(canvas.width!==width || canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
          gl.uniform2f(resolution,width,height);
          gl.uniform1f(time,reducedMotion ? 0 : now/1000);
          gl.drawArrays(gl.TRIANGLES,0,6);
        }
        if (!reducedMotion) frame=requestAnimationFrame(draw);
      };
      draw(0);
    } catch {
      canvas.style.display='none';
      capture = null;
    }
    return { capture: (format) => capture ? capture(format) : Promise.reject(new Error('Wallpaper unavailable')), get canCapture() { return Boolean(capture); }, destroy() {
      stopped=true;
      cancelAnimationFrame(frame);
      if(buffer) gl.deleteBuffer(buffer);
      if(program) gl.deleteProgram(program);
      shaders.forEach(shader=>gl.deleteShader(shader));
    } };
  }
  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
  let ready = false;
  let leaving = false;
  let scrollIntent = false;
  let touchStartY = 0;
  const wallpaperButton = document.createElement('div');
  wallpaperButton.className = 'moex-preloader__wallpaper';
  wallpaperButton.innerHTML = `<button class="moex-wallpaper__trigger" type="button" aria-expanded="false" aria-controls="moex-wallpaper-options"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg><span>Скачать обои MOEX Design</span></button><div class="moex-wallpaper__options" id="moex-wallpaper-options" inert><button type="button" data-wallpaper-format="desktop"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4m-4 0h8"/></svg><span>Десктоп</span></button><button type="button" data-wallpaper-format="mobile"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></svg><span>Телефон</span></button></div><span class="moex-wallpaper__status" role="status"></span>`;
  wallpaperButton.inert = true;
  curtain.append(wallpaperButton);
  const wallpaperTimer = window.setTimeout(() => {
    if (leaving || !gradient?.canCapture) return;
    wallpaperButton.inert = false;
    wallpaperButton.classList.add('is-visible');
  }, 5000);
  const wallpaperTrigger = wallpaperButton.querySelector('.moex-wallpaper__trigger');
  const wallpaperOptions = wallpaperButton.querySelector('.moex-wallpaper__options');
  const wallpaperStatus = wallpaperButton.querySelector('.moex-wallpaper__status');
  const openWallpaperOptions = open => {
    wallpaperButton.classList.toggle('is-open', open);
    wallpaperTrigger.setAttribute('aria-expanded', String(open));
    wallpaperOptions.inert = !open;
  };
  wallpaperTrigger.addEventListener('click', () => openWallpaperOptions(!wallpaperButton.classList.contains('is-open')));
  wallpaperButton.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') openWallpaperOptions(true); });
  wallpaperButton.addEventListener('pointerleave', () => { if (!wallpaperButton.contains(document.activeElement)) openWallpaperOptions(false); });
  wallpaperButton.addEventListener('focusout', event => { if (!wallpaperButton.contains(event.relatedTarget)) openWallpaperOptions(false); });
  wallpaperButton.addEventListener('keydown', event => {
    if (event.key === 'Escape') { openWallpaperOptions(false); wallpaperTrigger.focus(); }
  });
  document.addEventListener('pointerdown', event => { if (!wallpaperButton.contains(event.target)) openWallpaperOptions(false); });
  let exportingWallpaper = false;
  wallpaperOptions.addEventListener('click', async event => {
    const option = event.target.closest('[data-wallpaper-format]');
    if (!option || leaving || exportingWallpaper) return;
    exportingWallpaper = true;
    wallpaperOptions.setAttribute('aria-busy', 'true');
    wallpaperStatus.textContent = '';
    try {
      const format = option.dataset.wallpaperFormat;
      const blob = await gradient.capture(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MOEX-Design-${format}.png`;
      body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('MOEX wallpaper export failed:', error);
      wallpaperStatus.textContent = 'Не удалось скачать — попробуйте ещё раз';
    } finally {
      exportingWallpaper = false;
      wallpaperOptions.removeAttribute('aria-busy');
    }
  });

  const animateDigit = (slot, value, duration) => {
    const current = slot.lastElementChild;
    if (current?.textContent === value) return;

    const next = document.createElement('span');
    next.className = 'moex-preloader__digit';
    next.textContent = value;
    slot.append(next);

    current?.animate([
      { transform: 'translate3d(0,0,0)', opacity: 1 },
      { transform: 'translate3d(0,-110%,0)', opacity: 0 }
    ], { duration, easing: 'cubic-bezier(.22,.68,.25,1)', fill: 'forwards' });

    const incoming = next.animate([
      { transform: 'translate3d(0,110%,0)', opacity: 0 },
      { transform: 'translate3d(0,0,0)', opacity: 1 }
    ], { duration, easing: 'cubic-bezier(.22,.68,.25,1)', fill: 'forwards' });

    return incoming.finished.then(() => {
      if (next !== slot.lastElementChild) return;
      slot.replaceChildren(next);
      next.style.transform = 'translate3d(0,0,0)';
      next.style.opacity = '1';
    }).catch(() => {});
  };

  const setValue = (value, duration) => {
    const animations = [];
    const tensValue = value >= 10 ? String(Math.floor(value / 10)) : '';
    const unitsValue = String(value % 10);
    const previousTens = tens.dataset.value || '';

    if (tensValue) {
      tens.classList.remove('is-empty');
      if (previousTens !== tensValue) animations.push(animateDigit(tens, tensValue, duration));
    } else {
      tens.classList.add('is-empty');
    }

    tens.dataset.value = tensValue;
    animations.push(animateDigit(units, unitsValue, duration));
    if (value % 10 === 0 || value === 99) {
      accessibleValue.textContent = `Загрузка ${value} процентов`;
    }
    return Promise.all(animations);
  };

  const removeIntentListeners = () => {
    window.removeEventListener('wheel', onScrollIntent);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onScrollIntent);
    window.removeEventListener('keydown', onKeyIntent);
  };

  const finish = () => {
    if (leaving) return;
    leaving = true;
    window.clearTimeout(wallpaperTimer);
    wallpaperButton.inert = true;
    wallpaperButton.classList.remove('is-visible');
    preloader.classList.add('is-leaving');
    body.classList.add('is-site-entering', 'has-site-ticker');

    window.setTimeout(() => {
      removeIntentListeners();
      gradient?.destroy();
      showSiteShell();
    }, reducedMotion ? 80 : 1120);
  };

  function onScrollIntent(event) {
    if (event.type === 'wheel' && event.deltaY <= 0) return;
    if (event.type === 'touchmove' && event.touches?.[0]?.clientY >= touchStartY) return;
    if (event.cancelable) event.preventDefault();
    scrollIntent = true;
    if (ready) finish();
  }

  function onTouchStart(event) {
    touchStartY = event.touches?.[0]?.clientY || 0;
  }

  function onKeyIntent(event) {
    if (event.target.closest?.('button, a')) return;
    if (!['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) return;
    event.preventDefault();
    scrollIntent = true;
    if (ready) finish();
  }

  window.addEventListener('wheel', onScrollIntent, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onScrollIntent, { passive: false });
  window.addEventListener('keydown', onKeyIntent);
  preloader.querySelector('.moex-preloader__scroll-cue').addEventListener('click', () => {
    scrollIntent = true;
    if (ready) finish();
  });

  const run = async () => {
    startGradient();
    if (reducedMotion) {
      preloader.classList.add('is-mark-arriving', 'is-counter-complete', 'is-logo-ready', 'is-marquee-ready');
      ready = true;
      return;
    }

    await wait(100);
    // One continuous reel avoids waiting for a separate browser frame per percent.
    tens.classList.remove('is-empty');
    tens.classList.add('is-hundred');
    const reels = [tens, units].map((slot, column) => {
      const rowHeight = slot.getBoundingClientRect().height;
      const reel = document.createElement('span');
      reel.style.cssText = 'position:absolute;top:0;left:0;width:100%;';
      for (let value = 0; value <= (column === 0 ? 10 : 100); value += 1) {
        const row = document.createElement('span');
        row.style.cssText = `display:block;height:${rowHeight}px;line-height:${rowHeight}px;`;
        row.textContent = column === 0 ? (value === 0 ? '' : String(value)) : String(value % 10);
        reel.append(row);
      }
      slot.replaceChildren(reel);
      // Tens hold in place between carries; units roll continuously upward.
      const frames = column === 0
        ? [{ offset:0, transform:'translateY(0)' }, ...Array.from({ length:10 }, (_, i) => [
          { offset:((i + 1) * 10 - 2) / 100, transform:`translateY(${-i * rowHeight}px)` },
          { offset:(i + 1) / 10, transform:`translateY(${-(i + 1) * rowHeight}px)` }
        ]).flat()]
        : [{ transform:'translateY(0)' }, { transform:`translateY(${-100 * rowHeight}px)` }];
      return reel.animate(frames, { duration:1250, easing:'linear', fill:'forwards' }).finished.catch(() => {});
    });
    await Promise.all(reels);
    if (leaving) return;
    accessibleValue.textContent = 'Загрузка 100 процентов';
    await wait(160);
    preloader.classList.add('is-counter-complete');
    await wait(340);
    preloader.classList.add('is-logo-ready', 'is-marquee-ready');
    await wait(760);
    ready = true;
    accessibleValue.textContent = 'MOEX Design загружен. Прокрутите вниз, чтобы открыть сайт.';
    document.dispatchEvent(new CustomEvent('moex:preloader-ready'));

    if (scrollIntent) {
      window.setTimeout(finish, 260);
    }
  };

  window.MOEXPreloader = { finish };
  run().catch(finish);
})();
