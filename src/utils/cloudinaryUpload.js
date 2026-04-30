// ─── Cloudinary Config ────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = "derk08bso";
const CLOUDINARY_UPLOAD_PRESET = "announcements";

// ─── Image Compression (Canvas API — zero dependencies) ───────────────────────
/**
 * Compress an image file in the browser using Canvas before uploading.
 * Reduces file size while preserving high visual clarity.
 *
 * @param {File} file        - Original image file (jpg, png, webp, etc.)
 * @param {number} maxWidth  - Max output width in px (default 1200)
 * @param {number} quality   - JPEG quality 0–1 (default 0.82 = ~82% — sharp & small)
 * @returns {Promise<Blob>}  - Compressed JPEG blob ready for upload
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error("Failed to load image for compression"));
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let { width, height } = img;

                // Scale down proportionally if wider than maxWidth
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Canvas compression returned null"));
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ─── Universal Cloudinary Upload (XHR — real progress events) ─────────────────
/**
 * Upload ANY file to Cloudinary using an unsigned preset.
 *
 * Endpoint: /auto/upload — Cloudinary auto-detects resource type:
 *   • image → optimised CDN delivery with transformations
 *   • raw   → PDFs, documents (inline preview URL returned)
 *   • video → adaptive streaming URL
 *
 * Uses XMLHttpRequest (not fetch) so we get real upload progress events.
 *
 * Usage:
 *   Images → compressImage(file) first, then uploadToCloudinary(blob, onProgress)
 *   PDFs   → uploadToCloudinary(file, onProgress) directly (Cloudinary optimises)
 *
 * @param {Blob|File} file                     - File or pre-compressed blob
 * @param {function(number):void} [onProgress]  - Progress callback (0–100)
 * @returns {Promise<string>}                   - Cloudinary secure_url (always https://)
 */
export function uploadToCloudinary(file, onProgress) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();

        // /auto/upload handles images, PDFs, videos and raw files automatically
        xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
        );

        // Real upload progress (bytes transferred → %)
        if (xhr.upload && onProgress) {
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });
        }

        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data.secure_url); // always https://
                } catch {
                    reject(new Error("Failed to parse Cloudinary response"));
                }
            } else {
                reject(
                    new Error(
                        `Cloudinary upload failed (${xhr.status}): ${xhr.statusText}`
                    )
                );
            }
        };

        xhr.onerror = () =>
            reject(new Error("Network error during Cloudinary upload"));

        xhr.send(formData);
    });
}
