const ROWS = 10;
const COLS = 10;
let board = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

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

function render() {
    const container = document.querySelector('#container');
    container.innerHTML = '';

    const table = document.createElement('table');

    for (let row = 0; row < ROWS; row++) {
        const tr = document.createElement('tr');
        for (let col = 0; col < COLS; col++) {
            const td = document.createElement('td');

            if ((row + col) % 2 === 0) {
                td.className = 'light-cell';
            } else {
                td.className = 'dark-cell';
            }

            if (board[row][col] === 1) {
                const piece = document.createElement('div');
                piece.className = 'piece piece-p1';
                td.appendChild(piece);
            } else if (board[row][col] === 2) {
                const piece = document.createElement('div');
                piece.className = 'piece piece-p2';
                td.appendChild(piece);
            }

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
}

initBoard();
render();