/**
 * Boxing Day Countdown - Theme & Particle System
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'snow';
        this.themes = {
            snow: {
                name: 'Winter Snow',
                color: '#4a90d9',
                particleType: 'snow',
                gradient1: 'rgba(30, 58, 138, 0.4)',
                gradient2: 'rgba(136, 19, 55, 0.2)'
            },
            ribbons: {
                name: 'Festive Ribbons',
                color: '#dc2626',
                particleType: 'ribbons',
                gradient1: 'rgba(185, 28, 28, 0.4)',
                gradient2: 'rgba(239, 68, 68, 0.2)'
            },
            lights: {
                name: 'Holiday Lights',
                color: '#10b981',
                particleType: 'lights',
                gradient1: 'rgba(16, 185, 129, 0.3)',
                gradient2: 'rgba(139, 92, 246, 0.3)'
            },
            minimal: {
                name: 'Minimal Dark',
                color: '#6b7280',
                particleType: 'none',
                gradient1: 'rgba(30, 30, 30, 0.5)',
                gradient2: 'rgba(50, 50, 50, 0.3)'
            },
            gold: {
                name: 'Golden Luxury',
                color: '#fbbf24',
                particleType: 'sparkle',
                gradient1: 'rgba(180, 130, 50, 0.3)',
                gradient2: 'rgba(120, 80, 20, 0.2)'
            }
        };
    }

    setTheme(themeName) {
        if (!this.themes[themeName]) return;

        this.currentTheme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);

        // Save preference
        try {
            localStorage.setItem('boxingday_theme', themeName);
        } catch (e) { }

        // Dispatch event for particle system
        window.dispatchEvent(new CustomEvent('themeChange', {
            detail: this.themes[themeName]
        }));

        return this;
    }

    loadSavedTheme() {
        try {
            const saved = localStorage.getItem('boxingday_theme');
            if (saved && this.themes[saved]) {
                this.setTheme(saved);
                return saved;
            }
        } catch (e) { }
        return 'snow';
    }

    getThemeList() {
        return Object.entries(this.themes).map(([id, theme]) => ({
            id,
            ...theme
        }));
    }

    getCurrentTheme() {
        return {
            id: this.currentTheme,
            ...this.themes[this.currentTheme]
        };
    }
}

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleType = 'snow';
        this.isRunning = false;
        this.rafId = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Listen for theme changes
        window.addEventListener('themeChange', (e) => {
            this.setParticleType(e.detail.particleType);
        });
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initParticles();
    }

    setParticleType(type) {
        this.particleType = type;
        this.initParticles();
    }

    initParticles() {
        this.particles = [];

        if (this.particleType === 'none') return;

        // Fewer particles on mobile for performance
        const isMobile = window.innerWidth < 768;
        let count;

        switch (this.particleType) {
            case 'snow':
                count = isMobile ? 50 : 100;
                break;
            case 'ribbons':
                count = isMobile ? 15 : 30;
                break;
            case 'lights':
                count = isMobile ? 30 : 60;
                break;
            case 'sparkle':
                count = isMobile ? 40 : 80;
                break;
            default:
                count = isMobile ? 50 : 100;
        }

        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        const base = {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            opacity: Math.random() * 0.5 + 0.2
        };

        switch (this.particleType) {
            case 'snow':
                return {
                    ...base,
                    y: Math.random() * this.canvas.height - this.canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speed: Math.random() * 0.5 + 0.1,
                    velX: Math.random() * 0.4 - 0.2,
                    color: '#ffffff'
                };

            case 'ribbons':
                return {
                    ...base,
                    width: Math.random() * 20 + 10,
                    height: Math.random() * 60 + 30,
                    speed: Math.random() * 0.8 + 0.2,
                    rotation: Math.random() * 360,
                    rotationSpeed: Math.random() * 2 - 1,
                    color: Math.random() > 0.5 ? '#dc2626' : '#22c55e',
                    curve: Math.random() * 2 - 1
                };

            case 'lights':
                const colors = ['#f87171', '#34d399', '#60a5fa', '#fbbf24', '#a78bfa'];
                return {
                    ...base,
                    size: Math.random() * 4 + 2,
                    pulseSpeed: Math.random() * 0.05 + 0.02,
                    pulsePhase: Math.random() * Math.PI * 2,
                    color: colors[Math.floor(Math.random() * colors.length)]
                };

            case 'sparkle':
                return {
                    ...base,
                    y: Math.random() * this.canvas.height - this.canvas.height,
                    size: Math.random() * 2 + 1,
                    speed: Math.random() * 0.3 + 0.1,
                    twinkle: Math.random(),
                    twinkleSpeed: Math.random() * 0.1 + 0.02,
                    color: '#fcd34d'
                };

            default:
                return base;
        }
    }

    updateParticle(p) {
        switch (this.particleType) {
            case 'snow':
                p.y += p.speed;
                p.x += p.velX;
                if (p.y > this.canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * this.canvas.width;
                }
                break;

            case 'ribbons':
                p.y += p.speed;
                p.x += Math.sin(p.y * 0.01) * p.curve;
                p.rotation += p.rotationSpeed;
                if (p.y > this.canvas.height + 50) {
                    p.y = -100;
                    p.x = Math.random() * this.canvas.width;
                }
                break;

            case 'lights':
                p.pulsePhase += p.pulseSpeed;
                p.currentOpacity = (Math.sin(p.pulsePhase) + 1) / 2 * 0.8 + 0.2;
                break;

            case 'sparkle':
                p.y += p.speed;
                p.twinkle += p.twinkleSpeed;
                p.currentOpacity = (Math.sin(p.twinkle * 10) + 1) / 2;
                if (p.y > this.canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * this.canvas.width;
                }
                break;
        }
    }

    drawParticle(p) {
        this.ctx.save();

        switch (this.particleType) {
            case 'snow':
                this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 'ribbons':
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.opacity * 0.7;
                this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
                break;

            case 'lights':
                const opacity = p.currentOpacity || p.opacity;
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = opacity;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();

                // Glow effect
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 15;
                this.ctx.fill();
                break;

            case 'sparkle':
                const sparkOpacity = p.currentOpacity || p.opacity;
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = sparkOpacity;

                // Draw star shape
                this.drawStar(p.x, p.y, 4, p.size, p.size / 2);
                break;
        }

        this.ctx.restore();
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    animate() {
        if (!this.isRunning || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            this.updateParticle(p);
            this.drawParticle(p);
        });

        this.rafId = requestAnimationFrame(() => this.animate());
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
        return this;
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        return this;
    }

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
        return this.isRunning;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, ParticleSystem };
}
