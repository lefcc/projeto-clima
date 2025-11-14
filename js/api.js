// js/api.js

/**
 * @fileoverview Módulo principal da aplicação de previsão do tempo.
 * Responsável por buscar dados da API Open-Meteo, processá-los e atualizar a interface do usuário.
 */

// --- CONSTANTES E FUNÇÕES UTILITÁRIAS ---

const WEATHER_DESCRIPTIONS = {
    0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Neblina', 48: 'Neblina com depósito de gelo', 51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa densa',
    56: 'Garoa leve congelante', 57: 'Garoa densa congelante', 61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
    66: 'Chuva leve congelante', 67: 'Chuva forte congelante', 71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte',
    77: 'Grãos de neve', 80: 'Pancadas de chuva leves', 81: 'Pancadas de chuva moderadas', 82: 'Pancadas de chuva violentas',
    85: 'Pancadas de neve leves', 86: 'Pancadas de neve fortes', 95: 'Tempestade leve ou moderada',
    96: 'Tempestade com granizo leve', 99: 'Tempestade com granizo forte'
};

function getWeatherDescription(code) { return WEATHER_DESCRIPTIONS[code] || 'Condição desconhecida'; }
function updateTheme(isDayTime) { const body = document.body; if (isDayTime) { body.classList.remove('night-mode'); } else { body.classList.add('night-mode'); } }
function getWeatherIconClass(code, isDayTime) { if (code === 0 && !isDayTime) { return 'wi-night-clear'; } const dayPrefix = isDayTime ? 'day-' : 'night-'; switch (code) { case 0: return `wi-${dayPrefix}sunny`; case 1: return `wi-${dayPrefix}-clear`; case 2: return 'wi-day-cloudy-high'; case 3: return 'wi-cloudy'; case 45: case 48: return 'wi-fog'; case 51: case 53: case 55: return 'wi-sprinkle'; case 56: case 57: return 'wi-rain-mix'; case 61: case 63: case 65: return 'wi-rain'; case 71: case 73: case 75: return 'wi-snow'; case 80: case 81: case 82: return 'wi-showers'; case 95: return 'wi-thunderstorm'; case 96: case 99: return 'wi-storm-showers'; default: return `wi-${dayPrefix}-sunny`; } }
function updateWeatherIcon(code, isDayTime) { const weatherIcon = document.getElementById('weather-icon'); if (!weatherIcon) return; const iconClass = getWeatherIconClass(code, isDayTime); weatherIcon.className = `wi ${iconClass}`; }

// --- GERENCIAMENTO DE ESTADO DA INTERFACE ---

function showView(viewName) {
    const searchSection = document.querySelector('.search-section');
    const citySelection = document.getElementById('city-selection');
    const weatherResult = document.getElementById('weather-result');
    const errorMessage = document.getElementById('error-message');

    searchSection.classList.add('hidden');
    citySelection.classList.add('hidden');
    weatherResult.classList.add('hidden');
    errorMessage.classList.add('hidden');

    switch (viewName) {
        case 'search': searchSection.classList.remove('hidden'); break;
        case 'selection': citySelection.classList.remove('hidden'); break;
        case 'weather': weatherResult.classList.remove('hidden'); break;
        case 'error': errorMessage.classList.remove('hidden'); break;
    }
}

function displayError(message) { document.getElementById('error-text').textContent = message; showView('error'); }
function renderWeatherData(location, data) { const { name, country } = location; const { temperature, windspeed, winddirection, weathercode, is_day, time } = data.current_weather; updateTheme(is_day === 1); document.getElementById('city-name').textContent = `${name}, ${country}`; document.getElementById('temperature-value').textContent = Math.round(temperature); document.getElementById('wind-speed').textContent = windspeed; document.getElementById('wind-direction').textContent = winddirection; document.getElementById('weather-description').textContent = getWeatherDescription(weathercode); updateWeatherIcon(weathercode, is_day === 1); const dateTime = new Date(time); const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }; document.getElementById('update-time').textContent = `Atualizado em: ${dateTime.toLocaleString('pt-BR', options)}`; showView('weather'); }

// --- LÓGICA DA API E DA APLICAÇÃO ---

async function fetchCoordinates(city) { const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=pt`); if (geoResponse.status === 429) { throw new Error('Limite de requisições da API excedido. Tente novamente mais tarde.'); } if (!geoResponse.ok) { throw new Error('Falha ao buscar localização. Tente novamente.'); } const geoData = await geoResponse.json(); if (!geoData.results || geoData.results.length === 0) { throw new Error('Cidade não encontrada. Verifique a digitação.'); } return geoData.results; }
async function fetchWeatherData(latitude, longitude) { const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`); if (!weatherResponse.ok) { throw new Error('Falha ao obter dados meteorológicos. Tente novamente.'); } const weatherData = await weatherResponse.json(); if (!weatherData.current_weather) { throw new Error('Resposta da API em formato inesperado. Dados do clima não encontrados.'); } return weatherData; }

function displayCitySelection(cities) { const cityList = document.getElementById('city-list'); cityList.innerHTML = ''; cities.forEach(city => { const { name, country, admin1, latitude, longitude } = city; const cityOption = document.createElement('div'); cityOption.className = 'city-option'; const displayName = admin1 ? `${name}, ${admin1}` : name; cityOption.innerHTML = `<div class="city-name">${displayName}</div><div class="city-details">${country}</div>`; cityOption.addEventListener('click', () => { handleCitySelection({ name, country, latitude, longitude }); }); cityList.appendChild(cityOption); }); showView('selection'); }
async function handleCitySelection(location) { const { latitude, longitude, name, country } = location; try { const weatherData = await fetchWeatherData(latitude, longitude); renderWeatherData({ name, country }, weatherData); } catch (error) { displayError(error.message); } }

async function getWeatherData(city) { if (!city) { displayError('Por favor, digite o nome de uma cidade.'); return; } try { const locations = await fetchCoordinates(city); if (locations.length > 1) { displayCitySelection(locations); } else { const location = locations[0]; const weatherData = await fetchWeatherData(location.latitude, location.longitude); renderWeatherData(location, weatherData); } } catch (error) { if (error instanceof TypeError) { displayError('Falha de conexão. Verifique sua internet e tente novamente.'); } else { displayError(error.message); } } }

// --- INICIALIZAÇÃO E EXPORTAÇÃO ---

function initializeApp() { const weatherForm = document.getElementById('weather-form'); const cityInput = document.getElementById('city-input'); const backToSearchBtn = document.getElementById('back-to-search'); if (weatherForm) { weatherForm.addEventListener('submit', function(e) { e.preventDefault(); const city = cityInput.value.trim(); if (city) { getWeatherData(city); } }); } if (backToSearchBtn) { backToSearchBtn.addEventListener('click', () => { document.getElementById('city-input').value = ''; showView('search'); }); } }

if (typeof document !== 'undefined') { document.addEventListener('DOMContentLoaded', initializeApp); }
if (typeof module !== 'undefined' && module.exports) { module.exports = { getWeatherData, getWeatherDescription, updateWeatherIcon, updateTheme, fetchCoordinates, fetchWeatherData, renderWeatherData }; }