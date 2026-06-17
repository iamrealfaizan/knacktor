# Knacktor

A desktop-first, visual-learning DSA platform. Watch algorithms solve themselves — real Python code stepping line-by-line, cinematic animations, and live variables, controlled like a media player.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **shadcn/ui** + lucide-react
- **MongoDB Atlas** (content store)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
knacktor/
├── CLAUDE.md        # Agent context — auto-loaded by Claude Code
├── rules/           # Canonical docs (PRD, TechSpec, Schema, Design, SimulationRules, ...)
└── app/             # Next.js App Router pages
```

See [CLAUDE.md](CLAUDE.md) for the full agent context and [rules/Implementation.md](rules/Implementation.md) for the build phases (M1.1 → M1.7).
