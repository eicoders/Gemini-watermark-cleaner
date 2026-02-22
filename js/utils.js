/**
 * Image data ko Float32Array (Tensor) mein badalta hai [1, 3, H, W]
 */
export function preprocess(imageData) {
    const { data, width, height } = imageData;
    const float32Data = new Float32Array(3 * width * height);

    for (let i = 0; i < width * height; i++) {
        // Pixel values ko 0-1 ke beech normalize karna
        float32Data[i] = data[i * 4] / 255.0; // Red
        float32Data[i + width * height] = data[i * 4 + 1] / 255.0; // Green
        float32Data[i + 2 * width * height] = data[i * 4 + 2] / 255.0; // Blue
    }

    return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

/**
 * Model ke output tensor ko wapas ImageData mein badalta hai
 */
export function postprocess(tensor, width, height) {
    const data = new Uint8ClampedArray(width * height * 4);
    const tensorData = tensor.data;

    for (let i = 0; i < width * height; i++) {
        data[i * 4] = Math.round(tensorData[i] * 255); // R
        data[i * 4 + 1] = Math.round(tensorData[i + width * height] * 255); // G
        data[i * 4 + 2] = Math.round(tensorData[i + 2 * width * height] * 255); // B
        data[i * 4 + 3] = 255; // Alpha (Opaque)
    }

    return new ImageData(data, width, height);
}

