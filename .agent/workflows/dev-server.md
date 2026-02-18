---
description: Start the English Learning App dev server with cache cleanup
---
// turbo-all

1. Kill any existing node processes that might hold ports:
```
cmd /c "taskkill /F /IM node.exe 2>nul"
```

2. Clear the Next.js webpack cache to prevent stale bundle errors:
```
cmd /c "rmdir /S /Q .next 2>nul"
```
Working directory: `c:\Users\yoshi\Desktop\english-learning-app`

3. Start the dev server:
```
cmd /c "npm run dev"
```
Working directory: `c:\Users\yoshi\Desktop\english-learning-app`

4. Wait for the server to report "Ready" in output, then note the port number shown.
