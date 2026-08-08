const request = require('supertest');
const app = require('../server'); // <-- Aponta para o server.js na raiz

describe('🧪 Testes de Integração da API', () => {
  it('GET /api/profissionais - Deve retornar a lista de profissionais', async () => {
    const response = await request(app).get('/api/profissionais');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});