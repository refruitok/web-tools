// SEO Audit Assistant — Content Script
const __QC_CONTENT_VERSION = 3;

// Remove any previous listener from old injection so we don't get duplicates
if (window.__qcSEOListener) {
  chrome.runtime.onMessage.removeListener(window.__qcSEOListener);
}

window.__qcSEOListener = (request, sender, sendResponse) => {
  if (request.action === "getPageMetadata") {
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                    document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                    'No meta description found.';
    sendResponse({ 
      title, 
      titleLength: title.length,
      description: metaDesc,
      descLength: metaDesc === 'No meta description found.' ? 0 : metaDesc.length,
      _v: __QC_CONTENT_VERSION
    });
  } else if (request.action === "getPageText") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      sendResponse({ text: selectedText, isSelection: true });
    } else {
      sendResponse({ text: getVisibleText(), isSelection: false });
    }
  } else if (request.action === "runSEOAudit") {
    const seoData = collectSEOData();
    sendResponse(seoData);
  } else if (request.action === "cleanupAll") {
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false, error: 'Unknown action' });
  }
  return true;
};

chrome.runtime.onMessage.addListener(window.__qcSEOListener);

// --- Utility: Get Visible Text ---
function getVisibleText() {
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  
  let node;
  while (node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent) continue;
    
    // Skip non-visible elements
    const tagName = parent.tagName;
    if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT' || 
        tagName === 'TEXTAREA' || tagName === 'INPUT' || tagName === 'SVG' ||
        tagName === 'CODE' || tagName === 'PRE') continue;
    
    // Check if element is visible
    const style = window.getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    
    // Check if element has dimensions (is rendered)
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    
    const text = node.nodeValue.trim();
    if (text.length > 0) {
      texts.push(text);
    }
  }
  
  return texts.join(' ');
}

// --- SEO Audit Data Collection ---
function collectSEOData() {
  const data = {};

  // --- Page Meta ---
  data.title = document.title || '';
  data.titleLength = data.title.length;

  const metaDesc = document.querySelector('meta[name="description"]');
  data.metaDescription = metaDesc ? metaDesc.getAttribute('content') || '' : '';
  data.metaDescriptionLength = data.metaDescription.length;

  // --- Canonical ---
  const canonical = document.querySelector('link[rel="canonical"]');
  data.canonicalUrl = canonical ? canonical.getAttribute('href') || '' : '';
  data.currentUrl = window.location.href;

  // --- Robots Meta ---
  const robotsMeta = document.querySelector('meta[name="robots"]');
  data.robotsMeta = robotsMeta ? robotsMeta.getAttribute('content') || '' : '';
  const googlebotMeta = document.querySelector('meta[name="googlebot"]');
  data.googlebotMeta = googlebotMeta ? googlebotMeta.getAttribute('content') || '' : '';

  // --- Headings ---
  data.headings = {};
  for (let i = 1; i <= 6; i++) {
    const tags = document.querySelectorAll(`h${i}`);
    data.headings[`h${i}`] = Array.from(tags).map(h => h.innerText.trim()).filter(t => t.length > 0);
  }

  // --- Images ---
  const images = document.querySelectorAll('img');
  data.totalImages = images.length;
  data.imagesWithoutAlt = [];
  data.imagesWithAlt = 0;
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    if (alt === null || alt.trim() === '') {
      data.imagesWithoutAlt.push({
        src: (img.src || img.getAttribute('data-src') || '').substring(0, 120),
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    } else {
      data.imagesWithAlt++;
    }
  });

  // --- Links ---
  const allLinks = document.querySelectorAll('a[href]');
  const currentHost = window.location.hostname;
  data.internalLinks = 0;
  data.externalLinks = 0;
  data.brokenLinkCandidates = [];
  data.noFollowLinks = 0;
  data.linksWithoutTitle = 0;
  data.linksWithoutTitleSamples = [];
  allLinks.forEach(a => {
    const href = a.href;
    if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const linkUrl = new URL(href);
      if (linkUrl.hostname === currentHost) {
        data.internalLinks++;
      } else {
        data.externalLinks++;
      }
    } catch (e) {
      data.internalLinks++;
    }
    const rel = a.getAttribute('rel') || '';
    if (rel.includes('nofollow')) data.noFollowLinks++;
    if (!a.textContent.trim() && !a.querySelector('img')) {
      data.brokenLinkCandidates.push({ href: href.substring(0, 120), issue: 'Empty anchor text' });
    }
    const title = a.getAttribute('title');
    if (!title || title.trim() === '') {
      data.linksWithoutTitle++;
      if (data.linksWithoutTitleSamples.length < 10) {
        data.linksWithoutTitleSamples.push({
          href: href.substring(0, 120),
          text: (a.textContent || '').trim().substring(0, 60) || '(no text)'
        });
      }
    }
  });

  // --- Open Graph ---
  data.ogTags = {};
  const ogProperties = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name'];
  ogProperties.forEach(prop => {
    const el = document.querySelector(`meta[property="${prop}"]`);
    data.ogTags[prop] = el ? el.getAttribute('content') || '' : '';
  });

  // --- Twitter Card ---
  data.twitterTags = {};
  const twitterProperties = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
  twitterProperties.forEach(prop => {
    const el = document.querySelector(`meta[name="${prop}"]`);
    data.twitterTags[prop] = el ? el.getAttribute('content') || '' : '';
  });

  // --- Structured Data / Schema ---
  const ldJsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
  data.structuredData = [];
  ldJsonScripts.forEach(script => {
    try {
      const parsed = JSON.parse(script.textContent);
      const type = parsed['@type'] || (Array.isArray(parsed['@graph']) ? 'Graph' : 'Unknown');
      data.structuredData.push({ type: type, raw: script.textContent.substring(0, 200) });
    } catch (e) {
      data.structuredData.push({ type: 'Invalid JSON', raw: script.textContent.substring(0, 100) });
    }
  });

  // --- Word Count ---
  const bodyText = getVisibleText();
  data.wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  // --- Language ---
  data.htmlLang = document.documentElement.getAttribute('lang') || '';

  // --- Viewport Meta ---
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  data.viewport = viewportMeta ? viewportMeta.getAttribute('content') || '' : '';

  // --- Charset ---
  const charsetMeta = document.querySelector('meta[charset]') || document.querySelector('meta[http-equiv="Content-Type"]');
  data.charset = charsetMeta ? (charsetMeta.getAttribute('charset') || charsetMeta.getAttribute('content') || '') : '';

  // --- Hreflang ---
  const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
  data.hreflang = Array.from(hreflangLinks).map(l => ({
    lang: l.getAttribute('hreflang'),
    href: l.getAttribute('href')
  }));

  // --- Performance hints ---
  data.performance = {};
  try {
    const perfEntries = performance.getEntriesByType('navigation');
    if (perfEntries.length > 0) {
      const nav = perfEntries[0];
      data.performance.domContentLoaded = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
      data.performance.loadComplete = Math.round(nav.loadEventEnd - nav.startTime);
      data.performance.ttfb = Math.round(nav.responseStart - nav.requestStart);
    }
  } catch (e) {}

  // Resource count
  try {
    const resources = performance.getEntriesByType('resource');
    data.performance.totalResources = resources.length;
    data.performance.totalTransferSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  } catch (e) {}

  // --- FAQ Detection ---
  data.hasFaqSchema = false;
  data.hasFaqSection = false;
  // Check for FAQ schema in structured data
  if (data.structuredData) {
    data.hasFaqSchema = data.structuredData.some(s => s.type === 'FAQPage' || s.raw.includes('FAQPage'));
  }
  // Check for FAQ-like HTML sections
  const allText = document.body.innerText.toLowerCase();
  const faqHeadings = document.querySelectorAll('h1, h2, h3, h4');
  for (const h of faqHeadings) {
    const text = h.innerText.toLowerCase();
    if (text.includes('faq') || text.includes('frequently asked') || text.includes('common questions')) {
      data.hasFaqSection = true;
      break;
    }
  }

  // --- Favicon ---
  const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  data.hasFavicon = !!favicon;

  return data;
}