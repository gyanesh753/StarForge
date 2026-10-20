# Exploring the Sun, Mercury, Venus, and Earth

Research and implementation reference for the next planetary-explorer build  
Research checked: 18 October 2026

## Project context and how to use this report

The existing prototype lets users view the Sun, Mercury, Venus, and Earth from outside. The next build should let them approach, enter, and explore these environments, with the pleasure of discovery carrying the learning. Walking, driving, flying, hovering, and other forms of exploration are possibilities for the implementation to interpret creatively.

**For Astra:** Read the existing project before changing it. Use this report as scientific grounding and a source of possibilities. Keep the established experience coherent while extending it into explorable worlds. Choose mechanics and technical solutions that fit the codebase; the examples below are not a mandatory itinerary or a fixed feature list. Build a meaningful version that the project owner can explore and refine before expanding beyond Earth. Keep measured facts, scientific interpretations, and invented detail distinguishable without interrupting the journey.

This is a build-focused synthesis, not a claim to catalogue every published study. It covers the environmental science, visual references, movement implications, mapping resources, uncertainties, and engineering decisions needed for this expansion. It does not include downloaded planetary datasets, a code audit, or tested asset integrations. Source access limitations are recorded below.

The central opportunity is to make the differences between worlds something the user experiences. Four differently colored versions of the same landscape would miss what makes this project interesting.

## What the evidence makes possible

| Destination | Physical environment | Promising experience — design suggestions | Evidence boundary |
|---|---|---|---|
| Sun | Luminous plasma; photosphere and extended atmosphere; no solid ground. [S02] | Fly through an interpreted solar atmosphere, approach evolving granulation, inspect magnetic activity with different instrument views. | Close-range free exploration requires a fictional observer or simulation. A rendered magnetic loop is not a surveyed tunnel. |
| Mercury | Solid, cratered world with an extremely tenuous exosphere. [S04][S05] | Walk or drive through impact terrain; make powered hops; investigate cliffs, hollows, and polar shadows. | Maps locate major terrain. Much of the material visible at foot level must be reconstructed. |
| Venus | Solid volcanic terrain beneath a dense, hot atmosphere and acid clouds. [S06][S07] | Descend through clouds, drift or fly through atmospheric layers, explore rocky plains with a protected vehicle or virtual observer. | Radar reveals structure rather than visible color. The few lander views do not describe the whole planet. |
| Earth | Solid land, oceans, a substantial atmosphere, and living environments. [S08] | Link orbital views, atmospheric flight, landing, and local exploration; offer water exploration if useful later. | Global coverage still does not provide every tree, path, cliff, or building as accurate 3D geometry. |

**Suggested framing:** an exploration system that lets the player experience otherwise inaccessible environments. Its protection, vehicles, and movement freedoms can be fictional while the environment remains evidence-based. That gives us room for fun without implying an ordinary spacesuit could support a walk on Venus or a landing on the Sun.

## Physical values worth putting into the build

These are rounded reference values, not a complete physical simulation. Store units and sources alongside them. A scientific value and a gameplay multiplier should be separate fields.

| Property | Sun | Mercury | Venus | Earth |
|---|---|---|---|---|
| Reference mean radius | 695,700 km [S03] | 2,439.4 km [S01] | 6,051.8 km [S01] | 6,371.0084 km [S01] |
| Representative gravity | 274 m/s² at the photospheric reference radius [S03] | 3.70 m/s² [S01] | 8.87 m/s² [S01] | Standard gravity: 9.80665 m/s²; actual gravity varies [S09] |
| Rotation relative to distant stars | Differential: about 25 days at equator and 36 near poles [S02] | 58.6462 Earth days [S01] | About 243 Earth days, retrograde [S01] | About 23 h 56 min [S09] |
| Solar day: sunrise to sunrise | No single planet-like value | About 176 Earth days [S05] | About 116.75 Earth days [S07] | About 24 hours [S09] |
| Temperature reference | Photosphere roughly 5,500°C; corona commonly millions of degrees [S02] | Surface extremes roughly −180°C to +430°C [S04] | Representative surface: 737 K, about 464°C [S07] | Use a location/season/weather scenario, not one global temperature |
| Pressure reference | Varies enormously by solar layer; not a ground-level air pressure | Effectively vacuum for ordinary movement [S05] | About 92 bar = 9.2 MPa [S07] | Approximately 1 bar near sea level; varies with altitude and weather [S09][S38] |
| Atmospheric character | Plasma; density and magnetic fields matter | Exosphere, not a weather-bearing atmosphere | Near surface approximately 96.5% CO₂ and 3.5% nitrogen [S07] | Dry air approximately 78% nitrogen and 21% oxygen [S09] |

**Numerical traps to avoid:**

- Rotation period and solar day are different quantities. A 59-day Mercury sunrise cycle or a 243-day Venus sunrise cycle would be wrong.
- Venus's 92 bar is approximately 91 standard Earth atmospheres, not exactly 92 atmospheres. Broad public descriptions round this differently.
- Mercury's temperature range describes surface temperatures, not breathable air or a uniform temperature applied everywhere.
- For Mercury's axial tilt, use the specialist fact sheet's approximately **0.034°**. The general NASA facts page currently gives 2°; this report follows the specialist parameter table. [S04][S05]
- Mean radius, equatorial radius, and a map product's reference radius are different. Use the dataset's own radius/datum when placing terrain. The Magellan topography product, for example, documents a 6,051,000 m reference radius, whereas Venus's mean radius above is 6,051,800 m. An unexamined substitution introduces an 800 m offset. [S35]
- Source tables sometimes use different epochs, definitions, or updated measurements. Keep one consistent set of physical parameters and preserve each map's metadata rather than silently mixing values.

## The Sun: an explorable star

### What is physically there

The visible photosphere is a layer of the solar atmosphere. Above it are the chromosphere, transition region, and corona. Below it lie the convection zone, radiative zone, and core. These are physical regions with different behavior, not solid nested shells. Fusion occurs in the core; the visible exterior is not an ordinary chemical fire. [S02]

Granulation is an excellent close-up subject. Typical granules are around 1,000 km across: bright regions mark rising hot material, with darker lanes around them. The pattern evolves over minutes. Sunspots have darker central umbrae and surrounding penumbrae; they are cooler, magnetically structured regions, not empty holes. [S10]

The corona's very high temperature does not mean it transfers heat like equally hot dense air. Its low density changes the thermal environment substantially. A simulation should keep local plasma temperature separate from absorbed solar radiation and any fictional vehicle heat gauge. [S14]

### What users should see and hear

Visible sunlight appears essentially white from space. Strong orange, green, or purple solar images frequently involve filters or assigned colors. [S11] SDO's HMI observations support photospheric intensity and magnetic-field views; AIA observes different ultraviolet and extreme-ultraviolet channels that emphasize different plasma conditions. [S12]

**Rendering suggestions:**

- Make a filtered visible-light presentation and an instrument-color presentation visually distinguishable. Instrument views can be dramatic without pretending their colors are naked-eye reality.
- Let exposure reveal structure. A uniformly overexposed ball hides granules; an unqualified dark orange surface misrepresents the visible-light appearance.
- Animate cells at a meaningful physical scale. Mountain-sized-looking blobs can actually span countries; give the user a way to sense that scale.
- Give sunspots internal structure and evolving boundaries. Avoid rendering them as craters with floors.
- Use loops, prominences, and filaments as interpreted plasma structures. A 2D image alone does not establish their exact 3D depth or topology.
- Preserve the difference between a flare, a prominence, and a coronal mass ejection. They are related phenomena, not interchangeable names for the same particle effect. [S02]
- Use a composed soundscape or data sonification if desired, and identify its nature. Sonification translates measurements into audible sound; it is not automatically a microphone recording of what a traveler would hear. [S15]

### Exploration ideas grounded in the evidence

The user could approach what looks like a small bright cell and discover its enormous size, follow a magnetic feature while changing instrument channels, or watch the contrast between a cooler sunspot and its brighter surroundings. An observation replay could be especially compelling: the user sees a real time-stamped image sequence and then explores a corresponding interpreted scene.

These are design proposals. Free flight near the photosphere should be framed as virtual exploration. Parker Solar Probe's atmospheric exploration does not demonstrate that a crew or ordinary spacecraft can descend to the photosphere. [S14]

### Data and reconstruction limits

SDO supplies image sequences, browse products, and paths to scientific data. Use an explicitly dated sequence for a reliable first implementation. [S13] Preserve the instrument, wavelength, observation time, processing, and color treatment.

A full-disk image is a camera projection, not a ready-made latitude/longitude texture. Do not wrap one around a sphere and claim the hidden hemisphere was observed. Reproject appropriately or use a documented synoptic map; note that a synoptic map combines observations across time. For free exploration, a procedural model informed by observations is often the clearer choice.

There is no terrain DEM for walking on the Sun. A navigable solar interior would be a conceptual visualization of scientific models, not a reconstruction from photographs. Its appeal could come from showing processes and scale rather than inventing tunnels or a crust.

## Mercury: terrain, silence, and strong light

### What is physically there

Mercury has abundant impact craters, smooth plains, bright ejecta rays, and large cliffs. Its overall visible surface is predominantly gray-brown. Caloris is a roughly 1,550 km-wide impact basin. [S04] Fault scarps are associated with crustal contraction; small, apparently young scarps provide evidence for geologically recent tectonic activity. [S17]

Hollows are irregular, often bright depressions. Loss of volatile material is a leading explanation, but their detailed origin remains an active scientific question. They should not be presented as confirmed caves, water-eroded valleys, or alien structures. [S16]

MESSENGER measurements provide strong evidence for water ice in permanently shadowed polar craters. Some deposits can be exposed and others covered by darker material; the geometry and thermal setting matter. This supports an ice discovery in a mapped cold trap, not a white polar ice cap spread over sunlit terrain. [S18]

### Atmosphere, lighting, and motion

Mercury's exosphere is far too sparse to behave like ordinary air. [S05] The following are physical implications for the build:

- An effectively black daytime sky, without an Earth-like blue atmospheric dome or weather clouds.
- No ordinary wind, rain, aerodynamic lift, parachute descent, or sustained airborne dust storm.
- A flying vehicle needs thrust, or it needs to be explicitly a free-camera/fictional exploration device. Propellers and wings cannot provide normal flight here.
- Disturbed dust follows mostly ballistic paths instead of lingering as an atmospheric cloud. Local dust behavior and grain properties remain a reconstruction choice.
- External sound transmission through air is negligible. Vehicle structure, contact vibration, suit audio, narration, and music remain available to sound design. [S15]
- Lower gravity changes jumps, falls, suspension, and traction. It does not make a moving rover instantly easy to stop: inertia remains.

A black sky does not guarantee a dense visible star field while the camera is exposed for bright terrain. Exposure should connect these views. Shadows have strong contrast, with reflected light still possible; pitch-black shadow interiors are an artistic simplification.

The Sun's apparent size and incident flux change along Mercury's eccentric orbit. If precise comparisons matter, calculate them from the chosen date and distance. Do not use a single exaggerated solar disk everywhere. Mercury's unusual rotation/orbit relationship can produce an apparent reversal of the Sun's motion at certain locations and times; that needs the correct geometry, not a generic looping sunset. [S04][S48]

For thermal presentation, distinguish ground temperature, incoming radiation, and the temperature of the explorer. A recently shaded surface should not instantly switch to the coldest nighttime value; thermal history and material properties matter. A simple instrument display can communicate exposure without pretending to solve a detailed heat-transfer model.

### Places with different exploration value

| Candidate environment | Why it is interesting | What can be grounded | What must be interpreted |
|---|---|---|---|
| A small region at the edge of Caloris | Basin-scale history, crater rims, plains, long views | Basin geography and regional imagery [S04][S19] | Traversable paths, small rocks, surface roughness below source resolution |
| A documented hollow-bearing crater | Bright irregular depressions and an unresolved geological story | Orbital images and feature outlines [S16][S22] | Close-up materials, some slopes and cavity details |
| A mapped scarp | A cliff that reveals planetary contraction | Scarp shape where imagery/topography resolves it [S17] | Detailed fractures and collision geometry |
| A north-polar cold trap | Sunlit rims beside permanently shadowed ice-bearing ground | Polar observations and mapped deposits [S18] | Unresolved deposit texture and hidden geometry |

These are alternatives to investigate, not a required route. A carefully chosen small area can communicate more than a huge procedurally repetitive planet.

### Data to start from

USGS documents an MDIS global image mosaic at approximately **166 m per pixel**, a global stereo DEM at approximately **665 m per pixel**, and a separate northern polar MLA elevation product at approximately **500 m per pixel**. [S19] The exact selected product, version, coverage, and coordinate system must accompany an asset.

The PDS/ODE catalogue distinguishes raw images, calibrated images, regional targeted mosaics, low-incidence and high-incidence basemaps, and elevation models. [S22] This distinction matters: images emphasizing shadows can be useful for reading landforms but can produce contradictory illumination when baked into a dynamically lit material.

**Recommended interpretation:** use measured elevation for broad landforms, then add seeded small-scale reconstruction below the dataset's reliable detail. Anchor notable features to actual observations. Avoid placing invented large craters or mountains over mapped ones. Do not label generated pebble positions as recorded Mercury geography.

An upsampled 665 m grid is smoother, not newly measured at one-meter resolution. A colorized elevation image is not elevation data unless its encoding is explicitly documented and decoded.

## Venus: a descent through several different worlds

### What is physically there

Venus has a solid surface, very high pressure and temperature, and a predominantly carbon-dioxide atmosphere. Surface winds are typically much slower than cloud-top winds: the reference fact sheet gives approximately 0.3–1 m/s near the surface. [S07] Cloud-top winds can approach 100 m/s, so the cloud pattern must move independently of the slowly rotating ground. [S23]

The main cloud system occupies roughly 45–70 km altitude, with structure and boundaries that vary. It contains sulfuric-acid aerosols. [S52] Around the middle-cloud region, conditions are far less extreme than at the ground, which has motivated real aerobot development; JPL has tested a balloon prototype for conditions around 55 km. [S33] This does not make the air breathable or the acid clouds harmless.

### Descent and visibility

| Region | Scientific grounding | Suggested visual and movement treatment |
|---|---|---|
| Above the cloud deck | A bright cloud-covered globe; surface normally concealed in visible light. Cloud particles are largely white, with wavelength-dependent markings. [S24] | A luminous pale cloudscape, gradual atmospheric limb, independently moving clouds. Strong ultraviolet patterns belong in an identified instrument view. |
| Within the main clouds, roughly 45–70 km | Aerosols, substantial winds, and changing density/temperature. [S23][S52] | Layered visibility, diffuse illumination, drifting cloud structures, controllable flight or buoyancy if desired. Avoid identical fog density at every altitude. |
| Below the main cloud deck | Leaving the clouds does not remove the dense gaseous atmosphere. Filtered illumination changes the surface's apparent color. [S27] | Gradually reveal terrain through atmospheric scattering. Do not turn the whole lower atmosphere into an opaque orange wall or suddenly switch to clear Earth-like visibility. |
| At the ground | Approximately 464°C and 92 bar, with rocky terrain. [S07] | Protected or virtual exploration, subdued distant contrast, localized terrain detail; ground driving and walking can feel nearly Earth-weighted because gravity is similar. |

For a more quantitative vertical profile, use VIRA/Venus-GRAM rather than interpolating arbitrary numbers between the surface and clouds. NASA's GRAM is an engineering reference model of mean conditions and statistical variation, not a live Venus weather forecast. Availability of its documentation does not mean unrestricted browser redistribution of the software; check the release conditions if using its code. [S31][S32]

Sulfuric-acid droplets evaporate in hotter lower layers. A permanent acid-rain puddle landscape at the surface is not supported by this cycle. [S25] Dense air affects drag and buoyancy, but any precise flight model needs temperature, density, vehicle geometry, and relative wind; pressure alone cannot determine the controls.

### Ground appearance: a critical distinction

Venera 13 provides a real surface panorama with slabby rocks and a strong illumination tint. Its camera projection, calibration, and limited field of view need to be respected. [S26] Research on the imagery found dark, relatively weakly colored surface material once orange incident illumination was accounted for. [S27]

**Art direction implication:** gray or dark rock materials under warm filtered light are a stronger starting point than making every rock intrinsically bright orange. Use the lander images as local evidence, not a universal texture recipe. There is no defensible single exact hex code for Venus's sky or every rock on its surface.

Radar maps are essential for geography, but their brightness is backscatter influenced by surface properties and viewing geometry. It is neither a natural-color photograph nor a direct height value. [S29] Keep a radar overlay distinct from the visible-light scene.

### Volcanism and other uncertainties

Research published in 2023 identified a vent change near Maat Mons in images acquired in **1991**. Research published in 2024 identified changes interpreted as new lava flows near Sif Mons and Niobe Planitia between **1990 and 1992**. [S28][S29] These are strong reasons to include volcanic landscapes and an evidence-based historical reconstruction. They are not observations of an eruption happening today.

An animated eruption can be a clearly identified reconstruction or imagined scenario. A planet-wide glowing lava ocean would misrepresent the mapped rocky surface. The presence and frequency of Venusian lightning remain uncertain; plasma waves alone are not conclusive evidence, and research has identified non-lightning explanations for particular observations. [S30] Frequent thunderstorm effects should therefore be treated as speculation, not routine confirmed weather.

Claims about present life, specific ancient oceans, and the identity of the ultraviolet absorber should retain their uncertainty. No convincing evidence establishes life in Venus's clouds. [S06]

### Candidate places and assets

| Candidate | Build opportunity | Evidence limit |
|---|---|---|
| Venera 13 neighborhood | A grounded first impression of a rocky surface; comparison with a historical panorama | The panorama's observed area is small. Landscape outside it needs reconstruction. [S26] |
| Maat Mons region | A broad volcanic landscape and the story of detecting change from orbit | Exact eruption appearance and current activity are not directly observed. [S28] |
| Alpha Regio's tessera highlands | Strong terrain contrast with plains; complex ridges and deformation | Local material and detailed relief require more investigation; avoid importing Earth mountain imagery as fact. [S53] |
| An atmospheric region near 55 km | Wind, cloud exploration, and balloon-inspired movement | A simulated weather field, not a recorded complete 3D cloud volume. [S33] |

For maps, Magellan SAR mosaics are available at **75 m pixel spacing**, while the cited global topography grid has approximately **4,641 m spacing**. [S34][S35] The underlying radar altimeter's footprint can be much coarser than that grid; a USGS mapping study describes roughly 10 × 25 km horizontal resolution. Selected stereo data can improve regional topography. [S36]

Consequently, a 75 m radar mosaic must not be interpreted as a 75 m measured terrain mesh. Preserve radar look direction and coverage masks. Use broad measured relief, investigate regional stereo products for important locations, and identify added local geometry as reconstruction.

**A promising regional lead:** work described in October 2024 combined reanalyzed Magellan measurements, Arecibo radar observations, and machine-vision methods to improve Alpha Regio mapping at sub-kilometer scales. Some added information is model-based gap filling. [S53] Investigate the underlying product and its uncertainty before adopting it; the announcement's illustration is not itself a downloadable elevation dataset. Planned future descent-camera resolution must not be mistaken for imagery already acquired.

## Earth: the richest data, with a different scaling problem

### What should distinguish the experience

Earth provides liquid surface water, weather, life, varied landscapes, and a recognizable atmosphere. [S08] It can act as the player's intuitive reference for gravity, air resistance, color, sound, and scale.

The most convincing next step would be a real geographic region whose large-scale terrain remains aligned as the user descends. A coastline with nearby mountains, a volcanic island, or an alpine valley could provide varied exploration without requiring an entire photorealistic Earth at once. These are scope suggestions, not mandatory locations.

### Atmosphere, flight, and weather

The troposphere averages roughly 12 km in height, with substantial geographic variation; most weather and ordinary clouds occur there. The stratosphere extends to approximately 50 km. Above it are the mesosphere, thermosphere, and exosphere, with varying boundaries rather than rigid shells. [S37]

**Implementation implications:**

- Blend the blue sky and atmospheric limb continuously with altitude and viewing angle.
- Associate weather clouds with a chosen weather profile. A thin global cloud texture works from orbit but needs a different representation when users fly through it.
- Let density affect ordinary aircraft lift and drag. A plane should not keep the same aerodynamic response all the way into space.
- Distinguish geometric altitude above the reference Earth model, elevation relative to a vertical datum, and clearance above local ground.
- Keep flight controls pleasant even if the underlying air model is simplified. The simplification belongs in the model description.
- If time or season is adjustable, update lighting and any linked terrain appearance coherently. An old monthly imagery composite is not live snow cover.

NASA Glenn provides a useful simplified altitude-based atmosphere model. Its equations describe a reference atmosphere, not local weather and not a complete model extending indefinitely into space. [S38] A full scientific atmosphere model is optional; a well-described approximation is sufficient for exploratory gameplay.

### Terrain, materials, vegetation, and water

Blue Marble Next Generation provides monthly global imagery at approximately **500 m per pixel**, based on observations from **2004**. It is well suited to a distant globe and seasonal visual reference, not current street-level appearance. [S39]

SRTM 1 Arc-Second Global provides elevation samples at **1 arc-second**, approximately 30 m north–south, covering land approximately **60°N to 56°S**. [S40] Copernicus GLO-30 provides global land coverage at roughly 30 m sampling, but it is a **digital surface model**: vegetation and structures can contribute to the represented surface. It is not uniformly bare ground. [S41]

ESA WorldCover offers 10 m land-cover classes that can guide forest, grass, bare-ground, built-up, and water placement. Its 2021 product has a reported global overall accuracy of 76.7%; a class label does not establish an individual tree's species, height, or position. [S43]

NOAA ETOPO 2022 combines land topography and seafloor relief at **15 arc-second** spacing. It is a useful broad underwater foundation, not a detailed survey of every reef or seabed rock. [S44]

**Build suggestions:**

- Derive broad ground shape from elevation, broad appearance from imagery, and ecological zones from land cover; keep their roles distinct.
- Add vegetation and small surface detail procedurally or with curated assets, marked as representative where exact surveyed data is absent.
- A DSM used as walkable terrain may place the player on a canopy-shaped mound. Prefer suitable local terrain data or explicitly reconstruct the ground in selected areas.
- Flatten or constrain water surfaces independently of the terrain grid. Reconcile coastline masks and elevation datums to avoid water climbing hills or exposing seams.
- Use city geometry only when an appropriate source and license are available. Imagery alone cannot supply building interiors or reliable building heights.
- Weather audio, wildlife, vegetation, and water can make Earth feel alive, but specific species and habitats should match a chosen place if presented as factual.

### Services and practical access

GIBS provides tiled visualization layers through services including WMTS and WMS. These are useful for imagery, overlays, and time-specific observations; they do not automatically provide terrain meshes, collision data, or a 3D weather volume. [S45]

Keep dataset licensing separate from service access. Copernicus's July 2026 notice introduced registration/access requirements for its 30 m view service, while its dataset page still describes freely licensed GLO-30/GLO-90 data. Build against a verified access route rather than assuming every public-looking preview URL is an unrestricted runtime endpoint. [S41][S42]

## Shared principles for moving from orbit to exploration

The following are engineering recommendations derived from the research, not requirements imposed by the cited institutions.

### Preserve a place as the user approaches it

Represent locations in a body-specific coordinate system and derive both the orbital view and local scene from that location. A convincing descent should arrive at the same crater, coastline, or mountain the user selected above.

Use a local coordinate frame near the player for detailed rendering and physics. Huge solar-system coordinates and centimeter-scale collision are an awkward combination for ordinary graphics precision. A floating origin, nested coordinate frames, or carefully managed scene transitions can solve this without forcing one particular engine.

Define local up from the planet's geometry rather than assuming a single global vertical axis. Keep the body-fixed frame separate from orbital positioning. For Earth, distinguish an ellipsoid's geodetic normal from the radial direction if geographic accuracy is important.

There is a real coordinate trap in the source material: the USGS target-coordinate table lists Mercury in planetographic west-positive coordinates and Venus in planetocentric east-positive coordinates. Individual map products may use other conventions. Convert from each actual product's metadata, not from a generic assumption about the planet. [S46]

For named features, use the IAU/USGS Gazetteer and retain the feature identifier. Read the stated coordinate system and the record's current coordinates. A feature center is not necessarily a suitable landing site or the location of its most interesting visible structure. [S47]

### Separate planet scale from exploration scale

Stylized distances and planet sizes can remain useful in the overview. For local exploration, use a coherent local scale with explicit conversions. Otherwise a small overview sphere can produce absurdly close horizons, enormous boulders, or gravity that changes accidentally with art direction.

A few simple equations provide useful consistency checks:

| Relationship | Approximation | Appropriate use |
|---|---|---|
| Gravity above a spherical body | `g(h) = g0 * (R / (R + h))²` | A first approximation outside the body; ignores local gravity anomalies and rotational effects. Do not extend it through an interior. |
| Ballistic jump height | `height = upwardSpeed² / (2*g)` | Near-surface, constant gravity, no drag. Useful for comparing Mercury with Earth. |
| Aerodynamic drag magnitude | `drag = 0.5 * density * relativeAirSpeed² * Cd * area` | A simplified model; coefficients and orientation matter. Use velocity relative to the air, not just relative to the ground. |
| Geometric horizon distance | `distance = sqrt(2*R*h + h²)` | Ideal smooth sphere, observer height `h`, no refraction or terrain obstruction. |

These are analytical approximations, not a vehicle engineering validation. For example, **the same upward launch speed** produces a jump about **2.65 times higher on Mercury** than under standard Earth gravity, calculated from 9.80665/3.70. That does not mean a human automatically jumps exactly that much higher: suit mass, effort, posture, and controls also matter.

Use altitude-dependent air properties on Venus and Earth. Mercury's atmospheric drag can be zero in the first gameplay model, explicitly as an approximation. Solar flight needs an intentionally simplified observer model; it cannot be made physically realistic by assigning the Sun a normal airplane atmosphere.

### Let time and light remain coherent

Keep movement/physics time, astronomical time, and event-replay time distinguishable. Accelerating a planet's rotation should not automatically accelerate a rover's suspension or character movement.

For accurately dated sky positions, JPL Horizons documents ephemerides and observer geometry. It can support precomputed or cached states; it need not be called on every animation frame. State the epoch, time scale, reference frame, and whether a view uses geometric or apparent positions. [S48]

For a fictional exploration scene, a fixed local time is fine. The app should not claim precise current conditions without calculating and sourcing them. On Mercury and Venus, a fast dramatic sunset is a time-compressed presentation, not ordinary real-time behavior.

Use environment-specific exposure and scattering. Atmospheric effects should depend on the path through air and aerosols, not just a decorative blue or orange shell. Atmospheric entry heating depends on speed and conditions; slowly flying down through a cloud layer should not trigger an automatic fireball merely because the user crossed an altitude boundary.

### Build detail where it matters

Use several scales of representation: a distant globe, regional elevation, and local terrain/materials. Stream or load detail near the camera and retire what is no longer needed. The OGC 3D Tiles standard is one documented approach to organizing and streaming large geospatial 3D datasets; it is an option, not a required migration for the existing prototype. [S51]

Make rendering and collision refer to the same terrain surface. A pretty displaced mesh with a flat collision plane immediately breaks walking and landing. Handle terrain detail changes without dropping a player through the surface or raising the ground underneath a stationary vehicle.

Keep source-derived landforms stable across visits. Seed reconstructed detail so returning to a place feels like returning to the same world. Keep measured terrain and generated additions separate enough that better observations can replace the reconstruction later.

For Earth and Venus, volumetric clouds can be expensive; different representations at orbital, aerial, and local distances are reasonable. Choose quality levels by profiling the actual project on the intended devices. No particular frame rate or hardware capability has been benchmarked for this report.

## A practical asset and evidence pipeline

### Start with a small, traceable sample from each needed source

| Need | First source to inspect | What to request or extract | Main limitation |
|---|---|---|---|
| Solar structure and motion reference | SDO channels and data access [S12][S13] | Dated HMI/AIA sequences or documented mapped products | Image projection, wavelength, false color, and different acquisition times |
| Mercury regional terrain | USGS global DEM and MDIS basemaps [S20][S21] | Elevation subset plus co-registered imagery | Global products are not foot-level surveys |
| Mercury local evidence | PDS/ODE [S22] | Targeted images/mosaics, labels, viewing geometry | Resolution and coverage vary; imagery alone is not 3D geometry |
| Venus landforms | Magellan SAR plus global topography [S34][S35] | Regional radar subset, separate elevation subset, masks | Radar pixel spacing is not elevation resolving power |
| Venus surface materials | Venera panorama and color research [S26][S27] | Referenced local visual study | Small observed area; color calibration and reuse rights need attention |
| Venus atmosphere | VIRA/Venus-GRAM documentation [S31][S32] | A documented reference profile appropriate to the simulated scenario | A statistical model, not current weather |
| Earth orbital base | Blue Marble [S39] | A selected monthly composite and its metadata | Historical composite, coarse for surface work |
| Earth ground shape | SRTM or Copernicus DEM [S40][S41] | Selected geographic tiles and masks | Coverage limits, canopy/buildings, vertical datum, and void filling |
| Earth ecological placement | WorldCover [S43] | Class raster and quality data | Classification uncertainty; no individual organism geometry |
| Earth seafloor | ETOPO [S44] | Local bathymetric subset and source information | Variable underlying data quality and coarse global sampling |
| Planetary map inspection | NASA Treks [S49] | Relevant layers, profiles, and documented WMTS services | A tile visualization may not expose numeric elevation |

Suggested processing sequence:

1. Choose a promising location and record its scientific identity, coordinates, and coordinate convention.
2. Read the dataset label or product handbook before interpreting numbers. Confirm whether values represent elevation, radius, reflectance, radar backscatter, or a display color.
3. Download a manageable subset with its metadata and quality/coverage masks. Preserve an unchanged copy of the source and record its version or checksum.
4. Align imagery, elevation, and named features in a common body-specific frame. Resolve units, datums, longitude direction, and no-data values explicitly.
5. Produce renderable levels of detail and collision geometry. Use data-preserving processing for scientific elevation; do not apply color-space conversion to height values.
6. Add reconstructed detail as a separate layer. Document which ranges of scale and which locations are supported by observations.
7. Verify recognizable landmarks and sampling behavior before expanding coverage.

Do not treat an image download link as a production asset service. Confirm formats, credentials if required, browser access/CORS, usage conditions, caching, and failure behavior during implementation. A packaged low-resolution fallback can keep the experience usable when an upstream service is unavailable.

### Preserve provenance without overwhelming the player

Every important asset or finding should have a small record along these lines. This is an example structure, not a prescribed application schema:

```json
{
  "body": "mercury",
  "placeName": "chosen mapped region",
  "position": {
    "latitudeDegrees": null,
    "longitudeDegrees": null,
    "latitudeConvention": "read from source",
    "longitudeConvention": "read from source",
    "referenceFrame": "read from source"
  },
  "evidence": {
    "classification": "observation-based reconstruction",
    "sourceIds": ["S20", "S22"],
    "productIdentifier": null,
    "productVersion": null,
    "observationDate": null,
    "gridSpacingMeters": null,
    "effectiveResolutionMeters": null,
    "verticalDatum": null,
    "knownGaps": [],
    "reconstructedElements": ["unresolved local rocks and ground texture"]
  },
  "presentation": {
    "verticalExaggeration": 1,
    "timeMultiplier": 1,
    "colorTreatment": "document when selected"
  },
  "credit": null,
  "licenseOrUsageTermsUrl": null
}
```

Nulls are intentionally unresolved. They should not become guessed metadata. Keep grid spacing, effective resolution, and accuracy separate: a finely sampled raster may still contain much coarser measurements.

For the player, a quiet information affordance can reveal a short explanation such as “Mapped from spacecraft observations; nearby rock detail reconstructed.” Detailed source records can live behind that. The main experience can remain exploratory.

### Reuse and attribution

Scientific credibility and permission to reuse an asset are separate checks. NASA's media guidance covers credit, protected branding, third-party material, and AI-generated products. Retain asset-specific credits and do not present this project or generated imagery as agency-approved. [S50]

The Venera panorama reference explicitly credits contributors outside NASA. Its presence on a scientific website does not make it automatically NASA-owned or public domain. [S26] Copernicus DEM has its own required source notices, including wording for modified products; WorldCover uses CC BY 4.0 with attribution requirements. [S41][S43] Preserve the applicable exact notice in the asset manifest and credits when importing an asset.

This report is an independent synthesis. The agencies and research institutions linked here supplied source material; they have not reviewed or endorsed the report or the proposed application.

## Turn scientific differences into enjoyable discoveries

These are opportunities for creative interpretation, not a compulsory set of interactions:

- **Scale revealed through movement:** a solar granule or impact basin grows from a visible pattern into something too large to cross quickly. Help the user perceive scale through travel, comparisons, or time compression.
- **A change in medium:** Mercury offers direct thrust and ballistic motion; Venus introduces cloud drift and dense air; Earth supplies familiar flight. Let those differences emerge through the controls.
- **A reason to look closer:** a bright patch on Mercury resolves into hollows; a shadowed region carries evidence of ice; a Venus radar patch reveals the limits of ordinary vision.
- **Evidence as a discovery:** allow a panorama, map, or dated observation to appear in context beside the interpreted scene. The user can see how scientists know what they know.
- **Contrasting environments:** a sunlit Mercury rim and cold trap, Venus's clouds and ground, Earth's ocean and mountains can communicate physical differences through atmosphere and movement.
- **Questions that stay open:** uncertainty about a hollow's formation or Venus's ultraviolet absorber can be a compelling destination. Avoid inventing a definitive answer to make a collectible feel complete.

Keep survival systems optional. Heat, pressure, and radiation can enrich instrument readings and vehicle design without turning a curiosity-led journey into repeated failure screens. Accessibility options such as reduced motion, adjustable flight sensitivity, and an easy return to orbit can support the same exploratory goal.

## Checks that matter before the next review

These are suggested acceptance checks for the coding model, not tests performed during this research.

| Area | Useful check |
|---|---|
| Continuity | Selecting a landmark from orbit and descending reaches the same place; ascent restores the correct planetary context. |
| Coordinates | An asymmetric known landmark appears in the correct hemisphere and longitude; test across the longitude seam and near a pole. |
| Ground interaction | The visible terrain matches collision; landing, walking, and driving survive changes in terrain detail. |
| Mercury environment | No ordinary atmospheric flight or weather; gravity and solar-day behavior use the right values. |
| Venus environment | Clouds and ground rotate independently; low-altitude winds differ from cloud-top winds; radar is not used as optical color or raw height. |
| Solar environment | No solid landing surface; instrument colors and speculative 3D geometry are identifiable. |
| Earth environment | Terrain, water, vegetation, and altitude use compatible datums and scales; historical imagery is not labeled live. |
| Scientific claims | A player-facing factual claim has a source; an animation of a historical or hypothetical event is identified appropriately. |
| Resilience | Missing tiles, slow loading, and absent credentials produce a usable fallback rather than an empty world. |
| Experience | The user can explore, change direction, recover from getting stuck, and return to orbit without reading a manual. |

The next review should answer whether entering these worlds feels connected and enjoyable, and whether each destination has a distinct identity. It does not require completing every suggested location, downloading whole global archives, or solving full planetary physics first.

## Research limits and source register

Sources prioritize mission teams, scientific agencies, archive maintainers, research institutions, and original research. Older sources remain useful where they describe the actual observations available, especially Venera and Magellan; their publication date is not the observation date. Current service access and product documentation were checked separately.

Some USGS Astropedia product pages returned access errors to the research browser. Their indexed catalogue records were cross-checked against accessible USGS mapping descriptions and PDS documentation where possible. The product links below are useful starting points, but their downloadable raster headers, full data integrity, and runtime accessibility have **not** been tested. The Venus-GRAM report landing page also failed to open directly; its indexed NASA catalogue description and the accessible GRAM software catalogue were used. The recommendations do not depend on an unverified numerical profile from that report.

No claim is made that the global products listed are the highest resolution available for every location. Regional products should be checked once the implementation selects specific sites. Unobserved meter-scale terrain, exact sky colors, present Venus weather, and complete 3D solar magnetic geometry cannot be supplied as established observations.

### Core physical references

- [S01] **JPL Solar System Dynamics — Planetary Physical Parameters.** Specialist table for planetary radii, gravity, and sidereal rotation; includes underlying references.
- [S02] **NASA Science — Sun Facts.** Solar structure, atmospheric regions, differential rotation, and major phenomena.
- [S03] **NASA NSSDCA — Sun Fact Sheet.** Quantitative solar reference parameters; central values are model values.
- [S04] **NASA Science — Mercury Facts.** Surface appearance, terrain, thermal extremes, and unusual solar motion. Use S05 for axial tilt as explained above.
- [S05] **NASA NSSDCA — Mercury Fact Sheet.** Rotation, solar day, obliquity, orbital distances, and exospheric conditions; page updated January 2024.
- [S06] **NASA Science — Venus Facts.** General environment, surface context, and the distinction between cloud-life speculation and evidence.
- [S07] **NASA NSSDCA — Venus Fact Sheet.** Surface pressure, density, temperature, composition, winds, and day length; page updated January 2024.
- [S08] **NASA Science — Earth Facts.** Planetary setting, water, atmosphere, and structure.
- [S09] **NASA NSSDCA — Earth Fact Sheet.** Rotation, atmospheric composition, reference conditions, and standard gravity; page updated November 2024. Its average/reference atmosphere values are not current weather or a current global climate measurement.

### Solar observations and interpretation

- [S10] **NASA Marshall Solar Physics — Photospheric Features.** Sunspots, faculae, granules, their scales, and evolution.
- [S11] **Stanford Solar Center — What Color Is the Sun?** Visible-light color and the distinction from assigned-color solar imagery.
- [S12] **SDO mission — HMI and AIA Channels.** Instrument observables, spectral channels, and the physical regions they emphasize.
- [S13] **SDO mission — Ways to Access Data.** Browse imagery and scientific-data access routes; inspect each selected product's processing and projection.
- [S14] **NASA — Traveling to the Sun: Why Won't Parker Solar Probe Melt?** Published July 2018; supports thermal reasoning and the difference between dilute hot plasma and heat loading, not a current mission schedule.
- [S15] **NASA Science — Data Sonifications.** Distinguishes translated data, physical sound waves, and the lack of ordinary acoustic propagation in a vacuum.

### Mercury terrain and mapping

- [S16] **NASA Science — Mercury's Strange Hollows.** Published October 2023; observations and competing formation explanations. Its old mission-arrival forecast is not used here.
- [S17] **NASA — The Incredible Shrinking Mercury Is Active After All.** Published September 2016; fault scarps and evidence for recent contraction.
- [S18] **NASA/JPL — New Mercury Water Ice Evidence.** Published November 2012; multiple measurements support polar ice, including exposed and buried deposits.
- [S19] **USGS — Mercury Map Re-printed Due to High Demand!** Accessible documentation of the 166 m image mosaic, 665 m global DEM, and 500 m polar elevation source.
- [S20] **USGS Astropedia — Mercury MESSENGER Global DEM 665m.** Elevation product catalogue. Indexed record reviewed; direct page access blocked during this research; raster not downloaded.
- [S21] **USGS Astropedia — Mercury MESSENGER MDIS Basemap LOI Global Mosaic 166m.** Low-incidence image product catalogue. Indexed record reviewed; direct page access blocked; use PDS metadata to confirm the chosen release.
- [S22] **PDS Geosciences/ODE — MESSENGER Mercury Dual Imaging System.** Authoritative product taxonomy, archive identifiers, and links to product specifications.

### Venus environment, terrain, and uncertainties

- [S23] **ESA Venus Express — Greenhouse Effect, Clouds and Winds.** Cloud-top superrotation and slower near-surface winds. Use for physical context, not a present-day weather report.
- [S24] **NASA/JPL Photojournal — Venus from Mariner 10, PIA23791.** Image processing, visible cloud appearance, and wind/cloud context.
- [S25] **NASA Glenn — Cook, Crush, Choke: Testing Components Before Launching to Venus.** Published May 2012; supports acid-droplet evaporation and environmental testing. The article's generalized historical/engineering remarks are not adopted as quantitative simulation specifications.
- [S26] **Lunar and Planetary Institute — Surface View from Venera 13.** Panorama, viewing geometry, calibration caveats, materials, and third-party image credit.
- [S27] **Pieters and colleagues — The Color of the Surface of Venus, Science, 1986; NASA NTRS record.** Original research abstract on separating surface reflectance from orange incident illumination; full paper not retrieved.
- [S28] **NASA/JPL — Magellan Data Reveals Volcanic Activity on Venus.** Published March 2023; changed vent geometry near Maat Mons in 1991 observations, with a link to the original study.
- [S29] **NASA/JPL — Ongoing Venus Volcanic Activity Discovered With Magellan Data.** Published May 2024; Sif Mons and Niobe Planitia changes between 1990 and 1992, radar interpretation, and link to the original study.
- [S30] **George and colleagues — Non-Lightning-Generated Whistler Waves in Near-Venus Space, Geophysical Research Letters, 2023.** Original research abstract and plain-language summary; DOI 10.1029/2023GL105426. Supports uncertainty in inferring lightning from whistler waves.
- [S31] **NASA NTRS — Venus Global Reference Atmospheric Model: User Guide, 2021.** Reference-model documentation lead; indexed catalogue checked, direct page unavailable during this research. No numerical vertical profile was extracted.
- [S32] **NASA Software Catalog — Global Reference Atmospheric Model Suite.** Describes modeled outputs, statistical variation, supported planets, and software distribution route.
- [S33] **NASA/JPL — Venus Aerial Robotic Balloon Prototype Aces Test Flights.** Published October 2022; balloon concept and approximately 55 km target environment. Earth test flights, not a balloon currently operating on Venus.
- [S34] **USGS Astropedia — Venus Magellan SAR FMAP Left Look Global Mosaic 75m.** Radar mosaic catalogue; indexed metadata checked, direct page blocked. Pixel spacing does not imply equal spatial resolving power or complete coverage.
- [S35] **USGS Astropedia — Venus Magellan Global Topography 4641m.** Indexed product metadata, including its elevation-to-radius conversion. Direct catalogue access blocked; inspect raster metadata before implementation.
- [S36] **Howington-Kraus and colleagues/USGS — Validation of the USGS Sensor Model for Topographic Mapping of Venus Using Magellan Radar Stereoimagery, 2001.** Accessible research summary describing altimetry footprint and regional stereo possibilities.
- [S52] **Horinouchi and colleagues — Equatorial Jet in the Lower to Middle Cloud Layer of Venus Revealed by Akatsuki, 2017.** Original research preprint, arXiv:1709.02216; atmospheric layer context and measured variable winds. A research preprint is identified as such rather than treated as an agency parameter standard.
- [S53] **NASA Goddard — Old Data Yields New Secrets as DAVINCI Preps for Venus Trip.** Published October 2024; Alpha Regio mapping from archival data, model-based gap filling, and the distinction between current mapping and future descent imagery.

### Earth datasets and atmosphere

- [S37] **NASA Science — Earth's Atmosphere: A Multi-layered Cake.** Published October 2019; atmospheric layers, approximate boundaries, and weather distribution.
- [S38] **NASA Glenn — Earth Atmosphere Equation, Metric.** Simplified reference atmosphere and units. Do not extrapolate its curve fits into a full upper-atmosphere or weather model.
- [S39] **NASA Earth Observatory — Blue Marble: Next Generation.** Monthly 2004 composites, 500 m sampling, limitations, downloads, and credit.
- [S40] **USGS EROS — SRTM 1 Arc-Second Global.** Geographic coverage, sampling, processing, formats, and access routes. Select this product explicitly rather than an older 3 arc-second collection.
- [S41] **Copernicus Data Space — Copernicus DEM.** DSM definition, GLO-30/GLO-90 coverage, source history, quality layers, access, and attribution notices.
- [S42] **Copernicus Data Space — DEM 30m View Service: License Acceptance.** Notice dated 17 July 2026, effective 28 July 2026; service registration/access requirements.
- [S43] **ESA WorldCover — Data Access.** Land-cover products, validation, raw class rasters versus display services, CC BY 4.0, and attribution.
- [S44] **NOAA NCEI — ETOPO Global Relief Model.** ETOPO 2022 land/seafloor coverage, grid products, source information, and citation.
- [S45] **NASA GIBS — Access Basics.** Official API documentation for visualization services, projections, and tile requests.

### Coordinates, delivery, and reuse

- [S46] **USGS/IAU Gazetteer — Target Coordinate Systems.** Shows why body-specific latitude and longitude conventions must be checked.
- [S47] **USGS — Gazetteer of Planetary Nomenclature.** Authority and entry point for official feature names and records.
- [S48] **JPL — Horizons System Manual.** Ephemerides, observer geometry, reference frames, and time conventions.
- [S49] **NASA Solar System Treks.** Map inspection, elevation profiles, and documented availability of many layers through WMTS.
- [S50] **NASA — Images and Media Usage Guidelines.** Asset credit, branding, third-party rights, and AI-use guidance; check the individual asset as well.
- [S51] **Open Geospatial Consortium — 3D Tiles Standard.** Official documentation of a hierarchical format for streaming and rendering geospatial 3D content.

[S01]: https://ssd.jpl.nasa.gov/planets/phys_par.html
[S02]: https://science.nasa.gov/sun/facts/
[S03]: https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
[S04]: https://science.nasa.gov/mercury/facts/
[S05]: https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html
[S06]: https://science.nasa.gov/venus/venus-facts/
[S07]: https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html
[S08]: https://science.nasa.gov/earth/facts/
[S09]: https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
[S10]: https://solarscience.msfc.nasa.gov/feature1.shtml
[S11]: https://solar-center.stanford.edu/SID/activities/GreenSun.html
[S12]: https://sdo.gsfc.nasa.gov/data/channels.php
[S13]: https://sdo.gsfc.nasa.gov/data/dataaccess.php
[S14]: https://www.nasa.gov/solar-system/traveling-to-the-sun-why-wont-parker-solar-probe-melt/
[S15]: https://science.nasa.gov/science-research/astrophysics/data-sonifications/
[S16]: https://science.nasa.gov/solar-system/planets/mercury/mercurys-strange-hollows/
[S17]: https://www.nasa.gov/missions/the-incredible-shrinking-mercury-is-active-after-all/
[S18]: https://www.jpl.nasa.gov/news/nasa-spacecraft-finds-new-mercury-water-ice-evidence/
[S19]: https://www.usgs.gov/news/mercury-map-re-printed-due-high-demand
[S20]: https://astrogeology.usgs.gov/search/map/mercury_messenger_global_dem_665m
[S21]: https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_basemap_loi_global_mosaic_166m
[S22]: https://ode.rsl.wustl.edu/mercury2/pagehelp/Content/Missions_Instruments/MESSENGER/MDIS/Intro.htm
[S23]: https://www.esa.int/Science_Exploration/Space_Science/Venus_Express/Greenhouse_effect_clouds_and_winds
[S24]: https://science.nasa.gov/photojournal/venus-from-mariner-10/
[S25]: https://www.nasa.gov/centers-and-facilities/glenn/cook-crush-choke-testing-components-before-launching-to-venus/
[S26]: https://www.lpi.usra.edu/publications/slidesets/venus/slide_3.shtml
[S27]: https://ntrs.nasa.gov/citations/19870039592
[S28]: https://www.nasa.gov/missions/veritas/nasas-magellan-data-reveals-volcanic-activity-on-venus/
[S29]: https://www.nasa.gov/science-research/planetary-science/ongoing-venus-volcanic-activity-discovered-with-nasas-magellan-data/
[S30]: https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/2023GL105426
[S31]: https://ntrs.nasa.gov/citations/20210022168
[S32]: https://software.nasa.gov/software/MFS-33888-1
[S33]: https://www.jpl.nasa.gov/news/jpls-venus-aerial-robotic-balloon-prototype-aces-test-flights/
[S34]: https://astrogeology.usgs.gov/search/map/venus_magellan_sar_fmap_left_look_global_mosaic_75m
[S35]: https://astrogeology.usgs.gov/search/map/Venus/Magellan/RadarProperties/Venus_Magellan_Topography_Global_4641m_v02.cub.xml
[S36]: https://www.usgs.gov/publications/validation-usgs-sensor-model-topographic-mapping-venus-using-magellan-radar
[S37]: https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/
[S38]: https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/earth-atmosphere-equation-metric/
[S39]: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/
[S40]: https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm-1/
[S41]: https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
[S42]: https://dataspace.copernicus.eu/news/2026-7-17-copernicus-dem-30m-view-service-license-acceptance
[S43]: https://esa-worldcover.org/en/data-access
[S44]: https://www.ncei.noaa.gov/products/etopo-global-relief-model
[S45]: https://nasa-gibs.github.io/gibs-api-docs/access-basics/
[S46]: https://planetarynames.wr.usgs.gov/TargetCoordinates
[S47]: https://www.usgs.gov/tools/gazetteer-planetary-nomenclature
[S48]: https://ssd.jpl.nasa.gov/horizons/manual.html
[S49]: https://trek.nasa.gov/
[S50]: https://www.nasa.gov/nasa-brand-center/images-and-media/
[S51]: https://www.ogc.org/standards/3dtiles/
[S52]: https://arxiv.org/abs/1709.02216
[S53]: https://science.nasa.gov/centers-and-facilities/goddard/nasas-davinci-mission-uses-old-data-to-reveal-new-secrets-venus/

