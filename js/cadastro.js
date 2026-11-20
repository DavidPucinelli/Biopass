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
