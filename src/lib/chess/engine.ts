export const BOARD_SIZE = 8;

export type ChessPlayer = 1 | 2; // 1 = White (Ivory, bottom), 2 = Black (Charcoal, top)
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type PromotionType = "q" | "r" | "b" | "n";
export type OpponentMode = "bot" | "local";
export type ChessCharacterId = "ghost" | "cat" | "squirrel" | "turtle";

export interface ChessCharacter {
  id: ChessCharacterId;
  name: string;
  tagline: string;
  iconKey: "ghost" | "cat" | "squirrel" | "turtle";
}

export const CHESS_CHARACTERS: ChessCharacter[] = [
  {
    id: "ghost",
    name: "Pip",
    tagline: "Midnight regular",
    iconKey: "ghost",
  },
  {
    id: "cat",
    name: "Milo",
    tagline: "Window watcher",
    iconKey: "cat",
  },
  {
    id: "squirrel",
    name: "Hazel",
    tagline: "Quick paws",
    iconKey: "squirrel",
  },
  {
    id: "turtle",
    name: "Barnaby",
    tagline: "Unhurried sipper",
    iconKey: "turtle",
  },
];

export function getChessCharacterById(id: ChessCharacterId): ChessCharacter {
  return CHESS_CHARACTERS.find((c) => c.id === id) ?? CHESS_CHARACTERS[0];
}

export interface Coord {
  row: number;
  col: number;
}

export interface ChessPiece {
  id: string;
  player: ChessPlayer;
  type: PieceType;
}

export type ChessBoard = (ChessPiece | null)[][];

export interface CastlingRights {
  wK: boolean;
  wQ: boolean;
  bK: boolean;
  bQ: boolean;
}

export interface ChessState {
  board: ChessBoard;
  turn: ChessPlayer;
  castling: CastlingRights;
  enPassantTarget: Coord | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

export interface ChessMove {
  from: Coord;
  to: Coord;
  pieceType: PieceType;
  captured: PieceType | null;
  promotion?: PromotionType;
  isEnPassant?: boolean;
  isCastle?: "kingside" | "queenside";
}

export type OutcomeReason =
  | "checkmate"
  | "stalemate"
  | "insufficient-material"
  | "fifty-move"
  | "threefold"
  | null;

export interface ChessOutcome {
  winner: ChessPlayer | "draw" | null;
  reason: OutcomeReason;
}

/**
 * Solid Unicode Staunton chess glyphs with U+FE0E text variation selector
 * so mobile browsers (iOS/Android) render crisp monochrome typography rather than colour emoji.
 */
export const PIECE_GLYPHS: Record<PieceType, string> = {
  k: "\u265A\uFE0E",
  q: "\u265B\uFE0E",
  r: "\u265C\uFE0E",
  b: "\u265D\uFE0E",
  n: "\u265E\uFE0E",
  p: "\u265F\uFE0E",
};

export const PIECE_NAMES: Record<PieceType, string> = {
  k: "King",
  q: "Queen",
  r: "Rook",
  b: "Bishop",
  n: "Knight",
  p: "Pawn",
};

export const PIECE_MATERIAL: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export function isDarkSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1;
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function cloneBoard(board: ChessBoard): ChessBoard {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function cloneState(state: ChessState): ChessState {
  return {
    board: cloneBoard(state.board),
    turn: state.turn,
    castling: { ...state.castling },
    enPassantTarget: state.enPassantTarget
      ? { ...state.enPassantTarget }
      : null,
    halfMoveClock: state.halfMoveClock,
    fullMoveNumber: state.fullMoveNumber,
  };
}

export function createInitialChessState(): ChessState {
  const board: ChessBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array<ChessPiece | null>(BOARD_SIZE).fill(null)
  );

  const backRank: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];

  for (let c = 0; c < BOARD_SIZE; c++) {
    board[0][c] = { id: `b-${backRank[c]}-${c}`, player: 2, type: backRank[c] };
    board[1][c] = { id: `b-p-${c}`, player: 2, type: "p" };
    board[6][c] = { id: `w-p-${c}`, player: 1, type: "p" };
    board[7][c] = { id: `w-${backRank[c]}-${c}`, player: 1, type: backRank[c] };
  }

  return {
    board,
    turn: 1,
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  };
}

export function getPositionKey(state: ChessState): string {
  let out = "";
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = state.board[r][c];
      if (!cell) {
        out += ".";
      } else {
        out += cell.player === 1 ? cell.type.toUpperCase() : cell.type;
      }
    }
  }
  const cr =
    (state.castling.wK ? "K" : "") +
    (state.castling.wQ ? "Q" : "") +
    (state.castling.bK ? "k" : "") +
    (state.castling.bQ ? "q" : "");
  const ep = state.enPassantTarget
    ? `${state.enPassantTarget.row}${state.enPassantTarget.col}`
    : "-";
  return `${out}|${state.turn}|${cr}|${ep}`;
}

export function findKing(board: ChessBoard, player: ChessPlayer): Coord | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell && cell.player === player && cell.type === "k") {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

const KNIGHT_OFFSETS: readonly [number, number][] = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

const KING_OFFSETS: readonly [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const BISHOP_DIRS: readonly [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const ROOK_DIRS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** Returns true if `(row, col)` is attacked by any piece belonging to `byPlayer` */
export function isSquareAttacked(
  board: ChessBoard,
  row: number,
  col: number,
  byPlayer: ChessPlayer
): boolean {
  // 1. Pawn attacks
  // Player 1 pawns attack upwards (from row+1), Player 2 pawns attack downwards (from row-1)
  const pawnSourceRow = byPlayer === 1 ? row + 1 : row - 1;
  if (pawnSourceRow >= 0 && pawnSourceRow < BOARD_SIZE) {
    for (const dc of [-1, 1]) {
      const pc = col + dc;
      if (pc >= 0 && pc < BOARD_SIZE) {
        const cell = board[pawnSourceRow][pc];
        if (cell && cell.player === byPlayer && cell.type === "p") {
          return true;
        }
      }
    }
  }

  // 2. Knight attacks
  for (const [dr, dc] of KNIGHT_OFFSETS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      const cell = board[nr][nc];
      if (cell && cell.player === byPlayer && cell.type === "n") {
        return true;
      }
    }
  }

  // 3. King attacks
  for (const [dr, dc] of KING_OFFSETS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      const cell = board[nr][nc];
      if (cell && cell.player === byPlayer && cell.type === "k") {
        return true;
      }
    }
  }

  // 4. Diagonal rays (Bishop / Queen)
  for (const [dr, dc] of BISHOP_DIRS) {
    let nr = row + dr;
    let nc = col + dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      const cell = board[nr][nc];
      if (cell) {
        if (
          cell.player === byPlayer &&
          (cell.type === "b" || cell.type === "q")
        ) {
          return true;
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // 5. Orthogonal rays (Rook / Queen)
  for (const [dr, dc] of ROOK_DIRS) {
    let nr = row + dr;
    let nc = col + dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      const cell = board[nr][nc];
      if (cell) {
        if (
          cell.player === byPlayer &&
          (cell.type === "r" || cell.type === "q")
        ) {
          return true;
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return false;
}

export function isInCheck(board: ChessBoard, player: ChessPlayer): boolean {
  const king = findKing(board, player);
  if (!king) return false;
  const enemy: ChessPlayer = player === 1 ? 2 : 1;
  return isSquareAttacked(board, king.row, king.col, enemy);
}

/** Apply a ChessMove immutably to produce the next ChessState */
export function applyChessMove(state: ChessState, move: ChessMove): ChessState {
  const nextBoard = cloneBoard(state.board);
  const movingPiece = nextBoard[move.from.row][move.from.col];
  if (!movingPiece) return cloneState(state);

  const player = movingPiece.player;
  const enemy: ChessPlayer = player === 1 ? 2 : 1;
  const nextCastling: CastlingRights = { ...state.castling };
  let nextEnPassant: Coord | null = null;

  // Move piece
  nextBoard[move.from.row][move.from.col] = null;
  nextBoard[move.to.row][move.to.col] = {
    ...movingPiece,
    type: move.promotion ?? movingPiece.type,
  };

  // En passant capture removes the passed pawn
  if (move.isEnPassant) {
    nextBoard[move.from.row][move.to.col] = null;
  }

  // Castling moves the companion rook
  if (move.isCastle === "kingside") {
    const rook = nextBoard[move.from.row][7];
    nextBoard[move.from.row][7] = null;
    if (rook) {
      nextBoard[move.from.row][5] = { ...rook };
    }
  } else if (move.isCastle === "queenside") {
    const rook = nextBoard[move.from.row][0];
    nextBoard[move.from.row][0] = null;
    if (rook) {
      nextBoard[move.from.row][3] = { ...rook };
    }
  }

  // Double pawn advance creates en passant target square
  if (
    movingPiece.type === "p" &&
    Math.abs(move.to.row - move.from.row) === 2
  ) {
    nextEnPassant = {
      row: (move.from.row + move.to.row) / 2,
      col: move.from.col,
    };
  }

  // Update castling rights when king or rooks move or are captured
  if (movingPiece.type === "k") {
    if (player === 1) {
      nextCastling.wK = false;
      nextCastling.wQ = false;
    } else {
      nextCastling.bK = false;
      nextCastling.bQ = false;
    }
  }
  if (move.from.row === 7 && move.from.col === 0) nextCastling.wQ = false;
  if (move.from.row === 7 && move.from.col === 7) nextCastling.wK = false;
  if (move.from.row === 0 && move.from.col === 0) nextCastling.bQ = false;
  if (move.from.row === 0 && move.from.col === 7) nextCastling.bK = false;

  if (move.to.row === 7 && move.to.col === 0) nextCastling.wQ = false;
  if (move.to.row === 7 && move.to.col === 7) nextCastling.wK = false;
  if (move.to.row === 0 && move.to.col === 0) nextCastling.bQ = false;
  if (move.to.row === 0 && move.to.col === 7) nextCastling.bK = false;

  const isResetHalfMove =
    movingPiece.type === "p" || move.captured !== null || Boolean(move.isEnPassant);

  return {
    board: nextBoard,
    turn: enemy,
    castling: nextCastling,
    enPassantTarget: nextEnPassant,
    halfMoveClock: isResetHalfMove ? 0 : state.halfMoveClock + 1,
    fullMoveNumber:
      player === 2 ? state.fullMoveNumber + 1 : state.fullMoveNumber,
  };
}

const PROMO_TYPES: readonly PromotionType[] = ["q", "r", "b", "n"];

function generatePseudoLegalMoves(
  state: ChessState,
  player: ChessPlayer,
  capturesOnly = false
): ChessMove[] {
  const moves: ChessMove[] = [];
  const board = state.board;
  const enemy: ChessPlayer = player === 1 ? 2 : 1;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || piece.player !== player) continue;

      if (piece.type === "p") {
        const dir = player === 1 ? -1 : 1;
        const startRow = player === 1 ? 6 : 1;
        const promoRow = player === 1 ? 0 : 7;
        const oneRow = r + dir;

        // Forward pushes
        if (inBounds(oneRow, c) && board[oneRow][c] === null) {
          if (oneRow === promoRow) {
            for (const promo of PROMO_TYPES) {
              moves.push({
                from: { row: r, col: c },
                to: { row: oneRow, col: c },
                pieceType: "p",
                captured: null,
                promotion: promo,
              });
            }
          } else if (!capturesOnly) {
            moves.push({
              from: { row: r, col: c },
              to: { row: oneRow, col: c },
              pieceType: "p",
              captured: null,
            });
            const twoRow = r + dir * 2;
            if (r === startRow && board[twoRow][c] === null) {
              moves.push({
                from: { row: r, col: c },
                to: { row: twoRow, col: c },
                pieceType: "p",
                captured: null,
              });
            }
          }
        }

        // Diagonal captures + En Passant
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (!inBounds(oneRow, nc)) continue;
          const target = board[oneRow][nc];
          if (target && target.player === enemy) {
            if (oneRow === promoRow) {
              for (const promo of PROMO_TYPES) {
                moves.push({
                  from: { row: r, col: c },
                  to: { row: oneRow, col: nc },
                  pieceType: "p",
                  captured: target.type,
                  promotion: promo,
                });
              }
            } else {
              moves.push({
                from: { row: r, col: c },
                to: { row: oneRow, col: nc },
                pieceType: "p",
                captured: target.type,
              });
            }
          } else if (
            state.enPassantTarget &&
            state.enPassantTarget.row === oneRow &&
            state.enPassantTarget.col === nc
          ) {
            moves.push({
              from: { row: r, col: c },
              to: { row: oneRow, col: nc },
              pieceType: "p",
              captured: "p",
              isEnPassant: true,
            });
          }
        }
      } else if (piece.type === "n") {
        for (const [dr, dc] of KNIGHT_OFFSETS) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const target = board[nr][nc];
          if (target && target.player === player) continue;
          if (capturesOnly && !target) continue;
          moves.push({
            from: { row: r, col: c },
            to: { row: nr, col: nc },
            pieceType: "n",
            captured: target ? target.type : null,
          });
        }
      } else if (
        piece.type === "b" ||
        piece.type === "r" ||
        piece.type === "q"
      ) {
        const dirs =
          piece.type === "b"
            ? BISHOP_DIRS
            : piece.type === "r"
              ? ROOK_DIRS
              : [...BISHOP_DIRS, ...ROOK_DIRS];
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (inBounds(nr, nc)) {
            const target = board[nr][nc];
            if (target) {
              if (target.player === enemy) {
                moves.push({
                  from: { row: r, col: c },
                  to: { row: nr, col: nc },
                  pieceType: piece.type,
                  captured: target.type,
                });
              }
              break;
            }
            if (!capturesOnly) {
              moves.push({
                from: { row: r, col: c },
                to: { row: nr, col: nc },
                pieceType: piece.type,
                captured: null,
              });
            }
            nr += dr;
            nc += dc;
          }
        }
      } else if (piece.type === "k") {
        for (const [dr, dc] of KING_OFFSETS) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const target = board[nr][nc];
          if (target && target.player === player) continue;
          if (capturesOnly && !target) continue;
          moves.push({
            from: { row: r, col: c },
            to: { row: nr, col: nc },
            pieceType: "k",
            captured: target ? target.type : null,
          });
        }

        // Castling (only during full legal move gen, not quiescence captures)
        if (!capturesOnly) {
          const homeRow = player === 1 ? 7 : 0;
          if (r === homeRow && c === 4 && !isSquareAttacked(board, homeRow, 4, enemy)) {
            const canK = player === 1 ? state.castling.wK : state.castling.bK;
            if (
              canK &&
              board[homeRow][5] === null &&
              board[homeRow][6] === null &&
              board[homeRow][7]?.player === player &&
              board[homeRow][7]?.type === "r" &&
              !isSquareAttacked(board, homeRow, 5, enemy) &&
              !isSquareAttacked(board, homeRow, 6, enemy)
            ) {
              moves.push({
                from: { row: homeRow, col: 4 },
                to: { row: homeRow, col: 6 },
                pieceType: "k",
                captured: null,
                isCastle: "kingside",
              });
            }

            const canQ = player === 1 ? state.castling.wQ : state.castling.bQ;
            if (
              canQ &&
              board[homeRow][3] === null &&
              board[homeRow][2] === null &&
              board[homeRow][1] === null &&
              board[homeRow][0]?.player === player &&
              board[homeRow][0]?.type === "r" &&
              !isSquareAttacked(board, homeRow, 3, enemy) &&
              !isSquareAttacked(board, homeRow, 2, enemy)
            ) {
              moves.push({
                from: { row: homeRow, col: 4 },
                to: { row: homeRow, col: 2 },
                pieceType: "k",
                captured: null,
                isCastle: "queenside",
              });
            }
          }
        }
      }
    }
  }

  return moves;
}

/** Returns all strictly legal moves for `state.turn` */
export function getLegalChessMoves(
  state: ChessState,
  capturesOnly = false
): ChessMove[] {
  const player = state.turn;
  const pseudo = generatePseudoLegalMoves(state, player, capturesOnly);
  const legal: ChessMove[] = [];

  for (const move of pseudo) {
    const next = applyChessMove(state, move);
    if (!isInCheck(next.board, player)) {
      legal.push(move);
    }
  }

  return legal;
}

export function isInsufficientMaterial(board: ChessBoard): boolean {
  const minors: { player: ChessPlayer; type: PieceType; dark: boolean }[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (!cell || cell.type === "k") continue;
      if (cell.type === "p" || cell.type === "r" || cell.type === "q") {
        return false;
      }
      minors.push({
        player: cell.player,
        type: cell.type,
        dark: isDarkSquare(r, c),
      });
    }
  }

  if (minors.length <= 1) return true; // K vs K, K+N vs K, K+B vs K
  if (
    minors.length === 2 &&
    minors[0].type === "b" &&
    minors[1].type === "b" &&
    minors[0].player !== minors[1].player &&
    minors[0].dark === minors[1].dark
  ) {
    return true; // K+B vs K+B on same square colour
  }
  return false;
}

export function evaluateChessOutcome(
  state: ChessState,
  repetitionCount = 1
): ChessOutcome {
  const legalMoves = getLegalChessMoves(state);
  if (legalMoves.length === 0) {
    if (isInCheck(state.board, state.turn)) {
      return {
        winner: state.turn === 1 ? 2 : 1,
        reason: "checkmate",
      };
    }
    return { winner: "draw", reason: "stalemate" };
  }

  if (isInsufficientMaterial(state.board)) {
    return { winner: "draw", reason: "insufficient-material" };
  }

  if (state.halfMoveClock >= 100) {
    return { winner: "draw", reason: "fifty-move" };
  }

  if (repetitionCount >= 3) {
    return { winner: "draw", reason: "threefold" };
  }

  return { winner: null, reason: null };
}

/** Computes captured enemy pieces and material balance for UI ledger */
export function computeCapturedAndMaterial(board: ChessBoard): {
  capturedByWhite: PieceType[];
  capturedByBlack: PieceType[];
  whiteAdvantage: number;
  whiteCount: number;
  blackCount: number;
} {
  const initialCounts: Record<PieceType, number> = {
    q: 1,
    r: 2,
    b: 2,
    n: 2,
    p: 8,
    k: 1,
  };
  const currentWhite: Record<PieceType, number> = {
    q: 0,
    r: 0,
    b: 0,
    n: 0,
    p: 0,
    k: 0,
  };
  const currentBlack: Record<PieceType, number> = {
    q: 0,
    r: 0,
    b: 0,
    n: 0,
    p: 0,
    k: 0,
  };

  let whiteMat = 0;
  let blackMat = 0;
  let whiteCount = 0;
  let blackCount = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      if (cell.player === 1) {
        currentWhite[cell.type]++;
        whiteMat += PIECE_MATERIAL[cell.type];
        whiteCount++;
      } else {
        currentBlack[cell.type]++;
        blackMat += PIECE_MATERIAL[cell.type];
        blackCount++;
      }
    }
  }

  const order: PieceType[] = ["q", "r", "b", "n", "p"];
  const capturedByWhite: PieceType[] = [];
  const capturedByBlack: PieceType[] = [];

  for (const t of order) {
    const missingBlack = Math.max(0, initialCounts[t] - currentBlack[t]);
    for (let i = 0; i < missingBlack; i++) capturedByWhite.push(t);

    const missingWhite = Math.max(0, initialCounts[t] - currentWhite[t]);
    for (let i = 0; i < missingWhite; i++) capturedByBlack.push(t);
  }

  return {
    capturedByWhite,
    capturedByBlack,
    whiteAdvantage: whiteMat - blackMat,
    whiteCount,
    blackCount,
  };
}

/* ============================================================================
   High-Strength Chess AI
   Iterative-Deepening Negamax + Alpha-Beta + Capture Quiescence + PeSTO PSTs
   ============================================================================ */

const PIECE_VALUES_CP: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables oriented from White's perspective (row 0 = rank 8, row 7 = rank 1)
const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [12, 12, 22, 32, 32, 22, 12, 12],
  [6, 6, 12, 27, 27, 12, 6, 6],
  [0, 0, 4, 24, 24, 4, 0, 0],
  [5, -4, -8, 2, 2, -8, -4, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 2, 2, 0, -20, -40],
  [-30, 4, 14, 18, 18, 14, 4, -30],
  [-30, 6, 18, 24, 24, 18, 6, -30],
  [-30, 2, 16, 22, 22, 16, 2, -30],
  [-30, 6, 12, 16, 16, 12, 6, -30],
  [-40, -20, 0, 6, 6, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_PST = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 2, 0, 0, 0, 0, 2, -10],
  [-10, 4, 10, 12, 12, 10, 4, -10],
  [-10, 6, 8, 14, 14, 8, 6, -10],
  [-10, 2, 12, 14, 14, 12, 2, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 8, 0, 2, 2, 0, 8, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_PST = [
  [0, 0, 2, 5, 5, 2, 0, 0],
  [8, 14, 14, 14, 14, 14, 14, 8],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 2, 2, 0, 0, -5],
  [0, 0, 2, 8, 8, 2, 0, 0],
];

const QUEEN_PST = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 6, 6, 6, 6, 0, -10],
  [-5, 0, 6, 8, 8, 6, 0, -5],
  [0, 0, 6, 8, 8, 6, 0, -5],
  [-10, 4, 6, 6, 6, 6, 0, -10],
  [-10, 0, 4, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MG_PST = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [18, 20, 0, 0, 0, 0, 20, 18],
  [20, 32, 12, 0, 0, 12, 32, 20],
];

const KING_EG_PST = [
  [-40, -30, -25, -20, -20, -25, -30, -40],
  [-30, -15, -10, 0, 0, -10, -15, -30],
  [-25, -10, 15, 22, 22, 15, -10, -25],
  [-20, 0, 22, 30, 30, 22, 0, -20],
  [-20, 0, 22, 30, 30, 22, 0, -20],
  [-25, -10, 15, 22, 22, 15, -10, -25],
  [-30, -15, -5, 0, 0, -5, -15, -30],
  [-40, -30, -25, -20, -20, -25, -30, -40],
];

function evaluatePosition(state: ChessState): number {
  const board = state.board;
  let score = 0;
  let whiteBishops = 0;
  let blackBishops = 0;
  let nonPawnMaterial = 0;

  const whitePawnCols = [0, 0, 0, 0, 0, 0, 0, 0];
  const blackPawnCols = [0, 0, 0, 0, 0, 0, 0, 0];

  // First pass: detect endgame phase & pawn structure
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      if (cell.type === "p") {
        if (cell.player === 1) whitePawnCols[c]++;
        else blackPawnCols[c]++;
      } else if (cell.type !== "k") {
        nonPawnMaterial += PIECE_VALUES_CP[cell.type];
      }
    }
  }

  const isEndgame = nonPawnMaterial <= 2600;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (!cell) continue;

      const pstRow = cell.player === 1 ? r : 7 - r;
      let val = PIECE_VALUES_CP[cell.type];

      switch (cell.type) {
        case "p":
          val += PAWN_PST[pstRow][c];
          break;
        case "n":
          val += KNIGHT_PST[pstRow][c];
          break;
        case "b":
          val += BISHOP_PST[pstRow][c];
          if (cell.player === 1) whiteBishops++;
          else blackBishops++;
          break;
        case "r":
          val += ROOK_PST[pstRow][c];
          // Open / semi-open file bonus
          if (cell.player === 1) {
            if (whitePawnCols[c] === 0) {
              val += blackPawnCols[c] === 0 ? 18 : 10;
            }
          } else {
            if (blackPawnCols[c] === 0) {
              val += whitePawnCols[c] === 0 ? 18 : 10;
            }
          }
          break;
        case "q":
          val += QUEEN_PST[pstRow][c];
          break;
        case "k":
          val += isEndgame ? KING_EG_PST[pstRow][c] : KING_MG_PST[pstRow][c];
          break;
      }

      score += cell.player === 1 ? val : -val;
    }
  }

  // Bishop pair bonus
  if (whiteBishops >= 2) score += 32;
  if (blackBishops >= 2) score -= 32;

  // Doubled pawn penalty
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (whitePawnCols[c] > 1) score -= (whitePawnCols[c] - 1) * 14;
    if (blackPawnCols[c] > 1) score += (blackPawnCols[c] - 1) * 14;
  }

  return state.turn === 1 ? score : -score;
}

function moveKey(m: ChessMove): string {
  return `${m.from.row}${m.from.col}-${m.to.row}${m.to.col}${m.promotion ?? ""}`;
}

function scoreMoveOrder(m: ChessMove, ttBestKey?: string): number {
  if (ttBestKey && moveKey(m) === ttBestKey) return 1_000_000;
  let s = 0;
  if (m.promotion) {
    s += 80_000 + PIECE_VALUES_CP[m.promotion];
  }
  if (m.captured) {
    // MVV-LVA: prefer capturing high-value pieces with low-value attackers
    s += 50_000 + PIECE_VALUES_CP[m.captured] * 10 - PIECE_VALUES_CP[m.pieceType];
  }
  if (m.isCastle) s += 4_000;
  // Slight central preference for quiet moves
  const centreDist = Math.abs(m.to.row - 3.5) + Math.abs(m.to.col - 3.5);
  s += Math.round((7 - centreDist) * 8);
  return s;
}

interface TTEntry {
  depth: number;
  score: number;
  flag: "exact" | "lower" | "upper";
  bestKey: string;
}

const MATE_SCORE = 100_000;

interface SearchCtx {
  deadline: number;
  aborted: boolean;
  nodes: number;
  tt: Map<string, TTEntry>;
}

function quiesce(
  state: ChessState,
  alpha: number,
  beta: number,
  qDepth: number,
  ctx: SearchCtx
): number {
  ctx.nodes++;
  if ((ctx.nodes & 511) === 0 && performance.now() > ctx.deadline) {
    ctx.aborted = true;
    return 0;
  }

  const standPat = evaluatePosition(state);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;
  if (qDepth <= 0) return alpha;

  const captures = getLegalChessMoves(state, true);
  if (captures.length === 0) return alpha;

  // Filter out non-queen underpromotions in quiescence to stay razor fast
  const tactical = captures.filter(
    (m) => !m.promotion || m.promotion === "q" || m.promotion === "n"
  );
  tactical.sort((a, b) => scoreMoveOrder(b) - scoreMoveOrder(a));

  for (const move of tactical) {
    const next = applyChessMove(state, move);
    const score = -quiesce(next, -beta, -alpha, qDepth - 1, ctx);
    if (ctx.aborted) return 0;
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}

function negamax(
  state: ChessState,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  ctx: SearchCtx,
  qDepth: number
): number {
  ctx.nodes++;
  if ((ctx.nodes & 511) === 0 && performance.now() > ctx.deadline) {
    ctx.aborted = true;
    return 0;
  }

  if (state.halfMoveClock >= 100 || isInsufficientMaterial(state.board)) {
    return 0;
  }

  const posKey = getPositionKey(state);
  const ttHit = ctx.tt.get(posKey);
  if (ttHit && ttHit.depth >= depth) {
    if (ttHit.flag === "exact") return ttHit.score;
    if (ttHit.flag === "lower" && ttHit.score >= beta) return ttHit.score;
    if (ttHit.flag === "upper" && ttHit.score <= alpha) return ttHit.score;
  }

  const legal = getLegalChessMoves(state);
  if (legal.length === 0) {
    if (isInCheck(state.board, state.turn)) {
      return -MATE_SCORE + ply;
    }
    return 0; // Stalemate
  }

  if (depth <= 0) {
    return quiesce(state, alpha, beta, qDepth, ctx);
  }

  // Keep search focused by pruning rook/bishop underpromotions (rarely better than Queen)
  const searchMoves = legal.filter(
    (m) => !m.promotion || m.promotion === "q" || m.promotion === "n"
  );

  const ttBest = ttHit?.bestKey;
  searchMoves.sort(
    (a, b) => scoreMoveOrder(b, ttBest) - scoreMoveOrder(a, ttBest)
  );

  const origAlpha = alpha;
  let bestScore = -Infinity;
  let bestMoveKey = moveKey(searchMoves[0]);

  for (const move of searchMoves) {
    const next = applyChessMove(state, move);
    const score = -negamax(next, depth - 1, -beta, -alpha, ply + 1, ctx, qDepth);
    if (ctx.aborted) return 0;

    if (score > bestScore) {
      bestScore = score;
      bestMoveKey = moveKey(move);
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  if (!ctx.aborted && ctx.tt.size < 45_000) {
    const flag: TTEntry["flag"] =
      bestScore <= origAlpha
        ? "upper"
        : bestScore >= beta
          ? "lower"
          : "exact";
    ctx.tt.set(posKey, {
      depth,
      score: bestScore,
      flag,
      bestKey: bestMoveKey,
    });
  }

  return bestScore;
}

const CHARACTER_PROFILES: Record<
  ChessCharacterId,
  {
    maxDepth: number;
    budgetMs: number;
    qDepth: number;
    topNoiseCp: number;
  }
> = {
  // Default & strongest hidden opponent — sharp, relentless tactical search
  ghost: { maxDepth: 6, budgetMs: 260, qDepth: 5, topNoiseCp: 0 },
  // Very strong positional opponent with slight opening variety
  cat: { maxDepth: 4, budgetMs: 160, qDepth: 4, topNoiseCp: 16 },
  // Crafty mid-table tactical opponent
  squirrel: { maxDepth: 3, budgetMs: 95, qDepth: 2, topNoiseCp: 48 },
  // Relaxed casual opponent
  turtle: { maxDepth: 2, budgetMs: 55, qDepth: 1, topNoiseCp: 110 },
};

/**
 * Picks a Chess move for `state.turn` using iterative-deepening alpha-beta minimax
 * + capture quiescence, silently tuned to the selected character profile.
 */
export function chooseChessMove(
  state: ChessState,
  characterId: ChessCharacterId = "ghost"
): ChessMove | null {
  const legal = getLegalChessMoves(state);
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0];

  const profile = CHARACTER_PROFILES[characterId] ?? CHARACTER_PROFILES.ghost;

  const rootMoves = legal.filter(
    (m) => !m.promotion || m.promotion === "q" || m.promotion === "n"
  );

  const ctx: SearchCtx = {
    deadline: performance.now() + profile.budgetMs,
    aborted: false,
    nodes: 0,
    tt: new Map<string, TTEntry>(),
  };

  let orderedMoves = [...rootMoves].sort(
    (a, b) => scoreMoveOrder(b) - scoreMoveOrder(a)
  );
  let bestOverall = orderedMoves[0];
  let lastRootScores: { move: ChessMove; score: number }[] = [];

  for (let depth = 1; depth <= profile.maxDepth; depth++) {
    ctx.aborted = false;
    let bestScore = -Infinity;
    let bestThisDepth = orderedMoves[0];
    let alpha = -Infinity;
    const beta = Infinity;
    const depthScores: { move: ChessMove; score: number }[] = [];

    for (const move of orderedMoves) {
      const next = applyChessMove(state, move);
      const score = -negamax(
        next,
        depth - 1,
        -beta,
        -alpha,
        1,
        ctx,
        profile.qDepth
      );
      if (ctx.aborted) break;

      depthScores.push({ move, score });

      if (score > bestScore) {
        bestScore = score;
        bestThisDepth = move;
      }
      if (score > alpha) alpha = score;
    }

    if (ctx.aborted) break;

    bestOverall = bestThisDepth;
    lastRootScores = depthScores;
    const bestKey = moveKey(bestThisDepth);
    orderedMoves = [
      bestThisDepth,
      ...orderedMoves.filter((m) => moveKey(m) !== bestKey),
    ];

    if (bestScore >= MATE_SCORE - 50) break;
  }

  // Only non-top characters add subtle human-like inaccuracy (never when mate is found)
  if (profile.topNoiseCp > 0 && lastRootScores.length > 1) {
    lastRootScores.sort((a, b) => b.score - a.score);
    const topScore = lastRootScores[0].score;
    if (topScore < MATE_SCORE - 100 && topScore > -MATE_SCORE + 100) {
      const pool = lastRootScores.filter(
        (entry) => topScore - entry.score <= profile.topNoiseCp
      );
      if (pool.length > 1) {
        return pool[Math.floor(Math.random() * pool.length)].move;
      }
    }
  }

  return bestOverall;
}

export function buildChessShareCard(params: {
  dateLabel: string;
  outcomeLabel: string;
  moves: number;
  capturedByWhite: number;
  capturedByBlack: number;
  durationLabel: string;
}): string {
  const {
    dateLabel,
    outcomeLabel,
    moves,
    capturedByWhite,
    capturedByBlack,
    durationLabel,
  } = params;

  return [
    `Chess · ${dateLabel}`,
    outcomeLabel,
    `${moves} moves · ${durationLabel}`,
    `Captured: ♔ ${capturedByWhite} · ♚ ${capturedByBlack}`,
    "",
    "Coffee Break — tactile monochrome Chess",
  ].join("\n");
}
