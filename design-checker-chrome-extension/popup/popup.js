document.addEventListener('DOMContentLoaded', () => {
  const runAllChecksBtn = document.getElementById('runAllChecks');
  const exportResultsBtn = document.getElementById('exportResults');
  const clearHighlightsBtn = document.getElementById('clearHighlights');
  const resultsDiv = document.getElementById('results');

  let lastResults = null;

  runAllChecksBtn.addEventListener('click', async () => {
    const options = {
      checkHeaders: document.getElementById('checkHeaders').checked,
      checkFonts: document.getElementById('checkFonts').checked,
      checkImages: document.getElementById('checkImages').checked,
      checkSpacing: document.getElementById('checkSpacing').checked,
      checkMeta: document.getElementById('checkMeta').checked
    };

    resultsDiv.innerHTML = '<div class="loading">Analyzing page...</div>';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'runChecks',
        options: options
      });

      if (response && response.results) {
        lastResults = response.results;
        displayResults(response.results);
        exportResultsBtn.disabled = false;
      }
    } catch (error) {
      resultsDiv.innerHTML = `<p class="placeholder" style="color: #ef4444;">Error: ${error.message}. Make sure you're on a valid webpage.</p>`;
    }
  });

  clearHighlightsBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'clearHighlights' });
    } catch (error) {
      console.error('Error clearing highlights:', error);
    }
  });

  exportResultsBtn.addEventListener('click', () => {
    if (!lastResults) return;
    
    const report = generateReport(lastResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `qc-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
  });

  function displayResults(results) {
    let html = '';
    
    // Summary stats
    let passCount = 0, warnCount = 0, failCount = 0;
    
    Object.values(results).forEach(section => {
      if (section.items) {
        section.items.forEach(item => {
          if (item.status === 'pass') passCount++;
          else if (item.status === 'warn') warnCount++;
          else if (item.status === 'fail') failCount++;
        });
      }
    });

    html += `
      <div class="summary-stats">
        <div class="stat-badge pass"><span class="count">${passCount}</span>Pass</div>
        <div class="stat-badge warn"><span class="count">${warnCount}</span>Warn</div>
        <div class="stat-badge fail"><span class="count">${failCount}</span>Fail</div>
      </div>
    `;

    // Header check results
    if (results.headers) {
      html += renderSection('📑 Header Tags', results.headers);
    }

    // Font check results
    if (results.fonts) {
      html += renderSection('🔤 Fonts', results.fonts);
    }

    // Image check results
    if (results.images) {
      html += renderSection('🖼️ Images', results.images);
    }

    // Spacing check results
    if (results.spacing) {
      html += renderSection('📏 Spacing', results.spacing);
    }

    // Meta check results
    if (results.meta) {
      html += renderSection('🏷️ Meta Tags', results.meta);
    }

    resultsDiv.innerHTML = html;
  }

  function renderSection(title, section) {
    const overallStatus = section.status || 'pass';
    const statusIcon = overallStatus === 'pass' ? '✅' : overallStatus === 'warn' ? '⚠️' : '❌';
    
    let html = `
      <div class="result-section">
        <h3><span class="status-icon status-${overallStatus}">${statusIcon}</span>${title}</h3>
    `;

    if (section.items && section.items.length > 0) {
      section.items.forEach(item => {
        html += `<div class="result-item ${item.status}">${item.message}</div>`;
      });
    } else if (section.message) {
      html += `<div class="result-item ${section.status}">${section.message}</div>`;
    }

    html += '</div>';
    return html;
  }

  function generateReport(results) {
    let report = '=== Website QC Report ===\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (results.headers) {
      report += '--- Header Tags ---\n';
      results.headers.items?.forEach(item => {
        report += `[${item.status.toUpperCase()}] ${item.message}\n`;
      });
      report += '\n';
    }

    if (results.fonts) {
      report += '--- Fonts ---\n';
      results.fonts.items?.forEach(item => {
        report += `[${item.status.toUpperCase()}] ${item.message}\n`;
      });
      report += '\n';
    }

    if (results.images) {
      report += '--- Images ---\n';
      results.images.items?.forEach(item => {
        report += `[${item.status.toUpperCase()}] ${item.message}\n`;
      });
      report += '\n';
    }

    if (results.spacing) {
      report += '--- Spacing ---\n';
      results.spacing.items?.forEach(item => {
        report += `[${item.status.toUpperCase()}] ${item.message}\n`;
      });
      report += '\n';
    }

    if (results.meta) {
      report += '--- Meta Tags ---\n';
      results.meta.items?.forEach(item => {
        report += `[${item.status.toUpperCase()}] ${item.message}\n`;
      });
      report += '\n';
    }

    return report;
  }
});
