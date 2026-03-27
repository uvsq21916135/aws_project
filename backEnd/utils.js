function switchPlayer() {
    if (currentPlayer === 1) {
        currentPlayer = 2;
    } else {
        currentPlayer = 1;
    }
}

function removePiece(board, row, col) {
    board[row][col] = 0;
}

function transformIntoQueen(board, row, col, player) {
    if (player === 1) {
        board[row][col] = 3;
    } else if (player === 2) {
        board[row][col] = 4;
    }
}