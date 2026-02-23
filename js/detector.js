export function getWatermarkCoordinates(imgWidth, imgHeight) {
    const patchSize = 256; 
    return {
        x: imgWidth - patchSize,
        y: imgHeight - patchSize,
        w: patchSize,
        h: patchSize
    };
}

export function generateGeminiMask(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'white';
    // Standard Gemini Logo spot
    ctx.fillRect(w - 145, h - 75, 125, 55); 
    return ctx.getImageData(0, 0, w, h);
}
