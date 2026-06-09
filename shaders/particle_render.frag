#version 300 es
precision highp float;

in float vAlive;
out vec4 fragColor;

uniform float uDotSigma;
uniform float uDotGain;
uniform int   uPaletteId;

vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d)
{
    return a + b*cos(6.283185*(c*t+d));
}

void getPaletteParams(int id, out vec3 a, out vec3 b, out vec3 c, out vec3 d)
{
  
  if(id==0){ a=vec3(0.05,0.03,0.08); b=vec3(0.85,0.65,0.95); c=vec3(1.0); d=vec3(0.00,0.20,0.55); } 
  else if(id==1){ a=vec3(0.02,0.01,0.05); b=vec3(1.00,0.35,1.00); c=vec3(1.0); d=vec3(0.05,0.10,0.75); } 
  else if(id==2){ a=vec3(0.10,0.18,0.14); b=vec3(0.70,0.90,0.55); c=vec3(1.0); d=vec3(0.15,0.45,0.75); } 
  else if(id==3){ a=vec3(0.08,0.02,0.01); b=vec3(1.00,0.65,0.25); c=vec3(1.0); d=vec3(0.05,0.15,0.30); } 
  else if(id==4){ a=vec3(0.02,0.06,0.10); b=vec3(0.65,0.95,1.00); c=vec3(1.0); d=vec3(0.10,0.30,0.60); } 
  else if(id==5){ a=vec3(0.08,0.06,0.02); b=vec3(1.00,0.90,0.40); c=vec3(1.0); d=vec3(0.08,0.18,0.28); } 
  else if(id==6){ a=vec3(0.03,0.07,0.03); b=vec3(0.50,1.00,0.65); c=vec3(1.0); d=vec3(0.10,0.35,0.55); } 
  else if(id==7){ a=vec3(0.07,0.05,0.02); b=vec3(1.00,0.85,0.20); c=vec3(1.0); d=vec3(0.00,0.10,0.20); } 
  else if(id==8){ a=vec3(0.07,0.02,0.04); b=vec3(1.00,0.55,0.30); c=vec3(1.0); d=vec3(0.05,0.25,0.45); } 
  else { a=vec3(0.02,0.03,0.08); b=vec3(0.35,1.00,1.00); c=vec3(1.0); d=vec3(0.05,0.35,0.55); } 
}

void main(){
  if(vAlive < 0.5) discard;

  vec2 p = gl_PointCoord * 2.0 - vec2(1.0);
  float r2 = dot(p, p);
  if(r2 > 1.0) discard;

  vec3 A,B,C,D;
  getPaletteParams(uPaletteId, A,B,C,D);
  vec3 particleCol = max(palette(0.85, A,B,C,D), vec3(0.0));

  float softness = clamp(uDotSigma, 0.08, 0.65);
  float halo = exp(-r2 / softness) * (1.0 - smoothstep(0.72, 1.0, r2));
  float body = 1.0 - smoothstep(0.16, 0.72, r2);
  float core = 1.0 - smoothstep(0.0, 0.13, r2);

  vec3 col = mix(particleCol * 0.72, particleCol * 1.18, body);
  col = mix(col, vec3(1.0, 0.98, 0.88), core * 0.92);

  float a = uDotGain * (11.72 * halo + 0.78 * body + 0.28 * core);
  a = clamp(a, 0.0, 0.92);

  fragColor = vec4(col, a);
}
