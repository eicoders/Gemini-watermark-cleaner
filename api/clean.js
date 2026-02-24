// Private Vercel Backend (Node.js CommonJS format)
module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

    try {
        const { imageBase64, maskBase64 } = req.body;
        const token = req.headers.authorization;

        // Base64 text ko wapas binary file (Buffer) mein convert karna
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const maskBuffer = Buffer.from(maskBase64, 'base64');

        // Hugging Face AI ke liye perfect payload
        const formData = new FormData();
        formData.append("prompt", "seamless matching background, natural texture, high quality");
        formData.append("image", new Blob([imageBuffer]), "image.jpg");
        formData.append("mask_image", new Blob([maskBuffer]), "mask.png");

        // Direct Server-to-Server call (Zero CORS Error!)
        const response = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting", {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            return res.status(response.status).json(err);
        }

        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        // Agar yahan error aaya, toh JSON format mein hi jayega (No HTML crash)
        res.status(500).json({ error: 'Jar Backend Error: ' + error.message });
    }
};
