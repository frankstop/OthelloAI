const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/game.js");

test("initial board has standard four center pieces", () => {
    const board = engine.createInitialBoard();
    assert.equal(board[3][3], engine.WHITE);
    assert.equal(board[3][4], engine.BLACK);
    assert.equal(board[4][3], engine.BLACK);
    assert.equal(board[4][4], engine.WHITE);
    assert.deepEqual(engine.getScore(board), { black: 2, white: 2 });
});

test("black opening move at 2,3 flips 3,3", () => {
    const board = engine.createInitialBoard();
    const result = engine.makeMove(board, 2, 3, engine.BLACK);
    assert.equal(result.ok, true);
    assert.equal(result.board[2][3], engine.BLACK);
    assert.equal(result.board[3][3], engine.BLACK);
    assert.deepEqual(result.flipped, [[3, 3]]);
    assert.deepEqual(engine.getScore(result.board), { black: 4, white: 1 });
});

test("initial valid moves match Othello rules", () => {
    const board = engine.createInitialBoard();
    assert.deepEqual(engine.getValidMoves(board, engine.BLACK), [[2, 3], [3, 2], [4, 5], [5, 4]]);
    assert.deepEqual(engine.getValidMoves(board, engine.WHITE), [[2, 4], [3, 5], [4, 2], [5, 3]]);
});

test("all AI levels return legal moves from opening position", () => {
    const board = engine.createInitialBoard();
    for (const level of ["easy", "medium", "hard", "expert"]) {
        const move = engine.chooseMove(board, engine.BLACK, level);
        assert.equal(engine.isValidMove(board, move[0], move[1], engine.BLACK), true, level);
    }
});

test("analysis includes only legal opening moves", () => {
    const board = engine.createInitialBoard();
    const analysis = engine.analyzeMoves(board, engine.BLACK, "easy");
    assert.deepEqual(Object.keys(analysis).sort(), ["2,3", "3,2", "4,5", "5,4"]);
    assert.deepEqual(Object.values(analysis), [1, 1, 1, 1]);
});
