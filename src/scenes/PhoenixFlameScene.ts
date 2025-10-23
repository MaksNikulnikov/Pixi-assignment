import { BACKGROUND_COLORS } from "@config/backgroundColors";
import { BaseScene } from "@scenes/BaseScene";
import { Container, Graphics, BLEND_MODES } from "pixi.js";
import { BlurFilter } from "@pixi/filter-blur";
import { GAME_SIZE } from "@config/gameSize";

//
// === CONFIGURATION ===
//

// Layout
const BASE_Y = 440;

// Flames
const FLAME_COUNT = 8;
const FLAME_BASE_SCALE_MIN = 0.5;
const FLAME_BASE_SCALE_MAX = 0.7;
const FLAME_BREATH_SPEED = 1.7;
const FLAME_BREATH_INTENSITY = 0.05;
const FLAME_ROTATION_SPEED = 1.8;
const FLAME_ROTATION_INTENSITY = 0.05;
const FLAME_ALPHA_SPEED = 0.8;
const FLAME_ALPHA_MIN = 0.3;
const FLAME_ALPHA_RANGE = 0.7;
const FLAME_PIVOT_Y = -20;
const FLAME_OFFSET_X = 10;

// Flame shape
const FLAME_CURVE_WIDTH = 75;
const FLAME_CURVE_RANDOM_X = 75;
const FLAME_CURVE_LOW_Y = 20;
const FLAME_CURVE_LOW_RANDOM_Y = 20;
const FLAME_CURVE_MID_X = 10;
const FLAME_CURVE_MID_RANDOM_X = 15;
const FLAME_CURVE_TOP_Y = 150;
const FLAME_CURVE_TOP_RANDOM_Y = 150;

// Glow
const GLOW_COUNT = 2;
const GLOW_RADIUS = 70;
const GLOW_RADIUS_STEP = 15;
const GLOW_Y_OFFSET = 5;
const GLOW_Y_SPACING = 5;
const GLOW_ALPHA_BASE = 0.6;
const GLOW_ALPHA_STEP = 0.15;
const GLOW_SCALE_INTENSITY = 0.1;
const GLOW_ALPHA_INTENSITY = 0.15;
const GLOW_PULSE_SPEED = 0.02;

// Colors
const COLORS = [0xfff6a0, 0xffa030, 0xff4000];

// Filters
const FLAME_BLUR = 2;
const GLOW_BLUR = 4;

//
// === SCENE CLASS ===
//

/**
 * PhoenixFlameScene
 * Creates a stylized fire simulation using PIXI Graphics.
 * Includes animated flame tongues, and glowing embers.
 */
export class PhoenixFlameScene extends BaseScene {
  private flameContainer!: Container;
  private glowContainer!: Container;

  private flames: {
    g: Graphics;
    baseScale: number;
    time: number;
    offset: number;
    speed: number;
  }[] = [];

  constructor() {
    super(BACKGROUND_COLORS.THREE);
  }

  override onEnter() {
    super.onEnter();

    this.glowContainer = new Container();
    this.flameContainer = new Container();

    this.glowContainer.filters = [new BlurFilter(GLOW_BLUR)];
    this.flameContainer.filters = [new BlurFilter(FLAME_BLUR)];

    this.view.addChild(this.glowContainer);
    this.view.addChild(this.flameContainer);

    this.createFlameLayer();
    this.createGlowLayer();

    requestAnimationFrame(this.update.bind(this));
  }

  /** Creates soft pulsing glow circles beneath the fire. */
  private createGlowLayer() {
    for (let i = 0; i < GLOW_COUNT; i++) {
      const color = COLORS[Math.min(i, COLORS.length - 1)];
      const g = new Graphics();

      g.beginFill(color);
      g.drawCircle(0, 0, GLOW_RADIUS - i * GLOW_RADIUS_STEP);
      g.endFill();

      g.x = GAME_SIZE.WIDTH / 2;
      g.y = BASE_Y + GLOW_Y_OFFSET + i * GLOW_Y_SPACING - GLOW_RADIUS / 2;
      g.alpha = GLOW_ALPHA_BASE - i * GLOW_ALPHA_STEP;
      g.blendMode = BLEND_MODES.ADD;

      this.glowContainer.addChild(g);

      let t = Math.random() * Math.PI * 2;
      const pulse = () => {
        t += GLOW_PULSE_SPEED;
        const scale = 1 + Math.sin(t) * GLOW_SCALE_INTENSITY;
        g.scale.set(scale);
        g.alpha =
          GLOW_ALPHA_BASE / 2 + Math.sin(t * 0.5) * GLOW_ALPHA_INTENSITY;
        requestAnimationFrame(pulse);
      };
      pulse();
    }
  }

  /** Creates animated flame tongues. */
  private createFlameLayer() {
    for (let i = 0; i < FLAME_COUNT; i++) {
      const g = new Graphics();
      this.drawFlameShape(g, this.randomColor());

      g.blendMode = BLEND_MODES.ADD;
      g.x = GAME_SIZE.WIDTH / 2 + (Math.random() - 0.5) * FLAME_OFFSET_X * 2;
      g.y = BASE_Y + 10;
      g.alpha = FLAME_ALPHA_MIN + Math.random() * FLAME_ALPHA_RANGE;
      g.pivot.set(0, FLAME_PIVOT_Y);

      this.flameContainer.addChild(g);

      this.flames.push({
        g,
        baseScale:
          FLAME_BASE_SCALE_MIN +
          Math.random() * (FLAME_BASE_SCALE_MAX - FLAME_BASE_SCALE_MIN),
        time: Math.random() * 100,
        offset: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.3,
      });
    }
  }

  /** Draws a random curved flame shape. */
  private drawFlameShape(g: Graphics, color: number) {
    g.clear();
    g.beginFill(color);

    g.moveTo(0, 0);
    g.bezierCurveTo(
      -(FLAME_CURVE_WIDTH + Math.random() * FLAME_CURVE_RANDOM_X),
      -(FLAME_CURVE_LOW_Y + Math.random() * FLAME_CURVE_LOW_RANDOM_Y),
      -(FLAME_CURVE_MID_X + Math.random() * FLAME_CURVE_MID_RANDOM_X),
      -(FLAME_CURVE_TOP_Y / 1.5 + Math.random() * FLAME_CURVE_TOP_RANDOM_Y / 1.5),
      0,
      -(FLAME_CURVE_TOP_Y + Math.random() * FLAME_CURVE_TOP_RANDOM_Y)
    );

    g.bezierCurveTo(
      FLAME_CURVE_WIDTH + Math.random() * FLAME_CURVE_RANDOM_X,
      -(FLAME_CURVE_LOW_Y + Math.random() * FLAME_CURVE_LOW_RANDOM_Y),
      FLAME_CURVE_MID_X + Math.random() * FLAME_CURVE_MID_RANDOM_X,
      -(FLAME_CURVE_LOW_Y + Math.random() * FLAME_CURVE_LOW_RANDOM_Y),
      0,
      0
    );

    g.endFill();
  }

  /** Main update loop for flames. */
  private update(delta = 0.016) {
    for (const f of this.flames) {
      const { g } = f;
      f.time += delta * f.speed;

      const breath = Math.sin(f.time * FLAME_BREATH_SPEED + f.offset);
      const scale = 1 + breath * FLAME_BREATH_INTENSITY;
      g.scale.set(scale, scale);

      g.rotation =
        Math.sin(f.time * FLAME_ROTATION_SPEED + f.offset) *
        FLAME_ROTATION_INTENSITY;

      g.alpha =
        FLAME_ALPHA_MIN +
        Math.abs(Math.sin(f.time * FLAME_ALPHA_SPEED + f.offset)) *
          FLAME_ALPHA_RANGE;
    }

    requestAnimationFrame(() => this.update(delta));
  }

  private randomColor(): number {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }
}
