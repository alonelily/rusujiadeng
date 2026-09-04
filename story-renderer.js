(function () {
  "use strict";

  const STORY_DIALOGUE_BOX_URL = "assets/story/dialogue-box.png";
  const STORY_NAME_BOX_URL = "assets/story/name-box.png";
  const STORY_DIALOGUE_UI_CONTROLS_URL = "assets/story/dialogue-ui-controls.png";
  const STORY_CHOICE_BOX_URL = "assets/story/choice-box.png";
  const STORY_FALLBACK_FONT_FAMILY = '"Microsoft YaHei", sans-serif';
  const STORY_FONT_FAMILY = '"FgoFzZhengzhong", "Microsoft YaHei", sans-serif';
  const STORY_FONT_OPTIONS = {
    system: { label: "系统默认", family: STORY_FALLBACK_FONT_FAMILY, url: null },
    "fgo-story": { label: "FGO Story", family: "FGOStory", url: "assets/fonts/fgo-story.otf" },
    "font-2": { label: "字体 2 · OTF", family: "FgoFont2", url: "assets/fonts/2.otf" },
    "font-3": { label: "字体 3 · OTF", family: "FgoFont3", url: "assets/fonts/3.otf" },
    "font-4": { label: "字体 4 · OTF", family: "FgoFont4", url: "assets/fonts/4.otf" },
    "font-5": { label: "字体 5 · OTF", family: "FgoFont5", url: "assets/fonts/5.otf" },
    "font-fzlthjw": { label: "FZLTHJW · TTF", family: "FgoFzlthjw", url: "assets/fonts/FZLTHJW.TTF" },
    "font-reeji": { label: "瑞锦云峰宋 · TTF", family: "FgoReeji", url: "assets/fonts/Reeji-CloudSongDa-GB%20Regular.ttf" },
    "font-simsun": { label: "宋体 · TTC", family: "FgoSimSun", url: "assets/fonts/simsun.ttc" },
    "font-fzxiaobiao": { label: "方正小标宋 · TTF", family: "FgoFzXiaobiao", url: "assets/fonts/%E6%96%B9%E6%AD%A3%E5%B0%8F%E6%A0%87%E5%AE%8B_GBK.ttf" },
    "font-fzzhengzhong": { label: "方正正中黑 · TTF", family: "FgoFzZhengzhong", url: "assets/fonts/fz-zhengzhong.ttf" }
  };
  const STORY_BASE_WIDTH = 1024;
  const STORY_DIALOGUE_WIDTH = 984;
  const STORY_DIALOGUE_HEIGHT = 137;
  const STORY_VERTICAL_DIALOGUE_HEIGHT = 222;
  const STORY_NAME_WIDTH = 360;
  const STORY_NAME_HEIGHT = 48;
  const STORY_NAME_TEXT_OPACITY = 1;
  const STORY_DIALOGUE_TEXT_OPACITY = 1;
  const STORY_DIALOGUE_UI_CONTROLS_WIDTH = 1140;
  const STORY_DIALOGUE_UI_CONTROLS_HEIGHT = 178;
  const STORY_CHOICE_BOX_WIDTH = 780;
  const STORY_CHOICE_BOX_HEIGHT = 84;
  const STORY_CHOICE_MAX_WIDTH = 0;
  const STORY_CHOICE_GAP = 18;
  const STORY_TYPEWRITER_CHARACTERS_PER_SECOND = 20;
  const STORY_TYPEWRITER_SPEED_MIN = 1;
  const STORY_TYPEWRITER_SPEED_MAX = 60;
  const STORY_TYPEWRITER_PAUSE_MIN = 0.1;
  const STORY_TYPEWRITER_PAUSE_MAX = 10;
  const STORY_DIALOGUE_FONT_SCALE_MIN = 0.8;
  const STORY_DIALOGUE_FONT_SCALE_MAX = 1.4;
  const STORY_ACTOR_ANIMATION_DURATION_DEFAULT = 0.7;
  const STORY_ACTOR_EXIT_DURATION_DEFAULT = 0.5;

  function clampStoryAnimationProgress(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function applyStoryAnimationEasing(progress, easing) {
    const value = clampStoryAnimationProgress(progress);
    if (easing === "linear") return value;
    if (easing === "ease-in") return value * value;
    if (easing === "ease-in-out") {
      return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
    }
    return 1 - Math.pow(1 - value, 3);
  }

  function drawCover(context, image, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function getWrappedLines(context, text, maxWidth, maxLines) {
    const characters = Array.from(String(text || ""));
    const lines = [];
    let line = "";
    let consumed = 0;

    for (let index = 0; index < characters.length; index += 1) {
      const character = characters[index];
      if (character === "\n") {
        lines.push(line);
        line = "";
        consumed = index + 1;
        if (lines.length >= maxLines) {
          break;
        }
        continue;
      }
      const candidate = line + character;
      if (context.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = character;
        if (lines.length >= maxLines) {
          consumed = index;
          break;
        }
      } else {
        line = candidate;
      }
      consumed = index + 1;
    }

    if (lines.length < maxLines && line) {
      lines.push(line);
    }
    const hasOverflow = consumed < characters.length;
    if (hasOverflow && lines.length) {
      let lastLine = lines[Math.min(lines.length, maxLines) - 1];
      while (lastLine && context.measureText(`${lastLine}…`).width > maxWidth) {
        lastLine = lastLine.slice(0, -1);
      }
      lines[Math.min(lines.length, maxLines) - 1] = `${lastLine}…`;
    }
    return lines.slice(0, maxLines);
  }

  function getWrappedStyledLines(context, text, maxWidth, maxLines, getFont) {
    const characters = Array.from(String(text || ""));
    const lines = [];
    let items = [];
    let lineWidth = 0;
    let consumed = 0;
    const pushLine = () => {
      if (!items.length) {
        return;
      }
      lines.push({ items, width: lineWidth });
      items = [];
      lineWidth = 0;
    };

    for (let index = 0; index < characters.length; index += 1) {
      const character = characters[index];
      if (character === "\n") {
        pushLine();
        consumed = index + 1;
        if (lines.length >= maxLines) {
          break;
        }
        continue;
      }
      context.font = getFont(index);
      const characterWidth = context.measureText(character).width;
      if (items.length && lineWidth + characterWidth > maxWidth) {
        pushLine();
        if (lines.length >= maxLines) {
          consumed = index;
          break;
        }
      }
      items.push({ character, index, width: characterWidth });
      lineWidth += characterWidth;
      consumed = index + 1;
    }
    if (lines.length < maxLines) {
      pushLine();
    }

    if (consumed < characters.length && lines.length) {
      const lastLine = lines[Math.min(lines.length, maxLines) - 1];
      const ellipsisFont = getFont(lastLine.items[lastLine.items.length - 1]?.index ?? 0);
      context.font = ellipsisFont;
      let ellipsisWidth = context.measureText("…").width;
      while (lastLine.items.length && lastLine.width + ellipsisWidth > maxWidth) {
        const removed = lastLine.items.pop();
        lastLine.width -= removed.width;
      }
      if (lastLine.width + ellipsisWidth > maxWidth) {
        context.font = getFont(0);
        ellipsisWidth = context.measureText("…").width;
      }
      lastLine.items.push({ character: "…", index: null, width: ellipsisWidth });
      lastLine.width += ellipsisWidth;
    }
    return lines.slice(0, maxLines);
  }

  function drawOutlinedText(context, text, x, y) {
    context.strokeText(text, x, y);
    context.fillText(text, x, y);
  }

  function setDialogueGradient(context, x, topY, bottomY) {
    const gradient = context.createLinearGradient(x, topY, x, bottomY);
    gradient.addColorStop(0, "#f8f8f5");
    gradient.addColorStop(0.52, "#e0e1df");
    gradient.addColorStop(1, "#aeb3b7");
    context.fillStyle = gradient;
  }

  function fitFontSize(context, text, preferredSize, minimumSize, maxWidth, weight, fontFamily) {
    let size = preferredSize;
    while (size > minimumSize) {
      context.font = `${weight} ${Math.round(size)}px ${fontFamily}`;
      if (context.measureText(text).width <= maxWidth) {
        break;
      }
      size -= 1;
    }
    return Math.max(minimumSize, size);
  }

  function normalizeTypewriterSpeed(value) {
    const speed = Number(value);
    return Number.isFinite(speed)
      ? Math.max(STORY_TYPEWRITER_SPEED_MIN, Math.min(STORY_TYPEWRITER_SPEED_MAX, speed))
      : STORY_TYPEWRITER_CHARACTERS_PER_SECOND;
  }

  function getTypewriterPauses(dialogue, characterCount) {
    const pauses = Array.isArray(dialogue?.typewriterPauses) ? dialogue.typewriterPauses : [];
    return pauses.map((pause) => ({
      at: Math.max(0, Math.min(characterCount, Math.floor(Number(pause?.at) || 0))),
      duration: Number.isFinite(Number(pause?.duration))
        ? Math.max(STORY_TYPEWRITER_PAUSE_MIN, Math.min(STORY_TYPEWRITER_PAUSE_MAX, Number(pause.duration)))
        : STORY_TYPEWRITER_PAUSE_MIN
    })).sort((left, right) => left.at - right.at);
  }

  function getTypewriterSpeedRanges(dialogue, characterCount) {
    const ranges = Array.isArray(dialogue?.textSpeedRanges) ? dialogue.textSpeedRanges : [];
    return ranges.map((range) => ({
      start: Math.max(0, Math.min(characterCount, Math.floor(Number(range?.start) || 0))),
      end: Math.max(0, Math.min(characterCount, Math.floor(Number(range?.end) || 0))),
      speed: normalizeTypewriterSpeed(range?.speed)
    })).filter((range) => range.end > range.start);
  }

  function getTypewriterSpeedAt(speedRanges, index, fallback) {
    const range = speedRanges.find((item) => index >= item.start && index < item.end);
    return range ? range.speed : fallback;
  }

  function getDialogueTypewriterTiming(dialogue) {
    const characters = Array.from(String(dialogue?.text || ""));
    const speed = normalizeTypewriterSpeed(dialogue?.typewriterSpeed);
    const pauses = getTypewriterPauses(dialogue, characters.length);
    const speedRanges = getTypewriterSpeedRanges(dialogue, characters.length);
    const pausesByPosition = new Map();
    pauses.forEach((pause) => {
      pausesByPosition.set(pause.at, (pausesByPosition.get(pause.at) || 0) + pause.duration);
    });
    let elapsed = 0;
    const revealTimes = characters.map((_character, index) => {
      elapsed += pausesByPosition.get(index) || 0;
      elapsed += 1 / getTypewriterSpeedAt(speedRanges, index, speed);
      return elapsed;
    });
    const totalDuration = elapsed + (pausesByPosition.get(characters.length) || 0);
    return { speed, speedRanges, pauses, revealTimes, totalDuration };
  }

  function getVisibleDialogueText(dialogue, normalizedProgress) {
    const characters = Array.from(String(dialogue.text || ""));
    if (!dialogue.typewriter || normalizedProgress >= 1) {
      return characters.join("");
    }
    const duration = Math.max(0, Number(dialogue.duration) || 0);
    const elapsedSeconds = normalizedProgress * duration;
    const timing = getDialogueTypewriterTiming(dialogue);
    const visibleCount = timing.revealTimes.reduce(
      (count, revealTime) => count + (revealTime <= elapsedSeconds + 1e-9 ? 1 : 0),
      0
    );
    return characters.slice(0, visibleCount).join("");
  }

  function getActorSize(entry, width, height, aspect) {
    const naturalWidth = entry.image.naturalWidth || width;
    const naturalHeight = entry.image.naturalHeight || height;
    // Keep this baseline independent of the number of actors. Additional actors
    // change their positions only; they must not make every character smaller.
    const targetHeight = aspect === "16:9" ? height * 1.14 : height * 0.92;
    const maxWidth = width * 0.82;
    const actorWidth = Math.min(maxWidth, targetHeight * naturalWidth / naturalHeight);
    return {
      width: actorWidth,
      height: actorWidth * naturalHeight / naturalWidth
    };
  }

  function getActorLayout(actorEntries, width, height, aspect) {
    const count = actorEntries.length;
    if (count === 1) {
      const size = getActorSize(actorEntries[0].entry, width, height, aspect);
      return [{
        ...actorEntries[0],
        x: (width - size.width) / 2,
        y: -height * 0.02,
        ...size
      }];
    }

    if (count === 2) {
      // Match the in-game two-character composition: the speaker occupies the
      // left third while the responding character sits just right of center.
      const centers = aspect === "16:9" ? [0.21, 0.69] : [0.28, 0.72];
      return actorEntries.map((entryInfo, index) => {
        const size = getActorSize(entryInfo.entry, width, height, aspect);
        return {
          ...entryInfo,
          x: Math.max(0, Math.min(width - size.width, width * centers[index] - size.width / 2)),
          y: height - size.height,
          ...size
        };
      });
    }

    const sizes = actorEntries.map((entryInfo) => getActorSize(entryInfo.entry, width, height, aspect));
    const widest = Math.max(...sizes.map((size) => size.width));
    const edge = Math.min(width / 2, Math.max(width * 0.08, widest / 2));
    return actorEntries.map((entryInfo, index) => {
      const size = sizes[index];
      const center = edge + (width - edge * 2) * index / Math.max(1, count - 1);
      return {
        ...entryInfo,
        x: Math.max(0, Math.min(width - size.width, center - size.width / 2)),
        y: height - size.height,
        ...size
      };
    });
  }

  function getDialogueLayout(width, height, aspect) {
    const scale = width / STORY_BASE_WIDTH;
    const nameScale = aspect === "9:16" ? Math.max(scale, 0.72) : scale;
    const boxWidth = STORY_DIALOGUE_WIDTH * scale;
    const boxHeight = (aspect === "9:16" ? STORY_VERTICAL_DIALOGUE_HEIGHT : STORY_DIALOGUE_HEIGHT) * scale;
    const boxX = 20 * scale;
    // Vertical stories leave the lower character area visible and place the
    // dialogue panel in the visual middle, closer to the in-game composition.
    const boxY = aspect === "9:16"
      ? Math.min(height - boxHeight - 11 * scale, height * 0.62)
      : height - boxHeight - 11 * scale;
    const nameX = 4 * nameScale;
    const nameY = boxY - 32 * nameScale;
    const nameWidth = STORY_NAME_WIDTH * nameScale;
    const nameHeight = STORY_NAME_HEIGHT * nameScale;
    const dialogueFontSize = Math.max(aspect === "9:16" ? 20 : 0, 28 * scale);
    const nameFontSize = Math.max(aspect === "9:16" ? 18 : 0, 32 * scale);
    const lineHeight = Math.max(aspect === "9:16" ? 28 : 0, 46 * scale);
    return {
      scale,
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      nameX,
      nameY,
      nameWidth,
      nameHeight,
      dialogueFontSize,
      nameFontSize,
      lineHeight,
      speakerX: 30 * nameScale,
      speakerY: nameY + 33 * nameScale,
      textX: boxX + 51 * scale,
      textY: boxY + Math.max(64 * scale, aspect === "9:16" ? 36 : 0),
      textWidth: boxWidth - 102 * scale
    };
  }

  function getChoiceLayout(options, width, height, aspect) {
    const count = Array.isArray(options) ? options.length : 0;
    if (!count) {
      return [];
    }
    const scale = width / 1024;
    const boxWidth = STORY_CHOICE_BOX_WIDTH * scale;
    const boxHeight = STORY_CHOICE_BOX_HEIGHT * scale;
    const gap = STORY_CHOICE_GAP * scale;
    const totalHeight = count * boxHeight + Math.max(0, count - 1) * gap;
    const startY = aspect === "9:16"
      ? Math.max(70 * scale, height * 0.25 - totalHeight / 2)
      : Math.max(30 * scale, height * 0.34 - totalHeight / 2);
    return options.map((option, index) => ({
      option,
      index,
      x: (width - boxWidth) / 2,
      y: startY + index * (boxHeight + gap),
      width: boxWidth,
      height: boxHeight
    }));
  }

  function drawDialogueFallback(context, layout) {
    context.fillStyle = "rgb(3 24 58 / 90%)";
    context.fillRect(layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);
  }

  function drawNameFallback(context, layout) {
    context.fillStyle = "rgb(31 91 165 / 96%)";
    context.fillRect(layout.nameX, layout.nameY, layout.nameWidth, layout.nameHeight);
  }

  function createRenderer(options) {
    const canvas = options.canvas;
    const imageCache = options.imageCache || new Map();
    let lastScene = null;
    let lastProgress = 1;
    let activeFontKey = "system";
    let activeFontFamily = STORY_FALLBACK_FONT_FAMILY;
    const fontPromises = new Map();
    let actorEffectCanvas = null;

    function getFontOption(key) {
      return STORY_FONT_OPTIONS[key] || STORY_FONT_OPTIONS.system;
    }

    function loadFont(key) {
      const option = getFontOption(key);
      if (!option.url) {
        return Promise.resolve(option);
      }
      if (fontPromises.has(key)) {
        return fontPromises.get(key);
      }
      const promise = (async () => {
        if (typeof FontFace !== "function" || !document.fonts) {
          throw new Error("FontFace API unavailable");
        }
        const response = await fetch(option.url);
        if (!response.ok) {
          throw new Error(`字体资源读取失败 (${response.status})`);
        }
        const face = new FontFace(option.family, await response.arrayBuffer(), {
          style: "normal",
          weight: "400 700"
        });
        await face.load();
        document.fonts.add(face);
        await Promise.all([
          document.fonts.load(`500 20px "${option.family}"`),
          document.fonts.load(`600 20px "${option.family}"`)
        ]);
        return option;
      })().catch((error) => {
        fontPromises.delete(key);
        throw error;
      });
      fontPromises.set(key, promise);
      return promise;
    }

    function setFont(key) {
      const normalizedKey = Object.prototype.hasOwnProperty.call(STORY_FONT_OPTIONS, key) ? key : "system";
      return loadFont(normalizedKey).then((option) => {
        activeFontKey = normalizedKey;
        activeFontFamily = option.family;
        if (lastScene && (!options.shouldRender || options.shouldRender())) {
          render(lastScene, lastProgress);
        }
        return { key: activeFontKey, family: activeFontFamily, label: option.label };
      });
    }

    function loadImage(url) {
      if (!url) {
        return null;
      }
      const cached = imageCache.get(url);
      if (cached) {
        return cached;
      }
      const image = new Image();
      image.crossOrigin = "anonymous";
      let settle;
      const readyPromise = new Promise((resolve) => {
        settle = resolve;
      });
      const entry = { image, ready: false, failed: false, promise: readyPromise };
      image.onload = () => {
        entry.ready = true;
        settle(entry);
        if (!options.shouldRender || options.shouldRender()) {
          render(lastScene, lastProgress);
        }
      };
      image.onerror = () => {
        entry.failed = true;
        settle(entry);
      };
      image.src = url;
      imageCache.set(url, entry);
      return entry;
    }

    function preload(urls = []) {
      const allUrls = Array.from(new Set([
        STORY_DIALOGUE_BOX_URL,
        STORY_NAME_BOX_URL,
        STORY_DIALOGUE_UI_CONTROLS_URL,
        STORY_CHOICE_BOX_URL,
        ...urls.filter(Boolean)
      ]));
      const entries = allUrls.map((url) => loadImage(url)).filter(Boolean);
      return Promise.all(entries.map((entry) => {
        if (entry.ready || entry.failed) {
          return entry;
        }
        return entry.promise || Promise.resolve(entry);
      })).then(() => entries);
    }

    function drawDialogue(context, scene, width, height, aspect, normalizedProgress, alpha, fontScale = 1) {
      const dialogueAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
      if (dialogueAlpha <= 0 || scene.dialogue?.showBox === false || (!scene.dialogue.text && !scene.dialogue.speaker)) {
        return;
      }
      context.globalAlpha = dialogueAlpha;
      const layout = getDialogueLayout(width, height, aspect);
      // Keep the dialogue box geometry stable while allowing stronger or more
      // restrained body text. Line spacing follows the font size so multi-line
      // dialogue remains legible in both landscape and portrait layouts.
      const normalizedFontScale = Number.isFinite(Number(fontScale))
        ? Math.max(STORY_DIALOGUE_FONT_SCALE_MIN, Math.min(STORY_DIALOGUE_FONT_SCALE_MAX, Number(fontScale)))
        : 1;
      layout.dialogueFontSize *= normalizedFontScale;
      layout.lineHeight *= normalizedFontScale;
      const dialogueBox = loadImage(STORY_DIALOGUE_BOX_URL);
      const nameBox = loadImage(STORY_NAME_BOX_URL);
      const uiControls = loadImage(STORY_DIALOGUE_UI_CONTROLS_URL);
      if (dialogueBox && dialogueBox.ready) {
        context.drawImage(dialogueBox.image, layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);
      } else {
        drawDialogueFallback(context, layout);
      }
      if (nameBox && nameBox.ready) {
        context.drawImage(nameBox.image, layout.nameX, layout.nameY, layout.nameWidth, layout.nameHeight);
      } else {
        drawNameFallback(context, layout);
      }

      // The supplied asset is a transparent strip containing the in-game
      // record/auto controls. Its transparent padding is intentional. In
      // landscape the strip is anchored to the lower-right edge; in portrait
      // it follows the dialogue panel so the controls do not drift below it.
      if (uiControls && uiControls.ready) {
        const controlsScale = width / STORY_DIALOGUE_UI_CONTROLS_WIDTH;
        const controlsWidth = STORY_DIALOGUE_UI_CONTROLS_WIDTH * controlsScale;
        const controlsHeight = STORY_DIALOGUE_UI_CONTROLS_HEIGHT * controlsScale;
        const controlsY = aspect === "9:16" ? layout.boxY : height - controlsHeight;
        context.drawImage(
          uiControls.image,
          width - controlsWidth,
          controlsY,
          controlsWidth,
          controlsHeight
        );
      }

      context.globalAlpha = dialogueAlpha * STORY_NAME_TEXT_OPACITY;
      context.textBaseline = "alphabetic";
      context.fillStyle = "#fafaf8";
      context.strokeStyle = "rgb(7 27 58 / 86%)";
      context.lineJoin = "round";
      context.lineWidth = Math.max(1, 1.35 * layout.scale);
      context.shadowColor = "rgb(0 0 0 / 72%)";
      context.shadowBlur = Math.max(0.8, 1.35 * layout.scale);
      context.shadowOffsetX = Math.max(0.6, 1.25 * layout.scale);
      context.shadowOffsetY = Math.max(0.8, 1.65 * layout.scale);

      const speaker = scene.dialogue.speaker || "旁白";
      const speakerWidth = layout.nameWidth - 54 * layout.scale;
      const fittedNameSize = fitFontSize(
        context,
        speaker,
        layout.nameFontSize,
        Math.max(12, 18 * layout.scale),
        speakerWidth,
        600,
        activeFontFamily
      );
      context.font = `600 ${Math.round(fittedNameSize)}px ${activeFontFamily}`;
      setDialogueGradient(
        context,
        layout.speakerX,
        layout.speakerY - fittedNameSize,
        layout.speakerY + Math.max(3, fittedNameSize * 0.12)
      );
      drawOutlinedText(context, speaker, layout.speakerX, layout.speakerY);

      const visibleText = getVisibleDialogueText(scene.dialogue, normalizedProgress);
      context.globalAlpha = dialogueAlpha * STORY_DIALOGUE_TEXT_OPACITY;
      context.shadowColor = "rgb(0 0 0 / 34%)";
      context.shadowBlur = Math.max(0.5, 0.8 * layout.scale);
      context.shadowOffsetX = Math.max(0.25, 0.45 * layout.scale);
      context.shadowOffsetY = Math.max(0.35, 0.65 * layout.scale);
      const maxDialogueLines = aspect === "9:16" ? 3 : 2;
      const visibleCharacters = Array.from(visibleText);
      const textColors = Array(visibleCharacters.length).fill(null);
      const textFontScales = Array(visibleCharacters.length).fill(1);
      (Array.isArray(scene.dialogue.textColorRanges) ? scene.dialogue.textColorRanges : []).forEach((range) => {
        const start = Math.max(0, Math.min(visibleCharacters.length, Math.floor(Number(range.start) || 0)));
        const end = Math.max(start, Math.min(visibleCharacters.length, Math.floor(Number(range.end) || 0)));
        const color = String(range.color || "").trim();
        if (end > start && /^#[0-9a-f]{6}$/i.test(color)) {
          textColors.fill(color, start, end);
        }
      });
      (Array.isArray(scene.dialogue.textFontSizeRanges) ? scene.dialogue.textFontSizeRanges : []).forEach((range) => {
        const start = Math.max(0, Math.min(visibleCharacters.length, Math.floor(Number(range.start) || 0)));
        const end = Math.max(start, Math.min(visibleCharacters.length, Math.floor(Number(range.end) || 0)));
        const rawScale = Number(range.scale ?? range.fontSize);
        const scale = Number.isFinite(rawScale) ? (rawScale > 3 ? rawScale / 100 : rawScale) : 1;
        if (end > start && Number.isFinite(scale)) {
          textFontScales.fill(Math.max(0.6, Math.min(1.8, scale)), start, end);
        }
      });
      const getTextFont = (index) => {
        const localScale = index === null || index === undefined ? 1 : textFontScales[index] || 1;
        return `500 ${Math.max(1, Math.round(layout.dialogueFontSize * localScale))}px ${activeFontFamily}`;
      };
      getWrappedStyledLines(context, visibleText, layout.textWidth, maxDialogueLines, getTextFont).forEach((line, index) => {
        const lineY = layout.textY + index * layout.lineHeight;
        let cursorX = layout.textX;
        const positions = [];
        line.items.forEach((item) => {
          const font = getTextFont(item.index);
          context.font = font;
          const itemWidth = context.measureText(item.character).width;
          positions.push({ ...item, x: cursorX, width: itemWidth });
          const itemScale = item.index === null ? 1 : textFontScales[item.index] || 1;
          const itemSize = layout.dialogueFontSize * itemScale;
          const color = item.index === null ? null : textColors[item.index];
          if (color) {
            context.fillStyle = color;
          } else {
            setDialogueGradient(
              context,
              cursorX,
              lineY - itemSize,
              lineY + Math.max(3, itemSize * 0.12)
            );
          }
          drawOutlinedText(context, item.character, cursorX, lineY);
          cursorX += itemWidth;
        });

        const rubyRanges = Array.isArray(scene.dialogue.textRubyRanges) ? scene.dialogue.textRubyRanges : [];
        rubyRanges.forEach((range) => {
          const covered = positions.filter((item) => item.index !== null && item.index >= range.start && item.index < range.end);
          if (!covered.length || !range.ruby) {
            return;
          }
          const rubySize = Math.max(10, Math.round(layout.dialogueFontSize * 0.42));
          const rubyX = (covered[0].x + covered[covered.length - 1].x + covered[covered.length - 1].width) / 2;
          const rubyY = lineY - layout.dialogueFontSize * 1.08;
          context.font = `600 ${rubySize}px ${activeFontFamily}`;
          context.textAlign = "center";
          context.fillStyle = "#f8f8f5";
          context.strokeStyle = "rgb(7 27 58 / 86%)";
          context.lineWidth = Math.max(1, 1.1 * layout.scale);
          context.shadowColor = "rgb(0 0 0 / 42%)";
          context.shadowBlur = Math.max(0.5, 0.7 * layout.scale);
          context.strokeText(String(range.ruby), rubyX, rubyY);
          context.fillText(String(range.ruby), rubyX, rubyY);
          context.textAlign = "left";
          context.shadowColor = "rgb(0 0 0 / 34%)";
          context.shadowBlur = Math.max(0.5, 0.8 * layout.scale);
        });
      });
      context.textAlign = "left";
      context.shadowColor = "transparent";
      context.shadowBlur = 0;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
    }

    function drawActorFlash(context, image, x, y, width, height, alpha) {
      if (!canvas || !image || alpha <= 0) {
        return;
      }
      if (!actorEffectCanvas) {
        actorEffectCanvas = document.createElement("canvas");
      }
      if (actorEffectCanvas.width !== canvas.width || actorEffectCanvas.height !== canvas.height) {
        actorEffectCanvas.width = canvas.width;
        actorEffectCanvas.height = canvas.height;
      }
      const effectContext = actorEffectCanvas.getContext("2d");
      effectContext.clearRect(0, 0, actorEffectCanvas.width, actorEffectCanvas.height);
      effectContext.globalCompositeOperation = "source-over";
      effectContext.globalAlpha = 1;
      effectContext.drawImage(image, x, y, width, height);
      effectContext.globalCompositeOperation = "source-in";
      effectContext.globalAlpha = alpha;
      effectContext.fillStyle = "#fff";
      effectContext.fillRect(0, 0, actorEffectCanvas.width, actorEffectCanvas.height);
      effectContext.globalCompositeOperation = "source-over";
      effectContext.globalAlpha = 1;
      context.drawImage(actorEffectCanvas, 0, 0);
    }

    function drawChoices(context, scene, width, height, aspect, alpha, fontScale = 1) {
      const choices = scene.choiceSegment ? (Array.isArray(scene.choiceSegment.options)
        ? scene.choiceSegment.options.filter((option) => option && String(option.text || "").trim())
        : []) : (scene.showChoices === false ? [] : (Array.isArray(scene.options)
        ? scene.options.filter((option) => option && String(option.text || "").trim())
        : []));
      if (!choices.length) {
        return;
      }
      const choiceBox = loadImage(STORY_CHOICE_BOX_URL);
      const selectedId = scene.choiceSegment?.selectedOptionId || scene.selectedOptionId ? String(scene.choiceSegment?.selectedOptionId || scene.selectedOptionId) : "";
      const selectionProgress = Number.isFinite(Number(scene.optionSelectionProgress))
        ? Math.max(0, Math.min(1, Number(scene.optionSelectionProgress)))
        : 0;
      const layout = getChoiceLayout(choices, width, height, aspect);
      const baseScale = width / STORY_BASE_WIDTH;
      const normalizedFontScale = Number.isFinite(Number(fontScale))
        ? Math.max(STORY_DIALOGUE_FONT_SCALE_MIN, Math.min(STORY_DIALOGUE_FONT_SCALE_MAX, Number(fontScale)))
        : 1;
      context.save();
      context.globalAlpha = alpha;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `500 ${Math.max(16, Math.round(28 * baseScale))}px ${activeFontFamily}`;
      context.strokeStyle = "rgb(7 27 58 / 86%)";
      context.lineJoin = "round";
      context.lineWidth = Math.max(1, 1.35 * baseScale);
      context.shadowColor = "rgb(0 0 0 / 42%)";
      context.shadowBlur = Math.max(0.5, 0.9 * baseScale);
      context.shadowOffsetY = Math.max(0.5, 0.8 * baseScale);
      layout.forEach(({ option, x, y, width: boxWidth, height: boxHeight }) => {
        const selected = selectedId && String(option.id) === selectedId;
        const text = String(option.text || "").trim();
        const centerX = x + boxWidth / 2;
        const centerY = y + boxHeight / 2;
        const preferredFontSize = 28 * baseScale * normalizedFontScale;
        const fittedFontSize = fitFontSize(
          context,
          text,
          preferredFontSize,
          Math.max(13, 17 * baseScale),
          boxWidth - 70 * baseScale,
          500,
          activeFontFamily
        );
        context.font = `500 ${Math.round(fittedFontSize)}px ${activeFontFamily}`;
        context.globalAlpha = alpha;
        if (choiceBox && choiceBox.ready) {
          context.drawImage(choiceBox.image, x, y, boxWidth, boxHeight);
        } else {
          context.fillStyle = "rgb(4 9 14 / 94%)";
          context.strokeStyle = "#4a8fd8";
          context.lineWidth = Math.max(1, 2 * baseScale);
          context.fillRect(x, y, boxWidth, boxHeight);
          context.strokeRect(x, y, boxWidth, boxHeight);
        }

        // The option geometry remains fixed while its base layer fades. A very
        // brief color flash precedes the independently expanding text echo.
        const flashActive = selected && selectionProgress > 0 && selectionProgress < 0.16;
        context.globalAlpha = alpha;
        context.strokeStyle = "rgb(7 27 58 / 86%)";
        context.lineWidth = Math.max(1, 1.35 * baseScale);
        if (flashActive) {
          context.fillStyle = "#f3c86b";
        } else {
          setDialogueGradient(
            context,
            centerX,
            centerY - fittedFontSize,
            centerY + Math.max(3, fittedFontSize * 0.12)
          );
        }
        context.shadowColor = "rgb(0 0 0 / 34%)";
        context.shadowBlur = Math.max(0.5, 0.8 * baseScale);
        context.shadowOffsetX = Math.max(0.25, 0.45 * baseScale);
        context.shadowOffsetY = Math.max(0.35, 0.65 * baseScale);
        drawOutlinedText(context,
          text,
          centerX,
          centerY
        );

        const echoProgress = selected
          ? Math.max(0, Math.min(1, (selectionProgress - 0.12) / 0.68))
          : 0;
        if (echoProgress > 0 && echoProgress < 1) {
          const easedEcho = applyStoryAnimationEasing(echoProgress, "ease-out");
          const textWidth = Math.max(1, context.measureText(text).width);
          const maximumScale = Math.max(1, Math.min(
            1.55,
            (boxWidth - 44 * baseScale) / textWidth,
            (boxHeight - 18 * baseScale) / Math.max(1, fittedFontSize)
          ));
          const echoScale = 1 + (maximumScale - 1) * easedEcho;
          context.save();
          context.translate(centerX, centerY);
          context.scale(echoScale, echoScale);
          context.globalAlpha = Math.pow(1 - echoProgress, 1.45) * 0.72;
          context.fillStyle = "#f8f8f5";
          context.strokeStyle = "rgb(7 27 58 / 55%)";
          context.lineWidth = Math.max(0.75, 1.1 * baseScale) / echoScale;
          context.shadowColor = "transparent";
          context.shadowBlur = 0;
          context.shadowOffsetY = 0;
          drawOutlinedText(context, text, 0, 0);
          context.restore();
        }
        context.shadowColor = "transparent";
        context.shadowBlur = 0;
        context.shadowOffsetY = 0;
        context.globalAlpha = alpha;
      });
      context.restore();
    }

    function render(scene, progress) {
      if (!canvas || !scene) {
        return;
      }
      lastScene = scene;
      lastProgress = progress;
      const context = canvas.getContext("2d");
      const aspect = options.getAspect() === "9:16" ? "9:16" : "16:9";
      const requestedSize = typeof options.getSize === "function" ? options.getSize(aspect) : null;
      const width = Math.max(1, Math.round(Number(requestedSize && requestedSize.width) || (aspect === "9:16" ? 540 : 960)));
      const height = Math.max(1, Math.round(Number(requestedSize && requestedSize.height) || (aspect === "9:16" ? 960 : 540)));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      const normalizedProgress = Math.max(0, Math.min(1, Number(progress) || 0));
      const requestedFontScale = typeof options.getFontScale === "function"
        ? Number(options.getFontScale())
        : 1;
      const fontScale = Number.isFinite(requestedFontScale)
        ? Math.max(STORY_DIALOGUE_FONT_SCALE_MIN, Math.min(STORY_DIALOGUE_FONT_SCALE_MAX, requestedFontScale))
        : 1;
      const actorProgress = scene.animateActors
        ? Math.max(0, Math.min(1, Number(scene.actorAnimationProgress) || 0))
        : 1;
      const actorAnimationElapsed = Number.isFinite(Number(scene.actorAnimationElapsed))
        ? Math.max(0, Number(scene.actorAnimationElapsed))
        : null;
      const actorExitAnimationRemaining = Number.isFinite(Number(scene.actorExitAnimationRemaining))
        ? Math.max(0, Number(scene.actorExitAnimationRemaining))
        : null;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#101213";
      context.fillRect(0, 0, width, height);
      context.save();
      context.globalAlpha = 1;

      if (scene.background && scene.background.url) {
        const background = loadImage(scene.background.url);
        if (background && background.ready) {
          drawCover(context, background.image, width, height);
        }
      }

      const actorEntries = scene.actors
        .filter((actor) => actor && actor.hidden !== true && actor.url)
        .map((actor) => ({
          actor,
          entry: loadImage(actor.url),
          previousEntry: actor.transitionPreviousUrl ? loadImage(actor.transitionPreviousUrl) : null
        }))
        .filter(({ entry }) => entry && entry.ready);
      const activeActorId = actorEntries.length > 1 && scene.dialogue
        ? scene.dialogue.actorId
        : null;
      const actorLayout = getActorLayout(actorEntries, width, height, aspect)
        .map((actorInfo, index) => ({
          ...actorInfo,
          index,
          isSpeaker: Boolean(activeActorId && actorInfo.actor.assetId === activeActorId)
        }))
        .sort((left, right) => Number(left.isSpeaker) - Number(right.isSpeaker) || left.index - right.index);
      actorLayout.forEach(({ actor, entry, previousEntry, x, y, width: actorWidth, height: actorHeight, isSpeaker }) => {
        const transition = scene.animateActors && ["fade", "slide-left", "slide-right", "flash"]
          .includes(actor.entryAnimation) ? actor.entryAnimation : "cut";
        const easing = ["linear", "ease-in", "ease-out", "ease-in-out"].includes(actor.animationEasing)
          ? actor.animationEasing
          : "ease-out";
        const entryDuration = Math.max(0.2, Math.min(2, Number(actor.entryDuration) || STORY_ACTOR_ANIMATION_DURATION_DEFAULT));
        const entryDelay = Math.max(0, Math.min(1.5, Number(actor.entryDelay) || 0));
        const entryProgress = transition === "cut"
          ? 1
          : applyStoryAnimationEasing(
            actorAnimationElapsed == null ? actorProgress : (actorAnimationElapsed - entryDelay) / entryDuration,
            easing
          );
        const exitTransition = scene.animateActorExits && ["fade", "slide-left", "slide-right", "shrink"]
          .includes(actor.exitAnimation) ? actor.exitAnimation : "none";
        const exitDuration = Math.max(0.2, Math.min(2, Number(actor.exitDuration) || STORY_ACTOR_EXIT_DURATION_DEFAULT));
        const exitProgress = exitTransition === "none"
          ? 0
          : applyStoryAnimationEasing(
            actorExitAnimationRemaining == null ? 0 : 1 - actorExitAnimationRemaining / exitDuration,
            easing
          );
        const slideDistance = Math.max(0.25, Math.min(2, Number(actor.slideDistance) || 1));
        const entryOffset = transition === "slide-left"
          ? -(1 - entryProgress) * width * slideDistance
          : transition === "slide-right" ? (1 - entryProgress) * width * slideDistance : 0;
        const exitOffset = exitTransition === "slide-left"
          ? -exitProgress * width * slideDistance
          : exitTransition === "slide-right" ? exitProgress * width * slideDistance : 0;
        const entryAlpha = transition === "fade" ? entryProgress : 1;
        const exitAlpha = exitTransition === "fade" || exitTransition === "shrink" ? 1 - exitProgress : 1;
        const actorSwitch = scene.actorSwitchTransition &&
          scene.actorSwitchTransition.fromId && scene.actorSwitchTransition.toId;
        const switchProgress = actorSwitch
          ? Math.max(0, Math.min(1, Number(scene.actorSwitchTransition.progress) || 0))
          : 1;
        const switchAlpha = actorSwitch && String(actor.assetId) === String(actorSwitch.toId)
          ? switchProgress
          : actorSwitch && String(actor.assetId) === String(actorSwitch.fromId)
            ? 1 - switchProgress
            : 1;
        const actorOpacity = Number.isFinite(Number(actor.opacity)) ? Number(actor.opacity) : 1;
        const transitionAlpha = Number.isFinite(Number(actor.transitionAlpha))
          ? Math.max(0, Math.min(1, Number(actor.transitionAlpha)))
          : 1;
        const transitionPreviousAlpha = Number.isFinite(Number(actor.transitionPreviousAlpha))
          ? Math.max(0, Math.min(1, Number(actor.transitionPreviousAlpha)))
          : 0;
        const actorScale = Number.isFinite(Number(actor.scale))
          ? Math.max(0.5, Math.min(2, Number(actor.scale)))
          : 1;
        const actorOffsetX = Number.isFinite(Number(actor.offsetX))
          ? Math.max(-0.5, Math.min(0.5, Number(actor.offsetX)))
          : 0;
        const actorOffsetY = Number.isFinite(Number(actor.offsetY))
          ? Math.max(-0.5, Math.min(0.5, Number(actor.offsetY)))
          : 0;
        const exitScale = exitTransition === "shrink" ? Math.max(0, 1 - exitProgress) : 1;
        const transformedWidth = actorWidth * actorScale * exitScale;
        const transformedHeight = actorHeight * actorScale * exitScale;
        const transformedX = x + (actorWidth - transformedWidth) / 2 + actorOffsetX * width + entryOffset + exitOffset;
        const transformedY = y + actorHeight - transformedHeight + actorOffsetY * height;
        const isInactive = Boolean(activeActorId && !isSpeaker);
        const colorMode = ["color", "dim"].includes(actor.colorMode) ? actor.colorMode : "auto";
        const shouldDim = colorMode === "dim" || (colorMode === "auto" && isInactive);
        const baseActorAlpha = entryAlpha * exitAlpha * switchAlpha * Math.max(0, Math.min(1, actorOpacity));
        context.filter = shouldDim ? "grayscale(40%) brightness(82%)" : "none";
        if (previousEntry && previousEntry.ready && transitionPreviousAlpha > 0.001 &&
            transformedWidth > 0.01 && transformedHeight > 0.01) {
          context.globalAlpha = baseActorAlpha * transitionPreviousAlpha;
          context.drawImage(previousEntry.image, transformedX, transformedY, transformedWidth, transformedHeight);
        }
        context.globalAlpha = baseActorAlpha * transitionAlpha;
        if (transformedWidth > 0.01 && transformedHeight > 0.01 && context.globalAlpha > 0.001) {
          context.drawImage(entry.image, transformedX, transformedY, transformedWidth, transformedHeight);
        }
        if (transition === "flash" && entryProgress < 0.45) {
          drawActorFlash(
            context,
            entry.image,
            transformedX,
            transformedY,
            transformedWidth,
            transformedHeight,
            Math.max(0, Math.min(1, (0.45 - entryProgress) * 2.2))
          );
        }
      });

      context.globalAlpha = 1;
      context.filter = "none";
      drawDialogue(context, scene, width, height, aspect, normalizedProgress, 1, fontScale);
      drawChoices(
        context,
        scene,
        width,
        height,
        aspect,
        Number.isFinite(Number(scene.choiceAlpha)) ? Number(scene.choiceAlpha) : 1,
        fontScale
      );
      context.restore();
    }

    return {
      render,
      preload,
      setFont,
      getChoiceHitAreas: (scene) => {
        if (!scene || (scene.showChoices === false && !scene.choiceSegment)) return [];
        const aspect = options.getAspect() === "9:16" ? "9:16" : "16:9";
        const size = typeof options.getSize === "function" ? options.getSize(aspect) : null;
        const width = Math.max(1, Math.round(Number(size && size.width) || (aspect === "9:16" ? 540 : 960)));
        const height = Math.max(1, Math.round(Number(size && size.height) || (aspect === "9:16" ? 960 : 540)));
        const sourceOptions = scene.choiceSegment ? scene.choiceSegment.options : scene.options;
        const choices = Array.isArray(sourceOptions)
          ? sourceOptions.filter((option) => option && String(option.text || "").trim())
          : [];
        return getChoiceLayout(choices, width, height, aspect);
      },
      getFont: () => ({ key: activeFontKey, family: activeFontFamily, label: getFontOption(activeFontKey).label })
    };
  }

  window.FgoStoryRenderer = {
    createRenderer,
    fontFamily: STORY_FONT_FAMILY,
    fontOptions: STORY_FONT_OPTIONS,
    typewriterCharactersPerSecond: STORY_TYPEWRITER_CHARACTERS_PER_SECOND,
    typewriterSpeedMin: STORY_TYPEWRITER_SPEED_MIN,
    typewriterSpeedMax: STORY_TYPEWRITER_SPEED_MAX,
    typewriterPauseMin: STORY_TYPEWRITER_PAUSE_MIN,
    typewriterPauseMax: STORY_TYPEWRITER_PAUSE_MAX,
    getDialogueTypewriterTiming,
    getVisibleDialogueText
  };
})();
