/**
 * Utility to compress plant health images in the browser
 * to fit safely inside a single Firestore document (< 500 KB limit).
 */
export const compressImageForFirestore = (imageSource, maxDimension = 640, initialQuality = 0.6) => {
  return new Promise((resolve) => {
    if (!imageSource) {
      return resolve('');
    }

    if (typeof imageSource === 'string' && imageSource.startsWith('data:image') && imageSource.length < 350000) {
      return resolve(imageSource);
    }

    const img = new Image();
    let objectUrl = null;

    if (typeof imageSource === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = imageSource;
    } else {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    }

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onload = () => {
      cleanup();

      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      width = Math.max(1, width);
      height = Math.max(1, height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let quality = initialQuality;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      while (dataUrl.length > 500000 && quality > 0.25) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      if (dataUrl.length > 500000) {
        const scaleCanvas = document.createElement('canvas');
        scaleCanvas.width = Math.max(1, Math.round(width * 0.7));
        scaleCanvas.height = Math.max(1, Math.round(height * 0.7));
        const scaleCtx = scaleCanvas.getContext('2d');
        scaleCtx.drawImage(canvas, 0, 0, scaleCanvas.width, scaleCanvas.height);
        dataUrl = scaleCanvas.toDataURL('image/jpeg', 0.5);
      }

      resolve(dataUrl);
    };

    img.onerror = (err) => {
      cleanup();
      console.warn("Image compression warning:", err);
      if (typeof imageSource === 'string') {
        resolve(imageSource);
      } else {
        resolve('');
      }
    };
  });
};
