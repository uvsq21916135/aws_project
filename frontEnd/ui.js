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
                td.style.boxShadow = "inset 0 0 15px rgba(255, 215, 0, 0.8)";
                td.style.filter = "brightness(1.5)";
            }

            if (board[row][col] === 1 || board[row][col] === 3) {
                const piece = document.createElement('div');
                piece.className = 'piece piece-p1';
                if (board[row][col] === 3) piece.classList.add('dame');
                td.appendChild(piece);
            } else if (board[row][col] === 2 || board[row][col] === 4) {
                const piece = document.createElement('div');
                piece.className = 'piece piece-p2';
                if (board[row][col] === 4) piece.classList.add('dame');
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
    if (window.myPlayerId && window.myPlayerId !== currentPlayer) {
        return;
    }

    const oldPlayer = currentPlayer;
    const oldRafle = currentRaflePiece ? { ...currentRaflePiece } : null;

    if (currentRaflePiece) {
        const startRow = currentRaflePiece.row;
        const startCol = currentRaflePiece.col;

        makeMove(startRow, startCol, row, col);

        if (currentPlayer !== oldPlayer || currentRaflePiece !== oldRafle) {
            if (window.gameSocket && window.opponentUsername) {
                window.gameSocket.send(JSON.stringify({
                    type: "MOVE",
                    startRow, startCol,
                    endRow: row,
                    endCol: col,
                    to: window.opponentUsername
                }));
            }
        }

        selectedPiece = currentRaflePiece ? { row: currentRaflePiece.row, col: currentRaflePiece.col } : null;
        render();
        return;
    }

    if (!selectedPiece) {
        if (board[row][col] === currentPlayer || board[row][col] === currentPlayer + 2) {
            selectedPiece = { row, col };
            render();
        }
    } else {
        if (row === selectedPiece.row && col === selectedPiece.col) {
            selectedPiece = null;
        } else {
            const startRow = selectedPiece.row;
            const startCol = selectedPiece.col;

            makeMove(startRow, startCol, row, col);
            
            if (currentPlayer !== oldPlayer || currentRaflePiece !== oldRafle) {
                if (window.gameSocket && window.opponentUsername) {
                    window.gameSocket.send(JSON.stringify({
                        type: "MOVE",
                        startRow,
                        startCol,
                        endRow: row,
                        endCol: col,
                        to: window.opponentUsername
                    }));
                }
            }

            selectedPiece = currentRaflePiece ? { row: currentRaflePiece.row, col: currentRaflePiece.col } : null;
        }
        render();
    }
}

render();
