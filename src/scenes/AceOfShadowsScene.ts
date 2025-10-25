import { Container, Sprite, Texture, Graphics } from "pixi.js";
import { BaseScene } from "@scenes/BaseScene";
import { GAME_SIZE } from "@config/gameSize";
import { BACKGROUND_COLORS } from "@config/backgroundColors";
import { CardFactory } from "@cards/CardFactory";

//
// === Constants ===
//

// Layout
const STACK_COUNT = 12;
const TOTAL_AMOUNT = 144;
const CARD_SCALE = 1;
const OFFSET_Y_PCT = 0.05;
const RADIUS = 180;

// Layout smoothing
const STACK_ADJUST_DURATION = 0.4; // seconds

// Animation
const MOVE_INTERVAL_MS = 1000;
const FLIGHT_DURATION = 2;
const ARC_MIN = 120;
const ARC_VARIATION = 40;
const SIDE_OFFSET = 40;
const MAX_MOVES_PER_STACK = 6;

// Easings
const easeOutExpo = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeOutSine = (t: number): number => Math.sin((t * Math.PI) / 2);
const CARD_MOVE_EASING = easeOutExpo;
const STACK_EASING = easeOutSine;

// Shadow configuration
const SHADOW_COLOR = 0x000000;
const SHADOW_ALPHA = 0.25;
const SHADOW_WIDTH = 78;
const SHADOW_HEIGHT = 112;
const SHADOW_RADIUS = 11;
const SHADOW_SCALE = 0.92;

// Cards
const SUITS = ["spade", "heart", "diamond", "club"] as const;
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6"] as const;
type SuitKey = (typeof SUITS)[number];
type RankKey = (typeof RANKS)[number];

//
// === Scene ===
//

export class AceOfShadowsScene extends BaseScene {
  private factory!: CardFactory;
  private stacks: Container[] = [];
  private decks: Container[][] = [];
  private nextTargets: number[][] = [];

  private timer?: number;
  private _rafId?: number;
  private _boundUpdate = this.update.bind(this);

  private activeStackIndex = 0;
  private nextTargetStep = 0;

  private flyingCards: {
    card: Container;
    shadow: Graphics;
    fromIndex: number;
    toIndex: number;
    startTime: number;
    duration: number;
    startPos: { x: number; y: number };
    endPos: () => { x: number; y: number };
    startRot: number;
    endRot: number;
    arcHeight: number;
  }[] = [];

  constructor() {
    super(BACKGROUND_COLORS.ONE);
  }

  //
  // === Lifecycle ===
  //
  override onEnter() {
    super.onEnter();

    const angles = this.getStackAngles(STACK_COUNT);
    this.factory = new CardFactory();
    const deckTextures = this.factory.createDeckTextures();

    this.initStacks(STACK_COUNT);
    this.fillStacks(deckTextures);
    this.prepareTargets(STACK_COUNT);

    // Responsive layout
    const baseResize = (this.view as any)._onResize;
    (this.view as any)._onResize = () => {
      baseResize?.();
      const cardHeight = (this.factory as any).style.height;
      this.layoutStacks(cardHeight, angles);
    };
    (this.view as any)._onResize?.();

    this.startCycle();
    this._rafId = requestAnimationFrame(this._boundUpdate);
  }

  override onExit() {
    if (this.timer) clearInterval(this.timer);
    if (this._rafId) cancelAnimationFrame(this._rafId);

    this.flyingCards.length = 0;
    this.stacks.forEach((s) => s.destroy({ children: true }));
    this.stacks = [];
    this.decks = [];
  }

  //
  // === Setup ===
  //

  private getStackAngles(count: number): number[] {
    const step = (Math.PI * 2) / count;
    return Array.from({ length: count }, (_, i) => -Math.PI / 2 + i * step);
  }

  private initStacks(count: number) {
    for (let i = 0; i < count; i++) {
      const stack = new Container();
      this.view.addChild(stack);
      this.stacks.push(stack);
      this.decks.push([]);
    }
  }

  private createCardWithShadow(texture: Texture): Container {
    const container = new Container();

    // --- Shadow ---
    const shadow = new Graphics();
    shadow.beginFill(SHADOW_COLOR, SHADOW_ALPHA);
    shadow.drawRoundedRect(
      -SHADOW_WIDTH / 2,
      -SHADOW_HEIGHT / 2,
      SHADOW_WIDTH,
      SHADOW_HEIGHT,
      SHADOW_RADIUS
    );
    shadow.endFill();
    shadow.position.set(0, 0);
    shadow.visible = false;
    container.addChild(shadow);

    // --- Card sprite ---
    const card = new Sprite(texture);
    card.anchor.set(0.5);
    card.scale.set(CARD_SCALE);
    container.addChild(card);

    (container as any)._shadow = shadow;

    return container;
  }

  private fillStacks(deckTextures: Record<SuitKey, Record<RankKey, Texture>>) {
    const baseCards = SUITS.flatMap((suit) =>
      RANKS.map((rank) => ({ suit, rank }))
    );

    const allCards: Container[] = [];
    for (let i = 0; i < TOTAL_AMOUNT; i++) {
      const { suit, rank } = baseCards[i % baseCards.length];
      const tex = deckTextures[suit][rank];
      const cardContainer = this.createCardWithShadow(tex);
      allCards.push(cardContainer);
    }

    // Shuffle and distribute evenly
    allCards.sort(() => Math.random() - 0.5);
    allCards.forEach((card, i) => {
      const stackIndex = i % STACK_COUNT;
      this.stacks[stackIndex].addChild(card);
      this.decks[stackIndex].push(card);
    });
  }

  private prepareTargets(count: number) {
    this.nextTargets = Array.from({ length: count }, (_, i) =>
      Array.from({ length: count - 1 }, (_, j) => (i + j + 1) % count)
    );
  }

  //
  // === Layout ===
  //

  private layoutStacks(cardHeight: number, angles: number[]) {
    const yStep = cardHeight * CARD_SCALE * OFFSET_Y_PCT;
    const cx = GAME_SIZE.WIDTH / 2;
    const cy = GAME_SIZE.HEIGHT / 2;

    for (let i = 0; i < STACK_COUNT; i++) {
      const stack = this.stacks[i];
      const angle = angles[i];
      stack.position.set(
        cx + Math.cos(angle) * RADIUS,
        cy + Math.sin(angle) * RADIUS
      );
      stack.rotation = angle + Math.PI / 2;

      const cards = this.decks[i];
      cards.forEach((card, j) => {
        card.x = 0;
        card.y = -(cards.length - 1 - j) * yStep;
        stack.setChildIndex(card, j);
      });
    }
  }

  private relayoutStack(index: number) {
    const cardHeight = (this.factory as any).style.height;
    const yStep = cardHeight * CARD_SCALE * OFFSET_Y_PCT;
    const stack = this.stacks[index];
    const cards = this.decks[index];

    const startTime = performance.now();
    const duration = STACK_ADJUST_DURATION * 1000;
    const startPositions = cards.map((c) => c.y);
    const targetPositions = cards.map(
      (_, i) => -(cards.length - 1 - i) * yStep
    );

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = STACK_EASING(t);

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        if (c.parent !== stack) continue;
        const newY =
          startPositions[i] + (targetPositions[i] - startPositions[i]) * eased;
        c.x = 0;
        c.y = newY;
        stack.setChildIndex(c, i);
      }

      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  //
  // === Animation Loop ===
  //

  private startCycle() {
    if (this.timer) return;
    let movesFromCurrent = 0;

    this.timer = window.setInterval(() => {
      const src = this.activeStackIndex;
      const targets = this.nextTargets[src];
      const target = targets[this.nextTargetStep];

      if (this.decks[src].length === 0) {
        this.activeStackIndex = (this.activeStackIndex + 1) % STACK_COUNT;
        movesFromCurrent = 0;
        this.nextTargetStep = 0;
        return;
      }

      this.launchCard(src, target);

      movesFromCurrent++;
      this.nextTargetStep = (this.nextTargetStep + 1) % targets.length;

      if (movesFromCurrent >= MAX_MOVES_PER_STACK) {
        this.activeStackIndex = (this.activeStackIndex + 1) % STACK_COUNT;
        movesFromCurrent = 0;
        this.nextTargetStep = 0;
      }
    }, MOVE_INTERVAL_MS);
  }

  private launchCard(fromIndex: number, toIndex: number) {
    const sourceDeck = this.decks[fromIndex];
    if (sourceDeck.length === 0) return;

    const targetDeck = this.decks[toIndex];
    const sourceStack = this.stacks[fromIndex];
    const targetStack = this.stacks[toIndex];

    const card = sourceDeck.pop()!;
    const shadow = (card as any)._shadow as Graphics;

    const startGlobal = sourceStack.toGlobal(card.position);
    this.view.addChild(card);
    card.position.copyFrom(this.view.toLocal(startGlobal));

    const startRot = sourceStack.rotation;
    const endRot = targetStack.rotation;

    const startPos = { x: card.position.x, y: card.position.y };
    const arcHeight = ARC_MIN + Math.random() * ARC_VARIATION;

    const getEndLocal = () => {
      const top = targetDeck[targetDeck.length - 1];
      const endGlobal = top
        ? targetStack.toGlobal(top.position)
        : targetStack.toGlobal({ x: 0, y: 0 });
      return this.view.toLocal(endGlobal);
    };

    shadow.visible = true;
    shadow.alpha = SHADOW_ALPHA;

    this.flyingCards.push({
      card,
      shadow,
      fromIndex,
      toIndex,
      startTime: performance.now(),
      duration: FLIGHT_DURATION * 1000,
      startPos,
      endPos: getEndLocal,
      startRot,
      endRot,
      arcHeight,
    });

    this.relayoutStack(fromIndex);
  }

  private update() {
    const now = performance.now();

    for (let i = this.flyingCards.length - 1; i >= 0; i--) {
      const f = this.flyingCards[i];
      const elapsed = now - f.startTime;
      const rawT = Math.min(elapsed / f.duration, 1);
      const t = CARD_MOVE_EASING(rawT);

      const end = f.endPos();
      const xLinear = f.startPos.x + (end.x - f.startPos.x) * t;
      const yLinear = f.startPos.y + (end.y - f.startPos.y) * t;
      const y = yLinear - f.arcHeight * Math.sin(t * Math.PI);

      const dx = end.x - f.startPos.x;
      const dy = end.y - f.startPos.y;
      const side =
        Math.abs(dx) < Math.abs(dy) * 0.5
          ? f.fromIndex % 2 === 0
            ? -1
            : 1
          : 0;

      const x = xLinear + SIDE_OFFSET * side * Math.sin(t * Math.PI);

      f.card.position.set(x, y);
      f.card.rotation = f.startRot + (f.endRot - f.startRot) * t;
      f.card.scale.set(CARD_SCALE + 0.2 * Math.sin(t * Math.PI));
      f.shadow.scale.set(SHADOW_SCALE + 0.2 * Math.sin(t * Math.PI));
      if (rawT >= 1) {
        const globalNow = f.card.parent.toGlobal(f.card.position);
        const globalRot = f.card.rotation;

        const targetStack = this.stacks[f.toIndex];
        const targetDeck = this.decks[f.toIndex];

        targetStack.addChild(f.card);
        f.card.position.copyFrom(targetStack.toLocal(globalNow));
        f.card.rotation = globalRot - targetStack.rotation;
        targetDeck.push(f.card);

        f.shadow.visible = false;
        f.card.scale.set(CARD_SCALE);

        this.relayoutStack(f.fromIndex);
        this.relayoutStack(f.toIndex);

        this.flyingCards.splice(i, 1);
      }
    }

    this._rafId = requestAnimationFrame(this._boundUpdate);
  }
}
