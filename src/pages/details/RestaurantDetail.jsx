import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../../css/luxury-home.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Button, Form } from 'react-bootstrap';
import RatingStars from '../../components/RatingStars';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingTime, setBookingTime] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3000/api/restaurants/${id}`)
      .then(res => setRestaurant(res.data.data))
      .catch(() => setError('Không tìm thấy nhà hàng này.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setMenuLoading(true);
    axios.get(`http://localhost:3000/api/restaurants/${id}/menus`)
      .then(async res => {
        const menus = res.data.data || [];
        const menusWithItems = await Promise.all(menus.map(async (menu) => {
          const itemsRes = await axios.get(`http://localhost:3000/api/restaurants/menus/${menu.id}/items`).catch(() => ({ data: { data: [] } }));
          return { ...menu, items: itemsRes.data.data || [] };
        }));
        setMenu(menusWithItems);
        setSelectedMenu(menusWithItems.length > 0 ? menusWithItems[0] : null);
      })
      .catch(() => { setMenu([]); setSelectedMenu(null); })
      .finally(() => setMenuLoading(false));
  }, [id]);

  if (loading) return <div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  if (error) return <div className="alert alert-danger mt-4 text-center">{error}</div>;
  if (!restaurant) return <div className="alert alert-warning mt-4 text-center">Không tìm thấy nhà hàng.</div>;

  const imageUrls = restaurant.images ? restaurant.images.map(img => img.image_url) : [];
  const mainImage = imageUrls.length > 0 ? (imageUrls[0].startsWith('http') ? imageUrls[0] : `http://localhost:3000${imageUrls[0]}`) : null;
  const galleryImages = imageUrls.length > 1 ? imageUrls.slice(1) : [];

  const handleBookTable = async (e) => {
    e.preventDefault();
    if (!user) {
      setBookingStatus({ success: false, message: 'Bạn cần đăng nhập để đặt bàn.' });
      return;
    }
    try {
      const res = await axios.post(`http://localhost:3000/api/restaurants/${id}/bookings`, {
        user_id: user.id,
        restaurant_id: id,
        booking_time: bookingTime,
        number_of_people: numberOfPeople,
        special_requests: specialRequests,
      });
      setBookingStatus({ success: true, message: 'Đặt bàn thành công!' });
      setShowBookingModal(false);
    } catch (err) {
      setBookingStatus({ success: false, message: 'Đặt bàn thất bại. Vui lòng thử lại.' });
    }
  };

  return (
    <div className="luxury-home-container">
      <Header />
      <div className="container py-4">
        <div className="row g-3 align-items-start" style={{ minHeight: 350 }}>
          {/* Info Left */}
          <div className="col-md-7 col-12">
            <h2 className="fw-bold mb-2" style={{color: '#1a5bb8'}}>{restaurant.name}</h2>
            <RatingStars id={restaurant.id} type="restaurant" />
            <div className="mb-2"><i className="bi bi-geo-alt me-2 text-primary"></i><b>Địa chỉ:</b> <span className="text-dark">{restaurant.address || '---'}</span></div>
            <div className="mb-2"><i className="bi bi-building me-2 text-secondary"></i><b>Thành phố:</b> <span className="text-dark">{restaurant.city || '---'}</span></div>
            <div className="mb-2"><i className="bi bi-telephone me-2 text-success"></i><b>Liên hệ:</b> <span className="text-dark">{restaurant.phone || '---'}</span></div>
            <div className="mb-2"><i className="bi bi-star me-2 text-warning"></i><b>Đánh giá:</b> <span className="text-dark">{restaurant.rating || '---'}</span></div>
            <div className="mb-2"><i className="bi bi-info-circle me-2 text-info"></i><b>Mô tả:</b> <span className="text-muted">{restaurant.description || '---'}</span></div>
            {restaurant.cuisine_type && (
              <div className="mb-2"><i className="bi bi-egg-fried me-2 text-danger"></i><b>Loại ẩm thực:</b> <span className="text-dark">{restaurant.cuisine_type}</span></div>
            )}
            {Array.isArray(restaurant.features) && restaurant.features.length > 0 && (
              <div className="mb-2">
                <i className="bi bi-gem me-2 text-info"></i><b>Tiện ích:</b>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {restaurant.features.map((ft, idx) => (
                    <span key={idx} className="badge bg-light text-dark border border-1 px-3 py-2" style={{fontSize: '1em', borderRadius: 12}}>{ft}</span>
                  ))}
                </div>
              </div>
            )}
            <Button className="mt-3 btn btn-main" onClick={() => setShowBookingModal(true)}>
              Đặt bàn ngay
            </Button>
            {bookingStatus && (
              <div className={`alert mt-3 ${bookingStatus.success ? 'alert-success' : 'alert-danger'}`}>{bookingStatus.message}</div>
            )}
            {/* Menu Section */}
            <div className="mt-4">
              <h4 className="fw-bold mb-3">Thực đơn</h4>
              {menuLoading ? (
                <div>Đang tải thực đơn...</div>
              ) : menu.length === 0 ? (
                <div className="text-muted">Nhà hàng chưa có thực đơn.</div>
              ) : (
                <>
                  {/* Menu section tabs */}
                  <div className="d-flex overflow-auto mb-3" style={{gap: 8}}>
                    {menu.map((section) => (
                      <Button
                        key={section.id}
                        variant={selectedMenu && selectedMenu.id === section.id ? 'primary' : 'outline-primary'}
                        className="me-2 btn btn-main"
                        onClick={() => setSelectedMenu(section)}
                        style={{whiteSpace: 'nowrap'}}
                      >
                        {section.name}
                      </Button>
                    ))}
                  </div>
                  {/* Food cards for selected section */}
                  {selectedMenu && selectedMenu.items && selectedMenu.items.length > 0 ? (
                    <div className="row g-3">
                      {selectedMenu.items.map(item => (
                        <div className="col-md-6 col-lg-4" key={item.id}>
                          <div className="card h-100 shadow-sm">
                            {item.image_url && (
                              <img src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:3000${item.image_url}`} alt={item.name} className="card-img-top" style={{height: 160, objectFit: 'cover'}} />
                            )}
                            <div className="card-body">
                              <h6 className="card-title mb-1 fw-bold">{item.name}</h6>
                              <div className="mb-1 text-success">{item.price ? item.price.toLocaleString('vi-VN') + ' VND' : ''}</div>
                              <div className="card-text text-muted" style={{fontSize: '0.95em'}}>{item.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted">Chưa có món ăn nào trong mục này.</div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Image Right */}
          <div className="col-md-5 col-12 d-flex flex-column align-items-end">
            {mainImage ? (
              <img src={mainImage} alt={restaurant.name} style={{width: '100%', maxWidth: 400, maxHeight: 300, objectFit: 'cover', borderRadius: 16, marginBottom: 8}} />
            ) : (
              <div className="d-flex align-items-center justify-content-center bg-light" style={{width: '100%', maxWidth: 400, height: 220, borderRadius: 16}}>
                <i className="bi bi-image text-muted" style={{fontSize: '4rem'}}></i>
              </div>
            )}
            {galleryImages.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2 justify-content-end">
                {galleryImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.startsWith('http') ? img : `http://localhost:3000${img}`}
                    alt={restaurant.name}
                    style={{height: 60, width: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e9ecef', background: '#f8f9fa'}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đặt bàn tại {restaurant?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleBookTable}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Ngày & Giờ</Form.Label>
              <Form.Control type="datetime-local" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Số người</Form.Label>
              <Form.Control type="number" min={1} max={30} value={numberOfPeople} onChange={e => setNumberOfPeople(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ghi chú đặc biệt</Form.Label>
              <Form.Control as="textarea" rows={2} value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="(Không bắt buộc)" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit">Đặt bàn</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Footer />
    </div>
  );
};

export default RestaurantDetail; 