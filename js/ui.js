canvas.addEventListener('pointerdown', function(e){
  e.preventDefault(); SND.ac(); startBgm(); dropOrRetract();
});
document.addEventListener('keydown', function(e){
  if(e.code === 'Space' || e.code === 'ArrowDown'){ e.preventDefault(); SND.ac(); startBgm(); dropOrRetract(); }
  else if(e.key === 'p' || e.key === 'P'){ togglePause(); }
  else if(e.key === 'm' || e.key === 'M'){ toggleMute(); }
});
canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });

var INTRO_SCENES = [
  { img: 'assets/frog-small.webp',  text: '从前，奶蛙和人类和平共处，快乐地生活在森林里……' },
  { img: 'assets/od-boss.webp',     text: '但邪恶的od厂长发现，奶蛙做成的黄桃罐头异常美味！' },
  { img: 'assets/frog-big.webp',    text: '他开始在各地搜捕奶蛙，把它们抓进工厂……' },
  { img: 'assets/dandan-head.webp', text: '他的手下蛋蛋，正在帮他抓捕奶蛙。而你——就是蛋蛋！' },
  { img: 'assets/frog-rare-5.webp', text: '抓齐所有稀有奶蛙，成为od厂长最得力的助手！' }
];
var introIdx = 0;
function startIntro(){ introIdx = 0; show('ovIntro'); showIntroScene(); }
function showIntroScene(){
  var s = INTRO_SCENES[introIdx];
  document.getElementById('introContent').innerHTML = '<img class="introImg" src="' + s.img + '"><div class="introScene">' + s.text + '</div>';
}
function nextIntro(){ SND.ac(); SND.click(); introIdx++; if(introIdx >= INTRO_SCENES.length){ hide('ovIntro'); } else { showIntroScene(); } }
document.getElementById('ovIntro').addEventListener('click', nextIntro);

var dexPrevState = 'menu';
function showDex(){
  dexPrevState = G.state;
  if(G.state === 'play'){ G.state = 'dex'; pauseLaugh(); }
  var dex = loadDex();
  var cells = [
    { name:'小奶蛙', src:'assets/frog-small.webp', owned:true },
    { name:'大奶蛙', src:'assets/frog-big.webp',   owned:true }
  ];
  RARE.forEach(function(r){
    var owned = dex.indexOf(r.id) >= 0;
    cells.push({ name: owned ? r.name : '???', src: r.img, owned: owned });
  });
  var grid = $('dexGrid');
  grid.innerHTML = '';
  cells.forEach(function(c){
    var cell = document.createElement('div');
    cell.className = 'dexCell' + (c.owned ? '' : ' locked');
    var im = document.createElement('img');
    im.src = c.owned ? c.src : 'assets/frog-small.webp';
    im.alt = c.name;
    if(!c.owned) im.style.filter = 'brightness(0) opacity(0.3)'
    var nm = document.createElement('div');
    nm.className = 'nm'; nm.textContent = c.name;
    cell.appendChild(im); cell.appendChild(nm);
    grid.appendChild(cell);
  });
  var ownedCount = cells.filter(function(c){ return c.owned; }).length;
  $('dexCount').textContent = '已收集 ' + ownedCount + ' / ' + cells.length;
  show('ovDex');
}
function closeDex(){
  SND.ac(); SND.click();
  hide('ovDex');
  if(dexPrevState === 'play'){
    G.state = 'play';
    resumeLaugh();
  }
}



document.querySelectorAll('.diffBtn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.diffBtn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    G.difficulty = btn.dataset.diff;
    SND.click();
  });
});
$('btnIntro').addEventListener('click', function(){ SND.ac(); SND.click(); startIntro(); });
$('btnPlay').addEventListener('click', function(){ SND.ac(); SND.click(); startGame(); });
$('btnStart').addEventListener('click', function(){ SND.ac(); SND.click(); enterMiner(); });
$('btnDex').addEventListener('click', function(){ SND.ac(); SND.click(); showDex(); });
$('btnDexHud').addEventListener('click', function(){ SND.ac(); SND.click(); showDex(); });
$('btnDexClose').addEventListener('click', closeDex);
$('btnQuit').addEventListener('click', toFactory);
$('btnPause').addEventListener('click', togglePause);
$('btnSettings').addEventListener('click', openSettings);
$('btnSettingsClose').addEventListener('click', closeSettings);
$('btnClearData').addEventListener('click', openClearConfirm);
$('btnConfirmClear').addEventListener('click', clearAllData);
$('btnCancelClear').addEventListener('click', cancelClear);
$('bgmRange').addEventListener('input', function(){
  SND.bgmVol = Number(this.value) / 100;
  if(SND.bgmVol > 0) mutedVol = null;
  setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
  applyVolumes(); saveVol();
  if(SND.bgmVol > 0) startBgm();
});
$('fxRange').addEventListener('input', function(){
  SND.fxVol = Number(this.value) / 100;
  if(SND.fxVol > 0) mutedVol = null;
  setRangeUI('fxRange', 'fxVal', SND.fxVol);
  applyVolumes(); saveVol();
});
$('btnResume').addEventListener('click', togglePause);
$('btnNext').addEventListener('click', nextLevel);
$('btnRetry').addEventListener('click', retryLevel);
$('btnMenu').addEventListener('click', toFactory);

genLevel(1);
resetClaw();
updateHUD();
applyVolumes();
setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
setRangeUI('fxRange', 'fxVal', SND.fxVol);

var last = performance.now();
function loop(now){
  var dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
