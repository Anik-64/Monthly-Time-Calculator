FROM node:20 AS builder
WORKDIR /usr/src/monthlytimecalculator
COPY package*.json ./
RUN npm install
COPY . .

FROM node:20-alpine
WORKDIR /usr/src/monthlytimecalculator
COPY --from=builder /usr/src/monthlytimecalculator/node_modules ./node_modules
COPY --from=builder /usr/src/monthlytimecalculator/package.json ./
COPY --from=builder /usr/src/monthlytimecalculator/public ./public
COPY --from=builder /usr/src/monthlytimecalculator/server ./server
COPY --from=builder /usr/src/monthlytimecalculator/auth ./auth
COPY --from=builder /usr/src/monthlytimecalculator/config ./config
COPY --from=builder /usr/src/monthlytimecalculator/index.js ./

EXPOSE 2723
CMD ["npm", "start"]