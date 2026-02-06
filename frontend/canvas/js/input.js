export const keys = {};

export function handleInput(player) {
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;

    // Single trigger for shooting
    if (e.key === "x" || e.key === "X") {
      if (player.isAiming) {
        player.shoot();
      }
    }

    if (e.key === "t" || e.key === "T") {
      player.toggleAim();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
}

export function handleMovement(player, keys, map) {
  // Horizontal Move
  if (keys["ArrowLeft"]) {
    player.x -= player.speed;
    player.facing = -1;
  }
  if (keys["ArrowRight"]) {
    player.x += player.speed;
    player.facing = 1;
  }
  player.checkCollision(map, "x");

  // Jumping
  if ((keys["ArrowUp"] || keys[" "]) && player.grounded) {
    player.dy = -player.jumpStrength;
    player.grounded = false;
  }

  // Vertical Physics
  player.dy += player.gravity;
  player.y += player.dy;
  player.grounded = false;
  player.checkCollision(map, "y");

  // Floor Boundary
  const mapHeight = map.level.length * map.tileSize;
  if (player.y + player.h > mapHeight) {
    player.y = mapHeight - player.h;
    player.dy = 0;
    player.grounded = true;
  }
}

export function handleAiming(player, keys) {
  // Directional Snap (Left/Right)
  if (keys["ArrowLeft"]) {
    player.aimAngle = Math.PI;
    player.facing = -1;
  }
  if (keys["ArrowRight"]) {
    player.aimAngle = 0;
    player.facing = 1;
  }

  // Rotation (Up/Down)
  const direction = player.facing === -1 ? -1 : 1;
  let newAngle = player.aimAngle;

  if (keys["ArrowUp"]) newAngle -= player.aimRotationSpeed * direction;
  if (keys["ArrowDown"]) newAngle += player.aimRotationSpeed * direction;

  // Constraints (Clamp Angle)
  let minAngle, maxAngle;

  if (player.facing === 1) {
    // Right Side: -90 (Up) to 90 (Down)
    minAngle = -Math.PI / 2;
    maxAngle = Math.PI / 2;
  } else {
    // Left Side: 90 (Down) to 270 (Up)
    minAngle = Math.PI / 2;
    maxAngle = (3 * Math.PI) / 2;
  }

  // Apply Clamp
  if (newAngle < minAngle) newAngle = minAngle;
  if (newAngle > maxAngle) newAngle = maxAngle;

  player.aimAngle = newAngle;
}
