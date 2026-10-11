# Deployment Guide: shadcn-canvas

Hệ thống có thể chạy độc lập dưới dạng Docker container hiệu năng cao (~25MB image, <10MB RAM) thông qua Nginx Alpine.

## 1. Khởi chạy bằng Docker Compose

```bash
cd deploy
docker compose up -d --build
```

Ứng dụng sẽ chạy tại `http://127.0.0.1:3000`.

## 2. Cấu hình định tuyến Cloudflare Tunnel (`canvas.musongoku.id.vn`)

Trên máy chủ Ubuntu `phuhoangserver` (`192.168.0.100`), thêm ingress rule vào file cấu hình tunnel (`~/.cloudflared/config.yml` hoặc cấu hình qua Zero Trust Dashboard):

```yaml
ingress:
  - hostname: canvas.musongoku.id.vn
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Sau đó restart tunnel:
```bash
sudo systemctl restart cloudflared
```

Mở trình duyệt truy cập: `https://canvas.musongoku.id.vn`
