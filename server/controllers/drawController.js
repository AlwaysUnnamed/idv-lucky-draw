// ============================================================
// 抽奖控制器：核心随机逻辑（1:1 还原 Python 脚本逻辑）
// ============================================================
const DrawRecord = require('../models/DrawRecord');
const {
  survivors, survivorWeights,
  hunters, hunterWeights,
  survivorTalents, hunterTalents
} = require('../config/characters');

// 按权重随机选一个下标（等价于 Python 的 random.choices）
function weightedIndex(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

// 抽取天赋组合（1:1 还原原脚本）：
// 第一个天赋均匀随机；若抽到 "/"，第二个按 [19.5,19.5,19.5,19.5,22] 加权；
// 否则从剩余选项中均匀随机
function drawTalents(options) {
  const first = options[Math.floor(Math.random() * options.length)];
  let second;
  if (first === "/") {
    const w = [19.5, 19.5, 19.5, 19.5, 22];
    second = options[weightedIndex(w)];
  } else {
    const remaining = options.filter(o => o !== first);
    second = remaining[Math.floor(Math.random() * remaining.length)];
  }
  return `${first} + ${second}`;
}

// 构建临时权重：低概率角色权重改为 0.5（与原脚本一致）
function buildTempWeights(baseWeights, names, lowProbChars) {
  const temp = [...baseWeights];
  for (const char of lowProbChars) {
    const idx = names.indexOf(char);
    if (idx !== -1) temp[idx] = 0.5;
  }
  return temp;
}

// ── POST /api/draw ──
// body: { type: 'survivor' | 'hunter', player: '玩家名', lowProb: ['角色A', ...] }
exports.draw = async(req, res) => {
  const { type, player, lowProb = [] } = req.body;

  let names, baseWeights, talents;
  if (type === 'survivor') {
    names = survivors; baseWeights = survivorWeights; talents = survivorTalents;
  } else if (type === 'hunter') {
    names = hunters; baseWeights = hunterWeights; talents = hunterTalents;
  } else {
    return res.status(400).json({ error: 'type 必须是 survivor 或 hunter' });
  }

  const playerName = (player || '').trim() || (type === 'survivor' ? '求生者' : '监管者');

  // 低概率角色最多 3 个（安全截断，与原脚本一致）
  const lowProbChars = lowProb.filter(c => c && c !== '【无】').slice(0, 3);

  // 服务端预先决定结果（与 Python 版一致：先定结果再放动画）
  const tempWeights = buildTempWeights(baseWeights, names, lowProbChars);
  const index = weightedIndex(tempWeights);
  const character = names[index];
  const talentStr = drawTalents(talents);
  const isLowProb = lowProbChars.includes(character);

  // 写入数据库
  const record = {
    seq: Date.now(),
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    type,
    player: playerName,
    character,
    talents: talentStr,
    isLowProb
  };
  await DrawRecord.create(record);

  res.json({ index, character, talents: talentStr, isLowProb, record });
};

// ── GET /api/characters ── 前端渲染网格用
exports.getCharacters = (req, res) => {
  res.json({
    survivors: { names: survivors, weights: survivorWeights },
    hunters: { names: hunters, weights: hunterWeights },
    survivorTalents,
    hunterTalents
  });
};

// ── GET /api/history ──（取最近100条，新的在前）
exports.getHistory = async (req, res) => {
  const history = await DrawRecord.find().sort({ seq: -1 }).limit(100);
  res.json({ history });
};

// ── DELETE /api/history ──
exports.clearHistory = async (req, res) => {
  await DrawRecord.deleteMany({});
  res.json({ message: '历史已清空' });
};

