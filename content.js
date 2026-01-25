// content.js - Enhanced for Telangana EPDS Portal Extraction
console.log("Telangana FSC Content Script Active");

function extractFSCData() {
    const data = {
        details: {},
        members: []
    };

    const detailTables = document.querySelectorAll('table');
    detailTables.forEach(table => {
        const text = table.innerText;
        if (text.includes('RATION CARD DETAILS')) {
            const cells = table.querySelectorAll('td');
            cells.forEach((cell, index) => {
                const label = cell.innerText.trim();
                const value = cells[index + 1]?.innerText.trim();

                if (label.includes('New Ration Card No')) data.details.fscNo = value;
                if (label.includes('FSC Reference No')) data.details.fscRefNo = value;
                if (label.includes('Card Type')) data.details.cardType = value;
                if (label.includes('Application Status')) data.details.appStatus = value;
                if (label.includes('Gas Connection')) data.details.gasConnection = value;
                if (label.includes('Consumer No')) data.details.consumerNo = value;
                if (label.includes('KeyRegister Sl.No')) data.details.keyRegisterSlNo = value;
                if (label.includes('Old RCNo')) data.details.oldRCNo = value;
                if (label.includes('Head of the Family')) data.details.hof = value;
                if (label.includes('District')) data.details.district = value;
                if (label.includes('Office Name')) data.details.officeName = value;
                if (label.includes('FPShop No')) data.details.fpShopNo = value;
            });
        }
        if (text.includes('RATION CARD MEMBER DETAILS')) {
            const rows = table.querySelectorAll('tr');
            rows.forEach((row, index) => {
                if (index > 1) { // Skip header and columns labels
                    const cols = row.querySelectorAll('td');
                    if (cols.length >= 2) {
                        data.members.push({
                            sno: cols[0].innerText.trim(),
                            name: cols[1].innerText.trim()
                        });
                    }
                }
            });
        }
    });

    console.log("Extracted Data:", data);
    return data;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract") {
        const extracted = extractFSCData();
        sendResponse(extracted);
    }
});
