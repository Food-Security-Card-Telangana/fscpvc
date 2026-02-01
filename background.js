chrome.runtime.onInstalled.addListener(() => {
    console.log('Telangana Card Generator Extension Installed');
});

// Auto-open side panel when visiting the EPDS site
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;
    const url = new URL(tab.url);
    if (url.origin.includes('epds.telangana.gov.in')) {
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'popup.html',
            enabled: true
        });

        // Attempt to open side panel automatically
        // Note: Some Chrome versions may require a user gesture, but this is the standard MV3 method
        chrome.sidePanel.open({ tabId }).catch((error) => console.error(error));
    }
});

// Configure side panel behavior on extension icon click
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
