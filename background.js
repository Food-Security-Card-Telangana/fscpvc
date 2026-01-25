/* background.js for data persistence or cross-page communication */

chrome.runtime.onInstalled.addListener(() => {
    console.log('Telangana Card Generator Extension Installed');
});

// We can add logic here to aggregate data from multiple websites if needed
// For now, we are focusing on EPDS Telangana extraction
