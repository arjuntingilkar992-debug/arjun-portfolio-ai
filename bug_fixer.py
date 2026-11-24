import os, json, urllib.request, urllib.error, shutil, datetime, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")
OLLAMA = "http://localhost:11434/api/chat"

ALLOWED = [
    "backend/app/main.py",
    "backend/requirements.txt",
    "frontend/index.html",
    "frontend/script.js",
    "frontend/style.css",
]

def read_project():
    files = {}
    for name in ALLOWED:
        p = ROOT / name
        if p.is_file() and p.stat().st_size < 250_000:
            files[name] = p.read_text(encoding="utf-8", errors="replace")
    return files

def ask_ai(issue, files):
    prompt = f"""
You are a careful software bug-fixing engineer.
The user describes this problem:
{issue}

Project source files:
{json.dumps(files, ensure_ascii=False)}

Return ONLY valid JSON in this exact format:
{{
  "explanation": "short explanation of the bug",
  "changes": [
    {{"file": "frontend/script.js", "content": "COMPLETE new file content"}}
  ]
}}

Rules:
- Only modify files already provided.
- Include complete file contents for every changed file.
- Do not modify .env, API keys, secrets, assets, databases, virtual environments,
  dependencies, server ports, or server startup configuration.
- Do not remove existing features or redesign the website.
- Make the smallest safe fix.
- If you cannot identify a safe fix, return changes as [] and explain why.
- Never invent missing project code.
"""
    data = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are a cautious local code repair assistant. Return valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        "stream": False,
        "format": "json"
    }).encode()

    req = urllib.request.Request(
        OLLAMA,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=180) as response:
        result = json.loads(response.read().decode())
    return json.loads(result["message"]["content"])

def validate(files):
    errors = []
    for name in files:
        path = ROOT / name
        if name.endswith(".py"):
            result = subprocess.run(
                [os.sys.executable, "-m", "py_compile", str(path)],
                capture_output=True, text=True
            )
            if result.returncode:
                errors.append(name + ": " + result.stderr)
        elif name.endswith(".js"):
            if shutil.which("node"):
                result = subprocess.run(
                    ["node", "--check", str(path)],
                    capture_output=True, text=True
                )
                if result.returncode:
                    errors.append(name + ": " + result.stderr)
    return errors

def main():
    print("\n======================================")
    print("        LOCAL AI BUG FIXER")
    print("======================================")
    print("Project:", ROOT)
    print("AI model:", MODEL)
    print("Running servers will NOT be stopped or restarted.")
    print("Protected: .env, assets, databases, virtual environments.")
    print("--------------------------------------")

    while True:
        issue = input("\nIs there anything to fix? (describe problem / exit): ").strip()
        if issue.lower() in ("exit", "quit", "no", "close"):
            print("Bug Fixer closed. Existing servers were not touched.")
            break
        if not issue:
            print("Please describe the problem.")
            continue

        files = read_project()
        if not files:
            print("No supported project source files found.")
            continue

        print("\nScanning project files...")
        try:
            proposal = ask_ai(issue, files)
        except urllib.error.URLError:
            print("\nCannot connect to Ollama.")
            print("Start Ollama and make sure the model is installed:")
            print("  ollama run " + MODEL)
            continue
        except Exception as e:
            print("\nAI request failed:", e)
            continue

        print("\nAI diagnosis:")
        print(proposal.get("explanation", "No explanation returned."))

        changes = proposal.get("changes", [])
        if not changes:
            print("\nNo safe automatic fix was identified.")
            continue

        safe = {}
        for item in changes:
            name = item.get("file", "")
            content = item.get("content")
            if name not in files or not isinstance(content, str):
                print("Rejected unsafe or invalid file change:", name)
                continue
            safe[name] = content

        if not safe:
            print("No permitted changes to apply.")
            continue

        print("\nProposed files:")
        for name in safe:
            print(" -", name)

        approval = input("\nApply these fixes? (yes/no): ").strip().lower()
        if approval not in ("yes", "y"):
            print("Changes cancelled. Project files unchanged.")
            continue

        stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = ROOT / ".bugfixer_backups" / stamp
        backup_dir.mkdir(parents=True, exist_ok=True)

        originals = {}
        try:
            for name, content in safe.items():
                path = ROOT / name
                originals[name] = path.read_bytes()
                backup = backup_dir / name
                backup.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, backup)
                path.write_text(content, encoding="utf-8")

            errors = validate(safe)
            if errors:
                print("\nValidation failed. Rolling back...")
                for name, data in originals.items():
                    (ROOT / name).write_bytes(data)
                for error in errors:
                    print(error)
                print("Rollback complete. Original files restored.")
            else:
                print("\nFIX APPLIED AND CHECKS PASSED.")
                print("Backup:", backup_dir)
                print("No running server was stopped or restarted.")

        except Exception as e:
            for name, data in originals.items():
                (ROOT / name).write_bytes(data)
            print("\nFix failed; original files restored:", e)

if __name__ == "__main__":
    main()
