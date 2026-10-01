// ===== 奶蛙忍者模式 =====
var N = { items:[], trail:[], score:0, time:45, spawnT:0, over:false, jarFill:0, lastX:0, lastY:0, cutting:false };
function startNinja(){
  G.scene = 'ninja'; G.state = 'play';
  if(typeof stopLaugh === 'function') stopLaugh();
  N.items = []; N.trail = []; N.score = 0; N.time = 45; N.spawnT = 1; N.over = false; N.jarFill = 0;
  hide('ovNinja'); hide('ovNinjaEnd'); hide('ovFactory'); hide('ovGameSelect');
  hide('ovMenu'); hide('ovDiff');
}
function updateNinja(dt){
  N.time -= dt;
  if(N.time <= 0 && !N.over){ endNinja(); return; }
  N.spawnT -= dt;
  if(N.spawnT <= 0 && !N.over){
    spawnNinjaFrog();
    N.spawnT = 0.7 + Math.random()*0.8;
  }
  // 更新物体物理
  for(var i=N.items.length-1; i>=0; i--){
    var it = N.items[i];
    it.vy += 900*dt; // 重力
    it.x += it.vx*dt;
    it.y += it.vy*dt;
    it.rot += it.vr*dt;
    if(it.halves){
      it.halves.forEach(function(h){ h.vy += 900*dt; h.x += h.vx*dt; h.y += h.vy*dt; h.rot += h.vr*dt; });
    }
    // 掉出屏幕删除
    if(it.y > H+100) N.items.splice(i,1);
  }
  // 刀光轨迹
  if(N.trail.length > 10) N.trail.shift();
}
function spawnNinjaFrog(){
  var side = Math.random() < 0.5 ? -1 : 1;
  var isBomb = Math.random() < 0.15;
  var isBig = Math.random() < 0.25;
  var isRare = !isBomb && Math.random() < 0.08;
  var startX = side < 0 ? -40 : W+40;
  var peakY = 100 + Math.random()*150;
  var targetX = W/2 + (Math.random()-0.5)*200;
  var flyTime = 1.8 + Math.random()*0.8;
  var vx = (targetX - startX) / flyTime;
  // 从底部(y=H)发射，到达 peakY 需要的初速度
  var vy = -Math.sqrt(2*900*(H-peakY));
  var item = {
    x: startX, y: H+50, vx: vx, vy: vy,
    rot: 0, vr: (Math.random()-0.5)*4,
    type: isBomb?'bomb':(isRare?'rare':(isBig?'big':'small')),
    size: isBig?50:(isRare?40:32),
    cut: false, halves: null,
    rareId: isRare ? (1+Math.floor(Math.random()*RARE.length)) : 0
  };
  N.items.push(item);
}
function drawNinja(){
  // 背景
  var g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#2a1a0a'); g.addColorStop(1,'#4a2810');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  // 玻璃罐
  drawJar();
  // 画物体
  N.items.forEach(function(it){
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    if(it.cut && it.halves){
      it.halves.forEach(function(h, idx){
        ctx.save();
        ctx.translate(h.dx, h.dy);
        ctx.rotate(h.rot);
        drawNinjaFrogImg(it, idx);
        ctx.restore();
      });
    } else {
      drawNinjaFrogImg(it, -1);
    }
    ctx.restore();
  });
  // 刀光
  if(N.trail.length > 1){
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(N.trail[0].x, N.trail[0].y);
    for(var i=1;i<N.trail.length;i++) ctx.lineTo(N.trail[i].x, N.trail[i].y);
    ctx.stroke();
  }
  // HUD
  ctx.fillStyle = '#ffe14d'; ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('得分: '+N.score, 16, 40);
  ctx.fillStyle = N.time < 10 ? '#ff6b5e' : '#fff';
  ctx.textAlign = 'right';
  ctx.fillText('时间: '+Math.ceil(N.time), W-16, 40);
}
function drawNinjaFrogImg(it, halfIdx){
  var s = it.size;
  if(it.type === 'bomb'){
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(0,0,s/2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath(); ctx.arc(0,0,s/4,0,Math.PI*2); ctx.fill();
  } else {
    var img = it.type==='big' ? IMG.big : (it.type==='rare' ? IMG.rare[it.rareId] : IMG.small);
    if(img && img.complete && img.naturalWidth>0){
      var w = s*1.5, h = s*1.5;
      if(halfIdx === 0) ctx.beginPath(), ctx.rect(-w/2, -h/2, w/2, h), ctx.clip();
      if(halfIdx === 1) ctx.beginPath(), ctx.rect(0, -h/2, w/2, h), ctx.clip();
      ctx.drawImage(img, -w/2, -h/2, w, h);
    }
  }
}
function drawJar(){
  // 底部玻璃罐（只露瓶口和一点瓶身）
  var jarW = 300, jarH = 120;
  var jx = W/2 - jarW/2, jy = H - jarH;
  // 玻璃描边
  ctx.strokeStyle = 'rgba(150,210,255,0.6)';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(180,220,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(jx+20, jy);
  ctx.lineTo(jx+30, jy+jarH);
  ctx.lineTo(jx+jarW-30, jy+jarH);
  ctx.lineTo(jx+jarW-20, jy);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 罐子里的奶蛙堆积
  var fillH = Math.min(N.jarFill, jarH-10);
  if(fillH > 0){
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(jx+28, jy+jarH-fillH, jarW-56, fillH);
  }
  // 玻璃反光
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(jx+40, jy+10);
  ctx.lineTo(jx+55, jy+jarH-10);
  ctx.lineTo(jx+65, jy+jarH-10);
  ctx.lineTo(jx+50, jy+10);
  ctx.closePath(); ctx.fill();
}
function sliceNinja(x, y){
  N.items.forEach(function(it){
    if(it.cut) return;
    var dx = it.x - x, dy = it.y - y;
    if(Math.abs(dx) < it.size && Math.abs(dy) < it.size){
      it.cut = true;
      if(it.type === 'bomb'){
        endNinja(true);
        return;
      }
      // 两半
      it.halves = [
        {dx:-10, dy:0, vx:-120, vy:-150, rot:-0.3},
        {dx:10, dy:0, vx:120, vy:-150, rot:0.3}
      ];
      // 得分
      var pts = it.type==='big'?50:(it.type==='rare'?200:20);
      N.score += pts;
      N.jarFill += it.type==='big'?20:(it.type==='rare'?15:8);
      // 大奶蛙笑
      if(it.type === 'big' && typeof playLaugh === 'function') playLaugh();
      // 小奶蛙：矿工夹蛙的抓取音效
      if(it.type === 'small' && typeof SND !== 'undefined' && SND.grab) SND.grab();
      if(it.type === 'rare' && typeof SND !== 'undefined' && SND.cheer) SND.cheer();
      pop(it.x, it.y, '+'+pts, 20, '#ffe14d');
    }
  });
}
function endNinja(failed){
  N.over = true;
  document.getElementById('endScoreText').textContent = '得分 ' + N.score;
  var lb = document.getElementById('ninjaLaughBox');
  var can = document.getElementById('endCanImg');
  if(typeof stopLaugh === 'function') stopLaugh();
  if(failed){
    document.getElementById('endMsg').textContent = '你切到了炸弹！奶蛙笑你菜！';
    if(lb) lb.style.display = 'block';
    if(can) can.style.display = 'none';
    if(typeof playLaugh === 'function') playLaugh();
  } else {
    document.getElementById('endMsg').textContent = N.score > 500 ? '罐头大卖！od厂长很满意！' : '罐头做好啦！';
    if(lb) lb.style.display = 'none';
    if(can) can.style.display = '';
  }
  show('ovNinjaEnd');
}
// 鼠标/触摸切割
canvas.addEventListener('pointermove', function(e){
  if(G.scene !== 'ninja') return;
  var r = canvas.getBoundingClientRect();
  var x = (e.clientX - r.left) * (W / r.width);
  var y = (e.clientY - r.top) * (H / r.height);
  N.trail.push({x:x, y:y});
  sliceNinja(x, y);
});
canvas.addEventListener('pointerdown', function(e){
  if(G.scene !== 'ninja') return;
  var r = canvas.getBoundingClientRect();
  var x = (e.clientX - r.left) * (W / r.width);
  var y = (e.clientY - r.top) * (H / r.height);
  N.trail = [{x:x,y:y}];
  sliceNinja(x, y);
});
