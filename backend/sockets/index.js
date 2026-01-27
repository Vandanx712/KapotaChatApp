import chatSocket from "./chat.socket.js";

const socketHandler = (io) =>{
    io.on('connection',(socket)=>{
        console.log('Socket connected',socket.id)
        chatSocket(io,socket)
    })
}

export default socketHandler