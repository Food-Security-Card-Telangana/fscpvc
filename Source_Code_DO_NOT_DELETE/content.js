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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract") {
        sendResponse(extractFSCData());
    }
});
