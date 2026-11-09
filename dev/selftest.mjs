/**
 * Self-test for the dsh-paper-mode bundle. Run with:
 *   node dev/selftest.mjs
 *
 * It exercises the Host half against stub services (no DSH process needed) and
 * statically checks the Client half and display resources. Exits non-zero on the
 * first failed assertion group.
 */
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PKG_DIR = fileURLToPath(new URL('..', import.meta.url))
const read = (relative) => readFileSync(`${PKG_DIR}${relative}`, 'utf8')
const exists = (relative) => {
  try {
    return statSync(`${PKG_DIR}${relative}`).isFile()
  } catch {
    return false
  }
}

let checks = 0
function check(name, fn) {
  try {
    fn()
    checks += 1
    console.log(`ok ${checks} - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    console.error(error)
    process.exit(1)
  }
}

const pkg = JSON.parse(read('package.json'))

check('package manifest declares the bundle and client halves', () => {
  assert.equal(pkg.name, 'dsh-paper-mode')
  assert.equal(pkg.type, 'module')
  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.equal(pkg.dsh?.client?.platform, 'web')
  assert.equal(pkg.dsh?.client?.immediately, true)
  assert.equal(pkg.exports?.['.'], './index.js')
  assert.equal(pkg.exports?.['./client'], './client.js')
  assert.ok(pkg.exports?.['./locale/*.json'])
  assert.ok(pkg.exports?.['./icon'])
  for (const file of ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'skills/paper-writing/SKILL.md', 'resources/paper-template.md']) {
    assert.ok(exists(file), `missing packaged file: ${file}`)
    assert.ok(String(pkg.files ?? '').includes(file.split('/')[0]), `files[] does not cover ${file}`)
  }
})

check('bundle patch inserts exactly the paper-mode row', () => {
  const patch = read('cordis.patch.yml')
  assert.match(patch, /insert:/)
  assert.match(patch, /id:\s*dsh-paper-mode/)
  assert.match(patch, /name:\s*'dsh-paper-mode'|name:\s*dsh-paper-mode/)
})

check('display resources exist with meta title and description', () => {
  for (const locale of ['zh', 'en']) {
    const dict = JSON.parse(read(`locale/${locale}.json`))
    assert.equal(typeof dict.meta?.title, 'string')
    assert.ok(dict.meta.title.length > 0, `${locale} title empty`)
    assert.equal(typeof dict.meta?.description, 'string')
    assert.ok(dict.meta.description.length > 0, `${locale} description empty`)
  }
  const icon = read('icon.svg')
  assert.match(icon, /<svg[\s>]/)
  assert.ok(Buffer.byteLength(icon) < 256 * 1024, 'icon exceeds 256 KiB')
})

check('bundled template carries the required placeholders', () => {
  const template = read('resources/paper-template.md')
  for (const needle of ['【摘要】', '【关键词】', '1　引言', '表 1　', '图 1　', '[1] 作者. 书名[M]']) {
    assert.ok(template.includes(needle), `template missing ${needle}`)
  }
})

const { apply, inject, name } = await import(new URL('../index.js', import.meta.url).href)

check('host half exports the plugin contract', () => {
  assert.equal(name, 'dsh-paper-mode')
  assert.equal(typeof apply, 'function')
  assert.ok(Array.isArray(inject))
  assert.deepEqual([...inject].sort(), ['commands', 'skills', 'systemPrompt'])
})

const registrations = { sections: [], skills: [], commands: [] }
const disposals = { sections: 0, skills: 0, commands: 0 }
const effects = []
const effectCleanups = []
const ctx = {
  logger: { info() {}, warn() {}, debug() {} },
  effect(factory, label) {
    const cleanup = factory()
    effects.push({ factory, label })
    effectCleanups.push(cleanup)
    return cleanup
  },
  systemPrompt: {
    section(section) {
      registrations.sections.push(section)
      return () => {
        disposals.sections += 1
      }
    },
  },
  skills: {
    register(skill) {
      registrations.skills.push(skill)
      return () => {
        disposals.skills += 1
      }
    },
  },
  commands: {
    register(definition) {
      registrations.commands.push(definition)
      return () => {
        disposals.commands += 1
      }
    },
  },
}

apply(ctx)

check('apply registers through ctx.effect', () => {
  assert.equal(effects.length, 1)
  assert.equal(typeof effectCleanups[0], 'function')
})

check('paper-mode prompt section is ordered and carries the doctrine', () => {
  assert.equal(registrations.sections.length, 1)
  const section = registrations.sections[0]
  assert.equal(section.name, 'paper:mode')
  assert.equal(typeof section.order, 'number')
  assert.ok(Number.isFinite(section.order), 'section order must be finite')
  assert.equal(section.order, 550)
  const text = typeof section.text === 'function' ? section.text({}) : section.text
  for (const needle of ['论文模式', '五阶段法', '主题句', 'GB/T 7714', '三线表', '学术诚信']) {
    assert.ok(text.includes(needle), `section text missing ${needle}`)
  }
})

check('paper-writing runtime skill is registered with the full body', () => {
  assert.equal(registrations.skills.length, 1)
  const skill = registrations.skills[0]
  assert.equal(skill.name, 'paper-writing')
  assert.ok(typeof skill.description === 'string' && skill.description.length > 0)
  assert.ok(typeof skill.whenToUse === 'string' && skill.whenToUse.length > 0)
  assert.ok(typeof skill.content === 'string' && skill.content.length > 2000, 'skill content unexpectedly short')
  for (const needle of ['五阶段', '引言', '段落', '结论', 'GB/T 7714', '三线表', '自检']) {
    assert.ok(skill.content.includes(needle), `skill content missing ${needle}`)
  }
  assert.equal(skill.source, 'runtime')
  assert.equal(skill.resourceBase?.kind, 'directory')
  assert.ok(skill.resourceBase.path.endsWith('resources'))
})

check('/paper command answers status, template and checklist', () => {
  assert.equal(registrations.commands.length, 1)
  const command = registrations.commands[0]
  assert.equal(command.name, 'paper')
  assert.ok(typeof command.description === 'string' && command.description.length > 0)
  const invoke = (rawInput) => command.handler({ rawInput, agent: {}, attachments: [], signal: new AbortController().signal })
  const status = invoke('')
  assert.equal(status.kind, 'success')
  assert.ok(status.text.includes('论文模式：已启用'))
  assert.ok(status.text.includes('/paper template'))
  const template = invoke('template')
  assert.equal(template.kind, 'success')
  assert.ok(template.text.includes('【摘要】'))
  const checklist = invoke('checklist')
  assert.equal(checklist.kind, 'success')
  assert.ok(checklist.text.includes('三线表'))
  const unknown = invoke('nope')
  assert.equal(unknown.kind, 'error')
})

check('disposing the effect removes every registration', () => {
  // The plugin hands one composite cleanup to ctx.effect so unloading the row
  // unregisters the section, the skill and the command together.
  effectCleanups[0]()
  assert.equal(disposals.sections, 1)
  assert.equal(disposals.skills, 1)
  assert.equal(disposals.commands, 1)
})

check('client half registers the badge and the first-entry notice', () => {
  const client = read('client.js')
  assert.match(client, /window\.__ModuleLoader__\.load\(/)
  assert.match(client, /id:\s*'dsh-paper-mode'/)
  assert.match(client, /conversation\.composer\.dock/)
  assert.match(client, /shell\.overlay/)
  assert.match(client, /locale\.register\(/)
  assert.match(client, /论文模式/)
})

console.log(`\nPASS: ${checks} checks`)
