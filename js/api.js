// js/api.js

// --- FUNÇÕES PRINCIPAIS (No escopo global para serem testáveis) ---

function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
        45: 'Neblina', 48: 'Neblina com depósito de gelo', 51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa densa',
        56: 'Garoa leve congelante', 57: 'Garoa densa congelante', 61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
        66: 'Chuva leve congelante', 67: 'Chuva forte congelante', 71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte',
        77: 'Grãos de neve', 80: 'Pancadas de chuva leves', 81: 'Pancadas de chuva moderadas', 82: 'Pancadas de chuva violentas',
        85: 'Pancadas de neve leves', 86: 'Pancadas de neve fortes', 95: 'Tempestade leve ou moderada',
        96: 'Tempestade com granizo leve', 99: 'Tempestade com granizo forte'
    };
    return weatherCodes[code] || 'Condição desconhecida';
}

function updateTheme(isDayTime) {
    const body = document.body;
    if (isDayTime) {
        body.classList.remove('night-mode');
    } else {
        body.classList.add('night-mode');
    }
}

function updateWeatherIcon(code, isDayTime) {
    // CORREÇÃO: Encontra o elemento aqui, para não depender de uma variável global
    const weatherIcon = document.getElementById('weather-icon');
    if (!weatherIcon) return; // Sai se o elemento não existir (evita erros em testes)

    const iconClass = getWeatherIconClass(code, isDayTime);
    weatherIcon.className = `wi ${iconClass}`;
}

// js/api.js

function getWeatherIconClass(code, isDayTime) {
    // CORREÇÃO: Caso especial para céu limpo à noite (mostrar a lua)
    if (code === 0 && !isDayTime) {
        return 'wi-night-clear';
    }

    const dayPrefix = isDayTime ? 'day-' : 'night-';
    
    switch (code) {
        case 0: return `wi-${dayPrefix}sunny`; // Agora só será usado para o dia
        case 1: return `wi-${dayPrefix}-clear`;
        case 2: return 'wi-day-cloudy-high'; // Um ícone mais nublado
        case 3: return 'wi-cloudy';
        case 45: case 48: return 'wi-fog';
        case 51: case 53: case 55: return 'wi-sprinkle';
        case 56: case 57: return 'wi-rain-mix';
        case 61: case 63: case 65: return 'wi-rain';
        case 66: case 67: return 'wi-rain-mix';
        case 71: case 73: case 75: return 'wi-snow';
        case 77: return 'wi-snowflake-cold';
        case 80: case 81: case 82: return 'wi-showers';
        case 85: case 86: return 'wi-snow-wind';
        case 95: return 'wi-thunderstorm';
        case 96: case 99: return 'wi-storm-showers';
        default: return `wi-${dayPrefix}-sunny`;
    }
}

async function getWeatherData(city) {
    const weatherResult = document.getElementById('weather-result');
    const errorMessage = document.getElementById('error-message');
    const cityName = document.getElementById('city-name');
    const temperatureValue = document.getElementById('temperature-value');
    const windSpeed = document.getElementById('wind-speed');
    const windDirection = document.getElementById('wind-direction');
    const weatherDescription = document.getElementById('weather-description');
    const updateTime = document.getElementById('update-time');
    const errorText = document.getElementById('error-text');

    const displayError = (message) => {
        weatherResult.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorText.textContent = message;
    };

    if (!city) {
        displayError('Por favor, digite o nome de uma cidade.');
        return;
    }

    try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`);
        
        // CORREÇÃO: Tratamento específico para limite de requisições (429)
        if (geoResponse.status === 429) {
            throw new Error('Limite de requisições da API excedido. Tente novamente mais tarde.');
        }

        if (!geoResponse.ok) {
            throw new Error('Falha ao buscar localização. Tente novamente.');
        }
        
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Cidade não encontrada. Verifique a digitação.');
        }
        
        const { latitude, longitude, name, country } = geoData.results[0];
        
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('Falha ao obter dados meteorológicos. Tente novamente.');
        }
        
        const weatherData = await weatherResponse.json();

        // CORREÇÃO: Validação do formato da resposta JSON
        if (!weatherData.current_weather) {
            throw new Error('Resposta da API em formato inesperado. Dados do clima não encontrados.');
        }

        // Se tudo deu certo, exibe os dados
        errorMessage.classList.add('hidden');
        weatherResult.classList.remove('hidden');
        
        const isDayTime = weatherData.current_weather.is_day === 1;
        updateTheme(isDayTime);
        
        cityName.textContent = `${name}, ${country}`;
        temperatureValue.textContent = Math.round(weatherData.current_weather.temperature);
        windSpeed.textContent = weatherData.current_weather.windspeed;
        windDirection.textContent = weatherData.current_weather.winddirection;
        
        const weatherCode = weatherData.current_weather.weathercode;
        weatherDescription.textContent = getWeatherDescription(weatherCode);
        updateWeatherIcon(weatherCode, isDayTime);
        
        const dateTime = new Date(weatherData.current_weather.time);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        updateTime.textContent = `Atualizado em: ${dateTime.toLocaleString('pt-BR', options)}`;
        
    } catch (error) {
        // CORREÇÃO: Tratamento mais específico para erros de rede (TypeError)
        if (error instanceof TypeError) {
            displayError('Falha de conexão. Verifique sua internet e tente novamente.');
        } else {
            displayError(error.message);
        }
    }
}

// --- INICIALIZAÇÃO E EXPORTAÇÃO (Sem mudanças aqui) ---

function initializeApp() {
    const weatherForm = document.getElementById('weather-form');
    const cityInput = document.getElementById('city-input');
    if (weatherForm) {
        weatherForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const city = cityInput.value.trim();
            if (city) {
                getWeatherData(city);
            }
        });
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeApp);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWeatherData,
    getWeatherDescription,
    updateWeatherIcon,
    updateTheme,
    getWeatherIconClass
  };
}