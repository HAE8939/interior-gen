# Interior Gen — AI 室内设计生图提示词生成器

一个面向室内设计师和爱好者的 AI 生图提示词工具，通过结构化表单快速生成高质量英文 Prompt，并直接调用图像生成 API 出图。

![预览](https://img.shields.io/badge/框架-Next.js_15-black) ![语言](https://img.shields.io/badge/语言-TypeScript-blue) ![样式](https://img.shields.io/badge/样式-Tailwind_CSS_v4-38bdf8)

---

## 功能特性

- **结构化表单**：涵盖风格、空间、材质、光影、季节天气、相机参数、构图、配色、氛围、家具、艺术家参考等 14 个维度
- **三层折叠设计**：必填 / 推荐 / 专业三级，新手友好，专业用户可精细控制
- **实时 Prompt 预览**：表单改动即时反映到英文 Prompt，可自由编辑后再生图
- **LLM 润色**：接入任意兼容 OpenAI 的 LLM，一键将中文自由输入翻译并优化为专业英文提示词
- **生图**：基于拼装好的 Prompt 调用图像生成 API，支持多种 OpenAI 兼容模型（GPT-image、Flux 等）
- **改图**：上传 1-4 张参考图 + 修改指令，支持高保真 / 自由发挥两种保留程度
- **运行日志面板**：集中展示所有 API 调用结果，出错时自动展开，一键复制
- **API 配置文件化**：密钥保存于本地 `api-config.json`，已加入 `.gitignore`，不会提交到代码仓库

---

## 目录结构

```
interior-gen/
├── api-config.example.json   # API 配置模板（提交到 git，字段为空）
├── api-config.json           # 实际密钥文件（.gitignore 忽略，不提交）
├── vocabulary/               # 结构化词库（14 个 JSON 文件，约 400+ 词条）
│   ├── index.json            # 词库总索引 + 表单默认值
│   ├── styles.json           # 设计风格
│   ├── spaces.json           # 空间类型
│   ├── lighting.json         # 光影模板（核心模块）
│   ├── prompt_templates.json # 14 个生图模板
│   └── ...                   # 其余词库文件
└── frontend/                 # Next.js 前端
    ├── app/
    │   ├── api/config/       # 读写 api-config.json 的代理路由
    │   ├── api/image/        # 生图 / 改图 / 下载 代理路由（解决 CORS）
    │   └── api/llm/          # LLM 润色代理路由
    ├── components/
    │   ├── form/             # 表单组件
    │   ├── preview/          # 预览面板（Prompt / 图片工作台 / 日志）
    │   └── layout/           # 顶栏 API 配置
    └── lib/
        ├── vocab.ts          # 词库类型化加载
        ├── form-context.tsx  # 表单全局状态
        ├── settings-context.tsx # API 配置状态
        ├── error-log-context.tsx # 运行日志状态
        ├── prompt-assembler.ts  # 占位符替换引擎
        └── image-api.ts      # API 调用封装
```

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/HAE8939/interior-gen.git
cd interior-gen
```

### 2. 配置 API 密钥

```bash
cp api-config.example.json api-config.json
```

打开 `api-config.json`，填入你的 API 信息：

```json
{
  "llm": {
    "apiKey": "sk-...",
    "baseUrl": "https://api.example.com",
    "model": "deepseek-chat"
  },
  "imageGen": {
    "apiKey": "sk-...",
    "baseUrl": "https://api.example.com",
    "model": "gpt-image-2"
  }
}
```

也可以在启动应用后，通过顶部「API 配置」栏填写并保存，效果相同。

### 3. 安装依赖并启动

```bash
cd frontend
pnpm install
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

> **需要 Node.js ≥ 18** 和 **pnpm**（`npm install -g pnpm`）

---

## API 兼容性

本项目使用 **OpenAI 兼容接口**，可接入任何兼容该格式的服务：

| 用途 | 推荐模型示例 |
|---|---|
| LLM 润色 / 翻译 | DeepSeek-V3、GPT-4o、Qwen-Plus 等 |
| 文生图 | GPT-image-2、Flux、Seedream 等 |
| 改图 | GPT-image-2（支持 `images/edits` 接口） |

只要提供兼容 OpenAI 的 `baseUrl` + `apiKey` 即可，无需修改代码。

---

## 词库说明

`vocabulary/` 目录包含 14 类结构化词条：

| 文件 | 内容 | 词条数 |
|---|---|---|
| `styles.json` | 设计风格（Japandi / 极简 / 侘寂 等） | 20 |
| `spaces.json` | 空间类型（客厅 / 卧室 / 餐厅 等） | 20 |
| `lighting.json` | 光影模板（黄金时刻 / 漫射光 等） | 20 |
| `materials.json` | 材质（白橡木 / 石材 / 亚麻 等） | 30 |
| `colors.json` | 配色方案 + 单色 | 30 |
| `furniture.json` | 家具单品 | 30 |
| `prompt_templates.json` | 生图模板（14 个） | 14 |
| `artists.json` | 设计师参考（建筑 / 室内 / 摄影师） | 30 |
| `moods.json` | 氛围词 | 20 |
| `camera.json` | 相机 / 镜头 / 光圈 / ISO | 40 |
| `composition.json` | 构图（视角 / 景别 / 画幅比例） | 20 |
| `seasons_weather.json` | 季节 + 天气 | 16 |
| `quality_modifiers.json` | 画质修饰词 | 20 |
| `negative_prompts.json` | 负向词预设 | 6 组 |

---

## 开发说明

### 技术栈

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **React 19** Context + useReducer

### 添加词条

直接编辑 `vocabulary/` 下对应的 JSON 文件，前端会在下次构建时自动读取（词库为 build-time 静态 import）。

### 新增模板

在 `vocabulary/prompt_templates.json` 中添加新对象，遵循已有的模板结构，`id` 字段唯一即可。

---

## License

MIT
