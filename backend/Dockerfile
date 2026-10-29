FROM node:20-alpine

WORKDIR /app

# Cai dependencies truoc de tan dung cache
COPY package*.json ./
COPY prisma ./prisma
RUN npm install && npx prisma generate

COPY . .

EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
