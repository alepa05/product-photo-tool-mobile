from rembg import remove
from PIL import Image
import sys
import io

if len(sys.argv) < 3:
    print("Uso: python remove_bg.py input_path output_path")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

with open(input_path, "rb") as f:
    input_bytes = f.read()

# PNG trasparente dopo scontorno
output_bytes = remove(input_bytes)

img = Image.open(io.BytesIO(output_bytes)).convert("RGBA")

# Sfondo bianco finale
white_bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
composited = Image.alpha_composite(white_bg, img).convert("RGB")

composited.save(output_path, "JPEG", quality=95)
print(output_path)
