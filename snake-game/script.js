const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fullscreenButton = document.getElementById('fullscreenButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');
const allScoresEl = document.getElementById('allScores');
const gameTimeEl = document.getElementById('gameTime');
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');

// Ajusta o canvas ao tamanho da janela
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
document.addEventListener('fullscreenchange', resizeCanvas);
resizeCanvas();

const gridSize = 20;
let tileCountX = Math.floor(canvas.width / gridSize);
let tileCountY = Math.floor(canvas.height / gridSize);

const snakeCount = 6;

let snakes = [];
let food = {
    x: Math.floor(Math.random() * tileCountX),
    y: Math.floor(Math.random() * tileCountY)
};

// Variáveis para tempo de jogo
let startTime;
let elapsedTime = 0;

// Função para entrar em modo de tela cheia
function enterFullscreen() {
    if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) { /* Safari */
        canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) { /* IE11 */
        canvas.msRequestFullscreen();
    }
}

// Adiciona o evento de clique ao botão
fullscreenButton.addEventListener('click', () => {
    enterFullscreen();
});

// Cria as cobras iniciais
function createSnakes() {
    snakes = []; // Resetar as cobras
    for (let i = 0; i < snakeCount; i++) {
        snakes.push({
            id: i,
            color: i === 0 ? 'green' : getRandomColor(),
            snake: [{ x: Math.floor(Math.random() * tileCountX), y: Math.floor(Math.random() * tileCountY) }],
            direction: { x: 1, y: 0 },
            alive: true,
            score: 0 // Inicializa o score
        });
    }
}

// Função para gerar cores aleatórias para as cobras
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let j = 0; j < 6; j++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

createSnakes();

let direction = { x: 1, y: 0 };

// Controle da direção da cobra do jogador
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

// Função para verificar colisão entre duas cobras
function checkCollision(head1, snake2) {
    for (let segment of snake2) {
        if (head1.x === segment.x && head1.y === segment.y) {
            return true;
        }
    }
    return false;
}

// Função principal de atualização
function gameLoop() {
    if (!startTime) {
        startTime = Date.now();
    } else {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Tempo em segundos
    }

    tileCountX = Math.floor(canvas.width / gridSize);
    tileCountY = Math.floor(canvas.height / gridSize);

    snakes.forEach(snakeObj => {
        if (!snakeObj.alive) return;

        const head = { 
            x: snakeObj.snake[0].x + snakeObj.direction.x, 
            y: snakeObj.snake[0].y + snakeObj.direction.y 
        };

        // Verifica se a cobra atravessa as bordas
        if (head.x < 0) head.x = tileCountX - 1;
        if (head.x >= tileCountX) head.x = 0;
        if (head.y < 0) head.y = tileCountY - 1;
        if (head.y >= tileCountY) head.y = 0;

        // Verifica colisão com outras cobras
        snakes.forEach(otherSnakeObj => {
            if (otherSnakeObj.id !== snakeObj.id && otherSnakeObj.alive) {
                if (checkCollision(head, otherSnakeObj.snake)) {
                    // Cobra que colidiu absorve a outra
                    snakeObj.snake = snakeObj.snake.concat(otherSnakeObj.snake);
                    snakeObj.score += otherSnakeObj.snake.length;
                    otherSnakeObj.alive = false;
                }
            }
        });

        // Atualiza a direção da cobra do jogador
        if (snakeObj.id === 0) {
            snakeObj.direction = direction;
        } else {
            // Movimento automático para cobras "bot"
            if (Math.random() < 0.1) {
                const randomDirection = Math.floor(Math.random() * 4);
                if (randomDirection === 0 && snakeObj.direction.y === 0) {
                    snakeObj.direction = { x: 0, y: -1 };
                } else if (randomDirection === 1 && snakeObj.direction.y === 0) {
                    snakeObj.direction = { x: 0, y: 1 };
                } else if (randomDirection === 2 && snakeObj.direction.x === 0) {
                    snakeObj.direction = { x: -1, y: 0 };
                } else if (randomDirection === 3 && snakeObj.direction.x === 0) {
                    snakeObj.direction = { x: 1, y: 0 };
                }
            }
        }

        snakeObj.snake.unshift(head);

        // Verifica se comeu a comida
        if (head.x === food.x && head.y === food.y) {
            snakeObj.score += 1; // Incrementa o score
            food = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };
        } else {
            snakeObj.snake.pop();
        }

        // Verifica se a cobra do jogador foi morta
        if (snakeObj.id === 0 && !snakeObj.alive) {
            endGame();
        }
    });

    // Verifica se o jogador foi morto
    const player = snakes.find(snake => snake.id === 0);
    if (player && !player.alive) {
        endGame();
        return;
    }

    // Desenha a tela
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha a comida
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    // Desenha as cobras
    snakes.forEach(snakeObj => {
        if (!snakeObj.alive) return;
        ctx.fillStyle = snakeObj.color;
        snakeObj.snake.forEach(segment => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        });
    });

    // Mostra a pontuação do jogador e o tempo
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + player.score, 10, 40);
    ctx.fillText('Tempo: ' + elapsedTime + 's', 10, 70);

    setTimeout(gameLoop, 100);
}

// Função para encerrar o jogo
function endGame() {
    // Calcula o tempo total de jogo
    const totalTime = elapsedTime;

    // Exibe a tela de Game Over
    gameOverScreen.classList.remove('hidden');

    // Mostra o score final do jogador
    finalScoreEl.textContent = `Seu Score: ${snakes[0].score}`;

    // Mostra os scores de todas as cobras
    let allScoresText = 'Scores das Cobrinhas:\n';
    snakes.forEach(snakeObj => {
        allScoresText += `- Cobra ${snakeObj.id + 1} (${snakeObj.color}): ${snakeObj.score}\n`;
    });
    allScoresEl.textContent = allScoresText;

    // Mostra o tempo de jogo
    gameTimeEl.textContent = `Tempo de Partida: ${totalTime} segundos`;

    // Pausa o jogo removendo a função gameLoop
    // Isso pode ser feito usando uma flag, mas como usamos setTimeout, simplesmente retornamos na próxima chamada
}

// Função para reiniciar o jogo
function restartGame() {
    // Oculta a tela de Game Over
    gameOverScreen.classList.add('hidden');

    // Resetar variáveis
    createSnakes();
    direction = { x: 1, y: 0 };
    food = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
    startTime = null;
    elapsedTime = 0;

    // Reinicia o game loop
    gameLoop();
}

// Função para sair do jogo
function exitGame() {
    window.location.href = 'thankyou.html';
}

// Adiciona os eventos aos botões
restartButton.addEventListener('click', restartGame);
exitButton.addEventListener('click', exitGame);

// Inicia o jogo
gameLoop();
