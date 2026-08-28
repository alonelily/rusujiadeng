(function () {
  "use strict";

  const STORY_DIALOGUE_BOX_URL = "assets/story/dialogue-box.png";
  const STORY_NAME_BOX_URL = "assets/story/name-box.png";
  const STORY_FALLBACK_FONT_FAMILY = '"Microsoft YaHei", sans-serif';
  const STORY_FONT_FAMILY = '"FgoFzZhengzhong", "Microsoft YaHei", sans-serif';
  const STORY_FONT_OPTIONS = {
    system: { label: "系统默认", family: STORY_FALLBACK_FONT_FAMILY, url: null },
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
  const STORY_TYPEWRITER_CHARACTERS_PER_SECOND = 20;

  function drawCover(context, image, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function getWrappedLineObjects(context, text, maxWidth, maxLines) {
    const characters = Array.from(String(text || ""));
    const lines = [];
    let line = "";
    let lineStart = 0;
    let consumed = 0;

    for (let index = 0; index < characters.length; index += 1) {
      const character = characters[index];
      if (character === "\n") {
        lines.push({ text: line, start: lineStart, end: index });
        line = "";
        lineStart = index + 1;
        consumed = index + 1;
        if (lines.length >= maxLines) {
          break;
        }
        continue;
      }
      const candidate = line + character;
      if (context.measureText(candidate).width > maxWidth && line) {
        lines.push({ text: line, start: lineStart, end: index });
        line = character;
        lineStart = index;
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
      lines.push({ text: line, start: lineStart, end: characters.length });
    }
    const hasOverflow = consumed < characters.length;
    if (hasOverflow && lines.length) {
      const lastLine = lines[Math.min(lines.length, maxLines) - 1];
      while (lastLine.text && context.measureText(`${lastLine.text}…`).width > maxWidth) {
        lastLine.text = lastLine.text.slice(0, -1);
        lastLine.end = Math.max(lastLine.start, lastLine.end - 1);
      }
      lastLine.text = `${lastLine.text}…`;
    }
    return lines.slice(0, maxLines);
  }

  function getWrappedLines(context, text, maxWidth, maxLines) {
    return getWrappedLineObjects(context, text, maxWidth, maxLines).map((line) => line.text);
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

  function getDialogueTextColors(dialogue) {
    const textLength = Array.from(String(dialogue.text || "")).length;
    const colors = Array(textLength).fill(null);
    const ranges = Array.isArray(dialogue.textColorRanges)
      ? dialogue.textColorRanges
      : (() => {
          const legacyStart = Math.max(0, Math.min(textLength, Math.floor(Number(dialogue.textColorStart) || 0)));
          const legacyColor = /^#[0-9a-f]{6}$/i.test(String(dialogue.textColor || ""))
            ? String(dialogue.textColor).toLowerCase()
            : "#f3c86b";
          return legacyStart > 0 && legacyStart < textLength
            ? [{ start: legacyStart, end: textLength, color: legacyColor }]
            : [];
        })();
    ranges.forEach((range) => {
      if (!range || typeof range !== "object" || !/^#[0-9a-f]{6}$/i.test(String(range.color || ""))) {
        return;
      }
      const start = Math.max(0, Math.min(textLength, Math.floor(Number(range.start) || 0)));
      const end = Math.max(start, Math.min(textLength, Math.floor(Number(range.end) || 0)));
      colors.fill(String(range.color).toLowerCase(), start, end);
    });
    return colors;
  }

  function getDialogueTextRubyRanges(dialogue, visibleLength) {
    const textLength = Array.from(String(dialogue.text || "")).length;
    const maxVisible = Math.max(0, Math.min(textLength, visibleLength == null ? textLength : visibleLength));
    if (!Array.isArray(dialogue.textRubyRanges)) {
      return [];
    }
    return dialogue.textRubyRanges.flatMap((range) => {
      if (!range || typeof range !== "object") {
        return [];
      }
      const start = Math.max(0, Math.min(textLength, Math.floor(Number(range.start) || 0)));
      const end = Math.max(start, Math.min(textLength, Math.floor(Number(range.end) || 0)));
      const ruby = String(range.ruby || range.text || "").trim();
      return end > start && end <= maxVisible && ruby ? [{ start, end, ruby }] : [];
    });
  }

  function drawDialogueLine(context, line, x, y, layout, textColors, textRubyRanges, fontFamily) {
    const characters = Array.from(line.text);
    const baseFont = context.font;
    const characterWidths = characters.map((character) => context.measureText(character).width);
    const characterOffsets = [0];
    characterWidths.forEach((width) => characterOffsets.push(characterOffsets[characterOffsets.length - 1] + width));
    let offset = 0;
    let segmentStart = 0;
    let segmentColor = textColors[line.start] || null;
    const drawSegment = (end) => {
      if (end <= segmentStart) {
        return;
      }
      const segment = characters.slice(segmentStart, end).join("");
      if (!segment) {
        return;
      }
      if (segmentColor) {
        context.fillStyle = segmentColor;
      } else {
        setDialogueGradient(
          context,
          x + offset,
          y - layout.dialogueFontSize,
          y + Math.max(3, layout.dialogueFontSize * 0.12)
        );
      }
      drawOutlinedText(context, segment, x + offset, y);
      offset += context.measureText(segment).width;
    };

    for (let index = 0; index < characters.length; index += 1) {
      const color = textColors[line.start + index] || null;
      if (color !== segmentColor) {
        drawSegment(index);
        segmentStart = index;
        segmentColor = color;
      }
    }
    drawSegment(characters.length);

    if (!textRubyRanges.length) {
      return;
    }
    context.save();
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    context.font = `500 ${Math.max(10, Math.round(layout.dialogueFontSize * 0.48))}px ${fontFamily}`;
    textRubyRanges.forEach((range) => {
      // Keep a ruby annotation on one visual line. A phrase that wraps is
      // still rendered above the line where it starts instead of duplicating
      // the annotation on every wrapped line.
      if (range.start < line.start || range.start >= line.end) {
        return;
      }
      const rangeStart = range.start;
      const rangeEnd = Math.min(line.end, range.end);
      if (rangeEnd <= rangeStart) {
        return;
      }
      const localStart = rangeStart - line.start;
      const localEnd = rangeEnd - line.start;
      const spanStartX = x + characterOffsets[localStart];
      const spanEndX = x + characterOffsets[localEnd];
      const centerX = (spanStartX + spanEndX) / 2;
      const rubySize = fitFontSize(
        context,
        range.ruby,
        Math.max(10, layout.dialogueFontSize * 0.48),
        Math.max(8, layout.dialogueFontSize * 0.28),
        Math.max(1, spanEndX - spanStartX),
        500,
        fontFamily
      );
      context.font = `500 ${rubySize}px ${fontFamily}`;
      context.strokeStyle = "rgb(7 27 58 / 86%)";
      context.lineWidth = Math.max(0.75, 0.9 * layout.scale);
      context.shadowColor = "rgb(0 0 0 / 34%)";
      context.shadowBlur = Math.max(0.35, 0.55 * layout.scale);
      context.shadowOffsetX = Math.max(0.15, 0.3 * layout.scale);
      context.shadowOffsetY = Math.max(0.2, 0.4 * layout.scale);
      setDialogueGradient(
        context,
        centerX,
        y - layout.dialogueFontSize * 1.12,
        y - layout.dialogueFontSize * 0.58
      );
      drawOutlinedText(context, range.ruby, centerX, y - Math.max(7, layout.dialogueFontSize * 0.52));
    });
    context.restore();
    context.font = baseFont;
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

  function getVisibleDialogueText(dialogue, normalizedProgress) {
    const characters = Array.from(String(dialogue.text || ""));
    if (!dialogue.typewriter || normalizedProgress >= 1) {
      return characters.join("");
    }
    const duration = Math.max(0, Number(dialogue.duration) || 0);
    const elapsedSeconds = normalizedProgress * duration;
    const visibleCount = Math.min(
      characters.length,
      Math.floor(elapsedSeconds * STORY_TYPEWRITER_CHARACTERS_PER_SECOND)
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

    function clearImageCache() {
      imageCache.forEach((entry) => {
        if (!entry || !entry.image) {
          return;
        }
        entry.image.onload = null;
        entry.image.onerror = null;
        entry.image.src = "";
      });
      imageCache.clear();
    }

    function drawDialogue(context, scene, width, height, aspect, normalizedProgress, alpha) {
      if (!scene.dialogue.text && !scene.dialogue.speaker) {
        return;
      }
      const layout = getDialogueLayout(width, height, aspect);
      const dialogueBox = loadImage(STORY_DIALOGUE_BOX_URL);
      const speaker = String(scene.dialogue.speaker || "").trim();
      const nameBox = speaker ? loadImage(STORY_NAME_BOX_URL) : null;
      if (dialogueBox && dialogueBox.ready) {
        context.drawImage(dialogueBox.image, layout.boxX, layout.boxY, layout.boxWidth, layout.boxHeight);
      } else {
        drawDialogueFallback(context, layout);
      }

      context.textBaseline = "alphabetic";
      context.strokeStyle = "rgb(7 27 58 / 86%)";
      context.lineJoin = "round";
      context.lineWidth = Math.max(1, 1.35 * layout.scale);
      if (speaker) {
        if (nameBox && nameBox.ready) {
          context.drawImage(nameBox.image, layout.nameX, layout.nameY, layout.nameWidth, layout.nameHeight);
        } else {
          drawNameFallback(context, layout);
        }
        context.globalAlpha = alpha * STORY_NAME_TEXT_OPACITY;
        context.fillStyle = "#fafaf8";
        context.shadowColor = "rgb(0 0 0 / 72%)";
        context.shadowBlur = Math.max(0.8, 1.35 * layout.scale);
        context.shadowOffsetX = Math.max(0.6, 1.25 * layout.scale);
        context.shadowOffsetY = Math.max(0.8, 1.65 * layout.scale);

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
      }

      const visibleText = getVisibleDialogueText(scene.dialogue, normalizedProgress);
      context.globalAlpha = alpha * STORY_DIALOGUE_TEXT_OPACITY;
      context.fillStyle = "#fafaf8";
      context.shadowColor = "rgb(0 0 0 / 34%)";
      context.shadowBlur = Math.max(0.5, 0.8 * layout.scale);
      context.shadowOffsetX = Math.max(0.25, 0.45 * layout.scale);
      context.shadowOffsetY = Math.max(0.35, 0.65 * layout.scale);
      context.font = `500 ${Math.round(layout.dialogueFontSize)}px ${activeFontFamily}`;
      const maxDialogueLines = aspect === "9:16" ? 3 : 2;
      const textColors = getDialogueTextColors(scene.dialogue);
      const visibleLength = Array.from(visibleText).length;
      const textRubyRanges = getDialogueTextRubyRanges(scene.dialogue, visibleLength);
      getWrappedLineObjects(context, visibleText, layout.textWidth, maxDialogueLines).forEach((line, index) => {
        const lineY = layout.textY + index * layout.lineHeight;
        drawDialogueLine(context, line, layout.textX, lineY, layout, textColors, textRubyRanges, activeFontFamily);
      });
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
      const actorProgress = scene.animateActors
        ? Math.max(0, Math.min(1, Number(scene.actorAnimationProgress) || 0))
        : 1;
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
        .filter((actor) => actor && actor.url)
        .map((actor) => ({ actor, entry: loadImage(actor.url) }))
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
      actorLayout.forEach(({ actor, entry, x, y, width: actorWidth, height: actorHeight, isSpeaker }) => {
        const transition = scene.animateActors && ["fade", "slide-left", "slide-right", "flash"]
          .includes(actor.entryAnimation) ? actor.entryAnimation : "cut";
        const actorOffset = transition === "slide-left"
          ? (1 - actorProgress) * width
          : transition === "slide-right" ? -(1 - actorProgress) * width : 0;
        const actorAlpha = transition === "fade" ? actorProgress : 1;
        const actorOpacity = Number.isFinite(Number(actor.opacity)) ? Number(actor.opacity) : 1;
        const actorScale = Number.isFinite(Number(actor.scale))
          ? Math.max(0.5, Math.min(2, Number(actor.scale)))
          : 1;
        const actorOffsetX = Number.isFinite(Number(actor.offsetX))
          ? Math.max(-0.5, Math.min(0.5, Number(actor.offsetX)))
          : 0;
        const actorOffsetY = Number.isFinite(Number(actor.offsetY))
          ? Math.max(-0.5, Math.min(0.5, Number(actor.offsetY)))
          : 0;
        const transformedWidth = actorWidth * actorScale;
        const transformedHeight = actorHeight * actorScale;
        const transformedX = x + (actorWidth - transformedWidth) / 2 + actorOffsetX * width + actorOffset;
        const transformedY = y + actorHeight - transformedHeight + actorOffsetY * height;
        const isInactive = Boolean(activeActorId && !isSpeaker);
        const colorMode = ["color", "dim"].includes(actor.colorMode) ? actor.colorMode : "auto";
        const shouldDim = colorMode === "dim" || (colorMode === "auto" && isInactive);
        context.globalAlpha = actorAlpha * Math.max(0, Math.min(1, actorOpacity));
        context.filter = shouldDim ? "grayscale(40%) brightness(82%)" : "none";
        context.drawImage(entry.image, transformedX, transformedY, transformedWidth, transformedHeight);
        if (transition === "flash" && actorProgress < 0.45) {
          drawActorFlash(
            context,
            entry.image,
            transformedX,
            transformedY,
            transformedWidth,
            transformedHeight,
            Math.max(0, Math.min(1, (0.45 - actorProgress) * 2.2))
          );
        }
      });

      context.globalAlpha = 1;
      context.filter = "none";
      drawDialogue(context, scene, width, height, aspect, normalizedProgress, 1);
      context.restore();
    }

    return {
      render,
      preload,
      clearImageCache,
      setFont,
      getFont: () => ({ key: activeFontKey, family: activeFontFamily, label: getFontOption(activeFontKey).label })
    };
  }

  window.FgoStoryRenderer = {
    createRenderer,
    fontFamily: STORY_FONT_FAMILY,
    fontOptions: STORY_FONT_OPTIONS,
    typewriterCharactersPerSecond: STORY_TYPEWRITER_CHARACTERS_PER_SECOND,
    getVisibleDialogueText
  };
})();
