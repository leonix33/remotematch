FROM node:20-alpine AS frontend-build
WORKDIR /app
ARG VITE_APP_URL=https://remotematch.onrender.com
ARG VITE_APP_NAME=RemoteMatch
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend
COPY frontend ./frontend
RUN npm run build --prefix frontend

FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm install --omit=dev --prefix backend
COPY backend ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
EXPOSE 5100
CMD ["npm", "start", "--prefix", "backend"]
