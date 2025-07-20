import { HashRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserPage from "./pages/UserPage";
import PlacePage from "./pages/PlacePage";
import TourPage from "./pages/TourPage";
import ArticlePage from "./pages/ArticlePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import ArticlesAdmin from "./pages/admin/ArticlesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import PlacesAdmin from "./pages/admin/PlacesAdmin";
import HotelsAdmin from "./pages/admin/HotelsAdmin";
import RestaurantsAdmin from "./pages/admin/RestaurantsAdmin";
import ToursAdmin from "./pages/admin/ToursAdmin";
import BookingsAdmin from "./pages/admin/BookingsAdmin";
import TagsAdmin from "./pages/admin/TagsAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import { PrivateRoute, AdminRoute } from "./components/ProtectedRoute";
import ManualPlanner from "./components/ManualPlanner";
import TourList from "./components/TourList";
import AutoPlanner from "./components/AutoPlanner";
import ArticleDetail from './pages/details/ArticleDetail';
import PlaceDetail from './pages/details/PlaceDetail';
import TourDetail from './pages/details/TourDetail';
import MyTours from "./pages/MyTours";
import CreateArticle from "./pages/CreateArticle";
import NotificationPage from "./pages/NotificationPage";
import ScrollToTop from "./components/ScrollToTop";
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OtpInput from './pages/auth/OtpInput';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RatingStars from "./components/RatingStars";
import HotelDetail from './pages/details/HotelDetail';
import RestaurantDetail from './pages/details/RestaurantDetail';
import ToastContainer from './components/ToastContainer';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/otp" element={<OtpInput />} />
        <Route path="/users" element={<PrivateRoute><UserPage /></PrivateRoute>} />
        <Route path="/places" element={<PrivateRoute><PlacePage /></PrivateRoute>} />
        <Route path="/tours" element={<PrivateRoute><TourPage /></PrivateRoute>} />
        <Route path="/articles" element={<PrivateRoute><ArticlePage /></PrivateRoute>} />
        <Route path="/create-article" element={<PrivateRoute><CreateArticle /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationPage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UsersAdmin /></AdminRoute>} />
        <Route path="/admin/places" element={<AdminRoute><PlacesAdmin /></AdminRoute>} />
        <Route path="/admin/hotels" element={<AdminRoute><HotelsAdmin /></AdminRoute>} />
        <Route path="/admin/restaurants" element={<AdminRoute><RestaurantsAdmin /></AdminRoute>} />
        <Route path="/admin/articles" element={<AdminRoute><ArticlesAdmin /></AdminRoute>} />
        <Route path="/admin/tours" element={<AdminRoute><ToursAdmin /></AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute><BookingsAdmin /></AdminRoute>} />
        <Route path="/admin/tags" element={<AdminRoute><TagsAdmin /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><SettingsAdmin /></AdminRoute>} />
        <Route path="/manual-planner" element={<PrivateRoute><ManualPlanner /></PrivateRoute>} />
        <Route path="/my-tours" element={<PrivateRoute><MyTours /></PrivateRoute>} />
        <Route path="/ai/generate-tour" element={<PrivateRoute><AutoPlanner /></PrivateRoute>} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        <Route path="/articles/:id/report" element={<ArticleDetail />} />
        <Route path="/places/:id" element={<PlaceDetail />} />
        <Route path="/tours/:id" element={<TourDetail />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
        <Route path="/place-ratings/rate/:id" element={<RatingStars />} />
      </Routes>
    </Router>
  );
}

export default App;
