import { useEffect, useState } from "react";
import { exerciseAPI } from "../services/exerciseApi";

export default function ExerciseLogger({ userId, bodyWeight, onLogged, prefill }) {
  const [type, setType] = useState("strength");

  const [exercise, setExercise] = useState("");

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  const [minutes, setMinutes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  // PREFILL
  useEffect(() => {
    if (!prefill) return;

    setExercise(prefill.name || "");
    setType(prefill.type || "strength");

    setSuggestions([]);
    setError("");
  }, [prefill]);

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSearching(true);

      const endpoint = type === "cardio"
        ? "/exercises/cardio"
        : "/exercises/strength";

      const res = await exerciseAPI.get(endpoint, { params: { q } });
      setSuggestions(res.data || []);
    } catch (err) {
      console.error("Autocomplete failed", err);
    } finally {
      setSearching(false);
    }
  };

  const logExercise = async () => {
    if (!exercise.trim()) {
      setError("Please enter an exercise name");
      return;
    }

    if (type === "strength" && (!weight || !reps)) {
      setError("Please enter weight and reps");
      return;
    }

    if (type === "cardio" && !minutes) {
      setError("Please enter duration");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload =
        type === "strength"
          ? {
              exercise_name: exercise,
              exercise_type: "strength",
              weight_kg: Number(weight),
              reps: Number(reps),
              set_number: 1,
            }
          : {
              exercise_name: exercise,
              exercise_type: "cardio",
              duration_min: Number(minutes),
              set_number: 1,
            };

      await exerciseAPI.post("/workout/log-set", payload, {
        params: {
          user_id: userId,
          body_weight: bodyWeight,
        },
      });

      setExercise("");
      setWeight("");
      setReps("");
      setMinutes("");
      setSuggestions([]);

      onLogged?.();
    } catch (err) {
      console.error(err);
      setError("Failed to log exercise. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = (active) => ({
    flex: 1,
    padding: "12px 0",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 13,
    background: active ? "var(--grad)" : "rgba(255,255,255,0.03)",
    color: active ? "#050607" : "rgba(244,244,245,0.7)",
    border: "1px solid rgba(255,255,255,0.08)",
  });

  return (
    <div>
      <div style={{ fontWeight: 950, marginBottom: 12 }}>🏋️ Log Exercise</div>

      {/* TOGGLE */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          onClick={() => setType("strength")}
          disabled={loading}
          style={toggleStyle(type === "strength")}
        >
          Strength
        </button>

        <button
          onClick={() => setType("cardio")}
          disabled={loading}
          style={toggleStyle(type === "cardio")}
        >
          Cardio
        </button>
      </div>

      {/* EXERCISE INPUT */}
      <input
        placeholder="Exercise name"
        value={exercise}
        onChange={(e) => {
          setExercise(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        disabled={loading}
        style={{ marginBottom: 10 }}
      />

      {/* AUTOCOMPLETE */}
      {suggestions.length > 0 && (
        <div
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            marginBottom: 12,
            maxHeight: 170,
            overflowY: "auto",
            boxShadow: "0 16px 45px rgba(0,0,0,0.55)",
          }}
        >
          {searching && (
            <div style={{ padding: 12, opacity: 0.65, fontSize: 12 }}>
              Searching…
            </div>
          )}

          {!searching &&
            suggestions.map((s) => (
              <div
                key={s}
                onClick={() => {
                  setExercise(s);
                  setSuggestions([]);
                }}
                style={{
                  padding: "12px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontWeight: 850,
                  opacity: 0.9,
                }}
              >
                {s}
              </div>
            ))}
        </div>
      )}

      {/* STRENGTH */}
      {type === "strength" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input
            placeholder="Weight (kg)"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder="Reps"
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {/* CARDIO */}
      {type === "cardio" && (
        <input
          placeholder="Duration (minutes)"
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          disabled={loading}
          style={{ marginBottom: 12 }}
        />
      )}

      {error && (
        <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>
          {error}
        </div>
      )}

      <button
        onClick={logExercise}
        disabled={loading}
        style={{
          width: "100%",
          background: "var(--grad)",
          color: "#050607",
          fontWeight: 950,
        }}
      >
        {loading ? "Logging…" : "Add Exercise"}
      </button>
    </div>
  );
}
