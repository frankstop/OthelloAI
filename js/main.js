document.addEventListener("DOMContentLoaded", () => {
    const service = window.OthelloService;
    const engine = window.OthelloEngine;

    const gameState = {
        isPlayerTurn: true,
    };

    const boardDiv = document.getElementById("board");
    const newGameBtn = document.getElementById("new-game-btn");
    const saveGameBtn = document.getElementById("save-game-btn");
    const loadGameBtn = document.getElementById("load-game-btn");
    const leaderboardBtn = document.getElementById("leaderboard-btn");
    const analysisToggle = document.getElementById("analysis-toggle");
    const detailedAnalysisToggle = document.getElementById("detailed-analysis-toggle");
    const savedGamesTable = document.getElementById("saved-games-table");
    const saveGameForm = document.getElementById("save-game-form");
    const saveNameInput = document.getElementById("save-name");
    const logo = document.getElementById("logo");
    const titleLink = document.getElementById("title-link");

    newGameBtn.addEventListener("click", () => ui.toggleModal("new-game-modal", true));
    saveGameBtn.addEventListener("click", handleSaveGame);
    loadGameBtn.addEventListener("click", showLoadGameModal);
    leaderboardBtn.addEventListener("click", showLeaderboardModal);
    document.addEventListener("click", (event) => {
        if (event.target.closest("#save-game-btn")) handleSaveGame();
    });
    boardDiv.addEventListener("click", handleBoardClick);
    analysisToggle.addEventListener("change", refreshAnalysis);
    detailedAnalysisToggle.addEventListener("change", refreshDetailedAnalysis);
    savedGamesTable.addEventListener("click", handleLoadGameActions);
    document.getElementById("new-game-form").addEventListener("submit", handleNewGame);
    saveGameForm.addEventListener("submit", handleSaveGameSubmit);

    for (const button of document.querySelectorAll(".close-modal-btn")) {
        button.addEventListener("click", () => button.closest(".modal").classList.add("hidden"));
    }

    logo.addEventListener("click", renderCurrentState);
    titleLink.addEventListener("click", renderCurrentState);
    logo.addEventListener("error", () => {
        logo.style.display = "none";
    });

    function init() {
        const state = service.newGame();
        renderState(state);
        maybeTriggerOpeningAi(state);
    }

    function renderState(state) {
        ui.renderBoard(state.board);
        ui.updateScore(engine.getScore(state.board));
        updateGameTurn(state);
    }

    function renderCurrentState() {
        renderState(service.getState());
    }

    function updateGameTurn(state) {
        gameState.isPlayerTurn = !state.isGameOver && state.currentPlayer === state.playerColor;
        ui.updateTurn(state.currentPlayer, gameState.isPlayerTurn, state.isGameOver);
        ui.clearAnalysis();
        if (gameState.isPlayerTurn) {
            ui.showValidMoves(engine.getValidMoves(state.board, state.playerColor));
            if (analysisToggle.checked) refreshAnalysis();
        }
        if (detailedAnalysisToggle.checked) refreshDetailedAnalysis();
    }

    function maybeTriggerOpeningAi(state) {
        if (state.playerColor === engine.WHITE && !state.isGameOver) {
            triggerAiMove();
        }
    }

    async function triggerAiMove() {
        const state = service.getState();
        gameState.isPlayerTurn = false;
        ui.updateTurn(-state.playerColor, false, false);
        await wait(350);

        try {
            const response = service.aiMove();
            const nextState = service.getState();
            ui.renderBoard(nextState.board);
            ui.highlightMove(response.ai_move, response.flipped_pieces, false);
            ui.updateScore(response.score);

            if (response.game_over) {
                handleGameOver(response.score);
                return;
            }

            if (response.skipped_turn === "ai") {
                ui.displayMessage("AI has no valid moves.");
            }

            const playerMoves = engine.getValidMoves(nextState.board, nextState.playerColor);
            if (playerMoves.length === 0 && !nextState.isGameOver) {
                ui.displayMessage("No valid moves. Turn skipped.");
                service.passPlayerTurnIfBlocked();
                updateGameTurn(service.getState());
                await triggerAiMove();
                return;
            }

            updateGameTurn(service.getState());
        } catch (error) {
            ui.displayMessage(`AI move error: ${error.message}`);
            updateGameTurn(service.getState());
        }
    }

    async function handleBoardClick(event) {
        const tile = event.target.closest(".tile");
        if (!tile || !gameState.isPlayerTurn) return;

        const row = Number(tile.dataset.row);
        const col = Number(tile.dataset.col);

        try {
            const response = service.playerMove(row, col);
            const nextState = service.getState();
            ui.renderBoard(nextState.board);
            ui.highlightMove([row, col], response.flipped_pieces, true);
            ui.updateScore(response.score);

            if (response.game_over) {
                handleGameOver(response.score);
                return;
            }

            await triggerAiMove();
        } catch (error) {
            ui.displayMessage(error.message);
            updateGameTurn(service.getState());
        }
    }

    function handleNewGame(event) {
        event.preventDefault();
        const playerColor = Number(document.getElementById("player-color").value);
        const aiLevel = document.getElementById("ai-level").value;
        const state = service.newGame({ playerColor, aiLevel });
        ui.toggleModal("new-game-modal", false);
        renderState(state);
        maybeTriggerOpeningAi(state);
    }

    function refreshAnalysis() {
        ui.clearAnalysis();
        const state = service.getState();
        if (!analysisToggle.checked || state.isGameOver || state.currentPlayer !== state.playerColor) return;
        const response = service.analyzeBoard();
        ui.showAnalysis(response.analysis);
    }

    function refreshDetailedAnalysis() {
        const show = detailedAnalysisToggle.checked;
        ui.toggleDetailedAnalysisView(show);
        if (!show) return;
        ui.renderDetailedAnalysis(service.getAIDescription());
    }

    function handleSaveGame() {
        const saves = service.getSavedGames();
        const defaultName = `Gamesave_${saves.length + 1}`;
        saveNameInput.value = defaultName;
        ui.toggleModal("save-game-modal", true);
        saveNameInput.focus();
    }

    function handleSaveGameSubmit(event) {
        event.preventDefault();
        const name = saveNameInput.value.trim();
        if (!name) return;
        service.saveGame(name);
        ui.toggleModal("save-game-modal", false);
        ui.displayMessage("Game saved.");
    }

    function showLoadGameModal() {
        ui.renderSavedGames(service.getSavedGames());
        ui.toggleModal("load-game-modal", true);
    }

    function handleLoadGameActions(event) {
        const target = event.target;
        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains("load-btn")) {
            const state = service.loadGame(id);
            ui.toggleModal("load-game-modal", false);
            renderState(state);
            ui.displayMessage("Game loaded.");
            return;
        }

        if (target.classList.contains("delete-btn")) {
            service.deleteGame(id);
            ui.renderSavedGames(service.getSavedGames());
            ui.displayMessage("Save deleted.");
        }
    }

    function showLeaderboardModal() {
        ui.renderLeaderboard(service.getLeaderboard());
        ui.toggleModal("leaderboard-modal", true);
    }

    function handleGameOver(score) {
        const state = service.getState();
        const winner = score.black === score.white ? "Draw" : (score.black > score.white ? "Black wins" : "White wins");
        ui.updateTurn(state.currentPlayer, false, true);
        ui.displayMessage(`Game Over. Black ${score.black}, White ${score.white}. ${winner}.`);
    }

    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    init();
});
