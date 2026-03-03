window.waterPresets = {
    lofi: {
        tempo: 75,
        instruments: ['vibes', 'celesta', 'acousticGuitar'],
        effects: ['reverb', 'delay'],
        natureEffects: [
            { type: 'rain', element: 'water', intensity: 0.6, toneParams: {} }
        ],
        mood: 'calm',
        intensity: 'low'
    },
    chill: {
        tempo: 70,
        instruments: ['flute', 'strings', 'pad'],
        effects: ['reverb', 'chorus'],
        natureEffects: [
            { type: 'water_stream', element: 'water', intensity: 0.5, toneParams: {} }
        ],
        mood: 'flowing',
        intensity: 'low'
    },
    study: {
        tempo: 65,
        instruments: ['piano', 'bell', 'strings'],
        effects: ['reverb', 'eq'],
        natureEffects: [
            { type: 'water_drip', element: 'water', intensity: 0.6, toneParams: {} }
        ],
        mood: 'focused',
        intensity: 'medium'
    },
    relax: {
        tempo: 60,
        instruments: ['harp', 'chimes', 'flute'],
        effects: ['reverb', 'filter'],
        natureEffects: [
            { type: 'water_ocean', element: 'water', intensity: 0.5, toneParams: {} }
        ],
        mood: 'peaceful',
        intensity: 'low'
    }
};