FROM ubuntu:24.04

# Instala Node.js + GlusterFS
RUN apt-get update && \
    apt-get install -y glusterfs-server nodejs npm && \
    apt-get clean

# App
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
