// Configure this in Vercel as VITE_API_BASE_URL, for example: https://api.example.com/api
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost/dc-classroom/api')
    .replace(/\/+$/, '');
