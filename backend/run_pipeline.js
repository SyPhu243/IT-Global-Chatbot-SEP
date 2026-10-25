import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

import { processAndSaveDocument } from './utils/textProcessor.js';

// Khởi tạo kết nối DB trực tiếp, bỏ qua file db.js để ép nó dùng localhost
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'chatbot_db'
});

async function runPipeline() {
    console.log("🚀 Bắt đầu quá trình Pipeline: Làm sạch, Masking và Nạp dữ liệu vào Vector DB...");
    
    try {
        // Đường dẫn tới file text chứa thông tin công ty của bạn
        const filePath = './it_global_data.txt'; 
        
        // Gọi hàm xử lý từ textProcessor.js
        await processAndSaveDocument(filePath, pool);
        
        console.log("✅ Quá trình nạp dữ liệu hoàn tất! AI đã được cập nhật kiến thức mới.");
        
        // Tắt kết nối DB nhẹ nhàng thay vì rút điện cái rụp
        await pool.end(); 
    } catch (error) {
        console.error("❌ Có lỗi xảy ra trong quá trình chạy Pipeline:", error);
        await pool.end(); // Tắt nhẹ nhàng nếu có lỗi
    }
}

// Thực thi script
runPipeline();