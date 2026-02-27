"""Generate icon.png (128x128) and logo.png (250x100) for the HA add-on.

Design: Stylized salmon (Lachs) in SAP UI5 flat style.
- Clean geometric shapes
- SAP Horizon color palette
- Rounded corners, soft shadows
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "das-home")

# SAP UI5 Horizon palette
SAP_BLUE = (13, 106, 191)        # --sapBrandColor
SAP_DARK = (29, 45, 63)          # --sapShell_Background
SAP_HIGHLIGHT = (0, 112, 242)    # --sapHighlightColor
SAP_POSITIVE = (97, 166, 86)     # --sapPositiveColor
SAP_SALMON_BODY = (250, 135, 117)    # Salmon pink-orange
SAP_SALMON_BELLY = (255, 200, 180)   # Lighter belly
SAP_SALMON_DARK = (210, 90, 70)      # Darker accents
SAP_SALMON_FIN = (220, 110, 90)      # Fin color
SAP_WATER = (0, 112, 242, 40)        # Subtle water


def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2 * radius, y0 + 2 * radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * radius, y0, x1, y0 + 2 * radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * radius, x0 + 2 * radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * radius, y1 - 2 * radius, x1, y1], 0, 90, fill=fill)


def draw_salmon(draw, cx, cy, scale=1.0):
    """Draw a stylized salmon in UI5 flat style - single color, minimal.

    cx, cy = center of the fish
    scale = size multiplier (1.0 = fits in ~80px width)
    """
    s = scale
    color = SAP_SALMON_BODY

    # Fish body - main ellipse shape (facing right)
    body_points = []
    for angle in range(360):
        rad = math.radians(angle)
        rx = 36 * s
        ry = 14 * s
        if 90 < angle < 270:
            ry_local = ry * (0.7 + 0.3 * abs(math.cos(rad)))
        else:
            ry_local = ry
        x = cx + rx * math.cos(rad)
        y = cy + ry_local * math.sin(rad)
        body_points.append((x, y))
    draw.polygon(body_points, fill=color)

    # Tail fin - V-shape on the left
    tail_x = cx - 36 * s
    tail_points = [
        (tail_x, cy),
        (tail_x - 14 * s, cy - 14 * s),
        (tail_x - 4 * s, cy - 2 * s),
        (tail_x, cy),
        (tail_x - 4 * s, cy + 2 * s),
        (tail_x - 14 * s, cy + 14 * s),
        (tail_x, cy),
    ]
    draw.polygon(tail_points, fill=color)

    # Dorsal fin (top)
    dorsal_points = [
        (cx - 2 * s, cy - 13 * s),
        (cx + 12 * s, cy - 12 * s),
        (cx + 16 * s, cy - 20 * s),
        (cx + 6 * s, cy - 13 * s),
    ]
    draw.polygon(dorsal_points, fill=color)

    # Pectoral fin (small, lower-middle)
    pec_points = [
        (cx + 6 * s, cy + 4 * s),
        (cx + 2 * s, cy + 14 * s),
        (cx + 12 * s, cy + 10 * s),
        (cx + 14 * s, cy + 4 * s),
    ]
    draw.polygon(pec_points, fill=color)

    # Eye - white circle with dark pupil (only contrast element)
    eye_x = cx + 26 * s
    eye_y = cy - 3 * s
    eye_r = 4 * s
    draw.ellipse(
        [eye_x - eye_r, eye_y - eye_r, eye_x + eye_r, eye_y + eye_r],
        fill=(255, 255, 255),
    )
    pupil_r = 2.2 * s
    draw.ellipse(
        [eye_x - pupil_r, eye_y - pupil_r, eye_x + pupil_r, eye_y + pupil_r],
        fill=SAP_DARK,
    )


def create_icon(size=128):
    """Create the 128x128 icon with salmon."""
    # Render at 2x for antialiasing, then downscale
    render_size = size * 2
    img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background - SAP dark blue with rounded corners
    draw_rounded_rect(draw, (0, 0, render_size - 1, render_size - 1), 48, SAP_DARK)

    # Subtle inner border
    inner = (35, 55, 78)
    draw_rounded_rect(draw, (8, 8, render_size - 9, render_size - 9), 42, inner)

    # Draw salmon centered
    draw_salmon(draw, render_size // 2, render_size // 2 + 4, scale=2.6)

    # Downscale with antialiasing
    img = img.resize((size, size), Image.LANCZOS)
    return img


def create_logo(width=250, height=100):
    """Create the 250x100 logo with salmon icon + text."""
    # Render at 2x
    rw, rh = width * 2, height * 2
    img = Image.new("RGBA", (rw, rh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Icon portion (left)
    icon_size = 144
    icon_x = 28
    icon_y = (rh - icon_size) // 2

    draw_rounded_rect(
        draw,
        (icon_x, icon_y, icon_x + icon_size, icon_y + icon_size),
        32,
        SAP_DARK,
    )
    inner = (35, 55, 78)
    draw_rounded_rect(
        draw,
        (icon_x + 6, icon_y + 6, icon_x + icon_size - 6, icon_y + icon_size - 6),
        28,
        inner,
    )

    # Salmon in icon
    draw_salmon(
        draw,
        icon_x + icon_size // 2,
        icon_y + icon_size // 2 + 2,
        scale=1.5,
    )

    # Text
    text_x = icon_x + icon_size + 28

    try:
        font_bold = ImageFont.truetype("segoeuib.ttf", 52)
        font_light = ImageFont.truetype("segoeui.ttf", 22)
    except OSError:
        font_bold = ImageFont.load_default()
        font_light = ImageFont.load_default()

    draw.text((text_x, rh // 2 - 42), "das-home", fill=(240, 240, 245), font=font_bold)
    draw.text(
        (text_x, rh // 2 + 20),
        "Home Assistant Dashboard",
        fill=(140, 160, 180),
        font=font_light,
    )

    img = img.resize((width, height), Image.LANCZOS)
    return img


if __name__ == "__main__":
    icon = create_icon(128)
    icon.save(os.path.join(OUTPUT_DIR, "icon.png"), "PNG")
    print("Created icon.png (128x128)")

    logo = create_logo(250, 100)
    logo.save(os.path.join(OUTPUT_DIR, "logo.png"), "PNG")
    print("Created logo.png (250x100)")
