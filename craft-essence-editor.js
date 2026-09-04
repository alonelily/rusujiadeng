(function () {
  "use strict";

  const WIDTH = 1920;
  const HEIGHT = 1080;
  const ART_RECT = { x: 116, y: 11, width: 620, height: 1059, radius: 43 };
  const DEFAULT_CARD_NAME = "那时那日所见风景";
  const DEFAULT_DESCRIPTION = [
    "“好久没来姥爷家了，",
    "一下车，眼前的景象一股月球风”",
    "",
    "原先的荒草地变得绿意丛生、大片大片的野花生机盎然。",
    "望着这样的景象，也望着守护人理的你，他露出了愉快",
    "中带着些怀念的笑容。",
    "",
    "那是未曾成为英雄前的，平凡的日常和小小的过往。"
  ].join("\n");
  const ASSET_URLS = {
    base: "assets/craft-essence/screen-base.png",
    frame4: "assets/craft-essence/frame-4.png",
    frame5: "assets/craft-essence/frame-5.png",
    sampleArt: "assets/craft-essence/sample-art.jpg"
  };

  const state = {
    initialized: false,
    ready: false,
    rarity: 4,
    cardName: DEFAULT_CARD_NAME,
    atk: 100,
    hp: 100,
    upperText: "coolkid凯",
    lowerText: DEFAULT_DESCRIPTION,
    artScale: 100,
    artX: 0,
    artY: 0,
    art: null,
    artObjectUrl: "",
    assets: {},
    renderFrame: null
  };
  let dom = {};
  let readyPromise = null;

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`图片读取失败：${url}`)), { once: true });
      image.src = url;
    });
  }

  function setStatus(message, error = false) {
    dom.status.textContent = message;
    dom.status.classList.toggle("is-error", error);
  }

  async function ensureReady() {
    if (readyPromise) return readyPromise;
    readyPromise = Promise.all([
      ...Object.entries(ASSET_URLS).map(async ([key, url]) => {
        state.assets[key] = await loadImage(url);
      }),
      document.fonts ? document.fonts.load('44px "FgoCeText"') : Promise.resolve(),
      document.fonts ? document.fonts.load('52px "FgoCeStat"') : Promise.resolve()
    ]).then(() => {
      state.art = state.assets.sampleArt;
      state.ready = true;
      dom.canvas.removeAttribute("aria-busy");
      setStatus("1920 × 1080 · PNG");
      scheduleRender();
    }).catch((error) => {
      setStatus(error.message || "礼装模板读取失败", true);
      throw error;
    });
    return readyPromise;
  }

  function roundedRect(context, rect) {
    const radius = Math.min(rect.radius, rect.width / 2, rect.height / 2);
    context.beginPath();
    context.moveTo(rect.x + radius, rect.y);
    context.arcTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height, radius);
    context.arcTo(rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height, radius);
    context.arcTo(rect.x, rect.y + rect.height, rect.x, rect.y, radius);
    context.arcTo(rect.x, rect.y, rect.x + rect.width, rect.y, radius);
    context.closePath();
  }

  function drawArtwork(context) {
    const image = state.art;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    const coverScale = Math.max(ART_RECT.width / image.naturalWidth, ART_RECT.height / image.naturalHeight);
    const scale = coverScale * state.artScale / 100;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const offsetX = state.artX / 100 * ART_RECT.width * 0.42;
    const offsetY = state.artY / 100 * ART_RECT.height * 0.42;
    const x = ART_RECT.x + (ART_RECT.width - width) / 2 + offsetX;
    const y = ART_RECT.y + (ART_RECT.height - height) / 2 + offsetY;
    context.save();
    roundedRect(context, ART_RECT);
    context.clip();
    context.drawImage(image, x, y, width, height);
    context.restore();
  }

  function setOutlinedTextStyle(context, font, lineWidth = 6) {
    context.font = font;
    context.fillStyle = "#fff";
    context.strokeStyle = "#1a1c1d";
    context.lineWidth = lineWidth;
    context.lineJoin = "round";
    context.miterLimit = 2;
  }

  function drawOutlinedText(context, text, x, y) {
    context.strokeText(text, x, y);
    context.fillText(text, x, y);
  }

  function fitFontSize(context, text, maxWidth, preferredSize, minimumSize, family) {
    let size = preferredSize;
    while (size > minimumSize) {
      context.font = `${size}px ${family}`;
      if (context.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    return size;
  }

  function wrapParagraph(context, text, maxWidth) {
    if (!text) return [""];
    const lines = [];
    let current = "";
    for (const character of Array.from(text)) {
      const candidate = current + character;
      if (current && context.measureText(candidate).width > maxWidth) {
        lines.push(current);
        current = character;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
    return lines;
  }

  function wrapText(context, text, maxWidth) {
    return String(text || "").replaceAll("\r", "").split("\n")
      .flatMap((paragraph) => paragraph ? wrapParagraph(context, paragraph, maxWidth) : [""]);
  }

  function drawCardText(context) {
    const cardName = state.cardName.trim() || " ";

    context.save();
    context.textBaseline = "alphabetic";
    context.textAlign = "center";
    context.translate(426, 0);
    context.scale(0.76, 1);
    const cardNameSize = fitFontSize(context, cardName, 620, 58, 18, '"FgoCeStat", serif');
    setOutlinedTextStyle(context, `${cardNameSize}px "FgoCeStat", serif`, 7);
    drawOutlinedText(context, cardName, 0, 942);
    context.restore();

    context.save();
    context.textBaseline = "alphabetic";
    context.textAlign = "center";
    setOutlinedTextStyle(context, '29px "FgoCeText", sans-serif', 4);
    drawOutlinedText(context, "概 念 礼 装", 425, 991);
    context.restore();

    context.save();
    context.textBaseline = "alphabetic";
    setOutlinedTextStyle(context, '55px "FgoCeStat", Georgia, serif', 5);
    context.textAlign = "left";
    drawOutlinedText(context, `+${state.atk}`, 180, 1052);
    context.textAlign = "right";
    drawOutlinedText(context, `+${state.hp}`, 666, 1052);
    context.restore();

    context.save();
    context.textBaseline = "alphabetic";
    context.textAlign = "right";
    const headingSize = fitFontSize(context, cardName, 610, 66, 18, '"FgoCeStat", serif');
    setOutlinedTextStyle(context, `${headingSize}px "FgoCeStat", serif`, 5);
    context.shadowColor = "rgb(255 255 255 / 45%)";
    context.shadowBlur = 1;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    drawOutlinedText(context, cardName, 1870, 75);
    context.restore();
  }

  function drawEditableDescriptions(context) {
    context.save();
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    const upper = state.upperText.trim() || " ";
    const upperSize = fitFontSize(context, upper, 990, 47, 28, '"FgoCeText", sans-serif');
    setOutlinedTextStyle(context, `${upperSize}px "FgoCeText", sans-serif`, 5);
    drawOutlinedText(context, upper, 797, 392);

    const description = state.lowerText || " ";
    const descriptionMaxWidth = 1002;
    const descriptionMaxHeight = 488;
    let descriptionSize = 40;
    let lines = [];
    let lineHeight = 51;
    while (descriptionSize > 16) {
      context.font = `${descriptionSize}px "FgoCeText", sans-serif`;
      lines = wrapText(context, description, descriptionMaxWidth);
      lineHeight = Math.max(18, Math.round(descriptionSize * 1.25));
      if (lines.length * lineHeight <= descriptionMaxHeight) break;
      descriptionSize -= 1;
    }
    // Keep the full entered description visible in the card's text area.
    // The editor caps the input at a length that still fits at this minimum.
    setOutlinedTextStyle(context, `${descriptionSize}px "FgoCeText", sans-serif`, 5);
    lines.forEach((line, index) => {
      if (line) drawOutlinedText(context, line, 781, 540 + index * lineHeight);
    });
    context.restore();
  }

  function render() {
    state.renderFrame = null;
    if (!state.ready || !dom.canvas) return;
    const context = dom.canvas.getContext("2d", { alpha: false });
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.drawImage(state.assets.base, 0, 0, WIDTH, HEIGHT);
    drawArtwork(context);
    context.drawImage(state.rarity === 5 ? state.assets.frame5 : state.assets.frame4, 0, 0, WIDTH, HEIGHT);
    drawCardText(context);
    drawEditableDescriptions(context);
  }

  function scheduleRender() {
    if (state.renderFrame !== null) return;
    state.renderFrame = requestAnimationFrame(render);
  }

  function updateRangeOutput(input, output, suffix) {
    output.value = `${input.value}${suffix}`;
    output.textContent = output.value;
  }

  function resizeDescriptionControl() {
    if (!dom.lowerText) return;
    dom.lowerText.style.height = "auto";
    dom.lowerText.style.height = `${Math.min(480, Math.max(220, dom.lowerText.scrollHeight))}px`;
  }

  function updateFromControls() {
    state.cardName = dom.cardName.value;
    state.atk = Math.max(0, Math.min(9999, Number(dom.atk.value) || 0));
    state.hp = Math.max(0, Math.min(9999, Number(dom.hp.value) || 0));
    state.upperText = dom.upperText.value;
    state.lowerText = dom.lowerText.value;
    state.artScale = Number(dom.artScale.value) || 100;
    state.artX = Number(dom.artX.value) || 0;
    state.artY = Number(dom.artY.value) || 0;
    updateRangeOutput(dom.artScale, dom.artScaleValue, "%");
    updateRangeOutput(dom.artX, dom.artXValue, "%");
    updateRangeOutput(dom.artY, dom.artYValue, "%");
    resizeDescriptionControl();
    scheduleRender();
  }

  async function setArtwork(file) {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setStatus("请选择 PNG、JPEG 或 WebP 图片", true);
      return;
    }
    if (state.artObjectUrl) URL.revokeObjectURL(state.artObjectUrl);
    state.artObjectUrl = URL.createObjectURL(file);
    try {
      state.art = await loadImage(state.artObjectUrl);
      state.artScale = 100;
      state.artX = 0;
      state.artY = 0;
      dom.artScale.value = "100";
      dom.artX.value = "0";
      dom.artY.value = "0";
      dom.artName.textContent = file.name;
      updateFromControls();
      setStatus("图片已导入 · 1920 × 1080 · PNG");
    } catch (_error) {
      setStatus("无法读取这张图片", true);
    }
  }

  function resetArtworkTransform() {
    dom.artScale.value = "100";
    dom.artX.value = "0";
    dom.artY.value = "0";
    updateFromControls();
  }

  function resetAll() {
    if (state.artObjectUrl) {
      URL.revokeObjectURL(state.artObjectUrl);
      state.artObjectUrl = "";
    }
    state.rarity = 4;
    state.art = state.assets.sampleArt;
    dom.rarityButtons.forEach((button) => {
      const active = button.dataset.rarity === "4";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    dom.cardName.value = DEFAULT_CARD_NAME;
    dom.atk.value = "100";
    dom.hp.value = "100";
    dom.upperText.value = "coolkid凯";
    dom.lowerText.value = DEFAULT_DESCRIPTION;
    resizeDescriptionControl();
    dom.artName.textContent = "模板示例图";
    resetArtworkTransform();
    setStatus("已恢复模板内容 · 1920 × 1080 · PNG");
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG 生成失败"));
    }, "image/png"));
  }

  async function exportImage() {
    if (!state.ready || dom.exportButton.disabled) return;
    dom.exportButton.disabled = true;
    const originalLabel = dom.exportButton.textContent;
    dom.exportButton.textContent = "正在生成";
    try {
      render();
      const blob = await canvasToBlob(dom.canvas);
      const filename = `自制礼装-${state.rarity}星-${state.atk}ATK.png`;
      if (typeof window.FgoNativeFileSaver?.saveBlob === "function") {
        await window.FgoNativeFileSaver.saveBlob(blob, filename, "保存或分享自制礼装");
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
      setStatus(`PNG 已生成 · ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
    } catch (error) {
      setStatus(error.message || "PNG 导出失败", true);
    } finally {
      dom.canvas.removeAttribute("aria-busy");
      dom.exportButton.disabled = false;
      dom.exportButton.textContent = originalLabel;
      scheduleRender();
    }
  }

  function bindEvents() {
    dom.rarityButtons.forEach((button) => button.addEventListener("click", () => {
      state.rarity = Number(button.dataset.rarity) === 5 ? 5 : 4;
      dom.rarityButtons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      scheduleRender();
    }));
    [dom.cardName, dom.atk, dom.hp, dom.upperText, dom.lowerText, dom.artScale, dom.artX, dom.artY]
      .forEach((control) => control.addEventListener("input", updateFromControls));
    dom.artButton.addEventListener("click", () => dom.artInput.click());
    dom.artInput.addEventListener("change", () => {
      const [file] = dom.artInput.files || [];
      dom.artInput.value = "";
      setArtwork(file);
    });
    dom.artResetButton.addEventListener("click", resetArtworkTransform);
    dom.resetButton.addEventListener("click", resetAll);
    dom.exportButton.addEventListener("click", exportImage);
  }

  function init() {
    if (state.initialized) return;
    dom = {
      panel: document.getElementById("craftEssencePanel"),
      canvas: document.getElementById("craftEssenceCanvas"),
      status: document.getElementById("craftEssenceStatus"),
      rarityButtons: [...document.querySelectorAll("[data-craft-essence-rarity]")],
      cardName: document.getElementById("craftEssenceNameInput"),
      atk: document.getElementById("craftEssenceAtkInput"),
      hp: document.getElementById("craftEssenceHpInput"),
      upperText: document.getElementById("craftEssenceUpperText"),
      lowerText: document.getElementById("craftEssenceLowerText"),
      artButton: document.getElementById("craftEssenceArtButton"),
      artInput: document.getElementById("craftEssenceArtInput"),
      artName: document.getElementById("craftEssenceArtName"),
      artScale: document.getElementById("craftEssenceArtScale"),
      artScaleValue: document.getElementById("craftEssenceArtScaleValue"),
      artX: document.getElementById("craftEssenceArtX"),
      artXValue: document.getElementById("craftEssenceArtXValue"),
      artY: document.getElementById("craftEssenceArtY"),
      artYValue: document.getElementById("craftEssenceArtYValue"),
      artResetButton: document.getElementById("craftEssenceArtResetButton"),
      resetButton: document.getElementById("craftEssenceResetButton"),
      exportButton: document.getElementById("craftEssenceExportButton")
    };
    if (!dom.panel || !dom.canvas) return;
    state.initialized = true;
    bindEvents();
    updateFromControls();
  }

  function open() {
    init();
    dom.panel.hidden = false;
    document.querySelector(".app-shell").classList.add("is-craft-essence-open");
    if (state.ready) {
      dom.canvas.removeAttribute("aria-busy");
      setStatus("礼装模板已就绪 · 1920 × 1080 · PNG");
      scheduleRender();
    } else {
      dom.canvas.setAttribute("aria-busy", "true");
      setStatus("正在读取礼装模板");
    }
    ensureReady().catch(() => {});
  }

  function close() {
    if (!state.initialized) return;
    dom.panel.hidden = true;
    document.querySelector(".app-shell").classList.remove("is-craft-essence-open");
  }

  window.FgoCraftEssenceEditor = { init, open, close, render };
})();
