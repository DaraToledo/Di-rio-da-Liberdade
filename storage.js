/* ============================================================
   storage.js — Salvar e ler dados, sanitização e auto-save (debounce).
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== STORAGE ===== */
function getToday(){ return new Date().toISOString().split('T')[0]; }

function _splitState(){
  // Separa state em diário (com data) e permanente
  const daily={}, perm={};
  for(const [k,v] of Object.entries(state)){
    if(PERM_KEYS.has(k)) perm[k]=v;
    else daily[k]=v;
  }
  return {daily, perm};
}

function loadState(){
  try{
    // 1. Carrega dados permanentes
    const p=localStorage.getItem(PERM_KEY);
    if(p) Object.assign(state, JSON.parse(p));

    // 2. Carrega dados do dia — só se forem de hoje
    const r=localStorage.getItem(STORE_KEY);
    if(r){
      const saved=JSON.parse(r);
      const savedDate=saved._date||'';
      const today=getToday();
      if(savedDate===today){
        // Mesmo dia — restaura tudo normalmente
        Object.assign(state, saved);
      } else {
        // Dia diferente — arquiva no histórico e NÃO restaura campos diários
        _arquivarDiaAnterior(saved, savedDate);
        // Mantém só a data de hoje
        state._date=today;
        saveState();
      }
    } else {
      state._date=getToday();
    }
  }catch(e){ console.warn('loadState erro:', e); }

  try{ const h=localStorage.getItem(HIST_KEY); if(h) allEntries=JSON.parse(h); }catch(e){}
}

function _arquivarDiaAnterior(savedState, dateStr){
  if(!dateStr) return;
  try{
    const h=localStorage.getItem(HIST_KEY);
    const entries=h?JSON.parse(h):{};
    if(!entries[dateStr]) entries[dateStr]={};
    // Arquiva todos os campos diários relevantes
    const camposDiarios=['p_incomoda','p_tempo','e_dor','r1','r2','r3','r4','r5','r_livre',
      'desabafo1','desabafo2','desabafo3','sinais_obs','comp_obs','perigo_obs'];
    for(const k of camposDiarios){
      if(savedState[k]) entries[dateStr][k]=savedState[k];
    }
    if(savedState.escala) entries[dateStr].escala=savedState.escala;
    if(savedState.quickMoods) entries[dateStr].quickMoods=savedState.quickMoods;
    // Conta itens marcados
    const percChecked=['p1','p2','p3','p4','p5','pd1','pd2','pd3','pd4','pd5','pd6']
      .filter(k=>savedState[k]).length;
    if(percChecked) entries[dateStr].percChecked=percChecked;
    const sinaisChecked=Object.keys(savedState)
      .filter(k=>k.startsWith('a')&&/^a\d+$/.test(k)&&savedState[k]).length;
    if(sinaisChecked) entries[dateStr].sinaisChecked=sinaisChecked;
    entries[dateStr].date=dateStr;
    localStorage.setItem(HIST_KEY, JSON.stringify(entries));
  }catch(e){ console.warn('Erro ao arquivar:', e); }
}

function saveState(){
  try{
    const today = getToday();
    state._date = today;
    const {daily, perm} = _splitState();

    // Salva diário (com data)
    localStorage.setItem(STORE_KEY, JSON.stringify({...daily, _date:today}));
    // Salva permanente separado
    localStorage.setItem(PERM_KEY, JSON.stringify(perm));

    // Sincroniza campos relevantes para allEntries (histórico)
    if(!allEntries[today]) allEntries[today] = {};
    allEntries[today].date = today;
    const camposDiarios = ['p_incomoda','p_tempo','e_dor','r1','r2','r3','r4','r5',
      'r_livre','desabafo1','desabafo2','desabafo3','sinais_obs','comp_obs','perigo_obs'];
    for(const k of camposDiarios){
      if(state[k]) allEntries[today][k] = state[k];
    }
    // Humor e intensidade
    if(state.escala) allEntries[today].escala = state.escala;
    // Checkboxes marcadas — conta percepção e sinais
    const percChecked = ['p1','p2','p3','p4','p5','pd1','pd2','pd3','pd4','pd5','pd6']
      .filter(k=>state[k]).length;
    if(percChecked) allEntries[today].percChecked = percChecked;
    const sinaisChecked = Object.keys(state).filter(k=>k.startsWith('a')&&/^a\d+$/.test(k)&&state[k]).length;
    if(sinaisChecked) allEntries[today].sinaisChecked = sinaisChecked;

    saveEntries();
    showSaveInd();
  }catch(e){ console.warn('saveState erro:',e); }
}
function saveEntries(){
  try{ localStorage.setItem(HIST_KEY,JSON.stringify(allEntries)); }catch(e){}
}
function showSaveInd(){ const el=document.getElementById('save-ind'); el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2000); }
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }


/* ===== SANITIZAÇÃO ===== */
function sanitize(text){
  if(typeof text!=='string') return text;
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,'')
    .replace(/<[^>]*on\w+\s*=\s*["'][^"']*["'][^>]*>/gi,'')
    .slice(0,5000);
}


/* ===== DEBOUNCE AUTO-SAVE ===== */
let _autoSaveTimer=null;
function scheduleAutoSave(){
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer=setTimeout(()=>{ saveState(); saveEntries(); },15000);
}
window.addEventListener('input', scheduleAutoSave);

