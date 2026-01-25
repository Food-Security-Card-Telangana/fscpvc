// content.js - Robust Extraction for EPDS Telangana
console.log("Telangana FSC Content Script: Improved Extraction Active");

function extractFSCData() {
    const data = {
        details: {},
        members: []
    };

    // Helper to extract numeric ID from string like "217(4317070)"
    const extractIdInBrackets = (str) => {
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1] : str;
    };

    const allTables = document.querySelectorAll('table');

    allTables.forEach(table => {
        const text = table.innerText;

        // 1. Extract Main Details
        if (text.includes('RATION CARD DETAILS')) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                for (let i = 0; i < cells.length; i++) {
                    const label = cells[i].innerText.trim();
                    const value = cells[i + 1]?.innerText.trim();

                    if (!value) continue;

                    if (label.startsWith('New Ration Card No')) data.details.fscNo = value;
                    if (label.startsWith('FSC Reference No')) data.details.fscRefNo = value;
                    if (label.startsWith('Card Type')) data.details.cardType = value;
                    if (label.startsWith('Application Status')) data.details.appStatus = value;
                    if (label.startsWith('Gas Connection')) data.details.gasConnection = value;
                    if (label.startsWith('Consumer No')) data.details.consumerNo = value;
                    if (label.startsWith('Old RCNo')) data.details.oldRCNo = value;
                    if (label.startsWith('Head of the Family')) data.details.hof = value;
                    if (label.startsWith('District')) data.details.district = value;
                    if (label.startsWith('Office Name')) data.details.officeName = value;
                    if (label.startsWith('FPShop No')) data.details.fpShopNo = value;

                    // Special handling for KeyRegister Sl.No to get FPShop No
                    if (label.startsWith('KeyRegister Sl.No')) {
                        data.details.keyRegisterSlNo = value;
                        if (!data.details.fpShopNo) {
                            data.details.fpShopNo = extractIdInBrackets(value);
                        }
                    }
                }
            });
        }

        // 2. Extract Member Details
        if (text.includes('RATION CARD MEMBER DETAILS')) {
            const rows = table.querySelectorAll('tr');
            rows.forEach((row, index) => {
                // Skip non-data rows (headings, column labels)
                if (index > 1 && row.innerText.trim() !== '') {
                    const cols = row.querySelectorAll('td');
                    if (cols.length >= 2) {
                        const sno = cols[0].innerText.trim();
                        const name = cols[1].innerText.trim();
                        if (sno && !isNaN(sno)) {
                            data.members.push({ sno, name });
                        }
                    }
                }
            });
        }
    });

    // Final check for the field names/values provided by user
    console.log("Extracted Data:", data);
    return data;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract") {
        const extracted = extractFSCData();
        sendResponse(extracted);
    }
});
