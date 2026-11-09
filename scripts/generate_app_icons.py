import math
from PIL import Image, ImageDraw, ImageFilter

def create_gradient_mask(w, h, p1, p2):
    """Linear gradient from p1=(x1, y1) to p2=(x2, y2)."""
    mask = Image.new('L', (w, h))
    pixels = mask.load()
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    dist_sq = dx*dx + dy*dy
    for y in range(h):
        for x in range(w):
            proj = ((x - p1[0])*dx + (y - p1[1])*dy) / dist_sq
            proj = max(0.0, min(1.0, proj))
            pixels[x, y] = int(proj * 255)
    return mask

def interpolate_color(c1, c2, factor):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * factor) for i in range(len(c1)))

def draw_squircle(draw, bbox, radius, fill):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill)

def render_master_icon(size=2048, is_foreground_only=False):
    # High resolution master canvas (2048x2048)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    center = size / 2

    if not is_foreground_only:
        # 1. Dark Luxury Obsidian Background
        # Subtle dark gradient from top-left (#0D111D) to bottom-right (#06080E)
        for y in range(size):
            t = y / size
            bg_col = interpolate_color((13, 17, 29, 255), (6, 8, 14, 255), t)
            draw.line([(0, y), (size, y)], fill=bg_col)

        # 2. Subtle luxury outer ring / card
        outer_pad = size * 0.10
        outer_bbox = [outer_pad, outer_pad, size - outer_pad, size - outer_pad]
        outer_radius = size * 0.22
        # Card background (#131724)
        draw.rounded_rectangle(outer_bbox, radius=int(outer_radius), fill=(19, 23, 36, 255))
        # Subtle 2px stroke
        draw.rounded_rectangle(outer_bbox, radius=int(outer_radius), outline=(255, 255, 255, 22), width=int(size * 0.003))

    # Center tile scale
    tile_size = size * 0.52 if not is_foreground_only else size * 0.44
    tile_half = tile_size / 2
    tile_bbox = [
        int(center - tile_half),
        int(center - tile_half),
        int(center + tile_half),
        int(center + tile_half)
    ]
    tile_radius = int(tile_size * 0.28)

    # 3. Vibrant Sunset Coral Gradient Badge (#FF5E3A -> #FF2A6D)
    gradient_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient_img)

    c_top = (255, 94, 58, 255)    # #FF5E3A
    c_bot = (255, 42, 109, 255)   # #FF2A6D

    # Fill badge with diagonal linear gradient
    for y in range(tile_bbox[1], tile_bbox[3] + 1):
        for x in range(tile_bbox[0], tile_bbox[2] + 1):
            tx = (x - tile_bbox[0]) / tile_size
            ty = (y - tile_bbox[1]) / tile_size
            factor = (tx * 0.4 + ty * 0.6)
            factor = max(0.0, min(1.0, factor))
            col = interpolate_color(c_top, c_bot, factor)
            gradient_img.putpixel((x, y), col)

    # Mask with rounded squircle
    badge_mask = Image.new('L', (size, size), 0)
    b_draw = ImageDraw.Draw(badge_mask)
    b_draw.rounded_rectangle(tile_bbox, radius=tile_radius, fill=255)

    badge_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    badge_img.paste(gradient_img, (0, 0), badge_mask)

    # Subtle badge inner highlight stroke
    b_draw.rounded_rectangle(tile_bbox, radius=tile_radius, fill=None, outline=255, width=int(size * 0.003))

    # Composite badge onto canvas
    canvas = Image.alpha_composite(canvas, badge_img)
    draw = ImageDraw.Draw(canvas)

    # 4. Draw Pure Geometric Downloader Glyph (Arrow + Tray) in Pure White
    # Down Arrow parameters
    arrow_color = (255, 255, 255, 255)
    
    stem_w = int(tile_size * 0.125)
    stem_half_w = stem_w // 2
    
    # Arrow vertical geometry
    stem_top = center - tile_size * 0.28
    arrow_tip_y = center + tile_size * 0.10
    stem_bottom = arrow_tip_y - tile_size * 0.08
    
    # Draw arrow stem (thick vertical bar with rounded top)
    draw.rounded_rectangle(
        [center - stem_half_w, stem_top, center + stem_half_w, stem_bottom],
        radius=stem_half_w,
        fill=arrow_color
    )

    # Draw arrow head (triangle with clean geometric angles)
    head_span = tile_size * 0.26
    head_pts = [
        (center, arrow_tip_y + tile_size * 0.04),  # Tip pointing down
        (center - head_span, arrow_tip_y - tile_size * 0.12),
        (center - head_span * 0.65, arrow_tip_y - tile_size * 0.16),
        (center, arrow_tip_y - tile_size * 0.02),
        (center + head_span * 0.65, arrow_tip_y - tile_size * 0.16),
        (center + head_span, arrow_tip_y - tile_size * 0.12),
    ]
    draw.polygon(head_pts, fill=arrow_color)

    # Draw Tray below arrow
    tray_y = center + tile_size * 0.24
    tray_h = int(tile_size * 0.10)
    tray_w = int(tile_size * 0.54)
    tray_half_w = tray_w // 2
    tray_radius = tray_h // 2

    # Horizontal bottom pill
    draw.rounded_rectangle(
        [center - tray_half_w, tray_y, center + tray_half_w, tray_y + tray_h],
        radius=tray_radius,
        fill=arrow_color
    )

    # Upward lips on tray ends
    lip_w = tray_h
    lip_h = int(tile_size * 0.08)
    # Left lip
    draw.rounded_rectangle(
        [center - tray_half_w, tray_y - lip_h + tray_radius, center - tray_half_w + lip_w, tray_y + tray_h],
        radius=tray_radius,
        fill=arrow_color
    )
    # Right lip
    draw.rounded_rectangle(
        [center + tray_half_w - lip_w, tray_y - lip_h + tray_radius, center + tray_half_w, tray_y + tray_h],
        radius=tray_radius,
        fill=arrow_color
    )

    return canvas

def main():
    print("Generating Master Icons...")

    # 1. Full Master App Icon (1024x1024)
    master = render_master_icon(size=2048, is_foreground_only=False)
    icon_1024 = master.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon_1024.save('d:/react-native/media-downloader/assets/icon.png', 'PNG')
    icon_1024.save('d:/react-native/media-downloader/assets/app-logo.png', 'PNG')
    icon_1024.save('d:/react-native/media-downloader/assets/splash-icon.png', 'PNG')
    print("Saved icon.png, app-logo.png, splash-icon.png")

    # 2. Android Adaptive Foreground (Safe Zone centered, transparent bg)
    fg_master = render_master_icon(size=2048, is_foreground_only=True)
    fg_1024 = fg_master.resize((1024, 1024), Image.Resampling.LANCZOS)
    fg_1024.save('d:/react-native/media-downloader/assets/android-icon-foreground.png', 'PNG')
    print("Saved android-icon-foreground.png")

    # 3. Android Adaptive Background (Clean Solid #080A0F)
    bg_1024 = Image.new('RGB', (1024, 1024), (8, 10, 15))
    bg_1024.save('d:/react-native/media-downloader/assets/android-icon-background.png', 'PNG')
    print("Saved android-icon-background.png")

    # 4. Favicon (48x48)
    fav_48 = icon_1024.resize((48, 48), Image.Resampling.LANCZOS)
    fav_48.save('d:/react-native/media-downloader/assets/favicon.png', 'PNG')
    print("Saved favicon.png")

    print("All app icons successfully generated!")

if __name__ == '__main__':
    main()

