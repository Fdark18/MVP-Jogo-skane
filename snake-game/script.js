// Seleciona os elementos do DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');
const scoreBoard = document.getElementById('scoreBoard');

// Configurações do jogo
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let gameInterval;
let bots = [];
let foods = [];

// Classe para representar uma cobra
class Snake {
    constructor(color, isBot = false) {
        this.x = Math.floor(Math.random() * tileCount);
        this.y = Math.floor(Math.random() * tileCount);
        this.dx = 0;
        this.dy = 0;
        this.cells = [];
        this.maxCells = 4;
        this.color = color;
        this.isBot = isBot;
        this.score = 0;
        this.alive = true;
        this.changeDirectionCooldown = 0;
    }

    update() {
        if (!this.alive) return;

        // Movimento
        this.x += this.dx;
        this.y += this.dy;

        // Teletransporte nas bordas
        if (this.x < 0) {
            this.x = tileCount - 1;
        } else if (this.x >= tileCount) {
            this.x = 0;
        }

        if (this.y < 0) {
            this.y = tileCount - 1;
        } else if (this.y >= tileCount) {
            this.y = 0;
        }

        // Armazena a posição atual
        this.cells.unshift({ x: this.x, y: this.y });

        // Remove o excesso de células
        if (this.cells.length > this.maxCells) {
            this.cells.pop();
        }

        // Lógica de bot
        if (this.isBot && this.changeDirectionCooldown === 0) {
            this.randomDirection();
            this.changeDirectionCooldown = 10; // Evita mudança muito rápida
        } else if (this.isBot) {
            this.changeDirectionCooldown--;
        }
    }

    randomDirection() {
        const directions = [
            { dx: 0, dy: -1 }, // Cima
            { dx: 0, dy: 1 },  // Baixo
            { dx: -1, dy: 0 }, // Esquerda
            { dx: 1, dy: 0 }   // Direita
        ];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        this.dx = randomDir.dx;
        this.dy = randomDir.dy;
    }

    changeDirection(direction) {
        if (direction === 'left' && this.dx === 0) {
            this.dx = -1;
            this.dy = 0;
        } else if (direction === 'up' && this.dy === 0) {
            this.dx = 0;
            this.dy = -1;
        } else if (direction === 'right' && this.dx === 0) {
            this.dx = 1;
            this.dy = 0;
        } else if (direction === 'down' && this.dy === 0) {
            this.dx = 0;
            this.dy = 1;
        }
    }
}

// Inicializa o jogador e os bots
let player = new Snake('lime');
player.changeDirection('right'); // Começa indo para a direita

function initBots(numBots) {
    bots = [];
    const colors = ['red', 'yellow', 'blue', 'orange', 'purple'];
    for (let i = 0; i < numBots; i++) {
        let bot = new Snake(colors[i % colors.length], true);
        bot.randomDirection();
        bots.push(bot);
    }
}

// Função para adicionar comida
function addFood() {
    let food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    foods.push(food);
}

// Função principal do jogo
function gameLoop() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Atualiza e desenha o jogador
    player.update();
    drawSnake(player);

    // Atualiza e desenha os bots
    bots.forEach(bot => {
        bot.update();
        drawSnake(bot);
    });

    // Desenha a comida
    foods.forEach(food => {
        ctx.fillStyle = 'red';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
    });

    // Checa colisões
    checkCollisions();

    // Gera comida se necessário
    if (foods.length < 3) {
        addFood();
    }

    // Verifica se o jogador está vivo
    if (!player.alive) {
        endGame();
    }
}

// Função para desenhar uma cobra
function drawSnake(snake) {
    ctx.fillStyle = snake.color;
    snake.cells.forEach(cell => {
        ctx.fillRect(cell.x * gridSize, cell.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

// Função para checar colisões
function checkCollisions() {
    // Colisão do jogador com a comida
    foods.forEach((food, index) => {
        if (player.x === food.x && player.y === food.y) {
            player.maxCells++;
            player.score += 10;
            foods.splice(index, 1);
        }
    });

    // Colisão dos bots com a comida
    bots.forEach(bot => {
        foods.forEach((food, index) => {
            if (bot.x === food.x && bot.y === food.y) {
                bot.maxCells++;
                bot.score += 10;
                foods.splice(index, 1);
            }
        });
    });

    // Colisões entre cobras
    let snakes = [player, ...bots];
    snakes.forEach(snake => {
        // Verifica colisão com o próprio corpo
        for (let i = 1; i < snake.cells.length; i++) {
            if (snake.x === snake.cells[i].x && snake.y === snake.cells[i].y) {
                snake.alive = false;
            }
        }

        // Verifica colisão com outras cobras
        snakes.forEach(otherSnake => {
            if (snake !== otherSnake && otherSnake.alive) {
                otherSnake.cells.forEach(cell => {
                    if (snake.x === cell.x && snake.y === cell.y) {
                        // Se colidir com a cabeça
                        if (cell === otherSnake.cells[0]) {
                            if (snake.isBot) {
                                snake.alive = false;
                            } else {
                                otherSnake.alive = false;
                            }
                        } else {
                            // Absorve a cobra
                            snake.maxCells += otherSnake.maxCells;
                            snake.score += otherSnake.score;
                            otherSnake.alive = false;
                        }
                    }
                });
            }
        });
    });
}

// Função para terminar o jogo
function endGame() {
    clearInterval(gameInterval);
    showGameOverScreen();
}

// Função para mostrar a tela de Game Over
function showGameOverScreen() {
    gameOverScreen.classList.remove('hidden');
    scoreBoard.innerHTML = '';

    let snakes = [player, ...bots];
    // Ordena por score
    snakes.sort((a, b) => b.score - a.score);

    snakes.forEach(snake => {
        let scoreDiv = document.createElement('div');
        scoreDiv.innerHTML = `<strong>${snake.isBot ? 'Bot' : 'Jogador'}:</strong> ${snake.score}`;
        let scoreBar = document.createElement('div');
        scoreBar.classList.add('scoreBar');
        scoreBar.style.width = `${snake.score}px`;
        // Define a cor baseada no score
        if (snake.score < 50) {
            scoreBar.style.backgroundColor = 'red';
        } else if (snake.score < 100) {
            scoreBar.style.backgroundColor = 'orange';
        } else {
            scoreBar.style.backgroundColor = 'green';
        }
        scoreDiv.appendChild(scoreBar);
        scoreBoard.appendChild(scoreDiv);
    });
}

// Função para reiniciar o jogo
function restartGame() {
    gameOverScreen.classList.add('hidden');
    player = new Snake('lime');
    player.changeDirection('right');
    initBots(3);
    foods = [];
    gameInterval = setInterval(gameLoop, 100);
}

// Evento para o botão de reiniciar
restartButton.addEventListener('click', () => {
    restartGame();
});

// Evento para o botão de sair
exitButton.addEventListener('click', () => {
    window.location.href = 'agradecimento.html';
});

// Eventos de teclado
document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') {
        player.changeDirection('left');
    } else if (e.code === 'ArrowUp') {
        player.changeDirection('up');
    } else if (e.code === 'ArrowRight') {
        player.changeDirection('right');
    } else if (e.code === 'ArrowDown') {
        player.changeDirection('down');
    }
});

// Inicia o jogo
restartGame();
