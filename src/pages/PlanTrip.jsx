import React, { useState } from "react";
import ManualPlanner from "../components/ManualPlanner";
import AIPlanner from "../components/AutoPlanner";

function PlanTrip() {
  const [mode, setMode] = useState("manual");

  return (
    <div className="container py-4">
      <h2 className="mb-4">Lên Lộ Trình Du Lịch</h2>
      <div className="mb-3">
        <button onClick={() => setMode("manual")} className="btn btn-outline-primary me-2">
          Tự chọn (Thủ công)
        </button>
        <button onClick={() => setMode("ai")} className="btn btn-outline-success">
          Trợ lý AI (Tự động)
        </button>
      </div>

      {mode === "manual" ? <ManualPlanner /> : <AIPlanner />}
    </div>
  );
}

export default PlanTrip;
