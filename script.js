// Game States
const EMPTY = null;
const PLAYER_X = "X";
const PLAYER_O = "O";

// Quantum States
const Q_ZERO = "0";
const Q_ONE = "1";

// Initialize Game Variables
let board = Array(9)
    .fill(EMPTY)
    .map(() => ({
        state: "quantum", // 'quantum' or 'classical'
        value: EMPTY, // 'X', 'O', or EMPTY
        entangledWith: null, // Index of entangled control box
    }));
let currentPlayer = PLAYER_X;
let selectedMove = null; // For quantum moves
let message = "\n\n";
let addedEventListener = null;

// DOM Elements
const cells = document.querySelectorAll(".cell");
const gameStatus = document.getElementById("gameStatus");
const classicalButton = document.getElementById("classicalMove");
const quantumButton = document.getElementById("quantumMove");
const resetButton = document.getElementById("reset");
const rulesButton = document.getElementById("rulesButton");
const musicToggle = document.getElementById("playMusicButton");
const backgroundMusic = document.getElementById("backgroundMusic");
const messageDiv = document.getElementById("message");
const entanglementsSVG = document.getElementById("entanglements");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const quantumMoveSound = document.getElementById("quantumMoveSound");

// Modal Elements
const rulesModal = document.getElementById("rulesModal");
const span = document.getElementsByClassName("close")[0];
const soundModal = document.getElementById("soundPromptModal");
const initialMusicButton = document.getElementById("playInitialMusicButton");
const playGameButton = document.getElementById("playGameButton");

// DOM Elements for Tutorial
const tutorialModal = document.getElementById("tutorialModal");
const tutorialMessage = document.getElementById("tutorialMessage");
const tutorialNext = document.getElementById("tutorialNext");
const tutorialClose = document.querySelector(".tutorial-close");

// === Tutorial Steps Definition ===
const tutorialSteps = [
    {
        element: "#board",
        message:
            "<p>This is the game grid where you place your moves. It consists of 9 cells arranged in a 3x3 grid.<br><br>The cells are neither X nor O. They are in a superposition state of both X and O.<br><br><strong>It is a NEW STATE!</strong></p>",
    },
    {
        element: "#classicalMove",
        message:
            '<p>The "Classical Move" button allows you to collapse a quantum box into either "X" or "O" randomly.<br><br>Just like you do with quantum particles, you are making a measurement here.<br><br>And by doing so, you <strong>COLLAPSE</strong> the box from a quantum state (superposition) to a classical state.</p>',
    },
    {
        element: "#quantumMove",
        message:
            '<p>This is an interesting one.<br><br>The "Quantum Move" button lets you entangle a quantum box with a classical box. So you can <i>spookily</i> influence an entangled classical box when the quantum box is measured, <i>no matter the distance</i>.<br><br>Read the rules to understand.<br><br><strong>Keep in mind: in the real quantum world, only quantum particles (not classical) are entangled with each other, but for this game, we have made an exception.</strong></p>',
    },
    {
        element: "#reset",
        message:
            '<p>This button puts all boxes back into their quantum states, the superposition of X and O.</p>'
    },
    {
        element: "#message",
        message:
            "<p>This area displays important game messages, updates, and notifications.</p>",
    },
    {
        element: "#rulesButton",
        message:
            '<p>Clicking the "Rules" button will show you the detailed rules of Quantum Tic-Tac-Toe.</p>',
    },
];

let currentTutorialStep = 0;

// Render Function
function render() {
    cells.forEach((cell, index) => {
        const cellData = board[index];
        cell.classList.remove("occupied", "X", "O", "highlight", "quantum");
        cell.style.backgroundColor = "#3e444e";
        cell.innerHTML = "";

        if (cellData.state === "classical") {
            cell.classList.add("occupied");
            cell.classList.add(cellData.value);
            cell.textContent = cellData.value;
            // Apply color based on player
            cell.style.backgroundColor = "#ffffff";
        } else {
            // Quantum state animation
            cell.classList.add("quantum");
        }
    });

    // Clear and redraw entanglement lines
    drawEntanglements();

    gameStatus.textContent = `Player ${currentPlayer}'s Turn`;
    messageDiv.textContent = message;
}

// Draw Entanglements using SVG Paths with Curves
function drawEntanglements() {
    // Clear existing lines
    const existingLines = entanglementsSVG.querySelectorAll(".entanglement-line");
    existingLines.forEach((line) => line.remove());

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
            y: row * (cellSize + gap) + cellSize / 2,
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
    path.setAttribute(
        "d",
        `M ${fromPos.x} ${fromPos.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toPos.x} ${toPos.y}`
    );
    path.classList.add("entanglement-line");

    // Set color based on player
    if (player === PLAYER_X) {
        path.style.stroke = "#e63946"; // Red for X
    } else if (player === PLAYER_O) {
        path.style.stroke = "#1d3557"; // Blue for O
    }
    path.style.stroke = "#fedd56";

    entanglementsSVG.appendChild(path);
}

// Check Win Condition
function checkWin() {
    const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (
            board[a].state === "classical" &&
            board[b].state === "classical" &&
            board[c].state === "classical"
        ) {
            if (
                board[a].value === board[b].value &&
                board[b].value === board[c].value &&
                board[a].value !== EMPTY
            ) {
                return board[a].value;
            }
        }
    }
    // Check for draw
    if (board.every((cell) => cell.state === "classical")) {
        return "Draw";
    }
    return null;
}

// Handle Classical Move
function handleClassicalMove(index) {
    cells.forEach((cell) => cell.removeEventListener("click", selectControl));
    cells.forEach((cell) => cell.removeEventListener("click", selectTarget));
    unhighlightAll();

    message = "Select a box to perform Classical Move.";
    render();

    addedEventListener = 0;
    cells.forEach((cell) => cell.addEventListener("click", selectClassical));
}

function selectClassical(event) {
    const index = parseInt(event.target.getAttribute("data-index"));
    performMove(index);
    // Remove this event listener after selection
    cells.forEach((cell) => cell.removeEventListener("click", selectClassical));
    addedEventListener = null;
}

function performMove(index) {
    const cellData = board[index];
    cell = cells[index];
    if (cellData.state !== "quantum") {
        message = "Classical move can only be applied to a quantum state box.";
        render();
        return;
    }
    // Collapse the quantum state
    const collapse = Math.random() < 0.5 ? Q_ZERO : Q_ONE;
    cellData.state = "classical";
    if (collapse === Q_ZERO) {
        cellData.value = PLAYER_O;
    } else {
        cellData.value = PLAYER_X;
    }

    // Remove 'quantum' class to stop animation
    cell.classList.remove("quantum");

    // Adding fade-in animation by re-rendering
    render();

    // Handle entanglements
    let measuredEntangled = false;
    board.forEach((c, idx) => {
        if (c.entangledWith === index && c.state === "classical") {
            const favoredState = currentPlayer === PLAYER_X ? Q_ONE : Q_ZERO;
            if (
                (currentPlayer === PLAYER_X && collapse === Q_ONE) ||
                (currentPlayer === PLAYER_O && collapse === Q_ZERO)
            ) {
                // Reverse the state
                c.value = c.value === PLAYER_X ? PLAYER_O : PLAYER_X;
                message =
                    "You measured an entangled box. Something ~spooky~ happened to the other entangled box. REVERSAL!";
                // Add highlight animation
                const targetCell = cells[idx];
                targetCell.classList.add("highlight");
                setTimeout(() => {
                    targetCell.classList.remove("highlight");
                }, 500);
            } else {
                message =
                    "Oh no, you measured an entangled box and something ~spooky~ happened to the other entangled box. No reversal :(";
            }
            c.entangledWith = null;
            measuredEntangled = true;
        }
    });
    if (!measuredEntangled) {
        message =
            "You measured a quantum particle in a superposition state. It has now collapsed into a classical state.";
    }

    // Check for win
    const winner = checkWin();
    if (winner) {
        if (winner === "Draw") {
            message = "The game is a draw!";
        } else {
            message = `Player ${winner} wins!`;
        }
        render();
        disableMoves();
        return;
    }

    // Switch player
    currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
    // message = '';
    render();
}

// Handle Quantum Move
function handleQuantumMove() {
    unhighlightAll();
    cells.forEach((cell) => cell.removeEventListener("click", selectClassical));
    // Quantum move involves selecting a control and a target box
    message = "Select Control Box for Quantum Move.";
    render();

    let controlBox = null;
    let targetBox = null;

    cells.forEach((cell) => cell.addEventListener("click", selectControl));
}

function selectControl(event) {
    const index = parseInt(event.target.getAttribute("data-index"));
    const cell = board[index];
    if (cell.state !== "quantum") {
        message = "Control box must be in a quantum state.";
        render();
        return;
    }
    controlBox = index;
    message = "Select Target Box for Quantum Move.";
    render();
    highlightCell(index, "control");
    // Remove event listener for control selection
    cells.forEach((cell) => cell.removeEventListener("click", selectControl));
    // Add event listener for target selection
    cells.forEach((cell) => cell.addEventListener("click", selectTarget));
}

function selectTarget(event) {
    const index = parseInt(event.target.getAttribute("data-index"));
    const cell = board[index];
    if (cell.state !== "classical") {
        message = "Target box must be in a classical state.";
        render();
        return;
    }
    if (index === controlBox) {
        message = "Control and target boxes must be different.";
        render();
        return;
    }
    targetBox = index;
    // Create entanglement
    board[targetBox].entangledWith = controlBox;
    message = `You successfully entangled box ${controlBox + 1} with box ${targetBox + 1
        }. Beware of your (and your opponents') actions now.`;
    quantumMoveSound.play();
    // Animate the entanglement creation
    // Yields the entanglement lines through render()
    // Remove event listener for target selection
    cells.forEach((cell) => cell.removeEventListener("click", selectTarget));
    // Remove highlight
    unhighlightAll();
    // Switch player
    currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
    render();
}

// Highlight selected cell
function highlightCell(index, type) {
    const cell = cells[index];
    if (type === "control") {
        cell.style.boxShadow = "0 0 15px 5px #ffdd57";
    } else if (type === "target") {
        cell.style.boxShadow = "0 0 15px 5px #57ffdd";
    }
}

// Remove all highlights
function unhighlightAll() {
    cells.forEach((cell) => {
        cell.style.boxShadow = "none";
    });
}

// Disable further moves after game ends
function disableMoves() {
    classicalButton.disabled = true;
    quantumButton.disabled = true;
    cells.forEach((cell) => (cell.style.pointerEvents = "none"));
}

// Reset Game
function resetGame() {
    board = Array(9)
        .fill(EMPTY)
        .map(() => ({
            state: "quantum",
            value: EMPTY,
            entangledWith: null,
        }));
    currentPlayer = PLAYER_X;
    message = "Welcome to the game!";
    classicalButton.disabled = false;
    quantumButton.disabled = false;
    cells.forEach((cell) => {
        cell.style.pointerEvents = "auto";
        cell.style.boxShadow = "none";
        cell.classList.remove("X", "O", "highlight", "quantum");
        cell.classList.add("quantum"); // Re-add quantum animation
        cell.removeEventListener("click", selectClassical);
        cell.removeEventListener("click", selectControl);
        cell.removeEventListener("click", selectTarget);
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

function disableGameButtons() {
    classicalButton.disabled = true;
    quantumButton.disabled = true;
    resetButton.disabled = true;
    rulesButton.disabled = true;
    musicToggle.disabled = true;

    classicalButton.style.opacity = "0.5";
    quantumButton.style.opacity = "0.5";
    resetButton.style.opacity = "0.5";
    rulesButton.style.opacity = "0.5";
    musicToggle.style.opacity = "0.5";
    classicalButton.style.cursor = "not-allowed";
    quantumButton.style.cursor = "not-allowed";
    resetButton.style.cursor = "not-allowed";
    rulesButton.style.cursor = "not-allowed";
    musicToggle.style.cursor = "not-allowed";
}

function enableGameButtons() {
    classicalButton.disabled = false;
    quantumButton.disabled = false;
    resetButton.disabled = false;
    rulesButton.disabled = false;
    musicToggle.disabled = false;

    classicalButton.style.opacity = "1";
    quantumButton.style.opacity = "1";
    resetButton.style.opacity = "1";
    rulesButton.style.opacity = "1";
    musicToggle.style.opacity = "1";
    classicalButton.style.cursor = "pointer";
    quantumButton.style.cursor = "pointer";
    resetButton.style.cursor = "pointer";
    rulesButton.style.cursor = "pointer";
    musicToggle.style.cursor = "pointer";
}

// === Create Tooltip Element ===
const tooltip = document.createElement("div");
tooltip.id = "tutorialTooltip";
tooltip.classList.add("tutorial-tooltip");
tooltip.innerHTML = `
<div class="tooltip-content">
<p id="tooltipMessage"></p>
<button id="tooltipNext">Next</button>
</div>
<div class="tooltip-arrow"></div>
`;
document.body.appendChild(tooltip);

// === Tutorial Functionality ===

// Function to start the tutorial
function startTutorial() {
    disableGameButtons();
    currentTutorialStep = 0;
    dimBackground();
    showTutorialStep(currentTutorialStep);
}

// Function to show a specific tutorial step
function showTutorialStep(step) {
    if (step >= tutorialSteps.length) {
        endTutorial();
        return;
    }

    const stepInfo = tutorialSteps[step];
    const targetElement = document.querySelector(stepInfo.element);

    if (!targetElement) {
        console.error(`Tutorial step element not found: ${stepInfo.element}`);
        endTutorial();
        return;
    }

    // Highlight the target element
    targetElement.classList.add("highlighted");
    if (stepInfo.element === "#board") {
        targetElement.classList.remove("highlighted");
        targetElement.classList.remove("dimmed");
        cells.forEach((cell) => {
            cell.classList.add("highlighted");
            cell.classList.remove("dimmed");
            console.log(cell);
        });
    };

    // Position the tooltip
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 250; // Match max-width in CSS
    const tooltipHeight = 100; // Approximate height, adjust as needed

    let top, left;

    // Determine tooltip position based on element's position
    if (rect.right + tooltipWidth + 20 < window.innerWidth) {
        // Position tooltip to the right of the element
        top = rect.top + window.scrollY - 100;
        left = rect.right + 10 + window.scrollX;
    } else if (rect.left - tooltipWidth - 20 > 0) {
        // Position tooltip to the left of the element
        top = rect.top + window.scrollY;
        left = rect.left - tooltipWidth - 10 + window.scrollX;
    } else {
        // Position tooltip below the element
        top = rect.bottom + 10 + window.scrollY;
        left = rect.left + window.scrollX;
    }

    // Ensure tooltip does not go off-screen vertically
    const tooltipElement = document.getElementById("tutorialTooltip");
    tooltipElement.style.top = `${top}px`;
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.display = "block";
    document.getElementById("tooltipMessage").innerHTML = stepInfo.message;

    // Optional: Scroll into view
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

    // Attach event listener for 'Next' button
    document.getElementById("tooltipNext").onclick = () => {
        // Remove highlight from current element
        targetElement.classList.remove("highlighted");
        if (stepInfo.element === "#board") {
            cells.forEach((cell) => {
                cell.classList.remove("highlighted");
                cell.classList.add("dimmed");
            });
        }
        // Increment step
        currentTutorialStep++;
        // Show next step
        showTutorialStep(currentTutorialStep);
    };
}

// Function to end the tutorial
function endTutorial() {
    enableGameButtons();
    // Remove highlights and dimming
    removeHighlightsAndDims();
    // Hide tooltip
    tooltip.style.display = "none";

    // // Save that the user has seen the tutorial
    localStorage.setItem("hasSeenTutorial", "true");

    // Show restart tutorial button
    restartTutorialBtn.style.display = "block";
}

// Function to dim background elements except the highlighted element
function dimBackground() {
    // Select all interactive elements to dim
    const interactiveElements = [
        "#board",
        "#classicalMove",
        "#quantumMove",
        "#reset",
        "#rulesButton",
        "#message",
        "#playMusicButton",
        ".cell",
    ];

    interactiveElements.forEach((selector) => {
        const els = document.querySelectorAll(selector);
        els.forEach((el) => {
            el.classList.add("dimmed");
        });
    });
}

// Function to remove dimming and highlights
function removeHighlightsAndDims() {
    // Remove dimmed class
    const dimmedElements = document.querySelectorAll(".dimmed");
    dimmedElements.forEach((el) => el.classList.remove("dimmed"));

    // Remove highlighted class
    const highlightedElements = document.querySelectorAll(".highlighted");
    highlightedElements.forEach((el) => el.classList.remove("highlighted"));
}

// === Add Restart Tutorial Button ===

// Create Restart Tutorial Button
const restartTutorialBtn = document.createElement("button");
restartTutorialBtn.id = "restartTutorial";
restartTutorialBtn.textContent = "Restart Tutorial";
restartTutorialBtn.style.position = "fixed";
restartTutorialBtn.style.bottom = "20px";
restartTutorialBtn.style.right = "20px";
restartTutorialBtn.style.padding = "10px 15px";
restartTutorialBtn.style.backgroundColor = "#ff6b6b";
restartTutorialBtn.style.color = "#fff";
restartTutorialBtn.style.border = "none";
restartTutorialBtn.style.borderRadius = "5px";
restartTutorialBtn.style.cursor = "pointer";
restartTutorialBtn.style.zIndex = "100";
restartTutorialBtn.style.display = "none"; // Hidden by default
restartTutorialBtn.style.fontSize = "0.9em";

document.body.appendChild(restartTutorialBtn);

restartTutorialBtn.addEventListener("click", () => {
    localStorage.removeItem("hasSeenTutorial");
    startTutorial();
    restartTutorialBtn.style.display = "none";
});

// === Update Reset Game to Reset Tutorial Status ===

function resetGame() {
    board = Array(9)
        .fill(EMPTY)
        .map(() => ({
            state: "quantum",
            value: EMPTY,
            entangledWith: null,
        }));
    currentPlayer = PLAYER_X;
    message = "Welcome to the game!";
    classicalButton.disabled = false;
    quantumButton.disabled = false;
    cells.forEach((cell) => {
        cell.style.pointerEvents = "auto";
        cell.style.boxShadow = "none";
        cell.classList.remove("X", "O", "highlight", "quantum");
        cell.classList.add("quantum"); // Re-add quantum animation
        cell.removeEventListener("click", selectClassical);
        cell.removeEventListener("click", selectControl);
        cell.removeEventListener("click", selectTarget);
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

    // Reset tutorial status
    localStorage.removeItem("hasSeenTutorial");
    // Show restart tutorial button
    restartTutorialBtn.style.display = "block";
}

// Attach Event Listeners
classicalButton.addEventListener("click", () => {
    selectedMove = "classical";
    handleClassicalMove();
});

quantumButton.addEventListener("click", () => {
    selectedMove = "quantum";
    handleQuantumMove();
});

resetButton.addEventListener("click", resetGame);

// Rules Modal Event Listeners
rulesButton.onclick = function () {
    rulesModal.style.display = "flex";
};

playGameButton.onclick = function () {
    rulesModal.style.display = "none";
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (hasSeenTutorial === "false") {
        startTutorial();
    }
}

// Sound Modal Close (Already in your code)
initialMusicButton.addEventListener("click", () => {
    backgroundMusic.play();
    soundModal.style.display = "none";
    musicToggle.style.display = "block";

    // After sound modal is closed, show rules modal
    rulesModal.style.display = "flex";
});

// Rules Modal Close Event (Modify to trigger tutorial)
const rulesModalClose = document.querySelector("#rulesModal .close"); // Ensure correct selector
rulesModalClose.onclick = function () {
    rulesModal.style.display = "none";
    // Start the tutorial after closing the rules modal
    // Check if the tutorial has already been run
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (hasSeenTutorial === "false") {
        startTutorial();
    }
};

// Optional: If rules modal can be closed by clicking outside, ensure tutorial starts
window.onclick = function (event) {
    if (event.target == rulesModal) {
        rulesModal.style.display = "none";
        const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
        if (hasSeenTutorial === "false") {
            startTutorial();
        }
    }
};

// === Adjust Initial Load to Show Sound and Then Rules Modal ===

window.addEventListener("load", () => {
    // soundModal.style.display = "flex";
    localStorage.setItem("hasSeenTutorial", "false");
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    console.log(hasSeenTutorial);
    if (hasSeenTutorial === "false") {
        // Show sound modal
        soundModal.style.display = "flex";
    }
});

musicToggle.addEventListener("click", () => {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
    } else {
        backgroundMusic.pause();
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
    }
});

// Initial Render
message = "Welcome to the game!";
render();
