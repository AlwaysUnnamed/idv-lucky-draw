const express = require('express');
const router = express.Router();
const controller = require('../controllers/drawController');

router.post('/draw', controller.draw);               // 抽奖（服务端定结果）
router.get('/characters', controller.getCharacters); // 角色与权重数据
router.get('/history', controller.getHistory);       // 查询历史
router.delete('/history', controller.clearHistory);  // 清空历史

module.exports = router;
