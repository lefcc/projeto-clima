document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const weatherForm = document.getElementById('weather-form');
    const cityInput = document.getElementById('city-input');
    const weatherResult = document.getElementById('weather-result');
    const errorMessage = document.getElementById('error-message');
    
    // Elementos de exibição de dados
    const cityName = document.getElementById('city-name');
    const temperatureValue = document.getElementById('temperature-value');
    const windSpeed = document.getElementById('wind-speed');
    const windDirection = document.getElementById('wind-direction');
    const weatherDescription = document.getElementById('weather-description');
    const updateTime = document.getElementById('update-time');
    const errorText = document.getElementById('error-text');
    const weatherIcon = document.getElementById('weather-icon');

    // Event Listener
    weatherForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    });
    
    // Função principal para obter dados meteorológicos
    async function getWeatherData(city) {
        showLoadingState();
        try {
            // 1. Obter coordenadas da cidade (Geocodificação)
            const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`);
            
            if (!geoResponse.ok) {
                throw new Error('Falha ao buscar localização. Tente novamente.');
            }
            
            const geoData = await geoResponse.json();
            
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('Cidade não encontrada. Verifique a digitação.');
            }
            
            const { latitude, longitude, name, country } = geoData.results[0];
            
            // 2. Obter dados meteorológicos com as coordenadas
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            );
            
            if (!weatherResponse.ok) {
                throw new Error('Falha ao obter dados meteorológicos. Tente novamente.');
            }
            
            const weatherData = await weatherResponse.json();
            
            // 3. Exibir os dados
            displayWeatherData(name, country, weatherData);
            
        } catch (error) {
            // Tratamento refinado de erros
            if (error instanceof TypeError) {
                displayError('Falha de conexão. Verifique sua internet e tente novamente.');
            } else {
                displayError(error.message);
            }
        }
    }
    
    // Função para exibir os dados meteorológicos
    function displayWeatherData(city, country, data) {
        hideErrorState();
        
        // Atualizar tema (dia/noite)
        const isDayTime = data.current_weather.is_day === 1;
        updateTheme(isDayTime);
        
        // Preencher os dados
        cityName.textContent = `${city}, ${country}`;
        temperatureValue.textContent = Math.round(data.current_weather.temperature);
        windSpeed.textContent = data.current_weather.windspeed;
        windDirection.textContent = data.current_weather.winddirection;
        
        // Traduzir e exibir a descrição do clima
        const weatherCode = data.current_weather.weathercode;
        const description = getWeatherDescription(weatherCode);
        weatherDescription.textContent = description;
        
        // Atualizar o ícone do clima
        updateWeatherIcon(weatherCode, isDayTime);
        
        // Formatar e exibir a data e hora completa
        const dateTime = new Date(data.current_weather.time);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        updateTime.textContent = `Atualizado em: ${dateTime.toLocaleString('pt-BR', options)}`;
    }
    
    // Função para exibir mensagem de erro
    function displayError(message) {
        weatherResult.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorText.textContent = message;
    }
    
    function hideErrorState() {
        errorMessage.classList.add('hidden');
        weatherResult.classList.remove('hidden');
    }
    
    function showLoadingState() {
        // Opcional: adicionar um spinner ou mensagem de carregamento
        weatherResult.classList.add('hidden');
        errorMessage.classList.add('hidden');
    }

    // Função para atualizar o tema com base no horário
    function updateTheme(isDayTime) {
        const body = document.body;
        if (isDayTime) {
            body.classList.remove('night-mode');
        } else {
            body.classList.add('night-mode');
        }
    }

    // Função para atualizar o ícone do clima
    function updateWeatherIcon(code, isDayTime) {
        const iconClass = getWeatherIconClass(code, isDayTime);
        weatherIcon.className = `wi ${iconClass}`;
    }

    // Mapeamento do código do tempo para a classe do ícone
    function getWeatherIconClass(code, isDayTime) {
        const dayPrefix = isDayTime ? 'day-' : 'night-';
        
        switch (code) {
            case 0: return `wi-${dayPrefix}sunny`;
            case 1: return `wi-${dayPrefix}-clear`;
            case 2: return 'wi-day-cloudy';
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
            default: return `wi-${dayPrefix}-sunny`; // Padrão para casos desconhecidos
        }
    }
    
    // Função para traduzir o código do tempo (mantida da versão anterior)
    function getWeatherDescription(code) {
        const weatherCodes = {
            0: 'Céu limpo',
            1: 'Principalmente limpo',
            2: 'Parcialmente nublado',
            3: 'Nublado',
            45: 'Neblina',
            48: 'Neblina com depósito de gelo',
            51: 'Garoa leve',
            53: 'Garoa moderada',
            55: 'Garoa densa',
            56: 'Garoa leve congelante',
            57: 'Garoa densa congelante',
            61: 'Chuva leve',
            63: 'Chuva moderada',
            65: 'Chuva forte',
            66: 'Chuva leve congelante',
            67: 'Chuva forte congelante',
            71: 'Neve leve',
            73: 'Neve moderada',
            75: 'Neve forte',
            77: 'Grãos de neve',
            80: 'Pancadas de chuva leves',
            81: 'Pancadas de chuva moderadas',
            82: 'Pancadas de chuva violentas',
            85: 'Pancadas de neve leves',
            86: 'Pancadas de neve fortes',
            95: 'Tempestade leve ou moderada',
            96: 'Tempestade com granizo leve',
            99: 'Tempestade com granizo forte'
        };
        
        return weatherCodes[code] || 'Condição desconhecida';
    }
});