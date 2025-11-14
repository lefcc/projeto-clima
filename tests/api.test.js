// tests/api.test.js

global.fetch = jest.fn();

const {
    getWeatherData,
    getWeatherDescription,
    updateWeatherIcon,
    updateTheme,
    fetchCoordinates,
    fetchWeatherData,
    renderWeatherData
} = require('../js/api.js');

// Mocks de dados
const mockLocation = { latitude: -23.55, longitude: -46.63, name: "São Paulo", country: "Brasil" };
const mockWeatherData = { current_weather: { temperature: 24.5, windspeed: 5.7, winddirection: 120, weathercode: 3, is_day: 1, time: "2025-10-08T15:00" } };

describe('Testes da API de Previsão do Tempo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // CORREÇÃO: Adicionada a seção .search-section que faltava no DOM de teste
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
            // CORREÇÃO: A função agora retorna um array, então o teste deve esperar um array
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
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
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