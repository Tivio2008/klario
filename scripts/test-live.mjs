import { chromium } from 'playwright';

const EMAIL = 'carellativio@gmail.com';
const PASSWORD = process.argv[2];
const BASE = 'https://klario-alpha.vercel.app';
const SCREENSHOTS = 'C:\klario\screenshots';

import { mkdirSync } from 'fs';
mkdirSync(SCREENSHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function shot(name) {
  await page.screenshot({ path: `${SCREENSHOTS}/${name}.png`, fullPage: false });
  console.log(`📸 ${name}`);
}

// 1. Login
console.log('Logging in...');
await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await shot('01-login');
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/dashboard`, { timeout: 15000 });
await shot('02-dashboard');
console.log('✓ Logged in, dashboard loaded');

// 2. Create new site
console.log('Creating new site...');
await page.click('text=Nouveau site');
await page.waitForURL('**/sites/new', { timeout: 10000 });
await shot('03-new-site-form');

// Fill prompt
const prompt = `La Bella Napoli est un restaurant italien authentique à Bévilard. Pizzas artisanales au feu de bois, pâtes fraîches maison, tiramisu de la famille Rossi. Ambiance chaleureuse, couleurs rouge et vert. Ouvert depuis 2008. Tél : +41 32 491 23 45. WhatsApp disponible. Réservations acceptées.`;
await page.fill('textarea', prompt);
await shot('04-prompt-filled');

// Submit
await page.click('button:has-text("Générer mon site")');
console.log('Generating site (waiting up to 60s)...');
await shot('05-generating');

// Wait for redirect to editor
await page.waitForURL('**/sites/**/edit', { timeout: 70000 });
await page.waitForLoadState('networkidle');
await shot('06-editor');
console.log('✓ Editor loaded');

// Preview mode
await page.click('button:has-text("Aperçu"), button:has-text("Aperçu")');
await page.waitForTimeout(1000);
await shot('07-preview-top');

// Scroll through the site
for (let i = 1; i <= 6; i++) {
  await page.evaluate((n) => window.scrollTo(0, n * 900), i);
  await page.waitForTimeout(600);
  await shot(`08-scroll-${i}`);
}

await browser.close();
console.log('\n✓ Done — screenshots saved to scripts/screenshots/');
