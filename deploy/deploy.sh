#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# deploy.sh
# Vị trí trên server: /home/deploy-canvas/projects/canvas/deploy.sh
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_DIR}"

LOCK_FILE="${PROJECT_DIR}/.deploy.lock"
exec 200>"${LOCK_FILE}"
if ! flock -n 200; then
  echo "[ERROR] Deploy already in progress. Aborting." >&2
  exit 1
fi

NEW_TAG="${1:-}"
if [[ -z "${NEW_TAG}" ]]; then
  echo "[ERROR] Missing commit SHA argument." >&2
  exit 1
fi

# Đọc CURRENT_TAG từ .env hiện tại (nếu có)
CURRENT_TAG=""
if [[ -f .env ]]; then
  CURRENT_TAG=$(grep -E '^IMAGE_TAG=' .env | cut -d'=' -f2- || true)
fi

IS_FIRST_RUN=false
if [[ -z "${CURRENT_TAG}" ]]; then
  echo "[INFO] No valid existing tag found in .env. Treating this as a FIRST-TIME deployment."
  IS_FIRST_RUN=true
else
  echo "[INFO] Current running tag: ${CURRENT_TAG}"
fi
echo "[INFO] Deploying new tag: ${NEW_TAG}"

# Ghi nguyên tử tệp .env qua file tạm
echo "IMAGE_TAG=${NEW_TAG}" > .env.tmp
mv .env.tmp .env

# Pull image mới từ GitLab Registry
echo "[INFO] Pulling new image from registry..."
if ! docker compose pull; then
  echo "[ERROR] docker compose pull failed for ${NEW_TAG}!" >&2
  if [[ "${IS_FIRST_RUN}" == "true" ]]; then
    rm -f .env
    echo "[INFO] Cleaned up .env after failed first-time pull." >&2
  else
    echo "IMAGE_TAG=${CURRENT_TAG}" > .env.tmp && mv .env.tmp .env
    echo "[INFO] Reverted .env back to ${CURRENT_TAG}." >&2
  fi
  exit 1
fi

# Chạy container mới (Bắt lỗi chủ động, không để set -e thoát script làm mất rollback)
echo "[INFO] Starting new container..."
UP_SUCCESS=true
if ! docker compose up -d --remove-orphans; then
  echo "[WARN] docker compose up -d failed for new tag ${NEW_TAG}!" >&2
  UP_SUCCESS=false
fi

# Kiểm tra sức khỏe nếu up thành công
HEALTHY=false
if [[ "${UP_SUCCESS}" == "true" ]]; then
  echo "[INFO] Running healthcheck on http://127.0.0.1:3000/ ..."
  for i in $(seq 1 10); do
    sleep 3
    if curl -fsS -o /dev/null http://127.0.0.1:3000/; then
      echo "[INFO] Healthcheck passed on attempt ${i}!"
      HEALTHY=true
      break
    fi
    echo "[INFO] Waiting for service to respond (attempt ${i}/10)..."
  done
fi

if [[ "${HEALTHY}" == "true" ]]; then
  echo "[SUCCESS] Deployment of ${NEW_TAG} completed successfully."
  exit 0
fi

# XỬ LÝ KHI BẢN MỚI THẤT BẠI
echo "[WARN] New version ${NEW_TAG} failed verification!" >&2

if [[ "${IS_FIRST_RUN}" == "true" ]]; then
  echo "[ERROR] First-time deployment failed. No previous version exists to rollback to." >&2
  docker compose down --remove-orphans || true
  rm -f .env
  exit 1
fi

# TIẾN HÀNH ROLLBACK VỀ BẢN CŨ HỢP LỆ
echo "[INFO] Rolling back to previous stable tag: ${CURRENT_TAG}..."
echo "IMAGE_TAG=${CURRENT_TAG}" > .env.tmp && mv .env.tmp .env

if ! docker compose up -d --remove-orphans; then
  echo "[CRITICAL] Failed to restart previous version ${CURRENT_TAG}!" >&2
  exit 2
fi

# Kiểm tra sức khỏe bản cũ
ROLLBACK_HEALTHY=false
for i in $(seq 1 5); do
  sleep 3
  if curl -fsS -o /dev/null http://127.0.0.1:3000/; then
    echo "[INFO] Rollback version ${CURRENT_TAG} is healthy on attempt ${i}."
    ROLLBACK_HEALTHY=true
    break
  fi
done

if [[ "${ROLLBACK_HEALTHY}" == "true" ]]; then
  echo "[WARN] Rollback to ${CURRENT_TAG} succeeded. Marking deployment as FAILED for pipeline alert." >&2
  exit 1
else
  echo "[CRITICAL] Rollback to ${CURRENT_TAG} ALSO FAILED! Both versions are down!" >&2
  exit 2
fi
