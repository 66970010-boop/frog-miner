'use strict';
/* 音频引擎：全部基于 Web Audio API
   - 背景音乐 / 合成音效：AudioBufferSourceNode / OscillatorNode
   - 奶蛙笑声：Signalsmith Stretch（WASM + AudioWorklet，MIT）
     用 semitones 参数变调，时长保持不变（真正独立于速度的变调）。
     若 Stretch 不可用则退回 playbackRate（音调与速度联动）。 */

var LAUGH_FILES = [
  'assets/laugh-1.mp3',
  'assets/laugh-2.mp3',
  'assets/laugh-3.mp3',
  'assets/laugh-4.mp3'
];
// 失败后的笑声音频：奶蛙矿工 / 奶蛙忍者 输了都循环播放这一个文件
var LOSS_LAUGH_FILE = 'assets/laugh-audio.mp3';
// 冰块音效：按冰簇里冰块的数量选择（1块/2块/3块）
var ICE_FILES = [
  'assets/ice-1.mp3',
  'assets/ice-2.mp3',
  'assets/ice-3.mp3'
];
// 特殊音效：每局保证有一只奶蛙播一次
var SPECIAL_FILES = [
  'assets/special/andy-1.mp3'
];

var SND = {
  ctx: null, bgmVol: VOL.bgm, fxVol: VOL.fx,
  bgmGain: null, fxGain: null,
  bgmBuf: null, laughBufs: [], laughDurs: [], iceBufs: [], specialBufs: [],
  _loadingBuf: false,

  ac: function(){
    if(!this.ctx){
      try{
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.bgmGain = this.ctx.createGain();
        this.fxGain  = this.ctx.createGain();
        this.bgmGain.connect(this.ctx.destination);
        this.fxGain.connect(this.ctx.destination);
        this.applyVolumes();
        if(!IS_LOCAL_FILE){ this.loadBuffers(); }  // 本地走 <audio> 降级，不 fetch
      }catch(e){}
    }
    if(this.ctx && this.ctx.state === 'suspended'){ try{ this.ctx.resume(); }catch(e){} }
    try{ startBgm(); }catch(e){}
    return this.ctx;
  },

  applyVolumes: function(){
    if(this.bgmGain){ try{ this.bgmGain.gain.value = this.bgmVol; }catch(e){} }
    if(this.fxGain){ try{ this.fxGain.gain.value = this.fxVol; }catch(e){} }
  },

  loadBuffers: function(){
    if(this._loadingBuf || !this.ctx) return;
    this._loadingBuf = true;
    var self = this;
    function decode(url){
      // 用 XMLHttpRequest 代替 fetch：本地 file:// 打开时 fetch 会被 CORS 拦截，
      // 而 XHR 能直接读取同目录本地文件；部署到 http(s) 后 XHR 也照常工作。
      return new Promise(function(res, rej){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(){
          // file:// 下 status 为 0，视为成功；http 下需 200-299
          if(xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)){ res(xhr.response); }
          else { rej(new Error('http ' + xhr.status)); }
        };
        xhr.onerror = function(){ rej(new Error('xhr error')); };
        xhr.send();
      }).then(function(ab){ return self.ctx.decodeAudioData(ab); });
    }
    decode('assets/bgm.mp3')
      .then(function(buf){ self.bgmBuf = buf; startBgm(); })
      .catch(function(){});
    // 四个笑声全部解码，并各建一个 Stretch 节点
    Promise.all(LAUGH_FILES.map(decode)).then(function(bufs){
      self.laughBufs = bufs;
      self.laughDurs = bufs.map(function(b){ return b.duration; });
      buildStretchNodes();
    }).catch(function(){});
    loadLossLaugh(); // 预载失败笑声
    // 冰块音效（1/2/3 块），同样各建 Stretch 节点以便变调
    Promise.all(ICE_FILES.map(decode)).then(function(bufs){
      self.iceBufs = bufs;
      buildIceNodes();
    }).catch(function(){});
    // 特殊音效（每局一只奶蛙播一次）
    Promise.all(SPECIAL_FILES.map(decode)).then(function(bufs){
      self.specialBufs = bufs;
    }).catch(function(){});
  },

  // 合成音效 ------------------------------------------------------------
  tone: function(f, dur, type, vol, delay, slide){
    if(this.fxVol <= 0) return;
    var c = this.ac(); if(!c || !this.fxGain) return;
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if(slide){ try{ o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + dur); }catch(e){} }
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.fxGain);
    o.start(t); o.stop(t + dur + 0.03);
  },
  noise: function(dur, vol, fc, delay){
    if(this.fxVol <= 0) return;
    var c = this.ac(); if(!c || !this.fxGain) return;
    var t = c.currentTime + (delay || 0);
    var n = c.createBufferSource();
    var buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
    var d = buf.getChannelData(0);
    for(var i = 0; i < d.length; i++){ d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); }
    n.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fc || 400;
    var g = c.createGain(); g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(f); f.connect(g); g.connect(this.fxGain);
    n.start(t);
  },
  drop: function(){ this.noise(0.18, 0.07, 1100); this.tone(330, 0.22, 'sawtooth', 0.05, 0, -200); },
  grab: function(){ this.tone(620, 0.07, 'square', 0.26); this.tone(900, 0.11, 'square', 0.28, 0.06); },
  diamond: function(){ this.tone(1180, 0.09, 'sine', 0.1); this.tone(1570, 0.15, 'sine', 0.08, 0.06); this.tone(2093, 0.2, 'sine', 0.06, 0.12); },
  rock: function(){ this.noise(0.3, 0.28, 160); this.tone(85, 0.26, 'sine', 0.18); },
  coin: function(){ this.tone(880, 0.08, 'square', 0.09); this.tone(1318, 0.17, 'square', 0.09, 0.07); },
  fanfare: function(){ [523, 659, 784, 1046].forEach(function(f, i){ SND.tone(f, 0.16, 'triangle', 0.12, i * 0.14); }); },
  fail: function(){ [392, 330, 262].forEach(function(f, i){ SND.tone(f, 0.2, 'triangle', 0.12, i * 0.16); }); },
  applause: function(){
    for(var i = 0; i < 12; i++){ this.noise(0.08, 0.15, 2000 + Math.random() * 2000, Math.random() * 0.8); }
    for(var j = 0; j < 6; j++){ this.tone(600 + j * 80, 0.15, 'triangle', 0.08, 0.1 + j * 0.08, 200); }
  },
  cheer: function(){
    for(var k = 0; k < 8; k++){
      var base = 500 + Math.random() * 300;
      this.tone(base, 0.35, 'sawtooth', 0.06, Math.random() * 0.6, 200 + Math.random() * 150);
    }
    this.tone(700, 0.6, 'triangle', 0.1, 0.1, 350);
    this.tone(900, 0.6, 'triangle', 0.08, 0.2, 400);
  },
  explosion: function(){ this.noise(1.2, 0.45, 90); this.tone(50, 0.9, 'sine', 0.35, 0, -30); this.noise(0.4, 0.2, 3000, 0.1); },
  click: function(){ this.tone(1200, 0.06, 'square', 0.08); this.tone(1800, 0.05, 'square', 0.05, 0.04); }
};

function applyVolumes(){ SND.applyVolumes(); }
function saveVol(){ try{ localStorage.setItem('frogVol', JSON.stringify({ bgm: SND.bgmVol, fx: SND.fxVol })); }catch(e){} }

/* 本地 file:// 降级播放器 ------------------------------------------------
   在本地双击 HTML 打开时，Web Audio 的 fetch/XMLHttpRequest 加载音频都会被
   浏览器按跨源拦截（CORS），拿不到 AudioBuffer。但 <audio> 元素在 file://
   下可正常播放本地同目录文件。因此本地打开时切到 <audio> 元素播放文件音频
   （BGM/笑声/冰块/特殊音效，用 playbackRate 变调），部署到 http(s) 后仍走
   上方 Web Audio + SignalsmithStretch。对外函数同名，游戏逻辑无需改动。 */
var IS_LOCAL_FILE = (typeof location !== 'undefined' && location.protocol === 'file:');
var localAud = {
  bgm: null, voice: null, voiceLoop: false, bgmOn: false,
  init: function(){
    if(!this.bgm){ this.bgm = new Audio('assets/bgm.mp3'); this.bgm.loop = true; }
    if(!this.voice){ this.voice = new Audio(); }
  },
  setVol: function(){
    if(this.bgm){ try{ this.bgm.volume = SND.bgmVol; }catch(e){} }
    if(this.voice){ try{ this.voice.volume = SND.fxVol; }catch(e){} }
  },
  startBgm: function(){
    this.init(); this.setVol();
    if(this.bgmOn) return;
    try{ this.bgm.play(); }catch(e){}
    this.bgmOn = true;
  },
  stopBgm: function(){
    if(this.bgm){ try{ this.bgm.pause(); }catch(e){} try{ this.bgm.currentTime = 0; }catch(e){} }
    this.bgmOn = false;
  },
  playLaugh: function(rate){
    this.init(); this.setVol();
    this.voice.src = LAUGH_FILES[Math.floor(Math.random() * LAUGH_FILES.length)];
    this.voice.playbackRate = Math.max(0.8, Math.min(2, rate || 1));
    this.voice.loop = true; this.voiceLoop = true;
    try{ this.voice.play(); }catch(e){}
  },
  playLossLaugh: function(){
    this.init(); this.setVol();
    this.voice.src = LOSS_LAUGH_FILE;
    this.voice.playbackRate = 1;
    this.voice.loop = true; this.voiceLoop = true;
    try{ this.voice.play(); }catch(e){}
  },
  playIce: function(count, rate){
    this.init(); this.setVol();
    this.voice.src = ICE_FILES[Math.max(0, Math.min(2, (count | 0) - 1))];
    this.voice.playbackRate = Math.max(0.8, Math.min(2.5, rate || 1));
    this.voice.loop = false; this.voiceLoop = false;
    try{ this.voice.play(); }catch(e){}
  },
  finishVoice: function(){
    if(this.voice){ try{ this.voice.loop = false; }catch(e){} }
    this.voiceLoop = false;
  },
  stopVoice: function(){
    if(this.voice){ try{ this.voice.pause(); }catch(e){} try{ this.voice.currentTime = 0; }catch(e){} }
    this.voiceLoop = false;
  },
  playSpecial: function(){
    this.init(); this.setVol();
    this.voice.src = SPECIAL_FILES[Math.floor(Math.random() * SPECIAL_FILES.length)];
    this.voice.playbackRate = 1; this.voice.loop = false; this.voiceLoop = false;
    try{ this.voice.play(); }catch(e){}
  }
};

/* 背景音乐：循环 AudioBufferSourceNode --------------------------------- */
var bgmSource = null, bgmStarted = false;
var birthdayActive = false; /* 生日页期间禁止游戏 BGM，由 ui.js 置位 */
function startBgm(){
  if(birthdayActive) return;
  if(IS_LOCAL_FILE){ localAud.startBgm(); return; }
  var c = SND.ctx;
  if(bgmStarted || !c || !SND.bgmBuf || !SND.bgmGain) return;
  try{
    bgmSource = c.createBufferSource();
    bgmSource.buffer = SND.bgmBuf;
    bgmSource.loop = true;
    bgmSource.connect(SND.bgmGain);
    bgmSource.start(0);
    bgmStarted = true;
  }catch(e){ bgmStarted = false; }
}

/* 抓取音效（奶蛙笑声 / 冰块声）：Signalsmith Stretch 独立变调（时长不变）
   奶蛙笑声：抓到后【循环】播放，覆盖「抓到 → 收上来」全程；
             收上来时不硬切，而是让当前这一遍自然播完再停
             （小蛙收得快时，笑声会继续放完整一遍，绝不会被截断）。
   冰块声：只播一遍，同样让它自然播完。
   奶蛙用它唱笑声；冰块按冰簇里冰块数量选冰1/冰2/冰3。 ------ */
var laughRate = 1, laughLoopOn = false;
var stretchVoices = [], stretchReady = false;
var grabVoice = null, grabIntent = null;
var fallbackSource = null, fallbackTimer = null;

// 统一建节点：把一组音频缓冲各建一个 Stretch 节点，标记来源(kind)与序号
function buildStretchPool(bufs, kind){
  if(typeof SignalsmithStretch !== 'function' || !SND.ctx || !bufs.length) return;
  var tasks = [];
  bufs.forEach(function(b, idx){
    tasks.push(
      SignalsmithStretch(SND.ctx).then(function(node){
        node.connect(SND.fxGain);
        var chans = [];
        for(var c = 0; c < b.numberOfChannels; c++){ chans.push(b.getChannelData(c).slice(0)); }
        if(chans.length === 1) chans.push(chans[0].slice(0));
        return node.addBuffers(chans).then(function(){
          stretchVoices.push({ node: node, kind: kind, idx: idx, dur: b.duration });
        });
      }).catch(function(){})
    );
  });
  return Promise.all(tasks);
}
function buildStretchNodes(){
  if(stretchReady) return;
  buildStretchPool(SND.laughBufs, 'laugh').then(function(){
    stretchReady = stretchVoices.length > 0;
  }).catch(function(){});
}
function buildIceNodes(){
  buildStretchPool(SND.iceBufs, 'ice').catch(function(){});
}

/* 立即停掉所有声部（硬切）。只在场景切换时用（回工厂/重开/游戏结束）。 */
function hardStopAll(){
  var now = SND.ctx ? SND.ctx.currentTime : 0;
  grabVoice = null;
  for(var i = 0; i < stretchVoices.length; i++){
    try{ stretchVoices[i].node.schedule({ output: now, active: false }); }catch(e){}
  }
  if(fallbackTimer){ clearTimeout(fallbackTimer); fallbackTimer = null; }
  if(fallbackSource){
    try{ fallbackSource.stop(); }catch(e){}
    try{ fallbackSource.disconnect(); }catch(e){}
    fallbackSource = null;
  }
  if(lossSource){
    try{ lossSource.stop(); }catch(e){}
    try{ lossSource.disconnect(); }catch(e){}
    lossSource = null;
  }
}

// 退回方案（Stretch 不可用时）：playbackRate 变调，loop 决定循环或单次
function startFallbackSound(buf, loop){
  var c = SND.ctx;
  if(!c || !buf || !SND.fxGain) return;
  try{
    if(fallbackSource){ try{ fallbackSource.stop(); }catch(e){} try{ fallbackSource.disconnect(); }catch(e){} }
    fallbackTimer = null;
    fallbackSource = c.createBufferSource();
    fallbackSource.buffer = buf;
    fallbackSource.loop = !!loop;
    fallbackSource.playbackRate.value = Math.max(0.5, Math.min(3, laughRate));
    fallbackSource.connect(SND.fxGain);
    fallbackSource.start(0);
  }catch(e){}
}

/* 播放一次抓取音效。
   kind: 'laugh' | 'ice'；idx: 冰块的序号(0/1/2)；
   loop: true=循环（笑声，覆盖到收上来）；false=只播一遍（冰块声） */
function startGrabSound(kind, idx, loop){
  var ctx = SND.ctx;
  if(!ctx) return;
  var buf = kind === 'ice' ? SND.iceBufs[idx] : null;
  // 记住这次抓取意图，暂停后恢复要用
  grabIntent = { kind: kind, idx: idx, loop: !!loop };
  hardStopAll();                            // 切掉上一轮，避免叠音
  var pool = stretchVoices.filter(function(v){
    return v.kind === kind && (kind !== 'ice' || v.idx === idx);
  });
  if(!stretchReady || !pool.length){
    startFallbackSound(buf || SND.laughBufs[0], loop);
    grabVoice = null;
    return;
  }
  var v = pool[Math.floor(Math.random() * pool.length)];
  var semi = 12 * Math.log2(Math.max(0.8, Math.min(2.5, laughRate)));
  try{
    // loop=true 时 loopStart/loopEnd 成对设置 = 循环；loop=false 时设为 0 = 只播一遍
    v.node.schedule({
      output: ctx.currentTime + 0.02, input: 0, active: true,
      rate: 1, semitones: semi,
      loopStart: 0, loopEnd: loop ? v.dur : 0
    });
    grabVoice = v;
  }catch(e){ startFallbackSound(buf || SND.laughBufs[0], loop); grabVoice = null; }
}

/* 抓奶蛙：播放笑声，循环覆盖「抓到 → 收上来」全程 */
function playLaugh(rate){
  laughRate = Math.max(0.8, Math.min(2, rate || 1));
  laughLoopOn = true;
  if(IS_LOCAL_FILE){ localAud.playLaugh(laughRate); return; }
  SND.ac();
  startGrabSound('laugh', -1, true);
}

/* 失败后的笑声音频：只播 laugh-audio.mp3，循环到离开失败页。
   本地走 <audio> 降级；部署后走 Web Audio（无需变调，直接循环播）。 */
var lossBuf = null, lossSource = null, lossLoading = false;
function loadLossLaugh(cb){
  if(lossBuf){ if(cb) cb(); return; }
  if(lossLoading) return;
  var c = SND.ctx; if(!c){ if(cb) cb(); return; }
  lossLoading = true;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', LOSS_LAUGH_FILE, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(){
    if(xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)){
      try{
        c.decodeAudioData(xhr.response).then(function(buf){
          lossBuf = buf;
          if(cb) cb();
        }).catch(function(){});
      }catch(e){}
    }
  };
  xhr.onerror = function(){};
  xhr.send();
}
function startLossSource(){
  var c = SND.ctx;
  if(!c || !lossBuf || !SND.fxGain) return;
  try{
    if(lossSource){ try{ lossSource.stop(); }catch(e){} try{ lossSource.disconnect(); }catch(e){} }
    lossSource = c.createBufferSource();
    lossSource.buffer = lossBuf;
    lossSource.loop = true;
    lossSource.connect(SND.fxGain);
    lossSource.start(0);
  }catch(e){}
}
function playLossLaugh(){
  if(IS_LOCAL_FILE){ localAud.playLossLaugh(); return; }
  var c = SND.ac(); if(!c || !SND.fxGain) return;
  if(lossBuf){ startLossSource(); }
  else { loadLossLaugh(function(){ startLossSource(); }); }
}
/* 抓冰块：count = 冰簇里冰块数量(1~3)，选冰1/冰2/冰3；rate 由冰块大小决定。
   冰块声只播一遍。 */
function playIce(count, rate){
  laughRate = Math.max(0.8, Math.min(2.5, rate || 1));
  if(IS_LOCAL_FILE){ localAud.playIce(count, laughRate); return; }
  SND.ac();
  startGrabSound('ice', Math.max(0, Math.min(2, (count | 0) - 1)), false);
}

/* 物件收上来时调用：不硬切，让当前这一遍自然播完。
   做法是取消循环——声音会继续放到缓冲末尾再静音，因此绝不会被提前掐断。 */
function finishGrabSound(){
  laughLoopOn = false;
  grabIntent = null;
  if(IS_LOCAL_FILE){ localAud.finishVoice(); return; }
  if(grabVoice){
    try{ grabVoice.node.schedule({ output: SND.ctx.currentTime, loopStart: 0, loopEnd: 0 }); }catch(e){}
    grabVoice = null;
  }
  if(fallbackSource){ try{ fallbackSource.loop = false; }catch(e){} }
}

/* 场景切换（回工厂 / 重开 / 游戏结束）：立即停声并忘记意图 */
function stopLaugh(){
  laughLoopOn = false;
  grabIntent = null;
  if(IS_LOCAL_FILE){ localAud.stopVoice(); return; }
  hardStopAll();
}
/* 暂停 / 打开面板：暂时停声，保留意图以便恢复 */
function pauseLaugh(){ if(IS_LOCAL_FILE){ localAud.stopVoice(); return; } hardStopAll(); }
/* 恢复游戏：若之前正抓着物件，按原样接着放，直到收上来 */
function resumeLaugh(){
  if(!laughLoopOn || !grabIntent) return;
  if(IS_LOCAL_FILE){
    if(grabIntent.kind === 'ice'){ localAud.playIce(grabIntent.idx + 1, laughRate); }
    else { localAud.playLaugh(laughRate); }
    return;
  }
  startGrabSound(grabIntent.kind, grabIntent.idx, grabIntent.loop);
}

/* 特殊音效（每局一只奶蛙播一次）：独立播放，不循环、不变调、不影响笑声。
   返回 true 表示这次调用成功触发了播放。 */
var specialSource = null, specialPlayed = false;
function playSpecial(){
  if(specialPlayed) return false;
  var c = SND.ctx;
  if(IS_LOCAL_FILE){ localAud.playSpecial(); specialPlayed = true; return true; }
  if(!c || !SND.specialBufs || !SND.specialBufs.length) return false;
  var buf = SND.specialBufs[Math.floor(Math.random() * SND.specialBufs.length)];
  if(!buf) return false;
  try{
    if(specialSource){ try{ specialSource.stop(); }catch(e){} try{ specialSource.disconnect(); }catch(e){} }
    var src = c.createBufferSource();
    src.buffer = buf;
    src.loop = false;
    src.connect(SND.fxGain);
    // 用实例判断，避免旧的 onended 回调误清新的引用
    src.onended = function(){ if(specialSource === src) specialSource = null; };
    src.start(0);
    specialSource = src;
    specialPlayed = true;
    return true;
  }catch(e){ return false; }
}
function stopSpecial(){
  if(specialSource){
    try{ specialSource.stop(); }catch(e){}
    try{ specialSource.disconnect(); }catch(e){}
    specialSource = null;
  }
}
/* 每局开始：允许再次播放特殊音效 */
function resetSpecial(){ specialPlayed = false; stopSpecial(); }
/* 本局是否已播过特殊音效 */
function specialAlreadyPlayed(){ return specialPlayed; }
