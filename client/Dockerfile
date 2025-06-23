FROM node:20-alpine

WORKDIR /app

# Package files'ları kopyala
COPY package*.json ./

# Dependencies'leri yükle
RUN npm install

# Source code'u kopyala
COPY . .

# Port'u expose et
EXPOSE 3000

# Development modunda çalıştır
CMD ["npm", "run", "dev"]