import ChatWidget from "./ChatWidget";

export default function App() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f2f4f7",
      }}
    >
      <ChatWidget />
    </div>
  );
}