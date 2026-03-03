# KitchenAid Espresso Machine — UI Redesign

An interactive prototype redesigning the control panel of a KitchenAid entry-level espresso machine. The goal is to improve usability through better affordances, natural mapping, clear feedback, and error prevention — with minimal changes to the physical hardware layout.

## Demo

Open `index.html` in any modern browser. No build step or dependencies required.

## How to Use the Prototype

| Action | How |
|---|---|
| **Power on** | Click **Power** → machine preheats, then three beeps signal Ready |
| **Select a mode** | Click **Single**, **Double**, **Steam**, or **Clean** (highlights the selection) |
| **Start** | Click **Start / Stop** while a mode is selected |
| **Cancel** | Click **Start / Stop** again while running — two short beeps confirm |
| **Change temperature** | Click **Temp** when Ready to cycle Low → Medium → High |
| **Toggle Low Water (demo)** | Hold **Shift** and click **Power** — yellow LED blinks, all controls lock except Power |
| **Power off** | Click **Power** at any time |

Clicking a locked control plays two short beeps instead of triggering an action.

## Features

- **State machine** — four machine states (Off, Preheating, Ready, Running) drive all button locks, LED states, and feedback
- **Mode selection** — Single, Double, Steam, and Clean are mutually exclusive; the active mode highlights with a green backlight
- **Temperature indicator** — three-position LED bar (Low / Medium / High); only adjustable when Ready
- **Audio feedback** — Web Audio API beeps for Ready (3 long), completion (3 long), and error/cancel (2 short)
- **Low Water warning** — blinking yellow LED locks all controls until resolved; persists across power cycles
- **Power-off dimming** — the whole panel dims when off; the Power button remains visible and accessible

## Design Rationale

| Problem | Solution |
|---|---|
| Mode and execution controls mixed together | Separated into distinct groups: Setup / Mode Selection / Start–Stop |
| No clear machine state feedback | Dedicated status LEDs for Preheating, Ready, Brewing, Steaming, Cleaning, Low Water |
| Power button indistinguishable from mode keys | Gunmetal finish vs. steel mode keys; red icon accent |
| No error prevention for low water | Low Water state locks all brewing controls with a blinking warning |
| Ambiguous Start/Stop label at rest | Start / Stop button is locked (dimmed) until a mode is selected |

## File Structure

```
index.html   — markup and prototype instructions
styles.css   — KitchenAid Empire Red theme, all visual styles
script.js    — state machine, event handlers, Web Audio beeps
```
