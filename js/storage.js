/**
 * Boxing Day Countdown - Storage & Sharing Utilities
 */

const StorageManager = {
    prefix: 'boxingday_',

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage unavailable:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (e) { }
    },

    // User preferences
    savePreferences(prefs) {
        return this.set('preferences', {
            theme: prefs.theme || 'snow',
            timezone: prefs.timezone || null,
            soundEnabled: prefs.soundEnabled ?? true,
            notificationsEnabled: prefs.notificationsEnabled ?? false,
            lastVisit: Date.now()
        });
    },

    getPreferences() {
        return this.get('preferences', {
            theme: 'snow',
            timezone: null,
            soundEnabled: true,
            notificationsEnabled: false
        });
    },

    // Custom countdowns
    saveCustomCountdown(countdown) {
        const countdowns = this.getCustomCountdowns();
        const id = countdown.id || 'custom_' + Date.now();
        countdowns[id] = {
            ...countdown,
            id,
            createdAt: countdown.createdAt || Date.now()
        };
        this.set('custom_countdowns', countdowns);
        return id;
    },

    getCustomCountdowns() {
        return this.get('custom_countdowns', {});
    },

    deleteCustomCountdown(id) {
        const countdowns = this.getCustomCountdowns();
        delete countdowns[id];
        this.set('custom_countdowns', countdowns);
    }
};

const ShareManager = {
    /**
     * Generate shareable URL for current countdown
     */
    generateShareUrl(options = {}) {
        const url = new URL(window.location.origin + window.location.pathname);

        if (options.year) {
            url.searchParams.set('year', options.year);
        }
        if (options.theme) {
            url.searchParams.set('theme', options.theme);
        }
        if (options.customDate) {
            url.searchParams.set('date', options.customDate);
        }
        if (options.customName) {
            url.searchParams.set('name', encodeURIComponent(options.customName));
        }

        return url.toString();
    },

    /**
     * Parse URL parameters for countdown configuration
     */
    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            year: params.get('year') ? parseInt(params.get('year')) : null,
            theme: params.get('theme'),
            customDate: params.get('date'),
            customName: params.get('name') ? decodeURIComponent(params.get('name')) : null
        };
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (e) {
            console.error('Copy failed:', e);
            return false;
        }
    },

    /**
     * Share via Web Share API (mobile)
     */
    async nativeShare(data) {
        if (!navigator.share) {
            return false;
        }
        try {
            await navigator.share({
                title: data.title || 'Boxing Day Countdown',
                text: data.text || 'Countdown to Boxing Day!',
                url: data.url || window.location.href
            });
            return true;
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Share failed:', e);
            }
            return false;
        }
    },

    /**
     * Generate social share URLs
     */
    getSocialShareUrls(options = {}) {
        const url = encodeURIComponent(options.url || window.location.href);
        const text = encodeURIComponent(options.text || 'Countdown to Boxing Day 2026!');

        return {
            twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
            telegram: `https://t.me/share/url?url=${url}&text=${text}`
        };
    }
};

const NotificationManager = {
    soundEnabled: true,
    audioContext: null,
    notificationEnabled: false,
    volume: 0.5,

    /**
     * Initialize audio context (must be called after user interaction)
     */
    initAudio() {
        if (this.audioContext) return this.audioContext;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            console.log('Audio context initialized');
            return this.audioContext;
        } catch (e) {
            console.warn('Audio context unavailable:', e);
            return null;
        }
    },

    /**
     * Create a note with envelope
     */
    createNote(frequency, startTime, duration, type = 'sine') {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + duration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        return oscillator;
    },

    /**
     * Play a celebration fanfare
     */
    playCelebration() {
        if (!this.soundEnabled) return;
        if (!this.audioContext) this.initAudio();
        if (!this.audioContext) return;

        // Resume if needed
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Fanfare melody - triumphant and celebratory
        const notes = [
            { freq: 523.25, time: 0, dur: 0.15 },     // C5
            { freq: 523.25, time: 0.15, dur: 0.15 },  // C5
            { freq: 523.25, time: 0.3, dur: 0.15 },   // C5
            { freq: 659.25, time: 0.45, dur: 0.3 },   // E5
            { freq: 523.25, time: 0.8, dur: 0.15 },   // C5
            { freq: 659.25, time: 0.95, dur: 0.15 },  // E5
            { freq: 783.99, time: 1.1, dur: 0.6 },    // G5
            { freq: 783.99, time: 1.8, dur: 0.15 },   // G5
            { freq: 698.46, time: 1.95, dur: 0.15 },  // F5
            { freq: 659.25, time: 2.1, dur: 0.15 },   // E5
            { freq: 587.33, time: 2.25, dur: 0.15 },  // D5
            { freq: 1046.50, time: 2.4, dur: 0.8 },   // C6 (final high note)
        ];

        notes.forEach(note => {
            this.createNote(note.freq, now + note.time, note.dur, 'triangle');
        });

        // Add harmony layer
        const harmony = [
            { freq: 392.00, time: 0, dur: 0.6 },      // G4
            { freq: 329.63, time: 0.8, dur: 0.4 },    // E4
            { freq: 523.25, time: 1.1, dur: 0.6 },    // C5
            { freq: 783.99, time: 2.4, dur: 0.8 },    // G5
        ];

        harmony.forEach(note => {
            this.createNote(note.freq, now + note.time, note.dur, 'sine');
        });

        console.log('Playing celebration sound');
    },

    /**
     * Play a gentle chime sound
     */
    playChime() {
        if (!this.soundEnabled) return;
        if (!this.audioContext) this.initAudio();
        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Bell-like chime
        const chimeNotes = [
            { freq: 880, time: 0, dur: 0.5 },      // A5
            { freq: 1108.73, time: 0.1, dur: 0.4 }, // C#6
            { freq: 1318.51, time: 0.2, dur: 0.5 }, // E6
        ];

        chimeNotes.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.time);

            // Bell envelope - sharp attack, long decay
            gain.gain.setValueAtTime(0, now + note.time);
            gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + note.time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

            osc.start(now + note.time);
            osc.stop(now + note.time + note.dur);
        });
    },

    /**
     * Play a tick sound for countdown
     */
    playTick() {
        if (!this.soundEnabled) return;
        if (!this.audioContext) this.initAudio();
        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);

        gain.gain.setValueAtTime(this.volume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    },

    /**
     * Play sound by type
     */
    playSound(type = 'celebration') {
        switch (type) {
            case 'celebration':
                this.playCelebration();
                break;
            case 'chime':
                this.playChime();
                break;
            case 'tick':
                this.playTick();
                break;
            default:
                this.playCelebration();
        }
    },

    /**
     * Test sound - plays a short demo
     */
    testSound() {
        if (!this.audioContext) this.initAudio();
        const wasEnabled = this.soundEnabled;
        this.soundEnabled = true;
        this.playChime();
        this.soundEnabled = wasEnabled;
    },

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            this.notificationEnabled = true;
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.notificationEnabled = permission === 'granted';
            return this.notificationEnabled;
        }

        return false;
    },

    /**
     * Show browser notification
     */
    showNotification(title, options = {}) {
        if (!this.notificationEnabled || Notification.permission !== 'granted') {
            return null;
        }

        return new Notification(title, {
            body: options.body || '',
            icon: options.icon || '/favicon.ico',
            badge: options.badge || '/favicon.ico',
            tag: options.tag || 'boxingday',
            requireInteraction: options.requireInteraction || false,
            ...options
        });
    },

    /**
     * Toggle sound on/off
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        StorageManager.set('sound_enabled', this.soundEnabled);

        // Play a quick feedback sound when enabling
        if (this.soundEnabled) {
            this.playChime();
        }

        return this.soundEnabled;
    },

    /**
     * Set volume (0-1)
     */
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        StorageManager.set('sound_volume', this.volume);
    },

    /**
     * Load sound preference from storage
     */
    loadPreference() {
        this.soundEnabled = StorageManager.get('sound_enabled', true);
        this.volume = StorageManager.get('sound_volume', 0.5);
        return this.soundEnabled;
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, ShareManager, NotificationManager };
}
