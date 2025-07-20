import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

export function AdminRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user?.role === "ADMIN" ? children : <Navigate to="/" />;
}
