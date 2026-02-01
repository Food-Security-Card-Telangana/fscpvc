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
        if (matches(label, ['FSC No'])) {
            if (!data.details.fscNo) data.details.fscNo = value;
        }
        if (matches(label, ['Ration Card No'])) {
            if (!data.details.rcNo) data.details.rcNo = value;
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
        if (matches(label, ['Application Status'])) {
            if (!data.details.applicationStatus) data.details.applicationStatus = value;
        }
        if (matches(label, ['Application No'])) {
            if (!data.details.applicationNo) data.details.applicationNo = value;
        }
        if (matches(label, ['SKS Form No'])) {
            if (!data.details.sksFormNo) data.details.sksFormNo = value;
        }
        if (matches(label, ['Office Name'])) {
            if (!data.details.officeName) data.details.officeName = value;
        }
        if (matches(label, ['IMPDS Status'])) {
            if (!data.details.impdsStatus) data.details.impdsStatus = value;
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

    // 3. Post-Extraction Fixes
    // Clean up District
    if (data.details.district) {
        data.details.district = data.details.district.replace(/[.:]+$/, '').trim();
    }

    // Handle Masked HOF: If HOF is 'xxxx', try to get it from member list (usually S.No 1)
    const isMasked = (val) => val && (val.toLowerCase().includes('xxxx') || val.trim() === '---' || !val.trim());
    if (isMasked(data.details.hof)) {
        console.log("HOF name is masked, attempting fallback to member list...");
        const firstMember = data.members.find(m => m.sno === 1);
        if (firstMember) {
            data.details.hof = firstMember.name;
            console.log("Fallback HOF identified:", data.details.hof);
        }
    }

    console.log("Extraction Results:", data);
    return data;
}

// Helper to get extension assets
const getAsset = (path) => chrome.runtime.getURL(path);

const cardStyles = `
    body.fsc-shift-body { 
        margin-right: 360px !important; 
        width: calc(100% - 360px) !important; 
        transition: margin-right 0.3s ease, width 0.3s ease;
    }
    #fsc-preview-sidebar {
        position: fixed; top: 0; right: 0; width: 360px; height: 100vh;
        background: #f7fbfb; box-shadow: -5px 0 15px rgba(0,0,0,0.1);
        z-index: 10000; padding: 15px; overflow-y: auto; display: none;
        font-family: 'Inter', sans-serif;
    }
    #fsc-preview-sidebar.active { display: block; }
    .fsc-close-btn { position: absolute; top: 10px; left: 10px; cursor: pointer; font-size: 24px; color: #888; border:none; background:none; font-weight:bold; }
    .fsc-btn-primary { background: #0b6e4f; color: white; border: none; padding: 12px; border-radius: 6px; flex: 1; cursor: pointer; font-weight: bold; font-size:0.8rem; }
    .fsc-btn-secondary { background: #555; color: white; border: none; padding: 12px; border-radius: 6px; flex: 1; cursor: pointer; font-weight: bold; font-size:0.8rem; }
    
    .pvc-card { 
        width: 330px; 
        height: 208px; 
        background: #fff; 
        border-radius: 12px; 
        padding: 6px 14px; 
        color: #111; 
        box-shadow: 0 4px 15px rgba(0,0,0,.1);
        display: flex;
        flex-direction: column;
        position: relative;
        margin: 15px auto;
        border: 1px solid #ddd;
        box-sizing: border-box;
        overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .pvc-card::before { 
        content: ""; position: absolute; top: 52%; left: 50%; transform: translate(-50%, -50%); 
        width: 120px; height: 120px; background-image: url('${getAsset("assets/seal_ts.png")}'); 
        background-size: contain; background-repeat: no-repeat; background-position: center; 
        opacity: 0.04; pointer-events: none; z-index: 0; 
    }
    .card-header { height: 28px; display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; margin-bottom: 2px; }
    .header-logo-l { width: 24px; height: 24px; object-fit: contain; }
    .header-logo-r { width: 24px; height: 24px; object-fit: contain; }
    .header-center { text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .header-title-main { font-size: 10.5px; font-weight: 800; color: #0b6e4f; line-height: 1; letter-spacing: -0.1px; }
    .header-title-sub { font-size: 7.5px; font-weight: 600; color: #666; margin-top: 1.5px; line-height: 1; }
    
    .watermark-seal { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 160px; height: 160px; opacity: 0.1; pointer-events: none; z-index: 0; background-image: url('${getAsset("assets/seal_new.jpg")}'); background-size: contain; background-repeat: no-repeat; background-position: center; object-fit: contain; }
    
    .card-body { display: flex; gap: 12px; height: 115px; min-height: 115px; position: relative; z-index: 1; overflow: visible; }
    
    .info-col { width: 125px; flex-shrink: 0; border-right: 0.5px solid #eee; padding-right: 4px; }
    .info-item-v { display: flex; flex-direction: column; margin-bottom: 1px; }
    .info-item-h { display: flex; align-items: baseline; gap: 4px; margin-bottom: 1px; }
    .info-label { font-size: 6.5px; color: #aaa; font-weight: 500; text-transform: uppercase; line-height: 1; margin-bottom: 0; margin-left: 1px; }
    .info-value { font-family: 'Arial', sans-serif; font-size: 10.5px; color: #111; font-weight: 700; line-height: 1.0; margin-bottom: 1px; overflow: visible; white-space: nowrap; text-overflow: ellipsis; padding-bottom: 0; }
    .info-item-v .info-value { border-bottom: 0.5px solid #f2f2f2; }

    .list-col { flex: 1; min-height: 0; padding-left: 2px; position: relative; z-index: 1; }

    .members-title { font-size: 8.5px; font-weight: 800; color: #0b6e4f; border-bottom: 1.5px solid #0b6e4f; margin-bottom: 3px; padding-bottom: 2px; }
    .members-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
    .member-item { display: flex; align-items: baseline; gap: 2px; font-size: 8.5px; height: 12.5px; padding-top: 1px; border-bottom: 0.5px solid #f8f8f8; }
    .member-sno { width: 9px; color: #aaa; flex-shrink: 0; font-weight: 500; line-height: 1; font-size: 7.2px; }
    .member-name { font-family: 'Arial', sans-serif; font-weight: 800; color: #111; font-size: 9.5px; line-height: 1.1; overflow: visible; white-space: nowrap; text-overflow: ellipsis; }

    .card-footer { height: 55px; min-height: 55px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 2; padding: 4px 0 6px 0; border-top: 1.5px solid #0b6e4f; margin-top: auto; }
    .footer-left { display: flex; align-items: flex-end; gap: 10px; margin-left: 4px; }
    .qr-container { position: absolute; bottom: 8px; left: 10px; width: 58px; height: 58px; border: 0.5px solid #ccc; background: #fff; padding: 3px; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 4px; z-index: 10; }
    .footer-labels { display: flex; flex-direction: column; gap: 2px; padding-bottom: 6px; margin-left: 72px; }
    .qr-container img { width: 100%; height: 100%; image-rendering: pixelated; }
    .f-label-top { font-size: 6px; color: #0b6e4f; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #0b6e4f; padding-bottom: 1px; }
    .f-label-bottom { font-size: 7.5px; color: #0b6e4f; font-weight: 800; text-transform: uppercase; }

    .footer-right { text-align: right; padding-bottom: 6px; margin-right: 5px; }
    .rc-number-text { font-size: 23px; font-weight: 900; color: #0b6e4f; letter-spacing: 0.4px; line-height: 1; }
`;

let lastDetectedFsc = null;

function setupOnPagePreview() {
    if (document.getElementById('fsc-preview-sidebar')) return;

    const style = document.createElement('style');
    style.textContent = cardStyles;
    document.head.appendChild(style);

    const sidebar = document.createElement('div');
    sidebar.id = 'fsc-preview-sidebar';
    sidebar.innerHTML = `
        <button class="fsc-close-btn" title="Close">×</button>
        <h2 style="text-align:center; color:#00897b; font-size:1.1rem; margin-top:20px; font-family:sans-serif;">PVC Card Preview</h2>
        <div id="fsc-card-render-area"></div>
        <div class="fsc-download-group">
            <button class="fsc-btn-primary" id="fsc-dl-front">Download Front</button>
            <button class="fsc-btn-secondary" id="fsc-dl-both">Download Both</button>
        </div>
        <p style="font-size: 0.75rem; color: #888; text-align: center; margin-top: 15px; font-family:sans-serif;">Data auto-detected from portal</p>
    `;
    document.body.appendChild(sidebar);

    sidebar.querySelector('.fsc-close-btn').onclick = () => {
        sidebar.classList.remove('active');
        document.body.classList.remove('fsc-shift-body');
    };
}

async function downloadCard(id, fscNo, hof) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
        const canvas = await html2canvas(el, { scale: 5, useCORS: true, backgroundColor: '#ffffff', width: 330, height: 210 });
        const link = document.createElement('a');
        const side = id === 'card-front' ? 'Front' : 'Back';
        const safeHof = hof.replace(/[^a-z0-9]/gi, '_'); // Make HOF filename safe
        link.download = `FSC_${fscNo}_${safeHof}_${side}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } catch (e) { console.error("Canvas error:", e); }
}

function renderCardsOnPage(data) {
    const renderArea = document.getElementById('fsc-card-render-area');
    const details = data.details;
    const members = data.members;
    let displayMembers = members;

    // If only HOF exists, show them in the list anyway so it's not empty
    if (displayMembers.length === 0 && members.length > 0) {
        displayMembers = members;
    }

    // Strict 6-per-side split for physical PVC utility
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
    const encoded = btoa(encodeURIComponent(JSON.stringify(qrData)));
    const qrUrl = `https://food-security-card-telangana.github.io/fscpvc/viewer.html?d=${encoded}`;
    // Using ECC Level L (Low) to keep dot size manageable even with full data
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&margin=0&ecc=L`;

    const generateHtml = (id, list) => {
        const memberRows = list.slice(0, 8).map(m => `
            <li class="member-item">
                <span class="member-sno">${m.sno}</span>
                <span class="member-name">${m.name}</span>
            </li>
        `).join('');

        return `
                <div id="${id}" class="pvc-card">
                    <div class="card-header">
                        <img src="${getAsset("assets/emblem_ts.svg")}" class="header-logo-l">
                        <div class="header-center">
                            <div class="header-title-main">FSC RATION CARD - TELANGANA</div>
                            <div class="header-title-sub">(${details.district || 'District'})</div>
                        </div>
                        <img src="${getAsset("assets/fsc_logo.png")}" class="header-logo-r">
                    </div>
                    
                    <div class="green-divider"></div>

                    <div class="card-body">
                        <div class="info-col">
                            <div class="info-item-v">
                                <span class="info-label">REF NO</span>
                                <span class="info-value">${details.fscRefNo || '---'}</span>
                            </div>
                            <div class="info-item-v">
                                <span class="info-label">OLD RC NO</span>
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
                            <img src="${qrImgSrc}" alt="QR">
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

    renderArea.innerHTML = generateHtml('card-front', 'FSC Ration Card', frontMembers) + generateHtml('card-back', 'FSC Ration Card', backMembers);

    // Assign click handlers here where 'details' is available
    document.getElementById('fsc-dl-front').onclick = () => downloadCard('card-front', details.fscNo, details.hof);
    document.getElementById('fsc-dl-both').onclick = async () => {
        await downloadCard('card-front', details.fscNo, details.hof);
        setTimeout(() => downloadCard('card-back', details.fscNo, details.hof), 800);
    };

    document.getElementById('fsc-preview-sidebar').classList.add('active');
    document.body.classList.add('fsc-shift-body');
}

function autoDetectAndPreview() {
    const data = extractFSCData();
    const currentId = data.details.rcNo || data.details.fscNo;
    if (currentId && currentId !== lastDetectedFsc) {
        lastDetectedFsc = currentId;
        setupOnPagePreview();
        renderCardsOnPage(data);
    }
}

// Check every 2 seconds for new search results
setInterval(autoDetectAndPreview, 2000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract") {
        sendResponse(extractFSCData());
    }
});
