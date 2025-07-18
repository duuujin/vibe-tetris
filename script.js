
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
let gameStarted = false;
let gamePaused = false;

const ROWS = 20;
const COLS = 12;

function createMatrix(rows, cols) {
    const matrix = [];
    while (rows--) {
        matrix.push(new Array(cols).fill(0));
    }
    return matrix;
}

const arena = createMatrix(ROWS, COLS);

const pieces = {
    'T': [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
    ],
    'O': [
        [2, 2],
        [2, 2],
    ],
    'L': [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
    ],
    'J': [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0],
    ],
    'I': [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
    ],
    'S': [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
    ],
    'Z': [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
};

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                // 네모칸 테두리
                context.strokeStyle = '#333';
                context.lineWidth = 0.08;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            } else {
                // 빈 칸에도 연하게 네모칸
                context.strokeStyle = '#444';
                context.lineWidth = 0.05;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (
                m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const piecesNames = Object.keys(pieces);
    player.matrix = pieces[piecesNames[Math.floor(Math.random() * piecesNames.length)]];
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        score = 0;
        updateScore();
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        score += rowCount * 10;
        rowCount *= 2;
    }
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x:0, y:0});
    drawMatrix(player.matrix, player.pos);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId = null;

function update(time = 0) {
    if (gamePaused) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    animationId = requestAnimationFrame(update);
}

const colors = [
    null,
    '#FF0D72', // T
    '#FDF454', // O
    '#FF8C00', // L
    '#0066FF', // J
    '#00F0FF', // I
    '#00FF00', // S
    '#FF0000', // Z
];

let score = 0;

function updateScore() {
    document.getElementById('score').innerText = score;
}

const player = {
    pos: {x:0, y:0},
    matrix: null,
};

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate(1);
    } else if (event.code === 'Space') {
        // 블록을 바닥까지 즉시 내림
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
    }
});

let scoreDiv;

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    gamePaused = false;
    canvas.style.display = 'block';
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    // 점수 표시 영역 추가
    scoreDiv = document.createElement('div');
    scoreDiv.innerHTML = '점수: <span id="score">0</span>';
    scoreDiv.style.margin = '20px';
    document.body.insertBefore(scoreDiv, canvas.nextSibling);
    playerReset();
    updateScore();
    update();
}

function pauseGame() {
    if (!gameStarted || gamePaused) return;
    gamePaused = true;
    pauseBtn.textContent = '계속';
    if (animationId) cancelAnimationFrame(animationId);
}

function resumeGame() {
    if (!gameStarted || !gamePaused) return;
    gamePaused = false;
    pauseBtn.textContent = '정지';
    lastTime = performance.now();
    update(lastTime);
}

pauseBtn.addEventListener('click', () => {
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});

startBtn.addEventListener('click', startGame);
