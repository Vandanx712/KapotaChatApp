 # 1. Official lightweight Node.js 20 Linux Alpine runtime   
FROM node:20-alpine

# 2. Set working directory inside the container  
WORKDIR /usr/src/app

# 3. Layer Caching: Copy package manifests first 
COPY package*.json ./

# 4. Clean production installation (skips devDependencies like nodemon)
RUN npm ci --omit=dev

# 5. Copy the rest of backend application source code 
COPY . .

# 6. Security: Run container as non-root unprivileged user
USER node
                                                                                                    
# 7. Document the port Express runs on
EXPOSE 5001 

# 8. Start the Express + Socket.IO API server
CMD ["node","src/server.js"]