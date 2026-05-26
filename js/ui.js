const ui = {
    board: document.getElementById("board"),
    scoreDiv: document.getElementById("score"),
    turnDiv: document.getElementById("turn"),
    leaderboardTableBody: document.querySelector("#leaderboard-table tbody"),
    savedGamesTableBody: document.querySelector("#saved-games-table tbody"),
    detailedAnalysisView: document.getElementById("detailed-analysis-view"),
    davContent: document.getElementById("dav-content"),
    messageRegion: document.getElementById("message-region"),
    messageTimer: null,

    renderBoard(boardState) {
        ui.board.innerHTML = "";
        boardState.forEach((row, r) => {
            row.forEach((cell, c) => {
                const tile = document.createElement("button");
                tile.className = "tile";
                tile.type = "button";
                tile.dataset.row = String(r);
                tile.dataset.col = String(c);
                tile.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}`);

                if (cell !== 0) {
                    const piece = document.createElement("span");
                    piece.className = `piece ${cell === -1 ? "black-piece" : "white-piece"}`;
                    tile.appendChild(piece);
                }

                ui.board.appendChild(tile);
            });
        });
    },

    updateScore(score) {
        ui.scoreDiv.textContent = `Black: ${score.black} | White: ${score.white}`;
    },

    updateTurn(player, isPlayerTurn, isGameOver) {
        if (isGameOver) {
            ui.turnDiv.textContent = "Game Over";
            return;
        }
        const turnColor = player === -1 ? "Black" : "White";
        ui.turnDiv.textContent = isPlayerTurn ? `Your Turn (${turnColor})` : `AI is thinking... (${turnColor})`;
    },

    showValidMoves(moves) {
        document.querySelectorAll(".valid-move-indicator").forEach((el) => el.remove());
        moves.forEach(([r, c]) => {
            const tile = ui.board.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (!tile) return;
            const indicator = document.createElement("span");
            indicator.className = "valid-move-indicator";
            tile.appendChild(indicator);
        });
    },

    clearAnalysis() {
        document.querySelectorAll(".analysis-score").forEach((el) => el.remove());
        document.querySelectorAll(".tile").forEach((tile) => {
            tile.classList.remove("analysis-very-good", "analysis-good", "analysis-neutral", "analysis-bad", "analysis-very-bad");
        });
    },

    showAnalysis(analysis) {
        ui.clearAnalysis();
        const scores = Object.values(analysis);
        if (scores.length === 0) return;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const range = maxScore - minScore;

        for (const move in analysis) {
            const [r, c] = move.split(",");
            const score = analysis[move];
            const tile = ui.board.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (!tile) continue;

            const scoreDiv = document.createElement("span");
            scoreDiv.className = "analysis-score";
            scoreDiv.textContent = score.toFixed(1);

            const normalized = range > 0 ? (score - minScore) / range : 0.5;
            if (normalized >= 0.8) tile.classList.add("analysis-very-good");
            else if (normalized >= 0.6) tile.classList.add("analysis-good");
            else if (normalized >= 0.4) tile.classList.add("analysis-neutral");
            else if (normalized >= 0.2) tile.classList.add("analysis-bad");
            else tile.classList.add("analysis-very-bad");

            tile.appendChild(scoreDiv);
        }
    },

    clearHighlights() {
        document.querySelectorAll(".last-move-player, .flipped-player, .last-move-ai, .flipped-ai").forEach((el) => {
            el.classList.remove("last-move-player", "flipped-player", "last-move-ai", "flipped-ai");
        });
    },

    highlightMove(move, flippedPieces, isPlayer) {
        ui.clearHighlights();
        if (move) {
            const [row, col] = move;
            const tile = ui.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (tile) tile.classList.add(isPlayer ? "last-move-player" : "last-move-ai");
        }
        flippedPieces.forEach(([r, c]) => {
            const tile = ui.board.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (tile) tile.classList.add(isPlayer ? "flipped-player" : "flipped-ai");
        });
    },

    toggleDetailedAnalysisView(show) {
        ui.detailedAnalysisView.classList.toggle("hidden", !show);
    },

    renderDetailedAnalysis(data) {
        if (!data) {
            ui.davContent.innerHTML = "";
            return;
        }
        ui.davContent.innerHTML = `
            <h3>${data.title}</h3>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Strategy:</strong> ${data.strategy}</p>
        `;
    },

    renderLeaderboard(data) {
        ui.leaderboardTableBody.innerHTML = "";
        if (data.length === 0) {
            ui.leaderboardTableBody.innerHTML = '<tr><td colspan="6">No games completed yet.</td></tr>';
            return;
        }
        data.forEach((entry, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.username}</td>
                <td>${entry.wins}</td>
                <td>${entry.losses}</td>
                <td>${entry.draws}</td>
                <td>${entry.total_points}</td>
            `;
            ui.leaderboardTableBody.appendChild(row);
        });
    },

    renderSavedGames(savedGames) {
        ui.savedGamesTableBody.innerHTML = "";
        if (savedGames.length === 0) {
            ui.savedGamesTableBody.innerHTML = '<tr><td colspan="3">No saved games found.</td></tr>';
            return;
        }
        savedGames.forEach((game) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${game.name}</td>
                <td>${new Date(game.timestamp).toLocaleString()}</td>
                <td>
                    <button class="load-btn" data-id="${game.id}" type="button">Load</button>
                    <button class="delete-btn" data-id="${game.id}" type="button">Delete</button>
                </td>
            `;
            ui.savedGamesTableBody.appendChild(row);
        });
    },

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.toggle("hidden", !show);
    },

    displayMessage(message) {
        clearTimeout(ui.messageTimer);
        ui.messageRegion.textContent = message;
        ui.messageRegion.classList.add("visible");
        ui.messageTimer = setTimeout(() => {
            ui.messageRegion.classList.remove("visible");
        }, 2600);
    },
};
