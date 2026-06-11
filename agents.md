name: data-documentary-ui
description: "Anti-AI-slop design and architecture skill for the Spotify Extended History application. Use when generating React components, data visualizations, and Tailwind styling for millions of rows of JSON telemetry. Enforces high-end, atmospheric data-journalism aesthetics over generic dashboards."
version: 2.0.0
Data-Documentary-UI
A strictly opinionated design skill for AI coding assistants. Forces data-heavy applications to look like bespoke, interactive data documentaries, not generic SaaS templates.

This skill is self-aware: it actively fights the "generic AI slop aesthetic" that plagues LLM-generated code. It refuses to output overused fonts, predictable boxy layouts, and cliché color schemes (especially purple gradients).

Instead, it treats the user's Spotify Extended History (millions of rows of playback telemetry, geolocation, and timestamps) with high-end aesthetic ambition.

Powered by Raw JSON. Designed with Conviction.

1. The Strategic Pause (Design Thinking Before Code)
Before writing a single line of React, Tailwind, or Recharts config, the AI must output a short /* Strategic Pause */ comment block answering these four questions:

Purpose and Audience: What story is this specific data view telling?

Tone: Commit to a bold direction (e.g., organic/natural, luxury/refined, brutalist/architectural). No hedging.

Technical Constraints: Framework limits, canvas rendering for millions of rows, etc.

The Memorability Question: "What will make this specific component stand out to the user?"

2. The Anti-Slop Philosophy & Aesthetic Rules
This application must feel made, not generated. Apply these principles rigorously to every component:

Typography as Identity
Rule: Avoid generic fonts like Arial, Roboto, and Inter.

Execution: Choose fonts that are beautiful, unique, and interesting. Use unexpected, characterful font choices. For data heavy views, consider pairing a sharp, highly legible mono-space for the raw numbers (ms_played, timestamps) with a high-contrast serif or a highly distinctive geometric sans-serif for headings and artist names.

Cohesive Color with Conviction
Rule: No safe grays and subtle blues. Absolutely no purple gradients.

Execution: Commit to a cohesive aesthetic using CSS variables. Favor dominant, bold background colors anchored by sharp, unexpected accents. If the tone is organic, use deep moss greens and bone whites; if refined, use rich charcoals and stark vermilion. Make a choice and own it.

Atmospheric Over Solid Colors
Rule: Never settle for flat, lifeless background colors (bg-gray-50 or bg-white).

Execution: Create visual atmosphere through subtle visual gradients, grain, noise textures, and patterns. The background should feel tactile, like premium paper or frosted glass, giving the data visualizations a physical environment to live inside.

Motion as High-Impact Moments
Rule: Quality over quantity. Avoid scattering cheap micro-interactions (bouncing buttons, jittery hovers) across the page.

Execution: Prioritize one well-orchestrated page load with staggered reveals. When the user opens the "Eras" timeline or the "Geo-Soundtrack", the data should cascade or fade in purposefully. Make the moments that matter feel highly intentional.

Match Complexity to Vision
Execution: The implementation must match the aesthetic ambition. If the chosen tone is maximalist, write elaborate CSS/framer-motion code with extensive, layered animations. If the design is minimalist, enforce extreme restraint, immaculate typographical hierarchy, and mathematical precision in spacing.

3. Project-Specific Implementation (Spotify Extended History)
When scaffolding the specific features of this app, map the data to the design philosophy:

Feature 1: The All-Time Hyper-Wrapped: Do not render this as a standard table. Treat the Top Artists, "Ghost Tracks," and the "Skipper ML Profile" like a magazine spread. Use aggressive typography for the numbers and atmospheric texturing behind the charts.

Feature 2: Eras & Evolution (The Timeline): Visually distinguish the chronological stages (Pre-2020 School vs. College Engineering). Shift the color conviction and typography weight as the user scrolls down the timeline to physically represent the passing of time and changing tastes.

Feature 3: The Geo-Soundtrack (IP Map): Do not use a generic Mapbox/Google Maps drop-in. Abstract the geography. Use D3.js or Canvas to render the user's travel locations as a web of connected data points over a textured, atmospheric background.

4. Output Contract
No Mocked Slop: Placeholder data used for scaffolding must structurally match the exact Spotify Extended JSON schema (ts, ms_played, reason_start, reason_end, conn_country).

CSS Variables Only: All colors, spacing, and typography must be routed through a central CSS variable system (or Tailwind @theme). No inline hex codes.

Self-Critique: If the AI generates a layout that feels like a standard SaaS dashboard, it must delete it and try again before outputting to the user.