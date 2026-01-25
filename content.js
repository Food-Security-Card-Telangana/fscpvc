// content.js - Extraction & Integrated On-Page Preview for EPDS Telangana
console.log("Telangana FSC Content Script: Integrated Preview Active");

// Helper to get extension assets
const getAsset = (path) => chrome.runtime.getURL(path);

function extractFSCData() {
    const data = { details: {}, members: [] };
    const extractIdInBrackets = (str) => {
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1] : str;
    };
    const matches = (text, keywords) => {
        const lower = text.toLowerCase();
        return keywords.some(k => lower.includes(k.toLowerCase()));
    };

    const allCells = Array.from(document.querySelectorAll('td'));
    allCells.forEach((cell, index) => {
        const cellText = cell.innerText.trim();
        if (!cellText) return;
        let label = cellText;
        let value = '';
        if (cellText.includes(':')) {
            const parts = cellText.split(':');
            label = parts[0].trim();
            value = parts.slice(1).join(':').trim();
        }
        if (!value) value = allCells[index + 1]?.innerText.trim() || '';
        if (!label || !value) return;

        if (matches(label, ['Ration Card No', 'FSC No'])) data.details.fscNo = value;
        if (matches(label, ['Reference No'])) data.details.fscRefNo = value;
        if (matches(label, ['District'])) data.details.district = value;
        if (matches(label, ['Old RCNo'])) data.details.oldRCNo = value;
        if (matches(label, ['Gas Connection'])) data.details.gasConnection = value;
        if (matches(label, ['Consumer No'])) data.details.consumerNo = value;
        if (matches(label, ['FPShop No'])) data.details.fpShopNo = value;
        if (matches(label, ['Head of the Family'])) data.details.hof = value;

        if (matches(label, ['KeyRegister'])) {
            data.details.keyRegisterSlNo = value;
            if (!data.details.fpShopNo) data.details.fpShopNo = extractIdInBrackets(value);
        }
    });

    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (table.innerText.includes('MEMBER DETAILS')) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length >= 2) {
                    const sno = cols[0].innerText.trim();
                    const name = cols[1].innerText.trim();
                    if (sno && !isNaN(parseInt(sno))) {
                        data.members.push({ sno: parseInt(sno), name });
                    }
                }
            });
        }
    });
    if (data.details.district) data.details.district = data.details.district.replace(/[.:]+$/, '').trim();
    return data;
}

const cardStyles = `
    #fsc-preview-sidebar {
        position: fixed; top: 0; right: 0; width: 360px; height: 100vh;
        background: #f7fbfb; box-shadow: -5px 0 15px rgba(0,0,0,0.1);
        z-index: 10000; padding: 15px; overflow-y: auto; display: none;
        font-family: 'Inter', sans-serif;
    }
    #fsc-preview-sidebar.active { display: block; }
    .fsc-close-btn { position: absolute; top: 10px; left: 10px; cursor: pointer; font-size: 20px; color: #888; }
    .fsc-download-group { margin-top: 20px; display: flex; gap: 8px; }
    .fsc-btn-primary { background: #00897b; color: white; border: none; padding: 10px; border-radius: 4px; flex: 1; cursor: pointer; font-weight: bold; }
    .fsc-btn-secondary { background: #4db6ac; color: white; border: none; padding: 10px; border-radius: 4px; flex: 1; cursor: pointer; font-weight: bold; }
    
    /* PVC Card CSS injected here as well */
    .pvc-card { width: 330px; height: 210px; background: white; border-radius: 10px; position: relative; overflow: hidden; margin: 10px auto; border: 1px solid #e0e0e0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .pvc-card::before { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 140px; background-image: url('${getAsset("assets/emblem_ts.svg")}'); background-size: contain; background-repeat: no-repeat; background-position: center; opacity: 0.06; pointer-events: none; z-index: 0; }
    .card-header { height: 38px; padding: 2px 8px; display: flex; justify-content: space-between; align-items: center; color: #00897b; border-bottom: 2px solid #00897b; text-transform: uppercase; box-sizing: border-box;}
    .header-logo-left { height: 28px; width: auto; }
    .header-logo-right { height: 22px; width: auto; border-radius: 3px; }
    .header-title { flex: 1; text-align: center; font-weight: 700; font-size: 0.7rem; line-height: 1.1; }
    .card-content-split { display: flex; padding: 10px 12px; gap: 10px; height: 134px; box-sizing: border-box; }
    .info-side { flex: 0 0 115px; border-right: 1px solid #f0f0f0; padding-right: 8px; }
    .info-side div { margin-bottom: 3.5px; }
    .info-side label { display: block; color: #999; font-size: 0.62rem; font-weight: 500; text-transform: uppercase; margin-bottom: 0px;}
    .info-side strong { font-weight: 600; color: #111; font-size: 0.62rem; }
    .row-layout { display: flex; justify-content: space-between; align-items: center; }
    .list-side { flex: 1; }
    .family-table { width: 100%; border-collapse: collapse; font-size: 0.6rem; }
    .family-table th { text-align: left; border-bottom: 1.5px solid #4db6ac; color: #00897b; font-size: 0.55rem; padding-bottom: 2px; }
    .family-table td { padding: 1.5px 0; border-bottom: 1px solid #f7f7f7; }
    .card-footer { position: absolute; bottom: 0; width: 100%; height: 38px; background: #e8f5e9; border-top: 1.5px solid #4caf50; display: flex; align-items: center; padding: 0 12px; box-sizing: border-box; }
    .hof-label { font-weight: 700; font-size: 0.75rem; flex: 1; color: #2e7d32; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .qr-box { background: white; width: 32px; height: 32px; border-radius: 3px; display: flex; align-items: center; justify-content: center; }
`;

function setupOnPagePreview() {
    if (document.getElementById('fsc-preview-sidebar')) return;

    const style = document.createElement('style');
    style.textContent = cardStyles;
    document.head.appendChild(style);

    const sidebar = document.createElement('div');
    sidebar.id = 'fsc-preview-sidebar';
    sidebar.innerHTML = `
        <div class="fsc-close-btn">×</div>
        <h2 style="text-align:center; color:#00897b; font-size:1.1rem; margin-top:10px;">PVC Card Preview</h2>
        <div id="fsc-card-render-area"></div>
        <div class="fsc-download-group">
            <button class="fsc-btn-primary" id="fsc-dl-front">Download Front</button>
            <button class="fsc-btn-secondary" id="fsc-dl-both">Download Both</button>
        </div>
        <p style="font-size: 0.7rem; color: #888; text-align: center; margin-top: 15px;">Generated by Telangana FSC Assistant</p>
    `;
    document.body.appendChild(sidebar);

    sidebar.querySelector('.fsc-close-btn').onclick = () => sidebar.classList.remove('active');

    document.getElementById('fsc-dl-front').onclick = () => downloadCard('card-front');
    document.getElementById('fsc-dl-both').onclick = async () => {
        await downloadCard('card-front');
        setTimeout(() => downloadCard('card-back'), 1000);
    };
}

async function downloadCard(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 4, useCORS: true, backgroundColor: '#ffffff', width: 330, height: 210 });
    const link = document.createElement('a');
    link.download = `FSC_${id === 'card-front' ? 'Front' : 'Back'}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

function renderCardsOnPage(data) {
    const renderArea = document.getElementById('fsc-card-render-area');
    const details = data.details;
    const members = data.members;
    const filteredMembers = members.filter(m => m.name.trim().toUpperCase() !== details.hof.trim().toUpperCase());
    const frontMembers = filteredMembers.slice(0, 6);
    const backMembers = filteredMembers.length > 6 ? filteredMembers.slice(6, 12) : [];

    const qrRawData = { f: details.fscNo, h: details.hof, d: details.district, m: members.map(m => m.name.substring(0, 15)) };
    const encoded = btoa(encodeURIComponent(JSON.stringify(qrRawData)));
    const qrUrl = `https://food-security-card-telangana.github.io/fscpvc/viewer.html?d=${encoded}`;
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&margin=0`;

    const generateHtml = (id, title, list) => {
        const rows = list.map(m => `<tr><td style="width:18px; color:#aaa;">${m.sno}</td><td style="font-weight:700;">${m.name}</td></tr>`).join('');
        return `
            <div id="${id}" class="pvc-card" style="margin-bottom:20px;">
                <div class="card-header">
                    <img src="${getAsset("assets/emblem_ts.svg")}" class="header-logo-left">
                    <div class="header-title">${title}<br>(${details.district || '---'})</div>
                    <img src="${getAsset("assets/fsc_logo.png")}" class="header-logo-right">
                </div>
                <div class="card-content-split">
                    <div class="info-side">
                        <div><label>FSC NUMBER</label><strong>${details.fscNo || '---'}</strong></div>
                        <div class="row-layout"><label>GAS</label><strong>${details.gasConnection || '---'}</strong></div>
                        <div class="row-layout"><label>CUS NO</label><strong>${details.consumerNo || '---'}</strong></div>
                        <div class="row-layout"><label>SHOP</label><strong>${details.fpShopNo || '---'}</strong></div>
                    </div>
                    <div class="list-side">
                        <table class="family-table">
                            <thead><tr><th>#</th><th>FAMILY MEMBER NAME</th></tr></thead>
                            <tbody>${rows || '<tr><td colspan="2" style="text-align:center; padding-top:20px; color:#ccc;">NO MORE</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="hof-label">HOF: ${details.hof}</div>
                    <div class="qr-box"><img src="${qrImgSrc}" width="30" height="30"></div>
                </div>
            </div>
        `;
    };

    renderArea.innerHTML = generateHtml('card-front', 'FSC FAMILY CARD', frontMembers) + generateHtml('card-back', 'FSC FAMILY CARD', backMembers);
    document.getElementById('fsc-preview-sidebar').classList.add('active');
}

function injectActionButton() {
    if (document.getElementById('fsc-direct-download-btn')) return;
    const targetTable = Array.from(document.querySelectorAll('table')).find(t => t.innerText.includes('RATION CARD DETAILS'));
    if (!targetTable) return;

    setupOnPagePreview();

    const btn = document.createElement('button');
    btn.id = 'fsc-direct-download-btn';
    btn.innerText = '⚡ PREVIEW PVC CARDS';
    btn.style.cssText = `background: #00897b; color: white; border: none; padding: 12px 24px; font-weight: bold; border-radius: 6px; cursor: pointer; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2);`;

    btn.onclick = () => {
        const data = extractFSCData();
        if (data.details.fscNo) renderCardsOnPage(data);
        else alert("Search for a card first!");
    };

    targetTable.parentNode.insertBefore(btn, targetTable);
}

setInterval(injectActionButton, 2000);
