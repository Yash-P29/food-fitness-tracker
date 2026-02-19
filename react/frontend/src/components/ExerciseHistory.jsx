import { useEffect, useState } from "react";
import { exerciseAPI } from "../services/exerciseApi";

export default function ExerciseHistory({ userId, date, onUpdate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    reps: "",
    weight_kg: "",
    duration_min: "",
  });

  // ---------- FETCH ----------
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await exerciseAPI.get("/workout/history", {
        params: { user_id: userId, date },
      });
      setItems(res.data);
    } catch (err) {
      console.error("Exercise history fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId, date]);

  // ---------- DELETE ----------
  const deleteItem = async (id) => {
    if (!confirm("Delete this exercise?")) return;

    await exerciseAPI.delete("/workout/delete", {
      params: { entry_id: id },
    });

    setItems((prev) => prev.filter((i) => i.id !== id));
    onUpdate?.();
  };

  // ---------- EDIT ----------
  const openEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      reps: item.type === "strength" ? item.reps ?? "" : "",
      weight_kg: item.type === "strength" ? item.weight_kg ?? "" : "",
      duration_min: item.type === "cardio" ? item.duration_min ?? "" : "",
    });
  };

  const saveEdit = async () => {
    await exerciseAPI.put("/workout/update", null, {
      params: {
        entry_id: editingItem.id,
        reps: editForm.reps || null,
        weight_kg: editForm.weight_kg || null,
        duration_min: editForm.duration_min || null,
      },
    });

    setEditingItem(null);
    fetchHistory();
    onUpdate?.();
  };

  return (
    <div>
      <h4 style={{ marginBottom: 12 }}>📜 Exercise History</h4>

      {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}
      {!loading && items.length === 0 && (
        <p style={{ opacity: 0.6 }}>No exercise logged</p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            background: "#121212",
            padding: "12px 14px",
            borderRadius: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            border: "1px solid #2a2a2a",
          }}
        >
          {/* LEFT */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {item.name}
              <span style={{ opacity: 0.5, marginLeft: 6 }}>
                · {item.type}
              </span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              🔥 {item.calories} kcal
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => openEdit(item)}
              style={iconBtn}
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              style={{ ...iconBtn, background: "#2a1a1a" }}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}

      {/* ---------- EDIT MODAL ---------- */}
      {editingItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#111",
              padding: 20,
              borderRadius: "16px 16px 0 0",
              width: "100%",
              maxWidth: 420,
            }}
          >
            <h3 style={{ marginBottom: 12 }}>
              Edit {editingItem.name}
            </h3>

            {editingItem.type === "strength" && (
              <>
                <input
                  placeholder="Reps"
                  value={editForm.reps}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reps: e.target.value })
                  }
                  style={input}
                />
                <input
                  placeholder="Weight (kg)"
                  value={editForm.weight_kg}
                  onChange={(e) =>
                    setEditForm({ ...editForm, weight_kg: e.target.value })
                  }
                  style={input}
                />
              </>
            )}

            {editingItem.type === "cardio" && (
              <input
                placeholder="Duration (min)"
                value={editForm.duration_min}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    duration_min: e.target.value,
                  })
                }
                style={input}
              />
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={saveEdit} style={primaryBtn}>
                Save
              </button>
              <button
                onClick={() => setEditingItem(null)}
                style={secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- STYLES ---------- */

const iconBtn = {
  background: "#1f1f1f",
  border: "none",
  borderRadius: 8,
  padding: "6px 8px",
  cursor: "pointer",
};

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "#fff",
  marginBottom: 8,
};

const primaryBtn = {
  flex: 1,
  background: "#8b5cf6",
  border: "none",
  padding: 10,
  borderRadius: 10,
  color: "#fff",
  fontWeight: 600,
};

const secondaryBtn = {
  flex: 1,
  background: "#222",
  border: "none",
  padding: 10,
  borderRadius: 10,
  color: "#aaa",
};
