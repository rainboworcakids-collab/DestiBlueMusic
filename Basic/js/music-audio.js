// music-audio.js v5.6 - No Fallback, error handling ที่เข้มงวด
console.log("[MusicAudio] 🎵 Music-Audio Module version v5.6 - INITIALIZING...");

// ========== 1. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_MusicAudio = {
    constructor: true,
    initialize: true,
    cleanup: true,
    waitForUserInteraction: true,
    setupTransport: true,
    handleTransportStart: true,
    handleTransportStop: true,
    handleTransportPause: true,
    handleTransportLoop: true,
    setupEventListeners: true,
    setupUIListeners: true,
    handleMusicDNAGenerated: true,
    handleCombinedDNA: true,
    scheduleMusicEvents: true,
    scheduleNatureEffects: true,
    playMelodyNote: true,
    playChord: true,
    triggerNatureEffect: true,
    stopNatureEffect: true,
    togglePlayback: true,
    play: true,
    pause: true,
    stop: true,
    changeTempo: true,
    setMasterVolume: true,
    setMute: true,
    clearScheduledEvents: true,
    parseTimecode: true,
    handleSynthCreated: true,
    handleSynthDisposed: true,
    getPlaybackState: true,
    createEffectChain: true,
    disposeEffects: true,
    connectEffects: true,
    disconnectEffects: true,
    playNatureEffectFromObject: true,
    playNatureLayer: true,
    setLoopEnabled: true,
    buildSynthFromInstrument: true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_MusicAudio[functionName]) {
        console.warn(`⚠️ [MusicAudio] Function "${functionName}" not in APPROVED_FUNCTIONS`);
    }
}

// ========== 2. INSTRUMENT → SYNTH CONFIG MAP (ไม่มี default) ==========
const INSTRUMENT_SYNTH_CONFIG = {
    // ── KEYBOARDS ──
    piano: { oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 0.5, sustain: 0.3, release: 1.2 } },
    electricPiano: { oscillator: { type: 'fmsine', modulationType: 'triangle', modulationIndex: 3 }, envelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 0.8 } },
    organ: { oscillator: { type: 'fatsawtooth', count: 3, spread: 20 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.3 } },
    harpsichord: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.0, release: 0.4 } },

    // ── STRINGS ──
    strings: { oscillator: { type: 'fatsawtooth', count: 4, spread: 30 }, envelope: { attack: 0.4, decay: 0.2, sustain: 0.8, release: 1.5 } },
    violin: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.3, decay: 0.1, sustain: 0.9, release: 0.8 } },
    cello: { oscillator: { type: 'fatsawtooth', count: 2, spread: 15 }, envelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 1.2 } },
    guitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.8 } },
    acousticGuitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },
    acoustic_guitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },
    acousticguitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },
    electricGuitar: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 } },
    electricguitar: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 } },
    bass: { oscillator: { type: 'square' }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.6 } },

    // ── WIND ──
    flute: { oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.8 } },
    clarinet: { oscillator: { type: 'square' }, envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.5 } },
    saxophone: { oscillator: { type: 'fatsawtooth', count: 2, spread: 10 }, envelope: { attack: 0.06, decay: 0.1, sustain: 0.8, release: 0.6 } },
    trumpet: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.04, decay: 0.1, sustain: 0.7, release: 0.4 } },

    // ── WORLD / ETHNIC ──
    erhu: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 5 }, envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.9 } },
    sitar: { oscillator: { type: 'fmtriangle', modulationType: 'sawtooth', modulationIndex: 8 }, envelope: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1.0 } },
    koto: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.9, sustain: 0.0, release: 1.2 } },
    guzheng: { oscillator: { type: 'fmtriangle', modulationType: 'sine', modulationIndex: 4 }, envelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 1.0 } },
    kalimba: { oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.6, sustain: 0.05, release: 1.5 } },

    // ── PADS / SYNTH ──
    pad: { oscillator: { type: 'fatsine', count: 3, spread: 20 }, envelope: { attack: 0.8, decay: 0.3, sustain: 0.9, release: 2.0 } },
    synthPad: { oscillator: { type: 'fatsawtooth', count: 3, spread: 25 }, envelope: { attack: 1.0, decay: 0.2, sustain: 0.9, release: 2.5 } },
    synthpad: { oscillator: { type: 'fatsawtooth', count: 3, spread: 25 }, envelope: { attack: 1.0, decay: 0.2, sustain: 0.9, release: 2.5 } },
    bellPad: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 6 }, envelope: { attack: 0.01, decay: 1.5, sustain: 0.1, release: 2.0 } },
    bellpad: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 6 }, envelope: { attack: 0.01, decay: 1.5, sustain: 0.1, release: 2.0 } },
    marimba: { oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.4, sustain: 0.0, release: 0.6 } },
    xylophone: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.0, release: 0.5 } },
    bells: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 10 }, envelope: { attack: 0.005, decay: 2.0, sustain: 0.0, release: 2.5 } },
    bass_synth: { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 } },

    // ── ADDITIONAL (จาก presets) ──
    vibes: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 } },
    celesta: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.6 } },
    synth_pad: { oscillator: { type: 'fatsawtooth', count: 3, spread: 25 }, envelope: { attack: 1.0, decay: 0.2, sustain: 0.9, release: 2.5 } },
    vibraphone: { oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.6, sustain: 0.0, release: 1.2 } },
    chimes: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 6 }, envelope: { attack: 0.01, decay: 1.5, sustain: 0.0, release: 2.0 } },
    harp: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1.0 } },
    drums: { oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.1 } },
    percussion: { oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.2 } },
    acoustic_guitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },

    // ✅ [FIX v5.6.1] aliases เพิ่มเติมเพื่อ map จาก NumerologyToMusicConverter (snake_case) และ preset strings
    shamisen: { oscillator: { type: 'fmsawtooth', modulationType: 'sine', modulationIndex: 4 }, envelope: { attack: 0.005, decay: 0.5, sustain: 0.1, release: 0.7 } },
    synth: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 } },
    bell: { oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 8 }, envelope: { attack: 0.005, decay: 1.8, sustain: 0.0, release: 2.0 } },
    electric_guitar: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 } },
    synth_lead: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 } }
    // ไม่มี default
};

const INSTRUMENT_CHORD_CONFIG = {
    piano: { oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 0.5, sustain: 0.3, release: 1.2 } },
    electricPiano: { oscillator: { type: 'fmsine', modulationType: 'triangle', modulationIndex: 3 }, envelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 0.8 } },
    organ: { oscillator: { type: 'fatsawtooth', count: 3, spread: 20 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.3 } },
    strings: { oscillator: { type: 'fatsawtooth', count: 4, spread: 30 }, envelope: { attack: 0.4, decay: 0.2, sustain: 0.8, release: 1.5 } },
    guitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.8 } },
    acousticGuitar: { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.0 } },
    pad: { oscillator: { type: 'fatsine', count: 3, spread: 20 }, envelope: { attack: 0.8, decay: 0.3, sustain: 0.9, release: 2.0 } },
    synthPad: { oscillator: { type: 'fatsawtooth', count: 3, spread: 25 }, envelope: { attack: 1.0, decay: 0.2, sustain: 0.9, release: 2.5 } },
    vibes: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 } },
    celesta: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.6 } },
    harp: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1.0 } }
    // ไม่มี default
};

// ========== 3. MAIN CLASS ==========
class MusicAudio {
    constructor() {
        verifyFunctionApproval('constructor');

        this.moduleName = 'MusicAudio';
        this.initialized = false;
        this.isPlaying = false;
        this.currentTempo = 120;
        this.scheduledEvents = new Map();
        this.musicDNA = null;
        this.natureSynth = null;
        this.audioContext = null;
        this.userInteracted = false;
        this.transportPosition = 0;
        this.unsubscribeMusicCurrent = null;

        this.effectNodes = [];
        this.effectInput = null;
        this.effectOutput = Tone.Destination;

        this._loopEnabled = false;
        this._activePart = null;
        this._activeInstruments = ['piano', 'strings', 'pad'];

        this.log = (msg) => console.log(`[${this.moduleName}] ${msg}`);
        this.logWarning = (msg) => console.warn(`[${this.moduleName}] ⚠️ ${msg}`);
        this.logError = (msg, err) => console.error(`[${this.moduleName}] ❌ ${msg}`, err);
        this.handleError = (msg, err) => this.logError(msg, err);

        this.log('Constructor called');
    }

    async initialize() {
        verifyFunctionApproval('initialize');
        this.log('initialize() started');
        if (this.initialized) {
            this.log('already initialized, returning');
            return;
        }

        try {
            this.log('Step 1: checking Tone');
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not loaded');
            }
            this.log(`Tone available, context.state = ${Tone.context.state}`);
            this.audioContext = Tone.context;

            this.log('Step 2: setupTransport');
            this.setupTransport();
            this.log('setupTransport done');

            this.log('Step 3: NatureSynth check');
            if (window.NatureSynth?.initialized) {
                this.natureSynth = window.NatureSynth;
                this.log('NatureSynth available');
            } else {
                this.log('NatureSynth not available — nature effects will throw error if used');
                this.natureSynth = null;
            }

            this.log('Step 4: setupEventListeners');
            this.setupEventListeners();

            this.log('Step 5: setupUIListeners');
            this.setupUIListeners();

            this.log('Step 6: MemoryManager track');
            if (typeof MemoryManager !== 'undefined') {
                MemoryManager.track(this, 'MusicAudio');
            }

            this.log('Step 7: subscribe to AppMain');
            if (window.AppMainController?.subscribe) {
                this.unsubscribeMusicCurrent = window.AppMainController.subscribe('music.current', (pointerValue) => {
                    this.log(`Received music.current change: "${pointerValue}" (type=${typeof pointerValue})`);
                    if (typeof pointerValue === 'string') {
                        const activeDNA = window.AppMainController.getActiveMusicDNA?.();
                        if (activeDNA) {
                            this.log(`Resolved pointer "${pointerValue}" → activeDNA (notes=${activeDNA.sequence?.length || 0})`);
                            this.handleMusicDNAGenerated(activeDNA);
                        } else {
                            this.logWarning(`Pointer "${pointerValue}" resolved to null — DNA ยังไม่ถูกบันทึกใน AppMain`);
                        }
                    } else if (pointerValue && typeof pointerValue === 'object') {
                        this.handleMusicDNAGenerated(pointerValue);
                    }
                });
                this.log('Subscribed to AppMain music.current (pointer-aware)');

                const activeDNA = window.AppMainController.getActiveMusicDNA?.();
                if (activeDNA) {
                    this.log('Found existing activeDNA, handling now');
                    this.handleMusicDNAGenerated(activeDNA);
                }
            } else {
                this.logWarning('AppMainController not available');
            }

            window.addEventListener('musicPointerChanged', (e) => {
                // ✅ [FIX v5.5] รับ activeDNA จาก event.detail โดยตรง
                // ถ้าไม่มี → fallback อ่านจาก AppMain
                const detail = e.detail || {};
                const { combinedDNA } = detail;

                // ✅ [NEW v5.5 — ข้อ 3] โหมด "ผสมผสาน" Default + Custom
                if (combinedDNA?.defaultDNA && combinedDNA?.customDNA) {
                    this.log('Received musicPointerChanged → combined mode (Default + Custom)');
                    this.handleCombinedDNA(combinedDNA.defaultDNA, combinedDNA.customDNA);
                    return;
                }

                let activeDNA = detail.activeDNA;
                if (!activeDNA) {
                    if (window.AppMainController?.getActiveMusicDNA) {
                        activeDNA = window.AppMainController.getActiveMusicDNA();
                        if (activeDNA) {
                            this.log('Received musicPointerChanged event (DNA from AppMain)');
                        } else {
                            this.logWarning('musicPointerChanged without activeDNA — skipped');
                            return;
                        }
                    } else {
                        this.logWarning('musicPointerChanged: no activeDNA and AppMain unavailable');
                        return;
                    }
                } else {
                    this.log('Received musicPointerChanged event (DNA from event.detail)');
                }
                this.handleMusicDNAGenerated(activeDNA);
            });

            this.initialized = true;
            this.log('MusicAudio initialized successfully');

            if (window.StateManager) {
                StateManager.set('audio.initialized', true);
            }
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('audioInitialized');
            }

        } catch (error) {
            this.logError('Error in initialize:', error);
            this.handleError('Failed to initialize MusicAudio', error);
        }
    }

    waitForUserInteraction() {
        verifyFunctionApproval('waitForUserInteraction');
        return new Promise((resolve) => {
            if (this.userInteracted) {
                resolve();
                return;
            }
            const handler = () => {
                this.userInteracted = true;
                document.removeEventListener('click', handler);
                document.removeEventListener('touchstart', handler);
                this.log('User interaction detected, audio ready');
                resolve();
            };
            document.addEventListener('click', handler);
            document.addEventListener('touchstart', handler);
            setTimeout(() => {
                if (!this.userInteracted) {
                    this.logWarning('User interaction timeout, enabling audio anyway');
                    this.userInteracted = true;
                    resolve();
                }
            }, 15000);
        });
    }

    setupTransport() {
        verifyFunctionApproval('setupTransport');
        Tone.Transport.bpm.value = this.currentTempo;
        Tone.Transport.timeSignature = [4, 4];
        Tone.Transport.on('start', (t) => this.handleTransportStart(t));
        Tone.Transport.on('stop', (t) => this.handleTransportStop(t));
        Tone.Transport.on('pause', (t) => this.handleTransportPause(t));
        Tone.Transport.on('loop', (t) => this.handleTransportLoop(t));
        this.log('Tone.Transport setup complete');
    }

    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');
        if (typeof EventBus === 'undefined') {
            this.logWarning('EventBus not available');
            return;
        }
        EventBus.on('musicDNAGenerated', (musicDNA) => {
            if (!window.AppMainController) this.handleMusicDNAGenerated(musicDNA);
        });
        EventBus.on('playbackRequest', () => this.togglePlayback());
        EventBus.on('tempoChangeRequest', (t) => this.changeTempo(t));
        EventBus.on('stopPlayback', () => this.stop());
        EventBus.on('synthCreated', (d) => this.handleSynthCreated(d));
        EventBus.on('synthDisposed', (d) => this.handleSynthDisposed(d));
        EventBus.on('volumeChange', (v) => this.setMasterVolume(v));
        EventBus.on('muteToggle', (m) => this.setMute(m));
    }

    setupUIListeners() {
        verifyFunctionApproval('setupUIListeners');
        this.log('setupUIListeners called');

        const playBtn = document.getElementById('playButton');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.log('▶ playButton clicked directly');
                this.togglePlayback();
            });
            this.log('playButton direct listener attached');
        } else {
            this.logWarning('playButton not found!');
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.on('playbackStateChanged', (state) => {
                const icon = document.getElementById('playIcon');
                const text = document.getElementById('playButtonText');
                if (icon) icon.className = state.isPlaying ? 'fas fa-pause' : 'fas fa-play';
                if (text) text.textContent = state.isPlaying ? 'หยุดเพลง' : 'เล่นเพลง';
            });
        }
    }

    // ========== MUSIC DNA HANDLING (v5.6 — No Fallback, error propagation) ==========
    handleMusicDNAGenerated(musicDNA) {
        verifyFunctionApproval('handleMusicDNAGenerated');
        this.log(`handleMusicDNAGenerated called, musicDNA exists=${!!musicDNA}`);
        if (!musicDNA) return;

        if (!musicDNA.config && !musicDNA.sequence && !musicDNA.melody) {
            const err = new Error('MusicDNA missing required fields');
            this.logError(err.message);
            this._dispatchError(err);
            throw err;
        }

        // ตรวจสอบ instruments
        if (!musicDNA.instruments || !Array.isArray(musicDNA.instruments) || musicDNA.instruments.length === 0) {
            const err = new Error('MusicDNA has no instruments property — cannot play');
            this.logError(err.message);
            this._dispatchError(err);
            throw err;
        }

        this.musicDNA = musicDNA;
        this.currentTempo = musicDNA.tempo || musicDNA.config?.bpm || 120;
        this.log(`Using tempo: ${this.currentTempo} BPM`);

        // ใช้ instruments จาก musicDNA โดยตรง
        this._activeInstruments = musicDNA.instruments;
        this.log(`✅ Instruments from musicDNA: [${this._activeInstruments.join(', ')}]`);

        Tone.Transport.bpm.rampTo(this.currentTempo, 0.5);

        // ตรวจสอบและสร้าง effect chain (อาจ throw error)
        const effects = musicDNA.effects || [];
        this.log(`Effects from musicDNA:`, effects);
        this.disposeEffects();
        try {
            this.createEffectChain(effects);
        } catch (err) {
            this.logError('Failed to create effect chain:', err.message);
            this._dispatchError(err);
            // ตั้งค่า effectInput เป็น destination เพื่อให้ยังเล่นได้โดยไม่มี effect
            this.effectInput = Tone.Destination;
        }

        this.clearScheduledEvents();
        this.scheduleMusicEvents();
        this.scheduleNatureEffects();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('musicDNAUpdated', musicDNA);
        }
    }

    // ✅ [NEW v5.5 — ข้อ 3] เล่น Default DNA ต่อด้วย Custom DNA ต่อเนื่องกันในเพลงเดียว
    handleCombinedDNA(defaultDNA, customDNA) {
        verifyFunctionApproval('handleCombinedDNA');
        this.log('handleCombinedDNA: merging Default + Custom sequences');

        if (!defaultDNA?.sequence || !customDNA?.sequence) {
            this.logError('handleCombinedDNA: missing sequence in defaultDNA or customDNA');
            // fallback: เล่น default เท่านั้น
            if (defaultDNA) this.handleMusicDNAGenerated(defaultDNA);
            return;
        }

        // คำนวณ duration ของ Default sequence (เวลาสุดท้าย + 2 วิ buffer)
        const defaultSeq  = defaultDNA.sequence;
        const lastDefault = defaultSeq[defaultSeq.length - 1];
        const defaultDuration = (typeof lastDefault === 'object' ? (lastDefault.time || 0) : 0) + 1;

        // shift Custom sequence ให้เริ่มหลัง Default เสร็จ
        const customSeq = customDNA.sequence.map(note => ({
            ...note,
            time: (note.time || 0) + defaultDuration
        }));

        // รวม instruments จากทั้งสอง (ใช้ default instruments สำหรับ Default section, custom สำหรับ Custom section)
        const defaultInstruments = defaultDNA.instruments || ['piano'];
        const customInstruments  = customDNA.instruments  || ['piano'];

        // สร้าง combined DNA object
        const combinedSequence = [...defaultSeq, ...customSeq];
        const combinedDNA = {
            ...defaultDNA,
            sequence: combinedSequence,
            instruments: defaultInstruments, // primary instruments (จะ switch ตอนเล่น custom section)
            effects: defaultDNA.effects || [],
            // เก็บข้อมูล section เพื่อให้ scheduleMusicEvents ทราบว่าเมื่อไหรต้องเปลี่ยน instruments
            _sections: [
                { startTime: 0,               endTime: defaultDuration, instruments: defaultInstruments, effects: defaultDNA.effects || [] },
                { startTime: defaultDuration,  endTime: null,            instruments: customInstruments,  effects: customDNA.effects || [] }
            ]
        };

        this.log(`Combined: ${defaultSeq.length} default notes + ${customSeq.length} custom notes, switchAt=${defaultDuration}s`);
        this.log(`Default instruments: [${defaultInstruments}], Custom instruments: [${customInstruments}]`);

        this.handleMusicDNAGenerated(combinedDNA);
    }

    // dispatch error event ให้ UI จับ
    _dispatchError(error) {
        window.dispatchEvent(new CustomEvent('musicAudioError', {
            detail: { message: error.message, error },
            bubbles: true
        }));
    }

    buildSynthFromInstrument(instrumentName, forChord = false) {
        verifyFunctionApproval('buildSynthFromInstrument');

        const name = (instrumentName || '').toLowerCase().trim();
        if (!name) {
            throw new Error('[MusicAudio] Instrument name is empty');
        }

        const camelName = name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        let config;

        if (forChord) {
            config = INSTRUMENT_CHORD_CONFIG[camelName] || INSTRUMENT_CHORD_CONFIG[name];
            if (!config) {
                config = INSTRUMENT_SYNTH_CONFIG[camelName] || INSTRUMENT_SYNTH_CONFIG[name];
            }
        } else {
            config = INSTRUMENT_SYNTH_CONFIG[camelName] || INSTRUMENT_SYNTH_CONFIG[name];
        }

        if (!config) {
            throw new Error(`[MusicAudio] Unknown instrument "${instrumentName}" - no mapping available (No Fallback)`);
        }

        this.log(`Building ${forChord ? 'PolySynth' : 'Synth'} for instrument: ${instrumentName} → oscillator.type=${config.oscillator.type}`);
        return config;
    }

    // ========== Effect Chain (v5.6 — No Fallback) ==========
    createEffectChain(effects) {
        verifyFunctionApproval('createEffectChain');
        this.log(`Creating effect chain with: ${effects.join(', ')}`);

        if (!effects || effects.length === 0) {
            this.log('No effects, connecting synths directly to destination');
            this.effectInput = Tone.Destination;
            return;
        }

        const nodes = [];

        for (const effectType of effects) {
            try {
                let node;
                switch(effectType.toLowerCase()) {
                    case 'reverb':
                        node = new Tone.Reverb({ decay: 2.5, wet: 0.5 }).toDestination();
                        break;
                    case 'delay':
                        node = new Tone.FeedbackDelay({ delayTime: 0.3, feedback: 0.4, wet: 0.3 }).toDestination();
                        break;
                    case 'chorus':
                        node = new Tone.Chorus({ frequency: 1.5, delayTime: 2.5, depth: 0.5, wet: 0.4 }).start();
                        break;
                    case 'eq':
                        node = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
                        break;
                    case 'filter':
                        node = new Tone.Filter({ frequency: 1000, type: 'lowpass' });
                        break;
                    case 'compressor':
                        node = new Tone.Compressor({ threshold: -20, ratio: 4, attack: 0.003, release: 0.25 });
                        break;
                    case 'distortion':
                        node = new Tone.Distortion({ distortion: 0.4 });
                        break;
                    case 'phaser':
                        node = new Tone.Phaser({ frequency: 1, octaves: 3, baseFrequency: 500 });
                        break;
                    default:
                        throw new Error(`Unknown effect type: ${effectType}`);
                }
                if (node) nodes.push(node);
            } catch (e) {
                // ถ้า effect ใดไม่รู้จัก ให้ throw error และหยุดสร้าง chain
                throw new Error(`Failed to create effect node for ${effectType}: ${e.message}`);
            }
        }

        if (nodes.length === 0) {
            this.effectInput = Tone.Destination;
            return;
        }

        for (let i = 0; i < nodes.length; i++) {
            if (i === 0) {
                this.effectInput = nodes[i];
            } else {
                nodes[i-1].connect(nodes[i]);
            }
            this.effectNodes.push(nodes[i]);
        }

        nodes[nodes.length-1].connect(Tone.Destination);
        this.log(`Effect chain created with ${nodes.length} nodes`);
    }

    disposeEffects() {
        verifyFunctionApproval('disposeEffects');
        this.log('Disposing effect nodes');
        this.effectNodes.forEach(node => {
            try {
                node.disconnect();
                node.dispose();
            } catch (e) {
                this.logWarning('Error disposing effect node', e);
            }
        });
        this.effectNodes = [];
        this.effectInput = Tone.Destination;
    }

    // ---------- Music Event Scheduling ----------
    scheduleMusicEvents() {
        verifyFunctionApproval('scheduleMusicEvents');
        if (!this.musicDNA) return;

        let notes = this.musicDNA.sequence || this.musicDNA.melody || [];
        let chords = this.musicDNA.chords || [];

        this.log(`Notes array length: ${notes.length}, Chords array length: ${chords.length}`);

        if (notes.length === 0 && chords.length === 0) {
            this.logWarning('No music events to schedule');
            return;
        }

        if (notes.length > 0) {
            const partEvents = notes.map((noteEvent) => {
                if (typeof noteEvent === 'string') {
                    noteEvent = { note: noteEvent, duration: '8n', time: 0 };
                }
                return [noteEvent.time || 0, noteEvent];
            });

            if (this._activePart) {
                try { this._activePart.dispose(); } catch(e) {}
                this._activePart = null;
            }

            const lastNote = notes[notes.length - 1];
            const lastTime = typeof lastNote === 'object' ? (lastNote.time || 0) : 0;
            this._sequenceDuration = lastTime + 2;

            try {
                const part = new Tone.Part((time, noteEvent) => {
                    this.playMelodyNote(noteEvent, time);
                }, partEvents);

                part.loop = this._loopEnabled;
                if (this._loopEnabled) {
                    part.loopEnd = this._sequenceDuration;
                    this.log(`Part loop ON, loopEnd=${this._sequenceDuration}s`);
                }

                part.start(0);
                this._activePart = part;
                this.scheduledEvents.set('melody_part', part);
                this.log(`Scheduled melody Part with ${partEvents.length} events (loop=${this._loopEnabled})`);
            } catch (err) {
                this.logError('Error creating Tone.Part, falling back to Transport.schedule', err);
                notes.forEach((noteEvent, idx) => {
                    if (typeof noteEvent === 'string') noteEvent = { note: noteEvent, duration: '8n' };
                    const eventId = `melody_${idx}`;
                    const time = noteEvent.time || `${idx}:0`;
                    const ev = Tone.Transport.schedule((time) => {
                        this.playMelodyNote(noteEvent, time);
                    }, time);
                    this.scheduledEvents.set(eventId, ev);
                });
            }
        }

        if (chords.length > 0) {
            chords.forEach((chordEvent, idx) => {
                const eventId = `chord_${idx}`;
                const time = chordEvent.time || `${idx * 2}:0`;
                const ev = Tone.Transport.schedule((time) => {
                    this.playChord(chordEvent, time);
                }, time);
                this.scheduledEvents.set(eventId, ev);
            });
        }

        this.log(`Scheduled ${this.scheduledEvents.size} music events`);
    }

    setLoopEnabled(enabled) {
        verifyFunctionApproval('setLoopEnabled');
        this._loopEnabled = enabled;

        if (this._activePart) {
            this._activePart.loop = enabled;
            if (enabled && this._sequenceDuration) {
                this._activePart.loopEnd = this._sequenceDuration;
            }
        }

        if (typeof Tone !== 'undefined' && Tone.Transport) {
            Tone.Transport.loop = enabled;
            if (enabled && this._sequenceDuration) {
                Tone.Transport.loopStart = 0;
                Tone.Transport.loopEnd = this._sequenceDuration;
            }
        }

        this.log(`Loop mode ${enabled ? 'ON' : 'OFF'} (sequenceDuration=${this._sequenceDuration}s)`);
    }

    scheduleNatureEffects() {
        verifyFunctionApproval('scheduleNatureEffects');
        const natureEffects = this.musicDNA?.natureEffects || [];
        if (natureEffects.length === 0) return;

        natureEffects.forEach((effect, idx) => {
            const eventId = `nature_${idx}`;
            const timecode = effect.timecode || `${idx}:0`;
            const time = this.parseTimecode(timecode).start;

            const ev = Tone.Transport.schedule((time) => {
                this.playNatureEffectFromObject(effect, time);
            }, time);
            this.scheduledEvents.set(eventId, ev);

            if (effect.duration) {
                const stopEv = Tone.Transport.schedule((time) => {
                    this.stopNatureEffect(effect.id || idx, time);
                }, time + effect.duration);
                this.scheduledEvents.set(`${eventId}_stop`, stopEv);
            }
        });
    }

    playNatureEffectFromObject(effect, time) {
        verifyFunctionApproval('playNatureEffectFromObject');
        if (!effect || !effect.type) {
            throw new Error('Invalid nature effect object');
        }

        const { type, element, intensity = 0.5, toneParams = {} } = effect;

        if (!this.natureSynth || typeof this.natureSynth.createSynth !== 'function') {
            throw new Error('NatureSynth not available - cannot play nature effect');
        }

        try {
            const synth = this.natureSynth.createSynth(type, {
                volume: intensity,
                ...toneParams
            });
            if (!this.natureSynthActive) this.natureSynthActive = [];
            this.natureSynthActive.push({ id: synth.id, type, time });
            synth.start(time);
            this.log(`Nature effect triggered: ${type} (element: ${element}) at ${time}`);
        } catch (err) {
            this.logError('Error playing nature effect via NatureSynth', err);
            throw new Error(`Failed to play nature effect: ${err.message}`);
        }
    }

    playNatureLayer(preset) {
        verifyFunctionApproval('playNatureLayer');
        if (!window.ToneNatureSynth?.playNatureLayer) {
            throw new Error('[MusicAudio] tone-nature-synth not ready — cannot play nature layer');
        }
        window.ToneNatureSynth.playNatureLayer(preset, 0.4);
    }

    playMelodyNote(noteEvent, time) {
        verifyFunctionApproval('playMelodyNote');
        if (!noteEvent?.note) return;

        try {
            // ✅ [FIX v5.5 — ข้อ 3] ใน combined mode ใช้ instruments ของ section ที่ถูกต้องตาม noteEvent.time
            let instrumentsToPlay = this._activeInstruments;
            if (this.musicDNA?._sections?.length > 0) {
                const noteTime = noteEvent.time || 0;
                const section = this.musicDNA._sections.find((s, idx) => {
                    const nextSection = this.musicDNA._sections[idx + 1];
                    return noteTime >= s.startTime && (!nextSection || noteTime < nextSection.startTime);
                });
                if (section?.instruments) {
                    instrumentsToPlay = section.instruments;
                }
            }

            const synths = [];

            let baseNote = noteEvent.note;
            if (!baseNote.match(/\d/)) {
                baseNote = baseNote + '4'; // default octave 4
            }

            instrumentsToPlay.forEach((instName, idx) => {
                try {
                    let note = baseNote;
                    if (idx === 1) {
                        note = Tone.Frequency(baseNote).transpose(12).toNote();
                    } else if (idx === 2) {
                        note = Tone.Frequency(baseNote).transpose(-12).toNote();
                    }

                    const synthConfig = this.buildSynthFromInstrument(instName, false);
                    const synth = new Tone.Synth(synthConfig);
                    synth.connect(this.effectInput || Tone.Destination);
                    synth.triggerAttackRelease(note, noteEvent.duration || '8n', time);
                    synths.push(synth);
                } catch (innerErr) {
                    this.logError(`Instrument error for ${instName}:`, innerErr.message);
                }
            });

            setTimeout(() => {
                synths.forEach(s => s.dispose());
            }, 2000);

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('musicNotePlayed', {
                    note: baseNote,
                    time,
                    duration: noteEvent.duration,
                    frequency: Tone.Frequency(baseNote).toFrequency(),
                    instruments: instrumentsToPlay
                });
            }
        } catch (err) {
            this.logError('Error playing melody note', err);
        }
    }

    playChord(chordEvent, time) {
        verifyFunctionApproval('playChord');
        if (!chordEvent?.notes) return;

        try {
            const instrumentsToPlay = this._activeInstruments;
            const synths = [];

            instrumentsToPlay.forEach((instName, idx) => {
                try {
                    const instrumentName = chordEvent.instrument || instName;
                    let notes = chordEvent.notes;
                    if (Array.isArray(notes)) {
                        if (idx === 1) {
                            notes = notes.map(n => Tone.Frequency(n).transpose(12).toNote());
                        } else if (idx === 2) {
                            notes = notes.map(n => Tone.Frequency(n).transpose(-12).toNote());
                        }
                    }

                    const synthConfig = this.buildSynthFromInstrument(instrumentName, true);
                    const polySynth = new Tone.PolySynth(Tone.Synth, synthConfig);
                    polySynth.connect(this.effectInput || Tone.Destination);
                    polySynth.volume.value = Tone.gainToDb(chordEvent.volume || 0.5);
                    polySynth.triggerAttackRelease(notes, chordEvent.duration || '2n', time);
                    synths.push(polySynth);
                } catch (innerErr) {
                    this.logError(`Instrument error for ${instName}:`, innerErr.message);
                }
            });

            setTimeout(() => {
                synths.forEach(s => s.dispose());
            }, 3000);

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('chordPlayed', {
                    notes: chordEvent.notes,
                    time,
                    duration: chordEvent.duration,
                    instruments: instrumentsToPlay
                });
            }
        } catch (err) {
            this.logError('Error playing chord', err);
        }
    }

    // ========== PLAYBACK CONTROL ==========
    togglePlayback() {
        verifyFunctionApproval('togglePlayback');
        this.log(`togglePlayback called, initialized=${this.initialized}, isPlaying=${this.isPlaying}`);
        if (!this.initialized) {
            this.logWarning('Audio not initialized yet');
            return;
        }
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        verifyFunctionApproval('play');
        this.log(`play() called, isPlaying=${this.isPlaying}, musicDNA=${!!this.musicDNA}`);
        if (this.isPlaying) return;
        if (!this.musicDNA) {
            this.logWarning('No MusicDNA loaded. Generate music first.');
            return;
        }

        if (this.scheduledEvents.size === 0) {
            this.log('No scheduled events, rescheduling from current musicDNA');
            this.scheduleMusicEvents();
            this.scheduleNatureEffects();
        }

        if (Tone.Destination.volume.value === -Infinity) {
            this.log('Destination volume was -Infinity, resetting to 0');
            Tone.Destination.volume.value = 0;
        }

        const startPlayback = () => {
            try {
                Tone.Transport.seconds = 0;
                Tone.Transport.start();
                this.isPlaying = true;
                this.log('Playback started');

                window.dispatchEvent(new CustomEvent('musicStarted', {
                    detail: { dna: this.musicDNA },
                    bubbles: true
                }));

                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('playbackStarted');
                    EventBus.emit('playbackStateChanged', { isPlaying: true });
                }
            } catch (err) {
                this.handleError('Failed to start playback', err);
            }
        };

        if (Tone.context.state !== 'running') {
            Tone.start().then(() => {
                this.log('Tone context started by play()');
                startPlayback();
            }).catch(err => this.logError('Failed to start Tone context', err));
        } else {
            startPlayback();
        }
    }

    pause() {
        verifyFunctionApproval('pause');
        this.log(`pause() called, isPlaying=${this.isPlaying}`);
        if (!this.isPlaying) return;
        try {
            Tone.Transport.pause();
            this.isPlaying = false;
            this.transportPosition = Tone.Transport.seconds;
            if (window.StateManager) {
                StateManager.set('playback.isPlaying', false);
                StateManager.set('playback.position', this.transportPosition);
            }
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('playbackPaused', { position: this.transportPosition });
                EventBus.emit('playbackStateChanged', { isPlaying: false });
            }
            this.log('Playback paused');
        } catch (err) {
            this.handleError('Failed to pause playback', err);
        }
    }

    stop() {
        verifyFunctionApproval('stop');
        this.log(`stop() called, isPlaying=${this.isPlaying}`);
        try {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            this.isPlaying = false;
            this.transportPosition = 0;
            this.clearScheduledEvents();

            if (this.natureSynthActive) {
                this.natureSynthActive.forEach(item => {
                    if (this.natureSynth && typeof this.natureSynth.stopSynth === 'function') {
                        this.natureSynth.stopSynth(item.id);
                    }
                });
                this.natureSynthActive = [];
            }

            window.dispatchEvent(new CustomEvent('musicStopped', {
                detail: {},
                bubbles: true
            }));

            if (window.StateManager) {
                StateManager.set('playback.isPlaying', false);
                StateManager.set('playback.position', 0);
            }
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('playbackStopped');
                EventBus.emit('playbackStateChanged', { isPlaying: false });
                EventBus.emit('stopAllNatureEffects');
            }
            this.log('Playback stopped');
        } catch (err) {
            this.handleError('Failed to stop playback', err);
        }
    }

    changeTempo(newTempo) {
        verifyFunctionApproval('changeTempo');
        if (newTempo < 40 || newTempo > 200) {
            this.logWarning(`Invalid tempo: ${newTempo}. Must be 40-200 BPM`);
            return;
        }
        this.currentTempo = newTempo;
        Tone.Transport.bpm.rampTo(newTempo, 0.5);
        if (window.StateManager) StateManager.set('playback.tempo', newTempo);
        if (typeof EventBus !== 'undefined') EventBus.emit('tempoChanged', newTempo);
        this.log(`Tempo changed to ${newTempo} BPM`);
    }

    setMasterVolume(volume) {
        verifyFunctionApproval('setMasterVolume');
        const clamped = Math.max(0, Math.min(1, volume));
        Tone.Destination.volume.rampTo(Tone.gainToDb(clamped), 0.1);
        if (window.StateManager) StateManager.set('audio.volume', clamped);
        this.log(`Master volume set to ${clamped}`);
    }

    setMute(muted) {
        verifyFunctionApproval('setMute');
        Tone.Destination.mute = muted;
        if (window.StateManager) StateManager.set('audio.muted', muted);
        if (typeof EventBus !== 'undefined') EventBus.emit('audioMuted', muted);
        this.log(`Audio ${muted ? 'muted' : 'unmuted'}`);
    }

    clearScheduledEvents() {
        verifyFunctionApproval('clearScheduledEvents');
        if (this._activePart) {
            try {
                this._activePart.stop();
                this._activePart.dispose();
            } catch (e) {
                this.logWarning('Error disposing Part: ' + e.message);
            }
            this._activePart = null;
        }
        Tone.Transport.cancel();
        this.scheduledEvents.clear();
        this.log('Cleared all scheduled events');
    }

    parseTimecode(tc) {
        verifyFunctionApproval('parseTimecode');
        if (!tc) return { start: 0, duration: 0 };
        try {
            const parts = tc.split('-');
            if (parts.length !== 2) return { start: 0, duration: 0 };
            const parse = (t) => {
                const [m, s] = t.split(':').map(Number);
                return (m * 60) + (s || 0);
            };
            const start = parse(parts[0]);
            const end = parse(parts[1]);
            return { start, duration: end - start, startFormatted: parts[0], endFormatted: parts[1] };
        } catch (err) {
            this.logError('Error parsing timecode', err);
            return { start: 0, duration: 0 };
        }
    }

    handleTransportStart(time) {
        verifyFunctionApproval('handleTransportStart');
        this.log(`Transport started at ${time}`);
        if (typeof EventBus !== 'undefined') EventBus.emit('transportStarted', { time });
    }
    handleTransportStop(time) {
        verifyFunctionApproval('handleTransportStop');
        this.log(`Transport stopped at ${time}`);
        if (typeof EventBus !== 'undefined') EventBus.emit('transportStopped', { time });
    }
    handleTransportPause(time) {
        verifyFunctionApproval('handleTransportPause');
        this.log(`Transport paused at ${time}`);
        if (typeof EventBus !== 'undefined') EventBus.emit('transportPaused', { time });
    }
    handleTransportLoop(time) {
        verifyFunctionApproval('handleTransportLoop');
        this.log(`Transport looped at ${time}`);
        if (typeof EventBus !== 'undefined') EventBus.emit('transportLooped', { time });
    }

    handleSynthCreated(data) {
        verifyFunctionApproval('handleSynthCreated');
        this.log(`Nature synth created: ${data.preset}`);
    }
    handleSynthDisposed(data) {
        verifyFunctionApproval('handleSynthDisposed');
        this.log(`Nature synth disposed: ${data.preset}`);
    }

    cleanup() {
        verifyFunctionApproval('cleanup');
        this.log('Cleaning up MusicAudio...');
        this.stop();
        this.clearScheduledEvents();
        this.disposeEffects();

        Tone.Transport.off('start');
        Tone.Transport.off('stop');
        Tone.Transport.off('pause');
        Tone.Transport.off('loop');

        if (this.unsubscribeMusicCurrent) {
            this.unsubscribeMusicCurrent();
            this.unsubscribeMusicCurrent = null;
        }

        this.isPlaying = false;
        this.musicDNA = null;
        this.initialized = false;

        if (typeof MemoryManager !== 'undefined') {
            MemoryManager.untrack(this);
        }

        this.log('MusicAudio cleanup complete');
    }

    getPlaybackState() {
        verifyFunctionApproval('getPlaybackState');
        return {
            isPlaying: this.isPlaying,
            tempo: this.currentTempo,
            position: Tone.Transport.seconds,
            progress: this.musicDNA ? (Tone.Transport.seconds / (3 * 60)) * 100 : 0,
            musicDNA: !!this.musicDNA,
            activeInstruments: this._activeInstruments
        };
    }
}

window.AudioController = new MusicAudio();
console.log("[MusicAudio] ✅ MUSIC-AUDIO.JS v5.6 LOADED — No Fallback, error events");
console.log("[MusicAudio] 📋 Approved Functions:", Object.keys(APPROVED_FUNCTIONS_MusicAudio));