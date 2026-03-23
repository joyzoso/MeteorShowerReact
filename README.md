# Meteor Shower — Night Sky Planner v2.0

A React app that shows weather forecasts for upcoming meteor showers so you know whether you'll have clear skies.

## Features

- **Next meteor shower** — automatically detects the upcoming shower from a curated annual list
- **Current weather** — fetches conditions by zip code or auto-detected location
- **Tonight's viewing score** — 0–100 score based on cloud cover, precipitation chance, and wind
- **5-night forecast** — best evening window score for each of the next 5 nights
- **Nearby clear-sky locations** — if your cloud cover is above 60%, surfaces clearer spots within ~55 miles

## Setup

1. Clone and install:
   ```bash
   git clone https://github.com/joyzoso/MeteorShowerReact
   cd MeteorShowerReact
   npm install
   ```

2. Add your OpenWeatherMap API key:
   ```bash
   cp .env.example .env
   # Edit .env and replace your_key_here with your key
   ```

3. Run:
   ```bash
   npm run dev
   ```

## Stack

- React 18 + Vite
- OpenWeatherMap API (current weather + 5-day forecast + geocoding)
- Browser Geolocation API
- No other dependencies

## Viewing Score Formula

```
score = cloudScore(60) + precipScore(30) + windScore(10)
cloudScore = 60 × (1 − cloudCover/100)
precipScore = 30 × (1 − pop)
windScore   = 10 if wind < 5mph, 7 if < 10, 4 if < 20, 1 otherwise
```

Ratings: Excellent ≥75 · Good ≥55 · Fair ≥35 · Poor < 35
