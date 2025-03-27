FROM node:20 AS builder
WORKDIR /usr/src/markdownapp
COPY package*.json ./
RUN npm install
COPY . .

FROM node:20-alpine
WORKDIR /usr/src/markdownapp
COPY --from=builder /usr/src/markdownapp/node_modules ./node_modules
COPY --from=builder /usr/src/markdownapp/package.json ./
COPY --from=builder /usr/src/markdownapp/public ./public
COPY --from=builder /usr/src/markdownapp/server ./server
COPY --from=builder /usr/src/markdownapp/auth ./auth
COPY --from=builder /usr/src/markdownapp/config ./config
COPY --from=builder /usr/src/markdownapp/index.js ./

EXPOSE 2723
CMD ["npm", "start"]