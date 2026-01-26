// Utility functions for media handling

/**
 * Compress an image file to reduce storage size
 */
export const compressImage = (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.6
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      // Clean up
      URL.revokeObjectURL(img.src);
      resolve(compressedBase64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Format duration in seconds to MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate random waveform heights for visualization
 */
export const generateWaveformHeights = (count: number = 40): number[] => {
  return Array.from({ length: count }, () => Math.random() * 16 + 4);
};
