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

        // STAGE 2: Simplified QR Logic for Print-Scannability
        const qrData = {
            f: details.fscNo,
            h: details.hof,
            r: details.fscRefNo,
            d: details.district,
            m: members.slice(0, 5).map(m => m.name.substring(0, 15)) // Truncate for scannability
        };
        const encodedData = btoa(encodeURIComponent(JSON.stringify(qrData)));
        const qrUrl = `https://food-security-card-telangana.github.io/fscpvc/viewer.html?d=${encodedData}`;
        const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&margin=0&ecc=M`;

        const generateSideHtml = (sideId, sideTitle, memberList) => {
            const memberRows = memberList.slice(0, 8).map(m => `
                <li class="member-item">
                    <span class="member-sno">${m.sno}</span>
                    <span class="member-name">${m.name}</span>
                </li>
            `).join('');

            return `
                <div id="${sideId}" class="pvc-card">
                    <div class="card-header">
                        <img src="assets/emblem_ts.svg" class="header-logo-l">
                        <div class="header-center">
                            <span class="header-title-main">FSC RATION CARD - TELANGANA</span>
                            <span class="header-title-sub">(${details.district || '---'})</span>
                        </div>
                        <img src="assets/fsc_logo.png" class="header-logo-r">
                    </div>
                    
                    <div class="green-divider"></div>

                    <div class="card-body">
                        <div class="info-col">
                            <div class="info-h-block">
                                <span class="info-label">REF NO:</span>
                                <span class="info-value">${details.fscRefNo || '---'}</span>
                            </div>
                            <div class="info-h-block">
                                <span class="info-label">OLD RC NO:</span>
                                <span class="info-value">${details.oldRCNo || '---'}</span>
                            </div>
                            
                            <div class="info-table">
                                <div class="table-row">
                                    <div class="table-cell">
                                        <span class="cell-l">CARD TYPE</span>
                                        <span class="cell-v">${details.cardType || 'FSC'}</span>
                                    </div>
                                    <div class="table-cell">
                                        <span class="cell-l">GAS</span>
                                        <span class="cell-v">${details.gasConnection || '---'}</span>
                                    </div>
                                </div>
                                <div class="table-row">
                                    <div class="table-cell">
                                        <span class="cell-l">CUST NO</span>
                                        <span class="cell-v">${details.consumerNo || '---'}</span>
                                    </div>
                                    <div class="table-cell">
                                        <span class="cell-l">SHOP NO</span>
                                        <span class="cell-v">${details.fpShopNo || '---'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="list-col">
                            <div class="list-header"># FAMILY MEMBER NAME</div>
                            <ul class="member-rows">
                                ${memberRows || '<li class="member-item"><span class="member-name">No members listed</span></li>'}
                            </ul>
                        </div>
                    </div>

                    <div class="bottom-divider"></div>

                    <div class="card-footer">
                        <div class="footer-left">
                            <div class="qr-container">
                                <img src="${qrImg}" alt="QR">
                            </div>
                            <div class="footer-labels">
                                <div class="f-label-top">Scan for verification</div>
                                <div class="f-label-bottom">RC NUMBER</div>
                            </div>
                        </div>
                        <div class="footer-right">
                            <div class="rc-number-text">${details.rcNo || details.fscNo}</div>
                        </div>
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
