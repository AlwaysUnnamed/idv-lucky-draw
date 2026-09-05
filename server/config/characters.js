// ============================================================
// 角色与概率配置（数据来自 survivorFinal.py / hunterFinal.py，原样保留）
// ============================================================

// ── 求生者 ──
const survivors = [
  "小女孩", "调香师", "医生", "拉拉队员", "律师", "记者", "囚徒", "咒术师",
  "法罗女士", "园丁", "木偶师", "佣兵", "斗牛士", "魔术师", "作曲家",
  "勘探员", "守墓人", "调酒师", "心理学家", "机械师", "祭司", "击球手",
  "骑士", "先知", "小说家", "前锋", "杂技演员", "幸运儿", "古董商", "空军",
  "玩具商", "画家", "入殓师", "舞女", "昆虫学者", "幻灯师", "盲女", "大副",
  "气象学家", "邮差", "牛仔", "病患", "野人", "弓箭手", "教授", "冒险家",
  "哭泣小丑", "火灾调查员", "逃脱大师", "慈善家", "飞行家", "默剧艺人"
];

// 求生者基础权重：前15个=1，中间22个=3，后15个=2（共52个，与原脚本一致）
const survivorWeights = [
  ...Array(15).fill(1),
  ...Array(22).fill(3),
  ...Array(15).fill(2)
];

// ── 监管者 ──
const hunters = [
  "渔女", "红蝶", "红夫人", "杰克", "宿伞之魂", "摄影师", "守夜人", "小丑",
  "厂长", "愚人金", "孽蜥", "噩梦", "使徒", "爱哭鬼", "隐士",
  "台球手", "小提琴家", "鹿头", "歌剧演员", "破轮", "蜡像师", "博士",
  "女王蜂", "黄衣之主", "雕刻家", "梦之女巫", "时空之影", "杂货商", "喧嚣", "记录员",
  "蜘蛛", "跛脚羊", "26号守卫", "疯眼", "牙医", "心兽"
];

// 监管者基础权重：前10个=1，中间14个=3，后12个=2（共36个，与原脚本一致）
const hunterWeights = [
  ...Array(10).fill(1),
  ...Array(14).fill(3),
  ...Array(12).fill(2)
];

// ── 天赋选项 ──
const survivorTalents = ["飞轮", "双弹", "搏命", "大心脏", "/"];
const hunterTalents = ["张狂", "封窗", "底牌", "挽留", "/"];

// 启动时校验，防止以后改数据改错
if (survivors.length !== survivorWeights.length) {
  throw new Error(`求生者数据不一致！names(${survivors.length}) vs weights(${survivorWeights.length})`);
}
if (hunters.length !== hunterWeights.length) {
  throw new Error(`监管者数据不一致！names(${hunters.length}) vs weights(${hunterWeights.length})`);
}

module.exports = {
  survivors, survivorWeights,
  hunters, hunterWeights,
  survivorTalents, hunterTalents
};
