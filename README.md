# Othello AI

Othello AI is a browser-playable Othello game with four AI opponents:
Greedy, Monte Carlo Tree Search, Minimax, and Alpha-Beta Pruning.

## Live Site

https://frankstop.github.io/OthelloAI/

## Features

- Play as black or white.
- Choose Easy, Medium, Hard, or Expert AI.
- View move analysis heatmaps.
- Save and load games.
- Track local wins, losses, draws, and points.

## Local Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Tests

```bash
npm test
```
