# Atharva Patil portfolio

A dependency-light single-page portfolio inspired by the motion-first visual structure of the supplied reference website.

## Files
- `index.html` — page structure and content
- `styles.css` — layout, typography, responsive styling and animation states
- `script.js` — loader, navigation, reveal animations, parallax, hover tilt, magnetic buttons, contact mailto

## Run in VS Code
Open this folder in VS Code and use any simple local server extension (for example, Live Server), or run:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

The page uses remote images from the reference site's public image paths and Google Fonts. No npm install or build step is required.

## Notes
- Contact submission opens the visitor's default email client; there is no backend/server required.
- The wording and profile facts are based on the supplied Profile PDF.
- The five visual cards are styled as "Selected Focus" areas rather than claiming projects that are not listed in the supplied PDF.
