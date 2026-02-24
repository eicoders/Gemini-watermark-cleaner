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

// SECURE TOKEN CHECK
function getAPIKey() {
    let key = localStorage.getItem('jar_hf_token');
    if (!key) {
        key = prompt("Enter Hugging Face Token (hf_...):");
        if (key) localStorage.setItem('jar_hf_token', key.trim());
    }
    return key;
}

settingsBtn.addEventListener('click', () => {
    localStorage.removeItem('jar_hf_token');
    alert("Token removed! You will be asked for a new one next time.");
});

uploadBox.addEventListener('click', () => { fileInput.click(); });

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length === 0) return; 
    currentFile = e.target.files[0];
    mainImage.src = URL.createObjectURL(currentFile);
    uploadBox.classList.add('hidden');
    actionBox.classList.remove('hidden');
    cleanBtn.classList.remove('hidden');
    downloadBtn.classList.add('hidden');
});

function createGeminiMask(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'white';
    const mw = Math.round(w * 0.28), mh = Math.round(h * 0.16);
    ctx.fillRect(w - mw - 10, h - mh - 10, mw, mh);
    return canvas;
}

cleanBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    const HF_TOKEN = getAPIKey();
    if (!HF_TOKEN) return;

    loader.classList.remove('hidden');
    cleanBtn.disabled = true;

    try {
        statusText.innerText = "Encoding Image...";
        
        const imgBitmap = await createImageBitmap(currentFile);
        const MAX = 1024;
        let scale = Math.min(1, MAX/imgBitmap.width, MAX/imgBitmap.height);
        const w = Math.round(imgBitmap.width * scale), h = Math.round(imgBitmap.height * scale);

        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = w; imgCanvas.height = h;
        imgCanvas.getContext('2d').drawImage(imgBitmap, 0, 0, w, h);
        
        // Frontend Base64 banayega
        const imgDataUrl = imgCanvas.toDataURL('image/jpeg', 0.95);
        const maskDataUrl = createGeminiMask(w, h).toDataURL('image/png');

        // Extract pure Base64 strings
        const imageBase64 = imgDataUrl.split(',')[1];
        const maskBase64 = maskDataUrl.split(',')[1];

        statusText.innerText = "Processing on Jar Backend...";

        // CALLING OUR OWN VERCEL BACKEND! (No CORS possible here)
        const response = await fetch("/api/clean", {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageBase64, maskBase64 })
        });

        if (!response.ok) {
            const errData = await response.json();
            if (errData.estimated_time) throw new Error(`AI waking up. Wait ${Math.round(errData.estimated_time)}s.`);
            throw new Error(errData.error || "Server Error");
        }

        statusText.innerText = "Success!";
        const resultBlob = await response.blob();
        const finalUrl = URL.createObjectURL(resultBlob);
        
        mainImage.src = finalUrl;
        cleanBtn.classList.add('hidden');
        downloadBtn.href = finalUrl;
        downloadBtn.download = `Jar_Cleaned_${Date.now()}.jpg`;
        downloadBtn.classList.remove('hidden');
        downloadBtn.classList.add('flex');

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        loader.classList.add('hidden');
        cleanBtn.disabled = false;
        statusText.innerText = "Connecting to Engine...";
    }
});

resetBtn.addEventListener('click', () => {
    currentFile = null; fileInput.value = ''; 
    actionBox.classList.add('hidden'); uploadBox.classList.remove('hidden');
    downloadBtn.classList.add('hidden'); cleanBtn.classList.remove('hidden');
});
