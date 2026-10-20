import {test,expect} from '@playwright/test';
import {waterHeight} from '../src/expeditions/earth-profile.js';

async function earth(page,night=false){
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#earth');
  await expect(page.locator('#app')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#loading-screen')).toBeHidden();
  if(night)await page.getByRole('button',{name:'After dark',exact:true}).click();
  await page.getByRole('button',{name:'Enter this world',exact:true}).click();
  await expect(page.locator('#expedition')).toBeVisible();
  await expect(page.locator('#entry-veil')).toBeHidden();
}
async function follow(page,index){
  await page.getByRole('button',{name:'Follow a signal'}).click();
  await page.locator('.exp-route-option').nth(index).click();
  await expect(page.locator('#exp-transit')).toBeHidden();
}

for(const night of [false,true])test(`${night?'night':'day'} ocean: dive, marine discoveries, underwater light, and resurface`,async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await earth(page,night);
  await expect(page.locator('#expedition')).toHaveAttribute('data-night',String(night));
  await page.screenshot({path:`test-results/ocean-${night?'night':'day'}-coast.png`});
  await page.getByRole('button',{name:'Dive into the sea',exact:true}).click();
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','swim');
  await expect(page.locator('#exp-altitude-label')).toHaveText('BELOW THE WAVES');
  await page.screenshot({path:`test-results/ocean-${night?'night':'day'}-school.png`});
  if(!night){
    await follow(page,4);
    await page.screenshot({path:'test-results/ocean-day-garden.png'});
    await page.mouse.move(700,650);await page.mouse.down();await page.mouse.move(700,275,{steps:8});await page.mouse.up();
    await page.screenshot({path:'test-results/ocean-day-looking-up.png'});
  }
  await follow(page,5);
  await page.screenshot({path:`test-results/ocean-${night?'night':'day'}-jellies.png`});
  await page.getByRole('button',{name:'Observe',exact:true}).click();
  await expect(page.locator('#field-note-title')).toHaveText('A little living light');
  await page.getByRole('button',{name:'Keep exploring',exact:true}).click();
  await page.getByRole('button',{name:'Observer light · on',exact:true}).click();
  await expect(page.locator('#exp-lamp')).toHaveAttribute('aria-pressed','false');
  await page.screenshot({path:`test-results/ocean-${night?'night':'day'}-unlit.png`});
  await page.getByRole('button',{name:'Return to the surface',exact:true}).click();
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','glide');
  await expect(page.locator('#expedition')).toHaveAttribute('data-night',String(night));
  await page.screenshot({path:`test-results/ocean-${night?'night':'day'}-surface.png`});
  await page.getByRole('button',{name:'Return to orbit'}).click();
  if(night)await expect(page.getByRole('button',{name:'After dark',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(errors).toEqual([]);
});

test('water queries are continuous and bounded at nearby surface crossings',()=>{
  for(const [x,z,t] of [[-225,180,0],[-280,145,15],[-950,-400,120]]){
    expect(Math.abs(waterHeight(x,z,t))).toBeLessThan(.4);
    expect(Math.abs(waterHeight(x,z,t+.001)-waterHeight(x,z,t))).toBeLessThan(.002);
  }
});

test('flight and swimming share speed, free ascent works, and mobile controls fit',async({page})=>{
  test.setTimeout(60000);
  await page.setViewportSize({width:390,height:844});
  await earth(page,true);
  await page.keyboard.down('KeyW');
  await expect.poll(async()=>Number(await page.locator('#expedition').getAttribute('data-speed'))).toBeGreaterThan(26.5);
  const flightSpeed=Number(await page.locator('#expedition').getAttribute('data-speed'));
  await page.keyboard.up('KeyW');
  await page.getByRole('button',{name:'Dive into the sea',exact:true}).click();
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','swim');
  await page.keyboard.down('KeyD');
  await expect.poll(async()=>Number(await page.locator('#expedition').getAttribute('data-speed'))).toBeGreaterThan(26.5);
  const swimSpeed=Number(await page.locator('#expedition').getAttribute('data-speed'));
  await page.keyboard.up('KeyD');
  expect(Math.abs(flightSpeed-swimSpeed)).toBeLessThan(.5);
  await follow(page,5);
  await page.getByRole('button',{name:'Observer light · on',exact:true}).click();
  await expect(page.locator('#exp-lamp')).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Observer light · off',exact:true}).click();
  await expect(page.locator('#exp-lamp')).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:'test-results/ocean-mobile-jellies.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const rise=page.getByRole('button',{name:'Rise',exact:true});
  const bounds=await rise.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','glide');
  await page.mouse.up();
  await page.getByRole('button',{name:'Return to orbit'}).click();
  await page.getByRole('button',{name:'Enter this world',exact:true}).click();
  await expect(page.locator('#expedition')).toHaveAttribute('data-night','true');
});

test('animated night journey crosses the water freely with sound enabled',async({page})=>{
  test.setTimeout(75000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/#earth');
  await expect(page.locator('#loading-screen')).toBeHidden();
  await page.getByRole('button',{name:'After dark',exact:true}).click();
  await page.getByRole('button',{name:'Enable ambient sound',exact:true}).click();
  await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Enter this world',exact:true}).click();
  await expect(page.locator('#expedition')).toBeVisible({timeout:25000});
  await expect(page.locator('#entry-veil')).toBeHidden();
  await page.getByRole('button',{name:/Skip flight/}).click();
  await page.screenshot({path:'test-results/ocean-night-arrival.png'});
  await page.getByRole('button',{name:'Dive into the sea',exact:true}).click();
  await expect(page.locator('#exp-transit')).toBeHidden();
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','swim');
  const firstDepth=Number(await page.locator('#expedition').getAttribute('data-depth'));
  await expect.poll(async()=>Math.abs(Number(await page.locator('#expedition').getAttribute('data-depth'))-firstDepth)).toBeGreaterThan(.025);
  await page.keyboard.down('KeyE');
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','glide');
  await page.keyboard.up('KeyE');
  await page.keyboard.down('KeyQ');
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','swim');
  await page.keyboard.up('KeyQ');
  await follow(page,5);
  await page.screenshot({path:'test-results/ocean-night-animated.png'});
  await page.getByRole('button',{name:'Mute ambient sound',exact:true}).click();
  await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Return to the surface',exact:true}).click();
  await expect(page.locator('#exp-transit')).toBeHidden();
  await expect(page.locator('#expedition')).toHaveAttribute('data-mode','glide');
  await page.getByRole('button',{name:'Return to orbit'}).click();
  await expect(page.getByRole('button',{name:'After dark',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(errors).toEqual([]);
});
