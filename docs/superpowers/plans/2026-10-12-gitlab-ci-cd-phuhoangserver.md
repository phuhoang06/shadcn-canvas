# GitLab CI/CD Triển Khai `canvas.musongoku.id.vn` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trọn bộ cấu hình CI/CD trên GitLab Self-Managed (`git.musongoku.id.vn`), tự động kiểm thử (Test + Next.js Build Export), đóng gói Docker Nginx Alpine với tag Full Commit SHA đẩy lên GitLab Container Registry, và tự động triển khai an toàn lên Ubuntu Server `phuhoangserver` (`canvas.musongoku.id.vn`) kèm cơ chế khóa đồng thời, kiểm tra sức khỏe và rollback 2 lớp.

**Architecture:**
- Frontend tĩnh Next.js 16 (`output: "export"`) được đóng gói qua multi-stage Dockerfile sang Nginx Alpine nhẹ (<10MB RAM).
- Pipeline GitLab CI gồm 3 stages: `test` (chạy `npm ci`, `typecheck`, `vitest`, `npm run build`), `build` (đóng gói và push image lên Container Registry với tag 40 ký tự hex bất biến `$CI_COMMIT_SHA`), `deploy` (gọi SSH wrapper cố định, khóa tệp qua `flock`, cập nhật nguyên tử `.env`, `docker compose up -d`, kiểm tra HTTP 200 tại `127.0.0.1:3000/`, rollback tự động nếu thất bại).
- An ninh: Không mount docker socket vào job CI; SSH key chỉ được chạy wrapper kiểm duyệt cú pháp regex `^deploy [0-9a-f]{40}$`, cố định `known_hosts`.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Docker, Docker Compose, Nginx Alpine, GitLab CI/CD, Bash (flock, curl).

## Global Constraints
- Target host: Ubuntu Server `phuhoangserver` (`192.168.0.100`)
- Registry address: `git.musongoku.id.vn:5050/personal-projects/canvas`
- Web domain: `canvas.musongoku.id.vn` (Cloudflare Tunnel trỏ về `http://127.0.0.1:3000`)
- Production Image tag: `$CI_COMMIT_SHA` (40-char hex full commit SHA, không dùng `latest`)
- Port mapping: Container `80` → Host `127.0.0.1:3000`
- Concurrency control: GitLab `resource_group: production-canvas` và host lock `/home/deploy-canvas/projects/canvas/.deploy.lock`
- Healthcheck endpoint: `http://127.0.0.1:3000/` (tối đa 30s)

---

### Task 1: Chuẩn Bị & Xác Minh Hạ Tầng Server (Checklist & Hướng Dẫn)

**Files:**
- Create: `deploy/SERVER_PREFLIGHT.md`

**Interfaces:**
- Consumes: Môi trường Ubuntu Server, GitLab Runner, Container Registry, Docker daemon
- Produces: `deploy/SERVER_PREFLIGHT.md` chứa checklist xác minh thông số mạng, port, dung lượng và executor

- [ ] **Step 1: Viết tài liệu kiểm tra tiền trạm server (Server Preflight Checklist)**

Tạo file `deploy/SERVER_PREFLIGHT.md` hướng dẫn kiểm tra:
1. Trạng thái GitLab Registry (`curl -k https://git.musongoku.id.vn:5050/v2/`).
2. Trạng thái GitLab Runner (`gitlab-runner status` và cấu hình trong `/etc/gitlab-runner/config.toml` - xác minh Docker executor).
3. Trạng thái Docker daemon & nhóm `docker` trên `phuhoangserver`.
4. Cổng `127.0.0.1:3000` (đảm bảo không xung đột dịch vụ khác).
5. Trạng thái Cloudflare Tunnel (`cloudflared` ingress rule trỏ về `http://127.0.0.1:3000`).

- [ ] **Step 2: Kiểm tra nội dung tệp**

Đảm bảo tài liệu không có placeholder, cung cấp rõ ràng các lệnh shell cần chạy trên Ubuntu Server.

- [ ] **Step 3: Commit**

```bash
git add deploy/SERVER_PREFLIGHT.md
git commit -m "docs(deploy): add server preflight checklist and verification steps"
```

---

### Task 2: Cập Nhật Dockerfile & Docker Compose Chuẩn Hóa Production

**Files:**
- Modify: `Dockerfile`
- Modify: `deploy/compose.yaml`

**Interfaces:**
- Consumes: Next.js static export `out/`, `deploy/nginx.conf`
- Produces: Docker image Nginx phục vụ `out/`, Compose nhận biến `${IMAGE_TAG}` và `${REGISTRY_IMAGE}`

- [ ] **Step 1: Viết test kiểm tra cấu trúc Docker Compose & Dockerfile**

Thêm test unit trong `lib/robustness.test.ts` (hoặc test file riêng `lib/deploy.test.ts`) kiểm tra:
1. `Dockerfile` có multi-stage build (`builder` và `runner`), EXPOSE 80, và healthcheck `http://localhost/`.
2. `deploy/compose.yaml` sử dụng biến `IMAGE_TAG` và map đúng `127.0.0.1:3000:80`.

- [ ] **Step 2: Chạy test để xác minh thất bại hoặc cần cập nhật**

Run: `npx vitest run lib/deploy.test.ts`

- [ ] **Step 3: Cập nhật `deploy/compose.yaml`**

Đảm bảo `compose.yaml` nhận tham số biến môi trường:
```yaml
services:
  shadcn-canvas:
    image: ${REGISTRY_IMAGE:-git.musongoku.id.vn:5050/personal-projects/canvas}:${IMAGE_TAG}
    container_name: shadcn-canvas
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:80"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 10s
      timeout: 3s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

- [ ] **Step 4: Chạy test kiểm tra lại**

Run: `npx vitest run lib/deploy.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Dockerfile deploy/compose.yaml lib/deploy.test.ts
git commit -m "feat(deploy): parametrize image tag in compose.yaml and add validation test"
```

---

### Task 3: Xây Dựng SSH Wrapper & Script Deploy Server Kèm Auto-Rollback

**Files:**
- Create: `deploy/deploy-wrapper.sh`
- Create: `deploy/deploy.sh`
- Test: `lib/deploy-scripts.test.ts`

**Interfaces:**
- Consumes: Tham số `$1` là commit SHA 40 ký tự
- Produces: Script bash an toàn với atomic `.env` write, flock, healthcheck loop, 2-tier rollback

- [ ] **Step 1: Viết test kiểm tra logic regex và cú pháp của wrapper và deploy script**

Tạo `lib/deploy-scripts.test.ts` đọc file script và kiểm tra:
1. `deploy-wrapper.sh` có kiểm tra regex `^deploy [0-9a-f]{40}$` và từ chối các lệnh khác.
2. `deploy.sh` có sử dụng `flock`, ghi file tạm `.env.tmp` trước khi đổi tên sang `.env`, và có logic rollback về `CURRENT_TAG`.

- [ ] **Step 2: Chạy test để xác minh test thất bại**

Run: `npx vitest run lib/deploy-scripts.test.ts`
Expected: FAIL (files chưa tồn tại)

- [ ] **Step 3: Viết `deploy/deploy-wrapper.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Wrapper an toàn cho SSH authorized_keys
# Chỉ chấp nhận lệnh: deploy <40-char-hex-commit-sha>

ORIGINAL_CMD="${SSH_ORIGINAL_COMMAND:-}"

if [[ -z "$ORIGINAL_CMD" ]]; then
  echo "[SECURITY ERROR] No command specified." >&2
  exit 1
fi

if [[ "$ORIGINAL_CMD" =~ ^deploy[[:space:]]+([0-9a-f]{40})$ ]]; then
  TARGET_SHA="${BASH_REMATCH[1]}"
  echo "[SECURITY] Authorized deploy command accepted for SHA: ${TARGET_SHA}"
  exec /home/deploy-canvas/projects/canvas/deploy.sh "${TARGET_SHA}"
else
  echo "[SECURITY REJECTED] Command not allowed: ${ORIGINAL_CMD}" >&2
  exit 1
fi
```

- [ ] **Step 4: Viết `deploy/deploy.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Script deploy với khóa flock, atomic write, healthcheck và rollback 2 lớp
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

CURRENT_TAG="initial"
if [[ -f .env ]]; then
  CURRENT_TAG=$(grep -E '^IMAGE_TAG=' .env | cut -d'=' -f2 || echo "initial")
fi
echo "[INFO] Current running tag: ${CURRENT_TAG}"
echo "[INFO] Deploying new tag: ${NEW_TAG}"

# Ghi nguyên tử tệp .env
echo "IMAGE_TAG=${NEW_TAG}" > .env.tmp
mv .env.tmp .env

# Pull và khởi động container mới
echo "[INFO] Pulling new image from registry..."
if ! docker compose pull; then
  echo "[WARN] Docker compose pull failed! Reverting .env..." >&2
  echo "IMAGE_TAG=${CURRENT_TAG}" > .env.tmp && mv .env.tmp .env
  exit 1
fi

echo "[INFO] Recreating container..."
docker compose up -d --remove-orphans

# Healthcheck loop (10 lần x 3s = 30s)
echo "[INFO] Running healthcheck on http://127.0.0.1:3000/ ..."
HEALTHY=false
for i in $(seq 1 10); do
  sleep 3
  if curl -fsS -o /dev/null http://127.0.0.1:3000/; then
    echo "[INFO] Healthcheck passed on attempt ${i}!"
    HEALTHY=true
    break
  fi
  echo "[INFO] Waiting for service to respond (attempt ${i}/10)..."
done

if [[ "${HEALTHY}" == "true" ]]; then
  echo "[SUCCESS] Deployment of ${NEW_TAG} completed successfully."
  exit 0
fi

# ROLLBACK BẮT BUỘC KHI BẢN MỚI THẤT BẠI
echo "[WARN] New version ${NEW_TAG} failed healthcheck! Starting rollback to ${CURRENT_TAG}..." >&2
echo "IMAGE_TAG=${CURRENT_TAG}" > .env.tmp && mv .env.tmp .env
docker compose up -d --remove-orphans

# Kiểm tra lại bản cũ
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
  echo "[WARN] Rollback to ${CURRENT_TAG} succeeded. Marking pipeline as FAILED." >&2
  exit 1
else
  echo "[CRITICAL] Rollback to ${CURRENT_TAG} ALSO FAILED! Both versions are down!" >&2
  exit 2
fi
```

- [ ] **Step 5: Chạy test xác minh**

Run: `npx vitest run lib/deploy-scripts.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add deploy/deploy-wrapper.sh deploy/deploy.sh lib/deploy-scripts.test.ts
git commit -m "feat(deploy): implement secure SSH wrapper and atomic rollback deploy script"
```

---

### Task 4: Xây Dựng Pipeline `.gitlab-ci.yml` (3 Stages)

**Files:**
- Create: `.gitlab-ci.yml`

**Interfaces:**
- Consumes: GitLab CI Variables (`SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`, `DEPLOY_HOST`, `CI_REGISTRY`)
- Produces: `.gitlab-ci.yml` hoàn chỉnh với các stages `test`, `build`, `deploy`

- [ ] **Step 1: Viết `.gitlab-ci.yml`**

Tạo `.gitlab-ci.yml` chứa:
1. `stages: [test, build, deploy]`.
2. `test`:
   - Image: `node:24-alpine`.
   - Script:
     ```bash
     npm ci
     npm run typecheck
     npx vitest run
     npm run build
     ```
3. `build`:
   - Image builder rootless/an toàn tương thích GitLab Runner.
   - Script: đăng nhập `$CI_REGISTRY`, build và push `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`.
4. `deploy`:
   - Image: `alpine:latest`.
   - `resource_group: production-canvas`.
   - Rules: `if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH`.
   - Before script: thiết lập SSH client với `SSH_PRIVATE_KEY` và `SSH_KNOWN_HOSTS`.
   - Script: `ssh deploy-canvas@$DEPLOY_HOST "deploy $CI_COMMIT_SHA"`.

- [ ] **Step 2: Thêm unit test kiểm tra cú pháp `.gitlab-ci.yml`**

Thêm test trong `lib/deploy-scripts.test.ts` kiểm tra `.gitlab-ci.yml` có chứa:
- `npm run build` trong stage `test`
- `$CI_COMMIT_SHA` trong stage `build`
- `resource_group: production-canvas` trong stage `deploy`
- `deploy $CI_COMMIT_SHA` trong command deploy.

- [ ] **Step 3: Chạy test xác minh**

Run: `npx vitest run lib/deploy-scripts.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add .gitlab-ci.yml lib/deploy-scripts.test.ts
git commit -m "ci: add full .gitlab-ci.yml pipeline configuration"
```

---

### Task 5: Hướng Dẫn Thiết Lập Host & Kịch Bản Nghiệm Thu (Acceptance Testing Guide)

**Files:**
- Create: `deploy/SETUP_GUIDE.md`

**Interfaces:**
- Consumes: Hướng dẫn cấu hình user `deploy-canvas`, GitLab CI/CD Variables, kịch bản test
- Produces: `deploy/SETUP_GUIDE.md`

- [ ] **Step 1: Soạn thảo `deploy/SETUP_GUIDE.md`**

Nội dung chi tiết:
1. Lệnh tạo user `deploy-canvas`, phân quyền thư mục `/home/deploy-canvas/projects/canvas`.
2. Lệnh tạo SSH key pair và gắn wrapper vào `authorized_keys`.
3. Bảng biến GitLab CI/CD Variables cần thêm trên GitLab UI (`Settings` → `CI/CD` → `Variables`).
4. Kịch bản nghiệm thu 1: Happy path push code lên main.
5. Kịch bản nghiệm thu 2: Test bảo mật SSH (thử gọi `ssh ... "ls -la"` xem bị từ chối).
6. Kịch bản nghiệm thu 3: Test rollback có chủ đích (gọi deploy SHA của một image giả lập lỗi).

- [ ] **Step 2: Kiểm tra liên kết và định dạng tài liệu**

Đảm bảo tài liệu rõ ràng, dễ làm theo từng bước trên terminal Ubuntu.

- [ ] **Step 3: Commit**

```bash
git add deploy/SETUP_GUIDE.md
git commit -m "docs(deploy): add host setup guide and acceptance testing scenarios"
```

---

### Task 6: Kiểm Tra Tổng Thể & Xác Nhận Toàn Bộ Test Suite

**Files:**
- Verification: toàn bộ test suite

- [ ] **Step 1: Chạy `npm run typecheck`**

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 2: Chạy toàn bộ unit tests**

Run: `npx vitest run`
Expected: 100% tests pass

- [ ] **Step 3: Chạy production build kiểm tra Next.js export**

Run: `npm run build`
Expected: Export hoàn tất vào thư mục `out/` không lỗi
