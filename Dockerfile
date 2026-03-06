FROM php:8.2-cli

# Install system packages
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libssl-dev \
    pkg-config

# Force rebuild
RUN echo "force build"

# Install MongoDB extension
RUN pecl install mongodb-1.17.0 \
    && docker-php-ext-enable mongodb

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

# Install backend dependencies
RUN cd backend && composer install --no-dev --optimize-autoloader

EXPOSE 8080

CMD php -S 0.0.0.0:$PORT -t backend