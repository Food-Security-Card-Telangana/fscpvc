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

        // STAGE 2: JSON-Style Direct Record QR (v11.35)
        const qrData = {
            f: details.rcNo || details.fscNo,
            r: details.fscRefNo,
            d: details.district,
            h: details.hof,
            fs: details.fpShopNo,
            ct: details.cardType,
            gc: details.gasConnection,
            cn: details.consumerNo,
            os: details.oldRCNo,
            as: details.applicationStatus,
            an: details.applicationNo,
            sn: details.sksFormNo,
            on: details.officeName,
            is: details.impdsStatus,
            ks: details.keyRegisterSlNo,
            m: members.map(m => m.name)
        };
        const encodedData = btoa(encodeURIComponent(JSON.stringify(qrData)));
        const qrUrl = `https://food-security-card-telangana.github.io/fscpvc/viewer.html?d=${encodedData}`;
        const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&margin=0&ecc=L`;

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
                            <div class="header-title-main">FSC RATION CARD - TELANGANA</div>
                            <div class="header-title-sub">(${details.district || 'District'})</div>
                        </div>
                        <img src="assets/fsc_logo.png" class="header-logo-r">
                    </div>
                    
                    <div class="green-divider"></div>

                    <div class="card-body">
                        <img src="assets/seal_new.jpg" class="watermark-seal">
                        <div class="info-col">
                            <div class="info-item-v">
                                <span class="info-label">REF NO</span>
                                <span class="info-value">${details.fscRefNo || '---'}</span>
                            </div>
                            <div class="info-item-v">
                                <span class="info-label">OLD RC NO</span>
                                <span class="info-value">${details.oldRCNo || '---'}</span>
                            </div>
                            
                            <div class="info-item-h">
                                <span class="info-label">CARD TYPE:</span>
                                <span class="info-value">${details.cardType || 'FSC'}</span>
                            </div>
                            <div class="info-item-h">
                                <span class="info-label">GAS:</span>
                                <span class="info-value">${details.gasConnection || '---'}</span>
                            </div>
                            <div class="info-item-h">
                                <span class="info-label">CUST NO:</span>
                                <span class="info-value">${details.consumerNo || '---'}</span>
                            </div>
                            <div class="info-item-h">
                                <span class="info-label">SHOP NO:</span>
                                <span class="info-value">${details.fpShopNo || '---'}</span>
                            </div>
                        </div>
                        
                        <div class="list-col">
                            <div class="list-header"># FAMILY MEMBER NAME</div>
                            <ul class="member-rows">
                                ${memberRows || '<li class="member-item"><span class="member-name">No members listed</span></li>'}
                            </ul>
                        </div>
                    </div>

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
