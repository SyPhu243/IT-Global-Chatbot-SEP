import { GoogleGenerativeAI } from "@google/generative-ai";
import pg from "pg";
import { getEmbedding } from '../utils/textProcessor.js';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'chatbot_db'
});

const MODEL_NAME = "gemini-flash-latest";
// 🚀 TỐI ƯU 1: Giảm lịch sử chat xuống 4 để request gửi qua mạng nhẹ hơn
const MAX_HISTORY = 4; 
const FALLBACK_REPLY = "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.";
let model = null;
let cachedVectorDB = null;

// 🚀 TỐI ƯU 2: BỘ NHỚ ĐỆM FAQ (FAQ CACHE)
// Lưu các câu trả lời đã tạo. Hỏi lại câu cũ -> Trả về ngay lập tức (0 giây)
const faqCache = new Map(); 

// 🛡️ TÍNH NĂNG BẢO MẬT: DATA MASKING (Theo yêu cầu đồ án)
// Che giấu số điện thoại và email của khách hàng trước khi gửi cho Google
function maskSensitiveData(text) {
    if (!text) return "";
    let masked = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_BỊ_ẨN]");
    masked = masked.replace(/(0|\+84)[3|5|7|8|9][0-9]{8}\b/g, "[SĐT_BỊ_ẨN]");
    return masked;
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchLocalVector(queryVector) {
    if (!cachedVectorDB) {
        console.log("⏳ Đang tải Database vào RAM lần đầu để tăng tốc...");
        const sqlQuery = `SELECT content, embedding FROM knowledge_chunks`;
        const result = await pool.query(sqlQuery);
        cachedVectorDB = result.rows.map(row => ({
            content: row.content,
            vector: JSON.parse(row.embedding)
        }));
        console.log(`✅ Đã lưu ${cachedVectorDB.length} khối kiến thức vào RAM!`);
    }
    const scoredChunks = cachedVectorDB.map(item => ({
        content: item.content,
        score: cosineSimilarity(queryVector, item.vector)
    }));
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, 3).map(c => c.content).join("\n\n");
}

function getModel() {
    if (model) return model;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Thieu bien moi truong GEMINI_API_KEY");
    const genAI = new GoogleGenerativeAI(apiKey);
    const SYSTEM_PROMPT = "Bạn là trợ lý ảo hỗ trợ khách hàng của IT Global. Trả lời ngắn gọn, lịch sự. HÃY DỰA VÀO NGỮ CẢNH SAU ĐÂY ĐỂ TRẢ LỜI. Tuyệt đối không tự bịa thông tin. Nếu user đưa thông tin cá nhân (đã bị ẩn), hãy ghi nhận và bảo họ đợi liên hệ.";
    model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction: SYSTEM_PROMPT });
    return model;
}

function buildHistory(rows) {
    const history = [];
    const recentRows = (Array.isArray(rows) ? rows : [])
        .filter(row => (row.sender === "user" || row.sender === "bot") && typeof row.content === "string" && row.content.trim().length > 0)
        .slice(-MAX_HISTORY);

    for (const row of recentRows) {
        const role = row.sender === "bot" ? "model" : "user";
        // Áp dụng Masking cho lịch sử chat
        const content = maskSensitiveData(row.content.trim());
        const last = history[history.length - 1];
        if (last && last.role === role) {
            last.parts[0].text += "\n" + content;
        } else {
            history.push({ role, parts: [{ text: content }] });
        }
    }
    while (history.length > 0 && history[0].role !== "user") history.shift();
    if (history.length > 0 && history[history.length - 1].role === "user") history.pop();
    return history;
}

export async function generateBotReply(userMessage, historyRows = []) {
    try {
        const normalizedMsg = userMessage.toLowerCase().trim();
        
        // 🚀 BƯỚC 1: KIỂM TRA FAQ CACHE TRƯỚC TIÊN
        if (faqCache.has(normalizedMsg)) {
            console.log("⚡ [FAQ CACHE] Phản hồi ngay lập tức, không cần gọi Google API!");
            return faqCache.get(normalizedMsg);
        }

        // 🛡️ BƯỚC 2: MASKING DỮ LIỆU CÁ NHÂN (Ẩn email, SĐT trước khi đẩy đi)
        const safeUserMessage = maskSensitiveData(userMessage);

        // 🚀 BƯỚC 3: TÌM KIẾM VECTOR RAM (RAG)
        let context = "";
        try {
            console.time("⏱️ Thời gian tạo Vector");
            const queryVector = await getEmbedding(safeUserMessage);
            console.timeEnd("⏱️ Thời gian tạo Vector");
            
            console.time("⏱️ Thời gian quét RAM");
            context = await searchLocalVector(queryVector);
            console.timeEnd("⏱️ Thời gian quét RAM");
            console.log("👉 ĐÃ TÌM THẤY DATA TRONG RAM");
        } catch (dbError) {
            console.error("❌ Lỗi khi tìm kiếm:", dbError.message);
        }

        const promptWithContext = context 
            ? `Dựa vào thông tin sau của công ty IT-Global:\n[${context}]\n\nHãy trả lời câu hỏi: ${safeUserMessage}`
            : safeUserMessage;

        // 🚀 BƯỚC 4: GỌI GOOGLE API
        const gemini = getModel();
        const chat = gemini.startChat({ history: buildHistory(historyRows) });
        
        console.time("⏱️ Thời gian Gemini rep");
        const result = await chat.sendMessage(promptWithContext);
        console.timeEnd("⏱️ Thời gian Gemini rep");

        const text = result.response?.text ? result.response.text() : "";
        const cleanText = typeof text === "string" ? text.trim() : "";
        
        // Lưu câu trả lời thành công vào CACHE để lần sau dùng lại
        if (cleanText && cleanText !== FALLBACK_REPLY) {
            faqCache.set(normalizedMsg, cleanText);
        }

        return cleanText || FALLBACK_REPLY;
    } catch (error) {
        console.error("Loi Gemini:", error?.message || String(error));
        return FALLBACK_REPLY;
    }
}