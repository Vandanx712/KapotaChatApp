import { X } from 'lucide-react'
import React from 'react'

function PreviewImg({ detail, onclose }) {
    return (
        <div className=''>
            <div className=' flex justify-center'>
                <div className='p-6 items-center lg:mt-0 md:mt-5 mt-10'>
                    <img src={detail.profilePic.url} className="md:size-[500px] size-max object-cover pl-10" />
                </div>
                <div className=' md:ml-10 mr-2'>
                    <button onClick={onclose}><X className='size-10' /></button>
                </div>
            </div>
        </div>
    )
}

export default PreviewImg
