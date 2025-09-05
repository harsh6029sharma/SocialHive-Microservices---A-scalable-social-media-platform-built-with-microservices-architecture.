# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy rest of the app 
COPY . .
# Expose port
EXPOSE 3000

# Start the service
CMD ["node", "src/server.js"]
