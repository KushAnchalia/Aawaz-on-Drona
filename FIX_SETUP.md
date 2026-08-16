# 🔧 Fix: "next: command not found"

## Problem
You're seeing: `sh: next: command not found`

## Solution: Install Dependencies

The error means Node.js dependencies aren't installed yet.

### Step 1: Check if Node.js is Installed

```bash
node --version
```

**If you see:** `command not found` → Install Node.js first (see `INSTALL_NODE.md`)

**If you see:** a version number (like `v20.10.0`) → Continue to Step 2

---

### Step 2: Install Dependencies

```bash
cd /Users/kanchali/Solana
npm install
```

This will:
- Download all required packages
- Install Next.js, React, Solana SDK, etc.
- Take 2-5 minutes

---

### Step 3: Run the App

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

---

## ✅ Success Checklist

- [ ] Node.js installed (`node --version` works)
- [ ] Dependencies installed (`npm install` completed)
- [ ] Server running (`npm run dev` shows localhost:3000)
- [ ] Can open http://localhost:3000 in browser

---

## 🐛 Still Having Issues?

### "npm: command not found"
→ Install Node.js (see `INSTALL_NODE.md`)

### "Permission denied"
→ Try: `sudo npm install` (or fix npm permissions)

### "Network timeout"
→ Check internet connection, try again

### Port 3000 already in use
→ Kill process: `lsof -ti:3000 | xargs kill -9`

---

## 📚 Need More Help?

- **Node.js not installed?** → See `INSTALL_NODE.md`
- **Setup questions?** → See `QUICK_START.md`
- **LLM setup?** → See `OPEN_SOURCE_SETUP.md`

