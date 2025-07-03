FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/

RUN npm run build

EXPOSE 3000

USER node

CMD ["node", "dist/http-server.js"]