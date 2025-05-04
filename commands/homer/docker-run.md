---
repo: "https://github.com/bastienwirtz/homer"
category: "Dashboard"
logo: null  # Optional - provide URL to logo if available, 1:1 format only
---

# Docker Run Command

```bash
docker run -d \
  --name homer \
  -p 8080:8080 \
  -v ./homer-assets:/www/assets \
  --restart=unless-stopped \
  b4bz/homer:latest
```
