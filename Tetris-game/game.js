const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// Escala do jogo
const scale = 20;
const rows = canvas.height / scale;
const columns = canvas.width / scale;

// Armazena o ID do intervalo do jogo
let gameInterval;

// Peças (Tetriminos)
const tetrominoShapes = [
    [[1, 1, 1, 1]], // I
    [[1, 1],
     [1, 1]],       // O
    [[0, 1, 0],
     [1, 1, 1]],    // T
    [[1, 0, 0],
     [1, 1, 1]],    // J
    [[0, 0, 1],
     [1, 1, 1]],    // L
    [[0, 1, 1],
     [1, 1, 0]],    // S
    [[1, 1, 0],
     [0, 1, 1]]     // Z
];

// Cores das peças
const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

// Cria o contexto de jogo
const arena = createMatrix(columns, rows);

// Objeto jogador
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
};

// Função para criar uma matriz
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Colide as peças
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

// Mescla a peça com a arena
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Rotaciona a peça
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Desenha a matriz
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(
                    (x + offset.x) * scale,
                    (y + offset.y) * scale,
                    scale,
                    scale
                );
            }
        });
    });
}

// Desenha o jogo
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

// Remove linhas completas
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        if (arena[y].every(value => value !== 0)) {
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;

            player.score += rowCount * 10;
            rowCount *= 2;
        }
    }
}

// Atualiza a posição
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    if (gameInterval) {
        requestAnimationFrame(update);
    }
}

// Controle de queda da peça
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        resetPlayer();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// Movimento lateral
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// Rotação da peça
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

// Reset do jogador
function resetPlayer() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(
        pieces[(pieces.length * Math.random()) | 0]
    );
    player.pos.y = 0;
    player.pos.x =
        ((arena[0].length / 2) | 0) -
        ((player.matrix[0].length / 2) | 0);

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

// Cria as peças
function createPiece(type) {
    switch (type) {
        case 'I':
            return [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ];
        case 'L':
            return [
                [0, 2, 0],
                [0, 2, 0],
                [0, 2, 2],
            ];
        case 'J':
            return [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0],
            ];
        case 'O':
            return [
                [4, 4],
                [4, 4],
            ];
        case 'Z':
            return [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0],
            ];
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        case 'T':
            return [
                [0, 7, 0],
                [7, 7, 7],
                [0, 0, 0],
            ];
    }
}

// Atualiza a pontuação
function updateScore() {
    document.getElementById('score').innerText = player.score;
}

// Eventos de teclado
document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        // Esquerda
        playerMove(-1);
    } else if (event.keyCode === 39) {
        // Direita
        playerMove(1);
    } else if (event.keyCode === 40) {
        // Baixo
        playerDrop();
    } else if (event.keyCode === 81) {
        // Q - Rotaciona à esquerda
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        // W - Rotaciona à direita
        playerRotate(1);
    }
});

// Botões de controle
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');

startButton.addEventListener('click', () => {
    if (!gameInterval) {
        resetPlayer();
        updateScore();
        gameInterval = true;
        update();
    }
});

pauseButton.addEventListener('click', () => {
    if (gameInterval) {
        gameInterval = null;
    } else {
        gameInterval = true;
        update();
    }
});

restartButton.addEventListener('click', () => {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    resetPlayer();
    draw();
});

draw();
