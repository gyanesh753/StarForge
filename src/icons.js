const paths = {
  'arrow-right': '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  'sparkle': '<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z"/>',
  'sound-off': '<path d="M10 5 5 9H2v6h3l5 4V5Zm6 4 6 6m0-6-6 6"/>',
  'sound-on': '<path d="M10 5 5 9H2v6h3l5 4V5Zm5 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  'help': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-1.4.7-1.8 1.3-1.8 2.8m0 3h.01"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'reset': '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  'expand': '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"/>',
  'collapse': '<path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"/>',
  'mouse': '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
  'scroll': '<path d="m8 5 4-3 4 3m-4-3v20m-4-3 4 3 4-3"/>',
  'pause': '<path d="M8 5v14M16 5v14"/>',
  'play': '<path d="m8 4 12 8-12 8Z"/>',
  'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  'close': '<path d="m6 6 12 12M6 18 18 6"/>',
  'check': '<path d="m5 12 4 4L19 6"/>',
  'external': '<path d="M14 3h7v7m0-7L10 14m-1-9H4v15h15v-5"/>',
  'map': '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-35 12 12)"/>',
  'book': '<path d="M3 4h6l3 2 3-2h6v16h-6l-3 2-3-2H3Zm9 2v16"/>',
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkle}</svg>`;
}
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}
