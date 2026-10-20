import * as THREE from 'three';
import { noise } from './terrain.js';

const noiseGLSL = `
  float noiseHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise2(vec2 p){
    vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(noiseHash(i),noiseHash(i+vec2(1,0)),f.x),mix(noiseHash(i+vec2(0,1)),noiseHash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p){return noise2(p)*.57+noise2(p*2.03+17.1)*.28+noise2(p*4.13+31.7)*.15;}
`;

export function makeSky(config) {
  return new THREE.Mesh(new THREE.SphereGeometry(1,40,24),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{uTop:{value:new THREE.Color(config.sky.top)},uHorizon:{value:new THREE.Color(config.sky.horizon)},uBottom:{value:new THREE.Color(config.sky.ground)},uSun:{value:new THREE.Vector3(...config.sky.sunDirection).normalize()},uVacuum:{value:config.physics.atmosphere.includes('vacuum')?1:0},uHigh:{value:0}},
    vertexShader:`varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform vec3 uTop,uHorizon,uBottom,uSun; uniform float uVacuum,uHigh;varying vec3 vDirection;
      void main(){vec3 d=normalize(vDirection);float y=d.y;vec3 color=mix(uHorizon,uTop,pow(max(y,0.0),.45));color=mix(color,uBottom,(1.0-smoothstep(-.55,0.0,y)));float sun=dot(d,uSun);float disk=smoothstep(uVacuum>.5?.99992:.999985,1.0,sun);float glow=pow(max(sun,0.0),32.0)*.28*(1.0-uVacuum);color+=vec3(1.0,.8,.45)*(disk*3.0+glow);color=mix(color,color*.6,uHigh*.3);gl_FragColor=vec4(color,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  }));
}

export function makeWater() {
  const material=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uSky:{value:new THREE.Color('#a3cad4')}},
    vertexShader:`varying vec3 vWorld; uniform float uTime; void main(){vec3 p=position;p.z+=sin(p.x*.027+uTime*.5)*.35+sin(p.y*.04+uTime*.38)*.2;vWorld=(modelMatrix*vec4(p,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);}`,
    fragmentShader:`uniform float uTime;uniform vec3 uSky;varying vec3 vWorld;
    ${noiseGLSL}
    float waves(vec2 p){return fbm(p*.15+vec2(uTime*.15,-uTime*.08))*.7+sin(dot(p,vec2(.1,.035))+uTime*.7+fbm(p*.035)*3.0)*.3;}
    void main(){
      vec2 p=vWorld.xz;float w=waves(p);
      vec3 view=normalize(cameraPosition-vWorld);
      float fade=1.0-smoothstep(700.0,7000.0,distance(cameraPosition,vWorld));
      vec3 n=normalize(vec3((w-waves(p+vec2(.5,0)))*fade,1.0,(w-waves(p+vec2(0,.5)))*fade));
      float fresnel=pow(1.0-max(dot(n,view),0.0),3.0);
      vec3 color=mix(vec3(.012,.11,.14),uSky*.6,fresnel);
      color+=(w-.5)*.018*fade;
      vec3 sun=normalize(vec3(-.65,.38,-.7));
      float spec=pow(max(dot(reflect(-sun,n),view),0.0),240.0);
      color+=vec3(1.,.9,.65)*spec*.38;
      color=mix(color,uSky,1.0-exp(-pow(distance(cameraPosition,vWorld)*.00016,2.0)));
      gl_FragColor=vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(200000,200000,80,80),material);
  mesh.rotation.x=-Math.PI/2;mesh.position.y=.3;
  return mesh;
}

export function makeClouds(id,random) {
  const venus=id==='venus';
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const ctx=canvas.getContext('2d');
  const pixels=ctx.createImageData(canvas.width,canvas.height);
  const cloudNoise=(x,y)=>noise(x,y)*.56+noise(x*2.07+12,y*2.07)*.29+noise(x*4.13,y*4.13+31)*.15;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const px=x/canvas.width*2-1,py=y/canvas.height*2-1;
    const detail=cloudNoise(px*5+27,py*4+19);
    const shape=1-px*px-py*py+(detail-.5)*1.5;
    const alpha=THREE.MathUtils.smoothstep(shape,.1,.75)*THREE.MathUtils.smoothstep(1-Math.abs(px),0,.16)*THREE.MathUtils.smoothstep(1-Math.abs(py),0,.25);
    const shade=THREE.MathUtils.clamp(.78-py*.16+(detail-.5)*.3,.52,1);
    const i=(y*canvas.width+x)*4;
    pixels.data[i]=255*shade;pixels.data[i+1]=(venus?240:253)*shade;pixels.data[i+2]=(venus?207:255)*shade;pixels.data[i+3]=255*alpha;
  }
  ctx.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  const group=new THREE.Group();
  for(let i=0;i<(venus?75:60);i++) {
    const material=new THREE.SpriteMaterial({map,color:venus?'#f5e4bc':'#ffffff',opacity:venus?.74:.86,depthWrite:false,fog:false});
    const sprite=new THREE.Sprite(material);
    sprite.position.set((random()-.5)*(venus?95000:12000),venus?45000+random()*23000:1000+random()*650,(random()-.5)*(venus?95000:12000));
    const size=venus?11000+random()*19000:1000+random()*1800;
    sprite.scale.set(size,size*(venus?.3:.42),1);group.add(sprite);
    // Compose a few nearby cloud banks along the initial route as well as the
    // wider seeded layer. Their positions are artistic, not weather data.
    if(!venus&&i<3){
      sprite.position.set([-1700,900,-700][i],[1430,1160,1150][i],[-1900,-2600,-3500][i]);
      sprite.scale.set(1700+i*500,650+i*130,1);
    }
  }
  return group;
}

export function makeSolarStudy() {
  const material=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uMono:{value:0}},
    vertexShader:`varying vec2 vPlane;void main(){vPlane=position.xy;vec3 p=position;p.z=-dot(p.xy,p.xy)/139200.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`varying vec2 vPlane;uniform float uTime,uMono;
      ${noiseGLSL}
      vec2 hash(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
      void main(){
        vec2 original=vPlane/100.0;
        vec2 p=original+vec2(fbm(original*2.7+uTime*.04),fbm(original*2.7+vec2(7.3,-uTime*.04)))*.55;
        vec2 cell=floor(p),f=fract(p);float first=10.0,second=10.0;
        for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){
          vec2 g=vec2(float(x),float(y));vec2 h=hash(cell+g);
          vec2 o=.5+.33*sin(uTime*.16+6.283*h);float d=length(g+o-f);
          if(d<first){second=first;first=d;}else{second=min(second,d);}
        }}
        float edge=smoothstep(.015,.24,second-first);
        float boil=fbm(original*19.0+uTime*.15);
        float intensity=.25+edge*.8+boil*.32;
        intensity=mix(intensity,.85,smoothstep(.08,.6,length(fwidth(original))));
        vec3 color=mix(vec3(.25,.025,.002),vec3(1.65,.66,.12),intensity);
        vec2 spot=(vPlane-vec2(260.,290.))/vec2(120.,95.);
        float radius=length(spot)+(fbm(original*3.0)-.5)*.14;
        float penumbra=.56+.24*noise2(vec2(atan(spot.y,spot.x)*50.0,radius*6.0));
        float dim=mix(.065,penumbra,smoothstep(.38,.7,radius));
        dim=mix(dim,1.0,smoothstep(.75,1.25,radius));
        color*=dim;
        color=mix(color,vec3(dot(color,vec3(.3,.59,.11))),uMono);
        gl_FragColor=vec4(color,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  });
  const surface=new THREE.Mesh(new THREE.PlaneGeometry(12000,12000,80,80),material);surface.rotation.x=-Math.PI/2;
  const loops=new THREE.Group();const curves=[];
  for(let i=0;i<12;i++) {
    const points=[];
    for(let j=0;j<=60;j++) {
      const t=j/60*Math.PI;
      points.push(new THREE.Vector3(-310+Math.cos(t)*(175+i*6)+Math.sin(t*5+i)*4,Math.sin(t)*(265+i*7)+7,-330+Math.sin(t*1.4)*40+i*5+Math.sin(t*3+i)*8));
    }
    const curve=new THREE.CatmullRomCurve3(points);curves.push(curve);
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,70,.55+i*.04,5,false),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(.035+i*.003,1,.53),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
    loops.add(tube);
    loops.add(new THREE.Mesh(new THREE.TubeGeometry(curve,70,3.5,5,false),new THREE.MeshBasicMaterial({color:'#ff6e14',transparent:true,opacity:.035,blending:THREE.AdditiveBlending,depthWrite:false})));
  }
  const positions=new Float32Array(100*3);
  const particles=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:'#fff2bb',size:3,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
  particles.geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));loops.add(particles);
  return {surface,loops,update(time){material.uniforms.uTime.value=time;for(let i=0;i<100;i++){const p=curves[i%curves.length].getPointAt((i/100+time*.025)%1);positions.set([p.x,p.y,p.z],i*3);}particles.geometry.attributes.position.needsUpdate=true;}};
}
