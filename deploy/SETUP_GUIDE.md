# Hướng Dẫn Thiết Lập Host & Quy Trình Nghiệm Thu (Acceptance Testing Guide)

Tài liệu này hướng dẫn chi tiết từng bước thiết lập trên máy chủ `phuhoangserver` (`192.168.0.100`) và GitLab để đưa hệ thống CI/CD vào hoạt động an toàn, cùng các kịch bản nghiệm thu kiểm thử bắt buộc.

---

## 1. Thiết Lập Tài Khoản & Phân Quyền Trên Ubuntu Server

Đăng nhập vào `phuhoangserver` qua SSH (với user quản trị) và chạy các lệnh sau:

```bash
# 1. Tạo user riêng biệt deploy-canvas
sudo useradd -m -s /bin/bash deploy-canvas
sudo usermod -aG docker deploy-canvas

# 2. Tạo cấu trúc thư mục
sudo mkdir -p /home/deploy-canvas/bin
sudo mkdir -p /home/deploy-canvas/projects/canvas
sudo mkdir -p /home/deploy-canvas/.ssh
sudo chmod 700 /home/deploy-canvas/.ssh

# 3. Sao chép các tệp script và compose từ repo sang máy chủ
sudo cp deploy/deploy-wrapper.sh /home/deploy-canvas/bin/deploy-wrapper.sh
sudo cp deploy/deploy.sh /home/deploy-canvas/projects/canvas/deploy.sh
sudo cp deploy/compose.yaml /home/deploy-canvas/projects/canvas/compose.yaml

# 4. Phân quyền thực thi và quyền sở hữu
sudo chmod +x /home/deploy-canvas/bin/deploy-wrapper.sh
sudo chmod +x /home/deploy-canvas/projects/canvas/deploy.sh
sudo chown -R deploy-canvas:deploy-canvas /home/deploy-canvas
```

---

## 2. Tạo SSH Key Pair & Khóa Lệnh Qua Wrapper

```bash
# 1. Tạo cặp SSH key chuyên dụng (không đặt passphrase cho deploy key)
sudo -u deploy-canvas ssh-keygen -t ed25519 -f /home/deploy-canvas/.ssh/id_ed25519_deploy -N "" -C "gitlab-ci-canvas"

# 2. Lấy nội dung public key
PUB_KEY=$(sudo cat /home/deploy-canvas/.ssh/id_ed25519_deploy.pub)

# 3. Gắn wrapper vào authorized_keys với quyền tối thiểu (không cho mở shell tùy ý)
echo "command=\"/home/deploy-canvas/bin/deploy-wrapper.sh\",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ${PUB_KEY}" | sudo tee /home/deploy-canvas/.ssh/authorized_keys
sudo chmod 600 /home/deploy-canvas/.ssh/authorized_keys
sudo chown -R deploy-canvas:deploy-canvas /home/deploy-canvas/.ssh
```

---

## 3. Cấu Hình Biến Bí Mật Trên GitLab (CI/CD Variables)

Truy cập giao diện GitLab: `personal-projects/canvas` ➔ **Settings** ➔ **CI/CD** ➔ **Variables** ➔ **Add variable**:

| Tên biến | Loại (Type) | Cờ (Flags) | Giá trị (Value) |
| :--- | :--- | :--- | :--- |
| `SSH_PRIVATE_KEY` | **File** | Protected, Masked | Nội dung tệp `/home/deploy-canvas/.ssh/id_ed25519_deploy` |
| `SSH_KNOWN_HOSTS` | **File** | Protected | Kết quả chạy `ssh-keyscan -H 192.168.0.100` (được rà soát trước) |
| `DEPLOY_HOST` | **Variable** | Protected | `192.168.0.100` (hoặc IP host mà container Runner truy cập được) |

---

## 4. Kiểm Tra Hợp Lệ Của Pipeline Bằng GitLab CI Lint

Trước khi kích hoạt pipeline lần đầu, kiểm tra tính hợp lệ cú pháp và logic của `.gitlab-ci.yml`:

```bash
# Cách 1: Sử dụng giao diện GitLab Web
# Truy cập: https://git.musongoku.id.vn/personal-projects/canvas/-/ci/lint
# Dán nội dung .gitlab-ci.yml và nhấn "Validate".
# Kỳ vọng: "Status: Syntax is correct"

# Cách 2: Sử dụng API GitLab từ terminal
curl --header "PRIVATE-TOKEN: <your-token>" \
     --header "Content-Type: application/json" \
     --data '{"content": "'$(cat .gitlab-ci.yml | jq -Rs .)'"}' \
     https://git.musongoku.id.vn/api/v4/ci/lint | jq .
```

---

## 5. Quy Trình Nghiệm Thu & Kiểm Thử Thực Tế (Acceptance Testing)

### 🧪 Kịch bản 1: Kiểm thử bảo mật SSH (Security Hardening Test)
Mục tiêu: Đảm bảo SSH deploy key không thể bị lợi dụng để chạy lệnh tùy ý trên server.

```bash
# Thử chạy lệnh shell bất kỳ bằng deploy key:
ssh -i /path/to/id_ed25519_deploy deploy-canvas@192.168.0.100 "ls -la"

# Kết quả kỳ vọng:
# [SECURITY REJECTED] Command not allowed: ls -la
# Lệnh bị từ chối với exit code 1.
```

### 🧪 Kịch bản 2: Kiểm thử triển khai thông thường (Happy Path)
1. Thực hiện push một commit thay đổi giao diện lên nhánh `main`.
2. Kiểm tra giao diện Pipeline trên GitLab:
   - `test`: pass cả typecheck, Vitest và `npm run build`.
   - `build`: Kaniko đóng gói image và push thành công `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`.
   - `deploy`: SSH gửi `deploy <commit-sha>`, log hiển thị `[SUCCESS] Deployment completed successfully`.
3. Kiểm tra website trên trình duyệt: `https://canvas.musongoku.id.vn` phản hồi bình thường.

### 🧪 Kịch bản 3: Kiểm thử Rollback có chủ đích (Negative Test)
Mục tiêu: Xác nhận script tự động cứu vãn dịch vụ khi bản build mới bị lỗi runtime.

```bash
# Giả lập trên server bằng cách gọi deploy một tag image không tồn tại hoặc lỗi healthcheck:
sudo -u deploy-canvas /home/deploy-canvas/bin/deploy-wrapper.sh "deploy 0000000000000000000000000000000000000000"

# Kết quả kỳ vọng:
# 1. Script phát hiện pull lỗi hoặc container không pass healthcheck trong 30s.
# 2. Script in log: "[WARN] New version failed verification! Rolling back to previous stable tag..."
# 3. Khôi phục lại CURRENT_TAG vào .env và chạy lại docker compose up -d.
# 4. Kiểm tra lại bản cũ và thông báo: "[WARN] Rollback succeeded. Marking deployment as FAILED for pipeline alert."
# 5. Thoát với exit code 1 (Pipeline GitLab báo đỏ cảnh báo, nhưng website thực tế vẫn hoạt động trên bản cũ).
```
