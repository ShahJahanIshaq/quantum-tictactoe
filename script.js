// Game States
const EMPTY = null;
const PLAYER_X = 'X';
const PLAYER_O = 'O';

// Quantum States
const Q_ZERO = '0';
const Q_ONE = '1';

// Initialize Game Variables
let board = Array(9).fill(EMPTY).map(() => ({
    state: 'quantum',    // 'quantum' or 'classical'
    value: EMPTY,        // 'X', 'O', or EMPTY
    entangledWith: null  // Index of entangled control box
}));
let currentPlayer = PLAYER_X;
let selectedMove = null; // For quantum moves
let message = '\n\n';
let addedEventListener = null;

// DOM Elements
const cells = document.querySelectorAll('.cell');
const gameStatus = document.getElementById('gameStatus');
const classicalButton = document.getElementById('classicalMove');
const quantumButton = document.getElementById('quantumMove');
const resetButton = document.getElementById('reset');
const rulesButton = document.getElementById('rulesButton');
const musicToggle = document.getElementById('playMusicButton');
const backgroundMusic = document.getElementById('backgroundMusic');
const messageDiv = document.getElementById('message');
const entanglementsSVG = document.getElementById('entanglements');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const quantumMoveSound = document.getElementById('quantumMoveSound');

// Modal Elements
const rulesModal = document.getElementById("rulesModal");
const span = document.getElementsByClassName("close")[0];
const soundModal = document.getElementById('soundPromptModal');
const initialMusicButton = document.getElementById('playInitialMusicButton');

// Render Function
function render() {
    cells.forEach((cell, index) => {
        const cellData = board[index];
        cell.classList.remove('occupied', 'X', 'O', 'highlight', 'quantum');
        cell.style.backgroundColor = '#3e444e';
        cell.innerHTML = '';

        if (cellData.state === 'classical') {
            cell.classList.add('occupied');
            cell.classList.add(cellData.value);
            cell.textContent = cellData.value;
            // Apply color based on player
            cell.style.backgroundColor = '#ffffff'
        } else {
            // Quantum state animation
            cell.classList.add('quantum');
        }

        // Show entanglement if any
        // if (cellData.entangledWith !== null) {
        //     const entDiv = document.createElement('div');
        //     entDiv.classList.add('entanglement');
        //     entDiv.textContent = `E:${cellData.entangledWith +1}`;
        //     entDiv.style.fontSize = 1;
        //     cell.appendChild(entDiv);
        // }
    });

    // Clear and redraw entanglement lines
    drawEntanglements();

    gameStatus.textContent = `Player ${currentPlayer}'s Turn`;
    messageDiv.textContent = message;
}

// Draw Entanglements using SVG Paths with Curves
function drawEntanglements() {
    // Clear existing lines
    const existingLines = entanglementsSVG.querySelectorAll('.entanglement-line');
    existingLines.forEach(line => line.remove());

    board.forEach((cell, index) => {
        if (cell.entangledWith !== null) {
            const controlIndex = cell.entangledWith;
            drawCurvedLine(controlIndex, index, cell.value);
        }
    });
}

// Function to draw a curved line between two cells
function drawCurvedLine(fromIndex, toIndex, player) {
    const cellSize = 100;
    const gap = 5;
    const svgSize = entanglementsSVG.clientWidth;

    // Calculate positions (center of cells)
    const getPosition = (idx) => {
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        return {
            x: col * (cellSize + gap) + cellSize / 2,
            y: row * (cellSize + gap) + cellSize / 2
        };
    };

    const fromPos = getPosition(fromIndex);
    const toPos = getPosition(toIndex);

    // Determine control points for the Bezier curve
    const deltaX = toPos.x - fromPos.x;
    const deltaY = toPos.y - fromPos.y;
    const dist = Math.hypot(deltaX, deltaY);
    const curvature = 0.3; // Adjust for more or less curvature

    const controlPointOffsetX = -deltaY * curvature;
    const controlPointOffsetY = deltaX * curvature;

    const controlX1 = fromPos.x + controlPointOffsetX;
    const controlY1 = fromPos.y + controlPointOffsetY;
    const controlX2 = toPos.x + controlPointOffsetX;
    const controlY2 = toPos.y + controlPointOffsetY;

    // Create SVG path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', `M ${fromPos.x} ${fromPos.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toPos.x} ${toPos.y}`);
    path.classList.add('entanglement-line');

    // Set color based on player
    if (player === PLAYER_X) {
        path.style.stroke = '#e63946'; // Red for X
    } else if (player === PLAYER_O) {
        path.style.stroke = '#1d3557'; // Blue for O
    }
    path.style.stroke = '#fedd56';

    entanglementsSVG.appendChild(path);
}

// Check Win Condition
function checkWin() {
    const winPatterns = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],
        [1,4,7],
        [2,5,8],
        [0,4,8],
        [2,4,6]
    ];
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a].state === 'classical' && board[b].state === 'classical' && board[c].state === 'classical') {
            if (board[a].value === board[b].value && board[b].value === board[c].value && board[a].value !== EMPTY) {
                return board[a].value;
            }
        }
    }
    // Check for draw
    if (board.every(cell => cell.state === 'classical')) {
        return 'Draw';
    }
    return null;
}

// Handle Classical Move
function handleClassicalMove(index) {
    cells.forEach(cell => cell.removeEventListener('click', selectControl));
    cells.forEach(cell => cell.removeEventListener('click', selectTarget));
    unhighlightAll();

    message = 'Select a box to perform Classical Move.';
    render();

    addedEventListener = 0;
    cells.forEach(cell => cell.addEventListener('click', selectClassical));
}

function selectClassical(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    console.log(index);
    performMove(index);
    // Remove this event listener after selection
    cells.forEach(cell => cell.removeEventListener('click', selectClassical));
    addedEventListener = null;
    console.log("classical listener removed");
}

function performMove(index) {
    const cellData = board[index];
    cell = cells[index];
    if (cellData.state !== 'quantum') {
        message = 'Classical move can only be applied to a quantum state box.';
        render();
        return;
    }
    // Collapse the quantum state
    const collapse = Math.random() < 0.5 ? Q_ZERO : Q_ONE;
    cellData.state = 'classical';
    if (collapse === Q_ZERO) {
        cellData.value = PLAYER_O;
    } else {
        cellData.value = PLAYER_X;
    }

    // Remove 'quantum' class to stop animation
    cell.classList.remove('quantum');

    // Adding fade-in animation by re-rendering
    render();

    // Handle entanglements
    let measuredEntangled = false;
    board.forEach((c, idx) => {
        if (c.entangledWith === index && c.state === 'classical') {
            const favoredState = (currentPlayer === PLAYER_X) ? Q_ONE : Q_ZERO;
            if ((currentPlayer === PLAYER_X && collapse === Q_ONE) ||
                (currentPlayer === PLAYER_O && collapse === Q_ZERO)) {
                // Reverse the state
                c.value = (c.value === PLAYER_X) ? PLAYER_O : PLAYER_X;
                message = "You measured an entangled particle. And it is in your favor. REVERSAL!"
                // Add highlight animation
                const targetCell = cells[idx];
                targetCell.classList.add('highlight');
                setTimeout(() => {
                    targetCell.classList.remove('highlight');
                }, 500);
            } else {
                message = "Oh no, you measured an entangled particle but it isn't in your favor. No reversal :("
            }
            c.entangledWith = null;
            measuredEntangled = true;
        }
    });
    if (!measuredEntangled) {
        message = "You measured a quantum particle in a superposition state. It has now collapsed into a classical state."
    }

    // Check for win
    const winner = checkWin();
    if (winner) {
        if (winner === 'Draw') {
            message = 'The game is a draw!';
        } else {
            message = `Player ${winner} wins!`;
        }
        render();
        disableMoves();
        return;
    }

    // Switch player
    currentPlayer = (currentPlayer === PLAYER_X) ? PLAYER_O : PLAYER_X;
    // message = '';
    render();
}

// Handle Quantum Move
function handleQuantumMove() {
    unhighlightAll();
    cells.forEach(cell => cell.removeEventListener('click', selectClassical));
    // Quantum move involves selecting a control and a target box
    message = 'Select Control Box for Quantum Move.';
    render();

    let controlBox = null;
    let targetBox = null;

    cells.forEach(cell => cell.addEventListener('click', selectControl));
}

function selectControl(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    const cell = board[index];
    if (cell.state !== 'quantum') {
        message = 'Control box must be in a quantum state.';
        render();
        return;
    }
    controlBox = index;
    message = 'Select Target Box for Quantum Move.';
    render();
    highlightCell(index, 'control');
    // Remove event listener for control selection
    cells.forEach(cell => cell.removeEventListener('click', selectControl));
    // Add event listener for target selection
    cells.forEach(cell => cell.addEventListener('click', selectTarget));
}

function selectTarget(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    const cell = board[index];
    if (cell.state !== 'classical') {
        message = 'Target box must be in a classical state.';
        render();
        return;
    }
    if (index === controlBox) {
        message = 'Control and target boxes must be different.';
        render();
        return;
    }
    targetBox = index;
    // Create entanglement
    board[targetBox].entangledWith = controlBox;
    message = `You successfully entangled box ${controlBox +1} with box ${targetBox +1}. Beware of your (and your opponents') actions now.`;
    quantumMoveSound.play();
    // Animate the entanglement creation
    // Yields the entanglement lines through render()
    // Remove event listener for target selection
    cells.forEach(cell => cell.removeEventListener('click', selectTarget));
    // Remove highlight
    unhighlightAll();
    // Switch player
    currentPlayer = (currentPlayer === PLAYER_X) ? PLAYER_O : PLAYER_X;
    render();
}

// Highlight selected cell
function highlightCell(index, type) {
    const cell = cells[index];
    if (type === 'control') {
        cell.style.boxShadow = '0 0 15px 5px #ffdd57';
    } else if (type === 'target') {
        cell.style.boxShadow = '0 0 15px 5px #57ffdd';
    }
}

// Remove all highlights
function unhighlightAll() {
    cells.forEach(cell => {
        cell.style.boxShadow = 'none';
    });
}

// Disable further moves after game ends
function disableMoves() {
    classicalButton.disabled = true;
    quantumButton.disabled = true;
    cells.forEach(cell => cell.style.pointerEvents = 'none');
}

// Reset Game
function resetGame() {
    board = Array(9).fill(EMPTY).map(() => ({
        state: 'quantum',
        value: EMPTY,
        entangledWith: null
    }));
    currentPlayer = PLAYER_X;
    message = "Welcome to the game!";
    classicalButton.disabled = false;
    quantumButton.disabled = false;
    cells.forEach(cell => {
        cell.style.pointerEvents = 'auto';
        cell.style.boxShadow = 'none';
        cell.classList.remove('X', 'O', 'highlight', 'quantum');
        cell.classList.add('quantum'); // Re-add quantum animation
        cell.removeEventListener('click', selectClassical);
        cell.removeEventListener('click', selectControl);
        cell.removeEventListener('click', selectTarget);
    });
    entanglementsSVG.innerHTML = `
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
    `;
    render();
}

// Attach Event Listeners
classicalButton.addEventListener('click', () => {
    selectedMove = 'classical';
    handleClassicalMove();
});

quantumButton.addEventListener('click', () => {
    selectedMove = 'quantum';
    handleQuantumMove();
});

resetButton.addEventListener('click', resetGame);

// Rules Modal Event Listeners
rulesButton.onclick = function() {
    rulesModal.style.display = "flex";
}

span.onclick = function() {
    rulesModal.style.display = "none";
}

initialMusicButton.addEventListener('click', () => {
    backgroundMusic.play();
    soundModal.style.display = 'none';
    musicToggle.style.display = 'block';
});

musicToggle.addEventListener('click', () => {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        backgroundMusic.pause();
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
});


window.onclick = function(event) {
    if (event.target == rulesModal) {
        rulesModal.style.display = "none";
    }
}

// Initial Render
message = "Welcome to the game!"
render();