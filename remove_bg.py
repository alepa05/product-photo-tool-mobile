from rembg import remove
from PIL import Image, ImageOps
import sys

input_path = sys.argv[1]
output_path = sys.argv[2]

# apertura immagine
img = Image.open(input_path)
img = ImageOps.exif_transpose(img)

# rimozione sfondo
out = remove(img).convert("RGBA")

# trova il bordo reale del prodotto
bbox = out.getbbox()

if bbox:
    out = out.crop(bbox)

# canvas fisso
canvas_size = 1800

# ridimensiona il prodotto
max_product_size = int(canvas_size * 0.8)

out.thumbnail(
    (max_product_size, max_product_size),
    Image.LANCZOS
)

# sfondo bianco
canvas = Image.new(
    "RGB",
    (canvas_size, canvas_size),
    (255, 255, 255)
)

# centra prodotto
x = (canvas_size - out.width) // 2
y = (canvas_size - out.height) // 2

# incolla mantenendo trasparenza
canvas.paste(out, (x, y), out)

# salva finale
canvas.save(
    output_path,
    "JPEG",
    quality=95
)
