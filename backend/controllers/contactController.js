import { createContact } from "../models/contactModel.js";
 
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s]{8,20}$/;
const ALLOWED_SOURCES = ["widget_chatbot", "contact_form"];
 
export async function submitContact(req, res) {
    const { fullName, email, phone, message, source } = req.body ?? {};
    const errors = [];
 
    // Validate phía server
    if (typeof fullName !== "string" || !fullName.trim()) {
        errors.push("Họ tên là bắt buộc");
    } else if (fullName.trim().length > 150) {
        errors.push("Họ tên tối đa 150 ký tự");
    }
 
    if (typeof email !== "string" || !email.trim()) {
        errors.push("Email là bắt buộc");
    } else if (email.trim().length > 255 || !EMAIL_REGEX.test(email.trim())) {
        errors.push("Email không hợp lệ");
    }
 
    if (phone && (typeof phone !== "string" || !PHONE_REGEX.test(phone.trim()))) {
        errors.push("Số điện thoại không hợp lệ");
    }
 
    if (message && typeof message !== "string") {
        errors.push("Nội dung không hợp lệ");
    }
 
    if (source && !ALLOWED_SOURCES.includes(source)) {
        errors.push("Nguồn không hợp lệ");
    }
 
    if (errors.length > 0) {
        return res.status(400).json({ status: "error", errors });
    }
 
    try {
        // Gọi Model insert dữ liệu an toàn vào DB
        const contact = await createContact({
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone?.trim() || null,
            message: message?.trim() || null,
            source: source || "contact_form",
        });
 
        // Trả về HTTP 201 kèm thông báo
        return res.status(201).json({
            status: "success",
            message: "Gửi thông tin liên hệ thành công",
            data: contact,
        });
    } catch (error) {
        console.error("Lỗi lưu contact:", error.message);
        return res.status(500).json({ status: "error", message: "Lỗi server" });
    }
}