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

    // Clean up District
    if (data.details.district) {
        data.details.district = data.details.district.replace(/[.:]+$/, '').trim();
    }

    console.log("Extraction Results:", data);
    return data;
}

// Helper to get extension assets
const getAsset = (path) => chrome.runtime.getURL(path);

const cardStyles = `
    #fsc-preview-sidebar {
        position: fixed; top: 0; right: 0; width: 360px; height: 100vh;
        background: #f7fbfb; box-shadow: -5px 0 15px rgba(0,0,0,0.1);
        z-index: 10000; padding: 15px; overflow-y: auto; display: none;
        font-family: 'Inter', sans-serif;
    }
    #fsc-preview-sidebar.active { display: block; }
    .fsc-close-btn { position: absolute; top: 10px; left: 10px; cursor: pointer; font-size: 24px; color: #888; border:none; background:none; font-weight:bold; }
    .fsc-download-group { margin-top: 20px; display: flex; gap: 8px; }
    .fsc-btn-primary { background: #00897b; color: white; border: none; padding: 12px; border-radius: 6px; flex: 1; cursor: pointer; font-weight: bold; font-size:0.8rem; }
    .fsc-btn-secondary { background: #4db6ac; color: white; border: none; padding: 12px; border-radius: 6px; flex: 1; cursor: pointer; font-weight: bold; font-size:0.8rem; }
    
    .pvc-card { width: 330px; height: 210px; background: white; border-radius: 10px; position: relative; overflow: hidden; margin: 15px auto; border: 1px solid #e0e0e0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .pvc-card::before { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 140px; background-image: url('${getAsset("assets/emblem_ts.svg")}'); background-size: contain; background-repeat: no-repeat; background-position: center; opacity: 0.06; pointer-events: none; z-index: 0; }
    .card-header { height: 38px; padding: 2px 8px; display: flex; justify-content: space-between; align-items: center; color: #00897b; border-bottom: 2px solid #00897b; text-transform: uppercase; box-sizing: border-box;}
    .header-logo-left { height: 28px; width: auto; }
    .header-logo-right { height: 22px; width: auto; border-radius: 3px; }
    .header-title { flex: 1; text-align: center; font-weight: 700; font-size: 0.72rem; line-height: 1.1; }
    .card-content-split { display: flex; padding: 10px 12px; gap: 10px; height: 134px; box-sizing: border-box; }
    .info-side { flex: 0 0 115px; border-right: 1px solid #f0f0f0; padding-right: 8px; }
    .info-side div { margin-bottom: 3.5px; }
    .info-side label { display: block; color: #999; font-size: 0.62rem; font-weight: 500; text-transform: uppercase; }
    .info-side strong { font-weight: 600; color: #111; font-size: 0.62rem; }
    .row-layout { display: flex; justify-content: space-between; align-items: center; }
    .list-side { flex: 1; }
    .family-table { width: 100%; border-collapse: collapse; font-size: 0.62rem; }
    .family-table th { text-align: left; border-bottom: 1.5px solid #4db6ac; color: #00897b; font-size: 0.58rem; padding-bottom: 2px; }
    .family-table td { padding: 1.5px 0; border-bottom: 1px solid #f7f7f7; }
    .card-footer { position: absolute; bottom: 0; width: 100%; height: 38px; background: #e8f5e9; border-top: 1.5px solid #4caf50; display: flex; align-items: center; padding: 0 12px; box-sizing: border-box; }
    .hof-label { font-weight: 700; font-size: 0.78rem; flex: 1; color: #2e7d32; }
    .qr-box { background: white; width: 32px; height: 32px; border-radius: 3px; display: flex; align-items: center; justify-content: center; }
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

    sidebar.querySelector('.fsc-close-btn').onclick = () => sidebar.classList.remove('active');

    document.getElementById('fsc-dl-front').onclick = () => downloadCard('card-front', details.fscNo, details.hof);
    document.getElementById('fsc-dl-both').onclick = async () => {
        await downloadCard('card-front', details.fscNo, details.hof);
        setTimeout(() => downloadCard('card-back', details.fscNo, details.hof), 800);
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
    const filteredMembers = members.filter(m => m.name.trim().toUpperCase() !== details.hof.trim().toUpperCase());
    const frontMembers = filteredMembers.slice(0, 6);
    const backMembers = filteredMembers.length > 6 ? filteredMembers.slice(6, 12) : [];

    const qrRawData = {
        f: details.fscNo,
        r: details.fscRefNo,
        ct: details.cardType,
        as: details.applicationStatus,
        an: details.applicationNo,
        sn: details.sksFormNo,
        on: details.officeName,
        fs: details.fpShopNo,
        h: details.hof,
        d: details.district,
        is: details.impdsStatus,
        gc: details.gasConnection,
        cn: details.consumerNo,
        ks: details.keyRegisterSlNo,
        os: details.oldRCNo,
        vt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        m: members.map(m => m.name)
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(qrRawData)));
    const qrUrl = `https://food-security-card-telangana.github.io/fscpvc/viewer.html?d=${encoded}`;
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}&margin=0&ecc=L`;

    const generateHtml = (id, title, list) => {
        const rows = list.map(m => `<tr><td style="width:22px; color:#aaa;">${m.sno}</td><td style="font-weight:700;">${m.name}</td></tr>`).join('');
        return `
            <div id="${id}" class="pvc-card">
                <div class="card-header">
                    <img src="${getAsset("assets/emblem_ts.svg")}" class="header-logo-left">
                    <div class="header-title">${title} - TELANGANA<br>(${details.district || '---'})</div>
                    <img src="${getAsset("assets/fsc_logo.png")}" class="header-logo-right">
                </div>
                <div class="card-content-split">
                    <div class="info-side">
                        <div><label>FSC NUMBER</label><strong>${details.fscNo || '---'}</strong></div>
                        <div><label>REF NO</label><strong>${details.fscRefNo || '---'}</strong></div>
                        <div><label>OLD RCNO</label><strong>${details.oldRCNo || '---'}</strong></div>
                        <div class="row-layout"><label>GAS</label><strong>${details.gasConnection || '---'}</strong></div>
                        <div class="row-layout"><label>CONSUMER NO</label><strong>${details.consumerNo || '---'}</strong></div>
                        <div class="row-layout"><label>SHOP NO</label><strong>${details.fpShopNo || '---'}</strong></div>
                    </div>
                    <div class="list-side">
                        <table class="family-table">
                            <thead><tr><th>#</th><th>FAMILY MEMBER NAME</th></tr></thead>
                            <tbody>${rows || '<tr><td colspan="2" style="text-align:center; padding-top:20px; color:#ccc;">NO MORE MEMBERS</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="hof-label">HOF: ${details.hof}</div>
                    <div class="qr-box">
                        <img src="${qrImgSrc}" width="34" height="34">
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
}

function autoDetectAndPreview() {
    const data = extractFSCData();
    if (data.details.fscNo && data.details.fscNo !== lastDetectedFsc) {
        lastDetectedFsc = data.details.fscNo;
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
