/* ============================================================
   juridico.js — Relatório jurídico, tipos de violência, risco, linha do tempo e exportação em PDF.
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== SINAIS DE ALERTA ===== */
const ALERTA_KEY='diario_alertas';
const COMP_KEY='diario_comp';
const RELATOS_KEY='diario_relatos';
let alertasState={};
let compState={};
let relatosList=[];

function loadExtras(){
  try{ const a=localStorage.getItem(ALERTA_KEY); if(a) alertasState=JSON.parse(a); }catch(e){}
  try{ const c=localStorage.getItem(COMP_KEY); if(c) compState=JSON.parse(c); }catch(e){}
  try{ const r=localStorage.getItem(RELATOS_KEY); if(r) relatosList=JSON.parse(r); }catch(e){}
}
function saveExtras(){
  try{ localStorage.setItem(ALERTA_KEY,JSON.stringify(alertasState)); }catch(e){}
  try{ localStorage.setItem(COMP_KEY,JSON.stringify(compState)); }catch(e){}
  try{ localStorage.setItem(RELATOS_KEY,JSON.stringify(relatosList)); }catch(e){}
}

function toggleAlerta(el,key){
  el.classList.toggle('marked');
  const on=el.classList.contains('marked');
  el.setAttribute('aria-pressed',on?'true':'false');
  alertasState[key]=on;
  saveExtras();
  checkMicrofeedbackSinais();
}

function toggleComp(el,key){
  el.classList.toggle('checked');
  const on=el.classList.contains('checked');
  el.setAttribute('aria-checked',on?'true':'false');
  compState[key]=on;
  saveExtras();
}

function checkMicrofeedbackSinais(){
  const count=Object.values(alertasState).filter(Boolean).length;
  const fb=document.getElementById('sinais-microfeedback');
  const titulo=document.getElementById('sinais-feedback-titulo');
  const texto=document.getElementById('sinais-feedback-texto');
  if(!fb) return;
  if(count>=3){
    if(count>=6){
      titulo.textContent='🚨 Situação de risco — você merece proteção';
      texto.textContent='Você marcou muitos padrões de abuso. Isso é sério. Você não está exagerando e não é sua culpa. Existem pessoas prontas para te ajudar agora — de forma gratuita e sigilosa.';
    } else {
      titulo.textContent='⚠️ Sinais de alerta identificados';
      texto.textContent='Os padrões que você marcou têm nome e são reconhecidos como formas de violência — mesmo sem agressão física. Violência psicológica e controle são crimes previstos na Lei Maria da Penha.';
    }
    fb.classList.add('show');
  } else {
    fb.classList.remove('show');
  }
}

function checkMicrofeedbackPercepcao(){
  const keys=['pd1','pd2','pd3','pd4','pd5','pd6'];
  const count=keys.filter(k=>state[k]).length;
  const fb=document.getElementById('percepcao-microfeedback');
  if(!fb) return;
  if(count>=3) fb.classList.add('show');
  else fb.classList.remove('show');
}

function restoreAlertas(){
  document.querySelectorAll('#alerta-lista .alerta-item').forEach(el=>{
    const key=el.getAttribute('onclick').match(/'(\w+)'/)?.[1];
    if(key && alertasState[key]){ el.classList.add('marked'); el.setAttribute('aria-pressed','true'); }
  });
  checkMicrofeedbackSinais();
}

function restoreComps(){
  document.querySelectorAll('#comp-lista .comp-item').forEach(el=>{
    const key=el.getAttribute('onclick').match(/'(\w+)'/)?.[1];
    if(key && compState[key]){ el.classList.add('checked'); el.setAttribute('aria-checked','true'); }
  });
}


/* ===== TIPO VIOLÊNCIA ===== */
const tipoState={};
function toggleTipo(btn,key){
  btn.classList.toggle('on');
  const on=btn.classList.contains('on');
  tipoState[key]=on;
  state[key]=on;
  salvarTudo();
}
function restoreTipos(){
  document.querySelectorAll('#tipo-violencia-grid .tipo-btn').forEach(btn=>{
    const key=btn.getAttribute('data-key');
    if(key && state[key]){ btn.classList.add('on'); tipoState[key]=true; }
  });
}


/* ===== RISCO ATUAL ===== */
let riscoAtual='';
function selecionarRisco(el,nivel){
  document.querySelectorAll('.risco-opcao').forEach(o=>{
    o.classList.remove('on-verde','on-amarelo','on-vermelho');
  });
  el.classList.add('on-'+nivel);
  riscoAtual=nivel;
  state.jc_risco=nivel;
  const urgente=document.getElementById('risco-urgente');
  if(urgente) urgente.classList.toggle('show', nivel==='vermelho');
  salvarTudo();
}
function restoreRisco(){
  const nivel=state.jc_risco;
  if(!nivel) return;
  riscoAtual=nivel;
  document.querySelectorAll('.risco-opcao').forEach(o=>{
    if(o.getAttribute('data-risco')===nivel) o.classList.add('on-'+nivel);
  });
  const urgente=document.getElementById('risco-urgente');
  if(urgente) urgente.classList.toggle('show', nivel==='vermelho');
}


/* ===== RELATÓRIO JURÍDICO ===== */
/* ══════════════════════════════════════════════════════════════
   GERADOR DE RELATÓRIO JURÍDICO — PDF PROFISSIONAL
   ══════════════════════════════════════════════════════════════ */

// Mapa de leis aplicáveis por tipo de violência
const LEIS_POR_TIPO = {
  'tv1': { lei:'Lei 11.340/2006 (Lei Maria da Penha)', art:'Art. 7º, I', desc:'Violência física — qualquer conduta que ofenda a integridade corporal ou a saúde.' },
  'tv2': { lei:'Lei 11.340/2006 + Art. 147-B CP', art:'Art. 7º, II', desc:'Violência psicológica — dano emocional, diminuição da autoestima, controle, humilhação.' },
  'tv3': { lei:'Lei 11.340/2006', art:'Art. 7º, V', desc:'Violência moral — calúnia, difamação ou injúria.' },
  'tv4': { lei:'Lei 11.340/2006', art:'Art. 7º, IV', desc:'Violência patrimonial — retenção, subtração ou destruição de bens, documentos e recursos.' },
  'tv5': { lei:'Lei 11.340/2006 + Art. 147-B CP', art:'Art. 7º, II', desc:'Controle e isolamento — privação de liberdade de ir e vir, monitoramento e vigilância constante.' },
  'tv6': { lei:'Art. 147 CP + Lei 11.340/2006', art:'Art. 147', desc:'Ameaça — causar mal injusto e grave à vítima.' },
  'tv7': { lei:'Lei 14.132/2021', art:'Art. 147-A CP', desc:'Stalking/perseguição — reiterada ameaça ou vigilância que constranja a liberdade da vítima.' },
  'tv8': { lei:'Lei 13.772/2018', art:'Art. 216-B CP', desc:'Violação de privacidade — registro ou divulgação de cenas íntimas sem consentimento; acesso não autorizado a dispositivos.' },
};

const PROXIMOS_PASSOS = [
  { num:'1', titulo:'Delegacia da Mulher (DDM) ou Delegacia mais próxima', texto:'Leve este documento. Você pode registrar um Boletim de Ocorrência sem advogado e sem custo. Peça uma cópia assinada do B.O.' },
  { num:'2', titulo:'Solicite a Medida Protetiva de Urgência', texto:'Na própria delegacia, peça a medida protetiva. O juiz tem até 48 horas para decidir. Ela pode proibir o agressor de se aproximar de você, seus filhos e sua casa.' },
  { num:'3', titulo:'Central de Atendimento à Mulher — Ligue 180', texto:'Gratuito, 24 horas, sigiloso. Podem orientar sobre casas de acolhimento, atendimento jurídico gratuito e serviços na sua cidade.' },
  { num:'4', titulo:'CRAS / CREAS ou Defensoria Pública', texto:'Para apoio jurídico gratuito, assistência social e encaminhamentos. Você tem direito a atendimento prioritário.' },
  { num:'5', titulo:'Preserve evidências', texto:'Não apague mensagens, fotos ou áudios. Tire prints com data visível. Se houver marcas físicas, fotografe e busque atendimento médico — o hospital é obrigado a registrar.' },
];

function gerarRelatorioJuridico(){
  const get = id => {
    const el = document.querySelector('[data-key="'+id+'"]');
    return el ? el.value.trim() : '';
  };

  // Tipos de violência marcados
  const tiposOn = [];
  const leisAplicaveis = [];
  document.querySelectorAll('#tipo-violencia-grid .tipo-btn.on').forEach(b => {
    const key = b.getAttribute('data-key');
    tiposOn.push(b.textContent.trim().replace(/^[^\w]+/,'').trim());
    if(LEIS_POR_TIPO[key]) leisAplicaveis.push(LEIS_POR_TIPO[key]);
  });

  // Sinais de alerta marcados
  const sinaisOn = [];
  document.querySelectorAll('#alerta-lista .alerta-item[aria-pressed="true"]').forEach(el => {
    const txt = el.querySelector('.alerta-text');
    if(txt) sinaisOn.push(txt.textContent.trim());
  });

  // Risco atual
  const riscoMap = {
    'verde':   { texto:'SEM PERIGO IMEDIATO', desc:'A situação é grave, mas não há ameaça neste momento.' },
    'amarelo': { texto:'RISCO MODERADO', desc:'Há preocupação com ameaças recentes ou comportamento assustador.' },
    'vermelho':{ texto:'⚠️ RISCO ALTO — PERIGO IMEDIATO', desc:'Requer medida de proteção urgente. Ligue 190 se estiver em perigo agora.' },
  };
  const risco = riscoMap[riscoAtual] || { texto:'Não avaliado', desc:'' };

  const now = new Date();
  const dataDoc = now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const horaDoc = now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});

  // Monta objeto do relatório para preview e PDF
  window._relatorioData = {
    dataDoc, horaDoc, get, tiposOn, leisAplicaveis, sinaisOn, risco,
    relatosList: typeof relatosList !== 'undefined' ? relatosList : [],
  };

  // Renderiza preview na tela
  const conteudo = document.getElementById('relatorio-conteudo');
  conteudo.innerHTML = _buildRelatorioHTML(window._relatorioData, false);

  const resultado = document.getElementById('relatorio-juridico-resultado');
  resultado.style.display = 'block';
  resultado.scrollIntoView({behavior:'smooth', block:'start'});
  showToast('📄 Relatório gerado!');

  // Texto simples para clipboard
  window._relatorioTexto = _buildRelatorioTexto(window._relatorioData);
  try{ localStorage.setItem('diario_relatorio_v1', window._relatorioTexto); }catch(e){}
}

function _buildRelatorioHTML(d, isPDF){
  const {dataDoc, horaDoc, get, tiposOn, leisAplicaveis, sinaisOn, risco} = d;
  const cor = isPDF ? '#1a4a2a' : '#4a90a4';
  const sec = (titulo, conteudo) => conteudo ? `
    <div class="relatorio-secao">
      <div class="relatorio-secao-titulo">${titulo}</div>
      <div class="relatorio-secao-val">${conteudo}</div>
    </div>` : '';

  let html = '';

  // Identificação
  html += sec('DATA E HORA DO REGISTRO', `${dataDoc}, às ${horaDoc}`);

  // Contexto
  const ctx = [
    get('jc1') && `Relação com o agressor: ${get('jc1')}`,
    get('jc2') && `Tempo de ocorrência: ${get('jc2')}`,
    get('jc3') && `Frequência: ${get('jc3')}`,
  ].filter(Boolean).join('<br>');
  html += sec('CONTEXTO E VÍNCULO', ctx);

  // Tipos de violência
  if(tiposOn.length) html += sec('TIPO DE VIOLÊNCIA', tiposOn.map(t=>`• ${t}`).join('<br>'));

  // Sinais de alerta
  if(sinaisOn.length) html += sec('SINAIS DE ALERTA IDENTIFICADOS', sinaisOn.map(s=>`• ${s}`).join('<br>'));

  // Descrição dos fatos
  const fatos = [
    get('j2') && `<strong>Relato:</strong> ${get('j2')}`,
    get('jc4') && `<strong>Local:</strong> ${get('jc4')}`,
    get('jc5') && `<strong>Data / Período:</strong> ${get('jc5')}`,
  ].filter(Boolean).join('<br><br>');
  html += sec('DESCRIÇÃO DOS FATOS', fatos);

  // Impacto
  html += sec('IMPACTO NA VÍTIMA', get('jc6'));

  // Testemunhas e provas
  html += sec('TESTEMUNHAS', get('j3t'));
  html += sec('EVIDÊNCIAS DISPONÍVEIS', get('j3'));

  // Risco
  html += sec('AVALIAÇÃO DE RISCO ATUAL',
    `<strong>${risco.texto}</strong><br>${risco.desc}` +
    (get('jc7') ? `<br><br><strong>Detalhes:</strong> ${get('jc7')}` : ''));

  // Leis aplicáveis
  if(leisAplicaveis.length){
    const leisHtml = leisAplicaveis.map(l =>
      `<div style="margin-bottom:.6rem;padding:.5rem .7rem;background:rgba(74,144,164,.07);border-left:3px solid #4a90a4;border-radius:0 6px 6px 0;">
        <strong>${l.lei}</strong> — ${l.art}<br>
        <span style="font-size:.80rem;">${l.desc}</span>
      </div>`
    ).join('');
    html += sec('LEIS APLICÁVEIS AO CASO', leisHtml);
  }

  // Depoimento completo
  html += sec('DEPOIMENTO COMPLETO (RASCUNHO)', get('j5'));

  // Relatos datados
  if(d.relatosList && d.relatosList.length){
    const relatosHtml = d.relatosList.slice(0,10)
      .map(r=>`<div style="margin-bottom:.5rem;padding:.4rem .6rem;border-left:2px solid #4a90a4;">
        <strong>[${r.data}]</strong> ${r.texto}</div>`).join('');
    html += sec('RELATOS DATADOS', relatosHtml);
  }

  // Próximos passos
  const passosHtml = PROXIMOS_PASSOS.map(p =>
    `<div style="margin-bottom:.75rem;display:flex;gap:.6rem;">
      <span style="font-weight:700;color:#4a90a4;flex-shrink:0;">${p.num}.</span>
      <div><strong>${p.titulo}</strong><br><span style="font-size:.82rem;">${p.texto}</span></div>
    </div>`
  ).join('');
  html += sec('ORIENTAÇÕES — PRÓXIMOS PASSOS', passosHtml);

  return html;
}

function _buildRelatorioTexto(d){
  const {dataDoc, horaDoc, get, tiposOn, leisAplicaveis, sinaisOn, risco} = d;
  const sep = '\n' + '═'.repeat(50) + '\n\n';
  let txt = 'RELATÓRIO DE VIOLÊNCIA DOMÉSTICA\n';
  txt += 'Projeto Rompendo o Silêncio · Diário de Liberdade\n';
  txt += 'Desenvolvido por DtLabs\n';
  txt += '═'.repeat(50) + '\n\n';

  txt += `DATA E HORA: ${dataDoc}, às ${horaDoc}${sep}`;

  if(get('jc1')||get('jc2')||get('jc3')){
    txt += 'CONTEXTO E VÍNCULO\n';
    if(get('jc1')) txt += `Relação com o agressor: ${get('jc1')}\n`;
    if(get('jc2')) txt += `Tempo de ocorrência: ${get('jc2')}\n`;
    if(get('jc3')) txt += `Frequência: ${get('jc3')}\n`;
    txt += sep;
  }
  if(tiposOn.length){ txt += `TIPOS DE VIOLÊNCIA\n${tiposOn.map(t=>'• '+t).join('\n')}${sep}`; }
  if(sinaisOn.length){ txt += `SINAIS DE ALERTA\n${sinaisOn.map(s=>'• '+s).join('\n')}${sep}`; }
  if(get('j2')||get('jc4')||get('jc5')){
    txt += 'DESCRIÇÃO DOS FATOS\n';
    if(get('j2')) txt += `Relato: ${get('j2')}\n\n`;
    if(get('jc4')) txt += `Local: ${get('jc4')}\n`;
    if(get('jc5')) txt += `Data/Período: ${get('jc5')}\n`;
    txt += sep;
  }
  if(get('jc6')){ txt += `IMPACTO NA VÍTIMA\n${get('jc6')}${sep}`; }
  if(get('j3t')){ txt += `TESTEMUNHAS\n${get('j3t')}${sep}`; }
  if(get('j3')){ txt += `EVIDÊNCIAS\n${get('j3')}${sep}`; }
  txt += `AVALIAÇÃO DE RISCO\n${risco.texto}\n${risco.desc}`;
  if(get('jc7')) txt += `\nDetalhes: ${get('jc7')}`;
  txt += sep;
  if(leisAplicaveis.length){
    txt += 'LEIS APLICÁVEIS\n';
    leisAplicaveis.forEach(l => { txt += `• ${l.lei} (${l.art}): ${l.desc}\n`; });
    txt += sep;
  }
  if(get('j5')){ txt += `DEPOIMENTO COMPLETO\n${get('j5')}${sep}`; }
  if(d.relatosList && d.relatosList.length){
    txt += 'RELATOS DATADOS\n';
    d.relatosList.slice(0,10).forEach(r=>{ txt += `[${r.data}] ${r.texto}\n\n`; });
    txt += sep;
  }
  txt += 'PRÓXIMOS PASSOS\n';
  PROXIMOS_PASSOS.forEach(p=>{ txt += `${p.num}. ${p.titulo}\n${p.texto}\n\n`; });
  txt += '═'.repeat(50) + '\n';
  txt += 'Documento gerado pelo Diário de Liberdade · DtLabs\n';
  txt += 'Este documento não substitui assessoria jurídica profissional.\n';
  return txt;
}

function gerarPDF(){
  if(!window._relatorioData){ showToast('Gere o relatório primeiro'); return; }
  const d = window._relatorioData;
  const htmlCorpo = _buildRelatorioHTML(d, true);

  const win = window.open('', '_blank');
  if(!win){ showToast('Permita pop-ups para gerar o PDF'); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Jurídico — Diário de Liberdade</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    color: #111;
    background: #fff;
    padding: 0;
  }
  @page { margin: 2cm 2.5cm; }
  @media print {
    body { font-size: 10.5pt; }
    .no-print { display:none; }
    h1 { font-size:14pt; }
  }

  /* Cabeçalho */
  .cabecalho {
    border-bottom: 3px solid #1a4a2a;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }
  .cab-projeto {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: #666;
    margin-bottom: .4rem;
  }
  .cab-titulo {
    font-size: 16pt;
    font-weight: bold;
    color: #1a4a2a;
    margin-bottom: .2rem;
  }
  .cab-subtitulo {
    font-size: 9pt;
    color: #555;
    font-style: italic;
  }
  .cab-urgencia {
    margin-top: .75rem;
    background: #fff3cd;
    border: 1.5px solid #e0a800;
    border-radius: 4px;
    padding: .4rem .75rem;
    font-size: 9pt;
    color: #7a5a00;
  }
  .cab-urgencia.alto {
    background: #fde8e8;
    border-color: #c0392b;
    color: #7a1a1a;
    font-weight: bold;
  }

  /* Seções */
  .secao {
    margin-bottom: 1.4rem;
    page-break-inside: avoid;
  }
  .secao-titulo {
    font-size: 8pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #1a4a2a;
    border-bottom: 1px solid #c8d8c8;
    padding-bottom: .3rem;
    margin-bottom: .5rem;
  }
  .secao-corpo {
    font-size: 10.5pt;
    line-height: 1.65;
    color: #222;
  }
  .secao-corpo strong { color: #111; }

  /* Lei */
  .lei-item {
    margin-bottom: .5rem;
    padding: .4rem .6rem;
    background: #f0e0ff;
    border-left: 3px solid #1a4a2a;
    font-size: 9.5pt;
    line-height: 1.5;
  }
  .lei-item strong { color: #1a4a2a; }

  /* Passo */
  .passo {
    display: flex;
    gap: .6rem;
    margin-bottom: .75rem;
    font-size: 10pt;
    line-height: 1.55;
  }
  .passo-num {
    font-weight: bold;
    color: #1a4a2a;
    flex-shrink: 0;
    width: 1.2rem;
  }

  /* Relato */
  .relato-item {
    padding: .3rem .5rem;
    border-left: 2px solid #1a4a2a;
    margin-bottom: .4rem;
    font-size: 9.5pt;
  }

  /* Rodapé */
  .rodape {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #ccc;
    font-size: 8pt;
    color: #888;
    text-align: center;
    line-height: 1.7;
  }

  /* Botão imprimir — só aparece na tela */
  .btn-imprimir {
    display: block;
    margin: 1.5rem auto;
    background: #1a4a2a;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: .8rem 2.5rem;
    font-size: 13pt;
    cursor: pointer;
    font-family: Georgia, serif;
  }
</style>
</head>
<body>

<button class="btn-imprimir no-print" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>

<div class="cabecalho">
  <div class="cab-projeto">Projeto Rompendo o Silêncio · Diário de Liberdade · DtLabs</div>
  <div class="cab-titulo">Relatório de Violência Doméstica</div>
  <div class="cab-subtitulo">Documento gerado em ${d.dataDoc}, às ${d.horaDoc}</div>
  ${window._relatorioData.risco.texto.includes('ALTO') ?
    '<div class="cab-urgencia alto">⚠️ SITUAÇÃO DE RISCO ALTO — Procure ajuda imediata: ligue 180 (violência) ou 190 (emergência)</div>' :
    '<div class="cab-urgencia">Central de Atendimento à Mulher: 180 (gratuito, 24h) · Emergência: 190</div>'
  }
</div>

<div id="corpo-pdf"></div>

<div class="rodape">
  Este documento foi gerado pelo Diário de Liberdade — Projeto Rompendo o Silêncio.<br>
  Concepção: Suelen · Desenvolvimento: Dara · DtLabs · © ${new Date().getFullYear()}<br>
  <em>Este documento não substitui assessoria jurídica profissional. Consulte a Defensoria Pública ou um advogado.</em>
</div>

<script>
// Converte o HTML do preview para o formato PDF limpo
const htmlCorpo = ${JSON.stringify(htmlCorpo)};
const corpo = document.getElementById('corpo-pdf');

// Parse e reconstrói em formato de impressão
const parser = new DOMParser();
const doc = parser.parseFromString('<div>' + htmlCorpo + '</div>', 'text/html');
doc.querySelectorAll('.relatorio-secao').forEach(sec => {
  const titulo = sec.querySelector('.relatorio-secao-titulo');
  const val = sec.querySelector('.relatorio-secao-val');
  if(!titulo || !val || !val.textContent.trim()) return;

  const div = document.createElement('div');
  div.className = 'secao';

  const t = document.createElement('div');
  t.className = 'secao-titulo';
  t.textContent = titulo.textContent;
  div.appendChild(t);

  const v = document.createElement('div');
  v.className = 'secao-corpo';
  v.innerHTML = val.innerHTML;
  // Reestiliza leis
  v.querySelectorAll('[style*="border-left:3px solid #4a90a4"]').forEach(el => {
    el.className = 'lei-item';
    el.removeAttribute('style');
  });
  div.appendChild(v);
  corpo.appendChild(div);
});
<\/script>

</body>
</html>`);
  win.document.close();
}

function copiarRelatorio(){
  const texto = window._relatorioTexto || localStorage.getItem('diario_relatorio_v1') || '';
  if(!texto){ showToast('Gere o relatório primeiro'); return; }
  navigator.clipboard && navigator.clipboard.writeText(texto)
    .then(()=>showToast('📋 Copiado!'))
    .catch(()=>showToast('Use Ctrl+C para copiar'));
}

/* ══════════════════════════════════════════════════════════════ */



/* ===== JURÍDICO: HISTÓRICO DOS CAMPOS ===== */
// Os campos jurídicos são PERM_KEYS e ficam salvos entre dias.
// Para "aparecer preenchido" geramos um snapshot quando a usuária salva.
// O toggle de histórico revela snapshots anteriores.
const JURIDICO_HIST_KEY='diario_jur_hist';
function salvarSnapshotJuridico(){
  const campos=['jc1','jc2','jc3','jc4','jc5','jc6','jc7','j1','j2','j3','j3t','j4','j5'];
  const snap={};
  let temConteudo=false;
  campos.forEach(k=>{ if(state[k]&&state[k].trim()){snap[k]=state[k];temConteudo=true;} });
  if(!temConteudo) return;
  snap._date=getToday();
  snap._ts=Date.now();
  try{
    const raw=localStorage.getItem(JURIDICO_HIST_KEY);
    const hist=raw?JSON.parse(raw):[];
    // Só salva se for diferente do último
    const ultimo=hist[0];
    if(ultimo&&ultimo._date===snap._date) hist[0]=snap;
    else hist.unshift(snap);
    localStorage.setItem(JURIDICO_HIST_KEY,JSON.stringify(hist.slice(0,30)));
  }catch(e){}
}
function toggleJuridicoHist(){
  const el=document.getElementById('juridico-hist-list');
  if(!el) return;
  if(el.classList.contains('show')){ el.classList.remove('show'); return; }
  renderJuridicoHist();
  el.classList.add('show');
}
function renderJuridicoHist(){
  const el=document.getElementById('juridico-hist-list');
  if(!el) return;
  try{
    const raw=localStorage.getItem(JURIDICO_HIST_KEY);
    const hist=raw?JSON.parse(raw):[];
    if(!hist.length){ el.innerHTML='<div class="juridico-hist-entry" style="color:var(--tm);font-style:italic;font-size:.8rem;">Nenhum histórico salvo ainda.</div>'; return; }
    el.innerHTML=hist.slice(0,10).map(h=>{
      const data=h._date?new Date(h._date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'';
      const preview=[h.jc1,h.j2,h.j5].filter(Boolean).join(' · ').slice(0,200);
      return `<div class="juridico-hist-entry">
        <div class="juridico-hist-entry-date">📋 ${data}</div>
        <div class="juridico-hist-entry-text">${preview||'(sem prévia)'}</div>
      </div>`;
    }).join('');
  }catch(e){ el.innerHTML='<div style="color:var(--tm);font-size:.8rem;">Erro ao carregar histórico.</div>'; }
}
// Salva snapshot jurídico automaticamente ao salvar estado
const _origSaveState=saveState;
window._jur_snap_throttle=0;
// Hook: salvar snapshot jurídico a cada saveState
(function hookJurSave(){
  const orig=window.salvarTudo||function(){};
})();


/* ===== LINHA DO TEMPO DA VIOLÊNCIA ===== */
const TL_KEY = 'diario_timeline';
let timelineList = [];
function loadTimeline(){
  try{ const t=localStorage.getItem(TL_KEY); if(t) timelineList=JSON.parse(t); }catch(e){}
  renderTimeline();
}
function saveTimeline(){
  try{ localStorage.setItem(TL_KEY, JSON.stringify(timelineList)); }catch(e){}
}
function adicionarTimeline(){
  const dataEl = document.getElementById('tl-data');
  const descEl = document.getElementById('tl-desc');
  if(!dataEl||!descEl) return;
  const data = dataEl.value;
  const desc = sanitize(descEl.value.trim());
  if(!data||!desc){ showToast('Preencha a data e a descrição.'); return; }
  timelineList.push({ data, desc, ts: Date.now() });
  timelineList.sort((a,b) => a.data.localeCompare(b.data));
  saveTimeline();
  renderTimeline();
  descEl.value = '';
  showToast('📅 Episódio adicionado!');
}
function renderTimeline(){
  const wrap = document.getElementById('timeline-lista');
  if(!wrap) return;
  if(!timelineList.length){
    wrap.innerHTML='<div class="timeline-empty">Adicione episódios abaixo para construir sua linha do tempo.</div>';
    return;
  }
  wrap.innerHTML = timelineList.map((item,i)=>`
    <div class="timeline-item">
      <div class="timeline-date">${formatarDataTimeline(item.data)} <button onclick="removerTimeline(${i})" style="background:transparent;border:none;color:rgba(192,57,43,.5);font-size:.7rem;cursor:pointer;margin-left:.3rem;">✕</button></div>
      <div class="timeline-desc">${item.desc}</div>
    </div>`).join('');
}
function removerTimeline(i){
  if(!confirm('Remover esse episódio?')) return;
  timelineList.splice(i,1);
  saveTimeline(); renderTimeline();
}
function limparTimeline(){
  if(!confirm('Apagar toda a linha do tempo?')) return;
  timelineList=[]; saveTimeline(); renderTimeline();
}
function formatarDataTimeline(iso){
  if(!iso) return '—';
  const d = new Date(iso+'T12:00:00');
  return d.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
}
function exportarTimeline(){
  const linhas = timelineList.map(item=>`${formatarDataTimeline(item.data)}\n${item.desc}`).join('\n\n---\n\n');
  const conteudo = `LINHA DO TEMPO DA VIOLÊNCIA\nDiário de Liberdade — Projeto Rompendo o Silêncio\nGerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n${'='.repeat(40)}\n\n${linhas}`;
  const win = window.open('','_blank');
  win.document.write(`<html><head><title>Linha do Tempo</title><style>body{font-family:Georgia,serif;max-width:600px;margin:2rem auto;color:#222;line-height:1.8}h2{color:#4a90a4}hr{border-color:#ddd}pre{white-space:pre-wrap;font-family:Georgia,serif}</style></head><body><h2>Linha do Tempo da Violência</h2><pre>${conteudo}</pre></body></html>`);
  win.document.close(); win.print();
}


/* ===== EXPORTAR JURÍDICO EM PDF ===== */
function exportarJuridicoPDF(){
  const campos = [
    ['Vínculo com o agressor', state.jc1],
    ['Tempo do comportamento', state.jc2],
    ['Frequência', state.jc3],
    ['Local dos episódios', state.jc4],
    ['Data aproximada', state.jc5],
    ['Descrição dos fatos', state.j2],
    ['Impacto emocional', state.jc6],
    ['Testemunhas', state.j3t],
    ['Evidências', state.j3],
    ['Risco atual', state.jc_risco],
    ['Detalhes do risco', state.jc7],
    ['Endereço da DDM', state.j1],
    ['Medida protetiva solicitada', state.j4],
    ['Depoimento (prática)', state.j5],
  ].filter(([,v])=>v&&v.trim());

  if(!campos.length){ showToast('Preencha as informações jurídicas antes de exportar.'); return; }

  const timelineHtml = timelineList.length ? `
    <h3 style="color:#4a90a4;margin-top:1.5rem;">Linha do Tempo da Violência</h3>
    ${timelineList.map(item=>`<div style="border-left:3px solid #4a90a4;padding:.5rem 1rem;margin:.5rem 0;"><strong>${formatarDataTimeline(item.data)}</strong><br>${item.desc}</div>`).join('')}
  ` : '';

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório Jurídico</title>
  <style>body{font-family:Arial,sans-serif;max-width:700px;margin:2rem auto;color:#222;font-size:13px;line-height:1.7}
  h1{color:#1a0828;border-bottom:2px solid #4a90a4;padding-bottom:.5rem}
  h2{color:#4a90a4;font-size:1rem;margin-top:1.5rem}
  .campo{margin:.75rem 0;padding:.5rem;background:#f8f8f8;border-radius:4px}
  .campo-label{font-weight:bold;color:#555;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em}
  .aviso{background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:.75rem;margin:1rem 0;font-size:.85rem}
  @media print{body{margin:1cm}}</style></head><body>
  <h1>📋 Relatório Jurídico — Diário de Liberdade</h1>
  <p><strong>Projeto Rompendo o Silêncio</strong> &nbsp;·&nbsp; Gerado em: ${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
  <div class="aviso">⚠️ Este documento foi preparado para auxiliar o relato à Delegacia da Mulher ou ao Ministério Público. Leve-o impresso ou salve como PDF.</div>
  ${campos.map(([label,val])=>`<div class="campo"><div class="campo-label">${label}</div><div>${val.replace(/\n/g,'<br>')}</div></div>`).join('')}
  ${timelineHtml}
  <p style="margin-top:2rem;font-size:.8rem;color:#888;">Central da Mulher: 180 &nbsp;·&nbsp; Emergência: 190 &nbsp;·&nbsp; CVV: 188</p>
  </body></html>`;

  const win = window.open('','_blank');
  if(!win){
    // Pop-up bloqueado (comum em celular): cai para download de arquivo HTML,
    // que abre em qualquer navegador e pode ser salvo como PDF pela impressão.
    try{
      const blob=new Blob([html],{type:'text/html;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      const stamp=new Date().toISOString().slice(0,10);
      a.href=url; a.download='relatorio-juridico-'+stamp+'.html';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      showToast('📄 Relatório baixado. Abra o arquivo e use Imprimir → Salvar como PDF.');
    }catch(e){
      showToast('Permita pop-ups ou tente baixar o relatório novamente.');
    }
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(()=>{ try{ win.print(); }catch(e){} }, 500);
}


/* ===== PLANO DE SEGURANÇA PERSONALIZADO ===== */
function gerarPlanoSeguranca(){
  const conteudo = document.getElementById('plano-conteudo');
  if(conteudo) conteudo.style.display='block';

  // Contato 1
  const c1nome = state.ap1_nome||''; const c1tel = state.ap1_tel||'';
  const elC = document.getElementById('plano-contato');
  if(elC) elC.innerHTML = c1nome ? `<strong>${c1nome}</strong> — 📞 ${c1tel}` : '<span class="plano-step-vazio">Preencha a Rede de Apoio com uma pessoa de confiança.</span>';

  // DDM
  const ddm = state.j1||'';
  const elD = document.getElementById('plano-deam');
  if(elD) elD.innerHTML = ddm ? `<strong>${ddm}</strong><br>Ligue 190 (Polícia) ou 180 (Central da Mulher) para informações sobre a DDM mais próxima.` : '📍 Delegacia da Mulher mais próxima (DDM/DEAM)<br>Ligue <strong>180</strong> para localizar a mais próxima.';

  // Código secreto
  const elCod = document.getElementById('plano-codigo');
  if(elCod) elCod.innerHTML = c1nome ? `Combine com <strong>${c1nome}</strong> uma palavra ou frase de código que significa "estou em perigo, me ajude". Ex: <em>"Preciso da receita."</em>` : '<span class="plano-step-vazio">Preencha sua rede de apoio para personalizar este passo.</span>';

  // Risco atual
  const risco = state.jc_risco || '';
  const elR = document.getElementById('plano-risco');
  const riscoTextos = { verde:'🟢 Segura agora — mas mantenha o plano sempre atualizado.', amarelo:'🟡 Preocupada — fale com sua pessoa de confiança hoje. Tenha o plano sempre acessível.', vermelho:'🔴 EM PERIGO — ligue 190 agora. Saia para um lugar seguro. Acione sua rede.' };
  if(elR) elR.innerHTML = riscoTextos[risco] || '<span class="plano-step-vazio">Preencha o Risco Atual na seção Jurídico.</span>';

  // Mensagem personalizada
  const elMsg = document.getElementById('plano-msg-rapida');
  const msg = c1nome ? `${c1nome}, preciso de você. Pode me ligar agora? 💜` : 'Oi, preciso de você. Pode me ligar agora? 💜';
  if(elMsg) elMsg.textContent = msg;

  showToast('✅ Plano gerado com seus dados!');
}

function copiarMsgAjuda(){
  const el = document.getElementById('plano-msg-rapida');
  const msg = el ? el.textContent : 'Oi, preciso de você. Pode me ligar agora? 💜';
  navigator.clipboard.writeText(msg).then(()=>showToast('💬 Mensagem copiada!')).catch(()=>showToast('Selecione e copie manualmente.'));
}

function imprimirPlano(){
  gerarPlanoSeguranca();
  setTimeout(()=>window.print(), 300);
}

