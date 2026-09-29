# frog-miner-plus

🐸 **奶蛙工厂（奶蛙矿工）** —— 基于 [66970010-boop/frog-miner](https://github.com/66970010-boop/frog-miner) 的增强版。

> 本项目基于原作者 [@66970010-boop](https://github.com/66970010-boop) 的 [frog-miner](https://github.com/66970010-boop/frog-miner) 开发，
> 在原作基础上进行了代码重构与功能扩展。原始游戏的创意、美术与核心玩法均来自原作者，在此致谢！
>
> 原作者 [@66970010-boop](https://github.com/66970010-boop) 是本项目的主要贡献者。

## 🎮 游戏简介

一款类似「黄金矿工」玩法的网页小游戏：你扮演 **蛋蛋**（od 厂长的手下），用钩子抓取场景中的 **奶蛙**，在限定时间内达到厂长设定的金额目标即可过关。

- **三种难度**：简单 / 中等 / 困难（中高难度下大奶蛙会抱着钻石左右跑）
- **图鉴收集**：49 种奶蛙（含 47 只稀有小奶蛙），抓到可解锁图鉴
- **冰块玩法**：会随时间融化变小、变便宜，趁大快抓
- **厂长系统**：连续空钩会让厂长生气 😠

## 🕹️ 操作方式

| 按键 | 功能 |
| ---- | ---- |
| 空格 / 点击画面 / 手指点按 | 放钩 |
| 再按一次 | 提前收钩 |
| `P` | 暂停 |
| `M` | 静音 / 恢复 |

## ✨ 相对原版的改动

### 音频系统全面重写（Web Audio API）

原版基于 `<audio>` 标签，音量只能整体开关。本版重构为 Web Audio API：

- **音量独立可调**：右上角齿轮「设置」面板提供 **背景音乐** 与 **特效音乐** 两条独立滑块（0–100%），设置自动保存到本地。
- **奶蛙笑声变调**：音调由「**体积 × 质量**」系数决定 —— 越大越重的大奶蛙声音低沉（0.8 倍），越小越轻的迷你蛙声音尖细（2.0 倍）。
- **真正的变调不变时长**：引入开源库 [Signalsmith Stretch](https://signalsmith-audio.co.uk/code/stretch/)（MIT，WASM + AudioWorklet），通过 `semitones` 参数独立变调，**不改变播放时长**。
- **笑声循环覆盖全程**：抓到奶蛙后循环播放，直到把它收上来才**自然播完**（不会硬切截断，短促的小蛙也能听完整遍）。
- **特殊音效**：每一关第一只被抓到的奶蛙会额外播放一次特殊音效（每关必有一次、仅一次）。

### 新增「冰块」物件

- 每关生成的冰簇数量约为石头数量的一半（3 个石头 → 2 簇冰，6 个石头 → 3 簇冰）。
- 每簇含 1 / 2 / 3 块冰，**大小随机**。
- 冰块会**随时间融化变小**：尺寸、价值同步下降，音调随之变尖。起始较小的冰簇会先融化消失；最大的一簇融到价值为 0 后仍保留最小可见尺寸。
- 抓取音效按冰块数量选择（冰1 / 冰2 / 冰3），只播一遍。
- 价格基准：**单块冰 = 10 个石头的价格**（大冰簇 3 块 = 30 个石头）。

### 其他

- **石头有分数了**：每块石头随机 1–10 分（原版为 0 分）。
- **清除数据**：设置面板内可一键清空所有关卡进度、图鉴收集与音量设置（带二次确认）。
- **代码结构重构**：原本 1600 余行的单文件 `index.html` 拆分为 HTML 外壳 + 独立 CSS + 5 个 JS 模块，便于维护。

## 📁 项目结构

```
frog-miner-plus/
├── index.html              # HTML 外壳（结构 + 资源引用）
├── css/
│   └── style.css           # 全部样式
├── js/
│   ├── data.js             # 常量、资源加载、存档、DOM 工具
│   ├── audio.js            # 音频引擎（Web Audio + Signalsmith Stretch）
│   ├── game.js             # 游戏状态、关卡生成、抓取与流程
│   ├── render.js           # 全部 Canvas 绘制
│   ├── ui.js               # 事件绑定、图鉴、主循环
│   └── vendor/
│       └── SignalsmithStretch.js   # 变调库（MIT，WASM 内嵌）
└── assets/                 # 图片与音频素材
    ├── ice-*.webp / .mp3           # 冰块
    ├── laugh-*.mp3                 # 奶蛙笑声（随机播放）
    └── special/andy-1.mp3          # 每关一次的特殊音效
```

## 🚀 运行方式

纯静态页面，无需构建。任选一种：

```bash
# 方式一：Python 自带
python -m http.server 8000

# 方式二：Node
npx serve
```

然后浏览器打开 <http://localhost:8000> 即可。

> 由于使用了 AudioWorklet，建议通过 HTTP 服务访问而非直接双击 `index.html`（`file://` 协议下部分浏览器会限制音频功能）。

## 📄 许可证

本项目基于 [frog-miner](https://github.com/66970010-boop/frog-miner)（原作者 [@66970010-boop](https://github.com/66970010-boop)）修改而来，采用 [MIT License](LICENSE) 开源许可。

第三方组件：

- [Signalsmith Stretch](https://signalsmith-audio.co.uk/code/stretch/) —— MIT License，作者 Geraint Luff

## 🙏 致谢

- **原作者**：[@66970010-boop](https://github.com/66970010-boop) —— 原始项目 [frog-miner](https://github.com/66970010-boop/frog-miner) 的创作者与核心贡献者
- **协作者**：[@junjunya2020](https://github.com/junjunya2020) —— 参与本增强版的开发与维护
