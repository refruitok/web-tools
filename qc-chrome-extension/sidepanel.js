// --- Programmatic content script injection ---
// Track which tabs have had content scripts injected
const injectedTabs = new Set();

async function ensureContentScriptInjected(tabId) {
  if (injectedTabs.has(tabId)) return true;
  // Skip chrome:// and other restricted URLs silently
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
      return false;
    }
  } catch (e) { return false; }
  try {
    // Check if content script is already present (e.g. from a previous panel session)
    const response = await chrome.tabs.sendMessage(tabId, { action: "getPageMetadata" }).catch(() => null);
    if (response && response.title !== undefined) {
      injectedTabs.add(tabId);
      return true;
    }
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
    } catch (e) {
      // Ignore
    }
  }
});

// Accordion Logic
document.querySelectorAll('.qc-accordion-header').forEach(header => {
  header.addEventListener('click', (e) => {
    // Don't toggle if clicking the scan button
    if (e.target.closest('#scan-pixels-btn')) return;
    
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

// Initialize arrows as collapsed
document.querySelectorAll('.qc-accordion-arrow').forEach(arrow => {
  arrow.style.transform = 'rotate(-90deg)';
});

// Tab Switching Logic
document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all buttons and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');

    // Stop any active area selection when switching tabs
    stopAllSelectionModes();
    hidePageChangedBanner();

    if (tabId === 'feedback') {
      loadFeedbackList();
    } else if (tabId === 'bugs') {
      loadBugList();
    } else if (tabId === 'versioning') {
      loadVersionList();
    }
  });
});

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
    // Detect page navigation and show banner
    const newUrl = tab.url || '';
    if (currentTrackedUrl !== null && newUrl !== currentTrackedUrl) {
      showPageChangedBanner();
    }
    currentTrackedUrl = newUrl;

    // Inject content script if not already present
    const injected = await ensureContentScriptInjected(tab.id);
    if (!injected) return;

    // Fetch and update page metadata
    updateMetadata(tab.id);

    // If spotter is active, re-trigger it on the new tab
    const spotterBtn = document.getElementById('spot-american-btn');
    const countSpan = document.getElementById('spotter-count');
    const navDiv = document.getElementById('spotter-nav');
    
    if (spotterBtn.classList.contains('active')) {
      chrome.tabs.sendMessage(tab.id, { 
        action: "toggleAmericanSpotter", 
        active: true 
      }, (response) => {
        if (chrome.runtime.lastError) {
          countSpan.style.display = 'none';
          navDiv.style.display = 'none';
          return;
        }
        if (response && typeof response.count === 'number') {
          totalErrorsFound = response.count;
          currentErrorIndex = 0;
          countSpan.textContent = totalErrorsFound;
          countSpan.style.display = 'inline-block';
          
          if (totalErrorsFound > 0) {
            navDiv.style.display = 'flex';
            updateErrorIndexDisplay();
          } else {
            navDiv.style.display = 'none';
          }
        } else {
          countSpan.style.display = 'none';
          navDiv.style.display = 'none';
        }
      });
    }

    // Re-trigger Inspect Links if toggle is on
    const linksToggle = document.getElementById('inspect-links-toggle');
    const linksCountSpan = document.getElementById('links-count');
    if (linksToggle.checked) {
      chrome.tabs.sendMessage(tab.id, { action: "showLinkUrls", active: true }, (response) => {
        if (chrome.runtime.lastError) {
          linksCountSpan.style.display = 'none';
          return;
        }
        if (response && typeof response.count === 'number') {
          linksCountSpan.textContent = response.count;
          linksCountSpan.style.display = 'inline-block';
        }
      });
    }

    // Re-trigger Alignment Guide if toggle is on
    const alignmentToggle = document.getElementById('alignment-guide-toggle');
    if (alignmentToggle.checked) {
      chrome.tabs.sendMessage(tab.id, { action: "toggleAlignmentGuide", active: true }, (response) => {
        if (chrome.runtime.lastError) {
          alignmentToggle.checked = false;
        }
      });
    }

    // Re-trigger Image Checker if toggle is on
    const imageToggle = document.getElementById('image-checker-toggle');
    if (imageToggle.checked) {
      chrome.tabs.sendMessage(tab.id, { action: "toggleImageChecker", active: true }, (response) => {
        if (chrome.runtime.lastError) {
          imageToggle.checked = false;
        }
      });
    }

    // Re-trigger Mobile View if toggle is on
    const mobileToggle = document.getElementById('mobile-view-toggle');
    if (mobileToggle.checked) {
      const deviceSelect = document.getElementById('mobile-device-select');
      chrome.tabs.sendMessage(tab.id, { action: "toggleMobileView", active: true, device: deviceSelect.value }, (response) => {
        if (chrome.runtime.lastError) {
          mobileToggle.checked = false;
        }
      });
    }
  }
}

function updateMetadata(tabId) {
  const titleDisplay = document.getElementById('page-title-display');
  const descDisplay = document.getElementById('meta-description-display');
  const titleCount = document.getElementById('title-count');
  const descCount = document.getElementById('desc-count');

  chrome.tabs.sendMessage(tabId, { action: "getPageMetadata" }, (response) => {
    if (chrome.runtime.lastError) {
      titleDisplay.textContent = 'Unable to load title';
      descDisplay.textContent = 'Unable to load description';
      titleCount.textContent = '0 chars';
      descCount.textContent = '0 chars';
      return;
    }

    if (response) {
      titleDisplay.textContent = response.title || 'No title found';
      descDisplay.textContent = response.description || 'No meta description found.';
      titleCount.textContent = `${response.titleLength || 0} chars`;
      descCount.textContent = `${response.descLength || 0} chars`;
      
      // Visual feedback for length (simple QC check)
      titleCount.style.color = (response.titleLength > 60 || response.titleLength < 30) ? '#dc3545' : '#28a745';
      descCount.style.color = (response.descLength > 160 || response.descLength < 50) ? '#dc3545' : '#28a745';
    }
  });
}

// Tracking Pixel Scanner
document.getElementById('scan-pixels-btn').addEventListener('click', async () => {
  const resultsDiv = document.getElementById('pixel-results');
  const btn = document.getElementById('scan-pixels-btn');
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  btn.textContent = 'Scanning...';
  btn.disabled = true;
  
  // Auto-expand the pixel section
  const pixelBody = document.getElementById('pixel-section');
  const pixelArrow = document.querySelector('[data-target="pixel-section"] .qc-accordion-arrow');
  pixelBody.style.display = 'block';
  if (pixelArrow) pixelArrow.style.transform = 'rotate(0deg)';
  
  resultsDiv.innerHTML = '<span style="color: #6c757d;">Scanning page...</span>';

  chrome.tabs.sendMessage(tab.id, { action: "detectTrackingPixels" }, async (response) => {
    if (chrome.runtime.lastError || !response) {
      btn.textContent = 'Scan';
      btn.disabled = false;
      resultsDiv.innerHTML = '<span style="color: #dc3545;">Unable to scan this page.</span>';
      return;
    }

    let pixels = response.pixels || [];
    
    // Use chrome.scripting.executeScript with MAIN world to read runtime pixel objects
    // This bypasses CSP and reads fbq/ttq/dataLayer directly from the page context
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => {
          const runtimePixels = [];
          // Meta Pixel (fbq)
          try {
            if (typeof fbq !== 'undefined') {
              if (fbq.getState) {
                const state = fbq.getState();
                if (state && state.pixels) {
                  state.pixels.forEach(p => { if (p.id) runtimePixels.push({ type: 'Meta Pixel', id: String(p.id) }); });
                }
              }
              if (runtimePixels.filter(p => p.type === 'Meta Pixel').length === 0 && fbq._pixelById) {
                Object.keys(fbq._pixelById).forEach(id => runtimePixels.push({ type: 'Meta Pixel', id: String(id) }));
              }
            }
          } catch(e) {}
          // TikTok (ttq)
          try {
            if (typeof ttq !== 'undefined' && ttq._instances) {
              Object.keys(ttq._instances).forEach(id => runtimePixels.push({ type: 'TikTok Pixel', id: String(id) }));
            }
          } catch(e) {}
          return runtimePixels;
        }
      });
      
      if (results && results[0] && results[0].result) {
        const runtimePixels = results[0].result;
        // Merge runtime pixels, replacing "Detected (ID not found)" entries
        runtimePixels.forEach(rp => {
          const existingIdx = pixels.findIndex(p => p.type === rp.type && p.id === 'Detected (ID not found)');
          if (existingIdx !== -1) {
            pixels.splice(existingIdx, 1);
          }
          if (!pixels.some(p => p.type === rp.type && p.id === rp.id)) {
            // Insert at beginning for Meta Pixel, otherwise append
            const insertIdx = pixels.findIndex(p => p.type === rp.type);
            if (insertIdx !== -1) {
              pixels.splice(insertIdx + 1, 0, rp);
            } else {
              pixels.unshift(rp);
            }
          }
        });
      }
    } catch(e) {
      console.log('QCHF Debug - Runtime pixel check error:', e);
    }
    
    btn.textContent = 'Scan';
    btn.disabled = false;
    if (pixels.length === 0) {
      resultsDiv.innerHTML = '<span style="color: #6c757d;">No tracking pixels detected.</span>';
      return;
    }

    const typeColors = {
      'Meta Pixel': { bg: '#e7f0fd', color: '#1877f2', icon: 'f' },
      'TikTok Pixel': { bg: '#f0f0f0', color: '#000000', icon: '♪' },
      'Google Ads': { bg: '#fef7e0', color: '#ea4335', icon: '$' },
      'Google Analytics': { bg: '#e8f5e9', color: '#34a853', icon: 'G' },
      'Google Tag Manager': { bg: '#e3f2fd', color: '#4285f4', icon: 'T' },
      'LinkedIn Insight': { bg: '#e8f0fe', color: '#0a66c2', icon: 'in' },
      'Tealium': { bg: '#f3e8fd', color: '#6f42c1', icon: 'TQ' },
    };

    resultsDiv.innerHTML = pixels.map(p => {
      const tc = typeColors[p.type] || { bg: '#f8f9fa', color: '#495057', icon: '?' };
      return `
        <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="width: 22px; height: 22px; border-radius: 4px; background: ${tc.bg}; color: ${tc.color}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">${tc.icon}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6c757d; font-weight: 600;">${p.type}</div>
            <div style="font-size: 12px; color: #212529; font-family: monospace; word-break: break-all;">${p.id}</div>
          </div>
        </div>`;
    }).join('');
  });
});

async function loadFeedbackList(silent = false) {
  // Skip if we just submitted and prepended locally
  if (skipNextFeedbackRefresh) {
    skipNextFeedbackRefresh = false;
    return;
  }
  
  const listElement = document.getElementById('feedback-list');
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  const settings = await chrome.storage.local.get(['wpUrl', 'wpToken']);
  
  if (!settings.wpToken || !settings.wpUrl) {
    listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">Login to WordPress to see activity.</p>';
    return;
  }

  if (!silent) {
    listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">Loading activity...</p>';
  }

  try {
    const url = new URL(tab.url).href;
    const response = await fetch(`${settings.wpUrl}/wp-json/qc/v1/feedback?url=${encodeURIComponent(url)}&limit=20&_=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${settings.wpToken}`
      }
    });

    if (response.status === 401) {
      handleWpLogout();
      listElement.innerHTML = '<p style="text-align: center; color: #dc3545; font-size: 12px; padding: 20px 0;">Session expired. Please login again.</p>';
      return;
    }

    const data = await response.json();
    currentFeedbackItems = data.items || [];
    
    // Sync markers to page
    chrome.tabs.sendMessage(tab.id, {
      action: 'syncMarkers',
      markers: currentFeedbackItems
    });

    renderFeedbackItems(currentFeedbackItems);
  } catch (error) {
    console.error('Error loading feedback:', error);
    if (!silent) {
      listElement.innerHTML = '<p style="text-align: center; color: #dc3545; font-size: 12px; padding: 20px 0;">Failed to load activity.</p>';
    }
  }
}

async function renderFeedbackItems(items) {
  const listElement = document.getElementById('feedback-list');
  if (items.length > 0) {
    // Load collapsed states from storage
    const { collapsedFeedbackItems = {} } = await chrome.storage.local.get('collapsedFeedbackItems');

    listElement.innerHTML = items.map((item) => {
      const dateObj = new Date(item.createdAt);
      const dateStr = dateObj.toLocaleDateString();
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const isResolved = !!item.resolvedAt;
      const markerNum = item.markerNum || '';
      const markerColor = item.markerColor || '#ff4757';
      const isCollapsed = collapsedFeedbackItems[item.id] === true;

      return `
      <div class="feedback-item ${isResolved ? 'resolved' : ''}" data-id="${item.id}" id="comment-${item.id}" style="background: ${isResolved ? '#f1f2f6' : '#fff'}; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; cursor: pointer; background: ${isResolved ? '#f8f9fa' : '#fff'}; border-bottom: 1px solid ${isCollapsed ? 'transparent' : '#eee'};" class="accordion-header" data-id="${item.id}">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
            ${markerNum ? `<span style="background: ${isResolved ? '#2ed573' : markerColor}; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">${markerNum}</span>` : ''}
            <div style="display: flex; flex-direction: column; min-width: 0;">
              <span style="font-weight: 600; font-size: 12px; color: #2f3542;">By: ${item.authorName}</span>
              <span style="font-size: 10px; color: #6c757d;">${dateStr} ${timeStr}</span>
            </div>
          </div>
          <svg class="accordion-icon" viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: none; stroke: #a4b0be; stroke-width: 2.5; transition: transform 0.3s ease; flex-shrink: 0; ${isCollapsed ? '' : 'transform: rotate(180deg);'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        
        <div class="accordion-content" style="display: ${isCollapsed ? 'none' : 'block'}; padding: 10px; background: #fff;">
          ${item.imageUrl ? `
            <div style="margin-bottom: 10px; border-radius: 6px; overflow: hidden; border: 1px solid #eee; cursor: zoom-in; position: relative; background: #f8f9fa;" onclick="window.open('${item.imageUrl}', '_blank')">
              <img src="${item.imageUrl}" style="width: 100%; display: block; max-height: 200px; object-fit: contain;">
              <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px;">Click to enlarge</div>
            </div>
          ` : ''}

          <div class="feedback-text" style="font-size: 13px; color: #2f3542; margin-bottom: 12px; line-height: 1.5; ${isResolved ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
            ${item.notes}
          </div>

          ${item.attachmentUrl ? `
            <div style="margin-bottom: 10px; padding: 6px 8px; background: #f8f9fa; border: 1px solid #eee; border-radius: 4px; display: flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; stroke: #6c757d; stroke-width: 2; fill: none; flex-shrink: 0;"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path></svg>
              <a href="${item.attachmentUrl}" target="_blank" style="font-size: 11px; color: #007bff; text-decoration: none; word-break: break-all; flex: 1;">${item.attachmentName || 'Attachment'}</a>
            </div>
          ` : ''}

          ${isResolved ? `
            <div style="font-size: 10px; color: #2ed573; font-style: italic; margin-bottom: 8px; background: #e3faef; padding: 4px 8px; border-radius: 4px;">
              ✓ Resolved by ${item.resolvedBy}
            </div>
          ` : ''}

          <div style="display: flex; gap: 8px;">
            <button class="jump-to-marker-btn" data-id="${item.id}" style="flex: 1; padding: 4px; font-size: 11px; background: #f1f2f6; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; color: #57606f;">Jump</button>
            <button class="resolve-feedback-btn" data-id="${item.id}" data-resolved="${isResolved}" style="flex: 1.5; padding: 4px; font-size: 11px; background: ${isResolved ? '#6c757d' : '#2ed573'}; border: none; border-radius: 4px; cursor: pointer; color: white;">
              ${isResolved ? 'Re-open' : 'Resolve'}
            </button>
            <button class="delete-feedback-btn" data-id="${item.id}" style="padding: 4px 8px; font-size: 11px; background: #ff4757; border: none; border-radius: 4px; cursor: pointer; color: white;">&times;</button>
          </div>
        </div>
      </div>
      `;
    }).join('');

    // Add event listeners
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.onclick = async () => {
        const id = header.dataset.id;
        const item = header.closest('.feedback-item');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');
        const isHidden = content.style.display === 'none';

        content.style.display = isHidden ? 'block' : 'none';
        icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        item.style.borderBottomColor = isHidden ? '#eee' : 'transparent';

        // Save state
        const { collapsedFeedbackItems = {} } = await chrome.storage.local.get('collapsedFeedbackItems');
        if (isHidden) {
          delete collapsedFeedbackItems[id];
        } else {
          collapsedFeedbackItems[id] = true;
        }
        await chrome.storage.local.set({ collapsedFeedbackItems });
      };
    });
    document.querySelectorAll('.jump-to-marker-btn').forEach(btn => {
      btn.onclick = () => jumpToMarker(btn.dataset.id);
    });
    document.querySelectorAll('.resolve-feedback-btn').forEach(btn => {
      btn.onclick = () => resolveFeedback(btn.dataset.id);
    });
    document.querySelectorAll('.delete-feedback-btn').forEach(btn => {
      btn.onclick = () => deleteFeedback(btn.dataset.id);
    });

  } else {
    listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">No activity for this page yet.</p>';
  }
}

async function jumpToMarker(id) {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'scrollToMarker',
      feedbackId: id
    });
  }
}

async function resolveFeedback(id) {
  const btn = document.querySelector(`.resolve-feedback-btn[data-id="${id}"]`);
  const isCurrentlyResolved = btn.dataset.resolved === 'true';
  
  const settings = await chrome.storage.local.get(['wpUrl', 'wpToken', 'wpUserDisplay']);
  if (!settings.wpToken || !settings.wpUrl) return;

  try {
    const action = isCurrentlyResolved ? 'unresolve' : 'resolve';
    const response = await fetch(`${settings.wpUrl}/wp-json/qc/v1/feedback/${id}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.wpToken}`
      }
    });

    if (response.ok) {
      // Update local data instead of full refresh
      const itemIndex = currentFeedbackItems.findIndex(item => item.id == id);
      if (itemIndex !== -1) {
        if (isCurrentlyResolved) {
          // Unresolve
          currentFeedbackItems[itemIndex].resolvedAt = null;
          currentFeedbackItems[itemIndex].resolvedBy = null;
        } else {
          // Resolve
          currentFeedbackItems[itemIndex].resolvedAt = new Date().toISOString();
          currentFeedbackItems[itemIndex].resolvedBy = settings.wpUserDisplay || 'You';
        }
        skipNextFeedbackRefresh = true;
        await renderFeedbackItems(currentFeedbackItems);
        
        // Sync markers to page
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'syncMarkers',
            markers: currentFeedbackItems
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error toggling resolution for feedback ${id}:`, error);
  }
}

async function deleteFeedback(id) {
  if (!confirm('Are you sure you want to delete this comment?')) return;
  
  const settings = await chrome.storage.local.get(['wpUrl', 'wpToken']);
  if (!settings.wpToken || !settings.wpUrl) return;

  try {
    const response = await fetch(`${settings.wpUrl}/wp-json/qc/v1/feedback/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${settings.wpToken}`
      }
    });

    if (response.ok) {
      // Update local data instead of full refresh
      currentFeedbackItems = currentFeedbackItems.filter(item => item.id != id);
      skipNextFeedbackRefresh = true;
      await renderFeedbackItems(currentFeedbackItems);
      
      // Sync markers to page
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'syncMarkers',
          markers: currentFeedbackItems
        });
      }
    }
  } catch (error) {
    console.error('Error deleting feedback:', error);
  }
}

// Store feedback items globally for jumping
let currentFeedbackItems = [];
let pendingMarkerData = null;
let skipNextFeedbackRefresh = false; // Flag to prevent auto-refresh after submission

function showFeedbackStatus(message, color = '#212529') {
  const statusDiv = document.getElementById('feedback-status');
  statusDiv.textContent = message;
  statusDiv.style.color = color;
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 5000);
}

let markersVisible = true;

// Toggle markers visibility - use DOMContentLoaded to ensure element exists
const toggleBtn = document.getElementById('toggle-markers-btn');
if (toggleBtn) {
  toggleBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab) return;
    
    markersVisible = !markersVisible;
    
    // Update button icons
    document.getElementById('markers-visible-icon').style.display = markersVisible ? 'block' : 'none';
    document.getElementById('markers-hidden-icon').style.display = markersVisible ? 'none' : 'block';
    
    // Update button style
    toggleBtn.style.background = markersVisible ? '#57606f' : '#adb5bd';
    
    // Send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggleMarkersVisibility',
        visible: markersVisible
      });
    } catch (e) {
      console.log('Could not send toggle message to tab:', e);
    }
  });
}

// Marker placement interactions — toggle on/off
let markerPlacementActive = false;
let bugAreaSelectionActive = false;

function setMarkerToggleUI(active) {
  const btn = document.getElementById('add-marker-btn');
  const label = document.getElementById('marker-btn-label');
  const onIcon = document.getElementById('marker-on-icon');
  const offIcon = document.getElementById('marker-off-icon');
  markerPlacementActive = active;
  if (active) {
    btn.style.background = '#ff4757';
    label.textContent = 'Selection Mode ON';
    onIcon.style.display = '';
    offIcon.style.display = 'none';
  } else {
    btn.style.background = '#57606f';
    label.textContent = 'Select Area';
    onIcon.style.display = 'none';
    offIcon.style.display = '';
  }
}

document.getElementById('add-marker-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  if (markerPlacementActive) {
    // Turn off
    chrome.tabs.sendMessage(tab.id, { action: 'stopMarkerPlacement' });
    setMarkerToggleUI(false);
    showFeedbackStatus('');
  } else {
    // Turn off bug selection if active
    if (bugAreaSelectionActive) {
      chrome.tabs.sendMessage(tab.id, { action: 'stopMarkerPlacement' });
      setBugCaptureUI(false);
    }
    // Turn on feedback selection
    chrome.tabs.sendMessage(tab.id, { action: 'startMarkerPlacement', source: 'feedback' });
    setMarkerToggleUI(true);
    showFeedbackStatus('Drag to select an area on the page', '#ff4757');
  }
});

document.getElementById('cancel-marker-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) {
    await ensureContentScriptInjected(tab.id);
    chrome.tabs.sendMessage(tab.id, { action: 'stopMarkerPlacement' });
  }
  setMarkerToggleUI(false);
  resetFeedbackForm();
});

function resetFeedbackForm() {
  document.getElementById('feedback-form').style.display = 'none';
  document.getElementById('feedback-notes').value = '';
  pendingMarkerData = null;
  setMarkerToggleUI(false);
}

// Stop all area selection modes (feedback + bug)
async function stopAllSelectionModes() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) {
    try {
      await ensureContentScriptInjected(tab.id);
      chrome.tabs.sendMessage(tab.id, { action: 'stopMarkerPlacement' });
    } catch (e) { /* ignore */ }
  }
  if (markerPlacementActive) {
    setMarkerToggleUI(false);
  }
  if (bugAreaSelectionActive) {
    setBugCaptureUI(false);
  }
}

// ============ BUG REPORTS ============

let pendingBugScreenshot = null;

function updateBugSubmitterDisplay() {
  const display = document.getElementById('bug-submitter-display');
  chrome.storage.local.get(['wpUser'], (result) => {
    if (result.wpUser) {
      display.textContent = result.wpUser.displayName || result.wpUser.username || 'Unknown';
      display.style.color = '';
    } else {
      display.textContent = 'Not logged in';
      display.style.color = '#dc3545';
    }
  });
}

updateBugSubmitterDisplay();

async function loadBugList() {
  const listElement = document.getElementById('bug-list');
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;

  const settings = await chrome.storage.local.get(['wpUrl', 'wpToken']);
  if (!settings.wpToken || !settings.wpUrl) {
    listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">Login to WordPress to see bug reports.</p>';
    return;
  }

  listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">Loading bug reports...</p>';

  try {
    const url = new URL(tab.url).href;
    const response = await fetch(`${settings.wpUrl}/wp-json/qc/v1/bugs?url=${encodeURIComponent(url)}&limit=20&_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${settings.wpToken}` }
    });

    if (response.status === 401) {
      handleWpLogout();
      listElement.innerHTML = '<p style="text-align: center; color: #dc3545; font-size: 12px; padding: 20px 0;">Session expired. Please login again.</p>';
      return;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">No bug reports for this page.</p>';
      return;
    }

    listElement.innerHTML = data.items.map(item => {
      const date = new Date(item.createdAt);
      const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const screenshotHtml = item.screenshotUrl
        ? `<div style="margin-bottom: 6px;"><a href="${escapeHtml(item.screenshotUrl)}" target="_blank"><img src="${escapeHtml(item.screenshotUrl)}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 3px; border: 1px solid #dee2e6; display: block;" /></a></div>`
        : '';
      return `
        <div class="feedback-item" style="border-left: 3px solid #dc3545;">
          ${screenshotHtml}
          <div style="font-size: 12px; color: #212529; line-height: 1.5; margin-bottom: 6px;">${escapeHtml(item.message)}</div>
          <div class="feedback-meta" style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #495057;">${escapeHtml(item.submitterName)}</span>
            <span>${dateStr} ${timeStr}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    listElement.innerHTML = '<p style="text-align: center; color: #dc3545; font-size: 12px; padding: 20px 0;">Failed to load bug reports.</p>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Bug screenshot capture — uses area selection (same as feedback)
function setBugCaptureUI(active) {
  const btn = document.getElementById('bug-capture-btn');
  bugAreaSelectionActive = active;
  if (active) {
    btn.style.background = '#dc3545';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="3"></line></svg>
      Selection Mode ON — Drag on page
    `;
  } else {
    btn.style.background = '#6c757d';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="3"></line></svg>
      Select Area to Capture
    `;
  }
}

document.getElementById('bug-capture-btn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found.');
    if (!tab.url || tab.url.startsWith('chrome:')) throw new Error('Cannot capture system pages.');
    await ensureContentScriptInjected(tab.id);

    if (bugAreaSelectionActive) {
      // Turn off
      chrome.tabs.sendMessage(tab.id, { action: 'stopMarkerPlacement' });
      setBugCaptureUI(false);
    } else {
      // Turn off feedback selection if active
      if (markerPlacementActive) {
        chrome.tabs.sendMessage(tab.id, { action: 'stopMarkerPlacement' });
        setMarkerToggleUI(false);
        showFeedbackStatus('');
      }
      // Turn on bug area selection
      chrome.tabs.sendMessage(tab.id, { action: 'startMarkerPlacement', source: 'bug' });
      setBugCaptureUI(true);
      const statusDiv = document.getElementById('bug-status');
      statusDiv.textContent = 'Drag to select an area on the page';
      statusDiv.style.color = '#dc3545';
      setTimeout(() => { statusDiv.textContent = ''; }, 4000);
    }
  } catch (error) {
    console.error('Bug area selection error:', error);
    const statusDiv = document.getElementById('bug-status');
    statusDiv.textContent = `Error: ${error.message}`;
    statusDiv.style.color = '#dc3545';
    setTimeout(() => { statusDiv.textContent = ''; }, 4000);
  }
});

// Remove bug screenshot
document.getElementById('bug-remove-screenshot').addEventListener('click', () => {
  pendingBugScreenshot = null;
  document.getElementById('bug-screenshot-preview').style.display = 'none';
  document.getElementById('bug-preview-image').src = '';
  setBugCaptureUI(false);
});

// Submit bug report
document.getElementById('submit-bug-btn').addEventListener('click', async () => {
  const message = document.getElementById('bug-message').value.trim();
  const statusDiv = document.getElementById('bug-status');
  const submitBtn = document.getElementById('submit-bug-btn');

  if (!message) {
    statusDiv.textContent = 'Please describe the bug';
    statusDiv.style.color = '#dc3545';
    return;
  }

  const settings = await chrome.storage.local.get(['wpUrl', 'wpToken', 'wpUser']);
  if (!settings.wpToken || !settings.wpUrl) {
    statusDiv.textContent = 'Please login to WordPress first (Settings tab)';
    statusDiv.style.color = '#dc3545';
    return;
  }

  const submitterName = settings.wpUser?.displayName || settings.wpUser?.username || '';

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const body = {
      message,
      url: tab.url,
      pageTitle: tab.title,
      submitterName
    };

    if (pendingBugScreenshot) {
      body.image = pendingBugScreenshot;
    }

    const response = await fetch(`${settings.wpUrl}/wp-json/qc/v1/bugs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.wpToken}`
      },
      body: JSON.stringify(body)
    });

    if (response.status === 401) {
      handleWpLogout();
      statusDiv.textContent = 'Session expired. Please login again.';
      statusDiv.style.color = '#dc3545';
      return;
    }

    const data = await response.json();
    if (data.id) {
      statusDiv.textContent = 'Bug report submitted!';
      statusDiv.style.color = '#28a745';
      document.getElementById('bug-message').value = '';
      pendingBugScreenshot = null;
      document.getElementById('bug-screenshot-preview').style.display = 'none';
      document.getElementById('bug-preview-image').src = '';
      loadBugList();
    } else {
      statusDiv.textContent = 'Failed to submit bug report';
      statusDiv.style.color = '#dc3545';
    }
  } catch (e) {
    statusDiv.textContent = 'Error submitting bug report';
    statusDiv.style.color = '#dc3545';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Bug Report';
    setTimeout(() => { statusDiv.textContent = ''; }, 4000);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'jumpToComment') {
    const el = document.getElementById(`comment-${request.feedbackId}`);
    if (el) {
      // Expand if collapsed
      const content = el.querySelector('.accordion-content');
      if (content && content.style.display === 'none') {
        const header = el.querySelector('.accordion-header');
        if (header) header.click();
      }
      
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 10px rgba(255, 71, 87, 0.3)';
      el.style.borderColor = '#ff4757';
      
      setTimeout(() => {
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        el.style.borderColor = '#dee2e6';
      }, 2000);
    }
  }
});

// Add color selection visual feedback
document.querySelectorAll('input[name="marker-color"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    document.querySelectorAll('input[name="marker-color"] + span').forEach(span => {
      span.style.boxShadow = '0 0 0 1px #ddd';
      span.style.transform = 'scale(1)';
    });
    const span = e.target.nextElementSibling;
    span.style.boxShadow = '0 0 0 2px #007bff';
    span.style.transform = 'scale(1.1)';
  });
});

// Initial state for first color
const initialColor = document.querySelector('input[name="marker-color"]:checked');
if (initialColor) {
  const span = initialColor.nextElementSibling;
  span.style.boxShadow = '0 0 0 2px #007bff';
  span.style.transform = 'scale(1.1)';
}

let currentErrorIndex = 0;
let totalErrorsFound = 0;
let currentErrors = []; // Store error details for display

document.getElementById('spot-american-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  const button = document.getElementById('spot-american-btn');
  const countSpan = document.getElementById('spotter-count');
  const navDiv = document.getElementById('spotter-nav');
  const isActive = button.classList.toggle('active');
  
  if (isActive) {
    // Deactivate AI spotter if active
    const aiBtn = document.getElementById('deepseek-check-btn');
    if (aiBtn.classList.contains('active')) {
      aiBtn.classList.remove('active');
      document.getElementById('ai-spotter-count').style.display = 'none';
    }
    // Deactivate gap checker if active
    const gapBtn = document.getElementById('gap-checker-btn');
    if (gapBtn.classList.contains('active')) {
      gapBtn.classList.remove('active');
      document.getElementById('gap-checker-count').style.display = 'none';
    }
    
    // Clear AI errors and hide detail panel for American spotter
    currentErrors = [];
    document.getElementById('error-detail').style.display = 'none';

    chrome.tabs.sendMessage(tab.id, { 
      action: "toggleAmericanSpotter", 
      active: true 
    }, (response) => {
      if (response && typeof response.count === 'number') {
        totalErrorsFound = response.count;
        currentErrorIndex = 0;
        countSpan.textContent = totalErrorsFound;
        countSpan.style.display = 'inline-block';
        
        if (totalErrorsFound > 0) {
          navDiv.style.display = 'flex';
          updateErrorIndexDisplay();
          jumpToCurrentError();
        } else {
          navDiv.style.display = 'none';
        }
      }
    });
  } else {
    chrome.tabs.sendMessage(tab.id, { 
      action: "toggleAmericanSpotter", 
      active: false 
    });
    countSpan.style.display = 'none';
    navDiv.style.display = 'none';
    document.getElementById('error-detail').style.display = 'none';
    totalErrorsFound = 0;
    currentErrorIndex = 0;
  }
});

document.getElementById('gap-checker-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  const button = document.getElementById('gap-checker-btn');
  const countSpan = document.getElementById('gap-checker-count');
  const navDiv = document.getElementById('spotter-nav');
  const isActive = button.classList.toggle('active');
  
  if (isActive) {
    // Deactivate other spotters
    const amBtn = document.getElementById('spot-american-btn');
    if (amBtn.classList.contains('active')) {
      amBtn.classList.remove('active');
      document.getElementById('spotter-count').style.display = 'none';
    }
    const aiBtn = document.getElementById('deepseek-check-btn');
    if (aiBtn.classList.contains('active')) {
      aiBtn.classList.remove('active');
      document.getElementById('ai-spotter-count').style.display = 'none';
    }
    currentErrors = [];
    document.getElementById('error-detail').style.display = 'none';

    chrome.tabs.sendMessage(tab.id, { 
      action: "toggleGapChecker", 
      active: true 
    }, (response) => {
      if (response && typeof response.count === 'number') {
        totalErrorsFound = response.count;
        currentErrorIndex = 0;
        countSpan.textContent = totalErrorsFound;
        countSpan.style.display = 'inline-block';
        
        if (totalErrorsFound > 0) {
          navDiv.style.display = 'flex';
          updateErrorIndexDisplay();
          jumpToCurrentError();
        } else {
          navDiv.style.display = 'none';
        }
      }
    });
  } else {
    chrome.tabs.sendMessage(tab.id, { 
      action: "toggleGapChecker", 
      active: false 
    });
    countSpan.style.display = 'none';
    navDiv.style.display = 'none';
    document.getElementById('error-detail').style.display = 'none';
    totalErrorsFound = 0;
    currentErrorIndex = 0;
  }
});

document.getElementById('prev-error-btn').addEventListener('click', () => {
  if (totalErrorsFound === 0) return;
  currentErrorIndex = (currentErrorIndex - 1 + totalErrorsFound) % totalErrorsFound;
  updateErrorIndexDisplay();
  jumpToCurrentError();
});

document.getElementById('next-error-btn').addEventListener('click', () => {
  if (totalErrorsFound === 0) return;
  currentErrorIndex = (currentErrorIndex + 1) % totalErrorsFound;
  updateErrorIndexDisplay();
  jumpToCurrentError();
});

function updateErrorIndexDisplay() {
  const display = document.getElementById('error-index-display');
  const prevBtn = document.getElementById('prev-error-btn');
  const nextBtn = document.getElementById('next-error-btn');
  const detailDiv = document.getElementById('error-detail');
  
  if (totalErrorsFound > 0) {
    display.textContent = `${currentErrorIndex + 1} / ${totalErrorsFound}`;
    prevBtn.disabled = totalErrorsFound <= 1;
    nextBtn.disabled = totalErrorsFound <= 1;
    
    // Show error details if we have them
    if (currentErrors.length > 0 && currentErrors[currentErrorIndex]) {
      const error = currentErrors[currentErrorIndex];
      document.getElementById('error-original').textContent = error.original;
      document.getElementById('error-correction').textContent = error.correction;
      document.getElementById('error-explanation').textContent = error.explanation || '';
      detailDiv.style.display = 'block';
    } else {
      detailDiv.style.display = 'none';
    }
  } else {
    display.textContent = '0 / 0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    detailDiv.style.display = 'none';
  }
}

async function jumpToCurrentError() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { 
    action: "jumpToHighlight", 
    index: currentErrorIndex 
  });
}

// Load settings and toggle states on startup
chrome.storage.local.get(['deepseekApiKey', 'openaiApiKey', 'aiProvider', 'inspectLinksActive', 'alignmentGuideActive', 'imageCheckerActive', 'mobileViewActive', 'mobileDevice', 'wpUrl', 'wpToken', 'wpUser'], (result) => {
  if (chrome.runtime.lastError) {
    console.error('Error loading settings:', chrome.runtime.lastError);
    return;
  }

  // WordPress State
  if (result.wpToken && result.wpUrl) {
    updateWpUI(result.wpUser, result.wpUrl);
    // Verify token is still valid
    checkWpAuth(result.wpUrl, result.wpToken);
  } else {
    // Not logged in — restrict QC tab
    updateQcTabAccess(null);
  }

  if (result.deepseekApiKey) {
    document.getElementById('deepseek-api-key').value = result.deepseekApiKey;
  }
  if (result.openaiApiKey) {
    document.getElementById('openai-api-key').value = result.openaiApiKey;
  }
  if (result.aiProvider) {
    const provider = result.aiProvider;
    document.getElementById('ai-provider').value = provider;
    toggleApiKeyFields(provider);
  }
  
  // Set toggle states and expand options if active
  if (result.inspectLinksActive !== undefined) {
    document.getElementById('inspect-links-toggle').checked = result.inspectLinksActive;
  }
  if (result.alignmentGuideActive !== undefined) {
    document.getElementById('alignment-guide-toggle').checked = result.alignmentGuideActive;
    if (result.alignmentGuideActive) {
      document.getElementById('alignment-guide-options').classList.add('expanded');
    }
  }
  if (result.imageCheckerActive !== undefined) {
    document.getElementById('image-checker-toggle').checked = result.imageCheckerActive;
    if (result.imageCheckerActive) {
      document.getElementById('image-checker-options').classList.add('expanded');
    }
  }
  if (result.mobileViewActive !== undefined) {
    document.getElementById('mobile-view-toggle').checked = result.mobileViewActive;
    if (result.mobileViewActive) {
      document.getElementById('mobile-view-options').classList.add('expanded');
    }
  }
  if (result.mobileDevice) {
    document.getElementById('mobile-device-select').value = result.mobileDevice;
  }

  // Initial load of tab info after settings/toggles are ready
  updateCurrentTabInfo();
});

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
  
  chrome.storage.local.set({ 
    deepseekApiKey: deepseekKey,
    openaiApiKey: openaiKey,
    aiProvider: aiProvider
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

const SYSTEM_PROMPT = `You are a British English spelling checker for websites. Your ONLY job is to find spelling mistakes.

CHECK FOR:
1. Misspelled words (typos, incorrect letter combinations)
2. American spellings that should be British (e.g., "color" → "colour", "analyze" → "analyse", "center" → "centre")

DO NOT FLAG:
- Grammar issues
- Punctuation
- Style preferences
- Sentence structure
- Placeholder text (Lorem ipsum, etc.)
- Repeated words
- Incomplete sentences

IMPORTANT:
- Only flag actual spelling errors
- Use British English as the standard (colour, organisation, realise, centre, etc.)
- Return a JSON object with an 'errors' key containing an array of objects
- Each object must have: 'original' (the misspelled word), 'correction' (British spelling), 'explanation' (brief note)
- If no spelling errors found, return {"errors": []}
- Only return valid JSON, nothing else`;

async function callAIAPI(text) {
  const settings = await chrome.storage.local.get(['deepseekApiKey', 'openaiApiKey', 'aiProvider']);
  const provider = settings.aiProvider || 'deepseek';
  
  if (provider === 'openai') {
    return callOpenAIAPI(text, settings.openaiApiKey);
  } else {
    return callDeepSeekAPI(text, settings.deepseekApiKey);
  }
}

async function callDeepSeekAPI(text, apiKey) {
  if (!apiKey) {
    alert('Please set your DeepSeek API key in the Settings tab.');
    return null;
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Check this website text for spelling errors only (use British English spelling):\n\n${text.substring(0, 8000)}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from DeepSeek API');
    }
    const content = JSON.parse(data.choices[0].message.content);
    return content.errors || [];
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    alert('Error calling DeepSeek API. Check console for details.');
    return null;
  }
}

async function callOpenAIAPI(text, apiKey) {
  if (!apiKey) {
    alert('Please set your OpenAI API key in the Settings tab.');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Check this website text for spelling errors only (use British English spelling):\n\n${text.substring(0, 8000)}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }
    const content = JSON.parse(data.choices[0].message.content);
    return content.errors || [];
  } catch (error) {
    console.error('OpenAI API Error:', error);
    alert('Error calling OpenAI API. Check console for details.');
    return null;
  }
}

document.getElementById('deepseek-check-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  const button = document.getElementById('deepseek-check-btn');
  const navDiv = document.getElementById('spotter-nav');
  
  const isActive = button.classList.toggle('active');
  
  if (isActive) {
    // Deactivate American spotter if active
    const amBtn = document.getElementById('spot-american-btn');
    if (amBtn.classList.contains('active')) {
      amBtn.classList.remove('active');
      document.getElementById('spotter-count').style.display = 'none';
    }
    // Deactivate gap checker if active
    const gapBtn = document.getElementById('gap-checker-btn');
    if (gapBtn.classList.contains('active')) {
      gapBtn.classList.remove('active');
      document.getElementById('gap-checker-count').style.display = 'none';
    }

    button.disabled = true;

    // First, get the text from the page
    chrome.tabs.sendMessage(tab.id, { action: "getPageText" }, async (response) => {
      if (response && response.text) {
        button.textContent = response.isSelection ? 'Checking selection...' : 'Checking page...';
        const errors = await callAIAPI(response.text);
        
        if (errors) {
          currentErrors = errors; // Store errors for display
          chrome.tabs.sendMessage(tab.id, { 
            action: "showAiHighlights", 
            errors: errors 
          }, (res) => {
            button.innerHTML = `
              <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
              <span id="ai-check-label">AI Spell Check</span>
              <span id="ai-spotter-count" style="display: inline-block; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 10px; font-size: 11px; margin-left: auto;">${res.count}</span>
            `;
            button.disabled = false;
            
            if (res.count > 0) {
              totalErrorsFound = res.count;
              currentErrorIndex = 0;
              navDiv.style.display = 'flex';
              updateErrorIndexDisplay();
              jumpToCurrentError();
            } else {
              alert('No errors found by AI.');
              button.classList.remove('active');
              navDiv.style.display = 'none';
              currentErrors = [];
            }
          });
        } else {
          button.innerHTML = `
            <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            <span id="ai-check-label">AI Spell Check</span>
            <span id="ai-spotter-count" style="display: none; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 10px; font-size: 11px; margin-left: auto;">0</span>
          `;
          button.disabled = false;
          button.classList.remove('active');
        }
      }
    });
  } else {
    chrome.tabs.sendMessage(tab.id, { action: "removeHighlights" });
    navDiv.style.display = 'none';
    document.getElementById('error-detail').style.display = 'none';
    totalErrorsFound = 0;
    currentErrorIndex = 0;
    currentErrors = [];
  }
});

// Inspect Links Toggle
document.getElementById('inspect-links-toggle').addEventListener('change', async (e) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const isActive = e.target.checked;
  
  // Persist state
  chrome.storage.local.set({ inspectLinksActive: isActive });

  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  const countSpan = document.getElementById('links-count');

  if (isActive) {
    chrome.tabs.sendMessage(tab.id, { action: "showLinkUrls", active: true }, (response) => {
      if (response && typeof response.count === 'number') {
        countSpan.textContent = response.count;
        countSpan.style.display = 'inline-block';
      }
    });
  } else {
    chrome.tabs.sendMessage(tab.id, { action: "showLinkUrls", active: false });
    countSpan.style.display = 'none';
  }
});

// Alignment Guide Toggle
document.getElementById('alignment-guide-toggle').addEventListener('change', async (e) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const isActive = e.target.checked;

  // Toggle options visibility
  document.getElementById('alignment-guide-options').classList.toggle('expanded', isActive);

  // Persist state
  chrome.storage.local.set({ alignmentGuideActive: isActive });

  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  chrome.tabs.sendMessage(tab.id, { action: "toggleAlignmentGuide", active: isActive }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Alignment guide error:', chrome.runtime.lastError);
    }
  });
});

// Image Checker Toggle
document.getElementById('image-checker-toggle').addEventListener('change', async (e) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const isActive = e.target.checked;

  // Toggle options visibility
  document.getElementById('image-checker-options').classList.toggle('expanded', isActive);

  // Persist state
  chrome.storage.local.set({ imageCheckerActive: isActive });

  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  chrome.tabs.sendMessage(tab.id, { action: "toggleImageChecker", active: isActive }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Image checker error:', chrome.runtime.lastError);
    }
  });
});

// Mobile View Toggle
document.getElementById('mobile-view-toggle').addEventListener('change', async (e) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const isActive = e.target.checked;
  const deviceSelect = document.getElementById('mobile-device-select');
  const selectedDevice = deviceSelect.value;

  // Toggle options visibility
  document.getElementById('mobile-view-options').classList.toggle('expanded', isActive);

  // Persist state
  chrome.storage.local.set({ mobileViewActive: isActive, mobileDevice: selectedDevice });

  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  chrome.tabs.sendMessage(tab.id, { action: "toggleMobileView", active: isActive, device: selectedDevice }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Mobile view error:', chrome.runtime.lastError);
    }
  });
});

// Mobile Device Select Change - update view if already active
document.getElementById('mobile-device-select').addEventListener('change', async (e) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const mobileToggle = document.getElementById('mobile-view-toggle');
  const selectedDevice = e.target.value;

  // Persist device selection
  chrome.storage.local.set({ mobileDevice: selectedDevice });

  // If mobile view is active, update it with new device
  if (mobileToggle.checked && tab) {
    await ensureContentScriptInjected(tab.id);
    chrome.tabs.sendMessage(tab.id, { action: "toggleMobileView", active: true, device: selectedDevice }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Mobile view error:', chrome.runtime.lastError);
      }
    });
  }
});

// ============ WORDPRESS AUTH ============

function updateQcTabAccess(user) {
  const checkerBtn = document.querySelector('.tab-btn[data-tab="checker"]');
  const checkerTab = document.getElementById('checker');
  if (!checkerBtn) return;

  const email = (user && user.email) ? user.email.toLowerCase() : '';
  const allowed = email.endsWith('@refruit.com');

  if (allowed) {
    checkerBtn.style.display = '';
  } else {
    checkerBtn.style.display = 'none';
    // If checker tab is currently active, switch to feedback
    if (checkerTab && checkerTab.classList.contains('active')) {
      checkerBtn.classList.remove('active');
      checkerTab.classList.remove('active');
      const fallbackBtn = document.querySelector('.tab-btn[data-tab="feedback"]');
      const fallbackTab = document.getElementById('feedback');
      if (fallbackBtn && fallbackTab) {
        fallbackBtn.classList.add('active');
        fallbackTab.classList.add('active');
        loadFeedbackList();
      }
    }
  }
}

function updateWpUI(user, url) {
  const loggedOutUi = document.getElementById('wp-logged-out-ui');
  const loggedInUi = document.getElementById('wp-logged-in-ui');
  const userDisplay = document.getElementById('wp-user-display');
  const siteDisplay = document.getElementById('wp-site-display');

  if (user && url) {
    loggedOutUi.style.display = 'none';
    loggedInUi.style.display = 'block';
    userDisplay.textContent = user.displayName || user.username;
    siteDisplay.textContent = url;
  } else {
    loggedOutUi.style.display = 'block';
    loggedInUi.style.display = 'none';
  }
  updateBugSubmitterDisplay();
  updateQcTabAccess(user);
}

async function checkWpAuth(url, token) {
  try {
    const response = await fetch(`${url}/wp-json/qc/v1/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Token expired or revoked
      handleWpLogout();
      showWpStatus('Session expired. Please login again.', '#dc3545');
    }
  } catch (error) {
    console.error('WP Auth Check Error:', error);
  }
}

function showWpStatus(message, color = '#212529') {
  const statusDiv = document.getElementById('wp-status');
  statusDiv.textContent = message;
  statusDiv.style.color = color;
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 5000);
}

function handleWpLogout() {
  chrome.storage.local.remove(['wpToken', 'wpUser'], () => {
    updateWpUI(null, null);
  });
}

document.getElementById('wp-login-btn').addEventListener('click', async () => {
  const urlInput = document.getElementById('wp-url').value.trim().replace(/\/$/, '');
  const username = document.getElementById('wp-username').value.trim();
  const password = document.getElementById('wp-password').value.trim();
  const loginBtn = document.getElementById('wp-login-btn');

  if (!urlInput || !username || !password) {
    showWpStatus('Please fill in all fields', '#dc3545');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  try {
    const response = await fetch(`${urlInput}/wp-json/qc/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      chrome.storage.local.set({
        wpUrl: urlInput,
        wpToken: data.token,
        wpUser: data.user
      }, () => {
        updateWpUI(data.user, urlInput);
        showWpStatus('Successfully connected!', '#28a745');
        // Clear password field
        document.getElementById('wp-password').value = '';
      });
    } else {
      showWpStatus(data.message || 'Login failed', '#dc3545');
    }
  } catch (error) {
    console.error('WP Login Error:', error);
    showWpStatus('Connection error. Check URL.', '#dc3545');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login to WordPress';
  }
});

document.getElementById('wp-logout-btn').addEventListener('click', () => {
  handleWpLogout();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'areaSelected') {
    if (message.source === 'bug') {
      // Bug report area selection
      pendingBugScreenshot = message.screenshot;
      document.getElementById('bug-preview-image').src = message.screenshot;
      document.getElementById('bug-screenshot-preview').style.display = 'block';
      setBugCaptureUI(false);
    } else {
      // Feedback area selection (default)
      const nextNum = currentFeedbackItems.length + 1;
      pendingMarkerData = {
        ...message.selection,
        screenshot: message.screenshot,
        num: nextNum
      };
      
      // Show form and preview
      document.getElementById('feedback-form').style.display = 'block';
      const previewContainer = document.getElementById('selection-preview-container');
      const previewImg = document.getElementById('selection-preview-img');
      
      if (previewContainer && previewImg) {
        previewImg.src = message.screenshot;
        previewContainer.style.display = 'block';
      }
      
      setMarkerToggleUI(false);
    }
  }
});

const submitBtn = document.getElementById('submit-feedback-btn');
submitBtn.addEventListener('click', async () => {
  const notes = document.getElementById('feedback-notes').value.trim();
  if (!notes) {
    showFeedbackStatus('Please enter some notes', '#dc3545');
    return;
  }

  const settings = await chrome.storage.local.get(['wpUrl', 'wpToken']);
  if (!settings.wpToken || !settings.wpUrl) {
    showFeedbackStatus('Please login to WordPress first (Settings tab)', '#dc3545');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  await ensureContentScriptInjected(tab.id);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const body = {
      url: tab.url,
      pageTitle: tab.title,
      notes: notes,
      tool: 'area-note',
      image: pendingMarkerData?.screenshot || '' // Cropped area screenshot
    };

    if (pendingMarkerData) {
      const selectedColor = document.querySelector('input[name="marker-color"]:checked')?.value || '#ff4757';
      // Store selection coordinates as metadata
      body.markerX = (pendingMarkerData.left / pendingMarkerData.docW) * 100;
      body.markerY = (pendingMarkerData.top / pendingMarkerData.docH) * 100;
      body.markerColor = selectedColor;
      body.markerNum = pendingMarkerData.num;
      body.raw = {
        selection: pendingMarkerData
      };
    }

    // Include attachment if present
    if (pendingAttachment) {
      body.attachment = {
        name: pendingAttachment.name,
        type: pendingAttachment.type,
        data: pendingAttachment.dataUrl
      };
    }

    const response = await fetch(`${settings.wpUrl}/wp-json/qc/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.wpToken}`
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const savedFeedback = await response.json();
      console.log('Feedback saved successfully:', savedFeedback);
      
      resetFeedbackForm();
      showFeedbackStatus('✓ Feedback saved!', '#28a745');
      
      // AJAX update: Prepend the new item locally for instant feedback
      if (savedFeedback && savedFeedback.id) {
        console.log('Prepending new feedback item, current count:', currentFeedbackItems.length);
        
        // Ensure the item is NOT collapsed by default
        const { collapsedFeedbackItems = {} } = await chrome.storage.local.get('collapsedFeedbackItems');
        delete collapsedFeedbackItems[savedFeedback.id];
        await chrome.storage.local.set({ collapsedFeedbackItems });

        currentFeedbackItems.unshift(savedFeedback);
        console.log('After prepend, count:', currentFeedbackItems.length);
        
        await renderFeedbackItems(currentFeedbackItems);
        console.log('renderFeedbackItems completed');
        
        // Prevent the next auto-refresh from overwriting our local update
        skipNextFeedbackRefresh = true;
        
        // Also sync markers to the page immediately
        const [currentTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (currentTab) {
          chrome.tabs.sendMessage(currentTab.id, {
            action: 'syncMarkers',
            markers: currentFeedbackItems
          });
        }
      } else {
        console.log('savedFeedback missing id:', savedFeedback);
      }
      
      // Stop placement mode if it was active
      const [tabAfterSave] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabAfterSave) {
        chrome.tabs.sendMessage(tabAfterSave.id, { action: 'stopMarkerPlacement' });
      }
    } else if (response.status === 401) {
      handleWpLogout();
      showFeedbackStatus('Session expired. Please login again in Settings.', '#dc3545');
    } else {
      const data = await response.json();
      showFeedbackStatus(data.message || 'Failed to save feedback', '#dc3545');
    }
  } catch (error) {
    console.error('Error saving feedback:', error);
    showFeedbackStatus('Connection error. Check WP URL.', '#dc3545');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Feedback';
  }
});

// Attachment handling
let pendingAttachment = null; // { name, size, type, dataUrl }
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB

(function initAttachment() {
  const dropZone = document.getElementById('attachment-drop-zone');
  const fileInput = document.getElementById('feedback-attachment');
  const placeholder = document.getElementById('attachment-placeholder');
  const preview = document.getElementById('attachment-preview');
  const filenameSpan = document.getElementById('attachment-filename');
  const filesizeSpan = document.getElementById('attachment-filesize');
  const removeBtn = document.getElementById('remove-attachment-btn');
  const errorDiv = document.getElementById('attachment-error');

  dropZone.addEventListener('click', (e) => {
    if (e.target.id !== 'remove-attachment-btn') fileInput.click();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#007bff';
    dropZone.style.background = '#f0f7ff';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#dee2e6';
    dropZone.style.background = '';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#dee2e6';
    dropZone.style.background = '';
    if (e.dataTransfer.files.length > 0) handleAttachmentFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleAttachmentFile(fileInput.files[0]);
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearAttachment();
  });

  function handleAttachmentFile(file) {
    errorDiv.style.display = 'none';
    if (file.size > MAX_ATTACHMENT_SIZE) {
      errorDiv.textContent = `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`;
      errorDiv.style.display = 'block';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      pendingAttachment = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result
      };
      filenameSpan.textContent = file.name;
      filesizeSpan.textContent = `(${(file.size / 1024).toFixed(0)}KB)`;
      placeholder.style.display = 'none';
      preview.style.display = 'block';
      dropZone.style.borderColor = '#28a745';
    };
    reader.readAsDataURL(file);
  }
})();

function clearAttachment() {
  pendingAttachment = null;
  document.getElementById('feedback-attachment').value = '';
  document.getElementById('attachment-placeholder').style.display = 'block';
  document.getElementById('attachment-preview').style.display = 'none';
  document.getElementById('attachment-drop-zone').style.borderColor = '#dee2e6';
  document.getElementById('attachment-error').style.display = 'none';
}

function resetFeedbackForm() {
  document.getElementById('feedback-notes').value = '';
  document.getElementById('feedback-form').style.display = 'none';
  const previewContainer = document.getElementById('selection-preview-container');
  if (previewContainer) previewContainer.style.display = 'none';
  clearAttachment();
  
  const addBtn = document.getElementById('add-marker-btn');
  addBtn.classList.remove('active');
  addBtn.innerHTML = `
    <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; fill: none;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
    Add Page Marker
  `;
  pendingMarkerData = null;
}

async function loadVersionList(silent = false) {
  console.log('QCHF Debug - loadVersionList called, silent:', silent);
  
  // Skip if we just saved and prepended locally
  if (skipNextVersionRefresh) {
    skipNextVersionRefresh = false;
    console.log('QCHF Debug - Skipping version refresh');
    return;
  }
  
  const listElement = document.getElementById('version-list');
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab) return;

  const settings = await chrome.storage.local.get(['wpUrl', 'wpToken']);
  
  if (!settings.wpToken || !settings.wpUrl) {
    listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">Login to WordPress to see version history.</p>';
    return;
  }

  if (!silent) {
    listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">Loading versions...</p>';
  }

  try {
    const url = new URL(tab.url).href;
    const apiUrl = `${settings.wpUrl}/wp-json/qc/v1/versions?url=${encodeURIComponent(url)}&limit=10`;
    console.log('QCHF Debug - Fetching versions from:', apiUrl);
    console.log('QCHF Debug - Current page URL:', url);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${settings.wpToken}`
      }
    });

    console.log('QCHF Debug - Response status:', response.status);

    if (response.status === 401) {
      handleWpLogout();
      listElement.innerHTML = '<p style="text-align: center; color: #dc3545; font-size: 12px; padding: 20px 0;">Session expired. Please login again.</p>';
      return;
    }

    const data = await response.json();
    console.log('QCHF Debug - Versions data:', data);
    currentVersionItems = data.items || [];
    
    if (currentVersionItems.length > 0) {
      listElement.innerHTML = currentVersionItems.map((item, index) => {
        const dateObj = new Date(item.createdAt);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const versionNum = data.items.length - index;

        return `
        <div class="version-item" style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 8px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: flex; gap: 10px; align-items: center; justify-content: space-between;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
              <span style="font-weight: 700; font-size: 13px; color: #2c3e50;">V${versionNum}</span>
              <span style="font-size: 11px; color: #6c757d;">${dateStr} ${timeStr}</span>
            </div>
            <div style="font-size: 11px; color: #007bff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;" title="${item.authorName || 'Unknown'}">
              By: ${item.authorName || 'Unknown'}
            </div>
            ${item.notes ? `<div style="font-size: 11px; color: #495057; line-height: 1.3; font-style: italic; border-left: 2px solid #eee; padding-left: 6px;">${item.notes}</div>` : ''}
          </div>
          <div class="version-thumbnail-container" data-url="${item.imageUrl}" style="flex-shrink: 0; width: 60px; height: 60px; cursor: pointer; border-radius: 4px; overflow: hidden; border: 1px solid #eee; background: #f8f9fa; position: relative;">
            <img src="${item.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            <div class="version-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); color: white; display: flex; align-items: center; justify-content: center; font-size: 8px; text-align: center; opacity: 0; transition: opacity 0.2s; pointer-events: none;">
              View Full
            </div>
          </div>
        </div>
        `;
      }).join('');
    } else {
      listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">No versions recorded yet.</p>';
    }
  } catch (error) {
    console.error('Error loading versions:', error);
    listElement.innerHTML = '<p style="text-align: center; color: #dc3545; font-size: 12px; padding: 20px 0;">Failed to load history.</p>';
  }
}

function renderVersionList(items) {
  const listElement = document.getElementById('version-list');
  if (items.length > 0) {
    listElement.innerHTML = items.map((item, index) => {
      const dateObj = new Date(item.createdAt);
      const dateStr = dateObj.toLocaleDateString();
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const versionNum = items.length - index;

      return `
      <div class="version-item" style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 8px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: flex; gap: 10px; align-items: center; justify-content: space-between;">
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <span style="font-weight: 700; font-size: 13px; color: #2c3e50;">V${versionNum}</span>
            <span style="font-size: 11px; color: #6c757d;">${dateStr} ${timeStr}</span>
          </div>
          <div style="font-size: 11px; color: #007bff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;" title="${item.authorName || 'Unknown'}">
            By: ${item.authorName || 'Unknown'}
          </div>
          ${item.notes ? `<div style="font-size: 11px; color: #495057; line-height: 1.3; font-style: italic; border-left: 2px solid #eee; padding-left: 6px;">${item.notes}</div>` : ''}
        </div>
        <div class="version-thumbnail-container" data-url="${item.imageUrl}" style="flex-shrink: 0; width: 60px; height: 60px; cursor: pointer; border-radius: 4px; overflow: hidden; border: 1px solid #eee; background: #f8f9fa; position: relative;">
          <img src="${item.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
          <div class="version-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); color: white; display: flex; align-items: center; justify-content: center; font-size: 8px; text-align: center; opacity: 0; transition: opacity 0.2s; pointer-events: none;">
            View Full
          </div>
        </div>
      </div>
      `;
    }).join('');
  } else {
    listElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-size: 12px; padding: 20px 0;">No versions recorded yet.</p>';
  }
}

// Store captured data for upload
let pendingCapture = null;
let currentVersionItems = [];
let skipNextVersionRefresh = false;

document.getElementById('capture-version-btn').addEventListener('click', async () => {
  const captureBtn = document.getElementById('capture-version-btn');
  const previewSection = document.getElementById('version-preview');
  const previewImage = document.getElementById('preview-image');
  const mode = document.querySelector('input[name="screenshot-mode"]:checked').value;

  showVersionStatus('');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found.');
    if (!tab.url || tab.url.startsWith('chrome:')) throw new Error('Cannot capture system pages.');
    await ensureContentScriptInjected(tab.id);

    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';
    
    // 2. Capture via content script (uses bundled html2canvas)
    const captureResponse = await chrome.tabs.sendMessage(tab.id, { 
      action: 'captureScreenshot',
      mode: mode // 'whole' or 'section'
    });
    
    if (!captureResponse || !captureResponse.success) {
      throw new Error(captureResponse?.error || 'Screenshot capture failed.');
    }
    
    handleCapturedScreenshot(captureResponse.dataUrl, tab);
  } catch (error) {
    console.error('Capture error:', error);
    showVersionStatus(`Error: ${error.message}`, '#dc3545');
    captureBtn.disabled = false;
    captureBtn.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
      Capture Screenshot
    `;
  }
});

function handleCapturedScreenshot(dataUrl, tab) {
  const previewSection = document.getElementById('version-preview');
  const previewImage = document.getElementById('preview-image');
  const captureBtn = document.getElementById('capture-version-btn');

  pendingCapture = {
    dataUrl: dataUrl,
    tabUrl: tab.url,
    tabTitle: tab.title
  };
  
  previewImage.src = dataUrl;
  previewSection.style.display = 'block';
  previewSection.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('version-comment').focus(); // Auto-focus comment field
  showVersionStatus('Screenshot captured! Review and save below.', '#28a745');
  
  captureBtn.disabled = false;
  captureBtn.innerHTML = `
    <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
    Capture Screenshot
  `;
}

// Listen for messages from content script (specifically for section capture)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "screenshotCaptured") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (request.success) {
        handleCapturedScreenshot(request.dataUrl, tab);
      } else {
        showVersionStatus(`Error: ${request.error}`, '#dc3545');
        const captureBtn = document.getElementById('capture-version-btn');
        captureBtn.disabled = false;
        captureBtn.innerHTML = `
          <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          Capture Screenshot
        `;
      }
    })();
  }
});

// Upload button
document.getElementById('upload-version-btn').addEventListener('click', async () => {
  if (!pendingCapture) {
    showVersionStatus('No screenshot to upload', '#dc3545');
    return;
  }
  
  const settings = await chrome.storage.local.get(['wpUrl', 'wpToken']);
  if (!settings.wpToken || !settings.wpUrl) {
    showVersionStatus('Please login to WordPress first', '#dc3545');
    return;
  }
  
  const uploadBtn = document.getElementById('upload-version-btn');
  const commentInput = document.getElementById('version-comment');
  const comment = commentInput.value.trim();
  
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  
  try {
    const response = await fetch(`${settings.wpUrl}/wp-json/qc/v1/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.wpToken}`
      },
      body: JSON.stringify({
        url: pendingCapture.tabUrl,
        pageTitle: pendingCapture.tabTitle || 'Untitled Page',
        image: pendingCapture.dataUrl,
        notes: comment // Include the comment as 'notes'
      })
    });

    const result = await response.json();

    if (response.ok) {
      showVersionStatus('✓ Version saved to WordPress!', '#28a745');
      document.getElementById('version-preview').style.display = 'none';
      commentInput.value = ''; // Clear comment field
      
      // Prepend locally for instant UI update
      if (result && result.id) {
        currentVersionItems.unshift(result);
        renderVersionList(currentVersionItems);
        skipNextVersionRefresh = true;
      }
      
      pendingCapture = null;
    } else {
      throw new Error(result.message || 'Upload failed.');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showVersionStatus(`Error: ${error.message}`, '#dc3545');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = '✓ Save to WordPress';
  }
});

// Discard button
document.getElementById('discard-version-btn').addEventListener('click', () => {
  document.getElementById('version-preview').style.display = 'none';
  document.getElementById('preview-image').src = '';
  document.getElementById('version-comment').value = ''; // Clear comment field on discard
  pendingCapture = null;
  showVersionStatus('Screenshot discarded', '#6c757d');
});

// Add Enter key listener to comment field for quick save
document.getElementById('version-comment').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('upload-version-btn').click();
  }
});

function showVersionStatus(message, color = '#212529') {
  const statusDiv = document.getElementById('version-status');
  statusDiv.textContent = message;
  statusDiv.style.color = color;
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 5000);
}
chrome.tabs.onActivated.addListener(updateCurrentTabInfo);
chrome.tabs.onUpdated.addListener(updateCurrentTabInfo);

// Initial load
updateCurrentTabInfo();

// Event delegation for version history list
document.getElementById('version-list').addEventListener('click', (e) => {
  const container = e.target.closest('.version-thumbnail-container');
  if (container) {
    const url = container.getAttribute('data-url');
    if (url) {
      chrome.tabs.create({ url: url });
    }
  }
});

document.getElementById('version-list').addEventListener('mouseover', (e) => {
  const container = e.target.closest('.version-thumbnail-container');
  if (container) {
    const overlay = container.querySelector('.version-overlay');
    if (overlay) overlay.style.opacity = '1';
  }
});

document.getElementById('version-list').addEventListener('mouseout', (e) => {
  const container = e.target.closest('.version-thumbnail-container');
  if (container) {
    const overlay = container.querySelector('.version-overlay');
    if (overlay) overlay.style.opacity = '0';
  }
});
