/* ============================================================
   diary.js — O diário em si: percepção, humor, escala, mapa do corpo, campos e histórico.
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== QUICK ENTRY ===== */
function quickMood(btn,emoji){
  btn.classList.toggle('on');
  btn.setAttribute('aria-pressed', btn.classList.contains('on') ? 'true' : 'false');
  if(btn.classList.contains('on')){
    if(!quickState.moods.includes(emoji)) quickState.moods.push(emoji);
  } else {
    quickState.moods=quickState.moods.filter(e=>e!==emoji);
  }
}
function quickNum(btn,n){
  document.querySelectorAll('.quick-num').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  quickState.escala=n;
}
function saveQuick(){
  const today=getToday();
  if(!allEntries[today]) allEntries[today]={};
  if(quickState.moods.length) allEntries[today].quickMoods=quickState.moods;
  if(quickState.escala) allEntries[today].escala=quickState.escala;
  allEntries[today].date=today;
  saveEntries();
  // sync to main state too
  if(quickState.escala){ state.escala=quickState.escala; syncEscalaFromQuick(quickState.escala); }
  saveState();
  updateProgress();
  showToast('✓ Entrada rápida salva! 💛');
  // reset
  quickState={moods:[],escala:0};
  document.querySelectorAll('.quick-mood').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.quick-num').forEach(b=>b.classList.remove('on'));
}
function syncEscalaFromQuick(val){
  document.querySelectorAll('.escala-btn').forEach((b,i)=>{ b.classList.toggle('selected',i+1===val); });
  const msgs={1:'Que bom! Aproveite essa tranquilidade. 🌿',2:'Você está bem. Continue se cuidando. 🌿',3:'Levinho. Respire fundo. 🌿',4:'Um dia normal. Esteja presente. ✨',5:'No meio do caminho. Observe sem julgamento. ✨',6:'Sentindo o peso. Que tal uma pausa? 🤍',7:'Atenção ao que está sentindo. Você não está sozinha. 🤍',8:'Isso é muito para carregar. Busque apoio hoje. 💛',9:'Você precisa de ajuda agora. Fale com alguém de confiança. 💛',10:'Se estiver em crise, ligue 188 (CVV) agora. ❤️'};
  document.getElementById('escala-feedback').textContent=msgs[val]||'';
}


/* ===== PERCEPÇÃO ===== */
function toggleCheck(el,key){
  el.classList.toggle('checked');
  state[key]=el.classList.contains('checked');
  salvarTudo();
  updateProgress();
  // microfeedback nas perguntas diretas
  if(key.startsWith('pd')) checkMicrofeedbackPercepcao();
}
function restoreChecks(){
  document.querySelectorAll('#percepcoes .percepcao-item').forEach((el,i)=>{ if(state['p'+(i+1)]) el.classList.add('checked'); });
  document.querySelectorAll('#percepcoes-diretas .percepcao-item').forEach((el,i)=>{ if(state['pd'+(i+1)]) el.classList.add('checked'); });
  checkMicrofeedbackPercepcao();
}


/* ===== MOOD ===== */
function toggleMood(btn,key){ btn.classList.toggle('selected'); state[key]=btn.classList.contains('selected'); salvarTudo(); updateProgress(); }
function restoreMoods(){ document.querySelectorAll('.mood-btn').forEach((b,i)=>{ if(state['m'+(i+1)]) b.classList.add('selected'); }); }


/* ===== GATILHOS ===== */
function toggleGatilho(btn,key){ btn.classList.toggle('selected'); state[key]=btn.classList.contains('selected'); salvarTudo(); updateProgress(); }
function restoreGatilhos(){ document.querySelectorAll('.gatilho-btn').forEach((b,i)=>{ if(state['g'+(i+1)]) b.classList.add('selected'); }); }


/* ===== PERIGO ===== */
function togglePerigo(el,key){ el.classList.toggle('checked'); state[key]=el.classList.contains('checked'); salvarTudo(); }
function restorePerigos(){ document.querySelectorAll('#perigo-lista .perigo-item').forEach((el,i)=>{ if(state['per'+(i+1)]) el.classList.add('checked'); }); }


/* ===== CORPO — mapeamento corrigido ===== */
const CORPO_MAP = {
  cabeca:   ['br-cabeca'],
  pescoco:  ['br-pescoco'],
  ombros:   ['br-ombros'],
  peito:    ['br-peito'],
  estomago: ['br-estomago'],
  garganta: ['br-garganta'],
  coracao:  ['br-coracao'],
  abdomen:  ['br-abdomen'],
  perna:    ['br-pernas'], // Ajustado para bater com o ID do seu SVG
  bracos:   ['br-bracos']  // Ajustado para bater com o ID do seu SVG
};

function toggleCorpo(el, key, region) {
  // 1. Alterna a classe visual no botão da lista
  el.classList.toggle('selected');
  const isOn = el.classList.contains('selected');
  state[key] = isOn;

  // 2. Controla o brilho no SVG
  if (region && CORPO_MAP[region]) {
    CORPO_MAP[region].forEach(id => {
      const svgPart = document.getElementById(id);
      if (svgPart) {
        if (isOn) svgPart.classList.add('lit');
        else svgPart.classList.remove('lit');
      }
    });
  }
  salvarTudo(); 
  updateProgress();
}

function restoreCorpo() {
  const keys = ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10'];
  const regions = ['cabeca','pescoco','ombros','peito','estomago','garganta','coracao','abdomen','perna','bracos'];
  
  document.querySelectorAll('.corpo-item').forEach((el, i) => {
    if (state[keys[i]]) {
      el.classList.add('selected');
      const r = regions[i];
      if (r && CORPO_MAP[r]) {
        CORPO_MAP[r].forEach(id => {
          const svgPart = document.getElementById(id);
          if (svgPart) svgPart.classList.add('lit');
        });
      }
    }
  });
}


/* ===== ESCALA ===== */
const escalaMsgs={1:'Que bom! Aproveite essa tranquilidade. 🌿',2:'Você está bem. Continue se cuidando. 🌿',3:'Levinho. Respire fundo. 🌿',4:'Um dia normal. Esteja presente. ✨',5:'No meio do caminho. Observe sem julgamento. ✨',6:'Sentindo o peso. Que tal uma pausa? 🤍',7:'Atenção ao que está sentindo. Você não está sozinha. 🤍',8:'Isso é muito para carregar. Busque apoio hoje. 💛',9:'Você precisa de ajuda agora. Fale com alguém de confiança. 💛',10:'Se estiver em crise, ligue 188 (CVV) agora. Você não precisa passar por isso sozinha. ❤️'};
function selectEscala(btn,val){
  document.querySelectorAll('.escala-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('escala-feedback').textContent=escalaMsgs[val]||'';
  state.escala=val;
  // save to history
  const today=getToday();
  if(!allEntries[today]) allEntries[today]={};
  allEntries[today].escala=val;
  allEntries[today].date=today;
  saveEntries();
  salvarTudo(); updateProgress();
}
function restoreEscala(){
  if(!state.escala) return;
  document.querySelectorAll('.escala-btn').forEach((b,i)=>{ if(i+1===state.escala){ b.classList.add('selected'); document.getElementById('escala-feedback').textContent=escalaMsgs[state.escala]||''; }});
}


/* ===== FIELDS ===== */
function initDate(){
  const d=document.getElementById('data-hoje');
  const fmt=document.getElementById('data-assinatura');
  d.value=state.date||getToday();
  const dt=new Date(d.value+'T12:00:00');
  fmt.textContent=dt.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  d.addEventListener('change',()=>{ state.date=d.value; const dt2=new Date(d.value+'T12:00:00'); fmt.textContent=dt2.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); salvarTudo(); });
}
function initFields(){
  document.querySelectorAll('[data-key]').forEach(el=>{
    const key=el.getAttribute('data-key');
    if(el.tagName==='TEXTAREA'||el.type==='text'||el.type==='tel'||el.type==='date'){
      if(state[key]) el.value=state[key];
      if(el.tagName==='TEXTAREA'){ el.style.height='auto'; el.style.height=el.scrollHeight+'px'; }
      el.addEventListener('input',()=>{
        state[key]=sanitize(el.value);
        if(el.tagName==='TEXTAREA'){ el.style.height='auto'; el.style.height=el.scrollHeight+'px'; }
        // snapshot to history on certain keys
        if(['e_dor','desabafo1','r1','p_incomoda'].includes(key)){
          const today=getToday();
          if(!allEntries[today]) allEntries[today]={};
          allEntries[today][key]=el.value.slice(0,200);
          allEntries[today].date=today;
          saveEntries();
        }
        salvarTudo(); updateProgress();
        if(key==='revisitar') updateRevisitar();
      });
    }
  });
  updateRevisitar();
}
function updateRevisitar(){
  const val=state.revisitar||document.querySelector('[data-key="revisitar"]')?.value;
  if(!val) return;
  const diff=Math.round((new Date(val+'T12:00:00')-new Date())/(1000*60*60*24));
  const el=document.getElementById('revisitar-msg');
  if(!el) return;
  if(diff<0) el.textContent='Esse dia já passou 💛';
  else if(diff===0) el.textContent='É hoje! 🌹';
  else el.textContent='Em '+diff+' dias';
}


/* ===== PROGRESS ===== */
function updateProgress(){
  const fields=['p1','p2','p3','p4','p5','p_incomoda','m1','m2','m3','m4','e_dor','escala','r1','r2','r5','desabafo1','ap1_nome','nome','assinatura','dir1','j2','j5'];
  const filled=fields.filter(k=>state[k]&&state[k]!==false&&state[k]!=='').length;
  const pct=Math.round((filled/fields.length)*100);
  document.getElementById('progress-fill').style.width=pct+'%';
  document.getElementById('progress-pct').textContent=pct+'%';

  // Checklist significativo
  const hasMood = !!(state.m1||state.m2||state.m3||state.m4||quickState.moods.length||mlState.mood);
  const hasPercepcao = !!(state.p1||state.p2||state.p3||state.p_incomoda||state.escala);
  const hasReflexao = !!(state.r1||state.r2||state.r5);
  const hasDesabafo = !!(state.desabafo1&&state.desabafo1.trim());
  const hasConquistas = conquistasList.length > 0;

  const toggle = (id, on) => {
    const el = document.getElementById(id);
    if(el) el.classList.toggle('done', on);
  };
  toggle('pcl-percepcao', hasPercepcao);
  toggle('pcl-emocoes', hasMood);
  toggle('pcl-reflexao', hasReflexao);
  toggle('pcl-desabafo', hasDesabafo);
  toggle('pcl-conquistas', hasConquistas);

  // Mensagem motivacional
  const done = [hasPercepcao,hasMood,hasReflexao,hasDesabafo,hasConquistas].filter(Boolean).length;
  const msgEl = document.getElementById('progress-msg');
  const careEl = document.getElementById('progress-care-msg');
  if(msgEl){
    if(pct === 0) msgEl.textContent = '';
    else if(pct < 30) { msgEl.textContent = 'Você já está cuidando de você 💜'; }
    else if(pct < 60) { msgEl.textContent = 'Continue… você está indo bem 🌹'; }
    else if(pct < 90) { msgEl.textContent = 'Quase lá! Você é incrível ✨'; }
    else { msgEl.textContent = 'Você cuidou de você hoje 🌟'; }
  }
  if(careEl && pct >= 80) careEl.textContent = 'Você cuidou de você hoje 💜';
}
let _salvarTimer;
function salvarTudo(){
  clearTimeout(_salvarTimer);
  _salvarTimer=setTimeout(saveState,350);
}


/* ===== HISTÓRICO ===== */
function renderHistorico(){
  renderCalendar();
  renderChart();
  renderList();
}

function calNav(dir){
  calViewDate=new Date(calViewDate.getFullYear(),calViewDate.getMonth()+dir,1);
  renderCalendar();
}

function renderCalendar(){
  const year=calViewDate.getFullYear();
  const month=calViewDate.getMonth();
  const label=calViewDate.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  document.getElementById('cal-month-label').textContent=label.charAt(0).toUpperCase()+label.slice(1);

  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const todayStr=getToday();
  const cal=document.getElementById('hist-cal');
  cal.innerHTML='';

  for(let i=0;i<firstDay;i++){
    const blank=document.createElement('div');
    blank.className='hist-day';
    blank.style.opacity='0';
    cal.appendChild(blank);
  }
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=year+'-'+(String(month+1).padStart(2,'0'))+'-'+(String(d).padStart(2,'0'));
    const div=document.createElement('div');
    div.className='hist-day';
    const hasEntry=!!allEntries[dateStr];
    if(hasEntry) div.classList.add('has-entry');
    if(dateStr===todayStr) div.classList.add('today');
    div.innerHTML='<span class="hist-day-num">'+d+'</span>';
    if(hasEntry) div.onclick=()=>openHistEntry(dateStr);
    cal.appendChild(div);
  }
}

function renderChart(){
  const canvas=document.getElementById('chart-canvas');
  const empty=document.getElementById('chart-empty');
  const ctx=canvas.getContext('2d');

  // Collect last 30 days
  const points=[];
  for(let i=29;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const key=d.toISOString().split('T')[0];
    const esc = allEntries[key]?.escala ?? null;
    points.push({date:key,val:esc||null});
  }
  const withData=points.filter(p=>p.val!==null);
  if(withData.length<2){ canvas.style.display='none'; empty.style.display='block'; return; }
  canvas.style.display='block'; empty.style.display='none';

  const W=canvas.offsetWidth||canvas.parentElement.offsetWidth||600;
  const H=160;
  canvas.width=W; canvas.height=H;

  const pad={t:12,r:12,b:28,l:28};
  const cw=W-pad.l-pad.r;
  const ch=H-pad.t-pad.b;

  ctx.clearRect(0,0,W,H);

  // Grid lines
  ctx.strokeStyle='rgba(200,144,42,0.1)';
  ctx.lineWidth=1;
  for(let y=1;y<=10;y+=2){
    const yp=pad.t+ch-(y/10)*ch;
    ctx.beginPath(); ctx.moveTo(pad.l,yp); ctx.lineTo(pad.l+cw,yp); ctx.stroke();
    ctx.fillStyle='rgba(200,144,42,0.4)';
    ctx.font='9px Lato,sans-serif';
    ctx.fillText(y,2,yp+3);
  }

  // Line
  const step=cw/(points.length-1);
  ctx.beginPath();
  ctx.strokeStyle='rgba(232,168,74,0.8)';
  ctx.lineWidth=2;
  ctx.lineJoin='round';
  ctx.lineCap='round';
  let first=true;
  points.forEach((p,i)=>{
    if(p.val===null) return;
    const x=pad.l+i*step;
    const y=pad.t+ch-(p.val/10)*ch;
    if(first){ ctx.moveTo(x,y); first=false; } else ctx.lineTo(x,y);
  });
  ctx.stroke();

  // Fill under
  const gradY=ctx.createLinearGradient(0,pad.t,0,pad.t+ch);
  gradY.addColorStop(0,'rgba(200,144,42,0.25)');
  gradY.addColorStop(1,'rgba(200,144,42,0.02)');
  ctx.beginPath();
  first=true;
  let lastX=0;
  points.forEach((p,i)=>{
    if(p.val===null) return;
    const x=pad.l+i*step;
    const y=pad.t+ch-(p.val/10)*ch;
    if(first){ ctx.moveTo(x,pad.t+ch); ctx.lineTo(x,y); first=false; }
    else ctx.lineTo(x,y);
    lastX=x;
  });
  ctx.lineTo(lastX,pad.t+ch);
  ctx.closePath();
  ctx.fillStyle=gradY;
  ctx.fill();

  // Dots
  points.forEach((p,i)=>{
    if(p.val===null) return;
    const x=pad.l+i*step;
    const y=pad.t+ch-(p.val/10)*ch;
    ctx.beginPath();
    ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fillStyle='#e8a84a';
    ctx.fill();
  });

  // X axis labels (every 7 days)
  ctx.fillStyle='rgba(200,144,42,0.5)';
  ctx.font='8px Lato,sans-serif';
  points.forEach((p,i)=>{
    if(i%7!==0) return;
    const x=pad.l+i*step;
    const short=p.date.slice(5).replace('-','/');
    ctx.fillText(short,x-10,H-4);
  });
}

function renderList(){
  const list=document.getElementById('hist-list');
  const entries=Object.values(allEntries)
    .filter(e=>e.date)
    .sort((a,b)=>b.date.localeCompare(a.date))
    .slice(0,30);
  if(!entries.length){
    list.innerHTML=`<div class="hist-empty">
      <p style="margin-bottom:.5rem;">Suas entradas vão aparecer aqui.</p>
      <p style="font-size:.80rem;opacity:.7;">Preencha o diário hoje e volte amanhã para ver seu histórico. 💛</p>
    </div>`;
    return;
  }
  list.innerHTML=entries.map(e=>{
    const d=new Date((e.date)+'T12:00:00');
    const label=d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
    const moods=(e.quickMoods||[]).join(' ');
    const esc=e.escala?`<span style="font-size:.80rem;color:var(--gold-l);">● Intensidade ${e.escala}/10</span>`:'';
    const perc=e.percChecked?`<span style="font-size:.80rem;color:var(--ts);">${e.percChecked} percepções</span>`:'';
    const sinais=e.sinaisChecked?`<span style="font-size:.80rem;color:var(--ts);">${e.sinaisChecked} sinais</span>`:'';
    const preview=e.p_incomoda||e.desabafo1||e.e_dor||'';
    const isToday=e.date===getToday();
    return `<div class="hist-entry${isToday?' hist-entry-today':''}" onclick="openHistEntry('${e.date}')">
      <div class="hist-entry-date">${isToday?'Hoje — ':''} ${label}</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.25rem 0;">
        ${moods?`<span style="font-size:1rem;">${moods}</span>`:''}
        ${esc}${perc}${sinais}
      </div>
      ${preview?`<div class="hist-entry-preview">${preview.slice(0,100)}${preview.length>100?'…':''}</div>`:''}
    </div>`;
  }).join('');
}

function openHistEntry(dateStr){
  const e=allEntries[dateStr];
  if(!e) return;
  const d=new Date(dateStr+'T12:00:00');
  const label=d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const moods=(e.quickMoods||[]).join(' ');
  let html=`<p class="modal-title">${label}</p>`;
  if(moods) html+=`<p style="font-size:1.4rem;margin-bottom:.75rem;">${moods}</p>`;
  if(e.escala) html+=`<div class="dica-box" style="margin-bottom:.75rem;"><span class="dica-icon">📊</span><div class="dica-text"><strong>Intensidade emocional</strong>${e.escala}/10</div></div>`;
  if(e.e_dor) html+=`<div class="question-block"><div class="question" style="font-size:.90rem;">O que a dor dizia</div><p style="font-size:.90rem;color:var(--ts);line-height:1.6;">${e.e_dor}</p></div>`;
  if(e.desabafo1) html+=`<div class="question-block" style="margin-top:.75rem;"><div class="question" style="font-size:.90rem;">Carta para mim</div><p style="font-size:.90rem;color:var(--ts);line-height:1.6;">${e.desabafo1.slice(0,300)}${e.desabafo1.length>300?'...':''}</p></div>`;
  if(e.p_incomoda) html+=`<div class="question-block" style="margin-top:.75rem;"><div class="question" style="font-size:.90rem;">O que me incomodava</div><p style="font-size:.90rem;color:var(--ts);line-height:1.6;">${e.p_incomoda.slice(0,200)}</p></div>`;
  document.getElementById('modal-content').innerHTML=html;
  document.getElementById('hist-modal').classList.add('open');
}
function closeHistModal(){ document.getElementById('hist-modal').classList.remove('open'); }
function closeModal(e){ if(e.target===document.getElementById('hist-modal')) closeHistModal(); }


/* ===== PROGRESS MELHORADO ===== */
const progressMsgs = [
  'Comece quando quiser — não há pressa 💜',
  'Você já está cuidando de você 💜',
  'Quase lá… continue! 🌹',
  'Você cuidou de você hoje 💜',
  'Registro completo! Você é incrível 🌟'
];

