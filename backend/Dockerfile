
FROM node:20-bookworm-slim

WORKDIR /app

# Cai OpenSSL cho Prisma
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Cai dependencies va tao Prisma Client
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# Copy ma nguon backend
COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
