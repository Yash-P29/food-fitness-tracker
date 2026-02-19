import { useEffect, useState } from "react";
import { foodAPI } from "../services/foodApi";

export default function FoodHistory({ userId, date, onUpdate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [editGrams, setEditGrams] = useState("");

  // ---------- FETCH ----------
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await foodAPI.get("/food/history", {
        params: { user_id: userId, date },
      });
      setItems(res.data);
    } catch (err) {
      console.error("Food history fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId, date]);

  // ---------- DELETE ----------
  const deleteItem = async (id) => {
    if (!confirm("Delete this food entry?")) return;

    await foodAPI.delete("/food/delete", {
      params: { entry_id: id },
    });

    setItems((prev) => prev.filter((i) => i.id !== id));
    onUpdate?.();
  };

  // ---------- EDIT ----------
  const openEdit = (item) => {
    setEditingItem(item);
    setEditGrams(item.grams ?? "");
  };

  const saveEdit = async () => {
    await foodAPI.put("/food/update", null, {
      params: {
        entry_id: editingItem.id,
        grams: editGrams,
      },
    });

    setEditingItem(null);
    fetchHistory();
    onUpdate?.();
  };

  return (
    <div>
      <h4 style={{ marginBottom: 12 }}>📜 Food History</h4>

      {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}
      {!loading && items.length === 0 && (
        <p style={{ opacity: 0.6 }}>No food logged</p>
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
              <span style={{ opacity: 0.5, marginLeft: 6 }}>· food</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              🍽 {item.calories} kcal
            </div>
          </div>

          {/* ACTIONS */}
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

            <input
              placeholder="Grams"
              type="number"
              value={editGrams}
              onChange={(e) => setEditGrams(e.target.value)}
              style={input}
            />

            <div style={{ display: "flex", gap: 10 }}>
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
  marginBottom: 10,
};

const primaryBtn = {
  flex: 1,
  background: "#22c55e",
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
