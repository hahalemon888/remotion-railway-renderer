#!/bin/bash
# 🚀 一键部署脚本 - Remotion Railway 渲染器
# 用法: ./deploy.sh "commit message"

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始部署 Remotion Railway 渲染器${NC}"
echo ""

# 检查 Git 状态
echo -e "${YELLOW}📊 检查 Git 状态...${NC}"
git status --short

echo ""
read -p "是否继续部署？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${YELLOW}❌ 部署已取消${NC}"
    exit 1
fi

# 获取提交信息
if [ -z "$1" ]; then
  COMMIT_MSG="feat: 优化内存配置，支持 10 片段渲染"
else
  COMMIT_MSG="$1"
fi

echo ""
echo -e "${BLUE}📝 提交信息: $COMMIT_MSG${NC}"
echo ""

# 添加所有文件
echo -e "${YELLOW}📦 添加所有文件...${NC}"
git add .

# 提交更改
echo -e "${YELLOW}💾 提交更改...${NC}"
git commit -m "$COMMIT_MSG"

# 推送到 GitHub
echo -e "${YELLOW}🚀 推送到 GitHub...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ 部署成功！${NC}"
echo ""
echo -e "${BLUE}📍 接下来：${NC}"
echo -e "1. 访问 Railway Dashboard: https://railway.app/"
echo -e "2. 等待自动部署完成（3-5 分钟）"
echo -e "3. 获取 Railway URL"
echo -e "4. 运行测试: ./test-workflow.sh <RAILWAY_URL>"
echo ""
echo -e "${GREEN}🎉 准备好测试 10 片段工作流了！${NC}"

