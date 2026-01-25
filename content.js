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

                    if (label.includes('New Ration Card No')) data.details.fscNo = value;
                    if (label.includes('FSC Reference No')) data.details.fscRefNo = value;
                    if (label.includes('Card Type')) data.details.cardType = value;
                    if (label.includes('Application Status')) data.details.appStatus = value;
                    if (label.includes('Gas Connection')) data.details.gasConnection = value;
                    if (label.includes('Consumer No')) data.details.consumerNo = value;
                    if (label.includes('Old RCNo')) data.details.oldRCNo = value;
                    if (label.includes('Head of the Family')) data.details.hof = value;
                    if (label.includes('District')) data.details.district = value;
                    if (label.includes('Office Name')) data.details.officeName = value;
                    if (label.includes('FPShop No')) data.details.fpShopNo = value;

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
