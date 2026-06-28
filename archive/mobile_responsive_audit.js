/**
 * Prizom Mobile Responsive & Navigation QA Audit Tool
 * Audits all pages for mobile compatibility, clipping, scroll leaks, and z-index overlaps.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PORT = 3000;
const SITE_URL = `http://localhost:${PORT}`;

const VIEWPORTS = [
  { width: 320, height: 568, name: 'iPhone SE' },
  { width: 360, height: 800, name: 'Galaxy S20' },
  { width: 375, height: 812, name: 'iPhone X/11' },
  { width: 390, height: 844, name: 'iPhone 13/14' },
  { width: 414, height: 896, name: 'iPhone XR/11 Pro Max' },
  { width: 430, height: 932, name: 'iPhone 14/15 Pro Max' },
  { width: 768, height: 1024, name: 'iPad Mini' },
  { width: 820, height: 1180, name: 'iPad Air' },
  { width: 1024, height: 1366, name: 'iPad Pro' }
];

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Discover', path: '/discover' },
  { name: 'Trending', path: '/trending' },
  { name: 'Search', path: '/discover?q=cyberpunk' },
  { name: 'Create Prompt', path: '/create' },
  { name: 'Settings', path: '/settings' },
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' }
];

// Helper to check if Puppeteer is installed
function ensurePuppeteer() {
  try {
    require('puppeteer');
    console.log('Puppeteer is already installed.');
  } catch (err) {
    console.log('Puppeteer not found. Installing locally...');
    execSync('npm install --no-save puppeteer', { stdio: 'inherit' });
  }
}

// Find local Chrome executable path on Windows
function getChromePath() {
  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function runAudit() {
  ensurePuppeteer();
  const puppeteer = require('puppeteer');

  const chromePath = getChromePath();
  if (chromePath) {
    console.log(`Using Chrome at: ${chromePath}`);
  } else {
    console.log('Chrome not found in standard paths. Launching default Puppeteer browser.');
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath || undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditResults = [];
  const consoleErrors = [];

  for (const pageInfo of PAGES) {
    console.log(`\nAuditing page: ${pageInfo.name} (${pageInfo.path})`);
    
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });

      // Track console errors
      page.on('pageerror', err => {
        consoleErrors.push({ page: pageInfo.name, viewport: vp.width, error: err.message });
      });

      try {
        await page.goto(`${SITE_URL}${pageInfo.path}`, { waitUntil: 'networkidle2', timeout: 45000 });
        
        // Let animations/render settle
        await new Promise(resolve => setTimeout(resolve, 800));

        // Evaluate layout metrics
        const metrics = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const hasOverflow = scrollWidth > clientWidth;

          // Check if notice/announcement banners exist and overlap Navbar
          const banners = Array.from(document.querySelectorAll('[id*="banner"], [class*="banner"]'));
          const navbar = document.querySelector('nav');
          let bannerOverlap = false;

          if (navbar && banners.length > 0) {
            const navRect = navbar.getBoundingClientRect();
            banners.forEach(b => {
              const bRect = b.getBoundingClientRect();
              // Check if banner overlaps navigation coordinates
              if (bRect.top < navRect.bottom && bRect.bottom > navRect.top) {
                // If banner has a z-index overlaying navbar
                const navZ = parseInt(window.getComputedStyle(navbar).zIndex) || 0;
                const bZ = parseInt(window.getComputedStyle(b).zIndex) || 0;
                if (bZ >= navZ) bannerOverlap = true;
              }
            });
          }

          // Check for clipped elements (hidden because of overflow)
          const clippedElements = [];
          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.overflowX === 'hidden' || style.overflowY === 'hidden') return;
            if (el.scrollWidth > el.clientWidth && el.clientWidth > 0 && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
              clippedElements.push({
                tag: el.tagName,
                id: el.id,
                class: el.className.substring(0, 50),
                scroll: el.scrollWidth,
                client: el.clientWidth
              });
            }
          });

          return {
            scrollWidth,
            clientWidth,
            hasOverflow,
            bannerOverlap,
            clippedElementsCount: clippedElements.length,
            clippedElements: clippedElements.slice(0, 5)
          };
        });

        // Test Hamburger Menu and search overlay triggers on mobile viewports (< 768px)
        let menuAudit = { opened: false, searchVisible: false, buttonsVisible: false };
        if (vp.width < 768) {
          // Find and click hamburger menu trigger
          const hamburger = await page.$('button[aria-label="Toggle Navigation Menu"]');
          if (hamburger) {
            await hamburger.click();
            await new Promise(resolve => setTimeout(resolve, 800)); // wait for open animation
            
            menuAudit = await page.evaluate(() => {
              // Locate mobile drawer panel specifically by finding the portal container
              const panels = Array.from(document.body.querySelectorAll('.pointer-events-auto'));
              // The mobile drawer is a .pointer-events-auto panel containing links like "Discover"
              const drawer = panels.find(p => p.textContent.includes('Discover') && p.textContent.includes('Trending'));
              if (!drawer) return { opened: false, searchVisible: false, buttonsVisible: false };

              // Find search input inside drawer
              const searchInput = drawer.querySelector('input[placeholder*="Search"]');
              const searchVisible = searchInput ? (searchInput.getBoundingClientRect().height > 0 && searchInput.getBoundingClientRect().width > 0) : false;

              // Check visibility of menu action buttons inside drawer
              const links = Array.from(drawer.querySelectorAll('a, button'));
              const actionButtons = links.filter(l => 
                l.textContent.includes('Log in') || 
                l.textContent.includes('Sign up') || 
                l.textContent.includes('Log Out') ||
                l.textContent.includes('Create')
              );
              
              const buttonsVisible = actionButtons.length > 0 && actionButtons.every(btn => {
                const rect = btn.getBoundingClientRect();
                return rect.height > 0 && rect.width > 0 && rect.top <= window.innerHeight;
              });

              return {
                opened: true,
                searchVisible,
                buttonsVisible
              };
            });

            // Close menu
            await hamburger.click();
          }
        }

        auditResults.push({
          page: pageInfo.name,
          viewportWidth: vp.width,
          viewportName: vp.name,
          hasOverflow: metrics.hasOverflow,
          scrollWidth: metrics.scrollWidth,
          clientWidth: metrics.clientWidth,
          bannerOverlap: metrics.bannerOverlap,
          clippedElementsCount: metrics.clippedElementsCount,
          menuAudit
        });

        console.log(`    ${vp.name} (${vp.width}px): ${metrics.hasOverflow ? '❌ OVERFLOW' : '✅ OK'} | Clipped elements: ${metrics.clippedElementsCount} | Menu search: ${menuAudit.searchVisible ? 'OK' : 'FAIL'}`);

      } catch (err) {
        console.error(`    ❌ Error auditing ${pageInfo.name} at ${vp.width}px:`, err.message);
        auditResults.push({
          page: pageInfo.name,
          viewportWidth: vp.width,
          viewportName: vp.name,
          error: err.message
        });
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  // Write results to disk
  fs.writeFileSync('d:\\Prizom\\scratch\\responsive_audit_results.json', JSON.stringify({ auditResults, consoleErrors }, null, 2));

  // Build markdown report
  let report = `# Prizom Mobile QA Layout Audit Report

This report presents PASS/FAIL metrics across viewports ranging from 320px to 1024px.

---

## 🏁 Summary Table

| Page | Viewport | Width | Overflow Status | Banner Overlap | Menu Search | Action Buttons | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
`;

  auditResults.forEach(r => {
    const overflowIcon = r.hasOverflow ? '❌ FAIL' : '✅ PASS';
    const overlapIcon = r.bannerOverlap ? '❌ FAIL' : '✅ PASS';
    const searchStatus = r.viewportWidth >= 768 ? 'N/A' : (r.menuAudit?.searchVisible ? '✅ PASS' : '❌ FAIL');
    const buttonStatus = r.viewportWidth >= 768 ? 'N/A' : (r.menuAudit?.buttonsVisible ? '✅ PASS' : '❌ FAIL');
    
    const isSuccess = !r.hasOverflow && !r.bannerOverlap && (r.viewportWidth >= 768 || (r.menuAudit?.searchVisible && r.menuAudit?.buttonsVisible));
    const pageStatus = isSuccess ? '✅ PASS' : '❌ FAIL';

    report += `| ${r.page} | ${r.viewportName} | ${r.viewportWidth}px | ${overflowIcon} | ${overlapIcon} | ${searchStatus} | ${buttonStatus} | **${pageStatus}** |\n`;
  });

  report += `\n\n## ⚠️ Captured Console Errors: ${consoleErrors.length}\n`;
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(err => {
      report += `- **Page**: ${err.page} (${err.viewport}px) | **Error**: \`${err.error}\`\n`;
    });
  } else {
    report += `\n✅ Zero console runtime errors detected across all viewports.\n`;
  }

  const targetReportDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\fef0b42a-71a6-43a2-a7c4-61b48c61a023';
  if (!fs.existsSync(targetReportDir)) {
    fs.mkdirSync(targetReportDir, { recursive: true });
  }
  fs.writeFileSync(path.join(targetReportDir, 'mobile_responsive_audit_report.md'), report);
  fs.writeFileSync('d:\\Prizom\\scratch\\mobile_responsive_audit_report.md', report);
  console.log(`\nAudit completed successfully. Report written to mobile_responsive_audit_report.md`);
}

runAudit().catch(err => {
  console.error('Audit run failed with exception:', err);
  process.exit(1);
});
