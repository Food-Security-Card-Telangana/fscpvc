document.addEventListener('DOMContentLoaded', () => {
    const statusMsg = document.getElementById('status-message');
    const selectionArea = document.getElementById('selection-area');
    const previewArea = document.getElementById('preview-area');
    const familyGenBtn = document.getElementById('family-gen-btn');
    const backBtn = document.getElementById('back-btn');
    const downloadBtn = document.getElementById('download-btn');
    const downloadFrontBtn = document.getElementById('download-front-btn');
    const cardWrap = document.getElementById('card-wrap');

    let extractedData = null;

    // 1. Initial Data Extraction
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const isPortal = activeTab && activeTab.url && (
            activeTab.url.toLowerCase().includes('epds.telangana.gov.in') ||
            activeTab.url.toLowerCase().includes('telangana.gov.in')
        );

        if (isPortal) {
            statusMsg.innerText = "Connecting to portal...";
            chrome.tabs.sendMessage(activeTab.id, { action: "extract" }, (response) => {
                if (chrome.runtime.lastError) {
                    statusMsg.innerText = "Error: Please refresh the page and try again.";
                    console.error(chrome.runtime.lastError);
                    return;
                }

                if (response && response.details && (response.details.fscNo || response.details.rcNo)) {
                    extractedData = response;
                    statusMsg.classList.add('hidden');
                    selectionArea.classList.remove('hidden');
                    const displayId = response.details.rcNo || response.details.fscNo;
                    document.getElementById('display-fsc').innerText = "RATION CARD NO: " + displayId;
                } else {
                    statusMsg.innerText = "Could not find Ration Card data. Please search first.";
                }
            });
        }
    });

    familyGenBtn.addEventListener('click', () => {
        selectionArea.classList.add('hidden');
        previewArea.classList.remove('hidden');
        renderTwoSidesUnified();
    });

    backBtn.addEventListener('click', () => {
        previewArea.classList.add('hidden');
        selectionArea.classList.remove('hidden');
    });

    function renderTwoSidesUnified() {
        const details = extractedData.details;
        const members = extractedData.members;

        // Filter out HOF from the list using robust normalized matching
        let displayMembers = members;

        // If it's a single-member family, don't hide the HOF from the list
        if (displayMembers.length === 0 && members.length > 0) {
            displayMembers = members;
        }

        // Auto-fix for up to 9 members on the first side
        const frontMax = 9;
        const frontMembers = displayMembers.slice(0, frontMax);
        const backMembers = displayMembers.length > frontMax ? displayMembers.slice(frontMax, 18) : [];

        // STAGE 2: Simplified QR Logic (REMOVED FOR NOW)

        const generateSideHtml = (sideId, sideTitle, memberList) => {
            const memberRows = memberList.map(m => `<tr><td style="width:15px; color:#aaa;">${m.sno}</td><td style="font-weight:700;">${m.name}</td></tr>`).join('');

            return `
                <div id="${sideId}" class="pvc-card">
                    <div class="card-header">
                        <img src="assets/emblem_ts.svg" class="header-logo-left">
                        <div class="header-title">${sideTitle} - TELANGANA<br>(${details.district || '---'})</div>
                        <img src="assets/fsc_logo.png" class="header-logo-right">
                    </div>
                    <div class="card-content-split">
                        <div class="info-side">
                            <div><label>REF NO</label><strong>${details.fscRefNo || '---'}</strong></div>
                            <div><label>OLD RCNO</label><strong>${details.oldRCNo || '---'}</strong></div>
                            <div class="row-layout"><label>GAS</label><strong>${details.gasConnection || '---'}</strong></div>
                            <div class="row-layout"><label>CUST NO</label><strong>${details.consumerNo || '---'}</strong></div>
                            <div class="row-layout"><label>SHOP NO</label><strong>${details.fpShopNo || '---'}</strong></div>
                        </div>
                        <div class="list-side">
                            <table class="family-table">
                                <thead><tr><th>#</th><th>FAMILY MEMBER NAME</th></tr></thead>
                                <tbody>${memberRows || '<tr><td colspan="2" style="text-align:center; padding-top:20px; color:#ccc;">NO MORE MEMBERS</td></tr>'}</tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="footer-fsc">RC NO: ${details.rcNo || details.fscNo}</div>
                    </div>
                </div>
            `;
        };

        cardWrap.innerHTML = `
            ${generateSideHtml('card-front', 'FSC Ration Card', frontMembers)}
            <div style="margin-top: 20px;">
                ${generateSideHtml('card-back', 'FSC Ration Card', backMembers)}
            </div>
        `;
    }

    downloadFrontBtn.addEventListener('click', async () => {
        const el = document.getElementById('card-front');
        const canvas = await html2canvas(el, {
            scale: 6,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 330,
            height: 210
        });
        const link = document.createElement('a');
        const safeHof = extractedData.details.hof.replace(/[^a-z0-9]/gi, '_');
        const displayId = extractedData.details.rcNo || extractedData.details.fscNo;
        link.download = `RC_${displayId}_${safeHof}_Front.png`;
        link.href = canvas.toContentDataURL ? canvas.toContentDataURL('image/png', 1.0) : canvas.toDataURL('image/png', 1.0);
        link.click();
    });

    downloadBtn.addEventListener('click', async () => {
        const sides = ['card-front', 'card-back'];
        for (const sideId of sides) {
            const el = document.getElementById(sideId);
            const canvas = await html2canvas(el, {
                scale: 6,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 330,
                height: 210
            });
            const link = document.createElement('a');
            const side = sideId === 'card-front' ? 'Front' : 'Back';
            const safeHof = extractedData.details.hof.replace(/[^a-z0-9]/gi, '_');
            const displayId = extractedData.details.rcNo || extractedData.details.fscNo;
            link.download = `RC_${displayId}_${safeHof}_${side}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            await new Promise(r => setTimeout(r, 600));
        }
    });
});
