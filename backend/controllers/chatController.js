import { findSessionById } from "../models/sessionModel.js";
import { createMessage, getMessagesBySession } from "../models/messageModel.js";
import { generateBotReply } from "../services/chatService.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 2000;

export async function sendChatMessage(req, res) {
    const { sessionId, message } = req.body ?? {};
    const errors = [];

    if (typeof sessionId !== "string" || !UUID_REGEX.test(sessionId)) {
        errors.push("Session ID không hợp lệ");
    }

    if (typeof message !== "string" || !message.trim()) {
        errors.push("Nội dung tin nhắn là bắt buộc");
    } else if (message.trim().length > MAX_MESSAGE_LENGTH) {
        errors.push(`Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự`);
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: "error", errors });
    }

    try {
        const session = await findSessionById(sessionId);
        if (!session) {
            return res
                .status(404)
                .json({ status: "error", message: "Không tìm thấy session" });
        }

        // Lấy lịch sử cũ (chưa gồm tin nhắn mới) để làm ngữ cảnh cho AI
        const history = await getMessagesBySession(sessionId);
        console.log("CHAT HISTORY:", JSON.stringify(history, null, 2));

        // 1. Lưu tin nhắn của user
        const userMessage = await createMessage({
            sessionId,
            sender: "user",
            content: message.trim(),
        });

        // 2. Chuyển tiếp cho service để lấy câu trả lời thật từ Gemini
        const replyText = await generateBotReply(message.trim(), history);

        // 3. Lưu câu trả lời của bot
        const botMessage = await createMessage({
            sessionId,
            sender: "bot",
            content: replyText,
        });

        return res.status(200).json({
            status: "success",
            data: {
                reply: botMessage.content,
                userMessage,
                botMessage,
            },
        });
    } catch (error) {
        console.error("Lỗi xử lý tin nhắn:", error.message);
        return res.status(500).json({ status: "error", message: "Lỗi server" });
    }
}

export async function getChatHistory(req, res) {
    const { sessionId } = req.params;

    if (!UUID_REGEX.test(sessionId)) {
        return res
            .status(400)
            .json({ status: "error", errors: ["Session ID không hợp lệ"] });
    }

    try {
        const session = await findSessionById(sessionId);
        if (!session) {
            return res
                .status(404)
                .json({ status: "error", message: "Không tìm thấy session" });
        }

        // Model đã ORDER BY created_at ASC, id ASC
        const messages = await getMessagesBySession(sessionId);

        return res.status(200).json({ status: "success", data: messages });
    } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error.message);
        return res.status(500).json({ status: "error", message: "Lỗi server" });
    }
}