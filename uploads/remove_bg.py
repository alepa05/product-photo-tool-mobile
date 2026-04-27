from rembg import remove
from PIL import Image, ImageOps
import sys

input_path = sys.argv[1]
output_path = sys.argv[2]

img = Image.open(input_path)
img = ImageOps.exif_transpose(img)

out = remove(img).convert("RGBA")

white_bg = Image.new("RGBA", out.size, (255, 255, 255, 255))
white_bg.paste(out, (0, 0), out)

rgb = white_bg.convert("RGB")

canvas_size = 1800
canvas = Image.new("RGB", (canvas_size, canvas_size), (255, 255, 255))

rgb.thumbnail((canvas_size, canvas_size), Image.LANCZOS)

x = (canvas_size - rgb.width) // 2
y = (canvas_size - rgb.height) // 2

canvas.paste(rgb, (x, y))
canvas.save(output_path, "JPEG", quality=95)
