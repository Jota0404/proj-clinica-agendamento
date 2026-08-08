// URL base da API (como o frontend é servido pela própria API, usamos caminho relativo)
const API_URL = '/api';

// Elementos Globais do DOM
let profissionaisCache = [];

document.addEventListener('DOMContentLoaded', () => {
  // Inicialização da página
  carregarProfissionais();

  // Listeners dos formulários e filtros
  document.getElementById('form-filtro')?.addEventListener('submit', filtrarProfissionais);
  document.getElementById('select-profissional')?.addEventListener('change', atualizarHorariosEDatas);
  document.getElementById('form-agendamento')?.addEventListener('submit', criarAgendamento);
  document.getElementById('form-consulta-cpf')?.addEventListener('submit', buscarConsultasPorCPF);
});

// ==========================================
// 1. LISTAGEM E FILTRO DE PROFISSIONAIS
// ==========================================

async function carregarProfissionais(especialidade = '', nome = '') {
  const container = document.getElementById('lista-profissionais');
  const selectProfissional = document.getElementById('select-profissional');

  try {
    const queryParams = new URLSearchParams();
    if (especialidade) queryParams.append('especialidade', especialidade);
    if (nome) queryParams.append('nome', nome);

    const res = await fetch(`${API_URL}/profissionais?${queryParams.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar dados dos profissionais.');

    const profissionais = await res.json();
    profissionaisCache = profissionais; // Guarda em cache local para agilizar montagem de datas/horários

    // Renderizar Cards de Profissionais na tela
    if (container) {
      if (profissionais.length === 0) {
        container.innerHTML = '<p class="alerta">Nenhum profissional encontrado com os filtros informados.</p>';
      } else {
        container.innerHTML = profissionais.map(p => `
          <div class="card-profissional">
            <img src="${p.foto}" alt="${p.nome}">
            <h3>${p.nome}</h3>
            <span class="badge">${p.especialidade}</span>
            <p class="registro"><strong>Registro:</strong> ${p.registro}</p>
            <p class="bio">${p.bio}</p>
          </div>
        `).join('');
      }
    }

    // Preencher o <select> de profissionais no formulário de agendamento
    if (selectProfissional) {
      selectProfissional.innerHTML = '<option value="">-- Selecione um profissional --</option>' +
        profissionais.map(p => `<option value="${p.id}">${p.nome} (${p.especialidade})</option>`).join('');
    }

  } catch (error) {
    console.error(error);
    if (container) {
      container.innerHTML = '<p class="erro">Falha ao carregar a lista de profissionais.</p>';
    }
  }
}

function filtrarProfissionais(event) {
  event.preventDefault();
  const especialidade = document.getElementById('filtro-especialidade')?.value || '';
  const nome = document.getElementById('filtro-nome')?.value || '';
  carregarProfissionais(especialidade, nome);
}

// ==========================================
// 2. FORMULÁRIO DE AGENDAMENTO DINÂMICO
// ==========================================

function atualizarHorariosEDatas() {
  const profissionalId = Number(document.getElementById('select-profissional').value);
  const selectData = document.getElementById('select-data');
  const selectHorario = document.getElementById('select-horario');

  selectData.innerHTML = '<option value="">-- Selecione a data --</option>';
  selectHorario.innerHTML = '<option value="">-- Selecione o horário --</option>';

  if (!profissionalId) return;

  const profissional = profissionaisCache.find(p => p.id === profissionalId);
  if (!profissional) return;

  // Preenche as datas disponíveis
  profissional.dias_disponiveis.forEach(data => {
    const option = document.createElement('option');
    option.value = data;
    // Formata YYYY-MM-DD para DD/MM/YYYY na exibição
    const [ano, mes, dia] = data.split('-');
    option.textContent = `${dia}/${mes}/${ano}`;
    selectData.appendChild(option);
  });

  // Preenche os horários disponíveis
  profissional.horarios_disponiveis.forEach(horario => {
    const option = document.createElement('option');
    option.value = horario;
    option.textContent = horario;
    selectHorario.appendChild(option);
  });
}

async function criarAgendamento(event) {
  event.preventDefault();

  const msgBox = document.getElementById('mensagem-agendamento');
  msgBox.className = 'mensagem';
  msgBox.textContent = 'Processando agendamento...';

  const payload = {
    nome_paciente: document.getElementById('input-nome').value.trim(),
    cpf: document.getElementById('input-cpf').value.trim(),
    profissional_id: Number(document.getElementById('select-profissional').value),
    data: document.getElementById('select-data').value,
    horario: document.getElementById('select-horario').value
  };

  try {
    const res = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      msgBox.className = 'mensagem erro';
      msgBox.textContent = data.erro || 'Não foi possível realizar o agendamento.';
      return;
    }

    msgBox.className = 'mensagem sucesso';
    msgBox.textContent = '✅ ' + data.mensagem;
    document.getElementById('form-agendamento').reset();

  } catch (error) {
    console.error(error);
    msgBox.className = 'mensagem erro';
    msgBox.textContent = 'Erro de conexão com o servidor.';
  }
}

// ==========================================
// 3. CONSULTA E CANCELAMENTO POR CPF
// ==========================================

async function buscarConsultasPorCPF(event) {
  event.preventDefault();

  const cpf = document.getElementById('input-busca-cpf').value.trim();
  const container = document.getElementById('resultado-consultas');

  container.innerHTML = '<p>Buscando agendamentos...</p>';

  try {
    const res = await fetch(`${API_URL}/agendamentos/${cpf}`);
    const data = await res.json();

    if (!res.ok) {
      container.innerHTML = `<p class="erro">${data.erro || 'Erro ao consultar CPF.'}</p>`;
      return;
    }

    if (data.length === 0) {
      container.innerHTML = '<p class="alerta">Nenhuma consulta agendada encontrada para este CPF.</p>';
      return;
    }

    container.innerHTML = data.map(agd => {
      const [ano, mes, dia] = agd.data.split('-');
      return `
        <div class="card-agendamento">
          <div class="info">
            <h4>${agd.especialidade}</h4>
            <p><strong>Médico(a):</strong> ${agd.nome_profissional}</p>
            <p><strong>Paciente:</strong> ${agd.nome_paciente}</p>
            <p><strong>Data:</strong> ${dia}/${mes}/${ano} às <strong>${agd.horario}</strong></p>
          </div>
          <button class="btn-cancelar" onclick="cancelarAgendamento('${agd.id}')">
            Cancelar Agendamento
          </button>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="erro">Erro ao conectar com o servidor para buscar agendamentos.</p>';
  }
}

async function cancelarAgendamento(idAgendamento) {
  if (!confirm('Tem certeza de que deseja cancelar esta consulta?')) return;

  try {
    const res = await fetch(`${API_URL}/agendamentos/${idAgendamento}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.erro || 'Erro ao cancelar o agendamento.');
      return;
    }

    alert('✅ Agendamento cancelado com sucesso!');
    // Reexecuta a busca para atualizar a lista na tela
    document.getElementById('form-consulta-cpf').dispatchEvent(new Event('submit'));

  } catch (error) {
    console.error(error);
    alert('Erro de conexão ao tentar cancelar o agendamento.');
  }
}