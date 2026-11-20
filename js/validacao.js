/* BioPass — catraca simulada */
document.addEventListener('DOMContentLoaded', () => {
  const painel = document.querySelector('#painel-catraca');
  if (!painel) return;

  const aviso = document.querySelector('#aviso-login');
  const form = document.querySelector('#form-catraca');
  const luz = document.querySelector('#catraca-luz');
  const titulo = document.querySelector('#catraca-titulo');
  const detalhe = document.querySelector('#catraca-detalhe');
  const barra = document.querySelector('#catraca-barra');
  const botao = document.querySelector('#btn-passar');
  const naoReconhecido = document.querySelector('#nao-reconhecido');

  function mostrar(classe, textoTitulo, textoDetalhe) {
    luz.className = `gate-light ${classe}`.trim();
    titulo.textContent = textoTitulo;
    detalhe.textContent = textoDetalhe;
  }

  function atualizarSessao() {
    const logado = Boolean(BioPass.usuarioLogado());
    aviso.hidden = logado;
    painel.hidden = !logado;
  }

  // A opção "rosto não reconhecido" só faz sentido no método Rosto
  form.addEventListener('change', () => {
    const ehRosto = form.elements.metodo.value === 'Rosto';
    naoReconhecido.disabled = !ehRosto;
    if (!ehRosto) naoReconhecido.checked = false;
  });

  function concluir(metodo, veiculo) {
    botao.disabled = false;
    barra.style.width = '0';

    if (metodo === 'Rosto' && naoReconhecido.checked) {
      mostrar('is-erro', 'Acesso negado', 'Rosto não reconhecido. Tente de novo ou use o cartão.');
      return;
    }
    const resultado = BioPass.registrarViagem(`${veiculo} (${metodo.toLowerCase()})`);
    if (resultado.ok) {
      mostrar('is-ok', 'Acesso liberado',
        `Tarifa de ${BioPass.formatarMoeda(BioPass.TARIFA)} debitada. Saldo: ${BioPass.formatarMoeda(resultado.usuario.saldo)}.`);
    } else if (resultado.motivo === 'saldo') {
      mostrar('is-erro', 'Saldo insuficiente', 'Adicione saldo na sua carteira para passar.');
    } else {
      mostrar('is-erro', 'Sessão expirada', 'Entre novamente na carteira.');
      atualizarSessao();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const metodo = form.elements.metodo.value;
    const veiculo = form.elements.veiculo.value;
    botao.disabled = true;
    mostrar('is-wait', 'Lendo…', `Identificando por ${metodo.toLowerCase()}.`);

    let progresso = 0;
    const timer = setInterval(() => {
      progresso += 10;
      barra.style.width = `${progresso}%`;
      if (progresso < 100) return;
      clearInterval(timer);
      concluir(metodo, veiculo);
    }, 150);
  });

  atualizarSessao();
});
