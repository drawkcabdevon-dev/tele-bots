# Design Asset Pipeline Skill — Online Everywhere

Use this skill when generating design assets (static images, motion graphics, videos)
for LinkedIn posts. The pipeline: **post → design brief → tool script → rendered asset**.

## Tool Selection Guide

| Asset Type | Tool | When to Use |
|------------|------|-------------|
| Motion graphic (text + animation) | HyperFrames | Stats, quotes, comparison visuals, branded explainers |
| Cinematic AI video | Seedance 2.0 | Emotional storytelling, scene-based narratives, quad-modal (text+image+audio+video) |
| Short-form vertical video | Higgsfield AI | Reel-style content, lip-sync, character-driven, camera control |

## Workflow

1. **Draft the post** — Use the post templates (Template 1-10) for the message
2. **Generate a design brief** — Call `design_brief_from_post(post_content)` to auto-detect the campaign and get tool recommendations
3. **Generate the script** — Based on the recommendation:
   - `generate_hyperframes(post_content=...)` — outputs an `.html` file
   - `generate_seedance_prompt(post_content=...)` — outputs a JSON prompt
   - `generate_higgsfield_script(post_content=...)` — outputs a JSON script
4. **Render (HyperFrames only)** — `render_hyperframes(script_path)` runs `npx hyperframes render`
5. **Post with asset** — Use `post_image(text, image_path)` to publish with the rendered frame/thumbnail, or save for later

## Campaign-to-Asset Mapping

| Campaign | Visual Treatment | Primary Tool |
|----------|-----------------|--------------|
| 78.7% Crisis | Single red bar at 78.7%, dark urgency | HyperFrames |
| Gov Tax Credit | Barbados map with currency nodes, countdown | Seedance 2.0 |
| Website Speed | Speedometer, competitor comparison | HyperFrames |
| AI Agents | Pulsing network, Ollie glow effect | HyperFrames |
| Brand Identity | Before/after split, cohesive reveal | Seedance 2.0 |
| Case Studies | Testimonial overlay, result metric | Higgsfield |

## Brand Constants (for handwritten scripts)

```python
COLORS = {
    "primary": "#4285F4",
    "red": "#EA4335",
    "yellow": "#FBBC05",
    "green": "#34A853",
    "navy": "#202124",
    "navy_muted": "#5F6368",
}
FONTS = {"headlines": "Plus Jakarta Sans", "body": "Inter"}
TAGLINE = "Data-Driven Marketing, Accelerated by AI."
```

## HyperFrames Composition Tips

- Use `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Plus+Jakarta+Sans:wght@700;800&display=swap');` to load brand fonts
- Frame: 1920x1080px for landscape, 1080x1920px for vertical
- Animation: fadeUp (0.8s ease, staggered delays) for text reveals
- Background: `linear-gradient(135deg, #202124 0%, #1a1a2e 100%)`
- Accent bar: `linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335)` at bottom
- Ollie logo: Pulsing blue circle with `radial-gradient`

## Available Tools

### MCP / design
- `generate_hyperframes(campaign_id, post_content, output_name)` — Create HTML composition
- `generate_seedance_prompt(campaign_id, post_content)` — Create video prompt JSON
- `generate_higgsfield_script(campaign_id, post_content)` — Create cinematic script JSON
- `render_hyperframes(script_path, output_path)` — Render HTML → MP4
- `list_design_assets(campaign_id, tool, status)` — Browse generated assets
- `design_brief_from_post(post_content)` — Full design brief with tool recommendations
