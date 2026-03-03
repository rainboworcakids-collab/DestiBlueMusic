window.earthPresets = {
    lofi: {
        tempo: 80,
        instruments: ['acousticGuitar', 'kalimba', 'celesta'],
        effects: ['reverb', 'delay'],
        natureEffects: [
            { type: 'wind', element: 'earth', intensity: 0.7, toneParams: {} }
        ],
        mood: 'grounded',
        intensity: 'medium'
    },
    chill: {
        tempo: 70,
        instruments: ['vibes', 'celesta', 'flute'],
        effects: ['reverb', 'chorus'],
        natureEffects: [
            { type: 'rain', element: 'earth', intensity: 0.5, toneParams: {} }
        ],
        mood: 'calm',
        intensity: 'low'
    },
    study: {
        tempo: 65,
        instruments: ['piano', 'strings', 'bell'],
        effects: ['reverb', 'eq'],
        natureEffects: [
            { type: 'stream', element: 'earth', intensity: 0.4, toneParams: {} }
        ],
        mood: 'focused',
        intensity: 'medium'
    },
    relax: {
        tempo: 60,
        instruments: ['flute', 'harp', 'chimes'],
        effects: ['reverb', 'filter'],
        natureEffects: [
            { type: 'birds', element: 'earth', intensity: 0.3, toneParams: {} }
        ],
        mood: 'peaceful',
        intensity: 'low'
    }
};