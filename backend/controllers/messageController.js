import { findSessionById } from "../models/sessionModel.js";
import { createMessage, getMessagesBySession } from "../models/messageModel.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_SENDERS = ["user", "bot"];

export async function sendMessage(req, res) {
    const { sessionId } = req.params;
    const { sender, content } = req.body ?? {};
    const errors = [];

    if (!UUID_REGEX.test(sessionId)) {
        errors.push("Session ID không hợp lệ");
    }

    if (typeof sender !== "string" || !sender.trim()) {
        errors.push("Sender là bắt buộc");
    } else if (!ALLOWED_SENDERS.includes(sender)) {
        errors.push("Sender không hợp lệ (user hoặc bot)");
    }

    if (typeof content !== "string" || !content.trim()) {
        errors.push("Nội dung tin nhắn là bắt buộc");
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

        const message = await createMessage({
            sessionId,
            sender,
            content: content.trim(),
        });

        return res.status(201).json({
            status: "success",
            message: "Gửi tin nhắn thành công",
            data: message,
        });
    } catch (error) {
        console.error("Lỗi lưu message:", error.message);
        return res.status(500).json({ status: "error", message: "Lỗi server" });
    }
}

export async function getHistory(req, res) {
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

        const messages = await getMessagesBySession(sessionId);

        return res.status(200).json({
            status: "success",
            data: messages,
        });
    } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error.message);
        return res.status(500).json({ status: "error", message: "Lỗi server" });
    }
}