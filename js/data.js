'use strict';
var W = 800, H = 600;
var SOIL_TOP = 152;
var PIVOT = { x: 400, y: 128 };
var MINLEN = 54, MAXLEN = 470;
var MAXA = 1.05, FREQ = 0.5;
var DROP_SPEED = 330, RETRACT_EMPTY = 420;
var SPEED = { small: 250, tiny: 285, big: 70, diamond: 330, rock: 90, rare: 260, ice: 120 };
var FONT = "'ZCOOL KuaiLe','Microsoft YaHei','PingFang SC',sans-serif";
var SHEET_W = 144, SHEET_H = 192, SHEET_N = 20;

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * dpr; canvas.height = H * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

var loadCount = 0, loadNeeded = 15;
function tickLoad(){
  loadCount++;
  if(loadCount >= loadNeeded){
    hide('ovLoading');
    show('ovFactory');
  }
}
// 800ms 兜底：防止图片加载卡住一直转圈
setTimeout(function(){
  hide('ovLoading');
  show('ovFactory');
}, 800);
function loadImg(src){ var im = new Image(); im.onload = tickLoad; im.onerror = tickLoad; im.src = src; return im; }
var RARE = [
  { id:1, name:'呐喊蛙',   img:'assets/frog-rare-1.webp', value:600 },
  { id:2, name:'洛丽塔蛙', img:'assets/frog-rare-2.webp', value:650 },
  { id:3, name:'艺术蛙',   img:'assets/frog-rare-3.webp', value:650 },
  { id:4, name:'奶茶蛙',   img:'assets/frog-rare-4.webp', value:600 },
  { id:5, name:'吸猫蛙',   img:'assets/frog-rare-5.webp', value:700 },
  { id:6, name:'蹦蹦蛙',   img:'assets/frog-rare-6.webp', value:550 },
  { id:7, name:'耶耶蛙',   img:'assets/frog-rare-7.webp', value:600 },
  { id:8, name:'花束蛙',   img:'assets/frog-rare-8.webp', value:650 },
  { id:9, name:'生气蛙',   img:'assets/frog-rare-9.webp', value:550 },
  { id:10, name:'打工奶龙', img:'assets/frog-rare-10.webp', value:620 },
  { id:11, name:'摆烂奶龙', img:'assets/frog-rare-11.webp', value:657 },
  { id:12, name:'摸鱼奶龙', img:'assets/frog-rare-12.webp', value:694 },
  { id:13, name:'搬砖奶龙', img:'assets/frog-rare-13.webp', value:731 },
  { id:14, name:'加班奶龙', img:'assets/frog-rare-14.webp', value:768 },
  { id:15, name:'干饭奶龙', img:'assets/frog-rare-15.webp', value:805 },
  { id:16, name:'追剧奶龙', img:'assets/frog-rare-16.webp', value:842 },
  { id:17, name:'打游戏奶龙', img:'assets/frog-rare-17.webp', value:579 },
  { id:18, name:'睡觉奶龙', img:'assets/frog-rare-18.webp', value:616 },
  { id:19, name:'拼豆奶鼠', img:'assets/frog-rare-19.webp', value:653 },
  { id:20, name:'萌脸奶龙', img:'assets/frog-rare-20.webp', value:690 },
  { id:21, name:'眨眼奶龙', img:'assets/frog-rare-21.webp', value:727 },
  { id:22, name:'全员奶蛙', img:'assets/frog-rare-22.webp', value:764 },
  { id:23, name:'气鼓鼓蛙', img:'assets/frog-rare-23.webp', value:801 },
  { id:24, name:'野生奶蛙', img:'assets/frog-rare-24.webp', value:838 },
  { id:25, name:'送花蛙一', img:'assets/frog-rare-25.webp', value:575 },
  { id:26, name:'送花蛙二', img:'assets/frog-rare-26.webp', value:612 },
  { id:27, name:'宇宙奶蛙', img:'assets/frog-rare-27.webp', value:649 },
  { id:28, name:'日常蛙一', img:'assets/frog-rare-28.webp', value:686 },
  { id:29, name:'日常蛙二', img:'assets/frog-rare-29.webp', value:723 },
  { id:30, name:'瞅一眼蛙一', img:'assets/frog-rare-30.webp', value:760 },
  { id:31, name:'日常蛙三', img:'assets/frog-rare-31.webp', value:797 },
  { id:32, name:'日常蛙四', img:'assets/frog-rare-32.webp', value:834 },
  { id:33, name:'瞅一眼蛙二', img:'assets/frog-rare-33.webp', value:571 },
  { id:34, name:'日常蛙五', img:'assets/frog-rare-34.webp', value:608 },
  { id:35, name:'瞅一眼蛙三', img:'assets/frog-rare-35.webp', value:645 },
  { id:36, name:'日常蛙六', img:'assets/frog-rare-36.webp', value:682 },
  { id:37, name:'瞅一眼蛙四', img:'assets/frog-rare-37.webp', value:719 },
  { id:38, name:'瞅一眼蛙五', img:'assets/frog-rare-38.webp', value:756 },
  { id:39, name:'瞅一眼蛙六', img:'assets/frog-rare-39.webp', value:793 },
  { id:40, name:'美人蛙', img:'assets/frog-rare-40.webp', value:830 },
  { id:41, name:'喵喵蛙一', img:'assets/frog-rare-41.webp', value:567 },
  { id:42, name:'喵喵蛙二', img:'assets/frog-rare-42.webp', value:604 },
  { id:43, name:'喵喵蛙三', img:'assets/frog-rare-43.webp', value:641 },
  { id:44, name:'乐跑奶龙', img:'assets/frog-rare-44.webp', value:678 },
  { id:45, name:'打工奶龙二', img:'assets/frog-rare-45.webp', value:715 },
  { id:46, name:'打工奶龙三', img:'assets/frog-rare-46.webp', value:752 },
  { id:47, name:'打工奶龙四', img:'assets/frog-rare-47.webp', value:789 }
];
var IMG = {
  big: loadImg('assets/frog-big.webp'),
  small: loadImg('assets/frog-small.webp'),
  sheet: document.getElementById('sheetImg'),
  dandan: document.getElementById('dandanImg'),
  od: document.getElementById('odImg'),
  angry: document.getElementById('odAngryImg'),
  diamond: loadImg('assets/diamond-small.webp'),
  ice: [loadImg('assets/ice-1.webp'), loadImg('assets/ice-2.webp'), loadImg('assets/ice-3.webp')],
  rare:{}
};
IMG.sheet.onload = tickLoad; IMG.sheet.onerror = tickLoad;
IMG.dandan.onload = tickLoad; IMG.dandan.onerror = tickLoad;
IMG.od.onload = tickLoad; IMG.od.onerror = tickLoad;
if(IMG.sheet.complete && IMG.sheet.naturalWidth > 0) tickLoad();
if(IMG.dandan.complete && IMG.dandan.naturalWidth > 0) tickLoad();
if(IMG.od.complete && IMG.od.naturalWidth > 0) tickLoad();
RARE.forEach(function(r){ IMG.rare[r.id] = loadImg(r.img); });
try { document.fonts.load('16px "ZCOOL KuaiLe"'); } catch(e){}

function loadDex(){ try{ return JSON.parse(localStorage.getItem('frogDex') || '[]'); }catch(e){ return []; } }
function saveDex(a){ try{ localStorage.setItem('frogDex', JSON.stringify(a)); }catch(e){} }
function loadVol(){
  try{
    var v = JSON.parse(localStorage.getItem('frogVol') || 'null');
    if(v){
      var b = Number(v.bgm), f = Number(v.fx);
      if(isFinite(b) && isFinite(f)){
        if(b > 1) b /= 100;
        if(f > 1) f /= 100;
        return { bgm: Math.min(1, Math.max(0, b)), fx: Math.min(1, Math.max(0, f)) };
      }
    }
  }catch(e){}
  return { bgm: 0.25, fx: 1 };
}
var VOL = loadVol();
var settingsPrevState = 'menu';

function $(id){ return document.getElementById(id); }
function show(id){ var el = $(id); if(el) el.classList.remove('hidden'); }
function hide(id){ var el = $(id); if(el) el.classList.add('hidden'); }
