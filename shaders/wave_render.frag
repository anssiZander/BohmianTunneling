#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uState;
uniform ivec2 uSimRes;

uniform float uVisGain;
uniform float uVisGamma;
uniform int   uShowPhase;
uniform float uAbsorbPx;
uniform float uParticleKillMarginPx;

uniform float uBarrierYFrac;
uniform float uBarrierThickPx;

uniform float uBarrierOpacity;
uniform float uBarrierClassicallyForbidden;

in vec2 vUV;
out vec4 fragColor;

vec3 phasePalette(float t) {
  vec3 a = vec3(0.10, 0.02, 0.12);
  vec3 b = vec3(0.75, 0.15, 0.90);
  vec3 d = vec3(0.00, 0.10, 0.30);
  return a + b * cos(6.283185 * (t + d));
}

vec3 densityPalette(float t) {
  vec3 a = vec3(0.22, 0.32, 0.28);
  vec3 b = vec3(0.40, 0.45, 0.35);
  vec3 d = vec3(0.15, 0.55, 0.75);
  return a + b * cos(6.283185 * (t + d));
}

float band(float x, float c, float halfW, float feather){
  return smoothstep(c-halfW-feather, c-halfW, x) *
         (1.0 - smoothstep(c+halfW, c+halfW+feather, x));
}

float barrierMask(vec2 uv){
  vec2 xPx = uv * vec2(uSimRes);
  float by = uBarrierYFrac * float(uSimRes.y);
  return band(xPx.y, by, 0.5 * uBarrierThickPx, 1.0);
}

float detectorVisibility(vec2 uv) {
  vec2 xPx = uv * (vec2(uSimRes) - vec2(1.0));
  vec2 maxPx = vec2(uSimRes) - vec2(1.0);
  float base = uAbsorbPx + uParticleKillMarginPx;
  float freezeDistX = 2.25 * base;
  float freezeDistXLeft = 1.20 * freezeDistX;
  float freezeDistY = 1.50 * base;
  float fadeWidth = 8.0;

  float left = smoothstep(freezeDistXLeft - fadeWidth, freezeDistXLeft, xPx.x);
  float right = smoothstep(freezeDistX - fadeWidth, freezeDistX, maxPx.x - xPx.x);
  float top = smoothstep(freezeDistY - fadeWidth, freezeDistY, xPx.y);
  float bottom = smoothstep(freezeDistY - fadeWidth, freezeDistY, maxPx.y - xPx.y);

  return min(min(left, right), min(top, bottom));
}

void main(){
  vec2 uv = vUV;

  vec2 psi = texture(uState, uv).rg;
  float rho = dot(psi, psi);

  float I = 1.0 - exp(-uVisGain * rho);
  I = pow(clamp(I, 0.0, 1.0), uVisGamma);

  vec3 col;
  if(uShowPhase==1){
    float ph = atan(psi.y, psi.x);
    float t = fract((ph + 3.14159265) / 6.2831853);
    col = phasePalette(t) * I;
  } else {
    col = densityPalette(I) * I;
  }

  col *= detectorVisibility(uv);
  
  float wall = barrierMask(uv);
  float op = clamp(uBarrierOpacity, 0.0, 1.0);
  vec3 allowedWallCol = vec3(0.20, 0.28, 0.35);
  vec3 forbiddenWallCol = vec3(0.58, 0.13, 0.10);
  vec3 wallCol = mix(allowedWallCol, forbiddenWallCol, clamp(uBarrierClassicallyForbidden, 0.0, 1.0));
  float wallAlpha = wall * op;
  col = mix(col, wallCol, wallAlpha);

  fragColor = vec4(col, 1.0);
}
