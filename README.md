# ⚡ BizForge
### Built at Dolphin Hacks 2025

> Describe your business idea. Get a full strategy in seconds.

BizForge uses AI to instantly generate a complete business strategy report from a single idea — no MBA required.

---

## 🚀 What It Does

Paste any business idea and BizForge generates **5 outputs simultaneously**:

| Output | What you get |
|---|---|
| 🎤 **Elevator Pitch** | 30-second pitch + one-liner + value proposition + revenue model |
| 📊 **SWOT Analysis** | Strengths, Weaknesses, Opportunities, Threats |
| 👥 **Customer Personas** | 3 detailed personas with motivations and pain points |
| 🏆 **Competitor Analysis** | Top 3 competitors, their weaknesses, threat levels + market gap |
| 📈 **Go-to-Market Strategy** | 3-phase launch plan + key marketing channels |

---

## 🛠️ Tech Stack

- **HTML** — structure and layout
- **CSS** — styling, animations, dark theme
- **JavaScript** — app logic, tab switching, canvas animation
- **Claude API (Haiku)** — AI strategy generation

---

## 📁 File Structure

```
BizForge/
├── index.html    ← Person 1 (Frontend) — page structure & UI
├── style.css     ← Person 1 (Frontend) — all styling & animations
├── script.js     ← Person 2 (Backend)  — Claude API & app logic
└── README.md     ← Person 3 (Overall)  — you're reading it
```

---

## ⚙️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/[your-repo-url]
cd BizForge
```

### 2. Get your Claude API key
- Go to [console.anthropic.com](https://console.anthropic.com)
- Create a free account
- Generate an API key

### 3. Add your API key
Open `script.js` and replace line 9:
```js
const API_KEY = 'YOUR_API_KEY_HERE'; // ← paste your key here
```

### 4. Run the app
Just open `index.html` in your browser. No server needed, no installs, no dependencies.

```bash
# Mac
open index.html

# Windows
start index.html
```

---

## 👥 Team Roles

| Person | Role | Owns |
|---|---|---|
| Person 1 | Frontend / UI | `index.html`, `style.css` |
| Person 2 | Backend / AI Logic | `script.js`, API integration |
| Person 3 | Overall / Pitch | Testing, demo, presentation |

---

## 🌿 Git Workflow

Each person works on their own branch to avoid conflicts:

```bash
# Person 1
git checkout -b frontend

# Person 2
git checkout -b api

# Person 3
git checkout -b content
```

**Merge schedule:**
- **Hour 6** — everyone merges into `main` (Person 3 coordinates)
- **Hour 10** — feature freeze, final merge, all testing on the same build

**Daily push routine:**
```bash
git add .
git commit -m "describe what you changed"
git push origin your-branch-name
```

⚠️ **Rule:** Message the group chat before merging so nobody's work gets overwritten.

---

## 🎯 Demo Ideas (for the pitch)

These 3 examples are pre-loaded in the app and always generate great results:

1. **FarmConnect** — connects local farmers directly with restaurants
2. **AI Tutor** — adaptive learning platform for students
3. **FitLocal** — marketplace for independent personal trainers

---

## 🏁 Hackathon Info

- **Event:** Dolphin Hacks 2025
- **Track:** Business
- **Duration:** 12 hours
- **Team size:** 3 people
