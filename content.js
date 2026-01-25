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
                    const cellText = cells[i].innerText.trim();
                    // Split by colon if it exists in the same cell, otherwise take next cell
                    let label = '';
                    let value = '';

                    if (cellText.includes(':')) {
                        [label, value] = cellText.split(':').map(s => s.trim());
                    } else {
                        label = cellText;
                        value = cells[i + 1]?.innerText.trim() || '';
                        // If we used the next cell as value, skip it in the next iteration
                        if (value) i++;
                    }

                    if (!label || !value) continue;

                    if (label.toLowerCase().includes('ration card no')) data.details.fscNo = value;
                    if (label.toLowerCase().includes('reference no')) data.details.fscRefNo = value;
                    if (label.toLowerCase().includes('card type')) data.details.cardType = value;
                    if (label.toLowerCase().includes('application status')) data.details.appStatus = value;
                    if (label.toLowerCase().includes('gas connection')) data.details.gasConnection = value;
                    if (label.toLowerCase().includes('consumer no')) data.details.consumerNo = value;
                    if (label.toLowerCase().includes('old rcno')) data.details.oldRCNo = value;
                    if (label.toLowerCase().includes('head of the family')) data.details.hof = value;
                    if (label.toLowerCase().includes('district')) data.details.district = value;
                    if (label.toLowerCase().includes('office name')) data.details.officeName = value;
                    if (label.toLowerCase().includes('fpshop no')) data.details.fpShopNo = value;

                    // Support for KeyRegister Sl.No
                    if (label.toLowerCase().includes('keyregister')) {
                        data.details.keyRegisterSlNo = value;
                        if (!data.details.fpShopNo) data.details.fpShopNo = extractIdInBrackets(value);
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
