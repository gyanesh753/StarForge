import './style.css';
import './expeditions/style.css';
import { expeditions, FieldNotes, totalFieldNotes } from './expeditions/catalog.js';
import { bodies, bodyById, totalDiscoveries } from './data.js';
import { hydrateIcons, icon } from './icons.js';
import { Universe } from './universe.js';
import { Journal } from './journal.js';
import { Soundscape } from './audio.js';

const $ = selector => document.querySelector(selector);
const journal = new Journal();
const fieldNotes = new FieldNotes();
const audio = new Soundscape();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = { id: bodyById[location.hash.slice(1)] ? location.hash.slice(1) : 'earth', map: false, quiet: false, motion: !reducedMotion.matches, ready: false, discovery: 0 };
let universe;
let toastTimeout;
let orbitSnapshot;
let fieldUpdateTime=0;
let entryToken=0;

hydrateIcons();

function announce(message) { $('#announcer').textContent = message; }
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 3600);
}

function renderDestinations() {
  $('#destination-tray').innerHTML = bodies.map(body => `<button class="destination-card ${body.id === state.id && !state.map ? 'active' : ''}" data-destination="${body.id}" aria-label="Travel to ${body.name}" aria-pressed="${body.id === state.id && !state.map}"><span class="mini-planet mini-${body.id}" aria-hidden="true"></span><span class="destination-info"><span>${body.shortName}</span><small>${body.id === state.id && !state.map ? 'YOU ARE HERE' : body.id === 'sun' ? 'OUR STAR' : `WORLD ${body.number}`}</small></span><span class="destination-index">${body.id === state.id && !state.map ? '✦' : body.number}</span></button>`).join('');
}

function updateCounts() {
  $('#journal-count').textContent = journal.size+fieldNotes.size;
  $('#journal-nav').setAttribute('aria-label', `Field journal, ${journal.size+fieldNotes.size} of ${totalDiscoveries+totalFieldNotes} observations`);
  const count = journal.count(state.id);
  $('#discovery-count').textContent = count === 3 ? 'All 3 observations in your journal' : `${3-count} ${3-count === 1 ? 'thing' : 'things'} to discover`;
  $('#discovery-dots').innerHTML = bodyById[state.id].discoveries.map((_,i) => `<i class="${journal.has(state.id,i) ? 'found' : ''}"></i>`).join('');
  document.querySelectorAll('.hotspot').forEach(el => el.classList.toggle('found', journal.has(state.id, Number(el.dataset.discovery))));
}

function renderBody() {
  const body = bodyById[state.id];
  $('#enter-world-label').textContent = state.id==='sun' ? 'Enter the atmosphere' : 'Enter this world';
  document.documentElement.style.setProperty('--accent', state.map ? '#b9d0c0' : body.color);
  $('#planet-title').innerHTML = `${body.name}<span class="title-dot">.</span>`;
  $('#planet-eyebrow').textContent = body.category;
  $('#planet-index').textContent = `${body.number} / 03`;
  $('#planet-poem').innerHTML = body.poem;
  $('#planet-description').textContent = body.description;
  $('#planet-facts').innerHTML = body.facts.map(([value,label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('');
  $('#location-name').textContent = body.name.toUpperCase();
  $('#location-sub').textContent = `SOL SYSTEM / ${body.type}`;
  $('#view-caption').textContent = body.caption;
  const view = universe?.items.get(state.id)?.view || 'visible';
  $('#view-switch').innerHTML = body.views.map(([id,label]) => `<button data-view="${id}" class="${id === view ? 'active' : ''}" aria-pressed="${id === view}">${label}</button>`).join('');
  $('#hotspots').innerHTML = body.discoveries.map((discovery,i) => `<button class="hotspot ${i===1 ? 'right' : ''}" data-discovery="${i}" aria-label="Discover: ${discovery.label}"><span class="hotspot-dot"></span><span class="hotspot-line"></span><span class="hotspot-label">${discovery.label}</span></button>`).join('');
  renderDestinations(); updateCounts();
}

function travel(id, map = false) {
  if (!state.ready || !bodyById[id] || state.entering) return;
  if (state.expedition) leaveExpedition();
  if (state.quiet) setQuiet(false);
  state.id = id; state.map = map;
  document.body.classList.toggle('map-mode', map);
  document.body.classList.add('travelling');
  $('#map-intro').hidden = !map;
  $('#map-labels').hidden = true;
  $('#hotspots').hidden = true;
  $('#travel-status').hidden = reducedMotion.matches;
  $('#travel-text').textContent = map ? 'A little perspective' : `On our way to ${bodyById[id].name}`;
  $('#explore-nav').classList.toggle('active', !map);
  $('#explore-nav').setAttribute('aria-pressed', String(!map));
  $('#map-nav').classList.toggle('active', map);
  $('#map-nav').setAttribute('aria-pressed', String(map));
  history.replaceState(null, '', `#${id}`);
  renderBody();
  universe.focus(id, false, map);
}

function travelFinished(id, map) {
  document.body.classList.remove('travelling');
  $('#travel-status').hidden = true;
  $('#hotspots').hidden = map;
  $('#map-labels').hidden = !map;
  if (state.ready) announce(map ? 'Solar map. Choose a destination to begin your flight.' : `Arrived at ${bodyById[id].name}. Drag to orbit, or explore a discovery.`);
}

function updateMarkers() {
  if (universe.travel || state.quiet || state.expedition || state.entering) return;
  if (state.map) {
    document.querySelectorAll('.map-label').forEach(el => {
      const position = universe.projectBody(el.dataset.destination);
      el.style.left = `${position.x}px`; el.style.top = `${position.y}px`;
      el.style.visibility = position.visible ? 'visible' : 'hidden';
    });
  } else {
    document.querySelectorAll('.hotspot').forEach((el, index) => {
      const position = universe.projectMarker(index);
      const narrow = window.innerWidth <= 900;
      const minY = narrow ? 270 : 150;
      const maxY = $('#app').clientHeight - (narrow ? 245 : 190);
      const visible = position.visible && position.x > 30 && position.x < window.innerWidth-40 && position.y > minY && position.y < maxY;
      el.style.left = `${position.x}px`; el.style.top = `${position.y}px`;
      el.style.visibility = visible ? 'visible' : 'hidden';
      el.tabIndex = visible ? 0 : -1;
    });
  }
}

function illustration(type) {
  const base = '<defs><radialGradient id="orb"><stop stop-color="currentColor" stop-opacity=".15"/><stop offset="1" stop-color="currentColor" stop-opacity=".025"/></radialGradient><linearGradient id="fade"><stop stop-color="currentColor" stop-opacity=".8"/><stop offset="1" stop-color="currentColor" stop-opacity=".05"/></linearGradient></defs>';
  const sphere = '<circle cx="110" cy="70" r="40" fill="url(#orb)" stroke="currentColor" stroke-opacity=".35"/>';
  const arts = {
    ocean: `${sphere}<path d="M73 60q18-12 37 0t37 0M71 73q20-12 40 0t39 0M77 86q17-12 34 0t32 0" stroke="currentColor" stroke-opacity=".7" fill="none"/><text x="169" y="72">H₂O</text>`,
    atmosphere: `${sphere}<circle cx="110" cy="70" r="46" stroke="currentColor" stroke-opacity=".6"/><circle cx="110" cy="70" r="52" stroke="currentColor" stroke-opacity=".13"/><path d="M155 48h43M159 52l-4-4 4-4" stroke="currentColor" stroke-opacity=".6"/>`,
    tilt: `${sphere}<ellipse cx="110" cy="70" rx="40" ry="12" transform="rotate(23.4 110 70)" stroke="currentColor" stroke-opacity=".3"/><path d="m88 18 44 104" stroke="currentColor" stroke-dasharray="3 4"/><path d="M110 13v40m0-34a51 51 0 0 0-20 5" stroke="currentColor" stroke-opacity=".5"/><text x="122" y="25">23.4°</text>`,
    orbit: '<ellipse cx="110" cy="70" rx="88" ry="39" stroke="currentColor" stroke-opacity=".25"/><ellipse cx="110" cy="70" rx="61" ry="26" stroke="currentColor" stroke-opacity=".15"/><circle cx="110" cy="70" r="12" fill="url(#orb)" stroke="currentColor" stroke-opacity=".8"/><circle cx="178" cy="95" r="7" fill="currentColor" fill-opacity=".75"/><path d="m84 31 8-4-7-4" stroke="currentColor"/>',
    temperature: `${sphere}<path d="M110 30a40 40 0 0 1 0 80Z" fill="currentColor" fill-opacity=".14"/><path d="M110 22v96" stroke="currentColor" stroke-dasharray="2 4" stroke-opacity=".3"/><text x="42" y="74">−</text><text x="169" y="74">+</text>`,
    ice: `${sphere}<path d="m91 47 19 6 17-6-10 14-17 2Z" fill="currentColor" fill-opacity=".18"/><path d="M110 36v17m-8-13 16 10m-16 0 16-10" stroke="currentColor" stroke-opacity=".75"/><path d="m156 32 15-9m-13 17 19-2m-25-13 4-15" stroke="currentColor" stroke-opacity=".3"/>`,
    layers: '<ellipse cx="110" cy="42" rx="54" ry="20" fill="url(#orb)" stroke="currentColor" stroke-opacity=".6"/><path d="M56 60q0 40 54 40t54-40M56 81q0 40 54 40t54-40" stroke="currentColor" stroke-opacity=".3"/><path d="m87 44 9 3 8-6 9 8 9-5 11 3" stroke="currentColor" stroke-opacity=".8"/><path d="M176 42v62m-4-5 4 5 4-5" stroke="currentColor" stroke-opacity=".3"/>',
    gravity: '<circle cx="110" cy="70" r="23" fill="url(#orb)" stroke="currentColor"/><ellipse cx="110" cy="70" rx="57" ry="41" stroke="currentColor" stroke-opacity=".3"/><ellipse cx="110" cy="70" rx="86" ry="58" stroke="currentColor" stroke-opacity=".15"/><circle cx="164" cy="57" r="4" fill="currentColor"/><circle cx="48" cy="110" r="3" fill="currentColor"/>',
    plasma: `${sphere}<path d="M79 51q20 22 37 5t29 10M73 77q19-19 42 3t30 5M90 35q-8 30 11 39t5 34" stroke="currentColor" stroke-opacity=".55"/><circle cx="110" cy="70" r="12" fill="currentColor" fill-opacity=".16"/>`,
    corona: '<circle cx="110" cy="70" r="30" fill="#111b1a" stroke="currentColor" stroke-opacity=".9"/><circle cx="110" cy="70" r="38" stroke="currentColor" stroke-opacity=".25"/><ellipse cx="110" cy="70" rx="78" ry="44" stroke="currentColor" stroke-opacity=".12"/><path d="M62 70H23m134 0h40M110 23V9m0 108v14m-37-97L52 18m97 84 20 17m-95-15-24 14m97-81 23-20" stroke="currentColor" stroke-opacity=".35"/>',
  };
  return `<svg viewBox="0 0 220 140" fill="none" stroke-width="1" aria-hidden="true"><style>text{font:10px Arial;fill:currentColor;opacity:.7}</style>${base}${arts[type] || arts.orbit}<circle cx="15" cy="25" r="1" fill="currentColor" opacity=".3"/><circle cx="199" cy="117" r="1" fill="currentColor" opacity=".3"/></svg>`;
}

function openDiscovery(index, bodyId = state.id) {
  const body = bodyById[bodyId];
  const discovery = body?.discoveries[index];
  if (!discovery) return;
  state.discovery = index; state.discoveryBody = bodyId;
  if (journal.add(bodyId, index)) audio.chime();
  $('#discovery-location').innerHTML = `<span class="tiny-star">✦</span> ${body.name.toUpperCase()} / A CLOSER LOOK`;
  $('#discovery-number').textContent = `OBSERVATION 0${index+1} / 03`;
  $('#discovery-title').textContent = discovery.title;
  $('#discovery-body').textContent = discovery.text;
  $('#discovery-stat').textContent = discovery.stat;
  $('#discovery-stat-label').textContent = discovery.unit;
  $('#discovery-source').href = discovery.source || body.source;
  $('#discovery-illustration').innerHTML = illustration(discovery.art);
  $('#discovery-dialog').style.setProperty('--accent', body.color);
  $('#next-discovery').innerHTML = `${journal.count(bodyId) === 3 ? 'Back to the world' : 'Keep looking'} ${icon('arrow-right')}`;
  updateCounts();
  $('#journal-dialog').close();
  if (!$('#discovery-dialog').open) $('#discovery-dialog').showModal();
}

function openJournal() {
  const count=journal.size+fieldNotes.size,total=totalDiscoveries+totalFieldNotes;
  $('#journal-progress-label').textContent = `${count} of ${total} observations${count === total ? ' · A little universe, discovered.' : ''}`;
  $('#journal-progress-bar').style.width = `${count/total*100}%`;
  $('#journal-entries').innerHTML = `${journal.size === 0 ? '<p class="journal-empty">Your story starts with a little curiosity. Visit a world and follow its glowing markers to find your first observation.</p>' : ''}${bodies.map(body => `<section class="journal-world"><div class="journal-world-heading"><span class="mini-planet mini-${body.id}" aria-hidden="true"></span><h3>${body.name}</h3><span>${journal.count(body.id)} / 3</span></div>${body.discoveries.map((discovery,i) => journal.has(body.id,i) ? `<button class="journal-entry" data-journal-body="${body.id}" data-journal-index="${i}"><span>✧</span>${discovery.title}<span>↗</span></button>` : `<button class="journal-entry locked" data-visit="${body.id}" aria-label="Visit ${body.name} to discover observation ${i+1}"><span>○</span>Something still waiting to be found<span>↗</span></button>`).join('')}</section>`).join('')}`;
  $('#journal-entries').insertAdjacentHTML('beforeend',`<h3 class="field-journal-heading">From within the worlds.</h3><p class="journal-empty">${fieldNotes.size ? 'A few things you found along the way.' : 'Enter a world and approach a signal to collect field notes.'}</p>${Object.entries(expeditions).flatMap(([id,exp])=>exp.landmarks.map((point,i)=>fieldNotes.has(id,i)?`<button class="field-note-log" data-field-body="${id}" data-field-index="${i}"><span>✧ &nbsp; ${point.title}</span><small>${bodyById[id].shortName} ↗</small></button>`:'')).join('')}`);
  $('#journal-dialog').showModal();
}

async function enterExpedition() {
  if(!state.ready||state.entering||state.expedition||universe.travel)return;
  if(state.quiet)setQuiet(false);
  const token=++entryToken;
  state.entering=true;
  orbitSnapshot={position:universe.camera.position.clone(),target:universe.controls.target.clone()};
  universe.controls.enabled=false;
  $('#enter-world').disabled=true;
  document.body.classList.add('expedition-entering');
  $('#entry-message').textContent=`Approaching ${bodyById[state.id].name}`;
  $('#entry-veil').hidden=false;
  const modulePromise=import('./expeditions/world.js').then(module=>({module}),error=>({error}));
  const offset=universe.camera.position.clone().sub(universe.controls.target).normalize().multiplyScalar(bodyById[state.id].radius*1.2);
  if(!reducedMotion.matches){
    universe.travel={started:performance.now(),duration:1400,fromPosition:universe.camera.position.clone(),toPosition:universe.controls.target.clone().add(offset),fromTarget:universe.controls.target.clone(),toTarget:universe.controls.target.clone(),arc:0,finish:()=>{universe.travel=null;}};
    await new Promise(resolve=>setTimeout(resolve,750));
  }
  $('#entry-veil').classList.add('visible');
  if(!reducedMotion.matches)await new Promise(resolve=>setTimeout(resolve,550));
  try {
    const loaded=await modulePromise;if(loaded.error)throw loaded.error;
    const {Expedition}=loaded.module;
    if(token!==entryToken)return;
    universe.travel=null;
    universe.expedition=new Expedition(state.id,universe.renderer,{reducedMotion:reducedMotion.matches,onUpdate:updateExpedition,onNotice:toast,night:universe.items.get(state.id)?.view==='night'});
    await universe.expedition.ready;
    state.expedition=true;state.entering=false;
    document.body.classList.remove('expedition-entering');document.body.classList.add('in-expedition');
    $('#expedition').hidden=false;
    const config=expeditions[state.id];
    $('#exp-body').textContent=bodyById[state.id].name.toUpperCase();
    const earth=universe.expedition.earthProfile;
    $('#exp-title').textContent=(earth?.name||config.name)+'.';$('#exp-invitation').textContent=earth?.invitation||config.invitation;$('#exp-subtitle').textContent=earth?'An imagined temperate Pacific coast':config.subtitle;
    $('#exp-ocean').hidden=!earth;$('#exp-lamp').hidden=true;
    $('#exp-layer').innerHTML=`${config.layer.label} <span>↑</span>`;
    $('#exp-walk').hidden=state.id==='sun';$('#exp-solar-filter').hidden=state.id!=='sun';$('#exp-solar-filter').setAttribute('aria-pressed','false');$('#exp-solar-filter').textContent='Filtered light';
    $('#exp-glide').textContent=state.id==='mercury'?'Powered glide':state.id==='sun'?'Virtual observer':'Glide';
    $('#exp-glide').disabled=state.id==='sun';
    $('#exp-evidence-label').textContent=state.id==='sun'?'INTERPRETED PLASMA · NO SOLID SURFACE':'REPRESENTATIVE LANDSCAPE · VIRTUAL EXPLORER';
    $('#exp-markers').innerHTML=config.landmarks.map((point,i)=>`<button class="field-marker" data-field-target="${i}" aria-label="Explore ${point.name}"><i></i><span>${point.name}<small></small></span></button>`).join('');
    $('#exp-route-options').innerHTML=config.landmarks.map((point,i)=>`<button class="exp-route-option" data-field-target="${i}"><span><small>0${i+1}</small>${point.name}</span><span>↗</span></button>`).join('');
    $('#exp-route').hidden=true;$('#exp-route-button').setAttribute('aria-expanded','false');
    $('#entry-veil').classList.remove('visible');
    setTimeout(()=>{if(token===entryToken){$('#entry-veil').hidden=true;universe.expedition?.beginEntry();}},reducedMotion.matches?0:600);
    universe.renderer.domElement.focus();
    announce(`${config.name}. ${config.description} Use WASD to move, drag to look, or follow a signal.`);
  } catch(error) {
    console.error('Could not enter the environment:',error);
    leaveExpedition();toast('The environment could not load. You’re safely back in orbit.');
  }
}

function leaveExpedition() {
  entryToken++;state.entering=false;state.expedition=false;
  universe.expedition?.dispose();universe.expedition=null;universe.travel=null;
  audio.setEnvironment({earth:false,depth:0,night:false});
  document.body.classList.remove('in-expedition','expedition-entering');
  $('#expedition').hidden=true;$('#entry-veil').hidden=true;$('#entry-veil').classList.remove('visible');
  $('#enter-world').disabled=false;
  if(orbitSnapshot){universe.camera.position.copy(orbitSnapshot.position);universe.controls.target.copy(orbitSnapshot.target);}
  universe.setFraming();universe.controls.enabled=true;universe.controls.update();
  $('#enter-world').focus();updateCounts();
  announce(`Back in orbit around ${bodyById[state.id].name}.`);
}

function distanceLabel(value,solar=false) {
  const meters=solar?value*10000:value;
  return meters>=1000?`${(meters/1000).toLocaleString(undefined,{maximumFractionDigits:meters>=100000?0:1})} km`:`${Math.round(meters)} m`;
}

function updateExpedition(reading,world) {
  const width=$('#app').clientWidth,height=$('#app').clientHeight;
  document.querySelectorAll('.field-marker').forEach((element,i)=>{
    const p=world.project(i,width,height);
    const waterVisible=!world.ocean||(reading.underwater?p.distance<65:!world.landmarks[i].underwater||p.distance<220);
    const visible=waterVisible&&p.visible&&reading.nearby!==i&&p.y>height*.3&&p.y<height-(width<900?320:180)&&!reading.travel;
    element.style.left=`${p.x}px`;element.style.top=`${p.y}px`;element.style.visibility=visible?'visible':'hidden';element.tabIndex=visible?0:-1;
    element.querySelector('small').textContent=distanceLabel(p.distance,state.id==='sun')+' · '+(fieldNotes.has(state.id,i)?'IN YOUR JOURNAL':'FOLLOW SIGNAL');
  });
  if(performance.now()-fieldUpdateTime<120)return;fieldUpdateTime=performance.now();
  const aboveSea=!!world.ocean&&reading.ground<0&&!reading.underwater;
  $('#exp-altitude-label').textContent=reading.underwater?'BELOW THE WAVES':aboveSea?'ABOVE THE WAVES':state.id==='sun'?'ABOVE PHOTOSPHERIC REFERENCE':reading.y>5000?'ABOVE SCENE REFERENCE':'ABOVE LOCAL GROUND';
  $('#exp-altitude').textContent=distanceLabel(reading.underwater?reading.depth:aboveSea?reading.waterClearance:reading.y>5000?reading.y:reading.clearance,state.id==='sun');
  $('#exp-heading').textContent=`${String(Math.round(reading.heading)).padStart(3,'0')}°`;
  $('#exp-medium').textContent=reading.environment.toUpperCase();$('#exp-reference').textContent=reading.reference;
  $('#exp-glide').setAttribute('aria-pressed',String(reading.mode!=='walk'));$('#exp-walk').setAttribute('aria-pressed',String(reading.mode==='walk'));
  if(world.ocean){
    $('#exp-glide').textContent=reading.underwater?'Swim':'Glide';
    $('#exp-ocean').innerHTML=reading.underwater?'Return to the surface <span aria-hidden="true">↑</span>':'Dive into the sea <span aria-hidden="true">↓</span>';
    $('#exp-lamp').hidden=!reading.underwater;$('#exp-lamp').setAttribute('aria-pressed',String(world.ocean.lampEnabled));
    $('#exp-lamp').textContent=world.ocean.lampEnabled?'Observer light · on':'Observer light · off';
    audio.setEnvironment({earth:true,depth:reading.depth,night:reading.night,underwater:reading.underwater,waterClearance:reading.waterClearance});
  }
  $('#exp-hop').hidden=reading.mode!=='walk';
  document.querySelectorAll('.exp-height-controls [data-move="KeyE"],.exp-height-controls [data-move="KeyQ"]').forEach(button=>{button.hidden=reading.mode==='walk';});
  $('#exp-nearby').hidden=reading.nearby<0||reading.travel||!$('#exp-route').hidden;
  if(reading.nearby>=0)$('#exp-nearby-name').textContent=expeditions[state.id].landmarks[reading.nearby].name;
  $('#exp-transit').hidden=!reading.travel;
  $('#exp-transit-label').textContent=reading.entry?(state.id==='sun'?'Approaching a sea of plasma':state.id==='venus'&&reading.y>40000?'Within the cloud layers':'Descending toward the landscape'):'Assisted flight · time compressed';
  $('#exp-progress').textContent=`${expeditions[state.id].landmarks.filter((_,i)=>fieldNotes.has(state.id,i)).length} / ${expeditions[state.id].landmarks.length} FIELD NOTES`;
  $('#exp-layer').innerHTML=`${reading.y>expeditions[state.id].layer.height*.7?'Return to the study':expeditions[state.id].layer.label} <span>${reading.y>expeditions[state.id].layer.height*.7?'↓':'↑'}</span>`;
  $('#expedition').dataset.mode=reading.mode;$('#expedition').dataset.clearance=reading.clearance.toFixed(3);$('#expedition').dataset.x=reading.x.toFixed(2);$('#expedition').dataset.y=reading.y.toFixed(2);$('#expedition').dataset.z=reading.z.toFixed(2);
  $('#expedition').dataset.night=String(reading.night);$('#expedition').dataset.depth=reading.depth.toFixed(3);$('#expedition').dataset.speed=reading.speed.toFixed(3);
}

function openFieldNote(id,index,remember=true) {
  const config=expeditions[id],point=config.landmarks[index];if(!point)return;
  if(remember&&!fieldNotes.has(id,index)){fieldNotes.add(id,index);audio.chime();}
  $('#field-note-location').textContent=`${bodyById[id].name.toUpperCase()} / FIELD NOTE 0${index+1}`;
  $('#field-note-title').textContent=point.title;$('#field-note-text').textContent=point.text;
  $('#field-note-evidence').textContent=config.evidence;$('#field-note-source').href=point.source;
  $('#journal-dialog').close();$('#field-note-dialog').showModal();universe.expedition?.releaseInputs();updateCounts();
}

$('#enter-world').addEventListener('click',enterExpedition);
$('#return-orbit').addEventListener('click',leaveExpedition);
$('#exp-skip').addEventListener('click',()=>universe.expedition?.finishTravel());
$('#exp-glide').addEventListener('click',()=>universe.expedition?.setMode('glide'));
$('#exp-walk').addEventListener('click',()=>universe.expedition?.setMode('walk'));
$('#exp-layer').addEventListener('click',()=>universe.expedition?.changeLayer());
$('#exp-ocean').addEventListener('click',()=>universe.expedition?.changeOceanLayer());
$('#exp-lamp').addEventListener('click',()=>{const ocean=universe.expedition?.ocean;if(ocean)ocean.lampEnabled=!ocean.lampEnabled;});
$('#exp-solar-filter').addEventListener('click',()=>{
  const solar=universe.expedition?.solar;if(!solar)return;
  const mono=solar.surface.material.uniforms.uMono.value?0:1;solar.surface.material.uniforms.uMono.value=mono;
  $('#exp-solar-filter').setAttribute('aria-pressed',String(!!mono));
  $('#exp-solar-filter').textContent=mono?'Assigned color':'Filtered light';
  $('#exp-evidence-label').textContent=mono?'FILTERED MONOCHROME STUDY · NOT A RECORDED OBSERVATION':'INTERPRETED PLASMA · NO SOLID SURFACE';
});
$('#exp-route-button').addEventListener('click',()=>{$('#exp-route').hidden=!$('#exp-route').hidden;$('#exp-route-button').setAttribute('aria-expanded',String(!$('#exp-route').hidden));});
$('#exp-observe').addEventListener('click',()=>{const index=universe.expedition?.nearby;if(index>=0)openFieldNote(state.id,index);});
$('#exp-evidence').addEventListener('click',()=>{const config=expeditions[state.id];$('#environment-title').textContent=config.name;$('#environment-evidence').textContent=config.evidence;$('#environment-source').href=config.source;$('#environment-dialog').showModal();});

function selectInfoTab(science) {
  $('#controls-tab').setAttribute('aria-selected', String(!science));
  $('#science-tab').setAttribute('aria-selected', String(science));
  $('#controls-panel').hidden = science;
  $('#science-panel').hidden = !science;
}

function setMotion(value) {
  state.motion = value;
  if (universe) universe.motion = value;
  $('#motion-button').setAttribute('aria-label', value ? 'Pause rotation' : 'Resume rotation');
  $('#motion-button').setAttribute('aria-pressed', String(!value));
  $('#motion-label').textContent = value ? 'Gentle drift' : 'Drift paused';
  $('#motion-button [data-icon]').innerHTML = icon(value ? 'pause' : 'play');
}

function setQuiet(value) {
  state.quiet = value;
  document.body.classList.toggle('quiet', value);
  $('#exit-quiet').hidden = !value;
  $('#cinema-button').setAttribute('aria-pressed', String(value));
  universe?.setQuiet(value);
  if (value) $('#exit-quiet').focus();
  else $('#cinema-button').focus();
}

document.addEventListener('click', event => {
  const fieldTarget=event.target.closest('[data-field-target]');
  if(fieldTarget&&universe.expedition){universe.expedition.visit(Number(fieldTarget.dataset.fieldTarget));$('#exp-route').hidden=true;$('#exp-route-button').setAttribute('aria-expanded','false');}
  const fieldEntry=event.target.closest('[data-field-body]');
  if(fieldEntry)openFieldNote(fieldEntry.dataset.fieldBody,Number(fieldEntry.dataset.fieldIndex),false);
  const destination = event.target.closest('[data-destination]');
  if (destination) travel(destination.dataset.destination);
  const discovery = event.target.closest('[data-discovery]');
  if (discovery) openDiscovery(Number(discovery.dataset.discovery));
  const view = event.target.closest('[data-view]');
  if (view && state.ready) {
    universe.setView(view.dataset.view);
    $('#view-switch').querySelectorAll('button').forEach(button => { button.classList.toggle('active', button === view); button.setAttribute('aria-pressed', String(button === view)); });
    const captions = { night: 'Our luminous footprint, seen after dark.', surface: 'A radar-derived portrait, beneath the clouds.', corona: 'An eclipse-style view. The corona is an artistic interpretation.', terminator: 'Where the long day meets the long night.' };
    $('#view-caption').textContent = captions[view.dataset.view] || bodyById[state.id].caption;
    announce(`${bodyById[state.id].name}: ${view.textContent} view.`);
  }
  if (event.target.closest('[data-close]')) event.target.closest('dialog').close();
  const entry = event.target.closest('[data-journal-body]');
  if (entry) openDiscovery(Number(entry.dataset.journalIndex), entry.dataset.journalBody);
  const visit = event.target.closest('[data-visit]');
  if (visit) { $('#journal-dialog').close(); travel(visit.dataset.visit); }
});

document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

$('#discover-button').addEventListener('click', () => { const next = bodyById[state.id].discoveries.findIndex((_,i) => !journal.has(state.id,i)); openDiscovery(next === -1 ? 0 : next); });
$('#next-discovery').addEventListener('click', () => {
  const bodyId = state.discoveryBody;
  if (journal.count(bodyId) === 3) { $('#discovery-dialog').close(); return; }
  const next = bodyById[bodyId].discoveries.findIndex((_,i) => !journal.has(bodyId,i));
  openDiscovery(next, bodyId);
});
$('#journal-nav').addEventListener('click', openJournal);
$('#map-nav').addEventListener('click', () => travel(state.id, true));
$('#explore-nav').addEventListener('click', () => { if (state.map) travel(state.id); });
$('.brand').addEventListener('click', event => { event.preventDefault(); travel('earth'); });
$('#help-button').addEventListener('click', () => { selectInfoTab(false); $('#info-dialog').showModal(); });
$('#about-button').addEventListener('click', () => { selectInfoTab(true); $('#info-dialog').showModal(); });
$('#controls-tab').addEventListener('click', () => selectInfoTab(false));
$('#science-tab').addEventListener('click', () => selectInfoTab(true));
$('.info-tabs').addEventListener('keydown', event => {
  if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const science = event.key === 'End' || (event.key !== 'Home' && $('#controls-tab').getAttribute('aria-selected') === 'true');
  selectInfoTab(science); $(science ? '#science-tab' : '#controls-tab').focus();
});
$('#zoom-in').addEventListener('click', () => universe?.zoom(0.82));
$('#zoom-out').addEventListener('click', () => universe?.zoom(1.22));
$('#reset-view').addEventListener('click', () => travel(state.id, state.map));
$('#motion-button').addEventListener('click', () => setMotion(!state.motion));
$('#cinema-button').addEventListener('click', () => setQuiet(!state.quiet));
$('#exit-quiet').addEventListener('click', () => setQuiet(false));
$('#sound-button').addEventListener('click', async () => {
  try {
    const enabled = await audio.toggle();
    $('#sound-button').setAttribute('aria-pressed', String(enabled));
    $('#sound-button').setAttribute('aria-label', enabled ? 'Mute ambient sound' : 'Enable ambient sound');
    $('#sound-button').innerHTML = icon(enabled ? 'sound-on' : 'sound-off');
    toast(enabled ? 'A little atmosphere. Sound is on.' : 'Just you and the universe. Sound is off.');
  } catch { toast('Sound is unavailable in this browser. The journey is still yours.'); }
});
document.addEventListener('visibilitychange', () => audio.visibility(document.hidden));
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || document.querySelector('dialog[open]')) return;
  if(state.entering)return;
  if(state.expedition){
    if(event.key==='Escape')leaveExpedition();
    if(event.key.toLowerCase()==='r')universe.expedition.reset();
    return;
  }
  if (event.key === 'Escape' && state.quiet) setQuiet(false);
  if (event.key.toLowerCase() === 'f') setQuiet(!state.quiet);
  if (event.key.toLowerCase() === 'r') travel(state.id, state.map);
  if (event.key === '+' || event.key === '=') universe?.zoom(0.85);
  if (event.key === '-' || event.key === '_') universe?.zoom(1.18);
  if (event.code === 'Space' && (event.target === document.body || event.target.tagName === 'CANVAS')) { event.preventDefault(); setMotion(!state.motion); }
});
window.addEventListener('hashchange', () => { if (bodyById[location.hash.slice(1)]) travel(location.hash.slice(1)); });
reducedMotion.addEventListener('change', event => { if (universe) universe.reducedMotion = event.matches; setMotion(!event.matches); });

function renderError(message) {
  $('#loading-screen').classList.add('done');
  $('#render-error-message').textContent = message;
  $('#render-error').hidden = false;
}

renderBody();
setMotion(state.motion);
$('#map-labels').innerHTML = bodies.map(body => `<button class="map-label" data-destination="${body.id}" aria-label="Fly to ${body.name}"><span>${body.shortName}<small>${body.id === 'sun' ? 'OUR STAR' : body.facts[2][0] + ' AU'}</small></span><span>↗</span></button>`).join('');

try {
  universe = new Universe($('#universe'), {
    reducedMotion: reducedMotion.matches,
    onProgress: progress => { $('#loading-progress').style.width = `${progress*100}%`; },
    onReady: () => {
      state.ready = true;
      $('#loading-screen').classList.add('done');
      setTimeout(() => { $('#loading-screen').hidden = true; }, reducedMotion.matches ? 0 : 900);
      $('#app').dataset.ready = 'true';
      universe.onFrame = updateMarkers;
      universe.onPick = id => travel(id);
      announce(`Welcome to StarForge. You are at ${bodyById[state.id].name}. Take your time. There are four worlds to explore.`);
    },
    onTravelEnd: travelFinished,
    onError: renderError,
  });
  universe.activeId = state.id;
} catch (error) {
  console.error('StarForge could not initialize:', error);
  renderError('This experience needs WebGL. Please enable hardware acceleration or try a recent browser.');
}
