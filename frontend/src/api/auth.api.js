import api from './axios'


export const register = async(data)=>{
    const response = await api.post('/user/register',data)
    return response.data
}

export const loginuser = async(data)=>{
    const response = await api.post('/auth/login',data)
    return response.data
}

export const refresh = async(data)=>{
    const response = await api.post('/auth/refresh',data)
    return response.data
}