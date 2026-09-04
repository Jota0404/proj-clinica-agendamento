const API_URL = '/api';
let profissionaisCache = [];

function obterIniciais(nomeCompleto) {
  const nomeLimpo = nomeCompleto.replace(/^(Dr\.|Dra\.)\s*/i, '').trim();
  const partes = nomeLimpo.split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  return ((partes[0][0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

function formatarCPF(valor) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return numeros.replace(/(\d{3})(\d+)/, '$1.$2');
  if (numeros.length <= 9) return numeros.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
function obterCPFNumerico(valor) { return valor.replace(/\D/g, ''); }

document.addEventListener('DOMContentLoaded', () => {
  carregarEspecialidades(); carregarProfissionais();
  document.getElementById('form-filtro')?.addEventListener('submit', filtrarProfissionais);
  document.getElementById('select-especialidade')?.addEventListener('change', carregarProfissionaisDoAgendamento);
  document.getElementById('select-profissional')?.addEventListener('change', atualizarDatas);
  document.getElementById('select-data')?.addEventListener('change', atualizarHorarios);
  document.getElementById('form-agendamento')?.addEventListener('submit', criarAgendamento);
  document.getElementById('form-consulta-cpf')?.addEventListener('submit', buscarConsultasPorCPF);
  ['input-cpf', 'input-busca-cpf'].forEach(id => document.getElementById(id)?.addEventListener('input', e => e.target.value = formatarCPF(e.target.value)));
});

async function carregarEspecialidades() {
  const select = document.getElementById('select-especialidade'); if (!select) return;
  try {
    const res = await fetch(API_URL + '/especialidades'); if (!res.ok) throw new Error();
    const especialidades = await res.json();
    select.innerHTML = '<option value="">-- Selecione uma especialidade --</option>' + especialidades.map(e => '<option value="' + e + '">' + e + '</option>').join('');
  } catch { select.innerHTML = '<option value="">Não foi possível carregar as especialidades</option>'; }
}

async function carregarProfissionais(especialidade = '', nome = '') {
  const container = document.getElementById('lista-profissionais');
  try {
    const params = new URLSearchParams(); if (especialidade) params.append('especialidade', especialidade); if (nome) params.append('nome', nome);
    const res = await fetch(API_URL + '/profissionais?' + params.toString()); if (!res.ok) throw new Error();
    profissionaisCache = await res.json();
    if (container) container.innerHTML = profissionaisCache.length ? profissionaisCache.map(p => '<div class="card-profissional"><div class="avatar"><img src="' + p.foto + '" alt="' + p.nome + '" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';"><div class="avatar-fallback">' + obterIniciais(p.nome) + '</div></div><h3>' + p.nome + '</h3><span class="badge">' + p.especialidade + '</span><p class="registro"><strong>Registro:</strong> ' + p.registro + '</p><p class="referencia-ficticia">🎬 Referência: ' + p.referencia_ficticia + '</p><p class="bio">' + p.bio + '</p></div>').join('') : '<p class="alerta">Nenhum profissional encontrado com os filtros informados.</p>';
  } catch (error) { console.error(error); if (container) container.innerHTML = '<p class="erro">Falha ao carregar a lista de profissionais.</p>'; }
}

function filtrarProfissionais(event) { event.preventDefault(); carregarProfissionais(document.getElementById('filtro-especialidade')?.value.trim() || '', document.getElementById('filtro-nome')?.value.trim() || ''); }

function carregarProfissionaisDoAgendamento() {
  const especialidade = document.getElementById('select-especialidade').value, selectProfissional = document.getElementById('select-profissional'), selectData = document.getElementById('select-data'), selectHorario = document.getElementById('select-horario');
  selectProfissional.innerHTML = '<option value="">-- Selecione o profissional --</option>'; selectData.innerHTML = '<option value="">-- Selecione o profissional primeiro --</option>'; selectHorario.innerHTML = '<option value="">-- Selecione a data primeiro --</option>';
  selectProfissional.disabled = true; selectData.disabled = true; selectHorario.disabled = true; if (!especialidade) return;
  const profissionais = profissionaisCache.filter(p => p.especialidade === especialidade);
  selectProfissional.innerHTML += profissionais.map(p => '<option value="' + p.id + '">' + p.nome + '</option>').join(''); selectProfissional.disabled = !profissionais.length;
}

function atualizarDatas() {
  const id = Number(document.getElementById('select-profissional').value), selectData = document.getElementById('select-data'), selectHorario = document.getElementById('select-horario');
  selectData.innerHTML = '<option value="">-- Selecione a data --</option>'; selectHorario.innerHTML = '<option value="">-- Selecione a data primeiro --</option>'; selectData.disabled = true; selectHorario.disabled = true;
  const profissional = profissionaisCache.find(p => p.id === id); if (!profissional) return;
  profissional.dias_disponiveis.forEach(data => { const partes = data.split('-'), option = document.createElement('option'); option.value = data; option.textContent = partes[2] + '/' + partes[1] + '/' + partes[0]; selectData.appendChild(option); });
  selectData.disabled = false;
}

async function atualizarHorarios() {
  const id = Number(document.getElementById('select-profissional').value), data = document.getElementById('select-data').value, selectHorario = document.getElementById('select-horario');
  selectHorario.innerHTML = '<option value="">Carregando horários...</option>'; selectHorario.disabled = true; if (!id || !data) return;
  try {
    const res = await fetch(API_URL + '/disponibilidade?profissional_id=' + id + '&data=' + encodeURIComponent(data)); if (!res.ok) throw new Error();
    const resultado = await res.json(); selectHorario.innerHTML = '<option value="">-- Selecione o horário --</option>' + resultado.horarios.map(h => '<option value="' + h + '">' + h + '</option>').join('');
    if (!resultado.horarios.length) { selectHorario.innerHTML = '<option value="">Nenhum horário disponível</option>'; return; } selectHorario.disabled = false;
  } catch (error) { console.error(error); selectHorario.innerHTML = '<option value="">Erro ao carregar horários</option>'; }
}

async function criarAgendamento(event) {
  event.preventDefault(); const msgBox = document.getElementById('mensagem-agendamento'); msgBox.className = 'mensagem'; msgBox.textContent = 'Processando agendamento...';
  const payload = { nome_paciente: document.getElementById('input-nome').value.trim(), cpf: obterCPFNumerico(document.getElementById('input-cpf').value), profissional_id: Number(document.getElementById('select-profissional').value), data: document.getElementById('select-data').value, horario: document.getElementById('select-horario').value };
  try {
    const res = await fetch(API_URL + '/agendamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }), data = await res.json();
    if (!res.ok) { msgBox.className = 'mensagem erro'; msgBox.textContent = data.erro || 'Não foi possível realizar o agendamento.'; return; }
    msgBox.className = 'mensagem sucesso'; msgBox.textContent = '✅ ' + data.mensagem; document.getElementById('form-agendamento').reset(); carregarProfissionaisDoAgendamento();
  } catch (error) { console.error(error); msgBox.className = 'mensagem erro'; msgBox.textContent = 'Erro de conexão com o servidor.'; }
}

async function buscarConsultasPorCPF(event) {
  event.preventDefault(); const cpf = obterCPFNumerico(document.getElementById('input-busca-cpf').value), container = document.getElementById('resultado-consultas'); container.innerHTML = '<p>Buscando agendamentos...</p>';
  try {
    const res = await fetch(API_URL + '/agendamentos/' + cpf), data = await res.json();
    if (!res.ok) { container.innerHTML = '<p class="erro">' + (data.erro || 'Erro ao consultar CPF.') + '</p>'; return; }
    if (!data.length) { container.innerHTML = '<p class="alerta">Nenhuma consulta agendada encontrada para este CPF.</p>'; return; }
    container.innerHTML = data.map(agd => { const partes = agd.data.split('-'); return '<div class="card-agendamento"><div class="info"><h4>' + agd.especialidade + '</h4><p><strong>Profissional:</strong> ' + agd.nome_profissional + '</p><p><strong>Paciente:</strong> ' + agd.nome_paciente + '</p><p><strong>Data:</strong> ' + partes[2] + '/' + partes[1] + '/' + partes[0] + ' às <strong>' + agd.horario + '</strong></p></div><button class="btn-cancelar" onclick="cancelarAgendamento(\'' + agd.id + '\')">Cancelar Agendamento</button></div>'; }).join('');
  } catch (error) { console.error(error); container.innerHTML = '<p class="erro">Erro ao conectar com o servidor para buscar agendamentos.</p>'; }
}

async function cancelarAgendamento(idAgendamento) {
  if (!confirm('Tem certeza de que deseja cancelar esta consulta?')) return;
  try {
    const res = await fetch(API_URL + '/agendamentos/' + idAgendamento, { method: 'DELETE' }), data = await res.json();
    if (!res.ok) { alert(data.erro || 'Erro ao cancelar o agendamento.'); return; }
    alert('✅ Agendamento cancelado com sucesso!'); document.getElementById('form-consulta-cpf').dispatchEvent(new Event('submit'));
  } catch (error) { console.error(error); alert('Erro de conexão ao tentar cancelar o agendamento.'); }
}
