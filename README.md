# A1 AI Agents website

Responsive, pre-rendered corporate website based on the supplied “Logo redesign suggestions” conversation. Eight complete pages: homepage, AI Agents, AI Applications, AI Transformation, Products, Industries, Company and Contact.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Build with `npm run build`, then use `npm run preview` to review the production build. Deploy the contents of `dist/` to a static host. Nothing has been published to the existing company website.

## Edit

- `src/content.js`: product, industry, agent and page metadata.
- `src/render.js`: reusable components and page layouts.
- `src/styles.css`: design tokens, layouts, responsive styles.
- `src/main.js`: navigation, industry selector and contact interactions.
- `src/scroll.js`: GSAP + ScrollTrigger scroll choreography for the homepage.
- `src/metal-flow.js`: the WebGL liquid-metal hero background (Kinetic Metal Flow).
- `scripts/prerender.mjs`: generates complete HTML for every page before the build. Run after editing page templates during development.
- `scripts/prepare-principle-assets.mjs`: generates the four abstract principle visuals from SVG.
- `design/`: generated design concepts, design system and exact image-generation prompts.
- `public/assets/`: full-resolution generated logo and background PNGs, plus optimized WebP versions.

The PNG originals remain available for design use. WebP assets load in the website. The transparent logo was trimmed and resized with Sharp for accurate header sizing. Font files are locally bundled; there are no remote font or analytics requests.

## Contact

The contact form posts form-encoded fields to `/microservice/contact` on the
site's own origin. That endpoint verifies the reCAPTCHA token with Google,
stores the enquiry and emails `info@a1aiagents.com`.

Because the path is relative there is no CORS preflight and nothing to
configure per environment. `VITE_CONTACT_ENDPOINT` overrides it, needed only
if the site is ever served from a different host than the endpoint.

If the request fails the form falls back to building a `mailto:` draft, so an
enquiry is never lost to a network error.

### What the form sends

| Field | Purpose |
|---|---|
| `g-recaptcha-response` | reCAPTCHA v3 token, minted at submit time with action `contact` |
| `website` | Honeypot — a field no human is shown. Always empty from a person |
| `elapsed` | Milliseconds between page load and submit |
| `name`, `email`, `company`, `interest`, `message` | The enquiry |

`website` and `elapsed` are sent so the endpoint can screen on them later
without the browser needing to change. Nothing reads them today.

### What actually blocks spam, and what does not

Only the reCAPTCHA token is checked anywhere but the browser, and even that
does not currently block anything.

The endpoint verifies the token, but `return` does not halt execution on that
platform, so a failed check reports an error **and stores and emails the
submission anyway**. A live reply showed exactly that:

```
"error":   "reCAPTCHA verification failed. Please try again."
"contact": { "success": true, "row": { ... } }
```

So today the captcha makes the form work correctly for real visitors — a
valid token means no error, and they see the success panel — but it does not
keep spam out of the inbox. Fixing that means changing the endpoint so the
insert and the email sit inside the branch where the check passed.
`server/platform-endpoint.txt` has the detail.

The honeypot, the fill timer, the field validation and the five-an-hour
browser cap are courtesies: they keep malformed and accidental submissions off
the wire and make the form pleasant to use. A bot posting straight at the
endpoint runs none of them, and the endpoint's URL and field names are
readable in the built bundle.

### The badge and the disclosure

The floating reCAPTCHA badge is hidden in CSS. Google permits that only where
the standard disclosure appears instead, which is the `.recaptcha-note` line
under the form. **The two have to stay together** — hiding the badge without
that text is a terms violation.

### Running it locally

`npm run dev` mounts a stand-in at `/microservice/contact`
(`scripts/dev-contact.mjs`) that imitates the platform's shape: form-encoded
in, HTTP 200 out, verdict in the body, and the row stored either way. Nothing
is sent; a submission is printed to the terminal.

`DEV_RECAPTCHA_FAIL=1 npm run dev` returns the captcha-failure body, to see
that path without real keys.

### Setting it up

1. Register a **reCAPTCHA v3** site for this domain in the Google admin
   console. Keys are per-domain and work only as a pair.
2. The **secret key** goes in the `/microservice/contact` endpoint, which is
   what calls Google. It must be the partner of the site key below — if the
   endpoint already holds a secret from another pair, the token will be
   rejected no matter what the site key is.
3. Copy `.env.example` to `.env.local`, set `VITE_RECAPTCHA_SITE_KEY`, and
   rebuild.

The Google script loads only when a site key is configured, so a build without
one still makes no third-party request — and sends an empty token, which the
endpoint will reject.

## Content and imagery

Company positioning and product descriptions come from the referenced conversation. The Toronto office is generated brand imagery, not a representation of an actual A1 office. Product availability, performance metrics and certifications are not invented. Source brand assets informed a new transparent wordmark, abstract hero sculpture and branded architectural background.

The masthead is a floating pill: an inset rounded bar with a blurred,
translucent surface, the nav centred and the CTA at the right. The surface
lives on a pseudo-element because `backdrop-filter` on the bar itself would
make it a containing block and clip the Solutions menu hanging below it. That
menu eases down with its items in a short stagger; because `[hidden]` carries
`display:none!important` and cannot be transitioned, it is opened from the
trigger's `aria-expanded` and kept inert when closed with `visibility`.

## Hero

The homepage hero is dark, centred and carries no photograph. Its background is
an animated WebGL field (`src/metal-flow.js`): gold ribbons drifting over
near-black, with the centre of the frame held back so the white-to-gold gradient
headline stays legible. Three constants at the top of that file tune the look —
`flowSpeed`, `waveDensity` and `contrastPower`.

Time enters the shader as bounded oscillation rather than a growing offset. With
a raw `+t` the sampled field wandered into a permanently brighter region and the
gold kept accumulating the longer the page stayed open. The clock also starts
partway into the cycle (`PHASE`), because at `t=0` every drift term sits at its
zero crossing — the field's darkest phase — so the hero opened on pure black.

The canvas carries alpha and `pointer-events:none`, scales to the device pixel
ratio (capped at 2x), stops drawing when the tab is hidden or the hero scrolls
away, and purges its own GL objects on teardown. It is not created at all under
reduced motion or without WebGL, and is hidden below 601px where the gradient
background carries the section alone.

The masthead overlays this hero rather than sitting in a band above it, and
swaps back to its solid treatment once the hero scrolls away — past that point
the page is light again and light nav type would disappear.

## Homepage motion

The homepage uses GSAP with ScrollTrigger (`src/scroll.js`): a hero headline
reveal, an infinite capability marquee, a pinned card stack for the
capabilities section, reveal-on-scroll for each section, counters on the process
steps and a scroll progress bar. The AI workforce section pins and scrolls its agent cards sideways as the page
scrolls down, one card per agent. Below 901px, and under reduced motion, the
pin is dropped and the row becomes a snap-scrolling swipeable strip instead.
The products section pins while a fixed
visual on the left holds and the product steps advance on the right, with a
rail filling to mark progress. The four principles are a carousel: it advances
on its own and yields to the reader through drag, touch swipe, the arrow keys
on the focused track, or the buttons below the card. Autoplay is continuous:
the progress strip under the card is the clock, and each slide changes when
its segment finishes filling. It stands down only during a drag, while the
tab is hidden, and under reduced motion. A bar above each card
fills to show the wait until the next one. The track loops continuously:
clones of the first and last cards sit either end, so passing the last card
moves forward into the first rather than rewinding through the set. The industry section presents a list of
industries beside a detail card that changes when one is selected. The closing
call to action is a parallax: the footer starts tucked up behind it and slides
down into place as the section scrolls away, while the photograph drifts at its
own rate. The footer itself carries an oversized watermark wordmark behind a
centred social block, which fades and rises into place as it comes into view. The
three social links — Facebook, Instagram and LinkedIn — live in the `social`
array in `src/render.js` as `[label, icon key, url]`. They open in a new tab.
There is no X/Twitter account, so that entry was removed rather than left
pointing at `#`.

Motion is an enhancement, never a prerequisite for reading the page. The
elements that animate are only hidden once JavaScript adds the `js-motion` and
`js-stack` classes, so without JavaScript — or with `prefers-reduced-motion` —
every section renders complete and static. The card stack and the product
showcase pin only above 800px; below that both read in normal flow with every
card and product visible.

## Build notes

Vite creates real `.html` routes, requiring no client-side router or special rewrite rules. All page text is pre-rendered and accessible before JavaScript. JavaScript enhances menus, industry tabs, and the contact draft flow. A modern browser is required for these enhancements. Motion respects reduced-motion preferences.
