/* ============================================================
   features.js — Onboarding, modo leve, jornada guiada e conquistas.
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== ONBOARDING ===== */
const OB_KEY = 'diario_onboarded';
function _updateGreeting(){
  // Saudação baseada no horário + nome — atualiza TODOS os elementos de saudação
  const h = new Date().getHours();
  const period = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const icon = h < 12 ? '🌅' : h < 18 ? '☀️' : '🌙';
  const nome = (state && state.nome) ? state.nome.split(' ')[0] : '';
  const greeting = nome ? `${period}, ${nome} ${icon}` : `${period} ${icon}`;
  // Atualiza o greeting no Modo Leve
  const greetEl = document.getElementById('ml-greeting');
  if(greetEl) greetEl.textContent = greeting;
  // Também atualiza o título do header principal se existir
  const headerGreetEl = document.getElementById('header-greeting');
  if(headerGreetEl) headerGreetEl.textContent = greeting;
  return greeting;
}
function initOnboarding(){
  atualizarVisibilidadeBtnAjuda();
  const done = localStorage.getItem(OB_KEY);
  if(!done){
    // Show after PIN is dismissed
    document.getElementById('onboarding-overlay').classList.remove('hidden');
  }

  // Atualiza saudação em todos os elementos
  _updateGreeting();

  // ── FLUXO DE ENTRADA ────────────────────────────────────────────
  // Se a usuária já preencheu o Modo Leve hoje → vai direto pro full-app.
  // Caso contrário → mostra o Modo Leve em tela cheia.
  const today = (new Date()).toISOString().slice(0,10);
  const mlDoneToday = (localStorage.getItem('diario_ml_date') === today);
  const ml  = document.getElementById('modo-leve-card');
  const app = document.getElementById('full-app');

  if(mlDoneToday){
    // Pular Modo Leve → revelar full-app e ir para Percepção
    if(ml)  ml.style.display = 'none';
    if(app){ app.style.display = ''; app.style.animation = 'fadeIn .4s ease'; }
    document.body.classList.remove('ml-active');
    // Mostra saudação temporária no topo do app principal
    _showMainGreeting();
    // Navega para Fase 0 / Percepção (initPhaseNav já rodou antes deste ponto)
    switchPhase(0, true);
    const percepcaoTab = document.querySelector('[aria-controls="page-percepcao"]');
    showPage('percepcao', percepcaoTab);
  } else {
    // Mostrar Modo Leve em tela cheia; full-app permanece oculto
    if(ml)  ml.style.display  = '';
    if(app) app.style.display = 'none';
    document.body.classList.add('ml-active');
  }
  // ────────────────────────────────────────────────────────────────
}
function closeOnboarding(){
  localStorage.setItem(OB_KEY,'1');
  document.getElementById('onboarding-overlay').classList.add('hidden');
}

function _showMainGreeting(){
  // Mostra banner de saudação no topo do app principal (quando ML já foi feito hoje)
  const existing = document.getElementById('main-greeting-banner');
  if(existing) return; // já exibido
  const greeting = _updateGreeting();
  const banner = document.createElement('div');
  banner.id = 'main-greeting-banner';
  banner.style.cssText = 'display:flex;align-items:center;gap:.75rem;background:linear-gradient(135deg,rgba(203,87,242,.12),rgba(200,144,42,.08));border:.5px solid rgba(203,87,242,.3);border-radius:14px;padding:.85rem 1.1rem;margin-bottom:1.25rem;animation:fadeIn .4s ease;';
  banner.innerHTML = `
    <span style="font-size:1.4rem;flex-shrink:0;">${new Date().getHours()<12?'🌅':new Date().getHours()<18?'☀️':'🌙'}</span>
    <div style="flex:1;">
      <div style="font-family:\'Playfair Display\',serif;font-size:1rem;color:var(--gold-l);font-style:italic;margin-bottom:.15rem;">${greeting}</div>
      <div style="font-size:.82rem;color:var(--ts);line-height:1.5;">Seu diário está aqui. Vá no seu ritmo.</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:var(--tm);font-size:.9rem;cursor:pointer;flex-shrink:0;padding:.1rem .2rem;">✕</button>
  `;
  const container = document.querySelector('.container');
  const header = container?.querySelector('.header');
  if(header) header.after(banner);
  else container?.prepend(banner);
  setTimeout(()=>{ if(banner.parentElement) banner.remove(); }, 8000);
}


/* ===== MODO LEVE ===== */
let mlState = { mood: null, intensity: 0, text: '' };
const emotionalResponses = {
  '😰': ['Ansiedade é muito cansativa… você não precisa passar por isso sozinha.', 'Respira fundo. Você está aqui, e isso já é muito.'],
  '😤': ['Raiva também tem seu lugar. O que você está sentindo é válido.', 'Essa raiva te diz algo importante. Você tem o direito de se defender.'],
  '😔': ['Parece que hoje está sendo um dia difícil…', 'Tudo bem não estar bem. Estou aqui com você.'],
  '😨': ['Medo é um sinal que o seu corpo manda para te proteger. Você não está exagerando.', 'Você não precisa enfrentar esse medo sozinha.'],
  '😌': ['Que bom que você está sentindo algum alívio hoje 🌿', 'Guarde essa leveza — ela pertence a você.'],
  '🏋️‍♀️': ['Que força! Continue se cuidando com tanto carinho.', 'Essa energia que você sente é sua — ninguém pode tirar.'],
  '🧘‍♀️': ['Paz é um presente que você merece todos os dias.', 'Que lindo sentir essa tranquilidade. Aproveite.'],
  '😶‍🌫️': ['Confusão faz parte do processo. Não precisa ter tudo claro agora.', 'Às vezes só nomear o que sentimos já ajuda a organizar por dentro.'],
};
const intensityResponses = {
  high: ['Parece que hoje está sendo pesado demais… Você não precisa carregar isso sozinha. 💛', 'Intensidade assim merece atenção. Quer tentar um exercício rápido de respiração?', 'Se estiver em crise, ligue 188 (CVV) — é gratuito e sigiloso. ❤️'],
  mid: ['Sentindo o peso, mas seguindo em frente. Isso tem nome: coragem.', 'Que tal uma pausa pequena agora? Só respirar um pouco…'],
  low: ['Que bom que hoje está um pouco mais leve! 🌿', 'Continue cuidando de você com esse carinho.']
};

function mlMood(btn, emoji, label){
  document.querySelectorAll('.ml-mood-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  mlState.mood = emoji;
  showEmotionalResponse(emoji);
  updateJourneyBtn();
  // sync to main quick entry
  quickState.moods = [emoji];
}

function mlIntensity(btn, val){
  document.querySelectorAll('.ml-int-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  mlState.intensity = val;
  quickState.escala = val;
  // show response if no mood selected yet, or update
  if(!mlState.mood && val){
    const cat = val >= 8 ? 'high' : val >= 5 ? 'mid' : 'low';
    const resps = intensityResponses[cat];
    showEmotionalToast(resps[Math.floor(Math.random()*resps.length)]);
  }
  updateJourneyBtn();
}

function mlTextInput(){
  mlState.text = document.getElementById('ml-open-text').value;
}

function showEmotionalResponse(emoji){
  const resps = emotionalResponses[emoji] || [];
  if(!resps.length) return;
  const msg = resps[Math.floor(Math.random()*resps.length)];
  const el = document.getElementById('ml-emotional-resp');
  el.textContent = msg;
  el.classList.add('show');
  // also show as floating toast
  showEmotionalToast(msg);
}

function showEmotionalToast(msg){
  const el = document.getElementById('emotional-toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4000);
}

function updateJourneyBtn(){
  // buttons are now inline in each page - nothing to do globally
}

function revealFullApp(){
  const app = document.getElementById('full-app');
  const ml  = document.getElementById('modo-leve-card');

  // Remove classe de tela cheia do body
  document.body.classList.remove('ml-active');

  // Esconde Modo Leve
  if(ml){ ml.style.display = 'none'; }

  // Revela o full-app com fade
  if(app){ app.style.display = ''; app.style.animation = 'fadeIn .4s ease'; }

  // Marca que ML foi preenchido hoje
  localStorage.setItem('diario_ml_date', getToday());

  // Navega para Fase 0 / página Percepção
  switchPhase(0, true);
  const percepcaoTab = document.querySelector('[aria-controls="page-percepcao"]');
  showPage('percepcao', percepcaoTab);
}

function mlSave(){
  const today = getToday();
  if(!allEntries[today]) allEntries[today] = {};
  if(mlState.mood) allEntries[today].quickMoods = [mlState.mood];
  if(mlState.intensity) allEntries[today].escala = mlState.intensity;
  const txt = document.getElementById('ml-open-text').value.trim();
  if(txt){ allEntries[today].p_incomoda = txt; state.p_incomoda = txt; }
  allEntries[today].date = today;
  saveEntries();
  if(mlState.intensity){ state.escala = mlState.intensity; syncEscalaFromQuick(mlState.intensity); }
  saveState();
  updateProgress();
  showToast('Registrado com carinho 💛');
  showEmotionalToast('Obrigada por se cuidar hoje. Isso importa muito. 🌹');
  // after saving, offer to go deeper
  revealFullApp();
}

function mlDeepen(){
  // Salva o estado do ML antes de revelar (mesma lógica do mlSave, sem toast duplo)
  const today = getToday();
  if(!allEntries[today]) allEntries[today] = {};
  if(mlState.mood) allEntries[today].quickMoods = [mlState.mood];
  if(mlState.intensity) allEntries[today].escala = mlState.intensity;
  const txt = (document.getElementById('ml-open-text')||{}).value||'';
  if(txt.trim()){ allEntries[today].p_incomoda = txt.trim(); state.p_incomoda = txt.trim(); }
  allEntries[today].date = today;
  saveEntries();
  if(mlState.intensity){ state.escala = mlState.intensity; syncEscalaFromQuick(mlState.intensity); }
  saveState();
  updateProgress();

  // Revela o full-app e navega para Percepção
  revealFullApp();

  // Espelha humor no quick-mood da Fase 1 (emocional)
  if(mlState.mood){
    document.querySelectorAll('.quick-mood').forEach(b => {
      b.classList.toggle('on', b.title === mlState.mood || b.getAttribute('aria-label') === mlState.mood);
    });
  }

  showToast('Modo completo ativado ✨');
}


/* ===== JORNADA GUIADA ===== */
const journeyOrder = ['percepcao','emocional','reflexao','desabafo','conquistas'];
let currentJourneyIdx = 0;

function journeyTo(id){
  const tab = document.querySelector(`[aria-controls="page-${id}"]`);
  showPage(id, tab);
  window.scrollTo({top:0,behavior:'smooth'});
  const idx = journeyOrder.indexOf(id);
  if(idx >= 0) currentJourneyIdx = idx;
}

function nextJourneyStep(){
  currentJourneyIdx = (currentJourneyIdx + 1) % journeyOrder.length;
  journeyTo(journeyOrder[currentJourneyIdx]);
}


/* ===== CONQUISTAS ===== */
const VIC_KEY = 'diario_conquistas';
let conquistasList = [];
let vicSelectedCat = '';

const SUELEN_QUOTES = [
  'Você não precisa estar pronta para começar. Você só precisa começar para estar pronta.',
  'Cada vez que você escolhe se cuidar, você está dizendo: eu mereço.',
  'Pequenas vitórias constroem grandes transformações. Uma de cada vez.',
  'O silêncio que você quebrou hoje foi um ato de coragem imensa.',
  'Você sobreviveu a todos os seus dias difíceis até agora. Isso é extraordinário.',
  'Pedir ajuda não é fraqueza. É o ato mais corajoso que existe.',
  'Dizer não é uma frase completa. Você não deve explicações.',
  'A mulher que você está se tornando orgulha a mulher que você foi.',
  'Você merece paz. Não como recompensa — como direito.',
  'Cada limite que você coloca é um amor próprio que você está construindo.'
];

function vicSelectCat(btn, cat) {
  document.querySelectorAll('.vic-cat-btn').forEach(b => b.classList.remove('sel'));
  if(vicSelectedCat === cat) {
    vicSelectedCat = '';
  } else {
    btn.classList.add('sel');
    vicSelectedCat = cat;
  }
}

function updateVicCounters() {
  const total = conquistasList.length;
  const today = getToday();
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const semana = conquistasList.filter(c => c.iso && new Date(c.iso) >= weekAgo).length;
  const hoje = conquistasList.filter(c => c.iso && c.iso.startsWith(today)).length;

  const elHoje = document.getElementById('vic-cnt-hoje');
  const elSemana = document.getElementById('vic-cnt-semana');
  const elTotal = document.getElementById('vic-cnt-total');
  if(elHoje) elHoje.textContent = hoje;
  if(elSemana) elSemana.textContent = semana;
  if(elTotal) elTotal.textContent = total;

  // Streak box — motivacional baseado no total
  const streakNum = document.getElementById('vic-streak-num');
  const streakLabel = document.getElementById('vic-streak-label');
  const streakIcon = document.getElementById('vic-streak-icon');
  if(streakNum) {
    if(total === 0) {
      streakNum.textContent = '0';
      streakLabel.textContent = 'vitórias registradas — a primeira está próxima!';
      streakIcon.textContent = '🌱';
    } else if(total === 1) {
      streakNum.textContent = '1';
      streakLabel.textContent = 'primeira vitória registrada 🎉 Você começou!';
      streakIcon.textContent = '🌟';
    } else if(total < 5) {
      streakNum.textContent = total;
      streakLabel.textContent = 'vitórias registradas — você está construindo algo lindo!';
      streakIcon.textContent = '✨';
    } else if(total < 15) {
      streakNum.textContent = total;
      streakLabel.textContent = 'vitórias! Você está mais forte a cada dia.';
      streakIcon.textContent = '💜';
    } else {
      streakNum.textContent = total;
      streakLabel.textContent = 'vitórias registradas — uma guerreira de verdade!';
      streakIcon.textContent = '🦋';
    }
  }

  // Mostrar título da lista
  const listaTitle = document.getElementById('vic-lista-title');
  if(listaTitle) listaTitle.style.display = total > 0 ? '' : 'none';
}

function initVicQuote() {
  const el = document.getElementById('vic-quote-text');
  if(!el) return;
  const d = new Date();
  const idx = (d.getFullYear() * 365 + (d.getMonth() + 1) * 30 + d.getDate()) % SUELEN_QUOTES.length;
  el.textContent = '"' + SUELEN_QUOTES[idx] + '"';
}


function loadConquistas(){
  try{ const c = localStorage.getItem(VIC_KEY); if(c) conquistasList = JSON.parse(c); }catch(e){}
  renderConquistas();
  updateVicCounters();
  initVicQuote();
}

function saveConquistas(){
  try{ localStorage.setItem(VIC_KEY, JSON.stringify(conquistasList)); }catch(e){}
}

function salvarConquista(){
  const ta = document.getElementById('vic-nova-texto');
  const texto = sanitize(ta.value.trim());
  if(!texto){ showToast('Escreva sua conquista 🌟'); return; }
  const now = new Date();
  conquistasList.unshift({
    texto,
    cat: vicSelectedCat || '',
    data: now.toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),
    iso: now.toISOString()
  });
  // Reset categoria
  document.querySelectorAll('.vic-cat-btn').forEach(b => b.classList.remove('sel'));
  vicSelectedCat = '';
  // Alimenta histórico
  const todayC=getToday();
  if(!allEntries[todayC]) allEntries[todayC]={};
  allEntries[todayC].conquistas=(allEntries[todayC].conquistas||0)+1;
  allEntries[todayC].date=todayC;
  saveEntries();
  saveConquistas();
  ta.value = '';
  renderConquistas();
  showToast('🌟 Vitória registrada!');
  showEmotionalToast('Você conseguiu! Cada passo conta. Estou orgulhosa de você. 💜');
  celebrarConquista();
  updateProgress();
}

function renderConquistas(){
  const lista = document.getElementById('vic-lista');
  if(!lista) return;
  if(!conquistasList.length){
    lista.innerHTML = '<div class="vic-empty">Suas conquistas aparecerão aqui 💛<br>Toda jornada começa com um primeiro passo.</div>';
    return;
  }
  lista.innerHTML = conquistasList.slice(0,20).map((c,i) => `
    <div class="vic-entry">
      <span class="vic-entry-icon">🌟</span>
      <div class="vic-entry-body">
        <div class="vic-entry-text">${sanitize(c.texto)}${c.cat ? `<span class="vic-entry-cat">${sanitize(c.cat)}</span>` : ''}</div>
        <div class="vic-entry-date">${c.data}</div>
      </div>
      <button class="vic-del" onclick="deletarConquista(${i})" title="Remover">×</button>
    </div>`).join('');
  updateVicCounters();
}

function deletarConquista(i){
  if(!confirm("Remover esta conquista?")) return;
  conquistasList.splice(i,1);
  saveConquistas();
  renderConquistas();
  updateVicCounters();
}


/* ===== CELEBRAÇÃO CONQUISTA ===== */
function celebrarConquista() {
  // Modal de celebração
  const overlay = document.createElement('div');
  overlay.className = 'conquista-celebracao';
  const msgs = [
    ['🌟', 'Você conseguiu!', 'Cada passo conta — e esse foi enorme.'],
    ['💜', 'Vitória registrada!', 'Você está mais forte do que imagina.'],
    ['✨', 'Isso é seu!', 'Ninguém pode tirar essa conquista de você.'],
    ['🦋', 'Olha você!', 'Crescendo, mesmo nos dias difíceis.'],
    ['🌸', 'Parabéns!', 'Celebrar é um ato de resistência.']
  ];
  const [emoji, titulo, sub] = msgs[Math.floor(Math.random() * msgs.length)];
  overlay.innerHTML = `<div class="conquista-celebracao-inner">
    <span class="conquista-celebracao-emoji">${emoji}</span>
    <div class="conquista-celebracao-msg">${titulo}</div>
    <div class="conquista-celebracao-sub">${sub}</div>
  </div>`;
  document.body.appendChild(overlay);

  // Partículas coloridas
  const colors = ['#cb57f2','#e8a84a','#f8f2ff','#9b3dc8','#f0c040'];
  for(let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 18) * 360;
    const dist = 80 + Math.random() * 120;
    const tx = Math.cos(angle * Math.PI/180) * dist;
    const ty = Math.sin(angle * Math.PI/180) * dist - 60;
    p.style.cssText = `
      left:50%; top:50%;
      background:${colors[i % colors.length]};
      --tx:${tx}px; --ty:${ty}px;
      animation-delay:${Math.random()*0.2}s;
      animation-duration:${0.6 + Math.random()*0.4}s;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }

  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity .3s';
    setTimeout(() => overlay.remove(), 350);
  }, 1800);
}

