function isValidMove(startRow, startCol, endRow, endCol, player){
    if (!isInBoard(endRow, endCol)){
        return false

    } else if (!isFreeCell(board, endRow, endCol)){
        return false 

    } else if (!isPlayerPiece(board, startRow, startCol, player)){
        return false

    } else if (!isGoodDirection(startRow, startCol, endRow, endCol, player)){
        return false

    } else {
        return true
    }
}

function isFreeCell(board, row, col){
    return board[row][col] === 0;
}

function isInBoard(row, col){
    return (row >= 0 && row < ROWS)
        && (col >= 0 && col < COLS);
}

function isPlayerPiece(board, row, col, player){
    return board[row][col] === player
}

function isGoodDirection(startRow, startCol, endRow, endCol, player) {
    const isMovingLeft = (endCol === startCol - 1);
    const isMovingRight = (endCol === startCol + 1);

    const isValidColumnMove = isMovingLeft || isMovingRight;

    if (!isValidColumnMove) {
        return false;
    }

    if (player === 1) {
        return endRow === startRow - 1;
    } 
    
    if (player === 2) {
        return endRow === startRow + 1;
    }

    return false;
}
