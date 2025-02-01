FROM node:22
WORKDIR /chat
COPY package*.json ./
RUN npm install --force
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]