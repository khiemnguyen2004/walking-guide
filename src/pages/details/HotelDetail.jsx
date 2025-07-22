import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../../css/luxury-home.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import hotelApi from '../../api/hotelApi';
import { Modal, Button, Form } from 'react-bootstrap';
import { AuthContext } from '../../contexts/AuthContext';
import RatingStars from '../../components/RatingStars';
import formatVND from '../../utils/formatVND';

const BASE_URL = "https://walkingguide.onrender.com";

const HotelDetail = () => {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalImg, setModalImg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingCheckIn, setBookingCheckIn] = useState("");
  const [bookingCheckOut, setBookingCheckOut] = useState("");
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setLoading(true);
    axios.get(`${BASE_URL}/api/hotels/${id}`)
      .then(res => setHotel(res.data.data))
      .catch(() => setError('Không tìm thấy khách sạn này.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  if (error) return <div className="alert alert-danger mt-4 text-center">{error}</div>;
  if (!hotel) return <div className="alert alert-warning mt-4 text-center">Không tìm thấy khách sạn.</div>;

  const imageUrls = hotel.images ? hotel.images.map(img => img.image_url) : [];
  const mainImage = imageUrls.length > 0 ? (imageUrls[0].startsWith('http') ? imageUrls[0] : `${BASE_URL}${imageUrls[0]}`) : null;
  const galleryImages = imageUrls.length > 1 ? imageUrls.slice(1) : [];

  // Modal handler
  const handleImageClick = (imgUrl) => {
    setModalImg(imgUrl);
    setShowModal(true);
  };

  return (
    <div className="luxury-home-container">
      <Header />
      <div className="container py-4">
        <div className="row g-3 align-items-start" style={{ minHeight: 350 }}>
          {/* Info Left */}
          <div className="col-md-7 col-12">
            <h2 className="fw-bold mb-2" style={{color: '#1a5bb8'}}>{hotel.name}</h2>
            <RatingStars id={hotel.id} type="hotel" />
            <div className="mb-2"><i className="bi bi-geo-alt me-2 text-primary"></i><b>Địa chỉ:</b> <span className="text-dark">{hotel.address || '---'}</span></div>
            <div className="mb-2"><i className="bi bi-building me-2 text-secondary"></i><b>Thành phố:</b> <span className="text-dark">{hotel.city || '---'}</span></div>
            <div className="mb-2"><i className="bi bi-telephone me-2 text-success"></i><b>Liên hệ:</b> <span className="text-dark">{hotel.phone || '---'}</span></div>
            <div className="mb-2"><i className="bi bi-star me-2 text-warning"></i><b>Hạng sao:</b> <span className="text-dark">{hotel.stars || '---'}</span></div>
            <div className="mb-2"><i className="bi bi-currency-dollar me-2 text-success"></i><b>Giá:</b> <span className="text-dark">{hotel.price ? hotel.price.toLocaleString('vi-VN') + ' VND' : '---'}</span></div>
            <div className="mb-2"><i className="bi bi-info-circle me-2 text-info"></i><b>Mô tả:</b> <span className="text-muted">{hotel.description || '---'}</span></div>
            {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
              <div className="mb-2">
                <i className="bi bi-gem me-2 text-info"></i><b>Tiện nghi:</b>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {hotel.amenities.map((am, idx) => (
                    <span key={idx} className="badge bg-light text-dark border border-1 px-3 py-2" style={{fontSize: '1em', borderRadius: 12}}>{am}</span>
                  ))}
                </div>
              </div>
            )}
            <Button className="mt-3 btn btn-main" onClick={() => setShowBookingModal(true)}>
              <i className="bi bi-calendar-check me-2"></i>Đặt phòng khách sạn
            </Button>
            {bookingStatus === 'success' && <div className="alert alert-success mt-3">Đặt phòng thành công!</div>}
            {bookingStatus === 'error' && <div className="alert alert-danger mt-3">Đặt phòng thất bại. Vui lòng thử lại.</div>}
          </div>
          {/* Image Right */}
          <div className="col-md-5 col-12 d-flex flex-column align-items-end">
            {mainImage ? (
              <img src={mainImage} alt={hotel.name} style={{width: '100%', maxWidth: 400, maxHeight: 300, objectFit: 'cover', borderRadius: 16, marginBottom: 8, cursor: 'pointer'}} onClick={() => handleImageClick(mainImage)} />
            ) : (
              <div className="d-flex align-items-center justify-content-center bg-light" style={{width: '100%', maxWidth: 400, height: 220, borderRadius: 16}}>
                <i className="bi bi-image text-muted" style={{fontSize: '4rem'}}></i>
              </div>
            )}
            {galleryImages.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2 justify-content-end">
                {galleryImages.map((img, idx) => {
                  const imgUrl = img.startsWith('http') ? img : `${BASE_URL}${img}`;
                  return (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={hotel.name}
                      style={{height: 60, width: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e9ecef', background: '#f8f9fa', cursor: 'pointer'}}
                      onClick={() => handleImageClick(imgUrl)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Image Modal */}
      {showModal && (
        <div className="modal fade show" style={{display:'block', background:'rgba(0,0,0,0.7)'}} tabIndex="-1" onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content bg-transparent border-0">
              <button type="button" className="btn-close btn-close-white ms-auto" style={{fontSize: 24}} onClick={() => setShowModal(false)}></button>
              <img src={modalImg} alt="Preview" className="img-fluid rounded-4 shadow" style={{maxHeight: '70vh', maxWidth: '90vw', display: 'block', margin: '0 auto'}} />
            </div>
          </div>
        </div>
      )}
      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đặt phòng khách sạn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ngày nhận phòng</Form.Label>
              <Form.Control type="date" value={bookingCheckIn} onChange={e => setBookingCheckIn(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ngày trả phòng</Form.Label>
              <Form.Control type="date" value={bookingCheckOut} onChange={e => setBookingCheckOut(e.target.value)} />
            </Form.Group>
            {hotel && hotel.room_types && (
              <Form.Group className="mb-3">
                <Form.Label>Loại phòng</Form.Label>
                <Form.Select value={selectedRoomType} onChange={e => setSelectedRoomType(e.target.value)}>
                  <option value="">Chọn loại phòng</option>
                  {Array.isArray(hotel.room_types)
                    ? hotel.room_types.map((type, idx) => (
                        typeof type === 'object'
                          ? <option key={idx} value={type.type}>{type.type}</option>
                          : <option key={idx} value={type}>{type}</option>
                      ))
                    : (JSON.parse(hotel.room_types || '[]')).map((type, idx) => (
                        typeof type === 'object'
                          ? <option key={idx} value={type.type}>{type.type}</option>
                          : <option key={idx} value={type}>{type}</option>
                      ))}
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
            Đóng
          </Button>
          <Button variant="success" onClick={async () => {
            setBookingStatus(null);
            try {
              await hotelApi.bookHotel({
                user_id: user?.id,
                hotel_id: hotel.id,
                check_in: bookingCheckIn,
                check_out: bookingCheckOut,
                room_type: selectedRoomType,
              });
              setBookingStatus('success');
            } catch {
              setBookingStatus('error');
            }
          }} disabled={!bookingCheckIn || !bookingCheckOut || (Array.isArray(hotel.room_types) && hotel.room_types.length > 0 && !selectedRoomType)}>
            Xác nhận đặt phòng
          </Button>
        </Modal.Footer>
      </Modal>
      <Footer />
    </div>
  );
};

export default HotelDetail; 