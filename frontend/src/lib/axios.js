import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});

//All auth apis



export const checkUser = async()=>{
  const response = await api.get('/auth/check')
  return response.data
}