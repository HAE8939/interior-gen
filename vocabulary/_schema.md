# 室内设计 AI 提示词词库 · Schema 规范

所有词条遵循统一基础字段，便于前端表单渲染和 Prompt 拼接器复用。

## 基础字段（所有词条共有）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string (kebab-case) | ✅ | 全局唯一英文标识符，用于数据库主键和前端 key |
| `name_zh` | string | ✅ | 中文显示名（用户在表单中看到） |
| `name_en` | string | ✅ | 英文标准名（作为 Prompt 主词） |
| `keywords_en` | string[] | ✅ | Prompt 关键词扩展数组（拼接时随机/全量使用） |
| `description_zh` | string | ⛔ | 中文描述，用于 UI tooltip 或说明 |
| `tags` | string[] | ⛔ | 标签，用于筛选/搜索 |
| `weight` | number | ⛔ | 权重 (0.5-2.0)，Prompt 中可用括号或 `:1.3` 标记 |

## 各文件类型特殊字段

### styles.json (设计风格)
- `era`: 年代标识（traditional / modern / contemporary / trendy）
- `region`: 地域（asian / european / american / global）
- `key_features`: string[] 中文核心特征短语
- `signature_colors`: string[] 标志性配色 id（引用 colors.json）
- `signature_materials`: string[] 标志性材质 id（引用 materials.json）
- `compatible_styles`: string[] 可融合的风格 id（用于"混搭"推荐）

### spaces.json (空间类型)
- `category`: residential / commercial / outdoor
- `typical_furniture`: string[] 典型家具 id（引用 furniture.json）
- `default_ratio`: 推荐画幅比例 id

### materials.json (材质)
- `category`: wood / stone / metal / fabric / glass / synthetic / ceramic / plant
- `feel`: warm / cold / luxe / raw / soft / hard / matte / glossy（多选）

### lighting.json (光影模板)
- `time_of_day`: morning / noon / afternoon / dusk / night / any
- `mood`: bright / warm / cool / dramatic / soft / cozy
- `preview_prompt_en`: 用于生成预览图的完整 Prompt
- `pairs_well_with`: string[] 推荐搭配的风格/季节

### camera.json (摄影参数)
- `type`: body / lens / aperture / iso / format / shutter
- 各类型有不同字段（见文件内 schema）

### composition.json (构图/视角)
- `category`: perspective / framing / shot_type

### furniture.json (家具/装饰)
- `category`: seating / table / storage / bed / lighting_fixture / decor / textile / plant

### artists.json (设计师/建筑师参考)
- `discipline`: architect / interior_designer / photographer
- `era`: 活跃年代
- `style_keywords`: 风格标签

### colors.json (色彩方案)
- `palette`: string[] HEX 数组（3-6 色）
- `mood`: 配色情绪标签

### moods.json (氛围词)
- `category`: emotion / atmosphere / texture

### quality_modifiers.json (画质修饰词)
- `priority`: 'high' | 'medium' | 'low' （高优先级=必加）

### negative_prompts.json (负向词)
- `scope`: 'global' | 'realism' | 'architecture' | 'common_issues'

### prompt_templates.json (完整模板)
- 包含 `{{placeholders}}` 的完整 Prompt 字符串
- 标注每个占位符引用哪个词库

## 命名约定

- 所有 `id` 使用 kebab-case 英文，例如 `japandi`, `mid-century-modern`, `golden-hour`
- 所有数组字段为空时使用 `[]` 而非 `null`
- 颜色用 HEX 大写（#RRGGBB）

## 使用示例（Prompt 拼接逻辑伪代码）

```typescript
// 用户表单选项
const form = {
  space: 'living-room',
  style: 'japandi',
  lighting: 'soft-natural-light',
  materials: ['oak-wood', 'lime-wash-wall', 'linen'],
  camera: { body: 'sony-a7r5', lens: 'wide-angle-24mm', aperture: 'f-2-8' },
  composition: 'two-point-perspective',
  ratio: '16-9',
  freeText: '带阅读角，业主有一只橘猫'
};

// 通过 LLM (DeepSeek) 拼接：
// 1. 从各 JSON 取出对应词条的 keywords_en
// 2. 按 templates.json 中的模板填充
// 3. LLM 润色 + 翻译用户自由文本
// 4. 输出英文 Prompt + 中文版 + 负向词
```
