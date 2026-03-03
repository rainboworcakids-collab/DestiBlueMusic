// NumerologyToMusicConverter.js v1.2
// แก้ไขจาก v1.1:
//   [FIX] getEnergyMapping: รองรับภาษาไทย 'หยิน'/'หยาง' เพิ่มเติมจาก 'Yin'/'Yang'

console.log("[NumerologyToMusicConverter] 🔧 Module version v1.2 - INITIALIZING...");

// ========== 1. APPROVED FUNCTIONS ==========
const APPROVED_FUNCTIONS_Converter = {
    constructor: true,
    convert: true,
    getElementMapping: true,
    getLifePathMapping: true,
    getEnergyMapping: true,
    getKarmaInfluence: true,
    getKarmicEffect: true,
    getLifeLessonEffect: true,
    combinePreferences: true,
    applyKarmaCharacteristics: true,
    loadMappingRules: true
};

function verifyFunctionApproval(functionName) {
    if (!APPROVED_FUNCTIONS_Converter[functionName]) {
        throw new Error(`[NumerologyToMusicConverter] 🚫 UNAPPROVED FUNCTION: "${functionName}" - Violates Rule 0`);
    }
}

class NumerologyToMusicConverter {
    constructor() {
        verifyFunctionApproval('constructor');
        this.rules = this.loadMappingRules();
        console.log("[NumerologyToMusicConverter] ✅ v1.1 initialized");
    }

    /**
     * แปลง numerologyContext เป็น musicPreferences ตาม schema userInput.musicPreference
     * @param {Object} numerologyContext - ข้อมูล numerologyContext (lifePath, destinyNumber, element, energy, etc.)
     * @returns {Object} musicPreferences ตาม data-contract.js (style, tempo, mood, intensity, instruments, effects, natureEffects)
     * @throws {Error} หากข้อมูลไม่เพียงพอ
     */
    convert(numerologyContext) {
        verifyFunctionApproval('convert');
        console.log("[NumerologyToMusicConverter] 🔄 Converting numerology to music preferences");

        try {
            // ตรวจสอบข้อมูลที่จำเป็น
            if (!numerologyContext) {
                throw new Error('numerologyContext is null or undefined');
            }
            const { lifePath, destinyNumber, element, energy } = numerologyContext;
            if (!lifePath) throw new Error('lifePath is required');
            if (!element) throw new Error('element is required');
            if (!energy) throw new Error('energy is required');

            // ปรับ element ให้เป็นตัวพิมพ์เล็ก (Wood → wood)
            const normElement = element.toLowerCase();

            // 1. ใช้ธาตุกำหนดแนวเพลงและ instruments หลัก
            const elementMapping = this.getElementMapping(normElement);

            // 2. ใช้เลขชีวิตกำหนด tempo และ mood
            const lifePathMapping = this.getLifePathMapping(lifePath);

            // 3. ใช้พลังงานกำหนด effects
            const energyMapping = this.getEnergyMapping(energy);

            // 4. ใช้เลขกรรมและบทเรียน (optional)
            const karmaInfluence = this.getKarmaInfluence(
                numerologyContext.karmicNumber,
                numerologyContext.lifeLessonNumber
            );

            // 5. รวมเฉพาะฟิลด์ที่ schema ต้องการ
            const musicPreferences = this.combinePreferences({
                element: elementMapping,
                lifePath: lifePathMapping,
                energy: energyMapping,
                karma: karmaInfluence
            }, normElement); // ส่ง normElement สำหรับ natureEffects

            console.log("[NumerologyToMusicConverter] ✅ Conversion successful");
            return musicPreferences;

        } catch (error) {
            console.error("[NumerologyToMusicConverter] ❌ Conversion failed:", error.message);
            throw error; // ตามกฎข้อ 0 ห้าม fallback
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * ดึง mapping ตามธาตุ (element ต้องเป็นตัวพิมพ์เล็ก: wood, fire, earth, metal, water)
     */
    getElementMapping(element) {
        verifyFunctionApproval('getElementMapping');
        const mapping = {
            'wood': {
                style: 'acoustic',
                primaryInstruments: ['acoustic_guitar', 'flute'],
                secondaryInstruments: ['harp', 'kalimba'],
                natureEffects: [
                    { type: 'wind_through_trees', intensity: 0.7, timing: 'continuous' },
                    { type: 'bird_chirp', intensity: 0.4, timing: 'random' }
                ],
                scale: 'major_pentatonic',
                tonality: 'bright'
            },
            'fire': {
                style: 'energetic',
                primaryInstruments: ['electric_guitar', 'drums'],
                secondaryInstruments: ['trumpet', 'synth_lead'],
                natureEffects: [
                    { type: 'fire_crackle', intensity: 0.8, timing: 'rhythmic' },
                    { type: 'embers', intensity: 0.5, timing: 'continuous' }
                ],
                scale: 'mixolydian',
                tonality: 'fiery'
            },
            'earth': {
                style: 'ambient',
                primaryInstruments: ['piano', 'cello'],
                secondaryInstruments: ['didgeridoo', 'percussion'],
                natureEffects: [
                    { type: 'earth_rumble', intensity: 0.6, timing: 'low_frequency' },
                    { type: 'stone_scrape', intensity: 0.3, timing: 'occasional' }
                ],
                scale: 'dorian',
                tonality: 'earthy'
            },
            'metal': {
                style: 'classical',
                primaryInstruments: ['violin', 'piano'],
                secondaryInstruments: ['harp', 'bell'],
                natureEffects: [
                    { type: 'metal_chime', intensity: 0.6, timing: 'melodic' },
                    { type: 'bell_ring', intensity: 0.4, timing: 'sparse' }
                ],
                scale: 'harmonic_minor',
                tonality: 'resonant'
            },
            'water': {
                style: 'lofi',
                primaryInstruments: ['synth_pad', 'piano'],
                secondaryInstruments: ['vibraphone', 'chimes'],
                natureEffects: [
                    { type: 'water_flowing', intensity: 0.7, timing: 'continuous' },
                    { type: 'rain', intensity: 0.5, timing: 'gentle' }
                ],
                scale: 'aeolian',
                tonality: 'fluid'
            }
        };

        const result = mapping[element];
        if (!result) {
            throw new Error(`[NumerologyToMusicConverter] Unknown element "${element}" - no mapping available`);
        }
        return result;
    }

    /**
     * ดึง mapping ตามเลขชีวิต (lifePath 1-9)
     */
    getLifePathMapping(lifePathNumber) {
        verifyFunctionApproval('getLifePathMapping');
        const baseTempos = {
            1: 132,
            2: 102,
            3: 118,
            4: 84,
            5: 138,
            6: 108,
            7: 78,
            8: 135,
            9: 92
        };

        const moodMappings = {
            1: { mood: 'confident', intensity: 'high' },
            2: { mood: 'cooperative', intensity: 'low' },
            3: { mood: 'creative', intensity: 'medium' },
            4: { mood: 'stable', intensity: 'medium' },
            5: { mood: 'adventurous', intensity: 'high' },
            6: { mood: 'nurturing', intensity: 'medium-low' },
            7: { mood: 'analytical', intensity: 'low' },
            8: { mood: 'powerful', intensity: 'high' },
            9: { mood: 'compassionate', intensity: 'medium' }
        };

        const tempo = baseTempos[lifePathNumber];
        const mood = moodMappings[lifePathNumber];
        if (!tempo || !mood) {
            throw new Error(`[NumerologyToMusicConverter] Invalid lifePathNumber: ${lifePathNumber}`);
        }

        return {
            tempo: tempo,
            mood: mood.mood,
            energyLevel: mood.intensity,
            rhythmComplexity: lifePathNumber % 2 === 0 ? 'simple' : 'complex'
        };
    }

    /**
     * ดึง mapping ตามพลังงาน ('Yin' หรือ 'Yang') — รองรับทั้งภาษาอังกฤษและภาษาไทย
     */
    getEnergyMapping(energy) {
        verifyFunctionApproval('getEnergyMapping');
        const normalized = energy.toLowerCase().trim();
        // ✅ [FIX] รองรับ 'หยิน', 'หยาง' (ภาษาไทย) และ 'yin', 'yang' (ภาษาอังกฤษ)
        const isYin  = normalized === 'yin'  || normalized === 'หยิน';
        const isYang = normalized === 'yang' || normalized === 'หยาง';

        if (isYin) {
            return {
                effects: [
                    { type: 'reverb' },
                    { type: 'delay' },
                    { type: 'chorus' }
                ]
            };
        } else if (isYang) {
            return {
                effects: [
                    { type: 'compressor' },
                    { type: 'distortion' },
                    { type: 'phaser' }
                ]
            };
        } else {
            throw new Error(`[NumerologyToMusicConverter] Invalid energy: ${energy}`);
        }
    }

    /**
     * เพิ่มอิทธิพลจากเลขกรรมและบทเรียนชีวิต (optional)
     */
    getKarmaInfluence(karmicNumber, lifeLessonNumber) {
        verifyFunctionApproval('getKarmaInfluence');
        // ยังไม่ใช้งานใน v1.1 แต่คงไว้เผื่ออนาคต
        return { influences: [], overallEffect: 'none' };
    }

    getKarmicEffect(karmicDigit) {
        verifyFunctionApproval('getKarmicEffect');
        return { texture: 'neutral', dynamics: 'normal', resolution: 'standard' };
    }

    getLifeLessonEffect(lessonNumber) {
        verifyFunctionApproval('getLifeLessonEffect');
        return 'balance';
    }

    combineKarmaEffects(influences) {
        return 'none';
    }

    /**
     * ผสมผสาน preference ทั้งหมดและกรองเฉพาะฟิลด์ตาม schema
     * @param {Object} sources - ข้อมูลจาก mappings
     * @param {string} element - ธาตุ (ตัวพิมพ์เล็ก) ใช้ใน natureEffects
     * @returns {Object} musicPreferences ตาม data-contract.js
     */
    combinePreferences(sources, element) {
        verifyFunctionApproval('combinePreferences');

        // เตรียม instruments list
        const instruments = [
            ...(sources.element.primaryInstruments || []),
            ...(sources.element.secondaryInstruments || []).slice(0, 2)
        ];

        // เตรียม effects (array of strings)
        const effects = sources.energy.effects.map(effect => effect.type);

        // เตรียม natureEffects (array of objects)
        const natureEffects = (sources.element.natureEffects || []).map(ne => ({
            type: ne.type,
            element: element,
            intensity: ne.intensity || 0.5,
            toneParams: {
                timing: ne.timing || 'continuous'
            }
        }));

        // สร้าง object ตาม schema userInput.musicPreference
        const musicPreferences = {
            style: sources.element.style,
            tempo: String(sources.lifePath.tempo),   // ต้องเป็น string
            mood: sources.lifePath.mood,
            intensity: sources.lifePath.energyLevel,
            instruments: instruments,
            effects: effects,
            natureEffects: natureEffects
        };

        return musicPreferences;
    }

    applyKarmaCharacteristics(preferences, karmaInfluences) {
        verifyFunctionApproval('applyKarmaCharacteristics');
        return []; // ไม่ใช้ใน v1.1
    }

    loadMappingRules() {
        verifyFunctionApproval('loadMappingRules');
        return {};
    }
}

// ==================== GLOBAL EXPORT ====================
if (typeof window !== 'undefined') {
    window.NumerologyToMusicConverter = NumerologyToMusicConverter;
    console.log("[NumerologyToMusicConverter] ✅ Exported to window");
}

console.log("[NumerologyToMusicConverter] ✅ v1.1 loaded");