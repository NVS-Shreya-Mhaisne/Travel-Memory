FROM php:8.2-cli

# Install dependencies
RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    git \
    unzip

# Install MongoDB extension
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

WORKDIR /app

COPY . .

EXPOSE 8080

CMD php -S 0.0.0.0:$PORT -t backend