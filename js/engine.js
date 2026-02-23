import { preprocess, postprocess } from './utils.js';
import { getWatermarkCoordinates, generateGeminiMask } from './detector.js';

let session = null;

export async function runInference(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Asli Model URL (Hugging Face Direct CDN)
    const MODEL_URL = 'https://huggingface.co/anyisalin/lama-onnx/resolve/main/lama_fp16.onnx';

    if (!session) {
        try {
            // Hum seedha Hugging Face se model uthayenge
            session = await ort.InferenceSession.create(MODEL_URL, {
                executionProviders: ['wasm'], 
                graphOptimizationLevel: 'all'
            });
        } catch (e) {
            console.error("AI Model Load Error:", e);
            throw new Error("AI Engine load nahi ho paya. Internet check karein.");
        }
    }

    const coords = getWatermarkCoordinates(canvas.width, canvas.height);
    const imagePatchData = ctx.getImageData(coords.x, coords.y, coords.w, coords.h);
    const maskPatchData = generateGeminiMask(coords.w, coords.h);

    const results = await session.run({
        image: preprocess(imagePatchData),
        mask: preprocess(maskPatchData)
    });

    const cleanedImageData = postprocess(results.output, coords.w, coords.h);
    ctx.putImageData(cleanedImageData, coords.x, coords.y);

    return canvas;
}
