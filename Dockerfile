FROM node:20-alpine

WORKDIR /app

# Copy root package files first
COPY package*.json ./
COPY tsconfig.json ./

# Install root dependencies
RUN npm ci

# Copy and build main MCP server
COPY src/ ./src/
RUN npm run build

# Copy web interface
COPY web-interface/ ./web-interface/

# Install web interface dependencies and build
WORKDIR /app/web-interface
RUN npm ci && npm run build

# Install PM2 for process management
RUN npm install -g pm2

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000 3001

USER node

CMD ["/app/start.sh"]