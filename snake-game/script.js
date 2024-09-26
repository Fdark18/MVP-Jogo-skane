const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Tamanho do quadro e posição inicial
const gridSize = 20; // Tamanho da célula
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let direction = { x: 1, y: 0 };
let food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
let score = 0;
let gameOver = false;

// Controle da direção da cobra
window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && direction.y === 0) {
        direction = { x: 0, y: -1 };
    } else if (event.key === 'ArrowDown' && direction.y === 0) {
        direction = { x: 0, y: 1 };
    } else if (event.key === 'ArrowLeft' && direction.x === 0) {
        direction = { x: -1, y: 0 };
    } else if (event.key === 'ArrowRight' && direction.x === 0) {
        direction = { x: 1, y: 0 };
    }
});

// Função principal de atualização
function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '50px Arial';
        ctx.fillText('Game Over', 50, 200);
        return;
    }

    // Movimento da cobra
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    // Verifica se a cobra bateu nas paredes
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || collisionWithSelf(head)) {
        gameOver = true;
    }

    snake.unshift(head);

    // Verifica se comeu a comida
    if (head.x === food.x && head.y === food.y) {
        score++;
        food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    } else {
        snake.pop(); // Remove o último bloco da cobra se não comer
    }

    // Desenha a tela
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha a comida
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    // Desenha a cobra
    ctx.fillStyle = 'green';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    // Mostra pontuação
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    setTimeout(gameLoop, 100); // Loop a cada 100ms
}

// Verifica colisão com o próprio corpo
function collisionWithSelf(head) {
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    return false;
}

// Inicia o jogo
gameLoop();
