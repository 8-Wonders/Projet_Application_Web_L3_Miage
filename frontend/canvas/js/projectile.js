import { tilesTypes } from "./map.js";

export class Projectile {
  // CHANGED: Constructor now takes an angle instead of direction
  constructor(x, y, angle, owner, damage = 30) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.owner = owner;
    this.damage = damage;
    this.speed = 10;
    this.width = 20;
    this.height = 4;
    this.active = true;

    // Calculate velocity based on angle
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  update(map, players) {
    // Move the projectile
    this.x += this.vx;
    this.y += this.vy;

    // Calculate Map Boundaries (for off-screen check)
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize;

    // CHECK TILE COLLISION
    // Convert pixel coordinates (x, y) to grid coordinates (col, row)
    const gridCol = Math.floor(this.x / map.tileSize);
    const gridRow = Math.floor(this.y / map.tileSize);

    // Get the tile ID at this position
    const tileID = map.getTile(gridCol, gridRow);

    // Check for Stone (1) or Brick (2)
    if (tileID === tilesTypes.stone || tileID === tilesTypes.brick) {
      this.active = false; // Destroy projectile
    }

    // Deactivate if off-screen
    if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
      this.active = false;
    }

    // Check Player Collision
    if (this.active && players) {
      players.forEach((player) => {
        if (player !== this.owner) {
          if (
            this.x < player.x + player.w &&
            this.x + this.width > player.x &&
            this.y < player.y + player.h &&
            this.y + this.height > player.y
          ) {
            player.takeDamage(this.damage);
            this.active = false;
          }
        }
      });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle); // Rotate the rectangle to match flight path
    ctx.fillStyle = "red";
    // Draw centered at x,y
    ctx.fillRect(0, -this.height / 2, this.width, this.height);
    ctx.restore();
  }
}
