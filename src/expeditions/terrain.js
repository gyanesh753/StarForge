import * as THREE from 'three';

export function seededRandom(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

function hash(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  let fx = x-ix, fz = z-iz;
  fx = fx*fx*(3-2*fx); fz = fz*fz*(3-2*fz);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iz), hash(ix+1,iz), fx), THREE.MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),fx),fz);
}

function fbm(x,z) { return noise(x,z)*0.57+noise(x*2.1,z*2.1)*0.28+noise(x*4.4,z*4.4)*0.15; }
const smooth = (a,b,v) => THREE.MathUtils.smoothstep(v,a,b);
const hill = (x,z,cx,cz,width,height) => Math.exp(-((x-cx)**2+(z-cz)**2)/(width*width))*height;

export function createTerrainRecipe(id, seed) {
  const random = seededRandom(seed);
  const craters = [{ x: 0, z: -230, r: 320, depth: 68 }];
  for (let i=0;i<28;i++) craters.push({ x:(random()-.5)*6500, z:(random()-.5)*6500, r:55+random()*220, depth:15+random()*47 });
  const height = (x,z) => {
    const n = fbm(x*.004+seed,z*.004)-.5;
    if (id === 'earth') {
      const coast = -180 + Math.sin(z*.003)*95 + Math.sin(z*.009)*28;
      const land = smooth(-100,95,x-coast);
      const sea=-8-smooth(0,950,coast-x)*46+n*7+hill(x,z,-390,-110,70,6);
      const ground=31+n*49+hill(x,z,340,-230,360,130)+hill(x,z,600,-1150,600,450)+hill(x,z,1100,-1750,450,700)+Math.sin(x*.015+z*.007)*5;
      return THREE.MathUtils.lerp(sea,ground,land);
    }
    if (id === 'mercury') {
      let y = 14+n*29 + smooth(310,410,x+Math.sin(z*.004)*60)*70;
      for (const c of craters) {
        const r = Math.hypot(x-c.x,z-c.z)/c.r;
        if (r < 1.5) y += -c.depth*Math.max(0,1-r*r)**2+c.depth*.56*Math.exp(-(((r-1)/.105)**2));
      }
      return y;
    }
    return 8+n*23+Math.sin(z*.013+x*.003)*3+hill(x,z,400,-450,500,65)+hill(x,z,-900,-1600,900,350)+hill(x,z,1200,-2400,1000,420);
  };
  return { height, craters };
}

function coordinate(t) {
  const a = Math.abs(t);
  return Math.sign(t)*(a <= .75 ? a*1800 : 1350+((a-.75)/.25)**2*4650);
}
function inverseCoordinate(x) {
  const a = Math.abs(x);
  return Math.sign(x)*(a <= 1350 ? a/1800 : .75+Math.sqrt((a-1350)/4650)*.25);
}

export function buildTerrain(id, config, resolution) {
  const recipe = createTerrainRecipe(id,config.play.seed);
  const count = resolution+1;
  const heights = new Float32Array(count*count);
  const positions = new Float32Array(count*count*3);
  const uvs = new Float32Array(count*count*2);
  const colors = new Float32Array(count*count*3);
  const indices = [];
  const color = new THREE.Color();
  for (let z=0;z<count;z++) for (let x=0;x<count;x++) {
    const px = coordinate(x/resolution*2-1), pz = coordinate(z/resolution*2-1);
    const h = recipe.height(px,pz), i = z*count+x;
    heights[i]=h;
    positions.set([px,h,pz],i*3);
    uvs.set([px/70,pz/70],i*2);
    const n = noise(px*.018,pz*.018);
    if (id === 'earth') {
      color.set(h<0 ? '#a49f80' : h<4 ? '#4b5350' : h<24 ? '#59634b' : '#526148');
      if (h>290) color.lerp(new THREE.Color('#666660'),smooth(290,600,h));
      color.multiplyScalar(.75+n*.45);
    } else if (id === 'mercury') {
      color.set('#807e76').multiplyScalar(.71+n*.46);
      const hollow = Math.hypot(px+245,pz+170);
      if(hollow<83) color.lerp(new THREE.Color('#b2b5a7'),(1-hollow/83)*.6);
    } else color.set('#69645a').multiplyScalar(.7+n*.4);
    colors.set([color.r,color.g,color.b],i*3);
    if(x<resolution && z<resolution) {
      const a=i,b=i+1,c=i+count,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:1, metalness:0 });
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGround;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGround = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vGround;\nfloat hashGround(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat grain(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hashGround(i),hashGround(i+vec2(1,0)),f.x),mix(hashGround(i+vec2(0,1)),hashGround(i+vec2(1,1)),f.x),f.y);}`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\n#ifdef USE_MAP\ndiffuseColor.rgb = ${id==='earth'?'sqrt(diffuseColor.rgb)*2.2':'vec3(sqrt(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))))*2.3'};\n#endif`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat detail = grain(vGround.xz*3.0)*.13+grain(vGround.xz*.35)*.12;\ndiffuseColor.rgb *= .85+detail;');
  };
  const mesh = new THREE.Mesh(geometry,material);
  mesh.receiveShadow = true;

  // Barycentric interpolation of the exact rendered triangles, including the
  // non-uniform grid. Walking and landing use the same surface as rendering.
  const heightAt = (px,pz) => {
    const gx = THREE.MathUtils.clamp((inverseCoordinate(px)+1)*.5*resolution,0,resolution-.00001);
    const gz = THREE.MathUtils.clamp((inverseCoordinate(pz)+1)*.5*resolution,0,resolution-.00001);
    const x=Math.floor(gx),z=Math.floor(gz);
    const x0=coordinate(x/resolution*2-1),x1=coordinate((x+1)/resolution*2-1);
    const z0=coordinate(z/resolution*2-1),z1=coordinate((z+1)/resolution*2-1);
    const fx=THREE.MathUtils.clamp((px-x0)/(x1-x0),0,1),fz=THREE.MathUtils.clamp((pz-z0)/(z1-z0),0,1);
    const a=heights[z*count+x],b=heights[z*count+x+1],c=heights[(z+1)*count+x],d=heights[(z+1)*count+x+1];
    return fx+fz<=1 ? a+(b-a)*fx+(c-a)*fz : d+(c-d)*(1-fx)+(b-d)*(1-fz);
  };
  return { mesh,heightAt,recipe };
}

export function populateTerrain(scene, id, config, heightAt, mobile) {
  const random=seededRandom(config.play.seed+18);
  const transform=new THREE.Object3D();
  const color=new THREE.Color();
  const count=mobile?260:570;
  const rockGeometry=new THREE.IcosahedronGeometry(1,2);
  const vertices=rockGeometry.attributes.position;
  for(let i=0;i<vertices.count;i++) {
    const variation=.8+noise(vertices.getX(i)*3.4+vertices.getY(i)*1.9,vertices.getZ(i)*3.7)*.3;
    vertices.setXYZ(i,vertices.getX(i)*variation,vertices.getY(i)*variation,vertices.getZ(i)*variation);
  }
  rockGeometry.computeVertexNormals();
  const rocks=new THREE.InstancedMesh(rockGeometry,new THREE.MeshStandardMaterial({color:id==='mercury'?'#827d72':'#53534b',roughness:1,flatShading:true}),count);
  const obstacles=[];
  let placed=0;
  for(let i=0;placed<count && i<count*5;i++) {
    const x=(random()-.5)*2800,z=(random()-.5)*2800,h=heightAt(x,z);
    if(id==='earth' && h<1) continue;
    const size=1+random()**3*13;
    const sy=id==='venus'?.25+random()*.35:.5+random()*.6;
    transform.position.set(x,h+size*sy*.25,z);
    transform.scale.set(size*(id==='venus'?1.8:1),size*sy,size);
    transform.rotation.set(random()*.3,random()*6.28,random()*.3);
    transform.updateMatrix();rocks.setMatrixAt(placed,transform.matrix);
    color.setScalar(.7+random()*.5);rocks.setColorAt(placed,color);
    if(size>2) obstacles.push({x,z,r:size*(id==='venus'?1.8:1),top:h+size*sy*1.2});
    placed++;
  }
  rocks.count=placed;rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
  if(id==='earth') {
    const treeCount=mobile?170:390;
    const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshStandardMaterial({color:'#3c5940',roughness:1}),treeCount*4);
    const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.32,1,5),new THREE.MeshStandardMaterial({color:'#534c3c',roughness:1}),treeCount);
    let tree=0;
    for(let i=0;tree<treeCount && i<5000;i++) {
      const x=random()*1150+80,z=(random()-.55)*1800,h=heightAt(x,z);
      if(h<45 || h>250 || noise(x*.015,z*.015)<.35) continue;
      const size=6+random()*12;
      transform.position.set(x,h+size*.35,z);transform.scale.set(1,size*.7,1);transform.rotation.set(0,0,0);transform.updateMatrix();trunks.setMatrixAt(tree,transform.matrix);
      for(let j=0;j<4;j++) {
        const angle=j*2.4;
        transform.position.set(x+Math.sin(angle)*size*.16,h+size*(.75+j*.06),z+Math.cos(angle)*size*.16);
        transform.scale.set(size*(.21+random()*.06),size*(.3+random()*.1),size*.24);transform.updateMatrix();crowns.setMatrixAt(tree*4+j,transform.matrix);
        color.setScalar(.72+random()*.5);crowns.setColorAt(tree*4+j,color);
      }
      obstacles.push({x,z,r:.5,top:h+size});tree++;
    }
    crowns.count=tree*4;trunks.count=tree;crowns.castShadow=true;trunks.castShadow=true;scene.add(crowns,trunks);
  }
  return obstacles;
}
