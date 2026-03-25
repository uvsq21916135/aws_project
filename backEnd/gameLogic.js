const ROWS = 10;
const COLS = 10;
let board = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

function initBoard() {
}

function render() {
    const container = document.querySelector('#container');
    container.innerHTML = '';

    const table = document.createElement('table');

    for (let r = 0; r < ROWS; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < COLS; c++) {
            const td = document.createElement('td');

            if ((r + c) % 2 === 0) {
                td.className = 'light-cell';
            } else {
                td.className = 'dark-cell';
            }
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
}

initBoard();
render();