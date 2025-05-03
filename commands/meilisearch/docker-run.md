---
repo: "https://github.com/meilisearch/meilisearch"
category: "Database"
logo: null  # Optional - provide URL to logo if available
---

# Docker Run Command

```bash
docker run -it --rm \
  -p 7700:7700 \
  -v $(pwd)/meili_data:/meili_data \
  getmeili/meilisearch:latest
```
