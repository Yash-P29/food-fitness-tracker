import { useEffect, useState } from "react";
import { exerciseAPI } from "../services/exerciseApi";
import { foodAPI } from "../services/foodApi";

export default function Timeline({ userId, date, onUpdate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");

  // ---------- FETCH ----------
  const fetchTimeline = async () => {
    try {
      setLoading(true);

      const [exRes, foodRes] = await Promise.all([
        exerciseAPI.get("/workout/history", {
          params: { user_id: userId, date },
        }),
        foodAPI.get("/food/history", {
          params: { user_id: userId, date },
        }),
      ]);

      const merged = [...(exRes.data || []), ...(foodRes.data || [])].sort(
        (a, b) => b.id - a.id
      );

      setItems(merged);
    } catch (err) {
      console.error("Timeline fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, date]);

  // ---------- DELETE ----------
  const deleteItem = async (item) => {
    if (!confirm("Delete this entry?")) return;

    try {
      const api = item.type === "food" ? foodAPI : exerciseAPI;
      const endpoint = item.type === "food" ? "/food/delete" : "/workout/delete";

      await api.delete(endpoint, {
        params: { entry_id: item.id },
      });

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onUpdate?.();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete");
    }
  };

  // ---------- SAVE EDIT ----------
  const saveEdit = async (item) => {
    if (!editValue.trim()) return;

    try {
      if (item.type === "food") {
        await foodAPI.put("/food/update", null, {
          params: {
            entry_id: item.id,
            grams: Number(editValue),
          },
        });
      } else {
        await exerciseAPI.put("/workout/update", null, {
          params: {
            entry_id: item.id,
            reps: Number(editValue),
          },
        });
      }

      setEditing(null);
      setEditValue("");

      fetchTimeline();
      onUpdate?.();
    } catch (err) {
      console.error("Edit save failed", err);
      alert("Failed to update");
    }
  };

  // ---------- STYLES ----------
  const rowStyle = {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    marginBottom: 12,
  };

  const badgeStyle = {
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    fontSize: 12,
    opacity: 0.9,
    whiteSpace: "nowrap",
  };

  const smallBtn = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    fontWeight: 900,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 16 }}>📜 Daily Timeline</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{date}</div>
        </div>

        <button onClick={fetchTimeline} style={smallBtn}>
          ↻
        </button>
      </div>

      {loading && <p style={{ opacity: 0.6, marginTop: 12 }}>Loading…</p>}

      {!loading && items.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 12 }}>Nothing logged.</p>
      )}

      <div style={{ marginTop: 14 }}>
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`} style={rowStyle}>
            {/* HEADER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 950, fontSize: 14 }}>
                  {item.type === "food" ? "🍽" : "🏋️"} {item.name}
                </div>

                <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>
                  {item.type === "food"
                    ? "Food entry"
                    : item.exercise_type || "Exercise entry"}
                </div>
              </div>

              <div style={badgeStyle}>🔥 {item.calories} kcal</div>
            </div>

            {/* BODY */}
            {editing === item.id && (
              <div style={{ marginTop: 12 }}>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={item.type === "food" ? "New grams" : "New reps"}
                />
              </div>
            )}

            {/* ACTIONS */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 12,
              }}
            >
              {editing === item.id ? (
                <>
                  <button
                    onClick={() => saveEdit(item)}
                    style={{
                      ...smallBtn,
                      flex: 1,
                      background: "var(--grad)",
                      color: "#050507",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setEditing(null);
                      setEditValue("");
                    }}
                    style={{ ...smallBtn, flex: 1 }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditing(item.id);
                      setEditValue("");
                    }}
                    style={{ ...smallBtn, flex: 1 }}
                  >
                    ✏ Edit
                  </button>

                  <button
                    onClick={() => deleteItem(item)}
                    style={{
                      ...smallBtn,
                      flex: 1,
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "rgba(239,68,68,0.9)",
                    }}
                  >
                    🗑 Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
