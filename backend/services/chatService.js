    import { GoogleGenerativeAI } from "@google/generative-ai";

    const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const MAX_HISTORY = 10;

    const SYSTEM_PROMPT =
        process.env.CHATBOT_SYSTEM_PROMPT ||
        "Bạn là chatbot hỗ trợ khách hàng của IT Global. " +
            "Trả lời ngắn gọn, lịch sự, bằng đúng ngôn ngữ của người dùng. " +
            "Nếu không chắc chắn, hãy nói rõ và đề nghị người dùng liên hệ nhân viên.";

    const FALLBACK_REPLY = "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.";

    let model = null;

    // Khoi tao Gemini khi can thiet
    function getModel() {
        if (model) return model;

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("Thieu bien moi truong GEMINI_API_KEY");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: SYSTEM_PROMPT,
        });

        return model;
    }

    // Chuyen lich su chat trong DB thanh history cua Gemini
    
    function buildHistory(rows) {
        const history = [];

        // Chi lay cac tin nhan hop le gan nhat
        const recentRows = (Array.isArray(rows) ? rows : [])
            .filter(
                (row) =>
                    (row.sender === "user" || row.sender === "bot") &&
                    typeof row.content === "string" &&
                    row.content.trim().length > 0
            )
            .slice(-MAX_HISTORY);

        for (const row of recentRows) {
            const role = row.sender === "bot" ? "model" : "user";
            const content = row.content.trim();
            const last = history[history.length - 1];

            // Gemini khong nhan hai role lien tiep giong nhau,
            // nen gop cac tin nhan cung role lai.
            if (last && last.role === role) {
                last.parts[0].text += "\n" + content;
            } else {
                history.push({
                    role,
                    parts: [{ text: content }],
                });
            }
        }

        // History phai bat dau bang user
        while (history.length > 0 && history[0].role !== "user") {
            history.shift();
        }

        // History truyen vao startChat nen ket thuc bang model,
        // vi tin nhan user moi se duoc gui qua sendMessage().
        if (history.length > 0 && history[history.length - 1].role === "user") {
            history.pop();
        }

        return history;
    }


    /**
     * @param {string} userMessage Tin nhan moi cua nguoi dung
     * @param {Array} historyRows Lich su tin nhan da co trong DB
     * @returns {Promise<string>} Cau tra loi cua chatbot
     */
    export async function generateBotReply(userMessage, historyRows = []) {
        try {
            // Khoi tao model va lich su ben trong try de bat loi
            const gemini = getModel();

            const chat = gemini.startChat({
                history: buildHistory(historyRows),
            });

            const result = await chat.sendMessage(userMessage);
            const text = result.response.text().trim();

            return text || FALLBACK_REPLY;
        } catch (error) {
            const errorMessage = error?.message || String(error);

            console.error("Loi Gemini:", errorMessage);

            // Loi an toan, qua tai hoac gioi han request
            if (
                /blocked|safety|503|high demand|overloaded|429|RESOURCE_EXHAUSTED|Thieu bien moi truong GEMINI_API_KEY/i.test(
                    errorMessage
                )
            ) {
                return FALLBACK_REPLY;
            }

            // Cac loi khac duoc chuyen len controller
            throw error;
        }
    }