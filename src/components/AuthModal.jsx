import React from "react";

function AuthModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="auth-modal-overlay" style={{position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.25)', zIndex: 2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="auth-modal-content" style={{background:'#fff', borderRadius:16, boxShadow:'0 8px 32px 0 rgba(31,38,135,0.15)', padding:32, minWidth:340, maxWidth:420, width:'100%', position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute', top:12, right:16, border:'none', background:'none', fontSize:22, color:'#888', cursor:'pointer'}} aria-label="Đóng">&times;</button>
        {children}
      </div>
    </div>
  );
}

export default AuthModal;
