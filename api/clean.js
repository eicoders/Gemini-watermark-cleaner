module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

    try {
        const { imageBase64, maskBase64 } = req.body;
        const token = req.headers.authorization;

        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const maskBuffer = Buffer.from(maskBase64, 'base64');

        const formData = new FormData();
        formData.append("prompt", "seamless matching background, natural texture, high quality, no watermark");
        formData.append("image", new Blob([imageBuffer]), "image.jpg");
        formData.append("mask_image", new Blob([maskBuffer]), "mask.png");

        // Using a more stable model
        // Naya Model jo abhi Free API par active hai
const response = await fetch("https://api-inference.huggingface.co/models/botp/stable-diffusion-v1-5-inpainting", {
    
        const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-inpainting", {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData
        });

        if (!response.ok) {
            // THE FIX: Pehle check karo ki AI ne JSON bheja hai ya HTML
            const errorText = await response.text();
            try {
                // Agar JSON hai toh padh lo
                const errJson = JSON.parse(errorText);
                return res.status(response.status).json(errJson);
            } catch (parseError) {
                // Agar HTML hai (Cloudflare/503) toh crash mat ho, custom error bhejo
                return res.status(response.status).json({ 
                    error: `Hugging Face AI is currently booting up or busy (Status: ${response.status}). Please try again in 20-30 seconds.` 
                });
            }
        }

        const arrayBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        res.status(500).json({ error: 'Server Catch: ' + error.message });
    }
};
