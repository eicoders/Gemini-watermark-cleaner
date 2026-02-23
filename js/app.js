// Hugging Face API Configuration
const HF_TOKEN = "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"; 
const API_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting";

const fileInput = document.getElementById('file-input');
const uploadBox = document.getElementById('upload-box');
const actionBox = document.getElementById('action-box');
const mainImage = document.getElementById('main-image');
const cleanBtn = document.getElementById('clean-btn');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const loader = document.getElementById('loader');
const statusText = document.getElementById('status-text');

let currentFile = null;

// --- UPLOAD LOGIC ---
uploadBox.addEventListener('click', () => {
    fileInput.value = ''; 
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length === 0) return; 
    
    currentFile = e.target.files[0];
    mainImage.src = URL.createObjectURL(currentFile);
    
    uploadBox.classList.add('hidden');
    actionBox.classList.remove('hidden');
    cleanBtn.classList.remove('hidden');
    downloadBtn.classList.add('hidden');
});

// --- MASK GENERATOR (Gemini Logo Area) ---
function createGeminiMask(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    // Black background (keep original image)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    
    // White box (area to repaint)
    ctx.fillStyle = 'white';
    const maskW = Math.round(w * 0.28); 
    const maskH = Math.round(h * 0.16);
    ctx.fillRect(w - maskW - 10, h - maskH - 10, maskW, maskH);
    
    return canvas;
}

// --- HUGGING FACE API CALL ---
cleanBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    loader.classList.remove('hidden');
    cleanBtn.disabled = true;
    cleanBtn.classList.add('opacity-50');

    try {
        statusText.innerText = "Preparing Image Data...";
        
        const imgBitmap = await createImageBitmap(currentFile);
        const maskCanvas = createGeminiMask(imgBitmap.width, imgBitmap.height);
        const maskBlob = await new Promise(r => maskCanvas.toBlob(r, 'image/png'));
        
        // Hugging Face stable-diffusion-inpainting expects multipart/form-data
        const formData = new FormData();
        formData.append('inputs', "seamless background, natural texture, clear"); // Prompt telling AI what to draw
        formData.append('image', currentFile);
        formData.append('mask_image', maskBlob);

        statusText.innerText = "Processing on Hugging Face (May take 20s if waking up)...";

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${HF_TOKEN}` 
            },
            body: formData
        });

        // Handle Cold Start or Errors
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.estimated_time) {
                throw new Error(`Server is booting up. Please wait ${Math.round(errorData.estimated_time)} seconds and click Clean again.`);
            }
            throw new Error(errorData.error || "API Server Error");
        }

        statusText.innerText = "Finalizing Image...";

        // Success!
        const resultBlob = await response.blob();
        const finalUrl = URL.createObjectURL(resultBlob);
        
        mainImage.src = finalUrl;
        
        cleanBtn.classList.add('hidden');
        downloadBtn.href = finalUrl;
        downloadBtn.download = `Jar_Cloud_Cleaned_${Date.now()}.png`;
        downloadBtn.classList.remove('hidden');
        downloadBtn.classList.add('flex');

    } catch (err) {
        console.error(err);
        alert("Notice: " + err.message);
    } finally {
        loader.classList.add('hidden');
        cleanBtn.disabled = false;
        cleanBtn.classList.remove('opacity-50');
        statusText.innerText = "Connecting to Cloud AI...";
    }
});

// --- RESET APP ---
resetBtn.addEventListener('click', () => {
    currentFile = null;
    fileInput.value = ''; 
    actionBox.classList.add('hidden');
    uploadBox.classList.remove('hidden');
    downloadBtn.classList.add('hidden');
    cleanBtn.classList.remove('hidden');
});
