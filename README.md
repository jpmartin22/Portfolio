# Portfolio

Personal portfolio of Jaya Prakash Yadav Gorla, an AI/ML engineer based in Chicago.

Live site: https://jayaprakashyadav.com/

Plain HTML, CSS and JavaScript with no build step. GitHub Pages serves it from the root of `main`, so pushing to `main` publishes the site.

## Files

- `index.html`: all content, plus metadata and structured data
- `style.css`: design tokens (light and dark), layout, print styles
- `script.js`: theme toggle, mobile menu, current-section highlight, contact form
- `CNAME`: the custom domain GitHub Pages serves the site on
- `404.html`: not-found page (uses root-relative paths because Pages serves it at any depth)
- `assets/`: portrait photos (AVIF and JPEG), the logo (`logo.svg`, a vector trace of the brush-ring mark), social preview image and icons

## Preview locally

The site is served from the domain root, so a plain server works:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/. Add `?theme=dark` or `?theme=light` to force a theme.

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
