canvas.addEventListener('pointerdown', function(e){
  e.preventDefault(); SND.ac(); startBgm(); dropOrRetract();
});
document.addEventListener('keydown', function(e){
  if(e.code === 'Space' || e.code === 'ArrowDown'){ e.preventDefault(); SND.ac(); startBgm(); dropOrRetract(); }
  else if(e.key === 'p' || e.key === 'P'){ togglePause(); }
  else if(e.key === 'm' || e.key === 'M'){ toggleMute(); }
});
canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });

var CHAPTERS = [
  { title: '第一章：抓捕奶蛙', scenes: [
    { img: 'assets/frog-small.webp',  text: '从前，奶蛙和人类和平共处，快乐地生活在森林里……' },
    { img: 'assets/od-boss.webp',     text: '但邪恶的od厂长发现，奶蛙做成的黄桃罐头异常美味！' },
    { img: 'assets/frog-big.webp',    text: '他开始在各地搜捕奶蛙，把它们抓进工厂……' },
    { img: 'assets/dandan-head.webp', text: '他的手下蛋蛋，正在帮他抓捕奶蛙。而你——就是蛋蛋！' },
    { img: 'assets/frog-rare-5.webp', text: '抓齐所有稀有奶蛙，成为od厂长最得力的助手！' }
  ]},
  { title: '第二章：切奶蛙装罐头', scenes: [
    { img: 'assets/can.webp',         text: '抓到奶蛙后，od厂长要把它们切成块，装进黄桃罐头里！' },
    { img: 'assets/frog-big.webp',    text: '现在蛋蛋要拿起刀，把飞来的奶蛙切成两半，装进罐头……' },
    { img: 'assets/can.webp',         text: '小心炸弹！切到炸弹就完蛋！切得越多，罐头装得越满！' }
  ]}
];
var INTRO_SCENES = CHAPTERS[0].scenes;
var introIdx = 0;
function startIntro(){
  var html = '<h2 style="color:#ffe14d;margin:0 0 20px;font-size:26px;">选择章节</h2><div style="display:flex;flex-direction:column;gap:14px;">';
  CHAPTERS.forEach(function(ch, i){
    html += '<button class="bigbtn" onclick="pickChapter('+i+')" style="font-size:18px;padding:14px;">'+ch.title+'</button>';
  });
  html += '</div><button onclick="hide(\'ovIntro\')" style="margin-top:16px;background:none;border:none;color:#ffd98a;cursor:pointer;font-family:inherit;">返回</button>';
  document.getElementById('introContent').innerHTML = html;
  document.querySelector('.introArrow').style.display = 'none';
  show('ovIntro');
}
function pickChapter(i){
  SND.click();
  INTRO_SCENES = CHAPTERS[i].scenes;
  introIdx = 0;
  document.querySelector('.introArrow').style.display = '';
  showIntroScene();
}
function showIntroScene(){
  var s = INTRO_SCENES[introIdx];
  document.getElementById('introContent').innerHTML = '<img class="introImg" src="' + s.img + '"><div class="introScene">' + s.text + '</div>';
}
function nextIntro(){ SND.ac(); SND.click(); introIdx++; if(introIdx >= INTRO_SCENES.length){ hide('ovIntro'); } else { showIntroScene(); } }
document.getElementById('ovIntro').addEventListener('click', nextIntro);

// ===== 奶蛙生日 · 开篇叙事（黄字分段淡入，每页一句） =====
var BDAY_STORY = [
  '今天，是流浪在互联网各处的奶蛙的生日。',
  '长久以来，我们在屏幕前大笑，<br>看它到处逃窜，躲避OD厂长的吊钩，躲避蛋蛋的抓捕。',
  '它是一张偶然生成的AI图画，<br>没有官方设定，没有安稳的家。',
  '世人笑它怪异似龙非蛙，<br>可热闹的互联网浪潮，把它的源头推得无影无踪。',
  '它只能独自在网络之间游荡流浪，<br>无数次险些被抓进罐头工厂，它不停逃跑。',
  '它的笑声一半是搞怪，<br>一半藏着无人读懂的忧郁。',
  '但奶蛙拥有了另一样礼物——<br>千千万万网友的喜爱。',
  '没有作者来认领它，<br>可是无数互联网的我们，成为了它的家人。',
  '今天不用逃跑，不用躲避工厂的钩子。<br>放下逃窜，今天只属于奶蛙。'
];
var bdayIdx = 0;
function startBirthdayStory(){
  bdayIdx = 0;
  document.getElementById('birthdayStory').innerHTML = '<p>' + BDAY_STORY[0] + '</p>';
  var ar = document.querySelector('#ovBirthday .introArrow'); if(ar) ar.style.display = '';
}
$('btnBirthday').addEventListener('click', function(){ SND.ac(); SND.click(); showBirthdayCard(); });
$('btnOfficialQq').addEventListener('click', function(e){
  e.preventDefault();
  SND.ac(); SND.click(); show('ovTeam');
});
$('btnOfficialQq2').addEventListener('click', function(e){
  e.preventDefault();
  SND.ac(); SND.click(); show('ovTeam');
});
$('btnTeamClose').addEventListener('click', function(){ SND.ac(); SND.click(); hide('ovTeam'); });
$('ovTeam').addEventListener('click', function(e){
  if(e.target === this){ SND.ac(); SND.click(); hide('ovTeam'); }
});
$('btnBirthdayBack').addEventListener('click', function(e){ e.stopPropagation(); SND.ac(); SND.click(); exitBirthday(); hide('ovBirthday'); });
$('ovBirthday').addEventListener('click', function(e){
  if(e.target && e.target.id === 'btnBirthdayBack') return;
  SND.ac(); SND.click();
  bdayIdx++;
  if(bdayIdx < BDAY_STORY.length){
    document.getElementById('birthdayStory').innerHTML = '<p>' + BDAY_STORY[bdayIdx] + '</p>';
  } else {
    document.getElementById('birthdayStory').innerHTML = '<p class="bdayHi">生日快乐，小奶蛙。</p>';
    var ar = document.querySelector('#ovBirthday .introArrow'); if(ar) ar.style.display = 'none';
    localStorage.setItem('frogMinerBirthdaySeen', '1');
  }
});

// ===== 奶蛙生日 · 贺图开屏弹窗 + 生日音乐 =====
var birthdayMusic = null, birthdayBgmWasOn = false;
function playBirthdayMusic(){
  if(!birthdayMusic){
    birthdayMusic = new Audio('assets/birthday-music.mp3');
    birthdayMusic.loop = true;
  }
  try{ birthdayMusic.volume = 0.6; }catch(e){}
  try{
    var p = birthdayMusic.play();
    if(p && p.catch) p.catch(function(){});
  }catch(e){}
}
function stopBirthdayMusic(){
  if(birthdayMusic){ try{ birthdayMusic.pause(); }catch(e){} try{ birthdayMusic.currentTime = 0; }catch(e){} }
}
function enterBirthday(){
  birthdayBgmWasOn = false;
  birthdayActive = true;
  if(IS_LOCAL_FILE){
    if(localAud.bgmOn) birthdayBgmWasOn = true;
    localAud.stopBgm();
  } else {
    if(bgmStarted) birthdayBgmWasOn = true;
    try{ if(bgmSource) bgmSource.stop(); }catch(e){}
    bgmStarted = false;
  }
  playBirthdayMusic();
}
function exitBirthday(){
  stopBirthdayMusic();
  birthdayActive = false;
  if(birthdayBgmWasOn){
    if(IS_LOCAL_FILE){ localAud.startBgm(); }
    else { startBgm(); }
  }
}
/* 浏览器禁止无手势自动出声：贺图弹出后，玩家在页面任意位置
   第一次点击/触摸/按键，立刻解锁并开始放生日歌（不必等「下一页」）。 */
function unlockBirthdayAudio(){
  if(!birthdayActive) return;
  playBirthdayMusic();
}
document.addEventListener('pointerdown', unlockBirthdayAudio, true);
document.addEventListener('touchstart', unlockBirthdayAudio, true);
document.addEventListener('keydown', unlockBirthdayAudio, true);
var bdayCardTimer = null;
function showBirthdayCard(){
  var nb = document.getElementById('btnBdayNext');
  if(nb) nb.classList.add('hidden');
  show('ovBirthdayCard');
  enterBirthday();
  if(bdayCardTimer) clearTimeout(bdayCardTimer);
  bdayCardTimer = setTimeout(function(){
    if(nb) nb.classList.remove('hidden');
  }, 3000);
}
$('btnBdayNext').addEventListener('click', function(){
  SND.ac(); SND.click();
  enterBirthday();
  hide('ovBirthdayCard');
  show('ovBirthday');
  startBirthdayStory();
});
if(localStorage.getItem('frogMinerBirthdaySeen') !== '1') setTimeout(showBirthdayCard, 250);

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
    SND.ac(); SND.click();
    G.difficulty = btn.dataset.diff;
    hide('ovDiff');
    enterMiner();
  });
});
$('btnIntro').addEventListener('click', function(){ SND.ac(); SND.click(); startIntro(); });
$('btnPlay').addEventListener('click', function(){ SND.ac(); SND.click(); show('ovGameSelect'); });
$('btnSelMiner').addEventListener('click', function(){ SND.click(); hide('ovGameSelect'); startGame(); });
$('btnSelNinja').addEventListener('click', function(){ SND.click(); hide('ovGameSelect'); show('ovNinja'); });
$('btnNinjaStart').addEventListener('click', function(){ SND.click(); hide('ovNinja'); startNinja(); });
$('btnNinjaRetry').addEventListener('click', function(){ SND.click(); hide('ovNinjaEnd'); startNinja(); });
$('btnNinjaNext').addEventListener('click', function(){ SND.click(); N.level++; hide('ovNinjaEnd'); startNinja(); });
$('btnNinjaExit').addEventListener('click', function(){ SND.click(); hide('ovNinjaEnd'); toFactory(); });
$('btnStart').addEventListener('click', function(){ SND.ac(); SND.click(); show('ovDiff'); });
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
