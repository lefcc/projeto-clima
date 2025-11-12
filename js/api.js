document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const weatherForm = document.getElementById('weather-form');
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const weatherResult = document.getElementById('weather-result');
    const errorMessage = document.getElementById('error-message');
    
    // Elementos de exibição de dados
    const cityName = document.getElementById('city-name');
    const temperatureValue = document.getElementById('temperature-value');
    const windSpeed = document.getElementById('wind-speed');
    const windDirection = document.getElementById('wind-direction');
    const weatherCondition = document.getElementById('weather-condition');
    const updateTime = document.getElementById('update-time');
    const errorText = document.getElementById('error-text');
    
    // Event Listeners
    weatherForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    });
    
    // Função para obter dados meteorológicos
    async function getWeatherData(city) {
        try {
            // Primeiro, obter as coordenadas da cidade usando a API de geocodificação
            const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`);
            
            if (!geoResponse.ok) {
                throw new Error('Falha ao buscar localização');
            }
            
            const geoData = await geoResponse.json();
            
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('Cidade não encontrada');
            }
            
            const { latitude, longitude, name, country } = geoData.results[0];
            
            // Agora, obter os dados meteorológicos usando as coordenadas
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            );
            
            if (!weatherResponse.ok) {
                throw new Error('Falha ao obter dados meteorológicos');
            }
            
            const weatherData = await weatherResponse.json();
            
            // Exibir os dados
            displayWeatherData(name, country, weatherData);
            
        } catch (error) {
            displayError(error.message);
        }
    }
    
    // Função para exibir os dados meteorológicos
    function displayWeatherData(city, country, data) {
        // Ocultar mensagem de erro, se houver
        errorMessage.classList.add('hidden');
        
        // Exibir a seção de resultados
        weatherResult.classList.remove('hidden');
        
        // Preencher os dados
        cityName.textContent = `${city}, ${country}`;
        temperatureValue.textContent = Math.round(data.current_weather.temperature);
        windSpeed.textContent = data.current_weather.windspeed;
        windDirection.textContent = data.current_weather.winddirection;
        
        // Traduzir o código do tempo para uma descrição legível
        const weatherCode = data.current_weather.weathercode;
        weatherCondition.textContent = getWeatherDescription(weatherCode);
        
        // Formatar a data e hora
        const dateTime = new Date(data.current_weather.time);
        updateTime.textContent = `Atualizado em: ${dateTime.toLocaleString('pt-BR')}`;
    }
    
    // Função para exibir mensagem de erro
    function displayError(message) {
        // Ocultar a seção de resultados, se estiver visível
        weatherResult.classList.add('hidden');
        
        // Exibir a seção de erro
        errorMessage.classList.remove('hidden');
        errorText.textContent = message;
    }
    
    // Função para traduzir o código do tempo
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