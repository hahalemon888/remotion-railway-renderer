# 🚀 一键部署脚本 - Remotion Railway 渲染器 (PowerShell)
# 用法: .\deploy.ps1 -CommitMessage "your message"

param(
    [string]$CommitMessage = "feat: 优化内存配置，支持 10 片段渲染"
)

Write-Host "🚀 开始部署 Remotion Railway 渲染器" -ForegroundColor Blue
Write-Host ""

# 检查 Git 状态
Write-Host "📊 检查 Git 状态..." -ForegroundColor Yellow
git status --short

Write-Host ""
$confirm = Read-Host "是否继续部署？(y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ 部署已取消" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 提交信息: $CommitMessage" -ForegroundColor Blue
Write-Host ""

# 添加所有文件
Write-Host "📦 添加所有文件..." -ForegroundColor Yellow
git add .

# 提交更改
Write-Host "💾 提交更改..." -ForegroundColor Yellow
git commit -m $CommitMessage

# 推送到 GitHub
Write-Host "🚀 推送到 GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ 部署成功！" -ForegroundColor Green
Write-Host ""
Write-Host "📍 接下来：" -ForegroundColor Blue
Write-Host "1. 访问 Railway Dashboard: https://railway.app/"
Write-Host "2. 等待自动部署完成（3-5 分钟）"
Write-Host "3. 获取 Railway URL"
Write-Host "4. 运行测试: .\test-workflow.ps1 -RailwayUrl <RAILWAY_URL>"
Write-Host ""
Write-Host "🎉 准备好测试 10 片段工作流了！" -ForegroundColor Green

