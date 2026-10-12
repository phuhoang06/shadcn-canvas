# Hướng Dẫn Kiểm Tra Tiền Trạm Máy Chủ (Server Preflight Checklist)

Tài liệu này cung cấp các lệnh kiểm tra trạng thái thực tế của máy chủ `phuhoangserver` (`192.168.0.100`) trước khi tiến hành cài đặt hay thay đổi cấu hình triển khai. **Lưu ý: Chỉ thực hiện đọc và ghi nhận thông số, chưa can thiệp thay đổi cấu hình.**

---

## 1. Kiểm tra GitLab Container Registry (`git.musongoku.id.vn:5050`)

Xác minh Registry nội bộ đang hoạt động, có chứng chỉ TLS hợp lệ và có thể kết nối từ máy chủ:

```bash
# 1. Kiểm tra kết nối HTTPS tới endpoint v2 của Registry
curl -Iv https://git.musongoku.id.vn:5050/v2/

# Kỳ vọng: HTTP/1.1 hoặc HTTP/2 trả về 401 Unauthorized (kèm header Www-Authenticate xác thực GitLab)
# Điều này chứng minh Registry đang sống, TLS hợp lệ và sẵn sàng nhận đăng nhập.

# 2. Thử đăng nhập thử nghiệm bằng Personal Access Token hoặc Deploy Token
docker login git.musongoku.id.vn:5050 -u <your-username> -p <token>
```

---

## 2. Kiểm tra GitLab Runner & Executor

Xác minh Runner đang chạy bằng Docker executor an toàn, không bật `privileged` vô cớ và có thể phân giải mạng nội bộ:

```bash
# 1. Kiểm tra trạng thái service Runner
sudo gitlab-runner status

# 2. Kiểm tra file cấu hình Runner
sudo cat /etc/gitlab-runner/config.toml

# Điểm cần rà soát trong config.toml:
# - executor = "docker"
# - privileged = false (BẮT BUỘC: không bật true nếu không cần thiết)
# - volumes: kiểm tra xem có bị mount /var/run/docker.sock không (khuyến nghị KHÔNG mount)
# - extra_hosts: nếu git.musongoku.id.vn là IP nội bộ, kiểm tra xem runner container có phân giải được IP 192.168.0.100 hay không
```

---

## 3. Kiểm tra Cổng Mạng & Xung Đột Dịch Vụ (`127.0.0.1:3000`)

Xác minh cổng 3000 trên localhost đang ở trạng thái nào:

```bash
# 1. Kiểm tra tiến trình đang chiếm cổng 3000
ss -tulpn | grep ':3000'

# 2. Nếu cổng 3000 đang được dùng bởi container canvas cũ
docker ps --filter "publish=3000"

# 3. Thử gửi request nội bộ
curl -I http://127.0.0.1:3000/
```

---

## 4. Kiểm tra Định Tuyến Cloudflare Tunnel

Xác minh tunnel định tuyến đúng domain `canvas.musongoku.id.vn` về `http://127.0.0.1:3000`:

```bash
# 1. Kiểm tra trạng thái service cloudflared
systemctl status cloudflared

# 2. Kiểm tra file cấu hình tunnel (nếu cấu hình local file)
cat ~/.cloudflared/config.yml | grep -A 2 'canvas.musongoku.id.vn'

# Kỳ vọng:
# - hostname: canvas.musongoku.id.vn
#   service: http://127.0.0.1:3000
```

---

## 5. Kiểm tra Tài Nguyên Phần Cứng & Docker Daemon

```bash
# 1. Kiểm tra dung lượng ổ đĩa SSD / HDD
df -hT / /var/lib/docker

# 2. Kiểm tra RAM khả dụng
free -h

# 3. Kiểm tra phiên bản Docker & Docker Compose v2
docker version
docker compose version
```

---

## 6. Kết luận & Quyết định Tiếp Theo
- Nếu tất cả 5 hạng mục trên đều phản hồi tốt: Tiếp tục triển khai **Task 2 (Dockerfile & Compose)** và **Task 3 (SSH wrapper & Deploy script)**.
- Nếu có bất kỳ cổng bị chiếm hoặc Registry chưa bật TLS: Ghi nhận và xử lý cấu hình dịch vụ tương ứng trước khi bật pipeline tự động.
