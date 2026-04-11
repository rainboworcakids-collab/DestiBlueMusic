// music-export.js v1.0.0
// DestiBlue Music — Export WAV / MP3 from Tone.js AudioContext
// ใช้ Web Audio API + MediaRecorder + lamejs (MP3 encoder)
// กฎ: ไม่มี Mock Data, ต้องผ่าน AudioController จริง

window.MusicExport_VERSION = "1.0.0";

console.log("[MusicExport] 🎵 Music Export Module v" + window.MusicExport_VERSION + " - INITIALIZING...");

// ========== 1. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_Export = {
    constructor: true,
    initialize: true,
    startRecording: true,
    stopRecording: true,
    exportWAV: true,
    exportMP3: true,
    _audioBufferToWAV: true,
    _encodeMP3: true,
    _writeString: true,
    _floatTo16BitPCM: true,
    _loadLameJS: true,
    _generateFilename: true,
    _triggerDownload: true,
    _showExportUI: true,
    _hideExportUI: true,
    getRecordingState: true,
    setupEventListeners: true
};

function verifyFunctionApproval(fn) {
    if (!APPROVED_FUNCTIONS_Export[fn]) {
        throw new Error(`[MusicExport] UNAPPROVED: "${fn}"`);
    }
}

class MusicExportController {
    constructor() {
        verifyFunctionApproval('constructor');
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingStartTime = null;
        this.maxRecordingMs = 120000; // 2 นาที
        this.recordingTimer = null;
        this.destinationNode = null;
        this.streamDestination = null;
        this._lameLoaded = false;
        this._recordingBlob = null;
        this._recordingBuffer = null;
        console.log("[MusicExport] ✅ v" + window.MusicExport_VERSION + " constructed");
    }

    // ========== INITIALIZE ==========
    initialize() {
        verifyFunctionApproval('initialize');
        this.setupEventListeners();
        this._injectExportUI();
        console.log("[MusicExport] ✅ initialized");
    }

    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');
        window.addEventListener('musicStarted', () => {
            const btn = document.getElementById('exportRecordBtn');
            if (btn) btn.disabled = false;
        });
        window.addEventListener('musicStopped', () => {
            if (this.isRecording) this.stopRecording();
        });
        window.addEventListener('exportStartRecording', () => this.startRecording());
        window.addEventListener('exportStopAndWAV', () => this.stopRecording().then(() => this.exportWAV()));
        window.addEventListener('exportStopAndMP3', () => this.stopRecording().then(() => this.exportMP3()));
    }

    // ========== UI INJECTION ==========
    _injectExportUI() {
        // ฉีด Export Panel เข้า InfoPanel ถ้ายังไม่มี
        if (document.getElementById('musicExportPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'musicExportPanel';
        panel.innerHTML = `
<div style="
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(16,185,129,0.08);
    border: 1px solid rgba(16,185,129,0.25);
    border-radius: 12px;
">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
            <div id="exportRecDot" style="
                width:10px; height:10px; border-radius:50%;
                background:#6b7280; transition:background 0.3s;
            "></div>
            <span style="font-size:0.85rem; font-weight:500; color:#d1fae5;">
                Download เพลงของคุณ
            </span>
        </div>
        <span id="exportTimerDisplay" style="font-size:0.75rem; color:#6ee7b7; font-family:monospace;">00:00</span>
    </div>

    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button id="exportRecordBtn"
            onclick="window.MusicExport.startRecording()"
            disabled
            style="
                flex:1; min-width:100px;
                padding:0.5rem 0.75rem;
                border-radius:8px; border:none; cursor:pointer;
                background:linear-gradient(135deg,#ef4444,#dc2626);
                color:white; font-size:0.8rem; font-weight:600;
                opacity:0.5; transition:all 0.2s;
            ">
            ● บันทึกเสียง
        </button>
        <button id="exportWavBtn"
            onclick="window.MusicExport._downloadCurrent('wav')"
            disabled
            style="
                flex:1; min-width:80px;
                padding:0.5rem 0.75rem;
                border-radius:8px; border:none; cursor:pointer;
                background:linear-gradient(135deg,#3b82f6,#2563eb);
                color:white; font-size:0.8rem; font-weight:600;
                opacity:0.5; transition:all 0.2s;
            ">
            ↓ WAV
        </button>
        <button id="exportMp3Btn"
            onclick="window.MusicExport._downloadCurrent('mp3')"
            disabled
            style="
                flex:1; min-width:80px;
                padding:0.5rem 0.75rem;
                border-radius:8px; border:none; cursor:pointer;
                background:linear-gradient(135deg,#8b5cf6,#7c3aed);
                color:white; font-size:0.8rem; font-weight:600;
                opacity:0.5; transition:all 0.2s;
            ">
            ↓ MP3
        </button>
    </div>

    <div id="exportStatusMsg" style="
        margin-top:0.5rem; font-size:0.75rem;
        color:#6ee7b7; min-height:1.2em;
        display:none;
    "></div>

    <div id="exportProgressBar" style="
        margin-top:0.5rem; height:4px;
        background:rgba(255,255,255,0.1);
        border-radius:2px; display:none;
    ">
        <div id="exportProgressFill" style="
            height:100%; width:0%;
            background:linear-gradient(90deg,#10b981,#3b82f6);
            border-radius:2px; transition:width 0.3s;
        "></div>
    </div>
</div>`;

        // ใส่หลัง musicDNADetailedInfo ถ้ามี ไม่งั้นใส่ใน InfoPanel
        const anchor = document.getElementById('musicDNADetailedInfo')
            || document.getElementById('InfoPanel');
        if (anchor) {
            anchor.insertAdjacentElement('afterend', panel);
        } else {
            document.body.appendChild(panel);
        }
    }

    // ========== STATUS HELPERS ==========
    _setStatus(msg, color = '#6ee7b7') {
        const el = document.getElementById('exportStatusMsg');
        if (!el) return;
        el.style.display = msg ? 'block' : 'none';
        el.style.color = color;
        el.textContent = msg;
    }

    _setProgress(pct) {
        const bar = document.getElementById('exportProgressBar');
        const fill = document.getElementById('exportProgressFill');
        if (!bar || !fill) return;
        if (pct < 0) { bar.style.display = 'none'; return; }
        bar.style.display = 'block';
        fill.style.width = Math.min(pct, 100) + '%';
    }

    _setRecDot(recording) {
        const dot = document.getElementById('exportRecDot');
        if (!dot) return;
        if (recording) {
            dot.style.background = '#ef4444';
            dot.style.boxShadow = '0 0 8px #ef4444';
            dot.style.animation = 'pulseDot 1s infinite';
            if (!document.getElementById('exportPulseStyle')) {
                const s = document.createElement('style');
                s.id = 'exportPulseStyle';
                s.textContent = '@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.3}}';
                document.head.appendChild(s);
            }
        } else {
            dot.style.background = '#6b7280';
            dot.style.boxShadow = 'none';
            dot.style.animation = 'none';
        }
    }

    _updateTimer() {
        const el = document.getElementById('exportTimerDisplay');
        if (!el || !this.recordingStartTime) return;
        const elapsed = Date.now() - this.recordingStartTime;
        const s = Math.floor(elapsed / 1000) % 60;
        const m = Math.floor(elapsed / 60000);
        el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }

    // ========== RECORDING ==========
    async startRecording() {
        verifyFunctionApproval('startRecording');
        if (this.isRecording) {
            console.warn("[MusicExport] Already recording");
            return;
        }

        // ต้องมีเพลงเล่นอยู่
        const ac = window.AudioController;
        if (!ac || !ac.isPlaying) {
            this._setStatus('⚠ กรุณากดเล่นเพลงก่อนบันทึก', '#fbbf24');
            return;
        }

        try {
            // สร้าง MediaStreamDestination จาก Tone.js context
            const toneCtx = Tone.context.rawContext || Tone.context._context || Tone.context;
            this.streamDestination = toneCtx.createMediaStreamDestination();

            // ต่อ Tone.Destination → streamDestination
            Tone.Destination.connect(this.streamDestination);

            // ตรวจสอบ codec ที่รองรับ
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
                ? 'audio/ogg;codecs=opus'
                : 'audio/webm';

            this.mediaRecorder = new MediaRecorder(this.streamDestination.stream, { mimeType });
            this.recordedChunks = [];
            this._recordingBlob = null;
            this._recordingBuffer = null;

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.recordedChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this._recordingBlob = new Blob(this.recordedChunks, { type: mimeType });
                this._onRecordingComplete();
            };

            this.mediaRecorder.start(100); // chunk ทุก 100ms
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // UI updates
            this._setRecDot(true);
            this._setStatus('กำลังบันทึก... กด "หยุดบันทึก" เมื่อต้องการ download');
            this._setProgress(0);

            const recBtn = document.getElementById('exportRecordBtn');
            if (recBtn) {
                recBtn.textContent = '■ หยุดบันทึก';
                recBtn.style.opacity = '1';
                recBtn.onclick = () => this.stopRecording();
            }

            // Timer update
            this._timerInterval = setInterval(() => {
                this._updateTimer();
                // Progress bar (2 นาที max)
                const elapsed = Date.now() - this.recordingStartTime;
                this._setProgress((elapsed / this.maxRecordingMs) * 100);
            }, 500);

            // Auto-stop หลัง 2 นาที
            this.recordingTimer = setTimeout(() => {
                this.stopRecording();
                this._setStatus('หยุดอัตโนมัติ (ครบ 2 นาที) — พร้อม download แล้ว!');
            }, this.maxRecordingMs);

            console.log("[MusicExport] ✅ Recording started, mimeType:", mimeType);

        } catch (err) {
            console.error("[MusicExport] ❌ startRecording failed:", err);
            this._setStatus('❌ ไม่สามารถบันทึกได้: ' + err.message, '#ef4444');
        }
    }

    async stopRecording() {
        verifyFunctionApproval('stopRecording');
        if (!this.isRecording || !this.mediaRecorder) return;

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                this._recordingBlob = new Blob(this.recordedChunks, {
                    type: this.mediaRecorder.mimeType
                });
                this._onRecordingComplete();
                resolve();
            };

            this.mediaRecorder.stop();
            this.isRecording = false;

            // Disconnect
            try { Tone.Destination.disconnect(this.streamDestination); } catch(e) {}

            clearTimeout(this.recordingTimer);
            clearInterval(this._timerInterval);

            this._setRecDot(false);
            const recBtn = document.getElementById('exportRecordBtn');
            if (recBtn) {
                recBtn.textContent = '● บันทึกใหม่';
                recBtn.onclick = () => this.startRecording();
            }
        });
    }

    _onRecordingComplete() {
        // เปิดปุ่ม download
        const wavBtn = document.getElementById('exportWavBtn');
        const mp3Btn = document.getElementById('exportMp3Btn');
        if (wavBtn) { wavBtn.disabled = false; wavBtn.style.opacity = '1'; }
        if (mp3Btn) { mp3Btn.disabled = false; mp3Btn.style.opacity = '1'; }

        const duration = this.recordingStartTime
            ? ((Date.now() - this.recordingStartTime) / 1000).toFixed(1)
            : '?';
        this._setStatus(`✅ บันทึกเสร็จ (${duration} วินาที) — เลือก WAV หรือ MP3 ด้านบน`);
        this._setProgress(-1);
        console.log("[MusicExport] ✅ Recording complete, blob size:", this._recordingBlob?.size);
    }

    // ========== EXPORT WAV ==========
    async exportWAV() {
        verifyFunctionApproval('exportWAV');
        if (!this._recordingBlob) {
            this._setStatus('⚠ ยังไม่มีไฟล์บันทึก กรุณาบันทึกเสียงก่อน', '#fbbf24');
            return;
        }
        this._setStatus('⏳ กำลัง encode WAV...');
        try {
            // decode blob → AudioBuffer → WAV
            const arrayBuffer = await this._recordingBlob.arrayBuffer();
            const toneCtx = Tone.context.rawContext || Tone.context._context || Tone.context;
            const audioBuffer = await toneCtx.decodeAudioData(arrayBuffer);
            const wavBuffer = this._audioBufferToWAV(audioBuffer);
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            this._triggerDownload(blob, this._generateFilename('wav'));
            this._setStatus('✅ Download WAV สำเร็จ!');
        } catch (err) {
            console.error("[MusicExport] exportWAV error:", err);
            this._setStatus('❌ WAV export ล้มเหลว: ' + err.message, '#ef4444');
        }
    }

    // ========== EXPORT MP3 (ผ่าน lamejs) ==========
    async exportMP3() {
        verifyFunctionApproval('exportMP3');
        if (!this._recordingBlob) {
            this._setStatus('⚠ ยังไม่มีไฟล์บันทึก กรุณาบันทึกเสียงก่อน', '#fbbf24');
            return;
        }
        this._setStatus('⏳ กำลังโหลด MP3 encoder...');
        this._setProgress(10);
        try {
            await this._loadLameJS();
            this._setStatus('⏳ กำลัง encode MP3...');
            this._setProgress(30);

            const arrayBuffer = await this._recordingBlob.arrayBuffer();
            const toneCtx = Tone.context.rawContext || Tone.context._context || Tone.context;
            const audioBuffer = await toneCtx.decodeAudioData(arrayBuffer);
            this._setProgress(60);

            const mp3Blob = await this._encodeMP3(audioBuffer);
            this._setProgress(90);
            this._triggerDownload(mp3Blob, this._generateFilename('mp3'));
            this._setProgress(100);
            this._setStatus('✅ Download MP3 สำเร็จ!');
            setTimeout(() => this._setProgress(-1), 2000);
        } catch (err) {
            console.error("[MusicExport] exportMP3 error:", err);
            this._setStatus('❌ MP3 export ล้มเหลว: ' + err.message, '#ef4444');
            this._setProgress(-1);
        }
    }

    // ========== UNIFIED DOWNLOAD ==========
    async _downloadCurrent(format) {
        if (format === 'wav') return this.exportWAV();
        if (format === 'mp3') return this.exportMP3();
    }

    // ========== WAV ENCODER ==========
    _audioBufferToWAV(buffer) {
        verifyFunctionApproval('_audioBufferToWAV');
        const numChannels = Math.min(buffer.numberOfChannels, 2);
        const sampleRate = buffer.sampleRate;
        const numSamples = buffer.length;
        const bytesPerSample = 2;
        const blockAlign = numChannels * bytesPerSample;
        const dataSize = numSamples * blockAlign;
        const wavBuffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(wavBuffer);

        this._writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        this._writeString(view, 8, 'WAVE');
        this._writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true);
        this._writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        let offset = 44;
        for (let i = 0; i < numSamples; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        return wavBuffer;
    }

    _writeString(view, offset, str) {
        verifyFunctionApproval('_writeString');
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    // ========== MP3 ENCODER (lamejs) ==========
    async _loadLameJS() {
        verifyFunctionApproval('_loadLameJS');
        if (this._lameLoaded && window.lamejs) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
            script.onload = () => {
                this._lameLoaded = true;
                console.log("[MusicExport] lamejs loaded");
                resolve();
            };
            script.onerror = () => reject(new Error('lamejs โหลดไม่ได้ — ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
            document.head.appendChild(script);
        });
    }

    async _encodeMP3(audioBuffer) {
        verifyFunctionApproval('_encodeMP3');
        if (!window.lamejs) throw new Error('lamejs ไม่พร้อม');

        const numChannels = Math.min(audioBuffer.numberOfChannels, 2);
        const sampleRate = audioBuffer.sampleRate;
        const kbps = 128;

        const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);
        const sampleBlockSize = 1152;
        const mp3Data = [];

        const left = this._floatTo16BitPCM(audioBuffer.getChannelData(0));
        const right = numChannels > 1
            ? this._floatTo16BitPCM(audioBuffer.getChannelData(1))
            : left;

        for (let i = 0; i < left.length; i += sampleBlockSize) {
            const leftChunk = left.subarray(i, i + sampleBlockSize);
            const rightChunk = right.subarray(i, i + sampleBlockSize);
            const encoded = numChannels > 1
                ? encoder.encodeBuffer(leftChunk, rightChunk)
                : encoder.encodeBuffer(leftChunk);
            if (encoded.length > 0) mp3Data.push(new Int8Array(encoded));
        }

        const flushed = encoder.flush();
        if (flushed.length > 0) mp3Data.push(new Int8Array(flushed));

        return new Blob(mp3Data, { type: 'audio/mp3' });
    }

    _floatTo16BitPCM(floatArray) {
        verifyFunctionApproval('_floatTo16BitPCM');
        const output = new Int16Array(floatArray.length);
        for (let i = 0; i < floatArray.length; i++) {
            const s = Math.max(-1, Math.min(1, floatArray[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    }

    // ========== FILENAME & DOWNLOAD ==========
    _generateFilename(ext) {
        verifyFunctionApproval('_generateFilename');
        const state = window.AppMainController?.getState?.();
        const name = state?.user?.personalData?.fullName || 'DestiBlue';
        const element = state?.numerology?.element || 'music';
        const lifePath = state?.numerology?.lifePath || '';
        const date = new Date().toISOString().slice(0, 10);
        const safe = (s) => s.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '_');
        return `${safe(name)}_${safe(element)}_lp${lifePath}_${date}.${ext}`;
    }

    _triggerDownload(blob, filename) {
        verifyFunctionApproval('_triggerDownload');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        console.log("[MusicExport] ✅ Download triggered:", filename, blob.size, 'bytes');
    }

    getRecordingState() {
        verifyFunctionApproval('getRecordingState');
        return {
            isRecording: this.isRecording,
            hasBlob: !!this._recordingBlob,
            blobSize: this._recordingBlob?.size || 0
        };
    }
}

// ========== SINGLETON ==========
window.MusicExport = new MusicExportController();

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.MusicExport.initialize();
        console.log("[MusicExport] ✅ v" + window.MusicExport_VERSION + " ready");
    }, 500);
});

console.log("[MusicExport] ✅ music-export.js v" + window.MusicExport_VERSION + " LOADED");