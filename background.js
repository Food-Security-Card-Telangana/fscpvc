// background.js - Handling automation from page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generate_from_page") {
        // Store data temporarily
        chrome.storage.local.set({ "pending_data": request.data }, () => {
            // Open the popup window manually as a fixed-size tab
            chrome.windows.create({
                url: chrome.runtime.getURL("popup.html?auto=true"),
                type: "popup",
                width: 400,
                height: 600
            });
        });
    }
});
