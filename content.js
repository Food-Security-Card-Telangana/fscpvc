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

        let label = '';
        let value = '';

        if (cellText.includes(':')) {
            const parts = cellText.split(':');
            label = parts[0].trim();
            value = parts.slice(1).join(':').trim();
        } else {
            label = cellText;
            value = allCells[index + 1]?.innerText.trim() || '';
        }

        if (!label || !value) return;

        // Dynamic Mapping
        if (matches(label, ['Ration Card No', 'FSC No'])) data.details.fscNo = value;
        if (matches(label, ['Reference No'])) data.details.fscRefNo = value;
        if (matches(label, ['District'])) data.details.district = value;
        if (matches(label, ['Old RCNo', 'Old Card'])) data.details.oldRCNo = value;
        if (matches(label, ['Gas Connection', 'Gas'])) data.details.gasConnection = value;
        if (matches(label, ['Consumer No'])) data.details.consumerNo = value;
        if (matches(label, ['FPShop No', 'Shop No'])) data.details.fpShopNo = value;
        if (matches(label, ['Head of the Family', 'HOF Name'])) data.details.hof = value;
        if (matches(label, ['Card Type'])) data.details.cardType = value;

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
                    // S.No should be a number
                    if (sno && !isNaN(sno)) {
                        data.members.push({ sno, name });
                    }
                }
            });
        }
    });

    // Clean up HOF if it was found in multiple places
    if (data.details.district) {
        // Remove trailing spaces or dots
        data.details.district = data.details.district.replace(/[.:]+$/, '').trim();
    }

    console.log("Extraction Results:", data);
    return data;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract") {
        sendResponse(extractFSCData());
    }
});
