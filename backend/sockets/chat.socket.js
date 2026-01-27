import jwt from "jsonwebtoken";

export const initsocket = (io) => {

  io.use((socket,next)=>{
    const token = socket.handshake.auth.token 
    if(!token) console.log('Unauthorized')

    try {
        const payload = jwt.verify(token,process.env.ACCESS_TOKEN)
        socket.userId = payload.id
        next()
    } catch (error) {
        next(error)
    }
  });

  io.on('connection',(socket)=>{
    console.log('socket connected:',socket.userId)
  })
};
