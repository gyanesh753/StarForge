// One authored lighting scenario drives the sky, water, land, and marine life.
// Optical coefficients and visibility assistance are art settings, not measurements.
export const oceanProfile = {
  meanLevel: 0,
  refractiveIndex: 1.333,
  extinction: [0.16, 0.055, 0.037],
  backscatter: [0.035, 0.045, 0.05],
  waves: [
    { direction: [0.8, 0.6], wavelength: 24, amplitude: 0.24, phase: 0.3 },
    { direction: [-0.28, 0.96], wavelength: 11, amplitude: 0.105, phase: 1.7 },
    { direction: [0.96, -0.28], wavelength: 6.5, amplitude: 0.045, phase: 3.1 },
  ],
};

export function waterHeight(x, z, time = 0) {
  return oceanProfile.waves.reduce((height, wave) => {
    const k = 2 * Math.PI / wave.wavelength;
    return height + wave.amplitude * Math.sin(k * (wave.direction[0] * x + wave.direction[1] * z) - Math.sqrt(9.81 * k) * time + wave.phase);
  }, oceanProfile.meanLevel);
}

// Generated from the same definition used by the movement controller. Vertical
// displacement only: no Gerstner-coordinate inversion or mismatched query mesh.
export const waveGLSL = `
float waterHeight(vec2 p, float t) {
  return ${oceanProfile.waves.map(w => {
    const k = 2 * Math.PI / w.wavelength;
    return `${w.amplitude.toFixed(5)} * sin(dot(p, vec2(${(w.direction[0] * k).toFixed(8)}, ${(w.direction[1] * k).toFixed(8)})) - ${Math.sqrt(9.81 * k).toFixed(8)} * t + ${w.phase.toFixed(5)})`;
  }).join(' + ')};
}`;

// Filter shading slopes by their pixel footprint so distant waves do not
// become moire bands. Geometry and movement retain the shared height field.
export const waveSlopeGLSL = `
vec2 waterSlope(vec2 p, float t) {
  vec2 slope=vec2(0.0);
  ${oceanProfile.waves.map((w, i) => {
    const k = 2 * Math.PI / w.wavelength;
    return `vec2 k${i}=vec2(${(w.direction[0] * k).toFixed(8)},${(w.direction[1] * k).toFixed(8)});
      float phase${i}=dot(p,k${i})-${Math.sqrt(9.81 * k).toFixed(8)}*t+${w.phase.toFixed(5)};
      float footprint${i}=abs(dot(dFdx(p),k${i}))+abs(dot(dFdy(p),k${i}));
      slope+=k${i}*${w.amplitude.toFixed(5)}*cos(phase${i})*exp(-footprint${i}*footprint${i}*.5);`;
  }).join('\n')}
  return slope;
}`;

export function earthScenario(night = false) {
  return {
    night,
    name: night ? 'The coast after dark' : 'The breathing coast',
    invitation: night ? 'A quieter sky. A living sea.' : 'Another world beneath the waves.',
    lightDirection: night ? [-0.57, 0.25, -0.78] : [-0.65, 0.38, -0.7],
    skyTop: night ? '#030b1b' : '#125d9a',
    skyHorizon: night ? '#172d40' : '#a3cad4',
    skyGround: night ? '#020608' : '#596950',
    lightColor: night ? '#c4d7ff' : '#fff2d9',
    lightIntensity: night ? 0.32 : 3.1,
    ambientIntensity: night ? 0.17 : 1.4,
    waterVeil: night ? '#05141c' : '#165e67',
    exposure: night ? 1.2 : 1.12,
  };
}

export const earthSkyGLSL = `
float skyHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec3 earthSky(vec3 direction, vec3 top, vec3 horizon, vec3 source, float night, float time) {
  vec3 d=normalize(direction);
  vec3 color=mix(horizon,top,pow(max(d.y,0.0),.48));
  color*=.65+.35*smoothstep(-.12,.15,d.y);
  float sourceDot=dot(d,source);
  float disk=smoothstep(.999986,.999991,sourceDot);
  if(night>.5) {
    vec2 spherical=vec2(atan(d.z,d.x)*100.0,asin(clamp(d.y,-1.0,1.0))*100.0);
    vec2 cell=floor(spherical), local=fract(spherical)-.5;
    float hash=skyHash(cell);
    float star=exp(-dot(local,local)*700.0)*step(.976,hash);
    float twinkle=.82+.18*sin(time*.7+hash*173.0);
    color+=vec3(.48,.58,.73)*star*twinkle*smoothstep(.04,.35,d.y);
    // Full-moon composition, roughly half a degree across. No ephemeris claim.
    vec3 tangent=normalize(cross(source,vec3(0,1,0)));
    vec2 moonUV=vec2(dot(d,tangent),dot(d,cross(tangent,source)))*220.0;
    float markings=.7+.3*skyHash(floor(moonUV*13.0));
    color+=vec3(.8,.88,1.0)*disk*markings;
    color+=vec3(.06,.075,.1)*pow(max(sourceDot,0.0),800.0);
  } else {
    color+=vec3(1.0,.85,.6)*(disk*3.0+pow(max(sourceDot,0.0),32.0)*.22);
  }
  return color;
}`;
