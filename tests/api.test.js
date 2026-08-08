const fs = require('fs');
const os = require('os');
const path = require('path');

// --- ISOLAMENTO DOS TESTES ---
// Cria um diretório de dados temporário ANTES de importar o app, e aponta
// DATA_DIR para ele. Isso garante que a suíte nunca lê nem escreve no
// data/agendamentos.json commitado no repositório — eliminando o erro 409
// que ocorria no CI porque os testes tentavam recriar agendamentos que já
// existiam no JSON versionado.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clinica-test-'));

// Reaproveita os profissionais reais do projeto (necessários para as rotas
// validarem profissional_id), mas com uma cópia isolada do arquivo.
fs.copyFileSync(
  path.join(__dirname, '..', 'data', 'profissionais.json'),
  path.join(tmpDir, 'profissionais.json')
);
// Agendamentos sempre começam vazios em cada execução da suíte.
fs.writeFileSync(path.join(tmpDir, 'agendamentos.json'), '[]', 'utf-8');

process.env.DATA_DIR = tmpDir;

// Só agora importamos supertest/app, depois que DATA_DIR já está definido
// (server.js lê DATA_DIR no carregamento do módulo).
const request = require('supertest');
const app = require('../server');

// Gera CPFs únicos (11 dígitos) como segunda camada de proteção contra
// conflitos, mesmo que o diretório temporário já isole cada execução.
// Combina os últimos 7 dígitos do timestamp (variam a cada execução) com um
// contador de 4 dígitos (único dentro da própria execução) — sem usar slice
// após concatenar, para não truncar por acidente o dígito que diferencia.
let contadorCpf = 0;
function cpfUnico() {
  contadorCpf += 1;
  const base = String(Date.now()).slice(-7).padStart(7, '0');
  const sufixo = String(contadorCpf).padStart(4, '0');
  return base + sufixo;
}

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('🧪 Testes de Integração da API - Clínica Saúde & Vida', () => {
  // 1. LISTAGEM DE PROFISSIONAIS
  describe('GET /api/profissionais', () => {
    it('Deve retornar a lista de profissionais com status 200', async () => {
      const response = await request(app).get('/api/profissionais');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('Deve filtrar profissionais por especialidade', async () => {
      const response = await request(app).get('/api/profissionais?especialidade=Nutricao');
      expect(response.statusCode).toBe(200);
      expect(response.body.every((p) => p.especialidade.toLowerCase().includes('nutri'))).toBe(true);
    });
  });

  // 2. CRIAÇÃO DE AGENDAMENTOS
  describe('POST /api/agendamentos', () => {
    it('Deve criar um agendamento com sucesso (status 201)', async () => {
      const novoAgendamento = {
        nome_paciente: 'Carlos Eduardo',
        cpf: cpfUnico(),
        profissional_id: 1,
        data: '2026-09-15',
        horario: '14:00',
      };

      const response = await request(app).post('/api/agendamentos').send(novoAgendamento);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('mensagem');
      expect(response.body.agendamento).toHaveProperty('id');
    });

    it('Deve retornar 409 ao tentar agendar o mesmo profissional/data/horário duas vezes', async () => {
      const agendamento = {
        nome_paciente: 'Paciente Duplicado',
        cpf: cpfUnico(),
        profissional_id: 2,
        data: '2026-09-17',
        horario: '09:00',
      };

      const primeira = await request(app).post('/api/agendamentos').send(agendamento);
      expect(primeira.statusCode).toBe(201);

      const segunda = await request(app)
        .post('/api/agendamentos')
        .send({ ...agendamento, cpf: cpfUnico(), nome_paciente: 'Outro Paciente' });

      expect(segunda.statusCode).toBe(409);
    });

    it('Deve retornar 400 se faltarem campos obrigatórios', async () => {
      const agendamentoIncompleto = { nome_paciente: 'Carlos Eduardo' };
      const response = await request(app).post('/api/agendamentos').send(agendamentoIncompleto);
      expect(response.statusCode).toBe(400);
    });

    it('Deve retornar 400 para CPF com quantidade errada de dígitos', async () => {
      const response = await request(app).post('/api/agendamentos').send({
        nome_paciente: 'Paciente Invalido',
        cpf: '123',
        profissional_id: 1,
        data: '2026-09-16',
        horario: '08:00',
      });
      expect(response.statusCode).toBe(400);
    });

    it('Deve retornar 404 para profissional inexistente', async () => {
      const response = await request(app).post('/api/agendamentos').send({
        nome_paciente: 'Paciente Sem Profissional',
        cpf: cpfUnico(),
        profissional_id: 9999,
        data: '2026-09-16',
        horario: '08:00',
      });
      expect(response.statusCode).toBe(404);
    });
  });

  // 3. BUSCA DE AGENDAMENTOS POR CPF
  describe('GET /api/agendamentos/:cpf', () => {
    it('Deve retornar os agendamentos de um paciente pelo CPF', async () => {
      const cpf = cpfUnico();
      await request(app).post('/api/agendamentos').send({
        nome_paciente: 'Paciente Busca',
        cpf,
        profissional_id: 3,
        data: '2026-09-16',
        horario: '07:30',
      });

      const response = await request(app).get(`/api/agendamentos/${cpf}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].cpf).toBe(cpf);
    });

    it('Deve retornar 400 para CPF inválido na busca', async () => {
      const response = await request(app).get('/api/agendamentos/123');
      expect(response.statusCode).toBe(400);
    });
  });

  // 4. CANCELAMENTO DE AGENDAMENTOS
  describe('DELETE /api/agendamentos/:id', () => {
    let agendamentoId;

    beforeEach(async () => {
      const res = await request(app).post('/api/agendamentos').send({
        nome_paciente: 'Paciente Temporario',
        cpf: cpfUnico(),
        profissional_id: 4,
        data: '2026-09-18',
        horario: '10:00',
      });
      agendamentoId = res.body.agendamento.id;
    });

    it('Deve cancelar/deletar um agendamento com sucesso', async () => {
      const response = await request(app).delete(`/api/agendamentos/${agendamentoId}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.agendamento.id).toBe(agendamentoId);
    });

    it('Deve retornar 404 ao tentar deletar um agendamento inexistente', async () => {
      const response = await request(app).delete('/api/agendamentos/id-que-nao-existe');
      expect(response.statusCode).toBe(404);
    });
  });
});