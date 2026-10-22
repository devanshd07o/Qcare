const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const OUT_DIR = 'd:\\LetsCode\\My_Project\\Q-care\\public\\workflow_ss';
const ARTIFACT_DIR = 'C:\\Users\\devan\\.gemini\\antigravity\\brain\\63c18f0a-9a62-41cf-92d0-88ff8e1f7477';

function copyToArtifact(fileName) {
  const src = path.join(OUT_DIR, fileName);
  const dest = path.join(ARTIFACT_DIR, fileName);
  try {
    fs.copyFileSync(src, dest);
  } catch (err) {
    console.error(`Failed to copy ${fileName}:`, err.message);
  }
}

async function run() {
  console.log('Launching browser with:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Visit Auth Screen
  console.log('Step 1: Navigating to http://localhost:3000/?demo=1 ...');
  await page.goto('http://localhost:3000/?demo=1', { waitUntil: 'networkidle2' });
  await sleep(1500);

  const authFile = '01_login_auth_screen.png';
  await page.screenshot({ path: path.join(OUT_DIR, authFile) });
  copyToArtifact(authFile);
  console.log('Captured:', authFile);

  // Auto-fill demo credentials
  console.log('Clicking demo fill & signing in as Doctor...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const demo = btns.find(b => b.textContent.includes('Fill demo') || b.textContent.includes('Demo'));
    if (demo) (demo).click();
  });
  await sleep(800);

  // Click Submit button to enter Doctor Portal
  await page.evaluate(() => {
    const submit = document.querySelector('button[type="submit"]');
    if (submit) (submit).click();
  });
  await sleep(2000);

  const docInitFile = '02_doctor_portal_initial.png';
  await page.screenshot({ path: path.join(OUT_DIR, docInitFile) });
  copyToArtifact(docInitFile);
  console.log('Captured:', docInitFile);

  // Step 2: Fill patient registration form
  console.log('Step 2: Registering patient Vikram Malhotra...');
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(inp => {
      const ph = (inp.placeholder || '').toLowerCase();
      if (ph.includes('full name') || ph.includes('name')) {
        inp.value = 'Vikram Malhotra';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (ph.includes('age')) {
        inp.value = '42';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (ph.includes('10-digit') || ph.includes('mobile') || ph.includes('phone')) {
        inp.value = '9876543210';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = 'Acute chest pressure radiating to left arm, palpitations, routine cardiac profile';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Click test cards (CBC, FBS, ECG)
    const testCards = Array.from(document.querySelectorAll('.dp-test, [role="checkbox"]'));
    if (testCards.length > 0) testCards[0].click();
    if (testCards.length > 1) testCards[1].click();
    if (testCards.length > 2) testCards[2].click();
  });

  await sleep(1000);
  const docFilledFile = '03_doctor_registration_filled.png';
  await page.screenshot({ path: path.join(OUT_DIR, docFilledFile) });
  copyToArtifact(docFilledFile);
  console.log('Captured:', docFilledFile);

  // Step 3: Click "Register & issue pass" button
  console.log('Step 3: Generating Thermal Pass...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const regBtn = buttons.find(b => b.textContent.toLowerCase().includes('register & issue pass') || b.textContent.toLowerCase().includes('issue pass'));
    if (regBtn) regBtn.click();
  });

  await sleep(2000);

  const slipFile = '04_thermal_qr_slip_generated.png';
  await page.screenshot({ path: path.join(OUT_DIR, slipFile) });
  copyToArtifact(slipFile);
  console.log('Captured:', slipFile);

  // Step 4: Open Live Patient Pass
  console.log('Step 4: Opening Live Patient Pass from slip...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const passBtn = buttons.find(b => b.textContent.toLowerCase().includes('open live patient pass') || b.textContent.toLowerCase().includes('patient pass'));
    if (passBtn) passBtn.click();
  });

  await sleep(2000);

  const patPassDesktop = '05_patient_boarding_pass_desktop.png';
  await page.screenshot({ path: path.join(OUT_DIR, patPassDesktop) });
  copyToArtifact(patPassDesktop);
  console.log('Captured:', patPassDesktop);

  // Capture Mobile View of Patient Boarding Pass
  console.log('Capturing mobile boarding pass (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await sleep(1200);
  const patPassMobile = '06_patient_boarding_pass_mobile.png';
  await page.screenshot({ path: path.join(OUT_DIR, patPassMobile) });
  copyToArtifact(patPassMobile);
  console.log('Captured:', patPassMobile);

  // Step 5: Switch to Lab Technician Portal via Auth Screen
  console.log('Step 5: Logging out and signing in to Lab Technician Workstation...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/?demo=1', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // Sign out if still logged in
  await page.evaluate(() => {
    const logoutBtn = document.querySelector('header button[title*="Sign out" i], header button:has(svg)');
    const buttons = Array.from(document.querySelectorAll('button'));
    const signout = buttons.find(b => b.textContent.toLowerCase().includes('sign out'));
    if (signout) signout.click();
  });
  await sleep(1000);

  // Click "Lab" tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const labTab = buttons.find(b => b.textContent.trim() === 'Lab' || b.textContent.includes('Lab'));
    if (labTab) labTab.click();
  });
  await sleep(800);

  // Click "Demo fill" on Lab form
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const demoBtn = buttons.find(b => b.textContent.includes('Demo fill') || b.textContent.includes('डेमो भरें'));
    if (demoBtn) demoBtn.click();
  });
  await sleep(800);

  // Click "Open Workstation"
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) (submitBtn).click();
  });
  await sleep(2000);

  const labFile = '07_lab_technician_workstation.png';
  await page.screenshot({ path: path.join(OUT_DIR, labFile) });
  copyToArtifact(labFile);
  console.log('Captured:', labFile);

  // Step 6: Lab calling token and completing test
  console.log('Step 6: Calling token in Lab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const callBtn = buttons.find(b => b.textContent.includes('Call') || b.textContent.includes('बुलाएं'));
    if (callBtn) callBtn.click();
  });
  await sleep(1500);

  // Complete test with findings
  console.log('Entering lab findings & completing test...');
  await page.evaluate(() => {
    // Fill textareas or inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(inp => {
      if (!inp.value) {
        inp.value = 'Normal';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = 'Sample verified. Cellular morphological indices normal.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const buttons = Array.from(document.querySelectorAll('button'));
    const completeBtn = buttons.find(b => b.textContent.includes('Complete') || b.textContent.includes('Submit Report') || b.textContent.includes('Upload Report'));
    if (completeBtn) completeBtn.click();
  });

  await sleep(2000);

  const labCompletedFile = '08_lab_completed_findings.png';
  await page.screenshot({ path: path.join(OUT_DIR, labCompletedFile) });
  copyToArtifact(labCompletedFile);
  console.log('Captured:', labCompletedFile);

  // Step 7: Back to Doctor Queue / Reports Ready view
  console.log('Step 7: Signing back as Doctor to check Live Queue & Reports Ready...');
  await page.goto('http://localhost:3000/?demo=1', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // Ensure Doctor tab is selected and fill demo
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const staffTab = buttons.find(b => b.textContent.trim() === 'Staff' || b.textContent.includes('Staff'));
    if (staffTab) staffTab.click();
  });
  await sleep(500);

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const demo = buttons.find(b => b.textContent.includes('Fill demo') || b.textContent.includes('Demo'));
    if (demo) (demo).click();
  });
  await sleep(500);

  await page.evaluate(() => {
    const submit = document.querySelector('button[type="submit"]');
    if (submit) (submit).click();
  });
  await sleep(2000);

  // Click on "Live Queue" in doctor portal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const queueBtn = buttons.find(b => b.textContent.includes('Live Queue') || b.textContent.includes('Queue'));
    if (queueBtn) queueBtn.click();
  });
  await sleep(1500);

  const docQueueFile = '09_doctor_live_queue_and_reports.png';
  await page.screenshot({ path: path.join(OUT_DIR, docQueueFile) });
  copyToArtifact(docQueueFile);
  console.log('Captured:', docQueueFile);

  console.log('ALL WORKFLOW STEPS CAPTURED SUCCESSFULLY!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during workflow capture:', err);
  process.exit(1);
});
