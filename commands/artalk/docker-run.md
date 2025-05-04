---
repo: "https://github.com/ArtalkJS/Artalk"
category: "Forum"
logo: null  # Optional - provide URL to logo if available, 1:1 format only
---

# Docker Run Command

```bash
docker run -d \
    --name artalk \
    -p 8080:23366 \
    -v $(pwd)/data:/data \
    -e "TZ=America/New_York" \
    -e "ATK_LOCALE=en" \
    -e "ATK_SITE_DEFAULT=Artalk Blog" \
    artalk/artalk-go:latest
```
