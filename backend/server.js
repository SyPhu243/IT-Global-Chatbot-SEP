import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import contactRoutes from './routes/contactRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRatingRoutes from "./routes/messageRatingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminConversationRoutes from "./routes/adminConversationRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import { verifyToken } from "./middlewares/verifyToken.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// ==========================================
// 🛡️ CẤU HÌNH BẢO MẬT CORS
// ==========================================
// Danh sách các Domain được phép gọi API
const whitelist = [
    'http://localhost:3000',       // React chạy local
    'http://localhost:5173',       // Vite chạy local
    'https://staging.it-global.vn', // Môi trường Staging (Thử nghiệm)
    'https://it-global.vn'         // Môi trường Production
];

const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép request không có origin (Postman) hoặc nằm trong whitelist
        if (!origin || whitelist.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS Policy: Domain [${origin}] không được phép truy cập API này!`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // Cho phép gửi Cookie chứa JWT
};

// Kích hoạt middleware CORS với bộ luật ở trên
app.use(cors(corsOptions));
// ==========================================

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/api/auth/me", verifyToken, (req, res) => {
    return res.json({
        success: true,
        user: req.user,
    });
});

// Các API chính
app.use("/api/contacts", contactRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRatingRoutes);
app.use("/api/admin", adminConversationRoutes);
app.use("/api/faqs", faqRoutes);

// API Test kết nối DB
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");

        res.json({
            status: "success",
            message: "Ket noi PostgreSQL thanh cong",
            data: result.rows[0]
        });
    } catch (error) {
        //Ghi log chi tiết để debug Backend
        console.error("[DB-TEST] Database connection failed", {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            status: "error",
            message: "Khong the ket noi PostgreSQL"
        });
    }
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(errorHandler);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server Backend PoC dang chay tai http://localhost:${PORT}`);
});
