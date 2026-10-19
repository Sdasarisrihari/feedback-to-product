"""
Signed-in persistence + citation-integrity end-to-end check against the running preview.
Requires a real confirmed account; mint a session with `lovable auth-session --json` first.
The account's workspace must be EMPTY (first run) so the one-time browser import offer appears.
Prints PASS/FAIL per step; results are copied by hand into docs/QA_REPORT.md.
"""
import asyncio, json, os
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
results = []
def check(name, ok, detail=""):
    results.append((name, bool(ok))); print(("PASS " if ok else "FAIL ") + name, detail)

async def counts(pg):
    return await pg.evaluate("""() => document.body.innerText""")

async def saved(pg, timeout=60000):
    await pg.wait_for_selector("text=All changes saved", timeout=timeout)

async def main():
    with open(os.path.expanduser("~/.cache/lovable-auth/session.json")) as f:
        minted = json.load(f)
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width": 1280, "height": 1800})
        pg = await ctx.new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        # 1. signed-out demo creates browser data
        await pg.goto(BASE + "/feedback"); await pg.wait_for_timeout(2500)
        local_records = await pg.evaluate("() => JSON.parse(localStorage.getItem('voc-workspace-v1')).records.length")
        check("signed-out demo has browser data", local_records > 0, f"{local_records} records")
        # 2. sign in (restore session) → import offer
        await pg.evaluate("([k, v]) => localStorage.setItem(k, v)", [minted["storage_key"], json.dumps(minted["session"])])
        await pg.goto(BASE + "/"); await pg.wait_for_timeout(4000)
        offer = await pg.get_by_text("Copy this browser's data into your account?").count()
        check("one-time import offer shown for empty account", offer == 1)
        if offer:
            await pg.get_by_role("button", name="Import into my account").click()
            await saved(pg)
        # 3. reload restores from the cloud
        await pg.reload(); await pg.wait_for_timeout(4000)
        check("no import offer after import", await pg.get_by_text("Copy this browser's data").count() == 0)
        body = await counts(pg)
        check("records restored after reload", str(local_records) in body, "overview shows record count")
        # 4. duplicate import does not add unique records
        await pg.goto(BASE + "/feedback"); await pg.wait_for_timeout(2000)
        before = await pg.evaluate("() => document.body.innerText.match(/(\\d+) record/)?.[1]")
        btn = pg.get_by_role("button", name="Load sample data")
        if await btn.count():
            await btn.first.click(); await saved(pg)
        await pg.reload(); await pg.wait_for_timeout(4000)
        print("records label before/after duplicate import:", before, await pg.evaluate("() => document.body.innerText.match(/(\\d+) record/)?.[1]"))
        # 5. AI analysis + PRD with server-verified provenance
        await pg.goto(BASE + "/insights"); await pg.wait_for_timeout(2500)
        await pg.get_by_role("button", name="Run AI analysis").click()
        await pg.wait_for_selector("text=Sources checked on the server", timeout=300000)
        check("analysis sources checked server-side", True)
        await pg.goto(BASE + "/prd"); await pg.wait_for_timeout(2500)
        await pg.get_by_role("button", name="Generate PRD").click()
        await pg.wait_for_selector("text=Sources checked on the server", timeout=300000)
        check("PRD sources checked server-side", True)
        await pg.get_by_role("button", name="Edit").click(); await pg.wait_for_timeout(500)
        await pg.get_by_role("button", name="Save").first.click(); await saved(pg)
        # 6. tampered / unknown sources rejected by the server
        res = await pg.evaluate("""async () => {
          const m = await import('/src/lib/voc/generate.functions.ts');
          const r = await m.generatePrd({ data: { theme: { name: 'x', summary: '', productArea: '', kind: 'pain_point' },
            feedback: [{ id: 'FB-1001', text: 'TAMPERED text that is not saved', segment: 'smb', source: 'support' }, { id: 'NOPE-1', text: 'unknown', segment: 'smb', source: 'support' }], docs: [] } });
          return r; }""")
        check("tampered + unknown sources refused", res.get("ok") is False and res.get("code") == "source_rejected", res.get("code"))
        # 7. reload keeps PRD + 2 revisions + analysis
        await pg.reload(); await pg.wait_for_timeout(4000)
        await pg.goto(BASE + "/prd"); await pg.wait_for_timeout(3000)
        check("PRD revision history persisted", await pg.get_by_text("revision 2").count() > 0)
        await pg.goto(BASE + "/insights"); await pg.wait_for_timeout(3000)
        check("AI analysis persisted", await pg.get_by_text("Sources checked on the server").count() > 0)
        # 8. save failure + retry
        await pg.goto(BASE + "/tasks"); await pg.wait_for_timeout(2000)
        await pg.route("**/_serverFn/**", lambda r: r.abort())
        await pg.goto(BASE + "/settings"); await pg.wait_for_timeout(1500)
        await pg.evaluate("() => { const s = document.querySelector('input[type=range]'); if (s) { s.value = String(Number(s.value) === 1 ? 2 : 1); s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); } }")
        await pg.wait_for_timeout(3000)
        failed = await pg.get_by_text("Not saved").count()
        await pg.unroute("**/_serverFn/**")
        if failed:
            await pg.get_by_role("button", name="Retry").click(); await saved(pg)
        check("save failure surfaced and retry saved", failed > 0)
        # 9. sign out → demo data intact
        await pg.get_by_role("button", name="Sign out").click(); await pg.wait_for_timeout(3000)
        check("signed out returns to browser demo", await pg.get_by_text("Demo · saved in this browser only").count() == 1)
        check("no page errors", not errs, "; ".join(errs[:3]))
        await pg.screenshot(path="/tmp/browser/e2e_final.png")
        await b.close()
    print(f"{sum(ok for _, ok in results)}/{len(results)} passed")

asyncio.run(main())
