import "dotenv/config";
import cron from "node-cron";
import pool from "../db.js";
import { extractRawData } from "./extractRawData.js";
import { runVectorPipeline } from "./vectorPipeline.js";

let isRunning = false;

// Chạy mỗi 5 phút
cron.schedule("*/5 * * * *", async () => {
    if (isRunning) {
        console.log("[Cron] Lần chạy trước chưa hoàn tất");
        return;
    }

    isRunning = true;

    try {
        console.log("[Cron] Bắt đầu trích xuất dữ liệu");

        // Trích xuất dữ liệu
        const records = await extractRawData();

        console.log(
            `[Cron] Trích xuất được ${records.length} bản ghi`
        );

        // Đẩy dữ liệu vào Vector DB
        console.log("[Cron] Bắt đầu Data Pipeline");

        const result = await runVectorPipeline();

        console.log(
            `[Cron] Pipeline hoàn tất: ${result.processed} thành công, ${result.failed} thất bại`
        );

    } catch (error) {
        console.error("[Cron] Lỗi:", error.message);
    } finally {
        isRunning = false;
    }
});

console.log("[Cron] Đã khởi tạo, chạy mỗi 5 phút");

async function shutdown() {
    await pool.end();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
