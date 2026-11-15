/**
 * Zenith Orchestrator & UI Bridge
 * Zero-dependency WebAssembly controller for offline desktop computing.
 */

const MODULES = [
  { id: 'sudoku', num: '01', key: '1', title: 'SUDOKU', desc: '9×9 bitmask MRV constraint solver & unique puzzle generator.', cat: 'PUZZLE', group: 'PUZZLE', visual: 'GRID: 9×9 [1..9]' },
  { id: 'wordle', num: '02', key: '2', title: 'WORDLE', desc: '5-letter binary-search dictionary & duplicate frequency evaluator.', cat: 'WORD', group: 'PUZZLE', visual: '[W] [A] [S] [M] [✓]' },
  { id: 'g2048', num: '03', key: '3', title: '2048', desc: '64-bit bitboard state machine with O(1) bitwise row merges.', cat: 'MATH', group: 'PUZZLE', visual: '[2] [4] [8] [16]' },
  { id: 'tetris', num: '04', key: '4', title: 'TETRIS', desc: '200-byte Guideline matrix with SRS wall-kicks and 7-bag randomizer.', cat: 'ACTION', group: 'ARCADE', visual: 'MATRIX: 10×20 [SRS]' },
  { id: 'minesweeper', num: '05', key: '5', title: 'MINESWEEPER', desc: 'Bit-packed grid with zero-allocation fixed-stack BFS flood fill.', cat: 'LOGIC', group: 'ARCADE', visual: '[1] [2] [⚑] SAFE' },
  { id: 'scratchpad', num: '06', key: '6', title: 'SCRATCHPAD', desc: 'Distraction-free offline Markdown writing studio with live export.', cat: 'TOOL', group: 'STUDIO', visual: '# MARKDOWN [.MD]' },
  { id: 'solitaire', num: '07', key: '7', title: 'SOLITAIRE', desc: 'Standard 52-card Klondike with smart move, undo, and auto-complete.', cat: 'CARDS', group: 'TACTICS', visual: '[A♠] [K♥] [Q♦] [J♣]' },
  { id: 'connect4', num: '08', key: '8', title: 'CONNECT 4', desc: '7×6 grid with Minimax AI solver (3 difficulties) and local 2P mode.', cat: 'TACTICS', group: 'TACTICS', visual: '7×6 [MINIMAX AI]' },
  { id: 'tictactoe', num: '09', key: '9', title: 'TIC-TAC-TOE', desc: '3×3 tactical grid with Easy/Med/Hard AI bots, 3-Piece Limit mode, and win tracking.', cat: 'TACTICS', group: 'TACTICS', visual: '3×3 [3-PIECE & AI]' },
  { id: 'aistudio', num: '10', key: '0', title: 'AI STUDIO', desc: 'Offline Ollama LLM terminal with streaming generation & roleplay presets.', cat: 'NEURAL', group: 'STUDIO', visual: '$ OLLAMA LOCAL REST' }
];

const TUTORIALS = {
  sudoku: {
    title: 'Sudoku Deluxe',
    cat: 'PUZZLE // MRV CONSTRAINT SOLVER',
    overview: 'Sudoku is a logic-based number-placement puzzle. The board consists of a 9×9 grid subdivided into nine 3×3 subgrids ("boxes"). The goal is to fill the entire grid with digits so that every row, column, and 3×3 box contains numbers 1 through 9 with zero repeats.',
    rules: [
      'Row Rule: Each of the 9 horizontal rows must contain digits 1 through 9 exactly once.',
      'Column Rule: Each of the 9 vertical columns must contain digits 1 through 9 exactly once.',
      'Box Rule: Each of the nine 3×3 subgrids must contain digits 1 through 9 exactly once.',
      'No guessing required: Zenith puzzles have a mathematically proven single unique solution.',
      'Notes Mode: Press [N] to toggle candidate pencil marks in empty cells.'
    ],
    diagram: `+---+---+---+\n| 5 3 . | . 7 . | . . . |  <-- Row must contain 1-9\n| 6 . . | 1 9 5 | . . . |\n| . 9 8 | . . . | . 6 . |\n+---+---+---+\n      ^-- Each 3×3 box must contain 1-9`,
    strategy: [
      'Cross-Hatching: Pick a frequent number (like 5 or 7). Follow its row and column lines through an unsolved 3×3 box to eliminate invalid cells until only one empty spot remains.',
      'Naked Singles: If an empty cell has only one possible candidate remaining (after checking its row, column, and box), that number MUST go there.',
      'Use the [N] key early to pencil in notes—spotting pairs and triples will quickly unlock difficult boards.'
    ],
    controls: [
      'Arrow Keys: Navigate cell highlight',
      '1 to 9: Place number (or toggle pencil note in Notes mode)',
      'N: Toggle Notes (Pencil) mode',
      'H: Smart Hint (reveals a naked single)',
      'Backspace / Delete: Clear current cell',
      'R: Generate new puzzle'
    ],
    tip: 'Never guess randomly! Look for the most constrained cell with the fewest candidates.'
  },
  wordle: {
    title: 'Wordle Offline',
    cat: 'WORD // LEXICOGRAPHICAL SEARCH',
    overview: 'Wordle is a deduction game where you must guess a hidden 5-letter English word within 6 tries. After each guess, the tile colors change to provide clues about how close your guess was.',
    rules: [
      'You have 6 attempts to guess the secret 5-letter word.',
      'Every guess must be a valid 5-letter English word from the dictionary.',
      'GREEN Tile: The letter is in the word AND in the correct position.',
      'YELLOW Tile: The letter is in the word, BUT in the wrong position.',
      'GRAY Tile: The letter is NOT in the secret word at all.',
      'Duplicate Letter Rule: Zenith evaluates duplicate letters strictly—if you guess two of the same letter but the target word only has one, only one tile will light up green/yellow.'
    ],
    diagram: `[ S ] [ T ] [ A ] [ R ] [ T ]\n  |     |     |     |     |\n GRAY  GRAY GREEN YELLO GRAY\n\n'A' is in the exact right spot. 'R' is in the word but elsewhere.`,
    strategy: [
      'Strong Openers: Start with words rich in common vowels and high-frequency consonants (e.g. CRANE, SLATE, AUDIO, ROAST).',
      'Eliminate Consonants: In guess 2, test letters like C, M, D, P to narrow down the phonetic pattern.',
      'Do not reuse gray letters—they are confirmed absent from the target word.'
    ],
    controls: [
      'Keyboard A-Z: Type letters',
      'Enter: Submit 5-letter guess',
      'Backspace: Delete previous letter',
      'R: Start new word'
    ],
    tip: 'Pay close attention to where yellow letters CANNOT go!'
  },
  g2048: {
    title: '2048 Deluxe',
    cat: 'MATH // 64-BIT BITBOARD ENGINE',
    overview: 'Slide numbered tiles on a 4×4 grid. When two tiles with identical values collide during a slide, they merge into one with double the value (2+2=4, 4+4=8, 8+8=16). Reach the 2048 tile to win!',
    rules: [
      'Every arrow key or swipe slides ALL tiles as far as possible in that direction.',
      'Colliding identical tiles merge into their sum and add to your score.',
      'Every slide spawns a new random tile (90% chance of 2, 10% chance of 4).',
      'The game ends when the board is full and no valid slides or merges remain.'
    ],
    diagram: `[  2 ] [  2 ] [  4 ] [  8 ]  --Slide Right-->  [  . ] [  4 ] [  4 ] [  8 ]\n[  4 ] [  . ] [  . ] [  . ]                    [  . ] [  . ] [  . ] [  4 ]`,
    strategy: [
      'The Corner Anchor Strategy: Pick one corner (e.g. Bottom-Right) and NEVER swipe away from it (never press Up or Left).',
      'Keep your highest-value tile locked in that anchor corner at all times.',
      'Build a descending chain along the anchored edge (e.g. 512, 256, 128, 64) so a single merge ripples down the line.'
    ],
    controls: [
      'Arrow Keys / WASD: Slide tiles in 4 directions',
      'R: Restart match',
      'U: Undo last slide'
    ],
    tip: 'If you ever swipe away from your anchor corner, a random 2 might spawn behind your highest tile and block your chain!'
  },
  tetris: {
    title: 'Tetris Guideline',
    cat: 'ACTION // 200-BYTE SRS ENGINE',
    overview: 'Stack falling geometric blocks (tetrominoes) to fill horizontal rows of 10 blocks. Filled rows disappear, awarding score bonuses and preventing the matrix from topping out.',
    rules: [
      'Guide each falling tetromino into position.',
      'Complete a full horizontal line of 10 blocks to clear it.',
      'Clearing 4 lines simultaneously with a long I-bar is a "TETRIS" and yields maximum score.',
      'If any piece locks above the top skyline (row 20), the game is over.'
    ],
    diagram: `| . . . . . . . . . . |\n| . . . [#][#][#] . . |  <- Rotate with UP / Z\n| . . . . [#] . . . . |  <- Hard drop with SPACE\n|=====================|\n| [#][#][#][#][#][#][#] <- Complete line clears!`,
    strategy: [
      'Keep your stack as flat and even as possible—avoid creating deep single-block wells.',
      'Leave column 10 (the rightmost column) empty for the long straight I-tetromino.',
      'Use the Hold chamber ([C]) to store an I-bar or T-piece until you need it.',
      'Ghost piece shows exact landing position—use Hard Drop (Space) for instant line clears.'
    ],
    controls: [
      'Left / Right Arrow: Move piece horizontally',
      'Up Arrow / X: Rotate piece clockwise',
      'Z: Rotate piece counter-clockwise',
      'Down Arrow: Soft drop (fast descent)',
      'Spacebar: Hard drop (instant drop & lock)',
      'C: Hold current piece',
      'R: Restart game'
    ],
    tip: 'SRS (Super Rotation System) enables wall-kicks: rotating against walls pushes the piece into valid openings!'
  },
  minesweeper: {
    title: 'Minesweeper Deluxe',
    cat: 'LOGIC // BIT-PACKED BFS ENGINE',
    overview: 'Uncover all safe squares in a minefield without clicking on any hidden mines. Use numerical clues to logically deduce where the mines are buried.',
    rules: [
      'First Click Guarantee: Your first click is 100% guaranteed safe and clears an opening.',
      'Numbered Clues: Each revealed number tells you exactly how many mines are in the 8 adjacent neighbor cells.',
      'Blank Cells: Cells with 0 neighboring mines trigger an automatic BFS flood-fill clearing adjacent tiles.',
      'Flagging: Mark suspected mines with a flag ([Right-Click] or [F]) to prevent accidental detonation.'
    ],
    diagram: `[ 1 ] [ 1 ] [ 1 ]  <- The '1' touches 8 neighbors\n[ 1 ] [ * ] [ 1 ]  <- [*] is the hidden mine!\n[ 1 ] [ 1 ] [ 1 ]`,
    strategy: [
      'The 1-Corner Rule: If a 1 touches only ONE unrevealed square, that square is 100% a mine—flag it immediately!',
      'The Chord Technique: Once you have flagged all mines touching a number, double-click or middle-click that number to instantly reveal all other safe neighbors.',
      'The 1-2-1 Wall Pattern: Along a flat edge, a 1-2-1 sequence always has mines under the two 1s, and the space under the 2 is safe.'
    ],
    controls: [
      'Left Click: Reveal cell',
      'Right Click / F key: Place or remove flag',
      'Double Click / Chord: Reveal all unflagged neighbors of a satisfied number',
      'R: Restart minefield'
    ],
    tip: 'When you are stuck, look for numbers touching only corners—they provide the clearest deductions.'
  },
  scratchpad: {
    title: 'Markdown Studio',
    cat: 'TOOL // DISTRACTION-FREE STUDIO',
    overview: 'A lightweight, offline Markdown notepad and document editor. Write notes, technical specs, or journal entries with live formatted preview and local storage autosave.',
    rules: [
      'Write standard Markdown in the left pane; read formatted output in the right pane.',
      'Autosave: Content is saved to your browser localStorage automatically as you type.',
      'Export: Download your document as a clean .md or .txt file anytime.'
    ],
    diagram: `# Header 1\n## Header 2\n**Bold Text** and *Italics*\n- Bullet items\n> Blockquote notes\n\`code snippets\``,
    strategy: [
      'Use headers (#, ##) to structure documents cleanly.',
      'Use code fences (\`\`\`rust) for monospace code documentation.',
      'Press Cmd/Ctrl + S to trigger manual save with confirmation chime.'
    ],
    controls: [
      'Cmd/Ctrl + S: Manual save',
      'Cmd/Ctrl + E: Export to .md file',
      'Clear Button: Reset scratchpad'
    ],
    tip: 'All data is stored purely locally on your device with 0 network calls.'
  },
  solitaire: {
    title: 'Klondike Solitaire',
    cat: 'CARDS // 52-CARD STATE MACHINE',
    overview: 'The world\'s most popular card game. Sort all 52 cards into 4 Foundation piles (Clubs, Diamonds, Hearts, Spades), arranged in ascending order from Ace to King.',
    rules: [
      'Foundations (Top-Right): 4 piles, each built UP from Ace, 2, 3... to King in the SAME suit.',
      'Tableau (7 Columns): Built DOWN in descending numerical order with ALTERNATING colors (e.g. Black 8 on Red 9).',
      'Empty Tableau Columns: Can only be filled with a King (or a stack starting with a King).',
      'Stock & Waste: Click the stock pile to flip cards to waste. When stock is exhausted, click to recycle.',
      'Single-Click Smart Move: Clicking any face-up card automatically sends it to foundation or tableau if legal.'
    ],
    diagram: `[STOCK] [WASTE]            [FOUNDATIONS: A -> K]\n [24]    [ 8♥]             [ A♣ ] [ K♦ ] [ . ] [ . ]\n\nTABLEAU (7 columns, alternating colors):\n[ K♠ ]  [ Q♦ ]  [ J♣ ]  [ 10♥]  [ 9♠ ]  [ 8♦ ]  [ 7♣ ]`,
    strategy: [
      'Always prioritize moves that reveal face-down tableau cards over drawing from stock.',
      'Do not empty a tableau column unless you have a King ready to place there.',
      'Keep foundation builds relatively balanced so you don\'t strand cards needed in the tableau.',
      'Use the [AUTO-COMPLETE] button once all remaining cards are face-up!'
    ],
    controls: [
      'Click Card: Smart auto-move to foundation or valid tableau',
      'Two-Click: Click card to select, click destination slot to move',
      'Click Stock: Deal cards to waste (or recycle when empty)',
      'U: Undo last move',
      'R: Deal new game'
    ],
    tip: 'Zenith includes an Auto-Complete solver that finishes the deal for you as soon as all face-down cards are uncovered!'
  },
  connect4: {
    title: 'Connect 4 (Tactics 4)',
    cat: 'TACTICS // MINIMAX WITH ALPHA-BETA',
    overview: 'A vertical connection board game played on a 7-column by 6-row grid. Players take turns dropping colored discs into columns. Be the first to form a line of 4 consecutive discs to win.',
    rules: [
      'Discs are dropped into one of 7 columns and fall to the lowest unoccupied slot.',
      'Win condition: Connect 4 discs in a straight line horizontally, vertically, or diagonally.',
      'If all 42 slots are filled and neither player has 4-in-a-row, the match is a draw.',
      'Zenith features an offline Minimax AI bot (Casual, Tactical, Master) and Local 2-Player mode.'
    ],
    diagram: `Columns: 1   2   3   4   5   6   7\n        ( ) ( ) ( ) ( ) ( ) ( ) ( )\n        ( ) ( ) ( ) ( ) ( ) ( ) ( )\n        ( ) ( ) (R) (R) (R) (R) ( ) <-- 4-in-a-row WIN!\n        (Y) (Y) (Y) (R) (Y) (R) (Y)`,
    strategy: [
      'Center Column Dominance: Column 4 provides the maximum number of possible 4-in-a-row vectors (horizontal, vertical, both diagonals). Control the center early.',
      'Watch Out for Baiting: Before making a drop, ensure you are not creating a platform for your opponent to win directly on top of you!',
      'Create Double-Threat Forks: Aim to set up two simultaneous 3-in-a-row threats so your opponent can only block one, leaving the other open for your win.'
    ],
    controls: [
      'Click Column: Drop disc into that column',
      '1 to 7 Keys: Instant column drop via keyboard',
      'R: Restart match',
      'Mode Selector: Switch between vs AI and 2-Player Local'
    ],
    tip: 'The Master AI calculates 5 moves ahead with alpha-beta pruning—stay focused on defending against 3-in-a-row lines!'
  },
  tictactoe: {
    title: 'Tic-Tac-Toe (Tactics 3)',
    cat: 'TACTICS // DETERMINISTIC MINIMAX',
    overview: 'The classic 3×3 tactical alignment game. Place your marks (X) on the grid and prevent your opponent (O) from completing 3-in-a-row.',
    rules: [
      'Players take turns placing their mark in an empty square on a 3×3 grid.',
      'Player 1 is X (Human), Player 2 / Bot is O.',
      'Win condition: Complete 3 of your marks in a horizontal, vertical, or diagonal line.',
      'If all 9 squares are filled with no 3-in-a-row in Classic mode, the game ends in a Draw.',
      '3-Piece Limit (Modified Mode): Each player can only have 3 pieces at once. When placing a 4th piece, your oldest piece vanishes—eliminating stalemates and creating dynamic, endless tactical maneuvering!'
    ],
    diagram: `     A   B   C\n   +---+---+---+\n 1 | X | . | O |\n   +---+---+---+\n 2 | . | X | . |   <-- Diagonal [A1 - B2 - C3] achieves 3-in-a-row!\n   +---+---+---+\n 3 | O | . | X |\n   +---+---+---+`,
    strategy: [
      'Corner Opening: Starting in a corner (A1, A3, C1, C3) gives you the highest strategic leverage. If your opponent does not answer in the exact center (B2), you can force a guaranteed win via a fork!',
      'Creating a Fork: Place your marks so that you create two simultaneous winning threats. Since your opponent can only block one on their turn, you win on the next!',
      'Block Immediate Wins: Always check if your opponent has 2-in-a-row before making your move.'
    ],
    controls: [
      'Click Square: Place mark',
      'Numpad 1 to 9: Direct coordinate placement (789 top row, 456 mid row, 123 bottom row)',
      'Keys 1 to 9: Sequential placement',
      'R: Restart match'
    ],
    tip: 'Choose from 3 Bot Levels (Easy, Medium, Hard). In Hard mode, the bot uses Minimax evaluation and plays mathematically perfect moves!'
  },
  aistudio: {
    title: 'AI Studio',
    cat: 'NEURAL // OFFLINE OLLAMA CLIENT',
    overview: 'A private, offline AI workstation that connects directly to local Large Language Models running on your Mac via Ollama. Requires zero internet access, transmits zero telemetry, and costs nothing to run.',
    rules: [
      'Connects to your local Ollama daemon at http://localhost:11434 via native streaming REST APIs.',
      'Auto-detects models already installed on your Mac (such as llama3.1, phi4-mini, deepseek-r1).',
      'Includes 5 curated roleplay presets: RPG Dungeon Master, Offline Tutor, Story Worldbuilder, Pub Trivia, and Systems Architect.',
      'Offline Sandbox Mode: If Ollama is not currently running, built-in simulated prompts allow you to explore the interface.'
    ],
    diagram: `$ ollama serve\n  -> [127.0.0.1:11434] Online\n  -> Models detected: llama3.1:8b, phi4-mini, deepseek-r1\n  -> Streaming tokens directly into browser without internet!`,
    strategy: [
      'Use the Dungeon Master preset for endless offline text adventures—tell it what action you want to take or pick one of its 3 choices.',
      'Use the Offline Tutor preset to ask deep questions in math, physics, or history when traveling without Wi-Fi.',
      'Export your conversations to Markdown (.md) anytime using the [EXPORT .MD] button in the toolbar.'
    ],
    controls: [
      'Type prompt in input bar',
      'Enter: Send message',
      'Shift + Enter: Add newline',
      'Stop Button: Cancel current token stream',
      'Clear Chat: Reset conversation history'
    ],
    tip: 'Run "ollama serve" in your Mac terminal before launching to unlock your laptop\'s full local neural weights!'
  }
};

const INTERACTIVE_TUTORIALS = {
  tictactoe: [
    {
      title: '01 // WINNING STRIKE',
      desc: 'Achieve 3 marks in a row horizontally, vertically, or diagonally. Notice row 1: A1 and B1 have X. C1 is open!',
      hint: 'Click the pulsing target square [C1] to execute your winning strike.',
      targetLabel: 'CLICK TO WIN',
      boardType: 'tictactoe',
      grid: [
        ['X', 'X', null],
        ['O', 'O', null],
        [null, null, null]
      ],
      target: { r: 0, c: 2 },
      execute: (targetEl, ctx) => {
        const cell = ctx.canvasEl.querySelector('.tut-t3-cell[data-r="0"][data-c="2"]');
        if (cell) {
          cell.textContent = 'X';
          cell.classList.add('x-mark', 'tut-stamp-pop', 'winning-cell');
          const a1 = ctx.canvasEl.querySelector('.tut-t3-cell[data-r="0"][data-c="0"]');
          const b1 = ctx.canvasEl.querySelector('.tut-t3-cell[data-r="0"][data-c="1"]');
          if (a1) a1.classList.add('winning-cell');
          if (b1) b1.classList.add('winning-cell');
        }
        const line = document.createElement('div');
        line.className = 'tut-strike-line';
        line.style.top = '28px';
        line.style.left = '6px';
        line.style.width = '168px';
        const gridEl = ctx.canvasEl.querySelector('.tut-t3-grid');
        if (gridEl) gridEl.appendChild(line);
      },
      actionBtnText: 'TRY MOVE: PLAY C1',
      successText: 'VICTORY! 3-in-a-row completed across row 1.'
    },
    {
      title: '02 // DEFENSIVE BLOCK',
      desc: 'Never give away a free win! Opponent O has 2-in-a-row down column B (B1 and B2). You must block B3 immediately.',
      hint: 'Click the pulsing target square [B3] to deny O the vertical win.',
      targetLabel: 'BLOCK HERE',
      boardType: 'tictactoe',
      grid: [
        ['X', 'O', null],
        [null, 'O', null],
        [null, null, 'X']
      ],
      target: { r: 2, c: 1 },
      execute: (targetEl, ctx) => {
        const cell = ctx.canvasEl.querySelector('.tut-t3-cell[data-r="2"][data-c="1"]');
        if (cell) {
          cell.textContent = 'X';
          cell.classList.add('x-mark', 'tut-stamp-pop');
        }
      },
      actionBtnText: 'TRY MOVE: BLOCK B3',
      successText: 'BLOCKED! You denied O\'s vertical 3-in-a-row.'
    },
    {
      title: '03 // CREATING A FORK',
      desc: 'A fork creates TWO simultaneous winning threats. Placing X at C3 threatens both Column C and the Diagonal (A1-B2-C3). Opponent can only block one!',
      hint: 'Click target square [C3] to create an unstoppable double threat.',
      targetLabel: 'FORK TARGET',
      boardType: 'tictactoe',
      grid: [
        ['X', null, null],
        [null, 'X', 'O'],
        [null, 'O', null]
      ],
      target: { r: 2, c: 2 },
      execute: (targetEl, ctx) => {
        const cell = ctx.canvasEl.querySelector('.tut-t3-cell[data-r="2"][data-c="2"]');
        if (cell) {
          cell.textContent = 'X';
          cell.classList.add('x-mark', 'tut-stamp-pop', 'winning-cell');
        }
      },
      actionBtnText: 'TRY MOVE: PLAY C3 FORK',
      successText: 'UNSTOPPABLE FORK! You created 2 simultaneous win lines. Opponent can only block one!'
    }
  ],
  connect4: [
    {
      title: '01 // GRAVITY DROP MECHANICS',
      desc: 'Discs are dropped from the top of any column and fall via gravity to the lowest unoccupied slot in that column.',
      hint: 'Click on column 4 (highlighted) to drop your red disc.',
      targetLabel: 'DROP HERE',
      boardType: 'connect4',
      cols: 7,
      rows: 4,
      targetCol: 3,
      state: [
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, 'Y',  null, 'Y',  null, null]
      ],
      execute: (targetEl, ctx) => {
        const slot = ctx.canvasEl.querySelector('.tut-c4-col[data-col="3"] .tut-c4-slot[data-row="3"]');
        if (slot) {
          slot.innerHTML = '<div class="tut-c4-disc red tut-drop-anim"></div>';
        }
      },
      actionBtnText: 'DROP INTO COLUMN 4',
      successText: 'PERFECT! Disc dropped to the lowest available slot.'
    },
    {
      title: '02 // 4-IN-A-ROW ALIGNMENT',
      desc: 'Align 4 of your discs in a straight line (horizontally, vertically, or diagonally) to achieve instant victory.',
      hint: 'You already have 3 red discs in row 4. Click column 4 to complete 4-in-a-row!',
      targetLabel: 'CONNECT 4!',
      boardType: 'connect4',
      cols: 7,
      rows: 4,
      targetCol: 3,
      state: [
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        ['R',  'R',  'R',  null, 'Y',  'Y',  'Y']
      ],
      execute: (targetEl, ctx) => {
        const slot = ctx.canvasEl.querySelector('.tut-c4-col[data-col="3"] .tut-c4-slot[data-row="3"]');
        if (slot) {
          slot.innerHTML = '<div class="tut-c4-disc red tut-drop-anim"></div>';
          setTimeout(() => {
            [0, 1, 2, 3].forEach(c => {
              const d = ctx.canvasEl.querySelector(`.tut-c4-col[data-col="${c}"] .tut-c4-slot[data-row="3"] .tut-c4-disc`);
              if (d) d.classList.add('win-pulse');
            });
          }, 360);
        }
      },
      actionBtnText: 'COMPLETE 4-IN-A-ROW',
      successText: 'CONNECT 4! Horizontal line of 4 completed for the win.'
    },
    {
      title: '03 // CENTER COLUMN DOMINANCE',
      desc: 'Column 4 commands the board! A disc in column 4 can participate in up to 8 different win lines, whereas edge columns only participate in 3.',
      hint: 'Click column 4 to secure the center position.',
      targetLabel: 'CONTROL CENTER',
      boardType: 'connect4',
      cols: 7,
      rows: 4,
      targetCol: 3,
      state: [
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null]
      ],
      execute: (targetEl, ctx) => {
        const slot = ctx.canvasEl.querySelector('.tut-c4-col[data-col="3"] .tut-c4-slot[data-row="3"]');
        if (slot) {
          slot.innerHTML = '<div class="tut-c4-disc red tut-drop-anim"></div>';
        }
      },
      actionBtnText: 'CLAIM CENTER COLUMN',
      successText: 'CENTER SECURED! You maximize your offensive and defensive vectors.'
    }
  ],
  sudoku: [
    {
      title: '01 // ROW NAKED SINGLE',
      desc: 'Each row must contain digits 1 through 9 with zero repeats. In the row below, eight digits are already placed. Only one digit is missing!',
      hint: 'The digits 1 through 8 are present. Click the empty cell [9] to place the final number.',
      targetLabel: 'PLACE 9',
      boardType: 'sudoku_row',
      rowDigits: [1, 2, 3, 4, 5, 6, 7, 8, null],
      execute: (targetEl, ctx) => {
        const cell = ctx.canvasEl.querySelector('.tut-sdk-cell[data-idx="8"]');
        if (cell) {
          cell.textContent = '9';
          cell.classList.add('placed', 'tut-stamp-pop');
        }
      },
      actionBtnText: 'PLACE DIGIT 9',
      successText: 'NAKED SINGLE SOLVED! Row complete with numbers 1 to 9.'
    },
    {
      title: '02 // 3×3 BOX CROSS-HATCHING',
      desc: 'Cross-hatching projects rows and columns of existing 5s across a 3×3 subgrid to eliminate invalid spaces until only one possible location remains.',
      hint: 'Surrounding rows and columns eliminate cells in this box. Click the single remaining valid cell to place 5.',
      targetLabel: 'VALID SPOT',
      boardType: 'sudoku_box',
      grid: [
        ['1', '2', '3'],
        ['4', null, '6'],
        ['7', '8', '9']
      ],
      target: { r: 1, c: 1 },
      execute: (targetEl, ctx) => {
        const cell = ctx.canvasEl.querySelector('.tut-t3-cell[data-r="1"][data-c="1"]');
        if (cell) {
          cell.textContent = '5';
          cell.classList.add('x-mark', 'tut-stamp-pop');
        }
      },
      actionBtnText: 'PLACE 5 IN CENTER',
      successText: 'ELIMINATION COMPLETE! Digit 5 placed through cross-hatching.'
    }
  ],
  wordle: [
    {
      title: '01 // COLOR SIGNAL DECODE',
      desc: 'Every guess reveals color signals: GREEN means correct letter & spot. YELLOW means letter exists but in another spot. GRAY means absent.',
      hint: 'Click "REVEAL TILE SIGNALS" to evaluate the guess SLATE against secret word STARE.',
      targetLabel: 'EVALUATE',
      boardType: 'wordle_tiles',
      guess: ['S', 'L', 'A', 'T', 'E'],
      colors: ['green', 'gray', 'yellow', 'gray', 'green'],
      execute: (targetEl, ctx) => {
        const tiles = ctx.canvasEl.querySelectorAll('.tut-wrd-tile');
        tiles.forEach((t, i) => {
          setTimeout(() => {
            t.classList.add('tut-flip-3d');
            setTimeout(() => {
              t.classList.add(ctx.stepData.colors[i]);
            }, 200);
          }, i * 140);
        });
      },
      actionBtnText: 'REVEAL TILE SIGNALS',
      successText: 'SIGNALS REVEALED! [S] and [E] are GREEN. [A] is YELLOW. [L] and [T] are GRAY.'
    },
    {
      title: '02 // POSITIONING YELLOW LETTERS',
      desc: 'In guess 1, "A" was yellow at position 3. Now in guess 2 "STARE", "A" is tested in position 3. Click position 3 to test!',
      hint: 'Click tile [A] to verify if position 3 is the correct spot in STARE.',
      targetLabel: 'TEST [A]',
      boardType: 'wordle_tiles',
      guess: ['S', 'T', 'A', 'R', 'E'],
      colors: ['green', 'green', 'green', 'green', 'green'],
      execute: (targetEl, ctx) => {
        const tiles = ctx.canvasEl.querySelectorAll('.tut-wrd-tile');
        tiles.forEach((t) => {
          t.classList.add('tut-flip-3d', 'green');
        });
      },
      actionBtnText: 'SUBMIT GUESS "STARE"',
      successText: 'EXCELLENT DEDUCTION! All 5 tiles are GREEN. Target word solved!'
    }
  ],
  g2048: [
    {
      title: '01 // TILE MERGE COLLISION',
      desc: 'When two tiles with identical numbers collide during a slide, they merge into one tile with double the value (2 + 2 = 4).',
      hint: 'Click "SLIDE RIGHT" to slide the tiles and execute the merge.',
      targetLabel: 'SLIDE ->',
      boardType: 'g2048_row',
      tiles: [2, 2, null, null],
      execute: (targetEl, ctx) => {
        const grid = ctx.canvasEl.querySelector('.tut-2048-grid');
        if (grid) {
          grid.innerHTML = `
            <div class="tut-2048-cell"></div>
            <div class="tut-2048-cell"></div>
            <div class="tut-2048-cell"></div>
            <div class="tut-2048-cell t4 tut-stamp-pop">4</div>
          `;
        }
      },
      actionBtnText: 'SLIDE TILES RIGHT ->',
      successText: 'TILES MERGED! 2 + 2 = 4. Score +4 awarded!'
    },
    {
      title: '02 // THE CORNER ANCHOR RULE',
      desc: 'Always keep your highest-value tile locked in one corner (e.g. Bottom-Right). Never swipe away from your anchor corner!',
      hint: 'Notice [512] anchored at bottom-right, supported by [256] and [128]. Click to test corner lock.',
      targetLabel: 'ANCHOR',
      boardType: 'g2048_anchor',
      execute: (targetEl, ctx) => {
        const cell = ctx.canvasEl.querySelector('.tut-2048-cell.t512');
        if (cell) cell.classList.add('tut-stamp-pop');
      },
      actionBtnText: 'TEST CORNER LOCK',
      successText: 'CORNER SECURED! Descending chain preserved along the edge.'
    }
  ],
  minesweeper: [
    {
      title: '01 // THE 1-CORNER DEDUCTION',
      desc: 'If a revealed number "1" touches only ONE unrevealed square, that square is guaranteed to contain a hidden mine.',
      hint: 'Click the unrevealed center square to plant a protective FLAG [!].',
      targetLabel: 'FLAG MINE',
      boardType: 'minesweeper',
      grid: [
        ['1', '1', '1'],
        ['1', '?', '1'],
        ['1', '1', '1']
      ],
      execute: (targetEl, ctx) => {
        const cell = ctx.canvasEl.querySelector('.tut-ms-cell[data-r="1"][data-c="1"]');
        if (cell) {
          cell.textContent = '!';
          cell.classList.add('flagged', 'tut-stamp-pop');
        }
      },
      actionBtnText: 'FLAG SUSPECTED MINE',
      successText: 'FLAG PLANTED! Mine identified with 100% mathematical certainty.'
    },
    {
      title: '02 // CHORDING SAFE SQUARES',
      desc: 'When a number touches the exact number of required flags, clicking that number instantly reveals all other neighboring squares safely.',
      hint: 'Click the satisfied number "1" in the center to chord-reveal all safe neighbors.',
      targetLabel: 'CHORD CLICK',
      boardType: 'minesweeper_chord',
      execute: (targetEl, ctx) => {
        const cells = ctx.canvasEl.querySelectorAll('.tut-ms-cell');
        cells.forEach(c => {
          if (!c.classList.contains('flagged')) {
            c.classList.add('revealed', 'tut-stamp-pop');
            c.textContent = ' ';
          }
        });
      },
      actionBtnText: 'CHORD THE NUMBER "1"',
      successText: 'CHORD EXECUTED! All safe neighboring squares revealed instantly.'
    }
  ],
  solitaire: [
    {
      title: '01 // DESCENDING ALTERNATING COLORS',
      desc: 'Tableau columns are built DOWN in descending numerical order with alternating colors (e.g. Black 8 on Red 9).',
      hint: 'Click the Black 8 of Spades to snap it beneath the Red 9 of Hearts.',
      targetLabel: 'SNAP TO 9',
      boardType: 'solitaire',
      execute: (targetEl, ctx) => {
        const card8 = ctx.canvasEl.querySelector('.tut-sol-card.black');
        if (card8) {
          card8.style.transform = 'translate(-88px, 32px)';
          card8.style.boxShadow = '0 8px 16px rgba(0,0,0,0.5)';
        }
      },
      actionBtnText: 'SNAP [8 SPADES] TO [9 HEARTS]',
      successText: 'LEGAL MOVE! Black 8 stacked onto Red 9.'
    },
    {
      title: '02 // FOUNDATION ASCENDING SUIT',
      desc: 'Foundations start empty and are built UP from Ace to King in the same suit (Ace, 2, 3... King).',
      hint: 'Click the Ace of Spades [A♠] to send it to the empty Foundation pile.',
      targetLabel: 'MOVE TO FOUNDATION',
      boardType: 'solitaire_foundation',
      execute: (targetEl, ctx) => {
        const ace = ctx.canvasEl.querySelector('.tut-sol-card.ace');
        if (ace) {
          ace.style.transform = 'translateY(-110px)';
          ace.style.opacity = '0.9';
        }
      },
      actionBtnText: 'SEND [A♠] TO FOUNDATION',
      successText: 'FOUNDATION STARTED! Spades foundation active from Ace to King.'
    }
  ],
  tetris: [
    {
      title: '01 // SRS ROTATION & WALL KICKS',
      desc: 'The Super Rotation System (SRS) tests 5 offset kick points when a piece rotates against a wall or obstacle, slipping it into valid openings.',
      hint: 'Click "ROTATE CLOCKWISE [UP]" to rotate the T-piece into orientation.',
      targetLabel: 'ROTATE',
      boardType: 'tetris_rotate',
      execute: (targetEl, ctx) => {
        const piece = ctx.canvasEl.querySelector('.tut-tet-piece-t');
        if (piece) piece.style.transform = 'rotate(90deg)';
      },
      actionBtnText: 'ROTATE CLOCKWISE [UP]',
      successText: 'SRS ROTATION SUCCESS! Wall kick executed into pocket.'
    },
    {
      title: '02 // HARD DROP LINE CLEAR',
      desc: 'Pressing Spacebar executes a Hard Drop: your piece instantly locks at the bottom. Filling an entire row of 10 blocks clears the line!',
      hint: 'Click "HARD DROP [SPACE]" to drop the I-piece into column 10 to clear row 1.',
      targetLabel: 'HARD DROP',
      boardType: 'tetris_clear',
      execute: (targetEl, ctx) => {
        const matrix = ctx.canvasEl.querySelector('.tut-tet-matrix');
        if (matrix) {
          const bottomRow = matrix.querySelectorAll('.tut-tet-block[data-row="3"]');
          bottomRow.forEach(b => b.classList.add('tut-tet-line-clear'));
          setTimeout(() => {
            bottomRow.forEach(b => {
              b.classList.remove('filled', 'tut-tet-line-clear');
              b.style.background = '#1a1b1e';
            });
          }, 320);
        }
      },
      actionBtnText: 'HARD DROP [SPACE]',
      successText: 'LINE CLEARED! 10 blocks aligned. Matrix stack reduced.'
    }
  ],
  scratchpad: [
    {
      title: '01 // MARKDOWN SYNTAX & LIVE COMPILATION',
      desc: 'Type Markdown in the editor to instantly see styled output. Headers (#), Bold (**text**), and bullet lists (-) render automatically.',
      hint: 'Click "INSERT # HEADER" to see live markdown preview compilation.',
      targetLabel: 'CLICK TO FORMAT',
      boardType: 'scratchpad',
      execute: (targetEl, ctx) => {
        const preview = ctx.canvasEl.querySelector('.tut-sp-preview');
        if (preview) {
          preview.innerHTML = '<h3 style="color:var(--color-accent); margin:0 0 4px 0;"># Systems Architecture</h3><p style="margin:0; font-size:0.85rem; color:var(--color-text-main);"><strong>Status:</strong> 100% Offline</p>';
        }
      },
      actionBtnText: 'INSERT MARKDOWN SYNTAX',
      successText: 'RENDER COMPILED! Markdown formatted instantly with zero network roundtrips.'
    }
  ],
  aistudio: [
    {
      title: '01 // OFFLINE STREAMING GENERATION',
      desc: 'AI Studio communicates directly with your local Ollama daemon at http://localhost:11434. Tokens stream token-by-token directly into your browser.',
      hint: 'Click "STREAM PROMPT" to simulate zero-telemetry local token generation.',
      targetLabel: 'RUN STREAM',
      boardType: 'aistudio',
      execute: (targetEl, ctx) => {
        const streamEl = ctx.canvasEl.querySelector('.tut-ai-stream');
        if (streamEl) {
          streamEl.textContent = '';
          const msg = 'Model: llama3.1:8b (Local)\n> Latency: 0.12ms\n> Telemetry: 0 packets\n> Offline inference ready.';
          let idx = 0;
          const interval = setInterval(() => {
            if (idx < msg.length) {
              streamEl.textContent += msg[idx++];
            } else {
              clearInterval(interval);
            }
          }, 20);
        }
      },
      actionBtnText: 'STREAM PROMPT TO LOCAL MODEL',
      successText: 'STREAMING COMPLETED! Zero internet required, 100% private neural weights.'
    }
  ]
};

class App {
  constructor() {
    this.currentView = 'index';
    this.activeModuleId = null;
    this.activeModuleInstance = null;
    this.telemetryEl = document.getElementById('telemetry-ms');
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.activeTutorialModule = null;
    this.activeTutorialStep = 0;
    this.tutorialStepCompleted = false;
    this._stageOverlayKeyHandler = null;
  }

  async init() {
    this.setupTheme();
    this.setupCrt();
    this.setupTopAudio();
    this.setupHandheldControls();
    this.setupGlobalShortcuts();
    this.setupLifecycleHooks();
    this.setupIndexFilters();
    this.setupTutorialDialog();
    this.renderIndex();

    try {
      await window.wasmBridge.init();
      this.updateTelemetry();
    } catch (e) {
      console.error('WASM initialization failed:', e);
      if (this.telemetryEl) this.telemetryEl.textContent = 'ERR';
    }
  }

  updateTelemetry() {
    const val = window.wasmBridge ? `${window.wasmBridge.lastExecTimeMs.toFixed(2)} ms` : '0.03 ms';
    if (this.telemetryEl) this.telemetryEl.textContent = val;
    const dashVal = document.getElementById('dash-telemetry');
    if (dashVal) dashVal.textContent = val;
  }

  setupTheme() {
    const THEMES = ['arcade', 'gameboy', 'nes', 'amber'];
    const THEME_LABELS = {
      arcade: 'ARCADE',
      gameboy: 'GAME BOY',
      nes: 'NES',
      amber: 'AMBER'
    };

    let saved = localStorage.getItem('zenith_retro_theme');
    if (!THEMES.includes(saved)) {
      const legacy = localStorage.getItem('zenith_theme');
      if (legacy === 'light') saved = 'gameboy';
      else saved = 'arcade';
    }

    const btn = document.getElementById('theme-toggle-btn');

    const apply = (theme) => {
      if (document.documentElement) {
        document.documentElement.setAttribute('data-theme', theme);
      }
      const chassis = document.getElementById('handheld-chassis');
      if (chassis) {
        chassis.setAttribute('data-theme', theme);
      }
      if (btn) {
        btn.textContent = `THEME: ${THEME_LABELS[theme] || theme.toUpperCase()}`;
      }
    };

    apply(saved);

    if (btn) {
      btn.onclick = () => {
        const cur = (document.documentElement && document.documentElement.getAttribute('data-theme')) || 'arcade';
        const curIdx = THEMES.indexOf(cur);
        const next = THEMES[(curIdx + 1) % THEMES.length];
        localStorage.setItem('zenith_retro_theme', next);
        apply(next);
        if (window.audioController && window.audioController.playSfx) {
          window.audioController.playSfx(0);
        }
      };
    }
  }

  setupCrt() {
    const btn = document.getElementById('crt-toggle-btn');
    const saved = localStorage.getItem('zenith_crt');
    const isCrt = saved !== null ? (saved === 'true' || saved === 'on') : true;

    const getScreenEl = () => document.getElementById('handheld-screen') || document.body;

    const apply = (active) => {
      const screenEl = getScreenEl();
      if (screenEl) {
        screenEl.classList.toggle('scanlines-on', active);
        if (screenEl !== document.body && document.body) {
          document.body.classList.remove('scanlines-on');
        }
      }
      if (btn) {
        btn.textContent = `CRT: ${active ? 'ON' : 'OFF'}`;
        btn.classList.toggle('active', active);
      }
    };

    apply(isCrt);

    if (btn) {
      btn.onclick = () => {
        const screenEl = getScreenEl();
        const currentActive = screenEl ? screenEl.classList.contains('scanlines-on') : false;
        const next = !currentActive;
        localStorage.setItem('zenith_crt', String(next));
        apply(next);
        if (window.audioController && window.audioController.playSfx) {
          window.audioController.playSfx(0);
        }
      };
    }
  }

  setupHandheldControls() {
    const buttons = document.querySelectorAll('.deck-dpad button, .action-buttons button, .deck-options button');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const code = btn.dataset.code;
        if (!key && !code) return;

        const eventKey = key || code;
        const eventCode = code || key;

        const evDown = new KeyboardEvent('keydown', {
          key: eventKey,
          code: eventCode,
          bubbles: true,
          cancelable: true
        });
        window.dispatchEvent(evDown);

        setTimeout(() => {
          const evUp = new KeyboardEvent('keyup', {
            key: eventKey,
            code: eventCode,
            bubbles: true,
            cancelable: true
          });
          window.dispatchEvent(evUp);
        }, 60);

        if (window.audioController && typeof window.audioController.playSfx === 'function') {
          window.audioController.playSfx(0);
        }
      });
    });
  }

  setupTopAudio() {
    const sfxBtn = document.getElementById('sfx-toggle-btn');
    if (sfxBtn) {
      sfxBtn.onclick = () => {
        const enabled = window.audioController.toggleSfx();
        sfxBtn.textContent = `SFX: ${enabled ? 'ON' : 'OFF'}`;
        sfxBtn.classList.toggle('active', enabled);
        if (enabled) window.audioController.playSfx(0);
      };
    }

    document.querySelectorAll('.ambient-btn').forEach(btn => {
      btn.onclick = () => {
        const type = parseInt(btn.getAttribute('data-type'), 10);
        if (btn.classList.contains('active')) {
          window.audioController.stopAmbient();
          btn.classList.remove('active');
        } else {
          document.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
          window.audioController.playAmbient(type, 0.5);
          btn.classList.add('active');
        }
        this.updateTelemetry();
      };
    });
  }

  setupGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Return to Index
      if (e.key === 'Escape') {
        if (this.tutDialog && this.tutDialog.open) {
          // Native dialog handles escape
          return;
        }
        if (this.currentView === 'stage') {
          e.preventDefault();
          this.switchView('index');
          return;
        }
      }

      // Quick filter search shortcut ('/') on Index
      if (e.key === '/' && this.currentView === 'index' && document.activeElement !== document.getElementById('index-search')) {
        e.preventDefault();
        const searchInput = document.getElementById('index-search');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Open Tutorial shortcut ('?' or 'h')
      if ((e.key === '?' || e.key === 'h' || e.key === 'H') && !e.metaKey && !e.ctrlKey) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        if (this.currentView === 'stage' && this.activeModuleId) {
          this.openTutorial(this.activeModuleId);
        } else {
          this.openTutorial('sudoku');
        }
        return;
      }

      // Quick-launch from Index (keys 1 to 9, and 0)
      if (this.currentView === 'index' && !e.metaKey && !e.ctrlKey) {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        const found = MODULES.find(m => m.key === e.key);
        if (found) {
          e.preventDefault();
          this.switchView('stage', found.id);
        }
      }
    });

    const backBtn = document.getElementById('stage-back-btn');
    if (backBtn) backBtn.onclick = () => this.switchView('index');

    const brandLink = document.getElementById('brand-link');
    if (brandLink) {
      brandLink.onclick = (e) => {
        e.preventDefault();
        this.switchView('index');
      };
    }
  }

  setupLifecycleHooks() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.audioController.suspend();
        if (this.activeModuleInstance && typeof this.activeModuleInstance.pause === 'function') {
          this.activeModuleInstance.pause();
        }
      } else {
        window.audioController.resume();
      }
    });

    window.addEventListener('blur', () => {
      if (this.activeModuleInstance && typeof this.activeModuleInstance.pause === 'function') {
        this.activeModuleInstance.pause();
      }
    });
  }

  setupIndexFilters() {
    const catContainer = document.getElementById('filter-categories');
    if (catContainer) {
      catContainer.querySelectorAll('.filter-chip').forEach(chip => {
        chip.onclick = () => {
          catContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.currentFilter = chip.getAttribute('data-filter');
          this.renderIndex();
          window.audioController.playSfx(0);
        };
      });
    }

    const searchInput = document.getElementById('index-search');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderIndex();
      };
    }
  }

  setupTutorialDialog() {
    this.tutDialog = document.getElementById('zenith-tutorial-dialog');
    if (!this.tutDialog) return;

    // Fallback for browsers without closedBy support per Modern Web Guidance
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      this.tutDialog.addEventListener('click', (event) => {
        if (event.target !== this.tutDialog) return;
        const rect = this.tutDialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) this.tutDialog.close();
      });
    }

    // Tab switching
    document.querySelectorAll('.tut-tab').forEach(tabBtn => {
      tabBtn.onclick = () => {
        document.querySelectorAll('.tut-tab').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
        const tab = tabBtn.getAttribute('data-tab');
        if (tab === 'rules') {
          this.activeTutorialStep = 0;
          this.tutorialStepCompleted = false;
        }
        this.renderTutorialContent(this.activeTutorialModule, tab);
      };
    });

    const startBtn = document.getElementById('tut-start-btn');
    if (startBtn) {
      startBtn.onclick = () => {
        const modId = this.activeTutorialModule;
        this.tutDialog.close();
        if (modId) this.switchView('stage', modId);
      };
    }
  }

  openTutorial(moduleId, tab = 'overview') {
    this.activeTutorialModule = moduleId;
    this.activeTutorialStep = 0;
    this.tutorialStepCompleted = false;
    const tut = TUTORIALS[moduleId];
    if (!tut || !this.tutDialog) return;

    const catEl = document.getElementById('tut-cat');
    const titleEl = document.getElementById('tut-title');
    const tipEl = document.getElementById('tut-tip');

    if (catEl) catEl.textContent = tut.cat;
    if (titleEl) titleEl.textContent = tut.title;
    if (tipEl) tipEl.textContent = tut.tip || 'Pro Tip: Think through your next move!';

    document.querySelectorAll('.tut-tab').forEach(b => {
      const isCur = b.getAttribute('data-tab') === tab;
      b.classList.toggle('active', isCur);
      b.setAttribute('aria-selected', isCur ? 'true' : 'false');
    });

    this.renderTutorialContent(moduleId, tab);
    this.tutDialog.showModal();
    window.audioController.playSfx(0);
  }

  renderTutorialContent(moduleId, tab) {
    const bodyEl = document.getElementById('tut-body');
    const tut = TUTORIALS[moduleId];
    if (!bodyEl || !tut) return;

    if (tab === 'overview') {
      bodyEl.innerHTML = `
        <div class="tut-step-list">
          <div class="tut-step">
            <div class="tut-step-num">01 // OBJECTIVE</div>
            <div class="tut-step-text">${tut.overview}</div>
          </div>
          <div class="tut-step">
            <div class="tut-step-num">02 // BOARD VISUALIZATION</div>
            <div class="tut-diagram-box"><pre style="margin:0; font-family:var(--font-mono); line-height:1.4;">${tut.diagram}</pre></div>
          </div>
        </div>
      `;
    } else if (tab === 'rules') {
      this.renderInteractiveTutorial(moduleId, this.activeTutorialStep);
    } else if (tab === 'strategy') {
      bodyEl.innerHTML = `
        <div class="tut-step-list">
          <div class="tut-step-num" style="margin-bottom:0.25rem;">STRATEGIC PATTERNS &amp; ADVANCED PLAY</div>
          ${tut.strategy.map((s, i) => `
            <div class="tut-step">
              <div class="tut-step-num">TECHNIQUE ${String(i + 1).padStart(2, '0')}</div>
              <div class="tut-step-text">${s}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (tab === 'controls') {
      bodyEl.innerHTML = `
        <div class="tut-step-list">
          <div class="tut-step-num" style="margin-bottom:0.5rem;">KEYBOARD SHORTCUTS &amp; INPUT CHEATSHEET</div>
          ${tut.controls.map(c => {
            const parts = c.split(':');
            const k = parts[0];
            const d = parts.slice(1).join(':');
            return `
              <div class="tut-step" style="display:flex; justify-content:space-between; align-items:center; padding: 4px 0 4px 12px;">
                <span style="font-family:var(--font-mono); font-weight:700; color:var(--color-accent);">${k}</span>
                <span style="font-size:0.85rem; color:var(--color-text-muted);">${d}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  renderInteractiveTutorial(moduleId, stepIndex = 0) {
    const bodyEl = document.getElementById('tut-body');
    const tut = TUTORIALS[moduleId];
    const steps = INTERACTIVE_TUTORIALS[moduleId];
    if (!bodyEl || !tut) return;

    if (!steps || !steps.length) {
      bodyEl.innerHTML = `
        <div class="tut-step-list">
          <div class="tut-step-num" style="margin-bottom:0.25rem;">CORE MECHANICS &amp; CONSTRAINTS</div>
          ${tut.rules.map((r, i) => `
            <div class="tut-step">
              <div class="tut-step-num">RULE ${String(i + 1).padStart(2, '0')}</div>
              <div class="tut-step-text">${r}</div>
            </div>
          `).join('')}
        </div>
      `;
      return;
    }

    if (stepIndex < 0) stepIndex = 0;
    if (stepIndex >= steps.length) stepIndex = steps.length - 1;
    this.activeTutorialStep = stepIndex;
    this.tutorialStepCompleted = false;

    const curStep = steps[stepIndex];
    const total = steps.length;

    bodyEl.innerHTML = `
      <div class="tut-mini-stage">
        <div class="tut-step-header">
          <span class="tut-step-badge">INTERACTIVE STEP ${stepIndex + 1} OF ${total}</span>
          <div class="tut-step-dots" role="tablist" aria-label="Tutorial Steps">
            ${steps.map((s, idx) => `
              <button class="tut-step-dot ${idx === stepIndex ? 'active' : ''} ${idx < stepIndex ? 'completed' : ''}" data-step="${idx}" title="Step ${idx + 1}: ${s.title}">${idx + 1}</button>
            `).join('')}
          </div>
          <button class="tut-btn" id="tut-reset-step" title="Reset this interactive step">&#x21BA; RESET MOVE</button>
        </div>

        <div class="tut-mini-instruction">
          <div class="tut-instr-title">${curStep.title}</div>
          <div class="tut-instr-text">${curStep.desc}</div>
          <div class="tut-instr-action">
            <span>&#x25B6;</span>
            <span>${curStep.hint}</span>
          </div>
        </div>

        <div class="tut-interactive-canvas" id="tut-canvas"></div>

        <div id="tut-success-container" style="display: none;">
          <div class="tut-success-banner">
            <span id="tut-success-msg">${curStep.successText}</span>
            ${stepIndex < total - 1 ? `<button class="tut-btn tut-btn-primary" id="tut-next-banner-btn">NEXT STEP &rarr;</button>` : `<button class="tut-btn tut-btn-primary" id="tut-play-banner-btn">PLAY MODULE NOW &rarr;</button>`}
          </div>
        </div>

        <div class="tut-controls-bar">
          <button class="tut-btn" id="tut-prev-step" ${stepIndex === 0 ? 'disabled' : ''}>&larr; PREV STEP</button>
          <button class="tut-btn tut-btn-primary" id="tut-action-move">${curStep.actionBtnText || 'TRY THIS MOVE'}</button>
          <button class="tut-btn" id="tut-next-step" ${stepIndex === total - 1 ? 'disabled' : ''}>NEXT STEP &rarr;</button>
        </div>

        <details style="margin-top: 0.5rem; border-top: 1px dashed var(--color-border); padding-top: 0.75rem;">
          <summary style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-text-muted); cursor: pointer; user-select: none;">
            [+] VIEW ALL ${tut.rules.length} TEXT RULES &amp; CONSTRAINTS
          </summary>
          <div class="tut-step-list" style="margin-top: 0.75rem;">
            ${tut.rules.map((r, i) => `
              <div class="tut-step">
                <div class="tut-step-num">RULE ${String(i + 1).padStart(2, '0')}</div>
                <div class="tut-step-text">${r}</div>
              </div>
            `).join('')}
          </div>
        </details>
      </div>
    `;

    const canvasEl = document.getElementById('tut-canvas');

    const doMove = () => {
      if (this.tutorialStepCompleted) return;
      this.tutorialStepCompleted = true;

      document.querySelectorAll('.tut-target-pulse').forEach(el => {
        el.classList.remove('tut-target-pulse');
        const cue = el.querySelector('.tut-pointer-cue');
        if (cue) cue.remove();
      });

      if (typeof curStep.execute === 'function') {
        curStep.execute(null, { canvasEl, stepData: curStep });
      }

      window.audioController.playSfx(1);

      const actionBtn = document.getElementById('tut-action-move');
      if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.textContent = 'MOVE COMPLETED';
      }

      const dot = document.querySelector(`.tut-step-dot[data-step="${stepIndex}"]`);
      if (dot) dot.classList.add('completed');

      const successContainer = document.getElementById('tut-success-container');
      if (successContainer) {
        successContainer.style.display = 'block';
        const nextBannerBtn = document.getElementById('tut-next-banner-btn');
        if (nextBannerBtn) {
          nextBannerBtn.onclick = () => {
            this.renderInteractiveTutorial(moduleId, stepIndex + 1);
          };
        }
        const playBannerBtn = document.getElementById('tut-play-banner-btn');
        if (playBannerBtn) {
          playBannerBtn.onclick = () => {
            this.tutDialog.close();
            this.switchView('stage', moduleId);
          };
        }
      }
    };

    // Render Canvas per boardType:
    if (curStep.boardType === 'tictactoe') {
      const grid = document.createElement('div');
      grid.className = 'tut-t3-grid';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cell = document.createElement('div');
          cell.className = 'tut-t3-cell';
          cell.dataset.r = r;
          cell.dataset.c = c;
          const val = curStep.grid[r][c];
          if (val) {
            cell.textContent = val;
            cell.classList.add(val === 'X' ? 'x-mark' : 'o-mark');
          } else if (curStep.target && curStep.target.r === r && curStep.target.c === c) {
            cell.classList.add('tut-target-pulse');
            cell.innerHTML = `<span class="tut-pointer-cue">${curStep.targetLabel || 'CLICK HERE'}</span>`;
            cell.onclick = () => doMove();
          }
          grid.appendChild(cell);
        }
      }
      canvasEl.appendChild(grid);
    } else if (curStep.boardType === 'connect4') {
      const board = document.createElement('div');
      board.className = 'tut-c4-board';
      const colsWrap = document.createElement('div');
      colsWrap.className = 'tut-c4-columns';
      for (let c = 0; c < curStep.cols; c++) {
        const col = document.createElement('div');
        col.className = 'tut-c4-col';
        col.dataset.col = c;
        if (c === curStep.targetCol) {
          col.classList.add('tut-c4-col-target');
        }
        for (let r = 0; r < curStep.rows; r++) {
          const slot = document.createElement('div');
          slot.className = 'tut-c4-slot';
          slot.dataset.row = r;
          const cellVal = curStep.state[r][c];
          if (cellVal === 'R') {
            slot.innerHTML = '<div class="tut-c4-disc red"></div>';
          } else if (cellVal === 'Y') {
            slot.innerHTML = '<div class="tut-c4-disc yellow"></div>';
          } else if (c === curStep.targetCol && r === curStep.rows - 1 && !curStep.state[r][c]) {
            slot.classList.add('tut-target-pulse');
            slot.innerHTML = `<span class="tut-pointer-cue">${curStep.targetLabel || 'DROP'}</span>`;
          }
          col.appendChild(slot);
        }
        col.onclick = () => {
          if (c === curStep.targetCol) doMove();
        };
        colsWrap.appendChild(col);
      }
      board.appendChild(colsWrap);
      canvasEl.appendChild(board);
    } else if (curStep.boardType === 'sudoku_row') {
      const rowBox = document.createElement('div');
      rowBox.className = 'tut-sdk-row-box';
      const cells = document.createElement('div');
      cells.className = 'tut-sdk-cells';
      curStep.rowDigits.forEach((d, idx) => {
        const cell = document.createElement('div');
        cell.className = 'tut-sdk-cell given';
        cell.dataset.idx = idx;
        if (d !== null) {
          cell.textContent = d;
        } else {
          cell.classList.remove('given');
          cell.classList.add('tut-target-pulse');
          cell.innerHTML = `<span class="tut-pointer-cue">${curStep.targetLabel || 'PLACE'}</span>`;
          cell.onclick = () => doMove();
        }
        cells.appendChild(cell);
      });
      rowBox.appendChild(cells);
      canvasEl.appendChild(rowBox);
    } else if (curStep.boardType === 'sudoku_box') {
      const grid = document.createElement('div');
      grid.className = 'tut-t3-grid';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cell = document.createElement('div');
          cell.className = 'tut-t3-cell';
          cell.dataset.r = r;
          cell.dataset.c = c;
          const val = curStep.grid[r][c];
          if (val) {
            cell.textContent = val;
            cell.classList.add('given');
          } else if (curStep.target && curStep.target.r === r && curStep.target.c === c) {
            cell.classList.add('tut-target-pulse');
            cell.innerHTML = `<span class="tut-pointer-cue">${curStep.targetLabel || 'VALID'}</span>`;
            cell.onclick = () => doMove();
          }
          grid.appendChild(cell);
        }
      }
      canvasEl.appendChild(grid);
    } else if (curStep.boardType === 'wordle_tiles') {
      const wrdBox = document.createElement('div');
      wrdBox.className = 'tut-wrd-box';
      const row = document.createElement('div');
      row.className = 'tut-wrd-row';
      curStep.guess.forEach((letter, i) => {
        const tile = document.createElement('div');
        tile.className = 'tut-wrd-tile';
        tile.dataset.idx = i;
        tile.textContent = letter;
        row.appendChild(tile);
      });
      wrdBox.appendChild(row);
      canvasEl.appendChild(wrdBox);
    } else if (curStep.boardType === 'g2048_row') {
      const grid = document.createElement('div');
      grid.className = 'tut-2048-grid';
      grid.style.gridTemplateRows = 'repeat(1, 52px)';
      curStep.tiles.forEach(t => {
        const cell = document.createElement('div');
        cell.className = 'tut-2048-cell';
        if (t) {
          cell.classList.add(`t${t}`);
          cell.textContent = t;
        }
        grid.appendChild(cell);
      });
      canvasEl.appendChild(grid);
    } else if (curStep.boardType === 'g2048_anchor') {
      const grid = document.createElement('div');
      grid.className = 'tut-2048-grid';
      grid.innerHTML = `
        <div class="tut-2048-cell"></div>
        <div class="tut-2048-cell"></div>
        <div class="tut-2048-cell t128">128</div>
        <div class="tut-2048-cell t256">256</div>
        <div class="tut-2048-cell"></div>
        <div class="tut-2048-cell"></div>
        <div class="tut-2048-cell t2">2</div>
        <div class="tut-2048-cell t512 tut-target-pulse">
          <span class="tut-pointer-cue">${curStep.targetLabel || 'ANCHOR'}</span>
          512
        </div>
      `;
      const cell512 = grid.querySelector('.tut-2048-cell.t512');
      if (cell512) cell512.onclick = () => doMove();
      canvasEl.appendChild(grid);
    } else if (curStep.boardType === 'minesweeper') {
      const grid = document.createElement('div');
      grid.className = 'tut-ms-grid';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cell = document.createElement('div');
          cell.className = 'tut-ms-cell';
          cell.dataset.r = r;
          cell.dataset.c = c;
          const val = curStep.grid[r][c];
          if (val === '?') {
            cell.classList.add('tut-target-pulse');
            cell.innerHTML = `<span class="tut-pointer-cue">${curStep.targetLabel || 'MINE'}</span>?`;
            cell.onclick = () => doMove();
          } else {
            cell.classList.add('revealed', 'num-1');
            cell.textContent = val;
          }
          grid.appendChild(cell);
        }
      }
      canvasEl.appendChild(grid);
    } else if (curStep.boardType === 'minesweeper_chord') {
      const grid = document.createElement('div');
      grid.className = 'tut-ms-grid';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cell = document.createElement('div');
          cell.className = 'tut-ms-cell';
          cell.dataset.r = r;
          cell.dataset.c = c;
          if (r === 1 && c === 1) {
            cell.classList.add('revealed', 'num-1', 'tut-target-pulse');
            cell.innerHTML = `1<span class="tut-pointer-cue">${curStep.targetLabel || 'CHORD'}</span>`;
            cell.onclick = () => doMove();
          } else if (r === 0 && c === 0) {
            cell.classList.add('flagged');
            cell.textContent = '!';
          } else {
            cell.textContent = '?';
          }
          grid.appendChild(cell);
        }
      }
      canvasEl.appendChild(grid);
    } else if (curStep.boardType === 'solitaire') {
      const tableau = document.createElement('div');
      tableau.className = 'tut-sol-tableau';
      tableau.innerHTML = `
        <div class="tut-sol-col">
          <div class="tut-sol-card red">
            <span>9 &hearts;</span>
            <span style="font-size:1.5rem; text-align:center;">&hearts;</span>
            <span style="text-align:right;">9 &hearts;</span>
          </div>
        </div>
        <div class="tut-sol-col">
          <div class="tut-sol-card black tut-target-pulse">
            <span class="tut-pointer-cue">${curStep.targetLabel || 'MOVE'}</span>
            <span>8 &spades;</span>
            <span style="font-size:1.5rem; text-align:center;">&spades;</span>
            <span style="text-align:right;">8 &spades;</span>
          </div>
        </div>
      `;
      const card8 = tableau.querySelector('.tut-sol-card.black');
      if (card8) card8.onclick = () => doMove();
      canvasEl.appendChild(tableau);
    } else if (curStep.boardType === 'solitaire_foundation') {
      const tableau = document.createElement('div');
      tableau.className = 'tut-sol-tableau';
      tableau.innerHTML = `
        <div class="tut-sol-col">
          <div style="width:68px; height:96px; border:2px dashed var(--color-border); border-radius:4px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:0.75rem; color:var(--color-text-muted);">
            FOUNDATION [&spades;]
          </div>
        </div>
        <div class="tut-sol-col" style="margin-top:20px;">
          <div class="tut-sol-card black ace tut-target-pulse">
            <span class="tut-pointer-cue">${curStep.targetLabel || 'MOVE'}</span>
            <span>A &spades;</span>
            <span style="font-size:1.5rem; text-align:center;">&spades;</span>
            <span style="text-align:right;">A &spades;</span>
          </div>
        </div>
      `;
      const ace = tableau.querySelector('.tut-sol-card.ace');
      if (ace) ace.onclick = () => doMove();
      canvasEl.appendChild(tableau);
    } else if (curStep.boardType === 'tetris_rotate') {
      const wrap = document.createElement('div');
      wrap.className = 'tut-tet-piece-t tut-target-pulse';
      wrap.style.display = 'grid';
      wrap.style.gridTemplateColumns = 'repeat(3, 24px)';
      wrap.style.gridTemplateRows = 'repeat(2, 24px)';
      wrap.style.gap = '2px';
      wrap.style.transition = 'transform 0.25s ease';
      wrap.innerHTML = `
        <span class="tut-pointer-cue">${curStep.targetLabel || 'ROTATE'}</span>
        <div class="tut-tet-block active-piece"></div>
        <div class="tut-tet-block active-piece"></div>
        <div class="tut-tet-block active-piece"></div>
        <div></div>
        <div class="tut-tet-block active-piece"></div>
        <div></div>
      `;
      wrap.onclick = () => doMove();
      canvasEl.appendChild(wrap);
    } else if (curStep.boardType === 'tetris_clear') {
      const matrix = document.createElement('div');
      matrix.className = 'tut-tet-matrix';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 10; c++) {
          const block = document.createElement('div');
          block.className = 'tut-tet-block';
          block.dataset.row = r;
          block.dataset.col = c;
          if (r === 3 && c < 9) {
            block.classList.add('filled');
          } else if (r === 3 && c === 9) {
            block.classList.add('ghost', 'tut-target-pulse');
            block.innerHTML = `<span class="tut-pointer-cue">${curStep.targetLabel || 'DROP'}</span>`;
          }
          matrix.appendChild(block);
        }
      }
      matrix.onclick = () => doMove();
      canvasEl.appendChild(matrix);
    } else if (curStep.boardType === 'scratchpad') {
      const demo = document.createElement('div');
      demo.style.display = 'flex';
      demo.style.gap = '1rem';
      demo.style.width = '100%';
      demo.innerHTML = `
        <div style="flex:1; background:var(--color-bg-surface); border:1px solid var(--color-border); border-radius:4px; padding:0.75rem; font-family:var(--font-mono); font-size:0.8rem; color:var(--color-text-main);">
          <div style="color:var(--color-text-muted); font-size:0.7rem; margin-bottom:4px;">RAW MARKDOWN INPUT:</div>
          <code># Systems Architecture<br>**Status:** 100% Offline</code>
        </div>
        <div class="tut-sp-preview" style="flex:1; background:var(--color-bg-hover); border:1px solid var(--color-border-strong); border-radius:4px; padding:0.75rem;">
          <span style="color:var(--color-text-muted); font-size:0.75rem; font-style:italic;">Live Preview Updates Here...</span>
        </div>
      `;
      canvasEl.appendChild(demo);
    } else if (curStep.boardType === 'aistudio') {
      const demo = document.createElement('div');
      demo.style.width = '100%';
      demo.style.maxWidth = '480px';
      demo.style.background = '#0e1117';
      demo.style.border = '1px solid var(--color-border-strong)';
      demo.style.borderRadius = '4px';
      demo.style.padding = '1rem';
      demo.style.fontFamily = 'var(--font-mono)';
      demo.style.fontSize = '0.8rem';
      demo.innerHTML = `
        <div style="display:flex; justify-content:space-between; color:var(--color-accent); font-size:0.7rem; margin-bottom:0.5rem; border-bottom:1px solid var(--color-border); padding-bottom:4px;">
          <span>DAEMON: HTTP://LOCALHOST:11434</span>
          <span>STATUS: READY</span>
        </div>
        <div class="tut-ai-stream" style="white-space:pre-wrap; line-height:1.5; color:var(--color-text-main); min-height:80px;">
          > Click "STREAM PROMPT" to test local LLM inference...
        </div>
      `;
      canvasEl.appendChild(demo);
    }

    // Bind Button Handlers
    const actionBtn = document.getElementById('tut-action-move');
    if (actionBtn) actionBtn.onclick = () => doMove();

    const resetBtn = document.getElementById('tut-reset-step');
    if (resetBtn) {
      resetBtn.onclick = () => {
        window.audioController.playSfx(0);
        this.renderInteractiveTutorial(moduleId, stepIndex);
      };
    }

    const prevBtn = document.getElementById('tut-prev-step');
    if (prevBtn) {
      prevBtn.onclick = () => {
        window.audioController.playSfx(0);
        this.renderInteractiveTutorial(moduleId, stepIndex - 1);
      };
    }

    const nextBtn = document.getElementById('tut-next-step');
    if (nextBtn) {
      nextBtn.onclick = () => {
        window.audioController.playSfx(0);
        this.renderInteractiveTutorial(moduleId, stepIndex + 1);
      };
    }

    document.querySelectorAll('.tut-step-dot').forEach(dot => {
      dot.onclick = () => {
        const targetStep = parseInt(dot.getAttribute('data-step'), 10);
        if (!isNaN(targetStep)) {
          window.audioController.playSfx(0);
          this.renderInteractiveTutorial(moduleId, targetStep);
        }
      };
    });
  }

  getModulePreviewHtml(moduleId) {
    switch (moduleId) {
      case 'sudoku': {
        const grid = [
          [5, 3, '', '', 7, '', '', '', ''],
          [6, '', '', 1, 9, 5, '', '', ''],
          ['', 9, 8, '', '', '', '', 6, ''],
          [8, '', '', '', 6, '', '', '', 3],
          [4, '', '', 8, '', 3, '', '', 1],
          [7, '', '', '', 2, '', '', '', 6],
          ['', 6, '', '', '', '', 2, 8, ''],
          ['', '', '', 4, 1, 9, '', '', 5],
          ['', '', '', '', 8, '', '', 7, 9]
        ];
        let cellsHtml = '';
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const val = grid[r][c];
            let cls = 'mini-sudoku-cell';
            if (c === 2 || c === 5) cls += ' div-r';
            if (r === 2 || r === 5) cls += ' div-b';
            if (r === 4 && c === 4) cls += ' s-active';
            cellsHtml += `<div class="${cls}">${val}</div>`;
          }
        }
        return `<div class="mini-sudoku-board">${cellsHtml}</div>`;
      }

      case 'wordle': {
        return `
          <div class="mini-wordle-board">
            <div class="mini-wordle-row">
              <div class="mini-wordle-tile w-correct">S</div>
              <div class="mini-wordle-tile w-absent">L</div>
              <div class="mini-wordle-tile w-present">A</div>
              <div class="mini-wordle-tile w-absent">T</div>
              <div class="mini-wordle-tile w-correct">E</div>
            </div>
            <div class="mini-wordle-row">
              <div class="mini-wordle-tile w-correct">S</div>
              <div class="mini-wordle-tile w-correct">H</div>
              <div class="mini-wordle-tile w-correct">A</div>
              <div class="mini-wordle-tile w-correct">R</div>
              <div class="mini-wordle-tile w-correct">E</div>
            </div>
            <div class="mini-wordle-row">
              <div class="mini-wordle-tile w-empty"></div>
              <div class="mini-wordle-tile w-empty"></div>
              <div class="mini-wordle-tile w-empty"></div>
              <div class="mini-wordle-tile w-empty"></div>
              <div class="mini-wordle-tile w-empty"></div>
            </div>
          </div>
        `.trim();
      }

      case 'g2048': {
        return `
          <div class="mini-2048-board">
            <div class="mini-2048-tile tile-2">2</div>
            <div class="mini-2048-tile tile-4">4</div>
            <div class="mini-2048-tile tile-8">8</div>
            <div class="mini-2048-tile tile-16">16</div>
            <div class="mini-2048-tile tile-empty"></div>
            <div class="mini-2048-tile tile-32">32</div>
            <div class="mini-2048-tile tile-64">64</div>
            <div class="mini-2048-tile tile-128">128</div>
            <div class="mini-2048-tile tile-empty"></div>
            <div class="mini-2048-tile tile-empty"></div>
            <div class="mini-2048-tile tile-4">4</div>
            <div class="mini-2048-tile tile-8">8</div>
            <div class="mini-2048-tile tile-empty"></div>
            <div class="mini-2048-tile tile-empty"></div>
            <div class="mini-2048-tile tile-2">2</div>
            <div class="mini-2048-tile tile-2048">2048</div>
          </div>
        `.trim();
      }

      case 'tetris': {
        const rows = [
          '..........',
          '..........',
          '....t.....',
          '...ttt....',
          '..........',
          '..........',
          '..ii......',
          '..iiooss..',
          'jjjloosstt',
          'jlllzooss.',
          'zzllzzooss'
        ];
        const pieceMap = {
          '.': 'tet-empty',
          'i': 'tet-i',
          'o': 'tet-o',
          't': 'tet-t',
          's': 'tet-s',
          'z': 'tet-z',
          'j': 'tet-j',
          'l': 'tet-l'
        };
        let cellsHtml = '';
        for (const row of rows) {
          for (let c = 0; c < 10; c++) {
            const ch = row[c] || '.';
            const cls = pieceMap[ch] || 'tet-empty';
            cellsHtml += `<div class="mini-tet-cell ${cls}"></div>`;
          }
        }
        return `<div class="mini-tetris-board">${cellsHtml}</div>`;
      }

      case 'minesweeper': {
        const cells = [
          ['ms-revealed', ''], ['ms-revealed ms-1', '1'], ['ms-unrevealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', ''],
          ['ms-revealed', ''], ['ms-revealed ms-1', '1'], ['ms-flag', '⚑'], ['ms-revealed ms-2', '2'], ['ms-revealed ms-1', '1'], ['ms-unrevealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', ''],
          ['ms-revealed ms-1', '1'], ['ms-revealed ms-2', '2'], ['ms-revealed ms-2', '2'], ['ms-flag', '⚑'], ['ms-revealed ms-1', '1'], ['ms-unrevealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', ''],
          ['ms-unrevealed', ''], ['ms-flag', '⚑'], ['ms-revealed ms-3', '3'], ['ms-revealed ms-2', '2'], ['ms-revealed ms-1', '1'], ['ms-unrevealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', ''],
          ['ms-unrevealed', ''], ['ms-revealed ms-2', '2'], ['ms-flag', '⚑'], ['ms-revealed ms-1', '1'], ['ms-revealed', ''], ['ms-revealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', ''],
          ['ms-unrevealed', ''], ['ms-revealed ms-1', '1'], ['ms-revealed ms-1', '1'], ['ms-revealed ms-1', '1'], ['ms-revealed', ''], ['ms-revealed', ''], ['ms-unrevealed', ''], ['ms-unrevealed', '']
        ];
        const cellsHtml = cells.map(([cls, txt]) => `<div class="mini-ms-cell ${cls}">${txt}</div>`).join('');
        return `<div class="mini-ms-board">${cellsHtml}</div>`;
      }

      case 'scratchpad': {
        return `
          <div class="mini-scratch-board">
            <div class="mini-scratch-pane">
              <div class="mini-scratch-h1"># ZENITH DOC</div>
              <div class="mini-scratch-line"><span class="mini-scratch-bullet">-</span> Offline OS</div>
              <div class="mini-scratch-line"><span class="mini-scratch-bullet">-</span> 10 Cartridges</div>
              <div class="mini-scratch-line"><span class="mini-scratch-code">wasm-opt -O3</span></div>
            </div>
            <div class="mini-scratch-pane">
              <div class="mini-scratch-h1" style="color:var(--color-text-main, #f8fafc)">ZENITH DOC</div>
              <div class="mini-scratch-line">&bull; Offline OS</div>
              <div class="mini-scratch-line">&bull; 10 Cartridges</div>
              <div class="mini-scratch-line"><span class="mini-scratch-code" style="background:#0f172a; border:1px solid #334155;">wasm-opt -O3</span></div>
            </div>
          </div>
        `.trim();
      }

      case 'solitaire': {
        return `
          <div class="mini-sol-board">
            <div class="mini-sol-top">
              <div class="mini-sol-slot mini-sol-foundation">A&spades;</div>
              <div class="mini-sol-slot mini-sol-foundation" style="border-color:#ef4444; color:#ef4444;">A&hearts;</div>
              <div class="mini-sol-slot"></div>
              <div class="mini-sol-slot mini-sol-card-back"></div>
            </div>
            <div class="mini-sol-tableau">
              <div class="mini-sol-col">
                <div class="mini-sol-card card-black">K&spades;</div>
                <div class="mini-sol-card cascade card-red">Q&hearts;</div>
                <div class="mini-sol-card cascade card-black">J&clubs;</div>
              </div>
              <div class="mini-sol-col">
                <div class="mini-sol-card-back"></div>
                <div class="mini-sol-card cascade card-red">10&diams;</div>
                <div class="mini-sol-card cascade card-black">9&spades;</div>
              </div>
              <div class="mini-sol-col">
                <div class="mini-sol-card-back"></div>
                <div class="mini-sol-card-back cascade"></div>
                <div class="mini-sol-card cascade card-red">7&hearts;</div>
              </div>
            </div>
          </div>
        `.trim();
      }

      case 'connect4': {
        const board = [
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 'r-win', 0, 0, 0, 0],
          [0, 0, 'y', 'r-win', 0, 0, 0],
          [0, 'r', 'y', 'y', 'r-win', 0, 0],
          ['y', 'r', 'y', 'r', 'y', 'r-win', 0]
        ];
        let slotsHtml = '';
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 7; c++) {
            const piece = board[r][c];
            let disc = '';
            if (piece === 'r') disc = '<div class="c4-red"></div>';
            else if (piece === 'y') disc = '<div class="c4-yellow"></div>';
            else if (piece === 'r-win') disc = '<div class="c4-red c4-win"></div>';
            slotsHtml += `<div class="mini-c4-slot">${disc}</div>`;
          }
        }
        return `<div class="mini-c4-board">${slotsHtml}</div>`;
      }

      case 'tictactoe': {
        return `
          <div class="mini-ttt-board">
            <div class="mini-ttt-cell"><span class="ttt-x">X</span></div>
            <div class="mini-ttt-cell"><span class="ttt-o">O</span></div>
            <div class="mini-ttt-cell"><span class="ttt-o">O</span></div>
            <div class="mini-ttt-cell"><span class="ttt-o">O</span></div>
            <div class="mini-ttt-cell"><span class="ttt-x">X</span></div>
            <div class="mini-ttt-cell"></div>
            <div class="mini-ttt-cell"></div>
            <div class="mini-ttt-cell"></div>
            <div class="mini-ttt-cell"><span class="ttt-x">X</span></div>
            <div class="mini-ttt-strike"></div>
          </div>
        `.trim();
      }

      case 'aistudio': {
        return `
          <div class="mini-ai-board">
            <div>
              <div class="mini-ai-prompt">&gt; ollama run llama3</div>
              <div class="mini-ai-response">Model loaded into VRAM. System ready. Generating inference stream...</div>
            </div>
            <div class="mini-ai-prompt" style="margin-top:auto;">
              <span>&gt; prompt:</span>
              <span class="mini-ai-cursor"></span>
            </div>
          </div>
        `.trim();
      }

      default:
        return '';
    }
  }

  renderIndex() {
    const gridEl = document.getElementById('index-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const filtered = MODULES.filter(mod => {
      if (this.currentFilter !== 'all' && mod.group !== this.currentFilter) {
        return false;
      }
      if (this.searchQuery) {
        const text = `${mod.title} ${mod.desc} ${mod.cat} ${mod.key}`.toLowerCase();
        return text.includes(this.searchQuery);
      }
      return true;
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: var(--color-text-muted); font-family: var(--font-mono); font-size: 0.85rem;">
          NO MODULES MATCH SEARCH QUERY "${this.searchQuery.toUpperCase()}". PRESS ESC TO RESET FILTERS.
        </div>
      `;
      return;
    }

    filtered.forEach(mod => {
      const card = document.createElement('div');
      card.className = 'cartridge-card';
      card.tabIndex = 0;
      card.setAttribute('data-id', mod.id);
      card.setAttribute('data-key', mod.key);

      let scoreLabel = '';
      if (['sudoku', 'wordle', 'g2048', 'tetris', 'minesweeper', 'solitaire'].includes(mod.id)) {
        const hs = window.storageManager.getHighScore(mod.id);
        scoreLabel = `<span class="cartridge-score card-score">BEST: <strong>${hs}</strong></span>`;
      } else if (mod.id === 'connect4') {
        const wins = window.storageManager.get('c4_wins_p1', 0);
        scoreLabel = `<span class="cartridge-score card-score">WINS: <strong>${wins}</strong></span>`;
      } else if (mod.id === 'tictactoe') {
        const wins = window.storageManager.get('ttt_wins_x', 0);
        scoreLabel = `<span class="cartridge-score card-score">WINS: <strong>${wins}</strong></span>`;
      } else if (mod.id === 'aistudio') {
        scoreLabel = `<span class="cartridge-score card-score">OLLAMA READY</span>`;
      } else {
        scoreLabel = `<span class="cartridge-score card-score">LOCAL STUDIO</span>`;
      }

      card.innerHTML = `
        <div class="cartridge-top-grooves">
          <div class="cartridge-groove"></div>
          <div class="cartridge-groove"></div>
          <div class="cartridge-groove"></div>
        </div>

        <div class="cartridge-sticker">
          <div class="cartridge-sticker-header">
            <h3 class="cartridge-sticker-title">${mod.title}</h3>
            <span class="cartridge-sticker-badge">ZENITH-${mod.num}</span>
          </div>

          <div class="cartridge-preview-window">
            ${this.getModulePreviewHtml(mod.id)}
          </div>

          <div class="cartridge-sticker-footer">
            <span class="cartridge-cat">${mod.cat}</span>
            ${scoreLabel}
          </div>
        </div>

        <div class="cartridge-actions-bar">
          <button class="cart-btn-tut" data-tut="${mod.id}" title="Read tutorial and strategy guide">[?] GUIDE</button>
          <button class="cart-btn-insert" data-launch="${mod.id}" title="Insert cartridge and play">INSERT [${mod.key}] &rarr;</button>
        </div>
      `;

      const tutBtn = card.querySelector('.cart-btn-tut');
      if (tutBtn) {
        tutBtn.onclick = (e) => {
          e.stopPropagation();
          this.openTutorial(mod.id);
        };
      }

      const launch = () => {
        window.audioController.playSfx(0);
        this.switchView('stage', mod.id);
      };

      const insertBtn = card.querySelector('.cart-btn-insert');
      if (insertBtn) {
        insertBtn.onclick = (e) => {
          e.stopPropagation();
          launch();
        };
      }

      card.onclick = launch;
      card.onkeydown = (e) => {
        if (e.target !== card && e.target !== insertBtn) {
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          launch();
        }
      };

      gridEl.appendChild(card);
    });
  }

  removeStageOverlay() {
    if (this._stageOverlayKeyHandler) {
      window.removeEventListener('keydown', this._stageOverlayKeyHandler, true);
      this._stageOverlayKeyHandler = null;
    }
    const mountEl = document.getElementById('stage-mount');
    if (mountEl) {
      const existing = mountEl.querySelectorAll('.stage-overlay');
      existing.forEach(el => el.remove());
    }
  }

  showStageOverlay(title, subtitle, stats = [], onRestart, options = {}) {
    const mountEl = document.getElementById('stage-mount');
    if (!mountEl) return null;

    // Remove any previous overlay and listeners
    this.removeStageOverlay();

    // Trigger chiptune audio SFX: play SFX 8 (victory) or SFX 7 (game over) based on title/options
    let sfxId = 8;
    if (options && (options.sfx === false || options.sfx === null)) {
      sfxId = null;
    } else if (options && options.sfx !== undefined) {
      sfxId = options.sfx;
    } else if (options && (options.isGameOver || options.defeat || options.isWin === false)) {
      sfxId = 7;
    } else if (options && (options.isWin || options.victory)) {
      sfxId = 8;
    } else {
      const t = String(title || '').toUpperCase();
      if (t.includes('OVER') || t.includes('DEFEAT') || t.includes('LOST') || t.includes('BUST') || t.includes('DETONAT') || t.includes('FAIL')) {
        sfxId = 7;
      } else {
        sfxId = 8;
      }
    }
    if (sfxId !== null && window.audioController && typeof window.audioController.playSfx === 'function') {
      window.audioController.playSfx(sfxId);
    }

    const ov = document.createElement('div');
    ov.className = 'stage-overlay';

    // Arcade status header tag
    const defaultTag = sfxId === 7
      ? '★ GAME OVER ★'
      : (/win|victor|solved|clear/i.test(title || '') ? '★ VICTORY ★' : '★ MATCH FINISHED ★');
    const tag = (options && (options.statusTag || options.tag)) || defaultTag;

    // Render stats summary chips grid
    let statsHtml = '';
    if (Array.isArray(stats) && stats.length > 0) {
      const chips = stats.map(s => {
        let lbl = '';
        let val = '';
        if (s && typeof s === 'object') {
          lbl = s.label || '';
          val = s.val !== undefined ? s.val : (s.value !== undefined ? s.value : '');
        } else {
          val = String(s);
        }
        return `
          <div class="overlay-stat-chip">
            ${lbl ? `<span class="stat-label">${lbl}</span>` : ''}
            <span class="stat-val">${val}</span>
          </div>
        `;
      }).join('');
      statsHtml = `<div class="overlay-stats">${chips}</div>`;
    }

    // Render action buttons
    let actionsHtml = '';
    if (onRestart) {
      actionsHtml += `<button class="stage-btn btn-primary" id="stage-ov-btn-restart">[R] PLAY AGAIN</button>`;
    }
    if (options && options.allowReview) {
      actionsHtml += `<button class="stage-btn" id="stage-ov-btn-review">[EYE] REVIEW BOARD</button>`;
    }
    actionsHtml += `<button class="stage-btn" id="stage-ov-btn-index">[ESC] RETURN TO HUB</button>`;

    // Render floating review minibar if allowReview is true
    const minibarHtml = (options && options.allowReview) ? `
      <div class="overlay-minibar">
        <span>★ MATCH OVER — REVIEWING BOARD ★</span>
        <button class="stage-btn" id="stage-ov-btn-reopen">RE-OPEN OVERLAY</button>
        ${onRestart ? '<button class="stage-btn btn-primary" id="stage-ov-btn-restart-mini">[R] PLAY AGAIN</button>' : ''}
      </div>
    ` : '';

    ov.innerHTML = `
      <div class="retro-box">
        <div class="overlay-arcade-tag">${tag}</div>
        <h2 class="overlay-title">${title || ''}</h2>
        ${subtitle ? `<p class="overlay-subtitle">${subtitle}</p>` : ''}
        ${statsHtml}
        <div class="overlay-actions">
          ${actionsHtml}
        </div>
      </div>
      ${minibarHtml}
    `;

    mountEl.appendChild(ov);

    let isReviewing = false;
    const setReviewMode = (reviewing) => {
      isReviewing = reviewing;
      if (reviewing) {
        ov.classList.add('banner-mode');
      } else {
        ov.classList.remove('banner-mode');
      }
    };

    // Attach click handlers
    const restartBtn = ov.querySelector('#stage-ov-btn-restart');
    if (restartBtn) {
      restartBtn.onclick = () => {
        this.removeStageOverlay();
        if (typeof onRestart === 'function') onRestart();
      };
    }

    const reviewBtn = ov.querySelector('#stage-ov-btn-review');
    if (reviewBtn) {
      reviewBtn.onclick = () => {
        setReviewMode(true);
      };
    }

    const indexBtn = ov.querySelector('#stage-ov-btn-index');
    if (indexBtn) {
      indexBtn.onclick = () => {
        this.removeStageOverlay();
        this.switchView('index');
      };
    }

    const reopenBtn = ov.querySelector('#stage-ov-btn-reopen');
    if (reopenBtn) {
      reopenBtn.onclick = () => {
        setReviewMode(false);
      };
    }

    const restartMiniBtn = ov.querySelector('#stage-ov-btn-restart-mini');
    if (restartMiniBtn) {
      restartMiniBtn.onclick = () => {
        this.removeStageOverlay();
        if (typeof onRestart === 'function') onRestart();
      };
    }

    // Keyboard handling while overlay is active
    this._stageOverlayKeyHandler = (e) => {
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey && typeof onRestart === 'function') {
        e.preventDefault();
        e.stopPropagation();
        this.removeStageOverlay();
        onRestart();
      } else if (e.key === 'Escape') {
        if (this.tutDialog && this.tutDialog.open) return;
        e.preventDefault();
        e.stopPropagation();
        if (isReviewing) {
          setReviewMode(false);
        } else {
          this.removeStageOverlay();
          this.switchView('index');
        }
      }
    };

    window.addEventListener('keydown', this._stageOverlayKeyHandler, true);

    return ov;
  }

  switchView(viewName, moduleId = null) {
    this.removeStageOverlay();
    if (this.activeModuleInstance && typeof this.activeModuleInstance.destroy === 'function') {
      this.activeModuleInstance.destroy();
      this.activeModuleInstance = null;
    }

    const indexView = document.getElementById('index-view');
    const stageView = document.getElementById('stage-view');
    const mountEl = document.getElementById('stage-mount');
    const titleEl = document.getElementById('stage-title');
    const statsEl = document.getElementById('stage-stats');
    const actionsEl = document.getElementById('stage-actions');
    const kbdEl = document.getElementById('stage-kbd-hint');
    const chassis = document.getElementById('handheld-chassis');

    if (chassis) {
      if (viewName === 'stage' && (moduleId === 'solitaire' || moduleId === 'minesweeper' || moduleId === 'scratchpad' || moduleId === 'aistudio')) {
        chassis.classList.add('layout-wide');
      } else {
        chassis.classList.remove('layout-wide');
      }
    }

    if (viewName === 'index') {
      this.currentView = 'index';
      this.activeModuleId = null;
      if (indexView) indexView.style.display = 'flex';
      if (stageView) stageView.style.display = 'none';
      this.renderIndex();
    } else {
      this.currentView = 'stage';
      this.activeModuleId = moduleId;
      if (indexView) indexView.style.display = 'none';
      if (stageView) stageView.style.display = 'flex';

      if (mountEl) mountEl.innerHTML = '';
      if (statsEl) statsEl.innerHTML = '';
      if (actionsEl) actionsEl.innerHTML = '';
      if (kbdEl) kbdEl.innerHTML = '';

      const def = MODULES.find(m => m.id === moduleId);
      if (titleEl) titleEl.textContent = def ? def.title : 'MODULE';

      if (moduleId === 'g2048') this.activeModuleInstance = new Mod2048(this);
      else if (moduleId === 'sudoku') this.activeModuleInstance = new ModSudoku(this);
      else if (moduleId === 'wordle') this.activeModuleInstance = new ModWordle(this);
      else if (moduleId === 'tetris') this.activeModuleInstance = new ModTetris(this);
      else if (moduleId === 'minesweeper') this.activeModuleInstance = new ModMinesweeper(this);
      else if (moduleId === 'scratchpad') this.activeModuleInstance = new ModScratchpad(this);
      else if (moduleId === 'solitaire') this.activeModuleInstance = new ModSolitaire(this);
      else if (moduleId === 'connect4') this.activeModuleInstance = new ModConnect4(this);
      else if (moduleId === 'tictactoe') this.activeModuleInstance = new ModTicTacToe(this);
      else if (moduleId === 'aistudio') this.activeModuleInstance = new ModAIStudio(this);

      if (this.activeModuleInstance) {
        this.activeModuleInstance.mount(mountEl, statsEl, actionsEl, kbdEl);
      }
    }
  }
}

// =========================================================================
// MODULE: 2048 (64-bit Bitboard WASM Engine)
// =========================================================================
class Mod2048 {
  constructor(app) {
    this.app = app;
    this.bestScore = window.storageManager.getHighScore('g2048');
    this.cells = [];
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">SCORE</span><span class="stat-v" id="g2048-score">0</span></div>
      <div class="stat-chip"><span class="stat-k">MOVES</span><span class="stat-v" id="g2048-moves">0</span></div>
      <div class="stat-chip"><span class="stat-k">BEST</span><span class="stat-v">${this.bestScore}</span></div>
    `;

    actionsEl.innerHTML = `
      <button class="stage-btn" id="g2048-btn-tut">[?] RULES</button>
      <button class="btn-ctrl" id="g2048-btn-undo">[U] UNDO</button>
      <button class="btn-ctrl btn-primary" id="g2048-btn-restart">[R] RESTART</button>
    `;
    document.getElementById('g2048-btn-tut').onclick = () => this.app.openTutorial('g2048');
    document.getElementById('g2048-btn-undo').onclick = () => this.undo();
    document.getElementById('g2048-btn-restart').onclick = () => this.restart();

    kbdEl.innerHTML = `
      <span>CONTROLS: <span class="kbd-shortcut">&larr; &uarr; &rarr; &darr;</span> OR <span class="kbd-shortcut">WASD</span> | <span class="kbd-shortcut">U</span> UNDO | <span class="kbd-shortcut">R</span> RESTART</span>
    `;

    const board = document.createElement('div');
    board.className = 'g2048-board';
    this.cells = [];

    // Pre-create 16 DOM cells ONCE
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'g2048-cell';
      cell.setAttribute('data-val', '0');
      board.appendChild(cell);
      this.cells.push(cell);
    }
    mountEl.appendChild(board);

    this.keyHandler = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
        let dir = -1;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') dir = 0;
        else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') dir = 1;
        else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') dir = 2;
        else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') dir = 3;

        if (dir !== -1) {
          const moved = window.wasmBridge.call('g2048_move', dir);
          if (this.app && typeof this.app.updateTelemetry === 'function') {
            this.app.updateTelemetry();
          }
          if (moved) {
            if (window.audioController && typeof window.audioController.playSfx === 'function') {
              window.audioController.playSfx(1);
            }
            this.sync();
          }
        }
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        this.undo();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.restart();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.restart();
  }

  undo() {
    const undone = window.wasmBridge.call('g2048_undo');
    if (this.app && typeof this.app.updateTelemetry === 'function') {
      this.app.updateTelemetry();
    }
    if (undone) {
      if (this.app && typeof this.app.removeStageOverlay === 'function') {
        this.app.removeStageOverlay();
      }
      if (window.audioController && typeof window.audioController.playSfx === 'function') {
        window.audioController.playSfx(2);
      }
      this.sync();
    }
  }

  restart() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    const seed = BigInt(Math.floor(Math.random() * 1000000000));
    window.wasmBridge.call('g2048_reset', seed);
    if (this.app && typeof this.app.updateTelemetry === 'function') {
      this.app.updateTelemetry();
    }
    if (window.audioController && typeof window.audioController.playSfx === 'function') {
      window.audioController.playSfx(0);
    }
    this.sync();
  }

  resetGame() {
    this.restart();
  }

  sync() {
    const score = window.wasmBridge.call('g2048_get_score');
    const moves = window.wasmBridge.call('g2048_get_moves');
    const isOver = window.wasmBridge.call('g2048_is_game_over');
    const isWon = window.wasmBridge.call('g2048_is_won');

    const sEl = document.getElementById('g2048-score');
    const mEl = document.getElementById('g2048-moves');
    if (sEl) sEl.textContent = score;
    if (mEl) mEl.textContent = moves;

    if (window.storageManager && typeof window.storageManager.setHighScore === 'function') {
      window.storageManager.setHighScore('g2048', score);
    }

    // Zero-copy read of 16 u32 values from Rust linear memory
    const ptr = window.wasmBridge.call('g2048_get_board_ptr');
    const view = window.wasmBridge.getUint32View(ptr, 16);

    for (let i = 0; i < 16; i++) {
      const val = view[i];
      const cell = this.cells[i];
      cell.setAttribute('data-val', val);
      cell.textContent = val > 0 ? val : '';
    }

    if (isOver) {
      const best = (window.storageManager && typeof window.storageManager.getHighScore === 'function')
        ? window.storageManager.getHighScore('g2048')
        : this.bestScore;
      if (this.app && typeof this.app.showStageOverlay === 'function') {
        this.app.showStageOverlay(
          'GAME OVER',
          'No more moves available',
          [
            { label: 'SCORE', val: score },
            { label: 'BEST', val: best }
          ],
          () => this.resetGame(),
          { sfx: 7, allowReview: true }
        );
      } else {
        if (window.audioController && typeof window.audioController.playSfx === 'function') {
          window.audioController.playSfx(7);
        }
        this.showOverlay('GAME OVER', `Final Score: ${score}`, () => this.resetGame());
      }
    } else if (isWon) {
      if (window.audioController && typeof window.audioController.playSfx === 'function') {
        window.audioController.playSfx(8);
      }
    }
  }

  showOverlay(title, subtitle, onAction) {
    const mountEl = document.getElementById('stage-mount');
    if (!mountEl) return;
    const existing = mountEl.querySelector('.stage-overlay');
    if (existing) existing.remove();

    const ov = document.createElement('div');
    ov.className = 'stage-overlay';
    ov.innerHTML = `
      <div class="overlay-box">
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <button class="btn-ctrl btn-primary" id="g2048-ov-btn">[R] PLAY AGAIN</button>
      </div>
    `;
    mountEl.appendChild(ov);
    ov.querySelector('#g2048-ov-btn').onclick = () => {
      ov.remove();
      onAction();
    };
  }

  destroy() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
  }
}

// =========================================================================
// MODULE: SUDOKU (Bitmask MRV Solver in Rust)
// =========================================================================
class ModSudoku {
  constructor(app) {
    this.app = app;
    this.selected = { r: 0, c: 0 };
    this.diff = 0; // 0: Easy, 1: Medium, 2: Hard
    this.notesMode = false;
    this.unlimitedErrors = false;
    this.timer = 0;
    this.timerInt = null;
    this.cells = [];
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">MISTAKES</span><span class="stat-v" id="sdk-mistakes">${this.unlimitedErrors ? '0/∞' : '0/3'}</span></div>
      <div class="stat-chip"><span class="stat-k">TIME</span><span class="stat-v" id="sdk-time">00:00</span></div>
    `;

    actionsEl.innerHTML = `
      <button class="stage-btn" id="sdk-btn-tut">[?] RULES</button>
      <select id="sdk-diff-select" class="btn-select">
        <option value="0" selected>EASY</option>
        <option value="1">MEDIUM</option>
        <option value="2">HARD</option>
      </select>
      <button class="btn-ctrl${this.unlimitedErrors ? ' active' : ''}" id="sdk-btn-errors">[L] ERRORS: ${this.unlimitedErrors ? '∞' : '3'}</button>
      <button class="btn-ctrl" id="sdk-btn-notes">[N] NOTES: OFF</button>
      <button class="btn-ctrl" id="sdk-btn-hint">[H] HINT</button>
      <button class="btn-ctrl btn-primary" id="sdk-btn-new">[R] NEW</button>
    `;

    kbdEl.innerHTML = `
      <span>CONTROLS: <span class="kbd-shortcut">&larr; &uarr; &rarr; &darr;</span> NAVIGATE | <span class="kbd-shortcut">1-9</span> ENTER | <span class="kbd-shortcut">BACKSPACE</span> CLEAR | <span class="kbd-shortcut">L</span> ERRORS | <span class="kbd-shortcut">N</span> NOTES | <span class="kbd-shortcut">H</span> HINT</span>
    `;

    const container = document.createElement('div');
    container.className = 'sudoku-container';

    const grid = document.createElement('div');
    grid.className = 'sudoku-grid';
    this.cells = [];

    // Pre-create 81 DOM cells ONCE
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('button');
        cell.className = 'sudoku-cell';
        if (c === 2 || c === 5) cell.classList.add('border-r');
        if (r === 2 || r === 5) cell.classList.add('border-b');
        cell.onclick = () => {
          this.selected = { r, c };
          this.syncHighlight();
        };
        grid.appendChild(cell);
        this.cells.push(cell);
      }
    }

    const keypad = document.createElement('div');
    keypad.className = 'sudoku-keypad';
    keypad.innerHTML = `
      <div class="keypad-row">
        ${[1,2,3].map(n => `<button class="keypad-digit-btn" data-n="${n}">${n}</button>`).join('')}
      </div>
      <div class="keypad-row">
        ${[4,5,6].map(n => `<button class="keypad-digit-btn" data-n="${n}">${n}</button>`).join('')}
      </div>
      <div class="keypad-row">
        ${[7,8,9].map(n => `<button class="keypad-digit-btn" data-n="${n}">${n}</button>`).join('')}
      </div>
      <button class="btn-ctrl" id="sdk-keypad-erase" style="width:100%; height:34px;">CLEAR</button>
    `;

    container.appendChild(grid);
    container.appendChild(keypad);
    mountEl.appendChild(container);

    document.getElementById('sdk-diff-select').onchange = (e) => {
      this.diff = parseInt(e.target.value, 10);
      this.newGame();
    };

    const errorsBtn = document.getElementById('sdk-btn-errors');
    if (errorsBtn) {
      errorsBtn.onclick = () => {
        this.unlimitedErrors = !this.unlimitedErrors;
        errorsBtn.textContent = `[L] ERRORS: ${this.unlimitedErrors ? '∞' : '3'}`;
        errorsBtn.classList.toggle('active', this.unlimitedErrors);
        window.wasmBridge.call('sudoku_set_unlimited_mistakes', this.unlimitedErrors ? 1 : 0);
        this.syncBoard();
      };
    }

    const notesBtn = document.getElementById('sdk-btn-notes');
    notesBtn.onclick = () => {
      this.notesMode = !this.notesMode;
      notesBtn.textContent = `[N] NOTES: ${this.notesMode ? 'ON' : 'OFF'}`;
      notesBtn.classList.toggle('active', this.notesMode);
    };

    document.getElementById('sdk-btn-tut').onclick = () => this.app.openTutorial('sudoku');
    document.getElementById('sdk-btn-hint').onclick = () => this.hint();
    document.getElementById('sdk-btn-new').onclick = () => this.newGame();
    document.getElementById('sdk-keypad-erase').onclick = () => this.inputNumber(0);

    keypad.querySelectorAll('.keypad-digit-btn').forEach(b => {
      b.onclick = () => {
        const n = parseInt(b.getAttribute('data-n'), 10);
        this.inputNumber(n);
      };
    });

    this.keyHandler = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        let { r, c } = this.selected;
        if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
        else if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
        else if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
        else if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
        this.selected = { r, c };
        this.syncHighlight();
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        this.inputNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.inputNumber(0);
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        const b = document.getElementById('sdk-btn-errors');
        if (b) b.click();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        notesBtn.click();
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        this.hint();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.newGame();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.newGame();
  }

  newGame() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    const seed = BigInt(Math.floor(Math.random() * 1000000000));
    window.wasmBridge.call('sudoku_generate', this.diff, seed);
    window.wasmBridge.call('sudoku_set_unlimited_mistakes', this.unlimitedErrors ? 1 : 0);
    this.app.updateTelemetry();
    this.selected = { r: 0, c: 0 };
    this.startTimer();
    window.audioController.playSfx(0);
    this.syncBoard();
    this.syncHighlight();
  }

  startTimer() {
    if (this.timerInt) clearInterval(this.timerInt);
    this.timer = 0;
    this.timerInt = setInterval(() => {
      this.timer++;
      const m = Math.floor(this.timer / 60);
      const s = this.timer % 60;
      const el = document.getElementById('sdk-time');
      if (el) el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, 1000);
  }

  inputNumber(n) {
    const { r, c } = this.selected;
    if (this.notesMode && n > 0) {
      window.wasmBridge.call('sudoku_toggle_note', r, c, n);
      window.audioController.playSfx(1);
    } else {
      const ok = window.wasmBridge.call('sudoku_enter', r, c, n);
      if (ok) {
        if (n > 0) window.audioController.playSfx(4);
      } else if (n > 0) {
        window.audioController.playSfx(6);
        const cellIdx = r * 9 + c;
        const cellEl = this.cells[cellIdx];
        if (cellEl) {
          if (cellEl._errTimeout) clearTimeout(cellEl._errTimeout);
          cellEl.classList.remove('cell-error');
          void cellEl.offsetWidth;
          cellEl.classList.add('cell-error');
          cellEl._errTimeout = setTimeout(() => {
            cellEl.classList.remove('cell-error');
            cellEl._errTimeout = null;
          }, 400);
        }
      }
    }
    this.app.updateTelemetry();
    this.syncBoard();
    this.syncHighlight();

    const isWon = window.wasmBridge.call('sudoku_is_won');
    const isOver = window.wasmBridge.call('sudoku_is_game_over');

    if (isWon) {
      if (this.timerInt) clearInterval(this.timerInt);
      const timeEl = document.getElementById('sdk-time');
      const timeStr = timeEl ? timeEl.textContent : '00:00';
      const mistakes = window.wasmBridge.call('sudoku_get_mistakes');
      const diffNames = ['EASY', 'MEDIUM', 'HARD'];
      const diffStr = diffNames[this.diff] || 'EASY';

      if (this.app && typeof this.app.showStageOverlay === 'function') {
        this.app.showStageOverlay(
          'SUDOKU SOLVED',
          'Grid successfully completed!',
          [
            { label: 'DIFFICULTY', val: diffStr },
            { label: 'TIME', val: timeStr },
            { label: 'MISTAKES', val: this.unlimitedErrors ? `${mistakes} (UNLIMITED)` : `${mistakes}/3` }
          ],
          () => this.newGame(),
          { allowReview: true }
        );
      } else {
        this.showOverlay('SOLVED', `Time: ${timeStr}`, () => this.newGame());
      }
    } else if (isOver) {
      if (this.timerInt) clearInterval(this.timerInt);
      const timeEl = document.getElementById('sdk-time');
      const timeStr = timeEl ? timeEl.textContent : '00:00';
      const diffNames = ['EASY', 'MEDIUM', 'HARD'];
      const diffStr = diffNames[this.diff] || 'EASY';

      if (this.app && typeof this.app.showStageOverlay === 'function') {
        this.app.showStageOverlay(
          'SUDOKU FAILED',
          'Mistake limit reached (3/3).',
          [
            { label: 'DIFFICULTY', val: diffStr },
            { label: 'TIME', val: timeStr },
            { label: 'MISTAKES', val: '3/3' }
          ],
          () => this.newGame(),
          { isGameOver: true, allowReview: true }
        );
      } else {
        this.showOverlay('GAME OVER', '3 Mistakes Made', () => this.newGame());
      }
    }
  }

  hint() {
    const res = window.wasmBridge.call('sudoku_hint');
    this.app.updateTelemetry();
    if (res !== 0xFFFF_FFFF) {
      const r = (res >> 16) & 0xFF;
      const c = (res >> 8) & 0xFF;
      this.selected = { r, c };
      window.audioController.playSfx(4);
      this.syncBoard();
      this.syncHighlight();
    }
  }

  syncBoard() {
    const mistakes = window.wasmBridge.call('sudoku_get_mistakes');
    const mEl = document.getElementById('sdk-mistakes');
    if (mEl) mEl.textContent = this.unlimitedErrors ? `${mistakes}/∞` : `${mistakes}/3`;

    const bPtr = window.wasmBridge.call('sudoku_get_board_ptr');
    const iPtr = window.wasmBridge.call('sudoku_get_initial_ptr');
    const nPtr = window.wasmBridge.call('sudoku_get_notes_ptr');

    const board = window.wasmBridge.getUint8View(bPtr, 81);
    const initial = window.wasmBridge.getUint8View(iPtr, 81);
    const notes = window.wasmBridge.getUint16View(nPtr, 81);

    for (let i = 0; i < 81; i++) {
      const val = board[i];
      const isInit = initial[i] !== 0;
      const noteMask = notes[i];
      const cell = this.cells[i];

      cell.classList.toggle('cell-initial', isInit);

      if (val > 0) {
        cell.textContent = val;
      } else if (noteMask > 0) {
        cell.innerHTML = '';
        const nGrid = document.createElement('div');
        nGrid.className = 'sudoku-notes-grid';
        for (let n = 1; n <= 9; n++) {
          const sp = document.createElement('span');
          sp.textContent = (noteMask & (1 << n)) !== 0 ? n : '';
          nGrid.appendChild(sp);
        }
        cell.appendChild(nGrid);
      } else {
        cell.textContent = '';
      }
    }
  }

  syncHighlight() {
    const { r: selR, c: selC } = this.selected;
    const bPtr = window.wasmBridge.call('sudoku_get_board_ptr');
    const board = window.wasmBridge.getUint8View(bPtr, 81);
    const selVal = board[selR * 9 + selC];

    const selBoxR = Math.floor(selR / 3);
    const selBoxC = Math.floor(selC / 3);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const cell = this.cells[idx];
        const isSelected = r === selR && c === selC;
        const isSameNum = selVal > 0 && board[idx] === selVal;
        const isRelated = r === selR || c === selC || (Math.floor(r / 3) === selBoxR && Math.floor(c / 3) === selBoxC);

        cell.classList.toggle('cell-selected', isSelected);
        cell.classList.toggle('cell-match', isSameNum && !isSelected);
        cell.classList.toggle('cell-related', isRelated && !isSelected && !isSameNum);
      }
    }
  }

  showOverlay(title, subtitle, onAction) {
    const mountEl = document.getElementById('stage-mount');
    if (!mountEl) return;
    const existing = mountEl.querySelector('.stage-overlay');
    if (existing) existing.remove();

    const ov = document.createElement('div');
    ov.className = 'stage-overlay';
    ov.innerHTML = `
      <div class="overlay-box">
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <button class="btn-ctrl btn-primary" id="sdk-ov-btn">[R] PLAY AGAIN</button>
      </div>
    `;
    mountEl.appendChild(ov);
    ov.querySelector('#sdk-ov-btn').onclick = () => {
      ov.remove();
      onAction();
    };
  }

  destroy() {
    if (this.timerInt) clearInterval(this.timerInt);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
  }
}

// =========================================================================
// MODULE: WORDLE (Binary-Search Dictionary in Rust)
// =========================================================================
class ModWordle {
  constructor(app) {
    this.app = app;
    this.currentGuess = '';
    this.tiles = [];
    this.keys = {};
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">ATTEMPT</span><span class="stat-v" id="wd-attempt">1/6</span></div>
      <div class="stat-chip"><span class="stat-k">STREAK</span><span class="stat-v" id="wd-streak">${window.storageManager.getHighScore('wordle_streak')}</span></div>
    `;

    actionsEl.innerHTML = `
      <button class="stage-btn" id="wd-btn-tut">[?] RULES</button>
      <button class="btn-ctrl btn-primary" id="wd-btn-new">[R] NEW WORD</button>
    `;

    kbdEl.innerHTML = `
      <span>CONTROLS: TYPE 5 LETTERS | <span class="kbd-shortcut">ENTER</span> SUBMIT | <span class="kbd-shortcut">BACKSPACE</span> ERASE</span>
    `;

    const container = document.createElement('div');
    container.className = 'wordle-container';

    const grid = document.createElement('div');
    grid.className = 'wordle-grid';
    this.tiles = [];

    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.className = 'wordle-row';
      for (let c = 0; c < 5; c++) {
        const tile = document.createElement('div');
        tile.className = 'wordle-tile';
        row.appendChild(tile);
        this.tiles.push(tile);
      }
      grid.appendChild(row);
    }

    const kb = document.createElement('div');
    kb.className = 'wordle-keyboard';
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['ENTER','Z','X','C','V','B','N','M','DEL']
    ];
    this.keys = {};

    rows.forEach(r => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      r.forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'kb-btn';
        if (k === 'ENTER' || k === 'DEL') btn.classList.add('kb-btn-wide');
        btn.textContent = k;
        btn.onclick = () => {
          if (k === 'ENTER') this.submit();
          else if (k === 'DEL') this.backspace();
          else this.addLetter(k);
        };
        rowEl.appendChild(btn);
        this.keys[k] = btn;
      });
      kb.appendChild(rowEl);
    });

    container.appendChild(grid);
    container.appendChild(kb);
    mountEl.appendChild(container);

    document.getElementById('wd-btn-tut').onclick = () => this.app.openTutorial('wordle');
    document.getElementById('wd-btn-new').onclick = () => this.newGame();

    this.keyHandler = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this.backspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        this.addLetter(e.key.toUpperCase());
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.newGame();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.newGame();
  }

  newGame() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    const seed = BigInt(Math.floor(Math.random() * 1000000000));
    window.wasmBridge.call('wordle_reset', seed);
    this.app.updateTelemetry();
    this.currentGuess = '';
    window.audioController.playSfx(0);
    this.sync();
  }

  addLetter(char) {
    if (this.currentGuess.length < 5) {
      this.currentGuess += char;
      window.audioController.playSfx(1);
      this.sync();
    }
  }

  backspace() {
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      window.audioController.playSfx(0);
      this.sync();
    }
  }

  submit() {
    if (this.currentGuess.length !== 5) return;
    const bytes = this.currentGuess.split('').map(c => c.charCodeAt(0));
    const isValid = window.wasmBridge.call('wordle_is_valid', bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);

    if (!isValid) {
      window.audioController.playSfx(6);
      return;
    }

    window.wasmBridge.call('wordle_submit', bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
    this.app.updateTelemetry();
    this.currentGuess = '';
    this.sync();

    const state = window.wasmBridge.call('wordle_get_state');
    if (state === 1) {
      // Won
      const curStreak = window.storageManager.getHighScore('wordle_streak') + 1;
      window.storageManager.setHighScore('wordle_streak', curStreak);
      const strEl = document.getElementById('wd-streak');
      if (strEl) strEl.textContent = curStreak;
      if (this.app && typeof this.app.showStageOverlay === 'function') {
        const guessCount = window.wasmBridge.call('wordle_get_guess_count');
        this.app.showStageOverlay(
          'WORDLE SOLVED',
          'Splendid deduction!',
          [
            { label: 'ATTEMPTS', val: `${guessCount}/6` },
            { label: 'STREAK', val: curStreak }
          ],
          () => this.newGame(),
          { sfx: 8, allowReview: true }
        );
      } else {
        window.audioController.playSfx(8);
        this.showOverlay('SPLENDID', 'Word Solved!', () => this.newGame());
      }
    } else if (state === 2) {
      // Lost
      window.storageManager.setHighScore('wordle_streak', 0);
      let targetWord = '';
      for (let i = 0; i < 5; i++) {
        targetWord += String.fromCharCode(window.wasmBridge.call('wordle_get_target_char', i));
      }
      if (this.app && typeof this.app.showStageOverlay === 'function') {
        this.app.showStageOverlay(
          'WORDLE FAILED',
          `The target word was: ${targetWord}`,
          [
            { label: 'ANSWER', val: targetWord },
            { label: 'ATTEMPTS', val: '6/6' }
          ],
          () => this.newGame(),
          { sfx: 7, allowReview: true }
        );
      } else {
        window.audioController.playSfx(7);
        this.showOverlay('OUT OF TRIES', `Target Word: ${targetWord}`, () => this.newGame());
      }
    } else {
      window.audioController.playSfx(3);
    }
  }

  sync() {
    const guessCount = window.wasmBridge.call('wordle_get_guess_count');
    const aEl = document.getElementById('wd-attempt');
    if (aEl) aEl.textContent = `${Math.min(6, guessCount + 1)}/6`;

    const gPtr = window.wasmBridge.call('wordle_get_guesses_ptr');
    const ePtr = window.wasmBridge.call('wordle_get_evals_ptr');
    const kPtr = window.wasmBridge.call('wordle_get_key_states_ptr');

    const guesses = window.wasmBridge.getUint8View(gPtr, 30);
    const evals = window.wasmBridge.getUint8View(ePtr, 30);
    const keyStates = window.wasmBridge.getUint8View(kPtr, 26);

    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        const tile = this.tiles[idx];
        tile.className = 'wordle-tile';

        if (r < guessCount) {
          const charCode = guesses[idx];
          const st = evals[idx];
          tile.textContent = String.fromCharCode(charCode);
          if (st === 2) tile.classList.add('status-correct');
          else if (st === 1) tile.classList.add('status-present');
          else tile.classList.add('status-absent');
        } else if (r === guessCount) {
          const letter = this.currentGuess[c] || '';
          tile.textContent = letter;
          if (letter) tile.classList.add('active');
        } else {
          tile.textContent = '';
        }
      }
    }

    // Keyboard status
    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(65 + i);
      const btn = this.keys[char];
      if (btn) {
        btn.classList.remove('key-correct', 'key-present', 'key-absent');
        const st = keyStates[i];
        if (st === 3) btn.classList.add('key-correct');
        else if (st === 2) btn.classList.add('key-present');
        else if (st === 1) btn.classList.add('key-absent');
      }
    }
  }

  showOverlay(title, subtitle, onAction) {
    const mountEl = document.getElementById('stage-mount');
    if (!mountEl) return;
    const existing = mountEl.querySelector('.stage-overlay');
    if (existing) existing.remove();

    const ov = document.createElement('div');
    ov.className = 'stage-overlay';
    ov.innerHTML = `
      <div class="overlay-box">
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <button class="btn-ctrl btn-primary" id="wd-ov-btn">[R] PLAY AGAIN</button>
      </div>
    `;
    mountEl.appendChild(ov);
    ov.querySelector('#wd-ov-btn').onclick = () => {
      ov.remove();
      onAction();
    };
  }

  destroy() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }
}

// =========================================================================
// MODULE: TETRIS (SRS Super Rotation System in Rust)
// =========================================================================
class ModTetris {
  constructor(app) {
    this.app = app;
    this.canvas = null;
    this.ctx = null;
    this.holdCanvas = null;
    this.holdCtx = null;
    this.nextCanvas = null;
    this.nextCtx = null;
    this.loopInt = null;
    this.isPaused = false;
    this.bestScore = window.storageManager.getHighScore('tetris');
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">SCORE</span><span class="stat-v" id="tet-score">0</span></div>
      <div class="stat-chip"><span class="stat-k">LINES</span><span class="stat-v" id="tet-lines">0</span></div>
      <div class="stat-chip"><span class="stat-k">LEVEL</span><span class="stat-v" id="tet-level">1</span></div>
      <div class="stat-chip"><span class="stat-k">BEST</span><span class="stat-v">${this.bestScore}</span></div>
    `;

    actionsEl.innerHTML = `
      <button class="stage-btn" id="tet-btn-tut">[?] RULES</button>
      <button class="btn-ctrl" id="tet-btn-pause">[P] PAUSE</button>
      <button class="btn-ctrl btn-primary" id="tet-btn-restart">[R] RESTART</button>
    `;

    kbdEl.innerHTML = `
      <span>CONTROLS: <span class="kbd-shortcut">&larr; &rarr;</span> MOVE | <span class="kbd-shortcut">&uarr;</span> ROTATE CW | <span class="kbd-shortcut">Z</span> CCW | <span class="kbd-shortcut">&darr;</span> DROP | <span class="kbd-shortcut">SPACE</span> HARD DROP | <span class="kbd-shortcut">C</span> HOLD</span>
    `;

    const stage = document.createElement('div');
    stage.className = 'tetris-stage';

    stage.innerHTML = `
      <div class="tetris-side">
        <div class="tetris-box">
          <h4>HOLD (C)</h4>
          <canvas id="tet-hold-c" width="70" height="70"></canvas>
        </div>
      </div>
      <div class="tetris-canvas-wrapper">
        <canvas id="tet-main-c" width="220" height="440"></canvas>
      </div>
      <div class="tetris-side">
        <div class="tetris-box">
          <h4>NEXT</h4>
          <canvas id="tet-next-c" width="70" height="70"></canvas>
        </div>
      </div>
    `;

    mountEl.appendChild(stage);

    this.canvas = document.getElementById('tet-main-c');
    this.ctx = this.canvas.getContext('2d');
    this.holdCanvas = document.getElementById('tet-hold-c');
    this.holdCtx = this.holdCanvas.getContext('2d');
    this.nextCanvas = document.getElementById('tet-next-c');
    this.nextCtx = this.nextCanvas.getContext('2d');

    document.getElementById('tet-btn-tut').onclick = () => this.app.openTutorial('tetris');
    document.getElementById('tet-btn-pause').onclick = () => this.togglePause();
    document.getElementById('tet-btn-restart').onclick = () => this.restart();

    this.keyHandler = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'c', 'C', 'z', 'Z', 'x', 'X', 'p', 'P', 'r', 'R'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft') {
        if (window.wasmBridge.call('tetris_move_h', -1)) { window.audioController.playSfx(1); this.render(); }
      } else if (e.key === 'ArrowRight') {
        if (window.wasmBridge.call('tetris_move_h', 1)) { window.audioController.playSfx(1); this.render(); }
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'x') {
        if (window.wasmBridge.call('tetris_rotate_cw')) { window.audioController.playSfx(2); this.render(); }
      } else if (e.key.toLowerCase() === 'z') {
        if (window.wasmBridge.call('tetris_rotate_ccw')) { window.audioController.playSfx(2); this.render(); }
      } else if (e.key === 'ArrowDown') {
        window.wasmBridge.call('tetris_soft_drop');
        this.render();
      } else if (e.key === ' ') {
        window.wasmBridge.call('tetris_hard_drop');
        window.audioController.playSfx(3);
        this.render();
      } else if (e.key.toLowerCase() === 'c') {
        if (window.wasmBridge.call('tetris_hold')) { window.audioController.playSfx(2); this.render(); }
      } else if (e.key.toLowerCase() === 'p') {
        this.togglePause();
      } else if (e.key.toLowerCase() === 'r') {
        this.restart();
      }
      this.app.updateTelemetry();
    };
    window.addEventListener('keydown', this.keyHandler);

    this.restart();
  }

  restart() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    if (this.loopInt) clearInterval(this.loopInt);
    this.isPaused = false;
    const seed = BigInt(Math.floor(Math.random() * 1000000000));
    window.wasmBridge.call('tetris_reset', seed);
    this.app.updateTelemetry();
    window.audioController.playSfx(0);
    this.startLoop();
    this.render();
  }

  startLoop() {
    if (this.loopInt) clearInterval(this.loopInt);
    const level = window.wasmBridge.call('tetris_get_level');
    const ms = Math.max(80, 700 - (level - 1) * 60);
    this.loopInt = setInterval(() => {
      if (!this.isPaused) {
        window.wasmBridge.call('tetris_soft_drop');
        this.render();
      }
    }, ms);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pBtn = document.getElementById('tet-btn-pause');
    if (pBtn) pBtn.textContent = `[P] ${this.isPaused ? 'RESUME' : 'PAUSE'}`;
    this.render();
  }

  pause() {
    if (!this.isPaused) this.togglePause();
  }

  getColor(type) {
    switch (type) {
      case 1: return '#0891b2'; // I Cyan
      case 2: return '#2563eb'; // J Blue
      case 3: return '#d97706'; // L Orange
      case 4: return '#ca8a04'; // O Yellow
      case 5: return '#16a34a'; // S Green
      case 6: return '#9333ea'; // T Purple
      case 7: return '#dc2626'; // Z Red
      default: return '#33333b';
    }
  }

  render() {
    const { ctx, canvas } = this;
    if (!ctx) return;

    const cellW = canvas.width / 10;
    const cellH = canvas.height / 20;

    // Dark canvas background
    ctx.fillStyle = '#101014';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#1a1a20';
    ctx.lineWidth = 1;
    for (let r = 0; r <= 20; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(canvas.width, r * cellH);
      ctx.stroke();
    }
    for (let c = 0; c <= 10; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, canvas.height);
      ctx.stroke();
    }

    const gPtr = window.wasmBridge.call('tetris_get_grid_ptr');
    const grid = window.wasmBridge.getUint8View(gPtr, 200);

    // Render settled blocks
    for (let r = 0; r < 20; r++) {
      for (let c = 0; c < 10; c++) {
        const val = grid[r * 10 + c];
        if (val > 0) {
          ctx.fillStyle = this.getColor(val);
          ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
        }
      }
    }

    // Active & Ghost piece
    const isOver = window.wasmBridge.call('tetris_is_game_over');
    if (!isOver) {
      const pType = window.wasmBridge.call('tetris_get_current_type');
      const pRot = window.wasmBridge.call('tetris_get_current_rot');
      const px = window.wasmBridge.call('tetris_get_current_x');
      const py = window.wasmBridge.call('tetris_get_current_y');
      const gy = window.wasmBridge.call('tetris_ghost_y');

      const blocks = this.getBlockOffsets(pType, pRot);

      // Ghost piece
      ctx.strokeStyle = this.getColor(pType);
      ctx.lineWidth = 1.5;
      for (let b of blocks) {
        const gx = (px + b[0]) * cellW;
        const gposY = (gy + b[1]) * cellH;
        ctx.strokeRect(gx + 2, gposY + 2, cellW - 4, cellH - 4);
      }

      // Active piece
      ctx.fillStyle = this.getColor(pType);
      for (let b of blocks) {
        const ax = (px + b[0]) * cellW;
        const ay = (py + b[1]) * cellH;
        ctx.fillRect(ax + 1, ay + 1, cellW - 2, cellH - 2);
      }
    }

    // Update stats
    const score = window.wasmBridge.call('tetris_get_score');
    const lines = window.wasmBridge.call('tetris_get_lines');
    const level = window.wasmBridge.call('tetris_get_level');

    const sEl = document.getElementById('tet-score');
    const lEl = document.getElementById('tet-lines');
    const vEl = document.getElementById('tet-level');
    if (sEl) sEl.textContent = score;
    if (lEl) lEl.textContent = lines;
    if (vEl) vEl.textContent = level;

    window.storageManager.setHighScore('tetris', score);

    // Mini preview boxes
    const hold = window.wasmBridge.call('tetris_get_hold');
    this.renderMini(this.holdCtx, this.holdCanvas, hold);

    const nPtr = window.wasmBridge.call('tetris_get_next_queue_ptr');
    const nextQ = window.wasmBridge.getUint8View(nPtr, 5);
    this.renderMini(this.nextCtx, this.nextCanvas, nextQ[0]);

    if (isOver) {
      if (this.loopInt) clearInterval(this.loopInt);
      if (this.app && typeof this.app.showStageOverlay === 'function') {
        const lines = window.wasmBridge.call('tetris_get_lines');
        const level = window.wasmBridge.call('tetris_get_level');
        this.app.showStageOverlay(
          'GAME OVER',
          'Matrix locked!',
          [
            { label: 'SCORE', val: score },
            { label: 'LINES', val: lines },
            { label: 'LEVEL', val: level }
          ],
          () => this.restart(),
          { sfx: 7, allowReview: true }
        );
      } else {
        window.audioController.playSfx(7);
        this.showOverlay('GAME OVER', `Final Score: ${score}`, () => this.restart());
      }
    }
  }

  getBlockOffsets(type, rot) {
    switch (type) {
      case 1: // I
        switch (rot % 4) {
          case 0: return [[0,1],[1,1],[2,1],[3,1]];
          case 1: return [[2,0],[2,1],[2,2],[2,3]];
          case 2: return [[0,2],[1,2],[2,2],[3,2]];
          default: return [[1,0],[1,1],[1,2],[1,3]];
        }
      case 2: // J
        switch (rot % 4) {
          case 0: return [[0,0],[0,1],[1,1],[2,1]];
          case 1: return [[1,0],[2,0],[1,1],[1,2]];
          case 2: return [[0,1],[1,1],[2,1],[2,2]];
          default: return [[1,0],[1,1],[0,2],[1,2]];
        }
      case 3: // L
        switch (rot % 4) {
          case 0: return [[2,0],[0,1],[1,1],[2,1]];
          case 1: return [[1,0],[1,1],[1,2],[2,2]];
          case 2: return [[0,1],[1,1],[2,1],[0,2]];
          default: return [[0,0],[1,0],[1,1],[1,2]];
        }
      case 4: // O
        return [[1,0],[2,0],[1,1],[2,1]];
      case 5: // S
        switch (rot % 4) {
          case 0: return [[1,0],[2,0],[0,1],[1,1]];
          case 1: return [[1,0],[1,1],[2,1],[2,2]];
          case 2: return [[1,1],[2,1],[0,2],[1,2]];
          default: return [[0,0],[0,1],[1,1],[1,2]];
        }
      case 6: // T
        switch (rot % 4) {
          case 0: return [[1,0],[0,1],[1,1],[2,1]];
          case 1: return [[1,0],[1,1],[2,1],[1,2]];
          case 2: return [[0,1],[1,1],[2,1],[1,2]];
          default: return [[1,0],[0,1],[1,1],[1,2]];
        }
      case 7: // Z
        switch (rot % 4) {
          case 0: return [[0,0],[1,0],[1,1],[2,1]];
          case 1: return [[2,0],[1,1],[2,1],[1,2]];
          case 2: return [[0,1],[1,1],[1,2],[2,2]];
          default: return [[1,0],[0,1],[1,1],[0,2]];
        }
      default: return [];
    }
  }

  renderMini(ctx, canvas, type) {
    ctx.fillStyle = '#101014';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!type || type === 0) return;

    const blocks = this.getBlockOffsets(type, 0);
    const size = 12;
    const ox = (canvas.width - 4 * size) / 2;
    const oy = (canvas.height - 3 * size) / 2;

    ctx.fillStyle = this.getColor(type);
    for (let b of blocks) {
      ctx.fillRect(ox + b[0] * size + 1, oy + b[1] * size + 1, size - 2, size - 2);
    }
  }

  showOverlay(title, subtitle, onAction) {
    const mountEl = document.getElementById('stage-mount');
    if (!mountEl) return;
    const existing = mountEl.querySelector('.stage-overlay');
    if (existing) existing.remove();

    const ov = document.createElement('div');
    ov.className = 'stage-overlay';
    ov.innerHTML = `
      <div class="overlay-box">
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <button class="btn-ctrl btn-primary" id="tet-ov-btn">[R] PLAY AGAIN</button>
      </div>
    `;
    mountEl.appendChild(ov);
    ov.querySelector('#tet-ov-btn').onclick = () => {
      ov.remove();
      onAction();
    };
  }

  destroy() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    if (this.loopInt) clearInterval(this.loopInt);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }
}

// =========================================================================
// MODULE: MINESWEEPER (Bit-Packed WASM Engine)
// =========================================================================
const MS_FLAG_SVG = `<svg class="ms-icon ms-icon-flag" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M5 2h8l-2.5 3.5L13 9H5V2z"/><rect x="3" y="1" width="2" height="13"/><rect x="1" y="13" width="8" height="2"/></svg>`;

const MS_MINE_SVG = `<svg class="ms-icon ms-icon-mine" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><rect x="7" y="1" width="2" height="14"/><rect x="1" y="7" width="14" height="2"/><rect x="4" y="4" width="8" height="8" rx="1"/><polygon points="2,3 3,2 5,4 4,5"/><polygon points="14,3 13,2 11,4 12,5"/><polygon points="2,13 3,14 5,12 4,11"/><polygon points="14,13 13,14 11,12 12,11"/><circle cx="6" cy="6" r="1.2" fill="var(--color-bg-base, #ffffff)"/></svg>`;

class ModMinesweeper {
  constructor(app) {
    this.app = app;
    this.diff = 0; // 0: Easy (9x9), 1: Med (16x16), 2: Hard (30x16)
    this.flagMode = false;
    this.cells = [];
    this.timer = 0;
    this.timerInt = null;
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">MINES</span><span class="stat-v" id="ms-mines-count">10</span></div>
      <div class="stat-chip"><span class="stat-k">FLAGS</span><span class="stat-v" id="ms-flags-count">0</span></div>
      <div class="stat-chip"><span class="stat-k">TIME</span><span class="stat-v" id="ms-timer">0</span></div>
    `;

    actionsEl.innerHTML = `
      <button class="stage-btn" id="ms-btn-tut">[?] RULES</button>
      <select id="ms-diff-select" class="btn-select">
        <option value="0" selected>EASY (9×9)</option>
        <option value="1">MEDIUM (16×16)</option>
        <option value="2">HARD (30×16)</option>
      </select>
      <button class="btn-ctrl" id="ms-btn-flag">[F] FLAG: OFF</button>
      <button class="btn-ctrl btn-primary" id="ms-btn-new">[R] RESET</button>
    `;

    kbdEl.innerHTML = `
      <span>CONTROLS: LEFT CLICK REVEAL | RIGHT CLICK (OR <span class="kbd-shortcut">F</span>) FLAG | CLICK NUMBER TO CHORD | <span class="kbd-shortcut">R</span> RESET</span>
    `;

    const container = document.createElement('div');
    container.className = 'ms-container';

    const bannerContainer = document.createElement('div');
    bannerContainer.id = 'ms-banner-container';

    const grid = document.createElement('div');
    grid.className = 'ms-grid';
    grid.id = 'ms-grid-el';
    container.appendChild(bannerContainer);
    container.appendChild(grid);
    mountEl.appendChild(container);

    document.getElementById('ms-btn-tut').onclick = () => this.app.openTutorial('minesweeper');
    document.getElementById('ms-diff-select').onchange = (e) => {
      this.diff = parseInt(e.target.value, 10);
      this.resetGame();
    };

    const flagBtn = document.getElementById('ms-btn-flag');
    flagBtn.onclick = () => {
      this.flagMode = !this.flagMode;
      flagBtn.textContent = `[F] FLAG: ${this.flagMode ? 'ON' : 'OFF'}`;
      flagBtn.classList.toggle('active', this.flagMode);
    };

    document.getElementById('ms-btn-new').onclick = () => this.resetGame();

    this.keyHandler = (e) => {
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        flagBtn.click();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.resetGame();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.resetGame();
  }

  resetGame() {
    if (this.timerInt) clearInterval(this.timerInt);
    this.timer = 0;
    const tEl = document.getElementById('ms-timer');
    if (tEl) tEl.textContent = '0';

    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    const bContainer = document.getElementById('ms-banner-container');
    if (bContainer) bContainer.innerHTML = '';

    const seed = BigInt(Math.floor(Math.random() * 1000000000));
    window.wasmBridge.call('ms_reset', this.diff, seed);
    this.app.updateTelemetry();
    window.audioController.playSfx(0);

    this.buildGridDOM();
    this.sync();
  }

  startTimer() {
    if (this.timerInt) clearInterval(this.timerInt);
    this.timer = 0;
    this.timerInt = setInterval(() => {
      this.timer++;
      const el = document.getElementById('ms-timer');
      if (el) el.textContent = this.timer;
    }, 1000);
  }

  buildGridDOM() {
    const gridEl = document.getElementById('ms-grid-el');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    this.cells = [];

    const w = window.wasmBridge.call('ms_get_width');
    const h = window.wasmBridge.call('ms_get_height');
    gridEl.style.gridTemplateColumns = `repeat(${w}, 28px)`;

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const btn = document.createElement('button');
        btn.className = 'ms-cell';
        btn.onclick = () => {
          const currentState = window.wasmBridge.call('ms_get_state');
          if (currentState === 2 || currentState === 3) return;
          if (this.timer === 0) this.startTimer();
          if (this.flagMode) {
            window.wasmBridge.call('ms_toggle_flag', r, c);
            window.audioController.playSfx(2);
          } else {
            const st = window.wasmBridge.call('ms_reveal', r, c);
            if (st === 3) window.audioController.playSfx(6);
            else window.audioController.playSfx(1);
          }
          this.app.updateTelemetry();
          this.sync();
        };

        btn.oncontextmenu = (e) => {
          e.preventDefault();
          const currentState = window.wasmBridge.call('ms_get_state');
          if (currentState === 2 || currentState === 3) return;
          if (this.timer === 0) this.startTimer();
          window.wasmBridge.call('ms_toggle_flag', r, c);
          window.audioController.playSfx(2);
          this.app.updateTelemetry();
          this.sync();
        };

        btn.ondblclick = () => {
          const currentState = window.wasmBridge.call('ms_get_state');
          if (currentState === 2 || currentState === 3) return;
          window.wasmBridge.call('ms_chord', r, c);
          this.app.updateTelemetry();
          this.sync();
        };

        gridEl.appendChild(btn);
        this.cells.push(btn);
      }
    }
  }

  sync() {
    const w = window.wasmBridge.call('ms_get_width');
    const h = window.wasmBridge.call('ms_get_height');
    const total = w * h;
    const mCount = window.wasmBridge.call('ms_get_mine_count');
    const fCount = window.wasmBridge.call('ms_get_flags_count');
    const state = window.wasmBridge.call('ms_get_state');

    const mEl = document.getElementById('ms-mines-count');
    const fEl = document.getElementById('ms-flags-count');
    if (mEl) mEl.textContent = mCount;
    if (fEl) fEl.textContent = fCount;

    const cPtr = window.wasmBridge.call('ms_get_cells_ptr');
    const cells = window.wasmBridge.getUint8View(cPtr, total);

    for (let i = 0; i < total; i++) {
      const b = cells[i];
      const btn = this.cells[i];
      const isMine = (b & 0x01) !== 0;
      const isRevealed = (b & 0x02) !== 0;
      const isFlagged = (b & 0x04) !== 0;
      const isExploded = (b & 0x08) !== 0;
      const count = (b >> 4) & 0x0F;

      btn.className = 'ms-cell';
      btn.innerHTML = '';

      if (isRevealed) {
        btn.classList.add('revealed');
        if (isMine) {
          btn.classList.add(isExploded ? 'exploded' : 'mine');
          btn.innerHTML = MS_MINE_SVG;
        } else if (count > 0) {
          btn.classList.add(`num-${count}`);
          btn.textContent = count;
        }
      } else if (isFlagged) {
        btn.classList.add('flagged');
        if (state === 3 && !isMine) {
          btn.classList.add('false-flag');
        }
        btn.innerHTML = MS_FLAG_SVG;
      }
    }

    if (state === 2) {
      if (this.timerInt) clearInterval(this.timerInt);
      const bContainer = document.getElementById('ms-banner-container');
      if (bContainer) bContainer.innerHTML = '';

      const diffLabels = ['EASY (9×9)', 'MEDIUM (16×16)', 'HARD (30×16)'];
      const diffLabel = diffLabels[this.diff] || 'CUSTOM';

      if (this.app && typeof this.app.showStageOverlay === 'function') {
        this.app.showStageOverlay(
          'MINESWEEPER CLEARED',
          'Minefield successfully cleared!',
          [
            { label: 'DIFFICULTY', val: diffLabel },
            { label: 'MINES', val: mCount },
            { label: 'TIME', val: `${this.timer}s` }
          ],
          () => this.resetGame(),
          { allowReview: true }
        );
      } else {
        this.showOverlay('VICTORY', `Cleared in ${this.timer} seconds!`, () => this.resetGame());
      }
    } else if (state === 3) {
      if (this.timerInt) clearInterval(this.timerInt);
      if (window.audioController && typeof window.audioController.playSfx === 'function') {
        window.audioController.playSfx(7);
      }

      // Non-blocking banner: keep field 100% visible and unobscured
      const bContainer = document.getElementById('ms-banner-container');
      if (bContainer && !document.getElementById('ms-retry-btn')) {
        bContainer.innerHTML = `
          <div class="ms-banner detonated">
            <span>★ MINE DETONATED! REVIEW FIELD OR PRESS [R] TO RETRY ★</span>
            <button class="stage-btn btn-primary" id="ms-retry-btn">[R] RETRY</button>
          </div>
        `;
        const retryBtn = document.getElementById('ms-retry-btn');
        if (retryBtn) {
          retryBtn.onclick = () => this.resetGame();
        }
      }
    }
  }

  showOverlay(title, subtitle, onAction) {
    const mountEl = document.getElementById('stage-mount');
    if (!mountEl) return;
    const existing = mountEl.querySelector('.stage-overlay');
    if (existing) existing.remove();

    const ov = document.createElement('div');
    ov.className = 'stage-overlay';
    ov.innerHTML = `
      <div class="overlay-box">
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <button class="btn-ctrl btn-primary" id="ms-ov-btn">[R] PLAY AGAIN</button>
      </div>
    `;
    mountEl.appendChild(ov);
    ov.querySelector('#ms-ov-btn').onclick = () => {
      ov.remove();
      onAction();
    };
  }

  destroy() {
    if (this.timerInt) clearInterval(this.timerInt);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
  }
}

// =========================================================================
// MODULE: SCRATCHPAD (Offline Monospace Markdown Studio)
// =========================================================================
class ModScratchpad {
  constructor(app) {
    this.app = app;
    this.storageKey = 'zenith_scratchpad';
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">WORDS</span><span class="stat-v" id="sp-words">0</span></div>
      <div class="stat-chip"><span class="stat-k">CHARS</span><span class="stat-v" id="sp-chars">0</span></div>
    `;

    actionsEl.innerHTML = `
      <button class="stage-btn" id="sp-btn-tut">[?] GUIDE</button>
      <button class="btn-ctrl" id="sp-btn-md">SAVE .MD</button>
      <button class="btn-ctrl" id="sp-btn-txt">SAVE .TXT</button>
      <button class="btn-ctrl" id="sp-btn-copy">COPY</button>
      <button class="btn-ctrl" id="sp-btn-clear">CLEAR</button>
    `;

    kbdEl.innerHTML = `
      <span>OFFLINE STORAGE: AUTOSAVES LOCALLY TO DISK ON EVERY KEYPRESS</span>
    `;

    const saved = localStorage.getItem(this.storageKey) || `# ZENITH OFFLINE STUDIO\n\nPure local Markdown editor. Zero network telemetry.\n\n- Zero allocations\n- Offline export\n- Real-time preview\n\nStart typing below...`;

    const container = document.createElement('div');
    container.className = 'sp-container';
    container.innerHTML = `
      <div class="sp-editor-pane">
        <textarea id="sp-editor" class="sp-textarea" placeholder="Write markdown..."></textarea>
      </div>
      <div class="sp-preview-pane">
        <div id="sp-preview" class="sp-preview"></div>
      </div>
    `;

    mountEl.appendChild(container);

    const editor = document.getElementById('sp-editor');
    const preview = document.getElementById('sp-preview');

    editor.value = saved;
    editor.oninput = () => this.update(editor, preview);

    document.getElementById('sp-btn-tut').onclick = () => this.app.openTutorial('scratchpad');
    document.getElementById('sp-btn-md').onclick = () => this.exportFile(editor.value, 'notes.md', 'text/markdown');
    document.getElementById('sp-btn-txt').onclick = () => this.exportFile(editor.value, 'notes.txt', 'text/plain');
    document.getElementById('sp-btn-copy').onclick = () => {
      navigator.clipboard.writeText(editor.value);
      window.audioController.playSfx(4);
    };
    document.getElementById('sp-btn-clear').onclick = () => {
      editor.value = '';
      this.update(editor, preview);
    };

    this.update(editor, preview);
  }

  update(editor, preview) {
    const text = editor.value;
    localStorage.setItem(this.storageKey, text);

    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    const wEl = document.getElementById('sp-words');
    const cEl = document.getElementById('sp-chars');
    if (wEl) wEl.textContent = words;
    if (cEl) cEl.textContent = chars;

    // Fast markdown parser
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');

    preview.innerHTML = html.split(/\n\n+/).map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<block')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  exportFile(text, filename, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    window.audioController.playSfx(4);
  }

  destroy() {}
}

// =========================================================================
// MODULE: Solitaire (Klondike)
// =========================================================================
class ModSolitaire {
  constructor(app) {
    this.app = app;
    this.suits = ['C', 'D', 'H', 'S'];
    this.suitSymbols = { C: '♣', D: '♦', H: '♥', S: '♠' };
    this.suitColors = { C: 'black', D: 'red', H: 'red', S: 'black' };
    this.valueNames = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

    this.stock = [];
    this.waste = [];
    this.foundations = [[], [], [], []];
    this.tableau = [[], [], [], [], [], [], []];
    this.history = [];
    this.selected = null;
    this.score = 0;
    this.moves = 0;
    this.timer = 0;
    this.timerInterval = null;
    this.isWon = false;
    this.drawCount = 1;
    this.bestScore = window.storageManager.getHighScore('solitaire');
    this.boundKeydown = null;
    this.autoCompleting = false;
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    this.mountEl = mountEl;
    this.statsEl = statsEl;
    this.actionsEl = actionsEl;
    this.kbdEl = kbdEl;

    this.renderHeader();
    this.initGame();

    this.boundKeydown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'r' || e.key === 'R') {
        this.initGame();
      } else if (e.key === 'u' || e.key === 'U') {
        this.undo();
      }
    };
    window.addEventListener('keydown', this.boundKeydown);
  }

  renderHeader() {
    this.statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">SCORE</span><span class="stat-v" id="sol-score">${this.score}</span></div>
      <div class="stat-chip"><span class="stat-k">MOVES</span><span class="stat-v" id="sol-moves">${this.moves}</span></div>
      <div class="stat-chip"><span class="stat-k">TIME</span><span class="stat-v" id="sol-timer">00:00</span></div>
      <div class="stat-chip"><span class="stat-k">BEST</span><span class="stat-v">${this.bestScore}</span></div>
    `;

    this.actionsEl.innerHTML = `
      <button class="stage-btn" id="sol-tut-btn">[?] RULES</button>
      <button class="stage-btn" id="sol-restart-btn">[R] NEW DEAL</button>
      <button class="stage-btn" id="sol-undo-btn">[U] UNDO</button>
      <button class="stage-btn" id="sol-draw-btn">DRAW: ${this.drawCount}</button>
      <button class="stage-btn" id="sol-autocomplete-btn" style="display:none; color:var(--color-accent); font-weight:700;">AUTO-COMPLETE</button>
    `;

    this.kbdEl.innerHTML = `
      <span><kbd>R</kbd> RESTART</span>
      <span><kbd>U</kbd> UNDO</span>
      <span><kbd>CLICK</kbd> SMART MOVE</span>
      <span><kbd>?</kbd> TUTORIAL</span>
    `;

    document.getElementById('sol-tut-btn').onclick = () => this.app.openTutorial('solitaire');
    document.getElementById('sol-restart-btn').onclick = () => this.initGame();
    document.getElementById('sol-undo-btn').onclick = () => this.undo();
    document.getElementById('sol-draw-btn').onclick = () => {
      this.drawCount = this.drawCount === 1 ? 3 : 1;
      document.getElementById('sol-draw-btn').textContent = `DRAW: ${this.drawCount}`;
      window.audioController.playSfx(0);
    };
    document.getElementById('sol-autocomplete-btn').onclick = () => this.runAutoComplete();
  }

  initGame() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timer = 0;
    this.timerInterval = setInterval(() => {
      this.timer++;
      const m = String(Math.floor(this.timer / 60)).padStart(2, '0');
      const s = String(this.timer % 60).padStart(2, '0');
      const el = document.getElementById('sol-timer');
      if (el) el.textContent = `${m}:${s}`;
    }, 1000);

    this.score = 0;
    this.moves = 0;
    this.history = [];
    this.selected = null;
    this.isWon = false;
    this.autoCompleting = false;

    // Build 52-card deck
    const deck = [];
    for (const s of this.suits) {
      for (let v = 1; v <= 13; v++) {
        deck.push({ suit: s, val: v, faceUp: false });
      }
    }

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal to tableau
    this.tableau = [[], [], [], [], [], [], []];
    for (let col = 0; col < 7; col++) {
      for (let i = 0; i <= col; i++) {
        const card = deck.pop();
        if (i === col) card.faceUp = true;
        this.tableau[col].push(card);
      }
    }

    // Stock & Foundations
    this.stock = deck;
    this.waste = [];
    this.foundations = [[], [], [], []];

    this.render();
    window.audioController.playSfx(0);
  }

  saveSnapshot() {
    this.history.push(JSON.stringify({
      stock: this.stock,
      waste: this.waste,
      foundations: this.foundations,
      tableau: this.tableau,
      score: this.score,
      moves: this.moves
    }));
    if (this.history.length > 50) this.history.shift();
  }

  undo() {
    if (this.history.length === 0 || this.autoCompleting) return;
    const snap = JSON.parse(this.history.pop());
    this.stock = snap.stock;
    this.waste = snap.waste;
    this.foundations = snap.foundations;
    this.tableau = snap.tableau;
    this.score = snap.score;
    this.moves = snap.moves;
    this.selected = null;
    this.render();
    window.audioController.playSfx(0);
  }

  render() {
    this.updateStats();
    this.checkAutoCompleteEligibility();

    let html = `
      <div class="sol-container">
        <div class="sol-top-row">
          <div class="sol-stock-waste">
            <div class="sol-slot" id="sol-stock-slot">
              ${this.stock.length > 0
                ? `<div class="sol-card face-down"><div class="sol-card-center" style="font-size:0.8rem; opacity:0.7;">${this.stock.length}</div></div>`
                : `<span style="opacity:0.4;">EMPTY</span>`}
            </div>
            <div class="sol-slot" id="sol-waste-slot">
              ${this.waste.length > 0 ? this.renderCardHtml(this.waste[this.waste.length - 1], 'waste', 0, this.waste.length - 1) : `<span style="opacity:0.4;">WASTE</span>`}
            </div>
          </div>

          <div class="sol-spacer"></div>

          <div class="sol-foundations">
            ${this.foundations.map((f, i) => {
              const suitSym = this.suitSymbols[this.suits[i]];
              const top = f.length > 0 ? f[f.length - 1] : null;
              return `
                <div class="sol-slot" data-foundation="${i}">
                  ${top ? this.renderCardHtml(top, 'foundation', i, f.length - 1) : `<span style="font-size:1.2rem; opacity:0.35;">${suitSym}</span>`}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="sol-tableau-row">
          ${this.tableau.map((col, colIdx) => `
            <div class="sol-column${col.length === 0 ? ' sol-empty-col' : ''}" data-tableau="${colIdx}">
              ${col.length === 0
                ? `<div class="sol-slot sol-empty-slot" data-tableau="${colIdx}">K</div>`
                : col.map((card, cardIdx) => this.renderCardHtml(card, 'tableau', colIdx, cardIdx)).join('')
              }
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.mountEl.innerHTML = html;
    this.bindEvents();
  }

  renderCardHtml(card, source, colIdx, cardIdx) {
    const isSel = this.selected && this.selected.source === source && this.selected.colIdx === colIdx && (
      source === 'tableau' ? cardIdx >= this.selected.cardIdx : cardIdx === this.selected.cardIdx
    );
    const isRed = this.suitColors[card.suit] === 'red';
    const sym = this.suitSymbols[card.suit];
    const valStr = this.valueNames[card.val] || card.val;
    const isTab = source === 'tableau';

    if (!card.faceUp) {
      return `<div class="sol-card face-down ${isTab ? 'sol-tableau-card' : ''}" data-source="${source}" data-col="${colIdx}" data-idx="${cardIdx}"></div>`;
    }

    return `
      <div class="sol-card ${isTab ? 'sol-tableau-card' : ''} ${isRed ? 'suit-red' : 'suit-black'} ${isSel ? 'selected' : ''}"
           data-source="${source}" data-col="${colIdx}" data-idx="${cardIdx}">
        <div class="sol-card-top"><span>${valStr}</span><span>${sym}</span></div>
        <div class="sol-card-center">${sym}</div>
        <div class="sol-card-bottom"><span>${valStr}</span><span>${sym}</span></div>
      </div>
    `;
  }

  bindEvents() {
    const stockSlot = document.getElementById('sol-stock-slot');
    if (stockSlot) {
      stockSlot.onclick = () => this.handleStockClick();
    }

    this.mountEl.querySelectorAll('.sol-card, .sol-slot, .sol-column').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        this.handleClick(el);
      };
    });
  }

  handleStockClick() {
    this.saveSnapshot();
    if (this.stock.length > 0) {
      const take = Math.min(this.drawCount, this.stock.length);
      for (let i = 0; i < take; i++) {
        const c = this.stock.pop();
        c.faceUp = true;
        this.waste.push(c);
      }
      this.moves++;
      window.audioController.playSfx(0);
    } else {
      this.stock = this.waste.reverse().map(c => { c.faceUp = false; return c; });
      this.waste = [];
      this.moves++;
      window.audioController.playSfx(2);
    }
    this.selected = null;
    this.render();
  }

  handleClick(el) {
    if (this.autoCompleting) return;

    const source = el.getAttribute('data-source');
    const colIdx = parseInt(el.getAttribute('data-col'), 10);
    const cardIdx = parseInt(el.getAttribute('data-idx'), 10);
    const foundationIdx = el.getAttribute('data-foundation') !== null
      ? parseInt(el.getAttribute('data-foundation'), 10)
      : (el.closest('[data-foundation]') ? parseInt(el.closest('[data-foundation]').getAttribute('data-foundation'), 10) : null);
    const tableauIdx = el.getAttribute('data-tableau') !== null
      ? parseInt(el.getAttribute('data-tableau'), 10)
      : (el.closest('[data-tableau]') ? parseInt(el.closest('[data-tableau]').getAttribute('data-tableau'), 10) : null);

    if (source) {
      let card = null;
      if (source === 'waste') card = this.waste[cardIdx];
      else if (source === 'foundation') card = this.foundations[colIdx][cardIdx];
      else if (source === 'tableau') card = this.tableau[colIdx][cardIdx];

      if (!card || !card.faceUp) return;

      if (this.selected) {
        const isClickingSelected = this.selected.source === source && this.selected.colIdx === colIdx &&
          (source === 'tableau' ? cardIdx >= this.selected.cardIdx : cardIdx === this.selected.cardIdx);
        if (isClickingSelected) {
          this.selected = null;
          this.render();
          return;
        }

        if (source === 'tableau' && cardIdx === this.tableau[colIdx].length - 1) {
          if (this.tryMoveToTableau(colIdx)) return;
        }
      }

      if (this.trySmartMove(card, source, colIdx, cardIdx)) {
        return;
      }

      this.selected = { source, colIdx, cardIdx };
      this.render();
      window.audioController.playSfx(0);
      return;
    }

    if (foundationIdx !== null && this.selected) {
      if (this.tryMoveToFoundation(foundationIdx)) return;
    }

    if (tableauIdx !== null && this.selected) {
      if (this.tryMoveToTableau(tableauIdx)) return;
    }

    this.selected = null;
    this.render();
  }

  trySmartMove(card, source, colIdx, cardIdx) {
    const isTop = (source === 'waste') || (source === 'tableau' && cardIdx === this.tableau[colIdx].length - 1);

    if (isTop) {
      for (let f = 0; f < 4; f++) {
        if (this.canPlaceOnFoundation(card, f)) {
          this.saveSnapshot();
          this.removeCard(source, colIdx, cardIdx);
          this.foundations[f].push(card);
          this.score += 10;
          this.moves++;
          this.postMoveCheck(source, colIdx);
          window.audioController.playSfx(1);
          this.render();
          this.checkWin();
          return true;
        }
      }
    }

    if (source === 'waste' || source === 'tableau') {
      const movingCard = (source === 'waste') ? this.waste[this.waste.length - 1] : this.tableau[colIdx][cardIdx];
      for (let t = 0; t < 7; t++) {
        if (source === 'tableau' && t === colIdx) continue;
        if (this.canPlaceOnTableau(movingCard, t)) {
          this.saveSnapshot();
          const movingStack = this.removeStack(source, colIdx, cardIdx);
          this.tableau[t].push(...movingStack);
          this.score += 5;
          this.moves++;
          this.postMoveCheck(source, colIdx);
          window.audioController.playSfx(0);
          this.render();
          return true;
        }
      }
    }

    return false;
  }

  tryMoveToFoundation(fIdx) {
    if (!this.selected) return false;
    const { source, colIdx, cardIdx } = this.selected;

    let card = null;
    if (source === 'waste') card = this.waste[cardIdx];
    else if (source === 'tableau') {
      if (cardIdx !== this.tableau[colIdx].length - 1) return false;
      card = this.tableau[colIdx][cardIdx];
    }

    if (!card) return false;

    if (this.canPlaceOnFoundation(card, fIdx)) {
      this.saveSnapshot();
      this.removeCard(source, colIdx, cardIdx);
      this.foundations[fIdx].push(card);
      this.score += 10;
      this.moves++;
      this.postMoveCheck(source, colIdx);
      this.selected = null;
      window.audioController.playSfx(1);
      this.render();
      this.checkWin();
      return true;
    }
    return false;
  }

  tryMoveToTableau(targetCol) {
    if (!this.selected) return false;
    const { source, colIdx, cardIdx } = this.selected;
    if (source === 'tableau' && colIdx === targetCol) return false;

    let leadCard = null;
    if (source === 'waste') leadCard = this.waste[cardIdx];
    else if (source === 'foundation') leadCard = this.foundations[colIdx][cardIdx];
    else if (source === 'tableau') leadCard = this.tableau[colIdx][cardIdx];

    if (!leadCard) return false;

    if (this.canPlaceOnTableau(leadCard, targetCol)) {
      this.saveSnapshot();
      const movingStack = this.removeStack(source, colIdx, cardIdx);
      this.tableau[targetCol].push(...movingStack);
      this.score += 5;
      this.moves++;
      this.postMoveCheck(source, colIdx);
      this.selected = null;
      window.audioController.playSfx(0);
      this.render();
      return true;
    }
    return false;
  }

  canPlaceOnFoundation(card, fIdx) {
    if (card.suit !== this.suits[fIdx]) return false;
    const f = this.foundations[fIdx];
    if (f.length === 0) return card.val === 1;
    return card.val === f[f.length - 1].val + 1;
  }

  canPlaceOnTableau(card, tIdx) {
    const col = this.tableau[tIdx];
    if (col.length === 0) return card.val === 13;
    const top = col[col.length - 1];
    if (!top.faceUp) return false;
    const diffColor = this.suitColors[card.suit] !== this.suitColors[top.suit];
    return diffColor && card.val === top.val - 1;
  }

  removeCard(source, colIdx, cardIdx) {
    if (source === 'waste') return this.waste.pop();
    if (source === 'foundation') return this.foundations[colIdx].pop();
    if (source === 'tableau') return this.tableau[colIdx].pop();
  }

  removeStack(source, colIdx, cardIdx) {
    if (source === 'waste') return [this.waste.pop()];
    if (source === 'foundation') return [this.foundations[colIdx].pop()];
    if (source === 'tableau') return this.tableau[colIdx].splice(cardIdx);
  }

  postMoveCheck(source, colIdx) {
    if (source === 'tableau') {
      const col = this.tableau[colIdx];
      if (col.length > 0 && !col[col.length - 1].faceUp) {
        col[col.length - 1].faceUp = true;
        this.score += 5;
      }
    }
  }

  checkAutoCompleteEligibility() {
    const btn = document.getElementById('sol-autocomplete-btn');
    if (!btn) return;
    if (this.isWon || this.autoCompleting) {
      btn.style.display = 'none';
      return;
    }

    const stockEmpty = this.stock.length === 0 && this.waste.length === 0;
    const allTableauFaceUp = this.tableau.every(col => col.every(c => c.faceUp));

    if (stockEmpty && allTableauFaceUp && this.foundations.some(f => f.length < 13)) {
      btn.style.display = 'inline-block';
    } else {
      btn.style.display = 'none';
    }
  }

  runAutoComplete() {
    if (this.autoCompleting) return;
    this.autoCompleting = true;
    this.selected = null;

    const interval = setInterval(() => {
      let moved = false;
      for (let t = 0; t < 7; t++) {
        const col = this.tableau[t];
        if (col.length === 0) continue;
        const card = col[col.length - 1];
        for (let f = 0; f < 4; f++) {
          if (this.canPlaceOnFoundation(card, f)) {
            col.pop();
            this.foundations[f].push(card);
            this.score += 10;
            this.moves++;
            moved = true;
            window.audioController.playSfx(1);
            this.render();
            break;
          }
        }
        if (moved) break;
      }

      if (!moved || this.foundations.every(f => f.length === 13)) {
        clearInterval(interval);
        this.autoCompleting = false;
        this.checkWin();
      }
    }, 80);
  }

  checkWin() {
    if (this.foundations.every(f => f.length === 13)) {
      this.isWon = true;
      if (this.timerInterval) clearInterval(this.timerInterval);
      window.storageManager.setHighScore('solitaire', this.score);
      const el = document.getElementById('sol-score');
      if (el) el.textContent = `${this.score} (WON!)`;

      if (this.app && typeof this.app.showStageOverlay === 'function') {
        const timerEl = document.getElementById('sol-timer');
        const timeStr = timerEl ? timerEl.textContent : '00:00';
        this.app.showStageOverlay(
          'SOLITAIRE VICTORY',
          'All 4 foundations completed!',
          [
            { label: 'SCORE', val: this.score },
            { label: 'MOVES', val: this.moves },
            { label: 'TIME', val: timeStr }
          ],
          () => this.initGame(),
          { allowReview: true }
        );
      }
    }
  }

  updateStats() {
    const sc = document.getElementById('sol-score');
    const mv = document.getElementById('sol-moves');
    if (sc) sc.textContent = this.score;
    if (mv) mv.textContent = this.moves;
  }

  destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.boundKeydown) window.removeEventListener('keydown', this.boundKeydown);
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
  }
}

// =========================================================================
// MODULE: Connect 4 (Tactics 4)
// =========================================================================
class ModConnect4 {
  constructor(app) {
    this.app = app;
    this.rows = 6;
    this.cols = 7;
    this.grid = [];
    this.turn = 1; // 1 = Red (Human), 2 = Yellow (AI or P2)
    this.mode = 'ai'; // 'ai' or 'pvp'
    this.aiDifficulty = 'tactical'; // 'casual', 'tactical', 'master'
    this.gameOver = false;
    this.winningCells = [];
    this.p1Wins = window.storageManager.get('c4_wins_p1', 0);
    this.p2Wins = window.storageManager.get('c4_wins_p2', 0);
    this.boundKeydown = null;
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    this.mountEl = mountEl;
    this.statsEl = statsEl;
    this.actionsEl = actionsEl;
    this.kbdEl = kbdEl;

    this.renderHeader();
    this.initGame();

    this.boundKeydown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'r' || e.key === 'R') {
        this.initGame();
      } else if (e.key >= '1' && e.key <= '7') {
        const col = parseInt(e.key, 10) - 1;
        this.dropDisc(col);
      }
    };
    window.addEventListener('keydown', this.boundKeydown);
  }

  renderHeader() {
    this.statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">TURN</span><span class="stat-v" id="c4-turn-label">P1 (RED)</span></div>
      <div class="stat-chip"><span class="stat-k">P1 WINS</span><span class="stat-v" id="c4-p1-wins">${this.p1Wins}</span></div>
      <div class="stat-chip"><span class="stat-k">P2/AI</span><span class="stat-v" id="c4-p2-wins">${this.p2Wins}</span></div>
    `;

    this.actionsEl.innerHTML = `
      <button class="stage-btn" id="c4-tut-btn">[?] RULES</button>
      <button class="stage-btn" id="c4-restart-btn">[R] NEW MATCH</button>
      <select class="stage-btn" id="c4-mode-select" style="padding: 4px 6px;">
        <option value="ai" selected>vs AI</option>
        <option value="pvp">2-PLAYER (LOCAL)</option>
      </select>
      <select class="stage-btn" id="c4-diff-select" style="padding: 4px 6px;">
        <option value="casual">CASUAL</option>
        <option value="tactical" selected>TACTICAL</option>
        <option value="master">MASTER</option>
      </select>
    `;

    this.kbdEl.innerHTML = `
      <span><kbd>1-7</kbd> DROP COLUMN</span>
      <span><kbd>R</kbd> RESTART MATCH</span>
      <span><kbd>?</kbd> TUTORIAL</span>
    `;

    document.getElementById('c4-tut-btn').onclick = () => this.app.openTutorial('connect4');
    document.getElementById('c4-restart-btn').onclick = () => this.initGame();
    document.getElementById('c4-mode-select').onchange = (e) => {
      this.mode = e.target.value;
      const diffSel = document.getElementById('c4-diff-select');
      if (diffSel) diffSel.style.display = this.mode === 'ai' ? 'inline-block' : 'none';
      this.initGame();
    };
    document.getElementById('c4-diff-select').onchange = (e) => {
      this.aiDifficulty = e.target.value;
      this.initGame();
    };
  }

  initGame() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.turn = 1;
    this.gameOver = false;
    this.winningCells = [];
    this.updateTurnLabel();
    this.render();
    if (window.audioController && typeof window.audioController.playSfx === 'function') {
      window.audioController.playSfx(0);
    }
  }

  updateTurnLabel() {
    const lbl = document.getElementById('c4-turn-label');
    if (!lbl) return;
    if (this.gameOver) {
      lbl.textContent = 'GAME OVER';
    } else if (this.turn === 1) {
      lbl.textContent = 'P1 (RED)';
      lbl.style.color = '#dc2626';
    } else {
      lbl.textContent = this.mode === 'ai' ? 'AI (THINKING...)' : 'P2 (YELLOW)';
      lbl.style.color = '#eab308';
    }
  }

  render() {
    let html = `
      <div class="c4-container">
        <div class="c4-col-buttons">
          ${Array(this.cols).fill(0).map((_, c) => `
            <button class="c4-col-btn" data-col="${c}" ${this.grid[0][c] !== 0 || this.gameOver ? 'disabled' : ''}>
              &darr; ${c + 1}
            </button>
          `).join('')}
        </div>
        <div class="c4-board">
          ${this.grid.map((row, r) => row.map((cell, c) => {
            const isWin = this.winningCells.some(([wr, wc]) => wr === r && wc === c);
            const cl = cell === 1 ? 'p1' : (cell === 2 ? 'p2' : '');
            return `<div class="c4-slot ${cl} ${isWin ? 'winning' : ''}" data-col="${c}"></div>`;
          }).join('')).join('')}
        </div>
      </div>
    `;

    this.mountEl.innerHTML = html;

    this.mountEl.querySelectorAll('.c4-col-btn, .c4-slot').forEach(el => {
      el.onclick = () => {
        const c = parseInt(el.getAttribute('data-col'), 10);
        this.dropDisc(c);
      };
    });
  }

  dropDisc(col) {
    if (this.gameOver || this.grid[0][col] !== 0) return;
    if (this.mode === 'ai' && this.turn === 2) return;

    let row = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][col] === 0) {
        row = r;
        break;
      }
    }
    if (row === -1) return;

    this.grid[row][col] = this.turn;
    window.audioController.playSfx(2);

    if (this.checkWin(row, col, this.turn)) {
      this.handleWin(this.turn);
      return;
    }

    if (this.isBoardFull()) {
      this.handleDraw();
      return;
    }

    this.turn = this.turn === 1 ? 2 : 1;
    this.updateTurnLabel();
    this.render();

    if (this.mode === 'ai' && this.turn === 2) {
      setTimeout(() => this.runAIMove(), 180);
    }
  }

  runAIMove() {
    if (this.gameOver) return;

    let col = -1;
    if (this.aiDifficulty === 'casual') {
      col = this.getCasualMove();
    } else if (this.aiDifficulty === 'tactical') {
      col = this.getMinimaxMove(3);
    } else {
      col = this.getMinimaxMove(5);
    }

    if (col === -1 || this.grid[0][col] !== 0) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[0][c] === 0) { col = c; break; }
      }
    }

    let row = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][col] === 0) { row = r; break; }
    }
    if (row === -1) return;

    this.grid[row][col] = 2;
    window.audioController.playSfx(2);

    if (this.checkWin(row, col, 2)) {
      this.handleWin(2);
      return;
    }

    if (this.isBoardFull()) {
      this.handleDraw();
      return;
    }

    this.turn = 1;
    this.updateTurnLabel();
    this.render();
  }

  getCasualMove() {
    for (let c = 0; c < this.cols; c++) {
      const r = this.getLowestEmptyRow(c);
      if (r !== -1) {
        this.grid[r][c] = 2;
        const win = this.checkWin(r, c, 2, false);
        this.grid[r][c] = 0;
        if (win) return c;
      }
    }
    for (let c = 0; c < this.cols; c++) {
      const r = this.getLowestEmptyRow(c);
      if (r !== -1) {
        this.grid[r][c] = 1;
        const win = this.checkWin(r, c, 1, false);
        this.grid[r][c] = 0;
        if (win) return c;
      }
    }
    const valids = [];
    for (let c = 0; c < this.cols; c++) if (this.grid[0][c] === 0) valids.push(c);
    return valids[Math.floor(Math.random() * valids.length)];
  }

  getMinimaxMove(depth) {
    let bestScore = -Infinity;
    let bestCol = 3;
    const order = [3, 2, 4, 1, 5, 0, 6];

    for (const c of order) {
      const r = this.getLowestEmptyRow(c);
      if (r !== -1) {
        this.grid[r][c] = 2;
        if (this.checkWin(r, c, 2, false)) {
          this.grid[r][c] = 0;
          return c;
        }
        const score = this.minimax(depth - 1, false, -Infinity, Infinity);
        this.grid[r][c] = 0;
        if (score > bestScore) {
          bestScore = score;
          bestCol = c;
        }
      }
    }
    return bestCol;
  }

  minimax(depth, isMax, alpha, beta) {
    if (depth === 0) return this.evaluateBoard();
    const order = [3, 2, 4, 1, 5, 0, 6];

    if (isMax) {
      let maxEval = -Infinity;
      for (const c of order) {
        const r = this.getLowestEmptyRow(c);
        if (r !== -1) {
          this.grid[r][c] = 2;
          if (this.checkWin(r, c, 2, false)) {
            this.grid[r][c] = 0;
            return 10000 + depth;
          }
          const evalScore = this.minimax(depth - 1, false, alpha, beta);
          this.grid[r][c] = 0;
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const c of order) {
        const r = this.getLowestEmptyRow(c);
        if (r !== -1) {
          this.grid[r][c] = 1;
          if (this.checkWin(r, c, 1, false)) {
            this.grid[r][c] = 0;
            return -10000 - depth;
          }
          const evalScore = this.minimax(depth - 1, true, alpha, beta);
          this.grid[r][c] = 0;
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  }

  evaluateBoard() {
    let score = 0;
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r][3] === 2) score += 4;
      else if (this.grid[r][3] === 1) score -= 4;
    }

    const checkWindow = (p1, p2, p3, p4) => {
      const window = [p1, p2, p3, p4];
      const aiCount = window.filter(p => p === 2).length;
      const humanCount = window.filter(p => p === 1).length;
      const emptyCount = window.filter(p => p === 0).length;

      if (aiCount === 3 && emptyCount === 1) score += 50;
      else if (aiCount === 2 && emptyCount === 2) score += 10;
      if (humanCount === 3 && emptyCount === 1) score -= 80;
      else if (humanCount === 2 && emptyCount === 2) score -= 15;
    };

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        checkWindow(this.grid[r][c], this.grid[r][c+1], this.grid[r][c+2], this.grid[r][c+3]);
      }
    }
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 3; r++) {
        checkWindow(this.grid[r][c], this.grid[r+1][c], this.grid[r+2][c], this.grid[r+3][c]);
      }
    }
    for (let r = 0; r < this.rows - 3; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        checkWindow(this.grid[r][c], this.grid[r+1][c+1], this.grid[r+2][c+2], this.grid[r+3][c+3]);
      }
    }
    for (let r = 3; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        checkWindow(this.grid[r][c], this.grid[r-1][c+1], this.grid[r-2][c+2], this.grid[r-3][c+3]);
      }
    }
    return score;
  }

  getLowestEmptyRow(c) {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][c] === 0) return r;
    }
    return -1;
  }

  checkWin(r, c, p, recordWin = true) {
    const dirs = [
      [[0, 1], [0, -1]],
      [[1, 0], [-1, 0]],
      [[1, 1], [-1, -1]],
      [[-1, 1], [1, -1]]
    ];

    for (const [d1, d2] of dirs) {
      const cells = [[r, c]];
      let nr = r + d1[0], nc = c + d1[1];
      while (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === p) {
        cells.push([nr, nc]);
        nr += d1[0]; nc += d1[1];
      }
      nr = r + d2[0]; nc = c + d2[1];
      while (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === p) {
        cells.push([nr, nc]);
        nr += d2[0]; nc += d2[1];
      }

      if (cells.length >= 4) {
        if (recordWin) this.winningCells = cells;
        return true;
      }
    }
    return false;
  }

  isBoardFull() {
    return this.grid[0].every(cell => cell !== 0);
  }

  handleWin(winner) {
    this.gameOver = true;
    if (winner === 1) {
      this.p1Wins++;
      if (window.storageManager) window.storageManager.set('c4_wins_p1', this.p1Wins);
    } else {
      this.p2Wins++;
      if (window.storageManager) window.storageManager.set('c4_wins_p2', this.p2Wins);
    }
    const p1El = document.getElementById('c4-p1-wins');
    const p2El = document.getElementById('c4-p2-wins');
    if (p1El) p1El.textContent = this.p1Wins;
    if (p2El) p2El.textContent = this.p2Wins;
    this.updateTurnLabel();
    this.render();

    if (this.app && typeof this.app.showStageOverlay === 'function') {
      const isP1 = winner === 1;
      const title = isP1 ? 'VICTORY' : 'DEFEAT';
      const subtitle = isP1
        ? (this.mode === 'pvp' ? 'Player 1 connected 4!' : 'You connected 4!')
        : (this.mode === 'pvp' ? 'Player 2 connected 4!' : 'Opponent connected 4');
      this.app.showStageOverlay(
        title,
        subtitle,
        [
          { label: 'P1 WINS', val: this.p1Wins },
          { label: 'P2 / AI', val: this.p2Wins },
          { label: 'MODE', val: this.mode === 'ai' ? `AI (${this.aiDifficulty.toUpperCase()})` : '2-PLAYER' }
        ],
        () => this.initGame(),
        { allowReview: true }
      );
    } else {
      if (window.audioController && typeof window.audioController.playSfx === 'function') {
        window.audioController.playSfx(winner === 1 ? 4 : 3);
      }
    }
  }

  handleDraw() {
    this.gameOver = true;
    this.updateTurnLabel();
    this.render();

    if (this.app && typeof this.app.showStageOverlay === 'function') {
      this.app.showStageOverlay(
        'MATCH DRAW',
        'Grid filled',
        [
          { label: 'P1 WINS', val: this.p1Wins },
          { label: 'P2 / AI', val: this.p2Wins },
          { label: 'MODE', val: this.mode === 'ai' ? `AI (${this.aiDifficulty.toUpperCase()})` : '2-PLAYER' }
        ],
        () => this.initGame(),
        { allowReview: true, sfx: 2 }
      );
    } else {
      if (window.audioController && typeof window.audioController.playSfx === 'function') {
        window.audioController.playSfx(2);
      }
    }
  }

  destroy() {
    if (this.boundKeydown) window.removeEventListener('keydown', this.boundKeydown);
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
  }
}

// =========================================================================
// MODULE: Tic-Tac-Toe (Tactics 3)
// =========================================================================
class ModTicTacToe {
  constructor(app) {
    this.app = app;
    this.board = Array(9).fill(null);
    this.turn = 'X';
    this.ruleVariant = '3piece';
    this.mode = 'ai';
    this.aiDifficulty = 'hard';
    this.xPieces = [];
    this.oPieces = [];
    this.gameOver = false;
    this.winningLine = null;
    this.xWins = window.storageManager.get('ttt_wins_x', 0);
    this.oWins = window.storageManager.get('ttt_wins_o', 0);
    this.draws = window.storageManager.get('ttt_draws', 0);
    this.streak = window.storageManager.get('ttt_streak', 0);
    this.boundKeydown = null;
  }

  is3PieceMode() {
    return this.ruleVariant === '3piece';
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    this.mountEl = mountEl;
    this.statsEl = statsEl;
    this.actionsEl = actionsEl;
    this.kbdEl = kbdEl;

    this.renderHeader();
    this.initGame();

    this.boundKeydown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'r' || e.key === 'R') {
        this.initGame();
        return;
      }

      // Check Desktop Numpad keys via e.code
      if (e.code && e.code.startsWith('Numpad')) {
        const numpadMap = {
          'Numpad7': 0, 'Numpad8': 1, 'Numpad9': 2,
          'Numpad4': 3, 'Numpad5': 4, 'Numpad6': 5,
          'Numpad1': 6, 'Numpad2': 7, 'Numpad3': 8
        };
        if (numpadMap[e.code] !== undefined) {
          this.makeMove(numpadMap[e.code]);
          return;
        }
      }

      // Standard top-row number keys 1-9 (1=A1, 2=B1, 3=C1, 4=A2, 5=B2, 6=C2, 7=A3, 8=B3, 9=C3)
      const topRowMap = {
        '1': 0, '2': 1, '3': 2,
        '4': 3, '5': 4, '6': 5,
        '7': 6, '8': 7, '9': 8
      };
      if (topRowMap[e.key] !== undefined) {
        this.makeMove(topRowMap[e.key]);
      }
    };
    window.addEventListener('keydown', this.boundKeydown);
  }

  renderHeader() {
    this.statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">TURN</span><span class="stat-v" id="ttt-turn-label">X (YOU)</span></div>
      <div class="stat-chip"><span class="stat-k">BOT LEVEL</span><span class="stat-v" id="ttt-diff-label">${this.mode === 'pvp' ? '2-PLAYER' : this.aiDifficulty.toUpperCase()}</span></div>
      <div class="stat-chip"><span class="stat-k">P1 WINS</span><span class="stat-v" id="ttt-x-wins">${this.xWins}</span></div>
      <div class="stat-chip"><span class="stat-k">O/AI</span><span class="stat-v" id="ttt-o-wins">${this.oWins}</span></div>
      <div class="stat-chip"><span class="stat-k">STREAK</span><span class="stat-v" id="ttt-streak-chip">${this.streak}</span></div>
    `;

    this.actionsEl.innerHTML = `
      <button class="stage-btn" id="ttt-tut-btn">[?] RULES</button>
      <button class="stage-btn" id="ttt-restart-btn">[R] RESTART</button>
      <select class="stage-btn" id="ttt-rule-select" style="padding: 4px 6px;">
        <option value="3piece" ${this.ruleVariant === '3piece' ? 'selected' : ''}>RULE: 3-PIECE LIMIT</option>
        <option value="classic" ${this.ruleVariant === 'classic' ? 'selected' : ''}>RULE: CLASSIC</option>
      </select>
      <select class="stage-btn" id="ttt-mode-select" style="padding: 4px 6px;">
        <option value="ai" ${this.mode === 'ai' ? 'selected' : ''}>vs AI BOT</option>
        <option value="pvp" ${this.mode === 'pvp' ? 'selected' : ''}>2-PLAYER (LOCAL)</option>
      </select>
      <select class="stage-btn" id="ttt-diff-select" style="padding: 4px 6px;" ${this.mode === 'pvp' ? 'disabled' : ''}>
        <option value="easy" ${this.aiDifficulty === 'easy' ? 'selected' : ''}>AI: EASY</option>
        <option value="medium" ${this.aiDifficulty === 'medium' ? 'selected' : ''}>AI: MEDIUM</option>
        <option value="hard" ${this.aiDifficulty === 'hard' ? 'selected' : ''}>AI: HARD</option>
      </select>
    `;

    this.kbdEl.innerHTML = `
      <span><kbd>1-9</kbd> / <kbd>NUMPAD</kbd> PLACE PIECE</span>
      <span><kbd>R</kbd> RESTART</span>
      <span><kbd>?</kbd> TUTORIAL</span>
    `;

    document.getElementById('ttt-tut-btn').onclick = () => this.app.openTutorial('tictactoe');
    document.getElementById('ttt-restart-btn').onclick = () => this.initGame();

    document.getElementById('ttt-rule-select').onchange = (e) => {
      this.ruleVariant = e.target.value;
      this.initGame();
    };

    document.getElementById('ttt-mode-select').onchange = (e) => {
      this.mode = e.target.value;
      const diffSel = document.getElementById('ttt-diff-select');
      if (diffSel) diffSel.disabled = this.mode === 'pvp';
      const diffLabel = document.getElementById('ttt-diff-label');
      if (diffLabel) diffLabel.textContent = this.mode === 'pvp' ? '2-PLAYER' : this.aiDifficulty.toUpperCase();
      this.initGame();
    };

    document.getElementById('ttt-diff-select').onchange = (e) => {
      this.aiDifficulty = e.target.value;
      const diffLabel = document.getElementById('ttt-diff-label');
      if (diffLabel) diffLabel.textContent = this.aiDifficulty.toUpperCase();
      this.initGame();
    };
  }

  initGame() {
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
    this.board = Array(9).fill(null);
    this.xPieces = [];
    this.oPieces = [];
    this.turn = 'X';
    this.gameOver = false;
    this.winningLine = null;
    this.render();
    if (window.audioController && typeof window.audioController.playSfx === 'function') {
      window.audioController.playSfx(0);
    }
  }

  render() {
    const coords = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];
    let statusText = '';
    let modeTag = '';

    if (this.gameOver) {
      if (this.winningLine) {
        statusText = this.turn === 'X' ? 'VICTORY! PLAYER (X) WINS' : (this.mode === 'ai' ? `AI BOT (${this.aiDifficulty.toUpperCase()}) WINS` : 'PLAYER 2 (O) WINS');
      } else {
        statusText = 'STALEMATE // DRAW GAME';
      }
    } else if (this.is3PieceMode()) {
      if (this.turn === 'X') {
        if (this.xPieces.length < 3) {
          statusText = `PLAYER 1 [X] // PLACE PIECE (${this.xPieces.length + 1} OF 3)`;
        } else {
          statusText = `PLAYER 1 [X] // 3 PIECES REACHED (OLDEST AT [${coords[this.xPieces[0]]}] FADES NEXT)`;
        }
      } else {
        if (this.mode === 'ai') {
          statusText = `AI BOT [${this.aiDifficulty.toUpperCase()}] // CALCULATING MOVE...`;
        } else {
          if (this.oPieces.length < 3) {
            statusText = `PLAYER 2 [O] // PLACE PIECE (${this.oPieces.length + 1} OF 3)`;
          } else {
            statusText = `PLAYER 2 [O] // 3 PIECES REACHED (OLDEST AT [${coords[this.oPieces[0]]}] FADES NEXT)`;
          }
        }
      }
    } else if (this.turn === 'X') {
      statusText = 'PLAYER 1 [X] // YOUR TURN';
    } else {
      statusText = this.mode === 'ai' ? `AI BOT [${this.aiDifficulty.toUpperCase()}] // CALCULATING MOVE...` : 'PLAYER 2 [O] // TURN';
    }

    if (this.mode === 'pvp') {
      modeTag = `2P [${this.is3PieceMode() ? '3-PIECE' : 'CLASSIC'}]`;
    } else {
      modeTag = `AI: ${this.aiDifficulty.toUpperCase()} [${this.is3PieceMode() ? '3-PIECE' : 'CLASSIC'}]`;
    }

    const html = `
      <div class="ttt-container">
        <div class="ttt-status-banner">
          <div class="ttt-active-player">
            <span class="ttt-pulse-dot" style="${this.gameOver ? 'background:#ef4444; animation:none;' : ''}"></span>
            <span id="ttt-active-txt">${statusText}</span>
          </div>
          <span class="ttt-mode-pill">${modeTag}</span>
        </div>

        <div class="ttt-board-wrap">
          <div class="ttt-col-headers">
            <span class="ttt-header-spacer"></span>
            <div class="ttt-col-labels">
              <span>A</span><span>B</span><span>C</span>
            </div>
          </div>
          <div class="ttt-grid-container">
            <div class="ttt-row-headers">
              <span>1</span><span>2</span><span>3</span>
            </div>
            <div class="ttt-board">
              ${this.board.map((cell, idx) => {
                const isWin = this.winningLine && this.winningLine.includes(idx);
                const markClass = cell === 'X' ? 'x-mark' : (cell === 'O' ? 'o-mark' : '');
                let badge = '';
                let isOldest = false;

                if (this.is3PieceMode()) {
                  if (cell === 'X') {
                    const pIdx = this.xPieces.indexOf(idx);
                    if (pIdx !== -1) {
                      isOldest = (this.turn === 'X' && pIdx === 0 && this.xPieces.length === 3);
                      badge = isOldest ? '1 (FADES)' : `#${pIdx + 1}`;
                    }
                  } else if (cell === 'O') {
                    const pIdx = this.oPieces.indexOf(idx);
                    if (pIdx !== -1) {
                      isOldest = (this.turn === 'O' && pIdx === 0 && this.oPieces.length === 3);
                      badge = isOldest ? '1 (FADES)' : `#${pIdx + 1}`;
                    }
                  }
                }

                return `
                  <button class="ttt-cell ${markClass} ${isWin ? 'winning' : ''} ${isOldest ? 'oldest-piece' : ''}" data-idx="${idx}" ${cell || this.gameOver ? 'disabled' : ''}>
                    <span class="ttt-cell-coord">${coords[idx]}</span>
                    ${cell || ''}
                    ${badge ? `<span class="ttt-piece-badge">${badge}</span>` : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="ttt-scoreboard">
          <div class="ttt-score-item">
            <span class="ttt-score-label">PLAYER (X)</span>
            <span class="ttt-score-val" id="ttt-x-score">${this.xWins}</span>
          </div>
          <div class="ttt-score-item">
            <span class="ttt-score-label">${this.mode === 'ai' ? `AI BOT (${this.aiDifficulty.toUpperCase()})` : 'PLAYER 2 (O)'}</span>
            <span class="ttt-score-val" id="ttt-o-score">${this.oWins}</span>
          </div>
          <div class="ttt-score-item">
            <span class="ttt-score-label">DRAWS</span>
            <span class="ttt-score-val" id="ttt-draw-score">${this.draws}</span>
          </div>
          <div class="ttt-score-item">
            <span class="ttt-score-label">WIN STREAK</span>
            <span class="ttt-score-val" style="color:var(--color-accent);" id="ttt-streak-val">${this.streak}</span>
          </div>
        </div>
      </div>
    `;

    this.mountEl.innerHTML = html;
    this.mountEl.querySelectorAll('.ttt-cell').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        this.makeMove(idx);
      };
    });
  }

  makeMove(idx) {
    if (this.board[idx] || this.gameOver) return;
    if (this.mode === 'ai' && this.turn === 'O') return;

    if (this.is3PieceMode()) {
      const pieces = this.turn === 'X' ? this.xPieces : this.oPieces;
      if (pieces.length >= 3) {
        const removed = pieces.shift();
        this.board[removed] = null;
      }
      pieces.push(idx);
      this.board[idx] = this.turn;
      window.audioController.playSfx(0);

      const win = this.checkWin(this.board, this.turn);
      if (win) {
        this.handleWin(this.turn, win);
        return;
      }

      this.turn = this.turn === 'X' ? 'O' : 'X';
      this.render();

      if (this.mode === 'ai' && this.turn === 'O') {
        setTimeout(() => this.runAIMove(), 180);
      }
      return;
    }

    // Classic mode
    this.board[idx] = this.turn;
    window.audioController.playSfx(0);

    const win = this.checkWin(this.board, this.turn);
    if (win) {
      this.handleWin(this.turn, win);
      return;
    }

    if (this.board.every(c => c !== null)) {
      this.handleDraw();
      return;
    }

    this.turn = this.turn === 'X' ? 'O' : 'X';
    this.render();

    if (this.mode === 'ai' && this.turn === 'O') {
      setTimeout(() => this.runAIMove(), 180);
    }
  }

  runAIMove() {
    if (this.gameOver) return;

    let idx = -1;
    if (this.is3PieceMode()) {
      idx = this.get3PieceMoveByDifficulty();
      if (idx === -1) return;

      if (this.oPieces.length >= 3) {
        const removed = this.oPieces.shift();
        this.board[removed] = null;
      }
      this.oPieces.push(idx);
      this.board[idx] = 'O';
    } else {
      idx = this.getClassicMoveByDifficulty();
      if (idx === -1) return;

      this.board[idx] = 'O';
    }

    window.audioController.playSfx(0);

    const win = this.checkWin(this.board, 'O');
    if (win) {
      this.handleWin('O', win);
      return;
    }

    if (!this.is3PieceMode() && this.board.every(c => c !== null)) {
      this.handleDraw();
      return;
    }

    this.turn = 'X';
    this.render();
  }

  getClassicMoveByDifficulty() {
    const empty = [];
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) empty.push(i);
    }
    if (!empty.length) return -1;

    // EASY: 70% random, 30% immediate win
    if (this.aiDifficulty === 'easy') {
      if (Math.random() < 0.3) {
        const winMove = this.findImmediateWinningMove(this.board, 'O', empty);
        if (winMove !== -1) return winMove;
      }
      return empty[Math.floor(Math.random() * empty.length)];
    }

    // MEDIUM: 100% immediate win, 80% block opponent, else center/corner/random
    if (this.aiDifficulty === 'medium') {
      const winMove = this.findImmediateWinningMove(this.board, 'O', empty);
      if (winMove !== -1) return winMove;

      if (Math.random() < 0.8) {
        const blockMove = this.findImmediateWinningMove(this.board, 'X', empty);
        if (blockMove !== -1) return blockMove;
      }

      if (!this.board[4] && Math.random() < 0.6) return 4;

      const corners = [0, 2, 6, 8].filter(c => !this.board[c]);
      if (corners.length && Math.random() < 0.5) {
        return corners[Math.floor(Math.random() * corners.length)];
      }

      return empty[Math.floor(Math.random() * empty.length)];
    }

    // HARD: Master Minimax (Unbeatable)
    return this.getBestMove();
  }

  findImmediateWinningMove(board, player, emptyList) {
    for (const idx of emptyList) {
      board[idx] = player;
      const won = this.checkWin(board, player);
      board[idx] = null;
      if (won) return idx;
    }
    return -1;
  }

  get3PieceMoveByDifficulty() {
    const empty = [];
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) empty.push(i);
    }
    if (!empty.length) return -1;

    // EASY: 70% random, 30% immediate win
    if (this.aiDifficulty === 'easy') {
      if (Math.random() < 0.3) {
        for (const idx of empty) {
          const simB = [...this.board];
          const simO = [...this.oPieces];
          if (simO.length >= 3) {
            const rem = simO.shift();
            simB[rem] = null;
          }
          simO.push(idx);
          simB[idx] = 'O';
          if (this.checkWin(simB, 'O')) return idx;
        }
      }
      return empty[Math.floor(Math.random() * empty.length)];
    }

    // MEDIUM: 100% immediate win, 80% block, center preference
    if (this.aiDifficulty === 'medium') {
      // 1. Immediate win
      for (const idx of empty) {
        const simB = [...this.board];
        const simO = [...this.oPieces];
        if (simO.length >= 3) {
          const rem = simO.shift();
          simB[rem] = null;
        }
        simO.push(idx);
        simB[idx] = 'O';
        if (this.checkWin(simB, 'O')) return idx;
      }

      // 2. Immediate block (80% chance)
      if (Math.random() < 0.8) {
        for (const idx of empty) {
          const simB = [...this.board];
          const simX = [...this.xPieces];
          if (simX.length >= 3) {
            const rem = simX.shift();
            simB[rem] = null;
          }
          simX.push(idx);
          simB[idx] = 'X';
          if (this.checkWin(simB, 'X')) {
            const testB = [...this.board];
            const testO = [...this.oPieces];
            if (testO.length >= 3) {
              const rem = testO.shift();
              testB[rem] = null;
            }
            testO.push(idx);
            testB[idx] = 'O';
            if (!this.checkWin(testB, 'X')) return idx;
          }
        }
      }

      if (!this.board[4] && Math.random() < 0.6) return 4;

      return empty[Math.floor(Math.random() * empty.length)];
    }

    // HARD: Master 3-Piece Minimax Search with alpha-beta pruning
    return this.getBestMove3Piece();
  }

  getBestMove3Piece() {
    const emptyIndices = [];
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) emptyIndices.push(i);
    }
    if (!emptyIndices.length) return -1;

    // 1. Immediate winning move for O
    for (const idx of emptyIndices) {
      const simB = [...this.board];
      const simO = [...this.oPieces];
      if (simO.length >= 3) {
        const rem = simO.shift();
        simB[rem] = null;
      }
      simO.push(idx);
      simB[idx] = 'O';
      if (this.checkWin(simB, 'O')) {
        return idx;
      }
    }

    // 2. Urgent defensive block against X's immediate win
    for (const idx of emptyIndices) {
      const simB = [...this.board];
      const simX = [...this.xPieces];
      if (simX.length >= 3) {
        const rem = simX.shift();
        simB[rem] = null;
      }
      simX.push(idx);
      simB[idx] = 'X';
      if (this.checkWin(simB, 'X')) {
        const testB = [...this.board];
        const testO = [...this.oPieces];
        if (testO.length >= 3) {
          const rem = testO.shift();
          testB[rem] = null;
        }
        testO.push(idx);
        testB[idx] = 'O';
        if (!this.checkWin(testB, 'X')) {
          return idx;
        }
      }
    }

    // 3. Minimax heuristic search (depth 4)
    let bestScore = -Infinity;
    let bestMove = emptyIndices[0];

    for (const idx of emptyIndices) {
      const simB = [...this.board];
      const simO = [...this.oPieces];
      if (simO.length >= 3) {
        const rem = simO.shift();
        simB[rem] = null;
      }
      simO.push(idx);
      simB[idx] = 'O';

      if (this.checkWin(simB, 'X')) continue;

      const score = this.minimax3Piece(simB, this.xPieces, simO, 0, false, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }

    return bestMove;
  }

  minimax3Piece(board, xPieces, oPieces, depth, isMaximizing, alpha, beta) {
    if (this.checkWin(board, 'O')) return 100 - depth;
    if (this.checkWin(board, 'X')) return depth - 100;
    if (depth >= 4) {
      return this.eval3PieceHeuristic(board);
    }

    const emptyIndices = [];
    for (let i = 0; i < 9; i++) {
      if (!board[i]) emptyIndices.push(i);
    }
    if (!emptyIndices.length) return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const idx of emptyIndices) {
        const simB = [...board];
        const simO = [...oPieces];
        if (simO.length >= 3) {
          const rem = simO.shift();
          simB[rem] = null;
        }
        simO.push(idx);
        simB[idx] = 'O';
        const score = this.minimax3Piece(simB, xPieces, simO, depth + 1, false, alpha, beta);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const idx of emptyIndices) {
        const simB = [...board];
        const simX = [...xPieces];
        if (simX.length >= 3) {
          const rem = simX.shift();
          simB[rem] = null;
        }
        simX.push(idx);
        simB[idx] = 'X';
        const score = this.minimax3Piece(simB, simX, oPieces, depth + 1, true, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  eval3PieceHeuristic(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    let score = 0;
    for (const line of lines) {
      const oCount = line.filter(i => board[i] === 'O').length;
      const xCount = line.filter(i => board[i] === 'X').length;
      if (oCount === 2 && xCount === 0) score += 10;
      if (xCount === 2 && oCount === 0) score -= 10;
      if (board[4] === 'O') score += 3;
      if (board[4] === 'X') score -= 3;
    }
    return score;
  }

  getBestMove() {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) {
        this.board[i] = 'O';
        const score = this.minimax(this.board, 0, false);
        this.board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  minimax(board, depth, isMaximizing) {
    if (this.checkWin(board, 'O')) return 10 - depth;
    if (this.checkWin(board, 'X')) return depth - 10;
    if (board.every(c => c !== null)) return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'O';
          maxScore = Math.max(maxScore, this.minimax(board, depth + 1, false));
          board[i] = null;
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'X';
          minScore = Math.min(minScore, this.minimax(board, depth + 1, true));
          board[i] = null;
        }
      }
      return minScore;
    }
  }

  checkWin(board, player) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const line of lines) {
      if (line.every(i => board[i] === player)) return line;
    }
    return null;
  }

  handleWin(winner, line) {
    this.gameOver = true;
    this.winningLine = line;
    if (winner === 'X') {
      this.xWins++;
      this.streak++;
      if (window.storageManager) {
        window.storageManager.set('ttt_wins_x', this.xWins);
        window.storageManager.set('ttt_streak', this.streak);
      }
    } else {
      this.oWins++;
      this.streak = 0;
      if (window.storageManager) {
        window.storageManager.set('ttt_wins_o', this.oWins);
        window.storageManager.set('ttt_streak', 0);
      }
    }
    this.render();

    if (this.app && typeof this.app.showStageOverlay === 'function') {
      const isPlayerWin = winner === 'X';
      const title = isPlayerWin ? 'VICTORY' : 'DEFEAT';
      const subtitle = isPlayerWin
        ? (this.mode === 'pvp' ? 'Player 1 (X) won the match!' : '3-in-a-row achieved')
        : (this.mode === 'pvp' ? 'Player 2 (O) won the match!' : 'Opponent took the line');
      this.app.showStageOverlay(
        title,
        subtitle,
        [
          { label: 'P1 (X) WINS', val: this.xWins },
          { label: 'O / AI WINS', val: this.oWins },
          { label: 'STREAK', val: this.streak },
          { label: 'MODE', val: this.mode === 'pvp' ? '2-PLAYER' : this.aiDifficulty.toUpperCase() }
        ],
        () => this.initGame(),
        { allowReview: true }
      );
    } else {
      if (window.audioController && typeof window.audioController.playSfx === 'function') {
        window.audioController.playSfx(winner === 'X' ? 4 : 3);
      }
    }
  }

  handleDraw() {
    this.gameOver = true;
    this.draws++;
    if (window.storageManager) {
      window.storageManager.set('ttt_draws', this.draws);
    }
    this.render();

    if (this.app && typeof this.app.showStageOverlay === 'function') {
      this.app.showStageOverlay(
        'MATCH DRAW',
        'Grid locked',
        [
          { label: 'P1 (X) WINS', val: this.xWins },
          { label: 'O / AI WINS', val: this.oWins },
          { label: 'DRAWS', val: this.draws },
          { label: 'STREAK', val: this.streak }
        ],
        () => this.initGame(),
        { allowReview: true, sfx: 2 }
      );
    } else {
      if (window.audioController && typeof window.audioController.playSfx === 'function') {
        window.audioController.playSfx(2);
      }
    }
  }

  destroy() {
    if (this.boundKeydown) window.removeEventListener('keydown', this.boundKeydown);
    if (this.app && typeof this.app.removeStageOverlay === 'function') {
      this.app.removeStageOverlay();
    }
  }
}

// =========================================================================
// MODULE: AI Studio (Local Ollama Terminal & Prompt Engine)
// =========================================================================
class ModAIStudio {
  constructor(app) {
    this.app = app;
    this.ollamaUrl = 'http://localhost:11434';
    this.ollamaStatus = 'checking';
    this.models = ['llama3.1:8b', 'phi4-mini:latest', 'deepseek-r1:8b', 'codellama:latest'];
    this.selectedModel = 'llama3.1:8b';
    this.temperature = 0.7;
    this.messages = [];
    this.isGenerating = false;
    this.abortController = null;
    this.boundKeydown = null;

    try {
      const saved = localStorage.getItem('zenith_ai_messages');
      if (saved) this.messages = JSON.parse(saved);
    } catch (e) {}

    this.presets = [
      {
        id: 'rpg',
        name: 'RPG DUNGEON MASTER',
        system: 'You are an immersive, atmospheric text adventure Dungeon Master. Describe scenes with rich sensory detail in 2 punchy paragraphs. At the end of every turn, provide 3 numbered actions for the player to choose from, or state that they can type their own action. Track player health, status, and inventory.',
        initial: 'Begin our offline adventure. I awaken in a forgotten research facility beneath glacial ice, with an encrypted datapad and a dying emergency beacon.'
      },
      {
        id: 'tutor',
        name: 'OFFLINE ENCYCLOPEDIA & TUTOR',
        system: 'You are an offline academic tutor and expert encyclopedic companion. Explain complex concepts in engineering, mathematics, computer science, and history with clear definitions, bullet points, and practical analogies.',
        initial: 'Explain how the fast Fourier transform (FFT) works and why its O(N log N) complexity is such a massive breakthrough over naive O(N^2) DFT.'
      },
      {
        id: 'story',
        name: 'WORLDBUILDING & STORY',
        system: 'You are a creative writing and worldbuilding partner. Help flesh out lore, character motivations, hard sci-fi systems, or fantasy kingdoms with evocative dialogue and grounded logic.',
        initial: 'Help me design an orbital space station where three conflicting corporate factions govern different pressurized rings.'
      },
      {
        id: 'trivia',
        name: 'OFFLINE PUB TRIVIA',
        system: 'You are a lively pub trivia host. Present questions one at a time across science, history, cinema, and geography. Wait for my answer, score it, provide an interesting trivia tidbit, and keep running track of my score out of 10.',
        initial: 'Welcome me to the offline trivia challenge and hit me with Question 1!'
      },
      {
        id: 'code',
        name: 'CODE & SYSTEMS ARCHITECT',
        system: 'You are a principal systems engineer specialized in Rust, C, WebAssembly, and low-latency algorithms. Review code for cache locality, allocations, concurrency, and performance.',
        initial: 'Analyze the algorithmic trade-offs of a bitboard representation versus a 2D array matrix for board games.'
      }
    ];
  }

  mount(mountEl, statsEl, actionsEl, kbdEl) {
    this.mountEl = mountEl;
    this.statsEl = statsEl;
    this.actionsEl = actionsEl;
    this.kbdEl = kbdEl;

    this.renderHeader();
    this.render();
    this.checkOllamaHealth();
  }

  renderHeader() {
    this.statsEl.innerHTML = `
      <div class="stat-chip"><span class="stat-k">LLM</span><span class="stat-v" id="ai-status-val">CHECKING...</span></div>
      <div class="stat-chip"><span class="stat-k">MESSAGES</span><span class="stat-v" id="ai-msg-count">${this.messages.length}</span></div>
    `;

    this.actionsEl.innerHTML = `
      <button class="stage-btn" id="ai-tut-btn">[?] SETUP GUIDE</button>
      <button class="stage-btn" id="ai-clear-btn">CLEAR CHAT</button>
      <button class="stage-btn" id="ai-export-btn">EXPORT [.MD]</button>
      <select class="stage-btn" id="ai-temp-select" style="padding: 4px 6px;">
        <option value="0.2">PRECISE (0.2)</option>
        <option value="0.7" selected>BALANCED (0.7)</option>
        <option value="1.0">CREATIVE (1.0)</option>
      </select>
    `;

    this.kbdEl.innerHTML = `
      <span><kbd>ENTER</kbd> SEND PROMPT</span>
      <span><kbd>SHIFT+ENTER</kbd> NEWLINE</span>
      <span><kbd>?</kbd> SETUP GUIDE</span>
    `;

    document.getElementById('ai-tut-btn').onclick = () => this.app.openTutorial('aistudio');
    document.getElementById('ai-clear-btn').onclick = () => this.clearChat();
    document.getElementById('ai-export-btn').onclick = () => this.exportMarkdown();
    document.getElementById('ai-temp-select').onchange = (e) => {
      this.temperature = parseFloat(e.target.value);
    };
  }

  async checkOllamaHealth() {
    const statusVal = document.getElementById('ai-status-val');
    try {
      const res = await fetch(`${this.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        this.ollamaStatus = 'online';
        if (data.models && data.models.length > 0) {
          this.models = data.models.map(m => m.name);
          this.selectedModel = this.models[0];
        }
        if (statusVal) {
          statusVal.textContent = 'OLLAMA: ONLINE';
          statusVal.style.color = '#22c55e';
        }
        this.updateModelSelector();
        return;
      }
    } catch (e) {}

    this.ollamaStatus = 'offline';
    if (statusVal) {
      statusVal.textContent = 'OFFLINE MODE';
      statusVal.style.color = '#eab308';
    }
    this.updateModelSelector();
  }

  updateModelSelector() {
    const sel = document.getElementById('ai-model-select');
    const indicator = document.getElementById('ai-status-indicator');
    if (!sel) return;

    if (this.ollamaStatus === 'online') {
      sel.innerHTML = this.models.map(m => `<option value="${m}" ${m === this.selectedModel ? 'selected' : ''}>${m.toUpperCase()}</option>`).join('');
      if (indicator) {
        indicator.innerHTML = `<span class="ai-status-dot"></span> <span>OLLAMA ONLINE (127.0.0.1:11434)</span>`;
      }
    } else {
      sel.innerHTML = `
        <option value="offline-sim" selected>OFFLINE SANDBOX MODE</option>
        ${this.models.map(m => `<option value="${m}">${m.toUpperCase()} (DAEMON STOPPED)</option>`).join('')}
      `;
      if (indicator) {
        indicator.innerHTML = `<span class="ai-status-dot offline"></span> <span>OFFLINE (Run 'ollama serve' in Terminal)</span>`;
      }
    }
  }

  render() {
    const html = `
      <div class="ai-container">
        <div class="ai-toolbar">
          <div class="ai-status-indicator" id="ai-status-indicator">
            <span class="ai-status-dot ${this.ollamaStatus === 'online' ? '' : 'offline'}"></span>
            <span>${this.ollamaStatus === 'online' ? 'OLLAMA ONLINE' : 'CHECKING OLLAMA...'}</span>
          </div>

          <span style="opacity:0.4;">|</span>

          <label style="color:var(--color-text-muted);">MODEL:</label>
          <select class="ai-select" id="ai-model-select">
            <option value="offline-sim">LOADING MODELS...</option>
          </select>

          <span style="opacity:0.4;">|</span>

          <label style="color:var(--color-text-muted);">PRESETS:</label>
          <div class="ai-presets">
            ${this.presets.map(p => `<button class="ai-preset-chip" data-preset="${p.id}">${p.name}</button>`).join('')}
          </div>
        </div>

        <div class="ai-chat-window" id="ai-chat-window">
          ${this.messages.length === 0 ? `
            <div style="margin: auto; text-align: center; color: var(--color-text-muted); max-width: 500px;">
              <h3 style="color: var(--color-text-main); margin-bottom: 0.5rem;">LOCAL AI PROMPT STUDIO</h3>
              <p style="font-size: 0.85rem; line-height: 1.5; margin-bottom: 1rem;">
                Connects directly to your local Ollama daemon without internet. Select a roleplay preset above or type a prompt below.
              </p>
              <div style="font-family: var(--font-mono); font-size: 0.78rem; background: var(--color-bg-hover); padding: 0.75rem; border-radius: 2px; text-align: left; border: 1px solid var(--color-border);">
                <div>$ ollama serve</div>
                <div style="color: var(--color-text-muted); margin-top: 4px;"># Detected models: ${this.models.join(', ')}</div>
              </div>
            </div>
          ` : this.messages.map(m => `
            <div class="ai-msg ${m.role}">
              <span class="ai-msg-role">${m.role}</span>
              <div class="ai-msg-content">${this.formatContent(m.content)}</div>
            </div>
          `).join('')}
        </div>

        <div class="ai-input-bar">
          <textarea class="ai-textarea" id="ai-input" placeholder="Type a prompt or action... (Enter to send, Shift+Enter for newline)"></textarea>
          <button class="stage-btn" id="ai-send-btn" style="min-width: 90px; font-weight: 700;">SEND</button>
        </div>
      </div>
    `;

    this.mountEl.innerHTML = html;
    this.updateModelSelector();
    this.bindEvents();
    this.scrollChatToBottom();
  }

  bindEvents() {
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const modelSel = document.getElementById('ai-model-select');

    if (modelSel) {
      modelSel.onchange = (e) => {
        this.selectedModel = e.target.value;
      };
    }

    if (sendBtn) {
      sendBtn.onclick = () => {
        if (this.isGenerating) {
          this.stopGeneration();
        } else {
          this.handleSend();
        }
      };
    }

    if (input) {
      input.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      };
    }

    this.mountEl.querySelectorAll('.ai-preset-chip').forEach(chip => {
      chip.onclick = () => {
        const pid = chip.getAttribute('data-preset');
        const p = this.presets.find(x => x.id === pid);
        if (p) this.loadPreset(p);
      };
    });
  }

  loadPreset(preset) {
    this.messages = [
      { role: 'system', content: preset.system },
      { role: 'user', content: preset.initial }
    ];
    this.saveMessages();
    this.render();
    window.audioController.playSfx(0);
    this.generateResponse();
  }

  handleSend() {
    const input = document.getElementById('ai-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || this.isGenerating) return;

    input.value = '';
    this.messages.push({ role: 'user', content: text });
    this.saveMessages();
    this.render();
    window.audioController.playSfx(0);
    this.generateResponse();
  }

  async generateResponse() {
    this.isGenerating = true;
    const sendBtn = document.getElementById('ai-send-btn');
    if (sendBtn) {
      sendBtn.textContent = 'STOP';
      sendBtn.style.color = '#dc2626';
    }

    const assistantMsg = { role: 'assistant', content: '' };
    this.messages.push(assistantMsg);

    const chatWindow = document.getElementById('ai-chat-window');
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-msg assistant';
    msgEl.innerHTML = `<span class="ai-msg-role">assistant</span><div class="ai-msg-content"></div>`;
    if (chatWindow) {
      chatWindow.appendChild(msgEl);
      this.scrollChatToBottom();
    }
    const contentEl = msgEl.querySelector('.ai-msg-content');

    if (this.selectedModel === 'offline-sim' || this.ollamaStatus === 'offline') {
      await this.runSimulatedResponse(contentEl, assistantMsg);
      this.finishGeneration();
      return;
    }

    this.abortController = new AbortController();
    try {
      const res = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.selectedModel,
          messages: this.messages.filter(m => m.content),
          stream: true,
          options: { temperature: this.temperature }
        }),
        signal: this.abortController.signal
      });

      if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
              assistantMsg.content += parsed.message.content;
              if (contentEl) contentEl.innerHTML = this.formatContent(assistantMsg.content);
              this.scrollChatToBottom();
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        assistantMsg.content = `[Connection Error: Could not reach Ollama at ${this.ollamaUrl}. Make sure 'ollama serve' is running in Terminal.]`;
        if (contentEl) contentEl.innerHTML = this.formatContent(assistantMsg.content);
      }
    }

    this.finishGeneration();
  }

  async runSimulatedResponse(contentEl, assistantMsg) {
    const userPrompt = this.messages[this.messages.length - 2]?.content || '';
    let simText = '';

    if (userPrompt.toLowerCase().includes('adventure') || userPrompt.toLowerCase().includes('ice') || userPrompt.toLowerCase().includes('beacon')) {
      simText = "The emergency terminal clicks to life, amber phosphor scanning across your frostbitten gloves. The bunker air smells of ozone and dead coolant. A primary power circuit hums faintly three levels below.\n\nYour encrypted datapad flashes: FACILITY 07 // ISOLATION LOCK ACTIVE.\n\n1. Splice the emergency relay conduit to restore main door hydraulics.\n2. Access the maintenance terminal to query the orbital survey logs.\n3. Vent the auxiliary corridor and proceed down the stairwell manually.";
    } else {
      simText = `[OFFLINE SANDBOX MODE]\n\nYour prompt: "${userPrompt}"\n\nYou are running in offline sandbox mode because the background Ollama daemon is currently resting.\n\nTo power this with your real neural weights (${this.models.join(', ')}):\n1. Open your terminal\n2. Run: ollama serve\n3. Click anywhere here to resume live streaming generation!`;
    }

    for (let i = 0; i < simText.length; i++) {
      assistantMsg.content += simText[i];
      if (contentEl) contentEl.innerHTML = this.formatContent(assistantMsg.content);
      this.scrollChatToBottom();
      await new Promise(r => setTimeout(r, 12));
    }
  }

  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.finishGeneration();
  }

  finishGeneration() {
    this.isGenerating = false;
    this.saveMessages();
    const sendBtn = document.getElementById('ai-send-btn');
    if (sendBtn) {
      sendBtn.textContent = 'SEND';
      sendBtn.style.color = '';
    }
    const countEl = document.getElementById('ai-msg-count');
    if (countEl) countEl.textContent = this.messages.length;
  }

  saveMessages() {
    try {
      localStorage.setItem('zenith_ai_messages', JSON.stringify(this.messages));
    } catch (e) {}
  }

  clearChat() {
    this.messages = [];
    try {
      localStorage.removeItem('zenith_ai_messages');
    } catch (e) {}
    this.render();
    window.audioController.playSfx(0);
  }

  exportMarkdown() {
    if (this.messages.length === 0) return;
    let md = `# ZENITH // AI STUDIO TRANSCRIPT\n\nDate: ${new Date().toISOString()}\nModel: ${this.selectedModel}\n\n---\n\n`;
    for (const m of this.messages) {
      md += `### ${m.role.toUpperCase()}\n\n${m.content}\n\n---\n\n`;
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenith_ai_transcript_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    window.audioController.playSfx(4);
  }

  formatContent(text) {
    if (!text) return '';
    let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return s;
  }

  scrollChatToBottom() {
    const el = document.getElementById('ai-chat-window');
    if (el) el.scrollTop = el.scrollHeight;
  }

  destroy() {
    if (this.isGenerating && this.abortController) {
      this.abortController.abort();
    }
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App, MODULES, TUTORIALS };
}
