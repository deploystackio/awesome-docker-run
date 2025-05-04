---
repo: "https://github.com/goniszewski/grimoire"
category: "Bookmark"
logo: "https://raw.githubusercontent.com/goniszewski/grimoire/main/static/grimoire_logo_300.webp"
---

# Docker Run Command

```bash
docker run -d \
  --name grimoire \
  --restart unless-stopped \
  -e PORT=5173 \
  -e PUBLIC_HTTPS_ONLY=false \
  -e PUBLIC_SIGNUP_DISABLED=false \
  -v ./grimoire_data:/app/data/ \
  -p 5173:5173 \
  goniszewski/grimoire:develop
```
