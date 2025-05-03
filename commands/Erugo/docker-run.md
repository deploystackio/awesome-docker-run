---
repo: "https://github.com/ErugoOSS/Erugo"
category: "File Sharing"
---

# Docker Run Command

```bash
docker run -d --name erugo --restart unless-stopped -v ./erugo-storage:/var/www/html/storage -p 9998:80 wardy784/erugo:latest
```
