// --- Programmatic content script injection ---
const injectedTabs = new Set();
const EXPECTED_CONTENT_VERSION = 3;

async function ensureContentScriptInjected(tabId) {
  if (injectedTabs.has(tabId)) return true;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
      return false;
    }
  } catch (e) { return false; }

  // Check if content script is already present and up-to-date
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: "getPageMetadata" }).catch(() => null);
    if (response && response.title !== undefined && response._v === EXPECTED_CONTENT_VERSION) {
      injectedTabs.add(tabId);
      return true;
    }
    // Response exists but version is stale or missing — need to re-inject
  } catch (e) {
    // Not injected yet
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["html2canvas.min.js", "content.js"]
    });
    injectedTabs.add(tabId);
    return true;
  } catch (e) {
    console.warn('Could not inject content script into tab', tabId, e);
    return false;
  }
}

// Cleanup all injected tabs when side panel closes
window.addEventListener('beforeunload', () => {
  for (const tabId of injectedTabs) {
    try {
      chrome.tabs.sendMessage(tabId, { action: "cleanupAll" }).catch(() => {});
    } catch (e) { /* ignore */ }
  }
});

// --- Accordion Logic ---
document.querySelectorAll('.qc-accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const targetId = header.getAttribute('data-target');
    const body = document.getElementById(targetId);
    const arrow = header.querySelector('.qc-accordion-arrow');

    if (body.style.display === 'none') {
      body.style.display = 'block';
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
      body.style.display = 'none';
      if (arrow) arrow.style.transform = 'rotate(-90deg)';
    }
  });
});

document.querySelectorAll('.qc-accordion-arrow').forEach(arrow => {
  arrow.style.transform = 'rotate(-90deg)';
});

// --- Tab Switching ---
document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
    hidePageChangedBanner();
  });
});

// --- Page Change Banner ---
let currentTrackedUrl = null;

function showPageChangedBanner() {
  const banner = document.getElementById('page-changed-banner');
  if (banner) banner.style.display = 'flex';
}

function hidePageChangedBanner() {
  const banner = document.getElementById('page-changed-banner');
  if (banner) banner.style.display = 'none';
}

document.getElementById('dismiss-banner-btn').addEventListener('click', () => {
  hidePageChangedBanner();
});

async function updateCurrentTabInfo() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) {
    const newUrl = tab.url || '';
    if (currentTrackedUrl !== null && newUrl !== currentTrackedUrl) {
      showPageChangedBanner();
    }
    currentTrackedUrl = newUrl;
    await ensureContentScriptInjected(tab.id);
  }
}

// ============ SEO AUDIT ============

document.getElementById('run-seo-audit-btn').addEventListener('click', async () => {
  const btn = document.getElementById('run-seo-audit-btn');
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;

  btn.disabled = true;
  btn.textContent = 'Scanning...';

  const injected = await ensureContentScriptInjected(tab.id);
  if (!injected) {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; stroke: currentColor; stroke-width: 2; fill: none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Scan Page`;
    document.getElementById('seo-onpage-results').innerHTML = '<span style="color:#dc3545;">Unable to scan this page. Try refreshing the page first.</span>';
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "runSEOAudit" }, (data) => {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; stroke: currentColor; stroke-width: 2; fill: none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Scan Page`;

    if (chrome.runtime.lastError || !data) {
      document.getElementById('seo-onpage-results').innerHTML = '<span style="color:#dc3545;">Unable to scan this page.</span>';
      return;
    }

    const results = runSEOChecks(data);
    renderSEOResults(results, data);
  });
});

function seoItem(status, label, detail, action) {
  const colors = { pass: '#28a745', warn: '#ffc107', fail: '#dc3545' };
  const icons = { pass: '✓', warn: '!', fail: '✕' };
  const bgColors = { pass: '#e6f9ed', warn: '#fff8e1', fail: '#fde8e8' };
  const actionBtn = action === 'faq-tool'
    ? `<button onclick="goToFaqTool()" style="margin-top:4px;font-size:10px;padding:3px 10px;border:1px solid #007bff;border-radius:4px;background:#e7f1ff;color:#007bff;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
        <svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;fill:none;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
        Generate FAQ
      </button>` : '';
  return `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0;">
    <span style="flex-shrink:0;width:18px;height:18px;border-radius:50%;background:${bgColors[status]};color:${colors[status]};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">${icons[status]}</span>
    <div style="flex:1;min-width:0;">
      <div style="font-size:12px;font-weight:600;color:#212529;">${label}</div>
      <div style="font-size:11px;color:#6c757d;line-height:1.4;word-break:break-word;">${detail}</div>
      ${actionBtn}
    </div>
  </div>`;
}

function runSEOChecks(data) {
  const checks = [];

  // Title
  if (!data.title) {
    checks.push({ section: 'onpage', status: 'fail', label: 'Missing Page Title', detail: 'No &lt;title&gt; tag found.' });
  } else if (data.titleLength < 30) {
    checks.push({ section: 'onpage', status: 'warn', label: `Title Too Short (${data.titleLength} chars)`, detail: `"${data.title}". Aim for 50-60 characters.` });
  } else if (data.titleLength > 60) {
    checks.push({ section: 'onpage', status: 'warn', label: `Title Too Long (${data.titleLength} chars)`, detail: `"${data.title.substring(0, 60)}...". May be truncated in search results.` });
  } else {
    checks.push({ section: 'onpage', status: 'pass', label: `Title Length OK (${data.titleLength} chars)`, detail: `"${data.title}"` });
  }

  // Meta Description
  if (!data.metaDescription) {
    checks.push({ section: 'onpage', status: 'fail', label: 'Missing Meta Description', detail: 'No meta description tag found.' });
  } else if (data.metaDescriptionLength < 50) {
    checks.push({ section: 'onpage', status: 'warn', label: `Meta Description Too Short (${data.metaDescriptionLength} chars)`, detail: 'Aim for 120-160 characters.' });
  } else if (data.metaDescriptionLength > 160) {
    checks.push({ section: 'onpage', status: 'warn', label: `Meta Description Too Long (${data.metaDescriptionLength} chars)`, detail: 'May be truncated. Aim for 120-160 characters.' });
  } else {
    checks.push({ section: 'onpage', status: 'pass', label: `Meta Description OK (${data.metaDescriptionLength} chars)`, detail: `"${data.metaDescription.substring(0, 100)}${data.metaDescriptionLength > 100 ? '...' : ''}"` });
  }

  // Canonical
  if (!data.canonicalUrl) {
    checks.push({ section: 'onpage', status: 'warn', label: 'No Canonical URL', detail: 'Consider adding a canonical link to avoid duplicate content issues.' });
  } else {
    checks.push({ section: 'onpage', status: 'pass', label: 'Canonical URL Set', detail: data.canonicalUrl.substring(0, 80) });
  }

  // Word Count
  if (data.wordCount < 300) {
    checks.push({ section: 'onpage', status: 'warn', label: `Low Word Count (${data.wordCount})`, detail: 'Pages with thin content may rank poorly. Aim for 300+ words.' });
  } else {
    checks.push({ section: 'onpage', status: 'pass', label: `Word Count: ${data.wordCount}`, detail: 'Sufficient content for SEO.' });
  }

  // Headings
  const h1Count = data.headings.h1 ? data.headings.h1.length : 0;
  if (h1Count === 0) {
    checks.push({ section: 'headings', status: 'fail', label: 'Missing H1 Tag', detail: 'Every page should have exactly one H1 heading.' });
  } else if (h1Count > 1) {
    checks.push({ section: 'headings', status: 'warn', label: `Multiple H1 Tags (${h1Count})`, detail: 'Best practice is to have exactly one H1 per page.' });
  } else {
    checks.push({ section: 'headings', status: 'pass', label: 'Single H1 Tag', detail: `"${data.headings.h1[0].substring(0, 80)}"` });
  }

  const h2Count = data.headings.h2 ? data.headings.h2.length : 0;
  if (h2Count === 0) {
    checks.push({ section: 'headings', status: 'warn', label: 'No H2 Tags', detail: 'Use H2 headings to structure your content.' });
  } else {
    checks.push({ section: 'headings', status: 'pass', label: `${h2Count} H2 Tag${h2Count > 1 ? 's' : ''}`, detail: 'Good content structure.' });
  }

  // Images
  const missingAlt = data.imagesWithoutAlt ? data.imagesWithoutAlt.length : 0;
  if (data.totalImages === 0) {
    checks.push({ section: 'images', status: 'warn', label: 'No Images Found', detail: 'Images can improve engagement and SEO.' });
  } else if (missingAlt > 0) {
    checks.push({ section: 'images', status: 'fail', label: `${missingAlt} Image${missingAlt > 1 ? 's' : ''} Missing Alt Text`, detail: `${data.imagesWithAlt} of ${data.totalImages} images have alt text.` });
  } else {
    checks.push({ section: 'images', status: 'pass', label: `All ${data.totalImages} Images Have Alt Text`, detail: 'Good accessibility and SEO practice.' });
  }

  // Links
  if (data.internalLinks === 0) {
    checks.push({ section: 'links', status: 'warn', label: 'No Internal Links', detail: 'Internal linking helps search engines understand site structure.' });
  } else {
    checks.push({ section: 'links', status: 'pass', label: `${data.internalLinks} Internal Link${data.internalLinks > 1 ? 's' : ''}`, detail: 'Good internal linking.' });
  }
  checks.push({ section: 'links', status: 'pass', label: `${data.externalLinks} External Link${data.externalLinks !== 1 ? 's' : ''}`, detail: `${data.noFollowLinks} nofollow link${data.noFollowLinks !== 1 ? 's' : ''}.` });

  if (data.brokenLinkCandidates && data.brokenLinkCandidates.length > 0) {
    checks.push({ section: 'links', status: 'warn', label: `${data.brokenLinkCandidates.length} Link${data.brokenLinkCandidates.length > 1 ? 's' : ''} With Empty Anchor Text`, detail: 'Links should have descriptive anchor text.' });
  }

  // Links: Missing title attribute
  const missingTitle = data.linksWithoutTitle || 0;
  const totalLinks = data.internalLinks + data.externalLinks;
  if (totalLinks > 0 && missingTitle > 0) {
    const pct = Math.round((missingTitle / totalLinks) * 100);
    checks.push({ section: 'links', status: 'warn', label: `${missingTitle} Link${missingTitle > 1 ? 's' : ''} Missing Title Attribute (${pct}%)`, detail: 'Adding title attributes to links improves accessibility and provides context on hover.' });
  } else if (totalLinks > 0) {
    checks.push({ section: 'links', status: 'pass', label: 'All Links Have Title Attributes', detail: 'Good accessibility practice.' });
  }

  // OG Tags
  const ogMissing = [];
  if (!data.ogTags['og:title']) ogMissing.push('og:title');
  if (!data.ogTags['og:description']) ogMissing.push('og:description');
  if (!data.ogTags['og:image']) ogMissing.push('og:image');
  if (!data.ogTags['og:url']) ogMissing.push('og:url');

  if (ogMissing.length === 0) {
    checks.push({ section: 'social', status: 'pass', label: 'Open Graph Tags Complete', detail: 'All essential OG tags present.' });
  } else if (ogMissing.length <= 2) {
    checks.push({ section: 'social', status: 'warn', label: `Missing OG Tags: ${ogMissing.join(', ')}`, detail: 'Add these for better social sharing.' });
  } else {
    checks.push({ section: 'social', status: 'fail', label: `Missing ${ogMissing.length} OG Tags`, detail: `Missing: ${ogMissing.join(', ')}` });
  }

  // Twitter Card
  const twMissing = [];
  if (!data.twitterTags['twitter:card']) twMissing.push('twitter:card');
  if (!data.twitterTags['twitter:title']) twMissing.push('twitter:title');
  if (twMissing.length === 0) {
    checks.push({ section: 'social', status: 'pass', label: 'Twitter Card Tags Present', detail: `Card type: ${data.twitterTags['twitter:card']}` });
  } else {
    checks.push({ section: 'social', status: 'warn', label: 'Missing Twitter Card Tags', detail: `Missing: ${twMissing.join(', ')}` });
  }

  // Technical: Robots
  if (data.robotsMeta && (data.robotsMeta.includes('noindex') || data.robotsMeta.includes('nofollow'))) {
    checks.push({ section: 'technical', status: 'warn', label: 'Robots Meta Restrictions', detail: `robots: "${data.robotsMeta}". Page may not be indexed.` });
  } else {
    checks.push({ section: 'technical', status: 'pass', label: 'No Robots Restrictions', detail: data.robotsMeta ? `robots: "${data.robotsMeta}"` : 'No robots meta tag (defaults to index, follow).' });
  }

  // Technical: Language
  if (!data.htmlLang) {
    checks.push({ section: 'technical', status: 'warn', label: 'Missing HTML lang Attribute', detail: 'Add lang="en" (or appropriate language) to the &lt;html&gt; tag.' });
  } else {
    checks.push({ section: 'technical', status: 'pass', label: `Language: ${data.htmlLang}`, detail: 'HTML lang attribute is set.' });
  }

  // Technical: Viewport
  if (!data.viewport) {
    checks.push({ section: 'technical', status: 'fail', label: 'Missing Viewport Meta', detail: 'Required for mobile-friendly pages.' });
  } else {
    checks.push({ section: 'technical', status: 'pass', label: 'Viewport Meta Set', detail: 'Page is configured for responsive display.' });
  }

  // Schema / Structured Data
  if (data.structuredData && data.structuredData.length > 0) {
    const types = data.structuredData.map(s => s.type).join(', ');
    checks.push({ section: 'schema', status: 'pass', label: `${data.structuredData.length} Schema Markup${data.structuredData.length > 1 ? 's' : ''}`, detail: `Types: ${types}` });
  } else {
    checks.push({ section: 'schema', status: 'warn', label: 'No Structured Data', detail: 'Consider adding JSON-LD schema markup for rich results.' });
  }

  // Technical: Favicon
  if (!data.hasFavicon) {
    checks.push({ section: 'technical', status: 'warn', label: 'No Favicon Detected', detail: 'Add a favicon for better branding in browser tabs and bookmarks.' });
  } else {
    checks.push({ section: 'technical', status: 'pass', label: 'Favicon Present', detail: 'Favicon link tag found.' });
  }

  // Technical: HTTPS
  if (data.currentUrl && data.currentUrl.startsWith('https://')) {
    checks.push({ section: 'technical', status: 'pass', label: 'HTTPS Enabled', detail: 'Page is served over a secure connection.' });
  } else {
    checks.push({ section: 'technical', status: 'fail', label: 'Not Using HTTPS', detail: 'HTTPS is a ranking factor. Migrate to HTTPS.' });
  }

  // Technical: Performance
  if (data.performance) {
    if (data.performance.ttfb !== undefined) {
      const ttfbStatus = data.performance.ttfb < 200 ? 'pass' : data.performance.ttfb < 600 ? 'warn' : 'fail';
      checks.push({ section: 'technical', status: ttfbStatus, label: `TTFB: ${data.performance.ttfb}ms`, detail: ttfbStatus === 'pass' ? 'Fast server response.' : 'Aim for under 200ms.' });
    }
    if (data.performance.domContentLoaded !== undefined) {
      const dclStatus = data.performance.domContentLoaded < 1500 ? 'pass' : data.performance.domContentLoaded < 3000 ? 'warn' : 'fail';
      checks.push({ section: 'technical', status: dclStatus, label: `DOM Content Loaded: ${data.performance.domContentLoaded}ms`, detail: dclStatus === 'pass' ? 'Good load time.' : 'Consider optimising page resources.' });
    }
    if (data.performance.totalResources !== undefined) {
      const resStatus = data.performance.totalResources < 50 ? 'pass' : data.performance.totalResources < 100 ? 'warn' : 'fail';
      checks.push({ section: 'technical', status: resStatus, label: `${data.performance.totalResources} Resources Loaded`, detail: data.performance.totalTransferSize ? `Total transfer: ${(data.performance.totalTransferSize / 1024 / 1024).toFixed(2)} MB` : '' });
    }
  }

  // Technical: Hreflang
  if (data.hreflang && data.hreflang.length > 0) {
    checks.push({ section: 'technical', status: 'pass', label: `${data.hreflang.length} Hreflang Tag${data.hreflang.length > 1 ? 's' : ''}`, detail: data.hreflang.map(h => h.lang).join(', ') });
  }

  // FAQ detection
  if (data.hasFaqSchema) {
    checks.push({ section: 'faq', status: 'pass', label: 'FAQ Schema Detected', detail: 'FAQPage structured data found — eligible for rich results.' });
  } else if (data.hasFaqSection) {
    checks.push({ section: 'faq', status: 'warn', label: 'FAQ Section Found But No Schema', detail: 'Add FAQPage JSON-LD schema to your FAQ section for rich results.' });
  } else {
    checks.push({ section: 'faq', status: 'warn', label: 'No FAQ Found', detail: 'Adding an FAQ section with schema markup can improve search visibility.' });
  }

  return checks;
}

function renderSEOResults(checks, data) {
  const sections = {
    onpage: document.getElementById('seo-onpage-results'),
    headings: document.getElementById('seo-headings-results'),
    images: document.getElementById('seo-images-results'),
    links: document.getElementById('seo-links-results'),
    social: document.getElementById('seo-social-results'),
    technical: document.getElementById('seo-technical-results'),
    schema: document.getElementById('seo-schema-results'),
    faq: document.getElementById('seo-faq-results')
  };

  // Clear all
  Object.values(sections).forEach(el => { el.innerHTML = ''; });

  // Render checks into sections
  checks.forEach(c => {
    if (sections[c.section]) {
      sections[c.section].innerHTML += seoItem(c.status, c.label, c.detail, c.action);
    }
  });

  // Render heading tree
  if (data.headings) {
    let headingTree = '';
    for (let i = 1; i <= 6; i++) {
      const key = `h${i}`;
      if (data.headings[key] && data.headings[key].length > 0) {
        data.headings[key].forEach(text => {
          const indent = (i - 1) * 12;
          headingTree += `<div style="padding:3px 0 3px ${indent}px;font-size:11px;color:#495057;border-bottom:1px solid #f5f5f5;">
            <span style="color:#007bff;font-weight:700;font-size:10px;">H${i}</span> ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}
          </div>`;
        });
      }
    }
    if (headingTree) {
      sections.headings.innerHTML += `<div style="margin-top:8px;border:1px solid #eee;border-radius:4px;padding:6px;max-height:200px;overflow-y:auto;">${headingTree}</div>`;
    }
  }

  // Render missing alt images list
  if (data.imagesWithoutAlt && data.imagesWithoutAlt.length > 0) {
    let imgList = '<div style="margin-top:8px;font-size:11px;font-weight:600;color:#6c757d;">Images missing alt:</div>';
    data.imagesWithoutAlt.slice(0, 10).forEach(img => {
      imgList += `<div style="padding:3px 0;font-size:10px;color:#dc3545;border-bottom:1px solid #f5f5f5;word-break:break-all;">${img.src || 'Unknown source'} (${img.width}×${img.height})</div>`;
    });
    if (data.imagesWithoutAlt.length > 10) {
      imgList += `<div style="font-size:10px;color:#6c757d;padding:3px 0;">...and ${data.imagesWithoutAlt.length - 10} more</div>`;
    }
    sections.images.innerHTML += imgList;
  }

  // Render links missing title attribute
  if (data.linksWithoutTitleSamples && data.linksWithoutTitleSamples.length > 0) {
    let linkList = '<div style="margin-top:8px;font-size:11px;font-weight:600;color:#6c757d;">Links missing title attribute:</div>';
    data.linksWithoutTitleSamples.forEach(link => {
      linkList += `<div style="padding:3px 0;font-size:10px;border-bottom:1px solid #f5f5f5;display:flex;gap:4px;">
        <span style="color:#ffc107;flex-shrink:0;">!</span>
        <div style="min-width:0;">
          <div style="color:#495057;font-weight:500;">${link.text}</div>
          <div style="color:#dc3545;word-break:break-all;">${link.href}</div>
        </div>
      </div>`;
    });
    if (data.linksWithoutTitle > 10) {
      linkList += `<div style="font-size:10px;color:#6c757d;padding:3px 0;">...and ${data.linksWithoutTitle - 10} more</div>`;
    }
    sections.links.innerHTML += linkList;
  }

  // Render OG tag details
  if (data.ogTags) {
    let ogDetail = '<div style="margin-top:8px;">';
    Object.entries(data.ogTags).forEach(([key, val]) => {
      const hasVal = val && val.length > 0;
      ogDetail += `<div style="display:flex;gap:6px;padding:3px 0;font-size:11px;border-bottom:1px solid #f5f5f5;">
        <span style="color:${hasVal ? '#28a745' : '#dc3545'};font-size:10px;">${hasVal ? '✓' : '✕'}</span>
        <span style="color:#6c757d;min-width:90px;">${key}</span>
        <span style="color:#495057;word-break:break-word;flex:1;">${hasVal ? (val.length > 60 ? val.substring(0, 60) + '...' : val) : 'Not set'}</span>
      </div>`;
    });
    ogDetail += '</div>';
    sections.social.innerHTML += ogDetail;
  }

  // Score calculation
  let pass = 0, warn = 0, fail = 0;
  checks.forEach(c => {
    if (c.status === 'pass') pass++;
    else if (c.status === 'warn') warn++;
    else fail++;
  });
  const total = checks.length;
  const score = total > 0 ? Math.round(((pass + warn * 0.5) / total) * 100) : 0;

  const scoreColor = score >= 80 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545';
  document.getElementById('seo-score-summary').style.display = 'block';
  document.getElementById('seo-score-value').textContent = score;
  document.getElementById('seo-score-value').style.color = scoreColor;
  document.getElementById('seo-score-fill').style.width = `${score}%`;
  document.getElementById('seo-score-fill').style.background = scoreColor;
  document.getElementById('seo-pass-count').textContent = `${pass} passed`;
  document.getElementById('seo-warn-count').textContent = `${warn} warning${warn !== 1 ? 's' : ''}`;
  document.getElementById('seo-fail-count').textContent = `${fail} error${fail !== 1 ? 's' : ''}`;

  // Update section badges
  const sectionNames = ['onpage', 'headings', 'images', 'links', 'social', 'technical', 'schema', 'faq'];
  sectionNames.forEach(name => {
    const badge = document.getElementById(`seo-${name}-badge`);
    if (!badge) return;
    const sectionChecks = checks.filter(c => c.section === name);
    const sectionFails = sectionChecks.filter(c => c.status === 'fail').length;
    const sectionWarns = sectionChecks.filter(c => c.status === 'warn').length;
    if (sectionFails > 0) {
      badge.textContent = `${sectionFails} error${sectionFails > 1 ? 's' : ''}`;
      badge.style.background = '#fde8e8';
      badge.style.color = '#dc3545';
      badge.style.display = 'inline-block';
    } else if (sectionWarns > 0) {
      badge.textContent = `${sectionWarns} warn`;
      badge.style.background = '#fff8e1';
      badge.style.color = '#ffc107';
      badge.style.display = 'inline-block';
    } else {
      badge.textContent = 'OK';
      badge.style.background = '#e6f9ed';
      badge.style.color = '#28a745';
      badge.style.display = 'inline-block';
    }
  });

  // Render schema details
  if (data.structuredData && data.structuredData.length > 0 && sections.schema) {
    let schemaDetail = '<div style="margin-top:8px;">';
    data.structuredData.forEach(s => {
      schemaDetail += `<div style="padding:6px 0;border-bottom:1px solid #f5f5f5;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="font-size:10px;padding:1px 5px;border-radius:3px;background:#e7f1ff;color:#007bff;font-weight:700;">JSON-LD</span>
          <span style="font-size:12px;font-weight:600;color:#212529;">${s.type}</span>
        </div>
        <div style="font-size:10px;color:#6c757d;font-family:monospace;word-break:break-all;max-height:60px;overflow:hidden;">${s.raw.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>`;
    });
    schemaDetail += '</div>';
    sections.schema.innerHTML += schemaDetail;
  }

  // Why-important blurbs and Ask AI buttons
  const seoImportance = {
    onpage: 'Title tags and meta descriptions are the first thing users see in search results. Optimising them directly impacts click-through rates and rankings.',
    headings: 'A clear heading hierarchy (H1–H6) helps search engines understand your content structure and improves accessibility for screen readers.',
    images: 'Alt text helps search engines index images and is essential for accessibility. Missing alt text is a missed ranking opportunity.',
    links: 'Internal links distribute page authority and help search engines crawl your site. Descriptive anchor text and title attributes improve context.',
    social: 'Open Graph and Twitter Card tags control how your page appears when shared on social media, directly affecting click-through from social platforms.',
    technical: 'Technical factors like HTTPS, viewport meta, page speed, and language tags are core ranking signals that affect indexing and user experience.',
    schema: 'Structured data enables rich results (stars, FAQs, breadcrumbs) in search, increasing visibility and click-through rates.',
    faq: 'FAQ sections target long-tail search queries and can appear as rich results in Google, increasing your page visibility and click-through rate.'
  };

  Object.entries(sections).forEach(([name, el]) => {
    if (!el || !seoImportance[name]) return;
    const sectionChecks = checks.filter(c => c.section === name);
    // Why important blurb
    el.innerHTML += `<div style="margin-top:10px;padding:8px;background:#f0f7ff;border-radius:4px;border-left:3px solid #007bff;">
      <div style="font-size:10px;font-weight:700;color:#007bff;text-transform:uppercase;margin-bottom:3px;">Why this matters</div>
      <div style="font-size:11px;color:#495057;line-height:1.4;">${seoImportance[name]}</div>
    </div>`;
    // Ask AI button
    if (sectionChecks.length > 0) {
      el.innerHTML += `<div style="margin-top:8px;text-align:right;">
        <button class="ask-ai-section-btn" data-section="${name}" style="font-size:10px;padding:3px 10px;border:1px solid #dee2e6;border-radius:4px;background:#f8f9fa;color:#495057;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
          <svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:currentColor;stroke-width:2;fill:none;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          Ask AI
        </button>
      </div>
      <div id="seo-${name}-ai" style="display:none;margin-top:6px;padding:8px;background:#fafafa;border-radius:4px;border:1px solid #eee;font-size:11px;color:#495057;line-height:1.5;"></div>`;
    }
  });

  // Attach Ask AI button handlers
  document.querySelectorAll('.ask-ai-section-btn').forEach(btn => {
    btn.addEventListener('click', () => askAIForSection(btn.dataset.section, checks, data));
  });

  // Auto-expand on-page section
  const onpageBody = document.getElementById('seo-onpage-section');
  const onpageArrow = document.querySelector('[data-target="seo-onpage-section"] .qc-accordion-arrow');
  if (onpageBody) onpageBody.style.display = 'block';
  if (onpageArrow) onpageArrow.style.transform = 'rotate(0deg)';
}

// Store last scan data for section AI queries
let lastScanData = null;

async function askAIForSection(sectionName, checks, data) {
  lastScanData = data;
  const btn = document.querySelector(`.ask-ai-section-btn[data-section="${sectionName}"]`);
  const resultsDiv = document.getElementById(`seo-${sectionName}-ai`);
  if (!btn || !resultsDiv) return;

  btn.disabled = true;
  btn.textContent = 'Asking AI...';
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = '<span style="color:#6c757d;">Generating recommendations...</span>';

  const sectionChecks = checks.filter(c => c.section === sectionName);
  const checksText = sectionChecks.map(c => `[${c.status.toUpperCase()}] ${c.label}: ${c.detail}`).join('\n');

  const sectionLabels = {
    onpage: 'On-Page SEO (title, meta description, canonical, word count)',
    headings: 'Headings Structure (H1-H6 hierarchy)',
    images: 'Images & Alt Tags',
    links: 'Links (internal, external, anchor text, title attributes)',
    social: 'Social & Open Graph Tags',
    technical: 'Technical SEO (HTTPS, viewport, performance, language)',
    schema: 'Schema / Structured Data (JSON-LD)',
    faq: 'FAQ (Frequently Asked Questions section and schema)'
  };

  const prompt = `You are an SEO expert. Based on the following ${sectionLabels[sectionName] || sectionName} audit results for the page at ${data.currentUrl}, provide 2-4 specific, actionable recommendations.

Audit results:
${checksText}

Return ONLY valid JSON with a "tips" array. Each tip has:
- "title": short action title (e.g. "Shorten Meta Description")
- "description": 1-2 sentence explanation of why and how
- "suggestion": optional copyable text the user can directly use (e.g. a rewritten title tag, meta description, alt text, code snippet). Leave empty string if not applicable.`;

  try {
    const { apiUrl, apiKey, model, language } = await getAIConfig();

    if (!apiKey) {
      resultsDiv.innerHTML = '<span style="color:#dc3545;">Set your API key in Settings first.</span>';
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:currentColor;stroke-width:2;fill:none;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg> Ask AI`;
      return;
    }

    const langInstruction = getLanguageInstruction(language);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: `You are a concise SEO consultant. Return only valid JSON. ${langInstruction}` },
          { role: "user", content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await response.json();
    if (!aiData.choices || !aiData.choices[0]) throw new Error('Invalid AI response');

    const parsed = JSON.parse(aiData.choices[0].message.content);
    const tips = parsed.tips || [];

    if (tips.length === 0) {
      resultsDiv.innerHTML = '<span style="color:#28a745;">No issues found — this section looks good!</span>';
    } else {
      resultsDiv.innerHTML = tips.map((tip, i) => {
        const hasSuggestion = tip.suggestion && tip.suggestion.trim().length > 0;
        return `<div style="padding:8px 0;${i < tips.length - 1 ? 'border-bottom:1px solid #eee;' : ''}">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <span style="flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#e7f1ff;color:#007bff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${i + 1}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:700;color:#212529;margin-bottom:2px;">${tip.title}</div>
              <div style="font-size:11px;color:#495057;line-height:1.4;">${tip.description}</div>
              ${hasSuggestion ? `
                <div style="margin-top:6px;position:relative;">
                  <div style="background:#f0f7ff;border:1px solid #d0e3ff;border-radius:4px;padding:8px 32px 8px 8px;font-size:11px;color:#212529;font-family:monospace;line-height:1.5;word-break:break-word;white-space:pre-wrap;">${tip.suggestion.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                  <button class="copy-suggestion-btn" data-text="${tip.suggestion.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" style="position:absolute;top:4px;right:4px;background:#fff;border:1px solid #dee2e6;border-radius:3px;padding:3px 6px;cursor:pointer;font-size:9px;color:#6c757d;display:flex;align-items:center;gap:3px;" title="Copy to clipboard">
                    <svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;fill:none;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
                    Copy
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>`;
      }).join('');

      // Attach copy handlers
      resultsDiv.querySelectorAll('.copy-suggestion-btn').forEach(copyBtn => {
        copyBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const text = copyBtn.getAttribute('data-text').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          try {
            await navigator.clipboard.writeText(text);
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:#28a745;stroke-width:2;fill:none;"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied`;
            copyBtn.style.color = '#28a745';
            copyBtn.style.borderColor = '#28a745';
            setTimeout(() => {
              copyBtn.innerHTML = `<svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;fill:none;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg> Copy`;
              copyBtn.style.color = '#6c757d';
              copyBtn.style.borderColor = '#dee2e6';
            }, 2000);
          } catch (err) {
            copyBtn.textContent = 'Failed';
          }
        });
      });
    }
  } catch (error) {
    console.error('Section AI Error:', error);
    resultsDiv.innerHTML = '<span style="color:#dc3545;">Error getting AI recommendations. Check your API key.</span>';
  }

  btn.disabled = false;
  btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:currentColor;stroke-width:2;fill:none;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg> Ask AI`;
}

// ============ AI SEO ANALYSIS ============

const SEO_AI_PROMPT = `You are an expert SEO analyst. Analyse the following page data and provide actionable SEO recommendations.

Focus on:
1. Content quality and keyword optimisation opportunities
2. Title and meta description improvements (with specific rewrite suggestions)
3. Heading structure improvements
4. Internal linking strategy
5. Content gaps or thin content issues
6. Quick wins that could improve rankings

Be specific and actionable. Format your response as JSON with a "recommendations" array, where each item has:
- "category": one of "content", "meta", "structure", "links", "technical"
- "priority": "high", "medium", or "low"
- "title": short title
- "description": detailed actionable recommendation

Return ONLY valid JSON.`;

document.getElementById('run-ai-seo-btn').addEventListener('click', async () => {
  const btn = document.getElementById('run-ai-seo-btn');
  const resultsDiv = document.getElementById('seo-ai-results');
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;

  btn.disabled = true;
  btn.textContent = 'Analysing...';
  resultsDiv.innerHTML = '<span style="color:#6c757d;">Getting page data...</span>';

  const injected = await ensureContentScriptInjected(tab.id);
  if (!injected) {
    btn.disabled = false;
    btn.textContent = 'Analyse';
    resultsDiv.innerHTML = '<span style="color:#dc3545;">Unable to access this page. Try refreshing the page first.</span>';
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "runSEOAudit" }, async (seoData) => {
    if (chrome.runtime.lastError || !seoData) {
      btn.disabled = false;
      btn.textContent = 'Analyse';
      resultsDiv.innerHTML = '<span style="color:#dc3545;">Unable to get page data.</span>';
      return;
    }

    // Also get page text for content analysis
    chrome.tabs.sendMessage(tab.id, { action: "getPageText" }, async (textResponse) => {
      const pageText = textResponse && textResponse.text ? textResponse.text.substring(0, 4000) : '';

      const prompt = `Here is the SEO data for the page at ${seoData.currentUrl}:

Title: "${seoData.title}" (${seoData.titleLength} chars)
Meta Description: "${seoData.metaDescription}" (${seoData.metaDescriptionLength} chars)
H1 Tags: ${JSON.stringify(seoData.headings?.h1 || [])}
H2 Tags: ${JSON.stringify(seoData.headings?.h2 || [])}
Word Count: ${seoData.wordCount}
Internal Links: ${seoData.internalLinks}, External Links: ${seoData.externalLinks}
Images: ${seoData.totalImages} total, ${seoData.imagesWithoutAlt?.length || 0} missing alt
OG Tags present: ${Object.entries(seoData.ogTags || {}).filter(([k,v]) => v).map(([k]) => k).join(', ') || 'None'}
Schema Types: ${seoData.structuredData?.map(s => s.type).join(', ') || 'None'}
Language: ${seoData.htmlLang || 'Not set'}

Page content excerpt:
${pageText}

Provide SEO recommendations.`;

      resultsDiv.innerHTML = '<span style="color:#6c757d;">AI is analysing...</span>';

      try {
        const { apiUrl, apiKey, model, language } = await getAIConfig();

        if (!apiKey) {
          resultsDiv.innerHTML = '<span style="color:#dc3545;">Please set your API key in the Settings tab.</span>';
          btn.disabled = false;
          btn.textContent = 'Analyse';
          return;
        }

        const langInstruction = getLanguageInstruction(language);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: `${SEO_AI_PROMPT} ${langInstruction}` },
              { role: "user", content: prompt }
            ],
            response_format: { type: 'json_object' }
          })
        });

        const aiData = await response.json();
        if (!aiData.choices || !aiData.choices[0]) throw new Error('Invalid AI response');

        const parsed = JSON.parse(aiData.choices[0].message.content);
        const recs = parsed.recommendations || [];

        if (recs.length === 0) {
          resultsDiv.innerHTML = '<span style="color:#28a745;">No major issues found. Page looks well optimised!</span>';
        } else {
          const priorityColors = { high: '#dc3545', medium: '#ffc107', low: '#17a2b8' };
          const priorityBg = { high: '#fde8e8', medium: '#fff8e1', low: '#e7f6fd' };
          resultsDiv.innerHTML = recs.map(r => `
            <div style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${priorityBg[r.priority] || '#f8f9fa'};color:${priorityColors[r.priority] || '#6c757d'};font-weight:700;text-transform:uppercase;">${r.priority}</span>
                <span style="font-size:12px;font-weight:600;color:#212529;">${r.title}</span>
              </div>
              <div style="font-size:11px;color:#495057;line-height:1.5;">${r.description}</div>
            </div>
          `).join('');
        }
      } catch (error) {
        console.error('AI SEO Analysis Error:', error);
        resultsDiv.innerHTML = '<span style="color:#dc3545;">Error running AI analysis. Check your API key in Settings.</span>';
      }

      btn.disabled = false;
      btn.textContent = 'Analyse';
    });
  });
});

// ============ TOOLS TAB ============

// Scope toggle: show/hide location field
document.getElementById('meta-gen-scope').addEventListener('change', (e) => {
  document.getElementById('meta-gen-location-group').style.display = e.target.value === 'local' ? 'block' : 'none';
});

// Source mode tracking
const toolSourceMode = { meta: 'new', faq: 'new' };

// Writing style tracking (jobs-to-be-done)
const toolStyle = { meta: 'get-clicks', faq: 'reduce-support' };

const styleDescriptions = {
  // Meta goals
  'get-clicks': 'The goal is to maximise click-through rate from search results. Use power words, curiosity gaps, and compelling hooks that make searchers want to click.',
  'build-trust': 'The goal is to build trust and credibility. Emphasise expertise, experience, certifications, and social proof. Make the brand feel reliable and established.',
  'drive-sales': 'The goal is to drive conversions and sales. Highlight offers, benefits, pricing advantages, and strong calls to action. Create urgency where appropriate.',
  'stand-out': 'The goal is to differentiate from competitors. Use unique angles, unexpected phrasing, and distinctive value propositions that make this result stand out in a crowded SERP.',
  'inform': 'The goal is to inform and educate. Be clear, factual, and helpful. Position the page as a definitive resource on the topic.',
  'generate-leads': 'The goal is to generate leads and enquiries. Emphasise free consultations, quotes, demos, or downloads. Include action-oriented language that encourages contact.',
  // FAQ goals
  'reduce-support': 'The goal is to reduce customer support queries. Answer the most common pre-sale and post-sale questions clearly and completely so users don\'t need to contact support.',
  'build-confidence': 'The goal is to build buyer confidence and reduce purchase hesitation. Address pricing concerns, quality questions, guarantees, and what to expect.',
  'rank-keywords': 'The goal is to rank for long-tail keyword searches. Each question should target a specific search query people actually type into Google. Optimise for featured snippets.',
  'overcome-objections': 'The goal is to overcome common sales objections. Address concerns about price, quality, trust, timing, and alternatives that prevent people from buying.',
  'educate-users': 'The goal is to educate users about the topic. Provide genuinely helpful, in-depth answers that establish thought leadership and keep users on the page longer.',
  'local-seo': 'The goal is to improve local SEO. Include location-specific questions about service areas, local availability, directions, and region-specific information.'
};

// Style chip toggle handlers
document.querySelectorAll('.style-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const tool = chip.dataset.tool;
    const style = chip.dataset.style;
    toolStyle[tool] = style;

    document.querySelectorAll(`.style-chip[data-tool="${tool}"]`).forEach(c => {
      if (c.dataset.style === style) {
        c.style.background = '#007bff';
        c.style.color = '#fff';
        c.style.borderColor = '#007bff';
        c.classList.add('active');
      } else {
        c.style.background = '#f8f9fa';
        c.style.color = '#495057';
        c.style.borderColor = '#ced4da';
        c.classList.remove('active');
      }
    });
  });
});

// Source toggle button handlers
document.querySelectorAll('.source-toggle-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const tool = btn.dataset.tool;
    const mode = btn.dataset.mode;
    toolSourceMode[tool] = mode;

    // Update button styles
    document.querySelectorAll(`.source-toggle-btn[data-tool="${tool}"]`).forEach(b => {
      if (b.dataset.mode === mode) {
        b.style.background = '#007bff';
        b.style.color = '#fff';
        b.classList.add('active');
      } else {
        b.style.background = '#f8f9fa';
        b.style.color = '#495057';
        b.classList.remove('active');
      }
    });

    const proposedDiv = document.getElementById(`${tool}-proposed-keywords`);
    if (mode === 'current') {
      proposedDiv.style.display = 'block';
      proposedDiv.innerHTML = '<span style="font-size:11px;color:#6c757d;">Extracting keywords from page...</span>';
      await extractPageKeywords(tool);
    } else {
      proposedDiv.style.display = 'none';
      proposedDiv.innerHTML = '';
    }
  });
});

// Extract keywords from current page and display as clickable chips
async function extractPageKeywords(tool) {
  const proposedDiv = document.getElementById(`${tool}-proposed-keywords`);
  const keywordsInput = document.getElementById(`${tool === 'meta' ? 'meta-gen-keywords' : 'faq-gen-keywords'}`);

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab) throw new Error('No tab');

    await ensureContentScriptInjected(tab.id);

    // Get page metadata and text
    const meta = await new Promise(r => chrome.tabs.sendMessage(tab.id, { action: "getPageMetadata" }, r));
    const seoData = await new Promise(r => chrome.tabs.sendMessage(tab.id, { action: "runSEOAudit" }, r));

    if (!meta || !seoData) throw new Error('No data');

    // Extract keyword candidates from title, meta description, headings, and URL
    const candidates = new Set();

    // From title
    if (seoData.title) {
      seoData.title.split(/[\|\-–—,:]/).forEach(part => {
        const t = part.trim();
        if (t.length > 2 && t.length < 60) candidates.add(t);
      });
    }

    // From meta description — extract key phrases
    if (seoData.metaDescription) {
      const descWords = seoData.metaDescription.split(/[.,;!?]/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 50);
      descWords.slice(0, 3).forEach(w => candidates.add(w));
    }

    // From H1 and H2 headings
    if (seoData.headings) {
      ['h1', 'h2'].forEach(tag => {
        if (seoData.headings[tag]) {
          seoData.headings[tag].forEach(h => {
            if (h.length > 2 && h.length < 60) candidates.add(h);
          });
        }
      });
    }

    // From URL path segments
    try {
      const urlPath = new URL(seoData.currentUrl).pathname;
      urlPath.split('/').filter(s => s.length > 2).forEach(seg => {
        candidates.add(seg.replace(/-/g, ' ').replace(/_/g, ' '));
      });
    } catch (e) {}

    const keywordList = Array.from(candidates).slice(0, 10);

    if (keywordList.length === 0) {
      proposedDiv.innerHTML = '<span style="font-size:11px;color:#6c757d;">No keywords detected on this page.</span>';
      return;
    }

    // Render as clickable chips
    proposedDiv.innerHTML = `
      <div style="font-size:10px;font-weight:600;color:#6c757d;margin-bottom:6px;text-transform:uppercase;">Detected Keywords (click to add)</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${keywordList.map(kw => `<button class="keyword-chip" data-tool="${tool}" style="font-size:10px;padding:3px 8px;border:1px solid #d0e3ff;border-radius:12px;background:#f0f7ff;color:#007bff;cursor:pointer;font-weight:500;white-space:nowrap;">${kw}</button>`).join('')}
      </div>
      <button class="use-all-keywords-btn" data-tool="${tool}" style="margin-top:6px;font-size:10px;padding:3px 10px;border:1px solid #28a745;border-radius:4px;background:#e6f9ed;color:#28a745;cursor:pointer;font-weight:600;">Use All Keywords</button>
    `;

    // Chip click: toggle keyword in/out of input
    proposedDiv.querySelectorAll('.keyword-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const kw = chip.textContent;
        const current = keywordsInput.value.trim();
        const parts = current.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const idx = parts.findIndex(p => p.toLowerCase() === kw.toLowerCase());

        if (idx >= 0) {
          // Remove keyword
          parts.splice(idx, 1);
          keywordsInput.value = parts.join(', ');
          chip.style.background = '#f0f7ff';
          chip.style.color = '#007bff';
          chip.style.borderColor = '#d0e3ff';
        } else {
          // Add keyword
          parts.push(kw);
          keywordsInput.value = parts.join(', ');
          chip.style.background = '#28a745';
          chip.style.color = '#fff';
          chip.style.borderColor = '#28a745';
        }
      });
    });

    // Use all button
    proposedDiv.querySelector('.use-all-keywords-btn').addEventListener('click', () => {
      keywordsInput.value = keywordList.join(', ');
      proposedDiv.querySelectorAll('.keyword-chip').forEach(chip => {
        chip.style.background = '#28a745';
        chip.style.color = '#fff';
        chip.style.borderColor = '#28a745';
        chip.disabled = true;
      });
    });

  } catch (error) {
    console.error('Keyword extraction error:', error);
    proposedDiv.innerHTML = '<span style="font-size:11px;color:#dc3545;">Unable to extract keywords. Try refreshing the page.</span>';
  }
}

// Helper: get AI config
async function getAIConfig() {
  const settings = await chrome.storage.local.get(['deepseekApiKey', 'openaiApiKey', 'aiProvider', 'aiLanguage']);
  const provider = settings.aiProvider || 'deepseek';
  const language = settings.aiLanguage || 'en-us';
  let apiUrl, apiKey, model;
  if (provider === 'openai') {
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    apiKey = settings.openaiApiKey;
    model = 'gpt-4o-mini';
  } else {
    apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    apiKey = settings.deepseekApiKey;
    model = 'deepseek-chat';
  }
  return { apiUrl, apiKey, model, language };
}

function getLanguageInstruction(lang) {
  return lang === 'en-gb'
    ? 'Write all responses in British English (e.g. optimise, colour, organisation, centre).'
    : 'Write all responses in American English (e.g. optimize, color, organization, center).';
}

// Helper: call AI and return parsed JSON
async function callToolAI(systemPrompt, userPrompt) {
  const { apiUrl, apiKey, model, language } = await getAIConfig();
  if (!apiKey) throw new Error('NO_KEY');
  systemPrompt += ' ' + getLanguageInstruction(language);
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    })
  });
  const data = await response.json();
  if (!data.choices || !data.choices[0]) throw new Error('Invalid AI response');
  return JSON.parse(data.choices[0].message.content);
}

// Helper: render a copyable suggestion block
function renderCopyBlock(text, label) {
  const escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const dataText = text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div style="margin-top:6px;position:relative;">
    ${label ? `<div style="font-size:10px;font-weight:600;color:#6c757d;margin-bottom:3px;">${label}</div>` : ''}
    <div style="background:#f0f7ff;border:1px solid #d0e3ff;border-radius:4px;padding:8px 32px 8px 8px;font-size:11px;color:#212529;line-height:1.5;word-break:break-word;white-space:pre-wrap;">${escaped}</div>
    <button class="copy-tool-btn" data-text="${dataText}" style="position:absolute;top:${label ? '20px' : '4px'};right:4px;background:#fff;border:1px solid #dee2e6;border-radius:3px;padding:3px 6px;cursor:pointer;font-size:9px;color:#6c757d;display:flex;align-items:center;gap:3px;" title="Copy">
      <svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;fill:none;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
      Copy
    </button>
  </div>`;
}

// Attach copy handlers to dynamically created copy buttons
function attachCopyHandlers(container) {
  container.querySelectorAll('.copy-tool-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-text').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      try {
        await navigator.clipboard.writeText(text);
        btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:#28a745;stroke-width:2;fill:none;"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied`;
        btn.style.color = '#28a745'; btn.style.borderColor = '#28a745';
        setTimeout(() => {
          btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;fill:none;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg> Copy`;
          btn.style.color = '#6c757d'; btn.style.borderColor = '#dee2e6';
        }, 2000);
      } catch (err) { btn.textContent = 'Failed'; }
    });
  });
}

// --- Meta Title & Description Generator ---
document.getElementById('generate-meta-btn').addEventListener('click', async () => {
  const btn = document.getElementById('generate-meta-btn');
  const resultsDiv = document.getElementById('meta-gen-results');
  const keywords = document.getElementById('meta-gen-keywords').value.trim();
  const scope = document.getElementById('meta-gen-scope').value;
  const location = document.getElementById('meta-gen-location').value.trim();

  if (!keywords) {
    resultsDiv.innerHTML = '<span style="color:#dc3545;">Please enter target keywords.</span>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Generating...';
  resultsDiv.innerHTML = '<span style="color:#6c757d;">Generating meta tags...</span>';

  // Get current page info for context
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  let pageContext = '';
  if (toolSourceMode.meta === 'current' && tab) {
    try {
      await ensureContentScriptInjected(tab.id);
      const seoData = await new Promise(r => chrome.tabs.sendMessage(tab.id, { action: "runSEOAudit" }, r));
      const textData = await new Promise(r => chrome.tabs.sendMessage(tab.id, { action: "getPageText" }, r));
      if (seoData) {
        pageContext += `\nCurrent page URL: ${seoData.currentUrl}`;
        pageContext += `\nCurrent title: "${seoData.title}"`;
        pageContext += `\nCurrent meta description: "${seoData.metaDescription}"`;
        if (seoData.headings?.h1?.length) pageContext += `\nH1: ${seoData.headings.h1.join(', ')}`;
        if (seoData.headings?.h2?.length) pageContext += `\nH2: ${seoData.headings.h2.slice(0, 5).join(', ')}`;
      }
      if (textData?.text) pageContext += `\nPage content (first 500 chars): "${textData.text.substring(0, 500)}"`;
      pageContext = `\n\nThis is for an EXISTING page. Improve the current meta tags based on the actual page content:\n${pageContext}`;
    } catch (e) {}
  } else if (tab) {
    try {
      await ensureContentScriptInjected(tab.id);
      const meta = await new Promise(r => chrome.tabs.sendMessage(tab.id, { action: "getPageMetadata" }, r));
      if (meta) pageContext = `\nCurrent page title: "${meta.title}"\nCurrent meta description: "${meta.description}"`;
    } catch (e) {}
  }

  const locationText = scope === 'local' && location ? `\nTarget location: ${location}. Include the location naturally in the title and description.` : '';
  const metaGoal = styleDescriptions[toolStyle.meta] || '';

  try {
    const parsed = await callToolAI(
      'You are an SEO copywriter. Return only valid JSON.',
      `Generate 3 optimised meta title and meta description options for a page with these keywords: ${keywords}${locationText}${pageContext}

Goal: ${metaGoal}

Return JSON with a "options" array. Each option has:
- "title": meta title (50-60 chars, include primary keyword near the start)
- "titleLength": character count
- "description": meta description (120-155 chars, compelling with call to action)
- "descriptionLength": character count`
    );

    const options = parsed.options || [];
    if (options.length === 0) {
      resultsDiv.innerHTML = '<span style="color:#dc3545;">No results generated.</span>';
    } else {
      resultsDiv.innerHTML = options.map((opt, i) => `
        <div style="padding:10px 0;${i < options.length - 1 ? 'border-bottom:1px solid #eee;' : ''}">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#e7f1ff;color:#007bff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">
              ${i + 1}
            </span>
            <span style="font-size:11px;font-weight:600;color:#212529;">Option ${i + 1}</span>
          </div>
          ${renderCopyBlock(opt.title, `Title (${opt.titleLength} chars)`)}
          ${renderCopyBlock(opt.description, `Description (${opt.descriptionLength} chars)`)}
        </div>
      `).join('');
      attachCopyHandlers(resultsDiv);
    }
  } catch (error) {
    if (error.message === 'NO_KEY') {
      resultsDiv.innerHTML = '<span style="color:#dc3545;">Set your API key in Settings first.</span>';
    } else {
      console.error('Meta gen error:', error);
      resultsDiv.innerHTML = '<span style="color:#dc3545;">Error generating meta tags. Check your API key.</span>';
    }
  }

  btn.disabled = false;
  btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;stroke-width:2;fill:none;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg> Generate Meta Tags`;
});

// --- FAQ Generator ---
document.getElementById('generate-faq-btn').addEventListener('click', async () => {
  const btn = document.getElementById('generate-faq-btn');
  const resultsDiv = document.getElementById('faq-gen-results');
  const keywords = document.getElementById('faq-gen-keywords').value.trim();

  if (!keywords) {
    resultsDiv.innerHTML = '<span style="color:#dc3545;">Please enter target keywords or topic.</span>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Generating...';
  resultsDiv.innerHTML = '<span style="color:#6c757d;">Generating FAQ...</span>';

  // Get page context if in current page mode
  let faqPageContext = '';
  if (toolSourceMode.faq === 'current') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab) {
        await ensureContentScriptInjected(tab.id);
        const seoData = await new Promise(r => chrome.tabs.sendMessage(tab.id, { action: "runSEOAudit" }, r));
        const textData = await new Promise(r => chrome.tabs.sendMessage(tab.id, { action: "getPageText" }, r));
        if (seoData) {
          faqPageContext += `\nPage URL: ${seoData.currentUrl}`;
          faqPageContext += `\nPage title: "${seoData.title}"`;
          if (seoData.headings?.h1?.length) faqPageContext += `\nH1: ${seoData.headings.h1.join(', ')}`;
          if (seoData.headings?.h2?.length) faqPageContext += `\nH2: ${seoData.headings.h2.slice(0, 8).join(', ')}`;
        }
        if (textData?.text) faqPageContext += `\nPage content (first 800 chars): "${textData.text.substring(0, 800)}"`;
        faqPageContext = `\n\nThis is for an EXISTING page. Generate FAQ based on the actual page content and services:\n${faqPageContext}`;
      }
    } catch (e) {}
  }

  try {
    const parsed = await callToolAI(
      'You are an SEO content strategist. Return only valid JSON.',
      `Generate 5 SEO-optimised FAQ questions and answers for a page about: ${keywords}${faqPageContext}

Goal: ${styleDescriptions[toolStyle.faq] || ''}

Each FAQ should:
- Target a long-tail keyword or common user query
- Have a concise, informative answer (2-3 sentences)
- Be crafted to achieve the goal specified above
- Include relevant keywords naturally

Also provide the complete FAQ schema markup (JSON-LD) ready to paste into the page.

Return JSON with:
- "faqs": array of { "question": "...", "answer": "..." }
- "schema": the complete JSON-LD FAQ schema markup as a string`
    );

    const faqs = parsed.faqs || [];
    const schema = parsed.schema || '';

    let html = '';
    if (faqs.length > 0) {
      html += faqs.map((faq, i) => {
        const faqText = `${faq.question}\n${faq.answer}`;
        const dataText = faqText.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
        <div style="padding:8px 0;${i < faqs.length - 1 ? 'border-bottom:1px solid #eee;' : ''}">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <span style="flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#fff3e0;color:#ff9800;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">Q</span>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px;">
                <div style="font-size:12px;font-weight:700;color:#212529;margin-bottom:4px;">${faq.question}</div>
                <button class="copy-tool-btn" data-text="${dataText}" style="flex-shrink:0;background:#f8f9fa;border:1px solid #dee2e6;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:9px;color:#6c757d;display:flex;align-items:center;gap:3px;" title="Copy Q&A">
                  <svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;fill:none;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
                  Copy
                </button>
              </div>
              <div style="font-size:11px;color:#495057;line-height:1.4;">${faq.answer}</div>
            </div>
          </div>
        </div>`;
      }).join('');

      // Copy all FAQ as text
      const allFaqText = faqs.map((f, i) => `Q${i + 1}: ${f.question}\nA: ${f.answer}`).join('\n\n');
      html += `<div style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;">
        ${renderCopyBlock(allFaqText, 'Copy All FAQ')}
      </div>`;

      // Schema markup
      if (schema) {
        const schemaStr = typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2);
        html += `<div style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;">
          ${renderCopyBlock(schemaStr, 'FAQ Schema Markup (JSON-LD)')}
        </div>`;
      }
    } else {
      html = '<span style="color:#dc3545;">No FAQ generated.</span>';
    }

    resultsDiv.innerHTML = html;
    attachCopyHandlers(resultsDiv);
  } catch (error) {
    if (error.message === 'NO_KEY') {
      resultsDiv.innerHTML = '<span style="color:#dc3545;">Set your API key in Settings first.</span>';
    } else {
      console.error('FAQ gen error:', error);
      resultsDiv.innerHTML = '<span style="color:#dc3545;">Error generating FAQ. Check your API key.</span>';
    }
  }

  btn.disabled = false;
  btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;stroke-width:2;fill:none;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg> Generate FAQ`;
});

// Helper: navigate to Tools tab and open FAQ section
function goToFaqTool() {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="tools"]').classList.add('active');
  document.getElementById('tools').classList.add('active');
  // Expand FAQ section
  const faqBody = document.getElementById('tool-faq-section');
  const faqArrow = document.querySelector('[data-target="tool-faq-section"] .qc-accordion-arrow');
  if (faqBody) faqBody.style.display = 'block';
  if (faqArrow) faqArrow.style.transform = 'rotate(0deg)';
}

// ============ SETTINGS ============

function toggleApiKeyFields(provider) {
  const dsContainer = document.getElementById('deepseek-key-container');
  const oaContainer = document.getElementById('openai-key-container');
  if (provider === 'openai') {
    dsContainer.style.display = 'none';
    oaContainer.style.display = 'block';
  } else {
    dsContainer.style.display = 'block';
    oaContainer.style.display = 'none';
  }
}

document.getElementById('ai-provider').addEventListener('change', (e) => {
  toggleApiKeyFields(e.target.value);
});

// Password visibility toggle
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.style.color = isPassword ? '#007bff' : '#6c757d';
  });
});

document.getElementById('save-settings-btn').addEventListener('click', () => {
  const deepseekKey = document.getElementById('deepseek-api-key').value.trim();
  const openaiKey = document.getElementById('openai-api-key').value.trim();
  const aiProvider = document.getElementById('ai-provider').value;
  const saveBtn = document.getElementById('save-settings-btn');
  const statusDiv = document.getElementById('save-status');

  saveBtn.disabled = true;
  saveBtn.style.opacity = '0.7';

  const aiLanguage = document.getElementById('ai-language').value;
  chrome.storage.local.set({
    deepseekApiKey: deepseekKey,
    openaiApiKey: openaiKey,
    aiProvider: aiProvider,
    aiLanguage: aiLanguage
  }, () => {
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';

    statusDiv.textContent = '✓ Settings saved!';
    statusDiv.style.color = '#28a745';
    statusDiv.style.opacity = '1';

    setTimeout(() => {
      statusDiv.style.opacity = '0';
    }, 2000);
  });
});

// Load settings on startup
chrome.storage.local.get(['deepseekApiKey', 'openaiApiKey', 'aiProvider', 'aiLanguage'], (result) => {
  if (chrome.runtime.lastError) {
    console.error('Error loading settings:', chrome.runtime.lastError);
    return;
  }

  if (result.deepseekApiKey) {
    document.getElementById('deepseek-api-key').value = result.deepseekApiKey;
  }
  if (result.openaiApiKey) {
    document.getElementById('openai-api-key').value = result.openaiApiKey;
  }
  if (result.aiProvider) {
    document.getElementById('ai-provider').value = result.aiProvider;
    toggleApiKeyFields(result.aiProvider);
  }
  if (result.aiLanguage) {
    document.getElementById('ai-language').value = result.aiLanguage;
  }

  // Initial load of tab info after settings are ready
  updateCurrentTabInfo();
});

// --- Tab change listeners ---
chrome.tabs.onActivated.addListener(updateCurrentTabInfo);
chrome.tabs.onUpdated.addListener(updateCurrentTabInfo);

// Initial load
updateCurrentTabInfo();