import { WeatherService, WeatherType, CITIES } from '../services/WeatherService.js';
import assert from 'node:assert';
import test from 'node:test';

test('WeatherService Test Suite', async (t) => {

    await t.test('TC-080: instantiates WeatherService with default city', () => {
        const weather = new WeatherService();
        assert.strictEqual(weather.selectedCity.name, 'Neo-Tokyo');
        assert.strictEqual(weather.currentWeather, WeatherType.CLEAR);
    });

    await t.test('TC-081: maps WMO codes correctly to WeatherType', () => {
        const weather = new WeatherService();

        assert.strictEqual(weather.mapWmoCodeToWeatherType(0), WeatherType.CLEAR);
        assert.strictEqual(weather.mapWmoCodeToWeatherType(1), WeatherType.CLEAR);
        assert.strictEqual(weather.mapWmoCodeToWeatherType(3), WeatherType.FOG);
        assert.strictEqual(weather.mapWmoCodeToWeatherType(45), WeatherType.FOG);
        assert.strictEqual(weather.mapWmoCodeToWeatherType(51), WeatherType.RAIN);
        assert.strictEqual(weather.mapWmoCodeToWeatherType(63), WeatherType.RAIN);
        assert.strictEqual(weather.mapWmoCodeToWeatherType(80), WeatherType.RAIN);
        assert.strictEqual(weather.mapWmoCodeToWeatherType(95), WeatherType.ACID_STORM);
        assert.strictEqual(weather.mapWmoCodeToWeatherType(99), WeatherType.ACID_STORM);
    });

    await t.test('TC-082: changes selected city correctly', () => {
        const weather = new WeatherService();
        weather.setCity('seoul');
        assert.strictEqual(weather.selectedCity.name, 'Neo-Seoul');
        assert.ok(weather.endpoint.includes('37.5665'));
    });

    await t.test('TC-083: respects manual weather overrides', async () => {
        const weather = new WeatherService();
        weather.setOverrideWeather(WeatherType.ACID_STORM);

        const info = await weather.fetchLiveWeather();
        assert.strictEqual(info.weather, WeatherType.ACID_STORM);
        assert.strictEqual(weather.currentWeather, WeatherType.ACID_STORM);
        assert.ok(info.city.includes('OVERRIDE'));
    });

    await t.test('TC-084: generates deterministic procedural fallback weather per level', () => {
        const weather = new WeatherService();
        
        const f1 = weather.getProceduralFallbackWeather(1);
        const f2 = weather.getProceduralFallbackWeather(2);
        const f3 = weather.getProceduralFallbackWeather(3);
        const f4 = weather.getProceduralFallbackWeather(4);

        assert.strictEqual(f1.weather, WeatherType.RAIN);
        assert.strictEqual(f2.weather, WeatherType.FOG);
        assert.strictEqual(f3.weather, WeatherType.ACID_STORM);
        assert.strictEqual(f4.weather, WeatherType.CLEAR);
    });

    await t.test('TC-085: returns valid badge metadata for all weather types', () => {
        const weather = new WeatherService();

        weather.setOverrideWeather(WeatherType.RAIN);
        assert.strictEqual(weather.getWeatherBadgeInfo().label, '🌧️ CYBER RAIN');

        weather.setOverrideWeather(WeatherType.FOG);
        assert.strictEqual(weather.getWeatherBadgeInfo().label, '🌫️ VOLUMETRIC FOG');

        weather.setOverrideWeather(WeatherType.ACID_STORM);
        assert.strictEqual(weather.getWeatherBadgeInfo().label, '⚡ ACID STORM');

        weather.setOverrideWeather(WeatherType.CLEAR);
        assert.strictEqual(weather.getWeatherBadgeInfo().label, '☀️ CLEAR GRID');
    });
});
