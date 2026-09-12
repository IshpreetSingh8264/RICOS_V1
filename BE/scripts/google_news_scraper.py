#!/usr/bin/env python3
import argparse
import base64
import html
import json
import re
import sys
import time
from urllib.parse import quote_plus
from urllib.request import Request, build_opener, HTTPRedirectHandler

from selenium.webdriver.common.by import By
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options as SeleniumChromeOptions

try:
    import undetected_chromedriver as uc  # type: ignore
    UC_IMPORT_ERROR = ""
except Exception as exc:  # pragma: no cover
    uc = None
    UC_IMPORT_ERROR = str(exc)


BASE_HOST = "https://news.google.com"


def build_search_url(query: str) -> str:
    return (
        f"{BASE_HOST}/search?q={quote_plus(query)}"
        "&hl=en-IN&gl=IN&ceid=IN:en"
    )


def normalize_link(href: str) -> str:
    if not href:
        return ""
    if href.startswith("./"):
        return f"{BASE_HOST}/{href[2:]}"
    if href.startswith("/"):
        return f"{BASE_HOST}{href}"
    return href


def normalize_media_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("//"):
        return f"https:{url}"
    return normalize_link(url)


def get_text_safe(element, selector: str) -> str:
    matches = element.find_elements(By.CSS_SELECTOR, selector)
    if not matches:
        return ""
    return (matches[0].text or "").strip()


def parse_srcset_first_url(srcset: str) -> str:
    if not srcset:
        return ""
    first = srcset.split(",")[0].strip()
    if not first:
        return ""
    return normalize_media_url(first.split(" ")[0].strip())


def pick_image_from_card(card) -> str:
    thumb_nodes = card.find_elements(By.CSS_SELECTOR, "img.Quavad, img.vwBmvb")
    if not thumb_nodes:
        thumb_nodes = card.find_elements(By.CSS_SELECTOR, "img")

    for img in thumb_nodes:
        srcset = img.get_attribute("srcset") or ""
        src = normalize_media_url(img.get_attribute("src") or "")
        candidate = parse_srcset_first_url(srcset) or src
        if candidate and "favicon" not in candidate.lower():
            return candidate

    return ""


def resolve_final_image_url(url: str, cache: dict) -> str:
    if not url:
        return ""
    if "news.google.com/api/attachments" not in url:
        return url
    if url in cache:
        return cache[url]
    try:
        opener = build_opener(HTTPRedirectHandler)
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = opener.open(req, timeout=4)
        final_url = resp.geturl() or url
        cache[url] = final_url
        return final_url
    except Exception:
        cache[url] = url
        return url


def extract_original_url_from_jslog(card) -> str:
    try:
        source_link_nodes = card.find_elements(By.CSS_SELECTOR, "a.WwrzSb")
        if not source_link_nodes:
            return ""

        jslog = source_link_nodes[0].get_attribute("jslog") or ""
        if "5:" not in jslog:
            return ""

        payload = jslog.split("5:", 1)[1].split(";", 1)[0].strip()
        if not payload:
            return ""

        decoded = base64.b64decode(payload + "===").decode("utf-8", errors="ignore")
        links = re.findall(r"https?://[^\"'\s<>\]]+", decoded)
        for candidate in links:
            lowered = candidate.lower()
            if "news.google.com" in lowered or "gstatic.com" in lowered:
                continue
            return candidate
    except Exception:
        return ""

    return ""


def collect_from_page(driver, query: str, max_count: int, bucket: str, image_cache: dict):
    url = build_search_url(query)
    driver.get(url)
    time.sleep(3)

    links = driver.find_elements(By.CSS_SELECTOR, "a.JtKRv")
    collected = []

    for title_link in links:
        if len(collected) >= max_count:
            break

        title = (title_link.text or "").strip()
        href = normalize_link(title_link.get_attribute("href") or "")
        if not title or not href:
            continue

        source = "Google News"
        published = ""
        image_url = ""
        original_url = ""

        aria_label = (title_link.get_attribute("aria-label") or "").strip()
        if aria_label:
            parts = [p.strip() for p in aria_label.split(" - ") if p.strip()]
            if len(parts) >= 2:
                source = parts[1]
            if len(parts) >= 3:
                published = parts[2]

        try:
            card = title_link.find_element(By.XPATH, "ancestor::c-wiz[1]")
            original_url = extract_original_url_from_jslog(card)
            card_html = card.get_attribute("outerHTML") or ""
            links = re.findall(r"https?://[^\"'\s<>]+", html.unescape(card_html))
            if not original_url:
                for candidate in links:
                    lowered = candidate.lower()
                    if (
                        "news.google.com" in lowered
                        or "gstatic.com" in lowered
                        or "google.com" in lowered
                    ):
                        continue
                    original_url = candidate
                    break

            if source == "Google News":
                source_candidate = get_text_safe(card, ".vr1PYe, .wEwyrc, .CEMjEf")
                if source_candidate:
                    source = source_candidate

                time_nodes = card.find_elements(By.CSS_SELECTOR, "time")
                if time_nodes:
                    published = (
                        time_nodes[0].get_attribute("datetime")
                        or (time_nodes[0].text or "").strip()
                        or published
                    )

                image_url = pick_image_from_card(card)
        except Exception:
            pass

        if not image_url:
            try:
                card = title_link.find_element(By.XPATH, "ancestor::c-wiz[1]")
                image_url = pick_image_from_card(card)
            except Exception:
                pass

        collected.append(
            {
                "title": title,
                "description": title,
                "url": href,
                "publishedAt": published,
                "content": title,
                "source": source,
                "image": resolve_final_image_url(image_url, image_cache) if image_url else None,
                "originalUrl": original_url or None,
                "bucket": bucket,
            }
        )

    return collected


def dedupe_articles(items):
    seen = set()
    deduped = []
    for item in items:
        key = (item.get("title", "").strip().lower(), item.get("url", "").strip())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--state", required=True)
    parser.add_argument("--city", default="")
    parser.add_argument("--limit", type=int, default=40)
    args = parser.parse_args()

    location_phrase = f"{args.city} {args.state}".strip()

    local_query = (
        f"(disaster OR flood OR earthquake OR cyclone OR emergency OR landslide OR fire OR protest OR rally OR clash OR riot OR conflict OR war OR attack) "
        f"{location_phrase} India"
    )
    national_query = (
        "(disaster OR flood OR earthquake OR cyclone OR emergency OR landslide OR fire OR protest OR rally OR clash OR riot OR conflict OR war OR attack) India"
    )

    local_limit = max(12, int(args.limit * 0.7))
    national_limit = max(8, args.limit - local_limit)

    def base_args(options_obj):
        options_obj.add_argument("--headless=new")
        options_obj.add_argument("--no-sandbox")
        options_obj.add_argument("--disable-dev-shm-usage")
        options_obj.add_argument("--disable-gpu")
        options_obj.add_argument("--window-size=1400,1200")

    using_uc = False

    driver = None
    try:
        image_cache = {}
        if uc is not None:
            uc_options = uc.ChromeOptions()
            base_args(uc_options)
            driver = uc.Chrome(options=uc_options)
            using_uc = True
        else:
            selenium_options = SeleniumChromeOptions()
            base_args(selenium_options)
            driver = Chrome(options=selenium_options)

        local_items = collect_from_page(driver, local_query, max_count=local_limit, bucket="local", image_cache=image_cache)
        national_items = collect_from_page(driver, national_query, max_count=national_limit, bucket="national", image_cache=image_cache)
        all_items = dedupe_articles(local_items + national_items)

        payload = {
            "success": True,
            "articles": all_items[: args.limit],
            "meta": {
                "state": args.state,
                "city": args.city,
                "localCount": len(local_items),
                "nationalCount": len(national_items),
                "total": min(len(all_items), args.limit),
                "driver": "undetected-chromedriver" if using_uc else "selenium-webdriver",
                "ucImportError": UC_IMPORT_ERROR if not using_uc else "",
            },
        }
        print(json.dumps(payload, ensure_ascii=True))
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc), "articles": []}, ensure_ascii=True))
        sys.exit(1)
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception:
                pass


if __name__ == "__main__":
    main()
