# save as qr_generator.py
import qrcode
from PIL import Image

def generate_qr(data: str,
                filename: str = "qrcode.png",
                box_size: int = 10,
                border: int = 4,
                error_correction: str = "M",
                fill_color: str = "black",
                back_color: str = "white",
                embed_logo_path: str = None,
                logo_size_ratio: float = 0.2):
    ec_map = {"L": qrcode.constants.ERROR_CORRECT_L,
              "M": qrcode.constants.ERROR_CORRECT_M,
              "Q": qrcode.constants.ERROR_CORRECT_Q,
              "H": qrcode.constants.ERROR_CORRECT_H}
    ec = ec_map.get(error_correction.upper(), qrcode.constants.ERROR_CORRECT_M)
    
    qr = qrcode.QRCode(
        error_correction=ec,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fill_color, back_color=back_color).convert("RGBA")
    
    if embed_logo_path:
        logo = Image.open(embed_logo_path).convert("RGBA")
        qr_w, qr_h = img.size
        logo_max_size = int(min(qr_w, qr_h) * logo_size_ratio)
        logo.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
        lx = (qr_w - logo.width) // 2
        ly = (qr_h - logo.height) // 2
        img.paste(logo, (lx, ly), logo)
    
    img.save(filename)
    return filename

if __name__ == "__main__":
    # simple usage example
    generate_qr("https://maps.app.goo.gl/kvvRWr1hJDfy5sss7", filename="qrcode.png", box_size=8, error_correction="H")
    print("Saved qrcode.png")