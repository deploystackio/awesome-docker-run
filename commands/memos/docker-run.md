---
repo: "https://github.com/usememos/memos"
category: "Notes"
logo: "https://www.usememos.com/logo.png"
---

# Docker Run Command

```bash
docker run -d --init --name memos --publish 5230:5230 --volume ./memos/:/var/opt/memos neosmemo/memos:stable
```
