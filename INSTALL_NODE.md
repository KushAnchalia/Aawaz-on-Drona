# 📦 Install Node.js First

The error `next: command not found` means Node.js and npm are not installed.

## 🚀 Quick Install (macOS)

### Option 1: Using Homebrew (Recommended)

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (includes npm)
brew install node
```

### Option 2: Direct Download

1. Go to: https://nodejs.org
2. Download the **LTS version** (recommended)
3. Run the installer
4. Follow the installation steps

### Option 3: Using nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.zshrc

# Install Node.js
nvm install --lts
nvm use --lts
```

---

## ✅ Verify Installation

After installing, verify it works:

```bash
node --version
npm --version
```

You should see version numbers like:
```
v20.10.0
10.2.3
```

---

## 🔧 After Installing Node.js

Once Node.js is installed, run:

```bash
cd /Users/kanchali/Solana
npm install
npm run dev
```

---

## 🐛 Troubleshooting

### "command not found" after installing
- **Restart your terminal** (close and reopen)
- Or run: `source ~/.zshrc`

### Homebrew not found
- Install Homebrew first (see Option 1 above)
- Or use Option 2 (direct download)

### Permission errors
- Use `sudo` if needed: `sudo brew install node`
- Or install via direct download (no sudo needed)

---

## 📝 Next Steps

1. ✅ Install Node.js (choose one method above)
2. ✅ Verify: `node --version`
3. ✅ Run: `npm install` (in project directory)
4. ✅ Run: `npm run dev`
5. ✅ Open: http://localhost:3000

---

## 💡 Quick Check

Run this to see if Node.js is installed:

```bash
which node
```

If it shows a path (like `/usr/local/bin/node`), you're good!
If it shows nothing, install Node.js first.

