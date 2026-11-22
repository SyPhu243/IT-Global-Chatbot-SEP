import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Hoặc đường dẫn tới component ChatWidget của bạn (vd: ./components/ChatWidget.jsx)
import "./index.css"; // Bật dòng này nếu widget của bạn dùng Tailwind hoặc CSS toàn cục

const root = document.createElement("div");
root.id = "itglobal-chatbot-root";
root.style.position = "relative";
root.style.zIndex = "999999"; // Đảm bảo nổi trên cùng, không bị header/footer của IT-Global đè
document.body.appendChild(root);

ReactDOM.createRoot(root).render(<App />);