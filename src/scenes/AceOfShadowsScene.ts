import { Application, Container, Sprite, Texture } from "pixi.js";
import gsap from "gsap";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
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
const OFFSET_Y_PCT = 0.02;
const RADIUS = 180;

// Animation
const MOVE_INTERVAL_MS = 1000;
const FLIGHT_DURATION = 2;
const ARC_MIN = 120;
const ARC_VARIATION = 40;
const SIDE_OFFSET = 40;

// Visual
const SHADOW_COLOR = 0x000000;
const SHADOW_BLUR = 6;
const SHADOW_ALPHA = 0.6;

// Cards
const SUITS = ["spade", "heart", "diamond", "club"] as const;
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6"] as const;
type SuitKey = typeof SUITS[number];
type RankKey = typeof RANKS[number];

//
// === Scene ===
//

export class AceOfShadowsScene extends BaseScene {
  private factory!: CardFactory;
  private stacks: Container[] = [];
  private decks: Sprite[][] = [];
  private nextTargets: number[][] = [];

  private timer?: number;
  private activeStackIndex = 0;
  private nextTargetStep = 0;

  constructor() {
    super(BACKGROUND_COLORS.ONE);
  }

  // === Lifecycle ===
  override onEnter() {
    super.onEnter();

    // Prepare angles
    const angles = this.getStackAngles(STACK_COUNT);

    // Init factory
    this.factory = new CardFactory();
    const deckTextures = this.factory.createDeckTextures();

    // Create stack containers
    this.initStacks(STACK_COUNT);

    // Create and distribute cards
    this.fillStacks(deckTextures);

    // Prepare movement matrix
    this.prepareTargets(STACK_COUNT);

    // Bind resize handler
    const baseResize = (this.view as any)._onResize;
    (this.view as any)._onResize = () => {
      baseResize?.();
      const cardHeight = (this.factory as any).style.height;
      this.layoutStacks(cardHeight, angles);
    };
    (this.view as any)._onResize();

    // Start animation cycle
    this.startCycle();
  }

  override onExit() {
    if (this.timer) clearInterval(this.timer);
  }

  //
  // === Init helpers ===
  //

  /** Evenly spaced angles around a circle */
  private getStackAngles(count: number): number[] {
    const step = (Math.PI * 2) / count;
    return Array.from({ length: count }, (_, i) => -Math.PI / 2 + i * step);
  }

  /** Create empty stack containers */
  private initStacks(count: number) {
    for (let i = 0; i < count; i++) {
      const stack = new Container();
      this.view.addChild(stack);
      this.stacks.push(stack);
      this.decks.push([]);
    }
  }

  /** Fill stacks with TOTAL_AMOUNT cards, evenly distributed */
  private fillStacks(
    deckTextures: Record<SuitKey, Record<RankKey, Texture>>
  ) {
    const baseCards = SUITS.flatMap((suit) =>
      RANKS.map((rank) => ({ suit, rank }))
    );

    const allCards: Sprite[] = [];
    for (let i = 0; i < TOTAL_AMOUNT; i++) {
      const { suit, rank } = baseCards[i % baseCards.length];
      const tex = deckTextures[suit][rank];
      const card = new Sprite(tex);
      card.anchor.set(0.5);
      card.scale.set(CARD_SCALE);
      allCards.push(card);
    }

    // Shuffle and distribute
    allCards.sort(() => Math.random() - 0.5);
    allCards.forEach((card, i) => {
      const stackIndex = i % STACK_COUNT;
      this.stacks[stackIndex].addChild(card);
      this.decks[stackIndex].push(card);
    });
  }

  /** Precompute cyclic target indices for each stack */
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
      stack.position.set(cx + Math.cos(angle) * RADIUS, cy + Math.sin(angle) * RADIUS);
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

    cards.forEach((c, i) => {
      if (c.parent !== stack) return;
      c.position.set(0, -(cards.length - 1 - i) * yStep);
      stack.setChildIndex(c, i);
    });
  }

  //
  // === Animation cycle ===
  //

  private startCycle() {
    if (this.timer) return;

    this.timer = window.setInterval(() => {
      if (gsap.globalTimeline.paused()) return;

      const src = this.activeStackIndex;
      const targets = this.nextTargets[src];
      const target = targets[this.nextTargetStep];

      this.transferCard(src, target);

      this.nextTargetStep = (this.nextTargetStep + 1) % targets.length;
      if (this.decks[src].length === 0) {
        this.activeStackIndex = (this.activeStackIndex + 1) % STACK_COUNT;
        this.nextTargetStep = 0;
      }
    }, MOVE_INTERVAL_MS);
  }

  private transferCard(fromIndex: number, toIndex: number) {
    const sourceDeck = this.decks[fromIndex];
    if (sourceDeck.length === 0) return;

    const targetDeck = this.decks[toIndex];
    const sourceStack = this.stacks[fromIndex];
    const targetStack = this.stacks[toIndex];

    const card = sourceDeck.pop()!;
    const startGlobal = sourceStack.toGlobal(card.position);
    this.view.addChild(card);
    card.position.copyFrom(this.view.toLocal(startGlobal));

    const startRot = sourceStack.rotation;
    const endRot = targetStack.rotation;

    const shadow = new DropShadowFilter({
      offset: { x: 0, y: 0 },
      blur: SHADOW_BLUR,
      alpha: 0,
      color: SHADOW_COLOR,
    });
    card.filters = [shadow];

    const start = card.position.clone();
    const arcHeight = ARC_MIN + Math.random() * ARC_VARIATION;

    const getEndLocal = () => {
      const top = targetDeck[targetDeck.length - 1];
      const endGlobal = top
        ? targetStack.toGlobal(top.position)
        : targetStack.toGlobal({ x: 0, y: 0 });
      return this.view.toLocal(endGlobal);
    };

    const t = { p: 0 };
    gsap.to(t, {
      p: 1,
      duration: FLIGHT_DURATION,
      ease: "expo.out",
      onUpdate: () => {
        const prog = t.p;
        const end = getEndLocal();

        const xLinear = start.x + (end.x - start.x) * prog;
        const yLinear = start.y + (end.y - start.y) * prog;
        const y = yLinear - arcHeight * Math.sin(prog * Math.PI);

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const side = Math.abs(dx) < Math.abs(dy) * 0.5 ? (fromIndex % 2 === 0 ? -1 : 1) : 0;
        const x = xLinear + SIDE_OFFSET * side * Math.sin(prog * Math.PI);

        card.position.set(x, y);
        card.rotation = startRot + (endRot - startRot) * prog;

        const s = CARD_SCALE + 0.2 * Math.sin(prog * Math.PI);
        card.scale.set(s);

        shadow.alpha = SHADOW_ALPHA * Math.sin(prog * Math.PI);
        shadow.blur = SHADOW_BLUR + 10 * Math.sin(prog * Math.PI);
        shadow.offset.y = 5 + 10 * Math.sin(prog * Math.PI);
      },
      onComplete: () => {
        const globalNow = card.parent.toGlobal(card.position);
        const globalRot = card.rotation;

        targetStack.addChild(card);
        card.position.copyFrom(targetStack.toLocal(globalNow));
        card.rotation = globalRot - targetStack.rotation;
        targetDeck.push(card);

        card.filters = [];
        card.scale.set(CARD_SCALE);

        this.relayoutStack(fromIndex);
        this.relayoutStack(toIndex);
      },
    });

    this.relayoutStack(fromIndex);
  }
}
