const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PATH_PROFISSIONAIS = path.join(DATA_DIR, 'profissionais.json');
const PATH_AGENDAMENTOS = path.join(DATA_DIR, 'agendamentos.json');

async function lerJson(caminhoArquivo) {
  try { return JSON.parse(await fs.readFile(caminhoArquivo, 'utf-8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
async function salvarJson(caminhoArquivo, conteudo) { await fs.writeFile(caminhoArquivo, JSON.stringify(conteudo, null, 2), 'utf-8'); }
const filasDeEscrita = new Map();
function comFilaDeEscrita(caminhoArquivo, tarefa) {
  const anterior = filasDeEscrita.get(caminhoArquivo) || Promise.resolve();
  const atual = anterior.then(tarefa, tarefa);
  filasDeEscrita.set(caminhoArquivo, atual.catch(() => {}));
  return atual;
}
function limparCPF(cpf) { return String(cpf).replace(/\D/g, ''); }
function especialidadesUnicas(profissionais) { return [...new Set(profissionais.map(p => p.especialidade))].sort((a,b) => a.localeCompare(b, 'pt-BR')); }
function horariosDisponiveisPara(profissional, data, agendamentos) {
  if (!profissional.dias_disponiveis.includes(data)) return [];
  const ocupados = new Set(agendamentos.filter(a => a.profissional_id === profissional.id && a.data === data).map(a => a.horario));
  return profissional.horarios_disponiveis.filter(h => !ocupados.has(h));
}

app.get('/health', (req, res) => res.json({ status: 'ok', servico: 'clinica-agendamento' }));

app.get('/api/especialidades', async (req, res) => {
  try { return res.json(especialidadesUnicas(await lerJson(PATH_PROFISSIONAIS))); }
  catch (error) { console.error(error); return res.status(500).json({ erro: 'Erro ao buscar especialidades.' }); }
});

app.get('/api/profissionais', async (req, res) => {
  try {
    const { especialidade, nome } = req.query;
    let profissionais = await lerJson(PATH_PROFISSIONAIS);
    if (especialidade) profissionais = profissionais.filter(p => p.especialidade.toLowerCase().includes(String(especialidade).toLowerCase()));
    if (nome) profissionais = profissionais.filter(p => p.nome.toLowerCase().includes(String(nome).toLowerCase()));
    return res.json(profissionais);
  } catch (error) { console.error(error); return res.status(500).json({ erro: 'Erro ao buscar profissionais.' }); }
});

app.get('/api/disponibilidade', async (req, res) => {
  try {
    const { profissional_id: profissionalId, data } = req.query;
    if (!profissionalId || !data) return res.status(400).json({ erro: 'Informe profissional_id e data.' });
    const profissionais = await lerJson(PATH_PROFISSIONAIS);
    const profissional = profissionais.find(p => p.id === Number(profissionalId));
    if (!profissional) return res.status(404).json({ erro: 'Profissional não encontrado.' });
    const agendamentos = await lerJson(PATH_AGENDAMENTOS);
    return res.json({ profissional_id: profissional.id, profissional: profissional.nome, data, horarios: horariosDisponiveisPara(profissional, data, agendamentos) });
  } catch (error) { console.error(error); return res.status(500).json({ erro: 'Erro ao buscar disponibilidade.' }); }
});

app.get('/api/agendamentos/:cpf', async (req, res) => {
  try {
    const cpfBusca = limparCPF(req.params.cpf);
    if (cpfBusca.length !== 11) return res.status(400).json({ erro: 'CPF inválido. Forneça 11 dígitos numéricos.' });
    const agendamentos = await lerJson(PATH_AGENDAMENTOS);
    return res.json(agendamentos.filter(a => limparCPF(a.cpf) === cpfBusca));
  } catch (error) { console.error(error); return res.status(500).json({ erro: 'Erro ao buscar agendamentos do paciente.' }); }
});

app.post('/api/agendamentos', async (req, res) => {
  try {
    const { nome_paciente, cpf, profissional_id, data, horario } = req.body;
    if (!nome_paciente || !cpf || !profissional_id || !data || !horario) return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    const nomePaciente = String(nome_paciente).trim();
    if (nomePaciente.length < 3) return res.status(400).json({ erro: 'Informe um nome de paciente válido.' });
    const cpfLimpo = limparCPF(cpf);
    if (cpfLimpo.length !== 11) return res.status(400).json({ erro: 'CPF deve conter exatamente 11 dígitos numéricos.' });
    const profissionais = await lerJson(PATH_PROFISSIONAIS);
    const profissional = profissionais.find(p => p.id === Number(profissional_id));
    if (!profissional) return res.status(404).json({ erro: 'Profissional não encontrado.' });
    const resultado = await comFilaDeEscrita(PATH_AGENDAMENTOS, async () => {
      const agendamentos = await lerJson(PATH_AGENDAMENTOS);
      if (!profissional.dias_disponiveis.includes(data)) return { indisponivel: true, motivo: 'data' };
      if (!profissional.horarios_disponiveis.includes(horario)) return { indisponivel: true, motivo: 'horario' };
      if (agendamentos.some(a => a.profissional_id === profissional.id && a.data === data && a.horario === horario)) return { conflito: true };
      const agendamento = { id: `agd-${Date.now()}-${Math.round(Math.random() * 1e6)}`, nome_paciente: nomePaciente, cpf: cpfLimpo, profissional_id: profissional.id, nome_profissional: profissional.nome, especialidade: profissional.especialidade, data, horario, criado_em: new Date().toISOString() };
      agendamentos.push(agendamento); await salvarJson(PATH_AGENDAMENTOS, agendamentos); return { agendamento };
    });
    if (resultado.indisponivel) return res.status(400).json({ erro: resultado.motivo === 'data' ? 'A data selecionada não está disponível para este profissional.' : 'O horário selecionado não está disponível para este profissional.' });
    if (resultado.conflito) return res.status(409).json({ erro: 'Este profissional já possui uma consulta marcada para este dia e horário.' });
    return res.status(201).json({ mensagem: 'Agendamento realizado com sucesso!', agendamento: resultado.agendamento });
  } catch (error) { console.error(error); return res.status(500).json({ erro: 'Erro ao salvar agendamento.' }); }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    const resultado = await comFilaDeEscrita(PATH_AGENDAMENTOS, async () => {
      const agendamentos = await lerJson(PATH_AGENDAMENTOS); const indice = agendamentos.findIndex(a => a.id === req.params.id);
      if (indice === -1) return { encontrado: false }; const [agendamento] = agendamentos.splice(indice, 1); await salvarJson(PATH_AGENDAMENTOS, agendamentos); return { encontrado: true, agendamento };
    });
    if (!resultado.encontrado) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    return res.json({ mensagem: 'Agendamento cancelado com sucesso!', agendamento: resultado.agendamento });
  } catch (error) { console.error(error); return res.status(500).json({ erro: 'Erro ao cancelar agendamento.' }); }
});

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ erro: 'Erro interno do servidor.' }); });

if (require.main === module) app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
module.exports = app;
