import { runInference } from './engine.js';

const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const previewArea = document.getElementById('preview-area');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cleanBtn = document.getElementById('clean-btn');
const loader = document.getElementById('loader');
const downloadLink = document.getElementById('download-link');

let sourceImage = null;

// File Upload Handler
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => loadFile(e.target.files[0]);

function loadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        sourceImage = new Image();
        sourceImage.onload = () => {
            canvas.width = sourceImage.width;
            canvas.height = sourceImage.height;
            ctx.drawImage(sourceImage, 0, 0);
            previewArea.classList.remove('hidden');
            dropZone.classList.add('hidden');
            downloadLink.classList.add('hidden');
        };
        sourceImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Cleaning Trigger
cleanBtn.onclick = async () => {
    loader.classList.remove('hidden');
    cleanBtn.disabled = true;

    try {
        // AI Engine call
        const resultCanvas = await runInference(canvas);
        
        // Update Download Link
        downloadLink.href = resultCanvas.toDataURL("image/png");
        downloadLink.download = `jar-cleaned-${Date.now()}.png`;
        downloadLink.classList.remove('hidden');
        
    } catch (err) {
        console.error(err);
        alert("Processing Error. Check Console.");
    } finally {
        loader.classList.add('hidden');
        cleanBtn.disabled = false;
    }
};
