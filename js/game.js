(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    root.OthelloEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    const BLACK = -1;
    const WHITE = 1;
    const EMPTY = 0;
    const SIZE = 8;
    const DIRECTIONS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
    ];

    function createInitialBoard() {
        const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
        board[3][3] = WHITE;
        board[3][4] = BLACK;
        board[4][3] = BLACK;
        board[4][4] = WHITE;
        return board;
    }

    function cloneBoard(board) {
        return board.map((row) => row.slice());
    }

    function inBounds(row, col) {
        return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
    }

    function getFlips(board, row, col, player) {
        if (!inBounds(row, col) || board[row][col] !== EMPTY) return [];
        const flips = [];

        for (const [dr, dc] of DIRECTIONS) {
            let r = row + dr;
            let c = col + dc;
            const line = [];

            while (inBounds(r, c) && board[r][c] === -player) {
                line.push([r, c]);
                r += dr;
                c += dc;
            }

            if (line.length > 0 && inBounds(r, c) && board[r][c] === player) {
                flips.push(...line);
            }
        }

        return flips;
    }

    function isValidMove(board, row, col, player) {
        return getFlips(board, row, col, player).length > 0;
    }

    function getValidMoves(board, player) {
        const moves = [];
        for (let row = 0; row < SIZE; row += 1) {
            for (let col = 0; col < SIZE; col += 1) {
                if (isValidMove(board, row, col, player)) moves.push([row, col]);
            }
        }
        return moves;
    }

    function makeMove(board, row, col, player) {
        const flips = getFlips(board, row, col, player);
        if (flips.length === 0) {
            return { ok: false, board: cloneBoard(board), flipped: [] };
        }

        const next = cloneBoard(board);
        next[row][col] = player;
        for (const [r, c] of flips) {
            next[r][c] = player;
        }
        return { ok: true, board: next, flipped: flips };
    }

    function getScore(board) {
        let black = 0;
        let white = 0;
        for (const row of board) {
            for (const value of row) {
                if (value === BLACK) black += 1;
                if (value === WHITE) white += 1;
            }
        }
        return { black, white };
    }

    function isGameOver(board) {
        return getValidMoves(board, BLACK).length === 0 && getValidMoves(board, WHITE).length === 0;
    }

    function evaluateBoard(board, player) {
        const score = getScore(board);
        const pieceScore = player === BLACK ? score.black - score.white : score.white - score.black;
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        let cornerScore = 0;
        for (const [r, c] of corners) {
            if (board[r][c] === player) cornerScore += 8;
            if (board[r][c] === -player) cornerScore -= 8;
        }
        const mobilityScore = getValidMoves(board, player).length - getValidMoves(board, -player).length;
        return pieceScore + cornerScore + mobilityScore;
    }

    function greedyMove(board, player) {
        const moves = getValidMoves(board, player);
        if (moves.length === 0) return null;
        let best = moves[0];
        let bestFlips = -1;
        for (const [row, col] of moves) {
            const flips = getFlips(board, row, col, player).length;
            if (flips > bestFlips) {
                bestFlips = flips;
                best = [row, col];
            }
        }
        return best;
    }

    function minimaxScore(board, depth, player, aiPlayer, maximizing, deadline) {
        if (Date.now() > deadline || depth === 0 || isGameOver(board)) {
            return evaluateBoard(board, aiPlayer);
        }

        const moves = getValidMoves(board, player);
        if (moves.length === 0) {
            return minimaxScore(board, depth - 1, -player, aiPlayer, !maximizing, deadline);
        }

        let best = maximizing ? -Infinity : Infinity;
        for (const [row, col] of moves) {
            const result = makeMove(board, row, col, player);
            const score = minimaxScore(result.board, depth - 1, -player, aiPlayer, !maximizing, deadline);
            best = maximizing ? Math.max(best, score) : Math.min(best, score);
        }
        return best;
    }

    function minimaxMove(board, player, depth, maxMs) {
        const moves = getValidMoves(board, player);
        if (moves.length === 0) return null;
        const deadline = Date.now() + maxMs;
        let best = moves[0];
        let bestScore = -Infinity;

        for (const [row, col] of moves) {
            const result = makeMove(board, row, col, player);
            const score = minimaxScore(result.board, depth - 1, -player, player, false, deadline);
            if (score > bestScore) {
                bestScore = score;
                best = [row, col];
            }
            if (Date.now() > deadline) break;
        }
        return best;
    }

    function alphaBetaScore(board, depth, player, aiPlayer, alpha, beta, maximizing, deadline) {
        if (Date.now() > deadline || depth === 0 || isGameOver(board)) {
            return evaluateBoard(board, aiPlayer);
        }

        const moves = getValidMoves(board, player);
        if (moves.length === 0) {
            return alphaBetaScore(board, depth - 1, -player, aiPlayer, alpha, beta, !maximizing, deadline);
        }

        if (maximizing) {
            let value = -Infinity;
            for (const [row, col] of moves) {
                const result = makeMove(board, row, col, player);
                value = Math.max(value, alphaBetaScore(result.board, depth - 1, -player, aiPlayer, alpha, beta, false, deadline));
                alpha = Math.max(alpha, value);
                if (alpha >= beta || Date.now() > deadline) break;
            }
            return value;
        }

        let value = Infinity;
        for (const [row, col] of moves) {
            const result = makeMove(board, row, col, player);
            value = Math.min(value, alphaBetaScore(result.board, depth - 1, -player, aiPlayer, alpha, beta, true, deadline));
            beta = Math.min(beta, value);
            if (beta <= alpha || Date.now() > deadline) break;
        }
        return value;
    }

    function alphaBetaMove(board, player, depth, maxMs) {
        const moves = getValidMoves(board, player);
        if (moves.length === 0) return null;
        const deadline = Date.now() + maxMs;
        let best = moves[0];
        let alpha = -Infinity;
        const beta = Infinity;

        for (const [row, col] of moves) {
            const result = makeMove(board, row, col, player);
            const score = alphaBetaScore(result.board, depth - 1, -player, player, alpha, beta, false, deadline);
            if (score > alpha) {
                alpha = score;
                best = [row, col];
            }
            if (Date.now() > deadline) break;
        }
        return best;
    }

    function randomChoice(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    function playout(board, currentPlayer, aiPlayer, maxTurns) {
        let state = cloneBoard(board);
        let player = currentPlayer;
        let passes = 0;
        let turns = 0;

        while (passes < 2 && turns < maxTurns) {
            const moves = getValidMoves(state, player);
            if (moves.length === 0) {
                passes += 1;
                player = -player;
                turns += 1;
                continue;
            }
            passes = 0;
            const [row, col] = randomChoice(moves);
            state = makeMove(state, row, col, player).board;
            player = -player;
            turns += 1;
        }

        const score = getScore(state);
        const aiScore = aiPlayer === BLACK ? score.black : score.white;
        const opponentScore = aiPlayer === BLACK ? score.white : score.black;
        if (aiScore > opponentScore) return 1;
        if (aiScore === opponentScore) return 0.5;
        return 0;
    }

    function mctsMove(board, player, iterations) {
        const moves = getValidMoves(board, player);
        if (moves.length === 0) return null;
        const stats = moves.map((move) => ({ move, wins: 0, visits: 0 }));

        for (let i = 0; i < iterations; i += 1) {
            const entry = stats[i % stats.length];
            const result = makeMove(board, entry.move[0], entry.move[1], player);
            entry.wins += playout(result.board, -player, player, 120);
            entry.visits += 1;
        }

        stats.sort((a, b) => (b.wins / b.visits) - (a.wins / a.visits));
        return stats[0].move;
    }

    function chooseMove(board, player, aiLevel) {
        const level = String(aiLevel || "easy").toLowerCase();
        if (level === "medium") return mctsMove(board, player, 220);
        if (level === "hard") return minimaxMove(board, player, 3, 700);
        if (level === "expert") return alphaBetaMove(board, player, 4, 900);
        return greedyMove(board, player);
    }

    function analyzeMoves(board, player, aiLevel) {
        const level = String(aiLevel || "easy").toLowerCase();
        const moves = getValidMoves(board, player);
        const analysis = {};

        for (const [row, col] of moves) {
            const key = `${row},${col}`;
            const result = makeMove(board, row, col, player);
            if (level === "easy") {
                analysis[key] = getFlips(board, row, col, player).length;
            } else if (level === "medium") {
                let wins = 0;
                const iterations = 48;
                for (let i = 0; i < iterations; i += 1) {
                    wins += playout(result.board, -player, player, 120);
                }
                analysis[key] = Math.round((wins / iterations) * 1000) / 10;
            } else {
                analysis[key] = evaluateBoard(result.board, player);
            }
        }

        return analysis;
    }

    function describeAI(aiLevel) {
        const descriptions = {
            easy: {
                title: "Easy (Greedy Algorithm)",
                description: "Chooses the move that flips the most pieces immediately.",
                strategy: "Corners and stable edges beat short-term piece grabs.",
            },
            medium: {
                title: "Medium (Monte Carlo Tree Search)",
                description: "Runs many random game simulations to estimate strong moves.",
                strategy: "Limit mobility and avoid giving away corners.",
            },
            hard: {
                title: "Hard (Minimax Algorithm)",
                description: "Looks ahead several turns and assumes best responses.",
                strategy: "Create positions where several future lines stay good for you.",
            },
            expert: {
                title: "Expert (Minimax with Alpha-Beta Pruning)",
                description: "Searches deeper by pruning branches that cannot improve the result.",
                strategy: "Every tempo matters. Fight for corners, edges, and mobility.",
            },
        };
        return descriptions[String(aiLevel || "easy").toLowerCase()] || descriptions.easy;
    }

    return {
        BLACK,
        WHITE,
        EMPTY,
        SIZE,
        createInitialBoard,
        cloneBoard,
        getFlips,
        isValidMove,
        getValidMoves,
        makeMove,
        getScore,
        isGameOver,
        evaluateBoard,
        chooseMove,
        analyzeMoves,
        describeAI,
    };
});
