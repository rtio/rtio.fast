# rtio.fast

My throwaway site, hosted on Spacefast. Static files, no build step.

- `index.html`: front page
- `experiments/`: index of things I build here
- `robots.txt`, `sitemap.xml`: search engine discovery
- `exposure/`: digital camera exposure simulator with 24–135 mm lens choices, a golden-hour park scene with walker/cyclist/car subjects, and A/B photo comparisons
- `pan/`: Pan's Pasture, a 60-second sheep herding game

## Public repository

Treat every tracked file, commit message and branch as public. Keep credentials,
deployment targets, team identifiers and private working notes outside Git.
Analysis and plans are local-only and ignored.

Publish only site assets after an explicit request. Obtain the deployment target
from private local configuration; do not put account or Space identifiers here.
Do not publish repository metadata, documentation or tests.

Check the camera model with `node --test exposure/model.test.mjs`. For a local preview, run `python3 -m http.server 8080` and open `http://localhost:8080/exposure/`.
