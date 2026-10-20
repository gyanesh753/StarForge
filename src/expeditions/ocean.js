import * as THREE from 'three';
import { earthSkyGLSL, oceanProfile, waveGLSL, waveSlopeGLSL, waterHeight } from './earth-profile.js';

export function makeEarthSky(profile) {
  return new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(profile.skyTop) },
      uHorizon: { value: new THREE.Color(profile.skyHorizon) },
      uSun: { value: new THREE.Vector3(...profile.lightDirection).normalize() },
      uNight: { value: Number(profile.night) }, uTime: { value: 0 },
      uWater: { value: new THREE.Color(profile.waterVeil) }, uHigh: { value: 0 },
      uReflecting: { value: 0 },
    },
    vertexShader: 'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec3 vDirection; uniform vec3 uTop,uHorizon,uSun,uWater; uniform float uNight,uTime,uReflecting;
      ${earthSkyGLSL}
      ${waveGLSL}
      void main(){
        vec3 color=earthSky(vDirection,uTop,uHorizon,uSun,uNight,uTime);
        if(uReflecting<.5&&cameraPosition.y<waterHeight(cameraPosition.xz,uTime))color=uWater;
        gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
}

// Water attenuation is evaluated per fragment over the part of the view ray
// inside the medium. This also works while the camera straddles the interface.
export function installOceanOptics(material, uniforms) {
  if (material.userData.oceanOptics || material.isShaderMaterial || material.isSpriteMaterial) return;
  material.userData.oceanOptics = true;
  const previous = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey.bind(material);
  const key = previousKey();
  material.onBeforeCompile = shader => {
    previous.call(material, shader);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOceanPosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      vec4 oceanPosition=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
        oceanPosition=instanceMatrix*oceanPosition;
      #endif
      vOceanPosition=(modelMatrix*oceanPosition).xyz;
      #include <project_vertex>
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vOceanPosition;
      uniform vec3 uWaterExtinction,uWaterScatter,uWaterVeil;
      uniform float uOceanTime,uOceanNight,uOceanReflecting;
      ${waveGLSL}
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <tonemapping_fragment>', `
      float endpointHeight=vOceanPosition.y-waterHeight(vOceanPosition.xz,uOceanTime);
      float cameraHeight=cameraPosition.y-waterHeight(cameraPosition.xz,uOceanTime);
      float underwaterFraction=0.0;
      if(endpointHeight<0.0&&cameraHeight<0.0)underwaterFraction=1.0;
      else if(endpointHeight<0.0)underwaterFraction=-endpointHeight/max(cameraHeight-endpointHeight,.001);
      else if(cameraHeight<0.0)underwaterFraction=-cameraHeight/max(endpointHeight-cameraHeight,.001);
      float waterPath=distance(cameraPosition,vOceanPosition)*underwaterFraction;
      if(uOceanReflecting>.5)waterPath=0.0;
      if(endpointHeight<0.0){
        float illumination=exp(min(vOceanPosition.y,0.0)*.023);
        vec2 c=vOceanPosition.xz*.8+vec2(uOceanTime*.35,-uOceanTime*.18);
        float caustic=pow(max(0.0,1.0-abs(sin(c.x+sin(c.y*.73))*sin(c.y+sin(c.x*.91)))),18.0);
        gl_FragColor.rgb*=illumination*(1.0+caustic*.8*(1.0-uOceanNight)*exp(vOceanPosition.y*.055));
      }
      vec3 transmission=exp(-uWaterExtinction*waterPath);
      vec3 veil=uWaterVeil*(1.0-exp(-uWaterScatter*waterPath));
      gl_FragColor.rgb=gl_FragColor.rgb*transmission+veil;
      #include <tonemapping_fragment>
    `);
  };
  material.customProgramCacheKey = () => key + ':ocean-optics-v1';
  material.needsUpdate = true;
}

function surfaceGeometry(mobile) {
  const resolution = mobile ? 128 : 192;
  const count = resolution + 1, positions = [], indices = [];
  const coordinate = t => {
    const a = Math.abs(t);
    return Math.sign(t) * (a < .72 ? a / .72 * 160 : 160 + ((a - .72) / .28) ** 3 * 120000);
  };
  for (let z = 0; z < count; z++) for (let x = 0; x < count; x++) {
    positions.push(coordinate(x / resolution * 2 - 1), 0, coordinate(z / resolution * 2 - 1));
    if (x < resolution && z < resolution) {
      const i = z * count + x;
      indices.push(i, i + count, i + 1, i + 1, i + count, i + count + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

export class Ocean {
  constructor(renderer, scene, camera, profile, mobile) {
    this.renderer = renderer; this.scene = scene; this.camera = camera; this.profile = profile; this.mobile = mobile;
    this.time = 0; this.submerged = false; this.lampEnabled = true;
    this.optics = {
      uWaterExtinction: { value: new THREE.Vector3(...oceanProfile.extinction) },
      uWaterScatter: { value: new THREE.Vector3(...oceanProfile.backscatter) },
      uWaterVeil: { value: new THREE.Color(profile.waterVeil) },
      uOceanTime: { value: 0 }, uOceanNight: { value: Number(profile.night) },
      uOceanReflecting: { value: 0 },
    };
    this.refraction = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.refraction.depthTexture = new THREE.DepthTexture(1, 1);
    this.reflection = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.mirrorCamera = new THREE.PerspectiveCamera();
    this.reflectionMatrix = new THREE.Matrix4();
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.05);
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 }, uNight: { value: Number(profile.night) },
        uScene: { value: this.refraction.texture }, uDepth: { value: this.refraction.depthTexture },
        uReflection: { value: this.reflection.texture }, uReflectionMatrix: { value: this.reflectionMatrix },
        uSize: { value: new THREE.Vector2() }, uNear: { value: camera.near }, uFar: { value: camera.far },
        uTop: { value: new THREE.Color(profile.skyTop) }, uHorizon: { value: new THREE.Color(profile.skyHorizon) },
        uSource: { value: new THREE.Vector3(...profile.lightDirection).normalize() },
        uVeil: this.optics.uWaterVeil,
      },
      vertexShader: `uniform float uTime;uniform mat4 uReflectionMatrix;varying vec3 vWorld;varying vec4 vReflection;
        ${waveGLSL}
        void main(){vec4 p=modelMatrix*vec4(position,1.0);p.y=waterHeight(p.xz,uTime);vWorld=p.xyz;vReflection=uReflectionMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader: `
        uniform sampler2D uScene,uDepth,uReflection;
        uniform float uTime,uNight,uNear,uFar;uniform vec2 uSize;
        uniform vec3 uTop,uHorizon,uSource,uVeil;
        varying vec3 vWorld;varying vec4 vReflection;
        ${waveGLSL}
        ${waveSlopeGLSL}
        ${earthSkyGLSL}
        #include <packing>
        float rippleNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(skyHash(i),skyHash(i+vec2(1,0)),f.x),mix(skyHash(i+vec2(0,1)),skyHash(i+vec2(1,1)),f.x),f.y);}
        float ripples(vec2 p){float detail=1.0-smoothstep(.3,2.0,length(fwidth(p)));return (rippleNoise(p*.36+vec2(uTime*.09,-uTime*.06))*.18+rippleNoise(p*1.8+vec2(uTime*.7,-uTime*.3))*.035+sin(dot(p,vec2(-.8,2.1))-uTime*1.7+rippleNoise(p*.8)*4.0)*.006)*detail;}
        void main(){
          vec2 p=vWorld.xz;float h=ripples(p);
          vec2 slope=waterSlope(p,uTime)+vec2(ripples(p+vec2(.12,0))-h,ripples(p+vec2(0,.12))-h)/.12;
          vec3 n=normalize(vec3(-slope.x,1.0,-slope.y));
          vec3 view=normalize(cameraPosition-vWorld);
          float distanceToWater=distance(cameraPosition,vWorld);
          n=normalize(mix(vec3(0,1,0),n,1.0-smoothstep(1800.0,12000.0,distanceToWater)));
          vec2 screen=gl_FragCoord.xy/uSize;
          vec2 distorted=clamp(screen+n.xz*.009*min(1.0,10.0/max(distanceToWater,1.0)),.002,.998);
          vec3 behind=texture2D(uScene,distorted).rgb;
          vec3 color;
          if(cameraPosition.y<waterHeight(cameraPosition.xz,uTime)){
            // The underside uses an approximate Snell window. Outside the
            // critical angle the water reflects its darker surroundings.
            float cosine=clamp(dot(-n,view),0.0,1.0);
            vec3 refracted=refract(-view,-n,1.333);
            float window=smoothstep(.645,.69,cosine);
            vec3 sky=earthSky(refracted+vec3(0,.0001,0),uTop,uHorizon,uSource,uNight,uTime);
            float attenuation=exp(-distanceToWater*.035);
            color=mix(uVeil*.65,sky,window)*attenuation+uVeil*(1.0-attenuation);
            // The screen-space color contains objects ABOVE the interface;
            // sampling it here would leak unrefracted clouds through the sea.
          }else{
            float fresnel=.0204+.9796*pow(1.0-max(dot(n,view),0.0),5.0);
            vec3 reflected=earthSky(reflect(-view,n),uTop,uHorizon,uSource,uNight,uTime);
            vec2 uv=vReflection.xy/vReflection.w+n.xz*.018;
            if(uv.x>0.001&&uv.x<.999&&uv.y>.001&&uv.y<.999)reflected=texture2D(uReflection,uv).rgb;
            float rawDepth=texture2D(uDepth,screen).r;
            float sceneDistance=-perspectiveDepthToViewZ(rawDepth,uNear,uFar);
            float surfaceDistance=-perspectiveDepthToViewZ(gl_FragCoord.z,uNear,uFar);
            float thickness=max(0.0,sceneDistance-surfaceDistance);
            // Deep water has no transparent view to a remote seabed.
            behind=mix(behind,uVeil,1.0-exp(-thickness*.035));
            color=mix(behind,reflected,fresnel);
            float variance=dot(dFdx(n),dFdx(n))+dot(dFdy(n),dFdy(n));
            float exponent=clamp(2.0/(.0057+variance*3.0)-2.0,30.0,350.0);
            float highlight=pow(max(dot(reflect(-uSource,n),view),0.0),exponent)*exponent/350.0;
            color+=mix(vec3(1.0,.85,.55),vec3(.38,.53,.75),uNight)*highlight*mix(.9,.3,uNight);
            float wash=(.5+.5*sin(uTime*1.1+p.x*.7+p.y*.4));
            float foam=(1.0-smoothstep(.1,1.4,thickness))*smoothstep(.55,.92,wash)*.45;
            color=mix(color,mix(vec3(.7,.8,.76),vec3(.08,.13,.17),uNight),foam);
            color=mix(color,uHorizon,1.0-exp(-pow(distanceToWater*.00012,2.0)));
          }
          gl_FragColor=vec4(color,1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.surface = new THREE.Mesh(surfaceGeometry(mobile), this.material);
    this.surface.frustumCulled = false; this.surface.name = 'Continuous ocean surface';
    scene.add(this.surface);
    this.lamp = new THREE.SpotLight('#d6f0ec', 0, 35, .62, .8, 1.3);
    scene.add(this.lamp, this.lamp.target);
    this.resize();
  }

  applyToScene() {
    this.scene.traverse(object => {
      if (!object.material || object === this.surface) return;
      for (const material of [object.material].flat()) installOceanOptics(material, this.optics);
    });
  }

  resize() {
    const canvas = this.renderer.domElement;
    const scale = Math.min(1, (this.mobile ? 640 : 1080) / canvas.width);
    this.refraction.setSize(Math.max(1, Math.round(canvas.width * scale)), Math.max(1, Math.round(canvas.height * scale)));
    const reflectScale = Math.min(1, (this.mobile ? 320 : 600) / canvas.width);
    this.reflection.setSize(Math.max(1, Math.round(canvas.width * reflectScale)), Math.max(1, Math.round(canvas.height * reflectScale)));
    this.material.uniforms.uSize.value.set(canvas.width, canvas.height);
  }

  update(time) {
    this.time = time;
    this.optics.uOceanTime.value = time; this.material.uniforms.uTime.value = time;
    this.material.uniforms.uFar.value = this.camera.far;
    this.depth = waterHeight(this.camera.position.x, this.camera.position.z, time) - this.camera.position.y;
    if (this.depth > .14) this.submerged = true;
    else if (this.depth < -.14) this.submerged = false;
    this.surface.position.set(Math.round(this.camera.position.x / 4) * 4, 0, Math.round(this.camera.position.z / 4) * 4);
    this.lamp.position.copy(this.camera.position);
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    this.lamp.target.position.copy(this.camera.position).addScaledVector(direction, 10);
    this.lamp.intensity = this.submerged && this.lampEnabled ? (this.profile.night ? 35 : 7) : 0;
  }

  render() {
    const { renderer, scene, camera } = this;
    const target = renderer.getRenderTarget();
    const clips = renderer.clippingPlanes;
    const shadowUpdate = renderer.shadowMap.autoUpdate;
    this.surface.visible = false;
    camera.updateMatrixWorld();
    try {
      if (!this.submerged) {
        const mirror = this.mirrorCamera;
        mirror.copy(camera, false);
        mirror.position.copy(camera.position); mirror.position.y *= -1;
        const direction = camera.getWorldDirection(new THREE.Vector3()); direction.y *= -1;
        mirror.up.set(0, -1, 0); mirror.lookAt(mirror.position.clone().add(direction)); mirror.updateMatrixWorld();
        this.reflectionMatrix.set(.5,0,0,.5, 0,.5,0,.5, 0,0,.5,.5, 0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
        // Sky is rendered as air even though the mirrored camera is below it.
        const sky = scene.children.find(object => object.material?.uniforms?.uHigh);
        const skyPosition=sky?.position.clone();
        if (sky) {sky.material.uniforms.uReflecting.value=1;sky.position.copy(mirror.position);}
        this.optics.uOceanReflecting.value=1;
        renderer.clippingPlanes = [this.clipPlane];
        renderer.setRenderTarget(this.reflection); renderer.clear(); renderer.render(scene, mirror);
        this.optics.uOceanReflecting.value=0;
        if (sky) {sky.material.uniforms.uReflecting.value=0;sky.position.copy(skyPosition);}
      }
      renderer.clippingPlanes = clips;
      // The submerged underside is analytic; it needs no extra scene pass.
      // Keep refraction fresh around the interface for either side of a wave.
      if (this.depth < .5) {
        renderer.shadowMap.autoUpdate = false;
        renderer.setRenderTarget(this.refraction); renderer.clear(); renderer.render(scene, camera);
      }
      this.surface.visible = true;
      renderer.setRenderTarget(target); renderer.render(scene, camera);
    } finally {
      this.surface.visible = true; renderer.setRenderTarget(target);
      renderer.clippingPlanes = clips; renderer.shadowMap.autoUpdate = shadowUpdate;
    }
  }

  dispose() { this.refraction.dispose(); this.reflection.dispose(); }
}
