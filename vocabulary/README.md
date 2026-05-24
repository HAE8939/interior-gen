# 室内设计 AI 提示词词库 · README

> Interior Design AI Prompt Vocabulary · v1.0.0
> 构建日期：2026-05-24

---

## 一、这是什么

为「室内设计行业 AI 生图工具」项目（前端 Next.js + 后端 FastAPI）打造的**结构化词库地基**。

由 14 个 JSON 文件组成，覆盖室内设计 AI 生图所需的全部维度：

```
vocabulary/
├── _schema.md                  # Schema 规范文档（先读这个）
├── index.json                  # 词库总索引（程序入口）
├── README.md                   # 你正在看的这份
├── styles.json                 # 41 种设计风格
├── spaces.json                 # 32 种空间类型
├── materials.json              # 49 种材质
├── lighting.json               # 20 种光影模板（含视频中 6 个原模板）
├── seasons_weather.json        # 4 季节 + 11 天气
├── camera.json                 # 28 项摄影参数（机身/镜头/光圈/ISO/格式）
├── composition.json            # 22 项构图视角与画幅
├── colors.json                 # 46 单色 + 12 配色方案
├── moods.json                  # 21 氛围词
├── furniture.json              # 59 件家具/装饰
├── artists.json                # 23 位建筑师/设计师/摄影师
├── quality_modifiers.json      # 19 项画质修饰词
├── negative_prompts.json       # 6 组负向词预设
└── prompt_templates.json       # 14 个完整 Prompt 模板（含视频原模板复刻）
```

总计约 **407 个词条**。

---

## 二、设计原则（地基为什么这样打）

1. **同一份数据，三方共享**
   - 前端表单渲染（标签选择 UI）
   - 后端 Prompt 拼接器
   - LLM 润色器（DeepSeek / Qwen）
   都从同一份 JSON 读取，避免词库分裂。

2. **中英双语，但 Prompt 主体英文**
   - `name_zh` 用户在表单中看到
   - `name_en` / `keywords_en` 拼进英文 Prompt（图像模型对英文识别更稳）

3. **id 是稳定主键**
   - 所有词条用 kebab-case 英文 `id`，前端表单 state、数据库主键、Prompt 拼接索引都用它
   - 添加新词条只追加新 `id`，永不修改已有 `id`

4. **行业专业 ≠ 凭空想象**
   - 风格分类参考 Architectural Digest / Kinfolk / Dezeen 行业划分
   - 摄影参数严格按真实器材（Hasselblad X2D / Sony A7R V / Canon EOS R5）
   - 设计师名录覆盖建筑/室内/摄影三大学科代表人物

5. **可扩展但有 schema 约束**
   - 见 `_schema.md`，所有词条遵循基础字段规范
   - 各类型可有特殊字段，但基础字段不变

---

## 三、Schema 速览

所有词条共有的基础字段：

| 字段 | 类型 | 必填 | 用途 |
|---|---|---|---|
| `id` | string (kebab-case) | ✅ | 主键 |
| `name_zh` | string | ✅ | 中文显示名 |
| `name_en` | string | ✅ | 英文标准名 |
| `keywords_en` | string[] | ✅ | Prompt 关键词扩展 |
| `description_zh` | string | ⛔ | 中文说明（tooltip） |
| `tags` | string[] | ⛔ | 标签筛选 |
| `weight` | number | ⛔ | Prompt 权重 (0.5-2.0) |

详细类型特殊字段见 `_schema.md`。

---

## 四、典型 Prompt 拼接流程

### 4.1 表单状态示例

用户在前端表单选完后产生这样一个 `form_state` 对象：

```typescript
const formState = {
  template: 'master-universal',          // → prompt_templates.json
  space: 'modern-villa-wood',            // → spaces.json
  style: 'japandi',                      // → styles.json
  materials: ['oak-wood', 'lime-wash-wall', 'raw-linen'],  // → materials.json
  colors: ['japandi-palette'],           // → colors.json
  furniture: ['sectional-sofa', 'coffee-table', 'pendant-light'],  // → furniture.json
  lighting: 'comfortable-sunlight',      // → lighting.json (视频原模板)
  season: 'spring',                      // → seasons_weather.json
  weather: 'sunny',
  composition: {
    perspective: 'two-point-perspective',
    shot: 'wide-shot'
  },
  ratio: '16-9',
  camera: {
    body: 'hasselblad-x2d',
    lens: 'wide-angle-24mm',
    aperture: 'f-2-8',
    iso: 'iso-200'
  },
  mood: ['cozy', 'serene'],
  artist: 'vincent-van-duysen',          // optional
  qualityModifiers: ['photorealistic', '8k-uhd', 'highly-detailed', 'cinematic'],
  negativeGroups: ['global', 'realism'],
  freeText: '带阅读角，业主有一只橘猫'   // 中文自由输入
};
```

### 4.2 后端拼接器伪代码

```python
# 1. 加载所有 vocab
vocab = load_vocabulary('./vocabulary/')

# 2. 按 id 取出 keywords_en
keywords = {
    'space': vocab['spaces'].find('modern-villa-wood').name_en,
    'style': vocab['styles'].find('japandi').keywords_en,
    'materials': flatten([vocab['materials'].find(id).keywords_en for id in form.materials]),
    # ...同理
}

# 3. 选模板
template = vocab['prompt_templates'].find(form.template)

# 4. 替换占位符
raw_prompt = template.render(keywords)

# 5. 调 LLM 润色 + 翻译 freetext
final_prompt_en, final_prompt_zh = llm.polish(
    raw_prompt=raw_prompt,
    freetext_zh=form.freeText,
    model='deepseek-chat'
)

# 6. 处理负向词
negative_keywords = []
for group_id in form.negativeGroups:
    negative_keywords += vocab['negative_prompts'].presets[group_id].keywords_en

# 7. 处理 MJ suffix
if target_model == 'midjourney':
    suffix = f' --ar {ratio.mj_param} --style raw --v 6.1 --no {", ".join(negative_keywords[:5])}'
    final_prompt_en += suffix

return {
    'prompt_en': final_prompt_en,
    'prompt_zh': final_prompt_zh,
    'negative_prompt': ', '.join(negative_keywords),  # 给 SD/Flux 单独字段用
    'model_params': { ... }
}
```

### 4.3 LLM 润色提示词建议

```
你是室内设计 AI 生图 Prompt 工程师。任务：把以下结构化原料拼成一条英文 Prompt。

【原料】
- 模板：{{template.template_en}}
- 用户自由文本（中文，需翻译为英文并融入）：{{freetext_zh}}

【规则】
1. 严格按模板词序：subject → style → furniture → materials → colors → lighting → camera → composition → mood → artist → quality
2. 总词数控制在 60-120 words
3. 删除重复语义的修饰词
4. 翻译 freetext 时融入合适位置，不要堆在结尾
5. 输出两段：英文 Prompt（主）+ 中文版（注释用）

【输出格式】
英文 Prompt：
[...]

中文版：
[...]
```

---

## 五、视频原模板复刻（用于回归测试）

`prompt_templates.json` 中 `id: video-template-bohyun-v4` 是「北玄室内外设计 AI 生图提示词生成器 v4.0」视频中演示的"现代林间木质别墅"生成原模板。

用途：
- 验证拼接器输出与北玄 v4.0 演示结果一致
- 作为产品对标基准
- 给销售/演示团队的标准 demo

包含 6 个视频原始光影模板（在 `lighting.json` 中 `tags: ["video-template"]`）：
1. `comfortable-sunlight` 舒适阳光
2. `soft-natural-light` 柔和自然光
3. `afternoon-warm-sun` 午后暖阳
4. `night-interior` 夜景灯光
5. `dusk-blue-hour` 黄昏氛围
6. `custom-lighting` 自定义

每个都带 `preview_prompt_en` 字段，可预生成 6-12 张参考图供用户在网格 UI 中点选。

---

## 六、前端 UI 建议

### 6.1 表单分区（按重要性折叠）

```
┌─────────────────────────────────────────┐
│ 【必填 · 一眼可见】                       │
│  · 空间类型 (spaces)        [下拉/卡片]  │
│  · 设计风格 (styles)        [卡片网格]   │
│  · 光影氛围 (lighting)      [图片网格⭐]  │
│  · 画幅比例 (composition.ratios) [图标]  │
├─────────────────────────────────────────┤
│ 【推荐 · 默认折叠展开】                   │
│  · 季节 + 天气                           │
│  · 主要材质 (multi 2-5)                  │
│  · 主要家具 (multi 3-6)                  │
│  · 配色方案 (palette 卡片)               │
│  · 氛围词 (multi 1-3)                    │
├─────────────────────────────────────────┤
│ 【专业模式 · 默认折叠】                   │
│  · 摄影参数 (机身/镜头/光圈/ISO)          │
│  · 构图视角                              │
│  · 设计师参考                             │
│  · 画质修饰词                             │
│  · 负向词预设                             │
├─────────────────────────────────────────┤
│ 【自由输入】                              │
│  · 自由文本 (Textarea)                   │
│    "可补充任何需求，AI 会翻译并融入"      │
└─────────────────────────────────────────┘
```

### 6.2 光影模板"网格预览"是产品差异点

视频中北玄 v4.0 用图片网格让用户直观选光影，体验远好于"下拉选项"。

实现路径：
1. 用 `lighting.json` 中的 `preview_prompt_en` 字段在 Flux 上预生成 6-12 张参考图（一次成本）
2. 存到 OSS / CDN
3. 前端用 6 列网格展示，hover 显示中文名+描述
4. 用户点击即选中并写入 form_state

---

## 七、模型特定输出注意

| 模型 | 负向词 | 比例参数 | 备注 |
|---|---|---|---|
| **Midjourney** | `--no people, clutter` 拼在 Prompt 末尾 | `--ar 16:9` | 配合 `--style raw --v 6.1` |
| **Flux (Replicate)** | 单独字段 `negative_prompt` | API 参数 `aspect_ratio` | 长 Prompt 友好 |
| **Stable Diffusion** | 单独字段 | API 参数 `width/height` | 建议 75 tokens 内或 BREAK 分段 |
| **通义万相** | 单独字段 | API 参数 `size` | 中文 Prompt 也支持 |
| **即梦** | 单独字段 | API 参数 `width/height` | 中英混合 OK |

---

## 八、扩展指南

### 8.1 新增一个设计风格

1. 在 `styles.json` 的 `items` 数组末尾追加：
```json
{
  "id": "my-new-style",
  "name_zh": "我的新风格",
  "name_en": "My New Style",
  "keywords_en": ["keyword1", "keyword2 modifier"],
  "era": "contemporary",
  "region": "global",
  "key_features": ["特征1", "特征2"],
  "signature_colors": ["existing-color-id-1"],
  "signature_materials": ["existing-material-id-1"],
  "compatible_styles": ["japandi", "modern-minimalist"]
}
```

2. 更新 `index.json` 中 `styles.item_count` +1
3. 给前端/后端添加单测，确认 id 能正确取出 keywords_en

### 8.2 新增一个 Prompt 模板

1. 在 `prompt_templates.json` 的 `templates` 数组中追加
2. 必须包含：`id`, `name_zh`, `name_en`, `description_zh`, `target_models`, `structure_zh`, `template_en`, `template_midjourney_suffix`, `example_output_en`
3. 用 `{{key.field}}` 占位符引用其他词库
4. 更新 `index.json` 中 `prompt_templates.item_count`

### 8.3 新增一个 AI 模型支持

1. 在 `prompt_templates.json` 的 `model_specific_notes` 字典中新增条目
2. 在每个模板的 `target_models` 中添加该模型 id
3. 在后端拼接器中添加该模型的 suffix/参数处理逻辑

---

## 九、数据来源致谢

| 来源 | 用途 |
|---|---|
| `gemini-code-1779533478404.json` | 北玄 v4.0 视频结构化分析（视频原模板、6 光影、相机参数列表） |
| GitHub: `Dalabad/stable-diffusion-prompt-templates` | Archviz 室内 Prompt 范式、"James McDonald and Joarc Architects"等关键词 |
| GitHub: `hashmil/stablediffusion-midjourney-prompts` | 词序规则：style → composition → medium → camera → subject → environment → lighting → atmosphere → mood |
| GitHub: `awesome-gpt-image-2`（室内设计章节） | 通用 Prompt 范本 |
| GitHub: `HabtamuFeyera/AI-Interior-Design-Generator` | 项目结构参考 |
| 行业知识 | 风格分类、材质术语、设计师名录、专业相机规格 |

研究原文存于 `../.research/` 目录（如保留）。

---

## 十、版本与变更

- **v1.0.0** (2026-05-24) — 首版地基。14 个 JSON 文件，约 407 词条，覆盖北玄 v4.0 全部模块 + 行业扩展。

后续版本应在本文件末尾追加变更日志。
