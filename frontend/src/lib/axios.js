import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});

//All auth apis

export const register = async(data)=>{
  const response = await api.post('/auth/signup',data)
  return response.data
}

export const loginuser = async(data)=>{
  const response = await api.post('/auth/login',data)
  return response.data
}

export const logout = async(data)=>{
  const response = await api.post('/auth/logout',data)
  return response.data
}

export const checkUser = async()=>{
  const response = await api.get('/auth/check')
  return response.data
}