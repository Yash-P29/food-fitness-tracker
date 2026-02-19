import { useState } from "react";
import { exerciseAPI } from "../services/exerciseApi";

export default function CardioLogger({ userId, bodyWeight, onLogged }) {
  const [exercise, setExercise] = useState("");
  const [minutes, setMinutes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  // ---------- AUTOCOMPLETE ----------
  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSearching(true);

      const res = await exerciseAPI.get("/exercises/cardio", {
        params: { q },
      });

      setSuggestions(res.data);
    } catch (err) {
      console.error("Cardio autocomplete failed", err);
    } finally {
      setSearching(false);
    }
  };

  // ---------- LOG ----------
  const logCardio = async () => {
    if (!exercise.trim()) {
      setError("Please enter a cardio exercise");
      return;
    }

    if (!minutes) {
      setError("Please enter duration");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await exerciseAPI.post(
        "/cardio/log",
        {
          exercise,
          duration_minutes: Number(minutes),
        },
        {
          params: {
            user_id: userId,
            body_weight: bodyWeight,
          },
        }
      );

      setExercise("");
      setMinutes("");
      setSuggestions([]);

      onLogged?.();
    } catch (err) {
      setError("Cardio logging failed. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>🏃 Log Cardio</h3>

      {/* EXERCISE INPUT */}
      <input
        placeholder="Exercise (e.g. running)"
        value={exercise}
        onChange={(e) => {
          setExercise(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        disabled={loading}
        style={{ width: "100%", marginBottom: 6 }}
      />

      {/* AUTOCOMPLETE */}
      {suggestions.length > 0 && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            marginBottom: 8,
            maxHeight: 160,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s) => (
            <div
              key={s}
              onClick={() => {
                setExercise(s);
                setSuggestions([]);
              }}
              style={{
                padding: "6px 8px",
                cursor: "pointer",
                borderBottom: "1px solid #2a2a2a",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      {/* MINUTES */}
      <input
        placeholder="Minutes"
        type="number"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        disabled={loading}
        style={{ width: "100%", marginBottom: 8 }}
      />

      {/* ERROR */}
      {error && (
        <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>
          {error}
        </div>
      )}

      {/* SUBMIT */}
      <button
        onClick={logCardio}
        disabled={loading}
        style={{
          background: "#2563eb",
          border: "none",
          padding: "8px 14px",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Adding…" : "Add Cardio"}
      </button>
    </div>
  );
}
