// Background script

chrome.action.onClicked.addListener((tab) => {
    // Open the side panel when the extension icon is clicked
    // Note: 'open' requires user gesture, which click provides.
    // In Chrome 116+, sidePanel.open is available.
    chrome.sidePanel.open({ tabId: tab.id });
});

console.log("AI Contract Scanner Background Worker Loaded");
