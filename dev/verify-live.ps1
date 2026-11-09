# 安装后 / 重启后的现场校验脚本
#
# 用法（PowerShell）：
#   pwsh -File .\dev\verify-live.ps1
#
# 它只读不写：检查 profile 里的安装状态与插件文件，并打印重启后应在 GUI / 会话内确认的项目。

$ErrorActionPreference = 'Stop'
$packageDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$profileDir = if ($env:DSH_PROFILE_DIR) { $env:DSH_PROFILE_DIR } else { Join-Path $HOME '.dsh\profiles\desktop' }
$profilePkg = Join-Path $profileDir 'package.json'
$link = Join-Path $profileDir 'node_modules\dsh-paper-mode'

function Assert($condition, $message) {
  if ($condition) { Write-Output "PASS  $message" }
  else { Write-Output "FAIL  $message"; $script:failed = $true }
}

$script:failed = $false

Write-Output '=== 1. 插件包文件 ==='
foreach ($file in @('package.json', 'index.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'locale\zh.json', 'locale\en.json', 'skills\paper-writing\SKILL.md', 'resources\paper-template.md')) {
  Assert (Test-Path -LiteralPath (Join-Path $packageDir $file)) "插件文件存在：$file"
}

Write-Output ''
Write-Output '=== 2. profile 安装状态 ==='
$pkg = Get-Content -Raw -LiteralPath $profilePkg -Encoding UTF8 | ConvertFrom-Json
$dep = $pkg.dependencies.'dsh-paper-mode'
$selected = @($pkg.dsh.profile.bundles) -contains 'dsh-paper-mode'
Assert ($dep -ne $null) "profile 依赖包含 dsh-paper-mode（$dep）"
Assert ($selected) 'profile 的 bundles 列表已选中 dsh-paper-mode'

$item = Get-Item -LiteralPath $link -ErrorAction SilentlyContinue
Assert ($item -ne $null) 'node_modules/dsh-paper-mode 已建立链接'
if ($item -ne $null) {
  Assert ($item.LinkType -ne $null) "链接类型：$($item.LinkType)"
  $target = @($item.Target)[0]
  Assert ($target -ne $null) "链接目标：$target"
}

Write-Output ''
Write-Output '=== 3. 插件自身不变量（无需 DSH 进程） ==='
Push-Location $packageDir
try { node dev/selftest.mjs } finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { $script:failed = $true }

Write-Output ''
Write-Output '=== 4. 重启后请在新会话中逐项确认（脚本无法代验） ==='
Write-Output '  1) 插件管理 / 插件列表里「论文模式」为启用状态，标题与描述显示中文；'
Write-Output '  2) 输入框下方出现「论文模式」徽标；首次进入弹出一次提示；'
Write-Output '  3) 输入 /paper status  → 返回“论文模式：已启用 …”与用法；'
Write-Output '  4) 输入 /paper template → 返回《学术论文格式空白模板》全文；'
Write-Output '  5) 让模型“加载 paper-writing 技能”，确认技能正文可读；'
Write-Output '  6) 停用「论文模式」后：徽标与提示消失、技能不可加载、/paper 失效；'
Write-Output '  7) 重新启用后可恢复（此后改动可用 dsh-unlag 刷新按钮，无需再重启）。'

Write-Output ''
if ($script:failed) { Write-Output 'RESULT: 有检查未通过，请按上面的 FAIL 项修复。'; exit 1 }
Write-Output 'RESULT: 安装侧检查全部通过；界面与会话内项目待重启后人工确认。'
