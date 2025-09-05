# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set correct working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy rest of the app
COPY . .

# Expose port
EXPOSE 3004

# Start the service
CMD ["node", "src/server.js"]
