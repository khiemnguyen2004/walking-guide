import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext.jsx";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import CityAutocomplete from "./CityAutocomplete.jsx";
import LocationAutocomplete from "./LocationAutocomplete.jsx";
import placeApi from "../api/placeApi.js";
import "../css/luxury-home.css";
import { useNavigate, Link } from "react-router-dom";

const BASE_URL = "https://walkingguide.onrender.com";

const AutoPlanner = ({ noLayout }) => {
  const [interests, setInterests] = useState("");
  const [total_cost, setTotal_cost] = useState("");
  const [tourData, setTourData] = useState(null);
  const [error, setError] = useState("");
  const [tourName, setTourName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTour, setCreatedTour] = useState(null);
  const { user, refreshNotifications } = useContext(AuthContext);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [start_time, setStart_time] = useState("");
  const [end_time, setEnd_time] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedCity, setSelectedCity] = useState("");
  const [cityPlaces, setCityPlaces] = useState([]);
  const [showCityPlaces, setShowCityPlaces] = useState(false);
  const [isLoadingCityPlaces, setIsLoadingCityPlaces] = useState(false);
  const [showCreatePlaceModal, setShowCreatePlaceModal] = useState(false);
  const [newPlaceData, setNewPlaceData] = useState({
    name: "",
    description: "",
    address: "",
    opening_hours: "",
    service: ""
  });
  const [startFrom, setStartFrom] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    axios.get("https://walkingguide.onrender.com/api/tags").then(res => setTags(res.data));
  }, []);

  useEffect(() => {
    if (!start_time) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setStart_time(todayStr);
    }
    if (!end_time) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setEnd_time(todayStr);
    }
    // eslint-disable-next-line
  }, []);

  const searchPlacesByCity = async (city) => {
    if (!city) return;
    
    setIsLoadingCityPlaces(true);
    try {
      const response = await placeApi.searchByCity(city);
      setCityPlaces(response.data);
      setShowCityPlaces(true);
    } catch (error) {
      console.error('Error searching places by city:', error);
      setCityPlaces([]);
    } finally {
      setIsLoadingCityPlaces(false);
    }
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    if (city) {
      searchPlacesByCity(city);
    } else {
      setCityPlaces([]);
      setShowCityPlaces(false);
    }
  };

  const createPlaceForCity = async () => {
    if (!selectedCity || !newPlaceData.name || !newPlaceData.description) {
      setAlertMessage('Vui lòng nhập đầy đủ thông tin cho địa điểm mới!');
      setShowAlert(true);
      return;
    }

    try {
      // Get coordinates for the city using backend geocoding
      const geocodeResponse = await fetch(
        `${BASE_URL}/api/geocoding/coordinates?q=${encodeURIComponent(selectedCity)}&limit=1`
      );
      const geocodeData = await geocodeResponse.json();
      
      let latitude = 10.8231; // Default to Ho Chi Minh City
      let longitude = 106.6297;
      
      if (geocodeData.success && geocodeData.data) {
        latitude = geocodeData.data.latitude;
        longitude = geocodeData.data.longitude;
      }

      const placeData = {
        name: newPlaceData.name,
        description: newPlaceData.description,
        latitude: latitude,
        longitude: longitude,
        city: selectedCity,
        address: newPlaceData.address,
        opening_hours: newPlaceData.opening_hours,
        service: newPlaceData.service,
        image_url: "" // Default empty image
      };

      await placeApi.create(placeData);
      
      // Refresh city places
      await searchPlacesByCity(selectedCity);
      
      // Reset form
      setNewPlaceData({
        name: "",
        description: "",
        address: "",
        opening_hours: "",
        service: ""
      });
      setShowCreatePlaceModal(false);
      
      setAlertMessage('Đã tạo địa điểm mới thành công!');
      setShowAlert(true);
    } catch (error) {
      console.error('Error creating place:', error);
      setAlertMessage('Có lỗi xảy ra khi tạo địa điểm mới!');
      setShowAlert(true);
    }
  };

  const generateTour = async () => {
    if (!user?.id || isNaN(Number(user.id))) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // Validate that at least one filter is provided
    if (!selectedCity && selectedTags.length === 0 && !interests.trim()) {
      setError("Vui lòng chọn ít nhất một thành phố hoặc thẻ địa điểm!");
      return;
    }

    try {
      setError("");
      setIsGenerating(true);
      
      const requestData = {
        interests: interests.split(",").map(i => i.trim()).filter(Boolean),
        total_cost: total_cost ? parseFloat(total_cost) : 0,
        user_id: Number(user.id),
        tag_ids: selectedTags.map(Number),
        start_time: start_time,
        end_time: end_time,
        city: selectedCity
      };

      // Log the request for debugging
      console.log("Generating tour with:", {
        city: selectedCity,
        tags: selectedTags,
        interests: requestData.interests
      });

      const res = await axios.post("https://walkingguide.onrender.com/api/ai/generate-tour", requestData);
      setTourData(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Không thể tạo tour. Hãy kiểm tra lại dữ liệu.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTour = async () => {
    if (!tourData) return;
    setIsSaving(true);
    try {
      // Calculate days based on start and end dates
      let totalDays = 1;
      if (start_time && end_time) {
        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays = Math.max(1, diffDays);
      } else {
        totalDays = parseInt(days) || 1;
      }
      // Distribute steps across days evenly
      const stepsPerDay = Math.ceil(tourData.steps.length / totalDays);

      // Find the first place with an image for the tour cover
      let tourImageUrl = "";
      const firstStepWithImage = tourData.steps.find(s => s.place && s.place.image_url);
      if (firstStepWithImage) {
        tourImageUrl = firstStepWithImage.place.image_url.startsWith('http')
          ? firstStepWithImage.place.image_url
          : `${BASE_URL}${firstStepWithImage.place.image_url}`;
      }

      const response = await axios.post(`${BASE_URL}/api/tours`, {
        name: tourName, // Always use the tour name input
        description: tourData.tour.description,
        image_url: tourImageUrl, // set cover image
        user_id: user.id,
        total_cost: total_cost ? parseFloat(total_cost) : 0,
        steps: tourData.steps.map((step, i) => ({
          place_id: step.place_id,
          step_order: i + 1,
          stay_duration: step.stay_duration,
          start_time: step.start_time || null,
          end_time: step.end_time || null,
          day: Math.floor(i / stepsPerDay) + 1 // Distribute evenly across calculated days
        })),
        start_time: start_time,
        end_time: end_time,
        start_from: startFrom,
      });
      
      setCreatedTour(response.data.tour);
      setShowSuccessModal(true);
      setTourData(null);
      setTourName("");
      
      // Trigger notification refresh to update unread count
      refreshNotifications();
      // Add: redirect to /my-tours after a short delay or after closing modal
      setTimeout(() => navigate('/my-tours'), 1200);
    } catch (error) {
      console.error('Error saving tour:', error);
      setAlertMessage('Lỗi khi lưu tour vào hệ thống!');
      setShowAlert(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to generate a friendly AI-like description
  function generateAIDescription(interests, steps) {
    if (!interests || !steps || steps.length === 0) return "";
    const interestArr = interests.split(",").map(i => i.trim()).filter(Boolean);
    const placeNames = steps.map(s => s.place?.name).filter(Boolean);
    if (interestArr.length === 0 || placeNames.length === 0) return "";
    let desc = "";
    if (interestArr.length === 1) {
      desc += `Nếu bạn yêu thích ${interestArr[0]}, bạn không thể bỏ qua những địa điểm như ${placeNames.slice(0,2).join(", ")}`;
    } else {
      desc += `Dựa trên sở thích của bạn (${interestArr.join(", ")}), các địa điểm nổi bật gồm: ${placeNames.slice(0,3).join(", ")}`;
    }
    return desc;
  }

  // Helper to convert HTML to plain text
  function htmlToPlainText(html) {
    if (!html) return "";
    // Create a temporary div element
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    // Get the text content (strips HTML tags)
    return tempDiv.textContent || tempDiv.innerText || "";
  }

  // Helper to group steps by day
  function groupStepsByDay(steps) {
    const grouped = {};
    steps.forEach(step => {
      const day = step.day || 1;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(step);
    });
    return grouped;
  }

  const defaultDateTime = new Date().toISOString().slice(0, 16);

  const [steps, setSteps] = useState([
    {
      place: "",
      start_time: defaultDateTime,
      end_time: defaultDateTime,
    }
  ]);

  const updateStep = (idx, newStep) => {
    setSteps(steps => steps.map((s, i) => (i === idx ? newStep : s)));
  };

  const addStep = () => {
    setSteps(steps => [
      ...steps,
      {
        place: "",
        start_time: defaultDateTime,
        end_time: defaultDateTime,
      }
    ]);
  };

  const removeStep = idx => {
    setSteps(steps => steps.filter((_, i) => i !== idx));
  };

  if (!user) {
    const content = (
      <div className="container py-4">
        <h2>Tạo lộ trình tự động</h2>
        <div className="alert alert-warning mt-3">Bạn cần đăng nhập để sử dụng chức năng này.</div>
      </div>
    );
    if (noLayout) return content;
    return (
      <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
        <Header />
        <main className="container py-4 flex-grow-1">{content}</main>
        <Footer />
      </div>
    );
  }

  const mainContent = (
    <div className="luxury-planner-container">
      
      {/* Alert Component */}
      {showAlert && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {alertMessage}
          <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
        </div>
      )}
      
      {/* Tour Configuration */}
      <div className="luxury-card mb-4">
        <div className="luxury-card-body">
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label fw-bold">Tên chuyến đi <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={tourName}
                onChange={e => setTourName(e.target.value)}
                placeholder="Ví dụ: Hành trình Hà Nội - Sapa 4 ngày 3 đêm"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Khởi hành từ</label>
              <LocationAutocomplete
                value={startFrom}
                onChange={setStartFrom}
                placeholder="Nhập điểm khởi hành"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Thành phố muốn đi</label>
              <CityAutocomplete
                value={selectedCity}
                onChange={handleCityChange}
                placeholder="Chọn thành phố..."
              />
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-calendar-event me-2 text-primary"></i>
                Ngày bắt đầu
              </label>
              <div className="position-relative">
                <input
                  type="date"
                  className="form-control"
                  value={start_time}
                  onChange={e => setStart_time(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                {start_time && (
                  <div className="form-text mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    {new Date(start_time).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-calendar-check me-2 text-primary"></i>
                Ngày kết thúc
              </label>
              <div className="position-relative">
                <input
                  type="date"
                  className="form-control"
                  value={end_time}
                  onChange={e => setEnd_time(e.target.value)}
                  min={start_time || new Date().toISOString().split('T')[0]}
                  disabled={!start_time}
                />
                {end_time && (
                  <div className="form-text mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    {new Date(end_time).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} ({(() => {
                      const startDate = new Date(start_time);
                      const endDate = new Date(end_time);
                      const diffTime = Math.abs(endDate - startDate);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return Math.max(1, diffDays);
                    })()} ngày)
                  </div>
                )}
                {!start_time && (
                  <div className="form-text mt-1">
                    <i className="bi bi-exclamation-triangle me-1 text-warning"></i>
                    Vui lòng chọn ngày bắt đầu trước
                  </div>
                )}
              </div>
            </div>
                        <div className="col-md-6">
              <label className="form-label fw-bold">Bạn thích đi đâu?</label>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select"
                    value=""
                    onChange={e => {
                      const tagId = e.target.value;
                      if (tagId && !selectedTags.includes(tagId)) {
                        setSelectedTags([...selectedTags, tagId]);
                      }
                    }}>
                    <option value="">Có thể bạn muốn khám phá...</option>
                    {tags.filter(tag => !selectedTags.includes(String(tag.id))).map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-2">
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => String(t.id) === String(tagId));
                    if (!tag) return null;
                    return (
                      <span key={tag.id} className="badge bg-primary me-2 mb-1" style={{fontSize: '1em'}}>
                        {tag.name}
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-white ms-1 p-0 text-decoration-none"
                          style={{fontSize: '1em'}}
                          title="Xóa thẻ"
                          onClick={() => setSelectedTags(selectedTags.filter(id => id !== String(tag.id)))}
                        >×</button>
                      </span>
                    );
                  })}
                </div>
              </div>          
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Ngân sách (VNĐ)</label>
              <input
                type="text"
                placeholder="Nhập ngân sách"
                value={total_cost}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  setTotal_cost(rawValue);
                }}
                className="form-control"
              />
              {total_cost && (
                <div className="form-text">
                  <i className="bi bi-info-circle me-1"></i>
                  Ngân sách: {parseInt(total_cost).toLocaleString('vi-VN')} VNĐ
                </div>
              )}
              {/* Price Suggestions - only show when input is short and not a complete price */}
              {total_cost && total_cost.length > 0 && total_cost.length <= 3 && !total_cost.endsWith('000') && (
                <div className="mt-2">
                  <small className="text-muted">Gợi ý:</small>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const inputNum = total_cost.replace(/\D/g, '');
                      const suggestions = [
                        { value: inputNum + '000', label: inputNum + '.000 VNĐ' },
                        { value: inputNum + '0000', label: inputNum + '0.000 VNĐ' },
                        { value: inputNum + '00000', label: inputNum + '00.000 VNĐ' },
                        { value: inputNum + '000000', label: inputNum + '.000.000 VNĐ' },
                        { value: inputNum + '0000000', label: inputNum + '0.000.000 VNĐ' },
                      ].filter(s => s.value !== total_cost);
                      
                      return suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => setTotal_cost(suggestion.value)}
                        >
                          {suggestion.label}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* City Places Section */}
          {showCityPlaces && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <i className="bi bi-geo-alt me-2 text-primary"></i>
                  Địa điểm tại {selectedCity}
                </h5>
                {/* <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowCreatePlaceModal(true)}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Thêm địa điểm mới
                </button> */}
              </div>
              
              {isLoadingCityPlaces ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Đang tìm địa điểm...</p>
                </div>
              ) : cityPlaces.length > 0 ? (
                <div className="row g-3">
                  {cityPlaces.map((place) => (
                    <div key={place.id} className="col-md-6 col-lg-4">
                      <div className="card h-100 border-0 shadow-sm">
                        {place.image_url && (
                          <img
                            src={place.image_url.startsWith('http') ? place.image_url : `${BASE_URL}${place.image_url}`}
                            className="card-img-top"
                            alt={place.name}
                            style={{ height: '150px', objectFit: 'cover' }}
                          />
                        )}
                        <div className="card-body">
                          <h6 className="card-title text-primary">{place.name}</h6>
                          <p className="card-text small text-muted">
                            {htmlToPlainText(place.description).substring(0, 100)}...
                          </p>
                          {place.address && (
                            <p className="card-text small">
                              <i className="bi bi-geo-alt me-1"></i>
                              {place.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-map text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-2 text-muted">Chưa có địa điểm nào tại {selectedCity}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCreatePlaceModal(true)}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Tạo địa điểm đầu tiên
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filter Summary */}
          {/* {(selectedCity || selectedTags.length > 0) && (
            <div className="mt-4">
              <div className="alert alert-info border-0 shadow-sm">
                <h6 className="mb-2">
                  <i className="bi bi-funnel me-2"></i>
                  Bộ lọc tour
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {selectedCity && (
                    <span className="badge bg-primary">
                      <i className="bi bi-geo-alt me-1"></i>
                      Thành phố: {selectedCity}
                    </span>
                  )}
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => String(t.id) === String(tagId));
                    if (!tag) return null;
                    return (
                      <span key={tag.id} className="badge bg-success">
                        <i className="bi bi-tag me-1"></i>
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
                <small className="text-muted mt-2 d-block">
                  Tour sẽ được tạo với các địa điểm phù hợp với bộ lọc trên
                </small>
              </div>
            </div>
          )} */}

          <div className="text-center mt-4">
            <button
              onClick={generateTour}
              className="btn btn-main btn-lg px-5"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <i className="bi bi-magic fa-spin me-2"></i>
                  Đang tạo tour...
                </>
              ) : (
                <>
                  <i className="bi bi-magic text-white me-2"></i>
                  Tạo chuyến đi
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Generated Tour Display */}
      {tourData && (
        <div className="luxury-card">
          <div className="luxury-card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0" style={{color: '#3b82f6'}}>Chuyến đi được tạo</h4>
              <button
                onClick={saveTour}
                className="btn btn-main"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <i className="bi bi-spinner fa-spin me-2"></i>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    Lưu chuyến đi
                  </>
                )}
              </button>
            </div>

            <div className="tour-info mb-4">
              <h5 className="text-primary mb-2">
                <i className="bi bi-route me-2"></i>
                {/* {tourData.tour.name} */}
              </h5>
              <p className="text-muted mb-2">
                {generateAIDescription(interests, tourData.steps) || htmlToPlainText(tourData.tour.description)}
              </p>
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted">
                    <i className="bi bi-calendar me-1"></i>
                      {start_time && end_time ? `${start_time} → ${end_time}` : `${tourData.steps.length} địa điểm`}
                  </small>
                </div>
                {/* <div className="col-md-4">
                  <small className="text-muted">
                    <i className="bi bi-clock me-1"></i>
                    {tourData.steps.reduce((total, step) => total + (step.stay_duration || 0), 0)} phút
                  </small>
                </div> */}
                {/* <div className="col-md-4">
                  <small className="text-muted">
                    <i className="bi bi-cash me-1"></i>
                    {tourData.tour.total_cost?.toLocaleString('vi-VN')} VND
                  </small>
                </div> */}
              </div>
            </div>

            {/* Tour Steps Preview */}
            {tourData && tourData.steps && tourData.steps.length > 0 && (
              <div className="mt-4">
                <h4 className="fw-bold mb-3" style={{color: '#3b82f6'}}>Hành trình gợi ý</h4>
                {Object.entries(groupStepsByDay(tourData.steps)).map(([day, steps]) => (
                  <div key={day} className="mb-4">
                    <h5 className="mb-3" style={{color: '#1a5bb8'}}>Ngày {day}</h5>
                    <div className="row g-3">
                      {steps.map((step, idx) => (
                        <div className="col-md-6 col-lg-4" key={step.place_id || idx}>
                          <Link to={step.place ? `/places/${step.place.id}` : '#'} className="text-decoration-none">
                            <div className="card h-100 shadow-sm">
                              {step.place && step.place.image_url && (
                                <img src={step.place.image_url.startsWith('http') ? step.place.image_url : `${BASE_URL}${step.place.image_url}`} alt={step.place.name} className="card-img-top" style={{height: 140, objectFit: 'cover'}} />
                              )}
                              <div className="card-body">
                                <h6 className="card-title mb-1 fw-bold">{step.place?.name}</h6>
                                <div className="card-text text-muted" style={{fontSize: '0.95em'}}>{htmlToPlainText(step.place?.description)}</div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Place Modal */}
      {showCreatePlaceModal && (
        <div className="planner-modal-overlay" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2 text-primary"></i>
                  Thêm địa điểm mới tại {selectedCity}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreatePlaceModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Tên địa điểm *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPlaceData.name}
                      onChange={(e) => setNewPlaceData({...newPlaceData, name: e.target.value})}
                      placeholder="Nhập tên địa điểm"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Địa chỉ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPlaceData.address}
                      onChange={(e) => setNewPlaceData({...newPlaceData, address: e.target.value})}
                      placeholder="Nhập địa chỉ chi tiết"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold">Mô tả *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newPlaceData.description}
                      onChange={(e) => setNewPlaceData({...newPlaceData, description: e.target.value})}
                      placeholder="Mô tả về địa điểm này..."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Giờ mở cửa</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={newPlaceData.opening_hours}
                      onChange={(e) => setNewPlaceData({...newPlaceData, opening_hours: e.target.value})}
                      placeholder="VD: 8:00 - 22:00 hàng ngày"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Dịch vụ</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={newPlaceData.service}
                      onChange={(e) => setNewPlaceData({...newPlaceData, service: e.target.value})}
                      placeholder="VD: Ăn uống, Giải trí, Mua sắm"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreatePlaceModal(false)}>
                  Hủy
                </button>
                <button type="button" className="btn btn-primary" onClick={createPlaceForCity}>
                  <i className="bi bi-plus-circle me-1"></i>
                  Tạo địa điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (noLayout) return mainContent;

  return (
    <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
      <Header />
      <main className="container py-4 flex-grow-1">
        {mainContent}
        {/* Success Modal */}
        {showSuccessModal && createdTour && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Tạo tour thành công!</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowSuccessModal(false); navigate('/my-tours'); }}></button>
                </div>
                <div className="modal-body">
                  <p>Bạn đã tạo tour bắt đầu từ <b>{createdTour.name}</b> thành công.</p>
                  <div className="mb-3">
                    <b>Thời gian:</b> {createdTour.start_time || "-"} đến {createdTour.end_time || "-"}
                  </div>
                  
                  {/* Auto reminder message */}
                  {createdTour.start_time && (
                    <div className="alert alert-info mt-3">
                      <i className="bi bi-bell me-2"></i>
                      <strong>Nhắc nhở tự động:</strong> Bạn sẽ nhận được thông báo nhắc nhở trước khi tour bắt đầu.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  {createdTour.id && (
                    <button className="btn btn-main" onClick={() => window.location.href = `/tours/${createdTour.id}`}>
                      Xem chi tiết tour
                    </button>
                  )}
                  <button className="btn btn-outline-secondary" onClick={() => window.location.href = '/my-tours'}>
                    Đến trang My Tours
                  </button>
                  <button className="btn btn-link" onClick={() => setShowSuccessModal(false)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AutoPlanner;
