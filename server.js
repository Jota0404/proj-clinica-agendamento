const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos do frontend da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Caminhos dos arquivos de dados
const PATH_PROFISSIONAIS = path.join(__dirname, 'data', 'profissionais.json');
const PATH_AGENDAMENTOS = path.join(__dirname, 'data', 'agendamentos.json');

// --- FUNÇÕES AUXILIARES DE LEITURA E ESCRITA ---

async function lerJson(caminhoArquivo) {
  try {
    const data = await fs.readFile(caminhoArquivo, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Se o arquivo não existir ou falhar a leitura, retorna array vazio
    return [];
  }
}

async function salvarJson(caminhoArquivo, conteudo) {
  await fs.writeFile(caminhoArquivo, JSON.stringify(conteudo, null, 2), 'utf-8');
}

// Limpa caracteres especiais mantendo apenas números no CPF
function limparCPF(cpf) {
  return String(cpf).replace(/\D/g, '');
}

// --- ROTAS DA API ---

/**
 * GET /api/profissionais
 * Retorna todos os profissionais ou filtra por especialidade e/ou nome
 * Exemplo de consulta: /api/profissionais?especialidade=Nutricao&nome=Ana
 */
app.get('/api/profissionais', async (req, res) => {
  try {
    const { especialidade, nome } = req.query;
    let profissionais = await lerJson(PATH_PROFISSIONAIS);

    if (especialidade) {
      profissionais = profissionais.filter((p) =>
        p.especialidade.toLowerCase().includes(especialidade.toLowerCase())
      );
    }

    if (nome) {
      profissionais = profissionais.filter((p) =>
        p.nome.toLowerCase().includes(nome.toLowerCase())
      );
    }

    return res.json(profissionais);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar profissionais.' });
  }
});

/**
 * GET /api/agendamentos/:cpf
 * Busca agendamentos de um paciente pelo CPF
 */
app.get('/api/agendamentos/:cpf', async (req, res) => {
  try {
    const cpfBusca = limparCPF(req.params.cpf);

    if (!cpfBusca || cpfBusca.length !== 11) {
      return res.status(400).json({ erro: 'CPF inválido. Forneça 11 dígitos numéricos.' });
    }

    const agendamentos = await lerJson(PATH_AGENDAMENTOS);
    const agendamentosPaciente = agendamentos.filter(
      (a) => limparCPF(a.cpf) === cpfBusca
    );

    return res.json(agendamentosPaciente);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar agendamentos do paciente.' });
  }
});

/**
 * POST /api/agendamentos
 * Cria um novo agendamento e salva no agendamentos.json
 * Body esperado: { nome_paciente, cpf, profissional_id, data, horario }
 */
app.post('/api/agendamentos', async (req, res) => {
  try {
    const { nome_paciente, cpf, profissional_id, data, horario } = req.body;

    // Validação de campos obrigatórios
    if (!nome_paciente || !cpf || !profissional_id || !data || !horario) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    const cpfLimpo = limparCPF(cpf);
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ erro: 'CPF deve conter exatamente 11 dígitos numéricos.' });
    }

    // Verificar se o profissional existe
    const profissionais = await lerJson(PATH_PROFISSIONAIS);
    const profissional = profissionais.find((p) => p.id === Number(profissional_id));

    if (!profissional) {
      return res.status(404).json({ erro: 'Profissional não encontrado.' });
    }

    // Buscar agendamentos existentes para checar conflitos
    const agendamentos = await lerJson(PATH_AGENDAMENTOS);

    const conflito = agendamentos.find(
      (a) =>
        a.profissional_id === Number(profissional_id) &&
        a.data === data &&
        a.horario === horario
    );

    if (conflito) {
      return res.status(409).json({
        erro: 'Este profissional já possui uma consulta marcada para este dia e horário.',
      });
    }

    // Criar objeto do novo agendamento
    const novoAgendamento = {
      id: `agd-${Date.now()}`,
      nome_paciente: nome_paciente.trim(),
      cpf: cpfLimpo,
      profissional_id: profissional.id,
      nome_profissional: profissional.nome,
      especialidade: profissional.especialidade,
      data,
      horario,
      criado_em: new Date().toISOString(),
    };

    agendamentos.push(novoAgendamento);
    await salvarJson(PATH_AGENDAMENTOS, agendamentos);

    return res.status(201).json({
      mensagem: 'Agendamento realizado com sucesso!',
      agendamento: novoAgendamento,
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao salvar agendamento.' });
  }
});

/**
 * DELETE /api/agendamentos/:id
 * Cancela e remove um agendamento do agendamentos.json pelo ID
 */
app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agendamentos = await lerJson(PATH_AGENDAMENTOS);

    const indice = agendamentos.findIndex((a) => a.id === id);

    if (indice === -1) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    // Remove o agendamento da lista
    const [agendamentoRemovido] = agendamentos.splice(indice, 1);
    await salvarJson(PATH_AGENDAMENTOS, agendamentos);

    return res.json({
      mensagem: 'Agendamento cancelado com sucesso!',
      agendamento: agendamentoRemovido,
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao cancelar agendamento.' });
  }
});

// Inicialização do Servidor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔗 Acesse: http://localhost:${PORT}`);
  });
}

module.exports = app;