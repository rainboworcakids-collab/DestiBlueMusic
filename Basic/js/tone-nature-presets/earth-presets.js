window.earthPresets = {
    lofi: {
        tempo: 80,
        instruments: ['acousticGuitar', 'kalimba', 'celesta'],
        effects: ['reverb', 'delay'],
        natureEffects: [
            { type: 'wind', element: 'earth', intensity: 0.3, toneParams: {} },
            { type: 'cricket', element: 'earth', intensity: 1, toneParams: {} }   // เพิ่ม cricket
        ],
        mood: 'grounded',
        intensity: 'medium'
    },
    chill: {
        tempo: 70,
        instruments: ['vibes', 'celesta', 'flute'],
        effects: ['reverb', 'chorus'],
        natureEffects: [
            { type: 'rain', element: 'earth', intensity: 0.3, toneParams: {} },
            { type: 'frogs', element: 'earth', intensity: 1, toneParams: {} }      // เพิ่ม frog
        ],
        mood: 'calm',
        intensity: 'low'
    },
    study: {
        tempo: 65,
        instruments: ['piano', 'strings', 'bell'],
        effects: ['reverb', 'eq'],
        natureEffects: [
            { type: 'stream', element: 'earth', intensity: 0.3, toneParams: {} },
            { type: 'chicken', element: 'earth', intensity: 1, toneParams: {} }   // เพิ่ม chicken
        ],
        mood: 'focused',
        intensity: 'medium'
    },
    relax: {
        tempo: 60,
        instruments: ['flute', 'harp', 'chimes'],
        effects: ['reverb', 'filter'],
        natureEffects: [
            { type: 'stream', element: 'earth', intensity: 0.3, toneParams: {} },
            { type: 'lamb', element: 'earth', intensity: 1, toneParams: {} }      // เพิ่ม lamb
        ],
        mood: 'peaceful',
        intensity: 'low'
    }
};