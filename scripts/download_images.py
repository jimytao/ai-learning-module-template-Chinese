#!/usr/bin/env python3
"""Parse <!-- imageQuery: "..." | target: "..." --> from a markdown file and download via Brave Image Search.

Usage:
  set BRAVE_API_KEY=your_key
  python scripts/download_images.py content/magazines/magazine01_xxx.md
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request

QUERY_RE = re.compile(
    r'<!--\s*imageQuery:\s*["\']([^"\']+)["\']\s*\|\s*target:\s*["\']([^"\']+)["\']\s*-->'
)


def clean_query(query: str) -> str:
    return query.strip().strip('"').strip("'")


def search_and_download_brave(query: str, target_filename: str, workspace_dir: str, api_key: str) -> bool:
    images_dir = os.path.join(workspace_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    target_path = os.path.join(images_dir, target_filename)

    encoded_query = urllib.parse.quote(query)
    url = f"https://api.search.brave.com/res/v1/images/search?q={encoded_query}"
    headers = {"Accept": "application/json", "X-Subscription-Token": api_key}

    image_urls: list[str] = []
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as response:
            res = json.loads(response.read().decode("utf-8"))
            for r in res.get("results", []):
                orig = r.get("properties", {}).get("url")
                thumb = r.get("thumbnail", {}).get("src")
                if orig:
                    image_urls.append(orig)
                if thumb:
                    image_urls.append(thumb)
    except Exception as e:
        print(f"Error querying Brave for '{query}': {e}")
        return False

    if not image_urls:
        print(f"No image URLs for '{query}'")
        return False

    download_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
    }

    for idx, img_url in enumerate(image_urls):
        print(f"  [{idx + 1}/{len(image_urls)}] Trying: {img_url}")
        try:
            download_req = urllib.request.Request(img_url, headers=download_headers)
            with urllib.request.urlopen(download_req, timeout=8) as dl_resp:
                data = dl_resp.read()

            if len(data) < 5120:
                print(f"  Skipped: too small ({len(data)} bytes)")
                continue

            is_jpg = data[:3] == b"\xff\xd8\xff"
            is_png = data[:8] == b"\x89PNG\r\n\x1a\n"
            is_webp = data[:4] == b"RIFF" and data[8:12] == b"WEBP"
            is_gif = data[:6] in (b"GIF87a", b"GIF89a")
            if not (is_jpg or is_png or is_webp or is_gif):
                print(f"  Skipped: unknown magic bytes {data[:12]!r}")
                continue

            with open(target_path, "wb") as f:
                f.write(data)
            print(f"  OK ({len(data) // 1024}KB) -> {target_path}")
            return True
        except Exception as dl_err:
            print(f"  Failed attempt {idx + 1}: {dl_err}")

    print(f"All download attempts failed for '{query}'")
    return False


def main() -> None:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.dirname(script_dir)

    if len(sys.argv) < 2:
        print("Usage: python scripts/download_images.py <path-to.md>")
        sys.exit(1)

    target_file = sys.argv[1]
    if not os.path.isabs(target_file):
        target_file = os.path.join(workspace_dir, target_file)

    if not os.path.exists(target_file):
        print(f"File not found: {target_file}")
        sys.exit(1)

    api_key = os.environ.get("BRAVE_API_KEY", "").strip()
    if not api_key:
        print("Missing BRAVE_API_KEY environment variable.")
        sys.exit(1)

    with open(target_file, "r", encoding="utf-8") as f:
        content = f.read()

    queries = QUERY_RE.findall(content)
    if not queries:
        print("No imageQuery tags found.")
        sys.exit(0)

    print(f"Found {len(queries)} image queries in {target_file}")
    success = 0
    failed = []
    for query, target in queries:
        cleaned = clean_query(query)
        print(f"\nProcessing '{cleaned}' -> {target}")
        if search_and_download_brave(cleaned, target, workspace_dir, api_key):
            success += 1
        else:
            failed.append((cleaned, target))

    print(f"\nDone. {success}/{len(queries)} images downloaded.")
    if failed:
        print("Failed:")
        for q, t in failed:
            print(f"  - {t} | {q}")
        print("Tip: make imageQuery more concrete (person + action + object).")


if __name__ == "__main__":
    main()
