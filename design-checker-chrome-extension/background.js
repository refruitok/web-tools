chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    sendResponse({ success: true });
  } else if (message.action === 'downloadImage') {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename || 'downloaded_image'
    });
    sendResponse({ success: true });
  }
  return false;
});
