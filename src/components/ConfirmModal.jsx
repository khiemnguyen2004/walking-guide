import React from "react";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal fade show" tabIndex="-1" style={{ display: "block", background: "rgba(0,0,0,0.25)", zIndex: 2000 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: "1.2rem" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title" style={{ fontWeight: 700, color: '#1a5bb8' }}>{title || "Xác nhận"}</h5>
          </div>
          <div className="modal-body text-center">
            <div className="mb-3" style={{ fontSize: "1.08rem" }}>{message}</div>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-main px-4" onClick={onConfirm}>Đồng ý</button>
              <button className="btn btn-outline-secondary px-4" onClick={onCancel}>Huỷ</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
