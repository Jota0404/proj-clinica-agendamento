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

// Caminhos dos arquivos de dados.
// DATA_DIR é configurável via variável de ambiente: em produção usa a pasta
// 'data' real; nos testes, a suíte aponta para um diretório temporário
// isolado, garantindo que os testes nunca leiam/escrevam no JSON commitado.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PATH_PROFISSIONAIS = path.join(DATA_DIR, 'profissionais.json');
const PATH_AGENDAMENTOS = path.join(DATA_DIR, 'agendamentos.json');

// --- FUNÇÕES AUXILIARES DE LEITURA E ESCRITA ---

async function lerJson(caminhoArquivo) {
  try {
    const data = await fs.readFile(caminhoArquivo, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Arquivo ainda não existe: estado inicial válido, começa vazio.
      return [];
    }
    // Qualquer outro erro (JSON corrompido, permissão, etc.) não deve ser
    // engolido silenciosamente — isso mascara bugs reais.
    console.error(`Falha ao ler ${caminhoArquivo}:`, error);
    throw error;
  }
}

async function salvarJson(caminhoArquivo, conteudo) {
  await fs.writeFile(caminhoArquivo, JSON.stringify(conteudo, null, 2), 'utf-8');
}

// Fila de escrita por arquivo: como lerJson/salvarJson fazem um ciclo
// leitura -> verificação -> escrita que não é atômico, duas requisições
// concorrentes (ex.: dois POSTs simultâneos para o mesmo horário) podiam
// ambas passar pela checagem de conflito antes de qualquer uma escrever,
// resultando em agendamento duplicado. Isso serializa as operações de
// escrita por arquivo, sem bloquear leituras de outros arquivos.
const filasDeEscrita = new Map();

function comFilaDeEscrita(caminhoArquivo, tarefa) {
  const filaAnterior = filasDeEscrita.get(caminhoArquivo) || Promise.resolve();
  const proximaTarefa = filaAnterior.then(tarefa, tarefa);
  // Evita acúmulo de handlers de rejeição não tratados na fila em si;
  // o erro real ainda é propagado para quem chamou comFilaDeEscrita.
  filasDeEscrita.set(caminhoArquivo, proximaTarefa.catch(() => {}));
  return proximaTarefa;
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
    console.error('Erro ao buscar profissionais:', error);
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
    console.error('Erro ao buscar agendamentos do paciente:', error);
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

    // Lê, checa conflito e escreve dentro da fila do arquivo: isso garante
    // que duas requisições concorrentes para o mesmo profissional/data/horário
    // não passem ambas pela checagem antes de qualquer uma salvar.
    const resultado = await comFilaDeEscrita(PATH_AGENDAMENTOS, async () => {
      const agendamentos = await lerJson(PATH_AGENDAMENTOS);

      const conflito = agendamentos.find(
        (a) =>
          a.profissional_id === Number(profissional_id) &&
          a.data === data &&
          a.horario === horario
      );

      if (conflito) {
        return { conflito: true };
      }

      const novoAgendamento = {
        id: `agd-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
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

      return { conflito: false, agendamento: novoAgendamento };
    });

    if (resultado.conflito) {
      return res.status(409).json({
        erro: 'Este profissional já possui uma consulta marcada para este dia e horário.',
      });
    }

    return res.status(201).json({
      mensagem: 'Agendamento realizado com sucesso!',
      agendamento: resultado.agendamento,
    });
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
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

    const resultado = await comFilaDeEscrita(PATH_AGENDAMENTOS, async () => {
      const agendamentos = await lerJson(PATH_AGENDAMENTOS);
      const indice = agendamentos.findIndex((a) => a.id === id);

      if (indice === -1) {
        return { encontrado: false };
      }

      const [agendamentoRemovido] = agendamentos.splice(indice, 1);
      await salvarJson(PATH_AGENDAMENTOS, agendamentos);

      return { encontrado: true, agendamento: agendamentoRemovido };
    });

    if (!resultado.encontrado) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    return res.json({
      mensagem: 'Agendamento cancelado com sucesso!',
      agendamento: resultado.agendamento,
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return res.status(500).json({ erro: 'Erro ao cancelar agendamento.' });
  }
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Error handler global: rede de segurança para erros que não passam pelos
// try/catch das rotas (ex.: JSON malformado no corpo da requisição,
// interceptado pelo middleware express.json() antes de chegar às rotas).
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// Inicialização do Servidor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔗 Acesse: http://localhost:${PORT}`);
  });
}

module.exports = app;