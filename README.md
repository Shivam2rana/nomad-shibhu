# Nomad Shibhu Trails

Uttarakhand travel itineraries by Shivam Rana ([@nomad.shibhu](https://www.instagram.com/nomad.shibhu/)).
Every trip starts and ends in Rishikesh.

Live site: https://shivam2rana.github.io/nomad-shibhu/

## How it works

- `data/site.json` – your name, Instagram link, About me text.
- `data/trips.json` – every trip: route, facts, story, itinerary, tips, photos.
- `images/` – your photos and videos.
- `build.mjs` – turns the data into plain HTML pages in `_site/`.

Every push to `main` builds the site and publishes it automatically (see the Actions tab).
It usually goes live within two minutes.

## Add photos to a trip

1. Upload the files into `images/<trip-id>/`, for example `images/tungnath/sunrise.jpg`.
   Use JPG or PNG straight from your phone: the build resizes them, makes fast WebP copies
   and removes all hidden photo data (including GPS location). Keep videos short (under 20 MB).
2. In `data/trips.json`, add them to that trip's `media` list:

```json
"media": [
  { "src": "images/tungnath/sunrise.jpg", "kind": "image", "caption": "Sunrise from Chandrashila" },
  { "src": "images/tungnath/trail.mp4", "kind": "video", "caption": "The last climb" }
],
"cover": "images/tungnath/sunrise.jpg"
```

3. Commit. The site rebuilds itself.

## Add a new trip

Copy any trip block in `data/trips.json`, give it a new `id` (lowercase, dashes, e.g. `har-ki-dun`)
and fill in the fields. `months` is 12 letters from January to December for the "When to go"
calendar: `b` best, `o` open but rainy/snowy/part-month, `x` closed or not advised. `style` (dawn, day, mist, dusk) sets the drawn cover art used until you add a photo.
To link a reel, put its instagram.com URL in `reel`.

## FAQ

Edit the questions and answers in `data/site.json` under `faq`. They also feed Google's structured data.

## Your own photo in About me

Upload `images/shivam.jpg` (portrait, about 840 × 1050) and set `"photo": "images/shivam.jpg"` in `data/site.json`.

## Security

- Static HTML only: no server, database, login or admin panel to attack.
- Strict Content Security Policy: only the site's own scripts, styles, fonts and images can load.
- No third-party scripts, trackers or font services. Fonts are self-hosted.
- Original photos are never published; only resized copies with metadata (GPS) removed.
- All text from the data files is escaped when pages are built; the build fails on bad paths or ids.
- External links open with `noopener noreferrer`; referrer policy is `strict-origin-when-cross-origin`.
- HTTPS enforced by GitHub Pages. `security.txt`, `robots.txt` and `sitemap.xml` are generated.
- The deploy workflow has write access only to this repository's contents.

GitHub Pages cannot send custom response headers (such as `X-Frame-Options`).
If you later move to a custom domain, putting Cloudflare in front lets you add them.

## Run locally

```
npm ci
npm run build
npx serve _site
```
