import { useEffect, useState } from "react";
import { foodAPI } from "../services/foodApi";
import { exerciseAPI } from "../services/exerciseApi";

export default function HistoryPanel({ userId, selectedDate }) {
  const [foodHistory, setFoodHistory] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchHistory() {
    try {
      setLoading(true);

      const [foodRes, workoutRes] = await Promise.all([
        foodAPI.get("/food/history", {
          params: { user_id: userId, date: selectedDate },
        }),
        exerciseAPI.get("/workout/history", {
          params: { user_id: userId, date: selectedDate },
        }),
      ]);

      setFoodHistory(foodRes.data || []);
      setWorkoutHistory(workoutRes.data || []);
    } catch (err) {
      console.error("History fetch failed", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function deleteFood(id) {
    if (!confirm("Delete this food entry?")) return;

    try {
      await foodAPI.delete("/food/delete", {
        params: { entry_id: id },
      });
      fetchHistory();
    } catch (err) {
      console.error("Food delete failed", err);
      alert("Failed to delete food");
    }
  }

  async function deleteWorkout(id) {
    if (!confirm("Delete this workout entry?")) return;

    try {
      await exerciseAPI.delete("/workout/delete", {
        params: { entry_id: id },
      });
      fetchHistory();
    } catch (err) {
      console.error("Workout delete failed", err);
      alert("Failed to delete workout");
    }
  }

  const sectionCard = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--border)",
    borderRadius: 18,
    padding: 14,
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "12px 12px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    marginBottom: 10,
  };

  const badgeStyle = (kind) => ({
    fontWeight: 950,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background:
      kind === "food"
        ? "rgba(34,197,94,0.10)"
        : "rgba(139,92,246,0.10)",
    color: kind === "food" ? "var(--green)" : "var(--purple)",
    fontSize: 12,
    whiteSpace: "nowrap",
  });

  const trashBtn = {
    border: "1px solid rgba(239,68,68,0.25)",
    background: "rgba(239,68,68,0.08)",
    padding: "10px 12px",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 950,
  };

  return (
    <div>
      {/* top row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.6 }}>{selectedDate}</div>

        <button
          onClick={fetchHistory}
          style={{
            background: "rgba(255,255,255,0.03)",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {/* FOOD */}
        <div style={sectionCard}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 950 }}>🍽 Food</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>
              {foodHistory.length} items
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {foodHistory.length === 0 && (
              <p style={{ opacity: 0.6 }}>No food logged.</p>
            )}

            {foodHistory.map((item) => (
              <div key={item.id} style={rowStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950 }}>{item.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>food entry</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={badgeStyle("food")}>{item.calories} kcal</div>
                  <button
                    onClick={() => deleteFood(item.id)}
                    style={trashBtn}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WORKOUT */}
        <div style={sectionCard}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 950 }}>🏋️ Workout</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>
              {workoutHistory.length} items
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {workoutHistory.length === 0 && (
              <p style={{ opacity: 0.6 }}>No workouts logged.</p>
            )}

            {workoutHistory.map((item) => (
              <div key={item.id} style={rowStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950 }}>{item.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {item.exercise_type || "exercise"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={badgeStyle("workout")}>{item.calories} kcal</div>
                  <button
                    onClick={() => deleteWorkout(item.id)}
                    style={trashBtn}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
