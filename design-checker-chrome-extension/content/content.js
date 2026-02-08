// Website QC Checker - Interactive Content Script

(function() {
  'use strict';

  let currentMode = null;
  let hoverHighlighter = null;
  let lastHoveredElement = null;
  let overlay = null;
  let highlighters = [];
  let currentHierarchy = [];
  let isLocked = false;
  let inspectTarget = null;
  let distanceTargets = [];

  // Message Listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setMode') {
      setMode(request.mode);
      sendResponse({ success: true });
    } else if (request.action === 'clearAll') {
      clearAll();
      isLocked = false;
      sendResponse({ success: true });
    } else if (request.action === 'getMeta') {
      sendResponse({ meta: getMetaInfo() });
    } else if (request.action === 'unlock') {
      isLocked = false;
      clearAllHighlights();
      sendResponse({ success: true });
    } else if (request.action === 'selectByPath') {
      isLocked = true;
      const hierarchyIndex = (currentHierarchy.length - 1) - request.index;
      const el = currentHierarchy[hierarchyIndex];
      if (el) {
        inspectTarget = el;
        refreshVisuals();
        const data = extractElementData(el, true);
        data.selectedIndex = request.index; // Pass back the selected index
        chrome.runtime.sendMessage({ action: 'inspectionResult', data: data, isHover: false }).catch(() => {});
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Element not found' });
      }
    } else if (request.action === 'updateStyle') {
      const target = inspectTarget || lastHoveredElement;
      if (target) {
        target.style[request.property] = request.value;
        const kebabProp = request.property.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        target.style.setProperty(kebabProp, request.value, 'important');
        refreshVisuals();
        if (!isLocked) {
          isLocked = true;
          inspectTarget = target;
        }
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No target' });
      }
    } else if (request.action === 'getViewportInfo') {
      sendResponse({
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    } else if (request.action === 'resetStyles') {
      if (inspectTarget) {
        inspectTarget.removeAttribute('style');
        const data = extractElementData(inspectTarget, true);
        chrome.runtime.sendMessage({ action: 'inspectionResult', data: data, isHover: false }).catch(() => {});
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No locked target' });
      }
    }
    return false; // Sync response
  });

  function setMode(mode) {
    clearAll();
    currentMode = mode;
    isLocked = false;
    inspectTarget = null;
    distanceTargets = [];
    
    if (mode) {
      document.body.style.cursor = 'crosshair';
      createOverlay();
      attachListeners();
      showInstructionBar(mode);
    } else {
      document.body.style.cursor = 'default';
      removeListeners();
      hideInstructionBar();
    }
  }

  function showInstructionBar(mode) {
    hideInstructionBar();
    const bar = document.createElement('div');
    bar.id = 'qc-instruction-bar';
    let text = mode === 'inspect' 
      ? '🔎 <strong>Inspect Mode:</strong> Hover to preview, Click to lock element. Press ESC to exit.' 
      : '📏 <strong>Distance Mode:</strong> Click two elements to measure the gap. Press ESC to exit.';
    
    Object.assign(bar.style, {
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1e293b',
      color: 'white',
      padding: '8px 24px',
      borderRadius: '30px',
      fontSize: '14px',
      zIndex: '2147483647',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      pointerEvents: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });
    bar.innerHTML = text;
    document.body.appendChild(bar);
  }

  function hideInstructionBar() {
    const existing = document.getElementById('qc-instruction-bar');
    if (existing) existing.remove();
  }

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'qc-interactive-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '2147483646',
      background: 'transparent'
    });
    document.body.appendChild(overlay);
  }

  function attachListeners() {
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', refreshVisuals, { passive: true });
    window.addEventListener('resize', refreshVisuals, { passive: true });
  }

  function removeListeners() {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('scroll', refreshVisuals);
    window.removeEventListener('resize', refreshVisuals);
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function handleMouseOver(e) {
    if (!currentMode || isLocked) return;
    const target = e.target;
    if (target.closest('.qc-interactive-overlay') || target.tagName === 'HTML' || target.tagName === 'BODY') return;
    
    lastHoveredElement = target;
    highlightHovered(target);

    if (currentMode === 'inspect') {
      const data = extractElementData(target, false);
      chrome.runtime.sendMessage({ action: 'inspectionResult', data: data, isHover: true }).catch(() => {});
    }
  }

  function handleClick(e) {
    if (!currentMode) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    
    if (currentMode === 'inspect') {
      isLocked = true;
      inspectTarget = target;
      refreshVisuals();
      const data = extractElementData(target, true);
      chrome.runtime.sendMessage({ action: 'inspectionResult', data: data, isHover: false }).catch(() => {});
    } else if (currentMode === 'distance') {
      handleDistanceSelection(target);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setMode(null);
      chrome.runtime.sendMessage({ action: 'modeCancelled' }).catch(() => {});
    }
  }

  function highlightHovered(el, isLockedCall = false, noTransition = false) {
    if (!isLockedCall) clearHoverHighlighter();
    
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    
    const pTop = parseFloat(style.paddingTop);
    const pRight = parseFloat(style.paddingRight);
    const pBottom = parseFloat(style.paddingBottom);
    const pLeft = parseFloat(style.paddingLeft);
    
    const mTop = parseFloat(style.marginTop);
    const mRight = parseFloat(style.marginRight);
    const mBottom = parseFloat(style.marginBottom);
    const mLeft = parseFloat(style.marginLeft);

    const highlight = document.createElement('div');
    Object.assign(highlight.style, {
      position: 'fixed',
      top: (rect.top - mTop) + 'px',
      left: (rect.left - mLeft) + 'px',
      width: (rect.width + mLeft + mRight) + 'px',
      height: (rect.height + mTop + mBottom) + 'px',
      pointerEvents: 'none',
      zIndex: '2147483647',
      transition: noTransition ? 'none' : 'all 0.1s ease-out'
    });
    
    const marginOverlay = document.createElement('div');
    Object.assign(marginOverlay.style, {
      position: 'absolute',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(255, 197, 143, 0.4)',
      border: '1px dashed rgba(255, 160, 64, 0.6)'
    });
    highlight.appendChild(marginOverlay);

    const paddingOverlay = document.createElement('div');
    Object.assign(paddingOverlay.style, {
      position: 'absolute',
      top: mTop + 'px',
      left: mLeft + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      background: 'rgba(186, 223, 172, 0.4)',
      border: '1px solid rgba(124, 179, 66, 0.6)'
    });
    highlight.appendChild(paddingOverlay);

    const contentOverlay = document.createElement('div');
    Object.assign(contentOverlay.style, {
      position: 'absolute',
      top: (mTop + pTop) + 'px',
      left: (mLeft + pLeft) + 'px',
      width: (rect.width - pLeft - pRight) + 'px',
      height: (rect.height - pTop - pBottom) + 'px',
      background: 'rgba(135, 206, 250, 0.4)',
      border: '1px solid rgba(3, 169, 244, 0.6)'
    });
    highlight.appendChild(contentOverlay);
    
    const label = document.createElement('div');
    label.textContent = `<${el.tagName.toLowerCase()}> ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    Object.assign(label.style, {
      position: 'absolute',
      bottom: '100%',
      left: mLeft + 'px',
      background: '#4f46e5',
      color: 'white',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      borderRadius: '4px 4px 0 0',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
      marginBottom: '2px'
    });
    
    highlight.appendChild(label);
    overlay.appendChild(highlight);
    hoverHighlighter = highlight;
  }

  function clearHoverHighlighter() {
    if (hoverHighlighter) {
      hoverHighlighter.remove();
      hoverHighlighter = null;
    }
  }

  function extractElementData(el, includeInteractivity = false) {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    const breadcrumbs = [];
    currentHierarchy = []; // Reset and populate with actual elements
    let current = el;
    while (current && current.tagName !== 'HTML') {
      currentHierarchy.push(current);
      let label = current.tagName.toLowerCase();
      if (current.id) label += `#${current.id}`;
      else if (current.className && typeof current.className === 'string') {
        const firstClass = current.className.split(' ')[0];
        if (firstClass) label += `.${firstClass}`;
      }
      breadcrumbs.push(label); // Store in same order as currentHierarchy
      current = current.parentElement;
    }
    
    // Reverse for UI display (Parent > Child)
    const displayBreadcrumbs = [...breadcrumbs].reverse();
    // But index in selectByPath will refer to currentHierarchy (0=child, 1=parent...)
    // So we need to map the display index back to the hierarchy index
    // Display: [Grandparent, Parent, Child]
    // Index:      0            1       2
    // currentHierarchy: [Child, Parent, Grandparent]
    // Index in currentHierarchy = (breadcrumbs.length - 1) - displayIndex
    // Index in currentHierarchy = (breadcrumbs.length - 1) - displayIndex

    const data = {
      tag: el.tagName,
      breadcrumbs: displayBreadcrumbs,
      rect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      styles: {
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        color: style.color,
        colorHex: rgbToHex(style.color),
        backgroundColor: style.backgroundColor,
        backgroundColorHex: rgbToHex(style.backgroundColor),
        backgroundImage: (function(bg) {
          if (!bg || bg === 'none') return null;
          const urls = bg.match(/url\(['"]?(.*?)['"]?\)/g);
          if (!urls) return null;
          return urls[0].replace(/url\(['"]?(.*?)['"]?\)/, '$1');
        })(style.backgroundImage),
        padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
        margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
        lineHeight: style.lineHeight,
        borderRadius: style.borderRadius,
        opacity: style.opacity,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
        width: style.width,
        height: style.height,
        display: style.display,
        position: style.position,
        zIndex: style.zIndex,
        textAlign: style.textAlign,
        textDecoration: style.textDecoration,
        border: style.border,
        overflow: style.overflow,
        visibility: style.visibility,
        top: style.top,
        right: style.right,
        bottom: style.bottom,
        left: style.left,
        flexDirection: style.flexDirection,
        justifyContent: style.justifyContent,
        alignItems: style.alignItems,
        flexWrap: style.flexWrap,
        gap: style.gap,
        gridTemplateColumns: style.gridTemplateColumns,
        gridTemplateRows: style.gridTemplateRows,
        gridGap: style.gridGap,
        boxShadow: style.boxShadow,
        borderWidth: style.borderWidth,
        borderStyle: style.borderStyle
      },
      attributes: {
        id: el.id,
        className: el.className,
        alt: el.getAttribute('alt'),
        role: el.getAttribute('role'),
        href: el.getAttribute('href'),
        src: el.getAttribute('src')
      },
      interactivity: includeInteractivity ? getPseudoStyles(el) : null
    };

    if (el.tagName === 'IMG' || data.styles.backgroundImage) {
      const url = el.tagName === 'IMG' ? el.src : data.styles.backgroundImage;
      const sizeInfo = getFileSizeFromPerformance(url);
      data.fileSize = sizeInfo.formatted;
      data.loadTimes = sizeInfo.loadTimes;
    }

    return data;
  }

  function getFileSizeFromPerformance(url) {
    let size = 0;
    try {
      const entry = performance.getEntriesByName(url)[0];
      if (entry && entry.encodedBodySize > 0) {
        size = entry.encodedBodySize;
      }
    } catch (e) {}

    const formatted = size > 0 ? formatBytes(size) : 'Unknown';
    
    // Estimates based on:
    // 3G: ~1.6 Mbps (200 KB/s)
    // 4G: ~20 Mbps (2.5 MB/s)
    const loadTimes = size > 0 ? {
      threeG: (size / (200 * 1024)).toFixed(2) + 's',
      fourG: (size / (2.5 * 1024 * 1024)).toFixed(2) + 's'
    } : null;

    return { formatted, loadTimes };
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function handleDistanceSelection(el) {
    // If we already have two targets, start fresh for the next pair
    if (distanceTargets.length >= 2) {
      distanceTargets = [];
      clearAllHighlights();
    }

    distanceTargets.push(el);
    refreshVisuals();

    if (distanceTargets.length === 2) {
      const el1 = distanceTargets[0].getBoundingClientRect();
      const el2 = distanceTargets[1].getBoundingClientRect();
      
      const distanceData = calculateDistance(el1, el2);
      chrome.runtime.sendMessage({ action: 'distanceResult', data: distanceData }).catch(() => {});
    }
  }

  function refreshVisuals() {
    if (!currentMode || !overlay) return;
    
    // Clear everything currently on the overlay to redraw fresh positions
    clearAllHighlights();
    clearHoverHighlighter();
    
    if (currentMode === 'inspect' && inspectTarget) {
      // Redraw the locked inspection highlight without transition for instant sync
      highlightHovered(inspectTarget, true, true);
    } else if (currentMode === 'distance') {
      // Redraw distance markers A and B
      distanceTargets.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const highlight = document.createElement('div');
        Object.assign(highlight.style, {
          position: 'fixed',
          top: rect.top + 'px',
          left: rect.left + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
          border: '2px dashed #4f46e5',
          background: 'rgba(79, 70, 229, 0.1)',
          pointerEvents: 'none',
          zIndex: '2147483647',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        });

        const badge = document.createElement('div');
        badge.textContent = index === 0 ? 'A' : 'B';
        Object.assign(badge.style, {
          background: '#4f46e5',
          color: 'white',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        });
        highlight.appendChild(badge);
        overlay.appendChild(highlight);
        highlighters.push(highlight);
      });

      // Redraw the connecting lines and arrows
      if (distanceTargets.length === 2) {
        const r1 = distanceTargets[0].getBoundingClientRect();
        const r2 = distanceTargets[1].getBoundingClientRect();
        drawDistanceConnection(r1, r2);
      }
    }
  }

  function drawDistanceConnection(r1, r2) {
    // Calculate gaps
    const verticalGap = {
      top: Math.min(r1.bottom, r2.bottom),
      bottom: Math.max(r1.top, r2.top),
      show: Math.max(r1.top, r2.top) > Math.min(r1.bottom, r2.bottom)
    };
    
    const horizontalGap = {
      left: Math.min(r1.right, r2.right),
      right: Math.max(r1.left, r2.left),
      show: Math.max(r1.left, r2.left) > Math.min(r1.right, r2.right)
    };

    // Helper to draw a line with a label and arrowheads
    const drawLine = (x1, y1, x2, y2, label, color) => {
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      if (length <= 5) return; // Don't draw tiny lines

      const line = document.createElement('div');
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      
      Object.assign(line.style, {
        position: 'fixed',
        top: y1 + 'px',
        left: x1 + 'px',
        width: length + 'px',
        height: '2px',
        background: color,
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        zIndex: '2147483647',
        pointerEvents: 'none'
      });

      // Add arrowheads
      const createArrow = (atEnd) => {
        const arrow = document.createElement('div');
        Object.assign(arrow.style, {
          position: 'absolute',
          top: '-4px',
          [atEnd ? 'right' : 'left']: '-2px',
          width: '0',
          height: '0',
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          [atEnd ? 'borderLeft' : 'borderRight']: `8px solid ${color}`,
          transform: atEnd ? '' : 'rotate(180deg)'
        });
        return arrow;
      };
      
      line.appendChild(createArrow(false)); // Start arrow
      line.appendChild(createArrow(true));  // End arrow

      const labelEl = document.createElement('div');
      labelEl.textContent = `${Math.round(length)}px`;
      Object.assign(labelEl.style, {
        position: 'absolute',
        top: '-24px',
        left: '50%',
        transform: `translateX(-50%) rotate(${-angle}deg)`,
        background: color,
        color: 'white',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      });

      line.appendChild(labelEl);
      overlay.appendChild(line);
      highlighters.push(line);
    };

    // Draw Vertical Gap Line
    if (verticalGap.show) {
      const x = (Math.max(r1.left, r2.left) + Math.min(r1.right, r2.right)) / 2;
      drawLine(x, verticalGap.top, x, verticalGap.bottom, '', '#ef4444');
    }

    // Draw Horizontal Gap Line
    if (horizontalGap.show) {
      const y = (Math.max(r1.top, r2.top) + Math.min(r1.bottom, r2.bottom)) / 2;
      drawLine(horizontalGap.left, y, horizontalGap.right, y, '', '#3b82f6');
    }

    // Draw direct connection if no direct overlap
    if (!verticalGap.show && !horizontalGap.show) {
      drawLine(
        (r1.left + r1.right) / 2, (r1.top + r1.bottom) / 2,
        (r2.left + r2.right) / 2, (r2.top + r2.bottom) / 2,
        '', '#4f46e5'
      );
    }
  }

  function calculateDistance(r1, r2) {
    const horizontal = Math.max(0, r2.left - r1.right, r1.left - r2.right);
    const vertical = Math.max(0, r2.top - r1.bottom, r1.top - r2.bottom);
    const dist = Math.sqrt(horizontal * horizontal + vertical * vertical);
    
    return {
      distance: dist,
      vertical: vertical,
      horizontal: horizontal
    };
  }

  function clearAll() {
    clearHoverHighlighter();
    highlighters.forEach(h => h.remove());
    highlighters = [];
    distanceTargets = [];
    inspectTarget = null;
    if (overlay) overlay.innerHTML = '';
  }

  function clearAllHighlights() {
    highlighters.forEach(h => h.remove());
    highlighters = [];
  }

  function getMetaInfo() {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      h1Count: document.querySelectorAll('h1').length,
      lang: document.documentElement.lang,
      viewport: document.querySelector('meta[name="viewport"]')?.content || ''
    };
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
    const match = rgb.match(/\d+/g);
    if (!match) return null;
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }

  function getActualBackgroundColor(el) {
    let current = el;
    while (current) {
      const bg = window.getComputedStyle(current).backgroundColor;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      current = current.parentElement;
    }
    return 'rgb(255, 255, 255)';
  }

  function getPseudoStyles(el) {
    const states = [':hover', ':active', ':focus'];
    const results = {};
    const allPseudos = [...states, ':link', ':visited', ':any-link', ':-webkit-any-link'];

    function processRule(rule) {
      if (rule.type === CSSRule.STYLE_RULE) {
        const selectorText = rule.selectorText;
        if (!selectorText) return;

        const selectors = selectorText.split(',');
        for (let selector of selectors) {
          selector = selector.trim();
          
          for (const state of states) {
            if (selector.includes(state)) {
              let testSelector = selector;
              // Strip dynamic states and link-related pseudos to be more inclusive
              allPseudos.forEach(p => {
                testSelector = testSelector.split(p).join('');
              });
              
              // Strip pseudo-elements as matches/closest doesn't support them
              testSelector = testSelector.split('::')[0].trim();
              if (!testSelector) testSelector = '*';

              try {
                // If the element matches or is inside an element that matches the base selector
                // This captures styles on the element, parent styles affecting it, and inherited styles.
                if (el.closest(testSelector)) {
                  if (!results[state]) results[state] = [];
                  const styles = rule.style;
                  const props = {};
                  for (let i = 0; i < styles.length; i++) {
                    const prop = styles[i];
                    const value = styles.getPropertyValue(prop);
                    const priority = styles.getPropertyPriority(prop);
                    props[prop] = value + (priority ? ' !' + priority : '');
                  }
                  results[state].push(props);
                }
              } catch (e) {}
            }
          }
        }
      } else if (rule.type === CSSRule.MEDIA_RULE || rule.type === CSSRule.SUPPORTS_RULE) {
        const subRules = rule.cssRules || rule.rules;
        if (subRules) {
          for (const subRule of subRules) {
            processRule(subRule);
          }
        }
      }
    }

    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (const rule of rules) {
            processRule(rule);
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Error scanning stylesheets:', e);
    }

    return results;
  }

})();
