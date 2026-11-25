"""Smoke and regression checks for the current single-file build.

Install Playwright and its Chromium browser, or set TAXGO_BROWSER_CHANNEL
to an installed Chromium channel such as msedge. Add --screenshots to
refresh the current sample previews under preview/.
"""

import argparse
import os
import struct
import zlib
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
ENTRY = (ROOT / "dist" / "index.html").as_uri()
SAMPLE_NOTE = "TaxGo QA memo"
FIXED_NOW = "2026-11-25T12:00:00+09:00"


def tiny_png():
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(b"\x00\xff\xe6\x00"))
        + chunk(b"IEND", b"")
    )


def run(screenshots=False):
    with sync_playwright() as playwright:
        channel = os.environ.get("TAXGO_BROWSER_CHANNEL")
        browser = playwright.chromium.launch(**({"channel": channel} if channel else {}))
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            timezone_id="Asia/Tokyo",
            reduced_motion="reduce",
            accept_downloads=True,
        )
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.add_init_script(
            f"""
            const NativeDate = Date;
            const fixedNow = NativeDate.parse("{FIXED_NOW}");
            window.Date = class extends NativeDate {{
              constructor(...args) {{ super(...(args.length ? args : [fixedNow])); }}
              static now() {{ return fixedNow; }}
            }};
            window.BarcodeDetector = class {{
              async detect() {{ return [{{rawValue: "TAXGO-QA-ONLY"}}]; }}
            }};
            """
        )

        def select_tab(tab):
            page.locator(f'.tab[data-arg="{tab}"]').click()

        def shot(name):
            if screenshots:
                page.evaluate("document.fonts.ready")
                page.screenshot(path=str(ROOT / "preview" / f"final-{name}.png"), animations="disabled")

        def key(name):
            return page.locator(f'[data-key="{name}"]')

        def action(name):
            return page.locator(f'[data-act="{name}"]')

        page.goto(ENTRY, wait_until="domcontentloaded")
        expect(page.locator(".welcome")).to_be_visible()
        expect(page.locator(".quick-tile")).to_have_count(4)
        shot("home")

        select_tab("receipts")
        expect(page.locator(".receipt-item")).to_have_count(3)
        expect(page.locator(".receipt-gauge > strong").first).to_have_text("¥4,500")
        shot("receipts")
        key("rc-add").click()
        expect(page.locator("#dlg-receipt")).to_be_visible()
        page.locator("#r-store").fill("QA store")
        page.locator("#it-name-0").fill("QA item")
        page.locator("#it-price-0").fill("7000")
        page.locator("#r-submit").click()
        expect(page.locator(".receipt-item")).to_have_count(4)
        expect(page.locator(".receipt-gauge > strong").first).to_have_text("¥5,137")
        page.reload(wait_until="domcontentloaded")
        expect(page.locator(".receipt-item")).to_have_count(4)

        select_tab("home")
        key("pv-eve").click()
        select_tab("receipts")
        expect(page.locator(".receipt-gauge + .arrival-notice")).to_be_visible()
        page.locator(".arrival-notice [data-act=arrival]").click()
        if action("arrivalCalculate").is_visible():
            action("arrivalCalculate").click()
        key("arrival-apply").click()
        expect(page.locator(".arrival-notice")).to_have_count(0)
        select_tab("departure")
        expect(page.locator(".kiosk-board")).to_have_count(0)
        page.locator("#dep-airport").select_option("fuk")
        expect(page.locator(".kiosk-board")).to_be_visible()
        expect(page.locator(".arrival-applied")).to_be_visible()
        shot("departure")
        key("top-checklist").click()
        expect(page.locator("#dlg-checklist")).to_be_visible()
        page.locator("#dlg-checklist [data-act=close]").first.click()

        select_tab("calendar")
        action("memoEdit").first.click()
        page.locator("#memo-text").fill(SAMPLE_NOTE)
        page.locator("#memo-save").click()
        expect(page.locator(".day-memo-text")).to_have_text(SAMPLE_NOTE)
        global_switch = page.locator("label:has(#rem-global) .switch-track")
        global_switch.click()
        assert page.locator(".reminder-item-toggle input").evaluate_all(
            "(switches) => switches.length > 0 && switches.every(s => !s.checked && s.disabled)"
        )
        global_switch.click()
        key("rem-edit-day").click()
        page.locator("#rem-mode").select_option("daily")
        page.locator("#rem-date").fill("2026-11-28")
        page.locator("#rem-until").fill("2026-12-02")
        page.locator("#form-reminder button[type=submit]").click()
        with page.expect_download() as download:
            action("exportRem").click()
        text = Path(download.value.path()).read_text(encoding="utf-8")
        assert "RRULE:FREQ=DAILY;COUNT=5" in text

        select_tab("wallet")
        # Clear the demo phase strip so the final previews show normal navigation.
        if page.locator("#previewbar").is_visible():
            page.locator("#previewbar [data-act=preview]").click()
        expect(page.locator(".wallet-stack-card")).to_have_count(5)
        shot("wallet")
        key("wallet-qr").click()
        page.locator("#qr-image-input").set_input_files(
            {"name": "qa.png", "mimeType": "image/png", "buffer": tiny_png()}
        )
        expect(page.locator("#dlg-wallet-qr .qr-saved img")).to_be_visible()
        page.reload(wait_until="domcontentloaded")
        key("wallet-qr").click()
        expect(page.locator("#dlg-wallet-qr .qr-saved img")).to_be_visible()
        action("qrRemove").click()
        expect(page.locator("#dlg-wallet-qr .qr-empty")).to_be_visible()
        page.locator("#wallet-qr-close").click()

        key("wallet-guide").click()
        expect(page.locator(".wallet-detail")).to_be_visible()
        action("walletHome").click()
        key("wallet-pick").click()
        expect(page.locator(".pick-category")).to_have_count(5)
        shot("pick")
        page.locator('.pick-category[data-arg="food"]').click()
        product = page.locator(".pick-product")
        expect(product).to_be_visible()
        first_pick = product.inner_text()
        action("pickAgain").first.click()
        expect(product).not_to_have_text(first_pick)
        expect(page.locator(".pick-item-art svg")).to_be_visible()
        action("pickBack").click()
        action("pickBack").click()

        for score in (0, 3, 5):
            key("wallet-quiz").click()
            if score == 0:
                shot("quiz")
            seen = set()
            for round_index in range(5):
                action("quizOpenBag").click()
                prompt = page.locator(".quiz-panel h2").inner_text()
                assert prompt not in seen
                seen.add(prompt)
                answer = page.evaluate("(q) => TAXGO_QUIZ.find(item => item.q.includes(q)).answer", prompt)
                choice = answer if round_index < score else not answer
                page.locator(f'[data-act=quizAnswer][data-arg={str(choice).lower()}]').click()
                expect(page.locator(".quiz-feedback .quiz-source a")).to_be_visible()
                action("quizNext").click()
            expect(page.locator(".quiz-load-bag")).to_have_count(score)
            expect(page.locator(".quiz-crash-bag")).to_have_count(5 if score == 0 else 0)
            action("quizExit").first.click()

        # Direct links and narrow viewports are exercised in every supported language.
        page.evaluate("location.hash = 'guide'")
        expect(page.locator(".wallet-detail")).to_be_visible()
        action("walletHome").click()
        for language in ("ko", "ja", "en"):
            page.locator(f'.languages [data-arg="{language}"]').click()
            for width, height in ((320, 568), (390, 844), (430, 900)):
                page.set_viewport_size({"width": width, "height": height})
                for tab in ("home", "receipts", "departure", "calendar", "wallet"):
                    select_tab(tab)
                    assert page.locator("#view").evaluate("(e) => e.scrollWidth <= e.clientWidth + 1"), (
                        language, width, tab
                    )
                assert page.locator("#view").evaluate("(e) => e.scrollHeight <= e.clientHeight + 1"), (
                    language, width, "wallet scroll"
                )
        assert not errors, errors
        browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--screenshots", action="store_true")
    run(parser.parse_args().screenshots)
    print("ok final browser regression")
