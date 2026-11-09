/**
 * dsh-paper-mode — Client half.
 *
 * Renders two pieces of UI while the bundle row is active:
 *   1. a resident "论文模式" badge below the composer (`conversation.composer.dock`),
 *      clickable to show the mode's quick usage panel;
 *   2. a one-per-tab first-entry notice (`shell.overlay`) that announces the mode
 *      the first time the page loads with the plugin enabled.
 *
 * Both entries are plain React rendered through slots; all styling uses host
 * theme tokens (with light/dark-safe fallbacks for the artwork accent only), and
 * every visible string is registered with the Client locale service.
 */
window.__ModuleLoader__.load({
  id: 'dsh-paper-mode',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'dsh-paper-mode'
    const NOTICE_KEY = 'dsh-paper-mode:notice:v1'
    const ZH = 'zh'
    const EN = 'en'

    const DICTS = {
      zh: {
        'badge.label': '论文模式',
        'badge.title': '当前处于论文模式，点击查看用法',
        'panel.title': '论文模式已启用',
        'panel.method': '写作按五阶段法 + 引言/段落/结论三公式推进',
        'panel.format': '版式、图表与参考文献遵循 GB/T 规范',
        'panel.template': '输入 /paper template 取空白模板',
        'panel.checklist': '输入 /paper checklist 取格式自检清单',
        'panel.exit': '在插件管理中停用「论文模式」即可退出',
        'notice.title': '论文模式已开启',
        'notice.body': '从这一步起，论文类任务会按五阶段法与 GB/T 规范执行：先定问题与提纲，再写结构与正文。',
        'notice.hint': '输入 /paper template 取空白模板，/paper checklist 取格式自检清单。',
        'notice.close': '知道了',
      },
      en: {
        'badge.label': 'Paper mode',
        'badge.title': 'Paper mode is active; click for usage',
        'panel.title': 'Paper mode is on',
        'panel.method': 'Writes through the five-stage method and the intro/paragraph/conclusion formulas',
        'panel.format': 'Layout, figures and references follow the GB/T rules',
        'panel.template': 'Run /paper template for the blank template',
        'panel.checklist': 'Run /paper checklist for the format self-check list',
        'panel.exit': 'Disable "Paper mode" in Plugin Manager to exit',
        'notice.title': 'Paper mode is on',
        'notice.body': 'From this step on, paper tasks follow the five-stage method and GB/T rules: problem and outline first, then structure and drafting.',
        'notice.hint': 'Run /paper template for the blank template, /paper checklist for the self-check list.',
        'notice.close': 'Got it',
      },
    }

    const EMPTY_SNAPSHOT = { active: ZH, locales: [], revision: 0 }

    /** Font/panel styling shared by both entries. */
    const FONT = 'var(--dsw-font-family, system-ui, -apple-system, "Segoe UI", sans-serif)'
    const CARD = {
      background: 'var(--dsw-alias-bg-overlay, #ffffff)',
      border: '1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.12))',
      color: 'var(--dsw-alias-label-primary, #161616)',
      fontFamily: FONT,
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const locale = ctx.locale
        for (const localeId of [ZH, EN]) {
          ctx.effect(() => locale.register(NS, localeId, DICTS[localeId]), `dsh-paper-mode: locale ${localeId}`)
        }
        const translate = locale.bind(NS)

        /** Re-render on locale switches so the registered strings stay live. */
        const useLocaleTick = () => {
          React.useSyncExternalStore(
            React.useCallback((callback) => locale.subscribe(callback), []),
            React.useCallback(() => locale.getSnapshot(), []),
            React.useCallback(() => EMPTY_SNAPSHOT, []),
          )
        }
        const t = (key) => translate(key)

        function Badge() {
          useLocaleTick()
          const [open, setOpen] = React.useState(false)
          const lines = ['panel.method', 'panel.format', 'panel.template', 'panel.checklist', 'panel.exit']
          return h(
            'div',
            { style: { display: 'flex', justifyContent: 'flex-end', padding: '4px 4px 0' } },
            h(
              'div',
              { style: { position: 'relative' } },
              h(
                'button',
                {
                  type: 'button',
                  title: t('badge.title'),
                  'aria-expanded': open,
                  onClick: () => setOpen((value) => !value),
                  style: {
                    ...CARD,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px 3px 8px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontFamily: FONT,
                    fontSize: '12px',
                    lineHeight: '18px',
                    color: 'var(--dsw-alias-label-secondary, #5c5c5c)',
                    background: 'color-mix(in srgb, var(--dsw-alias-brand-primary, #1d7874) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--dsw-alias-brand-primary, #1d7874) 32%, transparent)',
                  },
                },
                h('span', {
                  'aria-hidden': true,
                  style: {
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--dsw-alias-state-success-primary, #1d7874)',
                    flex: 'none',
                  },
                }),
                t('badge.label'),
              ),
              open
                ? h(
                    'div',
                    {
                      role: 'dialog',
                      'aria-label': t('panel.title'),
                      style: {
                        ...CARD,
                        position: 'absolute',
                        right: 0,
                        bottom: 'calc(100% + 8px)',
                        zIndex: 30,
                        width: '268px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.16)',
                        textAlign: 'left',
                        whiteSpace: 'normal',
                      },
                    },
                    h(
                      'div',
                      { style: { fontSize: '13px', fontWeight: 600, lineHeight: '20px', marginBottom: '6px' } },
                      t('panel.title'),
                    ),
                    h(
                      'ul',
                      {
                        style: {
                          margin: 0,
                          paddingLeft: '16px',
                          fontSize: '12px',
                          lineHeight: '19px',
                          color: 'var(--dsw-alias-label-secondary, #5c5c5c)',
                        },
                      },
                      lines.map((key) => h('li', { key }, t(key))),
                    ),
                  )
                : null,
            ),
          )
        }

        function Notice() {
          useLocaleTick()
          const [visible, setVisible] = React.useState(() => {
            try {
              return window.sessionStorage.getItem(NOTICE_KEY) !== '1'
            } catch {
              return true
            }
          })
          React.useEffect(() => {
            if (!visible) return undefined
            try {
              window.sessionStorage.setItem(NOTICE_KEY, '1')
            } catch {
              /* a sandboxed storage must not break the notice */
            }
            const timer = window.setTimeout(() => setVisible(false), 9000)
            return () => window.clearTimeout(timer)
          }, [visible])
          if (!visible) return null
          const dismiss = () => setVisible(false)
          return h(
            'div',
            {
              role: 'status',
              'aria-live': 'polite',
              style: {
                ...CARD,
                position: 'fixed',
                right: '20px',
                bottom: '20px',
                zIndex: 60,
                pointerEvents: 'auto',
                width: '336px',
                maxWidth: 'calc(100vw - 40px)',
                boxSizing: 'border-box',
                padding: '14px 16px',
                borderRadius: '12px',
                boxShadow: '0 10px 34px rgba(0, 0, 0, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              },
            },
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              h('span', {
                'aria-hidden': true,
                style: {
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  flex: 'none',
                  background: 'var(--dsw-alias-brand-primary, #1d7874)',
                },
              }),
              h(
                'div',
                { style: { flex: 1, fontSize: '14px', fontWeight: 600, lineHeight: '20px' } },
                t('notice.title'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: dismiss,
                  style: {
                    appearance: 'none',
                    border: 0,
                    background: 'transparent',
                    color: 'var(--dsw-alias-label-secondary, #5c5c5c)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    lineHeight: '18px',
                    padding: 0,
                    fontFamily: FONT,
                  },
                },
                t('notice.close'),
              ),
            ),
            h(
              'div',
              { style: { fontSize: '13px', lineHeight: '20px', color: 'var(--dsw-alias-label-primary, #161616)' } },
              t('notice.body'),
            ),
            h(
              'div',
              { style: { fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-secondary, #5c5c5c)' } },
              t('notice.hint'),
            ),
          )
        }

        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register({ name: 'conversation.composer.dock', id: 'paper-mode-badge', order: 10 }, Badge),
        )
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({ name: 'shell.overlay', id: 'paper-mode-notice', order: 10 }, Notice),
        )
      },
    }
  },
})
