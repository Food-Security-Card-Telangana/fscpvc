// content.js - Ultra-Resilient Extraction for EPDS Telangana
console.log("Telangana FSC Content Script: Resilient Mode Active");

function extractFSCData() {
    const data = {
        details: {},
        members: []
    };

    const extractIdInBrackets = (str) => {
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1] : str;
    };

    // Helper to check if a string contains any of the keywords
    const matches = (text, keywords) => {
        const lower = text.toLowerCase();
        return keywords.some(k => lower.includes(k.toLowerCase()));
    };

    const allCells = Array.from(document.querySelectorAll('td'));

    // 1. Unified Detail Extraction
    allCells.forEach((cell, index) => {
        const cellText = cell.innerText.trim();
        if (!cellText) return;

        let label = cellText;
        let value = '';

        // If the cell has a colon, try splitting it
        if (cellText.includes(':')) {
            const parts = cellText.split(':');
            label = parts[0].trim();
            value = parts.slice(1).join(':').trim();
        }

        // IMPORTANT: If value is still empty after colon split, or no colon found, 
        // look at the NEXT cell for the value
        if (!value) {
            value = allCells[index + 1]?.innerText.trim() || '';
        }

        if (!label || !value) return;

        // Dynamic Mapping
        if (matches(label, ['Ration Card No', 'FSC No'])) {
            if (!data.details.fscNo) data.details.fscNo = value;
        }
        if (matches(label, ['Reference No'])) {
            if (!data.details.fscRefNo) data.details.fscRefNo = value;
        }
        if (matches(label, ['District'])) {
            if (!data.details.district) data.details.district = value;
        }
        if (matches(label, ['Old RCNo', 'Old Card'])) {
            if (!data.details.oldRCNo) data.details.oldRCNo = value;
        }
        if (matches(label, ['Gas Connection', 'Gas'])) {
            if (!data.details.gasConnection) data.details.gasConnection = value;
        }
        if (matches(label, ['Consumer No'])) {
            if (!data.details.consumerNo) data.details.consumerNo = value;
        }
        if (matches(label, ['FPShop No', 'Shop No'])) {
            if (!data.details.fpShopNo) data.details.fpShopNo = value;
        }
        if (matches(label, ['Head of the Family', 'HOF Name'])) {
            if (!data.details.hof) data.details.hof = value;
        }
        if (matches(label, ['Card Type'])) {
            if (!data.details.cardType) data.details.cardType = value;
        }

        if (matches(label, ['KeyRegister'])) {
            data.details.keyRegisterSlNo = value;
            if (!data.details.fpShopNo) data.details.fpShopNo = extractIdInBrackets(value);
        }
    });

    // 2. Member Extraction (Looking for the specific member table)
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (table.innerText.includes('MEMBER DETAILS')) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length >= 2) {
                    const sno = cols[0].innerText.trim();
                    const name = cols[1].innerText.trim();
                    // S.No should be a number or a small string starting with number
                    if (sno && !isNaN(parseInt(sno))) {
                        data.members.push({ sno: parseInt(sno), name });
                    }
                }
            });
        }
    });

    // Clean up District
    if (data.details.district) {
        data.details.district = data.details.district.replace(/[.:]+$/, '').trim();
    }

    console.log("Extraction Results:", data);
    return data;
}

// content.js - Ultra-Resilient Extraction & Direct Download for EPDS Telangana
console.log("Telangana FSC Content Script: Direct Download Active");

// ... (existing extractFSCData remains same above or inside) ...

// Function to inject the button
function injectActionButton() {
    if (document.getElementById('fsc-direct-download-btn')) return;

    const targetTable = Array.from(document.querySelectorAll('table')).find(t => t.innerText.includes('RATION CARD DETAILS'));
    if (!targetTable) return;

    const btn = document.createElement('button');
    btn.id = 'fsc-direct-download-btn';
    btn.innerText = '⚡ GENERATE PVC CARDS NOW';
    btn.style.cssText = `
        background: #00897b;
        color: white;
        border: none;
        padding: 12px 24px;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
        margin: 20px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: sans-serif;
    `;

    btn.onclick = async () => {
        btn.innerText = '⌛ PROCESSING...';
        btn.disabled = true;

        try {
            const data = extractFSCData();
            if (!data.details.fscNo) {
                alert("Please wait for the page to load or search again.");
                return;
            }

            // Tell the background script to handle the download/render if needed, 
            // but the user asked for a "Download Button on the Page".
            // So we send a message to the background or popup? 
            // Better: Open the popup-like view in a fixed overlay or just send to background to open a specialized tab.

            // For maximum "WOW", we will trigger the popup logic from here:
            chrome.runtime.sendMessage({ action: "generate_from_page", data: data });
            btn.innerText = '✅ REQUESTED! CHECK POPUP';

        } catch (e) {
            console.error(e);
            btn.innerText = '❌ ERROR';
        }

        setTimeout(() => {
            btn.innerText = '⚡ GENERATE PVC CARDS NOW';
            btn.disabled = false;
        }, 3000);
    };

    targetTable.parentNode.insertBefore(btn, targetTable);
}

// Watch for page changes (since portal uses postback/frames)
setInterval(injectActionButton, 2000);
