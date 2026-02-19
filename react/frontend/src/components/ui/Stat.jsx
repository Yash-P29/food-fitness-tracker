export default function Stat({ label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 18,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 12px 30px rgba(0,0,0,.25)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
        {label}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 950,
          color: color || "var(--text)",
          textShadow: "0 0 18px rgba(255,255,255,0.06)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
