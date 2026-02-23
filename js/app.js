const HF_TOKEN = "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"; 
const API_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting";

const fileInput = document.getElementById('file-input');
const uploadBox = document.getElementById('upload-box');
const actionBox = document.getElementById('action-box');
const mainImage = document.getElementById('main-image');
const cleanBtn = document.getElementById('clean-btn');
const resetBtn = document.getElementById('reset-btn');
const loader = document.getElementById('loader');
const statusText = document.getElementById('status-text');

let currentFile = null;

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
});

function createGeminiMask(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = 'white';
    const maskW = Math.round(w * 0.28); 
    const maskH = Math.round(h * 0.16);
    ctx.fillRect(w - maskW - 10, h - maskH - 10, maskW, maskH);
    
    return canvas;
}

cleanBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    loader.classList.remove('hidden');
    cleanBtn.disabled = true;

    try {
        statusText.innerText = "Processing Original Size...";
        console.log("File Size:", (currentFile.size / 1024 / 1024).toFixed(2), "MB");

        const imgBitmap = await createImageBitmap(currentFile);
        console.log("Resolution:", imgBitmap.width, "x", imgBitmap.height);

        const maskCanvas = createGeminiMask(imgBitmap.width, imgBitmap.height);
        const maskBlob = await new Promise(r => maskCanvas.toBlob(r, 'image/png'));

        const formData = new FormData();
        formData.append('inputs', "clear background, matching texture, seamless");
        formData.append('image', currentFile);
        formData.append('mask_image', maskBlob);

        statusText.innerText = "Sending to Hugging Face...";
        console.log("Initiating Fetch request to HF...");

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${HF_TOKEN}` 
            },
            body: formData
        });

        console.log("Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Body:", errorText);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const resultBlob = await response.blob();
        mainImage.src = URL.createObjectURL(resultBlob);
        alert("Success! Check image.");

    } catch (err) {
        // Detailed Error Catching
        console.error("Fetch API Failed completely!");
        console.error("Error Message:", err.message);
        console.error("Error Name:", err.name);
        
        if(err.message === "Failed to fetch") {
            alert(`Detailed Error: "Failed to fetch".\nPlease open the Eruda gear icon ⚙️ at bottom right, go to 'Network' tab, and check the red text.`);
        } else {
            alert("Error: " + err.message);
        }
    } finally {
        loader.classList.add('hidden');
        cleanBtn.disabled = false;
    }
});

resetBtn.addEventListener('click', () => {
    currentFile = null;
    fileInput.value = ''; 
    actionBox.classList.add('hidden');
    uploadBox.classList.remove('hidden');
});
