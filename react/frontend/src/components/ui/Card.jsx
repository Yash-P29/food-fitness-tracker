export default function Card({ title, children, right }) {
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "var(--radius)",
        padding: 16,
        border: "1px solid var(--border)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 10px 35px rgba(0,0,0,.35)",
      }}
    >
      {(title || right) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          {title && (
            <div style={{ fontWeight: 950, fontSize: 14, opacity: 0.92 }}>
              {title}
            </div>
          )}
          {right}
        </div>
      )}

      {children}
    </div>
  );
}
