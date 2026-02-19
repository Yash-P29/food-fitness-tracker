import { useEffect, useState } from "react";
import { exerciseAPI } from "../services/exerciseApi";

export default function TodayPlan({ userId, selectedDate, onPickExercise }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [isRestDay, setIsRestDay] = useState(false);

  const fetchPlan = async () => {
    try {
      setLoading(true);

      const weekday = (() => {
        const d = new Date(selectedDate);
        const jsDay = d.getDay(); // Sun=0..Sat=6
        return (jsDay + 6) % 7; // Mon=0..Sun=6
      })();

      const res = await exerciseAPI.get("/base-workout", {
        params: { user_id: userId, weekday },
      });

      setItems(res.data.items || []);
      setIsRestDay(!!res.data.is_rest_day);
    } catch (err) {
      console.error("Today plan fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedDate]);

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 14 }}>📌 Today Plan</div>

        <button
          onClick={fetchPlan}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 900,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && <p style={{ opacity: 0.6, marginTop: 10 }}>Loading…</p>}

      {/* REST DAY */}
      {!loading && isRestDay && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            opacity: 0.85,
          }}
        >
          💤 Rest Day enabled for this weekday.
        </div>
      )}

      {/* EMPTY */}
      {!loading && !isRestDay && items.length === 0 && (
        <div style={{ marginTop: 12, opacity: 0.65, fontSize: 13 }}>
          No base workout set for this weekday.
        </div>
      )}

      {/* ITEMS */}
      {!loading &&
        !isRestDay &&
        items.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              onPickExercise?.({
                name: item.exercise_name,
                type: item.exercise_type,
              })
            }
            style={{
              width: "100%",
              textAlign: "left",
              marginTop: 12,
              padding: "14px 14px",
              borderRadius: 20,

              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",

              cursor: "pointer",
              transition: "0.18s ease",
            }}
          >
            <div style={{ fontWeight: 950 }}>
              {item.exercise_type === "cardio" ? "🏃" : "🏋️"}{" "}
              {item.exercise_name}
            </div>

            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
              Tap to prefill logger
            </div>
          </button>
        ))}
    </div>
  );
}
