
import "dotenv/config";
import { extractRawData } from "./extractRawData.js";
import pool from "../db.js";

try {
    const records = await extractRawData();

    console.log("[Extractor] Trích xuất hoàn tất");
    console.log(`[Extractor] Tổng số: ${records.length}`);
} catch (error) {
    console.error("[Extractor] Thực thi thất bại:", error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
