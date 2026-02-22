export function getWatermarkCoordinates(imgWidth, imgHeight) {
    // Gemini logo usually occupies the bottom-right 20% area
    const patchSize = 256; // Standard size for LaMa model
    
    // Safety check: Agar image patch se choti hai
    const safeWidth = Math.min(patchSize, imgWidth);
    const safeHeight = Math.min(patchSize, imgHeight);

    return {
        x: imgWidth - safeWidth,
        y: imgHeight - safeHeight,
        w: safeWidth,
        h: safeHeight
    };
}

export function generateGeminiMask(ctx, x, y, w, h) {
    // Ye function ek 'Alpha Mask' banata hai
    // Aap isme Gemini logo ka exact shape code kar sakte hain
    // Ya fir poora square area clean karne ke liye:
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mCtx = maskCanvas.getContext('2d');
    
    mCtx.fillStyle = 'white';
    mCtx.fillRect(0, 0, w, h); // Simple square mask for the patch
    
    return mCtx.getImageData(0, 0, w, h);
}

