import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'Trang chủ': 'Home',
      'Khám phá': 'Explore',
      'Chuyến đi của bạn': 'Your Bookings',
      'Trang cá nhân': 'Profile',
      'Đăng nhập': 'Login',
      'Đăng ký': 'Register',
      'Đăng xuất': 'Logout',
      'Thông báo': 'Notifications',
      'Khám phá & Lên Kế Hoạch Du Lịch Thông Minh': 'Discover & Plan Your Smart Trip',
      'Tìm kiếm địa điểm, tạo lộ trình cá nhân hoặc để chúng tôi gợi ý chuyến đi hoàn hảo cho bạn!': 'Find places, create your own itinerary, or let us suggest the perfect trip for you!',
      'Bắt đầu lên kế hoạch': 'Start Planning',
      'Tự tạo lộ trình': 'Manual Planning',
      'Bạn muốn tự lên kế hoạch chuyến đi? Hãy sử dụng chế độ thủ công để tự tạo tour theo ý thích của mình.': 'Want to plan your own trip? Use manual mode to create your custom tour.',
      'Tạo lộ trình tự động': 'Auto Planning',
      'Bạn muốn chúng tôi tạo lộ trình phù hợp? Hãy thử chế độ tự động để chúng tôi đề xuất tour cho bạn!': 'Want us to create a suitable itinerary? Try auto mode for our suggestions!',
      'Bạn chưa có dự định? Hãy cùng khám phá bản đồ du lịch!': 'No plans yet? Explore the travel map!',
      'Viết bài viết': 'Write Blog',
      'Các khách sạn hàng đầu': 'Top Hotels',
      'Đặt ngay': 'Booking now',
      'Xem tất cả khách sạn': 'View All Hotels',
      'Các nhà hàng nổi tiếg': 'Top Hotels',
      'Xem tất cả nhà hàng': 'View All Restaurants'
    }
  },
  vi: {
    translation: {
      'Home': 'Trang chủ',
      'Explore': 'Khám phá',
      'Your Bookings': 'Chuyến đi của bạn',
      'Profile': 'Hồ sơ',
      'Login': 'Đăng nhập',
      'Register': 'Đăng ký',
      'Logout': 'Đăng xuất',
      'Notifications': 'Thông báo',
      'Discover & Plan Your Smart Trip': 'Khám phá & Lên Kế Hoạch Du Lịch Thông Minh',
      'Find places, create your own itinerary, or let us suggest the perfect trip for you!': 'Tìm kiếm địa điểm, tạo lộ trình cá nhân hoặc để chúng tôi gợi ý chuyến đi hoàn hảo cho bạn!',
      'Start Planning': 'Bắt đầu lên kế hoạch',
      'Manual Planning': 'Tự tạo lộ trình',
      'Want to plan your own trip? Use manual mode to create your custom tour.': 'Bạn muốn tự lên kế hoạch chuyến đi? Hãy sử dụng chế độ thủ công để tự tạo tour theo ý thích của mình.',
      'Auto Planning': 'Tạo lộ trình tự động',
      'Want us to create a suitable itinerary? Try auto mode for our suggestions!': 'Bạn muốn chúng tôi tạo lộ trình phù hợp? Hãy thử chế độ tự động để chúng tôi đề xuất tour cho bạn!',
      'No plans yet? Explore the travel map!': 'Bạn chưa có dự định? Hãy cùng khám phá bản đồ du lịch!',
      'Trips & Itineraries': 'Chuyến đi & Lịch trình',
      'Featured Destinations': 'Điểm đến nổi bật',
      'Read interesting shares from travelers': 'Đọc những chia sẻ thú vị từ các du khách',
      'Plan Quickly with': 'Lên kế hoạch nhanh chóng với',
      'Your journey will be optimized with just one click!': 'Chuyến đi của bạn sẽ được tối ưu hóa chỉ với một cú nhấp chuột!',
      'Get Started with AutoPlanner': 'Bắt đầu với AutoPlanner',
      'Join Now': 'Tham gia ngay',
      'Explore More': 'Khám phá thêm',
      'About': 'Về chúng tôi',
      'Quick Links': 'Liên kết nhanh',
      'Contact': 'Liên hệ',
      'Follow Us': 'Theo dõi chúng tôi',
      'Developed by': 'Phát triển bởi',
      'Places': 'Địa điểm',
      'Tours': 'Tour',
      'Articles': 'Bài viết',
      'Write Blog': 'Viết bài viết',
      'Top Hotels': 'Các khách sạn hàng đầu',
      'Booking now': 'Đặt ngay',
      'View All Hotels': 'Xem tất cả khách sạn',
      'Top Restaurants': 'Các nhà hàng nổi tiếng',
      'View All Restaurants': 'Xem tất cả nhà hàng'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
