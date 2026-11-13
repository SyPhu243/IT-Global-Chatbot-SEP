import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from '../db.js'; 
import { getEmbedding } from '../utils/textProcessor.js';
import dotenv from 'dotenv';

dotenv.config();

const MODEL_NAME = "gemini-flash-latest";
const MAX_HISTORY = 4; 
const FALLBACK_REPLY = "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.";
let model = null;
let cachedVectorDB = null;

const faqCache = new Map(); 

// HÀM MỚI: Chuẩn hóa tiếng Việt tuyệt đối (Khử dấu câu thừa, đồng bộ Unicode, xóa khoảng trắng)
function normalizeText(text) {
    if (!text) return "";
    return text
        .normalize("NFC") // Chuẩn hóa Unicode tiếng Việt
        .toLowerCase()
        .replace(/[?.!,;]/g, "") // Cạo sạch các dấu câu phổ biến
        .replace(/\s+/g, " ") // Đưa nhiều khoảng trắng về 1 khoảng trắng
        .trim();
}

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
        console.log("⏳ Đang tải Database Vector vào RAM lần đầu...");
        const sqlQuery = `SELECT content, embedding FROM knowledge_chunks`;
        const result = await pool.query(sqlQuery);
        cachedVectorDB = result.rows.map(row => ({
            content: row.content,
            vector: JSON.parse(row.embedding)
        }));
        console.log(`✅ Đã lưu ${cachedVectorDB.length} khối kiến thức vào RAM!`);
    }
    
    if (cachedVectorDB.length === 0) return ""; // Tránh tính toán vô ích nếu chưa có data

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
    if (!apiKey) throw new Error("Thiếu biến môi trường GEMINI_API_KEY");
    const genAI = new GoogleGenerativeAI(apiKey);
    const SYSTEM_PROMPT = "Bạn là trợ lý ảo hỗ trợ khách hàng của IT Global. Trả lời ngắn gọn, lịch sự. HÃY DỰA VÀO NGỮ CẢNH SAU ĐÂY ĐỂ TRẢ LỜI. Tuyệt đối không tự bịa thông tin. Nếu user đưa thông tin cá nhân (đã bị ẩn), hãy ghi nhận và bảo họ đợi liên hệ. Hãy trả lời bằng văn bản thuần túy, không sử dụng Markdown (như các dấu hoa thị để in đậm). Các danh sách phải được xuống dòng rõ ràng.";
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
        // Áp dụng bộ lọc chuẩn hóa chuỗi mới
        const normalizedMsg = normalizeText(userMessage);
        
        if (faqCache.has(normalizedMsg)) {
            console.log("⚡ [FAQ CACHE] Phản hồi ngay lập tức, không cần gọi Google API!");
            return faqCache.get(normalizedMsg);
        }

        const totalStartTime = Date.now(); 
        const safeUserMessage = maskSensitiveData(userMessage);
        let context = "";

        try {
            console.time("⏱️ Thời gian tạo Vector");
            const queryVector = await getEmbedding(safeUserMessage);
            console.timeEnd("⏱️ Thời gian tạo Vector");
            
            console.time("⏱️ Thời gian quét RAM");
            context = await searchLocalVector(queryVector);
            console.timeEnd("⏱️ Thời gian quét RAM");
            if (context) console.log("👉 ĐÃ TÌM THẤY NGỮ CẢNH TRONG RAM");
        } catch (dbError) {
            console.error("❌ Lỗi khi quét Vector:", dbError.message);
        }

        const promptWithContext = context 
            ? `Dựa vào thông tin sau của công ty IT-Global:\n[${context}]\n\nHãy trả lời câu hỏi: ${safeUserMessage}`
            : safeUserMessage;

        const gemini = getModel();
        const chat = gemini.startChat({ history: buildHistory(historyRows) });
        
        console.time("⏱️ Thời gian Gemini rep");
        const result = await chat.sendMessage(promptWithContext);
        console.timeEnd("⏱️ Thời gian Gemini rep");

        const totalTime = Date.now() - totalStartTime;
        const timeInSeconds = (totalTime / 1000).toFixed(2);

        let text = result.response?.text ? result.response.text() : "";
        
        if (typeof text === "string") {
            text = text.replace(/\*/g, ""); 
            text += `\n\n*(Trả lời trong vòng ${timeInSeconds} giây)*`;
        }

        const cleanText = text.trim();
        
        // Lưu câu trả lời từ Gemini vào bộ đệm luôn để lần sau hỏi lại không tốn API
        if (cleanText && cleanText !== FALLBACK_REPLY) {
            faqCache.set(normalizedMsg, cleanText);
        }

        return cleanText || FALLBACK_REPLY;
    } catch (error) {
        console.error("❌ Lỗi Gemini:", error?.message || String(error));
        return FALLBACK_REPLY;
    }
}

export async function loadFAQsToCache() {
    try {
        faqCache.clear(); 
        const result = await pool.query(`SELECT question, answer FROM faqs`); 
        
        for (const row of result.rows) {
            // Áp dụng bộ lọc chuẩn hóa khi đưa vào RAM
            const normalizedQ = normalizeText(row.question);
            faqCache.set(normalizedQ, row.answer);
        }
        console.log(`✅ Đã đồng bộ ${faqCache.size} câu hỏi FAQ từ Database vào RAM!`);
    } catch (error) {
        console.error("❌ Lỗi khi tải FAQ vào RAM:", error.message);
    }
}