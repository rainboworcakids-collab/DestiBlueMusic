window.woodPresets = {
    lofi: {
        tempo: 85,
        instruments: ['acousticGuitar', 'kalimba', 'vibes'],
        effects: ['reverb', 'delay'],
        natureEffects: [
            { type: 'wood_wind', element: 'wood', intensity: 0.3, toneParams: {} },
            { type: 'cricket', element: 'wood', intensity: 1, toneParams: {} }
        ],
        mood: 'natural',
        intensity: 'medium'
    },
    chill: {
        tempo: 75,
        instruments: ['flute', 'strings', 'pad'],
        effects: ['reverb', 'chorus'],
        natureEffects: [
            { type: 'wind_gentle', element: 'wood', intensity: 0.3, toneParams: {} },
            { type: 'frogs', element: 'wood', intensity: 1, toneParams: {} }
        ],
        mood: 'calm',
        intensity: 'low'
    },
    study: {
        tempo: 70,
        instruments: ['piano', 'bell', 'strings'],
        effects: ['reverb', 'eq'],
        natureEffects: [
            { type: 'wood_creak', element: 'wood', intensity: 0.3, toneParams: {} },
            { type: 'cricket', element: 'wood', intensity: 1, toneParams: {} }   // เปลี่ยนจาก cicada → cricket
        ],
        mood: 'focused',
        intensity: 'medium'
    },
    relax: {
        tempo: 65,
        instruments: ['harp', 'chimes', 'flute'],
        effects: ['reverb', 'filter'],
        natureEffects: [
            { type: 'wood_wind', element: 'wood', intensity: 0.3, toneParams: {} },
            { type: 'birds', element: 'wood', intensity: 1, toneParams: {} }
        ],
        mood: 'peaceful',
        intensity: 'low'
    }
};