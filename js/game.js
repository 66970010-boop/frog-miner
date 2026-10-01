var G = {
  scene: 'factory',
  state: 'menu',
  level: 1, score: 0, levelBase: 0, target: 800,
  time: 45, timeMax: 45,
  items: [], fx: [], parts: [], laughs: [],
  shake: 0, laughClock: 0,
  claw: { angle: 0, len: MINLEN, st: 'swing', phase: Math.random() * 6.28, item: null },
  deco: [],
  planeX: 100, planeDir: 1, planeY: 60,
  odAngry: 0,
  missCount: 0,
  dandanX: 375, dandanY: 114,
  dandanFaceDead: false,
  bomb: null,
  angryState: null, dandanJump: 0, // {timer, quote, bullet:{x,y,vx,vy,hit}}
  rareShowTimer: 0, difficulty: 'easy', pivotT: 0,
  rockUnit: 5, rockCount: 0, iceMeltRate: 0
};

var ITEMCFG = {
  small:   { r: 30, w: 58, h: 56, value: function(){ return Math.round((80 + Math.random() * 40) / 10) * 10; } },
  tiny:    { r: 24, w: 42, h: 40, value: function(){ return 60; } },
  big:     { r: 50, w: 90, h: 126, value: function(){ return Math.round((450 + Math.random() * 150) / 10) * 10; } },
  diamond: { r: 18, w: 26, h: 26, value: function(){ return 250; } },
  rock:    { r: 38, w: 56, h: 54, value: function(){ return 1 + Math.floor(Math.random() * 10); } },
  rare:    { r: 36, w: 72, h: 80, value: function(){ return 0; } }
};

/* 冰块：每次随机生成若干冰簇，每簇 1~3 块冰（对应 冰1/冰2/冰3 三种图与音效）。
   冰簇初始大小随机；随时间融化变小（音调随之变尖、价值随之下降）。
   基准价：1 块冰 = 10 个石头；冰簇价 = 块数 × 10 × 石头单价 × 当前尺寸比。
   融到 0 时小/中冰簇消失；最大的那个冰簇不消失（保留最小可见尺寸，价值归零）。 */
var ICE_BASE = {
  1: { w: 78,  h: 78,  r: 33 },
  2: { w: 118, h: 117, r: 49 },
  3: { w: 168, h: 112, r: 66 }
};
var ICE_ROCK_PER_CUBE = 10;   // 单块冰 = 10 个石头的价

// 抓取音调：体积×质量 = 越大的奶蛙越沉、音调越低
// 体积取绘制尺寸 w*h；质量取收钩速度倒数（SPEED 越小越重），以 big 为基准 1.0
var FROG_TYPES = { small: 1, tiny: 1, big: 1, rare: 1 };
var VOICE_RATE = (function(){
  var out = {}, bulk = {}, k;
  for(k in ITEMCFG){
    if(!FROG_TYPES[k]) continue;
    var vol = ITEMCFG[k].w * ITEMCFG[k].h;
    var mass = SPEED.big / SPEED[k];
    bulk[k] = vol * mass;
  }
  var maxB = bulk.big, minB = bulk.tiny;
  var span = Math.log(maxB / minB);
  for(k in bulk){
    // 对数映射：最重的 big 落在 0.8 倍，最轻的 tiny 落在 2.0 倍
    var r = 0.8 + 1.2 * Math.log(maxB / bulk[k]) / span;
    out[k] = Math.max(0.8, Math.min(2, r));
  }
  return out;
})();

function rand(a, b){ return a + Math.random() * (b - a); }

function genDeco(){
  G.deco = [];
  for(var i = 0; i < 30; i++){
    G.deco.push({ x: rand(10, W - 10), y: rand(SOIL_TOP + 20, H - 20), r: rand(2, 7),
      c: Math.random() < 0.5 ? 'rgba(255,214,120,0.10)' : 'rgba(30,15,5,0.28)' });
  }
  for(var k = 0; k < 7; k++){
    G.deco.push({ x: rand(60, W - 60), y: rand(SOIL_TOP + 40, H - 60), r: 0, c: 'root',
      len: rand(30, 90), ang: rand(-0.6, 0.6) });
  }
}

function genLevel(n){
  G.items = []; genDeco();
  resetSpecial();   // 本关允许再播一次特殊音效（每关必定有一只奶蛙会播）
  placeType('small', 2 + Math.min(n, 6));
  placeType('tiny', n >= 4 ? 2 : 1);
  placeType('big', Math.min(1 + Math.ceil(n / 2), 5));
  // 中等/困难：大奶蛙抱钻石左右跑
  if(G.difficulty !== 'easy'){
    G.items.forEach(function(it){
      if(it.type === 'big'){
        it.wander = { dir: Math.random() < 0.5 ? 1 : -1, range: 80, cx: it.x, speed: rand(30, 85) };
        it.holdsDiamond = true;
        it.value += 400; // 抱钻石加分
      }
    });
  }
  placeType('diamond', n >= 2 ? 2 : 1);
  placeType('rock', 2 + Math.ceil(n / 1.5));
  // 本关石头均价：单块冰 = 10 个石头的价（大冰簇 3 块 = 30 个石头）
  var rockSum = 0, rockN = 0;
  G.items.forEach(function(it){ if(it.type === 'rock'){ rockSum += it.value; rockN++; } });
  G.rockUnit = rockN ? rockSum / rockN : 5;
  G.rockCount = rockN;
  spawnIce();
  var dex = loadDex();
  var ungot = RARE.filter(function(r){ return dex.indexOf(r.id) < 0; });
  var chosen = ungot.length ? ungot[Math.floor(Math.random() * ungot.length)] : RARE[Math.floor(Math.random() * RARE.length)];
  for(var rt = 0; rt < 400; rt++){
    var ra = rand(-0.95, 0.95) * MAXA;
    var rcosA = Math.max(0.52, Math.cos(ra));
    var rlenMax = Math.min(MAXLEN - 24, (H - 46 - PIVOT.y) / rcosA);
    if(rlenMax < 150) rlenMax = 150;
    var rlen = rand(160, rlenMax);
    var rx = PIVOT.x + Math.sin(ra) * rlen;
    var ry = PIVOT.y + rcosA * rlen;
    if(ry < SOIL_TOP + 85) continue;
    var rok = true;
    for(var ri = 0; ri < G.items.length; ri++){
      var rit = G.items[ri];
      if(Math.hypot(rit.x - rx, rit.y - ry) < rit.r + 36 + 14){ rok = false; break; }
    }
    if(rok){
      G.items.push({ type:'rare', rareId: chosen.id, rareName: chosen.name, x:rx, y:ry, r:36, w:72, h:80, value: chosen.value, grabbed:false, collected:false });
      break;
    }
  }
  // 目标只按「不会消失」的物品计算：冰块会融化归零，算作额外奖励，不计入目标
  var total = 0;
  G.items.forEach(function(it){ if(it.type !== 'ice') total += it.value; });
  G.target = Math.max(500, Math.round(total * 0.62 / 50) * 50);
  G.time = G.timeMax = 45;
  // 融化速率：让最大冰簇恰好在关卡时间结束时融到 0
  var maxInit = 0;
  G.items.forEach(function(it){ if(it.type === 'ice' && it.initRatio > maxInit) maxInit = it.initRatio; });
  G.iceMeltRate = maxInit > 0 ? maxInit / G.timeMax : 0;
  G.missCount = 0;
  updateHUD();
}

function placeType(type, count){
  for(var k = 0; k < count; k++){
    for(var tries = 0; tries < 400; tries++){
      var a;
      if(type === 'diamond'){
        var side = Math.random() < 0.5 ? -1 : 1;
        a = side * rand(0.62, 0.98) * MAXA;
      } else {
        a = rand(-0.95, 0.95) * MAXA;
      }
      var cosA = Math.max(0.52, Math.cos(a));
      var lenMax = Math.min(MAXLEN - 24, (H - 46 - PIVOT.y) / cosA);
      if(lenMax < 150) lenMax = 150;
      var len = type === 'diamond' ? rand(lenMax * 0.82, lenMax * 0.98) : rand(160, lenMax);
      var x = PIVOT.x + Math.sin(a) * len;
      var y = PIVOT.y + cosA * len;
      if(y < SOIL_TOP + 85) continue;
      var cfg = ITEMCFG[type];
      var ok = true;
      for(var j = 0; j < G.items.length; j++){
        var it = G.items[j];
        if(Math.hypot(it.x - x, it.y - y) < it.r + cfg.r + 14){ ok = false; break; }
      }
      if(ok){
        var it = { type: type, x: x, y: y, r: cfg.r, w: cfg.w, h: cfg.h, value: cfg.value(), grabbed: false, collected: false };
        if(type === 'rock'){ var o = []; for(var m = 0; m < 7; m++){ o.push(0.72 + Math.random() * 0.28); } it.offs = o; }
        G.items.push(it); break;
      }
    }
  }
}

/* 生成冰簇：数量按石头的约一半来（3石头→2冰、6石头→3冰），即 ceil(石头数/2）。
   每簇 1~3 块冰、大小随机。最大的那簇不消失；其它融化到 0 后消失。 */
function spawnIce(){
  var clusters = Math.max(1, Math.ceil((G.rockCount || 2) / 2));
  var made = [];
  for(var ci = 0; ci < clusters; ci++){
    var cubes = 1 + Math.floor(Math.random() * 3);       // 1~3 块
    var it = placeIceCluster(cubes);
    if(it) made.push(it);
  }
  if(!made.length) return;
  // 标出最大的那一簇（不消失）
  var big = made[0];
  made.forEach(function(m){ if(m.initRatio > big.initRatio) big = m; });
  big.isBiggest = true;
  // 冰簇价值：块数 × 10 × 石头单价 × 当前尺寸比
  var unit = (G.rockUnit || 5);
  made.forEach(function(m){
    m.unitValue = m.cubes * ICE_ROCK_PER_CUBE * unit;
    m.value = Math.round(m.unitValue * m.sizeRatio);
  });
}

function placeIceCluster(cubes){
  var base = ICE_BASE[cubes];
  var ratio = rand(0.55, 1.0);                           // 初始大小随机
  // 大冰簇优先放在下层宽敞处，避免相互重叠
  for(var tries = 0; tries < 600; tries++){
    var a = rand(-0.95, 0.95) * MAXA;
    var cosA = Math.max(0.52, Math.cos(a));
    var lenMax = Math.min(MAXLEN - 24, (H - 46 - PIVOT.y) / cosA);
    if(lenMax < 160) lenMax = 160;
    // 大冰簇倾向于放得更深（更靠下）
    var len = rand(lenMax * (0.55 + 0.15 * (3 - cubes)), lenMax * 0.99);
    var x = PIVOT.x + Math.sin(a) * len;
    var y = PIVOT.y + cosA * len;
    var w = base.w * ratio, h = base.h * ratio, r = base.r * ratio;
    if(x - w / 2 < 6 || x + w / 2 > W - 6) continue;
    if(y - h / 2 < SOIL_TOP + 40 || y + h / 2 > H - 16) continue;
    var ok = true;
    for(var j = 0; j < G.items.length; j++){
      var oit = G.items[j];
      if(Math.hypot(oit.x - x, oit.y - y) < oit.r + r + 16){ ok = false; break; }
    }
    if(!ok) continue;
    var it = {
      type: 'ice', cubes: cubes, x: x, y: y,
      r: r, w: w, h: h,
      baseW: base.w, baseH: base.h, baseR: base.r,
      initRatio: ratio, sizeRatio: ratio,
      isBiggest: false, unitValue: 0, value: 0,
      grabbed: false, collected: false
    };
    G.items.push(it);
    return it;
  }
  return null;
}

/* 冰块融化：所有冰簇以同一绝对速度缩小（由最大冰簇决定，使它恰好在本关结束时融到 0）。
   起始更小的冰簇因此更早融光、更早消失。
   尺寸变小 → 价值下降、抓取音调变尖。
   最大冰簇融到 0 后价值归零，但保留最小可见尺寸、不消失。 */
var ICE_MIN_VIS = 0.1;
function updateIce(dt){
  if(!G.iceMeltRate) return;
  for(var i = 0; i < G.items.length; i++){
    var it = G.items[i];
    if(it.type !== 'ice' || it.collected || it.grabbed) continue;
    it.sizeRatio -= G.iceMeltRate * dt;
    if(it.sizeRatio < 0) it.sizeRatio = 0;
    var eff = it.sizeRatio;
    if(it.isBiggest && eff < ICE_MIN_VIS) eff = ICE_MIN_VIS;   // 最大冰簇保留最小尺寸
    it.w = it.baseW * eff;
    it.h = it.baseH * eff;
    it.r = it.baseR * eff;
    it.value = Math.round(it.unitValue * it.sizeRatio);
    if(it.sizeRatio <= 0 && !it.isBiggest){
      it.collected = true;                                     // 融光消失
      dust(it.x, it.y);
    }
  }
}

// 冰块当前尺寸 → 抓取音调��越大越沉、越小越尖
function iceRate(it){
  var ratio = Math.max(0, Math.min(1, it.sizeRatio));
  return 0.8 + (1 - ratio) * 1.4;                        // 1.0→0.8(沉)  0→2.2(尖)
}

function pop(x, y, txt, size, color){
  G.fx.push({ x: x, y: y, txt: txt, size: size || 20, color: color || '#ffe14d', vy: -44, life: 1.1, max: 1.1, rot: rand(-0.12, 0.12) });
}
function burst(x, y, n, colors, spd, grav, sz, life){
  for(var i = 0; i < n; i++){
    var a = Math.random() * Math.PI * 2, v = rand(spd * 0.4, spd);
    G.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.3, g: grav || 260, life: life || 0.7, max: life || 0.7, size: rand(sz * 0.6, sz), color: colors[Math.floor(Math.random() * colors.length)] });
  }
}
function sparkle(x, y){ burst(x, y, 22, ['#ffe14d', '#ffd75e', '#fff6c9', '#f5a623'], 190, 120, 5, 0.7); }
function confetti(x, y){ burst(x, y, 34, ['#ffe14d', '#ff9d3d', '#58a84f', '#ff6b5e', '#6ec6ff'], 230, 260, 5, 1.0); }
function dust(x, y){ burst(x, y, 14, ['#a0835c', '#8a6b45', '#6b4f2e'], 110, 40, 6, 0.8); }
function diamondBurst(x, y){
  burst(x, y, 40, ['#ffffff', '#c8f0ff', '#5db4ec', '#ffe14d'], 260, 100, 4, 1.0);
  for(var i = 0; i < 8; i++){
    G.fx.push({ x: x, y: y, txt: '✦', size: 18 + Math.random() * 14, color: '#fff', vy: -30 - Math.random() * 40, life: 1.2, max: 1.2, rot: rand(-0.3, 0.3) });
  }
}

function updateFx(dt){
  for(var i = G.fx.length - 1; i >= 0; i--){
    var f = G.fx[i]; f.life -= dt; f.y += f.vy * dt; f.vy *= (1 - 1.4 * dt);
    if(f.life <= 0) G.fx.splice(i, 1);
  }
  for(var j = G.parts.length - 1; j >= 0; j--){
    var p = G.parts[j]; p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if(p.life <= 0) G.parts.splice(j, 1);
  }
  for(var k = G.laughs.length - 1; k >= 0; k--){
    var l = G.laughs[k]; l.life -= dt;
    if(l.life <= 0) G.laughs.splice(k, 1);
  }
}

function tip(){
  var c = G.claw;
  return { x: PIVOT.x + Math.sin(c.angle) * c.len, y: PIVOT.y + Math.cos(c.angle) * c.len };
}
function swingOnly(dt){
  var c = G.claw;
  c.phase += dt * Math.PI * 2 * FREQ;
  c.angle = MAXA * Math.sin(c.phase);
  c.len = MINLEN;
}
function updateClaw(dt){
  var c = G.claw;
  if(c.st === 'swing'){ swingOnly(dt); }
  else if(c.st === 'drop'){
    c.len += DROP_SPEED * dt;
    if(c.len >= MAXLEN){ c.st = 'retract'; c.item = null; onMiss(); return; }
    var t = tip();
    var best = null, bestD = 1e9;
    for(var i = 0; i < G.items.length; i++){
      var it = G.items[i];
      if(it.collected || it.grabbed) continue;
      var d = Math.hypot(t.x - it.x, t.y - it.y);
      if(d < it.r + 12 && d < bestD){ bestD = d; best = it; }
    }
    if(best) grab(best);
  } else if(c.st === 'retract'){
    var sp = c.item ? SPEED[c.item.type] : RETRACT_EMPTY;
    if(c.item && c.item.type === 'ice'){
      // 冰块越重（越大）拉得越慢，与音调/价值一致
      sp = 90 + 210 * Math.max(0, Math.min(1, c.item.sizeRatio));
    }
    var bigPull = !!(c.item && c.item.type === 'big');
    if(bigPull){
      var ph = (performance.now() % 800) / 800;
      if(ph > 0.4) sp *= 0.05;
      if(Math.random() < dt * 4){
        var tp0 = tip();
        G.parts.push({ x: tp0.x + rand(-7, 7), y: tp0.y + 10, vx: rand(-15, 15), vy: rand(-90, -40), g: 280, life: 0.45, max: 0.45, size: 3, color: '#d8f6ff' });
      }
    }
    c.len -= sp * dt;
    if(c.item){ var tp = tip(); c.item.x = tp.x; c.item.y = tp.y; }
    if(c.len <= MINLEN){ deliver(); c.st = 'swing'; c.item = null; }
  }
}

var ANGRY_QUOTES = ['没用的蛋蛋！', '蛋蛋你怎么又空钩了！', '蛋蛋你今天不许吃晚饭！'];
function onMiss(){
  G.missCount++;
  G.odAngry = 1.2; // 每次空钩都冒火一下
  if(G.missCount >= 3){
    G.missCount = 0;
    startAngryCutscene();
  }
}
function startAngryCutscene(){
  if(G.state !== 'play') return;
  G.state = 'angryPause';
  G.odAngry = 3;
  var quote = ANGRY_QUOTES[Math.floor(Math.random() * ANGRY_QUOTES.length)];
  G.angryState = {
    timer: 0,
    quote: quote,
    bullet: { x: G.planeX, y: G.planeY + 15, vx: 0, vy: 0, hit: false }
  };
  SND.fail();
  // 子弹朝蛋蛋脸飞
  var bx = G.dandanX - G.planeX;
  var by = (G.dandanY - 20) - (G.planeY + 15);
  var bt = 1.0; // 1秒飞完
  G.angryState.bullet.vx = bx / bt;
  G.angryState.bullet.vy = by / bt;
}

function grab(it){
  var c = G.claw;
  it.grabbed = true; c.item = it; c.st = 'retract';
  G.dandanJump = 0.5; // 高兴连跳两下
  if(FROG_TYPES[it.type]){
    // 所有奶蛙都笑：音调由体积×质量决定，大蛙沉、小蛙尖
    G.laughClock = 0.0001; playLaugh(VOICE_RATE[it.type]);
    // 本局第一只被抓到的奶蛙，额外播一次特殊音效（每局限一次）
    if(!specialAlreadyPlayed()){ playSpecial(); }
    G.missCount = 0;
    if(it.type === 'big'){
      G.shake = 0.5;
      pop(it.x, it.y - 60, '好重！哈哈哈哈！', 24, '#ffe14d');
      sparkle(it.x, it.y);
    } else if(it.type !== 'rare'){
      sparkle(it.x, it.y);
    }
  } else if(it.type === 'rock'){
    SND.rock(); dust(it.x, it.y);
    pop(it.x, it.y - 30, '好沉…', 16, '#cfc4ae');
    G.missCount++;
    if(G.missCount >= 3){ G.odAngry = 2.5; G.missCount = 0; pop(400, 60, '厂长生气了！', 22, '#ff6b5e'); }
  } else if(it.type === 'ice'){
    // 冰块的音效按冰簇块数选（冰1/冰2/冰3），音调随尺寸：越大越沉、越小越尖
    G.laughClock = 0.0001;
    playIce(it.cubes, iceRate(it));
    G.missCount = 0;
    sparkle(it.x, it.y);
    pop(it.x, it.y - it.h / 2 - 12, it.cubes + '连冰！', 18, '#bfe9ff');
  } else if(it.type === 'diamond'){
    SND.diamond(); diamondBurst(it.x, it.y);
    pop(it.x, it.y - 30, '钻石！', 22, '#c8f0ff');
  }
  if(it.type === 'rare'){ showRareShow(it); }
}

function deliver(){
  var it = G.claw.item;
  if(!it) return;
  // 收上来了：取消循环，让当前这一遍笑声自然播完（不硬切，避免被截断）
  if(FROG_TYPES[it.type] || it.type === 'ice') finishGrabSound();
  if(it.type === 'rock'){
    dust(PIVOT.x, PIVOT.y + 40, 12);
    G.score += it.value;
    pop(400, 108, '+' + it.value, 20, '#cfc4ae');
    if(G.score >= G.target && G.state === 'play'){ it.collected = true; G.dandanFaceDead = false; updateHUD(); levelClear(); return; }
  } else if(it.type === 'ice'){
    G.score += it.value;
    SND.coin();
    pop(400, 108, '+' + it.value, 27, '#bfe9ff');
    pop(400, 148, it.cubes + '块冰×' + it.cubes * ICE_ROCK_PER_CUBE + '石头', 18, '#8fd4ff');
    diamondBurst(400, 170);
    if(G.score >= G.target && G.state === 'play'){ it.collected = true; G.dandanFaceDead = false; updateHUD(); levelClear(); return; }
  } else {
    G.score += it.value;
    SND.coin();
    pop(400, 108, '+' + it.value, 27, '#ffe14d');
    if(it.type === 'big'){
      G.shake = Math.max(G.shake, 0.3);
      pop(400, 148, '好重…终于收工！', 20, '#ff9d3d');
      confetti(400, 170);
    }
    if(it.type === 'rare'){
      var dex = loadDex();
      var isNew = dex.indexOf(it.rareId) < 0;
      if(isNew){ dex.push(it.rareId); saveDex(dex); }
      pop(400, 148, isNew ? '图鉴解锁：' + it.rareName : '又是' + it.rareName, 20, '#ffd75e');
      confetti(400, 170);
    }
    if(it.type === 'diamond'){ diamondBurst(400, 170); }
    if(G.score >= G.target && G.state === 'play'){ levelClear(); return; }
  }
  it.collected = true;
  G.dandanFaceDead = false;
  updateHUD();
}

function showRareShow(it){
  G.state = 'rareShow';
  G.rareShowTimer = 2.2;
  var info = RARE.find(function(r){ return r.id === it.rareId; });
  document.getElementById('rareShowImg').src = info.img;
  document.getElementById('rareShowLabel').textContent = it.rareName;
  show('ovRareShow');
  SND.applause(); SND.cheer();
}
function hideRareShow(){
  hide('ovRareShow');
  if(G.state === 'rareShow') G.state = 'play';
}

function dropBomb(){
  var dx = G.dandanX - G.planeX;
  var dy = (G.dandanY + 10) - (G.planeY + 20);
  var t = Math.max(0.8, Math.sqrt(2 * dy / 600)); // 自由落体时间
  G.bomb = { x: G.planeX, y: G.planeY + 20, vy: 0, vx: dx / t, exploded: false, tx: G.dandanX, ty: G.dandanY + 10 };
}
function updateBomb(dt){
  if(!G.bomb) return;
  if(!G.bomb.exploded){
    G.bomb.vy += 600 * dt;
    G.bomb.y += G.bomb.vy * dt;
    G.bomb.x += G.bomb.vx * dt;
    // 拖尾
    G.parts.push({ x: G.bomb.x, y: G.bomb.y, vx: 0, vy: 0, g: 0, life: 0.3, max: 0.3, size: 3, color: '#666' });
    if(G.bomb.y >= G.bomb.ty){
      G.bomb.exploded = true;
      G.shake = 1.2;
      G.dandanFaceDead = true;
      SND.explosion();
      burst(G.dandanX, G.dandanY, 60, ['#ff6b3a', '#ffd75e', '#333', '#666', '#999', '#fff'], 320, 220, 7, 1.8);
      // 火球
      for(var fi = 0; fi < 5; fi++){
        G.fx.push({ x: G.dandanX + (Math.random()-0.5)*40, y: G.dandanY + (Math.random()-0.5)*20,
          txt: ['🔥','●','✦'][fi % 3], size: 28 + Math.random()*18, color: fi%2 ? '#ff9d3d' : '#ffe14d',
          vy: -20 - Math.random()*30, life: 1.4, max: 1.4, rot: rand(-0.2,0.2) });
      }
      pop(G.dandanX, G.dandanY - 50, '轰——！', 38, '#ff9d3d');
      setTimeout(function(){ G.bomb = null; }, 1500);
    }
  }
}
function updateWander(dt){
  if(G.state !== 'play') return;
  G.items.forEach(function(it){
    if(it.wander && !it.grabbed){
      it.x += it.wander.dir * it.wander.speed * dt;
      if(it.x > it.wander.cx + it.wander.range){ it.wander.dir = -1; }
      if(it.x < it.wander.cx - it.wander.range){ it.wander.dir = 1; }
    }
  });
}
function updatePivot(dt){
  if(G.difficulty !== 'hard' || G.state !== 'play') return;
  G.pivotT += dt * 0.6;
  PIVOT.x = 400 + Math.sin(G.pivotT) * 80;
  G.dandanX = PIVOT.x - 25;
}
function updateAngry(dt){
  if(!G.angryState) return;
  var a = G.angryState;
  a.timer += dt;
  // 子弹飞
  if(!a.bullet.hit){
    a.bullet.x += a.bullet.vx * dt;
    a.bullet.y += a.bullet.vy * dt;
    var dx = a.bullet.x - G.dandanX;
    var dy = a.bullet.y - (G.dandanY - 20);
    if(Math.hypot(dx, dy) < 12){
      a.bullet.hit = true;
      G.dandanFaceDead = true;
      G.shake = 0.6;
      SND.explosion();
      burst(G.dandanX, G.dandanY - 20, 24, ['#ff6b3a', '#333', '#666', '#999'], 220, 180, 5, 1.0);
      // 1.2 秒后脸自动恢复
      setTimeout(function(){ G.dandanFaceDead = false; }, 1200);
    }
  }
  // 3秒后结束
  if(a.timer >= 3.0){
    G.angryState = null;
    G.state = 'play';
    // 脸黑保留到下次抓到东西
  }
}

function startGame(){
  G.scene = 'play'; G.state = 'menu'; G.level = 1; G.score = 0; G.levelBase = 0;
  G.dandanDead = false; G.dandanFaceDead = false; G.bomb = null; G.angryState = null; G.odAngry = 0;
  genLevel(1); resetClaw();
  hide('ovFactory');
  show('ovMenu');
}
function enterMiner(){
  hide('ovMenu');
  G.state = 'play';
  genLevel(1); resetClaw();
}
function nextLevel(){
  SND.ac(); SND.click();
  G.level++; G.score = 0; G.levelBase = 0;
  genLevel(G.level); resetClaw();
  G.state = 'play';
  hide('ovClear');
}
function retryLevel(){
  SND.ac(); SND.click();
  G.score = 0; stopLaugh();
  G.dandanDead = false; G.dandanFaceDead = false; G.bomb = null; G.angryState = null;
  genLevel(G.level); resetClaw();
  G.state = 'play';
  hide('ovOver');
}
function toFactory(){
  SND.ac(); SND.click();
  G.scene = 'factory'; G.state = 'menu'; G.score = 0; G.level = 1; G.levelBase = 0;
  genLevel(1); resetClaw();
  stopLaugh();
  G.dandanDead = false; G.dandanFaceDead = false; G.bomb = null; G.angryState = null;
  hide('ovPause'); hide('ovClear'); hide('ovOver'); hide('ovMenu');
  show('ovFactory');
}
function levelClear(){
  G.state = 'clear'; SND.fanfare(); SND.applause(); SND.cheer();
  document.getElementById('clearText').textContent = '当前关卡累计 $' + G.score.toLocaleString() + ' ／ 目标 $' + G.target.toLocaleString();
  show('ovClear');
}
function gameOver(){
  G.state = 'overAnim';
  stopLaugh();
  playLossLaugh(); // 输了的音频 = 专用笑声音频（循环到离开失败页）
  var lack = Math.max(0, G.target - G.score);
  document.getElementById('overText').textContent = '还差 $' + lack.toLocaleString() + ' 没抓够';
  dropBomb();
  // 等炸弹落地爆炸后再弹失败面板
  setTimeout(function(){
    G.state = 'over';
    show('ovOver');
  }, 2800);
}
function resetClaw(){
  G.claw = { angle: 0, len: MINLEN, st: 'swing', phase: Math.random() * 6.28, item: null };
}

function togglePause(){
  SND.click();
  if(G.state === 'play'){
    G.state = 'paused'; show('ovPause');
    pauseLaugh();
  } else if(G.state === 'paused'){
    G.state = 'play'; hide('ovPause');
    resumeLaugh();
  }
}
function openSettings(){
  SND.click();
  setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
  setRangeUI('fxRange', 'fxVal', SND.fxVol);
  settingsPrevState = G.state;
  if(G.state === 'play'){
    G.state = 'settings';
    pauseLaugh();
  }
  show('ovSettings');
}
function closeSettings(){
  SND.click();
  hide('ovSettings');
  if(settingsPrevState === 'play' && G.state === 'settings'){
    G.state = 'play';
    resumeLaugh();
  }
}

/* 清除所有本地数据：图鉴、音量设置、关卡进度 */
function openClearConfirm(){
  SND.click();
  show('ovConfirm');
}
function cancelClear(){
  SND.click();
  hide('ovConfirm');
}
function clearAllData(){
  SND.click();
  try{
    localStorage.removeItem('frogDex');   // 图鉴收集记录
    localStorage.removeItem('frogVol');   // 音量设置
    localStorage.removeItem('frogLevel'); // 关卡进度（若存在）
  }catch(e){}
  // 重置内存中的进度与设置
  G.level = 1; G.score = 0; G.levelBase = 0;
  mutedVol = null;
  SND.bgmVol = 0.25; SND.fxVol = 1;
  applyVolumes(); saveVol();
  setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
  setRangeUI('fxRange', 'fxVal', SND.fxVol);
  hide('ovConfirm');
  hide('ovSettings');
  // 回到工厂首页，重开一局干净的游戏
  toFactory();
}
function setRangeUI(rangeId, valId, v){
  var r = document.getElementById(rangeId);
  if(r) r.value = Math.round(v * 100);
  var lab = document.getElementById(valId);
  if(lab) lab.textContent = Math.round(v * 100) + '%';
}
var mutedVol = null;
function toggleMute(){
  if(mutedVol){
    SND.bgmVol = mutedVol.bgm; SND.fxVol = mutedVol.fx; mutedVol = null;
  } else {
    mutedVol = { bgm: SND.bgmVol, fx: SND.fxVol };
    SND.bgmVol = 0; SND.fxVol = 0;
  }
  applyVolumes();
  saveVol();
  setRangeUI('bgmRange', 'bgmVal', SND.bgmVol);
  setRangeUI('fxRange', 'fxVal', SND.fxVol);
}

function dropOrRetract(){
  if(G.state !== 'play') return;
  var c = G.claw;
  if(c.st === 'swing'){ c.st = 'drop'; SND.drop(); }
  else if(c.st === 'drop'){ c.st = 'retract'; c.item = null; onMiss(); }
}

function updateHUD(){
  document.getElementById('score').textContent = '$' + G.score.toLocaleString();
  document.getElementById('target').textContent = '$' + G.target.toLocaleString();
  document.getElementById('level').textContent = G.level;
  var t = document.getElementById('time');
  t.textContent = Math.max(0, Math.ceil(G.time));
  document.getElementById('timeStat').className = 'stat' + (G.time <= 10 ? ' warn' : '');
}

function update(dt){
  if(G.scene === 'ninja'){ updateNinja(dt); return; }
  G.shake = Math.max(0, G.shake - dt);
  if(G.laughClock > 0) G.laughClock += dt;
  updateFx(dt);
  updateBomb(dt);
  updateWander(dt);
  updatePivot(dt);
  updateAngry(dt);
  if(G.state === 'rareShow'){
    G.rareShowTimer -= dt;
    if(G.rareShowTimer <= 0) hideRareShow();
    return;
  }
  if(G.scene === 'play' && G.state === 'play'){
    G.planeX += G.planeDir * 60 * dt;
    if(G.planeX > W - 80){ G.planeX = W - 80; G.planeDir = -1; }
    if(G.planeX < 80){ G.planeX = 80; G.planeDir = 1; }
    if(G.odAngry > 0) G.odAngry -= dt;
    if(G.dandanJump > 0) G.dandanJump -= dt;
  }
  if(G.state === 'menu'){ swingOnly(dt); return; }
  if(G.state !== 'play') return;
  G.time -= dt;
  updateClaw(dt);
  updateIce(dt);
  if(G.time <= 0 && G.score < G.target){ gameOver(); }
  updateHUD();
}
