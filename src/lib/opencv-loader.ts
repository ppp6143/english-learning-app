/**
 * Lazy-loads OpenCV.js 4.9.0 from CDN.
 * Caches the Promise so subsequent calls resolve immediately.
 * Resets cache on failure to allow retry.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenCV = any;

let loadPromise: Promise<OpenCV> | null = null;

export function loadOpenCV(): Promise<OpenCV> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('OpenCV.js requires a browser environment'));
    }

    // Return cached promise if already loading/loaded
    if (loadPromise) return loadPromise;

    loadPromise = new Promise<OpenCV>((resolve, reject) => {
        // Already loaded (e.g. from a previous page navigation)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).cv && (window as any).cv.Mat) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resolve((window as any).cv);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.9.0/opencv.js';
        script.async = true;

        script.onload = () => {
            // OpenCV.js sets window.cv but may need a tick to initialize WASM
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cv = (window as any).cv;
            if (cv && cv.onRuntimeInitialized !== undefined) {
                // WASM not yet ready — wait for callback
                if (cv.Mat) {
                    resolve(cv);
                } else {
                    cv.onRuntimeInitialized = () => resolve(cv);
                }
            } else if (cv) {
                resolve(cv);
            } else {
                loadPromise = null;
                reject(new Error('OpenCV.js loaded but cv object not found'));
            }
        };

        script.onerror = () => {
            loadPromise = null;
            reject(new Error('Failed to load OpenCV.js from CDN'));
        };

        document.head.appendChild(script);
    });

    return loadPromise;
}
