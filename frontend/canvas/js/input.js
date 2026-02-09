export const keys = {};

// Now accepts a FUNCTION that returns the current player object
export function handleInput(getCurrentPlayer) {
  window.addEventListener("keydown", (e) => {
    // Prevent default browser scrolling for game keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }

    keys[e.key] = true;

    const player = getCurrentPlayer();

    // Safety: ensure player exists and it's not a bot 
    // (Bots handle their own shooting logic)
    if (!player || player.constructor.name === "Bot") return;

    // Single trigger for shooting
    if (e.key === "x" || e.key === "X") {
      if (player.isAiming) {
        player.shoot(); // This sets player.hasFired = true
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

// ... handleMovement and handleAiming remain mostly the same ...
export function handleMovement(player, keys, map) {
  let dx = 0;
  
  // Horizontal Move
  if (keys["ArrowLeft"]) {
    dx = -player.speed;
    player.facing = -1;
  }
  if (keys["ArrowRight"]) {
    dx = player.speed;
    player.facing = 1;
  }

  // Apply movement
  if (dx !== 0) {
    player.x += dx;
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
  if (player.y + player.height > mapHeight) {
    player.y = mapHeight - player.height;
    player.dy = 0;
    player.grounded = true;
  }

  // Return distance traveled (absolute value of dx)
  return Math.abs(dx);
}

export function handleAiming(player, keys) {
    // ... Copy content from original file, it is fine ...
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
    minAngle = -Math.PI / 2;
    maxAngle = Math.PI / 2;
  } else {
    minAngle = Math.PI / 2;
    maxAngle = (3 * Math.PI) / 2;
  }

  if (newAngle < minAngle) newAngle = minAngle;
  if (newAngle > maxAngle) newAngle = maxAngle;

  player.aimAngle = newAngle;
}
