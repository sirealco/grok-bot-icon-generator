"""Rebuild source-backed contours without changing the 13 shape IDs or eye assets.

One-time tooling dependency: python -m pip install svgpathtools==1.7.2
Run from any directory: python scripts/sync-shapes.py
"""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from svgpathtools import parse_path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/source'
TARGET = ROOT / 'src/assets.json'
MAPPING = {'circle': 1, 'square': 7, 'triangle': 8, 'hexagon': 9,
           'cloud': 10, 'drop': 11, 'capsule': 12}


def rounded_path(path):
    return re.sub(r'-?\d+\.\d+(?:e[+-]?\d+)?',
                  lambda m: str(round(float(m[0]), 6)), path.d())


def main():
    data = json.loads(TARGET.read_text())
    for shape in data['shapes']:
        if shape['id'] not in MAPPING:
            continue
        file = SOURCE / f"GrokBot_StickerSet_GrokBot-{MAPPING[shape['id']]:02d} BW.svg"
        svg = ET.parse(file).getroot()
        # The white sticker border is separate. The black compound path contains
        # the face outline followed by two eye holes; retain only its first part.
        compounds = [parse_path(e.attrib['d']).continuous_subpaths()
                     for e in svg.iter() if e.tag.rsplit('}', 1)[-1] == 'path']
        face = next(parts[0] for parts in compounds if len(parts) == 3)
        x0, x1, y0, y1 = face.bbox()
        scale = 760 / max(x1 - x0, y1 - y0)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        normalized = face.translated(complex(-cx, -cy)).scaled(scale).translated(512 + 512j)
        shape['d'] = rounded_path(normalized)
        shape['polygon'] = [[round(p.real, 6), round(p.imag, 6)]
                            for p in (normalized.point(i / 256) for i in range(256))]
        shape['source'] = file.name
        shape['sourceFile'] = str(file.relative_to(ROOT))
        shape['sourceSha256'] = hashlib.sha256(file.read_bytes()).hexdigest()
        shape['sourceTransform'] = [scale, 0, 0, scale, 512 - cx * scale, 512 - cy * scale]
        print(f"{shape['id']}: {file.name} (uniform scale only; no rotation)")
    TARGET.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
