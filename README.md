# frog-miner


🐸 **奶蛙工厂（奶蛙矿工）** —— 一款类似「黄金矿工」玩法的网页小游戏。

你扮演 **蛋蛋**（od 厂长的手下），用钩子抓取场景中的 **奶蛙**，在限定时间内达到厂长设定的金额目标即可过关。

## 🎮 玩法

- **三种难度**：简单 / 中等 / 困难（中高难度下大奶蛙会抱着钻石左右跑）
- **图鉴收集**：49 种奶蛙（含 47 只稀有小奶蛙），抓到可解锁图鉴
- **冰块玩法**：冰块会随时间融化变小、变便宜，趁大快抓
- **厂长系统**：连续空钩会让厂长生气 😠

## 🕹️ 操作

| 按键 | 功能 |
| ---- | ---- |
| 空格 / 点击画面 / 手指点按 | 放钩 |
| 再按一次 | 提前收钩 |
| `P` | 暂停 |
| `M` | 静音 / 恢复 |

## 🚀 在线游玩

👉 **<https://66970010-boop.github.io/frog-miner/>**

## 🎵 音频系统

基于 Web Audio API 实现（奶蛙笑声的变调使用开源库 [Signalsmith Stretch](https://signalsmith-audio.co.uk/code/stretch/)，MIT，WASM + AudioWorklet）：

- **音量独立可调**：右上角齿轮「设置」面板提供 **背景音乐** 与 **特效音乐** 两条独立滑块（0–100%），设置自动保存到本地。
- **奶蛙笑声变调**：音调由「**体积 × 质量**」系数决定 —— 越大越重的大奶蛙声音低沉（0.8 倍），越小越轻的迷你蛙声音尖细（2.0 倍）。
- **变调不变时长**：通过 `semitones` 参数独立变调，播放时长保持不变。
- **笑声循环覆盖全程**：抓到奶蛙后循环播放，直到把它收上来才**自然播完**（不会硬切截断）。
- **特殊音效**：每一关第一只被抓到的奶蛙会额外播放一次特殊音效。

## 🧊 冰块

- 每关生成的冰簇数量约为石头数量的一半（3 个石头 → 2 簇冰，6 个石头 → 3 簇冰）。
- 每簇含 1 / 2 / 3 块冰，**大小随机**。
- 冰块会**随时间融化变小**：尺寸、价值同步下降，音调随之变尖。起始较小的冰簇会先融化消失；最大的一簇融到价值为 0 后仍保留最小可见尺寸。
- 抓取音效按冰块数量选择（冰1 / 冰2 / 冰3），只播一遍。
- 价格基准：**单块冰 = 10 个石头的价格**（大冰簇 3 块 = 30 个石头）。

## 📁 项目结构

```
frog-miner/
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
```

## 🛠️ 本地运行

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

本项目采用 [MIT License](LICENSE) 开源许可。

第三方组件：

- [Signalsmith Stretch](https://signalsmith-audio.co.uk/code/stretch/) —— MIT License，作者 Geraint Luff

## 👥 Contributors

<!-- contributors-start -->
- **[@66970010-boop](https://github.com/66970010-boop)** —— 项目作者，游戏创意、美术与核心实现
- **[@junjunya2020](https://github.com/junjunya2020)** —— 协作者，音频系统、冰块玩法与代码重构
<!-- contributors-end -->
