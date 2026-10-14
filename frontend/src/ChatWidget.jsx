import React, { useState, useEffect, useRef } from "react";

const IT_GLOBAL_SUGGESTIONS = [
  "Tư vấn thiết kế Website doanh nghiệp",
  "Lập trình ứng dụng di động (iOS / Android)",
  "Báo giá & giải pháp phần mềm theo yêu cầu",
];

export default function ChatWidget() {
  const [activeTab, setActiveTab] = useState("ai"); // "ai" | "agent"
  const [aiMessages, setAiMessages] = useState([
    { id: 1, sender: "bot", text: "IT-Global có thể giúp gì cho bạn ?" },
    { id: 2, sender: "bot", text: "Chúng tôi sẽ cố gắng hết sức để giải quyết vấn đề mà bạn đưa ra" },
  ]);
  const [agentMessages, setAgentMessages] = useState([
    { id: 101, sender: "bot", text: "Xin chào! Bạn đang kết nối với tư vấn viên của IT-Global." },
    { id: 102, sender: "bot", text: "Vui lòng để lại nhu cầu dự án hoặc số điện thoại, chúng tôi sẽ hỗ trợ ngay." },
  ]);

  const [inputText, setInputText] = useState("");
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Logic Like / Dislike đánh giá
  const [hasRated, setHasRated] = useState(() => {
    return localStorage.getItem("chat_widget_rated") === "true";
  });
  const [showFeedback, setShowFeedback] = useState(false);
  // Ngẫu nhiên mốc kích hoạt là 5 hoặc 6 câu chat của người dùng
  const [feedbackThreshold] = useState(() => Math.floor(Math.random() * 2) + 5);

  // Task 594: Khởi tạo session trong LocalStorage
  useEffect(() => {
    let session = localStorage.getItem("chat_session_id");
    if (!session) {
      session = "session_" + Date.now();
      localStorage.setItem("chat_session_id", session);
    }
  }, []);

  // Task 594: Tự động cuộn xuống dưới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, agentMessages, activeTab, showFeedback]);

  // Kiểm tra điều kiện kích hoạt hộp Like/Dislike (sau 5-6 tin nhắn người dùng)
  useEffect(() => {
    if (hasRated) return;

    const userMsgCount = aiMessages.filter((m) => m.sender === "user").length;
    if (userMsgCount >= feedbackThreshold) {
      setShowFeedback(true);
    }
  }, [aiMessages, hasRated, feedbackThreshold]);

  const handleRating = (type) => {
    // Lưu vào LocalStorage để không bao giờ hiện lại nữa
    localStorage.setItem("chat_widget_rated", "true");
    setHasRated(true);
    setShowFeedback(false);
    console.log(`Đánh giá của người dùng: ${type}`);
  };

  const sendMessage = (text) => {
    const content = text.trim();
    if (!content) return;

    setHasSentFirstMessage(true);
    const userMsg = { id: Date.now(), sender: "user", text: content };

    if (activeTab === "ai") {
      setAiMessages((prev) => [...prev, userMsg]);
    } else {
      setAgentMessages((prev) => [...prev, userMsg]);
    }
    setInputText("");
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    sendMessage(inputText);
  };

  const currentMessages = activeTab === "ai" ? aiMessages : agentMessages;
  const showSuggestions = activeTab === "ai" && !hasSentFirstMessage;

  return (
    <div style={styles.card}>
      {/* Header Tabs */}
      <div style={styles.header}>
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab("ai")}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === "ai" ? "#1565C0" : "transparent",
              color: activeTab === "ai" ? "#FFFFFF" : "#667085",
              fontWeight: activeTab === "ai" ? "600" : "500",
            }}
          >
            Ai–Chat Corner
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === "agent" ? "#1565C0" : "transparent",
              color: activeTab === "agent" ? "#FFFFFF" : "#667085",
              fontWeight: activeTab === "agent" ? "600" : "500",
            }}
          >
            Chat với nhân viên
          </button>
        </div>
      </div>

      {/* Vùng tin nhắn */}
      <div style={styles.messageBody}>
        {activeTab === "agent" && (
          <div style={styles.agentStatusBanner}>
            <span style={styles.onlineDot} />
            Đội ngũ tư vấn trực tuyến (8:00 - 18:00)
          </div>
        )}

        {currentMessages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  backgroundColor: isUser ? "#1565C0" : "#F2F4F7",
                  color: isUser ? "#FFFFFF" : "#1D2939",
                  borderBottomRightRadius: isUser ? "4px" : "16px",
                  borderBottomLeftRadius: isUser ? "16px" : "4px",
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Khung đánh giá Like / Dislike */}
        {showFeedback && (
          <div style={styles.feedbackContainer}>
            <span style={styles.feedbackText}>Câu trả lời của chúng tôi có hữu ích không?</span>
            <div style={styles.feedbackActions}>
              <button
                onClick={() => handleRating("like")}
                style={styles.feedbackBtn}
                title="Hữu ích"
              >
                👍
              </button>
              <button
                onClick={() => handleRating("dislike")}
                style={styles.feedbackBtn}
                title="Chưa hữu ích"
              >
                👎
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Gợi ý câu hỏi: ghim trên ô nhập, tự mất sau khi gửi */}
      {showSuggestions && (
        <div style={styles.suggestionBar}>
          <div style={styles.suggestionTitle}>Gợi ý câu hỏi:</div>
          <div style={styles.suggestionList}>
            {IT_GLOBAL_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(item)}
                style={styles.suggestionChip}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer nhập tin */}
      <div style={styles.footer}>
        <div style={styles.inputWrapper}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              activeTab === "ai"
                ? "Nhập những gì bạn đang thắc mắc..."
                : "Để lại lời nhắn cho chuyên viên..."
            }
            style={styles.textarea}
          />
          <button onClick={handleSend} style={styles.sendBtn} title="Gửi">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="#1565C0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <span style={styles.updateLink}>Cập nhật thông tin của tài khoản</span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: "380px",
    height: "640px",
    backgroundColor: "#FFFFFF",
    borderRadius: "28px",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.08)",
    border: "1px solid #EAEAEA",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
  },
  header: {
    padding: "18px 20px 12px",
    borderBottom: "1px solid #F0F2F5",
  },
  tabContainer: {
    display: "flex",
    backgroundColor: "#F2F4F7",
    borderRadius: "14px",
    padding: "4px",
  },
  tabBtn: {
    flex: 1,
    padding: "9px 0",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  agentStatusBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#475467",
    backgroundColor: "#F9FAFB",
    padding: "6px 12px",
    borderRadius: "20px",
    marginBottom: "12px",
    border: "1px solid #EAECF0",
  },
  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#12B76A",
  },
  messageBody: {
    flex: 1,
    padding: "16px 20px",
    overflowY: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  bubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  feedbackContainer: {
    backgroundColor: "#F8F9FA",
    border: "1px dashed #D0D5DD",
    borderRadius: "14px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "12px 0 8px 0",
  },
  feedbackText: {
    fontSize: "12px",
    color: "#475467",
  },
  feedbackActions: {
    display: "flex",
    gap: "8px",
  },
  feedbackBtn: {
    background: "#FFFFFF",
    border: "1px solid #D0D5DD",
    borderRadius: "8px",
    padding: "4px 8px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "transform 0.1s ease",
  },
  suggestionBar: {
    padding: "4px 20px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    backgroundColor: "#FFFFFF",
  },
  suggestionTitle: {
    fontSize: "12px",
    color: "#667085",
    fontWeight: "500",
  },
  suggestionList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  suggestionChip: {
    backgroundColor: "#F0F9FF",
    color: "#1565C0",
    border: "1px solid #B9E6FE",
    borderRadius: "12px",
    padding: "7px 12px",
    fontSize: "13px",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  footer: {
    padding: "0 20px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#FFFFFF",
  },
  inputWrapper: {
    width: "100%",
    minHeight: "85px",
    backgroundColor: "#FAFAFA",
    border: "1px solid #E4E7EC",
    borderRadius: "16px",
    padding: "12px 14px",
    display: "flex",
    position: "relative",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    height: "60px",
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: "13.5px",
    color: "#1D2939",
    backgroundColor: "transparent",
    paddingRight: "36px",
    fontFamily: "inherit",
    lineHeight: "1.4",
  },
  sendBtn: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  updateLink: {
    fontSize: "12px",
    color: "#1565C0",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: "500",
  },
};