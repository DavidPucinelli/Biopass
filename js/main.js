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
