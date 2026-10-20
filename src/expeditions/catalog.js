// Physical references are separate from the authored scene and navigation speeds.
// These are representative environments, not georeferenced terrain products.
export const expeditions = {
  earth: {
    name: 'The breathing coast', subtitle: 'A volcanic coast, imagined on Earth',
    invitation: 'Where the sky meets the sea.',
    description: 'Slip beneath the surface. Follow a school of silver fish. Surface beneath an open sky.',
    evidence: 'An imagined temperate eastern Pacific coast, not a surveyed place. The seafloor, kelp, waves, and animal positions are authored. Northern anchovies and crystal jellies share a compatible regional habitat. Both remain present by day and night. After Dark is a composed moonlit sky, not a dated star map. Water uses approximate reflection, refraction, and separate RGB transmission and scattering; visibility and the optional observer light are adjusted for exploration. Crystal-jelly rim flashes are an illustrated disturbance response, made easier to notice here. Swimming intentionally matches flight speed.',
    source: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/earth-atmosphere-equation-metric/',
    physics: { gravity: 9.80665, unit: 'm', atmosphere: 'Nitrogen · oxygen', reference: 'Earth standard gravity' },
    play: { seed: 71, speed: 27, walkSpeed: 6, jumpSpeed: 5, ceiling: 6000, extent: 1450, start: [15, 62, 370], yaw: 0.47, pitch: -0.12, descent: 2200 },
    sky: { top: '#125d9a', horizon: '#a3cad4', ground: '#596950', fog: '#a9c6c2', density: 0.00036, sun: '#fff0cc', sunDirection: [-0.65, 0.38, -0.7] },
    layer: { label: 'Above the clouds', height: 2100 },
    landmarks: [
      { id: 'shore', name: 'The meeting of two worlds', position: [-120, 190], radius: 65, title: 'A planet in motion', text: 'At the shore, air, rock, and liquid water meet. Waves continually work the coastline. The water you see here is an animated interpretation, while Earth’s liquid surface oceans are a defining real difference from these neighboring worlds.', source: 'https://science.nasa.gov/earth/facts/' },
      { id: 'ridge', name: 'The green headland', position: [335, -230], radius: 75, title: 'A living surface', text: 'Earth’s life transforms its landscapes and atmosphere. This grove is representative vegetation, not a record of individual trees. Lift off from the ridge to see how land, water, and clouds connect.', source: 'https://science.nasa.gov/earth/facts/' },
      { id: 'cloud', name: 'A little weather', position: [-300, -130], altitude: 1250, radius: 150, title: 'The air has layers', text: 'Most of Earth’s weather happens in the troposphere. These clouds belong to an imagined coastal weather scene. The reference atmosphere becomes thinner and colder with altitude here; actual weather varies by place and time.', source: 'https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/' },
      { id: 'school', name: 'A silver current', position: [-225, 180], altitude: -7, radius: 12, underwater: true, title: 'A thousand little decisions', text: 'Northern anchovies form schools along the eastern North Pacific coast. Staying together can help protect them from predators. Watch the changing headings and flashes of silver: this school is an animated interpretation, with individual fish around 13–22 cm long.', source: 'https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/northern-anchovy' },
      { id: 'garden', name: 'The submerged garden', position: [-390, -100], altitude: -3.5, radius: 14, underwater: true, title: 'The color of distance', text: 'Water gradually absorbs and scatters light. Warm colors fade more quickly along the light’s path, while distant rock and kelp lose contrast. The blue-green veil here represents one chosen coastal-water profile; real clarity varies with suspended material and conditions.', source: 'https://oceanservice.noaa.gov/facts/oceanblue.html' },
      { id: 'jellies', name: 'Lanterns in the current', position: [-280, 145], altitude: -8, radius: 8, underwater: true, title: 'A little living light', text: 'Crystal jellies are nearly transparent and can reach about 25 cm across. When disturbed, tiny light-producing structures around the bell margin can glow green-blue. Approach gently and pause. The brief flashes here illustrate that response; a swimmer’s approach does not guarantee a flash in nature.', source: 'https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/crystal-jelly' },
    ],
  },
  mercury: {
    name: 'The long light', subtitle: 'An interpreted impact landscape',
    invitation: 'A world that keeps its silence.',
    description: 'Cross the rim. Step into shadow. Feel what a little less gravity changes.',
    evidence: 'An invented crater landscape informed by MESSENGER observations, not a measured Mercury location. There is no weather-bearing atmosphere, atmospheric lift, or wind-driven dust. Ground hopping uses 3.70 m/s² gravity with the same launch speed as Earth. Glide mode is a fictional powered observer. This site is not a mapped polar ice deposit.',
    source: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html',
    physics: { gravity: 3.70, unit: 'm', atmosphere: 'Near vacuum · exosphere', reference: 'Mean surface gravity' },
    play: { seed: 129, speed: 24, walkSpeed: 6, jumpSpeed: 5, ceiling: 4500, extent: 1450, start: [45, 70, 420], yaw: 0.12, pitch: -0.1, descent: 1800 },
    sky: { top: '#020304', horizon: '#040506', ground: '#070707', fog: '#111111', density: 0, sun: '#fff9eb', sunDirection: [-0.85, 0.19, -0.4] },
    layer: { label: 'Above the rim', height: 700 },
    landmarks: [
      { id: 'rim', name: 'The impact rim', position: [90, 80], radius: 65, title: 'The memory of an impact', text: 'Mercury is scarred by impacts. A raised rim and excavated bowl help us read an impact’s story. This crater’s shape and rocks are reconstructed examples, not a scan of a named feature.', source: 'https://science.nasa.gov/mercury/facts/' },
      { id: 'hollows', name: 'A pale question', position: [-245, -170], radius: 65, title: 'A question in the ground', text: 'MESSENGER revealed bright, irregular depressions called hollows. Loss of volatile material is a leading explanation, but their formation remains under study. This pale patch illustrates the idea; it is not a confirmed ice deposit or an underground cave.', source: 'https://science.nasa.gov/solar-system/planets/mercury/mercurys-strange-hollows/' },
      { id: 'scarp', name: 'The folded horizon', position: [490, -310], radius: 70, title: 'A planet, contracting', text: 'Cliffs called scarps record Mercury’s crust shortening as its interior cooled. The distant ridge interprets that process. Its fractures and traversable paths are authored, rather than measured spacecraft geometry.', source: 'https://www.nasa.gov/missions/the-incredible-shrinking-mercury-is-active-after-all/' },
    ],
  },
  venus: {
    name: 'Beneath the golden veil', subtitle: 'Clouds above an interpreted volcanic plain',
    invitation: 'Another world below the clouds.',
    description: 'Descend through a luminous haze. Find dark rock under an unfamiliar light.',
    evidence: 'A representative plain inspired by Venera surface observations and the research report. Dark rocks are lit by warm, filtered light; radar brightness is not used as optical color or elevation. Clouds are illustrated around 45–70 km. The surface reference of approximately 464°C and 92 bar is not extrapolated into a precise atmosphere profile. All travel uses a fictional protected observer.',
    source: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html',
    physics: { gravity: 8.87, unit: 'm', atmosphere: 'Carbon dioxide · nitrogen', reference: 'Mean surface gravity', surfaceTemperatureC: 464, surfacePressureBar: 92 },
    play: { seed: 311, speed: 21, walkSpeed: 5, jumpSpeed: 5, ceiling: 78000, extent: 1450, start: [70, 34, 330], yaw: -0.2, pitch: -0.08, descent: 72000 },
    sky: { top: '#78603b', horizon: '#d3a45c', ground: '#59462e', fog: '#b08a52', density: 0.00125, sun: '#ffe8b2', sunDirection: [-0.5, 0.5, -0.7] },
    layer: { label: 'Into the cloud sea', height: 58000 },
    landmarks: [
      { id: 'slabs', name: 'Stories in the slabs', position: [-100, 130], radius: 65, title: 'Rock beneath warm light', text: 'Venera panoramas provide rare views from Venus’ ground. The strong illumination tint should not be mistaken for every rock’s intrinsic color. These slab-like rocks are an interpretation inspired by those limited observations.', source: 'https://www.lpi.usra.edu/publications/slidesets/venus/slide_3.shtml' },
      { id: 'plain', name: 'A volcanic memory', position: [370, -290], radius: 75, title: 'A changing volcanic world', text: 'Magellan radar comparisons have revealed evidence of volcanic change. This landscape represents volcanic terrain; it does not depict a particular observed eruption. The hazy distance is an atmospheric treatment, not a radar image.', source: 'https://www.nasa.gov/missions/veritas/nasas-magellan-data-reveals-volcanic-activity-on-venus/' },
      { id: 'clouds', name: 'The suspended world', position: [-250, -150], altitude: 58000, radius: 350, title: 'An entirely different layer', text: 'Venus’ main clouds occupy roughly 45–70 km and contain sulfuric-acid aerosols. Winds aloft are much faster than near the ground. This cloudscape is representative, not live weather, and its air remains unbreathable.', source: 'https://www.esa.int/Science_Exploration/Space_Science/Venus_Express/Greenhouse_effect_clouds_and_winds' },
    ],
  },
  sun: {
    name: 'An ocean of light', subtitle: 'A virtual study of the solar atmosphere',
    invitation: 'No ground. Only restless light.',
    description: 'Drift above luminous cells and follow an interpretation of magnetic structure.',
    evidence: 'A procedural solar study, not a recorded observation or a navigable solid surface. One scene unit represents 10 km; cells are approximately 1,000 km across. Granulation evolves faster than its real timescale. Warm colors are assigned for readability; the filtered monochrome view is also an interpretation. Magnetic tracers are illustrative geometry, not a measured 3D field or a spacecraft-safe route.',
    source: 'https://solarscience.msfc.nasa.gov/feature1.shtml',
    physics: { gravity: 274, unit: '10 km', atmosphere: 'Plasma · no solid surface', reference: 'At the photospheric radius', unitMeters: 10000 },
    play: { seed: 901, speed: 38, walkSpeed: 0, jumpSpeed: 0, ceiling: 2500, extent: 1450, start: [30, 145, 400], yaw: 0.2, pitch: -0.18, descent: 1700 },
    sky: { top: '#030408', horizon: '#29100b', ground: '#3d1707', fog: '#6d290d', density: 0.00018, sun: '#ffc069', sunDirection: [0, 1, 0] },
    layer: { label: 'Above the plasma', height: 550 },
    landmarks: [
      { id: 'cells', name: 'A thousand-kilometer cell', position: [-200, 70], altitude: 85, radius: 80, title: 'Small from far away', text: 'Typical solar granules span about 1,000 kilometers. Bright interiors trace rising material; darker lanes trace cooler sinking material. This evolving pattern is procedural and time-compressed, informed by observations of convection.', source: 'https://solarscience.msfc.nasa.gov/feature1.shtml' },
      { id: 'spot', name: 'The cooler heart', position: [260, -290], altitude: 100, radius: 80, title: 'Dark does not mean empty', text: 'A sunspot is cooler than the surrounding photosphere, with a dark umbra and a structured penumbra. It is still intensely hot. The dark region below is a contrast study, not a crater or hole.', source: 'https://solarscience.msfc.nasa.gov/feature1.shtml' },
      { id: 'loop', name: 'Following invisible structure', position: [-310, -330], altitude: 350, radius: 100, title: 'Light follows the field', text: 'Solar plasma can reveal magnetic structure through luminous loops. The arcs here are a conceptual interpretation. Their height, shape, color, and motion are not a reconstruction of a specific observed event.', source: 'https://sdo.gsfc.nasa.gov/data/channels.php' },
    ],
  },
};

export const totalFieldNotes = Object.values(expeditions).reduce((total, world) => total + world.landmarks.length, 0);

export function earthAtmosphere(heightMeters) {
  const h = Math.max(0, Math.min(heightMeters, 11000));
  const temperatureC = 15.04 - 0.00649 * h;
  const pressureKPa = 101.29 * ((temperatureC + 273.1) / 288.08) ** 5.256;
  return { temperatureC, pressureKPa, density: pressureKPa / (0.2869 * (temperatureC + 273.1)) };
}

const storageKey = 'starforge-field-notes-v1';
const validNotes = new Set(Object.entries(expeditions).flatMap(([id, item]) => item.landmarks.map((_, i) => `${id}:${i}`)));
export class FieldNotes {
  constructor() {
    this.entries = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) saved.filter(id => validNotes.has(id)).forEach(id => this.entries.add(id));
    } catch { /* Continue with a session journal if storage is unavailable. */ }
  }
  has(id, i) { return this.entries.has(`${id}:${i}`); }
  add(id, i) {
    if (!validNotes.has(`${id}:${i}`)) return;
    this.entries.add(`${id}:${i}`);
    try { localStorage.setItem(storageKey, JSON.stringify([...this.entries])); } catch { /* Session-only journal. */ }
  }
  get size() { return this.entries.size; }
}
