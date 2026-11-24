# Arjun Tingilkar Portfolio

A multi-file, editable portfolio starter built with HTML, CSS, JavaScript, and an optional Python/FastAPI AI backend.

## Project structure

```text
arjun_tingilkar_portfolio/
├── frontend/
│   ├── index.html       # Page content and sections
│   ├── style.css        # Theme, layout, responsive styling, cursor effects
│   ├── script.js        # Navigation, animations, email copy, AI chat
│   └── assets/          # Add project screenshots/images here
└── backend/
    ├── app/
    │   ├── __init__.py
    │   └── main.py      # FastAPI AI endpoint
    ├── .env.example     # Safe template; copy to .env
    ├── .gitignore
    ├── requirements.txt
    └── README.md
```

## Quick start

1. Open `frontend/index.html` in your browser or use VS Code Live Server.
2. Update text and project details in `frontend/index.html`.
3. Change visual styles in `frontend/style.css`.
4. Change interactions and backend URL in `frontend/script.js`.
5. For AI setup, follow `backend/README.md`.

## Contact links

- Email: `arjuntingilkar992@gmail.com` (opens a new email draft via `mailto:`)
- WhatsApp: `https://wa.me/919392424428`

GitHub and LinkedIn are intentionally placeholders until you provide profile URLs.

## Cursor and animation

The custom dot/ring cursor, hover expansion, magnetic buttons, 3D hero-card tilt, and scroll reveal are included. Touch devices and reduced-motion settings use safer fallbacks.

## Before publishing

- Replace generic project descriptions with accurate information.
- Add real project links/screenshots to `frontend/assets/`.
- Add GitHub/LinkedIn links when ready.
- Configure AI secrets only in `backend/.env`; do not commit this file.
- For production hosting, deploy frontend and backend appropriately, set the correct API URL and trusted CORS origins, and add rate limiting/authentication to the AI endpoint.
