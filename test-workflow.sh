#!/bin/bash
# 🧪 Remotion 10个片段工作流测试脚本
# 用法: ./test-workflow.sh <RAILWAY_URL>

set -e

# 检查参数
if [ -z "$1" ]; then
  echo "❌ 错误: 请提供 Railway URL"
  echo "用法: ./test-workflow.sh https://your-app.railway.app"
  exit 1
fi

RAILWAY_URL="$1"
echo "🎬 开始测试 10 个片段工作流"
echo "📍 目标服务器: $RAILWAY_URL"
echo ""

# 步骤 1: 提交渲染任务
echo "📤 步骤 1/3: 提交渲染任务..."
RESPONSE=$(curl -s -X POST "$RAILWAY_URL/render" \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "MyVideo",
    "inputProps": {
      "title": "10个片段测试",
      "subtitle": "极限内存模式 - Railway 512MB"
    },
    "outputFileName": "test-10-segments.mp4",
    "renderOptions": {
      "scale": 0.2,
      "crf": 40
    }
  }')

TASK_ID=$(echo $RESPONSE | grep -o '"taskId":"[^"]*' | sed 's/"taskId":"//')

if [ -z "$TASK_ID" ]; then
  echo "❌ 提交任务失败"
  echo "响应: $RESPONSE"
  exit 1
fi

echo "✅ 任务已提交"
echo "🆔 任务 ID: $TASK_ID"
echo ""

# 步骤 2: 轮询任务状态
echo "🔄 步骤 2/3: 等待渲染完成..."
echo "⏱️  预计时间: 5-10 分钟"
echo ""

COMPLETED=false
COUNT=0
MAX_ATTEMPTS=120  # 最多等待 10 分钟（每5秒一次）

while [ "$COMPLETED" = false ] && [ $COUNT -lt $MAX_ATTEMPTS ]; do
  sleep 5
  COUNT=$((COUNT + 1))
  
  STATUS_RESPONSE=$(curl -s "$RAILWAY_URL/render/$TASK_ID")
  STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | sed 's/"status":"//')
  PROGRESS=$(echo $STATUS_RESPONSE | grep -o '"progress":[0-9.]*' | sed 's/"progress"://')
  
  if [ -z "$PROGRESS" ]; then
    PROGRESS="0"
  fi
  
  echo -ne "\r🎨 状态: $STATUS | 进度: ${PROGRESS}% | 已等待: $((COUNT * 5))秒      "
  
  if [ "$STATUS" = "completed" ]; then
    COMPLETED=true
    echo ""
    echo "✅ 渲染完成！"
  elif [ "$STATUS" = "failed" ]; then
    echo ""
    echo "❌ 渲染失败"
    echo "详细信息: $STATUS_RESPONSE"
    exit 1
  fi
done

if [ "$COMPLETED" = false ]; then
  echo ""
  echo "⏰ 等待超时（10分钟）"
  echo "任务可能仍在进行中，请手动查询: $RAILWAY_URL/render/$TASK_ID"
  exit 1
fi

echo ""

# 步骤 3: 下载视频
echo "📥 步骤 3/3: 下载视频..."
DOWNLOAD_URL="$RAILWAY_URL/output/test-10-segments.mp4"
curl -o "test-10-segments-$(date +%Y%m%d-%H%M%S).mp4" "$DOWNLOAD_URL"

if [ $? -eq 0 ]; then
  echo "✅ 下载成功！"
  echo ""
  echo "🎉 测试完成！"
  echo "📹 视频文件: test-10-segments-$(date +%Y%m%d-%H%M%S).mp4"
else
  echo "❌ 下载失败"
  echo "请手动下载: $DOWNLOAD_URL"
  exit 1
fi

