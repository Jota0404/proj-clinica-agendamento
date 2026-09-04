# 🏥 Clínica Saúde & Vida — Sistema de Agendamento

Sistema web full-stack desenvolvido para o **Projeto 03 — Sistema de Agendamento**. Permite consultar profissionais, escolher especialidade, profissional, data e horário, realizar agendamentos, consultar compromissos por CPF e cancelar agendamentos.

## 🎯 Requisitos atendidos

- Escolha de especialidade e profissional.
- Exibição de datas disponíveis por profissional.
- Consulta de horários disponíveis por data.
- Cadastro de paciente com nome e CPF.
- Persistência local em JSON.
- Consulta de agendamentos por CPF.
- Cancelamento de agendamento.
- Bloqueio de conflito de profissional/data/horário.
- API REST para especialidades, profissionais, disponibilidade e agendamentos.
- Filtro de profissionais por especialidade e nome.
- Testes automatizados com Jest + Supertest.
- Integração contínua com GitHub Actions.
- Interface responsiva em HTML, CSS e JavaScript.

## 🛠️ Tecnologias

- **Backend:** Node.js + Express
- **Frontend:** HTML5 + CSS3 + JavaScript
- **Dados:** JSON local
- **Testes:** Jest + Supertest
- **CI:** GitHub Actions

## ▶️ Como executar localmente

Pré-requisito: **Node.js 20 ou superior**.

```bash
git clone https://github.com/Jota0404/proj-clinica-agendamento.git
cd proj-clinica-agendamento
npm ci
npm start
```

Depois, acesse:

```
http://localhost:3000
```

### 🧪 Executar os testes

```bash
npm test
```

A suíte valida as principais regras da API, incluindo especialidades, disponibilidade, criação, conflito, consulta por CPF e cancelamento.

## 🔌 Endpoints principais

| Método | Endpoint | Função |
|---|---|---|
| GET | `/health` | Verifica se a API está funcionando |
| GET | `/api/especialidades` | Lista especialidades |
| GET | `/api/profissionais` | Lista/filtra profissionais |
| GET | `/api/disponibilidade?profissional_id=1&data=2026-09-15` | Consulta horários livres |
| POST | `/api/agendamentos` | Cria agendamento |
| GET | `/api/agendamentos/:cpf` | Consulta agendamentos por CPF |
| DELETE | `/api/agendamentos/:id` | Cancela agendamento |

## 📁 Estrutura

```text
proj-clinica-agendamento/
├── .github/workflows/ci.yml
├── data/
│   ├── agendamentos.json
│   └── profissionais.json
├── public/
│   ├── css/style.css
│   ├── js/app.js
│   └── index.html
├── tests/
│   ├── api.test.js
│   └── disponibilidade.test.js
├── package.json
├── package-lock.json
└── server.js
```

## 🎬 Detalhe divertido — médicos da ficção

Os avatares do corpo clínico utilizam fotografias de atores/personagens médicos encontradas no **Wikimedia Commons**, com indicação da referência fictícia na interface. As referências escolhidas são **Dr. House**, **J.D. de Scrubs**, **The Eleventh Doctor de Doctor Who** e **Dr. McCoy de Star Trek**.

As imagens foram selecionadas por estarem disponíveis no Commons sob licenças que permitem reutilização, observando as respectivas condições de atribuição. Por exemplo, a imagem de Hugh Laurie está licenciada em CC BY 2.0, a de Zach Braff em CC BY-SA 2.0 e a do Eleventh Doctor em CC BY-SA 3.0. urlFonte — Hugh Laurie no Wikimedia Commonshttps://commons.wikimedia.org/wiki/File:Hugh_Laurie_2009.jpg · urlFonte — Zach Braff no Wikimedia Commonshttps://commons.wikimedia.org/wiki/File:Zach_Braff_05a_(5417514932).jpg · urlFonte — Eleventh Doctor no Wikimedia Commonshttps://commons.wikimedia.org/wiki/File:Eleventh_Doctor.jpg · urlFonte — Dr. McCoy no Wikimedia Commonshttps://commons.wikimedia.org/wiki/File:DeForest_Kelley,_Dr._McCoy,_Star_Trek.jpg

> **Observação:** os nomes dos profissionais da clínica continuam sendo fictícios. As referências aos personagens são apenas um elemento visual/humorístico do projeto acadêmico.

## 📦 Entrega acadêmica

**Repositório:** https://github.com/Jota0404/proj-clinica-agendamento

**Vídeo de apresentação:** _preencher após publicação do vídeo_

**Projeto:** Projeto 03 — Sistema de Agendamento

**Responsável:** João Marcos de B. Fernandes
