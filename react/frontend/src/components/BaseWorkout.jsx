import { useEffect, useMemo, useRef, useState } from "react";
import { exerciseAPI } from "../services/exerciseApi";

export default function BaseWorkout({ userId }) {
  const weekDays = useMemo(
    () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    []
  );

  const [weekday, setWeekday] = useState(0);
  const [items, setItems] = useState([]);
  const [isRestDay, setIsRestDay] = useState(false);

  // input
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseType, setExerciseType] = useState("strength");

  // autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const [loading, setLoading] = useState(false);

  const boxRef = useRef(null);

  // -----------------------------
  // FETCH BASE WORKOUT
  // -----------------------------
  const fetchBaseWorkout = async () => {
    try {
      setLoading(true);

      const res = await exerciseAPI.get("/base-workout", {
        params: { user_id: userId, weekday },
      });

      setItems(res.data.items || []);
      setIsRestDay(!!res.data.is_rest_day);
    } catch (err) {
      console.error("Base workout fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseWorkout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday]);

  // -----------------------------
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // -----------------------------
  useEffect(() => {
    const onClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setHighlightIndex(-1);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // -----------------------------
  // AUTOCOMPLETE SEARCH
  // -----------------------------
  const searchExercises = async (q) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSearching(true);

      const [strengthRes, cardioRes] = await Promise.all([
        exerciseAPI.get("/exercises/strength", { params: { q } }),
        exerciseAPI.get("/exercises/cardio", { params: { q } }),
      ]);

      const strength = (strengthRes.data || []).map((name) => ({
        name,
        type: "strength",
      }));

      const cardio = (cardioRes.data || []).map((name) => ({
        name,
        type: "cardio",
      }));

      const merged = [...strength, ...cardio].slice(0, 10);

      setSuggestions(merged);
      setHighlightIndex(merged.length > 0 ? 0 : -1);
    } catch (err) {
      console.error("Exercise search failed", err);
    } finally {
      setSearching(false);
    }
  };

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      searchExercises(exerciseName);
    }, 220);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseName]);

  const pickSuggestion = (s) => {
    setExerciseName(s.name);
    setExerciseType(s.type);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightIndex(-1);
  };

  // -----------------------------
  // ADD EXERCISE
  // -----------------------------
  const addExercise = async () => {
    const name = exerciseName.trim();
    if (!name) return;

    try {
      await exerciseAPI.post("/base-workout/add", null, {
        params: {
          user_id: userId,
          weekday,
          exercise_name: name.toLowerCase(),
          exercise_type: exerciseType,
          order_index: items.length,
        },
      });

      setExerciseName("");
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightIndex(-1);

      fetchBaseWorkout();
    } catch (err) {
      console.error("Base workout add failed", err);
      alert("Failed to add exercise");
    }
  };

  // -----------------------------
  // DELETE EXERCISE
  // -----------------------------
  const deleteExercise = async (id) => {
    if (!confirm("Remove this exercise from base plan?")) return;

    try {
      await exerciseAPI.delete("/base-workout/delete", {
        params: { item_id: id },
      });

      fetchBaseWorkout();
    } catch (err) {
      console.error("Base workout delete failed", err);
      alert("Failed to delete exercise");
    }
  };

  // -----------------------------
  // REST DAY
  // -----------------------------
  const toggleRestDay = async () => {
    try {
      const newValue = !isRestDay;

      await exerciseAPI.post("/base-workout/rest-day", null, {
        params: {
          user_id: userId,
          weekday,
          is_rest_day: newValue,
        },
      });

      setIsRestDay(newValue);

      if (newValue) {
        setExerciseName("");
        setSuggestions([]);
        setShowSuggestions(false);
        setHighlightIndex(-1);
      }
    } catch (err) {
      console.error("Rest day update failed", err);
      alert("Failed to update rest day");
    }
  };

  // -----------------------------
  // KEYBOARD SUPPORT
  // -----------------------------
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") addExercise();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0) pickSuggestion(suggestions[highlightIndex]);
      else addExercise();
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightIndex(-1);
    }
  };

  const activeTabStyle = {
    background: "var(--grad)",
    color: "#050607",
    border: "1px solid rgba(255,255,255,0.10)",
  };

  const tabStyle = {
    background: "rgba(255,255,255,0.03)",
    color: "rgba(244,244,245,0.65)",
    border: "1px solid rgba(255,255,255,0.07)",
  };

  return (
    <div ref={boxRef}>
      {/* Weekday Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {weekDays.map((d, i) => (
          <button
            key={d}
            onClick={() => setWeekday(i)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 950,
              cursor: "pointer",
              ...(weekday === i ? activeTabStyle : tabStyle),
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Rest Day Toggle */}
      <button
        onClick={toggleRestDay}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          cursor: "pointer",
          fontWeight: 950,
          background: isRestDay
            ? "linear-gradient(90deg, rgba(34,197,94,1), rgba(16,185,129,0.9))"
            : "rgba(255,255,255,0.03)",
          color: isRestDay ? "#050607" : "rgba(244,244,245,0.8)",
          marginBottom: 14,
        }}
      >
        {isRestDay ? "✅ Rest Day Enabled" : "💤 Mark as Rest Day"}
      </button>

      {/* Add Exercise */}
      {!isRestDay && (
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              placeholder="Search exercise (lat pulldown, running...)"
              value={exerciseName}
              onChange={(e) => {
                setExerciseName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                minWidth: 0,
              }}
            />

            {/* ✅ CLEAN SELECT (NO WHITE BOX) */}
            <select
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
              style={{
                width: 140,
                flexShrink: 0,
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
            </select>

            <button
              onClick={addExercise}
              style={{
                flexShrink: 0,
                background: "var(--grad)",
                border: "1px solid rgba(255,255,255,0.10)",
                padding: "12px 18px",
                color: "#050607",
              }}
            >
              Add
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div
              style={{
                position: "absolute",
                top: 58,
                left: 0,
                right: 0,
                background: "rgba(15,15,15,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                overflow: "hidden",
                zIndex: 50,
                boxShadow: "0 16px 50px rgba(0,0,0,0.55)",
              }}
            >
              {searching && (
                <div style={{ padding: 12, opacity: 0.7, fontSize: 12 }}>
                  Searching…
                </div>
              )}

              {!searching &&
                suggestions.length === 0 &&
                exerciseName.trim().length >= 2 && (
                  <div style={{ padding: 12, opacity: 0.7, fontSize: 12 }}>
                    No results
                  </div>
                )}

              {!searching &&
                suggestions.map((s, idx) => (
                  <div
                    key={`${s.type}-${s.name}`}
                    onClick={() => pickSuggestion(s)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    style={{
                      padding: "12px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background:
                        idx === highlightIndex
                          ? "rgba(255,255,255,0.06)"
                          : "transparent",
                    }}
                  >
                    <div style={{ fontWeight: 850 }}>
                      {s.name}
                      <span style={{ opacity: 0.55, marginLeft: 8 }}>
                        ({s.type})
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* helper */}
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.55 }}>
            Tip: press <b>Enter</b> to add. Use <b>↑ ↓</b> to pick.
          </div>
        </div>
      )}

      {/* List */}
      {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}

      {!loading && isRestDay && (
        <div
          style={{
            padding: 14,
            borderRadius: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            opacity: 0.8,
          }}
        >
          💤 This weekday is marked as a Rest Day.
        </div>
      )}

      {!loading && !isRestDay && items.length === 0 && (
        <p style={{ opacity: 0.7 }}>No exercises added for this day.</p>
      )}

      {!isRestDay &&
        items.map((item) => (
          <div
            key={item.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              padding: "12px 14px",
              borderRadius: 18,
              marginBottom: 10,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 950 }}>
                {item.exercise_type === "cardio" ? "🏃" : "🏋️"}{" "}
                {item.exercise_name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>
                {item.exercise_type}
              </div>
            </div>

            <button
              onClick={() => deleteExercise(item.id)}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                padding: "10px 12px",
                borderRadius: 14,
                cursor: "pointer",
                color: "rgba(244,244,245,0.7)",
                fontWeight: 950,
              }}
            >
              ✕
            </button>
          </div>
        ))}
    </div>
  );
}
