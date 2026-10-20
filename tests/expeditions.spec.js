import { test, expect } from '@playwright/test';
import * as THREE from 'three';
import { buildTerrain } from '../src/expeditions/terrain.js';
import { expeditions, earthAtmosphere } from '../src/expeditions/catalog.js';

async function orbit(page,id='earth',reduced=true) {
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.goto(`/#${id}`);
  await expect(page.locator('#app')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#loading-screen')).toBeHidden();
}

async function enter(page) {
  await page.locator('#enter-world').click();
  await expect(page.locator('#expedition')).toBeVisible();
  await expect(page.locator('#entry-veil')).toBeHidden();
}

for(const id of ['earth','mercury','venus','sun']) {
  test(`${id}: explorable environment renders and returns to its orbital context`,async({page})=>{
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await orbit(page,id);
    if(id==='earth')await page.getByRole('button',{name:'After dark',exact:true}).click();
    await enter(page);
    await expect(page.locator('#exp-reference')).not.toBeEmpty();
    await page.screenshot({animations:'disabled',path:`test-results/field-${id}.png`});
    if(id==='sun') {
      await expect(page.getByRole('button',{name:'Walk',exact:true})).toBeHidden();
      await page.getByRole('button',{name:'Filtered light',exact:true}).click();
      await expect(page.locator('#exp-solar-filter')).toHaveAttribute('aria-pressed','true');
    } else {
      await page.getByRole('button',{name:'Walk',exact:true}).click();
      await expect(page.locator('#expedition')).toHaveAttribute('data-mode','walk');
      await expect.poll(async()=>Number(await page.locator('#expedition').getAttribute('data-clearance'))).toBeGreaterThanOrEqual(2.09);
      await page.screenshot({animations:'disabled',path:`test-results/ground-${id}.png`});
    }
    await page.getByRole('button',{name:'Follow a signal'}).click();
    await page.locator('.exp-route-option').nth(2).click();
    await expect(page.locator('#exp-nearby')).toBeVisible();
    await page.getByRole('button',{name:'Observe',exact:true}).click();
    await expect(page.locator('#field-note-title')).toHaveText(expeditions[id].landmarks[2].title);
    await page.getByRole('button',{name:'Keep exploring',exact:true}).click();
    if(id==='earth'||id==='venus') await page.screenshot({animations:'disabled',path:`test-results/clouds-${id}.png`});
    await page.locator('#exp-evidence').click();
    await expect(page.locator('#environment-dialog')).toBeVisible();
    await expect(page.locator('#environment-source')).toHaveAttribute('href',expeditions[id].source);
    await page.getByRole('button',{name:'Close environment information'}).click();
    await page.getByRole('button',{name:'Return to orbit'}).click();
    await expect(page.locator('#expedition')).toBeHidden();
    await expect(page.locator('#planet-title')).toHaveText(`${id==='sun'?'The Sun':id[0].toUpperCase()+id.slice(1)}.`);
    if(id==='earth')await expect(page.getByRole('button',{name:'After dark',exact:true})).toHaveAttribute('aria-pressed','true');
    expect(errors).toEqual([]);
  });
}

test('a guided signal leads to an observation that persists in the journal',async({page})=>{
  await orbit(page);await enter(page);
  await page.getByRole('button',{name:'Follow a signal'}).click();
  await page.locator('.exp-route-option').first().click();
  await expect(page.locator('#exp-nearby')).toBeVisible();
  await page.getByRole('button',{name:'Observe',exact:true}).click();
  await expect(page.locator('#field-note-title')).toHaveText('A planet in motion');
  await expect(page.locator('#journal-count')).toHaveText('1');
  await page.getByRole('button',{name:'Keep exploring',exact:true}).click();
  await page.getByRole('button',{name:'Return to orbit'}).click();
  await page.reload();await expect(page.locator('#loading-screen')).toBeHidden();
  await page.getByRole('button',{name:/Field journal, 1/}).click();
  await page.locator('[data-field-body="earth"]').click();
  await expect(page.locator('#field-note-title')).toHaveText('A planet in motion');
  await expect(page.locator('#journal-count')).toHaveText('1');
});

test('keyboard motion, controlled landing, and mobile navigation work',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await orbit(page,'mercury');await enter(page);
  const before=Number(await page.locator('#expedition').getAttribute('data-z'));
  await page.keyboard.down('KeyW');await page.waitForTimeout(800);await page.keyboard.up('KeyW');
  await expect.poll(async()=>Number(await page.locator('#expedition').getAttribute('data-z'))).toBeLessThan(before-1);
  await page.getByRole('button',{name:'Walk',exact:true}).click();
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','walk');
  await page.locator('canvas').focus();await page.keyboard.press('Space');
  await expect.poll(async()=>Number(await page.locator('#expedition').getAttribute('data-clearance'))).toBeGreaterThan(2.5);
  await page.screenshot({animations:'disabled',path:'test-results/field-mobile.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Follow a signal'}).click();
  await expect(page.locator('#exp-route')).toBeVisible();
  await page.screenshot({animations:'disabled',path:'test-results/field-mobile-menu.png'});
  await page.keyboard.press('Escape');await expect(page.locator('#expedition')).toBeHidden();
});

test('animated Venus entry, cloud flight, landing, and re-entry stay controllable',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await orbit(page,'venus',false);await enter(page);
  await expect(page.locator('#exp-transit')).toBeVisible();
  await page.getByRole('button',{name:/Skip flight/}).click();
  await expect(page.locator('#exp-transit')).toBeHidden();
  await expect.poll(async()=>Number(await page.locator('#expedition').getAttribute('data-y'))).toBeLessThan(1000);
  await page.locator('#exp-layer').click();
  await expect(page.locator('#exp-transit')).toBeVisible();
  await expect(page.locator('#exp-transit')).toBeHidden();
  await expect.poll(async()=>Number(await page.locator('#expedition').getAttribute('data-y'))).toBeCloseTo(58000,0);
  await expect(page.locator('#exp-medium')).toContainText('CLOUD');
  await page.locator('#exp-layer').click();
  await page.getByRole('button',{name:/Skip flight/}).click();
  await page.getByRole('button',{name:'Walk',exact:true}).click();
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','walk');
  await page.getByRole('button',{name:'Return to orbit'}).click();
  await enter(page);
  await page.getByRole('button',{name:/Skip flight/}).click();
  await page.getByRole('button',{name:'Return to orbit'}).click();
  await expect(page.locator('#expedition')).toBeHidden();
  expect(errors).toEqual([]);
});

test('rendered terrain and collision agree on asymmetric and distant samples',()=>{
  for(const id of ['earth','mercury','venus']) {
    const terrain=buildTerrain(id,expeditions[id],64);
    terrain.mesh.updateMatrixWorld();
    const ray=new THREE.Raycaster();
    for(const [x,z] of [[23,19],[-245,-170],[490,-310],[1540,-2100],[3100,2500],[-4500,-3820]]) {
      ray.set(new THREE.Vector3(x,5000,z),new THREE.Vector3(0,-1,0));
      const hit=ray.intersectObject(terrain.mesh)[0];
      expect(hit).toBeDefined();
      expect(Math.abs(hit.point.y-terrain.heightAt(x,z))).toBeLessThan(.002);
    }
    terrain.mesh.geometry.dispose();terrain.mesh.material.dispose();
  }
  const sea=earthAtmosphere(0),high=earthAtmosphere(6000);
  expect(sea.pressureKPa).toBeGreaterThan(100);expect(sea.pressureKPa).toBeLessThan(103);
  expect(high.pressureKPa).toBeLessThan(sea.pressureKPa);
  expect(high.density).toBeLessThan(sea.density);
});
