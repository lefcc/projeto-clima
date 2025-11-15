// js/api.js

/**
 * @fileoverview Módulo principal da aplicação de previsão do tempo.
 * Responsável por buscar dados da API Open-Meteo, processá-los e atualizar a interface do usuário.
 */

// --- CONSTANTES E FUNÇÕES UTILITÁRIAS ---

/**
 * Mapeia códigos meteorológicos da API para descrições em português.
 * @see https://open-meteo.com/en/docs
 * @constant {Object<number, string>}
 */
const WEATHER_DESCRIPTIONS = {
    0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Neblina', 48: 'Neblina com depósito de gelo', 51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa densa',
    56: 'Garoa leve congelante', 57: 'Garoa densa congelante', 61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
    66: 'Chuva leve congelante', 67: 'Chuva forte congelante', 71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte',
    77: 'Grãos de neve', 80: 'Pancadas de chuva leves', 81: 'Pancadas de chuva moderadas', 82: 'Pancadas de chuva violentas',
    85: 'Pancadas de neve leves', 86: 'Pancadas de neve fortes', 95: 'Tempestade leve ou moderada',
    96: 'Tempestade com granizo leve', 99: 'Tempestade com granizo forte'
};

/**
 * Obtém a descrição do clima com base no código fornecido.
 * @param {number} code - O código do tempo retornado pela API.
 * @returns {string} A descrição do tempo em português.
 */
function getWeatherDescription(code) {
    return WEATHER_DESCRIPTIONS[code] || 'Condição desconhecida';
}

/**
 * Atualiza o tema visual da página com base no horário.
 * @param {boolean} isDayTime - `true` para o tema diurno, `false` para o noturno.
 */
function updateTheme(isDayTime) {
    const body = document.body;
    if (isDayTime) {
        body.classList.remove('night-mode');
    } else {
        body.classList.add('night-mode');
    }
}

/**
 * Mapeia códigos meteorológicos e horário para as classes CSS dos ícones do Weather Icons.
 * @param {number} code - O código do tempo.
 * @param {boolean} isDayTime - `true` se for dia, `false` se for noite.
 * @returns {string} A classe CSS do ícone correspondente.
 */
function getWeatherIconClass(code, isDayTime) {
    if (code === 0 && !isDayTime) {
        return 'wi-night-clear';
    }
    const dayPrefix = isDayTime ? 'day-' : 'night-';
    switch (code) {
        case 0: return `wi-${dayPrefix}sunny`;
        case 1: return `wi-${dayPrefix}-clear`;
        case 2: return 'wi-day-cloudy-high';
        case 3: return 'wi-cloudy';
        case 45: case 48: return 'wi-fog';
        case 51: case 53: case 55: return 'wi-sprinkle';
        case 56: case 57: return 'wi-rain-mix';
        case 61: case 63: case 65: return 'wi-rain';
        case 71: case 73: case 75: return 'wi-snow';
        case 80: case 81: case 82: return 'wi-showers';
        case 95: return 'wi-thunderstorm';
        case 96: case 99: return 'wi-storm-showers';
        default: return `wi-${dayPrefix}-sunny`;
    }
}

/**
 * Atualiza o ícone do clima na interface.
 * @param {number} code - O código do tempo.
 * @param {boolean} isDayTime - `true` se for dia, `false` se for noite.
 */
function updateWeatherIcon(code, isDayTime) {
    const weatherIcon = document.getElementById('weather-icon');
    if (!weatherIcon) return;
    const iconClass = getWeatherIconClass(code, isDayTime);
    weatherIcon.className = `wi ${iconClass}`;
}

function getWindDirection(degree) {
    const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degree / 45) % 8;
    return directions[index];
}



// --- GERENCIAMENTO DE ESTADO DA INTERFACE ---

/**
 * Gerencia qual seção da interface está visível, garantindo que apenas uma seja exibida por vez.
 * @param {'search' | 'selection' | 'weather' | 'error'} viewName - O nome da visualização a ser exibida.
 */
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

/**
 * Exibe uma mensagem de erro para o usuário.
 * @param {string} message - A mensagem de erro a ser exibida.
 */
function displayError(message) {
    document.getElementById('error-text').textContent = message;
    showView('error');
}

/**
 * Renderiza os dados do clima no elemento principal da UI.
 * @param {Object} location - Dados da localização {name, country}.
 * @param {Object} data - Dados meteorológicos retornados pela API.
 */
function renderWeatherData(location, data) {
    const { name, country } = location;
    const { temperature, windspeed, winddirection, weathercode, is_day, time } = data.current_weather;

    updateTheme(is_day === 1);
    document.getElementById('city-name').textContent = `${name}, ${country}`;
    document.getElementById('temperature-value').textContent = Math.round(temperature);
    document.getElementById('wind-speed').textContent = windspeed;
    document.getElementById('wind-direction').textContent = getWindDirection(winddirection);
    document.getElementById('weather-description').textContent = getWeatherDescription(weathercode);
    updateWeatherIcon(weathercode, is_day === 1);

    const dateTime = new Date(time);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('update-time').textContent = `Atualizado em: ${dateTime.toLocaleString('pt-BR', options)}`;

    showView('weather');
}

// --- NOVA FUNCIONALIDADE: PREVISÃO DE 5 DIAS ---

function renderForecast(forecastData) {
    const forecastList = document.getElementById('forecast-list');
    forecastList.innerHTML = ''; // Limpa resultados anteriores

    // --- Lógica para encontrar o índice de "amanhã" (sem mudanças) ---
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    let startIndex = -1;
    for (let i = 0; i < forecastData.time.length; i++) {
        const forecastDate = new Date(forecastData.time[i]);
        if (forecastDate.toDateString() === tomorrow.toDateString()) {
            startIndex = i;
            break;
        }
    }
    if (startIndex === -1) {
        startIndex = 1;
    }

    // --- Renderiza os 5 dias a partir do índice de amanhã encontrado ---
    for (let i = 0; i < 5; i++) {
        const dataIndex = startIndex + i;
        if (dataIndex >= forecastData.time.length) {
            break;
        }

        const time = forecastData.time[dataIndex];
        let maxTemp = Math.round(forecastData.temperature_2m_max[dataIndex]);
        let minTemp = Math.round(forecastData.temperature_2m_min[dataIndex]);
        let weatherCode = forecastData.weathercode[dataIndex];

        // CORREÇÃO DEFINITIVA: Usamos Number.isInteger() para uma verificação muito mais segura.
        // Isso captura null, undefined, strings e qualquer coisa que não seja um número inteiro válido.
        if (!Number.isInteger(weatherCode) || weatherCode < 0) {
            console.warn(`Código do tempo inválido para ${time}. Valor recebido: ${weatherCode}. Usando ícone padrão.`);
            weatherCode = 0; // Usa "Céu limpo" como fallback
        }

        const dayCard = document.createElement('div');
        dayCard.className = 'forecast-day-card';

        const date = new Date(time);
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });

        dayCard.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <i class="forecast-icon wi ${getWeatherIconClass(weatherCode, true)}"></i>
            <div class="forecast-temps">
                <span class="temp-max">${maxTemp}°</span>
                <span class="temp-min">${minTemp}°</span>
            </div>
        `;

        forecastList.appendChild(dayCard);
    }

    document.getElementById('forecast-section').classList.remove('hidden');
}

// --- LÓGICA DA API E DA APLICAÇÃO ---

/**
 * Busca as coordenadas de uma cidade. Agora retorna múltiplos resultados.
 * @async
 * @param {string} city - O nome da cidade a ser buscada.
 * @returns {Promise<Array<Object>>} Uma Promise que resolve para um array de objetos de localização.
 * @throws {Error} Se nenhuma cidade for encontrada ou a API falhar.
 */
async function fetchCoordinates(city) {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=pt`);

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

    return geoData.results;
}

/**
 * Busca os dados meteorológicos para as coordenadas fornecidas.
 * AGORA INCLUI DADOS DIÁRIOS.
 * @async
 * @param {number} latitude - Latitude da localização.
 * @param {number} longitude - Longitude da localização.
 * @returns {Promise<Object>} Uma Promise que resolve para os dados meteorológicos.
 * @throws {Error} Se a API falhar ou os dados estiverem em formato inesperado.
 */
async function fetchWeatherData(latitude, longitude) {
    const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
    );

    if (!weatherResponse.ok) {
        throw new Error('Falha ao obter dados meteorológicos. Tente novamente.');
    }

    const weatherData = await weatherResponse.json();
    if (!weatherData.current_weather || !weatherData.daily) {
        throw new Error('Resposta da API em formato inesperado. Dados do clima não encontrados.');
    }

    return weatherData;
}

/**
 * Exibe uma lista de cidades para que o usuário possa selecionar.
 * @param {Array<Object>} cities - Array de objetos de cidade da API.
 */
function displayCitySelection(cities) {
    const cityList = document.getElementById('city-list');
    cityList.innerHTML = '';

    cities.forEach(city => {
        const { name, country, admin1, latitude, longitude } = city;
        const cityOption = document.createElement('div');
        cityOption.className = 'city-option';

        const displayName = admin1 ? `${name}, ${admin1}` : name;

        cityOption.innerHTML = `
            <div class="city-name">${displayName}</div>
            <div class="city-details">${country}</div>
        `;

        cityOption.addEventListener('click', () => {
            handleCitySelection({ name, country, latitude, longitude });
        });

        cityList.appendChild(cityOption);
    });

    showView('selection');
}

/**
 * Lida com a seleção de uma cidade da lista.
 * @param {Object} location - Objeto com dados da cidade selecionada.
 */
async function handleCitySelection(location) {
    const { latitude, longitude, name, country } = location;
    try {
        const weatherData = await fetchWeatherData(latitude, longitude);
        renderWeatherData({ name, country }, weatherData);
        renderForecast(weatherData.daily); // Renderiza a previsão
    } catch (error) {
        displayError(error.message);
    }
}

/**
 * Função principal que orquestra a busca e exibição dos dados do clima.
 * @async
 * @param {string} city - O nome da cidade para a qual se deseja a previsão.
 */
async function getWeatherData(city) {
    if (!city) {
        displayError('Por favor, digite o nome de uma cidade.');
        return;
    }

    try {
        const locations = await fetchCoordinates(city);
        if (locations.length > 1) {
            displayCitySelection(locations);
        } else {
            const location = locations[0];
            const weatherData = await fetchWeatherData(location.latitude, location.longitude);
            renderWeatherData(location, weatherData);
            renderForecast(weatherData.daily); // Renderiza a previsão
        }
    } catch (error) {
        if (error instanceof TypeError) {
            displayError('Falha de conexão. Verifique sua internet e tente novamente.');
        } else {
            displayError(error.message);
        }
    }
}

// --- INICIALIZAÇÃO E EXPORTAÇÃO ---

function initializeApp() {
    const weatherForm = document.getElementById('weather-form');
    const cityInput = document.getElementById('city-input');
    const backToSearchBtn = document.getElementById('back-to-search');
    const licenseNotice = document.getElementById('license-notice');
    const closeLicenseBtn = document.getElementById('close-license');
    const privacyNotice = document.getElementById('privacy-notice');
    const closePrivacyBtn = document.getElementById('close-privacy');

    if (weatherForm) {
        weatherForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const city = cityInput.value.trim();
            if (city) {
                getWeatherData(city);
            }
        });
    }

    if (backToSearchBtn) {
        backToSearchBtn.addEventListener('click', () => {
            document.getElementById('city-input').value = '';
            showView('search');
        });
    }

    if (closePrivacyBtn) {
        closePrivacyBtn.addEventListener('click', () => {
            privacyNotice.style.display = 'none';
        });
    }

    if (closeLicenseBtn) {
        closeLicenseBtn.addEventListener('click', () => {
            licenseNotice.style.display = 'none';
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
        fetchCoordinates,
        fetchWeatherData,
        renderWeatherData,
        renderForecast
    };
}