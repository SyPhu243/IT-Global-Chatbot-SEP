import { createSession } from "../models/sessionModel.js";

export async function startSession(req, res) {
    try {
        const session = await createSession(req.ip);

        return res.status(201).json({
            status: "success",
            message: "Tạo session thành công",
            data: session,
        });
    } catch (error) {
        console.error("Lỗi tạo session:", error.message);
        return res.status(500).json({ status: "error", message: "Lỗi server" });
    }
}