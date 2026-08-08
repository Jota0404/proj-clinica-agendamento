const request = require('supertest');
const app = require('../server');

describe('🧪 Testes de Integração da API - Clínica Saúde & Vida', () => {

  // 1. LISTAGEM DE PROFISSIONAIS
  describe('GET /api/profissionais', () => {
    it('Deve retornar a lista de profissionais com status 200', async () => {
      const response = await request(app).get('/api/profissionais');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // 2. CRIAÇÃO DE AGENDAMENTOS
  describe('POST /api/agendamentos', () => {
    it('Deve criar um agendamento com sucesso (status 200 ou 201)', async () => {
      const novoAgendamento = {
        nome_paciente: "Carlos Eduardo",
        cpf: "12345678900",
        profissional_id: 1,
        data: "2026-09-15",
        horario: "14:00"
      };

      const response = await request(app)
        .post('/api/agendamentos')
        .send(novoAgendamento);

      expect([200, 201]).toContain(response.statusCode);
      expect(response.body).toHaveProperty('mensagem');
    });

    it('Deve retornar status 400 se faltarem campos obrigatórios', async () => {
      const agendamentoIncompleto = {
        nome_paciente: "Carlos Eduardo" // Faltam CPF, data, etc.
      };

      const response = await request(app)
        .post('/api/agendamentos')
        .send(agendamentoIncompleto);

      expect(response.statusCode).toBe(400);
    });
  });

  // 3. CANCELAMENTO DE AGENDAMENTOS
  describe('DELETE /api/agendamentos', () => {
    let agendamentoId;

    // Cria um agendamento temporário antes do teste para ter certeza de que há algo para deletar
    beforeEach(async () => {
      const res = await request(app).post('/api/agendamentos').send({
        nome_paciente: "Paciente Temporario",
        cpf: "00000000000",
        profissional_id: 1,
        data: "2026-09-20",
        horario: "10:00"
      });

      // Extrai o ID gerado (ou CPF, dependendo de como sua rota exige)
      agendamentoId = res.body.agendamento?.id || res.body.id || "00000000000";
    });

    it('Deve cancelar/deletar um agendamento com sucesso', async () => {
      const response = await request(app).delete(`/api/agendamentos/${agendamentoId}`);
      expect([200, 204]).toContain(response.statusCode);
    });
  });

});