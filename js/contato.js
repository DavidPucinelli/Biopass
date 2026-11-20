/* BioPass — formulário de contato (validação) */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#form-contato');
  if (!form) return;

  const MAX = 500;
  const sucesso = document.querySelector('#msg-sucesso');
  const contador = document.querySelector('#contador');

  const regras = {
    nome: (v) => (v.trim().length >= 3 ? '' : 'Informe seu nome (mínimo de 3 letras).'),
    email: (v) => (BioPass.emailValido(v) ? '' : 'Informe um e-mail válido, como nome@exemplo.com.'),
    assunto: (v) => (v ? '' : 'Escolha um assunto.'),
    mensagem: (v) => (v.trim().length >= 10 ? '' : 'Escreva pelo menos 10 caracteres.')
  };

  function validarCampo(nome) {
    const campo = form.elements[nome];
    const msg = regras[nome](campo.value);
    document.querySelector(`#erro-${nome}`).textContent = msg;
    campo.setAttribute('aria-invalid', String(Boolean(msg)));
    return !msg;
  }

  Object.keys(regras).forEach((nome) => form.elements[nome].addEventListener('blur', () => validarCampo(nome)));

  // Contador de caracteres em tempo real
  const atualizarContador = () => { contador.textContent = `${form.elements.mensagem.value.length}/${MAX} caracteres`; };
  form.elements.mensagem.addEventListener('input', atualizarContador);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sucesso.hidden = true;
    const todosValidos = Object.keys(regras).map(validarCampo).every(Boolean);
    if (!todosValidos) { form.querySelector('[aria-invalid="true"]').focus(); return; }

    // Simulação: nada é enviado a um servidor
    form.reset();
    atualizarContador();
    sucesso.hidden = false;
    sucesso.focus();
  });
});
