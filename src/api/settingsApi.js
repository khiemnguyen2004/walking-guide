import axios from "./axiosClient";

export const getFooterSettings = () => axios.get("/settings/footer");
export const updateFooterSettings = (data) => axios.put("/settings/footer", data); 