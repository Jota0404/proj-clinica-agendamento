# 🏥 Sistema de Agendamento — Clínica de Saúde Modernizada

> **Trabalho Final — Programação e Desenvolvimento Web**  
> **Projeto 03:** Sistema de Agendamento (Frontend + Backend com Persistência Local JSON)

---

## 📌 Sobre o Projeto

A clínica de saúde modernizou suas soluções tecnológicas para proporcionar uma experiência fluida e ágil aos pacientes. Este sistema permite a consulta de profissionais e especialidades, a realização de agendamentos de consultas/exames em datas disponíveis, e a gestão de consultas ativas (busca e cancelamento via CPF).

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** Node.js, Express.js, CORS
* **Persistência de Dados:** Arquivos locais JSON (`fs/promises`)
* **Frontend:** HTML5, CSS3, JavaScript Vanilla (Fetch API)
* **Controle de Versão:** Git e GitHub

---

## 📂 Estrutura do Projeto

```text
clinica-agendamento/
├── data/
│   ├── profissionais.json    # Dados estáticos de profissionais e disponibilidades
│   └── agendamentos.json     # Registro dos agendamentos efetuados
├── public/                   # Interface da aplicação (Frontend)
│   ├── css/
│   │   └── style.css         # Estilização visual da clínica
│   ├── js/
│   │   └── app.js            # Integração com a API via Fetch
│   └── index.html            # Interface principal
├── .gitignore
├── package.json
├── README.md
└── server.js                 # API REST em Node.js / Express
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* **Node.js** instalado (versão 18 ou superior)
* **Git** instalado

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone [https://github.com/SEU_USUARIO/clinica-agendamento.git](https://github.com/SEU_USUARIO/clinica-agendamento.git)
   cd clinica-agendamento
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Iniciar o servidor backend:**
   ```bash
   node server.js
   ```
   *O servidor iniciará por padrão em: `http://localhost:3000`*

4. **Acessar a aplicação:**
   * Abra o navegador e acesse: `http://localhost:3000` (ou abra diretamente o arquivo `public/index.html`).

---

## 🔗 Endpoints da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/profissionais` | Lista médicos e filtra por especialidade/nome |
| `POST` | `/api/agendamentos` | Cria um novo agendamento no arquivo JSON |
| `GET` | `/api/agendamentos/:cpf` | Retorna consultas vinculadas ao CPF |
| `DELETE` | `/api/agendamentos/:id` | Cancela e remove uma consulta registrada |

---

## 📊 Estrutura Analítica do Projeto (EAP)

1. **Gestão:** Planejamento, documentação e gravação do vídeo demonstrativo.
2. **Dados:** Modelagem dos schemas de dados nos arquivos JSON.
3. **API Backend:** Desenvolvimento das rotas HTTP e manipulação assíncrona de arquivos.
4. **Interface Frontend:** Construção das páginas HTML, estilização CSS e consumo de endpoints JS.
5. **Entregáveis:** Publicação do código no GitHub e envio do documento PDF final.

---

## 👨‍💻 Autor

Desenvolvido por João Marcos de Barcelos Fernandes como trabalho acadêmico da disciplina de Programação e Desenvolvimento Web.