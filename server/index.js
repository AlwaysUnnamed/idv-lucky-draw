require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');   // ← 新增

const app = express();

// 中间件（与 task-matrix 保持一致）
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// 静态托管前端（client 文件夹）
app.use(express.static(path.join(__dirname, '..', 'client')));

// ← 新增：连接 MongoDB（与 task-matrix 同款写法）
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ MongoDB error:', err));

// 路由
const drawRoutes = require('./routes/draw');
app.use('/api', drawRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 IDV Lucky Draw server running on http://localhost:${PORT}`);
});
