/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export const api = {
  async post(endpoint: string, data: any, contentType = 'application/json') {
    const headers: Record<string, string> = {
      'Content-Type': contentType
    };

    const body = contentType === 'application/x-www-form-urlencoded' 
      ? new URLSearchParams(data).toString()
      : JSON.stringify(data);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw errorData || new Error('Request failed');
    }

    return response.json();
  },

  async postWithAuth(endpoint: string, data: any, token: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw errorData || new Error('Request failed');
    }

    return response.json();
  },
};