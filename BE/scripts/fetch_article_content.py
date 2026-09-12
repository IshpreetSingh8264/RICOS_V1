#!/usr/bin/env python3
import argparse
import html
import json
import re
from urllib.request import Request, build_opener, HTTPRedirectHandler


def fetch_html(url: str, timeout: int = 20):
    opener = build_opener(HTTPRedirectHandler)
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Accept-Language": "en-IN,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    resp = opener.open(req, timeout=timeout)
    final_url = resp.geturl()
    body = resp.read().decode("utf-8", errors="ignore")
    return final_url, body


def extract_meta(body: str, name: str):
    patterns = [
        rf'<meta[^>]*property=["\']{re.escape(name)}["\'][^>]*content=["\']([^"\']+)["\']',
        rf'<meta[^>]*name=["\']{re.escape(name)}["\'][^>]*content=["\']([^"\']+)["\']',
        rf'<meta[^>]*content=["\']([^"\']+)["\'][^>]*(property|name)=["\']{re.escape(name)}["\']',
    ]
    for pattern in patterns:
        m = re.search(pattern, body, flags=re.IGNORECASE)
        if m:
            return html.unescape(m.group(1)).strip()
    return ""


def clean_text(raw: str) -> str:
    no_tags = re.sub(r"<[^>]+>", " ", raw)
    no_spaces = re.sub(r"\s+", " ", no_tags)
    return html.unescape(no_spaces).strip()


def decode_json_escaped(raw: str) -> str:
    try:
        return bytes(raw, "utf-8").decode("unicode_escape")
    except Exception:
        return raw


def extract_article_body_from_json(body: str) -> str:
    patterns = [
        r'"articleBody"\s*:\s*"([\s\S]*?)"',
        r'"description"\s*:\s*"([\s\S]*?)"',
    ]
    for pattern in patterns:
        matches = re.findall(pattern, body)
        for match in matches:
            text = decode_json_escaped(match)
            text = text.replace('\\/','/').replace('\\"','"')
            text = re.sub(r"\\n|\\r|\\t", " ", text)
            text = clean_text(text)
            if len(text) > 300:
                return text
    return ""


def extract_content(body: str) -> str:
    json_body = extract_article_body_from_json(body)
    if len(json_body) > 300:
        return json_body[:16000]

    body_wo_scripts = re.sub(r"<script[\s\S]*?</script>", " ", body, flags=re.IGNORECASE)
    body_wo_scripts = re.sub(r"<style[\s\S]*?</style>", " ", body_wo_scripts, flags=re.IGNORECASE)

    article_match = re.search(r"<article[\s\S]*?</article>", body_wo_scripts, flags=re.IGNORECASE)
    working = article_match.group(0) if article_match else body_wo_scripts

    paragraphs = re.findall(r"<p[^>]*>([\s\S]*?)</p>", working, flags=re.IGNORECASE)
    cleaned = [clean_text(p) for p in paragraphs]
    cleaned = [c for c in cleaned if len(c) > 40]

    content = "\n".join(cleaned)
    if len(content) > 16000:
        content = content[:16000]
    return content


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()

    try:
        final_url, body = fetch_html(args.url, timeout=args.timeout)

        title_match = re.search(r"<title[^>]*>([\s\S]*?)</title>", body, flags=re.IGNORECASE)
        title = clean_text(title_match.group(1)) if title_match else ""

        description = extract_meta(body, "description") or extract_meta(body, "og:description")
        image = extract_meta(body, "og:image")
        published = extract_meta(body, "article:published_time")
        content = extract_content(body)

        print(
            json.dumps(
                {
                    "success": True,
                    "finalUrl": final_url,
                    "title": title,
                    "description": description,
                    "image": image,
                    "publishedAt": published,
                    "content": content,
                },
                ensure_ascii=True,
            )
        )
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}, ensure_ascii=True))


if __name__ == "__main__":
    main()
