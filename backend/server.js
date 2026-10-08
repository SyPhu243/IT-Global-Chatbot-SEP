import 'dotenv/config';
import express from 'express';
import pool from './db.js';
import contactRoutes from './routes/contactRoutes.js';

const app = express();

app.use(express.json());

// API lưu thông tin Contact
app.use("/api/contacts", contactRoutes);

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");

        res.json({
            status: "success",
            message: "Ket noi PostgreSQL thanh cong",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Loi ket noi PostgreSQL:", error.message);

        res.status(500).json({
            status: "error",
            message: "Khong the ket noi PostgreSQL"
        });
    }
});

app.post("/api/chat", (req, res) => {
    const userMessage = req.body.message || "";

    console.log("Da nhan tin nhan:", userMessage);

    res.json({
        status: "success",
        data: {
            reply: `PoC Node.js da nhan duoc: '${userMessage}'`
        }
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server Backend PoC dang chay tai http://localhost:${PORT}`);
});