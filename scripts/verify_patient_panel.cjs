const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, '..', 'public', 'screenshots_verified');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🚀 Launching Chrome to verify Patient Portal...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Visit Patient Portal directly with session query param
  console.log('Navigating to Patient Portal with ?session=QC-DEMO ...');
  await page.goto('http://localhost:3000/?session=QC-DEMO', { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Take screenshot 1: Patient Boarding Pass with Map Outside
  console.log('Capturing Screenshot 1: Patient Journey & Floor Map Outside...');
  await page.screenshot({ path: path.join(OUT_DIR, '01_patient_journey_and_map_outside.png'), fullPage: false });

  // 2. Click "Indoor Floor Map" tab
  console.log('Capturing Screenshot 2: Indoor Floor Map Tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const mapBtn = buttons.find(b => b.textContent.includes('Floor Map') || b.textContent.includes('फ्लोर'));
    if (mapBtn) mapBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT_DIR, '02_indoor_floor_map_tab.png'), fullPage: false });

  // 3. Click "Prescriptions & Rx" tab
  console.log('Capturing Screenshot 3: Digital Prescriptions & Medications Tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const rxBtn = buttons.find(b => b.textContent.includes('Prescriptions') || b.textContent.includes('प्रिस्क्रिप्शन'));
    if (rxBtn) rxBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT_DIR, '03_patient_prescriptions_rx.png'), fullPage: false });

  // 4. Click "Show Chemist QR"
  console.log('Capturing Screenshot 4: Chemist Instant Scan Protocol...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const chemistBtn = buttons.find(b => b.textContent.includes('Show Chemist QR'));
    if (chemistBtn) chemistBtn.click();
  });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '04_chemist_qr_dispense_modal.png'), fullPage: false });

  // 5. Click "Digital Health Card" in the top bar
  console.log('Capturing Screenshot 5: Digital Health Card Pass...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const cardBtn = buttons.find(b => b.textContent.includes('Digital Health Card'));
    if (cardBtn) cardBtn.click();
  });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '05_digital_health_card_modal.png'), fullPage: false });

  // Close health card modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[class*="rounded-full bg-slate-200"]');
    if (closeBtn) closeBtn.click();
  });
  await sleep(600);

  // 6. Click "Vitals & History" tab
  console.log('Capturing Screenshot 6: Vitals & History Timeline Tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const histBtn = buttons.find(b => b.textContent.includes('Vitals') || b.textContent.includes('वाइ'));
    if (histBtn) histBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT_DIR, '06_vitals_and_history_timeline.png'), fullPage: false });

  console.log('✅ All workflow screenshots captured successfully in public/screenshots_verified!');
  await browser.close();
}

run().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
