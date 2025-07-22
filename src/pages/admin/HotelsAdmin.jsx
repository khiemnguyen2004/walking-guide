import React, { useEffect, useState } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import CityAutocomplete from "../../components/CityAutocomplete.jsx";
import axios from "axios";
import axiosClient from '../../api/axiosClient';
import { Modal, Button } from "react-bootstrap";
import "../../css/AdminLayout.css";
import { Link } from 'react-router-dom';
import formatVND from '../../utils/formatVND';

const BASE_URL = "https://walkingguide.onrender.com";

function HotelsAdmin() {
  const [hotels, setHotels] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [amenities, setAmenities] = useState("");
  const [roomTypes, setRoomTypes] = useState("");
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [roomTypesList, setRoomTypesList] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [newRoomType, setNewRoomType] = useState("");
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [stars, setStars] = useState(0);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [editId, setEditId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const res = await axiosClient.get("/hotels");
      setHotels(res.data.data || res.data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
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

      const response = await axiosClient.get(
        `/geocoding/search?q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
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

  const handleCityChange = (value) => {
    setCity(value);
    // If there's already an address typed, refresh the address suggestions with the new city
    if (address && address.trim()) {
      searchAddress(address);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        alert(`File ${file.name} không phải là hình ảnh hợp lệ`);
        return false;
      }
      
      if (!isValidSize) {
        alert(`File ${file.name} quá lớn (tối đa 5MB)`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setImageFiles(prev => [...prev, ...validFiles]);
    
    // Create preview URLs for new images
    const newImages = validFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      image_url: URL.createObjectURL(file),
      caption: "",
      is_primary: images.length === 0 && index === 0, // First image is primary if no existing images
      sort_order: images.length + index,
      file: file // Store file reference for upload
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const updateImageCaption = (index, caption) => {
    const updatedImages = [...images];
    updatedImages[index].caption = caption;
    setImages(updatedImages);
  };

  const setPrimaryImage = (index) => {
    setImages(prevImages => {
      if (index === 0) return prevImages.map((img, i) => ({ ...img, is_primary: i === 0 }));
      const newImages = [...prevImages];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift({ ...selected, is_primary: true });
      return newImages.map((img, i) => ({ ...img, is_primary: i === 0 }));
    });
  };

  // Drag and drop functionality
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    
    const newImages = [...images];
    const draggedImage = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    // Update sort order and primary image
    newImages.forEach((img, index) => {
      img.sort_order = index;
      img.is_primary = index === 0; // First image is always primary
    });
    
    setImages(newImages);
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  // Helper functions for amenities and room types
  const addAmenity = () => {
    if (newAmenity.trim() && !amenitiesList.includes(newAmenity.trim())) {
      const updatedList = [...amenitiesList, newAmenity.trim()];
      setAmenitiesList(updatedList);
      setAmenities(JSON.stringify(updatedList));
      setNewAmenity("");
    }
  };

  const removeAmenity = (index) => {
    const updatedList = amenitiesList.filter((_, i) => i !== index);
    setAmenitiesList(updatedList);
    setAmenities(JSON.stringify(updatedList));
  };

  const addRoomType = () => {
    if (newRoomType.trim() && !roomTypesList.includes(newRoomType.trim())) {
      const updatedList = [...roomTypesList, newRoomType.trim()];
      setRoomTypesList(updatedList);
      setRoomTypes(JSON.stringify(updatedList));
      setNewRoomType("");
    }
  };

  const removeRoomType = (index) => {
    const updatedList = roomTypesList.filter((_, i) => i !== index);
    setRoomTypesList(updatedList);
    setRoomTypes(JSON.stringify(updatedList));
  };

  const handleAmenityKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAmenity();
    }
  };

  const handleRoomTypeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRoomType();
    }
  };

  const getCoordinatesFromAddress = async (address) => {
    setIsLoadingLocation(true);
    try {
      const response = await axiosClient.get(
        `/geocoding/coordinates?q=${encodeURIComponent(address)}&limit=1`
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

      // Upload images first
      const uploadedImages = [];
      const imagesWithPrimary = ensureOnePrimary(images);
      for (let i = 0; i < imagesWithPrimary.length; i++) {
        const image = imagesWithPrimary[i];
        if (image.file) {
          const formData = new FormData();
          formData.append("file", image.file);
          const uploadRes = await axiosClient.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          uploadedImages.push({
            url: uploadRes.data.url,
            caption: image.caption,
            is_primary: image.is_primary,
            sort_order: i
          });
        }
      }

      // Create the hotel
      const hotelRes = await axiosClient.post("/hotels", {
        name,
        description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        city,
        address,
        phone,
        email,
        website,
        price_range: priceRange,
        min_price: parseFloat(minPrice) || 0,
        max_price: parseFloat(maxPrice) || 0,
        amenities,
        room_types: roomTypes,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        stars: parseInt(stars) || 0,
        images: uploadedImages
      });

      fetchHotels();
      resetForm();
    } catch (error) {
      console.error("Error creating hotel:", error);
      alert("Lỗi khi tạo khách sạn. Vui lòng thử lại.");
    }
  };

  const handleEdit = (hotel) => {
    setEditId(hotel.id);
    setName(hotel.name);
    setDescription(hotel.description || "");
    setCity(hotel.city || "");
    setAddress(hotel.address || "");
    setPhone(hotel.phone || "");
    setEmail(hotel.email || "");
    setWebsite(hotel.website || "");
    setPriceRange(hotel.price_range || "");
    setMinPrice(hotel.min_price || "");
    setMaxPrice(hotel.max_price || "");
    setAmenities(hotel.amenities || "");
    setRoomTypes(hotel.room_types || "");
    setCheckInTime(hotel.check_in_time || "15:00");
    setCheckOutTime(hotel.check_out_time || "11:00");
    setStars(hotel.stars || 0);
    setImages(hotel.images || []);
    setImageFiles([]);
    
    // Parse amenities and room types
    try {
      const amenitiesData = hotel.amenities ? JSON.parse(hotel.amenities) : [];
      setAmenitiesList(Array.isArray(amenitiesData) ? amenitiesData : []);
    } catch (e) {
      setAmenitiesList([]);
    }
    
    try {
      const roomTypesData = hotel.room_types ? JSON.parse(hotel.room_types) : [];
      setRoomTypesList(Array.isArray(roomTypesData) ? roomTypesData : []);
    } catch (e) {
      setRoomTypesList([]);
    }
    
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

      // Upload new images first
      const uploadedImages = [];
      const newImages = images.filter(img => img.id.toString().startsWith('new-'));
      
      console.log('New images to upload:', newImages.length);
      
      for (let i = 0; i < newImages.length; i++) {
        const image = newImages[i];
        if (image.file) {
          console.log('Uploading image:', image.file.name);
          const formData = new FormData();
          formData.append("file", image.file);
          const uploadRes = await axiosClient.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          uploadedImages.push({
            url: uploadRes.data.url,
            caption: image.caption || "",
            is_primary: image.is_primary || false,
            sort_order: image.sort_order || 0
          });
        }
      }

      // Combine existing images with new ones
      const existingImages = images.filter(img => !img.id.toString().startsWith('new-')).map(img => ({
        url: img.image_url,
        caption: img.caption || "",
        is_primary: img.is_primary || false,
        sort_order: img.sort_order || 0
      }));
      
      const allImagesWithPrimary = ensureOnePrimary([...existingImages, ...uploadedImages]);
      
      console.log('Total images to send:', allImagesWithPrimary.length);
      console.log('Images data:', allImagesWithPrimary);

      // Update the hotel
      const updateData = {
        name,
        description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        city,
        address,
        phone,
        email,
        website,
        price_range: priceRange,
        min_price: parseFloat(minPrice) || 0,
        max_price: parseFloat(maxPrice) || 0,
        amenities,
        room_types: roomTypes,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        stars: parseInt(stars) || 0,
        images: allImagesWithPrimary
      };
      
      console.log('Update data:', updateData);

      // Validate required fields
      if (!updateData.name || !updateData.name.trim()) {
        alert("Tên khách sạn không được để trống");
        return;
      }

      if (!updateData.address || !updateData.address.trim()) {
        alert("Địa chỉ không được để trống");
        return;
      }

      // Validate coordinates
      if (!updateData.latitude || !updateData.longitude) {
        alert("Không thể xác định tọa độ. Vui lòng kiểm tra lại địa chỉ.");
        return;
      }

      // Validate images structure
      if (updateData.images && updateData.images.length > 0) {
        for (let i = 0; i < updateData.images.length; i++) {
          const img = updateData.images[i];
          if (!img.url) {
            alert(`Ảnh thứ ${i + 1} không có URL hợp lệ`);
            return;
          }
        }
      }

      const response = await axiosClient.put(`/hotels/${editId}`, updateData);
      console.log('Update response:', response.data);

      fetchHotels();
      setEditId(null);
      resetForm();
    } catch (error) {
      console.error("Error updating hotel:", error);
      console.error("Error response:", error.response?.data);
      alert("Lỗi khi cập nhật khách sạn. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (id) => {
    setHotelToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!hotelToDelete) return;
    
    try {
      await axiosClient.delete(`/hotels/${hotelToDelete}`);
      fetchHotels();
      setShowDeleteModal(false);
      setHotelToDelete(null);
    } catch (error) {
      console.error('Error deleting hotel:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setHotelToDelete(null);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCity("");
    setAddress("");
    setPhone("");
    setEmail("");
    setWebsite("");
    setPriceRange("");
    setMinPrice("");
    setMaxPrice("");
    setAmenities("");
    setRoomTypes("");
    setAmenitiesList([]);
    setRoomTypesList([]);
    setNewAmenity("");
    setNewRoomType("");
    setCheckInTime("15:00");
    setCheckOutTime("11:00");
    setStars(0);
    setImages([]);
    setImageFiles([]);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const ensureOnePrimary = (imgs) => {
    if (!imgs.length) return imgs;
    let found = imgs.findIndex(img => img.is_primary);
    if (found === -1) imgs[0].is_primary = true;
    return imgs.map((img, i) => ({ ...img, is_primary: i === (found !== -1 ? found : 0) }));
  };

  const moveImageToFirst = (index) => {
    setImages(prevImages => {
      if (index === 0) return prevImages.map((img, i) => ({ ...img, is_primary: i === 0 }));
      const newImages = [...prevImages];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift({ ...selected, is_primary: true });
      return newImages.map((img, i) => ({ ...img, is_primary: i === 0 }));
    });
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
                <h5>{editId ? "Chỉnh sửa Khách sạn" : "Tạo Khách sạn Mới"}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tên khách sạn *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Mô tả</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Thành phố</label>
                      <CityAutocomplete
                        value={city}
                        onChange={handleCityChange}
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
                      <label className="form-label">Số điện thoại</label>
                      <input
                        type="text"
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Website</label>
                      <input
                        type="url"
                        className="form-control"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Mức giá</label>
                          <select
                            className="form-control"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                          >
                            <option value="">Chọn mức giá</option>
                            <option value="$">$ (Bình dân)</option>
                            <option value="$$">$$ (Trung bình)</option>
                            <option value="$$$">$$$ (Cao cấp)</option>
                            <option value="$$$$">$$$$ (Sang trọng)</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Sao</label>
                          <select
                            className="form-control"
                            value={stars}
                            onChange={(e) => setStars(parseInt(e.target.value))}
                          >
                            <option value={0}>Chọn số sao</option>
                            <option value={1}>1 Sao</option>
                            <option value={2}>2 Sao</option>
                            <option value={3}>3 Sao</option>
                            <option value={4}>4 Sao</option>
                            <option value={5}>5 Sao</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Giá tối thiểu (VND)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                          />
                          {minPrice && <div className="form-text text-success">{formatVND(Number(minPrice))}</div>}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Giá tối đa (VND)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                          />
                          {maxPrice && <div className="form-text text-success">{formatVND(Number(maxPrice))}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tiện ích</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập tiện ích và nhấn Enter hoặc +"
                          value={newAmenity}
                          onChange={(e) => setNewAmenity(e.target.value)}
                          onKeyPress={handleAmenityKeyPress}
                        />
                        <button
                          className="btn btn-outline-primary"
                          type="button"
                          onClick={addAmenity}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                      {amenitiesList.length > 0 && (
                        <div className="mt-2">
                          <div className="d-flex flex-wrap gap-1">
                            {amenitiesList.map((amenity, index) => (
                              <span
                                key={index}
                                className="badge bg-primary d-flex align-items-center gap-1"
                                style={{ fontSize: '0.875rem' }}
                              >
                                {amenity}
                                <button
                                  type="button"
                                  className="btn-close btn-close-white"
                                  style={{ fontSize: '0.5rem' }}
                                  onClick={() => removeAmenity(index)}
                                ></button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="form-text">
                        Gợi ý: WiFi, Hồ bơi, Spa, Gym, Nhà hàng, Bar, Dịch vụ giặt ủi
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Loại phòng</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập loại phòng và nhấn Enter hoặc +"
                          value={newRoomType}
                          onChange={(e) => setNewRoomType(e.target.value)}
                          onKeyPress={handleRoomTypeKeyPress}
                        />
                        <button
                          className="btn btn-outline-primary"
                          type="button"
                          onClick={addRoomType}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                      {roomTypesList.length > 0 && (
                        <div className="mt-2">
                          <div className="d-flex flex-wrap gap-1">
                            {roomTypesList.map((roomType, index) => (
                              <span
                                key={index}
                                className="badge bg-success d-flex align-items-center gap-1"
                                style={{ fontSize: '0.875rem' }}
                              >
                                {roomType}
                                <button
                                  type="button"
                                  className="btn-close btn-close-white"
                                  style={{ fontSize: '0.5rem' }}
                                  onClick={() => removeRoomType(index)}
                                ></button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="form-text">
                        Gợi ý: Standard, Deluxe, Suite, Executive, Family, Presidential
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Giờ nhận phòng</label>
                      <input
                        type="time"
                        className="form-control"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Giờ trả phòng</label>
                      <input
                        type="time"
                        className="form-control"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Images Section */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label fw-bold">Hình ảnh ({images.length})</label>
                    <div className="d-flex gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="form-control"
                        style={{ width: 'auto' }}
                        onChange={handleImageChange}
                        id="hotel-image-upload"
                      />
                      <label htmlFor="hotel-image-upload" className="btn btn-outline-primary btn-sm">
                        <i className="bi bi-plus-circle me-1"></i>
                        Thêm ảnh
                      </label>
                      {images.length > 1 && (
                        <button 
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa tất cả ảnh?')) {
                              setImages([]);
                              setImageFiles([]);
                            }
                          }}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Xóa tất cả
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="mt-3">
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Kéo thả để sắp xếp lại thứ tự ảnh. Ảnh đầu tiên sẽ là ảnh chính.
                      </div>
                      
                      <div className="row">
                        {images.map((image, index) => (
                          <div
                            key={image.id}
                            className="col-md-3 col-sm-6 mb-3"
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            draggable={true}
                          >
                            <div className="card h-100 shadow-sm">
                              <div className="position-relative">
                                <img
                                  src={getImageUrl(image.image_url)}
                                  className="card-img-top"
                                  alt={`Khách sạn ${index + 1}`}
                                  style={{ height: "200px", objectFit: "cover" }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <div className="position-absolute top-0 start-0 p-2">
                                  {image.is_primary && (
                                    <span className="badge bg-success">
                                      <i className="bi bi-star-fill me-1"></i>Chính
                                    </span>
                                  )}
                                </div>
                                <div className="position-absolute top-0 end-0 p-2">
                                  <span className="badge bg-secondary">#{index + 1}</span>
                                </div>
                                <div className="position-absolute bottom-0 start-0 w-100 p-2" 
                                     style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${image.is_primary ? 'btn-success' : 'btn-outline-success'}`}
                                      onClick={() => setPrimaryImage(index)}
                                      title={image.is_primary ? 'Đã là ảnh chính' : 'Đặt làm ảnh chính'}
                                    >
                                      <i className={`bi ${image.is_primary ? 'bi-star-fill' : 'bi-star'}`}></i>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => removeImage(index)}
                                      title="Xóa ảnh"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="card-body">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Chú thích ảnh..."
                                  value={image.caption}
                                  onChange={(e) => updateImageCaption(index, e.target.value)}
                                />
                                <div className="mt-2">
                                  <small className="text-muted">
                                    {image.image_url && image.image_url.startsWith('blob:') ? 'Ảnh mới' : 'Ảnh hiện có'}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Image Gallery View */}
                      <div className="mt-3">
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setShowImageGallery(!showImageGallery)}
                        >
                          <i className="bi bi-images me-1"></i>
                          {showImageGallery ? 'Ẩn' : 'Xem'} thư viện ảnh
                        </button>
                      </div>
                      
                      {showImageGallery && (
                        <div className="mt-3">
                          <div className="row">
                            {images.map((image, index) => (
                              <div key={index} className="col-md-2 col-sm-4 col-6 mb-2">
                                <div className="position-relative">
                                  <img
                                    src={getImageUrl(image.image_url)}
                                    className="img-thumbnail"
                                    alt={`Khách sạn ${index + 1}`}
                                    style={{ height: "100px", objectFit: "cover", cursor: 'pointer' }}
                                    onClick={() => moveImageToFirst(index)}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                  {image.is_primary && (
                                    <div className="position-absolute top-0 start-0">
                                      <i className="bi bi-star-fill text-warning"></i>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {images.length === 0 && (
                    <div className="text-center py-4 border rounded bg-light">
                      <i className="bi bi-images text-muted" style={{ fontSize: '3rem' }}></i>
                      <p className="text-muted mt-2">Chưa có hình ảnh nào</p>
                      <p className="text-muted small">Nhấn "Thêm ảnh" để bắt đầu</p>
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2">
                  {editId ? (
                    <>
                      <Button variant="primary" className="admin-main-btn" onClick={handleUpdate}>
                        Cập nhật Khách sạn
                      </Button>
                      <Button variant="secondary" onClick={() => { setEditId(null); resetForm(); }}>
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" className="admin-main-btn" onClick={handleCreate}>
                      Tạo Khách sạn
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Hotels List */}
            <div className="card">
              <div className="card-header">
                <h5>Tất cả Khách sạn</h5>
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
                        <th>Sao</th>
                        <th>Mức giá</th>
                        <th>Đánh giá</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotels.map((hotel) => (
                        <tr key={hotel.id}>
                          <td>{hotel.id}</td>
                          <td>
                            {hotel.images && hotel.images.length > 0 ? (
                              <img
                                src={getImageUrl(hotel.images[0].image_url)}
                                alt={hotel.name}
                                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                              />
                            ) : (
                              <div style={{ width: "50px", height: "50px", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <i className="bi bi-building"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <Link to={`/hotels/${hotel.id}`}>{hotel.name}</Link>
                          </td>
                          <td>{hotel.city}</td>
                          <td>
                            <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {hotel.address}
                            </div>
                          </td>
                          <td>
                            {hotel.stars > 0 && (
                              <span className="badge bg-warning text-dark">
                                {hotel.stars} <i className="bi bi-star-fill"></i>
                              </span>
                            )}
                          </td>
                          <td>{hotel.price_range}</td>
                          <td>{hotel.rating ? hotel.rating.toFixed(1) : '0.0'}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(hotel)}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(hotel.id)}
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
          Bạn có chắc chắn muốn xóa khách sạn này? Hành động này không thể hoàn tác.
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
    </div>
  );
}

export default HotelsAdmin; 