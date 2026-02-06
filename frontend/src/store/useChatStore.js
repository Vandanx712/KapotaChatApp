import { create } from 'zustand'
import toast from 'react-hot-toast'
import { getConversations, getMessages, sendMessage } from '../lib/axios'


export const useChatStore = create((set,get) => ({
    message: [],
    users: [],
    conversations:[],
    selectedUser: null,
    selectedConversation: null,
    isUsersLoading: false,
    isConversationLoading: false,
    isMessageLoading: false,

    getConversation: async () => {
        set({ isConversationLoading: true })
        try {
            const resdata = getConversations()
            set({conversations:resdata.filtered})
        } catch (error) {
            toast.error(error.response?.data.message)
        }finally{
            set({isConversationLoading:false})
        }
    },

    getMessage:async(conversationId)=>{
        set({isMessageLoading:true})
        try {
            const resdata = await getMessages(conversationId)
            set({messages:resdata})
        } catch (error) {
            toast.error(error.response?.data.message)
        }finally{
            set({isMessageLoading:false})
        }
    },

    sendMessage:async(messageData)=>{
        const {selectedConversation,message} = get()
        try {
            const resdata = await sendMessage(selectedConversation.conversationId,messageData)
            set({message:[...message,resdata.newMessage]})
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    setSelectedConversation:(selectedConversation)=>set({selectedConversation})
}))