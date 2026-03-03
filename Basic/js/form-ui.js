// form-ui.js v2.9.4 - [CLEAN] ลบการสร้าง dropdown อัตโนมัติ ให้ HTML จัดการเอง
// หน้าที่: จัดการ UI ของ FORM 1 (ข้อมูลบุคคล), modal, localStorage, และส่ง event ไปยัง modules อื่น
//
// แก้ไขจาก v2.9.3:
//   - ลบฟังก์ชัน _ensureStyleDropdowns() และการเรียกใช้ออก
//   - คงไว้เพียงการ map elements ที่มีอยู่แล้ว (musicStyle, musicStyleCustom)
//   - เพิ่ม warning ถ้าไม่พบ element เพื่อให้ผู้ใช้ตรวจสอบ HTML
//   - ไม่มีการสร้าง DOM เพิ่มเติมใน JavaScript

window.console.log("[FormUI] FORM-UI.JS v2.9.4 - CLEAN VERSION, HTML only...");

// ========== 1. DEPENDENCY CHECK ==========
if (typeof window.DataContract === 'undefined') {
    throw new Error("[FormUI] ❌ CRITICAL: data-contract.js must be loaded before form-ui.js");
}
if (typeof window.AppMainController === 'undefined') {
    console.warn("[FormUI] ⚠️ AppMainController not loaded, UI may have limited functionality");
}

// ========== 2. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_FrmUI = {
    constructor: true,
    initialize: true,
    setupEventListeners: true,
    setupOptionListeners: true,
    setupFormListeners: true,
    setupMusicControlListeners: true,
    handleFormSubmit: true,
    handleOptionChange: true,
    handleInputChange: true,
    collectFormData: true,
    validateFormWithDataContract: true,
    formatDataForEdgeFunction: true,
    updateUIFromState: true,
    updateFieldVisibility: true,
    updateUserInfoDisplay: true,
    handleGenerateMusic: true,
    handleResetToDefault: true,
    saveToLocalStorage: true,
    loadFromLocalStorage: true,
    clearLocalStorage: true,
    showLoading: true,
    hideLoading: true,
    showToast: true,
    showError: true,
    cleanup: true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_FrmUI[functionName]) {
        throw new Error(`[FormUI] 🚫 UNAPPROVED FUNCTION: "${functionName}" - Violates Rule 0`);
    }
    return true;
}

// ========== 3. MAIN CONTROLLER CLASS ==========
class FormUIController {
    constructor() {
        verifyFunctionApproval('constructor');
        this.state = {
            formVisible: false,
            loading: false,
            currentView: 'main',
            formData: null,
            validationErrors: {}
        };
        this.elements = {};

        // ✅ Storage keys ตรงกับ persistMap ใน data-contract.js
        this.localStorageKeys = {
            userData:      'psychomatrixUserData',      // persistMap['user']
            musicCurrent:  'psychomatrixMusicCurrent',  // persistMap['music.current']
            musicDefault:  'psychomatrixMusicDefault',  // persistMap['music.default']
            numerologyData:'psychomatrixNumerologyData' // persistMap['numerology']
        };

        // ชุด keys ทั้งหมดตาม persistMap (ครบ 10 keys) เพื่อใช้ใน clearLocalStorage
        this.allPersistMapKeys = [
            'psychomatrixUserData',
            'psychomatrixUserDataCustom',      // added G3d
            'psychomatrixNumerologyData',
            'psychomatrixPsychomatrixData',
            'psychomatrixLuckyNumberData',
            'psychomatrixMusicDefault',
            'psychomatrixMusicCustomStyle',    // added G3d
            'psychomatrixMusicCurrent',
            'psychomatrixEdgeFunctions',
            'psychomatrixSchemaVersion'        // added G3d
        ];

        this.unsubscribeMusicCurrent = null;
        console.log("[FormUI] ✅ FormUIController v2.9.4 initialized");
    }

    // ========== 4. INITIALIZATION ==========
    initialize() {
        verifyFunctionApproval('initialize');
        console.log("[FormUI] 🚀 Initializing Form UI v2.9.4...");
        try {
            console.log("[FormUI] Step 1: mapElements");
            this.mapElements();
            console.log("[FormUI] Step 2: loadSavedData");
            this.loadSavedData();
            console.log("[FormUI] Step 3: setupEventListeners");
            this.setupEventListeners();
            console.log("[FormUI] Step 4: updateUIFromState");
            this.updateUIFromState();
            console.log("[FormUI] Step 5: setupAppMainIntegration");
            this.setupAppMainIntegration();
            console.log("[FormUI] ✅ Form UI v2.9.4 initialized successfully");
        } catch (error) {
            console.error("[FormUI] ❌ initialization failed at step:", error);
            console.error("[FormUI] ❌ Error details:", error);
            console.error("[FormUI] ❌ Error stack:", error?.stack);
            throw error;
        }
    }

    mapElements() {
        console.log("[FormUI] 📍 Mapping DOM elements v2.9.4...");
        
        this.elements = {
            // Main containers
            formModal: document.getElementById('formModal'),
            musicSettingsModal: document.getElementById('musicSettingsModal'),

            // FORM 1 elements
            form: document.getElementById('musicForm'),
            fullName: document.getElementById('fullName'),
            id_card: document.getElementById('id_card'),
            birthDate: document.getElementById('birthDate'),
            birthTime: document.getElementById('birthTime'),
            
            // dropdown แนวเพลง (ต้องมีใน HTML)
            musicStyle: document.getElementById('musicStyle'),
            musicStyleCustom: document.getElementById('musicStyleCustom'),

            // Option selection
            optionInputs: document.querySelectorAll('input[name="calculationOption"]'),
            optionContainer: document.getElementById('optionSelectionContainer'),

            // Buttons
            openFormBtn: document.getElementById('openFormBtn'),
            closeFormBtn: document.getElementById('closeFormBtn'),
            generateBtn: document.getElementById('generateBtn'),
            resetToDefaultBtn: document.getElementById('resetToDefaultBtn'),
            editMusicSettingsBtn: document.getElementById('editMusicSettingsBtn'),
            closeMusicSettingsBtn: document.getElementById('closeMusicSettingsBtn'),

            // Display areas (form-related only)
            currentUserName: document.getElementById('currentUserName'),
            currentUserBirth: document.getElementById('currentUserBirth'),

            // Storage status
            storageUserData: document.getElementById('storageUserData'),
            storageMusicPref: document.getElementById('storageMusicPref'),

            // Loading & Toast
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingMessage: document.getElementById('loadingMessage'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage'),
            toastIcon: document.getElementById('toastIcon'),

            // Error container
            errorContainer: document.getElementById('formErrorContainer'),
            errorList: document.getElementById('errorList')
        };

        // ตรวจสอบ dropdown ที่จำเป็น (แค่เตือน ไม่สร้างให้)
        if (!this.elements.musicStyle) {
            console.warn("[FormUI] ⚠️ Element #musicStyle not found in HTML. Please add it manually.");
        }
        if (!this.elements.musicStyleCustom) {
            console.warn("[FormUI] ⚠️ Element #musicStyleCustom not found in HTML. Please add it manually.");
        }

        if (!this.elements.errorContainer && this.elements.form) {
            this.createErrorContainer();
        }

        console.log(`[FormUI] ✅ Mapped ${Object.keys(this.elements).length} elements`);
    }

    createErrorContainer() {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'formErrorContainer';
        errorContainer.className = 'mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg hidden';
        errorContainer.innerHTML = `
            <div class="flex items-center text-red-300 mb-2">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span class="font-medium">กรุณาตรวจสอบข้อมูลต่อไปนี้:</span>
            </div>
            <ul id="errorList" class="text-sm text-red-300 space-y-1"></ul>
        `;

        if (this.elements.generateBtn && this.elements.generateBtn.parentNode) {
            this.elements.generateBtn.parentNode.insertBefore(errorContainer, this.elements.generateBtn);
        } else if (this.elements.form) {
            this.elements.form.appendChild(errorContainer);
        } else {
            document.body.appendChild(errorContainer);
        }

        this.elements.errorContainer = errorContainer;
        this.elements.errorList = document.getElementById('errorList');
    }

    // ========== 5. EVENT LISTENERS ==========
    setupEventListeners() {
        verifyFunctionApproval('setupEventListeners');
        console.log("[FormUI] 🔌 Setting up event listeners v2.9.4...");

        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        if (this.elements.openFormBtn) {
            this.elements.openFormBtn.addEventListener('click', () => this.showForm());
        }
        if (this.elements.closeFormBtn) {
            this.elements.closeFormBtn.addEventListener('click', () => this.hideForm());
        }
        if (this.elements.editMusicSettingsBtn) {
            this.elements.editMusicSettingsBtn.addEventListener('click', () => this.showMusicSettings());
        }
        if (this.elements.closeMusicSettingsBtn) {
            this.elements.closeMusicSettingsBtn.addEventListener('click', () => this.hideMusicSettings());
        }

        this.setupMusicControlListeners();
        this.setupOptionListeners();
        this.setupInputValidationListeners();

        window.addEventListener('stateUpdated', (event) => this.updateUIFromState(event.detail));
        window.addEventListener('showToast', (event) => this.showToast(event.detail.message, event.detail.type));

        window.addEventListener('stateChanged', (e) => {
            const { path, value } = e.detail || {};
            if (path === 'music.current' && value) {
                this.hideLoading();
            }
            if (path === 'ui.loading') {
                if (value) {
                    this.showLoading('กำลังประมวลผล...');
                } else {
                    this.hideLoading();
                }
            }
        });

        console.log("[FormUI] ✅ Event listeners setup complete");
    }

    setupOptionListeners() {
        verifyFunctionApproval('setupOptionListeners');
        console.log("[FormUI] 🔧 Setting up option listeners...");
        if (!this.elements.optionInputs || this.elements.optionInputs.length === 0) {
            console.warn("[FormUI] ⚠️ Option inputs not found");
            return;
        }
        this.elements.optionInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleOptionChange(e.target.value);
            });
        });

        const defaultOption = document.querySelector('input[name="calculationOption"]:checked');
        if (defaultOption) {
            this.handleOptionChange(defaultOption.value);
        }
    }

    setupInputValidationListeners() {
        console.log("[FormUI] 🔧 Setting up input validation listeners...");
        const validationInputs = ['fullName', 'id_card', 'birthDate', 'birthTime'];
        validationInputs.forEach(inputId => {
            const input = this.elements[inputId];
            if (input) {
                input.addEventListener('blur', () => {
                    this.validateSingleField(inputId, input.value);
                });
                input.addEventListener('input', () => {
                    this.clearFieldError(inputId);
                });
            }
        });
    }

    setupMusicControlListeners() {
        verifyFunctionApproval('setupMusicControlListeners');
        console.log("[FormUI] 🔧 Setting up music control listeners...");

        if (this.elements.generateBtn) {
            const newGenerateBtn = this.elements.generateBtn.cloneNode(true);
            this.elements.generateBtn.parentNode.replaceChild(newGenerateBtn, this.elements.generateBtn);
            this.elements.generateBtn = newGenerateBtn;
            this.elements.generateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGenerateMusic();
            });
            console.log("[FormUI] ✅ generateBtn listener attached");
        } else {
            console.warn("[FormUI] ⚠️ generateBtn not found");
        }

        if (this.elements.resetToDefaultBtn) {
            const newResetBtn = this.elements.resetToDefaultBtn.cloneNode(true);
            this.elements.resetToDefaultBtn.parentNode.replaceChild(newResetBtn, this.elements.resetToDefaultBtn);
            this.elements.resetToDefaultBtn = newResetBtn;
            this.elements.resetToDefaultBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleResetToDefault();
            });
            console.log("[FormUI] ✅ resetToDefaultBtn listener attached");
        } else {
            console.warn("[FormUI] ⚠️ resetToDefaultBtn not found");
        }
    }

    setupAppMainIntegration() {
        console.log("[FormUI] 🔗 Setting up AppMain integration...");
        if (typeof window.AppMainController !== 'undefined') {
            const initialState = window.AppMainController.getState();
            if (initialState) {
                this.updateUIFromState(initialState);
            }
        }
    }

    // ========== 6. FORM HANDLING ==========
    handleFormSubmit(event) {
        verifyFunctionApproval('handleFormSubmit');
        event.preventDefault();
        console.log("[FormUI] 📝 Handling form submission v2.9.4...");
        try {
            const formData = this.collectFormData();
            const validation = this.validateFormWithDataContract(formData);
            if (!validation.valid) {
                console.log("[FormUI] Validation failed, showing errors");
                this.showErrors(validation.errors);
                return;
            }
            
            if (window.AppMainController) {
                window.AppMainController.setState('user', formData);
                console.log("[FormUI] ✅ User data saved via AppMainController");
            } else {
                console.warn("[FormUI] ⚠️ AppMainController not ready, using direct localStorage");
                this.saveToLocalStorage('userData', formData);
            }
            
            this.updateUserInfoDisplay(formData);
            this.dispatchFormSubmitted(formData);
            this.hideForm();
            this.showToast('บันทึกข้อมูลสำเร็จ!', 'success');
        } catch (error) {
            console.error("[FormUI] ❌ Form submission error:", error);
            this.showError(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    }

    collectFormData() {
        verifyFunctionApproval('collectFormData');
        console.log("[FormUI] 📋 Collecting form data v2.9.4...");
        const optionInput = document.querySelector('input[name="calculationOption"]:checked');
        if (!optionInput) throw new Error('กรุณาเลือกวิธีการคำนวณตัวเลข');
        const option = optionInput.value;

        const fullName  = this.elements.fullName?.value?.trim() || '';
        const birthDate = this.elements.birthDate?.value || '';
        const birthTime = this.elements.birthTime?.value || '12:00';
        const id_card   = this.elements.id_card?.value?.replace(/\D/g, '') || '';

        console.log("[FormUI] fullName:", fullName);
        console.log("[FormUI] birthDate:", birthDate);
        console.log("[FormUI] birthTime:", birthTime);
        console.log("[FormUI] id_card:", id_card);

        // อ่านค่า dropdown ทั้งสอง (ต้องมีใน HTML)
        const defaultStyle = this.elements.musicStyle?.value || 'lofi';
        const customStyle = this.elements.musicStyleCustom?.value || 'relax';
        console.log("[FormUI] selected default style:", defaultStyle);
        console.log("[FormUI] selected custom style:", customStyle);

        const musicPreference = {
            defaultStyle: defaultStyle,
            customStyle: customStyle,
            instruments: ['piano'],
            effects: [],
            natureEffects: []
        };

        return {
            option,
            personalData: { fullName, birthDate, birthTime, id_card },
            musicPreference,
            timestamp: new Date().toISOString()
        };
    }

    validateFormWithDataContract(formData) {
        verifyFunctionApproval('validateFormWithDataContract');
        console.log("[FormUI] 🔍 Validating with DataContract v2.9.4...");
        const errors = [];
        try {
            window.DataContract.validateInput(formData, 'form-ui');
        } catch (error) {
            console.warn("[FormUI] DataContract validation error:", error.message);
            errors.push(error.message);
        }
        const option       = formData.option;
        const personalData = formData.personalData || {};

        if (option.includes('FullName') && !personalData.fullName) {
            errors.push('กรุณากรอกชื่อ-นามสกุล');
        }
        if (option.includes('IDC') && !personalData.id_card) {
            errors.push('กรุณากรอกเลขบัตรประชาชน');
        }
        if (personalData.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(personalData.birthDate)) {
            errors.push('รูปแบบวันเกิดต้องเป็น "YYYY-MM-DD"');
        }
        if (personalData.birthTime && !/^\d{2}:\d{2}$/.test(personalData.birthTime)) {
            errors.push('รูปแบบเวลาต้องเป็น "HH:MM"');
        }
        if (personalData.id_card && personalData.id_card.length !== 13) {
            errors.push('เลขบัตรประชาชนต้องมี 13 หลัก');
        }

        if (!formData.musicPreference?.defaultStyle) {
            errors.push('กรุณาเลือกแนวเพลงสำหรับ Melody1 (Music.Default)');
        }
        if (!formData.musicPreference?.customStyle) {
            errors.push('กรุณาเลือกแนวเพลงสำหรับ Melody2 (Music.CustomSty)');
        }

        console.log("[FormUI] Validation errors:", errors);
        return { valid: errors.length === 0, errors };
    }

    validateSingleField(fieldId, value) {
        const checks = {
            fullName: () => {
                if (!value.trim()) return 'กรุณากรอกชื่อ-สกุล';
                if (value.trim().length < 2) return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
                if (!/^[a-zA-Z\u0E00-\u0E7F\s]+$/.test(value)) return 'ชื่อสามารถประกอบด้วยตัวอักษรไทย/อังกฤษและช่องว่างเท่านั้น';
                return null;
            },
            id_card: () => {
                if (!value) return null;
                const cleaned = value.replace(/\D/g, '');
                if (cleaned.length !== 13) return 'เลขบัตรประชาชนต้องมี 13 หลัก';
                return null;
            },
            birthDate: () => {
                if (!value) return 'กรุณาเลือกวันเกิด';
                const date = new Date(value);
                if (date > new Date()) return 'วันเกิดต้องไม่เป็นวันที่ในอนาคต';
                return null;
            },
            birthTime: () => {
                if (!value) return null;
                if (!/^\d{2}:\d{2}$/.test(value)) return 'รูปแบบเวลาต้องเป็น HH:MM';
                return null;
            }
        };
        const error = checks[fieldId] ? checks[fieldId]() : null;
        if (error) this.showFieldError(fieldId, error);
        else this.clearFieldError(fieldId);
        return error;
    }

    formatDataForEdgeFunction(formData) {
        verifyFunctionApproval('formatDataForEdgeFunction');
        try {
            return {
                psychomatrixInput: window.DataContract.createPsychomatrixInput(formData),
                luckyNumberInput: window.DataContract.createLuckyNumberInput(formData),
                originalData: formData
            };
        } catch (error) {
            throw new Error(`ไม่สามารถแปลงข้อมูล: ${error.message}`);
        }
    }

    // ========== 7. OPTION HANDLING ==========
    handleOptionChange(option) {
        verifyFunctionApproval('handleOptionChange');
        console.log(`[FormUI] 🔄 Option changed to: ${option}`);
        this.state.currentOption = option;
        this.updateFieldVisibility(option);
        this.clearErrors();
        window.dispatchEvent(new CustomEvent('calculationOptionChanged', { detail: { option } }));
    }

    updateFieldVisibility(option) {
        verifyFunctionApproval('updateFieldVisibility');
        const fields = {
            fullName:  option === 'FullName'  || option === 'BD-IDC-FullName',
            id_card:   option === 'IDC'       || option === 'BD-IDC-FullName'
        };
        Object.keys(fields).forEach(fieldId => {
            const input = this.elements[fieldId];
            if (input) {
                const container = input.closest('.option-dependent-field') || input.parentElement;
                if (container) {
                    container.style.display = fields[fieldId] ? 'block' : 'none';
                    input.required = fields[fieldId];
                }
            }
        });
        ['birthDate', 'birthTime'].forEach(fieldId => {
            const input = this.elements[fieldId];
            if (input) {
                const container = input.closest('.option-dependent-field') || input.parentElement;
                if (container) {
                    container.style.display = 'block';
                    input.required = true;
                }
            }
        });
    }

    // ========== 8. UI UPDATES ==========
    updateUIFromState(state = null) {
        verifyFunctionApproval('updateUIFromState');
        console.log("[FormUI] 🔄 Updating UI from state v2.9.4...");
        if (!state && window.AppMainController) state = window.AppMainController.getState();
        if (!state) return;
        if (state.user) this.updateUserInfoDisplay(state.user);
        this.updateStorageStatus();
    }

    updateUserInfoDisplay(userData) {
        verifyFunctionApproval('updateUserInfoDisplay');
        if (!userData?.personalData) return;
        const { fullName, birthDate } = userData.personalData;
        if (this.elements.currentUserName && fullName) {
            this.elements.currentUserName.textContent = fullName || '-';
        }
        if (this.elements.currentUserBirth && birthDate) {
            this.elements.currentUserBirth.textContent = birthDate || '-';
        }
    }

    updateStorageStatus() {
        const userData    = localStorage.getItem(this.localStorageKeys.userData);
        const musicCurrent = localStorage.getItem(this.localStorageKeys.musicCurrent);
        if (this.elements.storageUserData) {
            this.elements.storageUserData.textContent = userData
                ? '✅ มีข้อมูลผู้ใช้'
                : '❌ ไม่มีข้อมูลผู้ใช้';
        }
        if (this.elements.storageMusicPref) {
            this.elements.storageMusicPref.textContent = musicCurrent
                ? '✅ มีตั้งค่าดนตรี'
                : '❌ ไม่มีตั้งค่าดนตรี';
        }
    }

    // ========== 9. MUSIC CONTROL HANDLERS ==========
    async handleGenerateMusic() {
        verifyFunctionApproval('handleGenerateMusic');
        console.log("[FormUI] 🎵 Handle generate music clicked");
        try {
            const state = window.AppMainController?.getState();
            if (!state?.numerology) {
                this.showToast('กรุณาคำนวณตัวเลขศาสตร์ก่อนสร้างเพลง', 'warning');
                return;
            }
            this.showLoading('กำลังสร้างดนตรีจาก DNA...');
            if (typeof window.FormPsychomatrixController?.generateMusicDNA === 'function') {
                await window.FormPsychomatrixController.generateMusicDNA();
                this.showToast('สร้างเพลงสำเร็จ!', 'success');
            } else {
                throw new Error('ไม่สามารถเรียกฟังก์ชันสร้างเพลงได้');
            }
        } catch (error) {
            console.error("[FormUI] ❌ Generate music failed:", error);
            this.showError(`สร้างเพลงล้มเหลว: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    handleResetToDefault() {
        verifyFunctionApproval('handleResetToDefault');
        console.log("[FormUI] 🔄 Handle reset to default clicked");
        if (typeof window.MusicStylesController?.resetToDefaultDNA === 'function') {
            window.MusicStylesController.resetToDefaultDNA();
            this.showToast('กลับไปใช้เพลงเริ่มต้น (DNA ธาตุ)', 'success');
        } else if (typeof window.AppMainController?.resetToDefaultMusic === 'function') {
            const success = window.AppMainController.resetToDefaultMusic();
            if (success) this.showToast('กลับไปใช้เพลงเริ่มต้น', 'success');
            else this.showToast('ไม่มีเพลงเริ่มต้น', 'warning');
        } else {
            this.showToast('ไม่พบฟังก์ชัน resetToDefault', 'warning');
        }
    }

    // ========== 10. STORAGE MANAGEMENT ==========
    saveToLocalStorage(key, data) {
        verifyFunctionApproval('saveToLocalStorage');
        const storageKey = this.localStorageKeys[key];
        if (!storageKey) throw new Error(`[FormUI] Unknown storage key: ${key}`);
        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
            console.log(`[FormUI] 💾 Saved to localStorage: ${storageKey}`);
            this.updateStorageStatus();
        } catch (error) {
            console.error(`[FormUI] ❌ Failed to save to localStorage: ${error.message}`);
            throw error;
        }
    }

    loadFromLocalStorage(key) {
        verifyFunctionApproval('loadFromLocalStorage');
        const storageKey = this.localStorageKeys[key];
        if (!storageKey) return null;
        try {
            const dataStr = localStorage.getItem(storageKey);
            if (!dataStr) return null;
            return JSON.parse(dataStr);
        } catch (error) {
            console.error(`[FormUI] ❌ Failed to load from localStorage: ${error.message}`);
            return null;
        }
    }

    loadSavedData() {
        verifyFunctionApproval('loadSavedData');
        console.log("[FormUI] 📂 Loading saved data from AppMain state first...");
        try {
            let userData = null;
            if (window.AppMainController) {
                userData = window.AppMainController.getState('user');
            }
            
            if (!userData) {
                console.log("[FormUI] No user data in AppMain, trying localStorage...");
                const userDataStr = localStorage.getItem(this.localStorageKeys.userData);
                if (userDataStr) {
                    userData = JSON.parse(userDataStr);
                }
            }

            if (userData) {
                this.populateFormWithData(userData);
                console.log("[FormUI] ✅ User data loaded");
            } else {
                console.log("[FormUI] ℹ️ No saved user data found");
            }

            this.updateStorageStatus();
        } catch (error) {
            console.error("[FormUI] ❌ Error loading saved data:", error);
        }
    }

    populateFormWithData(formData) {
        if (!formData) return;
        if (formData.personalData) {
            const { fullName, birthDate, birthTime, id_card } = formData.personalData;
            if (this.elements.fullName  && fullName)  this.elements.fullName.value  = fullName;
            if (this.elements.birthDate && birthDate) this.elements.birthDate.value = birthDate;
            if (this.elements.birthTime && birthTime) this.elements.birthTime.value = birthTime;
            if (this.elements.id_card   && id_card)   this.elements.id_card.value   = id_card;
        }
        if (formData.musicPreference) {
            if (this.elements.musicStyle && formData.musicPreference.defaultStyle) {
                this.elements.musicStyle.value = formData.musicPreference.defaultStyle;
            }
            if (this.elements.musicStyleCustom && formData.musicPreference.customStyle) {
                this.elements.musicStyleCustom.value = formData.musicPreference.customStyle;
            }
        }
        if (formData.option) {
            const optionInput = document.querySelector(`input[name="calculationOption"][value="${formData.option}"]`);
            if (optionInput) {
                optionInput.checked = true;
                this.handleOptionChange(formData.option);
            }
        }
    }

    clearLocalStorage() {
        verifyFunctionApproval('clearLocalStorage');
        console.log("[FormUI] 🧹 Clearing all localStorage (persistMap keys)...");
        this.allPersistMapKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`[FormUI] 🗑️ Removed: ${key}`);
        });
        this.showToast('ล้างข้อมูลทั้งหมดสำเร็จ', 'success');
        this.updateStorageStatus();
    }

    // ========== 11. UI UTILITIES ==========
    showForm() {
        if (this.elements.formModal) {
            this.elements.formModal.classList.remove('hidden');
            this.elements.formModal.style.display = 'flex';
            this.state.formVisible = true;
        }
    }

    hideForm() {
        if (this.elements.formModal) {
            this.elements.formModal.classList.add('hidden');
            this.elements.formModal.style.display = 'none';
            this.state.formVisible = false;
        }
    }

    async showMusicSettings() {
        if (typeof window.MusicStyles?.openMusicSettingsModal === 'function') {
            await window.MusicStyles.openMusicSettingsModal();
        }
        if (this.elements.musicSettingsModal) {
            this.elements.musicSettingsModal.classList.remove('hidden');
            this.elements.musicSettingsModal.style.display = 'flex';
        }
    }

    hideMusicSettings() {
        if (this.elements.musicSettingsModal) {
            this.elements.musicSettingsModal.classList.add('hidden');
            this.elements.musicSettingsModal.style.display = 'none';
        }
    }

    showLoading(message = 'กำลังประมวลผล...') {
        verifyFunctionApproval('showLoading');
        this.state.loading = true;
        if (this.elements.loadingOverlay && this.elements.loadingMessage) {
            this.elements.loadingMessage.textContent = message;
            this.elements.loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        verifyFunctionApproval('hideLoading');
        this.state.loading = false;
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    showToast(message, type = 'success') {
        verifyFunctionApproval('showToast');
        console.log(`[FormUI] 📢 Toast (${type}): ${message}`);
        if (!this.elements.toast || !this.elements.toastMessage || !this.elements.toastIcon) return;
        this.elements.toastMessage.textContent = message;
        const icons = {
            success: 'fas fa-check-circle',
            error:   'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info:    'fas fa-info-circle'
        };
        this.elements.toastIcon.className = icons[type] || icons.info;
        this.elements.toast.className = `toast ${type === 'error' ? 'error' : ''}`;
        this.elements.toast.classList.remove('hidden');
        setTimeout(() => this.elements.toast.classList.add('hidden'), 3000);
    }

    showFieldError(fieldId, message) {
        const input = this.elements[fieldId];
        if (!input) return;
        input.classList.add('border-red-500');
        input.classList.remove('border-gray-300');
        let errorElement = input.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('field-error')) {
            errorElement = document.createElement('p');
            errorElement.className = 'field-error text-red-500 text-xs mt-1';
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }
        errorElement.textContent = message;
    }

    clearFieldError(fieldId) {
        const input = this.elements[fieldId];
        if (!input) return;
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('field-error')) {
            errorElement.remove();
        }
    }

    showErrors(errors) {
        if (!this.elements.errorContainer || !this.elements.errorList) return;
        if (errors.length === 0) {
            this.elements.errorContainer.classList.add('hidden');
            return;
        }
        this.elements.errorList.innerHTML = '';
        errors.forEach(error => {
            const li = document.createElement('li');
            li.className = 'flex items-center';
            li.innerHTML = `<i class="fas fa-times mr-2 text-xs"></i>${error}`;
            this.elements.errorList.appendChild(li);
        });
        this.elements.errorContainer.classList.remove('hidden');
    }

    clearErrors() {
        if (this.elements.errorContainer) this.elements.errorContainer.classList.add('hidden');
        if (this.elements.errorList) this.elements.errorList.innerHTML = '';
        ['fullName', 'id_card', 'birthDate', 'birthTime'].forEach(fieldId => this.clearFieldError(fieldId));
    }

    showError(message) {
        verifyFunctionApproval('showError');
        this.showErrors([message]);
        this.showToast(message, 'error');
    }

    dispatchFormSubmitted(formData) {
        const event = new CustomEvent('personalFormSubmitted', {
            detail: { data: formData, option: formData.option, timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
        console.log("[FormUI] 📤 Dispatched personalFormSubmitted event");
    }

    handleInputChange(fieldId, value) {
        verifyFunctionApproval('handleInputChange');
        console.log(`[FormUI] 📝 Input changed: ${fieldId} = ${value}`);
        this.state.isDirty = true;
        window.dispatchEvent(new CustomEvent('formInputChanged', { detail: { field: fieldId, value } }));
    }

    cleanup() {
        verifyFunctionApproval('cleanup');
        console.log("[FormUI] 🧹 Cleaning up Form UI v2.9.4...");
        if (this.unsubscribeMusicCurrent) {
            this.unsubscribeMusicCurrent();
            this.unsubscribeMusicCurrent = null;
        }
        this.state    = { formVisible: false, loading: false, currentView: 'main', formData: null, validationErrors: {} };
        this.elements = {};
        console.log("[FormUI] ✅ Form UI cleaned up");
    }

    getStatus() {
        return {
            version: '2.9.4',
            state: this.state,
            localStorage: {
                userData:      !!localStorage.getItem(this.localStorageKeys.userData),
                musicCurrent:  !!localStorage.getItem(this.localStorageKeys.musicCurrent),
                musicDefault:  !!localStorage.getItem(this.localStorageKeys.musicDefault),
                numerologyData:!!localStorage.getItem(this.localStorageKeys.numerologyData)
            },
            elements: Object.keys(this.elements).length
        };
    }
}

// ========== 16. GLOBAL EXPORT ==========
window.FormUI = new FormUIController();

window.FormUIController = {
    initialize:       () => window.FormUI.initialize(),
    cleanup:          () => window.FormUI.cleanup(),
    showForm:         () => window.FormUI.showForm(),
    hideForm:         () => window.FormUI.hideForm(),
    saveFormData:     (formData) => window.FormUI.saveToLocalStorage('userData', formData),
    loadFormData:     () => window.FormUI.loadFromLocalStorage('userData'),
    clearAllData:     () => window.FormUI.clearLocalStorage(),
    updateUIFromState:(state) => window.FormUI.updateUIFromState(state),
    generateMusic:    () => window.FormUI.handleGenerateMusic(),
    resetToDefault:   () => window.FormUI.handleResetToDefault(),
    showLoading:      (message) => window.FormUI.showLoading(message),
    hideLoading:      () => window.FormUI.hideLoading(),
    showToast:        (message, type) => window.FormUI.showToast(message, type),
    getStatus:        () => window.FormUI.getStatus()
};

// ========== 17. AUTO-INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("[FormUI] 📄 DOM Content Loaded - Starting Form UI v2.9.4...");
    setTimeout(() => {
        try {
            if (typeof window.DataContract === 'undefined') {
                console.error("[FormUI] ❌ DataContract not available");
                return;
            }
            window.FormUIController.initialize();
            console.log("[FormUI] 🎉 Form UI v2.9.4 ready!");
        } catch (error) {
            console.error("[FormUI] ❌ initialization failed:", error);
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div class="text-center">
                        <h2 class="text-xl text-white mb-4">⚠️ UI Error</h2>
                        <p class="text-slate-300 mb-4">${error.message}</p>
                        <button onclick="location.reload()" class="px-4 py-2 bg-red-600 rounded-lg">
                            Reload Page
                        </button>
                    </div>
                `;
            }
        }
    }, 300);
});

console.log("[FormUI] ✅ FORM-UI.JS v2.9.4 LOADED");
console.log("[FormUI] 📋 FORM-UI Approved Functions:", Object.keys(APPROVED_FUNCTIONS_FrmUI));
console.log("[FormUI] 🔗 DataContract available:", typeof window.DataContract !== 'undefined');
console.log("[FormUI] 🔗 AppMain available:", typeof window.AppMainController !== 'undefined');
console.log("[FormUI] 🔗 FormPsychomatrix available:", typeof window.FormPsychomatrixController !== 'undefined');