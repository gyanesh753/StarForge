import { bodies } from './data.js';

const validIds = new Set(bodies.flatMap(body => body.discoveries.map((_, index) => `${body.id}:${index}`)));
const key = 'starforge-journal-v1';

export class Journal {
  constructor() {
    this.entries = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(saved)) saved.filter(id => validIds.has(id)).forEach(id => this.entries.add(id));
    } catch { /* Private browsing or a damaged record should not stop exploration. */ }
  }
  has(body, index) { return this.entries.has(`${body}:${index}`); }
  add(body, index) {
    const id = `${body}:${index}`;
    if (!validIds.has(id)) return false;
    const isNew = !this.entries.has(id);
    this.entries.add(id);
    try { localStorage.setItem(key, JSON.stringify([...this.entries])); } catch { /* The current session still works without storage. */ }
    return isNew;
  }
  count(body) { return [...this.entries].filter(id => id.startsWith(`${body}:`)).length; }
  get size() { return this.entries.size; }
}
