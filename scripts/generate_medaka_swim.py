"""Create swimming PNGs from the approved fish without redrawing its features.

Requires Pillow and numpy. Run from any directory; the original PNG is read-only.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/assets/images/enemies/medaka/level_1/idle/frame_01.png"
OUTPUT = ROOT / "src/assets/images/enemies/medaka/level_1/swim"
FRAME_COUNT = 16
FRAME_MS = 70
OUTPUT_WIDTH = 768
VERTICAL_PADDING = 110


def build_frame(source, phase):
    width, height = source.size
    canvas_height = height + 2 * VERTICAL_PADDING
    source_x = np.arange(width + 1, dtype=float)
    progress = np.clip((source_x / width - 0.34) / 0.66, 0, 1)
    # The face and gill stay fixed. A smaller second wave leads the main tail beat.
    bend = (80 * progress ** 2 * math.sin(phase)
            + 28 * progress * (1 - progress) * math.sin(2 * phase))
    shortening = 50 * progress ** 2 * math.sin(phase) ** 2
    target_x = source_x - shortening
    fin = np.clip((source_x / width - 0.80) / 0.20, 0, 1)
    fin_scale = 1 - 0.08 * fin * math.sin(phase) ** 2
    center_y = height * (0.56 - 0.04 * source_x / width)

    def inverse(x, y):
        sx = float(np.interp(x, target_x, source_x))
        if x > target_x[-1]:
            sx = width + (x - target_x[-1])
        cy = float(np.interp(sx, source_x, center_y))
        dy = float(np.interp(sx, source_x, bend))
        scale = float(np.interp(sx, source_x, fin_scale))
        sy = cy + (y - VERTICAL_PADDING - cy - dy) / scale
        return sx, sy

    mesh = []
    for left in range(0, width, 16):
        right = min(width, left + 16)
        corners = [inverse(left, 0), inverse(left, canvas_height),
                   inverse(right, canvas_height), inverse(right, 0)]
        mesh.append(((left, 0, right, canvas_height),
                     tuple(value for corner in corners for value in corner)))
    # Premultiplied alpha prevents dark fringes around the translucent fins.
    frame = source.convert("RGBa").transform(
        (width, canvas_height), Image.Transform.MESH, mesh,
        resample=Image.Resampling.BICUBIC)
    size = (OUTPUT_WIDTH, round(canvas_height * OUTPUT_WIDTH / width))
    return frame.resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def save_previews(frames, directory):
    directory.mkdir(parents=True, exist_ok=True)
    frames[0].save(directory / "medaka-swim-preview.webp", save_all=True,
                   append_images=frames[1:], duration=FRAME_MS, loop=0,
                   lossless=True, method=6)
    # A contact sheet is for review only; all game PNGs keep transparent backgrounds.
    cell_width, cell_height = 480, 280
    sheet = Image.new("RGB", (cell_width * 2, cell_height * 2), "#e7f0f4")
    draw = ImageDraw.Draw(sheet)
    for cell, index in enumerate((0, 4, 8, 12)):
        x, y = cell % 2 * cell_width, cell // 2 * cell_height
        preview = frames[index].copy()
        preview.thumbnail((460, 250), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + (cell_width - preview.width) // 2,
                              y + 20 + (250 - preview.height) // 2), preview)
        draw.text((x + 15, y + 8), f"Frame {index + 1:02d}", fill="#15273c")
    sheet.save(directory / "medaka-swim-contact-sheet.jpg", quality=90)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--preview-dir", type=Path)
    args = parser.parse_args()
    original = args.source.read_bytes()
    source = Image.open(args.source).convert("RGBA")
    args.output.mkdir(parents=True, exist_ok=True)
    frames, manifest = [], []
    for index in range(FRAME_COUNT):
        # Sample between neutral poses so every saved frame is distinct.
        frame = build_frame(source, math.tau * (index + 0.25) / FRAME_COUNT)
        box = frame.getchannel("A").getbbox()
        assert box and box[0] > 0 and box[1] > 0
        assert box[2] < frame.width and box[3] < frame.height, "Clipped fin"
        assert frame.getchannel("A").getextrema() == (0, 255)
        path = args.output / f"frame_{index + 1:02d}.png"
        frame.save(path, optimize=True)
        frames.append(frame)
        manifest.append({"file": path.name, "bytes": path.stat().st_size,
                         "bounds": box, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    # Every frame must preserve exactly the same face pixels and alignment.
    face = np.asarray(frames[0])[:, :240]
    assert all(np.array_equal(np.asarray(frame)[:, :240], face) for frame in frames)
    assert len({item["sha256"] for item in manifest}) == FRAME_COUNT
    assert args.source.read_bytes() == original, "The approved original must remain untouched"
    if args.preview_dir:
        save_previews(frames, args.preview_dir)
        (args.preview_dir / "medaka-swim-manifest.json").write_text(
            json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps({"frames": FRAME_COUNT, "size": frames[0].size,
                      "duration_ms": FRAME_COUNT * FRAME_MS,
                      "total_bytes": sum(item["bytes"] for item in manifest),
                      "face_unchanged": True, "no_clipping": True,
                      "source_sha256": hashlib.sha256(original).hexdigest()}))


if __name__ == "__main__":
    main()
