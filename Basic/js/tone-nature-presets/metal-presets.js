// metal-presets.js
window.metalPresets = {
    lofi: {
        tempo: 70,
        instruments: ['vibes', 'celesta', 'kalimba'],
        effects: ['reverb', 'delay'],
        natureEffects: [
            { type: 'metal_wind_chimes', element: 'metal', intensity: 0.6, toneParams: {} }
        ],
        mood: 'calm',
        intensity: 'low'
    },
    chill: {
        tempo: 65,
        instruments: ['chimes', 'vibes', 'strings'],
        effects: ['reverb', 'chorus'],
        natureEffects: [
            { type: 'metal_bell', element: 'metal', intensity: 0.5, toneParams: {} }
        ],
        mood: 'serene',
        intensity: 'low'
    },
    study: {
        tempo: 60,
        instruments: ['bell', 'piano', 'strings'],
        effects: ['reverb', 'eq'],
        natureEffects: [
            { type: 'metal_bell', element: 'metal', intensity: 0.4, toneParams: {} }
        ],
        mood: 'focused',
        intensity: 'medium'
    },
    relax: {
        tempo: 55,
        instruments: ['harp', 'flute', 'chimes'],
        effects: ['reverb', 'filter'],
        natureEffects: [
            { type: 'metal_vibrations', element: 'metal', intensity: 0.3, toneParams: {} }
        ],
        mood: 'peaceful',
        intensity: 'low'
    }
};