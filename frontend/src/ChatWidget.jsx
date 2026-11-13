import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
};

const getFormattedDateTime = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr}\nlúc ${timeStr}`;
};

const registerSchema = yup.object().shape({
  name: yup.string().required("Họ và tên không được để trống!"),
  email: yup
    .string()
    .required("Gmail không được để trống!")
    .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, "Gmail phải có định dạng chuẩn kết thúc bằng @gmail.com!"),
  phone: yup
    .string()
    .required("Số điện thoại không được để trống!")
    .matches(/^0\d{9,10}$/, "Số điện thoại chỉ chứa số, bắt đầu bằng 0 (10 đến 11 số)!"),
});

const loginSchema = yup.object().shape({
  account: yup
    .string()
    .required("Vui lòng nhập Gmail hoặc Số điện thoại!")
    .test("is-email-or-phone", "Vui lòng nhập đúng Gmail (@gmail.com) hoặc SĐT (chỉ chứa số)!", (value) => {
      if (!value) return false;
      const isEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value.trim());
      const isPhone = /^0\d{9,10}$/.test(value.trim());
      return isEmail || isPhone;
    }),
});

const IT_GLOBAL_SUGGESTIONS = [
  "Tư vấn thiết kế Website doanh nghiệp",
  "Lập trình ứng dụng di động (iOS / Android)",
  "Báo giá & giải pháp phần mềm theo yêu cầu",
];

const RATING_LABELS = {
  1: "Rất không hài lòng",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Tuyệt vời!",
};

const POSITIVE_TAGS = ["Nhanh & chính xác", "Giải đáp đúng ý", "Thân thiện, dễ hiểu"];
const NEGATIVE_TAGS = ["Chưa đúng trọng tâm", "Thông tin còn thiếu", "Cần gặp nhân viên"];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("register");
  const [modalSuccess, setModalSuccess] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const [chatStartTime] = useState(() => getFormattedDateTime());
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const {
    register: registerReg,
    handleSubmit: handleSubmitReg,
    formState: { errors: errorsReg },
    reset: resetReg,
  } = useForm({ resolver: yupResolver(registerSchema) });

  const {
    register: registerLog,
    handleSubmit: handleSubmitLog,
    formState: { errors: errorsLog },
    reset: resetLog,
  } = useForm({ resolver: yupResolver(loginSchema) });

  const {
    register: registerUpd,
    handleSubmit: handleSubmitUpd,
    formState: { errors: errorsUpd },
    setValue: setValueUpd,
  } = useForm({ resolver: yupResolver(registerSchema) });

  const [activeTab, setActiveTab] = useState("ai");
  const [aiMessages, setAiMessages] = useState([
    { id: 1, sender: "bot", text: "IT-Global có thể giúp gì cho bạn ?" },
    { id: 2, sender: "bot", text: "Chúng tôi sẽ cố gắng hết sức để giải quyết" },
  ]);
  const [agentMessages, setAgentMessages] = useState([
    { id: 101, sender: "bot", text: "IT-Global có thể giúp gì cho bạn ?" },
    { id: 102, sender: "bot", text: "Nhân viên A đang kết nối..." },
    { id: 103, sender: "bot", text: "Quý khách có thắc mắc gì cần giải đáp ạ ?" },
  ]);

  const [inputText, setInputText] = useState("");
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // CSAT 5-Star Rating states
  const [hasRated, setHasRated] = useState(() => localStorage.getItem("chat_widget_rated") === "true");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackThreshold] = useState(() => Math.floor(Math.random() * 2) + 5);
  const [ratingScore, setRatingScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const initChatSession = async (userInfo) => {
    try {
      const res = await axios.post("/api/sessions", {
        fullName: userInfo?.name || userInfo?.fullName || "Khách hàng",
        email: userInfo?.email || "",
        phone: userInfo?.phone || "",
      });

      const serverSessionId = res.data?.sessionId || res.data?.data?.id || res.data?.id;
      if (serverSessionId && UUID_REGEX.test(serverSessionId)) {
        setSessionId(serverSessionId);
      } else {
        setSessionId(generateUUID());
      }
    } catch (err) {
      setSessionId(generateUUID());
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("chat_user_info");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setValueUpd("name", parsed.name || parsed.fullName || "");
      setValueUpd("email", parsed.email || "");
      setValueUpd("phone", parsed.phone || "");
      setView("chat");
      initChatSession(parsed);
    }
  }, [setValueUpd]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, agentMessages, activeTab, isTyping, showFeedback, ratingScore, view, isOpen]);

  useEffect(() => {
    if (hasRated || view !== "chat") return;
    const userMsgCount = aiMessages.filter((m) => m.sender === "user").length;
    if (userMsgCount >= feedbackThreshold) setShowFeedback(true);
  }, [aiMessages, hasRated, feedbackThreshold, view]);

  const handleRegister = async (data) => {
    setLoading(true);
    setApiError("");
    try {
      const payload = {
        fullName: data.name,
        email: data.email,
        phone: data.phone,
      };
      await axios.post("/api/contacts", payload).catch(() => {});
      localStorage.setItem("chat_user_info", JSON.stringify(data));
      setValueUpd("name", data.name);
      setValueUpd("email", data.email);
      setValueUpd("phone", data.phone);
      initChatSession(data);
      setModalSuccess("registered");
    } catch (err) {
      setApiError("Đã xảy ra lỗi khi kết nối máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (data) => {
    setLoading(true);
    setApiError("");
    try {
      const input = data.account.trim();
      const isEmail = input.toLowerCase().endsWith("@gmail.com");
      const dummyUser = { name: "Quý khách", email: isEmail ? input : "", phone: !isEmail ? input : "" };

      await axios.post("/api/contacts/login", { account: input }).catch(() => {});
      localStorage.setItem("chat_user_info", JSON.stringify(dummyUser));
      setValueUpd("name", dummyUser.name);
      setValueUpd("email", dummyUser.email);
      setValueUpd("phone", dummyUser.phone);
      initChatSession(dummyUser);
      setView("chat");
    } catch (err) {
      setApiError(err.response?.data?.message || "Đăng nhập thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setLoading(true);
    setApiError("");
    try {
      const payload = {
        fullName: data.name,
        email: data.email,
        phone: data.phone,
      };
      await axios.post("/api/contacts/update", payload).catch(() => {});
      localStorage.setItem("chat_user_info", JSON.stringify(data));
      setModalSuccess("updated");
    } catch (err) {
      setApiError(err.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text) => {
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
    setIsTyping(true);

    try {
      let validSessionId = sessionId;
      if (!validSessionId || !UUID_REGEX.test(validSessionId)) {
        validSessionId = generateUUID();
        setSessionId(validSessionId);
      }

      const res = await axios.post("/api/chat/message", {
        sessionId: validSessionId,
        message: content,
      });

      const replyText =
        res.data?.data?.reply ||
        res.data?.reply ||
        "Cảm ơn bạn đã nhắn tin, chúng tôi đã ghi nhận!";

      const botMsg = { id: Date.now() + 1, sender: "bot", text: replyText };

      if (activeTab === "ai") setAiMessages((prev) => [...prev, botMsg]);
      else setAgentMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setTimeout(() => {
        const fallbackMsg = {
          id: Date.now() + 1,
          sender: "bot",
          text: "IT-Global đã nhận được tin nhắn của bạn!",
        };
        if (activeTab === "ai") setAiMessages((prev) => [...prev, fallbackMsg]);
        else setAgentMessages((prev) => [...prev, fallbackMsg]);
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    sendMessage(inputText);
  };

  const toggleFeedbackTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectStar = (star) => {
    setRatingScore(star);
    setSelectedTags([]);
  };

  const handleSubmitFeedback = async () => {
    if (ratingScore === 0) return;
    try {
      await axios.post("/api/feedback", {
        sessionId: sessionId || generateUUID(),
        rating: ratingScore,
        tags: selectedTags,
        comment: feedbackComment.trim(),
      }).catch(() => {});
    } finally {
      localStorage.setItem("chat_widget_rated", "true");
      setHasRated(true);
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
      }, 1800);
    }
  };

  const currentMessages = activeTab === "ai" ? aiMessages : agentMessages;
  const showSuggestions = activeTab === "ai" && !hasSentFirstMessage;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.launcherBtn,
          transform: isOpen ? "scale(0.88) rotate(90deg)" : "scale(1) rotate(0deg)",
        }}
        title={isOpen ? "Thu nhỏ chat" : "Mở Chatbot hỗ trợ"}
      >
        {isOpen ? (
          <span style={{ fontSize: "22px", color: "#FFFFFF", fontWeight: "bold" }}>✕</span>
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      <div
        style={{
          ...styles.card,
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(24px) scale(0.92)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <button onClick={() => setIsOpen(false)} style={styles.closeBtnRight} title="Đóng khung chat">
          ✕
        </button>

        {/* ===================== VIEW: ĐĂNG KÝ ===================== */}
        {view === "register" && (
          <div key="register" className="view-animate" style={styles.formWrapper}>
            <div style={styles.topNoticeBanner}>
              <span>Vui lòng để lại thông tin để chúng tôi có thể hỗ trợ bạn tốt nhất!</span>
            </div>

            <div style={styles.formContainer}>
              <h3 style={styles.formTitle}>Đăng Ký thông tin cá nhân.</h3>

              {apiError && <div style={styles.errorBox}>{apiError}</div>}

              <form onSubmit={handleSubmitReg(handleRegister)} style={styles.formBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Họ và tên của bạn.</label>
                  <input type="text" placeholder="VD : Lê Nhất A, Trần Tứ B,..." {...registerReg("name")} style={styles.input} />
                  {errorsReg.name && <span style={styles.fieldError}>{errorsReg.name.message}</span>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nhập Gmail của bạn.</label>
                  <input type="email" placeholder="VD : abcxyz0123@gmail.com" {...registerReg("email")} style={styles.input} />
                  {errorsReg.email && <span style={styles.fieldError}>{errorsReg.email.message}</span>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Số điện thoại của bạn.</label>
                  <input type="text" placeholder="VD : 0123456789 ,..." {...registerReg("phone")} style={styles.input} />
                  {errorsReg.phone && <span style={styles.fieldError}>{errorsReg.phone.message}</span>}
                </div>

                <div style={styles.switchAuthText}>
                  Đã có thông tin,{" "}
                  <span onClick={() => { setApiError(""); resetLog(); setView("login"); }} style={styles.linkText}>
                    Đăng nhập ngay ...
                  </span>
                </div>

                <button type="submit" disabled={loading} style={styles.submitBtn}>
                  {loading ? "Đang xử lý..." : "Đăng ký"}
                </button>
              </form>
            </div>

            {modalSuccess === "registered" && (
              <div style={styles.modalOverlay}>
                <div className="modal-animate" style={styles.modalBox}>
                  <div style={styles.modalTitle}>Thông tin của bạn đã đăng ký thành công</div>
                  <span onClick={() => { setModalSuccess(null); setView("chat"); }} style={styles.modalActionLink}>
                    Ấn vào đây để bắt đầu chat
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW: ĐĂNG NHẬP ===================== */}
        {view === "login" && (
          <div key="login" className="view-animate" style={styles.formWrapper}>
            <div style={styles.topNoticeBanner}>
              <span>Vui lòng để lại thông tin để chúng tôi có thể hỗ trợ bạn tốt nhất!</span>
            </div>

            <div style={styles.formContainer}>
              <h3 style={styles.formTitle}>Đăng Nhập thông tin cá nhân.</h3>

              {apiError && <div style={styles.errorBox}>{apiError}</div>}

              <form onSubmit={handleSubmitLog(handleLogin)} style={styles.formBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nhập Gmail hoặc số điện thoại của bạn.</label>
                  <input type="text" placeholder="VD : abcxyz0123@gmail.com / 0123456789" {...registerLog("account")} style={styles.input} />
                  {errorsLog.account && <span style={styles.fieldError}>{errorsLog.account.message}</span>}
                </div>

                <div style={styles.switchAuthText}>
                  Chưa có thông tin,{" "}
                  <span onClick={() => { setApiError(""); resetReg(); setView("register"); }} style={styles.linkText}>
                    Đăng ký ngay ...
                  </span>
                </div>

                <button type="submit" disabled={loading} style={styles.submitBtn}>
                  {loading ? "Đang kiểm tra..." : "Đăng nhập"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===================== VIEW: CẬP NHẬT ===================== */}
        {view === "update" && (
          <div key="update" className="view-animate" style={styles.formWrapper}>
            <div style={styles.topNoticeBanner}>
              <span>Vui lòng để lại thông tin để chúng tôi có thể hỗ trợ bạn tốt nhất!</span>
            </div>

            <div style={styles.formContainer}>
              <h3 style={styles.formTitle}>Cập nhật thông tin cá nhân.</h3>

              {apiError && <div style={styles.errorBox}>{apiError}</div>}

              <form onSubmit={handleSubmitUpd(handleUpdate)} style={styles.formBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Họ và tên của bạn.</label>
                  <input type="text" {...registerUpd("name")} style={styles.input} />
                  {errorsUpd.name && <span style={styles.fieldError}>{errorsUpd.name.message}</span>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nhập Gmail của bạn.</label>
                  <input type="email" {...registerUpd("email")} style={styles.input} />
                  {errorsUpd.email && <span style={styles.fieldError}>{errorsUpd.email.message}</span>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Số điện thoại của bạn.</label>
                  <input type="text" {...registerUpd("phone")} style={styles.input} />
                  {errorsUpd.phone && <span style={styles.fieldError}>{errorsUpd.phone.message}</span>}
                </div>

                <button type="submit" disabled={loading} style={styles.submitBtn}>
                  {loading ? "Đang lưu..." : "Cập nhật"}
                </button>
              </form>
            </div>

            {modalSuccess === "updated" && (
              <div style={styles.modalOverlay}>
                <div className="modal-animate" style={styles.modalBox}>
                  <div style={styles.modalTitle}>Thông tin của bạn đã cập nhật thành công</div>
                  <span onClick={() => { setModalSuccess(null); setView("chat"); }} style={styles.modalActionLink}>
                    Ấn vào đây để tiếp tục chat
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW: CHAT ===================== */}
        {view === "chat" && (
          <div key="chat" className="view-animate" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
            <div style={styles.fixedHeaderArea}>
              <div style={styles.tabOuterBox}>
                <div
                  style={{
                    ...styles.slidingGlider,
                    transform: activeTab === "ai" ? "translateX(0%)" : "translateX(100%)",
                  }}
                />
                <button
                  onClick={() => setActiveTab("ai")}
                  style={{ ...styles.tabPill, color: activeTab === "ai" ? "#FFFFFF" : "#4B5563" }}
                >
                  Ai–Chat Corner
                </button>
                <button
                  onClick={() => setActiveTab("agent")}
                  style={{ ...styles.tabPill, color: activeTab === "agent" ? "#FFFFFF" : "#4B5563" }}
                >
                  Chat với nhân viên
                </button>
              </div>
            </div>

            <div key={activeTab} className="tab-content-animate" style={styles.chatArea}>
              <div style={styles.timeTag}>
                {chatStartTime.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i === 0 && <br />}
                  </React.Fragment>
                ))}
              </div>

              {currentMessages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className="chat-bubble-animate"
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={isUser ? styles.userBubble : styles.botBubble}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="chat-bubble-animate" style={{ display: "flex", justifyContent: "flex-start", marginBottom: "6px" }}>
                  <div style={{ ...styles.botBubble, display: "flex", gap: "4px", padding: "10px 14px" }}>
                    <span className="dot-flashing">●</span>
                    <span className="dot-flashing" style={{ animationDelay: "0.2s" }}>●</span>
                    <span className="dot-flashing" style={{ animationDelay: "0.4s" }}>●</span>
                  </div>
                </div>
              )}

              {/* HỆ THỐNG ĐÁNH GIÁ 5 SAO CSAT */}
              {showFeedback && (
                <div className="chat-bubble-animate" style={styles.feedbackCard}>
                  {feedbackSubmitted ? (
                    <div style={styles.feedbackThanks}>
                       Cảm ơn bạn đã đánh giá {ratingScore}/5 sao! IT-Global sẽ không ngừng cải thiện chất lượng dịch vụ.
                    </div>
                  ) : (
                    <>
                      <div style={styles.feedbackHeader}>
                        <span style={styles.feedbackTitle}>Bạn đánh giá cuộc trò chuyện này thế nào?</span>
                        <button onClick={() => setShowFeedback(false)} style={styles.feedbackDismiss} title="Đóng">
                          ✕
                        </button>
                      </div>

                      <div style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (hoverScore || ratingScore) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverScore(star)}
                              onMouseLeave={() => setHoverScore(0)}
                              onClick={() => handleSelectStar(star)}
                              style={{
                                ...styles.starBtn,
                                color: active ? "#F59E0B" : "#D1D5DB",
                                transform: active ? "scale(1.15)" : "scale(1)",
                              }}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>

                      {(hoverScore > 0 || ratingScore > 0) && (
                        <div style={styles.ratingLabelText}>
                          {RATING_LABELS[hoverScore || ratingScore]}
                        </div>
                      )}

                      {ratingScore > 0 && (
                        <div style={styles.feedbackDetails}>
                          <div style={styles.tagWrap}>
                            {(ratingScore >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS).map((tag) => {
                              const isSelected = selectedTags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => toggleFeedbackTag(tag)}
                                  style={{
                                    ...styles.tagChip,
                                    backgroundColor: isSelected ? "#EFF6FF" : "#F9FAFB",
                                    borderColor: isSelected ? "#1976D2" : "#E5E7EB",
                                    color: isSelected ? "#1976D2" : "#4B5563",
                                    fontWeight: isSelected ? "600" : "400",
                                  }}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>

                          <input
                            type="text"
                            placeholder="Góp ý thêm (không bắt buộc)..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            style={styles.feedbackCommentInput}
                          />

                          <button type="button" onClick={handleSubmitFeedback} style={styles.feedbackSubmitBtn}>
                            Gửi đánh giá
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {showSuggestions && (
              <div style={styles.suggestionBar}>
                {IT_GLOBAL_SUGGESTIONS.map((item, idx) => (
                  <button key={idx} onClick={() => sendMessage(item)} style={styles.suggestionChip}>
                    {item}
                  </button>
                ))}
              </div>
            )}

            <div style={styles.chatFooter}>
              <div style={styles.inputBoxContainer}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Nhập những gì bạn đang thắc mắc..."
                  style={styles.chatInput}
                />
                <button onClick={handleSend} style={styles.sendIconBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
              <span onClick={() => setView("update")} style={styles.updateLink}>
                Cập nhật thông tin của tài khoản
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  launcherBtn: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1000000,
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#1976D2",
    border: "none",
    boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease",
  },
  closeBtnRight: {
    position: "absolute",
    top: "10px",
    right: "16px",
    zIndex: 10,
    background: "transparent",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#4B5563",
    cursor: "pointer",
    padding: "4px",
    lineHeight: 1,
  },
  card: {
    position: "fixed",
    bottom: "90px",
    right: "20px",
    zIndex: 999999,
    width: "360px",
    height: "620px",
    backgroundColor: "#FAFAFA",
    borderRadius: "26px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
    transformOrigin: "bottom right",
    transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
  },
  fixedHeaderArea: {
    paddingTop: "26px",
    backgroundColor: "#FAFAFA",
    flexShrink: 0,
    zIndex: 2,
  },
  tabOuterBox: {
    margin: "6px 20px 6px",
    border: "1.5px solid #1F2937",
    borderRadius: "14px",
    padding: "3px",
    display: "flex",
    position: "relative",
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
  },
  slidingGlider: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "calc(50% - 3px)",
    height: "calc(100% - 6px)",
    backgroundColor: "#1976D2",
    borderRadius: "10px",
    transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 1,
    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.25)",
  },
  tabPill: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: "10px",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
    backgroundColor: "transparent",
    position: "relative",
    zIndex: 2,
    transition: "color 0.2s ease",
  },
  chatArea: {
    flex: 1,
    padding: "6px 18px",
    overflowY: "auto",
    minHeight: 0,
  },
  timeTag: {
    textAlign: "center",
    fontSize: "10.5px",
    color: "#4B5563",
    lineHeight: "1.4",
    margin: "4px 0 8px",
  },
  botBubble: {
    backgroundColor: "#1976D2",
    color: "#FFFFFF",
    borderRadius: "16px",
    padding: "8px 14px",
    fontSize: "13px",
    lineHeight: "1.35",
    maxWidth: "80%",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    boxShadow: "0 1px 3px rgba(25,118,210,0.12)",
  },
  userBubble: {
    backgroundColor: "#FFFFFF",
    color: "#1F2937",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    padding: "8px 14px",
    fontSize: "13px",
    lineHeight: "1.35",
    maxWidth: "80%",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
  suggestionBar: {
    padding: "4px 18px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexShrink: 0,
  },
  suggestionChip: {
    backgroundColor: "#E5E7EB",
    color: "#374151",
    border: "none",
    borderRadius: "14px",
    padding: "7px 14px",
    fontSize: "12px",
    textAlign: "center",
    cursor: "pointer",
  },
  chatFooter: {
    padding: "8px 18px 14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  inputBoxContainer: {
    width: "100%",
    minHeight: "70px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #D1D5DB",
    borderRadius: "18px",
    padding: "10px 12px",
    position: "relative",
    boxSizing: "border-box",
  },
  chatInput: {
    width: "100%",
    height: "50px",
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: "12.5px",
    color: "#1F2937",
    backgroundColor: "transparent",
    paddingRight: "28px",
    fontFamily: "inherit",
  },
  sendIconBtn: {
    position: "absolute",
    right: "10px",
    bottom: "10px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  updateLink: {
    fontSize: "11px",
    color: "#2563EB",
    textDecoration: "underline",
    cursor: "pointer",
  },
  formWrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: "14px",
  },
  topNoticeBanner: {
    backgroundColor: "#F9FAFB",
    padding: "12px 36px 12px 18px",
    borderBottom: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12.5px",
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#111827",
    textAlign: "center",
  },
  formContainer: {
    padding: "20px 22px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  formTitle: {
    fontSize: "13.5px",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "14px",
    textDecoration: "underline",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "11.5px",
    marginBottom: "12px",
    border: "1px solid #F87171",
  },
  fieldError: {
    color: "#DC2626",
    fontSize: "11px",
    marginTop: "2px",
  },
  formBody: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    fontSize: "12px",
    color: "#374151",
    fontWeight: "500",
  },
  input: {
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "12.5px",
    outline: "none",
  },
  switchAuthText: {
    fontSize: "11px",
    color: "#6B7280",
    textAlign: "right",
    marginTop: "2px",
  },
  linkText: {
    color: "#1976D2",
    textDecoration: "underline",
    cursor: "pointer",
  },
  submitBtn: {
    marginTop: "auto",
    padding: "10px",
    backgroundColor: "#E5E7EB",
    color: "#111827",
    border: "1px solid #9CA3AF",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: "14px",
    padding: "18px",
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  modalTitle: {
    fontSize: "13.5px",
    fontWeight: "bold",
    color: "#111827",
  },
  modalActionLink: {
    fontSize: "12px",
    color: "#1976D2",
    textDecoration: "underline",
    cursor: "pointer",
  },
  feedbackCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    padding: "12px 14px",
    margin: "10px 0",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  feedbackHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedbackTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#1F2937",
  },
  feedbackDismiss: {
    background: "transparent",
    border: "none",
    color: "#9CA3AF",
    fontSize: "12px",
    cursor: "pointer",
    padding: "2px",
  },
  starRow: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    padding: "2px 0",
  },
  starBtn: {
    background: "transparent",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    transition: "transform 0.15s ease, color 0.15s ease",
  },
  ratingLabelText: {
    textAlign: "center",
    fontSize: "11px",
    fontWeight: "600",
    color: "#D97706",
  },
  feedbackDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "2px",
  },
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    justifyContent: "center",
  },
  tagChip: {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "4px 9px",
    fontSize: "11px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  feedbackCommentInput: {
    width: "100%",
    padding: "7px 10px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "11.5px",
    outline: "none",
    boxSizing: "border-box",
  },
  feedbackSubmitBtn: {
    backgroundColor: "#1976D2",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "7px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  feedbackThanks: {
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "600",
    color: "#15803D",
    padding: "6px 0",
  },
};