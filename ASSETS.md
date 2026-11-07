# Asset provenance

The selection screenshot still defines the same 13 stable shape IDs. The latest 12 user-supplied BW SVGs are preserved unchanged under `assets/source/`.

## Shapes corrected against the uploaded vectors

| Shape ID | Original vector |
| --- | --- |
| circle | GrokBot_StickerSet_GrokBot-01 BW.svg |
| square | GrokBot_StickerSet_GrokBot-07 BW.svg |
| triangle | GrokBot_StickerSet_GrokBot-08 BW.svg |
| hexagon | GrokBot_StickerSet_GrokBot-09 BW.svg |
| cloud | GrokBot_StickerSet_GrokBot-10 BW.svg |
| drop | GrokBot_StickerSet_GrokBot-11 BW.svg |
| capsule | GrokBot_StickerSet_GrokBot-12 BW.svg |

Only the face's black outer subpath is extracted; the white sticker border and the two eye holes are excluded. A uniform scale and translation center the face in the existing 760px drawing area. No rotation, skew, smoothing or independent X/Y scaling is applied. The original proportions and curves are retained with six-decimal coordinate precision. Collision polygons are resampled from the same corrected contours so eye dragging, thumbnails, SVG and PNG exports all use the new geometry.

The seven source-backed records in `src/assets.json` include the source filename, SHA-256 and affine transform. A raster comparison test checks each generated contour against its original SVG, and checks that there is no rotation or nonuniform scaling.

The six remaining selection-image shapes (`spark`, `clover`, `heart`, `flower`, `pentagon`, `star`) have no matching contour in these uploads. They remain the existing screenshot reconstructions; this update does not claim they are original vectors. Files 02–05 repeat the circle with other eyes; 06 is an oval not added to the fixed 13-shape whitelist.

## Rebuild corrected shapes

The Python tool is only needed when changing source assets, not for web builds or Vercel deployment:

```sh
python -m pip install svgpathtools==1.7.2
python scripts/sync-shapes.py
npm test
npm run build
```

The script updates only the seven source-backed shapes and their collision boundaries. Stable shape IDs, the other six shapes, the 12 eye pairs, and palette stay intact. Existing saved candidates continue to refer to the same IDs and their eye positions are fitted on restoration.

## Eyes and palette

Eye pairs were extracted from the 12 originally supplied color SVGs; pair proportions are retained. They are unchanged by this shape correction.

The palette is the existing screenshot-matched 11-color palette, unchanged by this update. Exact HEX values still require confirmation against source artwork; white remains reserved for eyes rather than an extra selectable color.
