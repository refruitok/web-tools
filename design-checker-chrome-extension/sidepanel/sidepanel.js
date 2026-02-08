// Side panel logic for interactive inspection
let currentMode = null;
let panelLocked = false;

// UI Elements
let inspectBtn, distanceBtn, activeInfo, modeStatus, cancelBtn, dynamicContent, metaDetails, clearHighlightsBtn, breadcrumbsContainer, breadcrumbsList;
let viewportSizeEl, bootstrapBadgeEl, originalWindowSize = null;
let viewportPollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI elements
  inspectBtn = document.getElementById('inspectBtn');
  distanceBtn = document.getElementById('distanceBtn');
  activeInfo = document.getElementById('activeInfo');
  modeStatus = document.getElementById('modeStatus');
  cancelBtn = document.getElementById('cancelBtn');
  dynamicContent = document.getElementById('dynamicContent');
  metaDetails = document.getElementById('metaDetails');
  clearHighlightsBtn = document.getElementById('clearHighlights');
  breadcrumbsContainer = document.getElementById('breadcrumbsContainer');
  breadcrumbsList = document.getElementById('breadcrumbs');

  // Attach event listeners
  if (inspectBtn) inspectBtn.addEventListener('click', () => setMode('inspect'));
  if (distanceBtn) distanceBtn.addEventListener('click', () => setMode('distance'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => setMode(null));
  
  if (clearHighlightsBtn) {
    clearHighlightsBtn.addEventListener('click', async () => {
      const tab = await getActiveTab();
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'clearAll' }).catch(err => console.warn('clearAll failed:', err));
        panelLocked = false;
      }
    });
  }

  // Listen for results from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'inspectionResult') {
      if (message.isHover && panelLocked) {
        sendResponse({ ignored: true });
        return false;
      }
      if (!message.isHover) panelLocked = true;
      displayElementDetails(message.data, message.isHover);
      sendResponse({ processed: true });
    } else if (message.action === 'distanceResult') {
      displayDistanceDetails(message.data);
      sendResponse({ processed: true });
    } else if (message.action === 'modeCancelled') {
      setMode(null);
      sendResponse({ processed: true });
    } else {
      sendResponse({ received: true });
    }
    return false;
  });

  // Listen for tab updates to refresh meta info
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      getActiveTab().then(activeTab => {
        if (activeTab && activeTab.id === tabId) {
          loadMetaInfo().catch(err => console.warn('loadMetaInfo failed:', err));
        }
      }).catch(err => console.warn('getActiveTab in onUpdated failed:', err));
    }
  });

  // Viewport section
  viewportSizeEl = document.getElementById('viewportSize');
  bootstrapBadgeEl = document.getElementById('bootstrapBadge');

  // Preset resize buttons
  document.querySelectorAll('.preset-btn[data-width]').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = parseInt(btn.dataset.width);
      const h = parseInt(btn.dataset.height);
      resizeToPreset(w, h);
    });
  });

  const resetViewportBtn = document.getElementById('resetViewportBtn');
  if (resetViewportBtn) {
    resetViewportBtn.addEventListener('click', () => {
      if (originalWindowSize) {
        chrome.runtime.sendMessage({
          action: 'resizeWindow',
          width: originalWindowSize.width,
          height: originalWindowSize.height
        }).catch(err => console.warn('resizeWindow failed:', err));
        originalWindowSize = null;
      }
    });
  }

  // Start polling viewport size
  updateViewportInfo();
  viewportPollInterval = setInterval(updateViewportInfo, 1000);

  loadMetaInfo();

  // Restore Meta Info accordion state
  const metaAccordion = document.getElementById('acc_meta');
  if (metaAccordion) {
    if (localStorage.getItem('accordion_meta') === 'open') {
      metaAccordion.open = true;
    }
    metaAccordion.addEventListener('toggle', () => {
      localStorage.setItem('accordion_meta', metaAccordion.open ? 'open' : 'closed');
    });
  }
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function setMode(mode) {
  if (currentMode === mode) mode = null;
  currentMode = mode;
  panelLocked = false;

  // Safety check for UI elements
  if (!inspectBtn || !distanceBtn || !activeInfo) return;

  inspectBtn.classList.toggle('active', mode === 'inspect');
  distanceBtn.classList.toggle('active', mode === 'distance');
  activeInfo.style.display = mode ? 'flex' : 'none';
  
  if (mode === 'inspect') {
    modeStatus.textContent = 'Click an element to inspect';
  } else if (mode === 'distance') {
    modeStatus.textContent = 'Select two elements to measure';
  } else {
    dynamicContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🖱️</div>
        <p><strong>Click "Inspect Element"</strong></p>
        <p>Then hover over and click any element on the page to see its detailed properties.</p>
      </div>
    `;
    if (breadcrumbsContainer) breadcrumbsContainer.style.display = 'none';
  }

  const tab = await getActiveTab();
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'setMode', mode: mode }).catch(err => console.warn('setMode failed:', err));
  }
}
function createEditableProp(label, prop, value, listId = null) {
  const listAttr = listId ? `list="${listId}"` : '';
  const escapedValue = String(value || '').replace(/"/g, '&quot;');
  return `
    <div class="prop-item">
      <span class="prop-label">${label}</span>
      <span class="prop-value">
        <input type="text" class="prop-input" data-style-prop="${prop}" ${listAttr} value="${escapedValue}">
        <button class="copy-btn" data-copy="${escapedValue}" title="Copy to clipboard">📄</button>
      </span>
    </div>
  `;
}

function displayElementDetails(data, isHover) {
  const { tag, styles, attributes, rect, breadcrumbs, selectedIndex } = data;
  
  // The active element label (e.g., div#id.class)
  const idText = attributes.id ? `#${attributes.id}` : '';
  const classText = attributes.className && typeof attributes.className === 'string' 
    ? `.${attributes.className.trim().split(/\s+/).join('.')}` 
    : '';
  const activeLabel = `${tag.toLowerCase()}${idText}${classText}`;

  let html = `
    <div class="detail-card">
      <details class="detail-section accordion-trigger" id="acc_dompath" ${getAccordionState('dompath') ? 'open' : ''}>
        <summary class="detail-header">DOM Path</summary>
        <div id="cardBreadcrumbs" class="card-breadcrumbs"></div>
      </details>
      
      <div class="detail-section">
        <div class="detail-header element-title-header">
          <div class="element-full-path" data-full-path="${breadcrumbs.join(' > ')}" title="Click to copy full path">${activeLabel}</div>
          <div class="status-actions">
            ${isHover ? '<span class="status-indicator status-warn"></span> Hovering' : '<span class="status-indicator status-pass"></span> Locked'}
            ${!isHover ? '<button id="unlockBtn" class="btn-link">Unlock</button>' : ''}
          </div>
        </div>
        <div class="prop-grid">
          <div class="prop-item">
            <span class="prop-label">Tag</span>
            <span class="prop-value">
              <span class="tag-badge">&lt;${tag.toLowerCase()}&gt;</span>
              <button class="copy-btn" data-copy="${tag.toLowerCase()}">📄</button>
            </span>
          </div>
          ${createEditableProp('Width', 'width', styles.width)}
          ${createEditableProp('Height', 'height', styles.height)}
        </div>
      </div>

      <details class="detail-section accordion-trigger" id="acc_layout" ${getAccordionState('layout') ? 'open' : ''}>
        <summary class="detail-header">Layout</summary>
        <div class="prop-grid">
          ${createEditableProp('Display', 'display', styles.display, 'list_display')}
          <datalist id="list_display">
            <option value="block">
            <option value="inline">
            <option value="inline-block">
            <option value="flex">
            <option value="inline-flex">
            <option value="grid">
            <option value="none">
            <option value="contents">
          </datalist>
          ${createEditableProp('Position', 'position', styles.position, 'list_position')}
          <datalist id="list_position">
            <option value="static">
            <option value="relative">
            <option value="absolute">
            <option value="fixed">
            <option value="sticky">
          </datalist>
          ${createEditableProp('Z-Index', 'zIndex', styles.zIndex)}
          ${createEditableProp('Overflow', 'overflow', styles.overflow, 'list_overflow')}
          <datalist id="list_overflow">
            <option value="visible">
            <option value="hidden">
            <option value="scroll">
            <option value="auto">
          </datalist>
          ${createEditableProp('Visibility', 'visibility', styles.visibility, 'list_visibility')}
          <datalist id="list_visibility">
            <option value="visible">
            <option value="hidden">
            <option value="collapse">
          </datalist>
          ${createEditableProp('Top', 'top', styles.top)}
          ${createEditableProp('Left', 'left', styles.left)}
          ${createEditableProp('Right', 'right', styles.right)}
          ${createEditableProp('Bottom', 'bottom', styles.bottom)}
        </div>
      </details>

      <details class="detail-section accordion-trigger" id="acc_flexgrid" ${getAccordionState('flexgrid') ? 'open' : ''}>
        <summary class="detail-header">Flex & Grid</summary>
        <div class="prop-grid">
          ${createEditableProp('Direction', 'flexDirection', styles.flexDirection, 'list_flexDirection')}
          <datalist id="list_flexDirection">
            <option value="row">
            <option value="row-reverse">
            <option value="column">
            <option value="column-reverse">
          </datalist>
          ${createEditableProp('Justify', 'justifyContent', styles.justifyContent, 'list_justifyContent')}
          <datalist id="list_justifyContent">
            <option value="flex-start">
            <option value="flex-end">
            <option value="center">
            <option value="space-between">
            <option value="space-around">
            <option value="space-evenly">
          </datalist>
          ${createEditableProp('Align', 'alignItems', styles.alignItems, 'list_alignItems')}
          <datalist id="list_alignItems">
            <option value="stretch">
            <option value="flex-start">
            <option value="flex-end">
            <option value="center">
            <option value="baseline">
          </datalist>
          ${createEditableProp('Gap', 'gap', styles.gap)}
          ${createEditableProp('Grid Cols', 'gridTemplateColumns', styles.gridTemplateColumns)}
        </div>
      </details>

      <details class="detail-section accordion-trigger" id="acc_typography" ${getAccordionState('typography') ? 'open' : ''}>
        <summary class="detail-header">Typography</summary>
        <div class="prop-grid">
          ${createEditableProp('Font Family', 'fontFamily', styles.fontFamily.split(',')[0].replace(/['"]/g, ''))}
          ${createEditableProp('Font Size', 'fontSize', styles.fontSize)}
          ${createEditableProp('Weight', 'fontWeight', styles.fontWeight, 'list_fontWeight')}
          <datalist id="list_fontWeight">
            <option value="normal">
            <option value="bold">
            <option value="100">
            <option value="200">
            <option value="300">
            <option value="400">
            <option value="500">
            <option value="600">
            <option value="700">
            <option value="800">
            <option value="900">
          </datalist>
          ${createEditableProp('Line Height', 'lineHeight', styles.lineHeight)}
          ${createEditableProp('Letter Spacing', 'letterSpacing', styles.letterSpacing)}
          ${createEditableProp('Transform', 'textTransform', styles.textTransform, 'list_textTransform')}
          <datalist id="list_textTransform">
            <option value="none">
            <option value="capitalize">
            <option value="uppercase">
            <option value="lowercase">
          </datalist>
          ${createEditableProp('Opacity', 'opacity', styles.opacity)}
          ${createEditableProp('Align', 'textAlign', styles.textAlign, 'list_textAlign')}
          <datalist id="list_textAlign">
            <option value="left">
            <option value="center">
            <option value="right">
            <option value="justify">
          </datalist>
          ${createEditableProp('Decoration', 'textDecoration', styles.textDecoration, 'list_textDecoration')}
          <datalist id="list_textDecoration">
            <option value="none">
            <option value="underline">
            <option value="overline">
            <option value="line-through">
          </datalist>
          <div class="prop-item">
            <span class="prop-label">Color</span>
            <span class="prop-value">
              <div class="color-edit-row">
                <input type="color" class="prop-color-input" data-style-prop="color" value="${styles.colorHex || '#000000'}">
                <div class="color-options">
                  <span class="color-opt">
                    <span class="color-hex-label">${styles.colorHex || 'N/A'}</span>
                    <button class="copy-btn mini" data-copy="${styles.colorHex}">📄</button>
                  </span>
                  <span class="color-opt rgba">${styles.color} <button class="copy-btn mini" data-copy="${styles.color}">📄</button></span>
                </div>
              </div>
            </span>
          </div>
          <div class="prop-item">
            <span class="prop-label">Background</span>
            <span class="prop-value">
              <div class="color-edit-row">
                <input type="color" class="prop-color-input" data-style-prop="backgroundColor" value="${styles.backgroundColorHex && styles.backgroundColorHex !== 'transparent' ? styles.backgroundColorHex : '#ffffff'}">
                <div class="color-options">
                  <span class="color-opt">
                    <span class="color-hex-label">${styles.backgroundColorHex || 'N/A'}</span>
                    <button class="copy-btn mini" data-copy="${styles.backgroundColorHex}">📄</button>
                  </span>
                  <span class="color-opt rgba">${styles.backgroundColor} <button class="copy-btn mini" data-copy="${styles.backgroundColor}">📄</button></span>
                </div>
              </div>
            </span>
          </div>
        </div>
      </details>

      <details class="detail-section accordion-trigger" id="acc_spacing" ${getAccordionState('spacing') ? 'open' : ''}>
        <summary class="detail-header">Spacing & Borders</summary>
        <div class="prop-grid">
          ${createEditableProp('Padding', 'padding', styles.padding)}
          ${createEditableProp('Margin', 'margin', styles.margin)}
          ${createEditableProp('Radius', 'borderRadius', styles.borderRadius)}
          ${createEditableProp('Border', 'border', styles.border)}
          ${createEditableProp('Shadow', 'boxShadow', styles.boxShadow)}
        </div>
      </details>

      <details class="detail-section accordion-trigger" id="acc_interactivity" ${getAccordionState('interactivity') ? 'open' : ''}>
        <summary class="detail-header">Interactivity & States</summary>
        <div class="states-container">
          ${(function() {
            if (!data.interactivity || Object.keys(data.interactivity).length === 0) {
              return '<div class="no-states">No interactive states detected in stylesheets</div>';
            }
            
            let interactivityHtml = '';
            for (const [state, rules] of Object.entries(data.interactivity)) {
              // Flatten all properties from all rules for this state to avoid duplicates and simplify UI
              const uniqueProps = {};
              rules.forEach(props => {
                for (const [prop, value] of Object.entries(props)) {
                  uniqueProps[prop] = value;
                }
              });

              if (Object.keys(uniqueProps).length === 0) continue;

              interactivityHtml += `
                <div class="state-group">
                  <div class="state-group-title">${state}</div>
                  <div class="state-props-list">
                    ${Object.entries(uniqueProps).map(([prop, value]) => `
                      <div class="state-prop-pill" title="Click to copy ${prop}: ${value}" data-copy="${prop}: ${value}">
                        <span class="state-prop-name">${prop}:</span>
                        <span class="state-prop-value">${value}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }
            return interactivityHtml || '<div class="no-states">No interactive states detected in stylesheets</div>';
          })()}
        </div>
      </details>
  `;

  const imageSrc = tag.toLowerCase() === 'img' ? attributes.src : styles.backgroundImage;
  
  if (imageSrc) {
    html += `
      <details class="detail-section accordion-trigger" id="acc_resource" ${getAccordionState('resource') ? 'open' : ''}>
        <summary class="detail-header">Image Resource</summary>
        <div class="image-resource-container">
          <div class="image-thumbnail-container">
            <img src="${imageSrc}" class="image-thumbnail-preview" alt="Preview">
          </div>
          <div class="image-info-container">
            <div class="url-display">${imageSrc}</div>
            <div class="image-meta-row">
              <span class="image-size-badge" title="File Size">${data.fileSize || 'Unknown'}</span>
              ${data.loadTimes ? `
                <span class="load-time-badge three-g" title="Est. load time on 3G">3G: ${data.loadTimes.threeG}</span>
                <span class="load-time-badge four-g" title="Est. load time on 4G">4G: ${data.loadTimes.fourG}</span>
              ` : ''}
            </div>
            <div class="action-row">
              <button class="copy-btn mini" data-copy="${imageSrc}">📄 Copy URL</button>
              <button class="download-btn" data-url="${imageSrc}">⬇️ Download</button>
            </div>
          </div>
        </div>
      </details>
    `;
  }

  if (tag.toLowerCase() === 'img' && data.imageDetails) {
    html += `
      <details class="detail-section accordion-trigger" id="acc_details" ${getAccordionState('details') ? 'open' : ''}>
        <summary class="detail-header">Image Details</summary>
        <div class="prop-grid">
          <div class="prop-item">
            <span class="prop-label">Natural</span>
            <span class="prop-value">
              ${data.imageDetails.naturalWidth} × ${data.imageDetails.naturalHeight}px
              <button class="copy-btn" data-copy="${data.imageDetails.naturalWidth} × ${data.imageDetails.naturalHeight}px">📄</button>
            </span>
          </div>
          <div class="prop-item">
            <span class="prop-label">Alt Text</span>
            <span class="prop-value">
              ${attributes.alt || '<em style="color:#ef4444">Missing</em>'}
              ${attributes.alt ? `<button class="copy-btn" data-copy="${attributes.alt}">📄</button>` : ''}
            </span>
          </div>
        </div>
      </details>
    `;
  }

  html += `
    <div class="style-actions-row">
      <button class="btn-action" id="resetStylesBtn">
        <span>🔄 Reset</span>
      </button>
      <button class="btn-action primary" id="copyAllCssBtn">
        <span>📋 Copy CSS</span>
      </button>
    </div>
  </div>
  `;

  dynamicContent.innerHTML = html;

  // Update breadcrumbs in the card
  const cardBreadcrumbs = document.getElementById('cardBreadcrumbs');
  if (cardBreadcrumbs && breadcrumbs && breadcrumbs.length > 0) {
    const breadcrumbsList = document.createElement('div');
    breadcrumbsList.className = 'breadcrumbs-list';
    
    // We use data.selectedIndex if available, otherwise default to the last item (the element itself)
    const activeIdx = (data.selectedIndex !== undefined) ? data.selectedIndex : (breadcrumbs.length - 1);

    breadcrumbs.forEach((crumb, index) => {
      const span = document.createElement('span');
      span.className = 'breadcrumb-item' + (index === activeIdx ? ' active' : '');
      span.textContent = crumb;
      span.title = `Select ${crumb}`;
      span.addEventListener('click', async () => {
        const tab = await getActiveTab();
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'selectByPath', 
            index: index 
          }).catch(err => console.warn('selectByPath failed:', err));
        }
      });
      breadcrumbsList.appendChild(span);
      
      if (index < breadcrumbs.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.textContent = ' › ';
        breadcrumbsList.appendChild(sep);
      }
    });
    cardBreadcrumbs.appendChild(breadcrumbsList);
  }

  // Re-attach all interactive listeners
  attachCopyListeners();
  attachAccordionListeners();
  attachDownloadListeners();
  attachEditListeners();
  attachCopyAllCssListener();
  attachResetStylesListener();
  
  // Add unlock event listener
  const unlockBtn = document.getElementById('unlockBtn');
  if (unlockBtn) {
    unlockBtn.addEventListener('click', async () => {
      const tab = await getActiveTab();
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'unlock' }).catch(err => console.warn('unlock failed:', err));
        panelLocked = false;
        // Keep the current data but change status to hovering visually
        displayElementDetails(data, true);
      }
    });
  }
}

function attachCopyListeners() {
  // Global copy buttons (the 📋 icons)
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-copy');
      if (!text) return;
      
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✅';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 1000);
      });
    });
  });

  // State prop pills (Interactivity section)
  document.querySelectorAll('.state-prop-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = pill.getAttribute('data-copy');
      if (!text) return;

      navigator.clipboard.writeText(text).then(() => {
        pill.classList.add('copied');
        setTimeout(() => {
          pill.classList.remove('copied');
        }, 1000);
      });
    });
  });

  // Element path title
  const elementTitle = document.querySelector('.element-full-path');
  if (elementTitle) {
    elementTitle.addEventListener('click', () => {
      const fullPath = elementTitle.getAttribute('data-full-path');
      if (!fullPath) return;
      
      navigator.clipboard.writeText(fullPath).then(() => {
        elementTitle.classList.add('copied');
        setTimeout(() => {
          elementTitle.classList.remove('copied');
        }, 1000);
      });
    });
  }
}

function attachAccordionListeners() {
  document.querySelectorAll('.accordion-trigger').forEach(details => {
    // Remove old listeners to avoid duplicates if re-called
    details.removeEventListener('toggle', handleToggle);
    details.addEventListener('toggle', handleToggle);
  });
}

function handleToggle(e) {
  const details = e.currentTarget;
  if (!details.id) return;
  const id = details.id.replace('acc_', '');
  localStorage.setItem(`accordion_${id}`, details.open ? 'open' : 'closed');
}

function attachEditListeners() {
  // Text inputs
  document.querySelectorAll('.prop-input').forEach(input => {
    input.addEventListener('input', async () => {
      input.classList.add('modified');
      const prop = input.getAttribute('data-style-prop');
      const val = input.value;
      
      // Update the copy button's data-copy attribute in the same row
      const row = input.closest('.prop-value');
      if (row) {
        const copyBtn = row.querySelector('.copy-btn');
        if (copyBtn) copyBtn.setAttribute('data-copy', val);
      }

      const tab = await getActiveTab();
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateStyle', 
          property: prop, 
          value: val 
        }).catch(err => console.warn('updateStyle failed:', err));
      }
    });

    // Handle Enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  });

  // Color inputs
  document.querySelectorAll('.prop-color-input').forEach(input => {
    input.addEventListener('input', async () => {
      input.classList.add('modified');
      const prop = input.getAttribute('data-style-prop');
      const val = input.value;
      
      const tab = await getActiveTab();
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateStyle', 
          property: prop, 
          value: val 
        }).catch(err => console.warn('updateStyle failed:', err));
      }
      
      // Update the hex label next to it if it exists
      const row = input.closest('.color-edit-row');
      if (row) {
        const hexLabel = row.querySelector('.color-hex-label');
        if (hexLabel) {
          hexLabel.textContent = val.toUpperCase();
        }
        // Update the copy button's data-copy in the same row
        const copyBtn = row.querySelector('.copy-btn[data-copy]');
        if (copyBtn && copyBtn.closest('.color-opt:not(.rgba)')) {
          copyBtn.setAttribute('data-copy', val);
        }
      }
    });
  });
}

function attachResetStylesListener() {
  const btn = document.getElementById('resetStylesBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'resetStyles' }).catch(err => {
        console.warn('resetStyles message failed:', err);
      });
    }
  });
}

function attachCopyAllCssListener() {
  const btn = document.getElementById('copyAllCssBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.prop-input.modified, .prop-color-input.modified');
    if (inputs.length === 0) {
      // If nothing modified, copy all displayed typography/spacing
      const allInputs = document.querySelectorAll('.prop-input, .prop-color-input');
      let css = '';
      allInputs.forEach(input => {
        const prop = input.getAttribute('data-style-prop');
        const kebabProp = prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        css += `  ${kebabProp}: ${input.value};\n`;
      });
      copyTextToClipboard(`element {\n${css}}`, btn);
      return;
    }

    let css = '';
    inputs.forEach(input => {
      const prop = input.getAttribute('data-style-prop');
      const kebabProp = prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      css += `  ${kebabProp}: ${input.value};\n`;
    });
    copyTextToClipboard(`element {\n${css}}`, btn);
  });
}

async function copyTextToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const originalContent = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '<span>✅ CSS Copied!</span>';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = originalContent;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

function attachDownloadListeners() {
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.getAttribute('data-url');
      if (url) {
        const filename = url.split('/').pop().split('?')[0] || 'image';
        chrome.runtime.sendMessage({ 
          action: 'downloadImage', 
          url: url,
          filename: filename
        }).catch(err => console.warn('downloadImage failed:', err));
      }
    });
  });
}

function getAccordionState(id) {
  return localStorage.getItem(`accordion_${id}`) === 'open';
}

function displayDistanceDetails(data) {
  const { distance, vertical, horizontal } = data;
  
  dynamicContent.innerHTML = `
    <div class="detail-card">
      <details class="detail-section accordion-trigger" id="acc_distance" ${getAccordionState('distance') ? 'open' : ''}>
        <summary class="detail-header">Distance Measurement (A → B)</summary>
        <div class="prop-grid">
          <div class="prop-item">
            <span class="prop-label">Total Gap</span>
            <span class="prop-value" style="font-size: 1.2rem; color: #4f46e5;">
              ${Math.round(distance)}px
              <button class="copy-btn" data-copy="${Math.round(distance)}px">📄</button>
            </span>
          </div>
          <div class="prop-item">
            <span class="prop-label">Vertical</span>
            <span class="prop-value" style="color: #ef4444;">
              ${Math.round(vertical)}px
              <button class="copy-btn mini" data-copy="${Math.round(vertical)}px">📄</button>
            </span>
          </div>
          <div class="prop-item">
            <span class="prop-label">Horizontal</span>
            <span class="prop-value" style="color: #3b82f6;">
              ${Math.round(horizontal)}px
              <button class="copy-btn mini" data-copy="${Math.round(horizontal)}px">📄</button>
            </span>
          </div>
        </div>
      </details>
      <div style="padding: 12px 16px; font-size: 0.7rem; color: #94a3b8; background: #fff; font-style: italic; border-top: 1px solid #f1f5f9;">
        Measurement between the closest edges of Element A and Element B.
      </div>
    </div>
  `;

  attachCopyListeners();
  attachAccordionListeners();
  attachDownloadListeners();
  attachEditListeners();
}

async function updateViewportInfo() {
  const tab = await getActiveTab();
  if (!tab) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getViewportInfo' });
    if (response && response.viewport) {
      const { width, height } = response.viewport;
      if (viewportSizeEl) viewportSizeEl.textContent = `${width} × ${height}`;
      
      const bp = getBootstrapBreakpoint(width);
      if (bootstrapBadgeEl) {
        bootstrapBadgeEl.textContent = bp.label;
        bootstrapBadgeEl.className = `bootstrap-badge bp-${bp.key}`;
      }

      // Highlight active preset button
      document.querySelectorAll('.preset-btn[data-width]').forEach(btn => {
        const pw = parseInt(btn.dataset.width);
        btn.classList.toggle('active', pw === width);
      });
    }
  } catch (e) {
    // Content script not ready yet
  }
}

function getBootstrapBreakpoint(width) {
  if (width < 576) return { key: 'xs', label: 'XS (<576)' };
  if (width < 768) return { key: 'sm', label: 'SM (≥576)' };
  if (width < 992) return { key: 'md', label: 'MD (≥768)' };
  if (width < 1200) return { key: 'lg', label: 'LG (≥992)' };
  if (width < 1400) return { key: 'xl', label: 'XL (≥1200)' };
  return { key: 'xxl', label: 'XXL (≥1400)' };
}

async function resizeToPreset(targetWidth, targetHeight) {
  const tab = await getActiveTab();
  if (!tab) return;

  // Save original size before first resize
  if (!originalWindowSize) {
    const win = await chrome.windows.getCurrent();
    originalWindowSize = { width: win.width, height: win.height };
  }

  // We need to account for the browser chrome (toolbars, etc.)
  // Get current viewport vs window size to calculate the chrome offset
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getViewportInfo' });
    if (response && response.viewport) {
      const win = await chrome.windows.getCurrent();
      const chromeWidth = win.width - response.viewport.width;
      const chromeHeight = win.height - response.viewport.height;

      chrome.runtime.sendMessage({
        action: 'resizeWindow',
        width: targetWidth + chromeWidth,
        height: targetHeight + chromeHeight
      }).catch(err => console.warn('resizeWindow failed:', err));

      // Update display after a short delay
      setTimeout(updateViewportInfo, 300);
    }
  } catch (e) {
    // Fallback: just resize without offset compensation
    chrome.runtime.sendMessage({
      action: 'resizeWindow',
      width: targetWidth,
      height: targetHeight
    }).catch(err => console.warn('resizeWindow failed:', err));
  }
}

async function loadMetaInfo() {
  const tab = await getActiveTab();
  if (!tab) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getMeta' });
    if (response && response.meta) {
      const { title, description, h1Count, lang, viewport } = response.meta;
      
      metaDetails.innerHTML = `
        <div class="meta-item">
          <span class="meta-label">Title (${title.length})</span>
          <span class="meta-value">${title || 'None'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Description (${description.length})</span>
          <span class="meta-value">${description || 'None'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">H1 Tags</span>
          <span class="meta-value">${h1Count}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Language</span>
          <span class="meta-value">${lang || 'Not set'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Viewport</span>
          <span class="meta-value" style="font-size: 0.7rem; font-family: ui-monospace, monospace;">${viewport || 'Not set'}</span>
        </div>
      `;
    }
  } catch (e) {
    metaDetails.innerHTML = '<p class="error">Could not load meta info. Try refreshing the page.</p>';
  }
}
