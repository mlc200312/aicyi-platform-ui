#!/usr/bin/env bash
###############################################################################
# stop-aicyi.sh — 一键关闭 aicyi 本地服务
#
#   aicyi-platform-ui   (Vite dev server, 端口 5173)
#   aicyi-cloud-admin   (Spring Boot jar,  端口 18080)
#
# 停止策略（三层兜底，先 TERM 后 KILL -9）：
#   1. logs/*.pid 文件记录的 PID
#   2. 端口占用进程（lsof）
#   3. 进程特征匹配（pgrep，仅限本项目路径/jar 名，不会误伤其他进程）
###############################################################################
set -u

# 本脚本位于 aicyi-platform-ui/ 内；ROOT 指向工作区根目录（两个工程与 logs 的所在）
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"
UI_PORT=5173
ADMIN_PORT=18080

term_pid() { # $1=pid $2=label
  if kill -0 "$1" 2>/dev/null; then
    echo "  ↳ TERM $2 (PID $1)"
    kill "$1" 2>/dev/null || true
  fi
}

force_kill() { # $1="pids..." $2=label
  local pid
  for pid in $1; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "  ↳ KILL -9 $2 (PID $pid)"
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}

wait_gone() { # $1="pids..." $2=timeout 秒 —— 等待进程全部退出
  local i pid alive
  for ((i = 0; i < $2 * 2; i++)); do
    alive=""
    for pid in $1; do
      kill -0 "$pid" 2>/dev/null && alive="$alive $pid"
    done
    [[ -z "${alive// /}" ]] && return 0
    sleep 0.5
  done
  return 1
}

stop_service() { # $1=端口 $2=pidfile $3=进程特征 $4=服务名
  echo "→ 停止 $4 ..."
  local pids=""

  # 1) PID 文件
  if [[ -f "$2" ]]; then
    pids="$(cat "$2" 2>/dev/null || true)"
  fi

  # 2) 端口占用
  local port_pids
  port_pids="$(lsof -ti tcp:"$1" 2>/dev/null || true)"
  pids="$pids $port_pids"

  # 3) 进程特征兜底（排除脚本自身 PID）
  local pat_pids
  pat_pids="$(pgrep -f "$3" 2>/dev/null | grep -vx "$$" || true)"
  pids="$pids $pat_pids"

  # 归一化 + 去重
  pids="$(echo $pids | tr ' ' '\n' | sort -u | grep -v '^$' || true)"

  if [[ -z "$pids" ]]; then
    echo "  （未在运行）"
  else
    local pid
    for pid in $pids; do
      term_pid "$pid" "$4"
    done
    if ! wait_gone "$pids" 10; then
      force_kill "$pids" "$4"
    fi
  fi
  rm -f "$2"
}

echo "======== 一键关闭 aicyi 服务 ========"
stop_service "$UI_PORT" "$LOG_DIR/aicyi-platform-ui.pid" \
  "aicyi-platform-ui/node_modules" "aicyi-platform-ui (Vite :$UI_PORT)"

stop_service "$ADMIN_PORT" "$LOG_DIR/aicyi-cloud-admin.pid" \
  "aicyi-cloud-admin-boot-.*\.jar" "aicyi-cloud-admin (:$ADMIN_PORT)"

echo "======== ✅ 已全部关闭 ========"
