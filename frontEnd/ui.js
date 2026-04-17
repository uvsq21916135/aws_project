let selectedPiece = null;

function render() {
    const container = document.querySelector('#container');
    container.innerHTML = '';

    const table = document.createElement('table');

    const forcedJumpPieces = getForcedJumpPieces();

    for (let row = 0; row < ROWS; row++) {
        const tr = document.createElement('tr');
        for (let col = 0; col < COLS; col++) {
            const td = document.createElement('td');

            if ((row + col) % 2 === 0) {
                td.className = 'light-cell';
            } else {
                td.className = 'dark-cell';
            }

            if (forcedJumpPieces.some(p => p.row === row && p.col === col)) {
                td.style.boxShadow = "inset 0 0 0 4px #ef4444";
                td.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                td.style.cursor = "pointer";
            }

            if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                td.style.backgroundColor = "rgba(244, 246, 128, 0.6)";
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
    
    if (typeof updateTurnIndicator === "function") {
        updateTurnIndicator();
    }
}

function handleCellClick(row, col) {
    if (window.myPlayerId && window.myPlayerId !== currentPlayer) {
        return;
    }

    const oldPlayer = currentPlayer;
    const oldRafle = currentRaflePiece ? { ...currentRaflePiece } : null;

    let moveStartRow, moveStartCol;

    if (currentRaflePiece) {
        moveStartRow = currentRaflePiece.row;
        moveStartCol = currentRaflePiece.col;
    } else if (selectedPiece && (row !== selectedPiece.row || col !== selectedPiece.col)) {
        moveStartRow = selectedPiece.row;
        moveStartCol = selectedPiece.col;
    } else {

        if (!selectedPiece && (board[row][col] === currentPlayer || board[row][col] === currentPlayer + 2)) {
            const forcedJumpPieces = getForcedJumpPieces();
            if (forcedJumpPieces.length > 0) {
                if (forcedJumpPieces.some(p => p.row === row && p.col === col)) {
                    selectedPiece = { row, col };
                }
            } else {
                selectedPiece = { row, col };
            }
        } else if (selectedPiece && row === selectedPiece.row && col === selectedPiece.col) {
            selectedPiece = null;
        }
        render();
        return;
    }


    makeMove(moveStartRow, moveStartCol, row, col);

    if (currentPlayer !== oldPlayer || currentRaflePiece !== oldRafle) {
        if (window.gameSocket && window.opponentUsername) {
            window.gameSocket.send(JSON.stringify({
                type: "MOVE",
                startRow: moveStartRow,
                startCol: moveStartCol,
                endRow: row,
                endCol: col,
                to: window.opponentUsername
            }));
        }
    }

    selectedPiece = currentRaflePiece ? { row: currentRaflePiece.row, col: currentRaflePiece.col } : null;
    render();
}

function getForcedJumpPieces() {
    let forced = [];
    if (window.myPlayerId && window.myPlayerId === currentPlayer) {
        if (typeof currentRaflePiece !== 'undefined' && currentRaflePiece) {
            forced.push(currentRaflePiece);
        } else if (typeof hasPossibleJump === 'function' && hasPossibleJump(board, window.myPlayerId)) {
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (board[r][c] === window.myPlayerId || board[r][c] === window.myPlayerId + 2) {
                        if (hasPossibleJump(board, window.myPlayerId, r, c)) {
                            forced.push({row: r, col: c});
                        }
                    }
                }
            }
        }
    }
    return forced;
}

render();
