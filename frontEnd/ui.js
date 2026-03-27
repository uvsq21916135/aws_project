let selectedPiece = null;

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

            if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                td.style.border = "3px solid #ffeb3b";
                td.style.boxSizing = "border-box";
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

            td.addEventListener('click', () => {
                handleCellClick(row, col);
            });

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
}

function handleCellClick(row, col) {
    if (!selectedPiece) {
        if (board[row][col] === currentPlayer) {
            selectedPiece = { row, col };
            render();
        }
    } else {
        makeMove(selectedPiece.row, selectedPiece.col, row, col);
        selectedPiece = null;
        render();
    }
}

render();
