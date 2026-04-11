window.metalPresets = {
    lofi: {
        tempo: 70,
        instruments: ['vibes', 'celesta', 'kalimba'],
        effects: ['reverb', 'delay'],
        natureEffects: [
            { type: 'metal_wind_chimes', element: 'metal', intensity: 0.3, toneParams: {} },
            { type: 'birds', element: 'metal', intensity: 1, toneParams: {} }     // เพิ่ม birds
        ],
        mood: 'calm',
        intensity: 'low'
    },
    chill: {
        tempo: 65,
        instruments: ['chimes', 'vibes', 'strings'],
        effects: ['reverb', 'chorus'],
        natureEffects: [
            { type: 'metal_bell', element: 'metal', intensity: 0.3, toneParams: {} },
            { type: 'cricket', element: 'metal', intensity: 1, toneParams: {} }   // เพิ่ม cricket
        ],
        mood: 'serene',
        intensity: 'low'
    },
    study: {
        tempo: 60,
        instruments: ['bell', 'piano', 'strings'],
        effects: ['reverb', 'eq'],
        natureEffects: [
            { type: 'metal_bell', element: 'metal', intensity: 0.3, toneParams: {} },
            { type: 'cricket', element: 'metal', intensity: 1, toneParams: {} }   // เพิ่ม cricket
        ],
        mood: 'focused',
        intensity: 'medium'
    },
    relax: {
        tempo: 55,
        instruments: ['harp', 'flute', 'chimes'],
        effects: ['reverb', 'filter'],
        natureEffects: [
            { type: 'metal_vibrations', element: 'metal', intensity: 0.3, toneParams: {} },
            { type: 'lamb', element: 'metal', intensity: 1, toneParams: {} }      // เพิ่ม lamb
        ],
        mood: 'peaceful',
        intensity: 'low'
    }
};