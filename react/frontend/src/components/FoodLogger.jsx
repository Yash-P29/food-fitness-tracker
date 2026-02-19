import { useState } from "react";
import { foodAPI } from "../services/foodApi";

export default function FoodLogger({ userId, onLogged }) {
  const [food, setFood] = useState("");
  const [grams, setGrams] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSearching(true);

      const res = await foodAPI.get("/food/search", {
        params: { q },
      });

      setSuggestions(res.data || []);
    } catch (err) {
      console.error("Food autocomplete failed", err);
    } finally {
      setSearching(false);
    }
  };

  const logFood = async () => {
    if (!food.trim() || !grams) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await foodAPI.post(
        "/food/log",
        {
          food_name: food,
          grams: Number(grams),
        },
        { params: { user_id: userId } }
      );

      setFood("");
      setGrams("");
      setSuggestions([]);

      onLogged?.();
    } catch (err) {
      console.error(err);
      setError("Food logging failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ fontWeight: 950, marginBottom: 12 }}>🍽 Log Food</div>

      <input
        placeholder="Food name"
        value={food}
        onChange={(e) => {
          setFood(e.target.value);
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
                  setFood(s);
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

      <input
        placeholder="Grams"
        type="number"
        value={grams}
        onChange={(e) => setGrams(e.target.value)}
        disabled={loading}
        style={{ marginBottom: 12 }}
      />

      {error && (
        <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>
          {error}
        </div>
      )}

      <button
        onClick={logFood}
        disabled={loading}
        style={{
          width: "100%",
          background: "var(--grad)",
          color: "#050607",
          fontWeight: 950,
        }}
      >
        {loading ? "Adding…" : "Add Food"}
      </button>
    </div>
  );
}
