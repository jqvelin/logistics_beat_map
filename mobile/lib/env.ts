const fallbackApiUrl = 'http://localhost:3000/api';

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? fallbackApiUrl,
};
