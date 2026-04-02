FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    default-mysql-client

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /var/www/html

# Expose ports
EXPOSE 8000
EXPOSE 5173

# Create startup script
RUN echo '#!/bin/bash\n\
npm install\n\
composer install\n\
# Wait for MySQL to be ready\n\
echo "Waiting for mysql..."\n\
while ! mysqladmin ping -h"db" --silent; do\n\
    sleep 1\n\
done\n\
php artisan migrate --force\n\
php artisan serve --host=0.0.0.0 --port=8000 &\n\
npm run dev -- --host 0.0.0.0 --port 5173\n\
' > /usr/local/bin/start.sh

RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
