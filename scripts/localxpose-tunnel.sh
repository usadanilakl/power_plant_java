#!/bin/bash
#
# LocalXpose Tunnel Manager
# Exposes localhost:8082 to the internet for testing external access (Tiers 3 & 4).
#
# Usage:
#   ./scripts/localxpose-tunnel.sh install   - Download and install loclx binary
#   ./scripts/localxpose-tunnel.sh login      - Authenticate with your access token
#   ./scripts/localxpose-tunnel.sh start      - Start the tunnel
#   ./scripts/localxpose-tunnel.sh stop       - Stop the tunnel
#   ./scripts/localxpose-tunnel.sh status     - Check if tunnel is running
#   ./scripts/localxpose-tunnel.sh logs       - Tail the tunnel log

set -euo pipefail

APP_PORT="${APP_PORT:-8090}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$PROJECT_DIR/localxpose.pid"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/localxpose.log"
INSTALL_DIR="$HOME/.local/bin"
LOCLX_BIN="$INSTALL_DIR/loclx"

ensure_log_dir() {
    mkdir -p "$LOG_DIR"
}

cmd_install() {
    echo "Installing LocalXpose CLI..."
    mkdir -p "$INSTALL_DIR"

    local tmp_dir
    tmp_dir=$(mktemp -d)
    local zip_file="$tmp_dir/loclx-linux-amd64.zip"

    echo "Downloading loclx-linux-amd64.zip..."
    curl -fSL "https://api.localxpose.io/api/v2/downloads/loclx-linux-amd64.zip" -o "$zip_file"

    echo "Extracting to $INSTALL_DIR..."
    unzip -o "$zip_file" -d "$INSTALL_DIR"
    chmod +x "$LOCLX_BIN"
    rm -rf "$tmp_dir"

    # Ensure ~/.local/bin is on PATH
    if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
        echo ""
        echo "Add this to your ~/.bashrc or ~/.zshrc:"
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo ""
    fi

    echo "Installed: $("$LOCLX_BIN" --version 2>/dev/null || echo "$LOCLX_BIN")"
}

find_loclx() {
    if [[ -x "$LOCLX_BIN" ]]; then
        echo "$LOCLX_BIN"
    elif command -v loclx &>/dev/null; then
        command -v loclx
    else
        echo ""
    fi
}

cmd_login() {
    local bin
    bin=$(find_loclx)
    if [[ -z "$bin" ]]; then
        echo "Error: loclx not found. Run: $0 install"
        exit 1
    fi
    echo "Authenticate with your LocalXpose access token."
    echo "Get your token from: https://localxpose.io/dashboard/access"
    echo ""
    "$bin" account login
}

cmd_start() {
    local bin
    bin=$(find_loclx)
    if [[ -z "$bin" ]]; then
        echo "Error: loclx not found. Run: $0 install"
        exit 1
    fi

    if [[ -f "$PID_FILE" ]]; then
        local old_pid
        old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            echo "Tunnel already running (PID $old_pid)"
            echo "Use '$0 stop' to stop it first."
            exit 1
        fi
        rm -f "$PID_FILE"
    fi

    ensure_log_dir

    echo "Starting LocalXpose tunnel to localhost:$APP_PORT..."
    nohup "$bin" tunnel http --to "localhost:$APP_PORT" > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"

    echo "Tunnel starting (PID $pid)..."
    echo "Waiting for tunnel URL..."

    # Wait for the tunnel URL to appear in the log
    local attempts=0
    while [[ $attempts -lt 30 ]]; do
        if grep -qiE "https?://.*loclx\.|tunnel.*url|forwarding" "$LOG_FILE" 2>/dev/null; then
            echo ""
            echo "========================================="
            grep -iE "https?://.*loclx\.|tunnel.*url|forwarding" "$LOG_FILE" | head -5
            echo "========================================="
            echo ""
            echo "Tunnel is running. Log: $LOG_FILE"
            echo "Stop with: $0 stop"
            exit 0
        fi
        sleep 1
        ((attempts++))

        # Check if process died
        if ! kill -0 "$pid" 2>/dev/null; then
            echo "Error: Tunnel process exited. Check log:"
            cat "$LOG_FILE"
            rm -f "$PID_FILE"
            exit 1
        fi
    done

    echo "Tunnel started (PID $pid) but URL not detected yet."
    echo "Check the log: $LOG_FILE"
}

cmd_stop() {
    if [[ ! -f "$PID_FILE" ]]; then
        echo "No tunnel running (no PID file)."
        exit 0
    fi

    local pid
    pid=$(cat "$PID_FILE")

    if kill -0 "$pid" 2>/dev/null; then
        echo "Stopping tunnel (PID $pid)..."
        kill "$pid"
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null
        fi
        echo "Tunnel stopped."
    else
        echo "Tunnel process (PID $pid) not running."
    fi

    rm -f "$PID_FILE"
}

cmd_status() {
    if [[ -f "$PID_FILE" ]]; then
        local pid
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Tunnel is running (PID $pid)"
            if [[ -f "$LOG_FILE" ]]; then
                grep -iE "https?://.*loclx\.|tunnel.*url|forwarding" "$LOG_FILE" 2>/dev/null | tail -3
            fi
            return 0
        fi
        echo "Tunnel not running (stale PID file)."
        rm -f "$PID_FILE"
    else
        echo "Tunnel not running."
    fi
    return 1
}

cmd_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        tail -f "$LOG_FILE"
    else
        echo "No log file found at $LOG_FILE"
        exit 1
    fi
}

# Main
case "${1:-help}" in
    install) cmd_install ;;
    login)   cmd_login ;;
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    status)  cmd_status ;;
    logs)    cmd_logs ;;
    *)
        echo "Usage: $0 {install|login|start|stop|status|logs}"
        echo ""
        echo "Commands:"
        echo "  install  - Download and install loclx binary to ~/.local/bin"
        echo "  login    - Authenticate with your LocalXpose access token"
        echo "  start    - Start HTTP tunnel to localhost:$APP_PORT"
        echo "  stop     - Stop the tunnel"
        echo "  status   - Check if tunnel is running"
        echo "  logs     - Tail the tunnel log"
        echo ""
        echo "Environment:"
        echo "  APP_PORT - Override target port (default: 8082)"
        ;;
esac
