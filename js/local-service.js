(function (root, factory) {
    const api = factory(root.OthelloEngine, root.OthelloStorage);
    root.OthelloService = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (engine, storage) {
    let state = null;

    function createState(playerColor, aiLevel) {
        return {
            board: engine.createInitialBoard(),
            currentPlayer: engine.BLACK,
            playerColor: Number(playerColor),
            aiLevel,
            isGameOver: false,
            resultRecorded: false,
            lastMove: null,
            lastFlipped: [],
        };
    }

    function getState() {
        return JSON.parse(JSON.stringify(state));
    }

    function setState(nextState) {
        state = JSON.parse(JSON.stringify(nextState));
        return getState();
    }

    function newGame(options = {}) {
        const settings = storage.getSettings();
        const playerColor = Number(options.playerColor ?? settings.playerColor ?? engine.BLACK);
        const aiLevel = options.aiLevel || settings.aiLevel || "easy";
        storage.setSettings({ playerColor, aiLevel });
        state = createState(playerColor, aiLevel);
        return getState();
    }

    function playerMove(row, col) {
        if (!state || state.isGameOver) throw new Error("Game is over");
        const player = state.playerColor;
        const validMoves = engine.getValidMoves(state.board, player);

        if (validMoves.length === 0) {
            state.currentPlayer = -player;
            return { board: state.board, skipped_turn: "player", game_over: false, score: engine.getScore(state.board), flipped_pieces: [] };
        }

        const result = engine.makeMove(state.board, row, col, player);
        if (!result.ok) throw new Error("Invalid move");

        state.board = result.board;
        state.currentPlayer = -player;
        state.lastMove = [row, col];
        state.lastFlipped = result.flipped;
        state.isGameOver = engine.isGameOver(state.board);
        const score = engine.getScore(state.board);
        if (state.isGameOver) recordResult(score);

        return {
            board: engine.cloneBoard(state.board),
            game_over: state.isGameOver,
            score,
            skipped_turn: null,
            flipped_pieces: result.flipped,
        };
    }

    function aiMove() {
        if (!state || state.isGameOver) throw new Error("Game is over");
        const aiColor = -state.playerColor;
        const validMoves = engine.getValidMoves(state.board, aiColor);

        if (validMoves.length === 0) {
            state.currentPlayer = state.playerColor;
            state.isGameOver = engine.getValidMoves(state.board, state.playerColor).length === 0;
            const score = engine.getScore(state.board);
            if (state.isGameOver) recordResult(score);
            return { board: state.board, ai_move: null, skipped_turn: "ai", game_over: state.isGameOver, score, flipped_pieces: [] };
        }

        const move = engine.chooseMove(state.board, aiColor, state.aiLevel);
        const result = engine.makeMove(state.board, move[0], move[1], aiColor);
        state.board = result.board;
        state.currentPlayer = state.playerColor;
        state.lastMove = move;
        state.lastFlipped = result.flipped;
        state.isGameOver = engine.isGameOver(state.board);
        const score = engine.getScore(state.board);
        if (state.isGameOver) recordResult(score);

        return {
            board: engine.cloneBoard(state.board),
            ai_move: move,
            skipped_turn: null,
            game_over: state.isGameOver,
            score,
            flipped_pieces: result.flipped,
        };
    }

    function analyzeBoard() {
        if (!state || state.isGameOver) return { analysis: {} };
        return { analysis: engine.analyzeMoves(state.board, state.playerColor, state.aiLevel) };
    }

    function passPlayerTurnIfBlocked() {
        if (!state || state.isGameOver) return false;
        if (engine.getValidMoves(state.board, state.playerColor).length > 0) return false;
        state.currentPlayer = -state.playerColor;
        state.isGameOver = engine.isGameOver(state.board);
        const score = engine.getScore(state.board);
        if (state.isGameOver) recordResult(score);
        return true;
    }

    function getAIDescription() {
        return engine.describeAI(state ? state.aiLevel : "easy");
    }

    function saveGame(name) {
        if (!state) throw new Error("No active game");
        const saves = storage.getSaves();
        const save = {
            id: String(Date.now()),
            name,
            timestamp: new Date().toISOString(),
            game_state: getState(),
        };
        saves.unshift(save);
        storage.setSaves(saves.slice(0, 20));
        return save;
    }

    function getSavedGames() {
        return storage.getSaves();
    }

    function loadGame(id) {
        const save = storage.getSaves().find((entry) => entry.id === id);
        if (!save) throw new Error("Save not found");
        setState(save.game_state);
        return getState();
    }

    function deleteGame(id) {
        storage.setSaves(storage.getSaves().filter((entry) => entry.id !== id));
    }

    function getLeaderboard() {
        return storage.getLeaderboard();
    }

    function recordResult(score) {
        if (state.resultRecorded) return;
        state.resultRecorded = true;
        const stats = storage.getStats();
        const playerScore = state.playerColor === engine.BLACK ? score.black : score.white;
        const aiScore = state.playerColor === engine.BLACK ? score.white : score.black;

        if (playerScore > aiScore) stats.wins += 1;
        else if (playerScore < aiScore) stats.losses += 1;
        else stats.draws += 1;

        stats.total_points = (stats.wins * 3) + stats.draws;
        storage.setStats(stats);
    }

    return {
        newGame,
        getState,
        playerMove,
        aiMove,
        analyzeBoard,
        passPlayerTurnIfBlocked,
        getAIDescription,
        saveGame,
        getSavedGames,
        loadGame,
        deleteGame,
        getLeaderboard,
    };
});
