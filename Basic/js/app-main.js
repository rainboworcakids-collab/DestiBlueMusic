// app-main.js v7.7 - STATE MANAGER CENTRAL (แก้ไข state ซ้ำซ้อน)
// เพิ่ม:
//   - ตรวจสอบค่าเดิมก่อน setState เพื่อป้องกัน event ฟุ่มเฟือย
//   - helper methods _getValueAtPath, _deepEqual

console.log("🔧 APP-MAIN.JS v7.7 - STATE MANAGER CENTRAL INITIALIZING...");

if (typeof window.DataContract === 'undefined') {
    throw new Error("❌ CRITICAL: data-contract.js must be loaded before app-main.js");
}
if (typeof window.EdgeFunctionIntegration === 'undefined') {
    throw new Error("❌ CRITICAL: edge-function-integration.js must be loaded before app-main.js");
}

const APPROVED_FUNCTIONS_AppMain = {
    constructor: true,
    initialize: true,
    getState: true,
    setState: true,
    validateState: true,
    resetState: true,
    resetStateDataOnly: true,
    getActiveMusicDNA: true,
    migrateStorageSchema: true,
    subscribe: true,
    notifyListeners: true,
    processFormSubmission: true,
    validateUserData: true,
    saveUserData: true,
    loadUserData: true,
    generateMusicDNA: true,
    validateForEdgeFunction: true,
    sendToEdgeFunction: true,
    updateUIFromState: true,
    showForm: true,
    hideForm: true,
    showToast: true,
    handleNumerologyUpdated: true,
    handlePsychomatrixDataReceived: true,
    handleLuckyNumberDataReceived: true,
    setupEventListeners: true,
    resetToDefaultMusic: true,
    // ✅ internal helpers (เพิ่มใน approved list ด้วย)
    _getValueAtPath: true,
    _deepEqual: true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_AppMain[functionName]) {
        throw new Error(`🚫 UNAPPROVED FUNCTION: "${functionName}" - Violates Rule 0`);
    }
    return true;
}

class AppMainController {
    constructor() {
        verifyFunctionApproval('constructor');
        this.listeners = new Map();
        this.state = {
            user: null,
            userCustom: null,
            numerology: null,
            psychomatrix: null,
            luckyNumber: null,
            music: {
                current: null,
                default: null,
                CustomSty: null
            },
            edgeFunctions: {
                psychomatrix: null,
                luckyNumber: null,
                musicGenerator: null
            },
            ui: {
                formVisible: false,
                loading: false,
                currentView: 'form',
                currentMode: 'personal-form'
            }
        };
        console.log("✅ AppMainController v7.7 initialized");
    }

    // ---------- helper methods สำหรับเปรียบเทียบค่า ----------
    _getValueAtPath(path) {
        verifyFunctionApproval('_getValueAtPath');
        const keys = path.split('.');
        let current = this.state;
        for (const key of keys) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }
        return current;
    }

    _deepEqual(a, b) {
        verifyFunctionApproval('_deepEqual');
        // ใช้ JSON.stringify สำหรับ object ทั่วไป (รวมถึง null, undefined)
        // ถ้าเป็น primitive ก็ใช้ === ได้ แต่ JSON.stringify ก็ครอบคลุม
        return JSON.stringify(a) === JSON.stringify(b);
    }

    // ---------- core state methods ----------
    initialize() {
        verifyFunctionApproval('initialize');
        console.log("🚀 Initializing AppMain v7.7...");
        try {
            this.loadPersistedData();
            this.setupEventListeners();
            this.updateUIFromState();
            console.log("✅ AppMain v7.7 initialized successfully");
        } catch (error) {
            console.error("❌ AppMain initialization failed:", error);
            throw error;
        }
    }

    getState(path = null) {
        verifyFunctionApproval('getState');
        if (!path) return JSON.parse(JSON.stringify(this.state));
        const keys = path.split('.');
        let current = this.state;
        for (const key of keys) {
            if (current[key] === undefined) return undefined;
            current = current[key];
        }
        return JSON.parse(JSON.stringify(current));
    }

    setState(path, value) {
        verifyFunctionApproval('setState');

        // === [NEW] ตรวจสอบว่าค่าเปลี่ยนหรือไม่ ===
        const oldValue = this._getValueAtPath(path);
        if (this._deepEqual(oldValue, value)) {
            console.log(`[AppMain] setState skipped (no change): ${path}`);
            return true; // ไม่เปลี่ยนแปลง
        }

        const validation = this.validateStateUpdate(path, value);
        if (!validation.valid) {
            throw new Error(`❌ State validation failed: ${validation.errors.join(', ')}`);
        }

        const keys = path.split('.');
        const newState = JSON.parse(JSON.stringify(this.state));
        let current = newState;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.state = newState;

        this.persistState(path, value);

        window.dispatchEvent(new CustomEvent('stateChanged', {
            detail: { path, value },
            bubbles: true
        }));

        if (path === 'music.current') {
            const activeDNA = this.getActiveMusicDNA();
            window.dispatchEvent(new CustomEvent('musicPointerChanged', {
                detail: { newPointer: value, activeDNA },
                bubbles: true
            }));
        }

        this.notifyListeners(path, value);
        this.updateUIFromState();

        console.log(`✅ State updated: ${path}`, { type: typeof value, size: JSON.stringify(value).length });
        return true;
    }


    
    // ========== 5. ENHANCED VALIDATION METHODS ==========
    validateStateUpdate(path, value) {
        verifyFunctionApproval('validateState');
        
        const errors = [];
        
        try {
            switch(path) {
                case 'user':
                    window.DataContract.validateInput(value, 'app-main');
                    break;
                    
                case 'userCustom':
                    // อาจไม่มี schema แยก แต่อนุญาตให้เป็น object
                    if (value && typeof value !== 'object') {
                        errors.push('userCustom must be an object');
                    }
                    break;
                    
                case 'numerology':
                    window.DataContract.validateNumerologyContext(value);
                    break;
                    
                case 'psychomatrix':
                    if (!value || typeof value !== 'object') {
                        errors.push('Psychomatrix data must be an object');
                    }
                    break;
                    
                case 'luckyNumber':
                    if (!value || typeof value !== 'object') {
                        errors.push('Lucky number data must be an object');
                    }
                    break;
                    
                // validation ตาม P1: music.current ต้องเป็น string pointer
                case 'music.current':
                    if (value !== null && typeof value !== 'string') {
                        errors.push('music.current must be a string pointer ("music.default" or "music.CustomSty")');
                    }
                    break;
                    
                case 'music.default':
                case 'music.CustomSty':
                    if (value && typeof value !== 'object') {
                        errors.push('Music DNA must be an object');
                    }
                    if (value && (!value.config || !value.sequence)) {
                        // เปลี่ยนจาก error เป็น warning (ตามแผน)
                        console.warn('[AppMain] ⚠️ Music DNA missing config/sequence (warning)');
                    }
                    break;
                    
                case 'edgeFunctions.psychomatrix':
                case 'edgeFunctions.luckyNumber':
                case 'edgeFunctions.musicGenerator':
                    if (value && typeof value !== 'object') {
                        errors.push('Edge function data must be an object');
                    }
                    break;
                    
                case 'ui.formVisible':
                case 'ui.loading':
                    if (typeof value !== 'boolean') {
                        errors.push('UI state must be boolean');
                    }
                    break;
                    
                case 'ui.currentView':
                case 'ui.currentMode':
                    if (typeof value !== 'string') {
                        errors.push('UI view/mode must be string');
                    }
                    break;
                    
                default:
                    console.log(`ℹ️ Validating custom path: ${path}`);
            }
        } catch (error) {
            errors.push(error.message);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    // ========== 6. SUBSCRIPTION SYSTEM ==========
    subscribe(path, callback) {
        verifyFunctionApproval('subscribe');
        
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(path);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }
    
    notifyListeners(path, newValue) {
        verifyFunctionApproval('notifyListeners');
        
        // แจ้ง subscribers ที่ตรง path พอดี
        const listeners = this.listeners.get(path);
        if (listeners) {
            listeners.forEach(cb => {
                try {
                    cb(newValue);
                } catch (error) {
                    console.error(`Listener error for ${path}:`, error);
                }
            });
        }
        
        // แจ้ง wildcard subscribers (ถ้ามี)
        const wildcard = this.listeners.get('*');
        if (wildcard) {
            wildcard.forEach(cb => {
                try {
                    cb(path, newValue);
                } catch (error) {
                    console.error(`Wildcard listener error:`, error);
                }
            });
        }
    }
    
    // ========== 7. FORM HANDLING ==========
    processFormSubmission(formData) {
        verifyFunctionApproval('processFormSubmission');
        console.log("📋 Processing form submission...", { option: formData.option });
        
        try {
            // 1. Validate form data ตาม DataContract.js
            const validation = this.validateUserData(formData);
            if (!validation.valid) {
                throw new Error(`Form validation failed: ${validation.errors.join(', ')}`);
            }
            
            // 2. Save user data
            this.saveUserData(formData);
            
            // 3. Trigger numerology calculation through Form-Psychomatrix
            this.triggerFormPsychomatrixCalculation(formData);
            
            // 4. Update UI state
            this.setState('ui.loading', true);
            this.setState('ui.currentView', 'calculating');
            
            return { 
                success: true, 
                data: formData,
                message: 'กำลังประมวลผลข้อมูล...'
            };
            
        } catch (error) {
            console.error("❌ Form processing failed:", error);
            this.showToast(`ข้อมูลไม่ถูกต้อง: ${error.message}`, 'error');
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
    
    validateUserData(formData) {
        verifyFunctionApproval('validateUserData');
        
        const errors = [];
        
        try {
            // ใช้ DataContract.js สำหรับ validation
            window.DataContract.validateInput(formData, 'app-main');
        } catch (error) {
            errors.push(error.message);
        }
        
        // Additional business logic validation
        const option = formData.option || 'BD';
        const personalData = formData.personalData || {};
        
        // ตรวจสอบตาม option ที่เลือก
        if (option.includes('FullName') && !personalData.fullName?.trim()) {
            errors.push('กรุณากรอกชื่อ-นามสกุล');
        }
        
        if (option.includes('IDC') && !personalData.id_card?.trim()) {
            errors.push('กรุณากรอกเลขบัตรประชาชน');
        }
        
        if (option.includes('BD') && !personalData.birthDate) {
            errors.push('กรุณากรอกวันเกิด');
        }
        
        // ตรวจสอบรูปแบบวันเกิด (ต้องเป็น YYYY-MM-DD)
        if (personalData.birthDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(personalData.birthDate)) {
                errors.push('รูปแบบวันเกิดต้องเป็น "YYYY-MM-DD" เช่น "1968-05-22"');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    // ========== 8. FORM-PSYCHOMATRIX INTEGRATION METHODS ==========
    handlePsychomatrixDataReceived(data) {
        verifyFunctionApproval('handlePsychomatrixDataReceived');
        
        console.log("📊 Handling Psychomatrix data received...");
        
        try {
            // Validate with DataContract
            window.DataContract.validatePsychomatrixOutput(data);
            
            // Save to state
            this.setState('psychomatrix', data);
            this.setState('edgeFunctions.psychomatrix', {
                data: data,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
            
            console.log("✅ Psychomatrix data saved to state");
            
            // Dispatch event for other modules
            this.dispatchEvent('psychomatrixDataReady', data);
            
            return true;
            
        } catch (error) {
            console.error("❌ Failed to handle psychomatrix data:", error);
            this.setState('edgeFunctions.psychomatrix', {
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            });
            throw error;
        }
    }
    
    handleLuckyNumberDataReceived(data) {
        verifyFunctionApproval('handleLuckyNumberDataReceived');
        
        console.log("🍀 Handling Lucky Number data received...");
        
        try {
            // Validate with DataContract
            window.DataContract.validateLuckyNumberOutput(data);
            
            // Save to state
            this.setState('luckyNumber', data);
            this.setState('edgeFunctions.luckyNumber', {
                data: data,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
            
            console.log("✅ Lucky Number data saved to state");
            
            // Dispatch event for other modules
            this.dispatchEvent('luckyNumberDataReady', data);
            
            return true;
            
        } catch (error) {
            console.error("❌ Failed to handle lucky number data:", error);
            this.setState('edgeFunctions.luckyNumber', {
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            });
            throw error;
        }
    }
    
    handleNumerologyUpdated(numerologyContext) {
        verifyFunctionApproval('handleNumerologyUpdated');
        
        console.log("🔢 Handling Numerology Context update...");
        
        try {
            // Validate with DataContract
            window.DataContract.validateNumerologyContext(numerologyContext);
            
            // Save to state
            this.setState('numerology', numerologyContext);
            
            // Update UI state
            this.setState('ui.loading', false);
            this.setState('ui.currentView', 'numerology');
            
            console.log("✅ Numerology context saved to state");
            
            // Show success toast
            this.showToast('คำนวณตัวเลขศาสตร์สำเร็จ!', 'success');
            
            // Dispatch event for other modules
            this.dispatchEvent('numerologyReady', numerologyContext);
            
            return true;
            
        } catch (error) {
            console.error("❌ Failed to handle numerology update:", error);
            this.showToast(`การคำนวณตัวเลขศาสตร์ล้มเหลว: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // ========== 9. MUSIC GENERATION FLOW ==========
    async generateMusicDNA() {
        verifyFunctionApproval('generateMusicDNA');
        
        console.log("🎵 Generating Music DNA...");
        
        try {
            const numerologyData = this.getState('numerology');
            const userData = this.getState('user');
            
            if (!numerologyData || !userData) {
                throw new Error("❌ Missing required data for Music DNA generation");
            }
            
            // Validate before sending to Edge Function
            const validation = this.validateForEdgeFunction(numerologyData, userData);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Update UI state
            this.setState('ui.loading', true);
            this.setState('ui.currentView', 'generating');
            
            // ส่งไปยัง Edge Function ผ่าน edge-function-integration.js
            const musicDNA = await this.sendToEdgeFunction(numerologyData, userData);
            
            // ตรวจสอบ default และ set ทั้ง current/default ตามความเหมาะสม
            const currentDefault = this.getState('music.default');
            if (!currentDefault) {
                // ครั้งแรก: set ทั้ง current และ default
                this.setState('music.default', musicDNA);
            }
            // set current เสมอ (สำหรับเพลงใหม่)
            this.setState('music.current', musicDNA);
            
            // Update UI state
            this.setState('ui.loading', false);
            this.setState('ui.currentView', 'music');
            
            return musicDNA;
            
        } catch (error) {
            console.error("❌ Music DNA generation failed:", error);
            this.setState('ui.loading', false);
            this.setState('ui.currentView', 'error');
            this.showToast(`สร้างดนตรีล้มเหลว: ${error.message}`, 'error');
            throw error; // NO FALLBACK - ตามกฎ
        }
    }
    
    validateForEdgeFunction(numerologyData, userData) {
        verifyFunctionApproval('validateForEdgeFunction');
        
        const errors = [];
        const option = userData.option || 'BD';
        
        try {
            // 1. Validate numerology structure ตาม DataContract.js
            window.DataContract.validateNumerologyContext(numerologyData);
        } catch (error) {
            errors.push(`Numerology data invalid: ${error.message}`);
        }
        
        try {
            // 2. Validate user data
            window.DataContract.validateInput(userData, 'app-main');
        } catch (error) {
            errors.push(`User data invalid: ${error.message}`);
        }
        
        // 3. Validate required sources exist (ตาม DataContract)
        const requiredSources = {
            'BD': ['birthDate'],
            'IDC': ['id_card'],
            'FullName': ['fullName'],
            'BD-IDC': ['birthDate', 'id_card'],
            'BD-IDC-FullName': ['birthDate', 'id_card', 'fullName'],
            'Num-Ard': []
        };
        
        const sources = requiredSources[option] || [];
        sources.forEach(source => {
            if (source === 'birthDate' && !numerologyData.sources?.birthDate) {
                errors.push(`Missing birthDate data for option ${option}`);
            }
            if (source === 'id_card' && !numerologyData.sources?.id_card) {
                errors.push(`Missing id_card data for option ${option}`);
            }
            if (source === 'fullName' && !numerologyData.sources?.fullName) {
                errors.push(`Missing fullName data for option ${option}`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    async sendToEdgeFunction(numerologyData, userData) {
        verifyFunctionApproval('sendToEdgeFunction');
        
        console.log("📡 Sending to Music Generator Edge Function via edge-function-integration...");
        
        try {
            // เรียกผ่าน EdgeFunctionIntegration
            const result = await window.EdgeFunctionIntegration.callMusicGenerator(
                numerologyData,
                userData
            );
            
            // Validate response structure
            if (!result || !result.musicDNA) {
                throw new Error('Invalid response from music generator: missing musicDNA');
            }
            
            // บันทึกผลลัพธ์ลง state
            this.setState('edgeFunctions.musicGenerator', {
                data: result,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
            
            this.showToast('สร้างดนตรีสำเร็จ!', 'success');
            
            console.log("✅ Music DNA received");
            return result.musicDNA;
            
        } catch (error) {
            console.error("❌ Music Generator Edge Function call failed:", error);
            this.setState('edgeFunctions.musicGenerator', {
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            });
            throw error; // NO FALLBACK
        }
    }
    
    // ========== 10. DATA PERSISTENCE (พร้อมลบข้อมูลเสีย) ==========
    saveUserData(formData) {
        verifyFunctionApproval('saveUserData');
        
        try {
            // Validate before saving
            window.DataContract.validateInput(formData, 'app-main');
            this.setState('user', formData);
            
            // Save to localStorage
            try {
                localStorage.setItem('psychomatrixUserData', JSON.stringify(formData));
            } catch (error) {
                console.warn("⚠️ Failed to save user data to localStorage:", error);
            }
        } catch (error) {
            throw new Error(`Cannot save invalid user data: ${error.message}`);
        }
    }
    
    loadPersistedData() {
        verifyFunctionApproval('loadUserData');
        
        console.log("📂 Loading persisted data...");
        
        try {
            // ---------- USER DATA ----------
            const userKey = 'psychomatrixUserData';
            const userDataStr = localStorage.getItem(userKey);
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    window.DataContract.validateInput(userData, 'app-main');
                    this.state.user = userData;
                    console.log("✅ Loaded valid user data");
                } catch (error) {
                    // ข้อมูลเสีย -> ลบทิ้ง
                    console.warn(`⚠️ Invalid ${userKey}, removing:`, error.message);
                    localStorage.removeItem(userKey);
                    if (typeof this.showToast === 'function') {
                        this.showToast('ข้อมูลผู้ใช้รูปแบบเก่าถูกลบ กรุณากรอกใหม่', 'warning');
                    }
                }
            }
            
            // ---------- USER CUSTOM DATA (Form 2) ----------
            const userCustomKey = 'psychomatrixUserDataCustom';
            const userCustomStr = localStorage.getItem(userCustomKey);
            if (userCustomStr) {
                try {
                    const userCustom = JSON.parse(userCustomStr);
                    // อาจไม่ต้อง validate ลึก
                    this.state.userCustom = userCustom;
                    console.log("✅ Loaded user custom data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${userCustomKey}, removing:`, error.message);
                    localStorage.removeItem(userCustomKey);
                }
            }
            
            // ---------- NUMEROLOGY DATA ----------
            const numKey = 'psychomatrixNumerologyData';
            const numStr = localStorage.getItem(numKey);
            if (numStr) {
                try {
                    const numData = JSON.parse(numStr);
                    window.DataContract.validateNumerologyContext(numData);
                    this.state.numerology = numData;
                    console.log("✅ Loaded valid numerology data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${numKey}, removing:`, error.message);
                    localStorage.removeItem(numKey);
                }
            }
            
            // ---------- PSYCHOMATRIX DATA ----------
            const psyKey = 'psychomatrixPsychomatrixData';
            const psyStr = localStorage.getItem(psyKey);
            if (psyStr) {
                try {
                    const psyData = JSON.parse(psyStr);
                    this.state.psychomatrix = psyData;
                    console.log("✅ Loaded psychomatrix data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${psyKey}, removing:`, error.message);
                    localStorage.removeItem(psyKey);
                }
            }
            
            // ---------- LUCKY NUMBER DATA ----------
            const luckKey = 'psychomatrixLuckyNumberData';
            const luckStr = localStorage.getItem(luckKey);
            if (luckStr) {
                try {
                    const luckData = JSON.parse(luckStr);
                    window.DataContract.validateLuckyNumberOutput(luckData);
                    this.state.luckyNumber = luckData;
                    console.log("✅ Loaded lucky number data");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${luckKey}, removing:`, error.message);
                    localStorage.removeItem(luckKey);
                }
            }
            
            // ---------- MUSIC CURRENT (pointer) ----------
            const musicCurrKey = 'psychomatrixMusicCurrent';
            const musicCurrStr = localStorage.getItem(musicCurrKey);
            if (musicCurrStr) {
                try {
                    const musicCurr = JSON.parse(musicCurrStr);
                    // ตาม P1 ปัจจุบัน music.current ต้องเป็น string เท่านั้น
                    // ถ้าเป็น object (เวอร์ชันเก่า) ให้แปลง?
                    if (typeof musicCurr === 'string') {
                        this.state.music.current = musicCurr;
                        console.log("✅ Loaded music current pointer:", musicCurr);
                    } else {
                        // ถ้าเป็น object เก่า ให้ลองย้ายไป default หรือ CustomSty?
                        console.warn(`⚠️ ${musicCurrKey} is object, attempting migration`);
                        // อาจจะเก็บไว้ใน default หรือ CustomSty? แต่เราไม่รู้ว่าเป็นอันไหน
                        // ปล่อยให้ migrate จัดการ
                        this.state.music.current = null; // ให้ migrate จัดการ
                    }
                } catch (error) {
                    console.warn(`⚠️ Invalid ${musicCurrKey}, removing:`, error.message);
                    localStorage.removeItem(musicCurrKey);
                }
            }
            
            // ---------- MUSIC DEFAULT ----------
            const musicDefKey = 'psychomatrixMusicDefault';
            const musicDefStr = localStorage.getItem(musicDefKey);
            if (musicDefStr) {
                try {
                    const musicDef = JSON.parse(musicDefStr);
                    if (musicDef && typeof musicDef === 'object' && musicDef.config) {
                        this.state.music.default = musicDef;
                        console.log("✅ Loaded valid music default");
                    } else {
                        throw new Error('Invalid music default structure');
                    }
                } catch (error) {
                    console.warn(`⚠️ Invalid ${musicDefKey}, removing:`, error.message);
                    localStorage.removeItem(musicDefKey);
                }
            }
            
            // ---------- MUSIC CUSTOM STYLE ----------
            const musicCustomKey = 'psychomatrixMusicCustomStyle';
            const musicCustomStr = localStorage.getItem(musicCustomKey);
            if (musicCustomStr) {
                try {
                    const musicCustom = JSON.parse(musicCustomStr);
                    if (musicCustom && typeof musicCustom === 'object' && musicCustom.config) {
                        this.state.music.CustomSty = musicCustom;
                        console.log("✅ Loaded valid music custom style");
                    } else {
                        throw new Error('Invalid music custom style structure');
                    }
                } catch (error) {
                    console.warn(`⚠️ Invalid ${musicCustomKey}, removing:`, error.message);
                    localStorage.removeItem(musicCustomKey);
                }
            }
            
            // ---------- EDGE FUNCTIONS ----------
            const edgeKey = 'psychomatrixEdgeFunctions';
            const edgeStr = localStorage.getItem(edgeKey);
            if (edgeStr) {
                try {
                    const edgeFunctions = JSON.parse(edgeStr);
                    this.state.edgeFunctions = edgeFunctions;
                    console.log("✅ Loaded edge function results");
                } catch (error) {
                    console.warn(`⚠️ Invalid ${edgeKey}, removing:`, error.message);
                    localStorage.removeItem(edgeKey);
                }
            }
            
            // ===== เรียก migrate หลังโหลด state เสร็จ =====
            this.migrateStorageSchema();
            
        } catch (error) {
            console.error("❌ Error loading persisted data:", error);
        }
    }
    
    persistState(path, value) {
        // Only persist certain states
        const persistMap = {
            'user':                'psychomatrixUserData',
            'userCustom':          'psychomatrixUserDataCustom',
            'numerology':          'psychomatrixNumerologyData',
            'psychomatrix':        'psychomatrixPsychomatrixData',
            'luckyNumber':         'psychomatrixLuckyNumberData',
            'music.current':       'psychomatrixMusicCurrent',
            'music.default':       'psychomatrixMusicDefault',
            'music.CustomSty':     'psychomatrixMusicCustomStyle',
            'edgeFunctions':       'psychomatrixEdgeFunctions'
        };
        
        // Check if this path should be persisted
        let storageKey = null;
        
        if (persistMap[path]) {
            storageKey = persistMap[path];
        } else if (path.startsWith('edgeFunctions.')) {
            storageKey = 'psychomatrixEdgeFunctions';
        }
        
        if (storageKey) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(value));
            } catch (error) {
                console.warn(`⚠️ Failed to persist ${path}:`, error);
            }
        }
    }
    
    // ========== 11. UI COORDINATION ==========
    updateUIFromState() {
        verifyFunctionApproval('updateUIFromState');
        
        console.log("🔄 Updating UI from state...");
        
        // ตรวจสอบว่ามี UI module หรือไม่
        if (typeof window.UI !== 'undefined' && typeof window.UI.updateFromState === 'function') {
            window.UI.updateFromState(this.getState());
        }
        
        // ตรวจสอบว่ามี Form Psychomatrix module หรือไม่
        if (typeof window.FormPsychomatrix !== 'undefined' && typeof window.FormPsychomatrix.updateFromState === 'function') {
            window.FormPsychomatrix.updateFromState(this.getState());
        }
        
        // Dispatch event สำหรับ modules อื่นๆ
        this.dispatchEvent('stateUpdated', this.getState());
    }
    
    showForm() {
        verifyFunctionApproval('showForm');
        this.setState('ui.formVisible', true);
        this.setState('ui.currentView', 'form');
    }
    
    hideForm() {
        verifyFunctionApproval('hideForm');
        this.setState('ui.formVisible', false);
    }
    
    showToast(message, type = 'info') {
        verifyFunctionApproval('showToast');
        
        console.log(`📢 Toast (${type}): ${message}`);
        
        // Dispatch toast event
        const event = new CustomEvent('showToast', {
            detail: { message, type }
        });
        window.dispatchEvent(event);
    }
    
    // ========== 12. ENHANCED EVENT HANDLING ==========
    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');
        
        console.log("🔌 Setting up enhanced event listeners...");
        
        // Listen for form submissions (จาก form-ui.js)
        window.addEventListener('formSubmitted', (event) => {
            if (event.detail) {
                this.processFormSubmission(event.detail);
            }
        });
        
        // Listen for form submissions (จาก form-psychomatrix.js)
        window.addEventListener('personalFormSubmitted', (event) => {
            if (event.detail && event.detail.data) {
                this.processFormSubmission(event.detail.data);
            }
        });
        
        // Listen for numerology calculation results (จาก form-psychomatrix.js)
        window.addEventListener('numerologyCalculated', (event) => {
            this.handleNumerologyUpdated(event.detail);
        });
        
        // Listen for psychomatrix data (จาก form-psychomatrix.js)
        window.addEventListener('psychomatrixDataReceived', (event) => {
            this.handlePsychomatrixDataReceived(event.detail);
        });
        
        // Listen for lucky number data (จาก form-psychomatrix.js)
        window.addEventListener('luckyNumberDataReceived', (event) => {
            this.handleLuckyNumberDataReceived(event.detail);
        });
        
        // Listen for music generation requests
        window.addEventListener('generateMusicRequest', () => {
            this.generateMusicDNA();
        });
        
        // Listen for state change requests from UI
        window.addEventListener('updateUIRequest', () => {
            this.updateUIFromState();
        });
        
        // Listen for mode changes
        window.addEventListener('psychomatrixModeChanged', (event) => {
            if (event.detail && event.detail.mode) {
                this.setState('ui.currentMode', event.detail.mode);
            }
        });
        
        // Listen for option changes
        window.addEventListener('calculationOptionChanged', (event) => {
            if (event.detail && event.detail.option) {
                const userData = this.getState('user');
                if (userData) {
                    userData.option = event.detail.option;
                    this.setState('user', userData);
                }
            }
        });
        
        console.log("✅ Enhanced event listeners setup complete");
    }
    
    dispatchEvent(eventName, detail = null) {
        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    }
    
    triggerFormPsychomatrixCalculation(formData) {
        // Dispatch event for Form-Psychomatrix to handle calculation
        const event = new CustomEvent('calculateNumerology', {
            detail: formData
        });
        window.dispatchEvent(event);
    }
    
    // ========== 13. RESET METHODS ==========
    resetState() {
        verifyFunctionApproval('resetState');
        
        this.state = {
            user: null,
            userCustom: null,
            numerology: null,
            psychomatrix: null,
            luckyNumber: null,
            music: {
                current: null,
                default: null,
                CustomSty: null
            },
            edgeFunctions: {
                psychomatrix: null,
                luckyNumber: null,
                musicGenerator: null
            },
            ui: {
                formVisible: false,
                loading: false,
                currentView: 'form',
                currentMode: 'personal-form'
            }
        };
        
        // เคลียร์ listeners (optional)
        this.listeners.clear();
        
        console.log("🔄 State reset complete");
    }
    
    // ========== 13.1 RESET DATA ONLY ==========
    resetStateDataOnly() {
        verifyFunctionApproval('resetStateDataOnly');
        
        // เคลียร์เฉพาะข้อมูลผู้ใช้, numerology, music (คง listeners ไว้)
        this.state.user = null;
        this.state.userCustom = null;
        this.state.numerology = null;
        this.state.psychomatrix = null;
        this.state.luckyNumber = null;
        this.state.music = { default: null, current: null, CustomSty: null };
        this.state.edgeFunctions = {
            psychomatrix: null,
            luckyNumber: null,
            musicGenerator: null
        };
        
        // ลบจาก localStorage
        const keysToRemove = [
            'psychomatrixUserData',
            'psychomatrixUserDataCustom',
            'psychomatrixNumerologyData',
            'psychomatrixPsychomatrixData',
            'psychomatrixLuckyNumberData',
            'psychomatrixMusicDefault',
            'psychomatrixMusicCustomStyle',
            'psychomatrixMusicCurrent',
            'psychomatrixEdgeFunctions'
        ];
        
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn(`⚠️ Failed to remove ${key}:`, e);
            }
        });
        
        console.log("[AppMain] State data cleared, listeners preserved");
    }
    
    resetToDefaultMusic() {
        verifyFunctionApproval('resetToDefaultMusic');
        
        const defaultDNA = this.getState('music.default');
        if (defaultDNA) {
            this.setState('music.current', 'music.default');
            this.showToast('กลับไปใช้เพลงเริ่มต้น', 'success');
            return true;
        } else {
            this.showToast('ไม่มีเพลงเริ่มต้น', 'warning');
            return false;
        }
    }
    
    // ========== 14. NEW METHODS (ตามแผนเฟส 1) ==========
    
    /**
     * คืนค่า active DNA object ตาม pointer music.current
     */
    getActiveMusicDNA() {
        verifyFunctionApproval('getActiveMusicDNA');
        const pointer = this.state.music.current || 'music.default';
        if (pointer === 'music.CustomSty' && this.state.music.CustomSty) {
            return this.state.music.CustomSty;
        }
        return this.state.music.default;
    }
    
    /**
     * ตรวจสอบและอัปเกรด schema version ของ localStorage
     */
    migrateStorageSchema() {
        verifyFunctionApproval('migrateStorageSchema');
        const savedVer = localStorage.getItem('psychomatrixSchemaVersion');
        
        if (!savedVer || savedVer < '1.2') {
            console.log('[AppMain] 🔄 Running migration from <1.2');
            
            // migration จาก v1.0/v1.1 → v1.2:
            // ถ้า music.current ยังไม่มี แต่ userCustom.useCustomDNA = true
            // → ตั้ง pointer ให้ถูกต้อง
            if (!this.state.music.current) {
                const pointer = this.state.userCustom?.useCustomDNA === true
                    ? 'music.CustomSty'
                    : 'music.default';
                this.setState('music.current', pointer);
                console.log(`[AppMain] 🔄 Migrated music.current → "${pointer}"`);
            }
        }
        
        // บันทึก version ปัจจุบัน
        localStorage.setItem(
            'psychomatrixSchemaVersion',
            window.DataContractConstants.SCHEMA_VERSION
        );
        console.log('[AppMain] ✅ Schema migration complete → v1.3');
    }
    
    // ========== 15. HELPER FUNCTIONS ==========
    formatFormDataForState(formData) {
        // แปลง form data จาก UI ให้เป็นรูปแบบที่ DataContract ต้องการ
        const option = formData.option || 'BD';
        
        const formattedData = {
            option: option,
            personalData: {
                fullName: '',
                birthDate: '',
                id_card: ''
            },
            musicPreference: {
                style: formData.musicStyle || 'lofi',
                instruments: formData.instruments || ['piano'],
                effects: [],
                natureEffects: []
            }
        };
        
        // Map ข้อมูลจาก formData เก่าไปใหม่
        if (formData.fullName) {
            formattedData.personalData.fullName = formData.fullName;
        }
        
        if (formData.id_card) {
            formattedData.personalData.id_card = formData.id_card;
        }
        
        if (formData.birthDate) {
            // แปลง ISO date เป็น format ของ Edge Function
            try {
                const edgeFormat = window.DataContract.convertISODateToEdgeFormat(formData.birthDate);
                formattedData.personalData.birthDate = edgeFormat;
            } catch (error) {
                throw new Error(`Birth date conversion failed: ${error.message}`);
            }
        }
        
        return formattedData;
    }
    
    // ========== 16. DEBUG & MONITORING (เฉพาะที่ได้รับอนุมัติ) ==========
    getStatusReport() {
        return {
            timestamp: new Date().toISOString(),
            state: {
                user: !!this.state.user,
                userCustom: !!this.state.userCustom,
                numerology: !!this.state.numerology,
                psychomatrix: !!this.state.psychomatrix,
                luckyNumber: !!this.state.luckyNumber,
                musicCurrent: !!this.state.music?.current,
                musicDefault: !!this.state.music?.default,
                musicCustom: !!this.state.music?.CustomSty
            },
            edgeFunctions: this.state.edgeFunctions,
            ui: this.state.ui,
            localStorage: {
                userData: !!localStorage.getItem('psychomatrixUserData'),
                userCustom: !!localStorage.getItem('psychomatrixUserDataCustom'),
                numerologyData: !!localStorage.getItem('psychomatrixNumerologyData'),
                musicCurrent: !!localStorage.getItem('psychomatrixMusicCurrent'),
                musicDefault: !!localStorage.getItem('psychomatrixMusicDefault'),
                musicCustom: !!localStorage.getItem('psychomatrixMusicCustomStyle')
            }
        };
    }
    
    validateAllData() {
        const errors = [];
        
        try {
            if (this.state.user) {
                window.DataContract.validateInput(this.state.user, 'app-main');
            }
        } catch (error) {
            errors.push(`User data: ${error.message}`);
        }
        
        try {
            if (this.state.numerology) {
                window.DataContract.validateNumerologyContext(this.state.numerology);
            }
        } catch (error) {
            errors.push(`Numerology data: ${error.message}`);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// ========== 17. GLOBAL EXPORT ==========
// Create singleton instance
window.AppMain = new AppMainController();

// Export approved functions
window.AppMainController = {
    // State Management
    initialize: () => window.AppMain.initialize(),
    getState: (path) => window.AppMain.getState(path),
    setState: (path, value) => window.AppMain.setState(path, value),
    resetState: () => window.AppMain.resetState(),
    resetStateDataOnly: () => window.AppMain.resetStateDataOnly(),
    getActiveMusicDNA: () => window.AppMain.getActiveMusicDNA(),   // ✅ เพิ่ม
    subscribe: (path, callback) => window.AppMain.subscribe(path, callback),
    
    // Form Handling
    processFormSubmission: (formData) => window.AppMain.processFormSubmission(formData),
    
    // Music Generation
    generateMusicDNA: () => window.AppMain.generateMusicDNA(),
    
    // Form-Psychomatrix Integration
    handleNumerologyUpdated: (data) => window.AppMain.handleNumerologyUpdated(data),
    handlePsychomatrixDataReceived: (data) => window.AppMain.handlePsychomatrixDataReceived(data),
    handleLuckyNumberDataReceived: (data) => window.AppMain.handleLuckyNumberDataReceived(data),
    
    // UI Coordination
    updateUIFromState: () => window.AppMain.updateUIFromState(),
    showForm: () => window.AppMain.showForm(),
    hideForm: () => window.AppMain.hideForm(),
    showToast: (message, type) => window.AppMain.showToast(message, type),
    
    // Music Reset
    resetToDefaultMusic: () => window.AppMain.resetToDefaultMusic(),
    
    // Helper Functions
    formatFormDataForState: (formData) => window.AppMain.formatFormDataForState(formData),
    getStatusReport: () => window.AppMain.getStatusReport(),
    validateAllData: () => window.AppMain.validateAllData()
};

// ========== 18. AUTO-INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM Content Loaded - Starting AppMain v7.6...");
    
    // Initialize app
    setTimeout(() => {
        try {
            window.AppMainController.initialize();
            console.log("🎉 AppMain v7.6 ready! (State Manager Central with current/default/CustomSty)");
        } catch (error) {
            console.error("❌ AppMain initialization failed:", error);
            
            // Emergency fallback (basic UI only)
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            
            // Show error to user
            const errorContainer = document.getElementById('errorContainer');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="error-message">
                        <h3>⚠️ Application Error</h3>
                        <p>Application failed to start: ${error.message}</p>
                        <button onclick="location.reload()">Reload Page</button>
                    </div>
                `;
                errorContainer.style.display = 'block';
            } else {
                alert("Application failed to start. Please refresh the page.");
            }
        }
    }, 100);
});

// ========== 19. DEBUG VERIFICATION ==========
console.log("✅ APP-MAIN.JS v7.6 LOADED");
console.log("📋 Approved Functions APP-MAIN:", Object.keys(APPROVED_FUNCTIONS_AppMain));
console.log("🔗 DataContract available:", typeof window.DataContract !== 'undefined');
console.log("🔗 EdgeFunctionIntegration available:", typeof window.EdgeFunctionIntegration !== 'undefined');
console.log("🎯 State Manager Central ready");