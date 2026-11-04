import type { Rota } from '../http/roteador.ts';

const PAGINA = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fio Raiz — painel</title>
<style>
:root{--tinta:#10231c;--papel:#f4faf6;--marca:#1f7a5a;--borda:#cfe3d7}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 ui-sans-serif,system-ui,sans-serif;color:var(--tinta);background:var(--papel)}
header{padding:20px 24px;border-bottom:1px solid var(--borda);display:flex;gap:16px;align-items:baseline}
h1{font-size:20px;margin:0}h1 span{color:var(--marca)}
main{padding:24px;display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
section{background:#fff;border:1px solid var(--borda);border-radius:12px;padding:16px}
h2{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#4a6a5c;margin:0 0 12px}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{text-align:left;padding:4px 6px;border-bottom:1px solid #e8f1ea}
input,button{font:inherit;padding:6px 10px;border-radius:8px;border:1px solid var(--borda);background:#fff}
button{background:var(--marca);color:#fff;border-color:var(--marca);cursor:pointer}
code{background:#eef6f1;padding:1px 5px;border-radius:6px;font-size:12px}
</style></head><body>
<header><h1>Fio <span>Raiz</span></h1><small>gateway auto-hospedado · painel de leitura</small></header>
<main>
<section><h2>Chave</h2><p>Informe a chave de <code>data/.api-key</code>:</p>
<input id="chave" placeholder="fio_..." style="width:100%"><p><button id="conectar">Carregar</button></p>
<p id="aviso" role="status"></p></section>
<section><h2>Visão geral</h2><div id="geral">—</div></section>
<section><h2>Sessões</h2><div id="sessoes">—</div></section>
<section><h2>Webhooks</h2><div id="webhooks">—</div></section>
</main>
<script>
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tabela = (linhas, colunas) => linhas.length === 0 ? '<em>vazio</em>' :
  '<table><tr>' + colunas.map((c) => '<th>' + c + '</th>').join('') + '</tr>' +
  linhas.map((l) => '<tr>' + colunas.map((c) => '<td>' + esc(l[c]) + '</td>').join('') + '</tr>').join('') + '</table>';
async function carregar() {
  const chave = document.getElementById('chave').value.trim();
  const pedir = async (rota) => {
    const r = await fetch(rota, { headers: { 'x-api-key': chave } });
    if (!r.ok) throw new Error(rota + ': ' + r.status);
    return r.json();
  };
  try {
    const geral = await pedir('/api/stats/overview');
    document.getElementById('geral').innerHTML = tabela([geral], ['sessoes','conectadas','mensagens','webhooks','entregas_falhas']);
    document.getElementById('sessoes').innerHTML = tabela((await pedir('/api/sessions')).itens, ['nome','estado','numero']);
    document.getElementById('webhooks').innerHTML = tabela((await pedir('/api/webhooks')).itens, ['url','eventos','ativo']);
    document.getElementById('aviso').textContent = 'ativo';
  } catch (erro) { document.getElementById('aviso').textContent = erro.message; }
}
document.getElementById('conectar').addEventListener('click', carregar);
</script></body></html>`;

export const rotasPainel: Rota[] = [
  { metodo: 'GET', padrao: '/painel', publica: true, tratar: ({ res }) => {
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
    });
    res.end(PAGINA);
    return null;
  } },
];
