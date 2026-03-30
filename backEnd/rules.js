function isValidMove(board, startRow, startCol, endRow, endCol, player, raflePiece) {
    if (!isInBoard(endRow, endCol)){
        return false
    }

    if (!isFreeCell(board, endRow, endCol)){
        return false
    }
    if (!isPlayerPiece(board, startRow, startCol, player)){
        return false
    }

    if (raflePiece && (startRow !== raflePiece.row || startCol !== raflePiece.col)) {
        return false; 
    }
    
    const eatMove = isAEatMove(board, startRow, startCol, endRow, endCol, player);
    if (eatMove) return true;

    if (hasPossibleJump(board, player,
        raflePiece ? raflePiece.row : null,
        raflePiece ? raflePiece.col : null)){
        return false;
    }

    if (raflePiece) {
        return false
    }

    return isGoodDirection(board, startRow, startCol, endRow, endCol, player);
}

function isFreeCell(board, row, col){
    return board[row][col] === 0;
}

function isInBoard(row, col){
    return (row >= 0 && row < ROWS) && (col >= 0 && col < COLS);
}

function isPlayerPiece(board, row, col, player){
    return board[row][col] === player || board[row][col] === player + 2;
}

function checkEmptyPath(board, startRow, startCol, endRow, endCol) {
    const rowStep = endRow > startRow ? 1 : -1;
    const colStep = endCol > startCol ? 1 : -1;
    let r = startRow + rowStep;
    let c = startCol + colStep;

    while (r !== endRow && c !== endCol) {
        if (board[r][c] !== 0) return false;
        r += rowStep;
        c += colStep;
    }
    return true;
}

function isGoodDirection(board, startRow, startCol, endRow, endCol, player) {
    const isDame = board[startRow][startCol] === player + 2;
    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;

    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;

    if (isDame) {
        return checkEmptyPath(board, startRow, startCol, endRow, endCol);
    } else {
        if (Math.abs(colDiff) !== 1) return false;
        if (player === 1) return rowDiff === -1;
        if (player === 2) return rowDiff === 1;
    }
    return false;
}

function isAEatMove(board, startRow, startCol, endRow, endCol, player) {
    const isDame = board[startRow][startCol] === player + 2;
    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;

    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return null;

    const rowStep = rowDiff > 0 ? 1 : -1;
    const colStep = colDiff > 0 ? 1 : -1;

    let opponentPiecesFound = 0;
    let victimRow = -1;
    let victimCol = -1;

    let r = startRow + rowStep;
    let c = startCol + colStep;

    while (r !== endRow && c !== endCol) {
        const piece = board[r][c];
        if (piece !== 0) {
            const isOpponent = (player === 1 && (piece === 2 || piece === 4)) || 
                               (player === 2 && (piece === 1 || piece === 3));
            if (!isOpponent) return null;
            
            opponentPiecesFound++;
            victimRow = r;
            victimCol = c;
        }
        r += rowStep;
        c += colStep;
    }

    if (opponentPiecesFound === 1) {
        if (!isDame && Math.abs(rowDiff) !== 2) return null; 
        return { row: victimRow, col: victimCol };
    }

    return null;
}

function hasPossibleJump(board, player, specificRow = null, specificCol = null) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (specificRow !== null && (r !== specificRow || c !== specificCol)) continue;

            if (isPlayerPiece(board, r, c, player)) {
                const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
                const isDame = board[r][c] === player + 2;
                const maxDist = isDame ? Math.max(ROWS, COLS) : 2;

                for (let [dr, dc] of directions) {
                    const distStart = isDame ? 2 : 2;
                    for (let dist = distStart; dist <= maxDist; dist++) {
                        const endRow = r + dr * dist;
                        const endCol = c + dc * dist;
                        
                        if (isInBoard(endRow, endCol) && isFreeCell(board, endRow, endCol)) {
                            if (isAEatMove(board, r, c, endRow, endCol, player)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

function arrivingAtLastRow(endRow, player){
    if (player === 1 && endRow === 0) return true;
    if (player === 2 && endRow === 9) return true;
    return false;
}