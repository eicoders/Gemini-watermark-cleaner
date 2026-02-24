export const config = {
    api: { bodyParser: { sizeLimit: '10mb' } } // Badi images allow karne ke liye
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

    try {
        // Frontend se Base64 image aur token receive karna
        const { imageBase64, maskBase64 } = req.body;
        const token = req.headers.authorization;

        // Base64 ko Server memory mein Image (Buffer) banana
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const maskBuffer = Buffer.from(maskBase64, 'base64');

        // Hugging Face ke liye perfect FormData tayar karna (No CORS proxy needed here!)
        const formData = new FormData();
        formData.append("prompt", "seamless matching background, natural texture, clear");
        formData.append("image", new Blob([imageBuffer]), "image.jpg");
        formData.append("mask_image", new Blob([maskBuffer]), "mask.png");

        // Server-to-Server direct call (Fast & Secure)
        const response = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting", {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            return res.status(response.status).json(err);
        }

        // AI se clean image lena aur wapas frontend ko bhej dena
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        res.status(500).json({ error: 'Backend Error: ' + error.message });
    }
}
