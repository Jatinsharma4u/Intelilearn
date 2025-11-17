// src/utils/uploadApi.js - UPDATED
import axios from 'axios';
import { courseApi } from './courseApi';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // 🔥 60 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - FIXED: No automatic redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Upload API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Upload file and create course
export const uploadFile = async (file, courseData, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', courseData.title);
    formData.append('description', courseData.description || '');
    formData.append('settings', JSON.stringify(courseData.settings));

    // Upload file
    const uploadResponse = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return uploadResponse.data;

  } catch (error) {
    console.error('Upload error:', error);
    
    // 🔥 Better error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - course generation is taking longer than expected');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Upload failed. Please try again.');
    }
  }
};

export const uploadApi = {
  uploadFile
};

export default uploadApi;