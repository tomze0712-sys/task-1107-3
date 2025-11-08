const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const FLOOR_HEIGHT = canvas.height - 40;
const PLAYER_RADIUS = 18;
const PLAYER_X = 80;
const GRAVITY = 0.45;
const BASE_JUMP = 7.6;
const MAX_UPWARD_SPEED = -11.5;
const OBSTACLE_MIN_HEIGHT = 40;
const OBSTACLE_MAX_HEIGHT = 140;
const OBSTACLE_WIDTH = 32;
const OBSTACLE_GAP = 1800; // ms
const OBSTACLE_SPEED_START = 3.6;
const SPEED_INCREMENT = 0.0015;

let lastTimestamp = 0;
let spawnTimer = 0;
let speed = OBSTACLE_SPEED_START;
let score = 0;
let best = Number(localStorage.getItem("pink-hopper-best")) || 0;
let gameOver = false;

const player = {
  y: FLOOR_HEIGHT - PLAYER_RADIUS,
  vy: 0,
  color: "#ff5fbf",
};

const obstacles = [];

function resetGame() {
  player.y = FLOOR_HEIGHT - PLAYER_RADIUS;
  player.vy = 0;
  obstacles.length = 0;
  score = 0;
  speed = OBSTACLE_SPEED_START;
  spawnTimer = 0;
  lastTimestamp = 0;
  gameOver = false;
  hideOverlay();
  updateScore();
}

function showOverlay(text) {
  overlay.innerHTML = text;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function updateScore() {
  scoreEl.textContent = Math.floor(score).toString();
  bestEl.textContent = best.toString();
}

function spawnObstacle() {
  const height = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
  const y = FLOOR_HEIGHT - height;
  obstacles.push({
    x: canvas.width + OBSTACLE_WIDTH,
    y,
    width: OBSTACLE_WIDTH,
    height,
  });
}

function drawBackground() {
  ctx.fillStyle = "#141a33";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // floor glow
  const gradient = ctx.createLinearGradient(0, FLOOR_HEIGHT, 0, canvas.height);
  gradient.addColorStop(0, "rgba(255, 95, 191, 0.2)");
  gradient.addColorStop(1, "rgba(12, 18, 40, 0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, FLOOR_HEIGHT, canvas.width, canvas.height - FLOOR_HEIGHT);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_HEIGHT + PLAYER_RADIUS);
  ctx.lineTo(canvas.width, FLOOR_HEIGHT + PLAYER_RADIUS);
  ctx.stroke();
}

function drawPlayer() {
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(255, 95, 191, 0.7)";
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(PLAYER_X, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawObstacles() {
  ctx.fillStyle = "#51d0ff";
  obstacles.forEach((obstacle) => {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

function checkCollisions() {
  return obstacles.some((obstacle) => {
    const withinX =
      PLAYER_X + PLAYER_RADIUS > obstacle.x && PLAYER_X - PLAYER_RADIUS < obstacle.x + obstacle.width;
    const withinY = player.y + PLAYER_RADIUS > obstacle.y;
    return withinX && withinY;
  });
}

function update(delta) {
  if (gameOver) {
    return;
  }

  spawnTimer += delta;
  speed += SPEED_INCREMENT * delta;

  if (spawnTimer >= OBSTACLE_GAP) {
    spawnObstacle();
    spawnTimer = 0;
  }

  obstacles.forEach((obstacle) => {
    obstacle.x -= speed;
  });

  while (obstacles.length && obstacles[0].x + OBSTACLE_WIDTH < -20) {
    obstacles.shift();
  }

  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + PLAYER_RADIUS >= FLOOR_HEIGHT) {
    player.y = FLOOR_HEIGHT - PLAYER_RADIUS;
    player.vy = 0;
  }

  if (checkCollisions()) {
    endGame();
    return;
  }

  score += (delta / 1000) * 10;
  if (score > best) {
    best = Math.floor(score);
    localStorage.setItem("pink-hopper-best", best.toString());
  }
  updateScore();
}

function render() {
  drawBackground();
  drawObstacles();
  drawPlayer();
}

function gameLoop(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  update(delta);
  render();

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  showOverlay(`
    <p>游戏结束！</p>
    <p>得分：<strong>${Math.floor(score)}</strong></p>
    <p>按空格键重新开始</p>
  `);
}

function handleJump(event) {
  if (event.code !== "Space") return;
  event.preventDefault();

  if (gameOver) {
    resetGame();
    return;
  }

  player.vy = Math.max(player.vy - BASE_JUMP, MAX_UPWARD_SPEED);
}

window.addEventListener("keydown", handleJump);

resetGame();
requestAnimationFrame(gameLoop);
