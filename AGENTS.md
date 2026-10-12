# AGENTS.md

rtio.fast is Rafael's throwaway site, hosted on Spacefast. It is a place to try things out. Nothing here is meant to last, so don't treat it as production.

The real home is the blog at https://rtio.dev. Link there, don't duplicate it here.

## Layout

- `index.html`: front page. Says this is a throwaway site and points to the blog and to `/experiments/`.
- `experiments/index.html`: list of experiments. One `<li>` per experiment.
- `pan/index.html`: Pan's Pasture, a single-file herding game. Self-contained.
- `exposure/`: Exposure playground, a digital camera simulator. Static HTML and JavaScript modules; `model.test.mjs` is local-only.
- `robots.txt` and `sitemap.xml`: for search engines. Spacefast does not generate them (both 404 otherwise).

Static files only. No build step, no framework, no server code.

## Adding an experiment

1. Create `<name>/index.html`. Keep it self-contained, with assets inside the folder.
2. Add the page to `sitemap.xml` and give it a `<link rel="canonical">`, Open Graph tags and a `<meta name="description">`, like the existing pages.
3. Add an `<li>` to `experiments/index.html` with the title and one plain sentence. Link with the absolute URL, `https://rtio.fast/<name>/`.
4. Publish.

Each page carries its own inline CSS on purpose. Reuse the tokens in `index.html` (`--fog`, `--ink`, `--paper`, `--blue`) so the pages feel related. Support dark mode and reduced motion.

## Publishing

Publish only the site files. Obtain the deployment team and Space target from
private local configuration outside Git; never write their values into tracked
files, examples, commit messages or public tool output. If the private target
is unavailable, ask the user rather than reconstructing it from Git history.
The repo root also holds documentation and Git metadata, which must not go live.

Stage only `index.html`, `robots.txt`, `sitemap.xml`, `experiments/`, `pan/`,
and the runtime files `exposure/index.html`, `exposure/app.mjs`,
`exposure/model.mjs`, `exposure/scene.mjs`. Exclude tests and working documents.

`snapshot` replaces the live files with exactly what you stage, so list every folder.

Live URLs: https://rtio.fast/ (custom domain) and https://rtio-fast.space.fast/.

## SEO

Spacefast does not generate `sitemap.xml` or `robots.txt`; both URLs 404 unless the repo ships them. Everything below is hand-maintained static files.

In place:

- `robots.txt` allows all crawlers and points to the sitemap.
- `sitemap.xml` lists every public page. Update it, with `lastmod`, whenever a page is added or changed.
- Each page has a `<title>`, `<meta name="description">`, `<link rel="canonical">` with the absolute `https://rtio.fast/...` URL, Open Graph tags, a `twitter:card` and an icon.
- Each page has one `<h1>` and `<html lang="en">`.
- Pan's Pasture is indexable. The bot's `noindex` was removed on purpose.

Not done yet, in rough order of value:

1. Structured data (JSON-LD): `WebSite` and `Person` on the front page, `VideoGame` on `/pan/`.
2. A 1200x630 social preview image, then `og:image` and `twitter:card` set to `summary_large_image`.
3. A custom `404.html` with a link home. Spacefast serves its own 404 page otherwise.
4. `rel="me"` links between rtio.fast, rtio.dev, X and GitHub, so the sites are tied to one identity.
5. `apple-touch-icon` and a web manifest, so the game can be added to a phone home screen.

Outside the repo:

- Verify rtio.fast in Google Search Console and Bing Webmaster Tools, then submit `https://rtio.fast/sitemap.xml`. This needs Rafael's login.
- Link to rtio.fast from rtio.dev. Backlinks matter more than any tag for a new domain.

Keep expectations low: this is a throwaway site. Don't add analytics, cookie banners or tracking for SEO.

## Rules

- Assume every file, branch, commit message and review artifact in this repository is public.
- Never commit credentials, secrets, tokens, claim tokens, deployment account/team/Space identifiers, private URLs or local machine paths. Use clearly fake placeholders when examples need them.
- Keep analysis and implementation plans local-only in the ignored `docs/analysis/` and `docs/superpowers/plans/` folders. Never force-add them.
- Keep private configuration outside Git. Do not track `.stattic/`, `.spacefast/`, environment files, private keys or credential files.
- Before every commit or push, inspect the exact staged files for sensitive values and unintended working documents. Ignoring a file does not untrack an existing copy or remove earlier commits.
- Pages from Spacefast bots may include injected scripts (`sdk.js`, `remix-cta.js`) and `spacefast:*` comment markers. Strip the scripts when copying a page in.
- Don't publish without being asked. Publishing changes a live site.
- Commits follow Conventional Commits and reference no issue tracker.
