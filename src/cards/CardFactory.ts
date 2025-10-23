import { Texture } from "pixi.js";

//
// === Configuration ===
//

// Suits & ranks
export type SuitKey = "spade" | "heart" | "diamond" | "club";
export type RankKey = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6";

// Card visual style
export interface CardStyle {
  width: number;
  height: number;
  radius: number;
  bg: string;
  border: string;
  fontMain: string;
  fontCorner: string;
  stroke: string;
  strokeWidth: number;
}

const DEFAULT_STYLE: CardStyle = {
  width: 70,
  height: 100,
  radius: 10,
  bg: "#ffffff",
  border: "#000000",
  fontMain: "900 56px Inter, system-ui, sans-serif",
  fontCorner: "700 22px Inter, system-ui, sans-serif",
  stroke: "#ffffff",
  strokeWidth: 5,
};

// Suits & colors
const SUITS: Record<SuitKey, { symbol: string; color: string }> = {
  spade: { symbol: "♠", color: "#1b1b1f" },
  club: { symbol: "♣", color: "#1b1b1f" },
  heart: { symbol: "♥", color: "#e62424" },
  diamond: { symbol: "♦", color: "#e62424" },
};

const RANKS: RankKey[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6"];

//
// === CardFactory ===
//

/**
 * Minimal clean playing card generator.
 * Produces large, legible cards optimized for small-scale rendering.
 */
export class CardFactory {
  private cache = new Map<string, Texture>();

  constructor(private style: CardStyle = DEFAULT_STYLE) {}

  /** Create a full 36-card deck (4 suits × 9 ranks). */
  createDeckTextures(): Record<SuitKey, Record<RankKey, Texture>> {
    const out: Partial<Record<SuitKey, Record<RankKey, Texture>>> = {};
    for (const suit of Object.keys(SUITS) as SuitKey[]) {
      out[suit] = {} as Record<RankKey, Texture>;
      for (const rank of RANKS) {
        out[suit]![rank] = this.getOrCreate(rank, suit);
      }
    }
    return out as Record<SuitKey, Record<RankKey, Texture>>;
  }

  private getOrCreate(rank: RankKey, suit: SuitKey): Texture {
    const key = `${rank}-${suit}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const tex = this.createCardTexture(rank, suit);
    this.cache.set(key, tex);
    return tex;
  }

  /** Draws one simplified card to canvas. */
  private createCardTexture(rank: RankKey, suitKey: SuitKey): Texture {
    const S = this.style;
    const canvas = document.createElement("canvas");
    canvas.width = S.width;
    canvas.height = S.height;
    const ctx = canvas.getContext("2d")!;
    const suit = SUITS[suitKey];
    const text = `${rank}`;

    // background
    this.roundedRect(ctx, 0, 0, S.width, S.height, S.radius);
    ctx.fillStyle = S.bg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = S.border;
    ctx.stroke();

    // main rank in center
    ctx.save();
    ctx.font = S.fontMain;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = S.strokeWidth;
    ctx.strokeStyle = S.stroke;
    ctx.strokeText(text, S.width / 2, S.height / 2);
    ctx.fillStyle = suit.color;
    ctx.fillText(text, S.width / 2, S.height / 2);
    ctx.restore();

    // small corner label (one diagonal)
    const corner = `${rank}${suit.symbol}`;
    ctx.save();
    ctx.font = S.fontCorner;
    ctx.fillStyle = suit.color;
    ctx.textBaseline = "top";
    ctx.fillText(corner, 8, 6);
    ctx.translate(S.width - 8, S.height - 6);
    ctx.rotate(Math.PI);
    ctx.fillText(corner, 0, 0);
    ctx.restore();

    return Texture.from(canvas);
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}
