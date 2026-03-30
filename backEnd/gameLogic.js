const ROWS = 10;
const COLS = 10;

let board = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
let currentPlayer = 1;

//On partirai sur un truc genre:
//0 : case vide
//1 : pion joueur 1
//2 : pion joueur 2
//3 : dame joueur 1
//4 : dame joueur 2

function initBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if ((row + col) % 2 === 1) {
                if (row < 4) {
                    board[row][col] = 2;
                } else if (row > 5) {
                    board[row][col] = 1;
                }
            }
        }
    }
}

let currentRaflePiece = null;

function makeMove(startRow, startCol, endRow, endCol){
    if (isValidMove(board, startRow, startCol, endRow, endCol, currentPlayer, currentRaflePiece)){
        const pieceMoved = board[startRow][startCol];
        const eatMove = isAEatMove(board, startRow, startCol, endRow, endCol, currentPlayer);

        board[startRow][startCol] = 0;
        board[endRow][endCol] = pieceMoved;

        let madeJump = false;
        if (eatMove){
            removePiece(board, eatMove.row, eatMove.col);
            madeJump = true;
        }

        let promoted = false;
        if (pieceMoved === currentPlayer && arrivingAtLastRow(endRow, currentPlayer)){
            let endsTurn = !madeJump || !hasPossibleJump(board, currentPlayer, endRow, endCol);
            if (endsTurn) {
                becomeEldenLord(board, endRow, endCol, currentPlayer);
                promoted = true;
            }
        }
    
        if (madeJump && !promoted && hasPossibleJump(board, currentPlayer, endRow, endCol)) {
            currentRaflePiece = { row: endRow, col: endCol };
        } else {
            currentRaflePiece = null;
            switchPlayer();
        }
    }
}

initBoard();