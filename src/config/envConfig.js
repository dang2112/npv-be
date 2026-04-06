require('dotenv').config()
const envConfig = {
    BASE_URL: process.env.BASE_URL || '/npv-dat-my/api',
    PORT: process.env.PORT || 2611,
    DOMAIN_IMG_UPLOAD: process.env.DOMAIN_IMG_UPLOAD || 'locahost',

    JWT_ACCESS_TOKEN_PRIVATE_KEY:
        process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY || 'npv-dat-my-secret-key',
    JWT_ACCESS_TOKEN_EXPIRES: process.env.JWT_ACCESS_TOKEN_EXPIRES || 86400000,

    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 27017,
    DB_USERNAME: process.env.DB_USERNAME || 'admin',
    DB_PASSWORD: process.env.DB_PASSWORD || 'Admin123!@#',
    DB_NAME: process.env.DB_NAME || 'npv-dat-my',

    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    REDIS_USERNAME: process.env.REDIS_USERNAME || 'default',
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'siginx123',

    QAAS_API_URL:
        process.env.QAAS_API_URL || 'http://qaas-dev.siginx.com/api/v1',
    // QAAS_API_KEY: process.env.QAAS_API_KEY || 'your-qaas-api-key',
    QAAS_API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY4NjUwYTUyZDJiZTgzYmU0MWNiZDhmMSIsImZ1bGxuYW1lIjoicm9vdCIsInVzZXJuYW1lIjoicm9vdCIsIl9fdiI6MCwiY3JlYXRlZEF0IjoiMjAyNi0wMy0zMVQwODoyMzowMS42MzZaIiwidXBkYXRlZEF0IjoiMjAyNi0wMy0zMVQwODoyMzowMS42MzZaIn0sInRzIjoxNzc1MTk3OTEwMzU2LCJpYXQiOjE3NzUxOTc5MTAsImV4cCI6MTc3NTIzMzkxMH0.BjpVWAwYJ0qO2nPRi9ulIcF3LdOsz9R1ZD-PTv1o1P0"
}

module.exports = { envConfig }
