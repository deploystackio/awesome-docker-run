---
repo: "https://github.com/mylar3/mylar3"
category: "eBook"
logo: null  # Optional - provide URL to logo if available, 1:1 format only
---

# Docker Run Command

```bash
  docker run -d \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Etc/UTC \
  -p 8090:8090 \
  -v ./mylar3-comics:/comics \
  --restart unless-stopped \
  lscr.io/linuxserver/mylar3:latest
```
