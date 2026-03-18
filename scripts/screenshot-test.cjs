const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DIR = path.join(process.env.USERPROFILE, 'Desktop', 'klario-test');
fs.mkdirSync(DIR, { recursive: true });
console.log('Saving screenshots to:', DIR);

let n = 0;

async function shot(page, name) {
  n++;
  const p = path.join(DIR, n.toString().padStart(2, '0') + '-' + name + '.png');
  await page.screenshot({ path: p });
  console.log('  📸', path.basename(p));
  return p;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Login
  console.log('\n--- Login ---');
  await page.goto('https://klario-alpha.vercel.app/login');
  await page.fill('input[type="email"]', 'carellativio@gmail.com');
  await page.fill('input[type="password"]', '08-Titi2008');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await shot(page, 'dashboard');
  console.log('✓ Logged in');

  // New site
  console.log('\n--- Create site ---');
  await page.click('text=Nouveau site');
  await page.waitForURL('**/sites/new', { timeout: 10000 });
  await shot(page, 'form');
  await page.fill('textarea', 'La Bella Napoli, restaurant italien à Bévilard. Pizzas au feu de bois, pâtes fraîches maison, tiramisu. Couleurs rouge et vert. Ouvert depuis 2008. Tel : +41 32 491 23 45. WhatsApp dispo.');
  await shot(page, 'form-filled');
  await page.click('button:has-text("Générer")');
  await shot(page, 'generating');

  // Wait for editor
  console.log('Waiting for AI generation...');
  await page.waitForURL('**/sites/**/edit', { timeout: 70000 });
  await page.waitForLoadState('networkidle');
  await shot(page, 'editor');
  console.log('✓ Editor loaded');

  // Preview mode
  console.log('\n--- Preview ---');
  await page.locator('button:has-text("Aperçu")').first().click();
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'preview-hero');

  for (let i = 1; i <= 6; i++) {
    await page.evaluate((offset) => window.scrollTo(0, offset * 900), i);
    await page.waitForTimeout(800);
    await shot(page, 'preview-section' + i);
  }

  await browser.close();
  console.log('\n✓ Done! Open folder:', DIR);
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
