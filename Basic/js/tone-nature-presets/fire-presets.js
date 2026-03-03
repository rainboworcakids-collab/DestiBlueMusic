// fire-presets.js
window.firePresets = {
    lofi: {
        tempo: 90,
        instruments: ['electricPiano', 'vibes', 'celesta'],
        effects: ['reverb', 'delay'],
        natureEffects: [
            { type: 'fire_crackle', element: 'fire', intensity: 0.7, toneParams: {} }
        ],
        mood: 'energetic',
        intensity: 'high'
    },
    chill: {
        tempo: 80,
        instruments: ['synth', 'pad', 'strings'],
        effects: ['reverb', 'chorus'],
        natureEffects: [
            { type: 'fire_embers', element: 'fire', intensity: 0.5, toneParams: {} }
        ],
        mood: 'warm',
        intensity: 'medium'
    },
    study: {
        tempo: 75,
        instruments: ['piano', 'bell', 'chimes'],
        effects: ['reverb', 'eq'],
        natureEffects: [
            { type: 'fire_crackle', element: 'fire', intensity: 0.4, toneParams: {} }
        ],
        mood: 'alert',
        intensity: 'medium'
    },
    relax: {
        tempo: 65,
        instruments: ['flute', 'harp', 'celesta'],
        effects: ['reverb', 'filter'],
        natureEffects: [
            { type: 'fire_embers_low', element: 'fire', intensity: 0.3, toneParams: {} }
        ],
        mood: 'calm',
        intensity: 'low'
    }
};