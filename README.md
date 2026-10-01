# Portfolio

Personal portfolio of Jaya Prakash Yadav Gorla, an AI/ML engineer based in Chicago.

Live site: https://jpmartin22.github.io/Portfolio/

Plain HTML, CSS and JavaScript with no build step. GitHub Pages serves it from the root of `main`, so pushing to `main` publishes the site.

## Files

- `index.html`: all content, plus metadata and structured data
- `style.css`: design tokens (light and dark), layout, print styles
- `script.js`: theme toggle, mobile menu, current-section highlight, contact form
- `404.html`: not-found page (uses `/Portfolio/`-rooted paths because Pages serves it at any depth)
- `assets/`: portrait photos (AVIF and JPEG), social preview image, icons

## Preview locally

The site lives under `/Portfolio/` on GitHub Pages, so preview it under the same path to catch broken URLs:

```sh
mkdir -p /tmp/site && ln -sfn "$PWD" /tmp/site/Portfolio
python3 -m http.server 8000 --bind 127.0.0.1 --directory /tmp/site
```

Open http://127.0.0.1:8000/Portfolio/. Add `?theme=dark` or `?theme=light` to force a theme.

## Editing

- Every number on the page must match the project it links to. When a repo and the resume disagree, the page follows the repo.
- Update the "Updated" month in the footer when content changes.
- File names are lowercase and case-exact; GitHub Pages is case-sensitive even though macOS is not.
- After deploying, refresh the cached preview with LinkedIn's Post Inspector.

## Regenerating the portrait

The source photo is Display P3. Convert to sRGB first, crop 4:5, then resize by width:

```sh
sips -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc" photo.jpg --out src.jpg
sips -c 2200 1760 --cropOffset 946 602 src.jpg --out full.jpg    # height width, then offsetY offsetX
sips --resampleWidth 1200 -s format avif -s formatOptions 55 full.jpg --out assets/img/portrait-1200.avif
```

## Contact form

The form sends through EmailJS (`@emailjs/browser` v3). The public key, service ID and template ID are public by design; set the template's recipient to a fixed address in the EmailJS dashboard and enable its rate limit.

Text and photos are © Jaya Prakash Yadav Gorla and are not licensed for reuse.
