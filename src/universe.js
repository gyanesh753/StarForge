import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { bodies, bodyById } from './data.js';

const vertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const planetFragment = `
  uniform sampler2D uMap;
  uniform sampler2D uNightMap;
  uniform vec3 uLight;
  uniform float uEarth;
  uniform float uNight;
  uniform float uTerminator;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorld);
    vec3 light = normalize(mix(uLight, vec3(-1.0, 0.1, 0.05), uTerminator));
    float daylight = dot(normal, light);
    vec3 tex = texture2D(uMap, vUv).rgb;
    float shade = pow(max(daylight, 0.0), 0.65);
    vec3 color = tex * (0.022 + shade * 1.5) * (1.0 - uNight * 0.98);
    if (uEarth > 0.5) {
      float darkness = max(1.0 - smoothstep(-0.18, 0.22, daylight), uNight);
      vec3 lights = texture2D(uNightMap, vUv).rgb;
      color += lights * darkness * 1.8;
      float water = smoothstep(0.02, 0.1, tex.b - tex.r);
      vec3 halfVector = normalize(light + viewDirection);
      color += vec3(0.64, 0.77, 0.87) * pow(max(dot(normal, halfVector), 0.0), 42.0) * water * 0.21 * (1.0-uNight);
      float rim = pow(1.0-max(dot(normal, viewDirection),0.0), 3.5);
      color += vec3(0.025, 0.17, 0.34) * rim * (0.25+shade) * (1.0-uNight*0.6);
    }
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const sunFragment = `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uCorona;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec2 uv = vUv;
    uv.x += sin(uv.y*65.0+uTime*0.16)*0.0015;
    uv.y += sin(uv.x*82.0+uTime*0.12)*0.001;
    vec3 tex = texture2D(uMap,uv).rgb;
    float facing = max(dot(normalize(vNormal),normalize(cameraPosition-vWorld)),0.0);
    vec3 color = tex * (1.0 + facing * 0.65) + vec3(0.2,0.055,0.005);
    color *= 0.75 + 0.25 * pow(facing,0.35);
    color = mix(color, vec3(0.002,0.003,0.004),uCorona);
    gl_FragColor = vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class Universe {
  constructor(container, { onProgress, onReady, onTravelEnd, onError, reducedMotion = false }) {
    this.container = container;
    this.onTravelEnd = onTravelEnd;
    this.onError = onError;
    this.reducedMotion = reducedMotion;
    this.motion = !reducedMotion;
    this.isMap = false;
    this.quiet = false;
    this.activeId = 'earth';
    this.items = new Map();
    this.time = 0;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 600);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x080d11, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.domElement.setAttribute('aria-label', '3D world. Drag or use arrow keys to orbit. Scroll, pinch, or use plus and minus to zoom.');
    this.renderer.domElement.setAttribute('tabindex', '0');
    this.renderer.domElement.setAttribute('role', 'img');
    container.append(this.renderer.domElement);
    const pointerStart = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    this.renderer.domElement.addEventListener('pointerdown', event => pointerStart.set(event.clientX, event.clientY));
    this.renderer.domElement.addEventListener('pointerup', event => {
      if (!this.isMap || this.travel || pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 5) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1), this.camera);
      const hits = raycaster.intersectObjects([...this.items.values()].map(item => item.mesh));
      if (hits.length) {
        const selected = [...this.items.values()].find(item => item.mesh === hits[0].object);
        this.onPick?.(selected.body.id);
      }
    });
    this.renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      this.renderer.setAnimationLoop(null);
      onError('The 3D connection was interrupted. Reload to return to your journey. Your field journal is saved.');
    });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = !reducedMotion;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.65;
    this.controls.minPolarAngle = 0.18;
    this.controls.maxPolarAngle = Math.PI - 0.18;
    this.controls.addEventListener('start', () => { this.interacting = true; });
    this.controls.addEventListener('end', () => { this.interacting = false; });
    this.controls.listenToKeyEvents(this.renderer.domElement);
    // OrbitControls' default arrow keys pan, which is intentionally disabled.
    this.renderer.domElement.addEventListener('keydown', event => {
      const keys = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
      if (keys[event.key]) { event.preventDefault(); this.orbit(...keys[event.key]); }
    });

    this.makeStars();
    this.makeOrbits();
    const manager = new THREE.LoadingManager();
    let failed = false;
    manager.onProgress = (_, loaded, total) => onProgress(loaded / total);
    manager.onError = () => { failed = true; };
    const loader = new THREE.TextureLoader(manager);
    this.textures = {};
    ['earth-day', 'earth-night', 'earth-clouds', 'mercury', 'venus-clouds', 'venus-surface', 'sun'].forEach(name => {
      const texture = loader.load(`/textures/${name}.jpg`);
      texture.colorSpace = name === 'earth-clouds' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      texture.wrapS = THREE.RepeatWrapping;
      this.textures[name] = texture;
    });
    manager.onLoad = () => {
      if (failed) { onError('A planetary map could not be loaded. Check the connection and reload to try again.'); return; }
      bodies.forEach(body => this.makeBody(body));
      this.resize();
      this.focus(this.activeId, true);
      this.renderer.setAnimationLoop(() => this.animate());
      onReady();
    };
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.renderer.setAnimationLoop(null);
      else if (this.items.size) { this.clock.getDelta(); this.renderer.setAnimationLoop(() => this.animate()); }
    });
  }

  makeStars() {
    let seed = 41;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const count = window.innerWidth < 900 ? 2400 : 4600;
    const positions = [], sizes = [], colors = [], phases = [];
    for (let i = 0; i < count; i++) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(random() * 2 - 1);
      const radius = 110 + random() * 130;
      positions.push(radius*Math.sin(phi)*Math.cos(theta), radius*Math.cos(phi), radius*Math.sin(phi)*Math.sin(theta));
      sizes.push(random() > 0.985 ? 3.3 : 0.7 + random() * 1.5);
      const tone = random();
      colors.push(0.58 + tone * 0.28, 0.7 + tone * 0.18, 0.79 + tone * 0.15);
      phases.push(random() * 6.28);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: this.renderer.getPixelRatio() } },
      vertexShader: `attribute float aSize; attribute vec3 aColor; attribute float aPhase; uniform float uTime; uniform float uPixelRatio; varying vec3 vColor; varying float vAlpha; void main(){ vColor=aColor; vAlpha=0.45+0.15*sin(uTime*0.4+aPhase); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uPixelRatio; }`,
      fragmentShader: `varying vec3 vColor; varying float vAlpha; void main(){ float d=length(gl_PointCoord-0.5); float a=(1.0-smoothstep(0.0,0.5,d))*vAlpha; gl_FragColor=vec4(vColor,a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(geometry, this.starMaterial));
  }

  makeOrbits() {
    this.orbitGroup = new THREE.Group();
    bodies.slice(1).forEach(body => {
      const radius = new THREE.Vector3(...body.position).length();
      const points = Array.from({ length: 200 }, (_, i) => new THREE.Vector3(Math.cos(i/200*Math.PI*2)*radius, 0, Math.sin(i/200*Math.PI*2)*radius));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.orbitGroup.add(new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0x6d968b, transparent: true, opacity: 0.22 })));
    });
    this.orbitGroup.visible = false;
    this.scene.add(this.orbitGroup);
  }

  makeBody(body) {
    const group = new THREE.Group();
    group.position.set(...body.position);
    const geometry = new THREE.SphereGeometry(body.radius, 96, 64);
    const uniforms = {
      uMap: { value: this.textures[body.texture] },
      uNightMap: { value: this.textures['earth-night'] },
      uLight: { value: new THREE.Vector3(-0.65, 0.35, 0.8).normalize() },
      uEarth: { value: body.id === 'earth' ? 1 : 0 },
      uNight: { value: 0 }, uTerminator: { value: 0 }, uTime: { value: 0 }, uCorona: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: body.id === 'sun' ? sunFragment : planetFragment, uniforms });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = body.initialRotation;
    group.add(mesh);
    const item = { body, group, mesh, material, uniforms, view: 'visible' };
    if (body.id === 'earth' || body.id === 'venus') {
      const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(body.radius * 1.018, 64, 48), new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: `uniform vec3 uColor; varying vec3 vNormal; varying vec3 vWorld; void main(){ float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(cameraPosition-vWorld))),3.8); gl_FragColor=vec4(uColor,rim*0.55); }`,
        uniforms: { uColor: { value: new THREE.Color(body.id === 'earth' ? '#4d9bdb' : '#d4aa62') } },
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      }));
      group.add(atmosphere);
      item.atmosphere = atmosphere;
    }
    if (body.id === 'earth') {
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(body.radius*1.006, 80, 60), new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: `uniform sampler2D uMap; uniform vec3 uLight; uniform float uNight; varying vec2 vUv; varying vec3 vNormal; void main(){ float cloud=texture2D(uMap,vUv).r; float light=max(dot(normalize(vNormal),uLight),0.0); gl_FragColor=vec4(vec3(0.75,0.84,0.89)*(0.06+light*1.2),cloud*0.75*(1.0-uNight*0.9));\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }`,
        uniforms: { uMap: { value: this.textures['earth-clouds'] }, uLight: uniforms.uLight, uNight: uniforms.uNight },
        transparent: true, depthWrite: false,
      }));
      clouds.rotation.y = body.initialRotation;
      group.add(clouds);
      item.clouds = clouds;
    }
    if (body.id === 'sun') {
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(128,128,0,128,128,128);
      gradient.addColorStop(0, 'rgba(255,191,80,0.7)'); gradient.addColorStop(0.25, 'rgba(255,170,59,0.5)');
      gradient.addColorStop(0.34, 'rgba(255,151,42,0.2)'); gradient.addColorStop(0.5, 'rgba(224,114,36,0.055)'); gradient.addColorStop(1, 'rgba(196,97,25,0)');
      ctx.fillStyle = gradient; ctx.fillRect(0,0,256,256);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 }));
      sprite.scale.setScalar(body.radius*7.8);
      group.add(sprite); item.glow = sprite;
    }
    this.scene.add(group);
    this.items.set(body.id, item);
  }

  get mobile() { return this.container.clientWidth <= 900; }

  resize() {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    if (this.expedition) { this.expedition.resize(); return; }
    this.camera.aspect = width / height;
    this.setFraming();
    if (!this.travel && this.items.size) this.focus(this.activeId, true, this.isMap);
  }

  setFraming() {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    const offsetX = this.quiet ? 0 : this.mobile ? 0 : -width * 0.155;
    const offsetY = this.quiet ? 0 : this.mobile ? -height * 0.005 : height * 0.045;
    this.camera.setViewOffset(width, height, offsetX, offsetY, width, height);
    this.camera.updateProjectionMatrix();
  }

  focus(id, instant = false, map = false) {
    const body = bodyById[id];
    this.activeId = id;
    this.isMap = map;
    if (!this.items.size) return;
    this.controls.enabled = false;
    this.orbitGroup.visible = map;
    this.items.forEach(item => {
      item.group.visible = true;
      this.applyView(item, map ? 'visible' : item.view);
    });
    const target = map ? new THREE.Vector3(0,0,0) : new THREE.Vector3(...body.position);
    const distance = body.radius * (this.mobile ? 8.1 : 4.65);
    const position = map ? new THREE.Vector3(0, this.mobile ? 78 : 31, this.mobile ? 94 : 43) : target.clone().add(new THREE.Vector3(0, 0.18 * body.radius, distance));
    this.controls.minDistance = map ? 26 : body.radius*1.6;
    this.controls.maxDistance = map ? 135 : body.radius*16;
    this.controls.enableDamping = false;
    this.controls.update();
    const finish = () => {
      this.camera.position.copy(position); this.controls.target.copy(target); this.camera.lookAt(target);
      this.controls.update(); this.controls.enableDamping = !this.reducedMotion; this.controls.enabled = true;
      this.items.forEach(item => { item.group.visible = map || item.body.id === id; });
      this.travel = null;
      this.onTravelEnd(id, map);
    };
    if (instant || this.reducedMotion) { finish(); return; }
    this.travel = {
      started: performance.now(), duration: map ? 1600 : 2200,
      fromPosition: this.camera.position.clone(), toPosition: position,
      fromTarget: this.controls.target.clone(), toTarget: target,
      arc: this.camera.position.distanceTo(position) > 5 ? 8 : 3,
      finish,
    };
  }

  setView(view) {
    const item = this.items.get(this.activeId);
    if (!item) return;
    item.view = view;
    this.applyView(item, view);
  }

  applyView(item, view) {
    item.uniforms.uNight.value = view === 'night' ? 1 : 0;
    item.uniforms.uTerminator.value = view === 'terminator' ? 1 : 0;
    item.uniforms.uCorona.value = view === 'corona' ? 1 : 0;
    if (item.body.id === 'venus') {
      item.uniforms.uMap.value = this.textures[view === 'surface' ? 'venus-surface' : 'venus-clouds'];
      item.atmosphere.visible = view !== 'surface';
    }
    if (item.glow) item.glow.material.opacity = view === 'corona' ? 1.5 : 0.85;
  }

  zoom(factor) {
    if (this.travel || this.expedition) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset.setLength(distance));
    this.controls.update();
  }

  orbit(theta, phi) {
    if (this.travel || this.expedition) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const sphere = new THREE.Spherical().setFromVector3(offset);
    sphere.theta += theta;
    sphere.phi = THREE.MathUtils.clamp(sphere.phi + phi, 0.18, Math.PI-0.18);
    this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(sphere));
    this.controls.update();
  }

  setQuiet(value) { this.quiet = value; this.setFraming(); }

  // Theme markers float above the world; they do not claim geographic locations.
  projectMarker(index) {
    const item = this.items.get(this.activeId);
    if (!item) return { visible: false, x: 0, y: 0 };
    const anchors = [[-0.66,0.32,0.7],[0.7,0.04,0.71],[0.1,-0.65,0.76]];
    const normal = new THREE.Vector3(...anchors[index]).normalize();
    const center = item.group.position;
    const point = normal.clone().multiplyScalar(item.body.radius * 1.035).add(center);
    const view = this.camera.position.clone().sub(point).normalize();
    const visible = normal.dot(view) > 0.12;
    const projected = point.project(this.camera);
    return { x: (projected.x*0.5+0.5)*this.container.clientWidth, y: (-projected.y*0.5+0.5)*this.container.clientHeight, visible: visible && projected.z < 1 && projected.z > -1 };
  }

  projectBody(id) {
    const item = this.items.get(id);
    if (!item) return { x: -100, y: -100, visible: false };
    const point = item.group.position.clone(); point.y -= item.body.radius*1.15;
    point.project(this.camera);
    return { x: (point.x*0.5+0.5)*this.container.clientWidth, y: (-point.y*0.5+0.5)*this.container.clientHeight, visible: point.z < 1 };
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    if (this.expedition) {
      this.expedition.update(delta, this.motion);
      if(this.expedition.ocean)this.expedition.ocean.render();
      else this.renderer.render(this.expedition.scene, this.expedition.camera);
      return;
    }
    if (this.motion && !this.interacting) {
      this.time += delta;
      this.items.forEach(item => {
        item.mesh.rotation.y += delta * item.body.rotation;
        if (item.clouds) item.clouds.rotation.y += delta * item.body.rotation * 1.08;
        item.uniforms.uTime.value = this.time;
      });
      this.starMaterial.uniforms.uTime.value = this.time;
    }
    if (this.travel) {
      const flight = this.travel;
      const t = Math.min((performance.now()-flight.started)/flight.duration,1);
      const eased = t*t*(3-2*t);
      this.camera.position.lerpVectors(flight.fromPosition,flight.toPosition,eased);
      this.camera.position.z += Math.sin(t*Math.PI)*flight.arc;
      this.camera.position.y += Math.sin(t*Math.PI)*flight.arc*0.25;
      this.controls.target.lerpVectors(flight.fromTarget,flight.toTarget,eased);
      this.camera.lookAt(this.controls.target);
      if(t >= 1) flight.finish();
    } else this.controls.update();
    this.renderer.render(this.scene,this.camera);
    this.onFrame?.();
  }
}
