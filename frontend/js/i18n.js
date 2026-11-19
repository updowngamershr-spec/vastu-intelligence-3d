/**
 * Localization Manager supporting Gujarati (gu), Hindi (hi), Punjabi (pa), and English (en).
 */

class I18nManager {
    constructor() {
        this.currentLang = 'gu'; // Default to Gujarati as requested
        this.translations = {};
    }

    async loadTranslations() {
        try {
            const res = await fetch('/api/translations');
            this.translations = await res.json();
            this.applyLanguage(this.currentLang);
        } catch (e) {
            console.warn("Translations fetch error:", e);
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        this.applyLanguage(lang);
    }

    t(key) {
        const d = this.translations[this.currentLang] || this.translations['hi'] || this.translations['en'] || {};
        return d[key] || key;
    }

    applyLanguage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });
    }
}

const i18n = new I18nManager();
