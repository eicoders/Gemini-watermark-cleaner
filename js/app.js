// STABLE INPAINTING MODEL
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
const settingsBtn = document.getElementById('settings-btn');

let currentFile = null;

// --- STEP 1: SECURE TOKEN MANAGEMENT ---
function getAPIKey() {
    let key = localStorage.getItem('jar_hf_token');
    if (!key) {
        key = prompt("Welcome to Jar Cleaner!\n\nPlease enter your Hugging Face API Token (Starts with hf_...):\n\n(This is saved securely in your browser and never uploaded.)");
        if (key) {
            localStorage.setItem('jar_hf_token', key.trim());
        }
    }
    return key;
}

settingsBtn.addEventListener('click', () => {
    localStorage.removeItem('jar_hf_token');
    alert("Token removed successfully! You will be asked for a new token on your next clean.");
});

// --- STEP 2: UPLOAD LOGIC ---
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

// --- STEP 3: DYNAMIC MASK GENERATOR (Gemini Logo Area) ---
function createGeminiMask(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    // Background Black (Keep these pixels)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    
    // Watermark Area White (AI will redraw this)
    ctx.fillStyle = 'white';
    const maskW = Math.round(w * 0.28); 
    const maskH = Math.round(h * 0.16);
    ctx.fillRect(w - maskW - 10, h - maskH - 10, maskW, maskH);
    
    return canvas;
}

// --- STEP 4: CLOUD AI PROCESSING ---
cleanBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    const HF_TOKEN = getAPIKey();
    if (!HF_TOKEN) return; // User cancelled prompt

    loader.classList.remove('hidden');
    cleanBtn.disabled = true;

    try {
        statusText.innerText = "Optimizing Image...";
        
        const imgBitmap = await createImageBitmap(currentFile);
        
        // Resize for AI speed & server acceptance (Max 1024px)
        const MAX_DIM = 1024;
        let scale = Math.min(1, MAX_DIM / imgBitmap.width, MAX_DIM / imgBitmap.height);
        const sW = Math.round(imgBitmap.width * scale);
        const sH = Math.round(imgBitmap.height * scale);

        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = sW; imgCanvas.height = sH;
        imgCanvas.getContext('2d').drawImage(imgBitmap, 0, 0, sW, sH);
        
        // Create Data Blobs
        const imageBlob = await new Promise(r => imgCanvas.toBlob(r, 'image/jpeg', 0.95));
        const maskCanvas = createGeminiMask(sW, sH);
        const maskBlob = await new Promise(r => maskCanvas.toBlob(r, 'image/png'));

        // Use FormData to prevent complex CORS errors
        const formData = new FormData();
        formData.append("prompt", "seamless matching background, high quality, remove watermark");
        formData.append("image", imageBlob, "image.jpg");
        formData.append("mask_image", maskBlob, "mask.png");

        statusText.innerText = "Uploading to AI Server (May take 20s)...";

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${HF_TOKEN}` 
                // DO NOT add Content-Type here, browser handles FormData boundaries automatically
            },
            body: formData
        });

        // Error Handling
        if (response.status === 401) {
            localStorage.removeItem('jar_hf_token');
            throw new Error("Invalid Token! It may have been revoked. Please create a new token on Hugging Face.");
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (errData.estimated_time) {
                throw new Error(`AI Model is booting up. Please wait ${Math.round(errData.estimated_time)} seconds and click Clean again.`);
            }
            throw new Error(errData.error || `Server Status: ${response.status}. Try again.`);
        }

        statusText.innerText = "Success! Applying Magic...";

        const resultBlob = await response.blob();
        const finalUrl = URL.createObjectURL(resultBlob);
        
        mainImage.src = finalUrl;
        cleanBtn.classList.add('hidden');
        downloadBtn.href = finalUrl;
        downloadBtn.download = `Jar_Pro_Cleaned_${Date.now()}.jpg`;
        downloadBtn.classList.remove('hidden');
        downloadBtn.classList.add('flex');

    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    } finally {
        loader.classList.add('hidden');
        cleanBtn.disabled = false;
        statusText.innerText = "Waking up AI Engine...";
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
