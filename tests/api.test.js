// tests/api.test.js

global.fetch = jest.fn();

// CORREÇÃO: Garanta que todas as funções necessárias sejam importadas, incluindo a nova 'renderForecast'
const {
    getWeatherData,
    getWeatherDescription,
    updateWeatherIcon,
    updateTheme,
    fetchCoordinates,
    fetchWeatherData,
    renderWeatherData,
    renderForecast
} = require('../js/api.js');

// Mocks de dados - devem estar definidos no escopo correto
const mockLocation = { latitude: -23.55, longitude: -46.63, name: "São Paulo", country: "Brasil" };
const mockWeatherData = {
    current_weather: { temperature: 24.5, windspeed: 5.7, winddirection: 120, weathercode: 3, is_day: 1, time: "2025-10-08T15:00" },
    // CORREÇÃO: Inclui o objeto 'daily' com dados mockados
    daily: {
        time: ['2025-10-08', '2025-10-09', '2025-10-10', '2025-10-11', '2025-10-12', '2025-10-13'],
        weathercode: [3, 0, 2, 80, 1, 3],
        temperature_2m_max: [25, 26, 24, 22, 23, 25],
        temperature_2m_min: [15, 16, 14, 12, 13, 15],
    }
};
const mockDailyData = {
    time: [
        '2023-10-26', // Hoje (ignorado)
        '2023-10-27', // Amanhã
        '2023-10-28',
        '2023-10-29',
        '2023-10-30',
        '2023-10-31'
    ],
    temperature_2m_max: [25, 26, 24, 22, 23, 25],
    temperature_2m_min: [15, 16, 14, 12, 13, 15],
    weathercode: [0, 3, 80, 95, 2, 0]
};

describe('Testes da API de Previsão do Tempo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // CORREÇÃO: Adiciona a seção .search-section e a nova #forecast-section que faltavam no DOM de teste
        document.body.innerHTML = `
            <section class="search-section">
                <form id="weather-form">
                    <div class="input-group">
                        <input type="text" id="city-input" placeholder="Digite o nome da cidade..." required>
                        <button type="submit" id="search-btn">Buscar</button>
                    </div>
                </form>
            </section>
            <section id="city-selection" class="city-selection-section hidden">
                <h3>Encontramos múltiplas cidades...</h3>
                <div id="city-list" class="city-list"></div>
                <button id="back-to-search" class="back-button">Voltar para a busca</button>
            </section>
            <div id="weather-result" class="weather-section hidden">
                <h2 id="city-name"></h2> <span id="temperature-value"></span> <span id="wind-speed"></span>
                <span id="wind-direction"></span> <span id="weather-description"></span> <span id="update-time"></span>
                <i id="weather-icon" class="wi"></i>
            </div>
            <section id="forecast-section" class="forecast-section hidden">
                <h3>Previsão para os próximos 5 dias</h3>
                <div id="forecast-list" class="forecast-list"></div>
            </section>
            <div id="error-message" class="error-section hidden"><p id="error-text"></p></div>
        `;
    });

    // Testes de Integração (Função Principal)
    describe('getWeatherData', () => {
        test('Deve buscar e exibir dados para uma cidade válida', async () => {
            fetch
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [mockLocation] }) })
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockWeatherData) });

            await getWeatherData('São Paulo');

            expect(fetch).toHaveBeenCalledTimes(2);
            expect(document.getElementById('city-name').textContent).toBe('São Paulo, Brasil');
            expect(document.getElementById('temperature-value').textContent).toBe('25');
            // Verifica se a view correta está sendo exibida
            expect(document.querySelector('.search-section').classList.contains('hidden')).toBe(true);
            expect(document.getElementById('weather-result').classList.contains('hidden')).toBe(false);
            expect(document.getElementById('forecast-section').classList.contains('hidden')).toBe(false);
        });

        test('Deve exibir erro para entrada vazia', async () => {
            await getWeatherData('');
            expect(document.getElementById('error-text').textContent).toContain('Por favor, digite o nome de uma cidade');
            expect(document.getElementById('error-message').classList.contains('hidden')).toBe(false);
        });

        test('Deve exibir erro para cidade não encontrada', async () => {
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [] }) });
            await getWeatherData('CidadeInexistente');
            expect(document.getElementById('error-text').textContent).toContain('Cidade não encontrada');
        });

        test('Deve exibir erro genérico para falhas de rede', async () => {
            fetch.mockRejectedValue(new TypeError('Failed to fetch'));
            await getWeatherData('São Paulo');
            expect(document.getElementById('error-text').textContent).toContain('Falha de conexão');
        });
    });

    // Testes Unitários (Funções Auxiliares)
    describe('fetchCoordinates', () => {
        test('Deve retornar dados de localização para uma cidade válida', async () => {
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [mockLocation] }) });
            const location = await fetchCoordinates('São Paulo');
            expect(location).toEqual([mockLocation]);
        });

        test('Deve lançar erro para limite de requisições (429)', async () => {
            fetch.mockResolvedValueOnce({ ok: false, status: 429 });
            await expect(fetchCoordinates('São Paulo')).rejects.toThrow('Limite de requisições');
        });
    });

    describe('fetchWeatherData', () => {
        test('Deve retornar dados do clima para coordenadas válidas', async () => {
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockWeatherData) });
            const data = await fetchWeatherData(mockLocation.latitude, mockLocation.longitude);
            expect(data).toEqual(mockWeatherData);
        });

        test('Deve lançar erro para resposta sem current_weather', async () => {
            // CORREÇÃO: O mock deve falhar na verificação de 'current_weather' ou 'daily'
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ current_weather: null }) });
            await expect(fetchWeatherData(0, 0)).rejects.toThrow('formato inesperado');
        });
    });
    
    describe('renderWeatherData', () => {
        test('Deve preencher o DOM com os dados fornecidos', () => {
            renderWeatherData(mockLocation, mockWeatherData);
            expect(document.getElementById('city-name').textContent).toBe('São Paulo, Brasil');
            expect(document.getElementById('weather-result').classList.contains('hidden')).toBe(false);
            expect(document.querySelector('.search-section').classList.contains('hidden')).toBe(true);
        });
    });

    // Teste para a nova funcionalidade de previsão
    describe('renderForecast', () => {
        test('Deve renderizar a previsão de 5 dias', () => {
            // CORREÇÃO: Mockamos a função de formatação de datas para garantir que o teste seja previsível
            const mockToLocaleDateString = jest.spyOn(Date.prototype, 'toLocaleDateString')
                .mockReturnValue('sex.'); // Força o retorno a ser "sex."

            const mockDailyData = {
                time: [
                    '2023-10-26', // Hoje (ignorado)
                    '2023-10-27', // Amanhã
                    '2023-10-28',
                    '2023-10-29',
                    '2023-10-30',
                    '2023-10-31'
                ],
                temperature_2m_max: [25, 26, 24, 22, 23, 25],
                temperature_2m_min: [15, 16, 14, 12, 13, 15],
                weathercode: [0, 3, 80, 95, 2, 0]
            };
            
            renderForecast(mockDailyData);

            const forecastCards = document.querySelectorAll('.forecast-day-card');
            expect(forecastCards.length).toBe(5);
            
            const firstCard = forecastCards[0];
            expect(firstCard.querySelector('.forecast-date').textContent).toBe('sex.');
            expect(firstCard.querySelector('.temp-max').textContent).toBe('26°');
            expect(firstCard.querySelector('.temp-min').textContent).toBe('16°');
            expect(firstCard.querySelector('.forecast-icon').className).toContain('wi-cloudy');
            
            // CORREÇÃO: Restauramos a função original para não afetar outros testes
            mockToLocaleDateString.mockRestore();
        });
    });

    // Testes de Funções Puras e de UI
    describe('Funções de UI e Utilitárias', () => {
        test('getWeatherDescription retorna descrição correta', () => {
            expect(getWeatherDescription(0)).toBe('Céu limpo');
            expect(getWeatherDescription(999)).toBe('Condição desconhecida');
        });

        test('updateTheme atualiza as classes do body', () => {
            updateTheme(false);
            expect(document.body.classList.contains('night-mode')).toBe(true);
            updateTheme(true);
            expect(document.body.classList.contains('night-mode')).toBe(false);
        });

        test('updateWeatherIcon atualiza o ícone corretamente', () => {
            updateWeatherIcon(0, false);
            expect(document.getElementById('weather-icon').className).toContain('wi-night-clear');
        });
    });
});