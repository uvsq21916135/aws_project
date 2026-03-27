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

function becomeEldenLord(board, row, col, player) {
    board[row][col] = player + 2;
}