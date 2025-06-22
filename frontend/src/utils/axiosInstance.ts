import axios, { AxiosHeaders } from "axios";

const getAxiosInstance = (headers?: AxiosHeaders) =>
  axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

export default getAxiosInstance;
