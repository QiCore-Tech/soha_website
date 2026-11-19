#!/usr/bin/env python3
"""Build the site's woff2 web fonts from the source files in public/font/.

Run from anywhere:  python3 src/scripts/build-fonts.py
Requires fontTools + brotli (pip install fonttools brotli).

Outputs (next to the sources):
  harmonyos-sans/HarmonyOS_Sans_SC-<W>.latin.woff2       Latin + punctuation, ~20 KB
  harmonyos-sans/HarmonyOS_Sans_SC-<W>.cjk-common.woff2  GB2312 level-1 hanzi + every CJK glyph in the site copy
  harmonyos-sans/HarmonyOS_Sans_SC-<W>.cjk-rare.woff2    remaining CJK glyphs, fetched only when needed
  objectivity/objectivity-<style>[-slanted].woff2        Latin + punctuation
  outfit/Outfit-VariableFont_wght.woff2
  geist_mono/GeistMono-VariableFont_wght.woff2
and the generated stylesheets src/app/fonts-harmonyos.css and
src/app/fonts-objectivity.css.

Re-run after copy changes add uncommon Chinese characters so they move into
the common file (until then they still render, via the rare file).
"""
import os
import re
import sys
from concurrent.futures import ProcessPoolExecutor

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONT_DIR = os.path.join(ROOT, "public", "font")
HARMONYOS_DIR = os.path.join(FONT_DIR, "HarmonyOS Sans", "HarmonyOS_Sans_SC")
OBJECTIVITY_DIR = os.path.join(FONT_DIR, "Objectivity")
HARMONYOS_CSS = os.path.join(ROOT, "src", "app", "fonts-harmonyos.css")
OBJECTIVITY_CSS = os.path.join(ROOT, "src", "app", "fonts-objectivity.css")

# HarmonyOS Sans SC ships these static weights; CSS gets the same numbers.
HARMONYOS_WEIGHTS = [
    ("Thin", 250), ("Light", 300), ("Regular", 400),
    ("Medium", 500), ("Bold", 700), ("Black", 900),
]

# Objectivity has no regular cut: light/medium cover the body range, the
# remaining cuts are for display weights. Slanted files map to `italic`.
OBJECTIVITY_FACES = [
    ("objectivity-thin-10.otf", "objectivity-thin", 100, "normal"),
    ("objectivity-light-6.otf", "objectivity-light", 300, "normal"),
    ("objectivity-medium-8.otf", "objectivity-medium", 500, "normal"),
    ("objectivity-bold-4.otf", "objectivity-bold", 700, "normal"),
    ("objectivity-black-3.otf", "objectivity-black", 900, "normal"),
    ("objectivity-super-9.otf", "objectivity-super", 950, "normal"),
    ("objectivity-light-slanted-5.otf", "objectivity-light-slanted", 300, "italic"),
    ("objectivity-medium-slanted-7.otf", "objectivity-medium-slanted", 500, "italic"),
    ("objectivity-black-slanted-2.otf", "objectivity-black-slanted", 900, "italic"),
]

LATIN_RANGE = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
CJK_RANGE = "U+2E80-2EFF, U+2F00-2FDF, U+3000-303F, U+3040-30FF, U+3100-312F, U+31A0-31BF, U+31F0-31FF, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FE10-FE1F, U+FE30-FE4F, U+FF00-FFEF"
# Chinese mode keeps Chinese punctuation (· — ― ‘ ’ “ ” …) in HarmonyOS
# Sans SC, so the Latin faces skip the punctuation both scripts share.
LATIN_SUBSET_RANGE = "U+0000-00B6, U+00B8-2013, U+2016-2017, U+201A-201B, U+201E-2025, U+2027-2E7F"


def parse_range(spec):
    cps = set()
    for part in spec.split(","):
        lo, _, hi = part.strip()[2:].partition("-")
        cps.update(range(int(lo, 16), int(hi or lo, 16) + 1))
    return cps


def format_range(cps):
    cps = sorted(cps)
    spans, start = [], cps[0]
    for prev, cur in zip(cps, cps[1:] + [None]):
        if cur != prev + 1:
            spans.append(f"U+{start:04X}" if start == prev else f"U+{start:04X}-{prev:04X}")
            start = cur
    return ", ".join(spans)


def common_cjk():
    """GB2312 level-1 hanzi plus GB2312 symbol rows, plus every CJK char in the site copy."""
    chars = set()
    for hi in list(range(0xA1, 0xAA)) + list(range(0xB0, 0xD8)):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(ord(bytes([hi, lo]).decode("gb2312")))
            except UnicodeDecodeError:
                pass
    pattern = re.compile(r"[⺀-⿟　-〿぀-ヿ㄀-ㄯㆠ-ㆿㇰ-ㇿ㐀-䶿一-鿿豈-﫿︐-︟︰-﹏＀-￯]")
    exts = (".ts", ".tsx", ".js", ".mjs", ".json", ".css", ".md", ".html")
    files = [os.path.join(ROOT, "index.html")]
    for top in ("src", "i18n", "public"):
        for dirpath, _, names in os.walk(os.path.join(ROOT, top)):
            files += [os.path.join(dirpath, n) for n in names if n.endswith(exts)]
    for path in files:
        try:
            with open(path, encoding="utf-8") as fh:
                chars.update(ord(c) for c in pattern.findall(fh.read()))
        except (OSError, UnicodeDecodeError):
            pass
    return chars & parse_range(CJK_RANGE)


def build(job):
    src, dst, cps = job
    font = TTFont(src)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    subsetter = subset.Subsetter(opts)
    subsetter.populate(unicodes=cps if cps is not None else font.getBestCmap().keys())
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(dst)
    return f"{os.path.getsize(dst) / 1024:8.1f} KB  {os.path.relpath(dst, ROOT)}"


def face(family, weight, url, unicode_range, style="normal"):
    return (
        "@font-face {\n"
        f'  font-family: "{family}";\n'
        f'  src: url("/font/{url}") format("woff2");\n'
        f"  font-weight: {weight};\n"
        f"  font-style: {style};\n"
        "  font-display: swap;\n"
        f"  unicode-range: {unicode_range};\n"
        "}\n"
    )


def main():
    os.makedirs(os.path.join(FONT_DIR, "harmonyos-sans"), exist_ok=True)
    os.makedirs(os.path.join(FONT_DIR, "objectivity"), exist_ok=True)
    common = common_cjk()
    rare = parse_range(CJK_RANGE) - common
    latin = parse_range(LATIN_RANGE)
    common_range = format_range(common)

    jobs = [
        (os.path.join(FONT_DIR, "outfit", "Outfit-VariableFont_wght.ttf"),
         os.path.join(FONT_DIR, "outfit", "Outfit-VariableFont_wght.woff2"), None),
        (os.path.join(FONT_DIR, "geist_mono", "GeistMono-VariableFont_wght.ttf"),
         os.path.join(FONT_DIR, "geist_mono", "GeistMono-VariableFont_wght.woff2"), None),
    ]
    harmony_css = [
        "/* GENERATED by src/scripts/build-fonts.py — do not edit by hand.\n"
        "   Every HarmonyOS Sans SC weight is a complete face: a Latin subset, a\n"
        "   common-CJK subset and a rare-CJK fallback. The rare face is declared\n"
        "   first with the whole CJK range; overlapping faces are tried\n"
        "   last-declared-first, so the rare file is fetched only for glyphs the\n"
        "   common file lacks. */\n"
    ]
    for name, weight in HARMONYOS_WEIGHTS:
        face_name = f"HarmonyOS_Sans_SC_{name}"
        ttf = os.path.join(HARMONYOS_DIR, f"{face_name}.ttf")
        for suffix, cps in (("latin", latin), ("cjk-common", common), ("cjk-rare", rare)):
            jobs.append((ttf, os.path.join(FONT_DIR, "harmonyos-sans", f"{face_name}.{suffix}.woff2"), cps))
        harmony_css.append(face("HarmonyOS Sans SC", weight, f"harmonyos-sans/{face_name}.latin.woff2", LATIN_RANGE))
        harmony_css.append(face("HarmonyOS Sans SC", weight, f"harmonyos-sans/{face_name}.cjk-rare.woff2", CJK_RANGE))
        harmony_css.append(face("HarmonyOS Sans SC", weight, f"harmonyos-sans/{face_name}.cjk-common.woff2", common_range))

    objectivity_css = [
        "/* GENERATED by src/scripts/build-fonts.py — do not edit by hand.\n"
        "   Objectivity carries English body copy. `Objectivity Latin` is the\n"
        "   same file with a narrower unicode-range, used in Chinese mode so\n"
        "   punctuation shared with Chinese (· — ― ‘ ’ “ ” …) stays HarmonyOS\n"
        "   Sans SC instead of taking Objectivity's narrow Latin glyphs. */\n"
    ]
    for filename, slug, weight, style in OBJECTIVITY_FACES:
        src = os.path.join(OBJECTIVITY_DIR, filename)
        url = f"objectivity/{slug}.woff2"
        jobs.append((src, os.path.join(FONT_DIR, "objectivity", f"{slug}.woff2"), latin))
        objectivity_css.append(face("Objectivity", weight, url, LATIN_RANGE, style))
        objectivity_css.append(face("Objectivity Latin", weight, url, LATIN_SUBSET_RANGE, style))

    with ProcessPoolExecutor() as pool:
        for line in pool.map(build, jobs):
            print(line)
    with open(HARMONYOS_CSS, "w", encoding="utf-8") as fh:
        fh.write("\n".join(harmony_css))
    with open(OBJECTIVITY_CSS, "w", encoding="utf-8") as fh:
        fh.write("\n".join(objectivity_css))
    print(f"wrote {os.path.relpath(HARMONYOS_CSS, ROOT)} ({len(common)} common CJK chars)", file=sys.stderr)
    print(f"wrote {os.path.relpath(OBJECTIVITY_CSS, ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
