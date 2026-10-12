# AGENTS.md

rtio.fast is Rafael's throwaway site, hosted on Spacefast. It is a place to try things out. Nothing here is meant to last, so don't treat it as production.

The real home is the blog at https://rtio.dev. Link there, don't duplicate it here.

## Layout

- `index.html`: front page. Says this is a throwaway site and points to the blog and to `/experiments/`.
- `experiments/index.html`: list of experiments. One `<li>` per experiment.
- `pan/index.html`: Pan's Pasture, a single-file herding game. Self-contained.
- `robots.txt` and `sitemap.xml`: for search engines. Spacefast does not generate them (both 404 otherwise).

Static files only. No build step, no framework, no server code.

## Adding an experiment

1. Create `<name>/index.html`. Keep it self-contained, with assets inside the folder.
2. Add the page to `sitemap.xml` and give it a `<link rel="canonical">`, Open Graph tags and a `<meta name="description">`, like the existing pages.
3. Add an `<li>` to `experiments/index.html` with the title and one plain sentence. Link with the absolute URL, `https://rtio.fast/<name>/`.
4. Publish.

Each page carries its own inline CSS on purpose. Reuse the tokens in `index.html` (`--fog`, `--ink`, `--paper`, `--blue`) so the pages feel related. Support dark mode and reduced motion.

## Publishing

The Space lives under the `rtiodev` team, not `automattic`. Publish only the site files. The repo root also holds `README.md`, `AGENTS.md` and `.git`, which must not go live.

```bash
S="$TMPDIR/rtiofast-stage"
rm -rf "$S" && mkdir -p "$S"
cp -R index.html robots.txt sitemap.xml experiments pan "$S"/   # add new experiment folders here
sf publish "$S" --team rtiodev --space spc_96c663e349164a8fb99b5f811eaf0be6 --publish-mode snapshot
```

`snapshot` replaces the live files with exactly what you stage, so list every folder.

Live URLs: https://rtio.fast/ (custom domain) and https://rtio-fast.space.fast/.

## Rules

- The repo is public. Never commit secrets, tokens, claim tokens or `.stattic/`.
- Pages from Spacefast bots may include injected scripts (`sdk.js`, `remix-cta.js`) and `spacefast:*` comment markers. Strip the scripts when copying a page in.
- Don't publish without being asked. Publishing changes a live site.
- Commits follow Conventional Commits and reference no issue tracker.
