import React, { useEffect } from 'react'
import { useChatStore } from '../store/useChatStore'
import SidebarSkeleton from './skeletons/SidebarSkeleton'
import { Users } from 'lucide-react'

function Sidebar() {
    const { getConversation, conversations, setSelectedConversation, selectedConversation, isConversationLoading } = useChatStore()
    const {onlineUsers} = useChatStore()

    useEffect(() => {
        console.log(conversations,'checktype')
        getConversation()
    }, [getConversation])

    if (isConversationLoading) return <SidebarSkeleton />
    return (
        <aside className='h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200'>
            <div className=' border-b border-base-300 w-full p-5'>
                <div className="flex items-center gap-2">
                    <Users className="size-6" />
                    <span className="font-medium hidden lg:block">Contacts</span>
                </div>
                <div className="mt-3 hidden lg:flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            // checked={showOnlineOnly}
                            // onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm">Show online only</span>
                    </label>
                    <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
                </div>
            </div>

            <div className='overflow-y-auto w-full py-3'>
                {conversations.map((conversation) => (
                    <button
                        key={conversation.conversationId}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedConversation?.conversationId === conversation.conversationId ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
                    >
                        <div className="relative mx-auto lg:mx-0">
                            <img
                                src={conversation.profilePic.url || "/avatar.png"}
                                className="size-12 object-cover rounded-full"
                            />
                            {onlineUsers.includes(conversation.oruserId) && (
                                <span
                                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                                />
                            )}
                        </div>

                        {/* User info - only visible on larger screens */}
                        <div className="hidden lg:block text-left min-w-0">
                            <div className="font-medium truncate">{conversation.name}</div>
                            <div className="text-sm text-zinc-400">
                                {onlineUsers.includes(conversation.oruserId) ? "Online" : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}

                {/* {filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">No online users</div>
                )} */}
            </div>
        </aside>
    )
}

export default Sidebar
