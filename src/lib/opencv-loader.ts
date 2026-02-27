/**
 * Lazy-loads OpenCV.js from CDN with fallback.
 * Caches the Promise so subsequent calls resolve immediately.
 * Resets cache on failure to allow retry.
 * Includes timeouts to prevent infinite hangs on mobile.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenCV = any;

let loadPromise: Promise<OpenCV> | null = null;

const CDN_URLS = [
    'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.3/dist/opencv.js',
    'https://docs.opencv.org/4.9.0/opencv.js',
];

/** Per-script load + WASM init timeout (ms) */
const SCRIPT_TIMEOUT = 30_000;

function tryLoadScript(url: string): Promise<OpenCV> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;

        const timer = setTimeout(() => {
            script.remove();
            reject(new Error(`OpenCV.js load timed out from ${url}`));
        }, SCRIPT_TIMEOUT);

        script.onload = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cv = (window as any).cv;
            if (cv && cv.onRuntimeInitialized !== undefined) {
                if (cv.Mat) {
                    clearTimeout(timer);
                    resolve(cv);
                } else {
                    // WASM not yet ready — wait for init callback (timer still active)
                    cv.onRuntimeInitialized = () => {
                        clearTimeout(timer);
                        resolve(cv);
                    };
                }
            } else if (cv) {
                clearTimeout(timer);
                resolve(cv);
            } else {
                clearTimeout(timer);
                reject(new Error('OpenCV.js loaded but cv object not found'));
            }
        };

        script.onerror = () => {
            clearTimeout(timer);
            script.remove();
            reject(new Error(`Failed to load OpenCV.js from ${url}`));
        };

        document.head.appendChild(script);
    });
}

export function loadOpenCV(): Promise<OpenCV> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('OpenCV.js requires a browser environment'));
    }

    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        // Already loaded (e.g. from a previous page navigation)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).cv && (window as any).cv.Mat) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (window as any).cv;
        }

        for (const url of CDN_URLS) {
            try {
                return await tryLoadScript(url);
            } catch {
                // Try next CDN
            }
        }

        loadPromise = null;
        throw new Error('Failed to load OpenCV.js from all CDN sources');
    })();

    // Reset cache on failure so user can retry
    loadPromise.catch(() => { loadPromise = null; });

    return loadPromise;
}
