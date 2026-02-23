/**
 * Gemini logo hamesha predictable spots par hota hai.
 * Ye function bina AI model ke logo ki location dhoond lega.
 */
export function getWatermarkCoordinates(imgWidth, imgHeight) {
    const patchSize = 256; // LaMa model isi size par best chalta hai

    // Gemini logo variants:
    // 1. Bottom Right (Standard)
    // 2. Bottom Left (Rare)
    
    // Hum default bottom-right hi target karenge kyunki 99% Gemini images wahi hoti hain.
    return {
        x: imgWidth - patchSize,
        y: imgHeight - patchSize,
        w: patchSize,
        h: patchSize
    };
}

/**
 * Ye function logo ke upar ek 'Mask' banata hai.
 * White = Area to clean, Black = Keep original.
 */
export function generateGeminiMask(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Poore patch ko black rakhein
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);

    // Gemini logo ka area (Ye bottom-right corner ke hisab se adjusted hai)
    // Hum ek white box banayenge jahan logo hota hai
    ctx.fillStyle = 'white';
    
    // Gemini logo aksar bottom-right corner se 20-40px upar aur left hota hai
    // Standard size: 120x40 pixels
    ctx.fillRect(w - 150, h - 80, 130, 60); 

    return ctx.getImageData(0, 0, w, h);
}
