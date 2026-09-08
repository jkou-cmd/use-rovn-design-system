"""Compare local template renders to Paper exports in the same color space."""
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageCms
import argparse
import json
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--out', default='tmp/reference-comparison.json')
parser.add_argument('--check', action='store_true', help='Fail above the report-v1 baseline tolerances')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
results = []
for source in sorted((root / 'design/paper/reference').glob('*.png')):
    rendered = root / 'tmp/reference-render' / source.name
    actual = Image.open(rendered).convert('RGB')
    reference = Image.open(source)
    if 'icc_profile' in reference.info:
        reference = ImageCms.profileToProfile(reference, ImageCms.ImageCmsProfile(BytesIO(reference.info['icc_profile'])), ImageCms.createProfile('sRGB'), outputMode='RGB')
    assert actual.size == reference.size, source.name
    delta = np.abs(np.asarray(actual, dtype=float) - np.asarray(reference.convert('RGB'), dtype=float))
    results.append({'frame': source.stem, 'meanAbsoluteChannelDifference': round(float(delta.mean()), 4), 'pixelsOver20Percent': round(float((delta.max(axis=2) > 20).mean()) * 100, 4)})
out = root / args.out
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(results, indent=2) + '\n')
print(json.dumps(results, indent=2))

if args.check and (len(results) != 17 or any(r['meanAbsoluteChannelDifference'] > 0.75 or r['pixelsOver20Percent'] > 0.5 for r in results)):
    raise SystemExit('Reference comparison exceeds the report-v1 baseline tolerance.')
