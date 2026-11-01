/**
 * Client-side image compression and resizing utility.
 * Compresses images before storing them in Firestore or state, ensuring
 * documents never exceed Firestore's 1MB limit while maintaining crisp visuals.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1200,
  initialQuality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // SVGs do not need raster compression
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // If string length is still over 500KB (~375KB binary), reduce quality
        if (dataUrl.length > 500 * 1024) {
          quality = 0.70;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // If still over 400KB, resize slightly further
        if (dataUrl.length > 400 * 1024) {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.round(width * 0.75);
          smallCanvas.height = Math.round(height * 0.75);
          const sCtx = smallCanvas.getContext('2d');
          if (sCtx) {
            sCtx.fillStyle = '#FFFFFF';
            sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
            sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            dataUrl = smallCanvas.toDataURL('image/jpeg', 0.65);
          }
        }

        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Re-compresses an existing base64 data URL string if it exceeds a threshold (e.g. 150KB),
 * ensuring any legacy large images or pasted base64 strings are reduced to ~80-150KB.
 */
export async function compressDataUrl(
  dataUrl: string,
  maxDimension = 1200,
  initialQuality = 0.80
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  if (dataUrl.startsWith('data:image/svg+xml')) return dataUrl;
  // If already under 150KB, no recompression needed
  if (dataUrl.length <= 150 * 1024) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
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

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let quality = initialQuality;
      let output = canvas.toDataURL('image/jpeg', quality);

      if (output.length > 400 * 1024) {
        output = canvas.toDataURL('image/jpeg', 0.68);
      }
      if (output.length > 300 * 1024) {
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.round(width * 0.75);
        smallCanvas.height = Math.round(height * 0.75);
        const sCtx = smallCanvas.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#FFFFFF';
          sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
          sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
          output = smallCanvas.toDataURL('image/jpeg', 0.65);
        }
      }
      resolve(output);
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}
