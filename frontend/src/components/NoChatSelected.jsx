import React from 'react'
import {MessageSquare} from 'lucide-react'
import Logo from './common/Logo'

function NoChatSelected() {
    return (
        <div className="w-full hidden lg:flex flex-1 flex-col items-center justify-center p-16 bg-base-100">
            <div className="max-w-md text-center space-y-6">
                {/* Icon Display */}
                <div className="flex justify-center gap-4">
                    <div className="relative">
                        <Logo size={64} className='animate-bounce'/>
                    </div>
                </div>

                {/* Welcome Text */}
                <h2 className="text-2xl font-bold">Welcome to Kapota!</h2>
                <p className="text-base-content/60">
                    Select a conversation from the sidebar to start chatting
                </p>
            </div>
        </div>
    )
}

export default NoChatSelected
