import { Container, Graphics, Text, TextStyle, Application } from "pixi.js";
import { Button } from "@ui/Button";
import type { IScene } from "@core/Scene";


export class BaseScene implements IScene {
  public readonly view = new Container();

  protected bg = new Graphics();
  protected title!: Text;
  protected backBtn!: Button;

  constructor(
    protected titleText: string,
    protected bgColor: number,
    protected onBack: () => void
  ) {}

  onEnter(app: Application) {
    this.view.addChild(this.bg);

    this.title = new Text(
      this.titleText,
      new TextStyle({
        fill: 0xffffff,
        fontSize: 22,
        fontFamily: "Inter, sans-serif",
      })
    );
    this.title.anchor.set(0.5);
    this.view.addChild(this.title);

    this.backBtn = new Button("← Back to Menu", 180, 42);
    this.backBtn.position.set(16, 48);
    this.backBtn.on("pointerup", this.onBack);
    this.view.addChild(this.backBtn);

    const onResize = () => {
      const { width, height } = app.renderer.screen;

      this.bg.clear();
      this.bg.beginFill(this.bgColor);
      this.bg.drawRect(0, 0, width, height);
      this.bg.endFill();

      this.title.position.set(width / 2, height / 2);
    };

    (this.view as any)._onResize = onResize;
    onResize();
  }

  onExit() {}
}
