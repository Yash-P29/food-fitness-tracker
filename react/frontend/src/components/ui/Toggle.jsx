export default function Toggle({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px 0",
        borderRadius: 999,
        fontWeight: 950,
        fontSize: 13,

        background: active ? "var(--grad)" : "rgba(255,255,255,0.03)",
        color: active ? "#050607" : "rgba(244,244,245,0.7)",
        border: "1px solid rgba(255,255,255,0.08)",

        cursor: "pointer",
        transition: "0.18s ease",
      }}
    >
      {children}
    </button>
  );
}
