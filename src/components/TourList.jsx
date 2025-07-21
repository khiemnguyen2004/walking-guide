import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext.jsx";
import tourStepApi from "../api/tourStepApi";
import placeApi from "../api/placeApi";


function TourList() {
  const { user } = useContext(AuthContext);
  const [myTours, setMyTours] = useState([]);
  const [tourSteps, setTourSteps] = useState({}); // { [tourId]: [steps] }
  const [places, setPlaces] = useState({}); // { [placeId]: placeObj }

  // Helper to convert HTML to plain text
  function htmlToPlainText(html) {
    if (!html) return "";
    // Create a temporary div element
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    // Get the text content (strips HTML tags)
    return tempDiv.textContent || tempDiv.innerText || "";
  }

  useEffect(() => {
    fetchMyTours();
    // eslint-disable-next-line
  }, []);

  const fetchMyTours = async () => {
    const res = await axios.get(`https://walkingguide.onrender.com/api/tours/user/${user.id}`);
    setMyTours(res.data);
    // Fetch steps for each tour
    for (const tour of res.data) {
      const stepsRes = await tourStepApi.getByTourId(tour.id);
      setTourSteps((prev) => ({ ...prev, [tour.id]: stepsRes.data }));
      // Fetch place info for each step
      for (const step of stepsRes.data) {
        if (!places[step.place_id]) {
          const placeRes = await placeApi.getById(step.place_id);
          setPlaces((prev) => ({ ...prev, [step.place_id]: placeRes.data }));
        }
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2>Tour của bạn</h2>
      {myTours.map((tour) => (
        <div key={tour.id} className="card shadow-lg border-0 rounded-4 p-4 mb-4 h-100" style={{ background: "rgba(255, 255, 255, 0.97)", minHeight: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
          <h1 className="text-3xl font-bold mb-4 text-gray-800 text-center">{tour.name}</h1>
          <div className="text-gray-600 mb-4 d-flex flex-wrap gap-4 justify-content-center" style={{ fontSize: "1.05rem" }}>
            <span>Chi phí: <b>{tour.total_cost?.toLocaleString()} VND</b></span>
            <span>Ngày tạo: {tour.created_at ? new Date(tour.created_at).toLocaleDateString() : "-"}</span>
          </div>
          <div className="prose prose-lg mb-4" style={{ color: "#223a5f", fontSize: "1.15rem", lineHeight: 1.7 }}>
            <div>{htmlToPlainText(tour.description)}</div>
          </div>
          {tourSteps[tour.id] && tourSteps[tour.id].length > 0 && (
            <div className="mt-3" style={{flex: 1}}>
              <h5 className="mb-3 text-primary" style={{fontWeight:700}}>Hành trình của bạn</h5>
              <ol className="mb-0" style={{fontSize:'1.08rem'}}>
                {tourSteps[tour.id].sort((a, b) => a.step_order - b.step_order).map((step, idx) => (
                  <li key={step.id} className="mb-2">
                    <b>{places[step.place_id]?.name || `Địa điểm #${step.place_id}`}</b> <span className="text-muted">(ở lại {step.stay_duration} phút)</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TourList;
