import React, { useEffect, useState } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import CityAutocomplete from "../../components/CityAutocomplete.jsx";
import axios from "axios";
import axiosClient from '../../api/axiosClient';
import { Modal, Button, Form } from "react-bootstrap";
import "../../css/AdminLayout.css";
import { Link } from 'react-router-dom';

function RestaurantsAdmin() {
  const [restaurants, setRestaurants] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [takeoutAvailable, setTakeoutAvailable] = useState(true);
  const [dineInAvailable, setDineInAvailable] = useState(true);
  const [dietaryOptions, setDietaryOptions] = useState("");
  const [features, setFeatures] = useState("");
  const [openingHoursList, setOpeningHoursList] = useState([]);
  const [dietaryOptionsList, setDietaryOptionsList] = useState([]);
  const [featuresList, setFeaturesList] = useState([]);
  const [newOpeningHour, setNewOpeningHour] = useState({ day: "", time: "" });
  const [newDietaryOption, setNewDietaryOption] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [editId, setEditId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menus, setMenus] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuEdit, setMenuEdit] = useState(null); // for editing menu section
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [menuItemEdit, setMenuItemEdit] = useState(null); // for editing menu item
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemLoading, setMenuItemLoading] = useState(false);
  const [menuItemImage, setMenuItemImage] = useState(null);
  const [menuItemImagePreview, setMenuItemImagePreview] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get("https://walkingguide.onrender.com/api/restaurants");
      setRestaurants(res.data.data || res.data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  };

  // Helper function to get proper image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:')) {
      return imageUrl; // Already absolute URL or local preview
    }
    // Prepend backend URL for relative paths
    return `https://walkingguide.onrender.com${imageUrl}`;
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
        `https://walkingguide.onrender.com/api/geocoding/search?q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
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

  const moveImageToFirst = setPrimaryImage;

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

  // Helper functions for opening hours, dietary options, and features
  const addOpeningHour = () => {
    if (newOpeningHour.day.trim() && newOpeningHour.time.trim()) {
      const updatedList = [...openingHoursList, { ...newOpeningHour }];
      setOpeningHoursList(updatedList);
      setOpeningHours(JSON.stringify(updatedList));
      setNewOpeningHour({ day: "", time: "" });
    }
  };

  const removeOpeningHour = (index) => {
    const updatedList = openingHoursList.filter((_, i) => i !== index);
    setOpeningHoursList(updatedList);
    setOpeningHours(JSON.stringify(updatedList));
  };

  const addDietaryOption = () => {
    if (newDietaryOption.trim() && !dietaryOptionsList.includes(newDietaryOption.trim())) {
      const updatedList = [...dietaryOptionsList, newDietaryOption.trim()];
      setDietaryOptionsList(updatedList);
      setDietaryOptions(JSON.stringify(updatedList));
      setNewDietaryOption("");
    }
  };

  const removeDietaryOption = (index) => {
    const updatedList = dietaryOptionsList.filter((_, i) => i !== index);
    setDietaryOptionsList(updatedList);
    setDietaryOptions(JSON.stringify(updatedList));
  };

  const addFeature = () => {
    if (newFeature.trim() && !featuresList.includes(newFeature.trim())) {
      const updatedList = [...featuresList, newFeature.trim()];
      setFeaturesList(updatedList);
      setFeatures(JSON.stringify(updatedList));
      setNewFeature("");
    }
  };

  const removeFeature = (index) => {
    const updatedList = featuresList.filter((_, i) => i !== index);
    setFeaturesList(updatedList);
    setFeatures(JSON.stringify(updatedList));
  };

  const handleDietaryOptionKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDietaryOption();
    }
  };

  const handleFeatureKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
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

      // Upload images first
      const uploadedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const formData = new FormData();
        formData.append("file", imageFiles[i]);
        const uploadRes = await axios.post(`https://walkingguide.onrender.com/api/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedImages.push({
          url: uploadRes.data.url,
          caption: images[i].caption,
          is_primary: images[i].is_primary,
          sort_order: i
        });
      }

      // Create the restaurant
      const restaurantRes = await axios.post("https://walkingguide.onrender.com/api/restaurants", {
        name,
        description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        city,
        address,
        phone,
        email,
        website,
        cuisine_type: cuisineType,
        price_range: priceRange,
        min_price: parseFloat(minPrice) || 0,
        max_price: parseFloat(maxPrice) || 0,
        opening_hours: openingHours,
        delivery_available: deliveryAvailable,
        takeout_available: takeoutAvailable,
        dine_in_available: dineInAvailable,
        dietary_options: dietaryOptions,
        features: features,
        images: uploadedImages
      });

      fetchRestaurants();
      resetForm();
    } catch (error) {
      console.error("Error creating restaurant:", error);
      alert("Lỗi khi tạo nhà hàng. Vui lòng thử lại.");
    }
  };

  const handleEdit = (restaurant) => {
    setEditId(restaurant.id);
    setName(restaurant.name);
    setDescription(restaurant.description || "");
    setCity(restaurant.city || "");
    setAddress(restaurant.address || "");
    setPhone(restaurant.phone || "");
    setEmail(restaurant.email || "");
    setWebsite(restaurant.website || "");
    setCuisineType(restaurant.cuisine_type || "");
    setPriceRange(restaurant.price_range || "");
    setMinPrice(restaurant.min_price || "");
    setMaxPrice(restaurant.max_price || "");
    setOpeningHours(restaurant.opening_hours || "");
    setDeliveryAvailable(restaurant.delivery_available || false);
    setTakeoutAvailable(restaurant.takeout_available !== false);
    setDineInAvailable(restaurant.dine_in_available !== false);
    setDietaryOptions(restaurant.dietary_options || "");
    setFeatures(restaurant.features || "");
    setImages(restaurant.images || []);
    setImageFiles([]);
    
    // Parse opening hours, dietary options, and features
    try {
      const openingHoursData = restaurant.opening_hours ? JSON.parse(restaurant.opening_hours) : [];
      setOpeningHoursList(Array.isArray(openingHoursData) ? openingHoursData : []);
    } catch (e) {
      setOpeningHoursList([]);
    }
    
    try {
      const dietaryOptionsData = restaurant.dietary_options ? JSON.parse(restaurant.dietary_options) : [];
      setDietaryOptionsList(Array.isArray(dietaryOptionsData) ? dietaryOptionsData : []);
    } catch (e) {
      setDietaryOptionsList([]);
    }
    
    try {
      const featuresData = restaurant.features ? JSON.parse(restaurant.features) : [];
      setFeaturesList(Array.isArray(featuresData) ? featuresData : []);
    } catch (e) {
      setFeaturesList([]);
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
          const uploadRes = await axios.post(`https://walkingguide.onrender.com/api/upload`, formData, {
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
      
      const allImages = [...existingImages, ...uploadedImages];
      
      console.log('Total images to send:', allImages.length);
      console.log('Images data:', allImages);

      // Update the restaurant
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
        cuisine_type: cuisineType,
        price_range: priceRange,
        min_price: parseFloat(minPrice) || 0,
        max_price: parseFloat(maxPrice) || 0,
        opening_hours: openingHours,
        delivery_available: deliveryAvailable,
        takeout_available: takeoutAvailable,
        dine_in_available: dineInAvailable,
        dietary_options: dietaryOptions,
        features: features,
        images: allImages
      };
      
      console.log('Update data:', updateData);

      // Validate required fields
      if (!updateData.name || !updateData.name.trim()) {
        alert("Tên nhà hàng không được để trống");
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

      const response = await axios.put(`https://walkingguide.onrender.com/api/restaurants/${editId}`, updateData);
      console.log('Update response:', response.data);

      fetchRestaurants();
      setEditId(null);
      resetForm();
    } catch (error) {
      console.error("Error updating restaurant:", error);
      console.error("Error response:", error.response?.data);
      alert("Lỗi khi cập nhật nhà hàng. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (id) => {
    setRestaurantToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!restaurantToDelete) return;
    
    try {
      await axios.delete(`https://walkingguide.onrender.com/api/restaurants/${restaurantToDelete}`);
      fetchRestaurants();
      setShowDeleteModal(false);
      setRestaurantToDelete(null);
    } catch (error) {
      console.error('Error deleting restaurant:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRestaurantToDelete(null);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCity("");
    setAddress("");
    setPhone("");
    setEmail("");
    setWebsite("");
    setCuisineType("");
    setPriceRange("");
    setMinPrice("");
    setMaxPrice("");
    setOpeningHours("");
    setDeliveryAvailable(false);
    setTakeoutAvailable(true);
    setDineInAvailable(true);
    setDietaryOptions("");
    setFeatures("");
    setOpeningHoursList([]);
    setDietaryOptionsList([]);
    setFeaturesList([]);
    setNewOpeningHour({ day: "", time: "" });
    setNewDietaryOption("");
    setNewFeature("");
    setImages([]);
    setImageFiles([]);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  // Menu management logic
  const openMenuModal = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowMenuModal(true);
    setMenuLoading(true);
    try {
      const res = await axios.get(`https://walkingguide.onrender.com/api/restaurants/${restaurant.id}/menus`);
      const menuList = res.data.data || [];
      setMenus(menuList);
      if (menuList.length > 0) {
        setSelectedMenu(menuList[0]);
        fetchMenuItems(menuList[0].id);
      } else {
        setSelectedMenu(null);
        setMenuItems([]);
      }
    } catch {
      setMenus([]);
      setSelectedMenu(null);
      setMenuItems([]);
    } finally {
      setMenuLoading(false);
    }
  };

  const fetchMenuItems = async (menuId) => {
    setMenuItemLoading(true);
    try {
      const res = await axios.get(`https://walkingguide.onrender.com/api/restaurants/menus/${menuId}/items`);
      setMenuItems(res.data.data || []);
    } catch {
      setMenuItems([]);
    } finally {
      setMenuItemLoading(false);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục thực đơn này?')) {
      return;
    }
    try {
      await axios.delete(`https://walkingguide.onrender.com/api/restaurants/menus/${menuId}`);
      const res = await axios.get(`https://walkingguide.onrender.com/api/restaurants/${selectedRestaurant.id}/menus`);
      setMenus(res.data.data || []);
      setShowMenuForm(false);
      setMenuEdit(null);
    } catch (err) {
      alert('Xóa mục thực đơn thất bại.');
    }
  };

  const handleSaveMenu = async () => {
    if (!selectedRestaurant || !menuEdit?.name) return;
    try {
      if (menuEdit.id) {
        // Update existing menu
        await axios.put(`https://walkingguide.onrender.com/api/restaurants/menus/${menuEdit.id}`, {
          name: menuEdit.name,
          description: menuEdit.description,
        });
      } else {
        // Create new menu
        await axios.post(`https://walkingguide.onrender.com/api/restaurants/menus`, {
          restaurant_id: selectedRestaurant.id,
          name: menuEdit.name,
          description: menuEdit.description,
        });
      }
      // Refresh menus
      const res = await axios.get(`https://walkingguide.onrender.com/api/restaurants/${selectedRestaurant.id}/menus`);
      setMenus(res.data.data || []);
      setShowMenuForm(false);
      setMenuEdit(null);
    } catch (err) {
      alert('Lưu mục thực đơn thất bại.');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục thực đơn này?')) {
      return;
    }
    try {
      await axios.delete(`https://walkingguide.onrender.com/api/restaurants/menu-items/${itemId}`);
      const res = await axios.get(`https://walkingguide.onrender.com/api/restaurants/menus/${menuEdit.id}/items`); // Assuming menuEdit.id is the current menu's ID
      setMenuItems(res.data.data || []);
      setMenuItemEdit(null);
    } catch (err) {
      alert('Xóa mục thực đơn thất bại.');
    }
  };

  const handleSaveMenuItem = async () => {
    if (!selectedMenu || !menuItemEdit?.name) return;
    let image_url = menuItemEdit.image_url || '';
    try {
      // If a new image is selected, upload it first
      if (menuItemImage) {
        const formData = new FormData();
        formData.append('file', menuItemImage);
        const uploadRes = await axiosClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        image_url = uploadRes.data.url;
      }
      if (menuItemEdit.id) {
        // Update existing menu item
        await axios.put(`https://walkingguide.onrender.com/api/restaurants/menu-items/${menuItemEdit.id}`, {
          name: menuItemEdit.name,
          description: menuItemEdit.description,
          price: menuItemEdit.price,
          image_url,
        });
      } else {
        // Create new menu item
        await axios.post(`https://walkingguide.onrender.com/api/restaurants/menu-items`, {
          menu_id: selectedMenu.id,
          name: menuItemEdit.name,
          description: menuItemEdit.description,
          price: menuItemEdit.price,
          image_url,
        });
      }
      const res = await axios.get(`https://walkingguide.onrender.com/api/restaurants/menus/${selectedMenu.id}/items`);
      setMenuItems(res.data.data || []);
      setMenuItemEdit(null);
      setMenuItemImage(null);
      setMenuItemImagePreview(null);
      setShowMenuItemForm(false);
    } catch (err) {
      alert('Lưu mục thực đơn thất bại.');
    }
  };

  const handleMenuItemImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMenuItemImage(file);
      setMenuItemImagePreview(URL.createObjectURL(file));
      // Also update the menuItemEdit state to clear previous image_url if new image is selected
      setMenuItemEdit(edit => ({ ...edit, image_url: '' }));
    }
  };

  // When switching menu section, load its items
  const handleSelectMenu = (menu) => {
    setSelectedMenu(menu);
    fetchMenuItems(menu.id);
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
                <h5>{editId ? "Chỉnh sửa Nhà hàng" : "Tạo Nhà hàng Mới"}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tên nhà hàng *</label>
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
                          <label className="form-label">Loại ẩm thực</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="VD: Việt Nam, Ý, Nhật"
                            value={cuisineType}
                            onChange={(e) => setCuisineType(e.target.value)}
                          />
                        </div>
                      </div>
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Giờ mở cửa</label>
                      <div className="row g-2 mb-2">
                        <div className="col-5">
                          <select
                            className="form-control"
                            value={newOpeningHour.day}
                            onChange={(e) => setNewOpeningHour({ ...newOpeningHour, day: e.target.value })}
                          >
                            <option value="">Chọn ngày</option>
                            <option value="Thứ 2">Thứ 2</option>
                            <option value="Thứ 3">Thứ 3</option>
                            <option value="Thứ 4">Thứ 4</option>
                            <option value="Thứ 5">Thứ 5</option>
                            <option value="Thứ 6">Thứ 6</option>
                            <option value="Thứ 7">Thứ 7</option>
                            <option value="Chủ nhật">Chủ nhật</option>
                            <option value="Tất cả các ngày">Tất cả các ngày</option>
                          </select>
                        </div>
                        <div className="col-5">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="VD: 09:00-22:00"
                            value={newOpeningHour.time}
                            onChange={(e) => setNewOpeningHour({ ...newOpeningHour, time: e.target.value })}
                          />
                        </div>
                        <div className="col-2">
                          <button
                            className="btn btn-outline-primary w-100"
                            type="button"
                            onClick={addOpeningHour}
                          >
                            <i className="bi bi-plus"></i>
                          </button>
                        </div>
                      </div>
                      {openingHoursList.length > 0 && (
                        <div className="mt-2">
                          <div className="d-flex flex-column gap-1">
                            {openingHoursList.map((hour, index) => (
                              <div
                                key={index}
                                className="d-flex justify-content-between align-items-center p-2 border rounded bg-light"
                              >
                                <span className="fw-semibold">{hour.day}:</span>
                                <span>{hour.time}</span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeOpeningHour(index)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="form-text">
                        Gợi ý: 09:00-22:00, 07:00-23:00, 24/7
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Dịch vụ</label>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={deliveryAvailable}
                          onChange={(e) => setDeliveryAvailable(e.target.checked)}
                        />
                        <label className="form-check-label">Giao hàng</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={takeoutAvailable}
                          onChange={(e) => setTakeoutAvailable(e.target.checked)}
                        />
                        <label className="form-check-label">Mang về</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={dineInAvailable}
                          onChange={(e) => setDineInAvailable(e.target.checked)}
                        />
                        <label className="form-check-label">Dùng tại chỗ</label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tùy chọn ăn kiêng</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập tùy chọn ăn kiêng và nhấn Enter hoặc +"
                          value={newDietaryOption}
                          onChange={(e) => setNewDietaryOption(e.target.value)}
                          onKeyPress={handleDietaryOptionKeyPress}
                        />
                        <button
                          className="btn btn-outline-primary"
                          type="button"
                          onClick={addDietaryOption}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                      {dietaryOptionsList.length > 0 && (
                        <div className="mt-2">
                          <div className="d-flex flex-wrap gap-1">
                            {dietaryOptionsList.map((option, index) => (
                              <span
                                key={index}
                                className="badge bg-info d-flex align-items-center gap-1"
                                style={{ fontSize: '0.875rem' }}
                              >
                                {option}
                                <button
                                  type="button"
                                  className="btn-close btn-close-white"
                                  style={{ fontSize: '0.5rem' }}
                                  onClick={() => removeDietaryOption(index)}
                                ></button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="form-text">
                        Gợi ý: Chay, Thuần chay, Không gluten, Không sữa, Hải sản
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tính năng</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập tính năng và nhấn Enter hoặc +"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyPress={handleFeatureKeyPress}
                        />
                        <button
                          className="btn btn-outline-primary"
                          type="button"
                          onClick={addFeature}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                      {featuresList.length > 0 && (
                        <div className="mt-2">
                          <div className="d-flex flex-wrap gap-1">
                            {featuresList.map((feature, index) => (
                              <span
                                key={index}
                                className="badge bg-warning text-dark d-flex align-items-center gap-1"
                                style={{ fontSize: '0.875rem' }}
                              >
                                {feature}
                                <button
                                  type="button"
                                  className="btn-close"
                                  style={{ fontSize: '0.5rem' }}
                                  onClick={() => removeFeature(index)}
                                ></button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="form-text">
                        Gợi ý: Chỗ ngồi ngoài trời, Nhạc sống, Ghép rượu, WiFi, Đỗ xe
                      </div>
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
                        id="restaurant-image-upload"
                      />
                      <label htmlFor="restaurant-image-upload" className="btn btn-outline-primary btn-sm">
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
                                  alt={`Nhà hàng ${index + 1}`}
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
                                      onClick={() => moveImageToFirst(index)}
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
                                    alt={`Nhà hàng ${index + 1}`}
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
                        Cập nhật Nhà hàng
                      </Button>
                      <Button variant="secondary" onClick={() => { setEditId(null); resetForm(); }}>
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" className="admin-main-btn" onClick={handleCreate}>
                      Tạo Nhà hàng
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Restaurants List */}
            <div className="card">
              <div className="card-header">
                <h5>Tất cả Nhà hàng</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hình ảnh</th>
                        <th>Tên</th>
                        <th>Ẩm thực</th>
                        <th>Thành phố</th>
                        <th>Địa chỉ</th>
                        <th>Mức giá</th>
                        <th>Đánh giá</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.map((restaurant) => (
                        <tr key={restaurant.id}>
                          <td>{restaurant.id}</td>
                          <td>
                            {restaurant.images && restaurant.images.length > 0 ? (
                              (() => {
                                const mainImg = restaurant.images.find(img => img.is_primary) || restaurant.images[0];
                                return (
                                  <img
                                    src={getImageUrl(mainImg.image_url)}
                                    alt={restaurant.name}
                                    style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                  />
                                );
                              })()
                            ) : (
                              <div style={{ width: "50px", height: "50px", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <i className="bi bi-cup-hot"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <Link to={`/restaurants/${restaurant.id}`}>{restaurant.name}</Link>
                          </td>
                          <td>
                            {restaurant.cuisine_type && (
                              <span className="badge bg-primary">{restaurant.cuisine_type}</span>
                            )}
                          </td>
                          <td>{restaurant.city}</td>
                          <td>
                            <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {restaurant.address}
                            </div>
                          </td>
                          <td>{restaurant.price_range}</td>
                          <td>{restaurant.rating ? restaurant.rating.toFixed(1) : '0.0'}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <Button variant="outline-primary" size="sm" onClick={() => openMenuModal(restaurant)}>Quản lý thực đơn</Button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(restaurant)}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(restaurant.id)}
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
          Bạn có chắc chắn muốn xóa nhà hàng này? Hành động này không thể hoàn tác.
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

      {/* Menu Management Modal */}
      <Modal show={showMenuModal} onHide={() => setShowMenuModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Quản lý thực đơn cho {selectedRestaurant?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6>Các mục thực đơn</h6>
            <Button variant="outline-primary" onClick={() => setShowMenuForm(true)}>
              <i className="bi bi-plus-circle me-1"></i>
              Thêm mục thực đơn
            </Button>
          </div>
          {menuLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : menus.length === 0 ? (
            <p>Chưa có mục thực đơn nào cho nhà hàng này.</p>
          ) : (
            <div className="list-group">
              {menus.map((menu) => (
                <div key={menu.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">{menu.name}</h6>
                    <p className="mb-0 text-muted">{menu.description}</p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button variant="outline-info" size="sm" onClick={() => fetchMenuItems(menu.id)}>
                      <i className="bi bi-list-ul me-1"></i>
                      Xem mục
                    </Button>
                    <Button variant="outline-warning" size="sm" onClick={() => setMenuEdit(menu)}>
                      <i className="bi bi-pencil-square me-1"></i>
                      Sửa
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteMenu(menu.id)}>
                      <i className="bi bi-trash me-1"></i>
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Menu Section Tabs */}
          <div className="d-flex gap-2 mb-3">
            {menus.map((menu) => (
              <Button
                key={menu.id}
                variant={selectedMenu && selectedMenu.id === menu.id ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => handleSelectMenu(menu)}
              >
                {menu.name}
              </Button>
            ))}
            <Button variant="outline-success" size="sm" onClick={() => setShowMenuForm(true)}>
              <i className="bi bi-plus-circle me-1"></i> Thêm mục thực đơn
            </Button>
          </div>
          {/* Food List for Selected Menu */}
          {selectedMenu ? (
            <div>
              <h6>Món ăn trong mục: {selectedMenu.name}</h6>
              {menuItemLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : menuItems.length === 0 ? (
                <p>Chưa có món ăn nào trong mục này.</p>
              ) : (
                <div className="list-group">
                  {menuItems.map((item) => (
                    <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{item.name}</h6>
                        <p className="mb-0 text-muted">{item.description}</p>
                        <p className="mb-0 text-muted">Giá: {item.price ? item.price.toLocaleString('vi-VN') + ' VND' : '---'}</p>
                        {item.image_url && (
                          <img src={item.image_url.startsWith('http') ? item.image_url : `https://walkingguide.onrender.com${item.image_url}`} alt={item.name} style={{ maxWidth: 80, borderRadius: 8, marginTop: 4 }} />
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="outline-warning" size="sm" onClick={() => setMenuItemEdit(item)}>
                          <i className="bi bi-pencil-square me-1"></i>
                          Sửa
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteMenuItem(item.id)}>
                          <i className="bi bi-trash me-1"></i>
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button className="mt-3" variant="primary" onClick={() => {
                setMenuItemEdit({ name: '', description: '', price: '', image_url: '' });
                setMenuItemImage(null);
                setMenuItemImagePreview(null);
                setShowMenuItemForm(true);
              }}>
                Thêm món ăn
              </Button>
            </div>
          ) : (
            <div className="text-muted">Chưa có mục thực đơn nào. Hãy thêm mục thực đơn trước.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMenuModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Menu Form Modal */}
      <Modal show={showMenuForm} onHide={() => setShowMenuForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{menuEdit ? 'Sửa mục thực đơn' : 'Thêm mục thực đơn'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tên mục thực đơn *</Form.Label>
            <Form.Control
              type="text"
              value={menuEdit?.name || ''}
              onChange={(e) => setMenuEdit({ ...menuEdit, name: e.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mô tả (tùy chọn)</Form.Label>
            <Form.Control
              type="text"
              value={menuEdit?.description || ''}
              onChange={(e) => setMenuEdit({ ...menuEdit, description: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMenuForm(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveMenu}>
            {menuEdit ? 'Cập nhật' : 'Thêm'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Menu Item Form Modal */}
      <Modal show={showMenuItemForm} onHide={() => setShowMenuItemForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{menuItemEdit ? 'Sửa mục thực đơn' : 'Thêm mục thực đơn'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tên mục thực đơn *</Form.Label>
            <Form.Control
              type="text"
              value={menuItemEdit?.name || ''}
              onChange={(e) => setMenuItemEdit({ ...menuItemEdit, name: e.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mô tả (tùy chọn)</Form.Label>
            <Form.Control
              type="text"
              value={menuItemEdit?.description || ''}
              onChange={(e) => setMenuItemEdit({ ...menuItemEdit, description: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Giá (VND)</Form.Label>
            <Form.Control
              type="number"
              value={menuItemEdit?.price || ''}
              onChange={(e) => setMenuItemEdit({ ...menuItemEdit, price: e.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Hình ảnh món ăn</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleMenuItemImageChange} />
            {menuItemImagePreview && (
              <img src={menuItemImagePreview} alt="Preview" style={{ maxWidth: 120, marginTop: 8, borderRadius: 8 }} />
            )}
            {!menuItemImagePreview && menuItemEdit?.image_url && (
              <img src={menuItemEdit.image_url.startsWith('http') ? menuItemEdit.image_url : `https://walkingguide.onrender.com${menuItemEdit.image_url}`} alt="Preview" style={{ maxWidth: 120, marginTop: 8, borderRadius: 8 }} />
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMenuItemForm(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveMenuItem}>
            {menuItemEdit ? 'Cập nhật' : 'Thêm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default RestaurantsAdmin; 