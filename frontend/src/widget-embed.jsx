import React from "react";
import ReactDOM from "react-dom/client";
import ChatWidget from "./ChatWidget.jsx";
import "./index.css";

const root = document.createElement("div");
root.id = "itglobal-chatbot-root";
root.style.position = "relative";
root.style.zIndex = "999999";
document.body.appendChild(root);

ReactDOM.createRoot(root).render(<ChatWidget />);