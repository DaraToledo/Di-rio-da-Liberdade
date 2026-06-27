/* ============================================================
   navigation.js — Navegação entre telas e abas.
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== NAVIGATION ===== */
function showPage(id,tab){
  const target=document.getElementById('page-'+id);
  if(!target) return;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>{ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  target.classList.add('active');
  if(tab){ tab.classList.add('active'); tab.setAttribute('aria-selected','true'); }
  if(id==='historico'){ calViewDate=new Date(); renderHistorico(); }
  const idx = journeyOrder.indexOf(id);
  if(idx >= 0) currentJourneyIdx = idx;
  // Sempre sobe ao topo ao mudar de página
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


/* ═══════════════════════════════════════════════════
   SISTEMA DE FASES — navegação por 4 fases
   ═══════════════════════════════════════════════════ */

const PHASES = [
  { id: 0, pages: ['percepcao', 'sinais'],                 firstPage: 'percepcao' },
  { id: 1, pages: ['emocional'],                            firstPage: 'emocional' },
  { id: 2, pages: ['reflexao', 'desabafo'],                firstPage: 'reflexao'  },
  { id: 3, pages: ['conquistas', 'compromisso', 'juridica'], firstPage: 'conquistas' },
];

// Seções secundárias (ficam no topbar, fora das fases)
const SECONDARY_PAGES = ['apoio', 'historico'];

let currentPhase = 0;
let _inSecondarySection = false;

function getPhaseForPage(pageId) {
  for (const ph of PHASES) {
    if (ph.pages.includes(pageId)) return ph.id;
  }
  return -1; // secundária
}

function switchPhase(phaseIdx, autoNavigate = true) {
  _inSecondarySection = false;
  currentPhase = phaseIdx;

  // Sobe ao topo sempre
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Atualiza botões da phase-bar
  document.querySelectorAll('.phase-tab').forEach((btn, i) => {
    btn.classList.remove('active', 'done');
    if (i < phaseIdx) btn.classList.add('done');
    else if (i === phaseIdx) btn.classList.add('active');
  });

  // Mostra só as subabas da fase ativa
  document.querySelectorAll('.tab').forEach(t => {
    const phaseClass = [...t.classList].find(c => c.startsWith('phase-'));
    if (!phaseClass) return;
    const tabPhase = parseInt(phaseClass.replace('phase-', '').replace('-tab', ''));
    if (tabPhase === phaseIdx) {
      t.classList.remove('hidden-tab');
    } else {
      t.classList.add('hidden-tab');
    }
  });

  // Navega para a primeira página da fase
  if (autoNavigate) {
    const firstTab = document.querySelector(`.phase-${phaseIdx}-tab`);
    const firstPageId = PHASES[phaseIdx].firstPage;
    showPage(firstPageId, firstTab);
  }

  // Salva fase no estado
  if (typeof state !== 'undefined') {
    state.currentPhase = phaseIdx;
    saveState();
  }
  // Controle de visibilidade do CVV
  if(typeof checkCVVVisibility === 'function') checkCVVVisibility(phaseIdx);
}

// Navega para seções secundárias (Histórico, Rede de Apoio) pelo topbar
function goSecondarySection(pageId, btn) {
  _inSecondarySection = true;

  // Cancela qualquer navegação pendente
  if(window._navTimer) clearTimeout(window._navTimer);

  // Mostrar CVV em seções secundárias também
  const cvvBar2 = document.getElementById('cvv-bar');
  if(cvvBar2) cvvBar2.style.display = '';

  // Esconde todas as páginas
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Esconde subnav
  const subnav = document.querySelector('.subnav-wrap');
  if(subnav) subnav.style.opacity = '0.4';

  // Mostra a página alvo
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  if (pageId === 'historico') renderHistorico();
  if (pageId === 'apoio') setTimeout(initBotoesLigar, 80);

  // Garante que page permanece ativa após qualquer scroll/timeout
  window._navTimer = setTimeout(() => {
    if (_inSecondarySection) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      if (target) target.classList.add('active');
    }
  }, 300);

  // Destaca o botão do topbar
  document.querySelectorAll('#topbar-apoio-btn, #topbar-hist-btn').forEach(b => {
    b.style.borderColor = '';
    b.style.color = '';
  });
  if (btn) {
    btn.style.borderColor = 'var(--gold-l)';
    btn.style.color = 'var(--gold-l)';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Botão "Voltar à fase" — aparece nas seções secundárias
function voltarAFase() {
  if(window._navTimer) clearTimeout(window._navTimer);
  _inSecondarySection = false;
  const subnav = document.querySelector('.subnav-wrap');
  if(subnav) subnav.style.opacity = '';
  document.querySelectorAll('#topbar-apoio-btn, #topbar-hist-btn').forEach(b => {
    b.style.borderColor = '';
    b.style.color = '';
  });
  switchPhase(currentPhase);
  if(typeof checkCVVVisibility === 'function') checkCVVVisibility(currentPhase);
}

// Avança para a próxima fase com animação suave
function nextPhase() {
  // Não interfere se estiver em seção secundária
  if (_inSecondarySection) return;
  const next = Math.min(currentPhase + 1, PHASES.length - 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => { if(!_inSecondarySection) switchPhase(next); }, 200);
}

// Inicia o sistema de fases
function initPhaseNav() {
  const savedPhase = (typeof state !== 'undefined' && state.currentPhase) ? state.currentPhase : 0;
  switchPhase(savedPhase, true);
}


function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme');
  const next=cur==='light'?'':'light';
  if(next==='light') document.documentElement.setAttribute('data-theme','light');
  else document.documentElement.removeAttribute('data-theme');
  document.getElementById('theme-btn').textContent=next==='light'?'🌙':'☀️';
  state.theme=next; saveState();
}
function applyTheme(){
  const t=state.theme||'';
  if(t==='light') document.documentElement.setAttribute('data-theme','light');
  else document.documentElement.removeAttribute('data-theme');
  document.getElementById('theme-btn').textContent=t==='light'?'🌙':'☀️';
}


/* ===== ABAS DA PÁGINA APOIO ===== */
/* apoioTab (versão antiga removida — a completa está mais abaixo neste arquivo) */


/* ===== ATUALIZA APOIO TAB para incluir novas abas ===== */
const _apoioTabOrig = window.apoioTab;
function apoioTab(btn, tabId){
  document.querySelectorAll('.tab-sec-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['apoio-rede','apoio-mapa','apoio-checklist','apoio-plano','apoio-qr'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
  const target=document.getElementById(tabId);
  if(target) target.style.display='block';
  if(tabId==='apoio-mapa'&&!window._mapaIniciado){ window._mapaIniciado=true; mapaRenderGrid(); }
  if(tabId==='apoio-checklist'&&!window._ckIniciado){ window._ckIniciado=true; ckRestoreAll(); }
  if(tabId==='apoio-rede') setTimeout(initBotoesLigar,50);
  if(tabId==='apoio-qr'&&!window._qrGerado){ window._qrGerado=true; setTimeout(gerarQRCode,100); }
  if(tabId==='apoio-plano') gerarPlanoSeguranca();
}

