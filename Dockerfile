FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

USER node

CMD ["node", "dist/http-server.js"]