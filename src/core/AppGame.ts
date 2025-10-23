import * as PIXI from "pixi.js";
import { SceneManager } from "@core/SceneManager";
import { MenuScene } from "@scenes/MenuScene";
import { AceOfShadowsScene } from "@scenes/AceOfShadowsScene";
import { MagicWordsScene } from "@scenes/MagicWordsScene";
import { PhoenixFlameScene } from "@scenes/PhoenixFlameScene";
import { FpsCounter } from "@ui/FpsCounter";
import { Filter } from "pixi.js";

//
// === Constants ===
//

// UI layout
const FPS_MARGIN = 8;
const RESIZE_DEBOUNCE_MS = 300;
const DEFAULT_BG_COLOR = 0x0b0b11;
const FULLSCREEN_TEXT = "Fullscreen";
const BACK_BUTTON_TEXT = "← Back to Menu";

// Pixi defaults
Filter.defaultResolution = Math.min(window.devicePixelRatio || 1, 2);

//
// === AppGame ===
//

/**
 * Main application root: initializes Pixi, UI, and scene management.
 */
export class AppGame {
  public readonly app: PIXI.Application;
  private readonly host: HTMLElement;

  private scenes!: SceneManager;
  private fps!: FpsCounter;
  private uiRoot!: HTMLDivElement;
  private sceneRoot!: PIXI.Container;
  private backBtn!: HTMLButtonElement;
  private fsBtn!: HTMLButtonElement;

  private isResizing = false;
  private resizeTimeout?: number;

  constructor({ host }: { host: HTMLElement }) {
    this.host = host;

    // === Pixi app ===
    this.app = new PIXI.Application({
      backgroundColor: DEFAULT_BG_COLOR,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      resizeTo: window,
    });

    // Scene container
    this.sceneRoot = new PIXI.Container();
    this.sceneRoot.name = "sceneRoot";
    this.app.stage.addChild(this.sceneRoot);

    // === DOM structure ===
    const wrap = document.createElement("div");
    wrap.className = "canvas-wrap";
    wrap.appendChild(this.app.view as HTMLCanvasElement);

    this.uiRoot = document.createElement("div");
    this.uiRoot.className = "ui-layer";

    const uiTop = document.createElement("div");
    uiTop.className = "ui-top";

    const left = document.createElement("div");
    left.className = "ui-row left";

    const right = document.createElement("div");
    right.className = "ui-row right";

    // Back button
    this.backBtn = document.createElement("button");
    this.backBtn.className = "ui back";
    this.backBtn.textContent = BACK_BUTTON_TEXT;
    this.backBtn.onclick = () => this.openMenu();
    left.appendChild(this.backBtn);

    // Fullscreen button
    this.fsBtn = document.createElement("button");
    this.fsBtn.className = "ui fullscreen";
    this.fsBtn.textContent = FULLSCREEN_TEXT;
    this.fsBtn.onclick = () => this.requestFullscreen();
    right.appendChild(this.fsBtn);

    uiTop.append(left, right);
    this.uiRoot.appendChild(uiTop);
    wrap.appendChild(this.uiRoot);
    this.host.appendChild(wrap);

    // === FPS Counter ===
    this.fps = new FpsCounter();
    this.fps.position.set(FPS_MARGIN, FPS_MARGIN);
    (this.fps as any).zIndex = 9999;
    this.app.stage.addChild(this.fps);

    // === Scene Manager ===
    this.scenes = new SceneManager(this.app, this.sceneRoot);
    this.openMenu();

    // === Events ===
    window.addEventListener("resize", () => this.handleResize());
    this.resizeSceneToWindow();

    this.app.ticker.add(() => {
      this.fps.update(performance.now(), this.app.ticker.FPS);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseAll();
      else this.resumeAll();
    });

    window.addEventListener("blur", () => {
      if (!this.isResizing) this.pauseAll();
    });

    window.addEventListener("focus", () => {
      this.resumeAll();
    });

    // Ensure animations resume after manual resize
    this.app.renderer.on("resize", () => {
      if (!this.app.ticker.started) this.resumeAll();
    });
  }

  //
  // === Scene management ===
  //

  private openMenu() {
    const scene = new MenuScene(
      () => this.openScene(new AceOfShadowsScene()),
      () => this.openScene(new MagicWordsScene()),
      () => this.openScene(new PhoenixFlameScene())
    );
    this.scenes.set(scene);
    this.updateUiForMenuScene();
    this.updateBackground(scene);
  }

  private openScene(scene: any) {
    this.scenes.set(scene);
    this.updateUiForGameScene();
    this.updateBackground(scene);
  }

  /** Updates Pixi and page background color to match active scene */
  private updateBackground(scene: any) {
    const color = scene?.bgColor ?? DEFAULT_BG_COLOR;
    this.app.renderer.background.color = color;
    document.body.style.backgroundColor = `#${color.toString(16).padStart(6, "0")}`;
  }

  private updateUiForGameScene() {
    this.backBtn.style.display = "inline-block";
  }

  private updateUiForMenuScene() {
    this.backBtn.style.display = "none";
  }

  //
  // === Resize handling ===
  //

  private handleResize() {
    this.isResizing = true;
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(() => {
      this.isResizing = false;
    }, RESIZE_DEBOUNCE_MS);

    requestAnimationFrame(() => this.resizeSceneToWindow());
  }

  private resizeSceneToWindow() {
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  this.sceneRoot.scale.set(1);
  this.sceneRoot.position.set(0, 0);
  this.app.renderer.resize(ww, wh);
  const activeScene: any = this.scenes?.scene;
  if (activeScene && typeof activeScene.onResize === "function") {
    activeScene.onResize(ww, wh);
  }
}

  //
  // === Lifecycle (pause/resume) ===
  //

  private pauseAll() {
    this.app.ticker.stop();
    const scene: any = this.scenes?.scene;
    if (scene?.timer) {
      clearInterval(scene.timer);
      scene.timer = undefined;
    }
  }

  private resumeAll() {
    this.app.ticker.start();

    const scene: any = this.scenes?.scene;
    if (scene?.startCycle) scene.startCycle();
  }

  //
  // === Fullscreen ===
  //

  private async requestFullscreen() {
    const el: any = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
      } catch {
        /* ignored */
      }
    }
  }
}
