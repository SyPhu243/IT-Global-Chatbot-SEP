const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/chat', (req, res) => {
    const userMessage = req.body.message || "";
    console.log("Đã nhận tin nhắn:", userMessage);
    
    res.json({
        status: "success",
        data: {
            reply: `PoC Node.js đã nhận được: '${userMessage}'`
        }
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server Backend PoC đang chạy tại http://localhost:${PORT}`);
});