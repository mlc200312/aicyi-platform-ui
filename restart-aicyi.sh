#!/usr/bin/env bash
###############################################################################
# restart-aicyi.sh — 一键重启 aicyi 前后端服务
#
#   1. 停止旧进程（调用 stop-aicyi.sh）
#   2. 构建后端（JDK 17 + Maven，跳过测试）——可用 --skip-build 跳过
#   3. 启动 aicyi-cloud-admin  → http://localhost:18080
#   4. 启动 aicyi-platform-ui  → http://localhost:5173
#
# 用法:
#   ./restart-aicyi.sh               # 完整重启（含后端构建）
#   ./restart-aicyi.sh --skip-build  # 跳过 Maven 构建，直接用现有 jar
#
# 日志: logs/aicyi-cloud-admin.log  logs/aicyi-platform-ui.log（位于工作区根目录）
# 停止: 同目录下 ./stop-aicyi.sh
###############################################################################
set -euo pipefail

# 本脚本位于 aicyi-platform-ui/ 内；ROOT 指向工作区根目录（两个工程与 logs 的所在）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

ADMIN_DIR="$ROOT/aicyi-cloud-admin"
UI_DIR="$ROOT/aicyi-platform-ui"
ADMIN_JAR="$ADMIN_DIR/aicyi-cloud-admin-boot/target/aicyi-cloud-admin-boot-0.0.1-SNAPSHOT.jar"
ADMIN_URL="http://127.0.0.1:18080/"
UI_URL="http://localhost:5173/"

# JDK 17（默认 java 是 JDK 8，本项目需要 17；找不到时问 macOS java_home）
JDK17="/Users/liangchaomin/Library/Java/JavaVirtualMachines/temurin-17.0.20/Contents/Home"
if [[ ! -x "$JDK17/bin/java" ]]; then
  JDK17="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
fi

SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    *) echo "未知参数: $arg（支持: --skip-build）"; exit 1 ;;
  esac
done

log()  { printf '%s\n' "$*"; }
fail() { printf '❌ %s\n' "$*" >&2; exit 1; }

# ── 0) 依赖服务预检：MySQL / Redis ──────────────────────────────────────────
for p in 3306 6379; do
  nc -z 127.0.0.1 "$p" 2>/dev/null || fail "本机端口 $p 未监听（MySQL/Redis 未启动），请先启动依赖服务"
done

# ── 1) 停止旧进程 ──────────────────────────────────────────────────────────
bash "$SCRIPT_DIR/stop-aicyi.sh" || log "⚠️ 停止旧进程时有告警，继续执行"

# ── 2) 构建后端 ────────────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" -eq 1 ]]; then
  [[ -f "$ADMIN_JAR" ]] || fail "未找到 $ADMIN_JAR，且已指定 --skip-build"
  log "→ 跳过构建，使用现有 jar"
else
  [[ -x "$JDK17/bin/java" ]] || fail "未找到 JDK 17，请安装 Temurin 17 或调整脚本中 JDK17 路径"
  log "→ Maven 构建后端（JDK 17，跳过测试）..."
  (cd "$ADMIN_DIR" && JAVA_HOME="$JDK17" mvn -q -DskipTests package) || fail "后端构建失败，详见上方 Maven 输出"
fi

# ── 启动/等待工具函数 ───────────────────────────────────────────────────────
start_bg() { # $1=工作目录 $2=日志文件 $3=pid文件 $4...=启动命令
  local dir="$1" logfile="$2" pidfile="$3"
  shift 3
  (cd "$dir" && nohup "$@" > "$logfile" 2>&1 < /dev/null & echo $! > "$pidfile")
}

wait_http() { # $1=url $2=超时秒 $3=服务名 $4=日志文件
  local i
  for ((i = 1; i <= $2; i++)); do
    if curl -s -o /dev/null --max-time 2 "$1" 2>/dev/null; then
      log "✅ $3 已就绪（${i}s）"
      return 0
    fi
    sleep 1
  done
  log "❌ $3 在 ${2}s 内未就绪，日志尾部："
  tail -n 30 "$4" || true
  return 1
}

# ── 3) 启动后端 ────────────────────────────────────────────────────────────
log "→ 启动 aicyi-cloud-admin（端口 18080）..."
start_bg "$ADMIN_DIR" "$LOG_DIR/aicyi-cloud-admin.log" "$LOG_DIR/aicyi-cloud-admin.pid" \
  "$JDK17/bin/java" -jar "$ADMIN_JAR"
wait_http "$ADMIN_URL" 90 "aicyi-cloud-admin" "$LOG_DIR/aicyi-cloud-admin.log" || fail "后端启动失败"

# ── 4) 启动前端 ────────────────────────────────────────────────────────────
log "→ 启动 aicyi-platform-ui（端口 5173）..."
if [[ ! -d "$UI_DIR/node_modules" ]]; then
  log "→ 前端依赖缺失，执行 npm ci（使用工作区缓存目录，规避 ~/.npm 权限问题）..."
  (cd "$UI_DIR" && npm ci --no-fund --no-audit --cache "$ROOT/.npm-cache") || fail "前端依赖安装失败"
fi
start_bg "$UI_DIR" "$LOG_DIR/aicyi-platform-ui.log" "$LOG_DIR/aicyi-platform-ui.pid" \
  npm run dev -- --strictPort
wait_http "$UI_URL" 45 "aicyi-platform-ui" "$LOG_DIR/aicyi-platform-ui.log" || fail "前端启动失败"

# ── 5) 结果摘要 ────────────────────────────────────────────────────────────
ADMIN_PID="$(cat "$LOG_DIR/aicyi-cloud-admin.pid" 2>/dev/null || echo '?')"
UI_PID="$(cat "$LOG_DIR/aicyi-platform-ui.pid" 2>/dev/null || echo '?')"

cat <<EOF

======== ✅ aicyi 服务已重启 ========
后端 aicyi-cloud-admin : $ADMIN_URL (PID $ADMIN_PID)
  ↳ Swagger: http://127.0.0.1:18080/swagger-ui/index.html
前端 aicyi-platform-ui : $UI_URL (PID $UI_PID)

日志: logs/aicyi-cloud-admin.log / logs/aicyi-platform-ui.log
停止: ./stop-aicyi.sh
=====================================
EOF
