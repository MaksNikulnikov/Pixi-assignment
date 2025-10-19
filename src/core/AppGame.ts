import { Application } from "pixi.js";
import { SceneManager } from "@core/SceneManager";
import { MenuScene } from "@scenes/MenuScene";
import { AceOfShadowsScene } from "@scenes/AceOfShadowsScene";
import { MagicWordsScene } from "@scenes/MagicWordsScene";
import { PhoenixFlameScene } from "@scenes/PhoenixFlameScene";
import { FpsCounter } from "@ui/FpsCounter";

export class AppGame {
  public readonly app: Application;
  private scenes!: SceneManager;
  private readonly host: HTMLElement;
  private fps!: FpsCounter;
  private uiRoot!: HTMLDivElement;

  constructor({ host }: { host: HTMLElement }) {
    this.host = host;

    this.app = new Application({
      backgroundColor: 0x0b0b11,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      resizeTo: window,
    });

    const wrap = document.createElement("div");
    wrap.className = "canvas-wrap";
    wrap.appendChild(this.app.view as HTMLCanvasElement);

    this.uiRoot = document.createElement("div");
    this.uiRoot.className = "ui-layer";

    const uiTop = document.createElement("div");
    uiTop.className = "ui-top";

    const left = document.createElement("div");
    left.className = "ui-row";

    const right = document.createElement("div");
    right.className = "ui-row";

    const fsBtn = document.createElement("button");
    fsBtn.className = "ui";
    fsBtn.textContent = "Fullscreen";
    fsBtn.onclick = () => this.requestFullscreen();

    right.appendChild(fsBtn);
    uiTop.append(left, right);
    this.uiRoot.appendChild(uiTop);

    this.host.append(wrap, this.uiRoot);

    this.app.stage.sortableChildren = true;
    this.fps = new FpsCounter();
    this.fps.position.set(8, 8);
    (this.fps as any).zIndex = 9999;
    this.app.stage.addChild(this.fps);

    const firstTap = () => {
      this.requestFullscreen();
      window.removeEventListener("pointerdown", firstTap);
    };
    window.addEventListener("pointerdown", firstTap, { once: true });

    this.scenes = new SceneManager(this.app);

    const openMenu = () =>
      this.scenes.set(
        new MenuScene(
          () => this.scenes.set(new AceOfShadowsScene(openMenu)),
          () => this.scenes.set(new MagicWordsScene(openMenu)),
          () => this.scenes.set(new PhoenixFlameScene(openMenu))
        )
      );
    openMenu();

    const notifySceneResize = () => {
      const current = this.scenes?.scene as any;
      if (current?.view && typeof current.view._onResize === "function") {
        current.view._onResize();
      }
    };

    notifySceneResize();

    window.addEventListener("resize", () => {
      requestAnimationFrame(notifySceneResize);
    });

    this.app.ticker.add(() => {
      this.fps.update(performance.now(), this.app.ticker.FPS);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        openMenu();
        requestAnimationFrame(notifySceneResize);
      }
    });
  }

  private async requestFullscreen() {
    const el: any = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
      } catch {
        /* noop */
      }
    }
  }
}
