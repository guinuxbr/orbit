########## Build stage ##########
FROM cgr.dev/chainguard/node:latest-dev AS build

WORKDIR /app

# Copy package descriptors and install dependencies separately for better caching
COPY --chown=node:node package*.json ./
RUN npm install

# Copy all source files and build
COPY --chown=node:node . .
RUN npm run build

########## Runtime stage ##########
FROM cgr.dev/chainguard/nginx:latest AS runtime

# Copy the built assets from the build stage
COPY --from=build --chown=nonroot:nonroot /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration file
COPY --chown=nonroot:nonroot nginx.conf /etc/nginx/nginx.conf

# Expose HTTP port
EXPOSE 80

# Start Nginx
ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-c", "/etc/nginx/nginx.conf", "-e", "/dev/stderr", "-g", "daemon off;"]
