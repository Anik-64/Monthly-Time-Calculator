FROM node:20 AS builder
WORKDIR /usr/src/ipcidrcalculator
COPY package*.json ./
RUN npm install
COPY . .

FROM node:20-alpine
WORKDIR /usr/src/ipcidrcalculator
COPY --from=builder /usr/src/ipcidrcalculator/node_modules ./node_modules
COPY --from=builder /usr/src/ipcidrcalculator/package.json ./
COPY --from=builder /usr/src/ipcidrcalculator/public ./public
COPY --from=builder /usr/src/ipcidrcalculator/server ./server
COPY --from=builder /usr/src/ipcidrcalculator/index.js ./

EXPOSE 2723
CMD ["npm", "start"]