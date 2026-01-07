/**
 * Boxing Day Countdown - High-Precision Countdown Engine
 * Uses performance.now() for accuracy with setInterval fallback
 */

class CountdownEngine {
    constructor(options = {}) {
        this.targetDate = null;
        this.timezone = options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        this.onUpdate = options.onUpdate || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.intervalId = null;
        this.lastUpdateTime = 0;
        this.updateFrequency = options.updateFrequency || 1000;
        this.yearRange = { start: 2024, end: 2035 };
        
        // High precision timing support
        this.useHighPrecision = typeof performance !== 'undefined' && typeof performance.now === 'function';
    }

    /**
     * Get current timestamp using highest available precision
     */
    getHighPrecisionTime() {
        if (this.useHighPrecision) {
            return performance.timeOrigin + performance.now();
        }
        return Date.now();
    }

    /**
     * Set target to Boxing Day (December 26) for a specific year
     */
    setBoxingDay(year = null) {
        const now = new Date();
        let targetYear = year || now.getFullYear();
        
        // Create target date at midnight local time
        let target = new Date(targetYear, 11, 26, 0, 0, 0, 0);
        
        // If Boxing Day has passed this year, target next year
        if (!year && now > target) {
            targetYear++;
            target = new Date(targetYear, 11, 26, 0, 0, 0, 0);
        }
        
        this.targetDate = target;
        this.targetYear = targetYear;
        return this;
    }

    /**
     * Set custom target date
     */
    setCustomDate(dateString, name = 'Custom Event') {
        this.targetDate = new Date(dateString);
        this.eventName = name;
        return this;
    }

    /**
     * Calculate time remaining in multiple units
     */
    calculateTimeRemaining() {
        if (!this.targetDate) {
            this.setBoxingDay();
        }

        const now = this.getHighPrecisionTime();
        const target = this.targetDate.getTime();
        const diff = target - now;

        if (diff <= 0) {
            return {
                total: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
                isComplete: true,
                progress: 100
            };
        }

        // Calculate all units
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        const days = totalDays % 7;
        const weeks = Math.floor(totalDays / 7) % 4;
        const months = Math.floor(totalDays / 30);
        const milliseconds = diff % 1000;

        // Calculate progress (from Jan 1 to Dec 26)
        const yearStart = new Date(this.targetYear || new Date().getFullYear(), 0, 1);
        const totalYearDuration = target - yearStart.getTime();
        const elapsed = now - yearStart.getTime();
        const progress = Math.min(100, Math.max(0, (elapsed / totalYearDuration) * 100));

        return {
            total: diff,
            months,
            weeks,
            days,
            hours,
            minutes,
            seconds,
            milliseconds,
            totalDays,
            isComplete: false,
            progress: progress.toFixed(2)
        };
    }

    /**
     * Start the countdown timer
     */
    start() {
        if (this.intervalId) {
            this.stop();
        }

        // Initial update
        this.update();

        // Use requestAnimationFrame for smoother updates when possible
        if (window.requestAnimationFrame && this.updateFrequency < 100) {
            this.rafLoop();
        } else {
            this.intervalId = setInterval(() => this.update(), this.updateFrequency);
        }

        return this;
    }

    /**
     * RAF-based update loop for smoother animations
     */
    rafLoop() {
        const now = this.getHighPrecisionTime();
        
        if (now - this.lastUpdateTime >= this.updateFrequency) {
            this.update();
            this.lastUpdateTime = now;
        }

        this.rafId = requestAnimationFrame(() => this.rafLoop());
    }

    /**
     * Perform countdown update
     */
    update() {
        const remaining = this.calculateTimeRemaining();
        
        this.onUpdate(remaining);

        if (remaining.isComplete) {
            this.stop();
            this.onComplete();
            
            // Auto-rollover to next year
            if (this.targetYear < this.yearRange.end) {
                setTimeout(() => {
                    this.setBoxingDay(this.targetYear + 1);
                    this.start();
                }, 5000); // Wait 5 seconds before rolling over
            }
        }
    }

    /**
     * Stop the countdown
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        return this;
    }

    /**
     * Get target date for specific year
     */
    getBoxingDayDate(year) {
        return new Date(year, 11, 26);
    }

    /**
     * Get all Boxing Day dates in range
     */
    getAllBoxingDays() {
        const dates = [];
        for (let year = this.yearRange.start; year <= this.yearRange.end; year++) {
            const date = this.getBoxingDayDate(year);
            dates.push({
                year,
                date,
                dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
                formatted: date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })
            });
        }
        return dates;
    }

    /**
     * Format time unit with leading zero
     */
    static formatUnit(value, padLength = 2) {
        return String(value).padStart(padLength, '0');
    }

    /**
     * Get human-readable time string
     */
    getReadableTime(remaining = null) {
        const r = remaining || this.calculateTimeRemaining();
        
        if (r.isComplete) {
            return "It's Boxing Day!";
        }

        const parts = [];
        if (r.months > 0) parts.push(`${r.months} month${r.months !== 1 ? 's' : ''}`);
        if (r.weeks > 0) parts.push(`${r.weeks} week${r.weeks !== 1 ? 's' : ''}`);
        if (r.days > 0) parts.push(`${r.days} day${r.days !== 1 ? 's' : ''}`);
        if (r.hours > 0) parts.push(`${r.hours} hour${r.hours !== 1 ? 's' : ''}`);
        if (r.minutes > 0) parts.push(`${r.minutes} minute${r.minutes !== 1 ? 's' : ''}`);
        if (r.seconds > 0) parts.push(`${r.seconds} second${r.seconds !== 1 ? 's' : ''}`);

        return parts.join(', ');
    }
}

// Timezone utilities
const TimezoneUtils = {
    // Common timezones with cities
    commonTimezones: [
        { id: 'America/New_York', city: 'New York', country: 'USA', offset: 'EST/EDT' },
        { id: 'America/Los_Angeles', city: 'Los Angeles', country: 'USA', offset: 'PST/PDT' },
        { id: 'America/Chicago', city: 'Chicago', country: 'USA', offset: 'CST/CDT' },
        { id: 'America/Toronto', city: 'Toronto', country: 'Canada', offset: 'EST/EDT' },
        { id: 'America/Vancouver', city: 'Vancouver', country: 'Canada', offset: 'PST/PDT' },
        { id: 'Europe/London', city: 'London', country: 'UK', offset: 'GMT/BST' },
        { id: 'Europe/Paris', city: 'Paris', country: 'France', offset: 'CET/CEST' },
        { id: 'Europe/Berlin', city: 'Berlin', country: 'Germany', offset: 'CET/CEST' },
        { id: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', offset: 'JST' },
        { id: 'Asia/Shanghai', city: 'Shanghai', country: 'China', offset: 'CST' },
        { id: 'Asia/Dubai', city: 'Dubai', country: 'UAE', offset: 'GST' },
        { id: 'Asia/Kolkata', city: 'Mumbai', country: 'India', offset: 'IST' },
        { id: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', offset: 'SGT' },
        { id: 'Australia/Sydney', city: 'Sydney', country: 'Australia', offset: 'AEST/AEDT' },
        { id: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia', offset: 'AEST/AEDT' },
        { id: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', offset: 'NZST/NZDT' },
        { id: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', offset: 'BST' }
    ],

    /**
     * Get user's current timezone
     */
    detectTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            return 'UTC';
        }
    },

    /**
     * Get timezone offset string
     */
    getOffsetString(timezone) {
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                timeZoneName: 'short'
            });
            const parts = formatter.formatToParts(now);
            const tzPart = parts.find(p => p.type === 'timeZoneName');
            return tzPart ? tzPart.value : timezone;
        } catch (e) {
            return timezone;
        }
    },

    /**
     * Get current time in specific timezone
     */
    getTimeInTimezone(timezone) {
        try {
            return new Date().toLocaleString('en-US', { timeZone: timezone });
        } catch (e) {
            return new Date().toLocaleString();
        }
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CountdownEngine, TimezoneUtils };
}
