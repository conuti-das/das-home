import type { CardItem } from "@/types";

/** Parse size string like "2x1" into {colSpan, rowSpan} */
export function parseSizeString(size: string): { colSpan: number; rowSpan: number } {
  const parts = size.split("x");
  const col = parseInt(parts[0]) || 1;
  const row = parseInt(parts[1]) || 1;
  return { colSpan: col, rowSpan: row };
}

/** Get card span: explicit colSpan/rowSpan > size string fallback */
export function getCardSpan(card: CardItem): { colSpan: number; rowSpan: number } {
  if (card.colSpan != null && card.rowSpan != null) {
    return { colSpan: card.colSpan, rowSpan: card.rowSpan };
  }
  const parsed = parseSizeString(card.size);
  return {
    colSpan: card.colSpan ?? parsed.colSpan,
    rowSpan: card.rowSpan ?? parsed.rowSpan,
  };
}

/** Get card position if explicitly set, or undefined */
export function getCardPosition(card: CardItem): { gridCol: number; gridRow: number } | undefined {
  if (card.gridCol != null && card.gridRow != null) {
    return { gridCol: card.gridCol, gridRow: card.gridRow };
  }
  return undefined;
}

/** Auto-assign grid positions using greedy bin-packing */
export function autoAssignPositions(cards: CardItem[], colCount: number): CardItem[] {
  // occupied[row][col] = true if cell is taken (0-indexed internally)
  const occupied: boolean[][] = [];

  function isOccupied(row: number, col: number): boolean {
    return occupied[row]?.[col] === true;
  }

  function markOccupied(row: number, col: number, cs: number, rs: number) {
    for (let r = row; r < row + rs; r++) {
      if (!occupied[r]) occupied[r] = [];
      for (let c = col; c < col + cs; c++) {
        occupied[r][c] = true;
      }
    }
  }

  function findSlot(cs: number, rs: number): { col: number; row: number } {
    for (let row = 0; ; row++) {
      for (let col = 0; col <= colCount - cs; col++) {
        let fits = true;
        for (let r = row; r < row + rs && fits; r++) {
          for (let c = col; c < col + cs && fits; c++) {
            if (isOccupied(r, c)) fits = false;
          }
        }
        if (fits) return { col, row };
      }
    }
  }

  return cards.map((card) => {
    const pos = getCardPosition(card);
    const span = getCardSpan(card);
    if (pos) {
      // Already has position, just mark as occupied
      markOccupied(pos.gridRow - 1, pos.gridCol - 1, span.colSpan, span.rowSpan);
      return card;
    }
    // Find next free slot
    const slot = findSlot(span.colSpan, span.rowSpan);
    markOccupied(slot.row, slot.col, span.colSpan, span.rowSpan);
    return {
      ...card,
      gridCol: slot.col + 1, // 1-based
      gridRow: slot.row + 1,
      colSpan: span.colSpan,
      rowSpan: span.rowSpan,
    };
  });
}
