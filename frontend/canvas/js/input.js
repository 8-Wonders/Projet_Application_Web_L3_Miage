// Tracks the current state of all keys (pressed = true)
export const keys = {};

// Tracks mouse state
export const mouse = { x: 0, y: 0, isDown: false };

// ==========================================
//           EVENT LISTENERS
// ==========================================

/**
 * Sets up global event listeners for keyboard and mouse interaction.
 * @param {Function} getCurrentPlayer - Callback to retrieve the active player instance.
 * @param {HTMLCanvasElement} canvas - Required to calculate mouse coordinates relative to game world.
 */
export function handleInput(getCurrentPlayer, canvas) {
  
  // --- Keyboard ---
  window.addEventListener("keydown", (e) => {
    // 1. Prevent browser scrolling
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }

    // 2. Mark key as pressed
    keys[e.key] = true;

    // 3. Handle "One-Shot" actions
    const player = getCurrentPlayer();
    
    if (!player || player.constructor.name === "Bot") return;

    // 'X': Shoot (Keyboard alternative)
    if (e.key === "x" || e.key === "X") {
      if (player.isAiming) {
        player.shoot(); 
      }
    }

    // 'T': Toggle Aim Mode
    if (e.key === "t" || e.key === "T") {
      player.toggleAim();
    }

    // '1' - '9': Switch Projectile/Ability
    const keyNum = parseInt(e.key);
    if (!isNaN(keyNum) && keyNum > 0) {
      player.switchAbility(keyNum - 1); 
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  // --- Mouse ---
  if (canvas) {
    window.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      mouse.x = (e.clientX - rect.left) * scaleX;
      mouse.y = (e.clientY - rect.top) * scaleY;
    });

    window.addEventListener("mousedown", (e) => {
      mouse.isDown = true;
      const player = getCurrentPlayer();
      
      // If player is aiming and clicks, trigger shoot
      // (Useful for Teleporting via click)
      if (player && player.isAiming && !player.hasFired && player.constructor.name !== "Bot") {
        player.shoot(); 
      }
    });

    window.addEventListener("mouseup", () => {
      mouse.isDown = false;
    });
  }
}

// ==========================================
//           CONTINUOUS LOGIC
// ==========================================

export function handleMovement(player, keys, map) {
  let dx = 0;
  
  if (keys["ArrowLeft"]) {
    dx = -player.speed;
    player.facing = -1; 
  }
  if (keys["ArrowRight"]) {
    dx = player.speed;
    player.facing = 1;  
  }

  if (dx !== 0) player.x += dx;
  player.checkCollision(map, "x");

  if ((keys["ArrowUp"] || keys[" "]) && player.grounded) {
    player.dy = -player.jumpStrength;
    player.grounded = false;
  }

  player.dy += player.gravity;
  player.y += player.dy;
  player.grounded = false; 
  
  player.checkCollision(map, "y");

  const mapHeight = map.level.length * map.tileSize;
  if (player.y + player.height > mapHeight) {
    player.y = mapHeight - player.height;
    player.dy = 0;
    player.grounded = true;
  }

  return Math.abs(dx); 
}

export function handleAiming(player, keys) {
  // 1. Snap Direction
  if (keys["ArrowLeft"]) {
    player.aimAngle = Math.PI; 
    player.facing = -1;
  }
  if (keys["ArrowRight"]) {
    player.aimAngle = 0;       
    player.facing = 1;
  }

  // 2. Rotate Angle
  const direction = player.facing === -1 ? -1 : 1;
  let newAngle = player.aimAngle;

  if (keys["ArrowUp"]) newAngle -= player.aimRotationSpeed * direction;
  if (keys["ArrowDown"]) newAngle += player.aimRotationSpeed * direction;

  // 3. Constrain Angle
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
