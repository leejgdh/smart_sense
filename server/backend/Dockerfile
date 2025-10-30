# Build stage
FROM node:22-alpine AS builder

# Install OpenSSL 3.x for Prisma
RUN apk add --no-cache openssl3

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy Prisma schema first
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build the application
RUN yarn build

# Verify build output
RUN ls -la dist/

# Production stage
FROM node:22-alpine AS production

# Install OpenSSL 3.x for Prisma runtime
RUN apk add --no-cache openssl3

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]