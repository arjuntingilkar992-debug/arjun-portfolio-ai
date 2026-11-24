# Portfolio AI backend (Windows)

## 1. Open the correct folder
In VS Code, open the portfolio root folder. Open Terminal > New Terminal and run:

```powershell
cd backend
py --version
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

If `.env` already exists, do not overwrite it. Open the existing file instead.

If PowerShell blocks activation, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## 2. Configure Gemini
Edit `backend/.env`:
```dotenv
AI_API_KEY=put_your_own_key_here
AI_MODEL=gpt-4o-mini
AI_BASE_URL=
```
Replace `YOUR_GEMINI_API_KEY_HERE` with your Gemini API key. Keep it in `backend/.env` only; never put it in frontend files or commit it. The existing OpenAI-compatible variables (`AI_API_KEY`, `AI_MODEL`, and `AI_BASE_URL`) are retained for alternate provider configurations.

## 3. Start the backend
From the `backend` directory, with `.venv` activated:
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Keep this terminal open. Visit http://127.0.0.1:8000/health. The response should show `status: "ok"` and `ai_configured: true`.

To confirm Gemini can generate a response, run this from another PowerShell terminal:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/chat -Method Post -ContentType 'application/json' -Body '{"message":"Reply with OK","history":[]}'
```
The response should include a `reply`. A successful health check alone does not verify the API key with Gemini.

## 4. Start the portfolio frontend
Open a second VS Code terminal at the portfolio root:
```powershell
cd frontend
py -m http.server 5500
```
Open http://127.0.0.1:5500.

## Troubleshooting
- `No module named uvicorn`: activate `.venv` and run `pip install -r requirements.txt`.
- `Could not import module app`: ensure terminal's current directory is `backend`, then run the uvicorn command above.
- `AI is not configured`: check `backend/.env` has `GEMINI_API_KEY=...`, then restart Uvicorn.
- HTTP 401: key is invalid or revoked.
- HTTP 429: billing/quota/rate limit issue on the API account.
- HTTP 404/model not found: check the model name available to your API account.
- Browser says backend is not running: leave Uvicorn running on port 8000 and serve frontend on port 5500.

The chat uses the latest 12 messages from browser localStorage as short-term memory. It is browser-local, not a cross-device account memory. A read-only portfolio information tool lets the model retrieve the supplied public portfolio facts.
