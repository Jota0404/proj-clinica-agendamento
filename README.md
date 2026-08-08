# 🏥 Clínica Saúde & Vida - API & Agendamento Web

> Sistema web full-stack para agendamento, consulta e gestão de consultas médicas e procedimentos de saúde, desenvolvido com Node.js, Express, JavaScript (ES6+) e testes automatizados com Jest e Supertest.

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express)
![Jest](https://img.shields.io/badge/Jest-Tested-C21325?style=flat&logo=jest)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat&logo=githubactions)

---

## 📌 Funcionalidades

- **👨‍⚕️ Corpo Clínico:** Listagem dinâmica dos profissionais de saúde com filtros por nome e especialidade.
- **📅 Agendamento Interativo:** Seleção dinâmica de profissional, datas e horários disponíveis.
- **🔍 Gestão por CPF:** Consulta de consultas agendadas e cancelamento direto via interface.
- **🧪 Testes de Integração:** Suíte de testes automatizados cobrindo os endpoints da API.
- **🔄 CI/CD Automatizado:** Pipeline no GitHub Actions executando os testes em cada `push` e `pull request`.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express.js, CORS.
- **Frontend:** HTML5, CSS3, JavaScript (Fetch API, DOM Manipulation).
- **Testes:** Jest, Supertest.
- **DevOps & CI/CD:** GitHub Actions.

---

## 📁 Estrutura do Projeto

```text
clinica-agendamento/
├── .github/
│   └── workflows/
│       └── ci.yml             # Workflow de CI/CD para rodar testes no GitHub Actions
├── data/
│   ├── agendamentos.json     # Armazenamento de agendamentos
│   └── profissionais.json    # Dados do corpo clínico
├── public/
│   ├── css/
│   │   └── style.css          # Estilização da interface web
│   ├── js/
│   │   └── app.js             # Lógica de integração e manipulação do DOM (Frontend)
│   └── index.html             # Landing page e formulários
├── tests/
│   └── api.test.js            # Suíte de testes automatizados com Jest e Supertest
├── package.json               # Dependências e scripts do projeto
├── README.md                  # Documentação do projeto
└── server.js                  # Ponto de entrada do servidor Express (Backend)