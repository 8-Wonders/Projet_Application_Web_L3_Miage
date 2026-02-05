export class AssetLoader {
  constructor() {
    this.assets = {};
    this.toLoad = 0;
    this.loaded = 0;
  }

  addImage(key, src) {
    this.toLoad++;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.loaded++;
      console.log(`Loaded asset: ${key}`);
    };
    img.onerror = () => {
      console.error(`Failed to load asset: ${key}`);
      // Still count as "handled" to avoid hanging, or handle error differently
      this.loaded++; 
    };
    this.assets[key] = img;
  }

  isFinished() {
    return this.toLoad === this.loaded;
  }

  get(key) {
    return this.assets[key];
  }

  // Returns a promise that resolves when all assets are loaded
  loadAll() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.isFinished()) {
          resolve(this.assets);
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }
}
