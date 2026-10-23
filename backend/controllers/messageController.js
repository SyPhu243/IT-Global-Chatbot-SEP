import { findSessionById } from "../models/sessionModel.js";
import {
    createMessage,
    getMessagesBySession,
    findMessageById,
    updateMessageRating,
} from "../models/messageModel.js";

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

export async function rateMessage(req, res) {
    const { id } = req.params;
    const { rating } = req.body ?? {};

    // Kiểm tra ID tin nhắn hợp lệ
    if (!/^[1-9]\d*$/.test(id) ||
        !Number.isSafeInteger(Number(id))) {
        return res.status(400).json({
            status: "error",
            message: "ID tin nhắn không hợp lệ",
        });
    }

    // Rating chỉ được nhận 1 hoặc -1
    if (rating !== 1 && rating !== -1) {
        return res.status(400).json({
            status: "error",
            message: "Rating chỉ được là 1 hoặc -1",
        });
    }

    try {
        // Kiểm tra tin nhắn có tồn tại không
        const message = await findMessageById(id);

        if (!message) {
            return res.status(404).json({
                status: "error",
                message: "Không tìm thấy tin nhắn",
            });
        }

        // Chỉ cho phép đánh giá tin nhắn của Bot
        if (message.sender !== "bot") {
            return res.status(400).json({
                status: "error",
                message: "Chỉ được đánh giá tin nhắn của Bot",
            });
        }

        // Cập nhật rating vào database
        const updatedMessage = await updateMessageRating(id, rating);

        if (!updatedMessage) {
            return res.status(409).json({
                status: "error",
                message: "Không thể cập nhật đánh giá",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Đánh giá tin nhắn thành công",
            data: updatedMessage,
        });
    } catch (error) {
        console.error("Lỗi đánh giá tin nhắn:", error.message);

        return res.status(500).json({
            status: "error",
            message: "Lỗi server",
        });
    }
}
