// 📁 /js/client_edge-function-integration.js (v3.7 - เพิ่ม validation element ใน generateMusicDNA)
// Edge Functions Integration สำหรับ Psychomatrix Music Basic Edition
// 🛡️ ควบคุมการเรียก Edge Functions ทั้ง 3 ตัว ผ่าน Proxy บน Supabase
// กฎ: ห้ามสร้าง Mock Data, ต้อง validate ทุก Input/Output ผ่าน DataContract,
//      ใช้เฉพาะฟังก์ชันที่ได้รับอนุมัติ, ไม่มี Cross-Module Fallback

console.log("[EdgeIntegration] 🔧 client_edge-function-integration v3.7 - INITIALIZING...");

// ========== 1. APPROVED FUNCTIONS (กฎข้อ 0) ==========
const APPROVED_FUNCTIONS_EDGE = {
  constructor: true,
  getBaseURL: true,
  callEdgeFunction: true,
  prepareDataForEdgeFunctions: true,
  convertISODateToEdgeFormat: true,
  parseBirthDateForLuckyNumber: true,
  validateResponse: true,
  mergeEdgeFunctionResults: true,
  calculateNumerology: true,
  generateMusicDNA: true,
  processDefaultMode: true,
  processCustomMode: true,
  healthCheck: true,
  clearCache: true
};

function verifyFunctionApproval(functionName) {
  if (!APPROVED_FUNCTIONS_EDGE[functionName]) {
    throw new Error(`[EdgeIntegration] 🚫 UNAPPROVED FUNCTION: "${functionName}" - Violates Rule 0`);
  }
}

class EdgeFunctionIntegration {
  constructor() {
    verifyFunctionApproval('constructor');
    
    this.baseURL = this.getBaseURL();
    this.psychomatrixURL = `${this.baseURL}/psychomatrix-calculate`;
    this.luckyNumberURL = `${this.baseURL}/lucky-number-calculate`;
    this.musicGeneratorURL = `${this.baseURL}/music-generator-MusicDNA`;
    
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      retryableStatuses: [408, 429, 500, 502, 503, 504]
    };
    
    this.cache = new Map();
    this.timeout = 30000;
    
    console.log("[EdgeIntegration] ✅ v3.7 initialized (Proxy)");
  }

  getBaseURL() {
    verifyFunctionApproval('getBaseURL');
    if (!window.SUPABASE_URL) {
      throw new Error('[EdgeIntegration] SUPABASE_URL is not defined. Make sure supabase-config.js is loaded.');
    }
    return `${window.SUPABASE_URL}/functions/v1/edge-function-integration`;
  }

  async callEdgeFunction(url, data, functionName) {
    verifyFunctionApproval('callEdgeFunction');
    console.log(`[EdgeIntegration] 📡 Calling ${functionName} via proxy`);

    try {
      switch(functionName) {
        case 'psychomatrix-calculate':
          window.DataContract.validatePsychomatrixInput(data);
          break;
        case 'lucky-number-calculate':
          window.DataContract.validateLuckyNumberInput(data);
          break;
        case 'music-generator-MusicDNA':
          window.DataContract.validateMusicGeneratorInput(data);
          break;
        default:
          throw new Error(`[EdgeIntegration] Unknown function name: ${functionName}`);
      }
    } catch (validationError) {
      throw new Error(`[EdgeIntegration] Input validation failed for ${functionName}: ${validationError.message}`);
    }
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': window.SUPABASE_ANON_KEY || ''
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(data),
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (this.retryConfig.retryableStatuses.includes(response.status) && attempt < this.retryConfig.maxRetries) {
            throw new Error(`${functionName} returned ${response.status} (retryable)`);
          }
          const errorText = await response.text();
          throw new Error(`${functionName} returned ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        this.validateResponse(result, functionName);
        
        console.log(`[EdgeIntegration] ✅ ${functionName} successful on attempt ${attempt}`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`[EdgeIntegration] 🚫 ${functionName} attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.retryConfig.maxRetries) break;
        
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(2, attempt - 1),
          this.retryConfig.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`[EdgeIntegration] ${functionName} failed after ${this.retryConfig.maxRetries} attempts: ${lastError?.message}`);
  }
   
  validateResponse(response, functionName) {
    verifyFunctionApproval('validateResponse');
    
    try {
      switch(functionName) {
        case 'psychomatrix-calculate':
          window.DataContract.validatePsychomatrixOutput(response);
          break;
        case 'lucky-number-calculate':
          window.DataContract.validateLuckyNumberOutput(response);
          break;
        case 'music-generator-MusicDNA':
          if (!response || !response.musicDNA) {
            throw new Error('Invalid music generator response: missing musicDNA');
          }
          // ตรวจสอบเฉพาะโครงสร้างพื้นฐาน ส่วน element จะตรวจสอบใน generateMusicDNA
          break;
        default:
          throw new Error(`Unknown function name for validation: ${functionName}`);
      }
    } catch (error) {
      throw new Error(`Response validation failed for ${functionName}: ${error.message}`);
    }
  }

  prepareDataForEdgeFunctions(formData) {
    verifyFunctionApproval('prepareDataForEdgeFunctions');
    
    const { personalData, option } = formData;
    const edgeBirthDate = this.convertISODateToEdgeFormat(personalData.birthDate, personalData.birthTime);
    const birthParts = this.parseBirthDateForLuckyNumber(personalData.birthDate, personalData.birthTime);
    
    return {
      psychomatrixData: {
        birth_date: edgeBirthDate,
        id_card: personalData.id_card || null,
        full_name: personalData.fullName || null,
        option: option
      },
      luckyNumberData: {
        ...birthParts,
        id_card: personalData.id_card || null,
        full_name: personalData.fullName || null,
        option: option,
        prophesy: '1'
      }
    };
  }

  convertISODateToEdgeFormat(isoDate, time) {
    verifyFunctionApproval('convertISODateToEdgeFormat');
    return window.DataContract.convertToPsychomatrixFormat(isoDate, time);
  }

  parseBirthDateForLuckyNumber(isoDate, time) {
    verifyFunctionApproval('parseBirthDateForLuckyNumber');
    return window.DataContract.parseBirthDateForLuckyNumber(isoDate, time);
  }

  mergeEdgeFunctionResults(psychomatrixResult, luckyNumberResult, option) {
    verifyFunctionApproval('mergeEdgeFunctionResults');
    
    const numerologyData = {
      sources: {},
      luckyNumbers: luckyNumberResult.results,
      allResults: psychomatrixResult.results,
      processedAt: new Date().toISOString()
    };
    
    const birthDateResult = psychomatrixResult.results.find(r => r.type === 'birth-date');
    const idCardResult = psychomatrixResult.results.find(r => r.type === 'id-card');
    const fullNameResult = psychomatrixResult.results.find(r => r.type === 'full-name');
    
    const requiredTypes = [];
    if (option.includes('BD')) requiredTypes.push('birth-date');
    if (option.includes('IDC')) requiredTypes.push('id-card');
    if (option.includes('FullName')) requiredTypes.push('full-name');
    
    const missingTypes = requiredTypes.filter(type => {
      if (type === 'birth-date' && !birthDateResult) return true;
      if (type === 'id-card' && !idCardResult) return true;
      if (type === 'full-name' && !fullNameResult) return true;
      return false;
    });
    
    if (missingTypes.length > 0) {
      throw new Error(`Missing required data from psychomatrix-calculate: ${missingTypes.join(', ')}`);
    }
    
    if (birthDateResult) {
      const birthData = birthDateResult.data;
      if (!birthData || !birthData.destiny_number || !birthData.life_path_number || !birthData.thirdAndFourth) {
        throw new Error('Incomplete birth-date data from psychomatrix-calculate');
      }
      numerologyData.sources.birthDate = {
        data: birthData,
        lifepath_data: birthDateResult.lifepath_data || null
      };
      numerologyData.lifePath = birthData.life_path_number;
      numerologyData.destinyNumber = birthData.destiny_number;
      numerologyData.karmicNumber = birthData.thirdAndFourth?.karmic;
      numerologyData.lifeLessonNumber = birthData.thirdAndFourth?.lifeLesson;
    }
    
    if (idCardResult) {
      const idData = idCardResult.data;
      if (!idData || !idData.destiny_number || !idData.life_path_number) {
        throw new Error('Incomplete id-card data from psychomatrix-calculate');
      }
      numerologyData.sources.id_card = {
        data: idData,
        lifepath_data: idCardResult.lifepath_data || null
      };
      if (!numerologyData.lifePath) numerologyData.lifePath = idData.life_path_number;
      if (!numerologyData.destinyNumber) numerologyData.destinyNumber = idData.destiny_number;
    }
    
    if (fullNameResult) {
      const nameData = fullNameResult.data;
      if (!nameData || !nameData.destiny_number || !nameData.life_path_number) {
        throw new Error('Incomplete full-name data from psychomatrix-calculate');
      }
      numerologyData.sources.fullName = {
        data: nameData,
        lifepath_data: fullNameResult.lifepath_data || null
      };
      if (!numerologyData.lifePath) numerologyData.lifePath = nameData.life_path_number;
      if (!numerologyData.destinyNumber) numerologyData.destinyNumber = nameData.destiny_number;
    }
    
    if (numerologyData.lifePath === undefined || numerologyData.lifePath === null) {
      throw new Error('Could not determine lifePath number from available data');
    }
    if (numerologyData.destinyNumber === undefined || numerologyData.destinyNumber === null) {
      throw new Error('Could not determine destinyNumber from available data');
    }
    
    return numerologyData;
  }

  async calculateNumerology(formData) {
    verifyFunctionApproval('calculateNumerology');
    console.log('[EdgeIntegration] 🔮 Starting Numerology calculation');
    
    try {
      const preparedData = this.prepareDataForEdgeFunctions(formData);
      
      const [psychomatrixResult, luckyNumberResult] = await Promise.all([
        this.callEdgeFunction(this.psychomatrixURL, preparedData.psychomatrixData, 'psychomatrix-calculate'),
        this.callEdgeFunction(this.luckyNumberURL, preparedData.luckyNumberData, 'lucky-number-calculate')
      ]);
      
      const numerologyData = this.mergeEdgeFunctionResults(
        psychomatrixResult,
        luckyNumberResult,
        formData.option
      );
      
      console.log('[EdgeIntegration] ✅ Numerology calculation complete');
      return numerologyData;
      
    } catch (error) {
      console.error('[EdgeIntegration] ❌ Numerology calculation failed:', error);
      throw error;
    }
  }

  /**
   * สร้าง MusicDNA โดยใช้ DataContract.createMusicGeneratorInput
   * หากไม่มี sources.birthDate จะสร้างจาก formData.birthDate (ซึ่ง user กรอกจริง)
   * แก้ไข v3.7: เพิ่มการตรวจสอบ element ในผลลัพธ์ว่าตรงกับ musicPreferences.element หรือไม่
   */
  async generateMusicDNA(numerologyData, formData, musicPreferences) {
    verifyFunctionApproval('generateMusicDNA');
    console.log('[EdgeIntegration] 🎵 Generating MusicDNA');

    try {
        if (!numerologyData || !numerologyData.lifePath) {
            throw new Error('Invalid numerologyData: missing lifePath');
        }
        if (!formData || !formData.option) {
            throw new Error('Invalid formData: missing option');
        }
        if (!musicPreferences || !musicPreferences.style) {
            throw new Error('Invalid musicPreferences: missing style');
        }
        // ตรวจสอบว่า musicPreferences มี element หรือไม่ (จำเป็นสำหรับ validation)
        if (!musicPreferences.element) {
            throw new Error('musicPreferences missing element');
        }

        // ✅ ตรวจสอบว่ามี sources.birthDate หรือไม่ ถ้าไม่มี ให้สร้างจาก formData.birthDate
        if (!numerologyData.sources?.birthDate) {
            // ใช้ formData.birthDate ซึ่งมีอยู่ใน edgeFormData โดยตรง (ไม่ซ้อนใน personalData)
            if (!formData.birthDate) {
                throw new Error('birthDate missing from formData — กรุณากรอกวันเกิด');
            }
            console.log("[EdgeIntegration] Creating birthDate source from formData.birthDate (option without BD)");
            
            // ใช้ lifePath และ destinyNumber ที่มีอยู่แล้ว
            const birthDateRaw = {
                birth_date: formData.birthDate, // ISO YYYY-MM-DD
                life_path_number: numerologyData.lifePath,
                destiny_number: numerologyData.destinyNumber
            };
            
            // ต่อท้าย numerologyData.sources
            numerologyData.sources = numerologyData.sources || {};
            numerologyData.sources.birthDate = {
                data: birthDateRaw,
                lifepath_data: null
            };
        }

        // หลังจากนี้ numerologyData.sources.birthDate จะมีค่าเสมอ
        // สร้าง musicNumerologyData ตามโครงสร้างที่ music-generator-MusicDNA ต้องการ
        const musicNumerologyData = {
            birthDate: {
                numberString: this._extractNumberString(numerologyData.sources.birthDate.data),
                rawData: numerologyData.sources.birthDate.data,
                lifePathNumber: numerologyData.sources.birthDate.data.life_path_number,
                destinyNumber: numerologyData.sources.birthDate.data.destiny_number
            },
            lifePath: numerologyData.lifePath,
            destinyNumber: numerologyData.destinyNumber,
            karmicNumber: numerologyData.karmicNumber,
            lifeLessonNumber: numerologyData.lifeLessonNumber
        };

        // เพิ่ม idCard, fullName ถ้ามี
        if (numerologyData.sources?.id_card) {
            musicNumerologyData.idCard = {
                numberString: numerologyData.sources.id_card.data?.id_card || '',
                rawData: numerologyData.sources.id_card.data,
                lifePathNumber: numerologyData.sources.id_card.data?.life_path_number,
                destinyNumber: numerologyData.sources.id_card.data?.destiny_number
            };
        }
        if (numerologyData.sources?.fullName) {
            musicNumerologyData.fullName = {
                numberString: numerologyData.sources.fullName.data?.number_string || '',
                rawData: numerologyData.sources.fullName.data,
                lifePathNumber: numerologyData.sources.fullName.data?.life_path_number,
                destinyNumber: numerologyData.sources.fullName.data?.destiny_number
            };
        }

        // ใช้ DataContract.createMusicGeneratorInput เพื่อสร้าง payload ที่ถูกต้องตาม schema
        const musicGeneratorData = window.DataContract.createMusicGeneratorInput(
            musicNumerologyData,
            formData,
            musicPreferences
        );

        console.log('[EdgeIntegration] 📦 musicGeneratorData prepared');

        if (window.DataContract.validateMusicGeneratorInput) {
            window.DataContract.validateMusicGeneratorInput(musicGeneratorData);
        }

        console.log('[EdgeIntegration] 🎹 Calling music-generator-MusicDNA...');
        const musicResult = await this.callEdgeFunction(
            this.musicGeneratorURL,
            musicGeneratorData,
            'music-generator-MusicDNA'
        );

        // ===== v3.7: ตรวจสอบ element ในผลลัพธ์ =====
        if (!musicResult || !musicResult.musicDNA) {
            throw new Error('Invalid response: missing musicDNA');
        }
        if (!musicResult.musicDNA.config || !musicResult.musicDNA.config.element) {
            throw new Error('musicDNA missing element in config');
        }

        const expectedElement = musicPreferences.element.toLowerCase().trim();
        const actualElement = musicResult.musicDNA.config.element.toLowerCase().trim();

        if (actualElement !== expectedElement) {
            throw new Error(`Element mismatch in musicDNA: expected "${expectedElement}", got "${actualElement}"`);
        }

        console.log('[EdgeIntegration] ✅ MusicDNA generation complete (element validation passed)');
        return musicResult.musicDNA;

    } catch (error) {
        const errorMessage = error?.message || 'Unknown error (no message)';
        console.error('[EdgeIntegration] ❌ MusicDNA generation failed:', errorMessage, error);
        throw new Error(`Music generation failed: ${errorMessage}`);
    }
  }

  _extractNumberString(data) {
    if (!data) return '';
    if (data.birth_date) {
      return data.birth_date.replace(/[^0-9]/g, '');
    }
    if (data.number_string) {
      return data.number_string;
    }
    return '';
  }

  async processDefaultMode(formData, musicPreferences) {
    verifyFunctionApproval('processDefaultMode');
    console.log('[EdgeIntegration] 🚀 Starting Default Mode processing');
    try {
      const numerologyData = await this.calculateNumerology(formData);
      const musicDNA = await this.generateMusicDNA(numerologyData, formData, musicPreferences);
      return { success: true, numerologyData, musicDNA, processedAt: new Date().toISOString() };
    } catch (error) {
      console.error('[EdgeIntegration] ❌ Default Mode processing failed:', error);
      throw error;
    }
  }

  async processCustomMode(formData, userMusicPreferences) {
    verifyFunctionApproval('processCustomMode');
    console.log('[EdgeIntegration] 🎨 Starting Custom Mode processing');
    try {
      const numerologyData = await this.calculateNumerology(formData);
      const musicPreferences = {
        ...userMusicPreferences,
        numerologyContext: {
          lifePath: numerologyData.lifePath,
          element: numerologyData.sources.birthDate?.lifepath_data?.ธาตุ,
          energy: numerologyData.sources.birthDate?.lifepath_data?.พลังงาน
        }
      };
      const musicDNA = await this.generateMusicDNA(numerologyData, formData, musicPreferences);
      return { success: true, numerologyData, musicDNA, processedAt: new Date().toISOString() };
    } catch (error) {
      console.error('[EdgeIntegration] ❌ Custom Mode processing failed:', error);
      throw error;
    }
  }

  clearCache() {
    verifyFunctionApproval('clearCache');
    this.cache.clear();
    console.log('[EdgeIntegration] 🗑️ Cache cleared');
  }

  async healthCheck() {
    verifyFunctionApproval('healthCheck');
    console.log('[EdgeIntegration] 🏥 Health check requested (disabled)');
    return {
      timestamp: new Date().toISOString(),
      message: 'Health check is disabled to prevent test data creation',
      status: 'disabled',
      baseURL: this.baseURL
    };
  }
}

// ===== Singleton =====
let edgeFunctionIntegrationInstance = null;

function createEdgeFunctionIntegration() {
  if (!edgeFunctionIntegrationInstance) {
    edgeFunctionIntegrationInstance = new EdgeFunctionIntegration();
  }
  return edgeFunctionIntegrationInstance;
}

if (typeof window !== 'undefined') {
  window.EdgeFunctionIntegration = createEdgeFunctionIntegration();
  console.log('[EdgeIntegration] ✅ client_edge-function-integration v3.7 loaded');
}