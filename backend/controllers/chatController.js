import { findSessionById, createSessionWithId } from "../models/sessionModel.js";
import { createMessage, getMessagesBySession } from "../models/messageModel.js";
import { generateBotReply } from "../services/chatService.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 2000;
const AGENT_ACK_TEXT =
    "Cảm ơn quý khách! Tin nhắn đã được chuyển đến nhân viên tư vấn IT-Global. " +
    "Nhân viên sẽ phản hồi trong thời gian sớm nhất qua thông tin bạn đã đăng ký " +
    "(hoặc liên hệ trực tiếp Hotline/Zalo: +84 987.613.161).";

export async function sendChatMessage(req, res) {
    const { sessionId, message, mode = "ai" } = req.body ?? {};
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
        // Tự động tạo session trong DB nếu chưa tồn tại (tránh lỗi 404 khiến không lưu được hội thoại)
        let session = await findSessionById(sessionId);
        if (!session) {
            const clientIp =
                req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
                req.socket?.remoteAddress ||
                req.ip ||
                "unknown";
            session = await createSessionWithId(sessionId, clientIp);
        }

        // Lấy lịch sử cũ (chưa gồm tin nhắn mới) để làm ngữ cảnh cho AI / kiểm tra đã xác nhận nhân viên chưa
        const history = await getMessagesBySession(sessionId);

        // 1. Luôn lưu tin nhắn của user vào bảng messages
        const userMessage = await createMessage({
            sessionId,
            sender: "user",
            content: message.trim(),
        });

        // 2. Nhánh "Chat với nhân viên" -> Không gọi Gemini AI, chỉ xác nhận 1 lần đầu
        if (mode === "agent") {
            const alreadyAcked = history.some(
                (msg) => msg.sender === "bot" && msg.content === AGENT_ACK_TEXT
            );

            if (alreadyAcked) {
                return res.status(200).json({
                    status: "success",
                    data: {
                        reply: null,
                        userMessage,
                        botMessage: null,
                    },
                });
            }

            const botMessage = await createMessage({
                sessionId,
                sender: "bot",
                content: AGENT_ACK_TEXT,
            });

            return res.status(200).json({
                status: "success",
                data: {
                    reply: botMessage.content,
                    userMessage,
                    botMessage,
                },
            });
        }

        // 3. Nhánh "Chat với AI" -> Chạy luồng FAQ Cache + RAG + Gemini bình thường
        const replyText = await generateBotReply(message.trim(), history);

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