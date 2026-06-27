/* ============================================================
   audio.js — Gravador de áudio.
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== GRAVADOR DE ÁUDIO ===== */
(function(){
  const AUDIO_KEY = 'diario_audios';
  let mediaRecorder = null;
  let audioChunks = [];
  let timerInterval = null;
  let timerSecs = 0;
  let recognition = null;
  let transcricaoFinal = '';
  let audiosList = [];
  let waveInterval = null;
  let analyser = null;
  let audioCtx = null;
  let sourceNode = null;

  function loadAudios(){
    try{ const a=localStorage.getItem(AUDIO_KEY); if(a){
      const parsed=JSON.parse(a);
      // Restaurar base64 como blob URL para reprodução
      audiosList=parsed.map(a=>{
        if(a.base64&&a.mimeType){
          try{
            const byteStr=atob(a.base64);
            const arr=new Uint8Array(byteStr.length);
            for(let i=0;i<byteStr.length;i++) arr[i]=byteStr.charCodeAt(i);
            const blob=new Blob([arr],{type:a.mimeType});
            return {...a,url:URL.createObjectURL(blob)};
          }catch(e){ return {...a,url:null}; }
        }
        return {...a,url:null};
      });
    }}catch(e){}
    renderAudios();
  }
  function saveAudiosMeta(){
    // Salva metadados + base64 para persistência
    try{
      const toSave=audiosList.map(a=>({...a,url:null}));
      localStorage.setItem(AUDIO_KEY, JSON.stringify(toSave));
    }catch(e){
      // Se exceder quota, salva sem base64 (só metadados)
      try{
        const toSave=audiosList.map(a=>({...a,url:null,base64:null}));
        localStorage.setItem(AUDIO_KEY, JSON.stringify(toSave));
        showToast('⚠️ Espaço limitado — só metadados salvos. Baixe os áudios.');
      }catch(e2){}
    }
  }

  function checkSupport(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      const sem=document.getElementById('audio-sem-suporte');
      const iface=document.getElementById('audio-rec-interface');
      if(sem) sem.style.display='block';
      if(iface) iface.style.display='none';
    } else {
      // Verifica suporte à transcrição (SpeechRecognition)
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){
        const semTr=document.getElementById('transcricao-sem-suporte');
        if(semTr) semTr.style.display='block';
      }
    }
  }

  function initWaveBars(){
    const c=document.getElementById('audio-waveform');
    if(!c) return;
    c.innerHTML='';
    for(let i=0;i<20;i++){ const b=document.createElement('div'); b.className='wave-bar'; b.style.height='4px'; c.appendChild(b); }
  }

  function startWave(stream){
    try{
      audioCtx=new(window.AudioContext||window.webkitAudioContext)();
      analyser=audioCtx.createAnalyser(); analyser.fftSize=64;
      sourceNode=audioCtx.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
      const data=new Uint8Array(analyser.frequencyBinCount);
      const bars=document.getElementById('audio-waveform').querySelectorAll('.wave-bar');
      waveInterval=setInterval(()=>{
        analyser.getByteFrequencyData(data);
        bars.forEach((b,i)=>{ const v=(data[i*2]||0)/255; b.style.height=Math.max(4,v*32)+'px'; b.style.background=v>0.6?'#e05050':v>0.3?'#c8902a':'rgba(74,144,164,.5)'; });
      },80);
    }catch(e){}
  }
  function stopWave(){
    clearInterval(waveInterval);
    try{if(sourceNode)sourceNode.disconnect();}catch(e){}
    try{if(audioCtx)audioCtx.close();}catch(e){}
    document.getElementById('audio-waveform').querySelectorAll('.wave-bar').forEach(b=>{ b.style.height='4px'; b.style.background='rgba(74,144,164,.3)'; });
  }

  function startTimer(){
    timerSecs=0;
    const el=document.getElementById('rec-timer');
    if(el){ el.style.display='inline'; el.textContent='00:00'; }
    timerInterval=setInterval(()=>{
      timerSecs++;
      const m=Math.floor(timerSecs/60).toString().padStart(2,'0');
      const s=(timerSecs%60).toString().padStart(2,'0');
      if(el) el.textContent=m+':'+s;
    },1000);
  }
  function stopTimer(){ clearInterval(timerInterval); }

  function startRecognition(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){
      // Navegador não suporta Speech Recognition (ex: Firefox, iOS Safari)
      const el=document.getElementById('transcricao-texto');
      if(el){ el.placeholder='⚠️ Transcrição automática não disponível neste navegador. Use Chrome no Android ou desktop para transcrição. Você pode digitar o relato manualmente aqui.'; }
      return;
    }
    recognition=new SR();
    recognition.lang='pt-BR'; recognition.continuous=true; recognition.interimResults=true;
    transcricaoFinal='';
    recognition.onresult=(e)=>{
      let interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t=e.results[i][0].transcript;
        if(e.results[i].isFinal) transcricaoFinal+=t+' '; else interim+=t;
      }
      const el=document.getElementById('transcricao-texto');
      if(el) el.value=(transcricaoFinal+interim).trim();
    };
    recognition.onerror=(ev)=>{
      // Erros esperados (sem microfone, sem rede, aborted): não interrompe gravação
      if(ev.error==='no-speech'||ev.error==='aborted') return;
      const el=document.getElementById('transcricao-texto');
      if(el && !el.value.trim()){
        el.placeholder='⚠️ Transcrição automática com erro ('+ev.error+'). Você pode digitar manualmente aqui.';
      }
    };
    recognition.onend=()=>{
      // Reinicia apenas se ainda estiver gravando (evita loop no iOS)
      if(mediaRecorder&&mediaRecorder.state==='recording'){
        try{ recognition.start(); }catch(e){}
      }
    };
    try{ recognition.start(); }catch(e){
      const el=document.getElementById('transcricao-texto');
      if(el) el.placeholder='⚠️ Transcrição indisponível neste dispositivo. Digite o relato manualmente aqui.';
    }
  }
  function stopRecognition(){ if(recognition) try{recognition.stop();}catch(e){} recognition=null; }

  function setUI(estado){
    const btnIni=document.getElementById('btn-iniciar-rec');
    const btnPar=document.getElementById('btn-parar-rec');
    const btnNov=document.getElementById('btn-nova-rec');
    const dot=document.getElementById('rec-dot');
    const statusTxt=document.getElementById('rec-status-text');
    const tWrap=document.getElementById('transcricao-wrap');
    const badge=document.getElementById('transcricao-badge');
    if(estado==='idle'){
      dot.className='audio-rec-dot idle'; statusTxt.textContent='Pronta para gravar';
      btnIni.disabled=false; btnPar.disabled=true; if(btnNov)btnNov.style.display='none';
      if(tWrap) tWrap.style.display='none';
    } else if(estado==='recording'){
      dot.className='audio-rec-dot recording'; statusTxt.textContent='Gravando...';
      btnIni.disabled=true; btnPar.disabled=false; if(btnNov)btnNov.style.display='none';
      if(tWrap) tWrap.style.display='block';
      if(badge){ badge.className='transcricao-badge live'; badge.textContent='● ao vivo'; }
    } else if(estado==='done'){
      dot.className='audio-rec-dot done'; statusTxt.textContent='Gravação salva ✓';
      btnIni.disabled=true; btnPar.disabled=true; if(btnNov)btnNov.style.display='inline-flex';
      if(badge){ badge.className='transcricao-badge'; badge.textContent='salva'; }
    }
  }

  window.iniciarGravacao=async function(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      audioChunks=[];
      const mime=['audio/webm;codecs=opus','audio/webm','audio/ogg','audio/mp4'].find(m=>MediaRecorder.isTypeSupported(m))||'';
      mediaRecorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});
      mediaRecorder.ondataavailable=e=>{ if(e.data.size>0) audioChunks.push(e.data); };
      mediaRecorder.onstop=()=>{
        const blob=new Blob(audioChunks,{type:mediaRecorder.mimeType||'audio/webm'});
        const url=URL.createObjectURL(blob);
        const now=new Date();
        const dataStr=now.toLocaleString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
        const transcricao=(document.getElementById('transcricao-texto')||{}).value||'';
        const entrada={id:Date.now(),data:dataStr,durSecs:timerSecs,transcricao:transcricao.trim(),url,mimeType:mediaRecorder.mimeType||'audio/webm',base64:null};
        // Converter para base64 para persistência
        const reader=new FileReader();
        reader.onload=function(){
          entrada.base64=reader.result.split(',')[1];
          audiosList.unshift(entrada);
          saveAudiosMeta();
          renderAudios();
        };
        reader.onerror=function(){
          // Salva mesmo sem base64
          audiosList.unshift(entrada);
          saveAudiosMeta();
          renderAudios();
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t=>t.stop());
        setUI('done');
        showToast('🎙️ Gravação salva!');
        // Auto-salvar transcrição como relato datado (persiste entre sessões)
        if(transcricao.trim()){
          const relAutoSave = {
            data: dataStr,
            texto: '[🎙️ Áudio transcrito — '+Math.floor(timerSecs/60)+'m'+String(timerSecs%60).padStart(2,'0')+'s]\n'+transcricao.trim(),
            iso: now.toISOString()
          };
          relatosList.unshift(relAutoSave);
          saveExtras();
          const listaEl = document.getElementById('relatos-lista');
          if(listaEl) renderRelatosList(listaEl);
        }
      };
      mediaRecorder.start(200);
      startWave(stream); startTimer(); startRecognition(); setUI('recording');
    }catch(err){
      if(err.name==='NotAllowedError') showToast('⚠️ Permissão de microfone negada. Verifique as configurações do navegador.');
      else showToast('⚠️ Não foi possível acessar o microfone.');
    }
  };

  window.pararGravacao=function(){
    if(mediaRecorder&&mediaRecorder.state==='recording'){ stopWave(); stopTimer(); stopRecognition(); mediaRecorder.stop(); }
  };

  window.novaGravacao=function(){
    document.getElementById('rec-timer').style.display='none';
    document.getElementById('rec-timer').textContent='00:00';
    const tt=document.getElementById('transcricao-texto'); if(tt) tt.value='';
    transcricaoFinal='';
    initWaveBars();
    setUI('idle');
  };

  function fmtDur(s){ return Math.floor(s/60)+':'+(s%60<10?'0':'')+(s%60); }

  function renderAudios(){
    const container=document.getElementById('audio-items-container');
    const wrapper=document.getElementById('audio-gravacoes-lista');
    if(!container||!wrapper) return;
    if(!audiosList.length){ wrapper.style.display='none'; return; }
    wrapper.style.display='block';
    container.innerHTML=audiosList.slice(0,10).map((a,i)=>`
      <div class="audio-item">
        <div class="audio-item-header">
          <span class="audio-item-data">🎙️ ${a.data}</span>
          <span class="audio-item-dur">${fmtDur(a.durSecs||0)}</span>
          <div class="audio-item-actions">
            ${a.url?`<button class="btn-audio-action" onclick="window._baixarAudio(${i})">⬇ Baixar</button>`:'<span style="font-size:.75rem;color:var(--tm);font-style:italic;">sem áudio</span>'}
            <button class="btn-audio-action del" onclick="window._deletarAudio(${i})">🗑</button>
          </div>
        </div>
        ${a.url?`<div class="audio-item-player"><audio controls src="${a.url}" preload="metadata" style="width:100%;margin-top:.4rem;"></audio></div>`:'<div style="font-size:.75rem;color:var(--tm);font-style:italic;padding:.3rem 0;">Áudio não disponível — grave novamente ou baixe antes de fechar.</div>'}
        <div class="audio-item-transcricao">${a.transcricao?'"'+a.transcricao.slice(0,300)+(a.transcricao.length>300?'...':'')+'"':'<em>Sem transcrição</em>'}</div>
      </div>`).join('');
  }

  window._baixarAudio=function(i){
    const a=audiosList[i]; if(!a||!a.url) return;
    const ext=(a.mimeType||'').includes('ogg')?'ogg':(a.mimeType||'').includes('mp4')?'mp4':'webm';
    const link=document.createElement('a'); link.href=a.url; link.download='relato-audio-'+a.id+'.'+ext; link.click();
    showToast('⬇ Download iniciado');
  };
  window._deletarAudio=function(i){
    if(!confirm('Deletar esta gravação?')) return;
    if(audiosList[i]&&audiosList[i].url) URL.revokeObjectURL(audiosList[i].url);
    audiosList.splice(i,1); saveAudiosMeta(); renderAudios(); showToast('🗑 Gravação removida');
  };

  // Init após DOM
  function audioInit(){ checkSupport(); loadAudios(); initWaveBars(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', audioInit);
  else audioInit();
})();

function initRelatoData(){
  // Renderizar relatos existentes
  const listaEl = document.getElementById('relatos-lista');
  if(listaEl && relatosList.length) renderRelatosList(listaEl);
  // Data atual no header do relato
  const el=document.getElementById('relato-data-atual');
  if(!el) return;
  const now=new Date();
  el.textContent=now.toLocaleString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  setInterval(()=>{
    const n=new Date();
    el.textContent=n.toLocaleString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  },60000);
  renderRelatos();
}

function renderRelatosList(lista){
  if(!lista) return;
  lista.innerHTML = relatosList.slice(0,10).map(r=>`
    <div class="relato-entry">
      <div class="relato-entry-data">${r.data}</div>
      <div class="relato-entry-texto">${sanitize(r.texto).slice(0,200)}</div>
    </div>`).join('') || '<em style="font-size:.8rem;color:var(--tm);">Nenhum relato ainda.</em>';
}

function salvarRelato(){
  const ta=document.getElementById('relato-novo-texto');
  const texto=sanitize(ta.value.trim());
  if(!texto){ showToast('Escreva o que aconteceu antes de registrar 📋'); return; }
  const now=new Date();
  const entrada={
    data:now.toLocaleString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}),
    iso:now.toISOString(),
    texto
  };
  relatosList.unshift(entrada);
  saveExtras();
  ta.value='';
  renderRelatos();
  showToast('📋 Relato registrado com data e hora!');
}

function renderRelatos(){
  const listaEl=document.getElementById("relatos-lista"); if(listaEl) renderRelatosList(listaEl); return;
  // Legacy:
  const lista=document.getElementById('relatos-lista');
  if(!lista) return;
  if(!relatosList.length){ lista.innerHTML='<div style="font-size:.90rem;color:var(--tm);font-style:italic;padding:.5rem 0;">Nenhum relato ainda. Registre episódios para ter um histórico datado.</div>'; return; }
  lista.innerHTML=relatosList.slice(0,10).map(r=>`
    <div class="relato-entry">
      <div class="relato-entry-data">📋 ${r.data}</div>
      <div class="relato-entry-texto">${r.texto.slice(0,200)}${r.texto.length>200?'...':''}</div>
    </div>`).join('');
}

