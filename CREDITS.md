# StarForge asset credits

All planetary maps below are by **Solar System Scope / INOVE**, based on NASA imagery and elevation data. Source: <https://www.solarsystemscope.com/textures/>. License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

| Local file | Original source |
| --- | --- |
| `public/textures/earth-day.jpg` | https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg |
| `public/textures/earth-night.jpg` | https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg |
| `public/textures/earth-clouds.jpg` | https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg |
| `public/textures/mercury.jpg` | https://www.solarsystemscope.com/textures/download/2k_mercury.jpg |
| `public/textures/venus-clouds.jpg` | https://www.solarsystemscope.com/textures/download/2k_venus_atmosphere.jpg |
| `public/textures/venus-surface.jpg` | https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg |
| `public/textures/sun.jpg` | https://www.solarsystemscope.com/textures/download/2k_sun.jpg |

The original map files are unchanged. StarForge applies custom illumination, atmosphere effects, animated solar texture coordinates, and color treatment during rendering. Maps can contain artistic gap filling and enhanced colors, as described by their publisher. This use does not imply endorsement by NASA, Solar System Scope, or INOVE.

**Instrument Serif Regular** by Rodrigo Fuenzalida and Jordan Egstad, distributed under the SIL Open Font License 1.1. Download source: <https://github.com/google/fonts/tree/main/ofl/instrumentserif>. Full license: [public/fonts/OFL.txt](public/fonts/OFL.txt).

Icons, discovery diagrams, star distribution, and ambient sound are generated in application code.

## Expedition ground material

**Rocky Terrain 02** by **Amal Kumar**, distributed by [Poly Haven](https://polyhaven.com/a/rocky_terrain_02) under [CC0](https://polyhaven.com/license).

| Local file | Original source |
| --- | --- |
| `public/materials/terrain-color.jpg` | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rocky_terrain_02/rocky_terrain_02_diff_1k.jpg |
| `public/materials/terrain-normal.jpg` | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rocky_terrain_02/rocky_terrain_02_nor_gl_1k.jpg |

The 1K JPEG files are unchanged. StarForge tiles them over approximately 70 scene meters, changes color and contrast in the ground shader, and combines them with authored terrain and vertex colors. This is an Earth material used as artistic detail across three representative landscapes; it is **not spacecraft-derived surface imagery** for Mercury or Venus. Normal-map detail does not modify collision geometry.

Expedition terrain, vegetation placement, rocks, water, clouds, solar granulation, and magnetic tracers are generated in code. See [the environment notes](docs/EXPEDITIONS.md) for the scientific references and interpretation boundary.

## Earth ocean expansion

Fish, crystal jellies, kelp, seabed rocks, waves, sky, and ocean sounds are generated in application code. No animal photographs, commercial models, hydrophone recordings, or new third-party textures are incorporated. The existing CC0 ground material also provides seabed detail.

The supplied [Earth Ocean & After Dark research report](docs/research/Earth_Ocean_After_Dark_Research.md) is retained as reference material. Scientific references, species choices, and the distinction between observations and authored effects are documented in [the ocean notes](docs/OCEAN.md). The references inform the design; their images and recordings have not been copied into the experience.
