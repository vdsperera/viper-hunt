---
description: auto commmit
---

# Auto Commit and Push Workflow
Description: Stages, commits, and pushes all current changes to GitHub.

## Steps:
1. Check `git status` to see modified or new untracked files.
2. Run `git add .` to stage all current workspace changes.
3. Generate a concise, descriptive conventional commit message based on the `git diff`.
4. Commit the changes using `git commit -m "<generated message>"`.
5. Push the changes to the current remote branch using `git push`.