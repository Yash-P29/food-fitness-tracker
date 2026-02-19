import { useEffect, useState, useCallback } from "react";

import { exerciseAPI } from "../services/exerciseApi";
import { foodAPI } from "../services/foodApi";

import Card from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import TodayPlan from "../components/TodayPlan";
import Toggle from "../components/ui/Toggle";

import FoodLogger from "../components/FoodLogger";
import ExerciseLogger from "../components/ExerciseLogger";
import Timeline from "../components/Timeline";
import HistoryPanel from "../components/HistoryPanel";
import BaseWorkout from "../components/BaseWorkout";

export default function Dashboard() {
  const USER_ID = 1;

  const [view, setView] = useState("exercise");
  const [loading, setLoading] = useState(false);

  // prefill
  const [prefillExercise, setPrefillExercise] = useState(null);

  // date
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // weekdays
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getWeekDates = () => {
    const today = new Date(selectedDate);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    return weekDays.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // stats
  const [streak, setStreak] = useState(0);
  const [burned, setBurned] = useState(0);
  const [eaten, setEaten] = useState(0);

  // goals
  const [showGoals, setShowGoals] = useState(false);
  const [burnGoal, setBurnGoal] = useState(600);
  const [eatGoal, setEatGoal] = useState(2200);
  const [goalProgress, setGoalProgress] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [streakRes, dailyExRes, foodRes, goalRes] = await Promise.all([
        exerciseAPI.get("/workout/streak", {
          params: { user_id: USER_ID },
        }),
        exerciseAPI.get("/workout/daily-summary", {
          params: { user_id: USER_ID, date: selectedDate },
        }),
        foodAPI.get("/food/daily", {
          params: { user_id: USER_ID },
        }),
        exerciseAPI.get("/goals/progress", {
          params: { user_id: USER_ID, date: selectedDate },
        }),
      ]);

      setStreak(streakRes.data.current_streak_days);
      setBurned(dailyExRes.data.calories_burned);
      setEaten(foodRes.data.calories_consumed);

      setGoalProgress(goalRes.data);
      setBurnGoal(goalRes.data.burn_goal);
      setEatGoal(goalRes.data.eat_goal);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const saveGoals = async () => {
    try {
      await exerciseAPI.post("/goals/update", null, {
        params: {
          user_id: USER_ID,
          burn_goal: burnGoal,
          eat_goal: eatGoal,
        },
      });

      fetchDashboard();
      alert("Goals saved!");
    } catch (err) {
      console.error("Goal save failed", err);
      alert("Failed to save goals");
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const weekDates = getWeekDates();

  return (
    <div style={{ padding: 22, minHeight: "100vh" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>FaF Dashboard</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Track workouts + food in one place
          </div>
        </div>

        <button
          onClick={fetchDashboard}
          style={{
            background: "var(--grad)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}

      {/* WEEKDAY TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {weekDates.map((d, i) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 950,
              background:
                selectedDate === d
                  ? "var(--grad-strong)"
                  : "rgba(255,255,255,0.03)",
              color: selectedDate === d ? "white" : "rgba(255,255,255,0.65)",
            }}
          >
            {weekDays[i]}
          </button>
        ))}
      </div>

      {/* DAY NAV */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <button onClick={prevDay}>◀</button>
        <div style={{ fontWeight: 950, opacity: 0.85 }}>{selectedDate}</div>
        <button onClick={nextDay}>▶</button>
      </div>

      {/* STATS */}
      <Card title="📊 Today Overview">
        <div style={{ display: "flex", gap: 12 }}>
          <Stat label="🔥 Streak" value={`${streak} days`} color="var(--orange)" />
          <Stat label="🍽 Eaten" value={`${eaten} kcal`} color="var(--green)" />
          <Stat label="🔥 Burned" value={`${burned} kcal`} color="var(--red)" />
          <Stat label="⚖ Net" value={`${eaten - burned}`} color="var(--blue)" />
        </div>
      </Card>

      {/* GOALS */}
      <div style={{ marginTop: 14 }}>
        <Card
          title="🎯 Daily Goals"
          right={
            <button
              onClick={() => setShowGoals(!showGoals)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                fontSize: 12,
              }}
            >
              {showGoals ? "Hide" : "Edit"}
            </button>
          }
        >
          {!showGoals && goalProgress && (
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              Burn: {goalProgress.burned}/{goalProgress.burn_goal} kcal • Eat:{" "}
              {goalProgress.eaten}/{goalProgress.eat_goal} kcal
            </div>
          )}

          {showGoals && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, opacity: 0.7 }}>🔥 Burn Goal</label>
              <input
                type="number"
                value={burnGoal}
                onChange={(e) => setBurnGoal(e.target.value)}
                style={{ marginBottom: 10 }}
              />

              <label style={{ fontSize: 12, opacity: 0.7 }}>🍽 Eat Goal</label>
              <input
                type="number"
                value={eatGoal}
                onChange={(e) => setEatGoal(e.target.value)}
                style={{ marginBottom: 10 }}
              />

              <button
                onClick={saveGoals}
                style={{
                  width: "100%",
                  background: "var(--grad)",
                }}
              >
                Save Goals
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* BASE WORKOUT */}
      <div style={{ marginTop: 14 }}>
        <Card title="📅 Base Workout">
          <BaseWorkout userId={USER_ID} />
        </Card>
      </div>

      {/* TOGGLE */}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
        <Toggle active={view === "exercise"} onClick={() => setView("exercise")}>
          Exercise
        </Toggle>
        <Toggle active={view === "food"} onClick={() => setView("food")}>
          Food
        </Toggle>
      </div>

      {/* HISTORY */}
      <div style={{ marginTop: 14 }}>
        <Card title="🧾 History">
          <HistoryPanel userId={USER_ID} selectedDate={selectedDate} />
        </Card>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <Card title={view === "food" ? "🍽 Log Food" : "🏋️ Log Exercise"}>
          {view === "food" ? (
            <FoodLogger userId={USER_ID} onLogged={fetchDashboard} />
          ) : (
            <ExerciseLogger
              userId={USER_ID}
              bodyWeight={70}
              prefill={prefillExercise}
              onLogged={() => {
                setPrefillExercise(null);
                fetchDashboard();
              }}
            />
          )}
        </Card>

        <Card title="📌 Today Plan">
          <TodayPlan
            userId={USER_ID}
            selectedDate={selectedDate}
            onPickExercise={(picked) => setPrefillExercise(picked)}
          />
        </Card>
      </div>

      {/* TIMELINE */}
      <div style={{ marginTop: 16 }}>
        <Card title="📜 Daily Timeline">
          <Timeline
            userId={USER_ID}
            date={selectedDate}
            onUpdate={fetchDashboard}
          />
        </Card>
      </div>
    </div>
  );
}
