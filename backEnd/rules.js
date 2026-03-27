function isValidMove(startRow, startCol, endRow, endCol, player){
    if (!isInBoard(endRow, endCol)){
        return false

    } else if (!isFreeCell(board, endRow, endCol)){
        return false 

    } else if (!isPlayerPiece(board, startRow, startCol, player)){
        return false
    }
    
    const isValidSimple = isGoodDirection(startRow, startCol, endRow, endCol, player);
    const isValidEat = isAEatMove(board, startRow, startCol, endRow, endCol, player);

    if (!isValidSimple && !isValidEat) {
        return false;
    }

    return true;
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

function isAEatMove(board, startRow, startCol, endRow, endCol, player){
    const isMovingLeft = (endCol === startCol - 2);
    const isMovingRight = (endCol === startCol + 2);
    const isValidColumnMove = isMovingLeft || isMovingRight;

    if (!isValidColumnMove) {
        return false;
    }

    const victimRow = (startRow + endRow) / 2;
    const victimCol = (startCol + endCol) / 2;

    const opponentOwner = (player === 1) ? 2 : 1;
    if (board[victimRow][victimCol] !== opponentOwner) {
        return false;
    }

    if (player === 1) {
        return endRow === startRow - 2;
    } 
    
    if (player === 2) {
        return endRow === startRow + 2;
    }

    return false;
}

function arrivingAtLastRow(endRow, player){
    if (player === 1 && endRow === 0){
        return true;
    } else if (player === 2 && endRow === 9){
        return true;
    } else {
        return false;
    }
}