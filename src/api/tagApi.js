import axios from "./axiosClient";

export const getTags = () => axios.get("/tags");
export const getTag = (id) => axios.get(`/tags/${id}`);
export const createTag = (data) => axios.post("/tags", data);
export const updateTag = (id, data) => axios.put(`/tags/${id}`, data);
export const deleteTag = (id) => axios.delete(`/tags/${id}`); 