# Step 1: Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Changed to standard install
RUN npm install
COPY . .
RUN npm run build

# Step 2: Production execution stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Changed to standard install and using the modern omit flag
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/langgraph.json ./langgraph.json

# Expose the port your LangGraph SDK server listens on
EXPOSE 2024
CMD ["npm", "start"]