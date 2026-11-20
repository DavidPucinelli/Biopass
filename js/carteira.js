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
