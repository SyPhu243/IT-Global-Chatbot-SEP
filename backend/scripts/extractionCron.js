
import "dotenv/config";
import cron from "node-cron";
import { extractRawData } from "./extractRawData.js";
import pool from "../db.js";

let isRunning = false;

cron.schedule("*/5 * * * *", async () => {
    if (isRunning) return;

    isRunning = true;

    try {
        console.log("[Cron] Bắt đầu trích xuất dữ liệu");

        const records = await extractRawData();

        console.log(
            `[Cron] Hoàn tất: ${records.length} bản ghi`
        );
    } catch (error) {
        console.error("[Cron] Lỗi:", error.message);
    } finally {
        isRunning = false;
    }
});

async function shutdown() {
    await pool.end();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[Cron] Đã khởi tạo, chạy mỗi 5 phút");
