@AGENTS.md
# Get Cultured — Claude Code Instructions

## Project
Migrating Get Cultured from vanilla HTML to Next.js + React + Tailwind + shadcn.
A curation site — one interaction: press a button, get a random cultural discovery.
Design inspiration: theuselessweb.com — minimal interface, maximum moment.

## Design System
Aesthetic: Aged paper. Deeper parchment tones evoking an old atlas or travel journal.

### Palette (CSS variables to define in globals.css)
--paper: #DDD0B4 (main background)
--paper-light: #E8DCC5 (hover states)
--paper-dark: #C2B090 (borders, dividers)
--ink: #17100A (primary text, buttons)
--ink-soft: #362A1C (body text)
--accent: #7A3B10 (saddle brown — labels, highlights)
--gold: #8C6E2A (quote bars, list numbers, pillar tags)
--dust: #A89070 (secondary labels, placeholders)

### Typography
- Playfair Display — headlines
- Spectral — body text
- Inconsolata — labels, tags, navigation
Import all three from Google Fonts.

### Spacing & Kerning
- Generous letter-spacing on all caps labels: tracking-widest
- Loose line-height on body: leading-relaxed
- Headlines: tight tracking, large size
- Always err on the side of more whitespace

## Data
Google Sheet ID: 1KW9ZMsuzqGctHmUVLBuerAbA5XU5nZ9z4LHgNxNh5n0
API Key: AIzaSyAHfpMauIr_K3hQkXzN-a8hvFHx1SWY_Yg
Fetch on every page load. No caching needed.

### Column Schema
title, lede, pillar, region, videoId, note, type

## Content Pillars
Niche, Obscure, What on Earth Am I Watching

### Pillar Definitions
- **Niche** — Sports with a dedicated subculture and serious competitors. Unusual but internally coherent (e.g. sepak takraw, underwater hockey, competitive dog agility).
- **Obscure** — Sports that exist but most people have never heard of. Genuine athletic endeavour, just forgotten or regional (e.g. bossaball, fierljeppen, kabaddi).
- **What on Earth Am I Watching** — Sports where the premise itself is the spectacle (e.g. cheese rolling, wife carrying, competitive air guitar).

## Editorial Direction
Get Cultured now focuses exclusively on the world's strangest, most niche, and most obscure sports. Editorial voice: sport-focused, specific, dry — like a seasoned correspondent covering cheese-rolling with complete journalistic sincerity.

## Post Formats
- The Clip — embedded YouTube video + curator note
- The Gem — full-bleed image + minimal text
- The Stack — mini listicle of 3-5 related things

## UI Skill
Follow the design principles at: https://ui-ux-pro-max-skill.nextlevelbuilder.io/