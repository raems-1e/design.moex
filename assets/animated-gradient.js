(() => {
  'use strict';

  const VERTEX_SHADER = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}`;

  // Vanilla WebGL adaptation of Spell UI's AnimatedGradient shader.
  const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;
out vec4 fragColor;
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;
  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);
  vec3 blended_color_2 = mix(color1, color2, r1);
  float blended_opacity_2 = mix(c1.a, c2.a, r1);
  vec3 c = mix(blended_color_2, color3, r2);
  float o = mix(blended_opacity_2, c3.a, r2);
  return vec4(c, o);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;
  float noise_scale = .0005 + .006 * u_scale;
  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;
  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);
  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations_number; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
  }
  float proportion = clamp(u_proportion, 0., 1.);
  float shape = 0.;
  float mixer = 0.;
  if (u_shape < .5) {
    vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_shape_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (noise_scale * u_resolution.y);
    sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }
  vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);
  fragColor = vec4(color_mix.rgb, color_mix.a);
}`;

  const GRAY_PRISM = {
    color1: '#fafaf8',
    color2: '#8f8f8f',
    color3: '#eeeeec',
    rotation: -50,
    proportion: 1,
    scale: 0.01,
    speed: 15,
    distortion: 0,
    swirl: 50,
    swirlIterations: 16,
    softness: 47,
    offset: -299,
    shape: 0,
    shapeSize: 45
  };

  const toRgba = (hex) => {
    const value = hex.replace('#', '');
    const normalized = value.length === 3
      ? value.split('').map((part) => part + part).join('')
      : value;
    return [
      parseInt(normalized.slice(0, 2), 16) / 255,
      parseInt(normalized.slice(2, 4), 16) / 255,
      parseInt(normalized.slice(4, 6), 16) / 255,
      normalized.length === 8 ? parseInt(normalized.slice(6, 8), 16) / 255 : 1
    ];
  };

  const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.warn('MOEX animated gradient shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  };

  const mount = (canvas, config = {}) => {
    if (!(canvas instanceof HTMLCanvasElement)) return null;
    const gl = canvas.getContext('webgl2', {
      premultipliedAlpha: true,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    if (!gl) return null;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('MOEX animated gradient program:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const params = { ...GRAY_PRISM, ...config };
    const uniforms = {};
    [
      'u_time', 'u_resolution', 'u_pixelRatio', 'u_scale', 'u_rotation',
      'u_color1', 'u_color2', 'u_color3', 'u_proportion', 'u_softness',
      'u_shape', 'u_shapeScale', 'u_distortion', 'u_swirl', 'u_swirlIterations'
    ].forEach((name) => { uniforms[name] = gl.getUniformLocation(program, name); });

    let frameId = 0;
    let destroyed = false;
    let startTime = performance.now();
    let elapsedBeforePause = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(bounds.width * pixelRatio));
      const height = Math.max(1, Math.round(bounds.height * pixelRatio));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    const draw = (time) => {
      if (destroyed) return;
      resize();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const elapsed = elapsedBeforePause + (time - startTime) / 1000;
      const speed = (params.speed / 100) * 5;
      const c1 = toRgba(params.color1);
      const c2 = toRgba(params.color2);
      const c3 = toRgba(params.color3);

      gl.uniform1f(uniforms.u_time, elapsed * speed + params.offset * 0.01);
      gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.u_pixelRatio, pixelRatio);
      gl.uniform1f(uniforms.u_scale, params.scale);
      gl.uniform1f(uniforms.u_rotation, (params.rotation * Math.PI) / 180);
      gl.uniform4f(uniforms.u_color1, c1[0], c1[1], c1[2], c1[3]);
      gl.uniform4f(uniforms.u_color2, c2[0], c2[1], c2[2], c2[3]);
      gl.uniform4f(uniforms.u_color3, c3[0], c3[1], c3[2], c3[3]);
      gl.uniform1f(uniforms.u_proportion, params.proportion / 100);
      gl.uniform1f(uniforms.u_softness, params.softness / 100);
      gl.uniform1f(uniforms.u_shape, params.shape);
      gl.uniform1f(uniforms.u_shapeScale, params.shapeSize / 100);
      gl.uniform1f(uniforms.u_distortion, params.distortion / 50);
      gl.uniform1f(uniforms.u_swirl, params.swirl / 100);
      gl.uniform1f(uniforms.u_swirlIterations, params.swirl === 0 ? 0 : params.swirlIterations);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion && !document.hidden) frameId = requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      if (destroyed || reducedMotion) return;
      if (document.hidden) {
        elapsedBeforePause += (performance.now() - startTime) / 1000;
        cancelAnimationFrame(frameId);
        return;
      }
      startTime = performance.now();
      frameId = requestAnimationFrame(draw);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    frameId = requestAnimationFrame(draw);

    return {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        cancelAnimationFrame(frameId);
        document.removeEventListener('visibilitychange', handleVisibility);
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      }
    };
  };

  window.MOEXAnimatedGradient = { mount };
})();
