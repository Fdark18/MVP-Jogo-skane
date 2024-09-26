// Seleciona os elementos do DOM
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const fullscreenButton = document.getElementById('fullscreenButton');
const colorOptions = document.getElementsByName('snakeColor');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');
const scoreBoard = document.getElementById('scoreBoard');

// **Novas variáveis para controle do tamanho do canvas e da grade**
let canvasWidth = canvas.width;
let canvasHeight = canvas.height;
let gridSize = 20; // Tamanho de cada célula em pixels
let tileCountX = Math.floor(canvasWidth / gridSize);
let tileCountY = Math.floor(canvasHeight / gridSize);

let gameInterval;
let bots = [];
let foods = [];

// Lista de nomes dos personagens da série "Chaves"
const botNames = [
    'Quico',
    'Seu Madruga',
    'Dona Florinda',
    'Chiquinha',
    'Professor Girafales',
    'Senhor Barriga',
    'Nhonho',
    'Pópis',
    'Godinez',
    'Bruxa do 71',
    'Chaves',
    'Paty'
];

// Índice para acompanhar quais nomes já foram usados
let botNameIndex = 0;

// Função para obter o próximo nome disponível
function getNextBotName() {
    const name = botNames[botNameIndex % botNames.length];
    const count = Math.floor(botNameIndex / botNames.length) + 1;
    botNameIndex++;
    // Se já usamos todos os nomes, começamos a reutilizar com um sufixo numérico
    return count > 1 ? `${name} ${count}` : name;
}

// Lista de cores disponíveis para os bots
const botColors = ['blue', 'green', 'pink', 'yellow', 'red', 'purple', 'orange', 'cyan', 'magenta', 'lime'];

// Função para remover a cor do jogador das cores disponíveis para bots
function getAvailableBotColors(playerColor) {
    return botColors.filter(color => color.toLowerCase() !== playerColor.toLowerCase());
}

// Classe para representar uma cobra
class Snake {
    constructor(color, name = 'Bot', isBot = false) {
        this.name = name;
        this.color = color;
        this.isBot = isBot;

        this.x = Math.floor(Math.random() * tileCountX);
        this.y = Math.floor(Math.random() * tileCountY);
        this.dx = 0;
        this.dy = 0;
        this.cells = [];
        this.maxCells = 4;
        this.score = 0;
        this.alive = true;
        this.changeDirectionCooldown = 0;

        // Variável para controlar o efeito de teletransporte
        this.isTeleporting = false;
        this.teleportFrames = 0;
    }

    update() {
        if (!this.alive) return;

        // Movimento
        this.x += this.dx;
        this.y += this.dy;

        // Teletransporte nas bordas com efeito
        if (this.x < 0) {
            this.x = tileCountX - 1;
            this.triggerTeleport();
        } else if (this.x >= tileCountX) {
            this.x = 0;
            this.triggerTeleport();
        }

        if (this.y < 0) {
            this.y = tileCountY - 1;
            this.triggerTeleport();
        } else if (this.y >= tileCountY) {
            this.y = 0;
            this.triggerTeleport();
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

        // Atualiza o efeito de teletransporte
        if (this.isTeleporting) {
            this.teleportFrames--;
            if (this.teleportFrames <= 0) {
                this.isTeleporting = false;
            }
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

    triggerTeleport() {
        this.isTeleporting = true;
        this.teleportFrames = 5; // Duração do efeito
    }
}

// Variável para armazenar a cobra do jogador
let player;

// Função para inicializar o jogador
function initPlayer() {
    let selectedColor;
    colorOptions.forEach(option => {
        if (option.checked) {
            selectedColor = option.value;
        }
    });
    player = new Snake(selectedColor, 'Jogador');
    player.changeDirection('right'); // Começa indo para a direita
}

// Função para inicializar os bots
function initBots(numBots) {
    bots = [];
    botNameIndex = 0; // Resetar o índice ao reiniciar o jogo

    const availableColors = getAvailableBotColors(player.color);

    for (let i = 0; i < numBots; i++) {
        let botName = getNextBotName();
        let botColor = availableColors[i % availableColors.length] || getRandomColor();
        let bot = new Snake(botColor, botName, true);
        bot.randomDirection();
        bots.push(bot);
    }
}

// Função para obter uma cor aleatória que não seja a do jogador
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color;
    do {
        color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
    } while (color.toLowerCase() === player.color.toLowerCase());
    return color;
}

// Função para adicionar comida
function addFood() {
    let food = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
    foods.push(food);
}

// **Função para redimensionar o canvas e ajustar a grade**
function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    tileCountX = Math.floor(canvasWidth / gridSize);
    tileCountY = Math.floor(canvasHeight / gridSize);
}

// Evento de redimensionamento da janela
window.addEventListener('resize', () => {
    resizeCanvas();
});

// Função principal do jogo
function gameLoop() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Atualiza e desenha o jogador se ele estiver vivo
    if (player.alive) {
        player.update();
        drawSnake(player);
    }

    // Atualiza e desenha os bots vivos
    bots.forEach(bot => {
        if (bot.alive) {
            bot.update();
            drawSnake(bot);
        }
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
    // Aplica efeito de transparência durante o teletransporte
    if (snake.isTeleporting) {
        ctx.globalAlpha = 0.5;
    } else {
        ctx.globalAlpha = 1;
    }

    ctx.fillStyle = snake.color;
    snake.cells.forEach(cell => {
        ctx.fillRect(cell.x * gridSize, cell.y * gridSize, gridSize - 1, gridSize - 1);
    });

    // Restaura a opacidade
    ctx.globalAlpha = 1;
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

    // Combina todas as cobras em um array
    let snakes = [player, ...bots];

    // Cria um array para armazenar cobras mortas
    let deadSnakes = [];

    snakes.forEach(snake => {
        if (!snake.alive) return;

        // Verifica colisão com o próprio corpo
        for (let i = 1; i < snake.cells.length; i++) {
            if (snake.x === snake.cells[i].x && snake.y === snake.cells[i].y) {
                snake.alive = false;
                deadSnakes.push(snake);
            }
        }

        // Verifica colisão com outras cobras
        snakes.forEach(otherSnake => {
            if (snake !== otherSnake && otherSnake.alive) {
                // Verifica se as cabeças colidem
                if (snake.x === otherSnake.x && snake.y === otherSnake.y) {
                    // Ambas as cobras morrem se colidirem cabeça com cabeça
                    snake.alive = false;
                    otherSnake.alive = false;
                    deadSnakes.push(snake);
                    deadSnakes.push(otherSnake);
                } else {
                    // Verifica colisão com o corpo da outra cobra
                    for (let i = 0; i < otherSnake.cells.length; i++) {
                        if (snake.x === otherSnake.cells[i].x && snake.y === otherSnake.cells[i].y) {
                            // A cobra 'snake' absorve a 'otherSnake'
                            snake.maxCells += otherSnake.maxCells;
                            snake.score += otherSnake.score;
                            otherSnake.alive = false;
                            deadSnakes.push(otherSnake);
                            break;
                        }
                    }
                }
            }
        });
    });

    // Remove as cobras mortas dos arrays de bots e jogador
    deadSnakes.forEach(deadSnake => {
        // Limpa as células da cobra morta
        deadSnake.cells = [];

        if (deadSnake.isBot) {
            // Remove o bot do array de bots
            bots = bots.filter(bot => bot !== deadSnake);
        } else {
            // Se o jogador morreu, termina o jogo
            player.alive = false;
        }
    });

    // Garantir pelo menos 5 bots ativos
    while (bots.length < 5) {
        // Cria um novo bot
        let botName = getNextBotName();
        const availableColors = getAvailableBotColors(player.color);
        let botColor = availableColors[Math.floor(Math.random() * availableColors.length)] || getRandomColor();
        let newBot = new Snake(botColor, botName, true);
        newBot.randomDirection();
        bots.push(newBot);
    }
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
        scoreDiv.innerHTML = `<strong>${snake.name}:</strong> ${snake.score}`;
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
    canvas.classList.remove('hidden');
    initPlayer();
    initBots(6); // Inicializa com 6 bots
    foods = [];
    resizeCanvas(); // Redimensiona o canvas
    gameInterval = setInterval(gameLoop, 100);
}

// Evento para o botão de iniciar o jogo
startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    canvas.classList.remove('hidden');
    initPlayer();
    initBots(6);
    resizeCanvas(); // Redimensiona o canvas
    gameInterval = setInterval(gameLoop, 100);
});

// Evento para o botão de tela cheia
fullscreenButton.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
        document.documentElement.msRequestFullscreen();
    }
    // Após entrar em tela cheia, ajusta o tamanho do canvas
    setTimeout(() => {
        resizeCanvas();
    }, 100); // Pequeno atraso para garantir que o modo tela cheia foi ativado
});

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

// Não iniciamos o jogo
