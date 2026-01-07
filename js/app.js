/**
 * Boxing Day Countdown Hub - Main Application
 */

class BoxingDayApp {
    constructor() {
        this.countdown = null;
        this.themeManager = null;
        this.particleSystem = null;
        this.isFullscreen = false;
        this.controlsTimeout = null;
        this.currentYear = null;

        // DOM Elements cache
        this.elements = {};
    }

    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.initCountdown();
        this.initThemes();
        this.initParticles();
        this.initEventListeners();
        this.loadFromUrl();
        this.loadPreferences();
        this.initFullscreenControls();
        this.updateDocumentTitle();

        console.log('Boxing Day Countdown Hub initialized');
    }

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            // Countdown units
            months: document.getElementById('months'),
            weeks: document.getElementById('weeks'),
            days: document.getElementById('days'),
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds'),

            // Progress
            progressBar: document.getElementById('progress-fill'),
            progressPercent: document.getElementById('progress-percent'),

            // Header
            yearDisplay: document.getElementById('year-display'),
            timezoneDisplay: document.getElementById('timezone-display'),

            // Controls
            controls: document.getElementById('controls'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            soundBtn: document.getElementById('sound-btn'),
            testSoundBtn: document.getElementById('test-sound-btn'),
            shareBtn: document.getElementById('share-btn'),
            customBtn: document.getElementById('custom-btn'),

            // Theme
            themeToggle: document.getElementById('theme-toggle'),
            themeMenu: document.getElementById('theme-menu'),
            themeName: document.getElementById('current-theme-name'),

            // Modal
            modal: document.getElementById('custom-modal'),
            modalClose: document.getElementById('modal-close'),
            customForm: document.getElementById('custom-form'),

            // Toast
            toastContainer: document.getElementById('toast-container')
        };
    }

    /**
     * Initialize countdown engine
     */
    initCountdown() {
        this.countdown = new CountdownEngine({
            onUpdate: (remaining) => this.onCountdownUpdate(remaining),
            onComplete: () => this.onCountdownComplete()
        });

        this.countdown.setBoxingDay().start();
        this.currentYear = this.countdown.targetYear;
    }

    /**
     * Handle countdown updates
     */
    onCountdownUpdate(remaining) {
        // Update all units with animation
        this.updateUnit('months', remaining.months);
        this.updateUnit('weeks', remaining.weeks);
        this.updateUnit('days', remaining.days);
        this.updateUnit('hours', remaining.hours);
        this.updateUnit('minutes', remaining.minutes);
        this.updateUnit('seconds', remaining.seconds);

        // Update progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${remaining.progress}%`;
        }
        if (this.elements.progressPercent) {
            this.elements.progressPercent.textContent = `${remaining.progress}%`;
        }
    }

    /**
     * Update a single countdown unit with flip animation
     */
    updateUnit(id, value) {
        const element = this.elements[id];
        if (!element) return;

        const formatted = CountdownEngine.formatUnit(value);
        const current = element.textContent;

        if (current !== formatted) {
            element.classList.remove('flip');
            void element.offsetWidth; // Trigger reflow
            element.classList.add('flip');
            element.textContent = formatted;
        }
    }

    /**
     * Handle countdown completion
     */
    onCountdownComplete() {
        NotificationManager.playSound('celebration');

        NotificationManager.showNotification("🎉 It's Boxing Day!", {
            body: "Time for the biggest shopping event of the year!",
            requireInteraction: true
        });

        this.showToast("🎉 It's Boxing Day! Happy Shopping!");

        // Update UI for celebration mode
        document.body.classList.add('celebration-mode');
    }

    /**
     * Initialize theme manager
     */
    initThemes() {
        this.themeManager = new ThemeManager();
        this.themeManager.loadSavedTheme();
        this.populateThemeMenu();
        this.updateThemeDisplay();
    }

    /**
     * Populate theme menu options
     */
    populateThemeMenu() {
        if (!this.elements.themeMenu) return;

        const themes = this.themeManager.getThemeList();
        this.elements.themeMenu.innerHTML = themes.map(theme => `
            <button class="theme-option ${theme.id === this.themeManager.currentTheme ? 'active' : ''}" 
                    data-theme="${theme.id}">
                <span class="theme-option__color" style="background: ${theme.color}"></span>
                ${theme.name}
            </button>
        `).join('');
    }

    /**
     * Update theme display in UI
     */
    updateThemeDisplay() {
        if (this.elements.themeName) {
            const current = this.themeManager.getCurrentTheme();
            this.elements.themeName.textContent = current.name;
        }

        // Update active state in menu
        const options = document.querySelectorAll('.theme-option');
        options.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === this.themeManager.currentTheme);
        });
    }

    /**
     * Initialize particle system
     */
    initParticles() {
        this.particleSystem = new ParticleSystem('particle-canvas');
        this.particleSystem.start();
    }

    /**
     * Initialize all event listeners
     */
    initEventListeners() {
        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.themeMenu?.classList.toggle('open');
        });

        // Theme selection
        this.elements.themeMenu?.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-option');
            if (option) {
                this.themeManager.setTheme(option.dataset.theme);
                this.updateThemeDisplay();
                this.elements.themeMenu.classList.remove('open');
            }
        });

        // Close theme menu on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.theme-selector')) {
                this.elements.themeMenu?.classList.remove('open');
            }
        });

        // Control buttons
        this.elements.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
        this.elements.soundBtn?.addEventListener('click', () => this.toggleSound());
        this.elements.testSoundBtn?.addEventListener('click', () => this.testSound());
        this.elements.shareBtn?.addEventListener('click', () => this.share());
        this.elements.customBtn?.addEventListener('click', () => this.openCustomModal());

        // Modal
        this.elements.modalClose?.addEventListener('click', () => this.closeModal());
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });

        // Custom form
        this.elements.customForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCustomCountdown();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Year selector
        this.elements.yearDisplay?.addEventListener('click', () => this.showYearSelector());

        // Touch gestures for mobile
        this.initTouchGestures();

        // Init audio on first interaction
        document.addEventListener('click', () => {
            NotificationManager.initAudio();
        }, { once: true });

        // Visibility change - pause/resume particles
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.particleSystem?.stop();
            } else {
                this.particleSystem?.start();
            }
        });
    }

    /**
     * Initialize touch gestures for mobile
     */
    initTouchGestures() {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }

    /**
     * Handle swipe gestures
     */
    handleSwipe(startX, endX) {
        const threshold = 100;
        const diff = startX - endX;

        if (Math.abs(diff) < threshold) return;

        if (diff > 0) {
            // Swipe left - next theme
            this.cycleTheme(1);
        } else {
            // Swipe right - previous theme
            this.cycleTheme(-1);
        }
    }

    /**
     * Cycle through themes
     */
    cycleTheme(direction) {
        const themes = this.themeManager.getThemeList();
        const currentIndex = themes.findIndex(t => t.id === this.themeManager.currentTheme);
        let newIndex = (currentIndex + direction + themes.length) % themes.length;

        this.themeManager.setTheme(themes[newIndex].id);
        this.updateThemeDisplay();
        this.showToast(`Theme: ${themes[newIndex].name}`);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        switch (e.key.toLowerCase()) {
            case 'f':
                if (!e.ctrlKey && !e.metaKey) {
                    this.toggleFullscreen();
                }
                break;
            case 'm':
                this.toggleSound();
                break;
            case 'escape':
                if (this.isFullscreen) {
                    this.exitFullscreen();
                }
                this.closeModal();
                break;
            case 'arrowleft':
                this.cycleTheme(-1);
                break;
            case 'arrowright':
                this.cycleTheme(1);
                break;
        }
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    /**
     * Enter fullscreen mode
     */
    enterFullscreen() {
        const elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }

        this.isFullscreen = true;
        document.body.classList.add('fullscreen-mode');
        this.elements.fullscreenBtn?.classList.add('control-btn--active');
        this.startControlsAutoHide();
    }

    /**
     * Exit fullscreen mode
     */
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        this.isFullscreen = false;
        document.body.classList.remove('fullscreen-mode');
        this.elements.fullscreenBtn?.classList.remove('control-btn--active');
        this.stopControlsAutoHide();
    }

    /**
     * Initialize fullscreen controls auto-hide
     */
    initFullscreenControls() {
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                this.isFullscreen = false;
                document.body.classList.remove('fullscreen-mode');
                this.elements.fullscreenBtn?.classList.remove('control-btn--active');
                this.stopControlsAutoHide();
            }
        });
    }

    /**
     * Start auto-hiding controls in fullscreen
     */
    startControlsAutoHide() {
        const showControls = () => {
            this.elements.controls?.classList.remove('hidden');
            clearTimeout(this.controlsTimeout);
            this.controlsTimeout = setTimeout(() => {
                this.elements.controls?.classList.add('hidden');
            }, 3000);
        };

        document.addEventListener('mousemove', showControls);
        document.addEventListener('touchstart', showControls);
        showControls();
    }

    /**
     * Stop auto-hiding controls
     */
    stopControlsAutoHide() {
        clearTimeout(this.controlsTimeout);
        this.elements.controls?.classList.remove('hidden');
    }

    /**
     * Toggle sound
     */
    toggleSound() {
        const enabled = NotificationManager.toggleSound();
        this.elements.soundBtn?.classList.toggle('control-btn--active', enabled);
        this.showToast(enabled ? '🔊 Sound enabled' : '🔇 Sound muted');
    }

    /**
     * Test sound - plays celebration sound
     */
    testSound() {
        NotificationManager.initAudio();
        NotificationManager.playCelebration();
        this.showToast('🎵 Playing celebration sound...');
    }

    /**
     * Share countdown
     */
    async share() {
        const url = ShareManager.generateShareUrl({
            year: this.currentYear,
            theme: this.themeManager.currentTheme
        });

        const shareData = {
            title: `Boxing Day Countdown ${this.currentYear}`,
            text: `Only ${this.countdown.calculateTimeRemaining().totalDays} days until Boxing Day ${this.currentYear}!`,
            url: url
        };

        // Try native share first (mobile)
        const shared = await ShareManager.nativeShare(shareData);

        if (!shared) {
            // Fallback to clipboard
            const copied = await ShareManager.copyToClipboard(url);
            if (copied) {
                this.showToast('📋 Link copied to clipboard!');
            }
        }
    }

    /**
     * Open custom countdown modal
     */
    openCustomModal() {
        this.elements.modal?.classList.add('open');
        document.getElementById('custom-name')?.focus();
    }

    /**
     * Close modal
     */
    closeModal() {
        this.elements.modal?.classList.remove('open');
    }

    /**
     * Create custom countdown
     */
    createCustomCountdown() {
        const name = document.getElementById('custom-name')?.value?.trim();
        const date = document.getElementById('custom-date')?.value;

        if (!name || !date) {
            this.showToast('⚠️ Please fill in all fields');
            return;
        }

        // Save custom countdown
        const id = StorageManager.saveCustomCountdown({ name, date });

        // Update countdown
        this.countdown.stop();
        this.countdown.setCustomDate(date, name);
        this.countdown.start();

        // Update UI
        if (this.elements.yearDisplay) {
            this.elements.yearDisplay.textContent = name;
        }
        document.title = `${name} Countdown`;

        // Generate shareable URL
        const url = ShareManager.generateShareUrl({
            customDate: date,
            customName: name,
            theme: this.themeManager.currentTheme
        });

        this.closeModal();
        this.showToast(`✅ Custom countdown created!`);

        // Show share prompt
        setTimeout(() => {
            if (confirm('Share your custom countdown?')) {
                ShareManager.copyToClipboard(url);
                this.showToast('📋 Link copied!');
            }
        }, 500);
    }

    /**
     * Show year selector
     */
    showYearSelector() {
        const years = this.countdown.getAllBoxingDays();
        const currentIndex = years.findIndex(y => y.year === this.currentYear);
        const nextYear = years[(currentIndex + 1) % years.length];

        this.currentYear = nextYear.year;
        this.countdown.stop();
        this.countdown.setBoxingDay(this.currentYear);
        this.countdown.start();

        this.updateDocumentTitle();
        this.showToast(`📅 Countdown to Boxing Day ${this.currentYear}`);
    }

    /**
     * Update document title
     */
    updateDocumentTitle() {
        document.title = `Boxing Day Countdown ${this.currentYear} | Ultimate Holiday Timer`;

        if (this.elements.yearDisplay) {
            this.elements.yearDisplay.textContent = `December 26, ${this.currentYear}`;
        }
    }

    /**
     * Load configuration from URL parameters
     */
    loadFromUrl() {
        const params = ShareManager.parseUrlParams();

        if (params.year) {
            this.currentYear = params.year;
            this.countdown.stop();
            this.countdown.setBoxingDay(params.year);
            this.countdown.start();
        }

        if (params.theme && this.themeManager.themes[params.theme]) {
            this.themeManager.setTheme(params.theme);
            this.updateThemeDisplay();
        }

        if (params.customDate) {
            this.countdown.stop();
            this.countdown.setCustomDate(params.customDate, params.customName || 'Custom Event');
            this.countdown.start();

            if (this.elements.yearDisplay && params.customName) {
                this.elements.yearDisplay.textContent = params.customName;
            }
        }
    }

    /**
     * Load user preferences from storage
     */
    loadPreferences() {
        const prefs = StorageManager.getPreferences();

        NotificationManager.soundEnabled = prefs.soundEnabled;
        this.elements.soundBtn?.classList.toggle('control-btn--active', prefs.soundEnabled);

        // Update timezone display
        if (this.elements.timezoneDisplay) {
            const tz = TimezoneUtils.detectTimezone();
            const offset = TimezoneUtils.getOffsetString(tz);
            this.elements.timezoneDisplay.textContent = offset;
        }
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        if (!this.elements.toastContainer) {
            // Create toast container if not exists
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
            this.elements.toastContainer = container;
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.boxingDayApp = new BoxingDayApp();
    window.boxingDayApp.init();
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}
