import { test, expect } from '@playwright/test';

async function ready(page, hash = '') {
  await page.goto(`/${hash}`);
  await expect(page.locator('#app')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#loading-screen')).toBeHidden();
}

async function arrive(page, name) {
  await page.getByRole('button', { name: `Travel to ${name}`, exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/travelling/);
  await expect(page.locator('#planet-title')).toHaveText(`${name}.`);
}

test('renders all worlds, flies between them, and supports alternate views', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await ready(page);
  await page.screenshot({ animations: 'disabled', path: 'test-results/earth-desktop.png' });
  await page.getByRole('button', { name: 'After dark', exact: true }).click();
  await expect(page.getByRole('button', { name: 'After dark', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ animations: 'disabled', path: 'test-results/earth-night.png' });
  await arrive(page, 'Venus');
  await page.getByRole('button', { name: 'Beneath the clouds', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: 'test-results/venus.png' });
  await arrive(page, 'Mercury');
  await page.getByRole('button', { name: 'Light & shadow', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: 'test-results/mercury.png' });
  await arrive(page, 'The Sun');
  await page.screenshot({ animations: 'disabled', path: 'test-results/sun.png' });
  await page.getByRole('button', { name: 'The corona', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: 'test-results/corona.png' });
  await page.getByRole('button', { name: 'Solar map', exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/travelling/);
  await expect(page.locator('#map-labels')).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/solar-map.png' });
  await page.getByRole('button', { name: 'Fly to Earth', exact: true }).click();
  await expect(page.locator('#planet-title')).toHaveText('Earth.');
  await expect(page.locator('body')).not.toHaveClass(/travelling/);
  expect(errors).toEqual([]);
});

test('discoveries persist, stay unique, and can be revisited from the journal', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Look a little closer', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Perhaps we should call it Ocean' })).toBeVisible();
  await expect(page.locator('#journal-count')).toHaveText('1');
  await page.screenshot({ animations: 'disabled', path: 'test-results/discovery.png' });
  await page.getByRole('button', { name: 'Keep looking' }).click();
  await page.getByRole('button', { name: 'Keep looking' }).click();
  await expect(page.locator('#journal-count')).toHaveText('3');
  await page.getByRole('button', { name: 'Back to the world', exact: true }).click();
  await page.reload();
  await expect(page.locator('#loading-screen')).toBeHidden();
  await expect(page.locator('#journal-count')).toHaveText('3');
  await page.getByRole('button', { name: /Field journal, 3/ }).click();
  await page.screenshot({ animations: 'disabled', path: 'test-results/journal.png' });
  await page.getByRole('button', { name: /Perhaps we should call it Ocean/ }).click();
  await expect(page.locator('#journal-count')).toHaveText('3');
  await page.keyboard.press('Escape');
  await expect(page.locator('#discovery-dialog')).toBeHidden();
});

test('camera controls, sound, quiet mode, and rapid destination changes work', async ({ page }) => {
  await ready(page);
  const canvas = page.locator('canvas');
  await page.getByRole('button', { name: 'Move closer', exact: true }).click();
  await page.getByRole('button', { name: 'Move farther away', exact: true }).click();
  await canvas.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Resume rotation' })).toBeVisible();
  await page.keyboard.press('f');
  await expect(page.locator('body')).toHaveClass(/quiet/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/quiet/);
  await page.getByRole('button', { name: 'Enable ambient sound' }).click();
  await expect(page.getByRole('button', { name: 'Mute ambient sound' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mute ambient sound' }).click();
  await page.getByRole('button', { name: 'Travel to Mercury', exact: true }).click();
  await page.getByRole('button', { name: 'Travel to Venus', exact: true }).click();
  await page.getByRole('button', { name: 'Travel to Earth', exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/travelling/);
  await expect(page.locator('#planet-title')).toHaveText('Earth.');
});

test('mobile layout, direct destination links, and reduced motion remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page, '#venus');
  await expect(page.locator('#planet-title')).toHaveText('Venus.');
  await expect(page.getByRole('button', { name: 'Resume rotation' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/mobile-venus.png' });
  await expect(page.locator('body')).not.toHaveClass(/travelling/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Look a little closer', exact: true }).click();
  await expect(page.locator('#discovery-dialog')).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/mobile-discovery.png' });
  await page.getByRole('button', { name: 'Close discovery', exact: true }).click();
  await arrive(page, 'Earth');
  await page.screenshot({ animations: 'disabled', path: 'test-results/mobile-earth.png' });
  await page.getByRole('button', { name: 'Solar map', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: 'test-results/mobile-map.png' });
  await page.getByRole('button', { name: 'Fly to Mercury', exact: true }).click();
  await expect(page.locator('#planet-title')).toHaveText('Mercury.');
});

test('damaged journal storage does not prevent exploration', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('starforge-journal-v1', '{broken'));
  await ready(page);
  await expect(page.locator('#journal-count')).toHaveText('0');
  await page.getByRole('button', { name: 'Look a little closer', exact: true }).click();
  await expect(page.locator('#journal-count')).toHaveText('1');
});

test('a world can be picked directly in 3D and its visible markers open discoveries', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Solar map', exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/travelling/);
  // The Sun is at the composed map origin, taking the camera's framing offset into account.
  await page.mouse.click(1440 * 0.655, 1000 * 0.455);
  await expect(page.locator('#planet-title')).toHaveText('The Sun.');
  await expect(page.locator('body')).not.toHaveClass(/travelling/);
  await page.getByRole('button', { name: 'Discover: An extraordinary pull', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'A star, holding us together' })).toBeVisible();
  await expect(page.locator('#journal-count')).toHaveText('1');
});

test('missing texture and unavailable WebGL show useful recovery states', async ({ page }) => {
  await page.route('**/textures/earth-day.jpg', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#render-error')).toBeVisible();
  await expect(page.locator('#render-error-message')).toContainText('planetary map could not be loaded');
  await page.unroute('**/textures/earth-day.jpg');
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl2') return null;
      return getContext.call(this, type, ...args);
    };
  });
  await page.reload();
  await expect(page.locator('#render-error-message')).toContainText('needs WebGL');
});
