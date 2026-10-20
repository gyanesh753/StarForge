# Entering the inner worlds

This review milestone adds a compact, explorable local environment to each of the four existing destinations. The supplied [Explorable Worlds research report](research/Explorable_Worlds_Build_Research.md) is retained as reference material. Its proposed implementation order and instructions to another agent are suggestions, not requirements inherited by this project.

## Representation and sources

| Environment | Scientific basis | Authored interpretation |
| --- | --- | --- |
| Earth | [NASA Glenn reference atmosphere](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/earth-atmosphere-equation-metric/); [NASA Earth facts](https://science.nasa.gov/earth/facts/) | Volcanic coast, tree placement, waves, and cloud arrangement. No named or surveyed location; no live weather. |
| Mercury | [NASA fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html), [MESSENGER hollows](https://science.nasa.gov/solar-system/planets/mercury/mercurys-strange-hollows/), [contracting crust](https://www.nasa.gov/missions/the-incredible-shrinking-mercury-is-active-after-all/) | Crater, ridge, bright hollow analogue, and rock distribution. No ordinary atmospheric flight or wind effects; the pale patch is not presented as polar ice. |
| Venus | [NASA fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html), [LPI Venera surface observations](https://www.lpi.usra.edu/publications/slidesets/venus/slide_3.shtml), [ESA cloud layers](https://www.esa.int/Science_Exploration/Space_Science/Venus_Express/Greenhouse_effect_clouds_and_winds), [Magellan volcanic change](https://www.nasa.gov/missions/veritas/nasas-magellan-data-reveals-volcanic-activity-on-venus/) | Representative volcanic plain and warm illumination on dark rocks. Cloud treatment around 45–70 km is visual. Radar values are not converted into optical colors or invented elevation. |
| Sun | [NASA Marshall photosphere](https://solarscience.msfc.nasa.gov/feature1.shtml); [SDO wavelength channels](https://sdo.gsfc.nasa.gov/data/channels.php) | Animated granulation, sunspot contrast, and illustrative magnetic tracers. Warm and monochrome treatments are assigned visualizations, not recorded observations or measured field topology. No solid ground or walking. |

Gravity for ground hopping is 9.80665 m/s² on Earth, 3.70 m/s² on Mercury, and 8.87 m/s² on Venus, using the same 5 m/s initial hop speed. Navigation speeds and glide damping are creative choices. All exploration uses a fictional protected observer; there is no simulation of survivability, aerodynamics, or vehicle performance.

The Venus surface readout uses approximately 464°C and 92 bar consistently with the specialist fact sheet. It is explicitly a surface reference and is not used as a fabricated high-altitude temperature or pressure profile. Earth's readout uses the simplified tropospheric formula inside the model's stated range; it is not a weather forecast. Solar cells are approximately 1,000 km across, and their evolution is time-compressed.

Each environment exposes an evidence panel; every field note links to a scientific reference. Ground material attribution and reuse boundaries appear in [CREDITS.md](../CREDITS.md) and the in-app Science & credits panel.

## Architecture

- **Two scales:** orbital and local scenes share one WebGL renderer. The approach hides a scale change; local scenes do not claim continuity with a specific location on the orbital map. Returning restores the orbital camera and selected view.
- **Registry:** `catalog.js` keeps physical references, scene/art settings, navigation tuning, and observations separate. This is the extension point for regions and future destinations.
- **Stable terrain:** seeded height recipes and object placement repeat between visits. A nonuniform grid spends more detail near the traversable area. Collision uses barycentric interpolation of the actual rendered triangles, rather than a second approximation of the height function. Shader normal-map detail is decorative.
- **Movement:** walking uses gravity, floor contact, and conservative rock/trunk collision. On Earth, entering the sea switches naturally to swimming; there is no blocking water plane. Flight and swimming share speed and damping, with a terrain floor beneath both. Camera damping and guided flights are separate from the environment's scientific parameters. Input listeners are disposed when leaving; dialogs release held movement and pause flights.
- **Earth ocean:** a shared day/night scenario drives the sky, light, clouds, water, and underwater atmosphere. CPU movement queries and the displaced water mesh use the same wave definition. Instanced marine life adds three discoveries to Earth's existing three. See [the ocean notes](OCEAN.md) for sources, rendering details, and approximation boundaries.
- **Rendering:** instanced rocks and vegetation, local 1K material maps, reduced mobile geometry/shadows, and a shared renderer keep this milestone reasonably light. Environment code loads on entry. Materials, geometry, shadow maps, and event listeners are released on exit. Procedural ground still works if detail textures fail.
- **Observations:** local field notes use validated `starforge-field-notes-v1` browser storage. Existing orbital journal data is preserved in its own key; the journal combines both collections.

## Review boundaries

These are representative studies with authored boundaries, not streamed planetary terrain. Surface walking, clouds, water, and solar structure aim to establish the direction and interaction feel. Clouds use sprites and a height-dependent visual treatment, not volumetric radiative transfer. Ground relief has finite resolution; there are no caves, terrain deformation, missions, survival systems, or georeferenced landing coordinates.

Refinements can adjust the registry, movement controller, terrain recipe, or atmosphere renderer independently. A later measured terrain provider should return a mesh plus an exact `heightAt(x, z)` query and explicitly record its geographic extent and source resolution. New terrain does not require redesigning navigation or the field journal.

## Validation

`npm test` runs Chrome through Playwright, including the orbital regression suite. Expedition checks cover four environment scenes, local observations and persistence, cloud travel, mode changes, mobile layout and movement, reduced-motion entry, animated Venus descent and re-entry, and geometric agreement between rendered terrain and collision. Screenshots are generated under `test-results/` for visual review. Tests use a software WebGL renderer; they do not establish performance on physical mobile devices or Safari.
