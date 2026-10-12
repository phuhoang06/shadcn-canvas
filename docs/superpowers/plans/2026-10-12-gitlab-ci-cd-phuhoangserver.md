# GitLab CI/CD Triển Khai `canvas.musongoku.id.vn` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trọn bộ cấu hình CI/CD trên GitLab Self-Managed (`git.musongoku.id.vn`), tự động kiểm thử (Test + Next.js Build Export), đóng gói Docker Nginx Alpine với tag Full Commit SHA đẩy lên GitLab Container Registry, và tự động triển khai an toàn lên Ubuntu Server `phuhoangserver` (`canvas.musongoku.id.vn`) kèm cơ chế khóa đồng thời, kiểm tra sức khỏe và rollback 2 lớp.

**Architecture:**
- Frontend tĩnh Next.js 16 (`output: "export"`) được đóng gói qua multi-stage Dockerfile sang Nginx Alpine nhẹ (<10MB RAM).
- Pipeline GitLab CI gồm 3 stages: `test` (chạy `npm ci`, `typecheck`, `vitest`, `npm run build`), `build` (chọn builder cụ thể, đóng gói và push image lên Container Registry với tag 40 ký tự hex bất biến `$CI_COMMIT_SHA`), `deploy` (gọi SSH wrapper cố định, khóa tệp qua `flock`, cập nhật nguyên tử `.env`, `docker compose up -d` có bẫy lỗi để rollback nếu up thất bại, kiểm tra HTTP 200 tại `127.0.0.1:3000/`, xử lý riêng kịch bản first-run vs update-rollback).
- An ninh: Không mount docker socket host vào job CI; SSH key chỉ được chạy wrapper kiểm duyệt cú pháp regex `^deploy [0-9a-f]{40}$`, cố định `known_hosts`.
- Kiểm định: Cú pháp và logic của `.gitlab-ci.yml` phải được kiểm tra hợp lệ bằng GitLab CI Lint.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Docker, Docker Compose, Nginx Alpine, GitLab CI/CD, Bash (flock, curl), GitLab CI Lint.

## Global Constraints
- Target host: Ubuntu Server `phuhoangserver` (`192.168.0.100`)
- Registry address: `git.musongoku.id.vn:5050/personal-projects/canvas`
- Web domain: `canvas.musongoku.id.vn` (Cloudflare Tunnel trỏ về `http://127.0.0.1:3000`)
- Production Image tag: `$CI_COMMIT_SHA` (40-char hex full commit SHA, không dùng `latest`)
- Port mapping: Container `80` → Host `127.0.0.1:3000`
- Concurrency control: GitLab `resource_group: production-canvas` và host lock `/home/deploy-canvas/projects/canvas/.deploy.lock`
- Healthcheck endpoint: `http://127.0.0.1:3000/` (tối đa 30s)

---

### Task 1: Xác Minh Hạ Tầng Server & Runner Thực Tế (Preflight Server)

**Files:**
- Create: `deploy/SERVER_PREFLIGHT.md`

**Interfaces:**
- Consumes: Môi trường Ubuntu Server `phuhoangserver` (`192.168.0.100`), GitLab Runner, Registry, Cloudflare Tunnel
- Produces: `deploy/SERVER_PREFLIGHT.md` chứa tài liệu checklist & tập lệnh kiểm tra hiện trạng không làm thay đổi cấu hình máy chủ

- [ ] **Step 1: Soạn thảo checklist và script kiểm tra tiền trạm**

Tạo `deploy/SERVER_PREFLIGHT.md` gồm các lệnh kiểm tra:
1. **GitLab Container Registry**: Kiểm tra phản hồi TLS tại `https://git.musongoku.id.vn:5050/v2/`.
2. **GitLab Runner**: Kiểm tra executor trong `/etc/gitlab-runner/config.toml` (Docker executor, cấu hình TLS, mạng nội bộ kết nối tới Registry và Host).
3. **Cổng mạng & Dịch vụ**: Xác minh cổng `127.0.0.1:3000` đang mở/chưa bị chiếm dụng (`ss -tulpn | grep 3000`).
4. **Cloudflare Tunnel**: Xác minh ingress rule cho `canvas.musongoku.id.vn` trỏ về `http://127.0.0.1:3000`.
5. **Docker Daemon**: Kiểm tra phiên bản Docker, compose plugin v2 (`docker compose version`).

- [ ] **Step 2: Rà soát tài liệu để loại bỏ placeholder**

Đảm bảo mọi lệnh shell đều có cú pháp chuẩn và chú thích rõ ràng mục tiêu kiểm tra.

- [ ] **Step 3: Commit**

```bash
git add deploy/SERVER_PREFLIGHT.md
git commit -m "docs(deploy): add preflight verification guide for server and runner"
```

---

### Task 2: Chuẩn Hóa Dockerfile & Docker Compose Cho Production

**Files:**
- Modify: `Dockerfile`
- Modify: `deploy/compose.yaml`
- Test: `lib/deploy.test.ts`

**Interfaces:**
- Consumes: Next.js static export `out/`, `deploy/nginx.conf`
- Produces: Dockerfile tối ưu multi-stage, `deploy/compose.yaml` hỗ trợ `${IMAGE_TAG}` và `${REGISTRY_IMAGE}`

- [ ] **Step 1: Viết test kiểm tra cấu trúc Docker Compose & Dockerfile**

Tạo `lib/deploy.test.ts` kiểm tra:
1. `Dockerfile` có builder (`node:24-alpine`) chạy `npm run build` và runner (`nginx:alpine`) sao chép `out/` sang `/usr/share/nginx/html`.
2. `deploy/compose.yaml` nhận biến `${IMAGE_TAG}` và map cổng `127.0.0.1:3000:80`.
3. Kiểm tra container healthcheck định kỳ 10s.

- [ ] **Step 2: Chạy test để xác minh test thất bại**

Run: `npx vitest run lib/deploy.test.ts`
Expected: FAIL

- [ ] **Step 3: Cập nhật `deploy/compose.yaml`**

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

- [ ] **Step 4: Chạy test xác minh**

Run: `npx vitest run lib/deploy.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Dockerfile deploy/compose.yaml lib/deploy.test.ts
git commit -m "feat(deploy): update compose.yaml with dynamic IMAGE_TAG and add validation test"
```

---

### Task 3: Xây Dựng SSH Wrapper & Script Deploy Với Bẫy Lỗi & Rollback Đầy Đủ

**Files:**
- Create: `deploy/deploy-wrapper.sh`
- Create: `deploy/deploy.sh`
- Test: `lib/deploy-scripts.test.ts`

**Interfaces:**
- Consumes: Tham số `$1` là full commit SHA 40 ký tự hex
- Produces: Script bash xử lý an toàn: bắt lỗi cả khi `docker compose up -d` sập, xử lý riêng first-run, atomic env write, flock, healthcheck loop, 2-tier rollback

- [ ] **Step 1: Viết test kiểm tra cú pháp và logic script**

Trong `lib/deploy-scripts.test.ts`, viết các test case:
1. `deploy-wrapper.sh` từ chối các chuỗi không phải `deploy <40-hex-chars>`.
2. `deploy.sh` bắt lỗi `docker compose up -d` (không bị `set -e` thoát đột ngột làm mất nhánh rollback).
3. `deploy.sh` nhận biết kịch bản First-run (không có `CURRENT_TAG` hợp lệ thì dừng an toàn thay vì rollback về tag ảo `initial`).
4. `deploy.sh` dùng `flock` và atomic file write (`.env.tmp` → `.env`).

- [ ] **Step 2: Chạy test để xác minh test thất bại**

Run: `npx vitest run lib/deploy-scripts.test.ts`
Expected: FAIL

- [ ] **Step 3: Viết `deploy/deploy-wrapper.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Wrapper bảo mật gắn trong authorized_keys:
# command="/home/deploy-canvas/bin/deploy-wrapper.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 ...

ORIGINAL_CMD="${SSH_ORIGINAL_COMMAND:-}"

if [[ -z "${ORIGINAL_CMD}" ]]; then
  echo "[SECURITY ERROR] No command specified." >&2
  exit 1
fi

if [[ "${ORIGINAL_CMD}" =~ ^deploy[[:space:]]+([0-9a-f]{40})$ ]]; then
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

# Ghi nguyên tử tệp .env
echo "IMAGE_TAG=${NEW_TAG}" > .env.tmp
mv .env.tmp .env

# Pull image mới
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
```

- [ ] **Step 5: Chạy test xác minh**

Run: `npx vitest run lib/deploy-scripts.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add deploy/deploy-wrapper.sh deploy/deploy.sh lib/deploy-scripts.test.ts
git commit -m "feat(deploy): implement robust deploy script with up trap and first-run handling"
```

---

### Task 4: Xây Dựng `.gitlab-ci.yml` & Kiểm Tra Bằng GitLab CI Lint

**Files:**
- Create: `.gitlab-ci.yml`
- Test: `lib/deploy-ci.test.ts`

**Interfaces:**
- Consumes: GitLab CI Variables, GitLab CI Lint API
- Produces: `.gitlab-ci.yml` chuẩn hóa 3 stages `test`, `build`, `deploy` đã qua kiểm định CI Lint

- [ ] **Step 1: Viết cấu hình `.gitlab-ci.yml`**

Xác định builder cụ thể: Dùng **Kaniko executor** (`gcr.io/kaniko-project/executor:v1.23.2-debug`) - công cụ chuẩn của GitLab cho môi trường containerized Docker executor không cần daemon/privileged:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE_NAME: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"

# ====================================================================
# STAGE 1: TEST (Node 24, Typecheck, Unit Test, Next.js Build Export)
# ====================================================================
test:
  stage: test
  image: node:24-alpine
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - .npm/
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - npm run typecheck
    - npx vitest run
    - npm run build

# ====================================================================
# STAGE 2: BUILD & PUSH (Kaniko Rootless Builder)
# ====================================================================
build:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:v1.23.2-debug
    entrypoint: [""]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  before_script:
    - mkdir -p /kaniko/.docker
    - echo "{\"auths\":{\"$CI_REGISTRY\":{\"username\":\"$CI_REGISTRY_USER\",\"password\":\"$CI_REGISTRY_PASSWORD\"}}}" > /kaniko/.docker/config.json
  script:
    - /kaniko/executor
      --context "${CI_PROJECT_DIR}"
      --dockerfile "${CI_PROJECT_DIR}/Dockerfile"
      --destination "${DOCKER_IMAGE_NAME}"
      --cache=true

# ====================================================================
# STAGE 3: DEPLOY (SSH Wrapper & Rollback Engine)
# ====================================================================
deploy:
  stage: deploy
  image: alpine:latest
  resource_group: production-canvas
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - chmod 600 "${SSH_PRIVATE_KEY}"
    - ssh-add "${SSH_PRIVATE_KEY}"
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - cp "${SSH_KNOWN_HOSTS}" ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
  script:
    - ssh deploy-canvas@"${DEPLOY_HOST}" "deploy ${CI_COMMIT_SHA}"
```

- [ ] **Step 2: Viết test kiểm tra cấu trúc `.gitlab-ci.yml` và kiểm tra CI Lint**

Tạo `lib/deploy-ci.test.ts` kiểm tra:
1. File `.gitlab-ci.yml` tồn tại và định dạng YAML hợp lệ.
2. Có đủ 3 stages `test`, `build`, `deploy`.
3. Stage `test` chứa `npm run build`.
4. Stage `build` sử dụng biến tag `$CI_COMMIT_SHA`.
5. Stage `deploy` có `resource_group: production-canvas` và gọi `deploy ${CI_COMMIT_SHA}`.
6. Hướng dẫn tích hợp kiểm tra CI Lint qua GitLab API (`POST /api/v4/ci/lint`).

- [ ] **Step 3: Chạy test xác minh**

Run: `npx vitest run lib/deploy-ci.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add .gitlab-ci.yml lib/deploy-ci.test.ts
git commit -m "ci: create .gitlab-ci.yml with Kaniko builder and deploy stage"
```

---

### Task 5: Soạn Thảo Hướng Dẫn Cấu Hình Server & Kịch Bản Nghiệm Thu (Acceptance Guide)

**Files:**
- Create: `deploy/SETUP_GUIDE.md`

**Interfaces:**
- Consumes: Cấu hình user `deploy-canvas`, GitLab CI/CD Variables, kịch bản nghiệm thu thực tế
- Produces: `deploy/SETUP_GUIDE.md` hoàn chỉnh

- [ ] **Step 1: Viết tài liệu `deploy/SETUP_GUIDE.md`**

Bao gồm:
1. **Thiết lập User & Phân quyền trên Host**:
   ```bash
   sudo useradd -m -s /bin/bash deploy-canvas
   sudo usermod -aG docker deploy-canvas
   sudo mkdir -p /home/deploy-canvas/bin /home/deploy-canvas/projects/canvas
   sudo chown -R deploy-canvas:deploy-canvas /home/deploy-canvas
   ```
2. **Cài đặt SSH Wrapper & Khóa Lệnh**:
   - Copy `deploy/deploy-wrapper.sh` vào `/home/deploy-canvas/bin/deploy-wrapper.sh`.
   - Copy `deploy/deploy.sh` và `deploy/compose.yaml` vào `/home/deploy-canvas/projects/canvas/`.
   - Cấu hình `authorized_keys` với tiền tố `command="/home/deploy-canvas/bin/deploy-wrapper.sh",no-pty...`.
3. **Cấu hình GitLab CI/CD Variables**:
   - `SSH_PRIVATE_KEY` (File, Protected, Masked)
   - `SSH_KNOWN_HOSTS` (File, Protected)
   - `DEPLOY_HOST` (`192.168.0.100` hoặc IP host mà runner truy cập được)
4. **Kịch bản nghiệm thu (Acceptance Tests)**:
   - *Test 1 (Bảo mật SSH)*: Chạy lệnh `ssh deploy-canvas@host "ls -la"` → Kỳ vọng: Bị từ chối `[SECURITY REJECTED]`.
   - *Test 2 (Deploy bình thường)*: Gọi `deploy <sha-hop-le>` → Kỳ vọng: HTTP 200 tại `127.0.0.1:3000`.
   - *Test 3 (Rollback có chủ đích)*: Triển khai một image giả lập lỗi cổng/healthcheck → Kỳ vọng: Script tự động khôi phục bản cũ, website không gián đoạn, pipeline báo đỏ.

- [ ] **Step 2: Rà soát tài liệu**

- [ ] **Step 3: Commit**

```bash
git add deploy/SETUP_GUIDE.md
git commit -m "docs(deploy): add host setup guide, SSH hardening and acceptance testing procedures"
```

---

### Task 6: Kiểm Tra Toàn Diện Hệ Thống (Verification Before Completion)

**Files:**
- All project files

**Interfaces:**
- Consumes: Toàn bộ mã nguồn và test suite
- Produces: Báo cáo xác minh 100% không lỗi

- [ ] **Step 1: Kiểm tra typecheck**

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 2: Chạy toàn bộ unit tests**

Run: `npx vitest run`
Expected: 100% tests pass

- [ ] **Step 3: Kiểm tra production build export**

Run: `npm run build`
Expected: Thành công tạo thư mục `out/`
