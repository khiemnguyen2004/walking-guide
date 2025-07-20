import React from "react";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-danger text-center">Lỗi hiển thị bản đồ. Vui lòng thử lại sau.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;