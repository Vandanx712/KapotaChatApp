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

export const forgetPassword = async(data)=>{
  const response = await api.post('/auth/forget-password',data)
  return response.data
}

//profile part

export const getAvatars = async(data)=>{
  const response = await api.post('/user/getavatar',data)
  return response.data
}

export const updatePic = async(data)=>{
  const response = await api.put('/user/pic',data)
  return response.data
}

export const updateProfile = async(data)=>{
  const response = await api.put('/user/updateprofile',data)
  return response.data
}

// explore part

export const getSurroundUsers = async()=>{
  const response = await api.get('/conversation/getusers')
  return response.data
}

export const getAllUsers = async()=>{
  const response = await api.get('/user/getusers')
  return response.data
}

//conversation part

export const getConversations = async()=>{
  const response = await api.get('/conversation/')
  return response.data
}

export const createConversation = async(data)=>{
  const response = await api.post(`/conversation/${data}`)
  return response.data
}

export const createGroup = async(data)=>{
  const response = await api.post('/conversation/group/create',data)
  return response.data
}

export const updateConBgimage = async(data)=>{
  const response = await api.put('/conversation/settheme',data)
  return response.data
}

// message part

export const getMessages = async(id)=>{
  const response = await api.get(`/message/${id}`)
  return response.data
}

export const sendMessage = async(id,data)=>{
  const response = await api.post(`/message/${id}`,data)
  return response.data
}

export const updateMessage = async(id,data)=>{
  await api.put(`/message/update/${id}`,data)
}

export const deleteMessage = async(id,data)=>{
  await api.put(`/message/delete/${id}`,data)
}

export const clearChat = async(id)=>{
  const res = await api.put(`/message/clear/${id}`)
  return res.data
}