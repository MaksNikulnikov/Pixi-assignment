import { Container, Sprite, Application } from "pixi.js";
import gsap from "gsap";
import { BaseScene } from "@scenes/BaseScene";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import { GAME_SIZE } from "@config/gameSize";
import { BACKGROUND_COLORS } from "@config/backgroundColors";
import { CardFactory } from "@cards/CardFactory";

//
// === Constants ===
//

// Layout
const STACK_COUNT = 4;
const CARD_SCALE = 1;
const OFFSET_Y_PCT = 0.02;
const RADIUS = 140;

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

// Angles for circular layout
const STACK_ANGLES = [
  -Math.PI / 2, // top
  0,             // right
  Math.PI / 2,   // bottom
  Math.PI,       // left
];

//
// === Scene ===
//

/**
 * AceOfShadowsScene — visual card juggling demo.
 * Cards fly between four stacks arranged in a circle.
 */
export class AceOfShadowsScene extends BaseScene {
  private factory!: CardFactory;
  private stacks: Container[] = [];
  private decks: Sprite[][] = [];
  private timer?: number;

  private activeStackIndex = 0;
  private nextTargets: number[][] = [
    [1, 2, 3],
    [2, 3, 0],
    [3, 0, 1],
    [0, 1, 2],
  ];
  private nextTargetStep = 0;

  constructor() {
    super(BACKGROUND_COLORS.ONE);
  }

  override onEnter(app: Application) {
    super.onEnter(app);

    // === Card factory ===
    this.factory = new CardFactory();
    const style = (this.factory as any).style;
    const deckTextures = this.factory.createDeckTextures();

    const suits: ("spade" | "heart" | "diamond" | "club")[] = [
      "spade",
      "heart",
      "diamond",
      "club",
    ];
    const ranks: ("A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6")[] = [
      "A", "K", "Q", "J", "10", "9", "8", "7", "6",
    ];

    // === Create stacks ===
    for (let i = 0; i < STACK_COUNT; i++) {
      const stack = new Container();
      this.view.addChild(stack);
      this.stacks.push(stack);
      this.decks.push([]);
    }

    // === Fill stacks with shuffled decks ===
    for (let s = 0; s < STACK_COUNT; s++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          const tex = deckTextures[suit][rank];
          const card = new Sprite(tex);
          card.anchor.set(0.5);
          card.scale.set(CARD_SCALE);
          this.stacks[s].addChild(card);
          this.decks[s].push(card);
        }
      }
      this.decks[s].sort(() => Math.random() - 0.5);
    }

    // === Resize handling ===
    const baseResize = (this.view as any)._onResize;
    (this.view as any)._onResize = () => {
      baseResize?.();
      this.layoutStacks(style.height);
    };
    (this.view as any)._onResize();

    // === Start cycle ===
    this.startCycle();
  }

  override onExit() {
    if (this.timer) clearInterval(this.timer);
  }

  //
  // === Layout ===
  //

  /** Arrange card stacks in a circular pattern */
  private layoutStacks(cardHeight: number) {
    const yStep = cardHeight * CARD_SCALE * OFFSET_Y_PCT;

    const cx = GAME_SIZE.WIDTH / 2;
    const cy = GAME_SIZE.HEIGHT / 2;

    for (let s = 0; s < STACK_COUNT; s++) {
      const stack = this.stacks[s];
      const angle = STACK_ANGLES[s];
      const posX = cx + Math.cos(angle) * RADIUS;
      const posY = cy + Math.sin(angle) * RADIUS;

      stack.position.set(posX, posY);
      stack.rotation = angle + Math.PI / 2;

      const cards = this.decks[s];
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        c.x = 0;
        c.y = -(cards.length - 1 - i) * yStep;
        stack.setChildIndex(c, i);
      }
    }
  }

  //
  // === Animation cycle ===
  //

  /** Periodically move cards between stacks */
  private startCycle() {
    if (this.timer) return;
    this.timer = window.setInterval(() => {
      if (gsap.globalTimeline.paused()) return;

      const source = this.activeStackIndex;
      const targets = this.nextTargets[source];
      const target = targets[this.nextTargetStep];

      this.transferCard(source, target);
      this.nextTargetStep = (this.nextTargetStep + 1) % targets.length;

      if (this.decks[source].length === 0) {
        this.activeStackIndex = (this.activeStackIndex + 1) % STACK_COUNT;
        this.nextTargetStep = 0;
      }
    }, MOVE_INTERVAL_MS);
  }

  //
  // === Card transfer ===
  //

  /** Animate single card from one stack to another */
  private transferCard(fromIndex: number, toIndex: number) {
    const sourceDeck = this.decks[fromIndex];
    const targetDeck = this.decks[toIndex];
    if (sourceDeck.length === 0) return;

    const sourceStack = this.stacks[fromIndex];
    const targetStack = this.stacks[toIndex];

    const card = sourceDeck[sourceDeck.length - 1];
    const startGlobal = sourceStack.toGlobal(card.position);

    sourceDeck.pop();
    this.view.addChild(card);
    card.position.copyFrom(this.view.toLocal(startGlobal));

    const startRot = sourceStack.rotation;
    const endRot = targetStack.rotation;

    // modern DropShadowFilter (Pixi v7+)
    const shadow = new DropShadowFilter({
      offset: { x: 0, y: 0 },
      blur: SHADOW_BLUR,
      alpha: 0,
      color: SHADOW_COLOR,
    });
    card.filters = [shadow];

    const start = card.position.clone();
    const arcHeight = ARC_MIN + Math.random() * ARC_VARIATION;

    const getDynamicEndLocal = () => {
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
        const end = getDynamicEndLocal();

        // curved path
        const xLinear = start.x + (end.x - start.x) * prog;
        const yLinear = start.y + (end.y - start.y) * prog;
        const y = yLinear - arcHeight * Math.sin(prog * Math.PI);

        let x = xLinear;
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // lateral drift for vertical motion
        if (Math.abs(dx) < Math.abs(dy) * 0.5) {
          const side = fromIndex % 2 === 0 ? -1 : 1;
          x += SIDE_OFFSET * side * Math.sin(prog * Math.PI);
        }

        card.position.set(x, y);
        card.rotation = startRot + (endRot - startRot) * prog;

        const s = CARD_SCALE + 0.2 * Math.sin(prog * Math.PI);
        card.scale.set(s);

        // animate shadow
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

  //
  // === Utility ===
  //

  /** Adjust card positions within a stack */
  private relayoutStack(index: number) {
    const { height: CARD_H } = (this.factory as any).style;
    const yStep = CARD_H * CARD_SCALE * OFFSET_Y_PCT;
    const stack = this.stacks[index];
    const cards = this.decks[index];

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (c.parent !== stack) continue;
      c.x = 0;
      c.y = -(cards.length - 1 - i) * yStep;
      stack.setChildIndex(c, i);
    }
  }
}
