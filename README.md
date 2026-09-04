# 🏥 Clínica Saúde & Vida — Sistema de Agendamento

Sistema web full-stack desenvolvido para o **Projeto 03 — Sistema de Agendamento**. Permite consultar profissionais, escolher especialidade, profissional, data e horário, realizar agendamentos, consultar compromissos por CPF e cancelar agendamentos.

## 🎯 Requisitos do Projeto 03

- Escolha da especialidade e do profissional.
- Exibição das datas disponíveis por profissional.
- Exibição dos horários disponíveis para a data escolhida.
- Formulário com nome e CPF do paciente.
- Persistência local em arquivo JSON.
- Consulta de agendamentos por CPF.
- Cancelamento de agendamento.
- Bloqueio de conflito de profissional/data/horário.
- API REST para especialidades, profissionais, disponibilidade e agendamentos.
- Filtro de profissionais por especialidade e busca por nome.

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

Acesse `http://localhost:3000` no navegador.

### 🧪 Testes

```bash
npm test
```

A suíte cobre especialidades, filtros de profissionais, disponibilidade, criação, validações, conflito, consulta por CPF e cancelamento.

## 🔌 Endpoints principais

| Método | Endpoint | Função |
|---|---|---|
| GET | `/health` | Verifica se o servidor está funcionando |
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
│   └── api.test.js
├── package.json
├── package-lock.json
└── server.js
```

## 🩺 Detalhe divertido — médicos da ficção

Os profissionais fictícios receberam avatares inspirados em médicos/personagens famosos da ficção: **Dr. House**, **J.D. de *Scrubs***, **The Eleventh Doctor de *Doctor Who*** e **Dr. McCoy de *Star Trek***. As imagens são carregadas a partir do Wikimedia Commons, em vez de serem copiadas para o repositório.

As páginas das imagens informam as respectivas condições de reutilização: Hugh Laurie possui arquivo sob **CC BY 2.0**; Zach Braff, sob **CC BY-SA 2.0**; The Eleventh Doctor, sob **CC BY-SA 3.0**; e a fotografia de DeForest Kelley como Dr. McCoy está indicada no Commons como **domínio público nos EUA por ausência de aviso de copyright**. urlHugh Laurie — Wikimedia Commonshttps://commons.wikimedia.org/wiki/File:Hugh_Laurie_2009.jpg · urlZach Braff — Wikimedia Commonshttps://commons.wikimedia.org/wiki/File:Zach_Braff_05a_(5417514932).jpg · urlThe Eleventh Doctor — Wikimedia Commonshttps://commons.wikimedia.org/wiki/File:Eleventh_Doctor.jpg · urlDr. McCoy — Wikimedia Commonshttps://commons.wikimedia.org/wiki/File:DeForest_Kelley,_Dr._McCoy,_Star_Trek.jpg

> **Observação acadêmica:** os nomes, registros, biografias e disponibilidades da clínica são fictícios. As referências aos personagens são apenas um elemento visual/humorístico. As imagens continuam hospedadas externamente conforme as condições das fontes indicadas.

## 📦 Entrega acadêmica

**Repositório:** https://github.com/Jota0404/proj-clinica-agendamento

**Vídeo de apresentação:** _preencher após publicação do vídeo_

**Projeto:** Projeto 03 — Sistema de Agendamento

**Responsável:** João Marcos de B. Fernandes
