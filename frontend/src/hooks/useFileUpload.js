// src/hooks/useFileUpload.js
import { useState } from 'react';
import { uploadApi } from '../utils/uploadApi';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, courseData) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const response = await uploadApi.uploadFile(file, courseData, (progress) => {
        setProgress(progress);
      });

      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    progress,
    error,
    uploadFile,
    clearError: () => setError(null)
  };
};

export default useFileUpload;