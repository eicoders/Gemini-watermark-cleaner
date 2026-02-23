import { preprocess, postprocess } from './utils.js';
import { getWatermarkCoordinates, generateGeminiMask } from './detector.js';

let session = null;

export async function runInference(canvas) {
    const ctx = canvas.getContext('2d');
    
    // 1. Sirf Inpainting model load karein (Lama)
    if (!session) {
        try {
            session = await ort.InferenceSession.create('./models/lama_quantized.onnx', {
                executionProviders: ['webgpu', 'wasm'],
                graphOptimizationLevel: 'all'
            });
        } catch (e) {
            console.error("Model load fail:", e);
            throw new Error("AI Model load nahi ho paya.");
        }
    }

    const coords = getWatermarkCoordinates(canvas.width, canvas.height);
    
    // 2. Patch nikaalein
    const imagePatchData = ctx.getImageData(coords.x, coords.y, coords.w, coords.h);
    
    // 3. Mask generate karein (Detector.js se)
    const maskPatchData = generateGeminiMask(coords.w, coords.h);

    // 4. AI Processing
    const imageTensor = preprocess(imagePatchData);
    const maskTensor = preprocess(maskPatchData);

    const results = await session.run({
        image: imageTensor,
        mask: maskTensor
    });

    const outputTensor = results.output; 

    // 5. Result wapas canvas par chipkayein
    const cleanedImageData = postprocess(outputTensor, coords.w, coords.h);
    ctx.putImageData(cleanedImageData, coords.x, coords.y);

    return canvas;
}
