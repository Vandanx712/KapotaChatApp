import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});

const buildParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

//All auth apis

export const requestSignupOtp = async (data) => {
  const response = await api.post('/auth/signup/request-otp', data)
  return response.data
}

export const verifySignupOtp = async (data) => {
  const response = await api.post('/auth/signup/verify', data)
  return response.data
}

export const loginuser = async (data) => {
  const response = await api.post('/auth/login', data)
  return response.data
}

export const logout = async (data) => {
  const response = await api.post('/auth/logout', data)
  return response.data
}

export const checkUser = async () => {
  const response = await api.get('/auth/check')
  return response.data
}

export const requestForgotPasswordOtp = async (data) => {
  const response = await api.post('/auth/forgot-password/request-otp', data)
  return response.data
}

export const verifyForgotPasswordOtp = async (data) => {
  const response = await api.post('/auth/forgot-password/verify', data)
  return response.data
}

export const getActiveSessions = async () => {
  const response = await api.get('/auth/sessions')
  return response.data
}

//linked device part

export const qrLoginRequest = async () => {
  const response = await api.post('/auth/qr-login/request')
  return response.data
}

export const qrLoginComplete = async (data) => {
  const response = await api.post("/auth/qr-login/complete", data)
  return response.data
}

// media upload part

export const prepareMediaUpload = async (data) => {
  const response = await api.post("/media/prepare", data);
  return response.data;
};

export const completeMediaUpload = async (assetId) => {
  const response = await api.post("/media/complete", { assetId });
  return response.data;
};

export const getMediaAccess = async (
  mediaId,
  disposition = "inline",
) => {
  const response = await api.get(`/media/${mediaId}/access`, {
    params: { disposition },
  });

  return response.data.access;
};

//profile part

export const getAvatars = async (data) => {
  const response = await api.post('/user/getavatar', data)
  return response.data
}

export const updatePic = async (data) => {
  const response = await api.put('/user/pic', data)
  return response.data
}

export const updateProfile = async (data) => {
  const response = await api.put('/user/updateprofile', data)
  return response.data
}

// explore part

export const getSurroundUsers = async (params = {}) => {
  const response = await api.get('/conversation/getusers', {
    params: buildParams(params),
  })
  return response.data
}

export const getAllUsers = async (params = {}) => {
  const response = await api.get('/user/getusers', {
    params: buildParams(params),
  })
  return response.data
}

//conversation part

export const getConversations = async () => {
  const response = await api.get('/conversation/')
  return response.data
}

export const createConversation = async (data) => {
  const response = await api.post(`/conversation/${data}`)
  return response.data
}

export const createGroup = async (data) => {
  const response = await api.post('/conversation/group/create', data)
  return response.data
}

export const getOtherUsers = async (id, params = {}) => {
  const response = await api.get(`/conversation/otherusers/${id}`, {
    params: buildParams(params),
  })
  return response.data
}

export const updateGroupDetail = async (data) => {
  const response = await api.put('/conversation/update/group', data)
  return response.data
}

export const updateMembers = async (data) => {
  const response = await api.put('/conversation/update/member', data)
  return response.data
}

export const updateConBgimage = async (data) => {
  const response = await api.put('/conversation/settheme', data)
  return response.data
}

export const contactDetail = async (id, params = {}) => {
  const response = await api.get(`/user/${id}`, {
    params: buildParams(params),
  })
  return response.data
}

export const deleteConversation = async (id) => {
  const response = await api.delete(`/conversation/delete/${id}`)
  return response.data
}

export const exitGroup = async (id) => {
  const response = await api.put(`/conversation/exitgroup/${id}`)
  return response.data
}

// message part

export const getMessages = async (id, params = {}) => {
  const response = await api.get(`/message/${id}`, {
    params: buildParams(params),
  })
  return response.data
}

export const getMessageImgs = async (id, params = {}) => {
  const response = await api.get(`/message/media/${id}`, {
    params: buildParams(params)
  })
  return response.data
}

export const sendMessage = async (id, data) => {
  const response = await api.post(`/message/${id}`, data)
  return response.data
}

export const updateMessage = async (id, data) => {
  const response = await api.put(`/message/update/${id}`, data)
  return response.data
}

export const reactToMessage = async (id, data) => {
  const response = await api.put(`/message/${id}/reaction`, data)
  return response.data
}

export const deleteMessage = async (id, data) => {
  await api.put(`/message/delete/${id}`, data)
}

export const clearChat = async (id) => {
  const res = await api.put(`/message/clear/${id}`)
  return res.data
}

export const searchMessages = async (id, params = {}) => {
  const response = await api.get(`/message/search/${id}`, { params })
  return response.data
}

//post part
export const createPost = async (data) => {
  const response = await api.post('/post/', data)
  return response.data
}

export const getMyPosts = async (params = {}) => {
  const response = await api.get('/post/myposts', {
    params: buildParams(params),
  })
  return response.data
}

export const updatePostSettings = async (data) => {
  const response = await api.put('/post/', data)
  return response.data
}

export const deletePost = async (id) => {
  const response = await api.delete(`/post/${id}`)
  return response.data
}

export const postFeed = async (params = {}) => {
  const response = await api.get('/post/feed', {
    params: buildParams(params),
  })
  return response.data
}

export const getPostDetail = async (id) => {
  const response = await api.get(`/post/detail/${id}`)
  return response.data
}

export const postLiked = async (id) => {
  const response = await api.put(`/post/${id}`)
  return response.data
}

//location 
export const getSuggestion = async () => {
  const response = await api.get('/service/get/places')
  return response.data
}

export const searchLocation = async (query) => {
  const response = await api.get(`/service/search?query=${query}`)
  return response.data
}

export const getPlaceDetail = async (id) => {
  const response = await api.get(`/service/detail/${id}`)
  return response.data
}
