/**
 * dsh-paper-mode — Host half of the "论文模式" (paper mode) bundle.
 *
 * While this bundle row is enabled, the plugin:
 *   1. injects one ordered system-prompt section (`paper:mode`) that switches the
 *      agent into academic paper-writing mode for every model step;
 *   2. registers the `paper-writing` runtime skill, which carries the distilled
 *      five-stage method, the three structure formulas, the GB/T formatting
 *      rules and the self-check lists, loaded on demand through the `skill` tool;
 *   3. registers the `/paper` human command (`status`, `template`, `checklist`,
 *      `guide`, `help`) so the user can inspect and pull the bundled assets.
 *
 * Disabling the bundle row disposes all three registrations, returning the
 * session to the default behaviour. No network access, no account access and no
 * writes outside this package happen at any point.
 *
 * The package has no runtime dependencies: it imports Node built-ins only, so a
 * locally linked checkout needs no install step.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Stable cordis plugin name. */
export const name = 'dsh-paper-mode'

/** Services that must exist before the registrations below are attempted. */
export const inject = ['systemPrompt', 'skills', 'commands']

const PACKAGE_JSON_URL = new URL('./package.json', import.meta.url)
const SKILL_URL = new URL('./skills/paper-writing/SKILL.md', import.meta.url)
const TEMPLATE_URL = new URL('./resources/paper-template.md', import.meta.url)
const RESOURCES_DIR = fileURLToPath(new URL('./resources', import.meta.url))

/** The system-prompt section name; unique across the profile. */
const SECTION_NAME = 'paper:mode'

/**
 * Placement of the paper-mode policy section. It sits just after the centrally
 * owned `PLAN_POLICY` (500) and before `TEAM_POLICY` (600): a collaboration-mode
 * policy that has to precede tool declarations.
 */
const SECTION_ORDER = 550

/** Model-facing mode contract, injected into every step while the plugin is on. */
const SECTION_TEXT = `## 论文模式（已启用）
你当前处于「论文模式」，是严谨的学术写作助手。凡涉及论文、课程论文、学位论文、期刊论文、开题报告、文献综述、摘要、参考文献等任务，一律按下列契约工作；普通闲聊与无关任务不受影响。

**方法：五阶段法（不得跳步，阶段之间尽量留间隔）**
1. 解析问题：拆解题目的关键词与概念关系，明确"题目到底在问什么"；先产出 1 句研究问题 + 核心概念清单。
2. 查找资料：按相关性筛选证据，区分作者的主张 / 证据 / 推理；只采用可核查的真实来源。
3. 文章规划：先给分层提纲（到二级标题），删除与题目无关的材料；提纲未定不写正文。
4. 写作：引言、主体、结论分开推进；主体段落一律"主题句 → 展开论述 → 论据"。
5. 修改：按 结构 → 风格 → 细节与数据 → 格式规范 四轮收窄。

**结构公式**
- 引言 = 解析问题（2—3 句）+ 结构透明（全文脉络图）。
- 段落 = 主题句（含过渡词）+ 展开（描述 → 分析 → 批评 → 论据 → 评价）+ 论据。
- 结论 = 回答研究问题 + 要点收束 + 局限/展望；不引入新论据。

**标准结构**：题名（≤20 字）→ 作者/单位 → 摘要（目的·方法·结果·结论，中文 250—350 字，不分段、不引文、不用图表）→ 关键词（3—8 个，分号分隔）→ 引言 → 方法（可复现：对象、数据、变量、步骤）→ 结果（只陈述、图表优先、报告统计量）→ 讨论（对话文献、机制、局限）→ 结论 → 参考文献 → 致谢 → 附录。

**格式硬约束（GB/T）**
- 版面：A4；页边距上/下 2.5 cm、左 3.0 cm、右 2.5 cm；正文宋体小四（12 pt）、西文 Times New Roman 12 pt；1.5 倍行距；首行缩进 2 字符；两端对齐。
- 标题：一级黑体三号（16 pt）加粗，二级黑体四号（14 pt），三级黑体小四（12 pt）；编号 1 / 1.1 / 1.1.1 /（1），连续不跳号，标题末不加标点。
- 图表：三线表、无竖线；表题在表上方"表 1　×××"，图题在图下方"图 1　×××"；正文先引用后出现，编号连续。
- 公式：居中，编号右对齐"（1）"；变量斜体，数字、单位、运算符正体。
- 数字与标点：GB/T 15835—2011（统计数据用阿拉伯数字、概数与成语用汉字）、GB/T 15834—2011（中文全角标点、顿号用于并列、浪纹线"～"表示范围）。
- 引文与参考文献：GB/T 7714—2015 顺序编码制；正文方括号上标 [1]，文后按引用顺序排列，只列正文引用过的文献；专著 [M]、期刊 [J]、学位论文 [D]、论文集 [C]//、电子资源 [EB/OL]、标准 [S]；严禁伪引（列而未引）与漏引（引而未列）。

**工作方式**
- 动笔前先确认：题目/学科、用途（课程/学位/期刊）、字数、引用格式、交付格式（Markdown 或 .docx）。
- 分阶段交付并自检；引用文献必须是可核查的真实来源，无法确认时标注"待核实"，不得编造作者、年份、页码或 DOI。
- 除用户另有要求外，正文用 Markdown 输出，标题层级与上述编号一致；需要 Word 文档时用办公文档工具生成 .docx 并保留样式。
- 学术诚信：直接引用加引号并注明页码，转述注明出处；不得伪引/漏引；使用生成式 AI 辅助写作时按所在单位要求声明使用范围，并对其输出的事实与引用负责。
- 需要完整方法细节、模板与自检清单时，加载 \`paper-writing\` skill；\`/paper template\` 取出空白模板，\`/paper checklist\` 取出格式自检清单。`

/** Read one packaged asset as UTF-8 text; a missing asset fails activation loudly. */
function readAsset(url, label) {
  try {
    return readFileSync(url, 'utf8')
  } catch (error) {
    throw new Error(`dsh-paper-mode: bundled ${label} is unreadable (${String(error)})`)
  }
}

/** Resolve the package version for status output. */
function readVersion() {
  try {
    return String(JSON.parse(readFileSync(PACKAGE_JSON_URL, 'utf8')).version ?? '0.0.0')
  } catch {
    return '0.0.0'
  }
}

/** Compact usage text shared by `/paper` help and error results. */
const COMMAND_USAGE = [
  '/paper           显示论文模式状态与用法',
  '/paper status    显示模式、技能与资源状态',
  '/paper template  输出学术论文格式空白模板',
  '/paper checklist 输出论文格式自检清单',
].join('\n')

/** Format the self-check list as plain chat text. */
const CHECKLIST_TEXT = `论文格式自检清单
1. 页面：A4；页边距上/下 2.5 cm、左 3.0 cm、右 2.5 cm；1.5 倍行距；首行缩进 2 字符。
2. 标题层级：编号连续（1 / 1.1 / 1.1.1 /（1）），不超过四级，字体字号统一（黑体三号 / 四号 / 小四）。
3. 摘要：目的·方法·结果·结论四要素齐全，中文 250—350 字，不分段、不引文；英文摘要逐句对应。
4. 关键词：3—8 个，分号分隔，末尾不加标点。
5. 图表：三线表无竖线；表题在表上方、图题在图下方；正文先引用后出现；编号连续；数据来源与显著性注在表下。
6. 公式：居中，编号右对齐"（1）"；变量斜体，数字、单位、运算符正体；全文连续编号。
7. 参考文献：只列正文引用过的文献；与正文 [1] 顺序一一对应；GB/T 7714—2015 著录格式统一。
8. 文字：术语全文统一；无错别字；中文标点全角；数值范围用"～"；缩略语首次出现给全称。
9. 诚信：直接引用加引号并注明页码；转述注明出处；使用生成式 AI 辅助时按单位要求声明范围。`

/** Build the `/paper` command definition over the packaged assets. */
function createPaperCommand(ctx) {
  const version = readVersion()
  let template = ''
  const loadTemplate = () => {
    if (template === '') template = readAsset(TEMPLATE_URL, 'paper template')
    return template
  }
  const status = () => {
    const lines = [
      '论文模式：已启用',
      `插件：dsh-paper-mode v${version}`,
      `系统提示段：${SECTION_NAME}（order ${SECTION_ORDER}）`,
      '已注册技能：paper-writing（可通过 skill 工具按需加载）',
      `资源目录：${RESOURCES_DIR}`,
      '退出方式：在插件管理中停用「论文模式」插件，停用后提示段、技能与命令立即失效。',
    ]
    return lines.join('\n')
  }
  return {
    name: 'paper',
    description: '论文模式状态、模板与格式自检清单',
    input: { hint: '[status|template|checklist]' },
    handler: ({ rawInput }) => {
      const action = rawInput.trim().toLowerCase()
      if (action === '' || action === 'help' || action === 'status') {
        return { kind: 'success', text: `${status()}\n\n用法：\n${COMMAND_USAGE}` }
      }
      if (action === 'template') {
        return { kind: 'success', text: loadTemplate() }
      }
      if (action === 'checklist') {
        return { kind: 'success', text: CHECKLIST_TEXT }
      }
      ctx.logger?.debug?.(`dsh-paper-mode: unknown /paper argument ${JSON.stringify(rawInput)}`)
      return { kind: 'error', text: `未知的 /paper 参数。\n\n用法：\n${COMMAND_USAGE}` }
    },
  }
}

/**
 * Register the paper-mode prompt section, runtime skill and `/paper` command.
 *
 * @param ctx The plugin context.
 */
export function apply(ctx) {
  const version = readVersion()
  const skillContent = readAsset(SKILL_URL, 'paper-writing skill')
  const skillPath = fileURLToPath(SKILL_URL)

  ctx.effect(() => {
    const disposers = [
      ctx.systemPrompt.section({
        name: SECTION_NAME,
        order: SECTION_ORDER,
        text: SECTION_TEXT,
      }),
      ctx.skills.register({
        name: 'paper-writing',
        description: '学术论文写作方法与 GB/T 规范：五阶段法、引言/段落/结论三公式、标准结构、版式、图表、引文与参考文献著录、学术诚信与自检清单。',
        whenToUse: '用户要求撰写、修改、检查论文（含课程论文、学位论文、期刊论文、开题报告、文献综述、摘要、参考文献）时加载。',
        content: skillContent,
        source: 'runtime',
        path: skillPath,
        resourceBase: { kind: 'directory', path: RESOURCES_DIR },
      }),
      ctx.commands.register(createPaperCommand(ctx)),
    ]
    return () => {
      for (let index = disposers.length - 1; index >= 0; index -= 1) disposers[index]()
    }
  }, 'dsh-paper-mode: registrations')

  ctx.logger?.info?.(`dsh-paper-mode v${version} active: section ${SECTION_NAME}, skill paper-writing, command /paper`)
}
