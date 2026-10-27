
import "dotenv/config";
import pool from "../db.js";
import { runVectorPipeline } from "./vectorPipeline.js";

try {
    const result = await runVectorPipeline();
    console.log("[Pipeline] Kết quả:", result);
} catch (error) {
    console.error("[Pipeline] Lỗi:", error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
