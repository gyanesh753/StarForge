import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, noise } from './terrain.js';

export const marineSpecies = {
  anchovy: { name: 'Northern anchovy', scientificName: 'Engraulis mordax', lengthMeters: [0.13, 0.22] },
  jelly: { name: 'Crystal jelly', scientificName: 'Aequorea victoria', bellDiameterMeters: [0.15, 0.25] },
};

function fishGeometry() {
  const positions = [], indices = [];
  const rings = 14, sides = 8;
  for (let z = 0; z <= rings; z++) {
    const t = z / rings, width = Math.sin(Math.PI * t) ** .8;
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2;
      positions.push(Math.cos(angle) * width * .11, Math.sin(angle) * width * .14, t - .5);
      if (z < rings && j < sides) {
        const a = z * (sides + 1) + j, b = a + sides + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  // A forked tail and a dorsal fin retain a fish silhouette at small scale.
  let i = positions.length / 3;
  positions.push(0,0,-.35, 0,.22,-.64, 0,.02,-.56, 0,-.22,-.64);
  indices.push(i,i+1,i+2,i,i+2,i+3);
  i = positions.length / 3;
  positions.push(0,.08,-.18,0,.3,-.14,0,.13,.15);
  indices.push(i,i+1,i+2);
  // Include the tail in the stated body length, rather than extending an
  // already full-length body beyond the species' representative size range.
  for(let i=2;i<positions.length;i+=3)positions[i]=(positions[i]+.07)/1.14;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function jellyBellGeometry() {
  const profile = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14 * Math.PI * .5;
    profile.push(new THREE.Vector2(Math.sin(t), Math.cos(t) * .55));
  }
  return new THREE.LatheGeometry(profile, 28);
}

function kelpGeometry() {
  const parts = [];
  const stem = new THREE.CylinderGeometry(.007, .014, 1, 5, 12);
  stem.translate(0, .5, 0); parts.push(stem);
  // A slender stipe with staggered, pointed blades. The leaf curvature and
  // separate lateral orientations keep the silhouette organic from any angle.
  for (let leaf = 0; leaf < 13; leaf++) {
    const root = .12 + leaf * .061, side = leaf % 2 ? 1 : -1;
    const length = .12 + Math.sin(leaf / 13 * Math.PI) * .12;
    const positions = [], indices = [], uv = [], segments = 8;
    for (let j = 0; j <= segments; j++) {
      const t = j / segments, width = Math.sin(Math.PI * t) ** .75 * .04;
      const angle = leaf * 2.4;
      for (const edge of [-1, 1]) {
        const outward = side * length * t;
        positions.push(outward * Math.cos(angle) + edge * width * Math.sin(angle),
          root + t * .08 - t * t * .055,
          outward * Math.sin(angle) - edge * width * Math.cos(angle) + Math.sin(t * Math.PI) * .025);
        uv.push(t, (edge + 1) / 2);
      }
      if (j < segments) {const i = j * 2; indices.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);}
    }
    const blade = new THREE.BufferGeometry();
    blade.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    blade.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    blade.setIndex(indices); blade.computeVertexNormals(); parts.push(blade);
  }
  const geometry = mergeGeometries(parts); parts.forEach(part => part.dispose());
  return geometry;
}

export class MarineLife {
  constructor(scene, heightAt, profile, mobile) {
    this.scene = scene; this.heightAt = heightAt; this.profile = profile;
    this.group = new THREE.Group(); this.group.name = 'Temperate coastal community'; scene.add(this.group);
    this.timeUniform = { value: 0 }; this.random = seededRandom(81247);
    this.makeHabitat(mobile);
    this.makeFish(mobile);
    this.makeJellies(mobile);
    this.makeParticles(mobile);
  }

  makeHabitat(mobile) {
    const random = this.random, transform = new THREE.Object3D();
    const count = mobile ? 110 : 210;
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const deformation = .8 + noise(vertices.getX(i) * 3 + vertices.getY(i), vertices.getZ(i) * 4) * .3;
      vertices.setXYZ(i, vertices.getX(i) * deformation, vertices.getY(i) * deformation, vertices.getZ(i) * deformation);
    }
    geometry.computeVertexNormals();
    const rocks = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color: '#6c7166', roughness: .94 }), count);
    this.obstacles = [];
    for (let i = 0; i < count; i++) {
      const x = -170 - random() * 600, z = -350 + random() * 750, y = this.heightAt(x, z);
      const size = .4 + random() ** 2 * 5;
      transform.position.set(x, y + size * .25, z); transform.scale.set(size, size * .8, size * .7);
      transform.rotation.set(random(), random() * 6.28, random() * .4); transform.updateMatrix();
      rocks.setMatrixAt(i, transform.matrix);
      rocks.setColorAt(i, new THREE.Color().setScalar(.7 + random() * .5));
      this.obstacles.push({ x, z, r: size, top: y + size });
    }
    rocks.castShadow = true; rocks.receiveShadow = true; this.group.add(rocks);

    // Sparse ribbon kelp rather than a tropical coral reef on this coast.
    const kelpMaterial = new THREE.MeshStandardMaterial({ color: '#727549', side: THREE.DoubleSide, roughness: .85 });
    kelpMaterial.onBeforeCompile = shader => {
      shader.uniforms.uMarineTime = this.timeUniform;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uMarineTime;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float height=max(position.y,0.0);
        transformed.x+=sin(height*2.8+uMarineTime*.55+instanceMatrix[3].x*.08)*height*height*.24;
        transformed.z+=cos(height*2.1+uMarineTime*.4+instanceMatrix[3].z*.08)*height*height*.18;`);
    };
    const blade = kelpGeometry();
    const blades = new THREE.InstancedMesh(blade, kelpMaterial, mobile ? 240 : 470);
    let placed = 0;
    for (let i = 0; placed < blades.count && i < 5000; i++) {
      const x = -290 - random() * 200, z = -170 + random() * 300, ground = this.heightAt(x, z);
      if (ground > -4 || noise(x * .035, z * .035) < .48) continue;
      const length = Math.min(-ground - 1, 2 + random() * 8);
      transform.position.set(x, ground, z); transform.scale.set(1.6 + random() * 1.8, length, 1.6 + random());
      transform.rotation.set(0, random() * Math.PI, (random() - .5) * .2); transform.updateMatrix();
      blades.setMatrixAt(placed++, transform.matrix);
    }
    blades.count = placed; this.group.add(blades);
  }

  makeFish(mobile) {
    const count = mobile ? 180 : 360, random = this.random;
    const geometry = fishGeometry();
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) phases[i] = random() * Math.PI * 2;
    geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    const material = new THREE.MeshStandardMaterial({ color: '#b9d0cd', roughness: .32, metalness: .25, side: THREE.DoubleSide });
    material.onBeforeCompile = shader => {
      shader.uniforms.uMarineTime = this.timeUniform;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uMarineTime;attribute float aPhase;varying float vFishSide;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.x+=sin(uMarineTime*9.0+aPhase-position.z*6.0)*pow(max(.5-position.z,0.0),2.0)*.08;
        vFishSide=position.y;`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFishSide;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb*=mix(vec3(.25,.4,.42),vec3(1.),1.0-smoothstep(.015,.09,vFishSide));');
    };
    this.fishMesh = new THREE.InstancedMesh(geometry, material, count);
    this.fishMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.fishMesh.frustumCulled = false; this.group.add(this.fishMesh);
    this.schools = [new THREE.Vector3(-225,-7,180), new THREE.Vector3(-385,-3.7,-95), new THREE.Vector3(-305,-10,110)];
    this.fish = Array.from({ length: count }, (_, i) => ({
      school: i % 3, phase: phases[i], radius: 1.4 + random() * 4.5,
      elevation: (random() - .5) * 3.5, length: .13 + random() * .09,
      position: this.schools[i % 3].clone(), previous: new THREE.Vector3(),
    }));
    this.transform = new THREE.Object3D(); this.forward = new THREE.Vector3(0,0,1);
  }

  makeJellies(mobile) {
    this.jellies = [];
    const random = this.random, count = mobile ? 18 : 30;
    const bellGeometry = jellyBellGeometry();
    const rimGeometry = new THREE.TorusGeometry(1, .025, 5, 64); rimGeometry.rotateX(Math.PI / 2);
    const strands = [];
    for (let j = 0; j < 14; j++) {
      const points = [], a = j / 14 * Math.PI * 2;
      for (let k = 0; k < 10; k++) points.push(new THREE.Vector3(Math.cos(a)*.94,-k*.23,Math.sin(a)*.94));
      strands.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),14,.009,3,false));
    }
    for (let j = 0; j < 16; j++) {
      const points = [], a = j / 16 * Math.PI * 2;
      for (let k = 0; k <= 8; k++) {
        const t = k / 8 * Math.PI * .5;
        points.push(new THREE.Vector3(Math.cos(a)*Math.sin(t),Math.cos(t)*.55,Math.sin(a)*Math.sin(t)));
      }
      strands.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),8,.005,3,false));
    }
    const strandGeometry = mergeGeometries(strands); strands.forEach(geometry=>geometry.dispose());
    const bellMaterial = new THREE.MeshStandardMaterial({color:'#c3dfd5',transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false,roughness:.3});
    const rimMaterial = new THREE.MeshStandardMaterial({color:'#9ecab4',emissive:'#32ffc1',emissiveIntensity:this.profile.night?3.2:.65,roughness:.5});
    const strandMaterial = new THREE.MeshStandardMaterial({color:'#9dbeb2',transparent:true,opacity:.42,depthWrite:false,roughness:.6});
    const phases = new Float32Array(count), flashes = new Float32Array(count);
    for(let i=0;i<count;i++)phases[i]=random()*Math.PI*2;
    this.jellyMeshes = [bellGeometry,rimGeometry,strandGeometry].map((geometry,index)=>{
      geometry.setAttribute('aJellyPhase',new THREE.InstancedBufferAttribute(phases,1));
      geometry.setAttribute('aJellyFlash',new THREE.InstancedBufferAttribute(flashes,1));
      const material=[bellMaterial,rimMaterial,strandMaterial][index];
      material.onBeforeCompile=shader=>{
        shader.uniforms.uMarineTime=this.timeUniform;
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uMarineTime;attribute float aJellyPhase,aJellyFlash;varying float vJellyFlash;');
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          float pulse=.5+.5*sin(uMarineTime*2.1+aJellyPhase);
          transformed.xz*=1.0-pulse*.13;
          transformed.y*=1.0+pulse*.22;
          if(position.y<0.0){
            transformed.x+=sin(uMarineTime*2.1+aJellyPhase+position.y*.7)*position.y*.09;
            transformed.z+=cos(uMarineTime*1.8+aJellyPhase+position.y*.5)*position.y*.07;
          }
          vJellyFlash=aJellyFlash;`);
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vJellyFlash;');
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vJellyFlash;');
      };
      const mesh=new THREE.InstancedMesh(geometry,material,count);
      mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(mesh);return mesh;
    });
    for(let i=0;i<count;i++){
      const base=i===0?new THREE.Vector3(-280,-8,145):new THREE.Vector3(-280+(random()-.5)*12,-6-random()*4,145+(random()-.5)*12);
      base.y=Math.max(base.y,this.heightAt(base.x,base.z)+.8);
      this.jellies.push({base,position:base.clone(),size:.075+random()*.05,phase:phases[i],flash:0,cooldown:0});
    }
    this.jellyFlashes=flashes;
  }

  makeParticles(mobile) {
    const count = mobile ? 180 : 350, positions = [], random = this.random;
    for (let i = 0; i < count; i++) positions.push((random()-.5)*80,(random()-.5)*40,(random()-.5)*80);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
    this.particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#a4bdb4', size: .018, transparent: true, opacity: .24, depthWrite: false }));
    this.group.add(this.particles);
  }

  update(time, delta, camera, submerged) {
    this.timeUniform.value = time;
    const direction = new THREE.Vector3(), target = new THREE.Vector3();
    for (let i = 0; i < this.fish.length; i++) {
      const fish = this.fish[i], center = this.schools[fish.school];
      const angle = time * (.11 + fish.school * .015) + fish.phase;
      target.set(center.x+Math.cos(angle)*fish.radius,center.y+fish.elevation+Math.sin(angle*1.4)*.6,center.z+Math.sin(angle)*fish.radius*.8);
      const distance = target.distanceTo(camera.position);
      if (distance < 2.5) target.addScaledVector(target.clone().sub(camera.position).normalize(), (2.5-distance)*.5);
      for (const rock of this.obstacles) {
        if (target.y > rock.top + .3) continue;
        const dx = target.x - rock.x, dz = target.z - rock.z, radius = rock.r + .4;
        if (Math.abs(dx) > radius || Math.abs(dz) > radius) continue;
        const distance = Math.hypot(dx, dz);
        if (distance < radius) {
          const scale = (radius - distance) / Math.max(distance, .01);
          target.x += dx * scale; target.z += dz * scale;
        }
      }
      target.y = Math.min(-1.2, Math.max(this.heightAt(target.x,target.z)+1.2,target.y));
      direction.set(-Math.sin(angle),Math.cos(angle*1.4)*.1,Math.cos(angle)*.8).normalize();
      if (fish.previous.lengthSq() && delta > 0) {
        const movement = target.clone().sub(fish.previous);
        if (movement.lengthSq() > .000001) direction.copy(movement).normalize();
      }
      fish.previous.copy(target);
      fish.position.copy(target);
      this.transform.position.copy(target); this.transform.quaternion.setFromUnitVectors(this.forward,direction); this.transform.scale.setScalar(fish.length);
      this.transform.updateMatrix(); this.fishMesh.setMatrixAt(i,this.transform.matrix);
    }
    this.fishMesh.instanceMatrix.needsUpdate = true;
    for (let i=0;i<this.jellies.length;i++) {
      const jelly=this.jellies[i];
      jelly.position.copy(jelly.base).add(new THREE.Vector3(Math.sin(time*.13+jelly.phase)*.5,Math.sin(time*.4+jelly.phase)*.28,Math.cos(time*.11+jelly.phase)*.6));
      jelly.cooldown=Math.max(0,jelly.cooldown-delta);
      if(submerged&&camera.position.distanceTo(jelly.position)<2.6&&jelly.cooldown===0){jelly.flash=1;jelly.cooldown=9+jelly.phase;}
      jelly.flash=Math.max(0,jelly.flash-delta*.55);this.jellyFlashes[i]=jelly.flash;
      this.transform.position.copy(jelly.position);this.transform.quaternion.identity();this.transform.scale.setScalar(jelly.size);this.transform.updateMatrix();
      for(const mesh of this.jellyMeshes)mesh.setMatrixAt(i,this.transform.matrix);
    }
    for(const mesh of this.jellyMeshes){mesh.instanceMatrix.needsUpdate=true;mesh.geometry.attributes.aJellyFlash.needsUpdate=true;}
    this.particles.position.set(camera.position.x,Math.min(-3,camera.position.y),camera.position.z);
    this.particles.rotation.y = time*.002; this.particles.visible = submerged;
  }
}
