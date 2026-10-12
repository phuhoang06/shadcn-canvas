# Thiết Kế Chi Tiết Kiến Trúc CI/CD GitLab Cho `canvas.musongoku.id.vn`

**Ngày lập**: 12/10/2026 (Cập nhật phiên bản chốt kiến trúc)  
**Dự án**: `shadcn-canvas` (`canvas`)  
**Hạ tầng**: GitLab Self-Managed (`git.musongoku.id.vn`) trên Ubuntu Server `phuhoangserver` (`192.168.0.100`)

---

## 1. Bối cảnh & Mục tiêu

- **Mục tiêu**: Xây dựng quy trình CI/CD tự động hóa chuẩn DevOps cho ứng dụng `canvas`, quản lý mã nguồn, build image, lưu trữ trên GitLab Container Registry và tự động triển khai tới máy chủ với cơ chế kiểm tra sức khỏe (Healthcheck) và khôi phục tức thì (Auto-Rollback).
- **Mô hình ứng dụng**: Next.js 16 tĩnh (`output: "export"`, xuất file tĩnh ra thư mục `out/`), phục vụ bằng **Nginx Alpine** siêu nhẹ trong Docker container (<10MB RAM).
- **Mạng & Định tuyến**:
  - Container xuất cổng `80` nội bộ, ánh xạ tới `127.0.0.1:3000` trên máy chủ host.
  - Cloudflare Tunnel định tuyến domain `canvas.musongoku.id.vn` về `http://127.0.0.1:3000`.
  - Không mở trực tiếp cổng container ra Internet công cộng.

---

## 2. Kiến trúc Luồng CI/CD (Pipeline Flow)

```
[Git Push to main]
        ↓
[Stage: test]
  ├── npm ci
  ├── npm run typecheck (tsc --noEmit)
  ├── npx vitest run (768/768 unit & integration tests)
  └── npm run build (Xác minh xuất static site out/ thành công trước khi đóng gói)
        ↓
[Stage: build]
  ├── Builder an toàn (Xác minh Runner executor: Rootless BuildKit / buildx không privileged)
  ├── Tag bất biến: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA (40 ký tự hex full commit SHA)
  └── Push lên GitLab Container Registry (git.musongoku.id.vn:5050)
        ↓
[Stage: deploy] (Protected branch `main`, resource_group: production-canvas)
  ├── Kết nối SSH bảo mật (SSH Private Key File + fixed SSH_KNOWN_HOSTS)
  ├── Gửi lệnh nghiêm ngặt: ssh deploy-canvas@host "deploy $CI_COMMIT_SHA"
  ├── SSH wrapper trên server (/home/deploy-canvas/bin/deploy-wrapper.sh) thẩm định cú pháp
  ├── Gọi /home/deploy-canvas/projects/canvas/deploy.sh
  ├── Khóa tệp triển khai (.deploy.lock qua flock)
  ├── Ghi nhận CURRENT_TAG đang chạy từ .env
  ├── Ghi nguyên tử NEW_TAG qua file tạm (.env.tmp → mv .env)
  ├── docker compose pull, docker compose up -d --remove-orphans
  ├── Healthcheck loop: curl http://127.0.0.1:3000/ (tối đa 10 lần x 3s = 30s)
  └── Cơ chế Rollback 2 lớp:
        ├── Thành công: Giữ nguyên bản mới, hoàn tất pipeline.
        └── Thất bại: Tự động revert về CURRENT_TAG, chạy lại healthcheck (15s).
            ├── Rollback thành công: Báo pipeline lỗi (exit 1) để cảnh báo.
            └── Rollback thất bại: Báo lỗi nghiêm trọng CRITICAL FAILURE (exit 2).
```

---

## 3. Chi tiết Cấu hình Kỹ thuật

### 3.1. Pipeline `.gitlab-ci.yml`

1. **Stage `test`**:
   - Chạy trên image `node:24-alpine`.
   - Lưu trữ cache `node_modules/` và `.next/cache/` theo hash của `package-lock.json`.
   - Bắt buộc chạy đủ 4 bước: `npm ci`, `npm run typecheck`, `npx vitest run`, và **`npm run build`** (đảm bảo việc render tĩnh các trang không phát sinh lỗi).
2. **Stage `build`**:
   - Xác minh môi trường GitLab Runner thực tế để chọn builder phù hợp (ưu tiên Rootless BuildKit/buildx không cần quyền privileged trên host).
   - Đóng gói Docker image và gắn tag bằng **Full Commit SHA** (`$CI_COMMIT_SHA` - 40 ký tự hex bất biến).
   - Đăng nhập và đẩy image lên GitLab Container Registry (`git.musongoku.id.vn:5050/personal-projects/canvas:$CI_COMMIT_SHA`).
3. **Stage `deploy`**:
   - Thiết lập `resource_group: production-canvas` để GitLab tự động xếp hàng nếu có 2 pipeline deploy cùng lúc, ngăn chặn xung đột trạng thái deploy.
   - Xác thực SSH chặt chẽ:
     - Private key lấy từ GitLab CI Variable `SSH_PRIVATE_KEY` (loại File, Protected, Masked).
     - Host key được cố định trong `SSH_KNOWN_HOSTS` (Protected Variable), không dùng `ssh-keyscan` tùy tiện nhằm chống tấn công Man-In-The-Middle.
     - Lệnh gọi SSH chỉ gửi đúng cú pháp: `ssh ... deploy-canvas@$DEPLOY_HOST "deploy $CI_COMMIT_SHA"`.

---

### 3.2. Cấu hình Docker & Docker Compose (`deploy/compose.yaml`)

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

- Image tag được cấu hình động thông qua biến `${IMAGE_TAG}`, đọc từ file `.env` cục bộ do script deploy tạo ra.

---

### 3.3. Bảo Mật SSH Wrapper & Script Deploy

#### A. SSH Wrapper Cố Định (`/home/deploy-canvas/bin/deploy-wrapper.sh`)
Trong tệp `~/.ssh/authorized_keys` của user `deploy-canvas`:
```
command="/home/deploy-canvas/bin/deploy-wrapper.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAAC3...
```
Wrapper thực hiện kiểm tra bảo mật nghiêm ngặt:
- Kiểm tra `$SSH_ORIGINAL_COMMAND` có khớp chính xác regex `^deploy [0-9a-f]{40}$` hay không.
- Nếu không khớp (chứa ký tự lạ, cố gắng tiêm lệnh shell, hoặc không đúng 40 ký tự hex): **từ chối ngay lập tức và ghi log bảo mật (exit 1)**.
- Nếu khớp: trích xuất SHA và gọi `/home/deploy-canvas/projects/canvas/deploy.sh "$COMMIT_SHA"`.

#### B. Script Triển Khai (`/home/deploy-canvas/projects/canvas/deploy.sh`)
Đồng bộ từ `deploy/deploy.sh` trong repo:
1. **Khóa tiến trình**:
   - Sử dụng `flock` trên file `/home/deploy-canvas/projects/canvas/.deploy.lock`.
2. **Quản lý biến và tag an toàn (Atomic File Write)**:
   - Đọc `CURRENT_TAG` hiện tại từ `.env`.
   - Nhận `NEW_TAG` từ tham số dòng lệnh `$1`.
   - Ghi ra tệp tạm `.env.tmp` với `IMAGE_TAG=$NEW_TAG`, sau đó thực hiện `mv .env.tmp .env` nguyên tử để tránh lỗi mất cấu hình giữa chừng.
3. **Triển khai phiên bản mới**:
   - `docker compose pull` tải image về từ Registry.
   - `docker compose up -d --remove-orphans`.
4. **Kiểm tra sức khỏe (Healthcheck)**:
   - Thử gửi request `curl -fsS -o /dev/null http://127.0.0.1:3000/` mỗi 3 giây, tối đa 10 lần (30 giây).
5. **Cơ chế Rollback và Báo cáo trạng thái**:
   - Nếu bản mới không phản hồi sau 30 giây:
     - Log cảnh báo: `[WARN] Bản mới ${NEW_TAG} không phản hồi! Đang tiến hành rollback về ${CURRENT_TAG}...`
     - Ghi lại `IMAGE_TAG=$CURRENT_TAG` qua file tạm vào `.env`.
     - Chạy lại `docker compose up -d`.
     - Kiểm tra healthcheck của bản cũ trong 15 giây.
     - Nếu bản cũ phục hồi thành công: log `[INFO] Đã khôi phục an toàn phiên bản ${CURRENT_TAG}.` và kết thúc với `exit 1` (để Pipeline báo đỏ cảnh báo cho developer).
     - Nếu bản cũ cũng không lên: log `[CRITICAL] Rollback thất bại! Cần can thiệp khẩn cấp.` và kết thúc với `exit 2`.

---

## 4. Bảo Mật & Phân Quyền Trên `phuhoangserver`

1. **Rủi ro nhóm `docker`**:
   - User `deploy-canvas` thuộc group `docker` nhưng **bị khóa cứng bởi SSH wrapper** (`deploy-wrapper.sh`), không có shell tương tác (`no-pty`), không thể thực thi lệnh tùy ý trên hệ thống.
2. **Bảo mật Bí mật (Secrets)**:
   - `SSH_PRIVATE_KEY`: File type, Protected, Masked trong GitLab Variables.
   - `SSH_KNOWN_HOSTS`: File/Variable được ghim cố định trước.
   - `DEPLOY_HOST`: Địa chỉ IP/Hostname mà Runner container có thể định tuyến được tới host.

---

## 5. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. **Kiểm thử Pipeline Bình thường (Happy Path)**:
   - Git push commit lên `main` ➔ Stage `test` chạy pass (Typecheck, Vitest, Next.js build export).
   - Stage `build` push image với tag 40 ký tự hex lên Registry thành công.
   - Stage `deploy` SSH kích hoạt script, ứng dụng được cập nhật và trả về HTTP 200 tại `http://127.0.0.1:3000/`.
2. **Kiểm thử Rollback có chủ đích (Negative Test)**:
   - Giả lập triển khai một image lỗi (không pass healthcheck).
   - Xác nhận script tự động rollback về bản SHA cũ đang chạy ổn định.
   - Xác nhận website vẫn sống với bản cũ và pipeline GitLab báo đỏ thất bại (`exit 1`).
3. **Kiểm thử Bảo mật SSH (Security Test)**:
   - Dùng SSH key thử gửi lệnh tùy ý (ví dụ: `ssh deploy-canvas@host "ls -la"` hoặc `ssh deploy-canvas@host "rm -rf"`).
   - Xác nhận SSH wrapper từ chối ngay lập tức và không thực thi lệnh.
