import React, { useEffect } from 'react'
import { useChatStore } from '../store/useChatStore'
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import MessageSkeleton from '../components/skeletons/MessageSkeleton'
import { useAuthStore } from '../store/useAuthStore'
import { formatMessageTime } from '../lib/utils'

function ChatContainer() {
  const { message, getMessage, isMessageLoading, selectedConversation } = useChatStore()
  const { authUser } = useAuthStore()

  useEffect(() => {
    getMessage(selectedConversation.conversationId)
  }, [selectedConversation.conversationId, getMessage])

  if (isMessageLoading) return (<div className='flex-1 flex flex-col overflow-auto'>
    <ChatHeader />
    <MessageSkeleton />
    <MessageInput />
  </div>)
  return (
    <div className='flex-1 flex flex-col overflow-auto'>
      <ChatHeader />
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {message.map((m) => (
          <div key={m._id} className={`chat ${m.sender !== authUser._Id ? 'chat-end' : 'chat-start'}`}>
            <div className='chat-image avatar'>
              <div className='size-10 rounded-full border'>
                <img src={m.sender === authUser._Id ? authUser.profilePic.url || '' : selectedConversation.profilePic.url || ''} />
              </div>
            </div>
            <div className='chat-header mb-1'>
              <time className='text-sm opacity-50 ml-1'>
                {formatMessageTime(m.createdAt)}
              </time>
            </div>
            <div className='chat-bubble flex flex-col'>
              {m.image && (
                <img src={m.image} className='sm:max-w-[200px] rounded-md mb-2'/>
              )}
              {m.text && <p>{m.text}</p>}
            </div>
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  )
}

export default ChatContainer
