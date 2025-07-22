import React, { useEffect, useState } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import axios from "axios";
import CKEditorField from "../../components/CKEditorField";
import CityAutocomplete from "../../components/CityAutocomplete";
import "../../css/AdminLayout.css";
import { getTags } from "../../api/tagApi";
import { getPlaceTags, createPlaceTag, deletePlaceTag } from "../../api/placeTagApi";
import { Modal, Button } from "react-bootstrap";
import debounce from 'lodash.debounce';

const BASE_URL = "https://walkingguide.onrender.com";

function PlacesAdmin() {
  const [places, setPlaces] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [service, setService] = useState("");
  const [editId, setEditId] = useState(null);
  const [tags, setTags] = useState([]);
  const [placeTags, setPlaceTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagModalPlace, setTagModalPlace] = useState(null);
  const [tagModalSelected, setTagModalSelected] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    fetchPlaces();
    fetchTags();
    fetchPlaceTags();
  }, []);

  const fetchPlaces = async () => {
    const res = await axios.get("https://walkingguide.onrender.com/api/places");
    setPlaces(res.data);
  };

  const fetchTags = async () => {
    const res = await getTags();
    setTags(res.data);
  };

  const fetchPlaceTags = async () => {
    const res = await getPlaceTags();
    setPlaceTags(res.data);
  };

  // Helper function to get proper image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Already absolute URL
    }
    // Prepend backend URL for relative paths
    return `${BASE_URL}${imageUrl}`;
  };

  // Address autocomplete with debouncing
  const searchAddress = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // If city is selected, search within that city for faster results
      let searchQuery = query;
      if (city && city.trim()) {
        searchQuery = `${query}, ${city}`;
      }

      const response = await axios.get(
        `${BASE_URL}/api/geocoding/search?q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
      );
      setAddressSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    }
  };

  const handleAddressChange = (value) => {
    setAddress(value);
    searchAddress(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion.display_name);
    setCity(suggestion.address?.city || suggestion.address?.town || suggestion.address?.state || "");
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const getCoordinatesFromAddress = async (address) => {
    setIsLoadingLocation(true);
    try {
      const response = await axios.get(
        `https://walkingguide.onrender.com/api/geocoding/coordinates?q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (response.data.success && response.data.data) {
        return {
          latitude: response.data.data.latitude,
          longitude: response.data.data.longitude
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting coordinates:", error);
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCreate = async () => {
    try {
      // Get coordinates from address
      const coordinates = await getCoordinatesFromAddress(address);
      if (!coordinates) {
        alert("Không thể tìm thấy tọa độ cho địa chỉ này. Vui lòng kiểm tra lại địa chỉ.");
        return;
      }

      let uploadedImageUrl = imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await axios.post("https://walkingguide.onrender.com/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedImageUrl = uploadRes.data.url;
      }
      
      // Create the place
      const placeRes = await axios.post("https://walkingguide.onrender.com/api/places", {
        name,
        description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        image_url: uploadedImageUrl,
        city,
        address,
        opening_hours: openingHours,
        service,
      });
      
      // Create place tags if any are selected
      if (selectedTags.length > 0) {
        for (const tagId of selectedTags) {
          await createPlaceTag({ place_id: placeRes.data.id, tag_id: tagId });
        }
      }
      
      fetchPlaces();
      fetchPlaceTags();
      resetForm();
    } catch (error) {
      console.error("Error creating place:", error);
      alert("Lỗi khi tạo địa điểm. Vui lòng thử lại.");
    }
  };

  const handleEdit = (place) => {
    setEditId(place.id);
    setName(place.name);
    setDescription(place.description);
    setImageUrl(place.image_url);
    setCity(place.city || "");
    setAddress(place.address || "");
    setOpeningHours(place.opening_hours || "");
    setService(place.service || "");
    
    // Set selected tags for the place being edited
    const placeTagIds = getTagsForPlace(place.id).map(tag => tag.id);
    setSelectedTags(placeTagIds);
    
    // Scroll to top of the page to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    try {
      // Get coordinates from address
      const coordinates = await getCoordinatesFromAddress(address);
      if (!coordinates) {
        alert("Không thể tìm thấy tọa độ cho địa chỉ này. Vui lòng kiểm tra lại địa chỉ.");
        return;
      }

      let uploadedImageUrl = imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await axios.post("https://walkingguide.onrender.com/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedImageUrl = uploadRes.data.url;
      }
      
      // Update the place
      await axios.put(`https://walkingguide.onrender.com/api/places/${editId}`, {
        name,
        description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        image_url: uploadedImageUrl,
        city,
        address,
        opening_hours: openingHours,
        service,
      });
      
      // Update place tags
      const currentTagIds = getTagsForPlace(editId).map(t => t.id);
      const toAdd = selectedTags.filter(id => !currentTagIds.includes(id));
      const toRemove = currentTagIds.filter(id => !selectedTags.includes(id));
      
      for (const tagId of toAdd) {
        await createPlaceTag({ place_id: editId, tag_id: tagId });
      }
      for (const tagId of toRemove) {
        const pt = placeTags.find(pt => pt.place_id === editId && pt.tag_id === tagId);
        if (pt) await deletePlaceTag(pt.id);
      }
      
      fetchPlaces();
      fetchPlaceTags();
      setEditId(null);
      resetForm();
    } catch (error) {
      console.error("Error updating place:", error);
      alert("Lỗi khi cập nhật địa điểm. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (id) => {
    setPlaceToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!placeToDelete) return;
    
    try {
      await axios.delete(`https://walkingguide.onrender.com/api/places/${placeToDelete}`);
      fetchPlaces();
      setShowDeleteModal(false);
      setPlaceToDelete(null);
    } catch (error) {
      console.error('Error deleting place:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPlaceToDelete(null);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setCity("");
    setAddress("");
    setOpeningHours("");
    setService("");
    setSelectedTags([]);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  // Helper to get tags for a place
  const getTagsForPlace = (placeId) => {
    const tagIds = placeTags.filter(pt => pt.place_id === placeId).map(pt => pt.tag_id);
    return tags.filter(tag => tagIds.includes(tag.id));
  };

  const openTagModal = (place) => {
    setTagModalPlace(place);
    setTagModalSelected(getTagsForPlace(place.id).map(t => t.id));
    setShowTagModal(true);
  };

  const closeTagModal = () => {
    setShowTagModal(false);
    setTagModalPlace(null);
    setTagModalSelected([]);
  };

  const handleTagModalSave = async () => {
    if (!tagModalPlace) return;
    const currentTagIds = getTagsForPlace(tagModalPlace.id).map(t => t.id);
    const toAdd = tagModalSelected.filter(id => !currentTagIds.includes(id));
    const toRemove = currentTagIds.filter(id => !tagModalSelected.includes(id));
    for (const tagId of toAdd) {
      await createPlaceTag({ place_id: tagModalPlace.id, tag_id: tagId });
    }
    for (const tagId of toRemove) {
      const pt = placeTags.find(pt => pt.place_id === tagModalPlace.id && pt.tag_id === tagId);
      if (pt) await deletePlaceTag(pt.id);
    }
    fetchPlaceTags();
    closeTagModal();
  };

  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="container-fluid">            
            {/* Create/Edit Form */}
            <div className="card mb-4">
              <div className="card-header">
                <h5>{editId ? "Chỉnh sửa Địa điểm" : "Tạo Địa điểm Mới"}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tên địa điểm *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập tên địa điểm"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Mô tả</label>
                      <CKEditorField
                        value={description}
                        onChange={setDescription}
                        placeholder="Mô tả địa điểm"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Thành phố</label>
                      <CityAutocomplete
                        value={city}
                        onChange={setCity}
                        placeholder="Chọn thành phố"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Địa chỉ *</label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className="form-control"
                          value={address}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          placeholder={city ? `Nhập địa chỉ trong ${city}...` : "Nhập địa chỉ để tìm kiếm..."}
                          autoComplete="off"
                        />
                        {isLoadingLocation && (
                          <div className="position-absolute top-50 end-0 translate-middle-y me-2">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        )}
                        {showSuggestions && addressSuggestions.length > 0 && (
                          <div className="position-absolute w-100 bg-white border rounded shadow-sm" style={{ zIndex: 1000, top: '100%' }}>
                            {addressSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="p-2 border-bottom suggestion-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSuggestionClick(suggestion)}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                              >
                                <div className="fw-semibold">{suggestion.display_name.split(',')[0]}</div>
                                <div className="small text-muted">{suggestion.display_name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Giờ mở cửa</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                        placeholder="VD: Thứ 2 - Thứ 6: 8:00 - 18:00"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Dịch vụ</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        placeholder="Mô tả các dịch vụ có sẵn"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Link ảnh</label>
                      <input
                        type="url"
                        className="form-control"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Hoặc tải ảnh lên</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="form-control"
                      />
                    </div>
                    
                    {/* Current Image Preview (when editing) */}
                    {editId && imageUrl && (
                      <div className="mb-3">
                        <label className="form-label">Ảnh hiện tại:</label>
                        <div className="border rounded p-2">
                          <img
                            src={getImageUrl(imageUrl)}
                            alt="Current image"
                            style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "cover" }}
                            className="img-thumbnail"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tag Selection */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Thẻ địa điểm:</label>
                  <div className="row">
                    {tags.map(tag => (
                      <div key={tag.id} className="col-md-3 col-sm-6 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`tag-${tag.id}`}
                            checked={selectedTags.includes(tag.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTags([...selectedTags, tag.id]);
                              } else {
                                setSelectedTags(selectedTags.filter(id => id !== tag.id));
                              }
                            }}
                          />
                          <label className="form-check-label" htmlFor={`tag-${tag.id}`}>
                            {tag.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  {editId ? (
                    <>
                      <Button variant="primary" className="admin-main-btn" onClick={handleUpdate}>
                        Cập nhật Địa điểm
                      </Button>
                      <Button variant="secondary" onClick={() => { setEditId(null); resetForm(); }}>
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" className="admin-main-btn" onClick={handleCreate}>
                      Tạo Địa điểm
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Places List */}
            <div className="card">
              <div className="card-header">
                <h5>Tất cả Địa điểm</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hình ảnh</th>
                        <th>Tên</th>
                        <th>Thành phố</th>
                        <th>Địa chỉ</th>
                        <th>Thẻ</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {places.map((place) => (
                        <tr key={place.id}>
                          <td>{place.id}</td>
                          <td>
                            {place.image_url ? (
                              <img
                                src={getImageUrl(place.image_url)}
                                alt={place.name}
                                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                              />
                            ) : (
                              <div style={{ width: "50px", height: "50px", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <i className="bi bi-geo-alt"></i>
                              </div>
                            )}
                          </td>
                          <td>{place.name}</td>
                          <td>{place.city}</td>
                          <td>
                            <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {place.address}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {getTagsForPlace(place.id).map(tag => (
                                <span key={tag.id} className="badge bg-primary">{tag.name}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(place)}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => openTagModal(place)}
                              >
                                Thẻ
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(place.id)}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa địa điểm này? Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Hủy
          </Button>
          <Button variant="danger" className="admin-btn-danger" onClick={confirmDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Tag Management Modal */}
      <Modal show={showTagModal} onHide={closeTagModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Quản lý thẻ cho: {tagModalPlace?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            {tags.map(tag => (
              <div key={tag.id} className="col-md-4 mb-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`modal-tag-${tag.id}`}
                    checked={tagModalSelected.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTagModalSelected([...tagModalSelected, tag.id]);
                      } else {
                        setTagModalSelected(tagModalSelected.filter(id => id !== tag.id));
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor={`modal-tag-${tag.id}`}>
                    {tag.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeTagModal}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleTagModalSave}>
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PlacesAdmin;
