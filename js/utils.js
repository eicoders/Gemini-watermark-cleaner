export function preprocess(imageData) {
    const { data, width, height } = imageData;
    const float32Data = new Float32Array(3 * width * height);
    for (let i = 0; i < width * height; i++) {
        float32Data[i] = data[i * 4] / 255.0; // R
        float32Data[i + width * height] = data[i * 4 + 1] / 255.0; // G
        float32Data[i + 2 * width * height] = data[i * 4 + 2] / 255.0; // B
    }
    return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

export function postprocess(tensor, width, height) {
    const data = new Uint8ClampedArray(width * height * 4);
    const tensorData = tensor.data;
    for (let i = 0; i < width * height; i++) {
        data[i * 4] = Math.round(tensorData[i] * 255);
        data[i * 4 + 1] = Math.round(tensorData[i + width * height] * 255);
        data[i * 4 + 2] = Math.round(tensorData[i + 2 * width * height] * 255);
        data[i * 4 + 3] = 255;
    }
    return new ImageData(data, width, height);
}
