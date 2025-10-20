let circles = []; // 儲存圓的資料 (氣球)
let moveScale = 0.45; 
let explosions = []; 
let explosionInterval = 1000; 

// 背景顏色
let bgColor = [255, 204, 213];

// Macaron Color 陣列與其 Hex 值 (方便規則判斷)
let macaronColors = [
  { rgb: [255, 173, 173], hex: '#FFADAD' }, // 粉色 (目標：加分)
  { rgb: [255, 214, 165], hex: '#FFD6A5' }, 
  { rgb: [253, 255, 182], hex: '#FDFFB6' }, 
  { rgb: [202, 255, 191], hex: '#CAFFBF' }, 
  { rgb: [155, 246, 255], hex: '#9BF6FF' }, 
  { rgb: [160, 196, 255], hex: '#A0C4FF' }, // 靛色 (陷阱：扣分)
  { rgb: [189, 178, 255], hex: '#BDB2FF' }, 
  { rgb: [255, 198, 255], hex: '#FFC6FF' }, 
  { rgb: [255, 255, 252], hex: '#FFFFFC' } 
];

// --- 遊戲狀態變數 ---
// 0: 規則畫面 (RULE), 1: 遊戲中 (PLAY), 2: 成績結算 (END)
let gameState = 0; 
let score = 0; 
let gameDuration = 30; // 遊戲總時長 (秒)
let timer = gameDuration;
let timerStartTime = 0;

// 聲音與爆破相關
let popSound;
let lastExplosionTime = 0;


// --- 1. 預先載入音效 ---
function preload() {
  popSound = loadSound('pop.mp3'); 
}


// --- 2. 設定 (只執行一次) ---
function setup() { 
  createCanvas(windowWidth, windowHeight); 
  background('#ffccd5'); 
  noStroke();
}


// --- 3. 繪圖與動畫 (重複執行) ---
function draw() { 
  background('#ffccd5'); 
  
  switch (gameState) {
    case 0:
      displayRuleScreen();
      break;
    case 1:
      playGame();
      break;
    case 2:
      displayEndScreen();
      break;
  }

  // 左上角文字 (在所有畫面都顯示)
  // 如果在遊戲中，顯示分數和時間，否則只顯示 ID
  if (gameState === 1) {
    displayGameInfo();
  } else {
    textSize(15);
    fill('#4B0082');
    textAlign(LEFT, TOP);
    text('30670', 10, 10);
  }
}


// --- 4. 輔助函式：狀態畫面顯示與處理 ---

function displayGameInfo() {
  // 左上角 ID
  textSize(15);
  fill('#4B0082'); 
  textAlign(LEFT, TOP);
  text('30670', 10, 10);
  
  // 右上角計時與分數
  textSize(24);
  fill(0);
  textAlign(RIGHT, TOP);
  text(`分數: ${score}`, width - 10, 10);
  text(`時間: ${ceil(timer)}`, width - 10, 40);

  // 更新計時器
  if (timer > 0) {
    timer = gameDuration - (millis() - timerStartTime) / 1000;
  } else {
    timer = 0;
    gameState = 2; // 時間結束，進入結算畫面
  }
}

function displayRuleScreen() {
  fill('#ffccd5');
  rect(0, 0, width, height); // 確保覆蓋背景
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(40);
  text('氣球爆破挑戰', width / 2, height / 2 - 100);

  textSize(24);
  text('遊戲規則：點擊畫面開始', width / 2, height / 2 - 40);

  textSize(20);
  // 規則講解
  text('點擊 🎈 粉色氣球 (FFADAD)：+10 分', width / 2, height / 2 + 30);
  text('點擊 🎈 靛色氣球 (A0C4FF)：-5 分', width / 2, height / 2 + 60);
  text('點擊其他顏色：無影響', width / 2, height / 2 + 90);

  textSize(16);
  if (sin(frameCount * 0.1) > 0) {
    text('（點擊任意處開始遊戲）', width / 2, height / 2 + 150);
  }
}

function displayEndScreen() {
  fill('#ffccd5');
  rect(0, 0, width, height); // 確保覆蓋背景
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(50);
  text('挑戰結束！', width / 2, height / 2 - 80);

  textSize(40);
  text(`最終分數: ${score}`, width / 2, height / 2 + 20);

  textSize(20);
  text('（點擊任意處重新開始）', width / 2, height / 2 + 100);
}

function startGame() {
  gameState = 1;
  score = 0;
  timer = gameDuration;
  timerStartTime = millis(); // 記錄開始時間
  circles = []; // 清空現有的氣球
  explosions = []; // 清空現有的爆破
  lastExplosionTime = 0;

  // 重新產生 100 個氣球
  for (let i = 0; i < 100; i++) {
    let r = random(30, 120);
    let speed = map(r, 30, 120, 3, 0.5);
    let colorObj = random(macaronColors); // 從物件中選取
    circles.push({
      x: random(width),
      y: random(height),
      r: r,
      alpha: random(50, 255),
      speed: speed,
      color: colorObj.rgb,
      hex: colorObj.hex // 儲存 Hex 值以便於點擊時判斷顏色
    });
  }

  // 啟動瀏覽器音訊環境 (如果尚未啟動)
  userStartAudio(); 
}

function playGame() {
  // 處理爆破生成（維持原來的邏輯）
  let now = millis();
  if (now - lastExplosionTime > explosionInterval) {
    spawnExplosion();
    lastExplosionTime = now;
  }

  // 繪製爆破效果
  for (let i = explosions.length - 1; i >= 0; i--) {
    let e = explosions[i];
    e.age += deltaTime;
    let life = constrain(e.age / e.duration, 0, 1); 

    push();
    translate(e.x, e.y);
    noStroke();
    for (let p of e.particles) {
      let px = cos(p.angle) * p.radius + p.ox;
      let py = sin(p.angle) * p.radius + p.oy;
      let sizeNow = max(0, p.size * (1 - life));
      let alphaNow = p.alpha * (1 - life);
      if (sizeNow > 0.2) {
        fill(p.color[0], p.color[1], p.color[2], alphaNow);
        ellipse(px, py, sizeNow, sizeNow);
      }
    }
    pop();

    if (e.age >= e.duration) {
      explosions.splice(i, 1);
    }
  }

  // 畫出所有氣球並讓它們往上移動 (保持原有邏輯)
  for (let c of circles) {
    // 繪製氣球與反光... (程式碼與您原本的 draw 氣球部分相同，已省略以避免重複)
    fill(c.color[0], c.color[1], c.color[2], c.alpha);
    ellipse(c.x, c.y, c.r, c.r);

    // 反光方塊邏輯...
    let R = c.r / 2; 
    let side = R * 0.35;
    let halfDiag = side * Math.SQRT2 / 2;
    let d = R - halfDiag - 2;
    if (d < 0) d = 0;
    let offset = d / Math.SQRT2;
    let squareCenterX = c.x + offset;
    let squareCenterY = c.y - offset;
    let sx = squareCenterX - side / 2;
    let sy = squareCenterY - side / 2;
    let corner = side * 0.25; 
    let whiteAlpha = 180; 
    fill(255, 255, 255, whiteAlpha);
    rect(sx, sy, side, side, corner);

    c.y = c.y - c.speed * moveScale; 

    if (c.y < -c.r / 2) {
      c.y = height + c.r / 2;
      // 重生時隨機給予一個新顏色和速度
      let newColorObj = random(macaronColors);
      c.color = newColorObj.rgb;
      c.hex = newColorObj.hex;
      c.r = random(30, 120);
      c.speed = map(c.r, 30, 120, 3, 0.5);
    }
  }
}

// 產生爆破效果與音效 (保持原有邏輯，無需修改)
function spawnExplosion() {

  // 初始化爆破物件
  let ex = {
    x: random(width * 0.1, width * 0.9),
    y: random(height * 0.1, height * 0.9),
    age: 0,
    duration: 1000,
    maxRadius: random(40, 120),
    particles: []
  };

  // 顏色選取：選一對相鄰顏色並確保與背景有對比，否則 fallback 為互補色
  function colorDistSq(a, b) {
    return (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]) + (a[2]-b[2])*(a[2]-b[2]);
  }
  const MIN_DIST_SQ = 5000;
  let baseIdx = floor(random(macaronColors.length));
  let secondIdx = (baseIdx + (random() < 0.5 ? 1 : -1) + macaronColors.length) % macaronColors.length;
  let attempts = 0;
  while (attempts < macaronColors.length) {
    let c1 = macaronColors[baseIdx].rgb;
    let c2 = macaronColors[secondIdx].rgb;
    if (colorDistSq(c1, bgColor) >= MIN_DIST_SQ || colorDistSq(c2, bgColor) >= MIN_DIST_SQ) break;
    baseIdx = (baseIdx + 1) % macaronColors.length;
    secondIdx = (baseIdx + 1) % macaronColors.length;
    attempts++;
  }
  let useFallback = (colorDistSq(macaronColors[baseIdx].rgb, bgColor) < MIN_DIST_SQ && colorDistSq(macaronColors[secondIdx].rgb, bgColor) < MIN_DIST_SQ);
  let fallback1 = [255 - bgColor[0], 255 - bgColor[1], 255 - bgColor[2]];
  let fallback2 = [
    min(255, fallback1[0] + 30),
    min(255, fallback1[1] + 30),
    min(255, fallback1[2] + 30)
  ];

  // 產生一圈小泡泡
  let particleCount = floor(random(10, 18));
  let ringRadius = ex.maxRadius * 0.6;
  for (let i = 0; i < particleCount; i++) {
    let angle = (TWO_PI / particleCount) * i + random(-0.1, 0.1);
    let chosenColor;
    if (useFallback) {
      chosenColor = random() < 0.5 ? fallback1 : fallback2;
    } else {
      chosenColor = random() < 0.5 ? macaronColors[baseIdx].rgb : macaronColors[secondIdx].rgb;
    }
    ex.particles.push({
      angle: angle,
      radius: ringRadius + random(-6, 6),
      size: random(6, 12),
      alpha: random(160, 230),
      ox: random(-4, 4),
      oy: random(-4, 4),
      color: chosenColor
    });
  }

  // 只加入視覺爆破，禁止自動影響氣球或播放音效
  explosions.push(ex);
}

// 檢查點擊並計分
function checkClick(mx, my) {
  // 從後往前檢查，確保點擊到最上層的氣球
  for (let i = circles.length - 1; i >= 0; i--) {
    let c = circles[i];
    let d = dist(mx, my, c.x, c.y);

    if (d < c.r / 2) {
      // 命中氣球！
      
      // 播放爆破音效（僅在聲音已載入且 popSound 可用時播放）
      if (typeof popSound !== 'undefined' && popSound && popSound.isLoaded && popSound.isLoaded()) {
        try { popSound.play(); } catch (e) { /* 忽略播放錯誤 */ }
      }

      // 產生一個爆破視覺效果 (直接在點擊位置產生)
      spawnClickExplosion(c.x, c.y, c.color); 

      // 判斷顏色計分
      if (c.hex === '#FFADAD') { // 粉色氣球
        score += 10;
        console.log(`點擊粉色氣球! Score: ${score}`);
      } else if (c.hex === '#A0C4FF') { // 靛色氣球
        score -= 5;
        console.log(`點擊靛色氣球! Score: ${score}`);
      } else {
        console.log('點擊其他氣球! No score change.');
      }
      
      // 將被點擊的氣球移到底部重生
      c.y = height + c.r / 2 + random(0, 60);
      let newColorObj = random(macaronColors);
      c.color = newColorObj.rgb;
      c.hex = newColorObj.hex;

      // 處理完畢，停止檢查
      return; 
    }
  }
}

// 在點擊位置生成一個小的爆破效果
function spawnClickExplosion(x, y, color) {
  let ex = {
    x: x,
    y: y,
    age: 0,
    duration: 500, // 點擊爆破時間較短
    maxRadius: 30,
    particles: []
  };
  
  let particleCount = 8;
  let ringRadius = ex.maxRadius * 0.8;
  for (let i = 0; i < particleCount; i++) {
    let angle = (TWO_PI / particleCount) * i + random(-0.2, 0.2);
    ex.particles.push({
      angle: angle,
      radius: ringRadius + random(-4, 4),
      size: random(4, 8),
      alpha: 255,
      ox: 0,
      oy: 0,
      color: color
    });
  }
  explosions.push(ex);
}


// --- 5. 處理滑鼠點擊 ---
function mousePressed() {
  switch (gameState) {
    case 0: // 規則畫面 -> 開始遊戲
      startGame();
      break;
    case 1: // 遊戲中 -> 檢查點擊氣球
      checkClick(mouseX, mouseY);
      break;
    case 2: // 結算畫面 -> 重新開始遊戲
      startGame();
      break;
  }
}