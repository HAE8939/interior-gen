# prompt-draw / frontend

室内设计 AI 提示词生成器 · **前端脚手架**

基于 Next.js 16 + React 19 + Tailwind v4 + shadcn/ui，把仓库根目录 `vocabulary/` 下的 17 个 JSON 词库
渲染成一个三层折叠表单 + 实时 Prompt 预览面板。这是本项目的"地基可视化"——
**未来 LLM 润色 / 翻译 / 去重将由后端 FastAPI 负责**，前端只负责采集结构化输入 + 占位拼接预览。

---

## Quick Start

```bash
cd prompt-draw/frontend
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)，左侧表单已按 `vocabulary/index.json` 的
`form_default_selection` 预填默认值，右侧预览面板会随表单实时变化。

### 其他常用脚本

```bash
pnpm build        # 生产构建 (Turbopack)
pnpm start        # 启动生产服务器
pnpm lint         # ESLint 检查
```

---

## 项目结构

```
frontend/
├── app/
│   ├── layout.tsx              # 全局壳：Inter + Noto Sans SC + JetBrains Mono
│   ├── page.tsx                # 主页面：左 60% 表单 + 右 40% 预览
│   └── globals.css             # 暖色系 oklch 色板 + 中文字体类
├── components/
│   ├── ui/                     # shadcn/ui 组件（button/card/select/switch/…）
│   ├── form/
│   │   ├── FormShell.tsx           # 三层折叠总装
│   │   ├── Section.tsx             # 可折叠区段 + Field
│   │   ├── SingleSelectCards.tsx   # 卡片网格单选（spaces/styles）
│   │   ├── SingleSelectDropdown.tsx# 下拉单选（季节/天气/相机字段）
│   │   ├── MultiSelectChips.tsx    # Chip 多选 + min/max
│   │   ├── LightingGrid.tsx        # 光影网格（time_of_day 渐变占位图）
│   │   ├── PaletteGrid.tsx         # 配色方案色块条
│   │   ├── CameraGroup.tsx         # 摄影：body/lens/aperture/iso
│   │   ├── CompositionGroup.tsx    # 视角 + 取景
│   │   ├── NegativeGroup.tsx       # 负向词预设开关
│   │   ├── ArtistSelect.tsx        # 设计师/摄影师（按学科分组）
│   │   ├── TemplateSelect.tsx      # 14 个 Prompt 模板
│   │   └── FreeTextArea.tsx        # 中文自由输入
│   ├── preview/
│   │   ├── PromptPreview.tsx       # 三段：prompt_en / mj_suffix / negative
│   │   └── FormStateJson.tsx       # 表单状态 JSON（带语法高亮）
│   └── layout/
│       ├── Header.tsx              # 标题 + 词库版本徽章
│       └── ProModeSwitch.tsx       # 专业模式开关 + 重置
├── lib/
│   ├── types.ts                # FormState / 各 VocabItem
│   ├── vocab.ts                # 静态 import 17 个 JSON + 默认值构造器
│   ├── form-context.tsx        # Context + useReducer
│   ├── prompt-assembler.ts     # 占位符渲染（脚手架版，无 LLM）
│   └── utils.ts                # cn()
├── public/
│   └── lighting-previews/      # （预留）后续放预生成光影示例图
├── next.config.ts              # outputFileTracingRoot 指向 prompt-draw/
├── tsconfig.json               # 路径别名 @vocab/* → ../vocabulary/*
└── .env.local.example          # （预留）后端 URL 占位
```

---

## 与 `vocabulary/` 的关系

前端**零拷贝**复用根目录的词库 JSON，通过两层映射实现跨目录 import：

1. **`tsconfig.json`** 增加路径别名：
   ```json
   "paths": {
     "@/*": ["./*"],
     "@vocab/*": ["../vocabulary/*"]
   },
   "include": ["...", "../vocabulary/**/*.json"]
   ```
2. **`next.config.ts`** 把 file-tracing 与 Turbopack 的根指向上一层：
   ```ts
   const projectRoot = path.join(__dirname, "..");
   outputFileTracingRoot: projectRoot,
   turbopack: { root: projectRoot },
   ```

这样 `import stylesData from "@vocab/styles.json"` 在 dev / build 都能正常解析，且 Turbopack
不会因为引用了"项目根之外"的文件而报警。

> 想给词库添词？直接编辑 `vocabulary/*.json`，前端会在下次 dev/build 自动反映。

---

## 三层折叠表单设计

| 区段 | 默认状态 | 字段 |
| --- | --- | --- |
| **必填** | 展开 | `space` · `style` · `lighting` · `ratio` |
| **推荐** | 展开 | `season` + `weather` · `materials` · `furniture` · `colors` · `mood` |
| **专业** | 折叠（受顶部"专业模式"开关控制全部可见性） | `template` · `camera.{body,lens,aperture,iso}` · `composition.{perspective,shot}` · `artist` · `qualityModifiers` · `negativeGroups` |
| **自由输入** | 始终展开 | `freeText` |

完整字段表 ↔ 词库映射，见 `vocabulary/README.md` 第六节。

---

## Prompt 拼装（脚手架版）

`lib/prompt-assembler.ts` 实现了 `vocabulary/prompt_templates.json` 中声明的占位符语法：

| 语法 | 行为 |
| --- | --- |
| `{{key.field}}` | 字段查找 |
| `{{key.keywords_en\|join:', '}}` | 数组拼接 |
| `{{key.keywords_en\|random:n}}` | 随机抽 n 个（脚手架阶段固定取前 n 个，便于复现） |
| `[[ ... {{x}} ... ]]` | 可选块；任一内部变量缺失则整块跳过 |
| `{{#if name}} ... {{/if}}` | 条件块；用于 MJ 后缀的负向词分支 |

输出三段：`prompt_en`（主模板）+ `mj_suffix`（MJ 后缀）+ `negative_prompt`（负向词合并）。

> ⚠ **未来后端**会用 Python 重写同一组语法，并额外做：中文自由文本翻译、关键词去重、LLM 润色、模型自适应。

---

## 设计美学

- 字体：`Inter`（英文/数字） + `Noto Sans SC`（中文，挂在 `.cn` 工具类） + `JetBrains Mono`（参数）
- 主色：温暖焦糖 `oklch(0.58 0.11 65)`（呼应室内设计行业）
- 圆角：12px (`--radius: 0.75rem`)
- 暗色模式：跟随 `.dark` class（当前页面默认浅色；后续可在 Header 加 ThemeToggle）

---

## 后续衔接

| 阶段 | 替换点 |
| --- | --- |
| 后端 FastAPI 上线 | 把 `PromptPreview` 中的 `assemble()` 调用换成 `fetch(BACKEND_URL + "/assemble", { body: state })` |
| 预生成光影示例图 | 跑一遍 `vocabulary/lighting.json` 的 20 个 `preview_prompt_en` 出图存 OSS，在 `LightingGrid` 把渐变占位换成 `<img src>` |
| 用户系统 / 项目管理 | 另起一个 Next.js Route Group `(app)`，本页保留为 `(playground)` |

`.env.local.example` 中预留了 `NEXT_PUBLIC_BACKEND_URL`。

---

## 已知约束

- **Next.js 16**：本仓库使用了 16.x 的新约定（Turbopack 默认、async params/searchParams、middleware→proxy 等）。如改动配置或新增路由，请先阅读 `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`。
- **TypeScript**：JSON 静态 import 的推导很严格。如果新增字段后类型报错，调整 `lib/types.ts` 中对应 interface 的字段为 `string | readonly string[]` 等更宽松的形式即可。
