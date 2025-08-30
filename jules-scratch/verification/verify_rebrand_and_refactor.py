import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # The user needs to provide this URL
    page.goto("http://localhost:8888")

    # Wait for the main app container to load
    app_container = page.locator(".football11-app")
    expect(app_container).to_be_visible(timeout=30000)

    # Check for the new brand name in the header
    header = page.locator(".header .brand-name h1")
    expect(header).to_have_text("بت لحظه")

    # Check for the new subtitle
    subtitle = page.locator(".header .brand-name h2")
    expect(subtitle).to_have_text("پیش‌بینی و نتایج زنده")

    # Check that the main match list is visible
    match_list = page.locator("#match_list")
    expect(match_list).to_be_visible()

    # Wait for at least one match row to be rendered
    # This indicates that the JS and API calls are working
    expect(page.locator(".match-row")).to_have_count(1, timeout=60000)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
