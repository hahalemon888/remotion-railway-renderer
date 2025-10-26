# 🧪 Remotion 10个片段工作流测试脚本 (PowerShell)
# 用法: .\test-workflow.ps1 -RailwayUrl "https://your-app.railway.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$RailwayUrl
)

Write-Host "🎬 开始测试 10 个片段工作流" -ForegroundColor Green
Write-Host "📍 目标服务器: $RailwayUrl"
Write-Host ""

# 步骤 1: 提交渲染任务
Write-Host "📤 步骤 1/3: 提交渲染任务..." -ForegroundColor Cyan

$body = @{
    compositionId = "MyVideo"
    inputProps = @{
        title = "10个片段测试"
        subtitle = "极限内存模式 - Railway 512MB"
    }
    outputFileName = "test-10-segments.mp4"
    renderOptions = @{
        scale = 0.2
        crf = 40
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$RailwayUrl/render" -Method Post -Body $body -ContentType "application/json"
    $taskId = $response.taskId
    
    Write-Host "✅ 任务已提交" -ForegroundColor Green
    Write-Host "🆔 任务 ID: $taskId"
    Write-Host ""
} catch {
    Write-Host "❌ 提交任务失败" -ForegroundColor Red
    Write-Host "错误: $_"
    exit 1
}

# 步骤 2: 轮询任务状态
Write-Host "🔄 步骤 2/3: 等待渲染完成..." -ForegroundColor Cyan
Write-Host "⏱️  预计时间: 5-10 分钟"
Write-Host ""

$completed = $false
$count = 0
$maxAttempts = 120  # 最多等待 10 分钟

while (-not $completed -and $count -lt $maxAttempts) {
    Start-Sleep -Seconds 5
    $count++
    
    try {
        $statusResponse = Invoke-RestMethod -Uri "$RailwayUrl/render/$taskId" -Method Get
        $status = $statusResponse.status
        $progress = $statusResponse.progress
        
        if ($null -eq $progress) {
            $progress = 0
        }
        
        Write-Host -NoNewline "`r🎨 状态: $status | 进度: $($progress)% | 已等待: $($count * 5)秒      "
        
        if ($status -eq "completed") {
            $completed = $true
            Write-Host ""
            Write-Host "✅ 渲染完成！" -ForegroundColor Green
        } elseif ($status -eq "failed") {
            Write-Host ""
            Write-Host "❌ 渲染失败" -ForegroundColor Red
            Write-Host "详细信息: $($statusResponse | ConvertTo-Json)"
            exit 1
        }
    } catch {
        Write-Host ""
        Write-Host "⚠️  查询状态失败，重试中..." -ForegroundColor Yellow
    }
}

if (-not $completed) {
    Write-Host ""
    Write-Host "⏰ 等待超时（10分钟）" -ForegroundColor Yellow
    Write-Host "任务可能仍在进行中，请手动查询: $RailwayUrl/render/$taskId"
    exit 1
}

Write-Host ""

# 步骤 3: 下载视频
Write-Host "📥 步骤 3/3: 下载视频..." -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = "test-10-segments-$timestamp.mp4"
$downloadUrl = "$RailwayUrl/output/test-10-segments.mp4"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $outputFile
    Write-Host "✅ 下载成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 测试完成！" -ForegroundColor Green
    Write-Host "📹 视频文件: $outputFile"
} catch {
    Write-Host "❌ 下载失败" -ForegroundColor Red
    Write-Host "请手动下载: $downloadUrl"
    exit 1
}

