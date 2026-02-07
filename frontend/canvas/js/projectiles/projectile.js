import { tilesTypes } from "../map.js";

export class Projectile {
  constructor(x, y, angle, owner, damage = 30) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.owner = owner;
    this.damage = damage;
    this.speed = 10;
    this.width = 10;
    this.height = 10;
    this.active = true;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.color = "yellow";
    this.knockback = 0; // Default knockback
  }

  update(map, players) {
    if (!this.active) return;

    this.updatePhysics();
    this.checkCollisions(map, players);
  }

  updatePhysics() {
    this.x += this.vx;
    this.y += this.vy;
  }

  checkCollisions(map, players) {
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize;

    // Map Boundaries
    if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
      this.active = false;
      return;
    }

    // Tile Collision
    const gridCol = Math.floor(this.x / map.tileSize);
    const gridRow = Math.floor(this.y / map.tileSize);
    const tileID = map.getTile(gridCol, gridRow);

    if (tileID === tilesTypes.stone || tileID === tilesTypes.brick) {
      this.active = false;
      return;
    }

    // Player Collision
    players.forEach((player) => {
      if (player !== this.owner && player.health > 0) {
        if (
          this.x < player.x + player.w &&
          this.x + this.width > player.x &&
          this.y < player.y + player.h &&
          this.y + this.height > player.y
        ) {
          player.takeDamage(this.damage);
          if (this.knockback > 0) {
              // Apply knockback based on projectile direction
              // Normalize direction slightly or just use velocity
              player.applyKnockback(this.vx * 0.5 * this.knockback, -5); // Small bump up + push back
          }
          this.active = false;
        }
      }
    });
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.fillRect(0, -this.height / 2, this.width, this.height);
    ctx.restore();
  }
}