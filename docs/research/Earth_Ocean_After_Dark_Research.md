# Earth: explorable oceans and After Dark

Research and implementation reference for the next planetary-explorer build  
Sources reviewed: 18 October 2026

## Project context

Earth already has an explorable environment. The next improvement should make its sea feel convincing, let users enter the water and explore beneath it, and introduce fish and jellyfish. Selecting **After Dark** before **Enter this world** should lead into a coherent nighttime Earth, including the sky, land, ocean surface, and underwater environment.

**For Astra:** Read the existing project and use this report as grounding for the next build. Adapt the techniques to the current renderer, controls, scale, and visual style. The suggestions are possibilities, not a prescribed itinerary or a requirement to implement every effect. Preserve the project's sense of freedom and discovery, and make a version the owner can explore and refine.

This report separates **scientific findings**, **rendering approximations**, and **design suggestions**. It covers the evidence needed for this addition, rather than attempting an encyclopedia of oceanography. No project code was inspected, no assets were integrated, and no performance measurements were taken. Links point to scientific institutions, original graphics research, textbooks, and official software documentation.

## The most useful findings for this build

- **Water is an environment as well as a surface.** A convincing sea needs compatible surface motion, reflected surroundings, underwater visibility, and lighting across the waterline.
- **There is no single correct ocean-blue color.** Water absorbs and scatters light; suspended material changes its appearance. The sky, seafloor, viewing direction, and water depth also influence the rendered result. [S01] [S06] [S08]
- **Diving should reveal a changing visual space.** Nearby objects can remain clear while distant objects lose color and contrast. A uniform blue overlay cannot represent that difference. [S07] [S08]
- **Jellyfish can make After Dark special, but their lighting needs a reason.** Bioluminescence, fluorescence, and the rainbow shimmer of comb jellies are different phenomena. [S11] [S12] [S13]
- **A moonlit ocean and a spectacular star field involve a tradeoff.** Bright moonlight makes the landscape easier to see while reducing the visibility of faint celestial features. [S23] [S24]

**Design recommendation:** Aim for a connected place that rewards lingering: approach the shore, notice the moving reflections, slip underwater, follow a school, look back toward the surface, then resurface beneath the sky. These moments can communicate the science without requiring lessons or objectives.

## What should change between the four views

The following is a proposed visual direction, informed by the research below.

| View | Strongest visual cues | What makes it feel connected |
|---|---|---|
| Day, above water | Moving highlights, sky reflections, readable shallows, waves and occasional foam | Water reflects the actual daytime sky and nearby terrain |
| Day, underwater | Distance-dependent color loss, overhead illumination, moving surface, selective caustics | Sun direction and surface waves agree with the view above |
| Night, above water | Darker water, silhouettes, stars, a Moon when appropriate, broken reflected highlights | The selected sky also drives water and land lighting |
| Night, underwater | Much weaker ambient light; nearby detail revealed by appropriate light sources; localized luminous animals where justified | Surface light, underwater visibility, creature emission, and exposure belong to the same night |

## Ocean appearance above the surface

### Color, transparency, and reflections

**Scientific findings.** Water preferentially absorbs red light relative to much of the blue part of the visible spectrum. Sediments and other suspended material can make natural waters look green, brown, or other colors. Consequently, a clear shallow bay and a productive coastal sea need different appearances. The ocean is not blue solely because it reflects a blue sky. [S01]

At the air–water boundary, the balance of reflection and transmission changes with viewing angle. Looking toward the horizon gives much stronger surface reflection than looking nearly straight down. Refraction changes the apparent position of objects seen through the surface. [S04] [S06]

**Rendering suggestions:**

- Give the water a view-dependent reflection response, often called Fresnel reflection. Avoid uniformly opaque paint or uniformly transparent glass.
- Let shallow areas reveal the bottom through a shorter water path. A pale sandy bottom can contribute a bright turquoise appearance; deeper regions should lose that bottom contribution.
- Reflect the current sky. A static bright-blue environment map will undermine After Dark even if the background turns black.
- Match highlight direction to the Sun or Moon. Reflections should move with the camera and changing wave normals.
- Keep deep water from revealing distant terrain merely because the material has a low opacity value.
- Give rocks and shoreline geometry a visible relationship to the water: wet edges, partial submersion, contact shadows where appropriate, and a continuous coast.

As a rough graphics baseline, water's refractive index can be approximated by **1.333**. Using that value and an air index of 1, normal-incidence reflectance is approximately **2%**, calculated as `((1.333 - 1) / (1.333 + 1))²`. This is an ideal smooth-interface reference, not a measured reflectance for every ocean scene or a fixed opacity setting. [S04] [S06]

### Waves should have several scales

**Scientific findings.** Local wind waves depend on wind strength, duration, and fetch—the distance over which wind acts. Swell can arrive from distant weather systems. As waves encounter shallow seabed and coastlines, their shapes and directions change and they can break. [S03]

**Design interpretation:** Separate the slower motion that gives the sea its shape from smaller ripples that break up reflections. Repeating one large sine wave across the entire surface tends to resemble a moving sheet. Every wave crest need not have white foam, and every coastline need not have an unbroken white border.

**Practical rendering options.** A sum of wave functions, including Gerstner-style waves, can provide surface displacement while finer normal detail supplies small ripples. This is an established real-time graphics approach. Spectral/FFT methods are another option if a larger sea and the available performance budget justify them. Neither choice alone supplies convincing breaking surf, shoreline interaction, or underwater optics. [S09]

For this project, choose the simplest method that makes the intended camera distances convincing. A good material on a moderately animated surface can be more useful than an elaborate simulation whose reflections, scale, or shoreline are wrong.

**Implementation recommendations:**

- Keep wave parameters in physical or clearly documented scene units. Match wavelength, height, and speed visually rather than randomizing each independently without constraints.
- Use the same wave definition for the visible surface, floating objects, and water-entry detection. Otherwise the user can be visually underwater while the controls still think they are in air.
- If horizontal Gerstner displacement is used, account for it when querying the surface; evaluating an undisplaced height formula at the wrong coordinates can introduce visible mismatches.
- Generate foam from plausible causes such as breaking crests, turbulent contact, and shoreline wash. Let it move, stretch, and fade.
- Keep small detail from sparkling or crawling at a distance. Reduce detail and use appropriate texture filtering as the camera moves away.
- Give local water a convincing horizon and blend it with the existing globe or distant ocean. A finite rectangular plane should not become visible when the user flies upward.

## Diving and underwater visibility

### What happens to light

**Scientific findings.** Absorption removes light from a path; scattering redirects it. Scattering can remove light from the direct view of an object and also add a veil of light from other directions. Both effects matter underwater. [S08]

NOAA describes the upper roughly **200 m** as the sunlight zone and **200–1,000 m** as the twilight zone. Detectable sunlight can extend unusually deep under favorable conditions, while significant illumination usually does not. These broad zones are not universal visibility distances or shader cutoffs. A coastal scene can become visually murky within a much shorter distance. [S02]

**Rendering implication:** Distinguish the user's depth from the distance to the thing they are looking at. Two fish at the same depth can look different if one is close and one is far away. Also distinguish the light path from the source to the object from the path between the object and camera.

A useful simplified direct-light relationship is:

```text
T(channel, distance) = exp(-extinction(channel) * distance)
extinction = absorption + out-scattering
```

Here, distance is the length **inside water**, and coefficients use inverse units—for example m⁻¹ if distance is in meters. This homogeneous-medium approximation describes loss along the direct path; it does not by itself add scattered light or emission. [S07] [S08]

An inexpensive rendering approximation can combine attenuated object color with a lighting-dependent water veil. For a more accurate model, distinguish the coefficients governing direct transmission from those governing the accumulated backscatter. Akkaynak and Treibitz's underwater measurements show why treating those broadband coefficients as identical can introduce errors. A simple RGB fog model remains an approximation, even when it produces a convincing image. [S37]

**Practical recommendations:**

- Establish a water profile: clearer blue water, greener coastal water, or a murkier sediment-rich setting. Do not scatter arbitrary blue fog settings through unrelated shaders.
- Make nearby geometry retain more detail and distant geometry lose contrast progressively.
- Let warm colors fade according to the water path. Avoid a hard rule such as “red disappears exactly at 5 m” for every location.
- If a nearby white light is provided, it can reveal colors that distant ambient illumination does not show. Its beam and the return path still pass through water.
- Water fog must respond to the illumination scenario. A bright cyan fog color can unintentionally light the entire night ocean.
- Use particles selectively to give depth and current cues. Do not fill every scene with a dense uniform snowstorm.
- Apply underwater attenuation to emissive animals too. A glowing jellyfish should not stay equally clear at every distance or show through opaque rocks.

### Looking up from underwater

Refraction compresses the above-water hemisphere into an angular window. With the idealized index of 1.333, the water-to-air critical angle is approximately **48.6°** from the surface normal; the full angular window is approximately **97.2°** across. Beyond that angle, a smooth water surface can reflect the underwater scene by total internal reflection. Waves distort this pattern. This is the basis of **Snell's window**. [S05]

**Opportunity for the build:** Looking upward could become one of the most memorable views. Let the user see a distorted patch of sky, changing surface highlights, and darker reflected surroundings. At night, the relevant Moon and sky should occupy that same refracted relationship. Avoid showing an undistorted air skybox across the entire underwater view.

This is an advanced refinement rather than a reason to delay a coherent first dive. Even a carefully handled surface underside and consistent lighting can establish the effect before more accurate refraction is introduced.

### Caustics and shafts of light

Caustics are concentrations of light produced by refraction through the moving surface. They create the shifting bright patterns familiar from sunlit shallow water. Real-time graphics can approximate them with projected or generated patterns instead of tracing every light path. [S10]

**Recommendations:**

- Make caustics strongest where a suitable light reaches the bottom through relatively clear water.
- Reduce them with water-path length and weak illumination, and mask them from occluded or inappropriate surfaces.
- Keep their animation direction and pace compatible with the surface motion.
- In After Dark, remove the strong daytime pattern. Any moonlit pattern should reflect the much weaker light; an underwater lamp has its own direction and coverage.
- Light shafts require illuminated scattering material. They should not persist as bright decorative columns in unlit water.

The GPU Gems caustics chapter is useful as a rendering reference, but its simplifications are not universal ocean measurements. In particular, do not copy a single per-meter transparency value from a graphics example and apply it to every water type. [S10]

### Crossing the waterline and moving around

These are **engineering and experience recommendations**, rather than scientific measurements:

- Treat air, water, and the interface as a connected environment. Users should be able to descend, ascend, look around, and return naturally.
- Use the actual local surface to determine immersion. A small transition band or hysteresis can prevent rapid audio and lighting flicker as waves pass the camera.
- When the camera straddles the waterline, handle which pixels or ray segments are in water. A whole-screen blue filter triggered by camera height alone cannot represent a half-submerged view correctly.
- Check surface backfaces, clipping, near-plane behavior, and refraction buffers. Turning a water mesh double-sided alone does not create a complete underwater rendering system.
- Keep the camera from falling through the seabed or revealing terrain undersides. Provide an understandable way to leave the water.
- Give swimming a distinct feel through gentle inertia, acceleration, and optional current influence. Tune responsiveness for exploration, and offer reduced camera bob or roll if those effects are used.
- Make movement and visual orientation readable at night. A contextual light or modest visibility assistance is possible if the project needs it; record that as an experience choice.
- The user has not requested survival mechanics. Oxygen timers, damage, and equipment management are optional future design decisions, not prerequisites for enjoyable diving.

## Underwater sound

The sea is not silent. Breaking waves, rain, marine animals, and human activities all contribute sound. Some fish and invertebrates produce sounds; the appropriate soundscape depends on the habitat. [S20] Sound travels at roughly **1,500 m/s** in seawater, with variations caused by temperature, salinity, and pressure. [S19]

**Sound-design suggestions:** Blend the surface soundscape into a quieter, enveloping underwater mix as the user descends. Keep local movement, a nearby splash, and distant ambience distinct. A filter can help communicate immersion, but filtering the same beach recording is an artistic shortcut rather than a complete model of underwater acoustics.

Use bubbles when there is a cause: breaking surf, entry disturbance, or an avatar/equipment system that produces them. Fish and jellyfish should not all emit decorative bubble trails. Let returning to air restore the open surface soundscape without an abrupt volume jump. Recorded hydrophone audio is a useful reference; it is not automatically a literal reproduction of unaided human hearing underwater.

## Seafloor, habitat, and scale

**Design recommendation:** Build a coherent local environment around the existing Earth landing area. Decide what coast it represents, then choose compatible bottom materials, water clarity, vegetation, and animals. If the setting is an invented composite, describe it that way rather than attaching an exact real-world location to arbitrary species and terrain.

The most useful terrain is shaped for exploration: connected shallows, slopes, rocks or other shelter, patches of open bottom, and a transition into more open water. Distinct silhouettes and changes in visibility can suggest distance without covering every meter with detail. Place organisms according to their habitat rather than distributing them uniformly through a box.

**Data boundary.** NOAA's ETOPO 2022 includes global topography and bathymetry at **15 arc-seconds**, approximately half a kilometer at the equator. It can support broad coastal and seabed form, but it cannot establish the positions of individual rocks or a small reef. Grid spacing also does not mean that every cell was directly surveyed at that resolution. [S33]

For a specifically named coast, NOAA's bathymetry resources provide access to survey products such as multibeam, single-beam, and lidar data where available. Check coverage and vertical reference before combining these with land terrain. [S34] If suitable local data are unavailable, create plausible detail and label it as reconstruction in the project's content metadata.

**Suggested scene bands, for composition only:** an immediately readable shallow area, a more spacious swim area, and an optional deeper edge where visibility falls away. These are adjustable artistic zones, not the ocean's scientific light-zone boundaries. Users should discover the environment through movement rather than encounter a forced sequence of rooms.

## Fish that feel alive

Real fish vary greatly in body shape, swimming style, grouping, and habitat. As one specific reference, northern anchovies (*Engraulis mordax*) occur along the eastern North Pacific coast and form large schools. Monterey Bay Aquarium describes their schooling as a defense against predators. This is a useful candidate for a compatible coastal setting, not a species to place in every ocean. [S14]

**Animation and behavior recommendations:**

- Make heading changes and body motion agree. Tail movement should contribute to the impression of propulsion rather than play independently of travel.
- Vary animation phases, spacing, speeds, and modest size differences. Identical fish turning in perfect synchrony look like a rigid prop.
- Give different groups different habits: some schooling, others loosely grouped or associated with shelter, if supported by the chosen species.
- Keep animals within water and away from solid terrain. Let them respond to the user's approach gradually, using behavior appropriate to the species.
- Preserve some quieter stretches between encounters. A small number of well-observed interactions can be more convincing than filling every direction with animals.
- Use depth and distance to reveal schools gradually. Fish appearing from beyond visibility is more natural than visible spawning beside the camera.

Craig Reynolds's **Boids** model is a useful graphics foundation for coordinated groups: individuals react to nearby neighbors through separation, alignment, and cohesion. It is a behavioral animation model, not a complete biological explanation of schooling. [S18] Combine it with habitat boundaries and obstacle avoidance. For performance, avoid checking every fish against every other fish when a spatial neighborhood structure or simpler group controller would suffice.

## Jellyfish and nighttime light

### Three effects that should remain distinct

| Effect | What produces it | Implication for the scene |
|---|---|---|
| Bioluminescence | An organism generates light through a chemical process. [S11] | Use emission only for a species and behavior that support it |
| Fluorescence | Incoming excitation light is absorbed and re-emitted; the crystal jelly's GFP is a familiar example. [S13] | An external-light fluorescence effect needs an excitation source; “fluorescent” does not mean it glows freely in complete darkness |
| Comb-jelly rainbow shimmer | External light interacts with the moving comb rows. Smithsonian explicitly distinguishes this from bioluminescence. [S12] | Make rainbow appearance depend on lighting and view, rather than constant multicolored emission |

Some animals combine more than one mechanism, so these are distinctions between effects, not necessarily mutually exclusive categories of animals. Not all jellyfish produce light. Many luminous marine organisms emit blue-green or green light, but species-specific exceptions exist. [S16]

### A grounded candidate for the first glowing jellyfish

**Crystal jelly — *Aequorea victoria*.** Monterey Bay Aquarium describes a nearly transparent animal with delicate tentacles, occurring from Southern California to Vancouver, reaching up to about **25 cm across**. When disturbed, light-producing structures around the bell margin produce a green-blue glow. [S13]

**Design interpretation:** This offers a real reference for localized light around a transparent bell rather than a permanently glowing solid orb. Use a suitable eastern North Pacific setting if presenting it as a real species. If the current Earth coast has a different identity, select a regionally appropriate species or use an explicitly stylized jellyfish pending that decision.

The glow can be an encounter, not continuous floodlighting. Keep most of the animal subtle between luminous events; use restrained bloom so the bell remains readable. If the experience makes flashes brighter, longer, or more frequent for visibility, record those as artistic adjustments. Avoid claiming that every approach by a swimmer reliably produces the same flash in nature.

### Shape and motion

Jellyfish commonly move with pulsating bells and trailing tentacles. Comb jellies belong to a different animal group and use rows of cilia for propulsion. [S12]

**Rendering suggestions:** Give the bell thickness and internal structure enough presence to remain visible without making it opaque. Animate contraction and relaxation with trailing appendages that lag behind the main motion. Add drift and individual phase differences. A current can influence both drifting animals and nearby particles, helping the scene feel coherent.

Transparency is a technical risk when many animals overlap. Check sorting, depth, and emission together. A jellyfish should remain behind a rock when it swims behind one. A soft outline or selective internal contrast may communicate its form more reliably than multiple expensive transparent shells.

### A second optional nighttime encounter: luminous plankton

Scripps's Latz Laboratory documents dinoflagellates that flash under mechanical stress from waves, surge, and swimming animals. Dense populations can produce striking nighttime displays; conditions vary, and these displays are not universal features of every coast. [S15]

**Design opportunity:** In a suitable setting, short-lived points or traces of blue light could appear around disturbed water and fade when motion stops. This may create a more interactive discovery than an always-glowing sea. Keep the water itself dark; local organisms are producing the light. Treat an especially persistent or exaggerated effect as a chosen presentation.

### What should change after dark

The ocean community should still feel continuous across time. Jellyfish do not universally appear only at night. Some marine organisms move upward at night and deeper during the day—a phenomenon called diel vertical migration—but that does not apply identically to every species. [S17]

**Implementation recommendation:** Separate animal presence, activity, illumination, and emission. After Dark can change visibility and supported activity without deleting every fish and replacing the population with glowing jellyfish. Species metadata should identify any actual day/night behavior used.

## A believable night sky above the ocean

### Choose a coherent mood

Both of these are valid creative directions. They can remain tunable presets rather than new mandatory UI controls.

| Direction | Above water | Underwater | Main visual emphasis |
|---|---|---|---|
| Moonlit coast | A visible Moon, wave glints, readable coastal silhouettes, fewer faint sky details | Weak surface-derived light plus any local sources | Calm space, reflected light, navigation by silhouette |
| Dark coastal night | Little or no moonlight, more prominent stars and a subtle Milky Way where visible | Much less ambient illumination; localized light becomes prominent | Wonder, contrast, luminous encounters |

The Moon, stars, and atmosphere contribute natural nighttime light. Moonlight can greatly increase ground illumination, while faint celestial features become harder to see. Airglow is another natural contribution, often subtle to human vision. [S24]

**Recommendation:** Decide which light source leads the composition. A bright full Moon, an intensely colored Milky Way, bright shallow-water caustics, and a completely illuminated seabed all at once would be an enhanced cinematic treatment. That is an available artistic choice, but it should not be described as ordinary naked-eye nighttime visibility.

### Twilight and true night

The standard evening twilight boundaries use the Sun's geometric center below the horizon: civil twilight ends at **−6°**, nautical twilight at **−12°**, and astronomical twilight at **−18°**. These describe solar geometry, not a universal fixed number of minutes after sunset. [S21]

**For After Dark:** Select a consistent nighttime state. If geographic accuracy is used, location, date, and time must agree; a clock time such as 9 p.m. does not guarantee full darkness at every latitude and season. An authored night preset is also reasonable. Identify it internally as a preset rather than claiming it is the current local sky.

If transitions are animated, let the horizon glow fade and the brightest celestial objects emerge before fainter stars. The transition can be accelerated for the experience.

### Stars and the Milky Way

Stars should read primarily as points with different brightnesses and subtle color differences. Atmospheric turbulence causes twinkling when viewed from Earth's surface. [S27] For rendering, keep any twinkle gentle and asynchronous; avoid making the sky resemble a field of flashing decorative lights.

The Milky Way is a faint, structured band, including dark dust lanes. Long-exposure photographs often show more color and detail than the human eye can see. NASA recommends dark conditions and little moonlight for observing it. [S23]

**Recommendations:**

- Use a real star map or catalog if constellations or recognizable sky positions are shown. Keep the Milky Way registered to that same celestial orientation.
- Orient the sky for the chosen observer and time if geographic accuracy matters. Do not independently rotate constellations, the Milky Way, and celestial labels.
- Vary star visibility with sky brightness, clouds, and haze. Do not display the same dense field in bright twilight and dark night.
- Let the ground and ocean horizon occlude celestial objects correctly.
- Retain a restrained Milky Way in the naturalistic presentation. More vivid treatment can be an artistic setting.
- Give planets separate treatment if they are included. Their positions depend on the date; they are not permanently attached to a star texture. NASA's skywatching FAQ also explains why Mercury and Venus remain near the Sun in our sky. [S22]

NASA's **Deep Star Maps 2020** provides catalog-derived maps in celestial and galactic coordinates, including versions separating bright stars from the fainter background. It is useful source material, but it contains far more stars than are individually visible to a person. Applying the full image at arbitrary exposure is not a calibrated naked-eye sky. Choose the appropriate projection and coordinate convention. [S28]

### The Moon and its reflection

NASA gives a lunar radius of approximately **1,740 km** and average Earth–Moon distance of **384,400 km**. Those rounded values imply an angular diameter of approximately **0.52°**, calculated as `2 × atan(radius / distance)`. Use about half a degree as a reference, allowing for distance variation. Enlarging it substantially is an artistic choice. [S26]

The illuminated portion of the Moon depends on Sun–Earth–Moon geometry. Moonrise and moonset also change across the lunar cycle. [S22] A chosen phase therefore should agree with the selected night and direction of illumination.

**Rendering recommendations:** Tie the visible lunar disc, moonlight direction, shadows, and water highlights to the same source. A rough water surface should break the reflected light into moving glints; do not paint a fixed silver strip on the sea. Let the glints change as the observer moves. The reflection can be broader than the Moon's small disc because many differently oriented wave facets contribute.

If the Moon is below the horizon, it should not create a direct moonlight beam or reflection path. If it is obscured, adjust its direct contribution rather than leaving an unchanged spotlight behind the clouds.

### Clouds, haze, and ambient light

Artificial light scattered in the atmosphere creates skyglow and reduces the contrast of stars. Clouds and aerosols can increase skyglow around illuminated areas. [S25]

**Design suggestions:** A remote ocean scene can have a dark horizon with restrained natural glow; a coast near a city can have a directional light dome. Cloud layers should obscure or attenuate stars behind them and take their brightness from the chosen environment. Do not render all night clouds as bright white daytime clouds or make stars show equally through them.

An atmospheric-scattering system can help connect daytime, sunset, and the planet-scale atmosphere. Eric Bruneton's implementation is an original research-based reference with a WebGL2 demonstration. It still needs integration with stars, the Moon, clouds, and nighttime illumination to produce the whole experience. [S29]

## Practical implementation guidance

This section is engineering advice for Astra. It does not assume a specific framework.

### Keep one environmental state

Use a shared state for the selected time mode and relevant environment parameters. The entry screen, world scene, sky, lights, water reflections, underwater lighting, and animal systems should consume compatible values.

When **After Dark → Enter this world** is used, initialize night before revealing the environment. Avoid a daytime flash followed by a delayed switch. Preserve that state during diving, resurfacing, teleporting, and scene loading. If the user changes the mode later, update the environment coherently.

Useful state concepts include:

| Group | Examples | Why keep them separate? |
|---|---|---|
| Place and time | Location or authored preset, scenario date/time, Sun and Moon directions | Makes sky and lighting reproducible |
| Water | Mean level, wave definition, optical profile, current field | Keeps rendering, movement, and visibility compatible |
| Ecology | Species, habitat, size range, activity, emission behavior | Prevents time mode from becoming an arbitrary creature swap |
| Presentation | Exposure, visibility assistance, glow enhancement, camera motion | Allows creative adjustments without rewriting scientific values |
| Quality | Reflection resolution, mesh detail, particle density, animal detail | Lets performance change without changing the environment's identity |

### Prioritize the cues that survive movement

For this addition, the highest-value work is likely to be correct water/sky lighting, a stable surface crossing, distance-dependent underwater visibility, and believable animal motion. This is a design judgment rather than a benchmark result.

Layer expensive effects where they help. A few nearby detailed fish can carry the scene while distant schools use simpler geometry or animation. Reduce transparent overdraw for jellyfish and particles, particularly when the user looks through several layers toward the surface. Reflection and refraction passes can cost more than the apparent simplicity of a water plane suggests.

Use adaptive resolution and detail where the existing project supports them. Measure frame time, memory, and loading on the actual supported browsers and devices. Avoid claiming a particular frame rate before profiling. Maintain control responsiveness while reducing optional visual detail.

### If the project uses Three.js

The current official documentation describes `Water` as a basic flat reflective effect for `WebGLRenderer`, and `WaterMesh` as its `WebGPURenderer` counterpart. They are starting points, not complete explorable-ocean systems. Match the existing project version and renderer before selecting or extending either. [S30] [S31]

A complete dive still needs the water volume, terrain, surface underside, visibility, transitions, and marine life described above. Do not infer that importing an ocean example implements those features.

Keep color handling consistent: Three.js documents a linear working space for lighting, appropriate color-space annotations for image textures, and no color-space conversion for normal/roughness data. [S32] Apply the same exposure and output treatment to sky, water, terrain, and animals. Overpowered bloom should not be used to conceal incorrect lighting.

### Scientific parameters versus artistic controls

| Reference | Value or relationship | How to use it |
|---|---|---|
| Approximate water refractive index | 1.333 [S04] | Idealized graphics baseline; not a site-specific measurement |
| Normal-incidence reflectance | Approximately 2%, calculated [S04] [S06] | Fresnel reference; not material opacity |
| Flat-surface underwater sky window | Approximately 97° across, calculated [S05] | Refraction reference; waves distort it |
| Broad ocean sunlight-zone reference | Roughly upper 200 m [S02] | Scientific context, not a promise of 200 m visibility |
| Water-path extinction | Exponential in a homogeneous approximation [S07] | Use consistent distance units and a documented water profile |
| Lunar angular diameter | Approximately 0.52°, calculated [S26] | Natural scale reference |
| Astronomical twilight boundary | Sun's center at −18° [S21] | Distinguishes residual twilight from solar night |
| Swimming speed, fish density, glow boost, camera bob | Project choices | Keep editable and do not present as measured ocean constants |

## References and assets worth using

| Resource | Best use in this project | Important limitation |
|---|---|---|
| NOAA ocean facts [S01] [S02] [S03] | Color, illumination, wave behavior | Educational generalizations need local interpretation |
| Monterey Bay Aquarium animal pages [S13] [S14] | Species appearance, range, scale, behavior references | An exhibit's density and lighting are not a natural ocean scene |
| MBARI and Scripps [S11] [S15] [S16] | Bioluminescence mechanisms and visual research | Research imagery is not automatically licensed for incorporation |
| NASA Deep Star Maps [S28] | Star-field source material and celestial orientation | Needs brightness, resolution, and projection adaptation |
| NOAA ETOPO and bathymetry [S33] [S34] | Broad seabed form or local survey discovery | Global grids cannot supply all close-range detail |
| DOSITS [S19] [S20] | Underwater sound references | Check the rights of individual recordings before reuse |
| NVIDIA GPU Gems and PBRT [S06] [S07] [S08] [S09] [S10] | Rendering principles and approximations | Older examples need adaptation; historical performance claims do not predict current browser performance |

For each imported asset, record its creator, source URL, credit, license, and any alterations. MBARI publishes specific reuse restrictions; treat its footage as research reference unless the intended use is covered or permission is obtained. [S35] For NASA imagery, follow the media guidelines and check individual credits rather than assuming everything hosted on a NASA page has identical reuse terms. [S36]

No external meshes, textures, audio files, or star maps have been downloaded or cleared for this report. The source register below is ready for verification during implementation.

## What to check when reviewing the build

These are practical review scenarios, not a requirement for a large automated test suite.

1. **Enter with After Dark selected.** The first visible frame, sky, land, and water agree that it is night.
2. **Look across water and then downward.** Reflections change with angle, and bottom visibility follows the water path.
3. **Move along the coast.** Water meets terrain continuously, and foam does not reveal a static decorative outline.
4. **Cross the surface slowly and repeatedly.** No flickering modes, missing underside, black frame, or abrupt audio jump.
5. **Pause partly submerged.** The air and underwater parts of the view behave plausibly.
6. **Look at near and distant objects at the same depth.** Their clarity differs; the whole view is not just uniformly tinted.
7. **Look up from underwater.** The sky, surface distortion, and illumination correspond to the world above.
8. **Observe a school and a jellyfish closely.** Motion is varied, species scale is plausible, and creatures respect terrain.
9. **Follow a glowing animal behind a rock and into the distance.** It becomes occluded and attenuated correctly.
10. **Compare moonlit and darker settings, if both exist.** Faint sky visibility and underwater illumination respond consistently.
11. **Resurface and leave/re-enter the world.** The selected environmental state behaves consistently with the existing UI.
12. **Repeat on the intended device range.** Quality can decrease while movement, entry, and basic visibility remain usable.

## Source register

Sources were selected for their relevance to this build. Dates on evergreen pages may refer to website updates rather than new scientific discoveries. The graphics references support techniques; they do not validate an ecological reconstruction or a device-performance claim. No inaccessible source is essential to the recommendations.

[S01]: https://oceanservice.noaa.gov/facts/oceanblue.html
[S02]: https://oceanservice.noaa.gov/facts/light_travel.html
[S03]: https://www.noaa.gov/jetstream/ocean/waves
[S04]: https://openstax.org/books/physics/pages/16-2-refraction
[S05]: https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection
[S06]: https://www.pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission
[S07]: https://www.pbr-book.org/4ed/Volume_Scattering/Transmittance
[S08]: https://www.pbr-book.org/4ed/Volume_Scattering/Volume_Scattering_Processes
[S09]: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models
[S10]: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics
[S11]: https://www.mbari.org/know-your-ocean/bioluminescence/
[S12]: https://ocean.si.edu/ocean-life/invertebrates/jellyfish-and-comb-jellies
[S13]: https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/crystal-jelly
[S14]: https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/northern-anchovy
[S15]: https://latzlab.ucsd.edu/bioluminescence/dinoflagellates/dinoflagellate-bioluminescence/
[S16]: https://latzlab.ucsd.edu/bioluminescence/bioluminescence-questions-and-answers/
[S17]: https://oceanexplorer.noaa.gov/ocean-fact/dsl/
[S18]: https://www.red3d.com/cwr/boids/
[S19]: https://dosits.org/decision-makers/tutorials/science/sound-speed/
[S20]: https://dosits.org/science/sounds-in-the-sea/what-are-common-underwater-sounds/
[S21]: https://www.weather.gov/fsd/twilight
[S22]: https://science.nasa.gov/skywatching/faq/
[S23]: https://nightsky.jpl.nasa.gov/news/444/
[S24]: https://www.nps.gov/subjects/nightskies/natural-light-in-night-sky.htm
[S25]: https://www.nps.gov/subjects/nightskies/lightpollution.htm
[S26]: https://science.nasa.gov/moon/facts/
[S27]: https://science.nasa.gov/image-article/apod-2000-july-25-why-stars-twinkle/
[S28]: https://svs.gsfc.nasa.gov/4851/
[S29]: https://ebruneton.github.io/precomputed_atmospheric_scattering/
[S30]: https://threejs.org/docs/pages/Water.html
[S31]: https://threejs.org/docs/pages/WaterMesh.html
[S32]: https://threejs.org/manual/pages/color-management.html
[S33]: https://www.ncei.noaa.gov/products/etopo-global-relief-model
[S34]: https://www.ncei.noaa.gov/products/bathymetry
[S35]: https://www.mbari.org/legal/
[S36]: https://www.nasa.gov/nasa-brand-center/images-and-media/
[S37]: https://openaccess.thecvf.com/content_cvpr_2018/html/Akkaynak_A_Revised_Underwater_CVPR_2018_paper.html

| ID | Institution / author | Source and purpose |
|---|---|---|
| S01 | NOAA Ocean Service | [Why is the ocean blue?][S01] — absorption and suspended material |
| S02 | NOAA Ocean Service | [How far does light travel in the ocean?][S02] — broad light zones |
| S03 | NOAA JetStream | [Waves][S03] — wind waves, swell, and coastal interaction |
| S04 | OpenStax, Rice University | [Refraction][S04] — refractive index and Snell's law |
| S05 | OpenStax, Rice University | [Total Internal Reflection][S05] — water/air critical angle |
| S06 | Pharr, Jakob, Humphreys | [PBRT: Specular Reflection and Transmission][S06] — Fresnel behavior |
| S07 | Pharr, Jakob, Humphreys | [PBRT: Transmittance][S07] — light loss along a path |
| S08 | Pharr, Jakob, Humphreys | [PBRT: Volume Scattering Processes][S08] — absorption, scattering, emission |
| S09 | Mark Finch / NVIDIA GPU Gems | [Effective Water Simulation from Physical Models][S09] — real-time wave rendering |
| S10 | NVIDIA GPU Gems | [Rendering Water Caustics][S10] — caustic approximations |
| S11 | MBARI | [Bioluminescence][S11] — biological light production |
| S12 | Smithsonian Ocean | [Jellyfish and Comb Jellies][S12] — anatomy, locomotion, optical distinctions |
| S13 | Monterey Bay Aquarium | [Crystal jelly][S13] — species-specific glow, range, and size |
| S14 | Monterey Bay Aquarium | [Northern anchovy][S14] — habitat and schooling |
| S15 | Scripps / Latz Laboratory | [Dinoflagellate Bioluminescence][S15] — mechanically triggered flashes |
| S16 | Scripps / Latz Laboratory | [Bioluminescence Questions and Answers][S16] — variation and visual perception |
| S17 | NOAA Ocean Exploration | [What is the deep scattering layer?][S17] — day/night vertical migration |
| S18 | Craig Reynolds | [Boids][S18] — original coordinated-motion model |
| S19 | DOSITS | [Science Tutorial: Sound Speed][S19] — seawater sound propagation |
| S20 | DOSITS | [What are common underwater sounds?][S20] — soundscape references |
| S21 | National Weather Service | [Definitions of Twilight][S21] — solar-angle boundaries |
| S22 | NASA | [Skywatching FAQ][S22] — Moon phases and apparent planetary positions |
| S23 | NASA Night Sky Network | [The Great Rift][S23] — observed Milky Way versus photography |
| S24 | National Park Service | [Natural Light in the Night Sky][S24] — moonlight and natural sky glow |
| S25 | National Park Service | [Light Pollution][S25] — skyglow, haze, and cloud effects |
| S26 | NASA | [Moon Facts][S26] — size and distance for angular-scale estimate |
| S27 | NASA APOD | [Why Stars Twinkle][S27] — atmospheric variability |
| S28 | NASA Scientific Visualization Studio | [Deep Star Maps 2020][S28] — star-map source material |
| S29 | Eric Bruneton | [Precomputed Atmospheric Scattering][S29] — original implementation and demo |
| S30 | Three.js | [Water][S30] — current WebGL addon scope |
| S31 | Three.js | [WaterMesh][S31] — current WebGPU addon scope |
| S32 | Three.js | [Color Management][S32] — rendering color pipeline |
| S33 | NOAA NCEI | [ETOPO Global Relief Model][S33] — broad seabed data |
| S34 | NOAA NCEI | [Bathymetry][S34] — local survey discovery |
| S35 | MBARI | [Terms of Use][S35] — media reuse conditions |
| S36 | NASA | [Images and Media Guidelines][S36] — media reuse guidance |
| S37 | Derya Akkaynak and Tali Treibitz, CVPR 2018 | [A Revised Underwater Image Formation Model][S37] — measured differences between transmission and backscatter |

## Rephrased prompt to paste into VS Code

I'd like to build on the Earth experience by making its ocean feel more realistic, alive, and inviting to explore. Let users move naturally into the sea, dive beneath the surface, swim among fish, discover underwater scenery, and return to the surface. Use the attached research to guide the water's movement, reflections, changing visibility, lighting, marine life, and sound, while keeping the experience enjoyable and easy to explore.

When someone selects **After Dark** and clicks **Enter this world**, bring them into a coherent nighttime Earth. Let the night sky and ocean complement each other through stars, appropriate moonlight and reflections, and an underwater atmosphere that feels different after sunset. I'd love jellyfish to become part of that experience, with believable motion and species-appropriate bioluminescence where it fits. There is room for other subtle discoveries too.

Study the existing project and choose an approach that suits its style and technology. Use the research as grounding while leaving room for creative interpretation. The goal is a beautiful, playful journey where discovery feels natural. Build this Earth improvement so I can explore it, give feedback, and refine the direction with you.
