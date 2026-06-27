/* ============================================================
   security.js — PIN, PIN de pânico, modo sigilo, saída de emergência e bloqueio por inatividade.
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== PIN ===== */

/* ═══ MODO SIGILO ══════════════════════════════════════════════
   SIGILO_KEY: localStorage guarda se o modo sigilo está ativo.
   Código secreto: PIN normal + "0000" (ex: PIN 1234 → digita 1234,
   depois para abrir o diário digita PIN real na tela de PIN).
   
   Fluxo:
   - App abre → se sigilo ativo → mostra tela de tarefas
   - Usuária digita PIN real na "barra de busca" → app abre
   - Se PIN errado → não acontece nada (não dá erro, não denuncia)
   ═══════════════════════════════════════════════════════════════ */

const SIGILO_KEY = 'diario_sigilo_ativo';
let _sigiloBuffer = '';

function initSigilo() {
  const ativo = localStorage.getItem(SIGILO_KEY) === '1';
  const pinGuardado = localStorage.getItem(PIN_KEY);
  
  // Só ativa o disfarce se tiver PIN configurado E modo sigilo ativo
  if (ativo && pinGuardado && pinGuardado !== 'none') {
    document.getElementById('sigilo-screen').classList.remove('hidden');
    // Esconde splash e pin-screen — o disfarce é a "primeira tela"
    const splash = document.getElementById('app-splash');
    if(splash) { splash.classList.add('fade-out'); setTimeout(()=>splash.classList.add('gone'),300); }
    return true; // sigilo ativo
  }
  return false; // sigilo inativo — carrega normalmente
}

function sigiloPinFocus() {
  const input = document.getElementById('sigilo-pin-input');
  if(input) { input.value=''; _sigiloBuffer=''; sigiloUpdateDots(); input.focus(); }
}

function sigiloPinInput(val) {
  _sigiloBuffer = val.replace(/[^0-9]/g,'').slice(0,4);
  sigiloUpdateDots();
  if(_sigiloBuffer.length === 4) {
    setTimeout(sigiloCheckPin, 150);
  }
}

function sigiloUpdateDots() {
  for(let i=0;i<4;i++){
    const d = document.getElementById('spd'+i);
    if(d) d.classList.toggle('filled', i < _sigiloBuffer.length);
  }
}

function sigiloCheckPin() {
  const stored = localStorage.getItem(PIN_KEY);
  if(_sigiloBuffer === stored) {
    // PIN correto — abre o app real com transição suave
    const sig = document.getElementById('sigilo-screen');
    sig.style.opacity = '1';
    sig.style.transition = 'opacity .4s ease';
    sig.style.opacity = '0';
    setTimeout(() => {
      sig.classList.add('hidden');
      sig.style.opacity = '';
      sig.style.transition = '';
      // Pula a tela de PIN (já autenticou)
      document.getElementById('pin-screen').classList.add('hidden');
      initOnboarding();
    }, 400);
  } else {
    // PIN errado — limpa silenciosamente (não dá nenhum feedback)
    _sigiloBuffer = '';
    const input = document.getElementById('sigilo-pin-input');
    if(input) { input.value=''; }
    sigiloUpdateDots();
  }
}


function toggleSigiloFromInst() {
  const btn = document.getElementById('sigilo-toggle-btn');
  if(sigiloAtivo()){
    desativarSigilo();
    if(btn) btn.textContent = '🔒 Ativar modo sigilo';
  } else {
    ativarSigilo();
    if(btn) btn.textContent = '✅ Modo sigilo ativo';
  }
}
function updateSigiloBtn() {
  const btn = document.getElementById('sigilo-toggle-btn');
  if(btn) btn.textContent = sigiloAtivo() ? '✅ Modo sigilo ativo' : '🔒 Ativar modo sigilo';
}

function sigiloTab(btn) {
  document.querySelectorAll('.sig-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
}

function ativarSigilo() {
  const pin = localStorage.getItem(PIN_KEY);
  if(!pin || pin === 'none') {
    showToast('Configure um PIN primeiro para ativar o modo sigilo.');
    return;
  }
  localStorage.setItem(SIGILO_KEY, '1');
  showToast('🔒 Modo sigilo ativado! Próxima abertura mostrará o organizador de tarefas.');
}

function desativarSigilo() {
  localStorage.removeItem(SIGILO_KEY);
  showToast('Modo sigilo desativado.');
}

function sigiloAtivo() {
  return localStorage.getItem(SIGILO_KEY) === '1';
}
/* ══════════════════════════════════════════════════════════════ */


let pinBuffer='';
let pinMode=''; // 'enter'|'setup1'|'setup2'
let pinSetupFirst='';
let pinAttempts=0;
let pinBlockedUntil=0;


/* ═══ TELA INSTITUCIONAL ═══════════════════════════════ */
const INST_KEY = 'diario_inst_shown';

function initInstitutional() {
  const shown = localStorage.getItem(INST_KEY);
  if (!shown) {
    openInstitutional();
  }
}

function openInstitutional() {
  const el = document.getElementById('inst-overlay');
  if (el) {
    el.classList.remove('hidden');
    const vEl = document.getElementById('inst-version');
    if (vEl) {
      const ano = new Date().getFullYear();
      vEl.textContent = 'v20 · Projeto Rompendo o Silêncio · ' + ano;
    }
    updateSigiloBtn();
  }
}

function closeInstitutional() {
  localStorage.setItem(INST_KEY, '1');
  const el = document.getElementById('inst-overlay');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity .35s ease';
    setTimeout(() => {
      el.classList.add('hidden');
      el.style.opacity = '';
      el.style.transition = '';
    }, 360);
  }
}
/* ═══════════════════════════════════════════════════════ */

function initPin(){
  const stored=localStorage.getItem(PIN_KEY);
  const screen=document.getElementById('pin-screen');
  if(!stored){
    pinMode='setup1';
    document.getElementById('pin-title').textContent='Seu diário é só seu';
    document.getElementById('pin-sub').textContent='Escolha 4 números para proteger o que você escreve aqui';
    document.getElementById('pin-context-box').style.display='block';
    document.getElementById('pin-skip-btn').style.display='block';
  } else if(stored==='none'){
    screen.classList.add('hidden');
  } else {
    pinMode='enter';
    document.getElementById('pin-title').textContent='Seu diário';
    document.getElementById('pin-sub').textContent='Digite seu PIN para entrar';
    document.getElementById('pin-skip-btn').style.display='none';
  }
}

function pinKey(d){
  if(!d) return;
  if(Date.now()<pinBlockedUntil){
    const secs=Math.ceil((pinBlockedUntil-Date.now())/1000);
    document.getElementById('pin-error').textContent='Aguarde '+secs+'s para tentar novamente.';
    return;
  }
  if(pinBuffer.length>=4) return;
  pinBuffer+=d;
  updatePinDots();
  if(pinBuffer.length===4) setTimeout(checkPin,120);
}

function pinDel(){
  pinBuffer=pinBuffer.slice(0,-1);
  updatePinDots();
  document.getElementById('pin-error').textContent='';
}

function updatePinDots(){
  for(let i=0;i<4;i++){
    const dot=document.getElementById('pd'+i);
    dot.classList.toggle('filled',i<pinBuffer.length);
  }
}

async function checkPin(){
  const stored=localStorage.getItem(PIN_KEY);
  if(pinMode==='enter'){
    // Verifica PIN de pânico primeiro
    if(await verificarPanicoPIN(pinBuffer)){
      pinBuffer=''; updatePinDots(); return;
    }
    if(await pinMatches(pinBuffer, PIN_KEY)){
      pinAttempts=0;
      document.getElementById('pin-screen').classList.add('hidden');
      initOnboarding();
    } else {
      pinAttempts++;
      if(pinAttempts>=3){
        pinBlockedUntil=Date.now()+30000;
        pinAttempts=0;
        document.getElementById('pin-error').textContent='3 tentativas incorretas. Aguarde 30s.';
      } else {
        document.getElementById('pin-error').textContent='PIN incorreto. Tentativa '+pinAttempts+'/3.';
      }
      pinBuffer='';
      updatePinDots();
    }
  } else if(pinMode==='setup1'){
    pinSetupFirst=pinBuffer;
    pinBuffer='';
    updatePinDots();
    pinMode='setup2';
    document.getElementById('pin-sub').textContent='Repita o PIN para confirmar';
    document.getElementById('pin-error').textContent='';
  } else if(pinMode==='setup2'){
    if(pinBuffer===pinSetupFirst){
      hashPin(pinBuffer).then(h=>{ localStorage.setItem(PIN_KEY,h); });
      document.getElementById('pin-screen').classList.add('hidden');
      showToast('🔒 PIN criado com sucesso!');
      initOnboarding();
    } else {
      document.getElementById('pin-error').textContent='PINs diferentes. Tente novamente.';
      pinBuffer=''; pinSetupFirst='';
      updatePinDots();
      pinMode='setup1';
      document.getElementById('pin-sub').textContent='Escolha 4 dígitos para proteger seu diário';
    }
  }
}

function pinSkip(){
  localStorage.setItem(PIN_KEY,'none');
  document.getElementById('pin-screen').classList.add('hidden');
  initOnboarding();
}

function lockApp(){
  const stored=localStorage.getItem(PIN_KEY);
  if(!stored||stored==='none'){ showToast('Configure um PIN primeiro'); return; }
  pinBuffer=''; pinMode='enter';
  updatePinDots();
  document.getElementById('pin-error').textContent='';
  document.getElementById('pin-title').textContent='Seu diário';
  document.getElementById('pin-sub').textContent='Digite seu PIN para entrar';
  document.getElementById('pin-setup-info').style.display='none';
  document.getElementById('pin-skip-btn').style.display='none';
  document.getElementById('pin-screen').classList.remove('hidden');
  // Esconde botão SOS durante PIN
  const sos = document.getElementById('btn-ajuda-agora');
  if(sos) sos.classList.add('hidden');
}


/* ===== SAÍDA DE EMERGÊNCIA ===== */
let _exitTaps=0;
let _exitTimer=null;
function emergencyExit(){
  _exitTaps++;
  clearTimeout(_exitTimer);
  if(_exitTaps>=2){
    // Apenas FOGE rápido para uma página neutra.
    // NÃO apaga nada — os dados continuam protegidos pelo PIN e voltam
    // ao reabrir o app. Isso preserva os registros (inclusive provas).
    try{ window.location.replace('https://www.google.com.br/search?q=clima+hoje'); }
    catch(e){ window.location.href='https://www.google.com.br'; }
  } else {
    showToast('Toque novamente para sair do app 🚪');
    _exitTimer=setTimeout(()=>{ _exitTaps=0; },3000);
  }
}


/* ===== AUTO-LOCK POR INATIVIDADE ===== */
let inactivityTimer = null;
let inactivityWarnTimer = null;
let countdownInterval = null;
const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutos
const WARN_BEFORE_MS = 30 * 1000;     // avisa 30s antes

function resetInactivityTimer(){
  clearTimeout(inactivityTimer);
  clearTimeout(inactivityWarnTimer);
  clearInterval(countdownInterval);
  document.getElementById('inactivity-warning').classList.remove('show');

  const stored = localStorage.getItem('diario_pin_v1');
  if(!stored || stored === 'none') return; // só auto-lock se tiver PIN

  inactivityWarnTimer = setTimeout(() => {
    const warn = document.getElementById('inactivity-warning');
    warn.classList.add('show');
    let secs = 30;
    document.getElementById('inactivity-countdown').textContent = secs;
    countdownInterval = setInterval(() => {
      secs--;
      document.getElementById('inactivity-countdown').textContent = secs;
      if(secs <= 0){ clearInterval(countdownInterval); }
    }, 1000);
  }, INACTIVITY_MS - WARN_BEFORE_MS);

  inactivityTimer = setTimeout(() => {
    lockApp();
    document.getElementById('inactivity-warning').classList.remove('show');
  }, INACTIVITY_MS);
}

['mousemove','keydown','touchstart','click','scroll'].forEach(ev => {
  document.addEventListener(ev, resetInactivityTimer, { passive: true });
});


/* ═══ DETECÇÃO DE NOVO DIA ════════════════════════════════ */
function checkNewDay(){
  // Verifica se virou meia-noite enquanto o app estava aberto
  const today = getToday();
  if(state._date && state._date !== today){
    _arquivarDiaAnterior(state, state._date);
    _resetDailyState();
    showNewDayBanner();
  }
}

function _resetDailyState(){
  // Remove do state tudo que NÃO é permanente
  const today = getToday();
  for(const k of Object.keys(state)){
    if(!PERM_KEYS.has(k) && k !== '_date'){
      delete state[k];
    }
  }
  state._date = today;

  // Limpa a UI — checkboxes, moods, textareas, etc
  document.querySelectorAll('.percepcao-item, .alerta-item').forEach(el=>{
    el.classList.remove('checked','on');
    el.setAttribute('aria-pressed','false');
  });
  document.querySelectorAll('.mood-btn, .gatilho-btn, .ml-mood-btn').forEach(el=>{
    el.classList.remove('selected','on');
  });
  document.querySelectorAll('.corpo-item').forEach(el=>el.classList.remove('on'));
  document.querySelectorAll('.escala-btn, .quick-num, .ml-int-btn').forEach(el=>el.classList.remove('on'));
  document.querySelectorAll('.risco-opcao').forEach(el=>{
    el.classList.remove('on-verde','on-amarelo','on-vermelho');
  });
  document.querySelectorAll('[data-key]').forEach(el=>{
    const k = el.getAttribute('data-key');
    if(!PERM_KEYS.has(k)){
      if(el.tagName==='TEXTAREA'||el.type==='text'||el.type==='tel') el.value='';
    }
  });
  document.getElementById('risco-urgente')?.classList.remove('show');

  // Reseta progresso
  updateProgress();
  saveState();
}

function showNewDayBanner(){
  // Remove banner anterior se existir
  document.getElementById('new-day-banner')?.remove();

  const banner = document.createElement('div');
  banner.id = 'new-day-banner';
  banner.innerHTML = `
    <div class="ndb-icon">🌅</div>
    <div class="ndb-body">
      <div class="ndb-title">Novo dia, nova página</div>
      <div class="ndb-text">Suas respostas de ontem foram salvas no Histórico. Este espaço está pronto para hoje.</div>
    </div>
    <button class="ndb-close" onclick="this.parentElement.remove()" aria-label="Fechar">✕</button>
  `;
  // Insere no topo do container, após o header
  const container = document.querySelector('.container');
  const header = container?.querySelector('.header');
  if(header) header.after(banner);
  else container?.prepend(banner);

  // Remove automaticamente após 6s
  setTimeout(()=>banner.remove(), 6000);
}

// Verifica a cada minuto se virou meia-noite (app aberto em segundo plano)
setInterval(checkNewDay, 60000);

// Verifica quando o app volta do background
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible') checkNewDay();
});
/* ════════════════════════════════════════════════════════ */


// Ano dinâmico no rodapé
(function(){ 
  const el = document.getElementById('footer-year');
  if(el) el.textContent = new Date().getFullYear();
})();


/* ===== PIN DE PÂNICO ===== */
const PANICO_PIN_KEY = 'diario_panico_pin';
async function salvarPanicoPIN(){
  const input = document.getElementById('panico-pin-input');
  const status = document.getElementById('panico-status');
  if(!input) return;
  const pin = input.value.replace(/\D/g,'');
  if(pin.length !== 4){ showToast('O PIN de pânico deve ter 4 dígitos.'); return; }
  // Não pode ser igual ao PIN principal (compara contra hash ou legado)
  if(await pinMatches(pin, PIN_KEY)){ showToast('⚠️ O PIN de pânico não pode ser igual ao PIN principal.'); return; }
  localStorage.setItem(PANICO_PIN_KEY, await hashPin(pin));
  input.value = '';
  if(status) status.textContent = '✅ PIN de pânico configurado! Ao digitá-lo na entrada do app, o modo sigilo abrirá automaticamente.';
  showToast('🔐 PIN de pânico salvo!');
}

// Integra o PIN de pânico na verificação do PIN principal
async function verificarPanicoPIN(pinDigitado){
  const panico = localStorage.getItem(PANICO_PIN_KEY);
  if(panico && await pinMatches(pinDigitado, PANICO_PIN_KEY)){
    // Ativa sigilo e vai direto para a tela de tarefas
    localStorage.setItem(SIGILO_KEY, '1');
    document.getElementById('pin-screen').classList.add('hidden');
    document.getElementById('sigilo-screen').classList.remove('hidden');
    return true;
  }
  return false;
}


/* ===== PIN SHAKE ===== */
function pinShake() {
  const grid = document.querySelector('.pin-grid');
  if(!grid) return;
  grid.style.animation = 'none';
  grid.offsetHeight; // reflow
  grid.style.animation = 'pinShake .4s ease';
  setTimeout(()=>{ grid.style.animation=''; }, 450);
}

// ─── INIT DAS NOVAS FEATURES (após todas as declarações) ───
setTimeout(function(){
  mostrarAfirmacao();
  loadTimeline();
  atualizarVisibilidadeBtnAjuda();
}, 100);

