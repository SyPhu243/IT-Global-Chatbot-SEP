import rateLimit from 'express-rate-limit';

// Cấu hình Rate Limit chặn spam cho Form Liên lạc
export const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Khung thời gian: 15 phút
  max: 3, // Giới hạn tối đa: 3 request / 1 địa chỉ IP / 15 phút
  message: {
    status: 'error',
    message: 'Bạn đã gửi quá nhiều yêu cầu liên lạc. Vui lòng thử lại sau 15 phút!'
  },
  standardHeaders: true, // Trả về thông tin rate limit trong header `RateLimit-*`
  legacyHeaders: false, // Vô hiệu hóa header `X-RateLimit-*` cũ
});