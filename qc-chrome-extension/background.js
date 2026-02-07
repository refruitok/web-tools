chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for messages from content scripts and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "mobileViewDisabled") {
    // Update storage to reflect mobile view is off
    chrome.storage.local.set({ mobileViewActive: false });
  }
});
