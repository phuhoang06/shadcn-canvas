# Thiết Kế Chi Tiết Kiến Trúc CI/CD GitLab Cho `canvas.musongoku.id.vn`

**Ngày lập**: 12/10/2026  
**Dự án**: `shadcn-canvas` (`canvas`)  
**Hạ tầng**: GitLab Self-Managed (`git.musongoku.id.vn`) trên Ubuntu Server `phuhoangserver` (`192.168.0.100`)

---

## 1. Bối cảnh & Mục tiêu

- **Mục tiêu**: Xây dựng quy trình CI/CD tự động hóa chuẩn DevOps cho ứng dụng `canvas`, quản lý mã nguồn, build image, lưu trữ trên GitLab Container Registry và tự động triển khai tới máy chủ với cơ chế kiểm tra sức khỏe (Healthcheck) và khôi phục tức thì (Auto-Rollback).
- **Mô hình ứng dụng**: Next.js 16 tĩnh (`output: "export"`, xuất file tĩnh ra thư mục `out/`), phục vụ bằng **Nginx Alpine** siêu nhẹ trong Docker container.
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
  └── npm run build (Xác minh xuất static site out/ thành công)
        ↓
[Stage: build]
  ├── Multi-stage Dockerfile (Node.js 24 builder → Nginx Alpine runner)
  ├── Builder an toàn (Rootless builder / Docker-in-Docker an toàn không privileged host)
  ├── Tag bất biến: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA (KHÔNG dùng latest)
  └── Push lên GitLab Container Registry (git.musongoku.id.vn:5050)
        ↓
[Stage: deploy] (Protected branch `main`, Resource Group khóa pipeline song song)
  ├── Kết nối SSH bảo mật (SSH Private Key File + fixed SSH_KNOWN_HOSTS)
  ├── Gọi script deploy trên server với tham số NEW_TAG=$CI_COMMIT_SHORT_SHA
  ├── Khóa tệp triển khai (Flock / deploy.lock)
  ├── Ghi nhận CURRENT_TAG đang chạy
  ├── Cập nhật .env, docker compose pull, docker compose up -d
  ├── Healthcheck loop: curl http://127.0.0.1:3000/ (tối đa 30s)
  └── Cơ chế Rollback 2 lớp:
        ├── Thành công: Giữ nguyên bản mới, hoàn tất pipeline.
        └── Thất bại: Tự động revert về CURRENT_TAG, chạy lại healthcheck.
            ├── Rollback thành công: Báo pipeline lỗi (exit 1) để cảnh báo.
            └── Rollback thất bại: Báo lỗi nghiêm trọng CRITICAL FAILURE (exit 2).
```

---

## 3. Chi tiết Cấu hình Kỹ thuật

### 3.1. Pipeline `.gitlab-ci.yml`

1. **Stage `test`**:
   - Chạy trên image `node:24-alpine`.
   - Lưu trữ cache `node_modules/` và `.next/cache/` theo hash của `package-lock.json`.
   - Bắt buộc chạy đủ 4 bước: `npm ci`, `npm run typecheck`, `npx vitest run`, và **`npm run build`** (xác minh quá trình build static export của Next.js hoàn tất trọn vẹn).
2. **Stage `build`**:
   - Sử dụng tag `$CI_COMMIT_SHORT_SHA` để đảm bảo tính bất biến (immutability).
   - Tương thích tốt với GitLab Runner, đăng nhập registry tự động qua biến môi trường của GitLab (`$CI_REGISTRY_USER`, `$CI_REGISTRY_PASSWORD`, `$CI_REGISTRY`).
3. **Stage `deploy`**:
   - Thiết lập `resource_group: production-canvas` để GitLab tự động xếp hàng nếu có 2 pipeline deploy cùng lúc, ngăn chặn xung đột trạng thái deploy.
   - Xác thực SSH chặt chẽ:
     - Private key lấy từ GitLab CI Variable `SSH_PRIVATE_KEY` (loại File, Protected, Masked).
     - Host key được cố định trong `SSH_KNOWN_HOSTS` (Protected Variable), không dùng `ssh-keyscan` tùy tiện nhằm chống tấn công Man-In-The-Middle.
     - Xác định đúng địa chỉ mạng `DEPLOY_SERVER_HOST`: nếu Runner là container trên cùng máy, cấu hình định tuyến IP LAN (`192.168.0.100`) hoặc gateway bridge docker.

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

### 3.3. Script Deploy An Toàn (`deploy/deploy.sh`)

Script triển khai trên server (`/home/deploy-canvas/projects/canvas/deploy.sh`) tuân thủ nghiêm ngặt các nguyên tắc:

1. **Khóa tiến trình**:
   - Sử dụng `flock` trên file `/home/deploy-canvas/projects/canvas/.deploy.lock` để bảo đảm tính đơn nguyên (atomic), không để 2 lần deploy chạy song song trên host.
2. **Quản lý biến và tag**:
   - Đọc `CURRENT_TAG` hiện tại từ `.env` trước khi có bất kỳ thay đổi nào.
   - Nhận `NEW_TAG` từ tham số dòng lệnh `$1`. Nếu thiếu tham số, dừng ngay lập tức.
3. **Triển khai phiên bản mới**:
   - Ghi `IMAGE_TAG=$NEW_TAG` vào `.env`.
   - Chạy `docker compose pull` để tải image từ Registry.
   - Chạy `docker compose up -d --remove-orphans`.
4. **Kiểm tra sức khỏe (Healthcheck)**:
   - Thử gửi request `curl -fsS -o /dev/null http://127.0.0.1:3000/` mỗi 3 giây, tối đa 10 lần (30 giây).
   - Kiểm tra mã phản hồi HTTP 200.
5. **Cơ chế Rollback và Báo cáo trạng thái**:
   - Nếu bản mới không phản hồi sau 30 giây:
     - Ghi log cảnh báo: `[WARN] Bản mới ${NEW_TAG} không phản hồi! Đang tiến hành rollback về ${CURRENT_TAG}...`
     - Ghi lại `IMAGE_TAG=$CURRENT_TAG` vào `.env`.
     - Chạy lại `docker compose up -d`.
     - Tiếp tục kiểm tra healthcheck của bản cũ trong 15 giây.
     - Nếu bản cũ phục hồi thành công: log `[INFO] Đã khôi phục an toàn phiên bản ${CURRENT_TAG}.` và kết thúc với `exit 1` (để Pipeline báo đỏ cảnh báo cho developer).
     - Nếu bản cũ cũng không lên: log `[CRITICAL] Rollback thất bại! Cần can thiệp khẩn cấp.` và kết thúc với `exit 2`.

---

## 4. Bảo mật & Phân quyền trên `phuhoangserver`

1. **Rủi ro nhóm `docker`**:
   - Nhóm `docker` có quyền tương đương root trên host.
   - Biện pháp giảm thiểu:
     - Tạo user riêng biệt: `deploy-canvas`.
     - Phân quyền thư mục: Chỉ cấp quyền sở hữu tại `/home/deploy-canvas/projects/canvas`.
     - Giới hạn lệnh SSH: Trong `~/.ssh/authorized_keys`, có thể cấu hình `command="/home/deploy-canvas/projects/canvas/deploy.sh $SSH_ORIGINAL_COMMAND"` để SSH key chỉ được phép chạy duy nhất script deploy, không cho phép mở terminal tùy ý.
2. **Bảo mật Bí mật (Secrets)**:
   - Không commit tệp `.env` chứa bí mật vào git.
   - SSH Private Key được lưu trong GitLab Protected Variable, chỉ nhánh `main` mới có quyền truy cập.

---

## 5. Kế hoạch Thực hiện (Milestones)

1. **Mốc 1**: Chuẩn hóa `Dockerfile`, `deploy/compose.yaml` và kiểm thử build local.
2. **Mốc 2**: Xây dựng script `deploy/deploy.sh` hỗ trợ lock, healthcheck, và rollback 2 lớp.
3. **Mốc 3**: Xây dựng file `.gitlab-ci.yml` chuẩn hóa 3 stages: `test` (với cả `npm run build`), `build` và `deploy`.
4. **Mốc 4**: Hướng dẫn cấu hình GitLab CI/CD Variables, quyền SSH và kiểm thử quy trình thực tế.
