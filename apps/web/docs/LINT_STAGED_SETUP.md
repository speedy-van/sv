# 🔥 Lint-Staged + Husky Setup

## ✅ What's Configured

This project uses **lint-staged** with **husky** to ensure code quality on every commit.

### 🎯 Benefits

- ✨ **Fast**: Only lints changed files (not 4000+ files)
- 🚀 **Auto-fix**: Automatically fixes linting issues
- 🎨 **Prettier**: Auto-formats code
- 🛡️ **Safety**: Prevents bad code from being committed
- 📦 **Zero overhead**: Doesn't touch legacy code

---

## 🔧 How It Works

### Pre-commit Hook (`.husky/pre-commit`)

Runs automatically before every `git commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
```

### Lint-Staged Config (`.lintstagedrc.js`)

Only processes **staged files**:

```js
module.exports = {
  'src/**/*.{ts,tsx}': [
    'eslint --fix',        // Fix ESLint issues
    'prettier --write',    // Format code
  ],
  '*.json': ['prettier --write'],
  '*.md': ['prettier --write'],
};
```

---

## 📋 Workflow Example

```bash
# 1. Make changes to files
vim src/components/MyComponent.tsx

# 2. Stage your changes
git add src/components/MyComponent.tsx

# 3. Commit (hooks run automatically)
git commit -m "feat: add new component"

# Output:
# ✔ Backed up original state in git stash
# ✔ Running tasks for staged files...
#   ✔ eslint --fix
#   ✔ prettier --write
# ✔ Applying modifications...
# ✔ Cleaning up...
```

---

## 🚫 What Gets Checked

| Pattern | Files | Actions |
|---------|-------|---------|
| `src/**/*.{ts,tsx}` | TypeScript/React | ESLint + Prettier |
| `*.json` | JSON files | Prettier |
| `*.md` | Markdown | Prettier |

**Legacy code is NOT touched** unless you explicitly modify and stage it.

---

## 🔥 Advanced Usage

### Skip Hooks (Emergency Only)

```bash
git commit --no-verify -m "emergency fix"
```

### Run Manually

```bash
pnpm lint-staged
```

### Test Without Committing

```bash
git add <files>
pnpm lint-staged
git reset HEAD <files>
```

---

## 🐛 Troubleshooting

### Hook Not Running?

```bash
# Reinstall hooks
pnpm prepare
```

### Hooks Running on All Files?

Check `.lintstagedrc.js` - should only target staged files.

### Want Stricter Rules?

Edit `.lintstagedrc.js`:

```js
'src/**/*.{ts,tsx}': [
  'eslint --fix --max-warnings=0',  // Fail on warnings
  'prettier --write',
],
```

---

## 📦 Dependencies

```json
{
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^16.2.7"
  }
}
```

---

## 🎓 Learn More

- [Husky Docs](https://typicode.github.io/husky/)
- [lint-staged Docs](https://github.com/lint-staged/lint-staged)
- [ESLint --fix](https://eslint.org/docs/user-guide/command-line-interface#--fix)

---

**Made with 🔥 for progressive code quality improvement**
