#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# deploy-wrapper.sh
# Vị trí trên server: /home/deploy-canvas/bin/deploy-wrapper.sh
# Sử dụng trong ~/.ssh/authorized_keys:
# command="/home/deploy-canvas/bin/deploy-wrapper.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 ...
# ==============================================================================

ORIGINAL_CMD="${SSH_ORIGINAL_COMMAND:-}"

if [[ -z "${ORIGINAL_CMD}" ]]; then
  echo "[SECURITY ERROR] No command specified." >&2
  exit 1
fi

# Thẩm định nghiêm ngặt: Chỉ chấp nhận lệnh "deploy <40-hex-characters>"
if [[ "${ORIGINAL_CMD}" =~ ^deploy[[:space:]]+([0-9a-f]{40})$ ]]; then
  TARGET_SHA="${BASH_REMATCH[1]}"
  echo "[SECURITY] Authorized deploy command accepted for SHA: ${TARGET_SHA}"
  exec /home/deploy-canvas/projects/canvas/deploy.sh "${TARGET_SHA}"
else
  echo "[SECURITY REJECTED] Command not allowed: ${ORIGINAL_CMD}" >&2
  exit 1
fi
