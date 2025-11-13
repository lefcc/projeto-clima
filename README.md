# 🌤️ Projeto Clima

Uma aplicação web simples e responsiva para consultar a previsão do tempo de qualquer cidade do mundo, construída com HTML, CSS e JavaScript puro. Este projeto demonstra o uso de APIs modernas, testes automatizados com Jest e boas práticas de documentação.


## ✨ Funcionalidades

- 🌍 Busca por clima em qualquer cidade do mundo.
- 🌡️ Exibição da temperatura atual, velocidade e direção do vento.
- 🎨 Interface responsiva com tema dinâmico (dia/noite).
- 🌈 Ícones visuais que representam as condições do tempo.
- ⏰ Data e hora da última atualização.
- 🚨 Tratamento de erros amigável para falhas de rede, API e cidades não encontradas.
- ✅ Cobertura de testes automatizados com Jest.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 (com variáveis CSS), JavaScript (ES6+)
- **APIs:** [Open-Meteo API](https://open-meteo.com/) para dados meteorológicos e geocodificação.
- **Ícones:** [Weather Icons](https://erikflowers.github.io/weather-icons/)
- **Testes:** [Jest](https://jestjs.io/)
- **Documentação:** JSDoc

## 📁 Estrutura do Projeto
```
projeto_clima/
├── css/
│   └── style.css         # Estilos da aplicação
├── js/
│   └── api.js            # Lógica principal da aplicação
├── tests/
│   └── api.test.js       # Testes automatizados
├── index.html            # Página principal
├── jest.config.js        # Configuração do Jest
├── package.json          # Dependências e scripts do projeto
└── README.md             # Documentação do projeto
```

## 🚀 Como Executar o Projeto

Siga os passos abaixo para rodar a aplicação localmente.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- [npm](https://www.npmjs.com/) (geralmente já vem com o Node.js)
- Um navegador web moderno

### 1. Clone o Repositório

```bash
git clone https://github.com/lefcc/projeto-clima.git
cd projeto-clima
```


### 2. Instale as Dependências
O projeto utiliza o Jest para testes, que é uma dependência de desenvolvimento.

```bash
npm install
```

### 3. Execute a Aplicação
Como é um projeto frontend, você pode simplesmente abrir o arquivo ```index.html``` no seu navegador.

```bash
# Abra o arquivo no seu navegador preferido
start index.html # No Windows
open index.html  # No macOS
```

### 4. Execute os Testes
Para rodar a suíte de testes e garantir que tudo está funcionando corretamente:
```
npm test
```

## 🧪 Sobre os Testes

Os testes foram escritos para garantir a robustez da aplicação, cobrindo:

- Casos de sucesso (busca por cidade válida).
- Tratamento de erros (cidade não encontrada, falhas de rede, limites de API).
- Lógica de UI (atualização de tema e ícones).
- Formatação de dados (descrição do clima).

A cobertura de testes é alta, garantindo que as principais funcionalidades e casos extremos são validados.

