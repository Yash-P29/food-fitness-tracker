export default function HistoryList({
  title,
  items,
  onDelete,
  emptyText,
}) {
  return (
    <div>
      <h4>{title}</h4>

      {items.length === 0 && (
        <p style={{ opacity: 0.6 }}>{emptyText}</p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
            padding: "6px 8px",
            background: "#111",
            borderRadius: 6,
          }}
        >
          <div>
            <div>{item.label}</div>
            <small style={{ opacity: 0.6 }}>
              {item.calories} kcal
            </small>
          </div>

          <button onClick={() => onDelete(item.id)}>❌</button>
        </div>
      ))}
    </div>
  );
}
