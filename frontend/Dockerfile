FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/patch-tts-session.mjs scripts/patch-tts-session.mjs
RUN npm ci
COPY . .
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ARG VITE_APPLE_CLIENT_ID=com.zipdeck.web
ENV VITE_APPLE_CLIENT_ID=$VITE_APPLE_CLIENT_ID
ARG VITE_POSTHOG_KEY=phc_yeSHD4zZb2ttaiX6sklwnPmM3AA7Rptbt48w92rWGHZP
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443
