FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libssl-dev \
    pkg-config

# Install MongoDB PHP extension
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy project files
COPY . .

# Install PHP dependencies inside container
RUN cd backend && composer install --no-dev --optimize-autoloader

EXPOSE 8080

CMD php -S 0.0.0.0:$PORT -t backend