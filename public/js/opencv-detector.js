// OpenCV Detection Service
// Runs in browser using OpenCV.js

class OpenCVDetector {
  constructor() {
    this.isLoaded = false;
    this.currentFrame = null;
    this.processing = false;
  }

  async loadOpenCV() {
    if (this.isLoaded) return true;

    return new Promise((resolve, reject) => {
      if (typeof cv !== 'undefined') {
        this.isLoaded = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.9.0/opencv.js';
      script.onload = () => {
        if (typeof cv !== 'undefined') {
          cv.onRuntimeInitialized = () => {
            this.isLoaded = true;
            resolve(true);
          };
        } else {
          reject(new Error('OpenCV failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load OpenCV script'));
      document.head.appendChild(script);
    });
  }

  processFrame(videoElement, params = {}) {
    if (!this.isLoaded || this.processing) return null;

    this.processing = true;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const thresh = new cv.Mat();

      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Apply Gaussian blur
      const kernelSize = params.blurKernel || 5;
      const ksize = new cv.Size(kernelSize, kernelSize);
      cv.GaussianBlur(gray, blurred, ksize, 0);

      // Apply threshold
      const thresholdValue = params.thresholdValue || 128;
      cv.threshold(blurred, thresh, thresholdValue, 255, cv.THRESH_BINARY);

      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      // Filter and count valid objects
      const detections = [];
      const minArea = params.minArea || 500;
      const maxArea = params.maxArea || 100000;
      const minWidth = params.minWidth || 20;
      const maxWidth = params.maxWidth || 500;
      const minHeight = params.minHeight || 20;
      const maxHeight = params.maxHeight || 500;

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area >= minArea && area <= maxArea) {
          const rect = cv.boundingRect(contour);
          const aspectRatio = rect.width / rect.height;

          if (rect.width >= minWidth && rect.width <= maxWidth &&
              rect.height >= minHeight && rect.height <= maxHeight) {
            if (aspectRatio >= (params.minAspectRatio || 0.2) &&
                aspectRatio <= (params.maxAspectRatio || 5)) {
              detections.push({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                area: area,
                aspectRatio: aspectRatio,
              });
            }
          }
        }
      }

      // Cleanup
      src.delete();
      gray.delete();
      blurred.delete();
      thresh.delete();
      contours.delete();
      hierarchy.delete();

      this.processing = false;

      return {
        count: detections.length,
        detections: detections,
        timestamp: Date.now(),
      };
    } catch (err) {
      this.processing = false;
      console.error('OpenCV processing error:', err);
      return null;
    }
  }

  processImage(imageData, params = {}) {
    if (!this.isLoaded) return null;

    try {
      const src = cv.matFromImageData(imageData);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const thresh = new cv.Mat();

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      const kernelSize = params.blurKernel || 5;
      const ksize = new cv.Size(kernelSize, kernelSize);
      cv.GaussianBlur(gray, blurred, ksize, 0);

      const thresholdValue = params.thresholdValue || 128;
      cv.threshold(blurred, thresh, thresholdValue, 255, cv.THRESH_BINARY);

      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const detections = [];
      const minArea = params.minArea || 500;
      const maxArea = params.maxArea || 100000;

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area >= minArea && area <= maxArea) {
          const rect = cv.boundingRect(contour);
          detections.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            area: area,
          });
        }
      }

      src.delete();
      gray.delete();
      blurred.delete();
      thresh.delete();
      contours.delete();
      hierarchy.delete();

      return {
        count: detections.length,
        detections: detections,
        timestamp: Date.now(),
      };
    } catch (err) {
      console.error('OpenCV image processing error:', err);
      return null;
    }
  }

  drawDetections(canvas, detections, options = {}) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boxColor = options.color || '#22c55e';
    const textColor = options.textColor || '#ffffff';
    const lineWidth = options.lineWidth || 2;
    const fontSize = options.fontSize || 14;

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = lineWidth;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;

    detections.forEach((det, i) => {
      // Draw bounding box
      ctx.strokeRect(det.x, det.y, det.width, det.height);

      // Draw label background
      const label = `#${i + 1}`;
      const labelWidth = ctx.measureText(label).width + 8;
      ctx.fillStyle = boxColor;
      ctx.fillRect(det.x, det.y - fontSize - 4, labelWidth, fontSize + 4);

      // Draw label text
      ctx.fillStyle = textColor;
      ctx.fillText(label, det.x + 4, det.y - 4);
    });
  }

  destroy() {
    this.isLoaded = false;
    this.currentFrame = null;
    this.processing = false;
  }
}

// Singleton instance
const detector = new OpenCVDetector();
export default detector;
