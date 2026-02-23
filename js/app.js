// Stability AI Configuration
const API_KEY = "sk-BuEOKN2B0frfYB7oNdBu8P1YOnyrDHCJuGawi1eUPu5x7caV";

const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const resultArea = document.getElementById('result-area');
const resultImg = document.getElementById('result-img');
const loader = document.getElementById('loader');
const downloadBtn = document.getElementById('download-btn');

// Gemini Logo area identification logic
function createGeminiMask(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    // Fill black (keep original image)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    
    // Fill white (area to be cleaned by AI)
    // Mathematical estimation for Gemini watermark position
    ctx.fillStyle = 'white';
    const maskW = w * 0.28; 
    const maskH = h * 0.16;
    ctx.fillRect(w - maskW - 10, h - maskH - 10, maskW, maskH);
    
    return canvas;
}

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show result area and loading
    dropZone.classList.add('hidden');
    resultArea.classList.remove('hidden');
    loader.classList.remove('hidden');
    resultImg.src = URL.createObjectURL(file);

    try {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();

        // 1. Create the mask
        const maskCanvas = createGeminiMask(img.width, img.height);
        const maskBlob = await new Promise(r => maskCanvas.toBlob(r, 'image/png'));
        
        // 2. Prepare API Data
        const formData = new FormData();
        formData.append('image', file);
        formData.append('mask', maskBlob);
        formData.append('output_format', 'png');

        // 3. Send to Stability AI Cloud
        const response = await fetch('https://api.stability.ai/v2beta/stable-image/edit/inpaint', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${API_KEY}`, 
                'Accept': 'image/*' 
            },
            body: formData
        });

        if (!response.ok) throw new Error("API Limit reached or Invalid Key");

        // 4. Handle Result
        const resultBlob = await response.blob();
        const finalUrl = URL.createObjectURL(resultBlob);
        
        resultImg.src = finalUrl;
        downloadBtn.href = finalUrl;
        downloadBtn.download = `jar_cleaned_${Date.now()}.png`;
        downloadBtn.classList.remove('hidden');

    } catch (err) {
        alert("Processing Error: " + err.message);
        location.reload();
    } finally {
        loader.classList.add('hidden');
    }
});
