# StarForge

A small voyage into something immense. Explore the **Sun, Mercury, Venus, and Earth** from orbit, then enter four representative environments. The current review milestone expands Earth into an explorable ocean by day and after dark.

## Run locally

Requires Node.js 20.19+ or 22.12+ and a browser with WebGL 2.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, normally **http://127.0.0.1:5173**.

```sh
npm run build     # Production files in dist/
npm run preview   # Serve the production build
npm test          # Playwright browser checks; uses installed Google Chrome
```

The app is local only. No account, API key, backend, or runtime internet connection is required after installation. Maps, ground materials, and the font are bundled locally. Scientific-reference links open external websites. A production build can be served by any static host.

## The first journey

- Drag a world to orbit; scroll, pinch, or use + / − to approach.
- Travel using the destination dock. Pull back to the solar map and choose a world or its label.
- Follow three thematic markers on each destination, or use **Look a little closer**. Twelve observations are saved to the field journal in this browser.
- Explore Earth's night lights, Venus beneath the clouds, Mercury's day/night boundary, and an illustrative solar corona.
- Pause the drift, enable a gentle synthesized soundscape, or enter quiet view.
- Keyboard: focus the 3D canvas and use arrows to orbit; **+ / −** zoom, **R** resets, **F** enters/exits quiet view, **Escape** closes overlays, and **Space** pauses motion when the canvas or page is focused.
- Reduced-motion preferences disable automatic drift and animated flights. Modal dialogs support keyboard focus and Escape. Loading, unavailable textures, and WebGL failures have explicit states.

## Step into a world

Choose **Enter this world** from orbit. An approach and descent introduce a separate local scene; **Return to orbit** restores the previous camera and alternate view.

- **Earth — The breathing coast:** walk a volcanic headland, fly above the clouds, then dive into a temperate Pacific-inspired sea. Swim through anchovy schools, find kelp and rocky seabed, and encounter transparent crystal jellies. Select **After Dark** in orbit before entering to visit the moonlit coast.
- **Mercury — The long light:** cross an impact landscape under a black sky, investigate a pale hollow analogue, and try a lower-gravity hop.
- **Venus — Beneath the golden veil:** descend through cloud layers to warm-lit rock, then return to the cloud sea around 58 km.
- **Sun — An ocean of light:** explore a virtual study of granulation, a sunspot, and magnetic tracers. There is no solid landing surface.

**WASD** moves, **drag or arrow keys** look, **E / Q** rise and lower, and **Shift** increases glide speed. Choose **Walk** to settle onto the ground, then **Space** to hop. **R** resets the local view; **Escape** returns to orbit after closing any open dialog. Mobile has hold-to-move arrows and height controls. Guided flights can be skipped or interrupted by movement; the entry descent can be skipped explicitly.

On Earth, descend freely through the waves or choose **Dive into the sea**. Swimming and flight share the same 27 m/s speed, acceleration, and Shift boost; forward movement follows your gaze. Use **E / Q**, the height controls, or **Return to the surface** to move between sea and air. Underwater, the optional **Observer light** helps nearby creatures remain readable. Enable sound for gently swelling surf, a water-entry cue, and a softer underwater mix.

Use **Follow a signal**, or click a visible marker, to approach a curiosity. **Observe** records a field note when nearby. Fifteen local observations join the twelve orbital observations in the journal; existing saved entries remain valid. These environments are compact studies with a roughly 1.45 km exploration radius (scaled to 14,500 km for the Sun), not entire traversable planets. The research reports inform their science, while their geography and visual detail are representative interpretations.

See [environment design and implementation notes](docs/EXPEDITIONS.md) and [ocean design, sources, and review boundaries](docs/OCEAN.md).

## Where to refine it

| File | Responsibility |
| --- | --- |
| `src/data.js` | Destination content, science references, rendering recipes, views, and discoveries |
| `src/universe.js` | Three.js scene, planet shaders, atmosphere, camera flights, map, and orbit controls |
| `src/main.js` | Navigation, discovery dialogs, journal interface, keyboard controls, and application state |
| `src/style.css` | Visual direction and responsive layouts |
| `src/journal.js` | Versioned, validated local journal persistence |
| `src/audio.js` | Optional synthesized score, surf, immersion mix, and water-entry cue |
| `src/expeditions/catalog.js` | Environment definitions, physical references, navigation tuning, local observations, and field-note storage |
| `src/expeditions/world.js` | First-person camera, entry/assisted flights, collision, walking, and resource lifecycle |
| `src/expeditions/terrain.js` | Seeded terrain, exact triangle height queries, instanced rock and vegetation |
| `src/expeditions/atmosphere.js` | Cloud layers, other-world skies, and solar plasma study |
| `src/expeditions/earth-profile.js` | Shared day/night scenario, optical settings, and CPU/GPU wave definitions |
| `src/expeditions/ocean.js` | Water surface, reflection/refraction passes, underwater light attenuation, and observer light |
| `src/expeditions/marine-life.js` | Instanced fish, crystal jellies, kelp, rocks, and suspended particles |
| `src/expeditions/style.css` | Expedition HUD, mobile controls, and local observation dialogs |
| `tests/exploration.spec.js` | Browser tests for travel, alternate views, saved observations, mobile, and controls |
| `tests/expeditions.spec.js` | Environment rendering, walking, cloud travel, saved field notes, mobile, and terrain collision checks |
| `tests/ocean.spec.js` | Day/night diving, marine discoveries, resurfacing, swim/flight speed, and mobile controls |

The destination registry supplies the navigation and discovery interface. Future bodies can reuse these systems; bodies with rings, moons, or unusual terrain can get additional rendering recipes. This milestone deliberately stops at the first four destinations for review.

The local scene is loaded on entry and disposed on return. Physical parameters and navigation speeds are separate so feedback can change movement and presentation without changing scientific references. Surveyed terrain and additional regions can replace a terrain recipe behind the same height-query and observation interfaces.

## Scientific presentation

This is a composed exploration, not an ephemeris or physics simulator. Sizes, orbital distances, flight times, and rotation rates are adjusted for navigation. The orbits are illustrative circles; positions are composed rather than current. Lighting is arranged for viewing, not calculated from a physically accurate Sun position. The starfield is decorative. Discovery markers indicate themes rather than geographic locations.

Earth's night view reveals a global night-light composite; it is not a live image. Venus' surface is a colorized radar-derived map. The Sun's warm color, moving surface, and eclipse-style corona are artistic treatments. Sound is an optional score, not sound recorded traveling through space. Rotation periods and solar days are distinguished in the content.

Rounded scientific facts were checked against NASA's [Sun](https://science.nasa.gov/sun/facts/), [Mercury](https://science.nasa.gov/mercury/facts/), [Venus](https://science.nasa.gov/venus/venus-facts/), and [Earth](https://science.nasa.gov/earth/facts/) references. Each observation links to its source inside the experience. A **Science & credits** panel makes the visualization choices accessible to visitors.

## Assets and licenses

Planet textures: [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/), based on NASA imagery, licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Downloaded 2K maps are retained in `public/textures/` and rendered with custom lighting, surface animation, and color treatment. These maps are illustrative composites, not uniformly complete or raw scientific datasets. See [CREDITS.md](CREDITS.md) for the asset list.

Instrument Serif: Rodrigo Fuenzalida and Jordan Egstad, [Google Fonts](https://fonts.google.com/specimen/Instrument+Serif), SIL Open Font License 1.1. The full license is bundled at `public/fonts/OFL.txt`.

Three.js, Vite, and Playwright retain their respective upstream licenses in installed packages.
