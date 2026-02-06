FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create logs directory
RUN mkdir -p /var/log/lex-webui

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server.js"]
