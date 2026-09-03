// ================= 全局状态 =================
const state = {
    data: null,          // /api/characters 的返回
    panels: {}           // 每个面板的运行状态
};

// ================= 初始化 =================
async function init() {
    const res = await fetch('/api/characters');
    state.data = await res.json();

    buildPanel('survivor', 4);   // 求生者：4个玩家
    buildPanel('hunter', 1);     // 监管者：1个玩家

    bindTabs();
    loadHistory();
}

// 构建一个面板：玩家输入框、低概率下拉、角色网格
function buildPanel(type, playerCount) {
    const { names } = type === 'survivor' ? state.data.survivors : state.data.hunters;

    // 玩家输入框
    const playersBox = document.getElementById(`players-${type}`);
    for (let i = 0; i < playerCount; i++) {
        const item = document.createElement('div');
        item.className = 'player-item' + (i === 0 ? ' current' : '');
        item.innerHTML = `
            <label style="font-size:12px;color:#888;">${playerCount > 1 ? '玩家' + (i + 1) : '监管者'}</label>
            <input type="text" value="${playerCount > 1 ? '玩家' + (i + 1) : '监管者'}">`;
        playersBox.appendChild(item);
    }

    // 低概率下拉（3个）
    const lowBox = document.getElementById(`lowprob-${type}`);
    for (let i = 0; i < 3; i++) {
        const sel = document.createElement('select');
        sel.innerHTML = ['【无】', ...names].map(n => `<option>${n}</option>`).join('');
        lowBox.appendChild(sel);
    }

    // 角色网格
    const grid = document.getElementById(`grid-${type}`);
    names.forEach((name, idx) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = name;
        grid.appendChild(cell);
    });

    // 面板状态
    state.panels[type] = {
        running: false,
        timer: null,
        currentIdx: -1,
        target: null,     // 服务端预先决定的结果
        playerIdx: 0,
        playerCount
    };

    // 绑定按钮
    document.getElementById(`start-${type}`).addEventListener('click', () => startDraw(type));
    document.getElementById(`end-${type}`).addEventListener('click', () => endDraw(type));
}

// ================= 标签页切换 =================
function bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`panel-${tab.dataset.type}`).classList.add('active');
        });
    });
}

// ================= 工具函数 =================
function getPlayerName(type) {
    const s = state.panels[type];
    const input = document.querySelectorAll(`#players-${type} input`)[s.playerIdx];
    return input.value.trim() || `玩家${s.playerIdx + 1}`;
}

function getLowProb(type) {
    return [...document.querySelectorAll(`#lowprob-${type} select`)]
        .map(sel => sel.value)
        .filter(v => v && v !== '【无】');
}

function updatePlayerHighlight(type) {
    const s = state.panels[type];
    document.querySelectorAll(`#players-${type} .player-item`)
        .forEach((item, i) => item.classList.toggle('current', i === s.playerIdx));
}

// ================= 开始抽奖 =================
async function startDraw(type) {
    const s = state.panels[type];
    if (s.running) return;

    // 1. 请求服务端：结果已在此刻决定（和 Python 版一致）
    const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type,
            player: getPlayerName(type),
            lowProb: getLowProb(type)
        })
    });
    if (!res.ok) { alert('抽奖接口出错'); return; }
    s.target = await res.json();

    // 2. 开始滚动动画（80ms 一格，与 Python 版一致）
    s.running = true;
    document.getElementById(`start-${type}`).disabled = true;
    document.getElementById(`end-${type}`).disabled = false;
    const resultBox = document.getElementById(`result-${type}`);
    resultBox.textContent = '🎲 滚动中...';
    resultBox.className = 'result';

    const cells = document.querySelectorAll(`#grid-${type} .cell`);
    s.timer = setInterval(() => {
        cells.forEach(c => c.classList.remove('rolling'));
        s.currentIdx = (s.currentIdx + 1) % cells.length;
        cells[s.currentIdx].classList.add('rolling');
    }, 80);
}

// ================= 结束抽奖 =================
function endDraw(type) {
    const s = state.panels[type];
    if (!s.running || !s.target) return;

    clearInterval(s.timer);
    s.running = false;
    document.getElementById(`start-${type}`).disabled = false;
    document.getElementById(`end-${type}`).disabled = true;

    // 跳到中奖位置
    const cells = document.querySelectorAll(`#grid-${type} .cell`);
    cells.forEach(c => c.classList.remove('rolling', 'winner'));
    s.currentIdx = s.target.index;
    cells[s.currentIdx].classList.add('winner');

    // 展示结果
    const mark = s.target.isLowProb ? '⬇️' : '';
    const resultBox = document.getElementById(`result-${type}`);
    resultBox.textContent = `🎉 ${getPlayerName(type)}：${s.target.character}${mark} ｜ ${s.target.talents}`;
    resultBox.className = 'result done';

    // 轮换玩家（求生者模式）
    if (s.playerCount > 1) {
        s.playerIdx = (s.playerIdx + 1) % s.playerCount;
        updatePlayerHighlight(type);
    }

    loadHistory();
}

// ================= 一键开局（4求生 + 1监管） =================
document.getElementById('drawAllBtn').addEventListener('click', async () => {
    const btn = document.getElementById('drawAllBtn');
    btn.disabled = true;
    btn.textContent = '抽取中...';

    const survivorNames = [...document.querySelectorAll('#players-survivor input')]
        .map(i => i.value.trim() || '玩家');
    const hunterName = document.querySelector('#players-hunter input').value.trim() || '监管者';

    const tasks = [
        ...survivorNames.map(p => ({ type: 'survivor', player: p })),
        { type: 'hunter', player: hunterName }
    ];

    const box = document.getElementById('allResult');
    box.innerHTML = '';
    box.style.display = 'flex';

    for (const t of tasks) {
        const res = await fetch('/api/draw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...t, lowProb: getLowProb(t.type) })
        });
        const r = await res.json();
        const card = document.createElement('div');
        card.className = 'all-card' + (t.type === 'hunter' ? ' hunter-card' : '');
        card.innerHTML = `
            <div class="role">${t.player}${t.type === 'hunter' ? ' 🔪监管者' : ' 🧍'}</div>
            <div class="char">${r.character}${r.isLowProb ? '⬇️' : ''}</div>
            <div class="talent">${r.talents}</div>`;
        box.appendChild(card);
    }

    btn.disabled = false;
    btn.textContent = '⚡ 一键开局（4求生 + 1监管）';
    loadHistory();
});

// ================= 历史记录 =================
async function loadHistory() {
    const res = await fetch('/api/history');
    const { history } = await res.json();
    const box = document.getElementById('history');
    box.innerHTML = history.map(h => {
        const tag = h.type === 'survivor'
            ? '<span class="tag-survivor">[求生]</span>'
            : '<span class="tag-hunter">[监管]</span>';
        const mark = h.isLowProb ? ' <span class="low-mark">⬇️</span>' : '';
        return `<div>#${h.seq} ${h.time} ${tag} ${h.player} → <b>${h.character}</b>${mark} ｜ ${h.talents}</div>`;
    }).join('');
}

document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    await fetch('/api/history', { method: 'DELETE' });
    loadHistory();
});

// 启动
init();
