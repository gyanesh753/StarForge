// A destination is content + a rendering recipe. Add future worlds here, without
// changing the navigation, journal, or discovery components.
export const bodies = [
  {
    id: 'sun', name: 'The Sun', shortName: 'Sun', number: '00', category: 'OUR NEAREST STAR', type: 'G-TYPE MAIN-SEQUENCE STAR',
    color: '#edb778', radius: 2.5, position: [0, 0, 0], rotation: 0.026,
    texture: 'sun', initialRotation: 0.4,
    poem: 'Every journey begins<br>with a little light.',
    description: 'The star that holds our worlds together. A restless sphere of plasma, quietly turning mass into the light that reaches home.',
    facts: [['1.39M', 'km diameter'], ['4.6B', 'years old'], ['5,500°', 'C at the surface']],
    caption: 'The light that makes everything else possible.',
    source: 'https://science.nasa.gov/sun/facts/',
    views: [['visible', 'Warm portrait'], ['corona', 'The corona']],
    discoveries: [
      { title: 'A star, holding us together', label: 'An extraordinary pull', text: 'Almost all the mass in our solar system belongs to the Sun. Its gravity keeps the planets, and their many companions, moving around our shared center.', stat: '99.8%', unit: 'of the solar system’s mass', art: 'gravity' },
      { title: 'Made of something restless', label: 'A living surface', text: 'The Sun has no solid ground. It is mostly hydrogen and helium in a plasma state. Deep inside, nuclear fusion turns hydrogen into helium and releases energy.', stat: '15 million °C', unit: 'approximately, at the core', art: 'plasma' },
      { title: 'The curious crown', label: 'Beyond the glow', text: 'The corona, the Sun’s outer atmosphere, is much hotter than the visible surface. It stretches far into space; its heating is still an active area of research.', stat: 'Up to 2 million °C', unit: 'temperatures in the corona', art: 'corona' },
    ],
  },
  {
    id: 'mercury', name: 'Mercury', shortName: 'Mercury', number: '01', category: 'THE INNER WORLDS', type: 'TERRESTRIAL PLANET',
    color: '#c5bfb5', radius: 0.8, position: [6.5, 0, 4.5], rotation: 0.012,
    texture: 'mercury', initialRotation: 0.8,
    poem: 'A small world.<br>A remarkable resilience.',
    description: 'Sun-scorched and crater-worn. The smallest planet carries an ancient story in its scars, racing around the Sun in just 88 Earth days.',
    facts: [['4,880', 'km diameter'], ['88', 'Earth-day year'], ['0.39', 'AU from the Sun']],
    caption: 'An ancient landscape, written in light and shadow.',
    source: 'https://science.nasa.gov/mercury/facts/',
    views: [['visible', 'Sunlit world'], ['terminator', 'Light & shadow']],
    discoveries: [
      { title: 'Two very different extremes', label: 'Between fire and frost', text: 'With only a wispy exosphere, Mercury cannot hold on to much heat. Sunlit ground can reach about 430°C, while the long night can fall to −180°C.', stat: '610°C', unit: 'between day and night extremes', art: 'temperature' },
      { title: 'Ice beside the Sun', label: 'An unexpected refuge', text: 'Some deep polar craters stay permanently in shadow. These cold traps can shelter water ice, even on the planet closest to the Sun.', stat: 'Permanent shadow', unit: 'a refuge inside polar craters', art: 'ice' },
      { title: 'A day that outlasts a year', label: 'Time takes a strange turn', text: 'Mercury rotates slowly while racing along its orbit. From one sunrise to the next, 176 Earth days pass: two complete trips around the Sun.', stat: '176 Earth days', unit: 'from one sunrise to the next', art: 'orbit' },
    ],
  },
  {
    id: 'venus', name: 'Venus', shortName: 'Venus', number: '02', category: 'THE INNER WORLDS', type: 'TERRESTRIAL PLANET',
    color: '#ddc392', radius: 1.5, position: [-10, 0, -7], rotation: -0.009,
    texture: 'venus-clouds', initialRotation: 1.2,
    poem: 'Beauty can keep<br>extraordinary secrets.',
    description: 'A luminous world beneath a veil of clouds. Almost Earth’s twin in size, yet a very different story waits below the golden haze.',
    facts: [['12,104', 'km diameter'], ['225', 'Earth-day year'], ['0.72', 'AU from the Sun']],
    caption: 'A beautiful veil. A world of extremes underneath.',
    source: 'https://science.nasa.gov/venus/venus-facts/',
    views: [['visible', 'Cloud tops'], ['surface', 'Beneath the clouds']],
    discoveries: [
      { title: 'The hottest of them all', label: 'A blanket too thick', text: 'Venus is hotter than Mercury. Its thick, carbon-dioxide-rich atmosphere traps heat in a powerful greenhouse effect. The surface is hot enough to melt lead.', stat: '464°C', unit: 'approximate surface temperature', art: 'temperature', source: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html' },
      { title: 'A world beneath the veil', label: 'Look below the clouds', text: 'Ordinary cameras cannot see through Venus’ persistent clouds. Radar mapping reveals volcanic plains and mountains hidden below. Try the surface view to look beneath the haze.', stat: '92 bar', unit: 'approximate surface pressure', art: 'layers', source: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html' },
      { title: 'Taking the other way around', label: 'A backward kind of day', text: 'Venus spins in the opposite direction to most planets. One rotation takes about 243 Earth days, longer than its 225-day year. A solar day is about 117 Earth days.', stat: '243 Earth days', unit: 'for one rotation relative to the stars', art: 'orbit' },
    ],
  },
  {
    id: 'earth', name: 'Earth', shortName: 'Earth', number: '03', category: 'THE INNER WORLDS', type: 'TERRESTRIAL PLANET',
    color: '#a8c9bc', radius: 1.58, position: [15.5, 0, -7.5], rotation: 0.035,
    texture: 'earth-day', initialRotation: 2.55,
    poem: 'Somewhere in the vastness,<br>there is a place called home.',
    description: 'An ocean world wrapped in a thin blue veil. Every life we’ve ever known is here, on this small, extraordinary planet.',
    facts: [['12,756', 'km diameter'], ['365.25', 'day year'], ['1.00', 'AU from the Sun']],
    caption: 'A familiar world. An entirely new perspective.',
    source: 'https://science.nasa.gov/earth/facts/',
    views: [['visible', 'Blue marble'], ['night', 'After dark']],
    discoveries: [
      { title: 'Perhaps we should call it Ocean', label: 'An ocean world', text: 'Water covers about 71% of Earth’s surface. These connected oceans store heat, shape weather, and support a remarkable variety of life.', stat: '71%', unit: 'of the surface covered by ocean', art: 'ocean' },
      { title: 'A delicate blue embrace', label: 'A thin blue veil', text: 'Our atmosphere is mostly nitrogen and oxygen. It helps regulate temperature and shields life from much of the Sun’s harmful radiation. From space, it traces a delicate blue edge.', stat: '78% nitrogen', unit: 'with about 21% oxygen', art: 'atmosphere' },
      { title: 'A slight tilt. A world of change.', label: 'The reason for seasons', text: 'Earth’s axis tilts about 23.4 degrees. As we orbit the Sun, each hemisphere receives changing amounts of direct sunlight. That tilt gives us our seasons.', stat: '23.4°', unit: 'the tilt that shapes the seasons', art: 'tilt' },
    ],
  },
];

export const bodyById = Object.fromEntries(bodies.map(body => [body.id, body]));
export const totalDiscoveries = bodies.reduce((sum, body) => sum + body.discoveries.length, 0);
