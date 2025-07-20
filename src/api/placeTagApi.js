import axios from "./axiosClient";

export const getPlaceTags = () => axios.get("/place-tags");
export const getPlaceTag = (id) => axios.get(`/place-tags/${id}`);
export const createPlaceTag = (data) => axios.post("/place-tags", data);
export const updatePlaceTag = (id, data) => axios.put(`/place-tags/${id}`, data);
export const deletePlaceTag = (id) => axios.delete(`/place-tags/${id}`); 