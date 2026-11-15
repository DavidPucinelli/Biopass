/* BioPass — interações globais */
document.addEventListener('DOMContentLoaded', () => {
  iniciarMenu();
  iniciarSaldoDemo();
});

/* Interação 1: menu hambúrguer */
function iniciarMenu() {
  const botao = document.querySelector('.nav-toggle');
  const menu = document.querySelector('#menu-principal');
  if (!botao || !menu) return;

  const alternar = (abrir) => {
    menu.classList.toggle('is-open', abrir);
    botao.setAttribute('aria-expanded', String(abrir));
    botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  };

  botao.addEventListener('click', () => alternar(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternar(false); });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => alternar(false)));
}

/* Interação 2: mostrar/ocultar saldo (estilo app de banco) */
function iniciarSaldoDemo() {
  const botao = document.querySelector('[data-toggle-saldo]');
  const saldo = document.querySelector('[data-saldo]');
  if (!botao || !saldo) return;

  const valorReal = saldo.dataset.saldo;   // ex.: "R$ 24,60"
  const oculto = 'R$ •••••';
  let visivel = false;

  const atualizar = () => {
    saldo.textContent = visivel ? valorReal : oculto;
    botao.setAttribute('aria-pressed', String(visivel));
    botao.setAttribute('aria-label', visivel ? 'Ocultar saldo' : 'Mostrar saldo');
  };

  botao.addEventListener('click', () => { visivel = !visivel; atualizar(); });
  atualizar();
}

/* BioPass — camada de dados simulada (localStorage). Somente dados fictícios. */
const BioPass = (() => {
  const CH_USUARIOS = 'biopass_usuarios';
  const CH_SESSAO = 'biopass_sessao';
  const LIMITE_RECARGA = 300; // acima disso o banco simulado recusa

  const ler = (chave, padrao) => {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; }
    catch { return padrao; }
  };
  const gravar = (chave, valor) => {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
  };
  const horasAtras = (h) => new Date(Date.now() - h * 3600000).toISOString();
  const somenteNumeros = (t) => String(t).replace(/\D/g, '');

  /* ---------- Validações ---------- */
  function cpfValido(cpf) {
    const n = somenteNumeros(cpf);
    if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
    for (let t = 9; t < 11; t++) {
      let soma = 0;
      for (let i = 0; i < t; i++) soma += Number(n[i]) * (t + 1 - i);
      if (((soma * 10) % 11) % 10 !== Number(n[t])) return false;
    }
    return true;
  }
  const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
  function nascimentoValido(v) {
    const d = new Date(v);
    return !Number.isNaN(d.getTime()) && d <= new Date() && d.getFullYear() >= 1900;
  }

  /* ---------- Usuários ---------- */
  function usuarios() {
    let lista = ler(CH_USUARIOS, []);
    if (!lista.length) {
      lista = [{
        nome: 'Passageiro Demo', cpf: '52998224725', email: 'demo@biopass.com', senha: 'biopass123',
        nascimento: '2000-01-01', bilhete: '123456789012', saldo: 24.6,
        transacoes: [
          { descricao: 'Recarga via Pix', valor: 20, data: horasAtras(30) },
          { descricao: 'Metrô', valor: -5, data: horasAtras(28) },
          { descricao: 'Ônibus', valor: -5, data: horasAtras(4) },
          { descricao: 'Recarga via Débito', valor: 50, data: horasAtras(120) },
          { descricao: 'Ônibus', valor: -5, data: horasAtras(100) }
        ]
      }];
      gravar(CH_USUARIOS, lista);
    }
    return lista;
  }
  const buscarPorEmail = (email) => usuarios().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  function cadastrar(dados) {
    const lista = usuarios();
    if (lista.some((u) => u.email.toLowerCase() === dados.email.trim().toLowerCase())) {
      return { ok: false, erro: 'Já existe uma conta com este e-mail.' };
    }
    if (lista.some((u) => u.cpf === somenteNumeros(dados.cpf))) {
      return { ok: false, erro: 'Já existe uma conta com este CPF.' };
    }
    lista.push({
      nome: dados.nome.trim(), cpf: somenteNumeros(dados.cpf), email: dados.email.trim(),
      senha: dados.senha, nascimento: dados.nascimento, bilhete: somenteNumeros(dados.bilhete),
      saldo: 0, transacoes: []
    });
    gravar(CH_USUARIOS, lista);
    return { ok: true };
  }

  function salvar(usuario) {
    gravar(CH_USUARIOS, usuarios().map((u) => (u.email === usuario.email ? usuario : u)));
  }

  /* ---------- Sessão ---------- */
  function entrar(email, senha) {
    const u = buscarPorEmail(email);
    if (!u || u.senha !== senha) return false;
    try { sessionStorage.setItem(CH_SESSAO, u.email); } catch { /* ignora */ }
    return true;
  }
  function usuarioLogado() {
    let email = null;
    try { email = sessionStorage.getItem(CH_SESSAO); } catch { /* ignora */ }
    return email ? buscarPorEmail(email) || null : null;
  }
  function sair() { try { sessionStorage.removeItem(CH_SESSAO); } catch { /* ignora */ } }

  /* ---------- Recarga ---------- */
  function registrarRecarga(valor, forma) {
    const u = usuarioLogado();
    if (!u) return null;
    u.saldo = Math.round((u.saldo + valor) * 100) / 100;
    u.transacoes.push({ descricao: `Recarga via ${forma}`, valor, data: new Date().toISOString() });
    salvar(u);
    return u;
  }

  /* ---------- Formatação ---------- */
  const formatarMoeda = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  const formatarData = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return {
    LIMITE_RECARGA, cpfValido, emailValido, nascimentoValido, somenteNumeros,
    cadastrar, entrar, sair, usuarioLogado, registrarRecarga, formatarMoeda, formatarData
  };
})();

/* BioPass — página da carteira: login, saldo, extrato e recarga */
document.addEventListener('DOMContentLoaded', () => {
  const areaLogin = document.querySelector('#area-login');
  if (!areaLogin) return;

  const areaCarteira = document.querySelector('#area-carteira');
  const modalLogin = document.querySelector('#modal-login');
  const modalRecarga = document.querySelector('#modal-recarga');
  const formLogin = document.querySelector('#form-login');
  const erroLogin = document.querySelector('#erro-login');
  const saldoEl = document.querySelector('#saldo-valor');
  const olho = document.querySelector('#btn-olho');
  const listaEl = document.querySelector('#lista-transacoes');
  const btnExtrato = document.querySelector('#btn-extrato');
  let saldoVisivel = false;
  let extratoCompleto = false;

  /* ---------- Tela principal ---------- */
  function criarItem(t) {
    const li = document.createElement('li');
    const esquerda = document.createElement('span');
    esquerda.textContent = t.descricao;
    const data = document.createElement('small');
    data.className = 'tx-data';
    data.textContent = BioPass.formatarData(t.data);
    esquerda.append(data);
    const valor = document.createElement('span');
    const entrada = t.valor > 0;
    valor.className = entrada ? 'tx-in' : 'tx-out';
    valor.textContent = `${entrada ? '+' : '−'} ${BioPass.formatarMoeda(Math.abs(t.valor))}`;
    li.append(esquerda, valor);
    return li;
  }

  function renderizar() {
    const u = BioPass.usuarioLogado();
    areaLogin.hidden = Boolean(u);
    areaCarteira.hidden = !u;
    if (!u) return;

    document.querySelector('#nome-usuario').textContent = u.nome.split(' ')[0];
    saldoEl.textContent = saldoVisivel ? BioPass.formatarMoeda(u.saldo) : 'R$ •••••';
    olho.setAttribute('aria-pressed', String(saldoVisivel));
    olho.setAttribute('aria-label', saldoVisivel ? 'Ocultar saldo' : 'Mostrar saldo');

    const ordenadas = [...u.transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    const itens = extratoCompleto ? ordenadas : ordenadas.slice(0, 3);
    if (itens.length) listaEl.replaceChildren(...itens.map(criarItem));
    else listaEl.replaceChildren(Object.assign(document.createElement('li'), { textContent: 'Nenhuma transação ainda. Adicione saldo para começar.' }));
    btnExtrato.hidden = ordenadas.length <= 3;
    btnExtrato.textContent = extratoCompleto ? 'Mostrar menos' : 'Ver extrato completo';
    btnExtrato.setAttribute('aria-expanded', String(extratoCompleto));
  }

  olho.addEventListener('click', () => { saldoVisivel = !saldoVisivel; renderizar(); });
  btnExtrato.addEventListener('click', () => { extratoCompleto = !extratoCompleto; renderizar(); });
  document.querySelector('#btn-sair').addEventListener('click', () => {
    BioPass.sair(); saldoVisivel = false; extratoCompleto = false; renderizar();
  });

  /* ---------- Login (modal) ---------- */
  document.querySelector('#btn-entrar').addEventListener('click', () => {
    erroLogin.textContent = '';
    formLogin.reset();
    modalLogin.showModal();
  });

  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const { email, senha } = Object.fromEntries(new FormData(formLogin));
    if (!email.trim() || !senha) { erroLogin.textContent = 'Preencha e-mail e senha.'; return; }

    const botao = formLogin.querySelector('[type="submit"]');
    botao.disabled = true;
    botao.textContent = 'Validando…';
    setTimeout(() => { // simula a consulta ao banco de dados
      botao.disabled = false;
      botao.textContent = 'Entrar';
      if (BioPass.entrar(email, senha)) { modalLogin.close(); renderizar(); }
      else erroLogin.textContent = 'E-mail ou senha incorretos.';
    }, 700);
  });

  /* ---------- Adicionar saldo (modal em 3 etapas) ---------- */
  const etapas = { facial: '#etapa-facial', pagamento: '#etapa-pagamento', resultado: '#etapa-resultado' };
  const mostrarEtapa = (nome) => Object.entries(etapas).forEach(([n, sel]) => { document.querySelector(sel).hidden = n !== nome; });
  const barra = document.querySelector('#barra-facial');
  const statusFacial = document.querySelector('#status-facial');
  const btnValidar = document.querySelector('#btn-validar-rosto');
  const formPagamento = document.querySelector('#form-pagamento');
  const erroPagamento = document.querySelector('#erro-pagamento');
  const msgResultado = document.querySelector('#msg-resultado');

  function reiniciarRecarga() {
    mostrarEtapa('facial');
    barra.style.width = '0';
    statusFacial.textContent = '';
    btnValidar.disabled = false;
    formPagamento.reset();
    erroPagamento.textContent = '';
  }

  document.querySelector('#btn-adicionar').addEventListener('click', () => { reiniciarRecarga(); modalRecarga.showModal(); });

  btnValidar.addEventListener('click', () => { // validação facial SIMULADA
    btnValidar.disabled = true;
    statusFacial.textContent = 'Validando seu rosto…';
    let p = 0;
    const timer = setInterval(() => {
      p += 10;
      barra.style.width = `${p}%`;
      if (p < 100) return;
      clearInterval(timer);
      mostrarEtapa('pagamento');
      formPagamento.elements.valor.focus();
    }, 150);
  });

  formPagamento.addEventListener('submit', (e) => {
    e.preventDefault();
    const valor = Number(formPagamento.elements.valor.value);
    const forma = formPagamento.elements.forma.value;
    if (!(valor >= 5 && valor <= 1000)) { erroPagamento.textContent = 'Informe um valor entre R$ 5,00 e R$ 1.000,00.'; return; }
    if (!forma) { erroPagamento.textContent = 'Escolha uma forma de pagamento.'; return; }
    erroPagamento.textContent = '';

    msgResultado.textContent = 'Processando pagamento…';
    mostrarEtapa('resultado');
    setTimeout(() => { // simula o sistema bancário
      if (valor > BioPass.LIMITE_RECARGA) {
        msgResultado.textContent = `Pagamento recusado: o limite por recarga neste protótipo é ${BioPass.formatarMoeda(BioPass.LIMITE_RECARGA)}.`;
        return;
      }
      BioPass.registrarRecarga(valor, forma);
      msgResultado.textContent = `Pagamento aprovado! ${BioPass.formatarMoeda(valor)} adicionados ao seu saldo.`;
      renderizar();
    }, 900);
  });

  document.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  renderizar();
});

/* BioPass — página de cadastro */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#form-cadastro');
  if (!form) return;

  const regras = {
    nome: (v) => (v.trim().split(/\s+/).length >= 2 ? '' : 'Informe nome e sobrenome.'),
    cpf: (v) => (BioPass.cpfValido(v) ? '' : 'CPF inválido. Confira os 11 números.'),
    email: (v) => (BioPass.emailValido(v) ? '' : 'Informe um e-mail válido, como nome@exemplo.com.'),
    senha: (v) => (v.length >= 6 ? '' : 'A senha precisa ter pelo menos 6 caracteres.'),
    nascimento: (v) => (BioPass.nascimentoValido(v) ? '' : 'Informe uma data de nascimento válida.'),
    bilhete: (v) => (/^\d{8,12}$/.test(BioPass.somenteNumeros(v)) ? '' : 'O número do Bilhete Único deve ter de 8 a 12 dígitos.')
  };

  function validarCampo(nome) {
    const campo = form.elements[nome];
    const msg = regras[nome](campo.value);
    document.querySelector(`#erro-${nome}`).textContent = msg;
    campo.setAttribute('aria-invalid', String(Boolean(msg)));
    return !msg;
  }

  Object.keys(regras).forEach((nome) => form.elements[nome].addEventListener('blur', () => validarCampo(nome)));

  // Máscara do CPF: 000.000.000-00
  form.elements.cpf.addEventListener('input', (e) => {
    const n = BioPass.somenteNumeros(e.target.value).slice(0, 11);
    e.target.value = n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => `${a}.${b}.${c}${d ? '-' + d : ''}`).replace(/\.$/, '');
  });

  const etapaDados = document.querySelector('#etapa-dados');
  const etapaFacial = document.querySelector('#etapa-facial');
  const barra = document.querySelector('#barra-facial');
  const status = document.querySelector('#status-facial');
  const btnCapturar = document.querySelector('#btn-capturar');
  const linkCarteira = document.querySelector('#link-carteira');
  let dadosPendentes = null;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const todosValidos = Object.keys(regras).map(validarCampo).every(Boolean);
    if (!todosValidos) { form.querySelector('[aria-invalid="true"]').focus(); return; }

    dadosPendentes = Object.fromEntries(new FormData(form));
    etapaDados.hidden = true;
    etapaFacial.hidden = false;
    document.querySelector('#passo-1').classList.remove('ativo');
    document.querySelector('#passo-2').classList.add('ativo');
    btnCapturar.focus();
  });

  // Captura facial SIMULADA: nenhuma imagem é gravada
  btnCapturar.addEventListener('click', () => {
    btnCapturar.disabled = true;
    status.className = 'status';
    status.textContent = 'Capturando… mantenha o rosto no centro.';
    let progresso = 0;
    const timer = setInterval(() => {
      progresso += 5;
      barra.style.width = `${progresso}%`;
      if (progresso < 100) return;
      clearInterval(timer);

      const resultado = BioPass.cadastrar(dadosPendentes);
      if (!resultado.ok) {
        status.className = 'status status-erro';
        status.textContent = `${resultado.erro} Volte e use outros dados.`;
        return;
      }
      BioPass.entrar(dadosPendentes.email, dadosPendentes.senha);
      status.className = 'status status-ok';
      status.textContent = 'Rosto cadastrado com sucesso! Sua conta está pronta.';
      linkCarteira.hidden = false;
      linkCarteira.focus();
    }, 120);
  });
});

