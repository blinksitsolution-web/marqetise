# Build the admin SPA, then run Laravel + the Bixom public site behind nginx.
FROM node:22-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build \
 && mkdir -p /site \
 && cp -a . /site/ \
 && rm -rf /site/node_modules /site/src /site/dist /site/.git \
 && cp -a dist/assets /site/assets \
 && cp dist/admin.html /site/admin.html

FROM composer:2 AS vendor
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction

FROM php:8.3-fpm-alpine

RUN apk add --no-cache bash nginx supervisor libpq libzip icu-libs \
 && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS postgresql-dev libzip-dev icu-dev \
 && docker-php-ext-install pdo_pgsql pdo_mysql intl zip opcache \
 && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini
COPY docker/php/docker-vars.ini /usr/local/etc/php/conf.d/docker-vars.ini
COPY docker/php/www-overrides.conf /usr/local/etc/php-fpm.d/zz-overrides.conf
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /var/www/html
COPY backend/ ./
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /site /var/www/site

RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs storage/app/public bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache /var/www/site \
 && ln -sfn /var/www/html/storage/app/public /var/www/html/public/storage \
 && ln -sfn /var/www/html/storage/app/public /var/www/site/storage

ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stderr
ENV COMPOSER_ALLOW_SUPERUSER=1

EXPOSE 80
CMD ["/start.sh"]
