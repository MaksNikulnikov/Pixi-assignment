import { Container, Graphics, Sprite, Text, TextStyle, Texture } from "pixi.js";

export class DialogueBubble extends Container {
  // === Layout Config ===
  private static readonly CONFIG = {
    PADDING_X: 16,
    PADDING_Y: 10,
    MAX_WIDTH: 420,
    FONT_SIZE: 16,
    AVATAR_SIZE: 64,
    CORNER_RADIUS: 16,
    NAME_COLOR: "#00c6ff",
    TEXT_COLOR: "#ffffff",
    MISSING_EMOJI_COLOR: "#ff8080",
    BUBBLE_BG_COLOR: 0xffffff,
    BUBBLE_BG_ALPHA: 0.1,
    NAME_OFFSET_Y: -2,
    NAME_TO_TEXT_GAP: 22,
    AVATAR_PADDING: 10,
    PLACEHOLDER_COLOR: "#3a3a44",
  } as const;

  constructor(
    name: string,
    text: string,
    avatar: { texture: Texture; pos: "left" | "right" } | undefined,
    emojiMap: Map<string, Texture>
  ) {
    super();

    const C = DialogueBubble.CONFIG;
    const content = this.renderTextWithEmojis(text, emojiMap);
    const bubbleWidth = Math.min(C.MAX_WIDTH, content.width + C.PADDING_X * 2);
    const bubbleHeight = content.height + C.PADDING_Y * 2 + C.NAME_TO_TEXT_GAP;

    const bubble = new Graphics()
      .beginFill(C.BUBBLE_BG_COLOR, C.BUBBLE_BG_ALPHA)
      .drawRoundedRect(0, 0, bubbleWidth, bubbleHeight, C.CORNER_RADIUS)
      .endFill();

    const nameLabel = new Text(
      name,
      new TextStyle({
        fill: C.NAME_COLOR,
        fontSize: C.FONT_SIZE - 1,
        fontWeight: "700",
      })
    );
    nameLabel.x = C.PADDING_X;
    nameLabel.y = C.PADDING_Y + C.NAME_OFFSET_Y;

    content.x = C.PADDING_X;
    content.y = nameLabel.y + C.NAME_TO_TEXT_GAP;

    const group = new Container();
    group.addChild(bubble, nameLabel, content);

    const avatarSprite = this.createAvatarSprite(avatar, name);
    const isLeft = avatar?.pos === "left";

    avatarSprite.x = isLeft
      ? -C.AVATAR_SIZE / 1.3 - C.AVATAR_PADDING
      : C.AVATAR_SIZE / 1.3 + C.AVATAR_PADDING;
    avatarSprite.y = bubbleHeight / 2;

    group.x = isLeft ? 0 : -bubbleWidth;
    this.addChild(group, avatarSprite);
  }

  /** Creates avatar sprite or fallback placeholder */
  private createAvatarSprite(
    avatar: { texture: Texture; pos: "left" | "right" } | undefined,
    name: string
  ): Sprite {
    const C = DialogueBubble.CONFIG;
    let tex: Texture;

    try {
      tex = avatar?.texture ?? this.createPlaceholderAvatar(name);
      if (!tex.valid) throw new Error("Invalid texture");
    } catch {
      console.warn(`[DialogueBubble] Avatar failed for "${name}", using placeholder`);
      tex = this.createPlaceholderAvatar(name);
    }

    const sprite = new Sprite(tex);
    sprite.width = sprite.height = C.AVATAR_SIZE;
    sprite.anchor.set(0.5);
    return sprite;
  }

  /** Simple round placeholder avatar with first letter */
  private createPlaceholderAvatar(name: string): Texture {
    const C = DialogueBubble.CONFIG;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = C.AVATAR_SIZE;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = C.PLACEHOLDER_COLOR;
    ctx.beginPath();
    ctx.arc(C.AVATAR_SIZE / 2, C.AVATAR_SIZE / 2, C.AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name[0]?.toUpperCase() ?? "?", C.AVATAR_SIZE / 2, C.AVATAR_SIZE / 2);

    return Texture.from(canvas);
  }

  /** Renders text with inline emojis and automatic word wrapping */
  private renderTextWithEmojis(text: string, emojiMap: Map<string, Texture>): Container {
    const C = DialogueBubble.CONFIG;
    const container = new Container();
    const fontSize = C.FONT_SIZE;
    const lineHeight = fontSize * 1.4;
    const maxWidth = C.MAX_WIDTH - C.PADDING_X * 2;
    const emojiSize = fontSize * 1.1;

    const parts = text.split(/(\{.*?\})/g);
    let x = 0;
    let y = 0;

    const newLine = () => {
      x = 0;
      y += lineHeight;
    };

    for (const part of parts) {
      const match = part.match(/\{(.*?)\}/);
      if (match) {
        const key = match[1];
        const tex = emojiMap.get(key);

        if (!tex) {
          console.warn(`[DialogueBubble] Missing emoji: {${key}} — rendered as text`);
          const fallback = new Text(`{${key}}`, new TextStyle({
            fill: C.MISSING_EMOJI_COLOR,
            fontSize,
            fontStyle: "italic",
          }));

          if (x + fallback.width > maxWidth) newLine();
          fallback.x = x;
          fallback.y = y;
          container.addChild(fallback);
          x += fallback.width + 4;
          continue;
        }

        if (x + emojiSize > maxWidth) newLine();
        const emoji = new Sprite(tex);
        emoji.width = emoji.height = emojiSize;
        emoji.x = x;
        emoji.y = y + 3;
        container.addChild(emoji);
        x += emojiSize + 4;
      } else {
        const words = part.split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;
          const t = new Text(word, new TextStyle({
            fill: C.TEXT_COLOR,
            fontSize,
          }));

          if (x + t.width > maxWidth && word.trim() !== "") newLine();
          t.x = x;
          t.y = y;
          container.addChild(t);
          x += t.width;
        }
      }
    }

    container.height = y + lineHeight;
    return container;
  }
}
