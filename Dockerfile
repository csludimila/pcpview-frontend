FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG API_URL=/api
ENV API_URL=${API_URL}
RUN node -e "const fs=require('fs'); const api=process.env.API_URL || '/api'; const content='export const environment = {\\n  production: true,\\n  apiUrl: ' + JSON.stringify(api) + '\\n};\\n'; fs.writeFileSync('src/environments/environment.ts', content);"
RUN npm run build:prod

FROM nginx:1.27-alpine

ENV BACKEND_URL=http://13.58.223.39:8080

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/pcpview-frontend/browser /usr/share/nginx/html

EXPOSE 80
