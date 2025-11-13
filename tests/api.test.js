// tests/api.test.js

global.fetch = jest.fn();

const { getWeatherData, getWeatherDescription, updateWeatherIcon, updateTheme } = require('../js/api.js');

// Mocks (sem mudanças)
const mockGeoResponse = {
  ok: true, json: jest.fn().mockResolvedValue({ results: [{ latitude: -23.55, longitude: -46.63, name: "São Paulo", country: "Brasil" }] })
};
const mockWeatherResponse = {
  ok: true, json: jest.fn().mockResolvedValue({ current_weather: { temperature: 24.5, windspeed: 5.7, winddirection: 120, weathercode: 3, is_day: 1, time: "2025-10-08T15:00" } })
};
const mockCityNotFoundResponse = { ok: true, json: jest.fn().mockResolvedValue({ results: [] }) };

describe('Testes da API de Previsão do Tempo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configura um DOM básico para cada teste
    document.body.innerHTML = `
      <div id="weather-result" class="weather-section hidden">
        <h2 id="city-name"></h2> <span id="temperature-value"></span> <span id="wind-speed"></span>
        <span id="wind-direction"></span> <span id="weather-description"></span> <span id="update-time"></span>
        <i id="weather-icon" class="wi"></i>
      </div>
      <div id="error-message" class="error-section hidden"><p id="error-text"></p></div>
    `;
  });

  test('Nome de cidade válido retorna dados meteorológicos', async () => {
    fetch.mockResolvedValueOnce(mockGeoResponse).mockResolvedValueOnce(mockWeatherResponse);
    await getWeatherData('São Paulo');

    expect(fetch).toHaveBeenCalledTimes(2);
    // CORREÇÃO: O teste agora verifica a URL codificada corretamente
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('name=S%C3%A3o%20Paulo'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('api.open-meteo.com/v1/forecast'));

    expect(document.getElementById('city-name').textContent).toBe('São Paulo, Brasil');
    expect(document.getElementById('temperature-value').textContent).toBe('25');
  });

  test('Nome de cidade inexistente lança exceção tratada', async () => {
    fetch.mockResolvedValueOnce(mockCityNotFoundResponse);
    await getWeatherData('CidadeInexistente123');
    expect(document.getElementById('error-message').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('error-text').textContent).toContain('Cidade não encontrada');
  });

  test('Entrada vazia retorna erro de validação', async () => {
    await getWeatherData('');
    expect(document.getElementById('error-message').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('error-text').textContent).toContain('Por favor, digite o nome de uma cidade');
  });

  test('Falha da API gera resposta adequada', async () => {
    // CORREÇÃO: Mock que simula um erro de rede real (TypeError)
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await getWeatherData('São Paulo');
    expect(document.getElementById('error-message').classList.contains('hidden')).toBe(false);
    // A mensagem agora é a genérica de conexão, que é o que esperamos
    expect(document.getElementById('error-text').textContent).toContain('Falha de conexão');
  });

  test('Limite de requisições da API excedido', async () => {
    // CORREÇÃO: Mock que simula o status 429
    fetch.mockResolvedValueOnce({ ok: false, status: 429, statusText: "Too Many Requests" });
    await getWeatherData('São Paulo');
    expect(document.getElementById('error-message').classList.contains('hidden')).toBe(false);
    // A mensagem agora é a específica que adicionamos no api.js
    expect(document.getElementById('error-text').textContent).toContain('Limite de requisições');
  });

  test('Conexão de rede lenta/instável', async () => {
    // CORREÇÃO: Mock que simula um timeout (TypeError)
    fetch.mockRejectedValue(new TypeError('Request timeout'));
    await getWeatherData('São Paulo');
    expect(document.getElementById('error-message').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('error-text').textContent).toContain('Falha de conexão');
  });

  test('Mudança inesperada no formato da resposta JSON', async () => {
    fetch.mockResolvedValueOnce(mockGeoResponse);
    // CORREÇÃO: Mock que simula uma resposta sem 'current_weather'
    fetch.mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ latitude: -23.55 }) });
    await getWeatherData('São Paulo');
    expect(document.getElementById('error-message').classList.contains('hidden')).toBe(false);
    // A mensagem agora é a específica que adicionamos no api.js
    expect(document.getElementById('error-text').textContent).toContain('formato inesperado');
  });

  test('getWeatherDescription retorna descrição correta', () => {
    expect(getWeatherDescription(0)).toBe('Céu limpo');
    expect(getWeatherDescription(3)).toBe('Nublado');
    expect(getWeatherDescription(999)).toBe('Condição desconhecida');
  });

  test('updateTheme atualiza o tema corretamente', () => {
    updateTheme(true);
    expect(document.body.classList.contains('night-mode')).toBe(false);
    updateTheme(false);
    expect(document.body.classList.contains('night-mode')).toBe(true);
  });

  test('updateWeatherIcon atualiza o ícone corretamente', () => {
    const iconElement = document.getElementById('weather-icon');
    updateWeatherIcon(0, true);
    expect(iconElement.className).toContain('wi-day-sunny');
    updateWeatherIcon(0, false);
    expect(iconElement.className).toContain('wi-night-clear');
  });
});