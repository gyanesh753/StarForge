# Earth: a living sea, by day and after dark

This review milestone extends the existing Earth coast into a traversable sea. It uses the supplied [Earth Ocean & After Dark research report](research/Earth_Ocean_After_Dark_Research.md) as grounding. The report's implementation suggestions and embedded prompts are reference material, not additional user instructions. The user's explicit requirement that swimming remain as fast as flying governs movement.

## The journey

Enter Earth in its ordinary view for daylight, or select **After Dark → Enter this world** for the moonlit coast. Descend through the moving surface, swim freely, and return to air without loading another scene. **Dive into the sea** offers a short guided approach when starting on land. **Follow a signal** includes an anchovy school, a submerged garden, and crystal jellies. These are optional invitations; discoveries can also be approached freely.

Flight and swimming use 27 m/s, the same acceleration/damping, normalized diagonal movement, and a 2.7× Shift boost. Forward movement follows the camera's pitch in either medium. E/Q and the touch height controls provide independent ascent/descent. These are comfortable exploration speeds, not claims about human swimming. Walking retains its ground movement settings and becomes swimming on immersion.

The observer light is a switchable visibility aid, clearly labeled in the HUD. Sound remains opt-in. Synthesized surf swells, fades with altitude, and changes to a quieter, darker mix underwater; surface crossings add a short sound cue. There are no oxygen meters, survival timers, bubble trails on animals, or added mission requirements.

## Grounding and interpretation

| Element | Scientific reference | Choice made for this scene |
| --- | --- | --- |
| Water color | [NOAA: Why is the ocean blue?](https://oceanservice.noaa.gov/facts/oceanblue.html) | Warm light attenuates more quickly along underwater view paths. Blue-green visibility, extinction, and scatter coefficients are art settings for one coastal profile. |
| Transmission | [PBRT: Transmittance](https://www.pbr-book.org/4ed/Volume_Scattering/Transmittance) | RGB exponential transmission and separate distance-dependent backscatter, with additional depth illumination. This is an approximation, not full volume transport. |
| Northern anchovy | [Monterey Bay Aquarium: Northern anchovy](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/northern-anchovy) | Fish around 13–22 cm, in independently phased schools. Animated trajectories, camera avoidance, and rock avoidance are behavioral illustrations. |
| Crystal jelly | [Monterey Bay Aquarium: Crystal jelly](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/crystal-jelly) | Nearly transparent bells around 15–25 cm across, pulsing with trailing tentacles. Short green-blue rim flashes illustrate a disturbance response. Proximity triggers are an interaction choice, not a guaranteed response to swimmers. |
| Night sky | [National Park Service: Natural light in the night sky](https://www.nps.gov/subjects/nightskies/natural-light-in-night-sky.htm) | An authored full-moon scenario with subdued stars, no bright Milky Way, and one shared direction for the visible Moon, illumination, and water highlights. No location/date/ephemeris claim. |

The coast is a temperate eastern Pacific composite. The two named animal species have compatible regional ranges; their placement and abundance are authored. The kelp is representative geometry, without a species or surveyed habitat claim. Both fish and jellies remain present by day and night; changes in visibility do not imply an unverified day/night migration.

## Implementation

- `earth-profile.js` supplies the lighting scenario and wave parameters. CPU height queries and generated GLSL share the same three vertical wave components and time source. Small shading ripples add surface detail without changing collision height.
- `ocean.js` uses a camera-following nonuniform surface grid, planar reflection, screen-space refraction with a depth texture, Fresnel weighting, shoreline wash, and moving directional glints. Underwater, an analytic approximation of Snell's window replaces the extra scene passes once clear of the interface.
- Underwater attenuation is applied to each relevant material using the estimated portion of the view ray inside water. Depth affects illumination separately from viewing distance. Emissive jelly rims receive the same distance attenuation and normal depth occlusion. Daytime caustics modulate illumination; the strong pattern is disabled at night.
- Marine geometry is instanced: fish, rocks, kelp, and three batches for the jelly bells, rims, and strands. Mobile uses fewer animals, particles, surface vertices, and smaller reflection targets. Simulation timing follows the existing drift/reduced-motion setting.
- The selected orbital night view is read before constructing the local scene. Returning to orbit preserves it. Day/night colors, source direction, water veil, exposure, and observer-light intensity share a profile.
- Arrival waits for the transition screen to clear before the descent clock starts, so loading and initial shader compilation cannot consume the visible journey.
- The ocean owns its render targets and releases them on departure. Scene geometry, materials, and lights use the existing expedition disposal path. Audio nodes remain part of the app's optional soundscape, with temporary crossing sounds disconnected on completion.
- Three new Earth notes are appended after the original indices, preserving existing journal keys. There are now six Earth notes, fifteen local notes, and twenty-seven observations including orbit.

## Review boundaries and checks

Reflection uses the mean water plane; refraction uses screen-space scene color and depth. Shoreline wash is a visual approximation, without simulated breakers or fluid dynamics. The underwater window shows the analytic sky rather than a complete refracted rendering of land and clouds. Caustics are procedural, not ray traced. Transparency uses standard blending; overlapping jelly surfaces are not solved with full order-independent transparency.

Wave queries agree with the vertex displacement definition; the finite mesh interpolates between sampled heights. Hysteresis prevents swim-mode flicker near the interface. The finite exploration area, procedural terrain, and conservative collisions remain those of the larger expedition system. There is no claim that water coefficients, moonlight exposure, or sound levels reproduce measured conditions.

`npm test` includes day/night entry, diving, underwater discoveries, light toggling, resurfacing, view preservation, equal flight/swim speed, and mobile navigation, alongside existing planet and journal regression tests. An animated night journey checks changing wave height, free ascent and descent, and opt-in sound without script or shader errors. Browser screenshots in `test-results/` support visual review. Tests run in Chrome with software WebGL; they do not establish frame rates on physical phones or Safari, and sound-design quality still needs listening on real speakers or headphones. `npm run build` produces the local static application.
