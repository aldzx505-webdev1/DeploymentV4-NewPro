// Konfigurasi
const VercelTokens = [
    "mhkw1HU1M0JDeVEwbvacvg9U",
    "mhkw1HU1M0JDeVEwbvacvg9U",
    "mhkw1HU1M0JDeVEwbvacvg9U",
    "mhkw1HU1M0JDeVEwbvacvg9U",
    "mhkw1HU1M0JDeVEwbvacvg9U"
];

const botToken = "8479433737:AAHRZV92FHS2zCXlzV4Esia0KRoG5znJYL0";
const chatId = "7492782458";

// Elemen DOM
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const btnDeploy = document.getElementById('btnDeploy');
const siteName = document.getElementById('siteName');
const terminal = document.getElementById('terminal');
const terminalContent = document.getElementById('terminalContent');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const whatsappBtn = document.getElementById('whatsappBtn');
const tokenCounter = document.getElementById('tokenCounter');
const tokenStatus = document.getElementById('tokenStatus');
const infoPanel = document.getElementById('infoPanel');
const infoContent = document.getElementById('infoContent');
const btnClear = document.getElementById('btnClear');
const resultModal = document.getElementById('resultModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');
const modalHeader = document.getElementById('modalHeader');
const modalTitle = document.getElementById('modalTitle');

// Variabel state
let selectedFile = null;
let currentTokenIndex = 0;
let deploymentAttempts = 0;

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    updateTokenCounter();
    addToConsole('$ Sistem deployment Vercel siap digunakan');
    addToConsole('$ Upload file HTML atau ZIP untuk memulai');
});

// Event Listeners
dropzone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        btnDeploy.disabled = false;
        
        // Format nama file untuk URL
        const fileNameClean = selectedFile.name.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
        if (!siteName.value) siteName.value = fileNameClean;
        
        // Tampilkan info file
        fileName.textContent = selectedFile.name;
        fileInfo.style.display = 'flex';
        
        addToConsole(`File terpilih: ${selectedFile.name}`);
        addToConsole(`Ukuran: ${formatBytes(selectedFile.size)}`);
        
        // Aktifkan terminal
        terminal.classList.add('active');
    }
};

btnDeploy.onclick = async () => {
    if (!selectedFile) return;
    
    // Validasi
    if (!siteName.value.trim()) {
        showResult("Harap masukkan nama website", "error");
        addToConsole('$ Error: Nama website tidak boleh kosong', 'error');
        return;
    }
    
    // Nonaktifkan tombol deploy
    btnDeploy.disabled = true;
    btnDeploy.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Memproses...</span>';
    
    // Reset terminal dan tampilkan proses
    addToConsole(`Memulai deployment untuk: ${siteName.value}`, "proses");
    addToConsole(`Token yang digunakan: ${currentTokenIndex + 1}/${VercelTokens.length}`, "loading");
    
    try {
        // Baca konten file
        let filesPayload = [];
        
        if (selectedFile.name.endsWith('.zip')) {
            addToConsole('Membaca file ZIP...', "loading");
            
            // Periksa apakah JSZip tersedia
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip library tidak dimuat. Pastikan JSZip disertakan.');
            }
            
            const zip = new JSZip();
            const arrayBuffer = await selectedFile.arrayBuffer();
            const contents = await zip.loadAsync(arrayBuffer);
            
            // Membaca semua file dalam ZIP
            const filePromises = [];
            contents.forEach((relativePath, file) => {
                if (!file.dir) {
                    filePromises.push(
                        file.async("string").then(data => {
                            return { file: relativePath, data };
                        })
                    );
                }
            });
            
            filesPayload = await Promise.all(filePromises);
            addToConsole(`Ditemukan ${filesPayload.length} file dalam ZIP`, "success");
        } else {
            addToConsole('Membaca file HTML...', "loading");
            const content = await readFileAsText(selectedFile);
            filesPayload.push({ file: "index.html", data: content });
            addToConsole('File HTML berhasil dibaca', "success");
        }
        
        // Persiapan deployment payload
        const deploymentData = {
            name: siteName.value,
            files: filesPayload,
            projectSettings: {
                framework: null,
                buildCommand: null,
                outputDirectory: null,
                installCommand: null,
                rootDirectory: null
            }
        };
        
        addToConsole('Menginisialisasi deployment ke Vercel...', "loading");
        
        // Gunakan token Vercel yang tersedia
        const VERCEL_TOKEN = VercelTokens[currentTokenIndex];
        let deploymentSuccess = false;
        let websiteUrl = '';
        let errorMessage = '';
        
        // 1. Buat project di Vercel
        try {
            addToConsole('Membuat project di Vercel...', "loading");
            const createProjectResponse = await fetch("https://api.vercel.com/v9/projects", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${VERCEL_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: siteName.value })
            });
            
            if (createProjectResponse.ok) {
                addToConsole('✓ Project berhasil dibuat di Vercel', 'success');
                
                // 2. Deploy project
                try {
                    addToConsole('Mengunggah file ke Vercel...', "loading");
                    
                    // Buat deployment
                    const deployResponse = await fetch("https://api.vercel.com/v13/deployments", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${VERCEL_TOKEN}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            name: siteName.value,
                            files: filesPayload,
                            target: 'production'
                        })
                    });
                    
                    const data = await deployResponse.json();
                    
                    if (deployResponse.ok && data.url) {
                        websiteUrl = `https://${siteName.value}.vercel.app`;
                        deploymentSuccess = true;
                        const successMessage = `Website berhasil dibuat!<br><a href="${websiteUrl}" target="_blank" style="color: var(--success); text-decoration: none; font-weight: 600;">${websiteUrl}</a>`;
                        
                        showResult(successMessage, "success");
                        addToConsole('✓ Deployment berhasil!', 'success');
                        addToConsole(`Website URL: ${websiteUrl}`);
                        addToConsole('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        
                        // Tampilkan panel informasi
                        showInfoPanel(websiteUrl, currentTokenIndex);
                        
                        // Kirim notifikasi ke Telegram
                        await sendToTelegram(siteName.value, websiteUrl, currentTokenIndex, null);
                        
                        // Kirim file HTML jika bukan ZIP
                        if (!selectedFile.name.endsWith('.zip')) {
                            const htmlText = await readFileAsText(selectedFile);
                            await sendHtmlToTelegram(htmlText, siteName.value);
                        }
                        
                    } else {
                        errorMessage = data.error?.message || "Terjadi kesalahan pada deployment";
                        deploymentSuccess = false;
                        showResult(`⚠️ Gagal: ${errorMessage}`, "error");
                        addToConsole(`✗ Deployment gagal: ${errorMessage}`, 'error');
                    }
                    
                } catch (deployError) {
                    errorMessage = deployError.message;
                    deploymentSuccess = false;
                    addToConsole(`✗ Error deployment: ${errorMessage}`, 'error');
                    showResult("Koneksi ke Vercel gagal", "error");
                }
                
            } else {
                const errorData = await createProjectResponse.json().catch(() => ({}));
                errorMessage = errorData.error?.message || 'Gagal membuat project';
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            addToConsole(`✗ Gagal membuat project: ${error.message}`, 'error');
            
            // Coba token berikutnya jika ada
            if (currentTokenIndex < VercelTokens.length - 1) {
                currentTokenIndex++;
                addToConsole(`Mencoba token ${currentTokenIndex + 1}...`, "loading");
                updateTokenCounter();
                btnDeploy.disabled = false;
                btnDeploy.innerHTML = '<i class="fas fa-rocket"></i><span>Coba Lagi dengan Token Lain</span>';
                return;
            } else {
                showResult("Semua token Vercel gagal. Coba lagi nanti.", "error");
                addToConsole('$ Semua token Vercel telah dicoba dan gagal', 'error');
                
                // Kirim notifikasi error ke Telegram
                await sendToTelegram(siteName.value, null, currentTokenIndex, error.message);
            }
        }
        
        // Kirim notifikasi jika deployment gagal
        if (!deploymentSuccess && errorMessage) {
            await sendToTelegram(siteName.value, null, currentTokenIndex, errorMessage);
        }
        
    } catch (error) {
        addToConsole(`✗ Error: ${error.message}`, 'error');
        showResult(`Terjadi kesalahan: ${error.message}`, "error");
        
        // Kirim notifikasi error ke Telegram
        await sendToTelegram(siteName.value, null, currentTokenIndex, error.message);
    } finally {
        resetDeployButton();
    }
};

// Fungsi bantuan
function addToConsole(message, type = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = message;
    terminalContent.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function resetDeployButton() {
    btnDeploy.disabled = false;
    btnDeploy.innerHTML = '<i class="fas fa-rocket"></i><span>START DEPLOYMENT</span>';
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(new Error('Gagal membaca file'));
        reader.readAsText(file);
    });
}

function showResult(message, type) {
    modalBody.innerHTML = message;
    modalHeader.className = `modal-header ${type}`;
    modalTitle.textContent = type === 'success' ? 'Deployment Berhasil!' : 'Deployment Gagal';
    resultModal.classList.add('active');
}

function showInfoPanel(url, tokenIndex) {
    infoContent.innerHTML = `
        <div style="text-align: center; width: 100%;">
            <div style="font-size: 24px; margin-bottom: 10px; color: var(--success);">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3 style="margin-bottom: 15px;">Deployment Berhasil!</h3>
            <p style="margin-bottom: 10px;">Website Anda telah online:</p>
            <p style="margin-bottom: 15px;">
                <a href="${url}" target="_blank" style="color: var(--accent); font-weight: bold; font-size: 18px;">${url}</a>
            </p>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin-bottom: 5px; font-size: 14px;">Token Vercel: <strong>${tokenIndex + 1}</strong></p>
                <p style="margin-bottom: 5px; font-size: 14px;">Waktu: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
    infoPanel.style.borderColor = 'var(--success)';
}

function updateTokenCounter() {
    tokenCounter.textContent = `${currentTokenIndex + 1}/${VercelTokens.length}`;
    
    if (currentTokenIndex >= VercelTokens.length - 1) {
        tokenStatus.textContent = "Token Vercel: Terbatas";
        tokenStatus.style.color = "var(--warning)";
    } else {
        tokenStatus.textContent = "Token Vercel: Tersedia";
        tokenStatus.style.color = "var(--success)";
    }
}

// Fungsi Telegram
async function sendToTelegram(siteName, websiteUrl, tokenIndex, error) {
    try {
        let message = "";
        
        if (websiteUrl) {
            message = `🚀 <b>Deployment Berhasil!</b>\n\n📁 Project: ${siteName}\n🔗 URL: ${websiteUrl}\n🎯 Token: ${tokenIndex + 1}\n⏰ Waktu: ${new Date().toLocaleString()}\n\n<i>Deployment By AldzX505</i>`;
        } else {
            message = `❌ <b>Deployment Gagal!</b>\n\n📁 Project: ${siteName}\n🎯 Token: ${tokenIndex + 1}\n💥 Error: ${error}\n⏰ Waktu: ${new Date().toLocaleString()}`;
        }
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML"
            })
        });
        
        const data = await response.json();
        if (data.ok) {
            addToConsole('$ Notifikasi terkirim ke Telegram', 'success');
        } else {
            console.error("Error sending to Telegram:", data);
            addToConsole('$ Gagal mengirim notifikasi ke Telegram', 'error');
        }
    } catch (error) {
        console.error("Failed to send message to Telegram:", error);
        addToConsole('$ Error koneksi Telegram', 'error');
    }
}

async function sendHtmlToTelegram(htmlContent, siteName) {
    try {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const file = new File([blob], `${siteName}.html`, { type: 'text/html' });
        
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', file);
        formData.append('caption', `📄 File HTML untuk project: ${siteName}\n⏰ ${new Date().toLocaleString()}`);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();
        if (data.ok) {
            addToConsole('$ File HTML terkirim ke Telegram', 'success');
        } else {
            console.error("Error sending document to Telegram:", data);
            addToConsole('$ Gagal mengirim file HTML ke Telegram', 'error');
        }
    } catch (error) {
        console.error("Failed to send document to Telegram:", error);
        addToConsole('$ Error upload file ke Telegram', 'error');
    }
}

// Event Listeners tambahan
modalClose.onclick = () => {
    resultModal.classList.remove('active');
};

whatsappBtn.onclick = () => {
    window.open('https://whatsapp.com/channel/0029VbAXDtmK0IBgnJvmsW0R', '_blank');
};

btnClear.onclick = () => {
    terminalContent.innerHTML = '<div class="terminal-line">$ Terminal cleared</div><div class="terminal-line">$ Siap untuk menerima file...</div>';
};

// Close modal ketika klik di luar
window.onclick = (event) => {
    if (event.target === resultModal) {
        resultModal.classList.remove('active');
    }
};

// Drag and drop functionality
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent)';
    dropzone.style.background = 'rgba(0, 112, 243, 0.1)';
});

dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    dropzone.style.background = '';
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    dropzone.style.background = '';
    
    if (e.dataTransfer.files.length > 0) {
        // Buat DataTransfer baru untuk mengatur files
        const dt = new DataTransfer();
        dt.items.add(e.dataTransfer.files[0]);
        fileInput.files = dt.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
    }
});