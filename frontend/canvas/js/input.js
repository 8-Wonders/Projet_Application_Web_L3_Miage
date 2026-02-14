// Tracks the current state of all keys (pressed = true)
export const keys = {};

// ==========================================
//           EVENT LISTENERS
// ==========================================

/**
 * Sets up global event listeners for keyboard interaction.
 * @param {Function} getCurrentPlayer - Callback to retrieve the active player instance.
 */
export function handleInput(getCurrentPlayer) {
  window.addEventListener("keydown", (e) => {
    // 1. Prevent browser scrolling when using Arrow Keys or Space
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }

    // 2. Mark key as pressed
    keys[e.key] = true;

    // 3. Handle "One-Shot" actions (Triggered once per press, not held down)
    const player = getCurrentPlayer();
    
    // Safety check: specific logic for Human players only
    if (!player || player.constructor.name === "Bot") return;

    // 'X': Shoot
    if (e.key === "x" || e.key === "X") {
      if (player.isAiming) {
        player.shoot(); // Sets internal flag 'hasFired'
      }
    }

    // 'T': Toggle Aim Mode
    if (e.key === "t" || e.key === "T") {
      player.toggleAim();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
}

// ==========================================
//           CONTINUOUS LOGIC
// ==========================================

/**
 * processes movement physics and collisions.
 * Called every frame in the Game Loop.
 */
export function handleMovement(player, keys, map) {
  let dx = 0;
  
  // --- Horizontal Movement ---
  if (keys["ArrowLeft"]) {
    dx = -player.speed;
    player.facing = -1; // Face Left
  }
  if (keys["ArrowRight"]) {
    dx = player.speed;
    player.facing = 1;  // Face Right
  }

  // Apply horizontal velocity
  if (dx !== 0) player.x += dx;
  
  // Check Wall Collisions (X-axis)
  player.checkCollision(map, "x");

  // --- Vertical Physics (Jumping & Gravity) ---
  
  // Jump: Only if touching the ground
  if ((keys["ArrowUp"] || keys[" "]) && player.grounded) {
    player.dy = -player.jumpStrength;
    player.grounded = false;
  }

  // Apply Gravity
  player.dy += player.gravity;
  player.y += player.dy;
  player.grounded = false; // Assume in air until collision proves otherwise
  
  // Check Floor/Ceiling Collisions (Y-axis)
  player.checkCollision(map, "y");

  // Safety Net: Prevent falling off the bottom of the map
  const mapHeight = map.level.length * map.tileSize;
  if (player.y + player.height > mapHeight) {
    player.y = mapHeight - player.height;
    player.dy = 0;
    player.grounded = true;
  }

  return Math.abs(dx); // Return movement amount (useful for animations)
}

/**
 * Calculates the aiming angle based on arrow keys.
 * Clamps the angle so players can't aim behind themselves.
 */
export function handleAiming(player, keys) {
  // 1. Snap Direction (Immediate turn)
  if (keys["ArrowLeft"]) {
    player.aimAngle = Math.PI; // 180 degrees (Left)
    player.facing = -1;
  }
  if (keys["ArrowRight"]) {
    player.aimAngle = 0;       // 0 degrees (Right)
    player.facing = 1;
  }

  // 2. Rotate Angle (Gradual adjustment)
  // 'direction' flips logic so Up always rotates "upward" regardless of facing
  const direction = player.facing === -1 ? -1 : 1;
  let newAngle = player.aimAngle;

  if (keys["ArrowUp"]) newAngle -= player.aimRotationSpeed * direction;
  if (keys["ArrowDown"]) newAngle += player.aimRotationSpeed * direction;

  // 3. Constrain Angle (Clamp)
  // Prevents 360-degree spinning; limits aim to a forward cone
  let minAngle, maxAngle;

  if (player.facing === 1) {
    // Facing Right: -90° to +90°
    minAngle = -Math.PI / 2;
    maxAngle = Math.PI / 2;
  } else {
    // Facing Left: 90° to 270°
    minAngle = Math.PI / 2;
    maxAngle = (3 * Math.PI) / 2;
  }

  if (newAngle < minAngle) newAngle = minAngle;
  if (newAngle > maxAngle) newAngle = maxAngle;

  player.aimAngle = newAngle;
}
