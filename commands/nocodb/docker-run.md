---
repo: "https://github.com/nocodb/nocodb"
category: "Database"
logo: "https://raw.githubusercontent.com/nocodb/nocodb/develop/packages/nc-gui/assets/img/icons/512x512.png"
---

# Docker Run Command

```bash
docker run -d \
  --name noco \
  -v "./nocodb:/usr/app/data/ \
  -p 8080:8080 \
  nocodb/nocodb:latest
```
