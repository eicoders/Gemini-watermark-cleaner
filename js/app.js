import { runInference } from './engine.js';
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const previewArea = document.getElementById('preview-area');
const canvas = document.getElementById('canvas');
const cleanBtn = document.getElementById('clean-btn');
const loader = document.getElementById('loader');
const downloadLink = document.getElementById('download-link');

dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            previewArea.classList.remove('hidden');
            dropZone.classList.add('hidden');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
};

cleanBtn.onclick = async () => {
    loader.classList.remove('hidden');
    try {
        await runInference(canvas);
        downloadLink.href = canvas.toDataURL();
        downloadLink.download = "cleaned.png";
        downloadLink.classList.remove('hidden');
    } catch (err) {
        alert("Processing Error: " + err.message);
    } finally {
        loader.classList.add('hidden');
    }
};
