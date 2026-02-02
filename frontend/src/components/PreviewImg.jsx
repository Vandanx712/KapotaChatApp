import { X } from 'lucide-react'
import React from 'react'

function PreviewImg({ detail, onclose }) {
    return (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 duration-200 backdrop-blur-sm z-50'>
            <div className=' flex  md:space-x-20'>
                <div className='p-5 items-center md:mt-5 mt-10'>
                    <img src={detail.profilePic.url} className="md:size-[600px] size-fit object-cover pl-10" />
                </div>
                <div className=''>
                    <button onClick={onclose}><X className='size-10 text-primary-content' /></button>
                </div>
            </div>
        </div>
    )
}

export default PreviewImg
