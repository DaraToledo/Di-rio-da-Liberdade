/* ============================================================
   support.js — Rede de apoio, contatos, mapa do acolhimento, checklist, afirmações, ajuda e QR code.
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== BOTÃO LIGAR — CONTATOS ===== */
function atualizarBtnLigar(inputId, btnId){
  const input=document.getElementById(inputId);
  const btn=document.getElementById(btnId);
  if(!input||!btn) return;
  const tel=input.value.replace(/\D/g,'');
  if(tel.length>=8){
    btn.href='tel:'+tel;
    btn.classList.remove('disabled');
    btn.style.pointerEvents='';
  } else {
    btn.href='#';
    btn.classList.add('disabled');
    btn.style.pointerEvents='none';
  }
}
function initBotoesLigar(){
  // Inicializa botões de ligar com valores salvos no state
  const pares=[
    ['ap1_tel_input','btn-ligar-ap1','ap1_tel'],
    ['ap2_tel_input','btn-ligar-ap2','ap2_tel'],
    ['ap3_tel_input','btn-ligar-ap3','ap3_tel'],
    ['prof1_tel_input','btn-ligar-prof1','prof1_tel'],
    ['prof2_tel_input','btn-ligar-prof2','prof2_tel'],
  ];
  pares.forEach(([inputId,btnId,stateKey])=>{
    const input=document.getElementById(inputId);
    const btn=document.getElementById(btnId);
    if(!input||!btn) return;
    // Preenche com valor salvo no state se o input ainda não tiver valor
    if(!input.value&&state[stateKey]){
      input.value=state[stateKey];
    }
    atualizarBtnLigar(inputId,btnId);
    input.addEventListener('input',()=>atualizarBtnLigar(inputId,btnId));
  });
}


/* ===== MAPA DO ACOLHIMENTO EMBUTIDO ===== */
const MAPA_SERVICOS=[
  {cat:'CRAM',nome:'CRAM — Casa Amarela (Centro)',end:'R. Formosa, 377 — Centro, SP',tel:'(11) 3392-8600',hrs:'Seg–Sex 8h–17h',h24:false},
  {cat:'CRAM',nome:'CRAM — Lapa',end:'Av. Antártica, 381 — Lapa, SP',tel:'(11) 3837-3370',hrs:'Seg–Sex 8h–17h',h24:false},
  {cat:'CRAM',nome:'CRAM — Penha',end:'R. Joaquim Carlos, 640 — Penha, SP',tel:'(11) 2093-4777',hrs:'Seg–Sex 8h–17h',h24:false},
  {cat:'CRAM',nome:'CRAM — Santo André',end:'Av. Industrial, 600 — Santo André, SP',tel:'(11) 4438-5616',hrs:'Seg–Sex 8h–18h',h24:false},
  {cat:'CRAM',nome:'CRAM — Guarulhos',end:'R. Barão de Mauá, 1000 — Guarulhos, SP',tel:'(11) 2472-5038',hrs:'Seg–Sex 8h–17h',h24:false},
  {cat:'DEAM',nome:'DDM — Sé (Bela Vista)',end:'R. Conselheiro Ramalho, 718 — Bela Vista, SP',tel:'(11) 3340-4152',hrs:'24 horas',h24:true},
  {cat:'DEAM',nome:'DDM — Lapa / Pinheiros',end:'R. Iowa, 380 — Vila Anglo Brasileira, SP',tel:'(11) 3837-3400',hrs:'24 horas',h24:true},
  {cat:'DEAM',nome:'DDM — Santo André (24h)',end:'R. Coronel Oliveira Lima, 667 — Santo André',tel:'(11) 4426-4533',hrs:'24 horas',h24:true},
  {cat:'DEAM',nome:'DDM — Zona Sul / Campo Limpo',end:'Av. Franz Voegeli, 560 — Vila Leopoldina, SP',tel:'(11) 3741-5180',hrs:'24 horas',h24:true},
  {cat:'DEAM',nome:'DDM — Guarulhos Vila Galvão (24h)',end:'R. Mena, 329 — Vila Galvão, Guarulhos',tel:'(11) 2485-8524',hrs:'24 horas',h24:true},
  {cat:'DEAM',nome:'DDM — Osasco (24h)',end:'Av. dos Autonomistas, 2738 — Vila Yara, Osasco',tel:'(11) 3682-4555',hrs:'24 horas',h24:true},
  {cat:'DEAM',nome:'DDM — Suzano (24h)',end:'R. Ministro Genesio de Almeida Moura, 76 — Centro, Suzano',tel:'(11) 4745-4001',hrs:'24 horas',h24:true},
  {cat:'DEAM',nome:'DDM — Tabão da Serra (24h)',end:'Av. das Nações, 1001 — Jd. Maria Rosa, Tabão da Serra',tel:'(11) 4787-1010',hrs:'24 horas',h24:true},
  {cat:'DEFENSORIA',nome:'Defensoria Pública — Centro (NUCRIA)',end:'R. Boa Vista, 77 — 5º andar — Centro, SP',tel:'(11) 3105-0919',hrs:'Seg–Sex 9h–17h',h24:false},
  {cat:'DEFENSORIA',nome:'Defensoria Pública — Zona Norte',end:'Av. Zaki Narchi, 153 — Carandiru, SP',tel:'(11) 3954-5166',hrs:'Seg–Sex 9h–17h',h24:false},
  {cat:'DEFENSORIA',nome:'Defensoria Pública — Zona Leste',end:'R. Doutor Sílvio Fontes, 176 — Tatuapé, SP',tel:'(11) 2091-0350',hrs:'Seg–Sex 9h–17h',h24:false},
  {cat:'DEFENSORIA',nome:'Defensoria Pública — Zona Sul',end:'R. Apiaí, 80 — Sacomã, SP',tel:'(11) 2272-1155',hrs:'Seg–Sex 9h–17h',h24:false},
  {cat:'CRAS',nome:'CRAS — Pinheiros',end:'R. Fernão Dias, 80 — Pinheiros, SP',tel:'(11) 3816-4830',hrs:'Seg–Sex 8h–17h',h24:false},
  {cat:'CRAS',nome:'CRAS — Cidade Tiradentes',end:'R. Bino de Toledo, 540 — Cidade Tiradentes, SP',tel:'(11) 2557-3866',hrs:'Seg–Sex 8h–17h',h24:false},
  {cat:'CRAS',nome:'CRAS — Grajaú',end:'R. João Simões Pinto, 30 — Grajaú, SP',tel:'(11) 5931-5390',hrs:'Seg–Sex 8h–17h',h24:false},
  {cat:'ACOLHIMENTO',nome:'Casa Abrigo Heliópolis (sigiloso)',end:'Endereço sigiloso — acesso via 180 ou DDM',tel:'180 ou DDM local',hrs:'24h — acesso via 180',h24:true},
  {cat:'SAUDE',nome:'Hospital Pérola Byington — violência sexual 24h',end:'Av. Dr. Vieira de Carvalho, 432 — República, SP',tel:'(11) 3392-8600',hrs:'24 horas',h24:true},
  {cat:'SAUDE',nome:'UBS Saúde da Mulher — Parelheiros',end:'Estr. dos Alvarenga, 3000 — Parelheiros, SP',tel:'(11) 5923-2100',hrs:'Seg–Sex 7h–19h',h24:false},
];
let _mapaFiltroAtivo='TODOS';
let _mapaBuscaTxt='';
const MAPA_BADGE_COLORS={
  CRAM:'#6c3483',DEAM:'#c0392b',DEFENSORIA:'#2980b9',
  CRAS:'#27ae60',ACOLHIMENTO:'#8B0000',SAUDE:'#1a5276'
};
function mapaSetFiltro(cat,btn){
  _mapaFiltroAtivo=cat;
  document.querySelectorAll('.mapa-filter-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  mapaRenderGrid();
}
function mapaFiltrar(){
  const el=document.getElementById('mapa-busca');
  _mapaBuscaTxt=el?el.value.toLowerCase():'';
  mapaRenderGrid();
}
function mapaRenderGrid(){
  const grid=document.getElementById('mapa-grid-apoio');
  if(!grid) return;
  const lista=MAPA_SERVICOS.filter(s=>{
    const matchCat=_mapaFiltroAtivo==='TODOS'||s.cat===_mapaFiltroAtivo;
    const matchTxt=!_mapaBuscaTxt||[s.nome,s.end,s.cat,s.hrs].join(' ').toLowerCase().includes(_mapaBuscaTxt);
    return matchCat&&matchTxt;
  });
  const stat1=document.getElementById('mapa-stat-total');
  const stat2=document.getElementById('mapa-stat-24h');
  if(stat1) stat1.textContent=lista.length+' serviços';
  if(stat2) stat2.textContent=lista.filter(s=>s.h24).length+' disponíveis 24h';
  if(!lista.length){ grid.innerHTML='<div class="mapa-empty">Nenhum serviço encontrado.</div>'; return; }
  const cor=s=>MAPA_BADGE_COLORS[s.cat]||'#555';
  grid.innerHTML=lista.map(s=>`
    <div class="mapa-servico-card">
      <span class="mapa-servico-badge" style="background:${cor(s)}">${s.cat}</span>
      ${s.h24?'<span class="mapa-badge-24h">24h</span>':''}
      <div class="mapa-servico-nome">${s.nome}</div>
      <div class="mapa-servico-info">📍 ${s.end}</div>
      <div class="mapa-servico-info">📞 ${s.tel} &nbsp;·&nbsp; 🕐 ${s.hrs}</div>
      <div class="mapa-servico-actions">
        <a class="mapa-btn primary" href="tel:${s.tel.replace(/\D/g,'')}">📞 Ligar</a>
        <a class="mapa-btn" href="https://maps.google.com/?q=${encodeURIComponent(s.end)}" target="_blank">📍 Como chegar</a>
      </div>
    </div>`).join('');
}


/* ===== CHECKLIST DE SEGURANÇA EMBUTIDO ===== */
const CK_TOTAL=27;
function ckToggle(el,key){
  el.classList.toggle('done');
  state[key]=el.classList.contains('done');
  ckUpdateBar();
  salvarTudo();
}
function ckUpdateBar(){
  const items=document.querySelectorAll('#apoio-checklist .ck-item');
  const done=document.querySelectorAll('#apoio-checklist .ck-item.done').length;
  const total=items.length||CK_TOTAL;
  const bar=document.getElementById('ck-bar');
  const lbl=document.getElementById('ck-label');
  if(bar) bar.style.width=(done/total*100)+'%';
  if(lbl) lbl.textContent=done+' / '+total;
}
function ckRestoreAll(){
  for(let i=1;i<=CK_TOTAL;i++){
    if(state['ck'+i]){
      const items=document.querySelectorAll('[onclick*="ck'+i+'"]');
      items.forEach(el=>el.classList.add('done'));
    }
  }
  ckUpdateBar();
}


/* ===== AFIRMAÇÕES DIÁRIAS ===== */
const AFIRMACOES = [
  'Eu mereço viver sem medo, sem dor e sem humilhação.',
  'Minha dor é real. Meu sofrimento importa. E eu mereço ajuda.',
  'Eu sou mais forte do que essa situação. Um passo de cada vez.',
  'Pedir ajuda não é fraqueza — é a forma mais corajosa de se cuidar.',
  'Meu corpo, minha história e minha vida pertencem somente a mim.',
  'Eu tenho o direito de dizer não. A qualquer hora. Para qualquer pessoa.',
  'Estou dando um passo em direção à liberdade — mesmo que pequeno.',
  'Não é minha culpa. Nunca foi. Nunca será.',
  'Eu sou capaz de reconstruir minha vida com segurança e amor próprio.',
  'Há pessoas que querem me ajudar. Não estou sozinha.',
  'Cada registro que faço aqui é um ato de coragem e autocuidado.',
  'Eu mereço acordar sem ansiedade, sem medo da reação de alguém.',
  'Sobreviver já é uma conquista. E eu sou uma sobrevivente.',
  'Minha voz importa. Minha história importa. Eu importo.',
  'Eu não preciso estar pronta para pedir ajuda. Só preciso pedir.',
  'Existe um caminho para a liberdade — e eu já estou nele.',
  'Minha segurança vem em primeiro lugar. Sempre.',
  'Eu tenho o direito de sentir paz dentro da minha própria casa.',
  'Cada dia que registro aqui, estou me escolhendo.',
  'A violência que sofri não define quem eu sou — define quem ela é.',
];
function mostrarAfirmacao(){
  const idx = Math.floor(Math.random()*AFIRMACOES.length);
  const el = document.getElementById('afirmacao-texto');
  if(el){ el.style.opacity='0'; setTimeout(()=>{ el.textContent=AFIRMACOES[idx]; el.style.opacity='1'; el.style.transition='opacity .4s'; },200); }
}
function novaAfirmacao(){ mostrarAfirmacao(); }


/* ===== BOTÃO PRECISO DE AJUDA AGORA ===== */
function abrirAjudaModal(){
  // Preenche contato de confiança se existir
  const nome = state.ap1_nome || '';
  const tel  = state.ap1_tel  || '';
  const btnC = document.getElementById('ajuda-contato-confianca');
  const nomeEl = document.getElementById('ajuda-confianca-nome');
  if(nome && tel && btnC && nomeEl){
    btnC.href = 'tel:' + tel.replace(/\D/g,'');
    nomeEl.textContent = nome;
    btnC.style.display = '';
  } else if(btnC) {
    btnC.style.display = 'none';
  }
  const modal = document.getElementById('ajuda-modal');
  if(modal) modal.classList.add('open');
}
function fecharAjudaModal(e){
  if(e && e.target !== document.getElementById('ajuda-modal') && !e.target.classList.contains('ajuda-fechar')) return;
  const modal = document.getElementById('ajuda-modal');
  if(modal) modal.classList.remove('open');
}
// Esconde botão nas telas de PIN/splash/sigilo
function atualizarVisibilidadeBtnAjuda(){
  const btn = document.getElementById('btn-ajuda-agora');
  if(!btn) return;
  const pinAtivo = !document.getElementById('pin-screen').classList.contains('hidden');
  const splashAtivo = !document.getElementById('app-splash').classList.contains('gone');
  const sigiloAtivo2 = !document.getElementById('sigilo-screen').classList.contains('hidden');
  if(pinAtivo || splashAtivo || sigiloAtivo2) btn.classList.add('hidden');
  else btn.classList.remove('hidden');
}


/* ===== QR CODE ===== */
function gerarQRCode(){
  const canvas = document.getElementById('qr-canvas');
  const urlEl = document.getElementById('qr-url-display');
  if(!canvas) return;
  const url = window.location.href.split('?')[0];
  if(urlEl) urlEl.textContent = url;
  // QR Code simples via módulo de matriz (sem lib externa)
  _desenharQR(canvas, url);
}

function _desenharQR(canvas, text){
  // QR simplificado via API pública de imagem (sem deps)
  const ctx = canvas.getContext('2d');
  const size = 180;
  canvas.width = size; canvas.height = size;
  // Usa Google Charts API para gerar QR
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function(){ ctx.drawImage(img, 0, 0, size, size); };
  img.onerror = function(){
    // Fallback: texto simples
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,size,size);
    ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Escaneie com a câmera', size/2, size/2-10);
    ctx.fillText('do celular', size/2, size/2+10);
  };
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=1a0828`;
}

function copiarLinkApp(){
  const url = window.location.href.split('?')[0];
  navigator.clipboard.writeText(url).then(()=>showToast('📋 Link copiado!')).catch(()=>showToast('Copie o link da barra do navegador.'));
}

