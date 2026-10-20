import * as THREE from 'three';
import { expeditions, earthAtmosphere } from './catalog.js';
import { buildTerrain, populateTerrain, seededRandom } from './terrain.js';
import { makeSky, makeClouds, makeSolarStudy } from './atmosphere.js';
import { earthScenario, waterHeight } from './earth-profile.js';
import { Ocean, makeEarthSky } from './ocean.js';
import { MarineLife } from './marine-life.js';

export class Expedition {
  constructor(id, renderer, { reducedMotion, onUpdate, onNotice, night = false }) {
    this.id=id;this.config=expeditions[id];this.renderer=renderer;
    this.earthProfile=id==='earth'?earthScenario(night):null;
    this.reducedMotion=reducedMotion;this.entryReady=reducedMotion;this.onUpdate=onUpdate;this.onNotice=onNotice;
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(62,1,.3,24000);
    this.camera.rotation.order='YXZ';this.keys=new Set();this.velocity=new THREE.Vector3();
    this.mode='glide';this.time=0;this.yaw=this.config.play.yaw;this.pitch=this.config.play.pitch;
    this.abort=new AbortController();this.obstacles=[];this.travel=null;this.touchMove=new THREE.Vector2();
    this.scene.fog=new THREE.FogExp2(this.earthProfile?.skyHorizon||this.config.sky.fog,this.config.sky.density);
    this.sky=this.earthProfile?makeEarthSky(this.earthProfile):makeSky(this.config);this.scene.add(this.sky);
    this.renderer.shadowMap.enabled=id!=='sun';this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMappingExposure=this.earthProfile?.exposure||(id==='mercury'?1.05:1.12);
    this.savedTabLabel=renderer.domElement.getAttribute('aria-label');
    renderer.domElement.setAttribute('aria-label','Explore this environment. WASD to move, drag or arrow keys to look, E and Q to rise and descend. Space hops in walk mode. Escape returns to orbit.');
    const mobile=renderer.domElement.clientWidth<=900;
    if(id==='sun') {
      this.solar=makeSolarStudy();this.scene.add(this.solar.surface,this.solar.loops);
      this.heightAt=()=>0;
    } else {
      const terrain=buildTerrain(id,this.config,mobile?192:256);
      this.scene.add(terrain.mesh);this.heightAt=terrain.heightAt;
      const loader=new THREE.TextureLoader();
      this.ready=Promise.allSettled([loader.loadAsync('/materials/terrain-color.jpg'),loader.loadAsync('/materials/terrain-normal.jpg')]).then(results=>{
        if(this.disposed||results.some(result=>result.status==='rejected')){
          results.forEach(result=>{if(result.status==='fulfilled')result.value.dispose();});
          if(!this.disposed)onNotice('Using the procedural ground material while the detail map is unavailable.');
          return;
        }
        const [map,normal]=results.map(result=>result.value);
        for(const texture of [map,normal]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
        map.colorSpace=THREE.SRGBColorSpace;terrain.mesh.material.map=map;terrain.mesh.material.normalMap=normal;terrain.mesh.material.normalScale.set(.6,.6);terrain.mesh.material.needsUpdate=true;
      });
      this.obstacles=populateTerrain(this.scene,id,this.config,this.heightAt,mobile);
      const hemisphere=new THREE.HemisphereLight(id==='earth'?'#b8dbea':id==='venus'?'#f5ce8c':'#c5c6c2',id==='earth'?'#626249':'#3e3932',this.earthProfile?.ambientIntensity||(id==='mercury'?.25:1.4));
      this.scene.add(hemisphere);
      const light=new THREE.DirectionalLight(this.earthProfile?.lightColor||(id==='venus'?'#f4c57b':'#fff5e4'),this.earthProfile?.lightIntensity||(id==='venus'?1.4:3.1));
      light.position.copy(new THREE.Vector3(...(this.earthProfile?.lightDirection||this.config.sky.sunDirection)).normalize().multiplyScalar(2200));
      light.castShadow=true;light.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
      Object.assign(light.shadow.camera,{left:-1500,right:1500,top:1500,bottom:-1500,near:100,far:5000});
      light.shadow.bias=-.0003;light.shadow.normalBias=.8;this.scene.add(light,light.target);
      if(id==='earth'||id==='venus') {this.clouds=makeClouds(id,seededRandom(this.config.play.seed));this.scene.add(this.clouds);}
      if(this.earthProfile){
        if(night){
          const moon=new THREE.Vector3(...this.earthProfile.lightDirection).normalize();
          this.clouds.children.forEach(cloud=>{
            cloud.material.color.set('#182536');
            const radius=Math.atan2(cloud.scale.x*.5,cloud.position.length());
            // Compose a clearing around the Moon so its light and reflection
            // do not imply a strong source hidden behind an opaque cloud bank.
            if(cloud.position.clone().normalize().dot(moon)>Math.cos(radius+.12))cloud.material.opacity*=.12;
          });
        }
        this.ocean=new Ocean(renderer,this.scene,this.camera,this.earthProfile,mobile);
        this.marine=new MarineLife(this.scene,this.heightAt,this.earthProfile,mobile);
        this.obstacles.push(...this.marine.obstacles);
      }
    }
    this.landmarks=this.config.landmarks.map((point,index)=>({ ...point,index,world:new THREE.Vector3(point.position[0],point.altitude??this.heightAt(...point.position)+8,point.position[1]) }));
    this.addSignals();this.bindControls();this.resize();this.reset(true);
    this.ocean?.applyToScene();
  }

  addSignals() {
    this.signalGroup=new THREE.Group();
    this.landmarks.forEach(point=>{
      const signal=new THREE.Group();signal.position.copy(point.world);
      const material=new THREE.MeshBasicMaterial({color:this.id==='sun'?'#f3e1bb':'#d2eadb',transparent:true,opacity:.6,depthWrite:false});
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.8,.09,5,40),material);signal.add(ring);
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.55,8,8),material);signal.add(dot);
      point.signal=signal;this.signalGroup.add(signal);
    });
    this.scene.add(this.signalGroup);
  }

  bindControls() {
    const options={signal:this.abort.signal};
    const canvas=this.renderer.domElement;
    canvas.addEventListener('pointerdown',event=>{
      if(event.button!==0) return;
      this.drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);
    },options);
    canvas.addEventListener('pointermove',event=>{
      if(!this.drag||this.drag.id!==event.pointerId) return;
      this.yaw-=(event.clientX-this.drag.x)*.003;
      this.pitch=THREE.MathUtils.clamp(this.pitch-(event.clientY-this.drag.y)*.003,-1.45,1.3);
      this.drag.x=event.clientX;this.drag.y=event.clientY;
      if(this.travel&&!this.travel.entry) this.travel=null;
    },options);
    const endDrag=()=>{this.drag=null;};
    canvas.addEventListener('pointerup',endDrag,options);canvas.addEventListener('pointercancel',endDrag,options);
    window.addEventListener('keydown',event=>{
      if(document.querySelector('dialog[open]')||event.ctrlKey||event.metaKey||event.altKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      const movement=['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','Space','ShiftLeft','ShiftRight','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
      if(!movement.includes(event.code)) return;
      if(event.code==='Space'&&event.target.tagName==='BUTTON') return;
      event.preventDefault();
      if(event.code==='Space'&&!event.repeat&&this.mode==='walk') this.hop();
      this.keys.add(event.code);
      if(this.travel&&!this.travel.entry) this.travel=null;
    },options);
    window.addEventListener('keyup',event=>this.keys.delete(event.code),options);
    window.addEventListener('blur',()=>this.releaseInputs(),options);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.releaseInputs();},options);
    document.querySelectorAll('[data-move]').forEach(button=>{
      button.addEventListener('pointerdown',event=>{
        event.preventDefault();button.setPointerCapture(event.pointerId);
        this.keys.add(button.dataset.move);this.travel=null;
        if(button.dataset.move==='Space'&&this.mode==='walk')this.hop();
      },options);
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>this.keys.delete(button.dataset.move),options);
    });
  }

  releaseInputs(){this.keys.clear();this.velocity.set(0,0,0);this.drag=null;}

  resize() {
    const canvas=this.renderer.domElement;
    this.camera.aspect=canvas.clientWidth/canvas.clientHeight;this.camera.updateProjectionMatrix();
    this.ocean?.resize();
  }

  reset(entry=false) {
    this.mode='glide';this.velocity.set(0,0,0);this.verticalVelocity=0;
    const [x,clearance,z]=this.config.play.start;
    const end=new THREE.Vector3(x,Math.max(0,this.heightAt(x,z))+clearance,z);
    this.yaw=this.config.play.yaw;this.pitch=this.config.play.pitch;
    if(entry&&!this.reducedMotion) {
      this.camera.position.set(x+180,this.config.play.descent,z+650);
      this.travel={from:this.camera.position.clone(),to:end,duration:this.id==='venus'?7:5.5,elapsed:0,started:performance.now(),entry:true,startYaw:this.yaw,startPitch:-.7,endYaw:this.yaw,endPitch:this.pitch};
    } else {this.camera.position.copy(end);this.travel=null;}
    this.applyLook();
  }

  applyLook(){this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');}

  beginEntry(){this.entryReady=true;if(this.travel?.entry)this.travel.started=performance.now();}

  finishTravel(){if(!this.travel)return;const land=this.travel.land;this.camera.position.copy(this.travel.to);this.yaw=this.travel.endYaw;this.pitch=this.travel.endPitch;this.travel=null;if(land)this.mode='walk';this.velocity.set(0,0,0);this.applyLook();}

  moveTo(target,{entry=false,land=false,lookAt=null}={}) {
    const direction=target.clone().sub(this.camera.position);
    const viewDirection=lookAt?lookAt.clone().sub(target):direction;
    const endYaw=Math.hypot(viewDirection.x,viewDirection.z)<.01?this.yaw:Math.atan2(-viewDirection.x,-viewDirection.z);
    // Choose the shortest turn rather than spinning through 2π.
    const deltaYaw=Math.atan2(Math.sin(endYaw-this.yaw),Math.cos(endYaw-this.yaw));
    this.mode='glide';this.velocity.set(0,0,0);
    const flight={from:this.camera.position.clone(),to:target,duration:Math.abs(direction.y)>10000?6:3.5,elapsed:0,started:performance.now(),entry,startYaw:this.yaw,startPitch:this.pitch,endYaw:this.yaw+deltaYaw,endPitch:lookAt?Math.atan2(viewDirection.y,Math.hypot(viewDirection.x,viewDirection.z)):land?-.05:-.15,land};
    this.travel=flight;
    if(this.reducedMotion){this.finishTravel();if(land)this.mode='walk';}
  }

  visit(index) {
    const point=this.landmarks[index];if(!point)return;
    const target=point.world.clone().add(new THREE.Vector3(0,point.altitude!==undefined?0:8,point.underwater?(point.id==='jellies'?1.7:5):20));
    target.y=Math.max(target.y,this.floor(target.x,target.z));
    this.moveTo(target,point.underwater?{lookAt:point.world}:{});this.onNotice(`Following a signal: ${point.name}`);
  }

  changeOceanLayer() {
    if(!this.ocean)return;
    let {x,z}=this.camera.position;
    if(this.ocean.submerged){this.moveTo(new THREE.Vector3(x,waterHeight(x,z,this.time)+2.5,z));return;}
    if(this.heightAt(x,z)>-4){x=-225;z=185;}
    this.moveTo(new THREE.Vector3(x,Math.max(this.heightAt(x,z)+2,-7),z),{lookAt:new THREE.Vector3(-225,-7,180)});
  }

  changeLayer() {
    const [x,clearance,z]=this.config.play.start;
    if(this.camera.position.y>this.config.layer.height*.7) this.moveTo(new THREE.Vector3(x,Math.max(0,this.heightAt(x,z))+clearance,z));
    else this.moveTo(new THREE.Vector3(this.camera.position.x,this.config.layer.height,this.camera.position.z));
  }

  setMode(mode) {
    if(this.id==='sun')return;
    if(mode==='glide'){this.mode=this.ocean?.submerged?'swim':'glide';this.travel=null;this.verticalVelocity=0;return;}
    let {x,z}=this.camera.position;
    if(this.id==='earth'&&this.heightAt(x,z)<1) {
      [x,,z]=this.config.play.start;
      this.onNotice('Finding solid ground on the headland.');
    }
    const obstacle=this.obstacles.find(o=>Math.hypot(x-o.x,z-o.z)<o.r+2);
    if(obstacle)x=obstacle.x+obstacle.r+4;
    this.moveTo(new THREE.Vector3(x,this.heightAt(x,z)+2.1,z),{land:true});
  }

  hop() {
    if(this.mode!=='walk'||this.camera.position.y>this.heightAt(this.camera.position.x,this.camera.position.z)+2.2)return;
    this.verticalVelocity=this.config.play.jumpSpeed;
  }

  floor(x,z){return this.id==='sun'?22:this.heightAt(x,z)+(this.ocean&&this.mode!=='walk'?1.2:2.1);}

  blocked(x,y,z) {
    return this.obstacles.some(o=>Math.abs(x-o.x)<o.r+1 && Math.abs(z-o.z)<o.r+1 && Math.hypot(x-o.x,z-o.z)<o.r+1 && y<o.top+2);
  }

  update(delta,animate=true) {
    const now=performance.now(),wallDelta=(now-(this.lastFrame??now))/1000;this.lastFrame=now;
    if(animate)this.time+=delta;
    const paused=!this.entryReady||!!document.querySelector('dialog[open]');
    if(paused){this.releaseInputs();if(this.travel)this.travel.started+=wallDelta*1000;}
    if(this.travel&&!paused) {
      const flight=this.travel;flight.elapsed=(now-flight.started)/1000;
      const t=Math.min(flight.elapsed/flight.duration,1),e=t*t*(3-2*t);
      this.camera.position.lerpVectors(flight.from,flight.to,e);
      if(Math.max(flight.from.y,flight.to.y)>10000)this.camera.position.y=Math.exp(THREE.MathUtils.lerp(Math.log(flight.from.y+100),Math.log(flight.to.y+100),e))-100;
      if(!flight.entry&&!flight.land&&!(this.ocean&&(flight.from.y<2||flight.to.y<2)))this.camera.position.y+=Math.sin(t*Math.PI)*Math.min(150,flight.from.distanceTo(flight.to)*.18);
      this.camera.position.y=Math.max(this.camera.position.y,this.floor(this.camera.position.x,this.camera.position.z));
      this.yaw=THREE.MathUtils.lerp(flight.startYaw,flight.endYaw,e);this.pitch=THREE.MathUtils.lerp(flight.startPitch,flight.endPitch,e);
      if(t===1){this.finishTravel();if(flight.land)this.mode='walk';}
    } else if(!paused) this.move(delta);
    this.applyLook();
    this.camera.far=Math.max(22000,this.camera.position.y*3);
    this.camera.updateProjectionMatrix();this.sky.position.copy(this.camera.position);this.sky.scale.setScalar(this.camera.far*.8);
    this.sky.material.uniforms.uHigh.value=Math.min(this.camera.position.y/70000,1);
    if(this.id==='venus'){
      const h=this.camera.position.y;
      // Visual layer treatment only; no invented pressure/temperature profile.
      this.scene.fog.density=h>40000?.000025:this.config.sky.density*(1-Math.min(h/40000,.97));
      this.sky.material.uniforms.uTop.value.set(h>40000?'#9c8b63':this.config.sky.top);
      this.sky.material.uniforms.uHorizon.value.set(h>40000?'#e4d6af':this.config.sky.horizon);
    }
    if(this.ocean){
      this.ocean.update(this.time);
      if(this.ocean.submerged){this.mode='swim';this.verticalVelocity=0;}
      else if(this.mode==='swim')this.mode='glide';
      this.scene.fog.density=this.ocean.submerged?0:this.config.sky.density;
      this.sky.material.uniforms.uTime.value=this.time;
      this.marine.update(this.time,delta,this.camera,this.ocean.submerged);
    }
    if(this.clouds) this.clouds.rotation.y=Math.sin(this.time*.001)*(this.id==='venus'?.05:.008);
    this.solar?.update(this.time);
    this.landmarks.forEach(point=>{point.signal.visible=this.camera.position.distanceTo(point.world)>point.radius;point.signal.quaternion.copy(this.camera.quaternion);point.signal.children[0].rotation.z=this.time*.08;});
    const nearest=this.landmarks.reduce((best,point)=>{const distance=this.camera.position.distanceTo(point.world);return !best||distance<best.distance?{point,distance}:best;},null);
    this.nearby=nearest&&nearest.distance<nearest.point.radius?nearest.point.index:-1;
    this.onUpdate?.(this.telemetry(),this);
  }

  move(delta) {
    const key=k=>this.keys.has(k)?1:0;
    this.yaw+=(key('ArrowLeft')-key('ArrowRight'))*delta*.8;
    this.pitch=THREE.MathUtils.clamp(this.pitch+(key('ArrowUp')-key('ArrowDown'))*delta*.7,-1.45,1.3);
    const forward=key('KeyW')-key('KeyS'),side=key('KeyD')-key('KeyA');
    const boost=key('ShiftLeft')||key('ShiftRight')?2.7:1;
    const speed=(this.mode==='walk'?this.config.play.walkSpeed:this.config.play.speed+(this.ocean?0:Math.max(0,this.camera.position.y-200)*.045))*boost;
    const freeOcean=!!this.ocean&&this.mode!=='walk';
    const pitchFactor=freeOcean?Math.cos(this.pitch):1;
    const input=new THREE.Vector3(-Math.sin(this.yaw)*forward*pitchFactor+Math.cos(this.yaw)*side,freeOcean?Math.sin(this.pitch)*forward+key('KeyE')+key('Space')-key('KeyQ'):0,-Math.cos(this.yaw)*forward*pitchFactor-Math.sin(this.yaw)*side);
    if(input.lengthSq()>1)input.normalize();input.multiplyScalar(speed);
    const damping=this.mode==='walk'?12:this.id==='mercury'?2.8:this.id==='venus'?3.4:4.5;
    this.velocity.lerp(input,1-Math.exp(-delta*damping));
    const position=this.camera.position;
    const newX=position.x+this.velocity.x*delta,newZ=position.z+this.velocity.z*delta;
    const extent=this.config.play.extent;
    if(Math.hypot(newX,newZ)<extent) {
      if(!this.blocked(newX,position.y,position.z))position.x=newX;
      if(!this.blocked(position.x,position.y,newZ))position.z=newZ;
    } else if(!this.boundaryNoticed){this.onNotice('You’ve reached the edge of this study. Turn back, or follow another signal.');this.boundaryNoticed=true;}
    if(Math.hypot(position.x,position.z)<extent-40)this.boundaryNoticed=false;
    const floor=this.floor(position.x,position.z);
    if(this.mode==='walk') {
      this.verticalVelocity=(this.verticalVelocity||0)-this.config.physics.gravity*delta;
      position.y+=this.verticalVelocity*delta;
      if(position.y<=floor){position.y=floor;this.verticalVelocity=0;}
    } else {
      const vertical=key('KeyE')+key('Space')-key('KeyQ');
      const dy=freeOcean?this.velocity.y*delta:THREE.MathUtils.clamp(vertical,-1,1)*speed*.8*delta;
      if(!this.blocked(position.x,position.y+dy,position.z))position.y+=dy;
      position.y=THREE.MathUtils.clamp(position.y,floor,this.config.play.ceiling);
    }
  }

  telemetry() {
    const p=this.camera.position;
    let environment=this.config.physics.atmosphere;
    let reference=this.config.physics.reference;
    if(this.id==='earth') {const air=earthAtmosphere(p.y);reference=`${air.temperatureC.toFixed(0)}°C · ${air.pressureKPa.toFixed(0)} kPa · reference air`;}
    if(this.ocean){
      if(this.ocean.submerged){environment=this.earthProfile.night?'The moonlit shallows':'Temperate coastal water';reference='Free swimming · the same speed as flight';}
      else if(this.earthProfile.night){environment='Moonlit Pacific-inspired coast';reference='Authored night sky · not a live sky map';}
    }
    if(this.id==='venus') {reference=p.y<1000?'≈464°C · 92 bar · surface reference':'Cloud-layer study · no live weather';environment=p.y>44000?'Sulfuric-acid cloud layer':'Dense lower atmosphere';}
    if(this.id==='mercury')reference='No ordinary air · powered observer';
    if(this.id==='sun')reference='Assigned color · time-compressed study';
    return {x:p.x,y:p.y,z:p.z,ground:this.heightAt(p.x,p.z),clearance:Math.max(0,p.y-this.heightAt(p.x,p.z)),mode:this.mode,speed:this.velocity.length(),heading:((THREE.MathUtils.radToDeg(this.yaw)%360)+360)%360,nearby:this.nearby,travel:!!this.travel,entry:!!this.travel?.entry,environment,reference,night:!!this.earthProfile?.night,underwater:!!this.ocean?.submerged,depth:Math.max(0,this.ocean?.depth||0),waterClearance:Math.max(0,-(this.ocean?.depth||0))};
  }

  project(index,width,height) {
    const point=this.landmarks[index].world;
    const p=point.clone().project(this.camera);
    let visible=p.z>-1&&p.z<1&&Math.abs(p.x)<.9&&Math.abs(p.y)<.8;
    if(visible&&this.id!=='sun') {
      for(let i=1;i<16;i++) {
        const ray=this.camera.position.clone().lerp(point,i/16);
        if(ray.y<this.heightAt(ray.x,ray.z)+.3){visible=false;break;}
      }
    }
    return {x:(p.x*.5+.5)*width,y:(-.5*p.y+.5)*height,visible,distance:this.camera.position.distanceTo(point)};
  }

  dispose() {
    this.disposed=true;
    this.abort.abort();this.releaseInputs();
    this.ocean?.dispose();
    const geometry=new Set(),materials=new Set(),textures=new Set();
    this.scene.traverse(object=>{
      if(object.geometry)geometry.add(object.geometry);
      if(object.material)for(const material of [object.material].flat()){materials.add(material);if(material.map)textures.add(material.map);if(material.normalMap)textures.add(material.normalMap);}
      if(object.shadow)object.shadow.dispose();
    });
    geometry.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());textures.forEach(item=>item.dispose());
    this.renderer.shadowMap.enabled=false;this.renderer.toneMappingExposure=1.12;
    this.renderer.domElement.setAttribute('aria-label',this.savedTabLabel);
  }
}
