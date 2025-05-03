---
repo: "https://github.com/actualbudget/actual"
category: "Finance"
logo: null  # Optional - provide URL to logo if available
---

# Docker Run Command

```bash
docker run --pull=always --restart=unless-stopped -d -p 5006:5006 -v ./actual-data:/data actualbudget/actual-server:latest
```
