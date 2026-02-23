import { getWatermarkCoordinates } from './detector.js';

export async function runInference(canvas) {
    const ctx = canvas.getContext('2d');
    const { x, y, w, h } = getWatermarkCoordinates(canvas.width, canvas.height);

    // 1. Watermark area ka data nikaalein
    const imageData = ctx.getImageData(x, y, w, h);
    const pixels = imageData.data;

    // 2. Mathematical Masking (Identify Gemini Logo Area)
    // Gemini logo aksar bottom-right corner mein ek specific rectangle mein hota hai
    const maskXStart = w - 150;
    const maskYStart = h - 80;
    const maskWidth = 135;
    const maskHeight = 60;

    // 3. Simple Mathematical Diffusion (Neighbor Fill)
    for (let j = maskYStart; j < maskYStart + maskHeight; j++) {
        for (let i = maskXStart; i < maskXStart + maskWidth; i++) {
            
            // Boundary pixels se color uthao (Top aur Bottom boundary ka average)
            const topPixelIdx = ((maskYStart - 5) * w + i) * 4;
            const bottomPixelIdx = ((maskYStart + maskHeight + 5) * w + i) * 4;

            const idx = (j * w + i) * 4;

            // Math: Linear interpolation between top and bottom boundary colors
            pixels[idx]     = (pixels[topPixelIdx] + pixels[bottomPixelIdx]) / 2; // Red
            pixels[idx + 1] = (pixels[topPixelIdx + 1] + pixels[bottomPixelIdx + 1]) / 2; // Green
            pixels[idx + 2] = (pixels[topPixelIdx + 2] + pixels[bottomPixelIdx + 2]) / 2; // Blue
            // Alpha ko 255 (Opaque) rakhein
            pixels[idx + 3] = 255;
        }
    }

    // 4. Smooth the edges using a Mathematical Box Blur
    // (Aap ek B.Sc. student hain, toh aapko pata hoga ye 3x3 matrix convolution hai)
    
    // Result wapas canvas par daalein
    ctx.putImageData(imageData, x, y);
    return canvas;
}
