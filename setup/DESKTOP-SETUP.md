# Setting up Claude on your desktop for this game

1. Clone the repo and open the folder in **Claude Code** (the Code tab in Claude Desktop, or `claude` in a
   terminal). `CLAUDE.md`, the 10 specialist agents and the 6 skills (`/playtest`, `/balance-check`,
   `/add-content`, `/make-sprite`, `/asset-audit`, `/perf-profile`) load automatically.
2. Install the test tools once:
   ```bash
   npm install
   ```
   ```bash
   npx playwright install chromium
   ```
3. **agent-sprite-forge** (sprite and pixel-art tools). Choose either option.
   - **Automatic for this project:** copy `setup/claude-settings.example.json` to `.claude/settings.json`.
     Claude Code will then offer to install the plugin when you open the folder (and it pre-approves the
     test and build commands). This step was left for you on purpose, because Claude shouldn't change its
     own permission settings.
   - **Manual:**
     ```bash
     claude plugin marketplace add 0x0funky/agent-sprite-forge --sparse .claude-plugin skills
     ```
     ```bash
     claude plugin install agent-sprite-forge@agent-sprite-forge
     ```
   Either way, also install its Python packages:
   ```bash
   python -m pip install "numpy>=1.26" "Pillow>=10.1" "scipy>=1.11"
   ```
   Its free local tools (`codeart2d` sprites from code, the hibit pixel-art finish) work right away.
   Generating brand-new images or animations also needs an image service: an API key it supports, or a
   signed-in Codex or Grok CLI.
4. Start a new session and say: **"Read the README and continue the 16-bit overhaul."**
