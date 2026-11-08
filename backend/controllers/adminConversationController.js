
import pool from "../db.js";

const FALLBACK_REPLY =
    "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.";

function isValidDate(value) {
    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parsed = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value;
}

export async function getConversations(req, res, next) {
    try {
        const {
            page = "1",
            limit = "15",
            startDate,
            endDate,
            filter
        } = req.query;

        // Kiểm tra phân trang
        const pageNum = Number(page);
        const limitNum = Number(limit);

        if (
            !Number.isSafeInteger(pageNum) ||
            !Number.isSafeInteger(limitNum) ||
            pageNum < 1 ||
            limitNum < 1 ||
            limitNum > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "page phải >= 1, limit từ 1 đến 100",
            });
        }

        const offset = (pageNum - 1) * limitNum;

        if (!Number.isSafeInteger(offset)) {
            return res.status(400).json({
                success: false,
                message: "Giá trị page quá lớn",
            });
        }

        // Kiểm tra ngày
        if (
            (startDate !== undefined && !isValidDate(startDate)) ||
            (endDate !== undefined && !isValidDate(endDate))
        ) {
            return res.status(400).json({
                success: false,
                message: "Ngày phải có định dạng YYYY-MM-DD hợp lệ",
            });
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate không được lớn hơn endDate",
            });
        }

        if (filter !== undefined && filter !== "unhandled") {
            return res.status(400).json({
                success: false,
                message: "filter chỉ hỗ trợ unhandled",
            });
        }

        const params = [];
        const conditions = [];

        // Lọc theo ngày tạo session
        if (startDate) {
            params.push(startDate);
            conditions.push(
                `s.created_at >= $${params.length}::date`
            );
        }

        if (endDate) {
            params.push(endDate);
            conditions.push(
                `s.created_at < ($${params.length}::date + INTERVAL '1 day')`
            );
        }

        // Lọc session có Dislike hoặc Fallback
        if (filter === "unhandled") {
            params.push(FALLBACK_REPLY);

            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM messages um
                    WHERE um.session_id = s.id
                      AND (
                          um.rating = -1
                          OR (
                              um.sender = 'bot'
                              AND LOWER(BTRIM(um.content)) =
                                  LOWER($${params.length})
                          )
                      )
                )
            `);
        }

        const whereSql = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        // Đếm số session thỏa điều kiện
        const countSql = `
            SELECT COUNT(*)::integer AS total
            FROM sessions s
            ${whereSql}
        `;

        const countResult = await pool.query(
            countSql,
            params
        );

        const total = countResult.rows[0].total;

        // Lấy số tin nhắn và thời gian gần nhất
        const dataParams = [...params];

        dataParams.push(limitNum);
        const limitPlaceholder = `$${dataParams.length}`;

        dataParams.push(offset);
        const offsetPlaceholder = `$${dataParams.length}`;

        const dataSql = `
            SELECT
                s.id AS session_id,
                s.ip_address,
                s.created_at,
                COUNT(m.id)::integer AS total_messages,
                MAX(m.created_at) AS last_message_at,
                COALESCE(
                    MAX(m.created_at),
                    s.created_at
                ) AS last_activity_at
            FROM sessions s
            LEFT JOIN messages m
                ON m.session_id = s.id
            ${whereSql}
            GROUP BY
                s.id,
                s.ip_address,
                s.created_at
            ORDER BY
                last_activity_at DESC,
                s.id DESC
            LIMIT ${limitPlaceholder}
            OFFSET ${offsetPlaceholder}
        `;

        const dataResult = await pool.query(
            dataSql,
            dataParams
        );

        return res.status(200).json({
            success: true,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            },
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                filter: filter || null
            },
            data: dataResult.rows
        });

    } catch (error) {
        next(error);
    }
}
