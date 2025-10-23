import { Container, Graphics, Texture } from "pixi.js";
import { BaseScene } from "@scenes/BaseScene";
import { BACKGROUND_COLORS } from "@config/backgroundColors";
import { GAME_SIZE } from "@config/gameSize";
import { fetchMagicWordsData } from "@services/fetchMagicWords";
import { DialogueBubble } from "@ui/DialogueBubble";

export class MagicWordsScene extends BaseScene {
  // === Layout config ===
  private static readonly CONFIG = {
    DIALOG_SPACING: 110,
    DIALOG_OFFSET_X: 160,
    SCROLL_TOP: 50,
    SCROLL_PADDING: 80,
    MASK_EXTRA_MARGIN: 260,
  } as const;

  private scrollContainer = new Container();
  private maskGfx = new Graphics();

  private scrollY = 0;
  private isDragging = false;
  private dragStartY = 0;
  private _isActive = false;

  constructor() {
    super(BACKGROUND_COLORS.TWO);
  }

  async onEnter() {
    super.onEnter();
    this._isActive = true;
    this.view.addChild(this.maskGfx, this.scrollContainer);

    const data = await fetchMagicWordsData();
    if (!this._isActive) return; 

    const emojiMap = new Map<string, Texture>();
    const avatarMap = new Map<
      string,
      { texture: Texture; pos: "left" | "right" }
    >();

    // === Load emojis (Texture.fromURL handles direct image links) ===
    for (const e of data.emojies) {
      try {
        const tex = await Texture.fromURL(e.url);
        if (!this._isActive) return; 
        emojiMap.set(e.name, tex);
      } catch {
        console.warn(`[MagicWordsScene] Failed to load emoji "${e.name}"`);
      }
    }

    // === Load avatars ===
    for (const a of data.avatars) {
      try {
        const tex = await Texture.fromURL(a.url);
        if (!this._isActive) return; 
        avatarMap.set(a.name, {
          texture: tex,
          pos: a.position as "left" | "right",
        });
      } catch {
        console.warn(`[MagicWordsScene] Failed to load avatar "${a.name}"`);
      }
    }

    // === Render dialogue ===
    const C = MagicWordsScene.CONFIG;
    let y = 0;
    for (const d of data.dialogue) {
      const avatarInfo = avatarMap.get(d.name);
      const bubble = new DialogueBubble(d.name, d.text, avatarInfo, emojiMap);
      bubble.y = y;
      bubble.x =
        avatarInfo?.pos === "left" ? -C.DIALOG_OFFSET_X : C.DIALOG_OFFSET_X;
      this.scrollContainer.addChild(bubble);
      y += C.DIALOG_SPACING;
    }

    this.createScrollMask();
    this.enableScroll();
    this.onResize();
  }

  /** Creates horizontal mask area allowing avatars to extend beyond the viewport */
  private createScrollMask() {
    const { WIDTH, HEIGHT } = GAME_SIZE;
    const C = MagicWordsScene.CONFIG;

    this.maskGfx.clear();
    this.maskGfx.beginFill(0xffffff);
    this.maskGfx.drawRect(
      -WIDTH / 2 - C.MASK_EXTRA_MARGIN,
      0,
      WIDTH + C.MASK_EXTRA_MARGIN * 2,
      HEIGHT
    );
    this.maskGfx.endFill();

    this.scrollContainer.mask = this.maskGfx;
    this.scrollContainer.x = WIDTH / 2;
    this.scrollContainer.y = C.SCROLL_TOP;
  }

   private onPointerDown = (e: PointerEvent) => {
      this.isDragging = true;
      this.dragStartY = e.clientY;
    };

    private onPointerMove = (e: PointerEvent) => {
      if (!this.isDragging) return;
      const dy = e.clientY - this.dragStartY;
      this.dragStartY = e.clientY;
      this.scrollY += dy;
      this.applyScrollBounds();
    };

    private onPointerUp = () => {
      this.isDragging = false;
    };

  /** Enables vertical scroll by dragging */
  private enableScroll() {
    window.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  /** Keeps scroll position within valid bounds */
  private applyScrollBounds() {
    const C = MagicWordsScene.CONFIG;
    const minY = -Math.max(
      0,
      this.scrollContainer.height - GAME_SIZE.HEIGHT + C.SCROLL_PADDING
    );
    const maxY = C.SCROLL_TOP;
    this.scrollY = Math.max(minY, Math.min(maxY, this.scrollY));
    this.scrollContainer.y = this.scrollY;
  }

  onResize() {
    const vw = GAME_SIZE.WIDTH;
    const vh = GAME_SIZE.HEIGHT;
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const isPortrait = wh > ww;

    if (isPortrait) {
      const scale = ww / vw;
      const chatHeight = wh * 3;
      const offsetY = wh * 0.12;

      this.view.scale.set(scale);
      this.view.position.set((ww - vw * scale) / 2, offsetY);

      const C = MagicWordsScene.CONFIG;
      this.maskGfx.clear();
      this.maskGfx.beginFill(0xffffff);
      this.maskGfx.drawRect(
        -ww / 2 - C.MASK_EXTRA_MARGIN,
        0,
        (ww + C.MASK_EXTRA_MARGIN) * 2,
        chatHeight
      );
      this.maskGfx.endFill();

      this.scrollContainer.mask = this.maskGfx;
    } else {
      // 🟦 Landscape mode — use default layout rules
      const scale = Math.min(ww / vw, wh / vh);
      const x = (ww - vw * scale) / 2;
      const y = (wh - vh * scale) / 2;

      this.view.scale.set(scale);
      this.view.position.set(x, y);
    }
  }

  override onExit() {
  this._isActive = false;

  window.removeEventListener("pointerdown", this.onPointerDown);
  window.removeEventListener("pointermove", this.onPointerMove);
  window.removeEventListener("pointerup", this.onPointerUp);

  this.scrollContainer.removeChildren();
  this.view.removeChildren();
  this.maskGfx.destroy(true);
  this.scrollContainer.destroy({ children: true });
}

}
