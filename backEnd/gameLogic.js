const ROWS = 10;
const COLS = 10;
let board = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

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

initBoard();