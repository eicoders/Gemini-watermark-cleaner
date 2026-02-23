import { preprocess, postprocess } from './utils.js';
import { getWatermarkCoordinates, generateGeminiMask } from './detector.js';

let session = null;

export async function runInference(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Sirf 197MB wala Lama model load karein
    if (!session) {
        try {
            session = await ort.InferenceSession.create('./models/lama_quantized.onnx', {
                executionProviders: ['wasm'], // Mobile compatibility ke liye WASM best hai
                graphOptimizationLevel: 'all'
            });
        } catch (e) {
            console.error("Model Loading Failed:", e);
            throw new Error("AI Engine load nahi ho paya.");
        }
    }

    const coords = getWatermarkCoordinates(canvas.width, canvas.height);
    const imagePatchData = ctx.getImageData(coords.x, coords.y, coords.w, coords.h);
    const maskPatchData = generateGeminiMask(coords.w, coords.h);

    const feeds = {
        image: preprocess(imagePatchData),
        mask: preprocess(maskPatchData)
    };

    const results = await session.run(feeds);
    const cleanedImageData = postprocess(results.output, coords.w, coords.h);
    ctx.putImageData(cleanedImageData, coords.x, coords.y);

    return canvas;
}
