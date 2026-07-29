/**
 * WeatherService.js
 * Integrates live real-world weather using Open-Meteo API (free, open, no key required)
 * Provides Cyber Rain, Volumetric Fog, and Acid Storm effects with offline procedural fallbacks.
 */

export const WeatherType = {
    CLEAR: 'CLEAR',
    FOG: 'FOG',
    RAIN: 'RAIN',
    ACID_STORM: 'ACID_STORM'
};

export const CITIES = {
    tokyo: { name: 'Neo-Tokyo', lat: 35.6762, lon: 139.6503 },
    seoul: { name: 'Neo-Seoul', lat: 37.5665, lon: 126.9780 },
    london: { name: 'London Sector 4', lat: 51.5074, lon: -0.1278 },
    nyc: { name: 'New York Matrix', lat: 40.7128, lon: -74.0060 }
};

export class WeatherService {
    constructor(cityKey = 'tokyo') {
        this.selectedCity = CITIES[cityKey] || CITIES.tokyo;
        this.currentWeather = WeatherType.CLEAR;
        this.temperature = 20;
        this.overrideWeather = null; // Manual testing override
        this.lastFetchTime = 0;
        this.endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${this.selectedCity.lat}&longitude=${this.selectedCity.lon}&current_weather=true`;
    }

    setCity(cityKey) {
        if (CITIES[cityKey]) {
            this.selectedCity = CITIES[cityKey];
            this.endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${this.selectedCity.lat}&longitude=${this.selectedCity.lon}&current_weather=true`;
        }
    }

    setOverrideWeather(weatherType) {
        if (Object.values(WeatherType).includes(weatherType) || weatherType === null) {
            this.overrideWeather = weatherType;
            if (weatherType) {
                this.currentWeather = weatherType;
            }
        }
    }

    /**
     * Map WMO Weather Codes to Cyberpunk Game Weather Types
     * WMO Codes:
     * 0: Clear sky
     * 1, 2, 3: Mainly clear, partly cloudy, overcast
     * 45, 48: Fog and depositing rime fog
     * 51-67, 80-82: Drizzle, Rain, Rain Showers
     * 95-99: Thunderstorm
     */
    mapWmoCodeToWeatherType(code) {
        if (code === undefined || code === null) return WeatherType.CLEAR;
        
        const wCode = Number(code);
        if (wCode >= 95) return WeatherType.ACID_STORM;
        if (wCode >= 51 || (wCode >= 80 && wCode <= 82)) return WeatherType.RAIN;
        if (wCode === 45 || wCode === 48 || wCode === 3) return WeatherType.FOG;
        
        return WeatherType.CLEAR;
    }

    /**
     * Fetch live real-world weather from Open-Meteo
     * @returns {Promise<{weather: string, city: string, temp: number, isLive: boolean}>}
     */
    async fetchLiveWeather() {
        if (this.overrideWeather) {
            this.currentWeather = this.overrideWeather;
            return {
                weather: this.currentWeather,
                city: `${this.selectedCity.name} (OVERRIDE)`,
                temp: this.temperature,
                isLive: false
            };
        }

        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

            const response = await fetch(this.endpoint, { signal: controller ? controller.signal : undefined });
            if (timeoutId) clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const wCode = data?.current_weather?.weathercode;
                const temp = data?.current_weather?.temperature;

                this.currentWeather = this.mapWmoCodeToWeatherType(wCode);
                this.temperature = temp !== undefined ? temp : 20;
                this.lastFetchTime = Date.now();

                return {
                    weather: this.currentWeather,
                    city: this.selectedCity.name,
                    temp: this.temperature,
                    isLive: true
                };
            }
        } catch (e) {
            console.warn("[WeatherService] Open-Meteo fetch failed or offline, using fallback simulation:", e.message || e);
        }

        // Procedural fallback weather if offline or network error
        return this.getProceduralFallbackWeather();
    }

    /**
     * Generate deterministic procedural fallback weather per level / time
     */
    getProceduralFallbackWeather(level = 1) {
        if (this.overrideWeather) {
            this.currentWeather = this.overrideWeather;
        } else {
            const cycle = [WeatherType.RAIN, WeatherType.FOG, WeatherType.ACID_STORM, WeatherType.CLEAR];
            this.currentWeather = cycle[(level - 1) % cycle.length];
        }

        return {
            weather: this.currentWeather,
            city: `${this.selectedCity.name} (OFFLINE)`,
            temp: 18,
            isLive: false
        };
    }

    getWeatherBadgeInfo() {
        switch (this.currentWeather) {
            case WeatherType.RAIN:
                return { label: '🌧️ CYBER RAIN', color: '#00f0ff', desc: 'Neon Rain Drops' };
            case WeatherType.FOG:
                return { label: '🌫️ VOLUMETRIC FOG', color: '#aaaaaa', desc: 'Dense Cyber Mist' };
            case WeatherType.ACID_STORM:
                return { label: '⚡ ACID STORM', color: '#ff0055', desc: 'Heavy Rain & Lightning' };
            default:
                return { label: '☀️ CLEAR GRID', color: '#00ff88', desc: 'Optimal Sector Visibility' };
        }
    }
}
