import { Texture } from "pixi.js";

//
// === Configuration ===
//

// Suits & ranks
export type SuitKey = "spade" | "heart" | "diamond" | "club";
export type RankKey = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6";

// Default visual style
export interface CardStyle {
  width: number;
  height: number;
  radius: number;
  border: string;
  bgTop: string;
  bgBottom: string;
  shadow: string;
  gloss: string;
  centerFont: string;
  cornerFont: string;
  centerStroke: string;
  centerStrokeWidth: number;
}

// --- base style constants ---
const DEFAULT_STYLE: CardStyle = {
  width: 90,
  height: 120,
  radius: 12,
  border: "#1f2230",
  bgTop: "#ffffff",
  bgBottom: "#e9e9ee",
  shadow: "rgba(0,0,0,0.2)",
  gloss: "rgba(255,255,255,0.35)",
  centerFont: "900 48px Inter, system-ui, sans-serif",
  cornerFont: "700 24px Inter, system-ui, sans-serif",
  centerStroke: "#ffffff",
  centerStrokeWidth: 6,
};

// --- card ranks & suits ---
const RANKS: RankKey[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6"];

const SUITS: Record<SuitKey, { symbol: string; color1: string; color2: string }> = {
  spade: { symbol: "♠", color1: "#1b1b1f", color2: "#3a3a44" },
  club: { symbol: "♣", color1: "#1b1b1f", color2: "#3a3a44" },
  heart: { symbol: "♥", color1: "#ff2f2f", color2: "#c41616" },
  diamond: { symbol: "♦", color1: "#ff3b3b", color2: "#cc1f1f" },
};

//
// === CardFactory ===
//

/**
 * Generates full 36-card deck textures (6..A)
 * Each card rendered to <canvas> and cached as a Pixi Texture.
 * Heavy operations are memoized to avoid duplicate canvas draws.
 */
export class CardFactory {
  private cache = new Map<string, Texture>();

  constructor(private style: CardStyle = DEFAULT_STYLE) {}

  /** Create 4×9 deck (spades, hearts, diamonds, clubs) */
  createDeckTextures(): Record<SuitKey, Record<RankKey, Texture>> {
    const suits: SuitKey[] = ["spade", "heart", "diamond", "club"];
    const out: Partial<Record<SuitKey, Record<RankKey, Texture>>> = {};

    for (const s of suits) {
      out[s] = {} as Record<RankKey, Texture>;
      for (const r of RANKS) {
        out[s]![r] = this.getOrCreate(r, s);
      }
    }
    return out as Record<SuitKey, Record<RankKey, Texture>>;
  }

  /** Retrieve cached texture or generate a new one */
  private getOrCreate(rank: RankKey, suitKey: SuitKey): Texture {
    const key = `${rank}-${suitKey}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const tex = this.createCardTexture(rank, suitKey);
    this.cache.set(key, tex);
    return tex;
  }

  /** Core drawing logic for a single card */
  private createCardTexture(rank: RankKey, suitKey: SuitKey): Texture {
    const S = this.style;
    const canvas = document.createElement("canvas");
    canvas.width = S.width;
    canvas.height = S.height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, S.width, S.height);

    const suit = SUITS[suitKey];
    const label = `${rank}${suit.symbol}`;

    // --- drop shadow ---
    this.drawShadow(ctx, S);

    // --- background body ---
    this.roundedRect(ctx, 0, 0, S.width, S.height, S.radius);
    const bg = ctx.createLinearGradient(0, 0, 0, S.height);
    bg.addColorStop(0, S.bgTop);
    bg.addColorStop(1, S.bgBottom);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = S.border;
    ctx.stroke();

    // --- gloss overlay ---
    this.drawGloss(ctx, S);

    // --- corner labels ---
    ctx.save();
    ctx.font = S.cornerFont;
    ctx.textBaseline = "top";
    ctx.fillStyle = suit.color1;
    ctx.fillText(label, 10, 6);
    ctx.restore();

    ctx.save();
    ctx.translate(S.width - 10, S.height - 6);
    ctx.rotate(Math.PI);
    ctx.font = S.cornerFont;
    ctx.textBaseline = "top";
    ctx.fillStyle = suit.color1;
    ctx.fillText(label, 0, 0);
    ctx.restore();

    // --- center rank (number or figure) ---
    const grad = ctx.createLinearGradient(0, S.height * 0.35, 0, S.height * 0.75);
    grad.addColorStop(0, suit.color1);
    grad.addColorStop(1, suit.color2);

    ctx.save();
    ctx.font = S.centerFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = S.centerStrokeWidth;
    ctx.strokeStyle = S.centerStroke;

    // Center element: numeric rank or suit symbol
    const centerY = S.height / 2 + 6;
    const centerX = S.width / 2;
    if (["A", "K", "Q", "J"].includes(rank)) {
      ctx.strokeText(suit.symbol, centerX, centerY);
      ctx.fillStyle = grad;
      ctx.fillText(suit.symbol, centerX, centerY);
    } else {
      ctx.strokeText(rank, centerX, centerY);
      ctx.fillStyle = grad;
      ctx.fillText(rank, centerX, centerY);
    }
    ctx.restore();

    return Texture.from(canvas);
  }

  // === Helpers ===

  /** Draw rounded rectangle */
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

  /** Soft drop shadow behind card */
  private drawShadow(ctx: CanvasRenderingContext2D, S: CardStyle) {
    ctx.save();
    ctx.shadowColor = S.shadow;
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 5;
    this.roundedRect(ctx, 6, 8, S.width - 12, S.height - 12, S.radius);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fill();
    ctx.restore();
  }

  /** Glossy reflection layer on top */
  private drawGloss(ctx: CanvasRenderingContext2D, S: CardStyle) {
    ctx.save();
    const pad = 10;
    this.roundedRect(ctx, pad, pad, S.width - pad * 2, S.height * 0.45, S.radius * 0.8);
    const g = ctx.createLinearGradient(0, pad, 0, S.height * 0.45);
    g.addColorStop(0, S.gloss);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
}
