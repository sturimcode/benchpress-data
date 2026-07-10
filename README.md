# benchpress-data

The open dataset behind [BenchPress](https://github.com/benchpress-app/benchpress),
a Windows app that recommends, applies, and verifies PC game settings for your
hardware and target FPS.

Per game, this repo records three things nobody else keeps in structured form:

- **Config map**: where the game stores each setting on disk, the exact key,
  and the legal values. This is what makes one-click apply possible.
- **Impact table**: what each setting costs in FPS and what it changes on
  screen, with a source link on every row.
- **Baselines and recommendations**: estimated FPS and full settings lists per
  hardware tier, resolution, and upscaling stance.

`reports/` holds measured benchmark results submitted by BenchPress users.
Reports using a game's built-in benchmark are the gold standard and refine the
impact tables over time.

## Contributing

- **A benchmark result**: easiest through the BenchPress app, which packages
  your hardware, settings, and measured FPS into a report you review before
  it is sent. Hand-written reports welcome too; validate first (below).
- **A new game**: open a PR adding `games/<slug>.json`. It merges after the
  onboarding checklist passes: config map verified against a real Steam
  install, sources linked for every impact entry, baselines recorded.
- **A correction**: PRs fixing stale values after a game patch are the most
  useful contribution there is.

Every PR runs schema validation and cross-reference checks. To run them
yourself:

    npm install
    npm test
    npm run validate

## Attribution

Seed data draws on published testing by Digital Foundry, r/OptimizedGaming,
and pcoptimizedsettings.com, linked per entry. As measured reports accumulate,
they replace borrowed estimates.

## License

Code (schemas and scripts): MIT. Data (`games/`, `reports/`, `tiers.json`):
CC BY 4.0. Use the data anywhere, keep the attribution chain intact.
