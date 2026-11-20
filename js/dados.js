/* BioPass — camada de dados simulada (localStorage). Somente dados fictícios. */
const BioPass = (() => {
  const CH_USUARIOS = 'biopass_usuarios';
  const CH_SESSAO = 'biopass_sessao';
  const LIMITE_RECARGA = 300; // acima disso o banco simulado recusa
  const TARIFA = 5; // valor fictício: o grupo precisa definir a regra final

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
    try { localStorage.setItem(CH_SESSAO, u.email); } catch { /* ignora */ }
    return true;
  }
  function usuarioLogado() {
    let email = null;
    try { email = localStorage.getItem(CH_SESSAO); } catch { /* ignora */ }
    return email ? buscarPorEmail(email) || null : null;
  }
  function sair() { try { localStorage.removeItem(CH_SESSAO); } catch { /* ignora */ } }

  /* ---------- Recarga ---------- */
  function registrarRecarga(valor, forma) {
    const u = usuarioLogado();
    if (!u) return null;
    u.saldo = Math.round((u.saldo + valor) * 100) / 100;
    u.transacoes.push({ descricao: `Recarga via ${forma}`, valor, data: new Date().toISOString() });
    salvar(u);
    return u;
  }

  /* ---------- Viagem na catraca ---------- */
  function registrarViagem(descricao) {
    const u = usuarioLogado();
    if (!u) return { ok: false, motivo: 'sem-sessao' };
    if (u.saldo < TARIFA) return { ok: false, motivo: 'saldo' };
    u.saldo = Math.round((u.saldo - TARIFA) * 100) / 100;
    u.transacoes.push({ descricao, valor: -TARIFA, data: new Date().toISOString() });
    salvar(u);
    return { ok: true, usuario: u };
  }

  /* ---------- Formatação ---------- */
  const formatarMoeda = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  const formatarData = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return {
    LIMITE_RECARGA, TARIFA, cpfValido, emailValido, nascimentoValido, somenteNumeros,
    cadastrar, entrar, sair, usuarioLogado, registrarRecarga, registrarViagem, formatarMoeda, formatarData
  };
})();
