# Contributing to Mini SCADA HMI Dashboard

First off, **thank you** for considering contributing! 🎉

This project is beginner-friendly. Whether you're fixing a typo or adding a major feature, your help is appreciated.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Style Guide](#-style-guide)
- [Submitting Changes](#-submitting-changes)

---

## 📜 Code of Conduct

This project follows a simple principle: **Be kind and respectful.** 

We're all here to learn and build something useful. Harassment, discrimination, or rude behavior will not be tolerated.

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A text editor (VS Code recommended)
- Git (optional, but recommended)

### No build tools required!

This project intentionally has **zero build steps**. Just edit the files and refresh your browser.

---

## 🤝 How Can I Contribute?

### 🐛 Report Bugs

Found something broken? Please [open an issue](../../issues/new) with:

1. **Description**: What happened?
2. **Expected behavior**: What should have happened?
3. **Steps to reproduce**: How can we see the bug?
4. **Browser & OS**: Chrome 120, Windows 11, etc.
5. **Screenshots**: If applicable

### 💡 Suggest Features

Have an idea? [Open an issue](../../issues/new) with:

1. **Problem**: What problem does this solve?
2. **Proposed solution**: How would it work?
3. **Alternatives considered**: Other approaches you thought of
4. **Additional context**: Mockups, examples, etc.

### 📖 Improve Documentation

- Fix typos
- Clarify confusing sections
- Add examples
- Translate to other languages

### 🎨 Improve the UI

- Better color schemes
- Accessibility improvements
- Mobile responsiveness
- New visualizations

### 💻 Write Code

- Fix bugs
- Add features
- Improve performance
- Add tests

---

## 🛠️ Development Setup

1. **Fork the repository** (click "Fork" button on GitHub)

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mini-scada-hmi-dashboard.git
   cd mini-scada-hmi-dashboard
   ```

3. **Open in your editor**:
   ```bash
   code .  # VS Code
   ```

4. **Run in browser**:
   - Simply open `index.html` in your browser
   - Or use VS Code Live Server extension for auto-reload

5. **Run tests**:
   - Open `index.html?test=1` in your browser
   - Check console for results

---

## 📝 Style Guide

### JavaScript

- Use `const` and `let`, never `var`
- Use arrow functions where appropriate
- Prefer functional programming patterns
- Keep functions small and focused
- Add comments for complex logic

```javascript
// ✅ Good
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString();
};

// ❌ Avoid
var formatTime = function(date) {
    return new Date(date).toLocaleTimeString();
}
```

### HTML

- Use semantic HTML elements
- Include meaningful `id` and `class` names
- Use Tailwind CSS classes for styling

### CSS

- Prefer Tailwind utility classes
- Custom CSS only when necessary
- Keep `styles.css` minimal

### Commit Messages

Use clear, descriptive commit messages:

```
✅ Good:
- Add machine detail view with event log
- Fix chart not rendering on page load
- Update README with setup instructions

❌ Avoid:
- fixed stuff
- updates
- wip
```

---

## 📤 Submitting Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**

3. **Test your changes**:
   - Open in browser
   - Run `?test=1` tests
   - Check different views work

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: brief description of changes"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Describe your changes

### Pull Request Checklist

Before submitting, please ensure:

- [ ] Code works in the browser (no console errors)
- [ ] Self-tests pass (`?test=1`)
- [ ] Works in both light and dark mode
- [ ] Follows the style guide
- [ ] README updated (if needed)

---

## 🏷️ Good First Issues

New to open source? Look for issues labeled:

- `good first issue` - Simple tasks for beginners
- `documentation` - Improve docs (no coding required!)
- `help wanted` - We'd love some help here

---

## 💬 Questions?

- Open an [issue](../../issues) for bugs or features
- Check existing issues before creating new ones

---

## 🙏 Thank You!

Every contribution matters, no matter how small. Thank you for helping make this project better!

<p align="center">
  <strong>Happy coding! 🚀</strong>
</p>
