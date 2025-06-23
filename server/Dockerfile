FROM node:20-alpine

# Python ve build tools'ları ekle (native modüller için)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Package files'ları kopyala
COPY package*.json ./

# Dependencies'leri yükle
RUN npm install

# Source code'u kopyala
COPY . .

# Global ts-node-dev yükle
RUN npm install -g ts-node-dev

# Port'u expose et
EXPOSE 5000

# Başlangıç komutu
CMD ["ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]