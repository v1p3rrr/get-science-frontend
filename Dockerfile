# Этап сборки
FROM node:18-alpine as build

WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап production
FROM nginx:alpine

# Копируем собранное приложение из этапа сборки
COPY --from=build /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]

ARG REACT_APP_SENTRY_DSN
ARG REACT_APP_SENTRY_ENV
ARG REACT_APP_SENTRY_RELEASE

ENV REACT_APP_SENTRY_DSN=$REACT_APP_SENTRY_DSN
ENV REACT_APP_SENTRY_ENV=$REACT_APP_SENTRY_ENV
ENV REACT_APP_SENTRY_RELEASE=$REACT_APP_SENTRY_RELEASE
