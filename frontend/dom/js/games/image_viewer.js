export class ImageViewerGame {
  constructor(screen, options = {}) {
    this.screen = screen;
    this.lastImage = null;
    this.titleFont = options.titleFont || {
      fontFamily: "EarlyGameBoy, monospace",
      fontSize: 16,
    };
  }

  render() {
    this.screen.clear("cell-c1");
    this.screen.drawTextBitmap(10, 8, "IMAGE LOADER", "cell-c3", this.titleFont);
    this.screen.drawText(10, 40, "PRESS L", "cell-c3");
    this.screen.drawText(10, 50, "TO SELECT", "cell-c3");
    this.screen.drawText(10, 70, "PRESS R", "cell-c3");
    this.screen.drawText(10, 80, "TO RELOAD", "cell-c3");
    if (this.lastImage) {
      this.screen.convertImageToGB(this.lastImage, "cell-c1");
    }
  }

  setImage(image) {
    this.lastImage = image;
  }

  reloadImage() {
    if (this.lastImage) {
      this.screen.convertImageToGB(this.lastImage, "cell-c1");
    } else {
      this.render();
    }
  }
}
