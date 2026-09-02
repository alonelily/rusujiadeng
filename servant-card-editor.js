(function () {
  "use strict";

  const WIDTH = 1920;
  const HEIGHT = 1080;
  const RIGHT_CHROME_X = 736;
  const ABILITY_PAGE_X = 760;
  const PROFILE_PAGE_X = 762;
  const RIGHT_PAGE_WIDTH = 1074;
  const PAGE_TOP = 264;
  const PAGE_BACKGROUND_COLOR = "#152c3a";
  const ABILITY_SECTION_GAPS = [
    { y: 580, height: 25 },
    { y: 1296, height: 26 },
    { y: 2035, height: 18 },
    { y: 2745, height: 23 },
    { y: 3309, height: 31 },
    { y: 3853, height: 147 }
  ];
  const PROFILE_PANEL_GAP = 24;
  const PROFILE_STATS_HEIGHT = 332;
  const PROFILE_SECTION_TEMPLATES = [
    { key: "credits", asset: "profilePanelCredits", minHeight: 221, fontSize: 43, lineHeight: 58, firstBaseline: 105 },
    { key: "details", asset: "profilePanelDetails", minHeight: 300, fontSize: 41, lineHeight: 52, firstBaseline: 105 },
    { key: "profile1", asset: "profilePanel1", minHeight: 260, fontSize: 40, lineHeight: 50, firstBaseline: 108 },
    { key: "profile2", asset: "profilePanel2", minHeight: 260, fontSize: 40, lineHeight: 50, firstBaseline: 108 },
    { key: "profile3", asset: "profilePanel3", minHeight: 260, fontSize: 40, lineHeight: 50, firstBaseline: 108 },
    { key: "profile4", asset: "profilePanel4", minHeight: 260, fontSize: 40, lineHeight: 50, firstBaseline: 108 },
    { key: "profile5", asset: "profilePanel5", minHeight: 260, fontSize: 40, lineHeight: 50, firstBaseline: 108 },
    { key: "profile6", asset: "profilePanel6", minHeight: 260, fontSize: 40, lineHeight: 50, firstBaseline: 108 }
  ];
  const PROFILE_STAT_SLOTS = {
    strength: { side: "left", barY: 98, gradeY: 130 },
    agility: { side: "left", barY: 174, gradeY: 206 },
    luck: { side: "left", barY: 247, gradeY: 279 },
    endurance: { side: "right", barY: 98, gradeY: 128 },
    magic: { side: "right", barY: 173, gradeY: 203 },
    noble: { side: "right", barY: 250, gradeY: 279 }
  };
  const PROFILE_STAT_SEGMENTS = {
    left: [
      { x: 89, width: 70 }, { x: 159, width: 62 }, { x: 222, width: 62 },
      { x: 285, width: 62 }, { x: 347, width: 62 }
    ],
    right: [
      { x: 626, width: 68 }, { x: 694, width: 61 }, { x: 755, width: 61 },
      { x: 817, width: 62 }, { x: 879, width: 62 }
    ]
  };
  const API_BASE = "https://api.atlasacademy.io";
  const ART_RECT = { x: 116, y: 8, width: 620, height: 1063 };
  const ABILITY_ART_RECT = { x: 18, y: 72, width: 330, height: 390 };
  const CLASS_LABELS = {
    saber: "Saber",
    archer: "Archer",
    lancer: "Lancer",
    rider: "Rider",
    caster: "Caster",
    assassin: "Assassin",
    berserker: "Berserker",
    ruler: "Ruler",
    avenger: "Avenger",
    alterEgo: "Alter Ego",
    moonCancer: "Moon Cancer",
    foreigner: "Foreigner",
    pretender: "Pretender",
    shielder: "Shielder",
    beast: "Beast"
  };
  // Atlas Academy ships class emblems in two metal treatments: group 2 is
  // silver (used by three-star cards) and group 3 is gold (four/five stars).
  // A few extra classes only have one treatment in the CDN, so the renderer
  // falls back to the available source and applies a light tint when needed.
  const CLASS_ICON_PATHS = {
    saber: { 2: "assets/servant-card/class-icon-saber-2.png", 3: "assets/servant-card/class-icon-saber-3.png" },
    archer: { 2: "assets/servant-card/class-icon-archer-2.png", 3: "assets/servant-card/class-icon-archer-3.png" },
    lancer: { 2: "assets/servant-card/class-icon-lancer-2.png", 3: "assets/servant-card/class-icon-lancer-3.png" },
    rider: { 2: "assets/servant-card/class-icon-rider-2.png", 3: "assets/servant-card/class-icon-rider-3.png" },
    caster: { 2: "assets/servant-card/class-icon-caster-2.png", 3: "assets/servant-card/class-icon-caster-3.png" },
    assassin: { 2: "assets/servant-card/class-icon-assassin-2.png", 3: "assets/servant-card/class-icon-assassin-3.png" },
    berserker: { 2: "assets/servant-card/class-icon-berserker-2.png", 3: "assets/servant-card/class-icon-berserker-3.png" },
    ruler: { 2: "assets/servant-card/class-icon-ruler-2.png", 3: "assets/servant-card/class-icon-ruler-3.png" },
    avenger: { 2: "assets/servant-card/class-icon-avenger-2.png", 3: "assets/servant-card/class-icon-avenger-3.png" },
    alterEgo: { 2: "assets/servant-card/class-icon-alterEgo-2.png", 3: "assets/servant-card/class-icon-alterEgo-3.png" },
    moonCancer: { 2: "assets/servant-card/class-icon-moonCancer-2.png", 3: "assets/servant-card/class-icon-moonCancer-3.png" },
    foreigner: { 2: "assets/servant-card/class-icon-foreigner-2.png", 3: "assets/servant-card/class-icon-foreigner-3.png" },
    // Atlas Academy uses class id 28 for Pretender. Keep both metal
    // treatments because three-star cards use the silver emblem.
    pretender: {
      2: "assets/servant-card/class-icon-pretender-2.png?v=20260902-rarity-class-icon-2",
      3: "assets/servant-card/class-icon-pretender-3.png?v=20260902-rarity-class-icon-2"
    },
    shielder: { 2: "assets/servant-card/class-icon-shielder-2.png", 3: "assets/servant-card/class-icon-shielder-3.png" },
    // The generic Beast class is Atlas class id 33. The former asset was a
    // Beast II/recommendation emblem and therefore rendered "オススメ".
    beast: {
      2: "assets/servant-card/class-icon-beast-2.png?v=20260902-rarity-class-icon-2",
      3: "assets/servant-card/class-icon-beast-3.png?v=20260902-rarity-class-icon-2"
    }
  };
  // All card layers retain their original 1074x4000 PSD coordinates. The
  // base rectangle is the anchor used when a Quick/Arts/Buster treatment is
  // moved into any of the five visible command-card slots.
  const COMMAND_CARD_LAYERS = {
    Quick: {
      asset: "Quick",
      base: { x: 49, y: 3422, width: 144, height: 186 },
      model: { x: 24, y: 3419, width: 223, height: 207 },
      color: { x: 25, y: 3504, width: 176, height: 135 },
      text: { x: 39, y: 3532, width: 164, height: 92 }
    },
    Arts: {
      asset: "Arts",
      base: { x: 253, y: 3423, width: 148, height: 188 },
      model: { x: 231, y: 3419, width: 223, height: 207 },
      color: { x: 229, y: 3493, width: 210, height: 158 },
      text: { x: 258, y: 3528, width: 149, height: 82 }
    },
    Buster: {
      asset: "Buster",
      base: { x: 461, y: 3419, width: 149, height: 195 },
      model: { x: 437, y: 3419, width: 223, height: 207 },
      color: { x: 424, y: 3484, width: 228, height: 170 },
      text: { x: 449, y: 3532, width: 182, height: 79 }
    }
  };
  const NOBLE_CARD_LAYERS = {
    base: { x: 57, y: 2879, width: 243, height: 318 },
    model: { x: 21, y: 2870, width: 360, height: 335 },
    color: { x: 0, y: 2977, width: 368, height: 273 },
    text: { x: 18, y: 3068, width: 370, height: 108 },
    clear: { x: 0, y: 2870, width: 407, height: 380 }
  };
  // Tight layer bounds from fgo简易模板by次元狸.psd. Buster's card bottom is
  // the placement anchor; the other layers retain their original offsets and
  // dimensions relative to it instead of being stretched to a shared box.
  const NOBLE_CARD_TREATMENTS = {
    Buster: {
      asset: "Buster",
      base: { x: 632, y: 153, width: 166, height: 218 },
      color: { x: 614, y: 229, width: 224, height: 167 }
    },
    Quick: {
      asset: "Quick",
      base: { x: 632, y: 154, width: 166, height: 215 },
      color: { x: 621, y: 229, width: 202, height: 152 }
    },
    Arts: {
      asset: "Arts",
      base: { x: 633, y: 154, width: 165, height: 210 },
      color: { x: 623, y: 238, width: 201, height: 150 }
    }
  };
  const ASSETS = {
    reference: "assets/servant-card/template-reference.jpg",
    background: "assets/servant-card/template-background.png",
    profileTabActive: "assets/servant-card/profile-tab-active.png",
    abilityPage: "assets/servant-card/ability-page-shell.png",
    abilityReference: "assets/servant-card/ability-page-reference.jpg",
    profilePage: "assets/servant-card/profile-page-shell.png",
    profileStatLeft: "assets/servant-card/profile-stat-left.png",
    profileStatMiddle: "assets/servant-card/profile-stat-middle.png",
    profileStatRight: "assets/servant-card/profile-stat-right.png",
    profilePanelCredits: "assets/servant-card/profile-panel-credits.png",
    profilePanelDetails: "assets/servant-card/profile-panel-details.png",
    profilePanelStats: "assets/servant-card/profile-panel-stats.png",
    profilePanel1: "assets/servant-card/profile-panel-1.png",
    profilePanel2: "assets/servant-card/profile-panel-2.png",
    profilePanel3: "assets/servant-card/profile-panel-3.png",
    profilePanel4: "assets/servant-card/profile-panel-4.png",
    profilePanel5: "assets/servant-card/profile-panel-5.png",
    profilePanel6: "assets/servant-card/profile-panel-6.png",
    // The frame is split so the star count can be changed without redrawing
    // or scaling any of the PSD artwork.
    frameBase: "assets/servant-card/card-frame-base.png",
    frameSilver: "assets/servant-card/card-frame-silver.png?v=20260902-rarity-class-icon-2",
    stars3: "assets/servant-card/card-stars-1.png",
    stars4: "assets/servant-card/card-stars-2.png",
    stars5: "assets/servant-card/card-stars-3.png",
    // Kept for compatibility with older saved projects/integrations.
    frame: "assets/servant-card/card-frame.png",
    art: "assets/servant-card/sample-art.jpg",
    classIcon: "assets/servant-card/sample-class-icon.png",
    commandQuickBase: "assets/servant-card/command-card-quick-base.png",
    commandQuickModel: "assets/servant-card/command-card-quick-model.png",
    commandQuickColor: "assets/servant-card/command-card-quick-color.png",
    commandQuickText: "assets/servant-card/command-card-quick-text.png",
    commandArtsBase: "assets/servant-card/command-card-arts-base.png",
    commandArtsModel: "assets/servant-card/command-card-arts-model.png",
    commandArtsColor: "assets/servant-card/command-card-arts-color.png",
    commandArtsText: "assets/servant-card/command-card-arts-text.png",
    commandBusterBase: "assets/servant-card/command-card-buster-base.png",
    commandBusterModel: "assets/servant-card/command-card-buster-model.png",
    commandBusterColor: "assets/servant-card/command-card-buster-color.png",
    commandBusterText: "assets/servant-card/command-card-buster-text.png",
    // Noble Phantasm card layers extracted from the color variants in
    // fgo简易模板by次元狸.psd. These are tight PNGs, so they are drawn into
    // their original layer rectangles instead of being treated as full PSD
    // canvases.
    nobleBusterBase: "assets/servant-card/noble-card-buster-base.png",
    nobleQuickBase: "assets/servant-card/noble-card-quick-base.png",
    nobleArtsBase: "assets/servant-card/noble-card-arts-base.png",
    nobleBusterColor: "assets/servant-card/noble-card-buster-color.png",
    nobleQuickColor: "assets/servant-card/noble-card-quick-color.png",
    nobleArtsColor: "assets/servant-card/noble-card-arts-color.png",
    nobleCardModel: "assets/servant-card/noble-card-model.png",
    nobleCardText: "assets/servant-card/noble-card-text.png",
    skill1: "assets/servant-card/sample-skill-1.png",
    skill2: "assets/servant-card/sample-skill-2.png",
    skill3: "assets/servant-card/sample-skill-3.png",
    ...Object.fromEntries(Object.entries(CLASS_ICON_PATHS).flatMap(([className, groups]) =>
      Object.entries(groups).map(([group, url]) => [`classIcon_${className}_${group}`, url])
    ))
  };
  const DEFAULT_PROFILE = [
    "从异界降临于此的临时协力者。并非魔术师，却拥有超越常识的战斗能力。",
    "其行动准则看似随性，实则始终守护着某个未曾说出口的约定。",
    "在迦勒底的记录中，他被归入特殊职阶，并以独立灵基维持现界。"
  ].join("\n\n");
  const DEFAULT_PROFILE_SECTIONS = {
    credits: "画师：    未设置\n声优：    未设置",
    details: DEFAULT_PROFILE,
    profile1: "",
    profile2: "",
    profile3: "",
    profile4: "",
    profile5: "",
    profile6: ""
  };
  const DEFAULT_PROFILE_STATS = {
    strength: "A",
    endurance: "A",
    agility: "B",
    magic: "A+",
    luck: "E",
    noble: "A"
  };
  const DEFAULT_NOBLE_NAME = "拟似·死之河";
  const DEFAULT_NOBLE_SUBTITLE = "Bird of Hermes";
  const DEFAULT_NOBLE_RANK = "A";
  const DEFAULT_NOBLE_TYPE = "对军宝具";
  const DEFAULT_NOBLE_DETAIL = "对敌方全体发动自身生命值越少威力越高的强大的攻击<过量充能时威力提升>＆暴击威力提升[等级5](3回合)";
  const DEFAULT_SKILLS = [
    { name: "暗夜之王 等级10", detail: "自身的攻击力提升(3回合)＆暴击威力提升(3回合)", asset: "skill1" },
    { name: "弃名之物 等级10", detail: "自身的宝具值增加＆获得暴击星", asset: "skill2" },
    { name: "箱中之猫 等级10", detail: "付与自身回避状态＆弱化耐性提升", asset: "skill3" }
  ];
  const DEFAULT_CLASS_SKILLS = [
    // A null asset means the PSD's original class-skill icon remains visible
    // until the user explicitly chooses or imports a replacement.
    { name: "狂化 EX", detail: "自身的Buster指令卡性能提升", asset: null },
    { name: "单独显现 EX", detail: "自身的暴击威力提升＆即死耐性提升＆精神异常耐性提升", asset: null },
    { name: "异界来者 EX", detail: "赋予自身每回合获得2个暴击星的状态＆弱化耐性提升", asset: null }
  ];
  const DEFAULT_APPEND_SKILLS = [
    { name: "追击技巧提升 等级10", detail: "自身的Extra指令卡性能提升50%[等级10]", asset: null },
    { name: "魔力装填 等级10", detail: "自身以宝具已达20%的状态开始战斗", asset: null },
    { name: "对剑士攻击适性 等级10", detail: "自身对[剑士]职介的攻击力提升30%[等级10]", asset: null }
  ];

  const state = {
    initialized: false,
    ready: false,
    page: "ability",
    controlTab: "basic",
    name: "阿卡多",
    title: "身披角色者",
    className: "pretender",
    rarity: 5,
    nobleName: DEFAULT_NOBLE_NAME,
    nobleSubtitle: DEFAULT_NOBLE_SUBTITLE,
    nobleCardType: "Buster",
    nobleRank: DEFAULT_NOBLE_RANK,
    nobleType: DEFAULT_NOBLE_TYPE,
    nobleDetail: DEFAULT_NOBLE_DETAIL,
    atk: 12499,
    hp: 14770,
    artScale: 100,
    artX: 0,
    artY: 0,
    art: null,
    abilityArt: null,
    commandArt: null,
    nobleArt: null,
    artObjectUrl: "",
    abilityArtObjectUrl: "",
    commandObjectUrl: "",
    nobleArtObjectUrl: "",
    abilityArtScale: 100,
    abilityArtX: 0,
    abilityArtY: 0,
    skills: DEFAULT_SKILLS.map((skill) => ({ ...skill, image: null, objectUrl: "" })),
    classSkills: DEFAULT_CLASS_SKILLS.map((skill) => ({ ...skill, image: null, objectUrl: "" })),
    appendSkills: DEFAULT_APPEND_SKILLS.map((skill) => ({ ...skill, image: null, objectUrl: "" })),
    commandTypes: ["Quick", "Arts", "Buster", "Buster", "Buster"],
    profileSections: { ...DEFAULT_PROFILE_SECTIONS },
    profileStats: { ...DEFAULT_PROFILE_STATS },
    activeProfileSection: "details",
    profileCanvas: null,
    profileLayout: null,
    pageOffsets: { ability: 0, profile: 0 },
    activeSkillSearch: 0,
    activeSkillTarget: { group: "active", index: 0 },
    assets: {},
    metalVariants: new Map(),
    renderFrame: null,
    searchController: null,
    skillCatalog: null,
    skillCatalogPromise: null
  };
  let dom = {};
  let readyPromise = null;

  function loadImage(url, useCors = false) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      if (useCors) image.crossOrigin = "anonymous";
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
      ...Object.entries(ASSETS).map(async ([key, url]) => {
        state.assets[key] = await loadImage(url);
      }),
      document.fonts ? document.fonts.load('38px "FgoCeText"') : Promise.resolve(),
      document.fonts ? document.fonts.load('52px "FgoCeStat"') : Promise.resolve(),
      document.fonts ? document.fonts.load('58px "FgoNobleText"') : Promise.resolve()
    ]).then(() => {
      state.art = state.assets.art;
      // Keep the card JPG out of the ability panel by default: it contains
      // its own scenic background. The PSD's original portrait remains until
      // the user imports a dedicated ability-page image.
      state.abilityArt = null;
      // Default command/Noble cards use the exact model layers extracted
      // from the PSD. Imported artwork replaces only that middle layer.
      state.commandArt = null;
      state.nobleArt = null;
      state.skills.forEach((skill) => {
        skill.image = state.assets[skill.asset];
      });
      state.classSkills.forEach((skill) => {
        skill.image = skill.asset ? state.assets[skill.asset] : null;
      });
      state.appendSkills.forEach((skill) => {
        skill.image = skill.asset ? state.assets[skill.asset] : null;
      });
      ["active", "class", "append"].forEach((group) => {
        getSkillCollection(group).forEach((_skill, index) => updateSkillThumb(group, index));
      });
      state.ready = true;
      dom.canvas.removeAttribute("aria-busy");
      updatePageOffsetControl();
      setStatus("1920 × 1080 · 双页模板");
      scheduleRender();
    }).catch((error) => {
      setStatus(error.message || "从者卡模板读取失败", true);
      throw error;
    });
    return readyPromise;
  }

  function roundedPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawCover(context, image, rect, scalePercent = 100, xPercent = 0, yPercent = 0) {
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    const cover = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const scale = cover * scalePercent / 100;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = rect.x + (rect.width - width) / 2 + xPercent / 100 * rect.width * 0.45;
    const y = rect.y + (rect.height - height) / 2 + yPercent / 100 * rect.height * 0.45;
    context.drawImage(image, x, y, width, height);
  }

  function drawFeatheredContain(context, image, rect, scalePercent = 100, xPercent = 0, yPercent = 0) {
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    const fit = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const scale = fit * scalePercent / 100;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const imageX = (rect.width - width) / 2 + xPercent / 100 * rect.width * 0.45;
    const imageY = (rect.height - height) / 2 + yPercent / 100 * rect.height * 0.45;
    const buffer = document.createElement("canvas");
    buffer.width = Math.max(1, Math.ceil(rect.width));
    buffer.height = Math.max(1, Math.ceil(rect.height));
    const bufferContext = buffer.getContext("2d");
    bufferContext.drawImage(image, imageX, imageY, width, height);

    // Multiply the source alpha by a soft edge mask. This works for both
    // transparent API art and imported images with a rectangular background.
    const pixels = bufferContext.getImageData(0, 0, buffer.width, buffer.height);
    const edge = Math.max(12, Math.round(Math.min(width, height) * 0.12));
    for (let y = 0; y < buffer.height; y += 1) {
      for (let x = 0; x < buffer.width; x += 1) {
        const index = (y * buffer.width + x) * 4;
        const distance = Math.min(
          x - imageX,
          imageX + width - x,
          y - imageY,
          imageY + height - y
        );
        const factor = Math.max(0, Math.min(1, distance / edge));
        pixels.data[index + 3] = Math.round(pixels.data[index + 3] * factor);
      }
    }
    bufferContext.putImageData(pixels, 0, 0);
    context.drawImage(buffer, rect.x, rect.y);
  }

  function setOutlined(context, font, lineWidth = 5, fill = "#fff", stroke = "#182022") {
    context.font = font;
    context.fillStyle = fill;
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.lineJoin = "round";
  }

  function outlinedText(context, text, x, y) {
    context.strokeText(text, x, y);
    context.fillText(text, x, y);
  }

  function fitFont(context, text, maxWidth, preferred, minimum, family) {
    let size = preferred;
    while (size > minimum) {
      context.font = `${size}px ${family}`;
      if (context.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    return size;
  }

  function wrapLines(context, text, maxWidth, maxLines = Infinity) {
    const lines = [];
    for (const paragraph of String(text || "").replaceAll("\r", "").split("\n")) {
      if (!paragraph) {
        lines.push("");
        continue;
      }
      let current = "";
      for (const character of Array.from(paragraph)) {
        const next = current + character;
        if (current && context.measureText(next).width > maxWidth) {
          lines.push(current);
          current = character;
          if (lines.length >= maxLines) break;
        } else {
          current = next;
        }
      }
      if (lines.length < maxLines && current) lines.push(current);
      if (lines.length >= maxLines) break;
    }
    return lines.slice(0, maxLines);
  }

  function pageSource(page) {
    if (page === "profile") {
      if (!state.profileCanvas) buildProfileCanvas();
      return state.profileCanvas || state.assets.profilePage;
    }
    return state.assets.abilityPage;
  }

  function pageScale(page) {
    const source = pageSource(page);
    const width = source?.naturalWidth || source?.width || 0;
    return width ? RIGHT_PAGE_WIDTH / width : 1;
  }

  function pageLeft(page) {
    return page === "profile" ? PROFILE_PAGE_X : ABILITY_PAGE_X;
  }

  function pageVisibleSourceHeight(page) {
    return (HEIGHT - PAGE_TOP) / pageScale(page);
  }

  function pageMaxOffset(page) {
    const source = pageSource(page);
    const height = source?.naturalHeight || source?.height || 0;
    return Math.max(0, Math.floor(height - pageVisibleSourceHeight(page)));
  }

  function drawTemplateNavigation(context, page) {
    const pageX = pageLeft(page);
    const chromeWidth = WIDTH - RIGHT_CHROME_X;
    context.drawImage(state.assets.reference, RIGHT_CHROME_X, 0, chromeWidth, PAGE_TOP,
      RIGHT_CHROME_X, 0, chromeWidth, PAGE_TOP);
    const rightRailX = pageX + RIGHT_PAGE_WIDTH;
    context.drawImage(state.assets.reference,
      rightRailX, PAGE_TOP, WIDTH - rightRailX, HEIGHT - PAGE_TOP,
      rightRailX, PAGE_TOP, WIDTH - rightRailX, HEIGHT - PAGE_TOP);
    if (page !== "profile") return;

    // Reuse the PSD tab artwork. A color blend moves the active treatment from
    // the original ability tab to the selected profile tab without redrawing it.
    context.save();
    context.globalCompositeOperation = "color";
    context.fillStyle = "#1594c5";
    context.fillRect(750, 155, 253, 94);
    context.fillStyle = "#ef8b20";
    context.fillRect(1050, 155, 253, 94);
    context.restore();

    // The supplied screenshot contains a small amount of surrounding UI.
    // Crop that surrounding area away and fit only the original button pixels
    // into the PSD tab slot, preserving the untouched page background.
    if (state.assets.profileTabActive) {
      context.drawImage(state.assets.profileTabActive,
        10, 14, 172, 64,
        1050, 155, 253, 94);
    }
  }

  function drawRightPage(context, page) {
    const source = pageSource(page);
    const width = source?.naturalWidth || source?.width || 0;
    const height = source?.naturalHeight || source?.height || 0;
    if (!width || !height) return;
    const scale = pageScale(page);
    const pageX = pageLeft(page);
    const sourceHeight = pageVisibleSourceHeight(page);
    const offset = Math.min(pageMaxOffset(page), Math.max(0, state.pageOffsets[page] || 0));
    context.save();
    context.beginPath();
    context.rect(pageX, PAGE_TOP, RIGHT_PAGE_WIDTH, HEIGHT - PAGE_TOP);
    context.clip();
    context.drawImage(source, 0, offset, width, sourceHeight,
      pageX, PAGE_TOP, RIGHT_PAGE_WIDTH, HEIGHT - PAGE_TOP);
    context.restore();
  }

  function drawPageOverlay(context, page, draw) {
    const scale = pageScale(page);
    const pageX = pageLeft(page);
    const offset = Math.min(pageMaxOffset(page), Math.max(0, state.pageOffsets[page] || 0));
    context.save();
    context.beginPath();
    context.rect(pageX, PAGE_TOP, RIGHT_PAGE_WIDTH, HEIGHT - PAGE_TOP);
    context.clip();
    context.translate(pageX, PAGE_TOP - offset * scale);
    context.scale(scale, scale);
    draw(context);
    context.restore();
  }

  function profileGradeCount(value) {
    const normalized = String(value || "").trim().toUpperCase();
    if (normalized === "EX" || normalized === "A+" || normalized === "A") return 5;
    if (normalized === "B") return 4;
    if (normalized === "C") return 3;
    if (normalized === "D") return 2;
    if (normalized === "E") return 1;
    return 0;
  }

  function drawProfilePanelSlice(context, template, y, height) {
    const source = state.assets[template.asset];
    if (!source?.naturalWidth || !source.naturalHeight) return;
    const headerHeight = 46;
    const footerHeight = 19;
    const bodyHeight = Math.max(1, height - headerHeight - footerHeight);
    const sourceBodyHeight = Math.max(1, source.naturalHeight - headerHeight - footerHeight);
    context.drawImage(source,
      0, 0, 1074, headerHeight,
      0, y, 1074, headerHeight);
    context.drawImage(source,
      0, headerHeight, 1074, sourceBodyHeight,
      0, y + headerHeight, 1074, bodyHeight);
    context.drawImage(source,
      0, source.naturalHeight - footerHeight, 1074, footerHeight,
      0, y + height - footerHeight, 1074, footerHeight);
  }

  function drawProfileStats(context, y) {
    const source = state.assets.profilePanelStats;
    if (!source?.naturalWidth || !source.naturalHeight) return;
    context.drawImage(source, 0, 0, 1074, source.naturalHeight, 0, y, 1074, PROFILE_STATS_HEIGHT);
    const segmentImages = {
      left: state.assets.profileStatLeft,
      middle: state.assets.profileStatMiddle,
      right: state.assets.profileStatRight
    };
    Object.entries(PROFILE_STAT_SLOTS).forEach(([key, slot]) => {
      const segments = PROFILE_STAT_SEGMENTS[slot.side];
      const count = profileGradeCount(state.profileStats[key]);
      for (let index = 0; index < count; index += 1) {
        const segment = segments[index];
        let image = segmentImages.middle;
        if (index === 0) image = segmentImages.left;
        else if (index === segments.length - 1) image = segmentImages.right;
        if (!image) continue;
        context.drawImage(image, segment.x, y + slot.barY, segment.width, 28);
      }
      context.save();
      context.textAlign = "left";
      context.textBaseline = "alphabetic";
      context.font = '54px "FgoProfileStat", "FgoCeText", sans-serif';
      drawSoftPageGlyph(context, state.profileStats[key], slot.side === "left" ? 430 : 965,
        y + slot.gradeY, 54, "title");
      context.restore();
    });
  }

  function buildProfileCanvas() {
    const source = state.assets.profilePage;
    if (!source?.naturalWidth || !source.naturalHeight) return null;
    const probe = document.createElement("canvas");
    probe.width = source.naturalWidth;
    probe.height = 1;
    const probeContext = probe.getContext("2d");
    const layout = [];
    let totalHeight = 0;
    PROFILE_SECTION_TEMPLATES.forEach((template, index) => {
      const text = state.profileSections[template.key] || "";
      probeContext.font = `${template.fontSize}px "FgoCeText", sans-serif`;
      const lines = wrapLines(probeContext, text, 1020);
      const contentLines = Math.max(1, lines.length);
      const height = Math.max(template.minHeight,
        template.firstBaseline + contentLines * template.lineHeight + 32);
      layout.push({ template, text, lines, height });
      totalHeight += height;
      if (index === 1) totalHeight += PROFILE_PANEL_GAP + PROFILE_STATS_HEIGHT + PROFILE_PANEL_GAP;
      else if (index < PROFILE_SECTION_TEMPLATES.length - 1) totalHeight += PROFILE_PANEL_GAP;
    });

    const canvas = document.createElement("canvas");
    canvas.width = source.naturalWidth;
    canvas.height = Math.max(1, Math.ceil(totalHeight));
    const context = canvas.getContext("2d");
    let y = 0;
    layout.forEach((section, index) => {
      drawProfilePanelSlice(context, section.template, y, section.height);
      context.save();
      context.textAlign = "left";
      context.textBaseline = "alphabetic";
      context.font = `${section.template.fontSize}px "FgoCeText", sans-serif`;
      section.lines.forEach((line, lineIndex) => {
        drawSoftPageGlyph(context, line, 27,
          y + section.template.firstBaseline + lineIndex * section.template.lineHeight,
          section.template.fontSize, "body");
      });
      context.restore();
      y += section.height;
      if (index === 1) {
        y += PROFILE_PANEL_GAP;
        drawProfileStats(context, y);
        y += PROFILE_STATS_HEIGHT + PROFILE_PANEL_GAP;
      } else if (index < layout.length - 1) {
        y += PROFILE_PANEL_GAP;
      }
    });
    state.profileLayout = { height: canvas.height, sections: layout };
    state.profileCanvas = canvas;
    return canvas;
  }

  function clearPageContent(context, x, y, width, height, fillStyle = "rgba(29, 38, 40, 0.97)") {
    context.save();
    context.fillStyle = fillStyle;
    context.fillRect(x, y, width, height);
    context.restore();
  }

  function drawAbilityStat(context, value, x, y, size, color = "#f3d02b") {
    context.save();
    // The original HP/ATK layers use the condensed stat face rather than the
    // story body face. Keep the small dark keyline used by the PSD so edited
    // values sit naturally beside the untouched labels and metadata.
    context.font = `${size}px "FgoCeStat", serif`;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = color;
    context.strokeStyle = "rgba(24, 28, 29, 0.92)";
    context.lineWidth = Math.max(1.5, size * 0.07);
    context.lineJoin = "round";
    context.shadowColor = "rgba(0, 0, 0, 0.62)";
    context.shadowBlur = 1.5;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    context.strokeText(String(value), x, y);
    context.fillText(String(value), x, y);
    context.restore();
  }

  const PAGE_TEXT_PALETTES = {
    title: ["#faf9f5", "#efeee9", "#d5d7d5"],
    body: ["#f7f6f2", "#ebeae5", "#d1d3d1"]
  };

  function drawSoftPageGlyph(context, text, x, y, size, tone = "body") {
    context.save();
    const palette = PAGE_TEXT_PALETTES[tone];
    if (palette) {
      const gradient = context.createLinearGradient(0, y - size * 0.88, 0, y + size * 0.1);
      gradient.addColorStop(0, palette[0]);
      gradient.addColorStop(0.56, palette[1]);
      gradient.addColorStop(1, palette[2]);
      context.fillStyle = gradient;
    } else {
      context.fillStyle = tone;
    }
    // The source text has a softened alpha edge and a restrained drop shadow,
    // but no painted outline or dark halo.
    context.filter = `blur(${Math.max(0.3, Math.min(0.65, size * 0.015))}px)`;
    context.globalAlpha = 0.96;
    context.shadowColor = "rgba(0, 0, 0, 0.24)";
    context.shadowBlur = Math.max(0.7, Math.min(1.35, size * 0.03));
    context.shadowOffsetX = 0.45;
    context.shadowOffsetY = 0.8;
    context.fillText(text, x, y);
    context.restore();
  }

  function drawPageText(context, text, x, y, maxWidth, preferredSize, minimumSize, tone = "title") {
    const value = String(text || "");
    context.save();
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    const size = fitFont(context, value, maxWidth, preferredSize, minimumSize, '"FgoCeText", sans-serif');
    context.font = `${size}px "FgoCeText", sans-serif`;
    drawSoftPageGlyph(context, value, x, y, size, tone);
    context.restore();
  }

  function drawPageParagraph(context, text, x, y, width, maxLines, size, lineHeight) {
    context.save();
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.font = `${size}px "FgoCeText", sans-serif`;
    const lines = wrapLines(context, text, width, maxLines);
    lines.forEach((line, index) => {
      drawSoftPageGlyph(context, line, x, y + index * lineHeight, size, "body");
    });
    context.restore();
  }

  // Skill rows use the same source coordinates as the PSD. Keeping the three
  // groups separate lets the editor target one skill category without
  // changing the visual geometry of the original page.
  const SKILL_SLOTS = {
    active: [
      { icon: { x: 197, y: 695, width: 150, height: 150 }, text: { x: 384, y: 686, width: 650, height: 150 } },
      { icon: { x: 197, y: 902, width: 151, height: 151 }, text: { x: 384, y: 892, width: 650, height: 180 } },
      { icon: { x: 196, y: 1108, width: 152, height: 151 }, text: { x: 384, y: 1100, width: 650, height: 180 } }
    ],
    class: [
      { icon: { x: 197, y: 1407, width: 151, height: 151 }, text: { x: 384, y: 1398, width: 650, height: 188 } },
      { icon: { x: 197, y: 1618, width: 151, height: 151 }, text: { x: 384, y: 1609, width: 650, height: 188 } },
      { icon: { x: 197, y: 1839, width: 151, height: 151 }, text: { x: 384, y: 1830, width: 650, height: 188 } }
    ],
    append: [
      { icon: { x: 197, y: 2134, width: 151, height: 151 }, text: { x: 384, y: 2125, width: 650, height: 188 } },
      { icon: { x: 197, y: 2340, width: 151, height: 151 }, text: { x: 384, y: 2331, width: 650, height: 188 } },
      { icon: { x: 197, y: 2548, width: 151, height: 151 }, text: { x: 384, y: 2539, width: 650, height: 188 } }
    ]
  };

  function getSkillCollection(group = "active") {
    if (group === "class") return state.classSkills;
    if (group === "append") return state.appendSkills;
    return state.skills;
  }

  function skillGroupLabel(group = "active") {
    if (group === "class") return "职介技能";
    if (group === "append") return "追加技能";
    return "持有技能";
  }

  function restorePageRegion(context, source, rect) {
    if (!source?.naturalWidth || !source.naturalHeight) return;
    context.drawImage(source,
      rect.x, rect.y, rect.width, rect.height,
      rect.x, rect.y, rect.width, rect.height);
  }

  function mappedLayerRect(bounds, anchor, target) {
    const scaleX = target.width / anchor.width;
    const scaleY = target.height / anchor.height;
    return {
      x: target.x + (bounds.x - anchor.x) * scaleX,
      y: target.y + (bounds.y - anchor.y) * scaleY,
      width: bounds.width * scaleX,
      height: bounds.height * scaleY
    };
  }

  function drawPsdCardLayer(context, image, bounds, anchor = bounds, target = anchor) {
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const destination = mappedLayerRect(bounds, anchor, target);
    context.drawImage(image,
      bounds.x, bounds.y, bounds.width, bounds.height,
      destination.x, destination.y, destination.width, destination.height);
  }

  function drawTightPsdLayer(context, image, bounds, anchor, target) {
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const destination = mappedLayerRect(bounds, anchor, target);
    context.drawImage(image,
      destination.x, destination.y, destination.width, destination.height);
  }

  function drawImportedCardArt(context, image, bounds, anchor = bounds, target = anchor) {
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const destination = mappedLayerRect(bounds, anchor, target);
    context.save();
    context.beginPath();
    context.rect(destination.x, destination.y, destination.width, destination.height);
    context.clip();
    drawCover(context, image, destination);
    context.restore();
  }

  function transformNobleText(context, x, y, shear = 0) {
    context.translate(x, y);
    context.rotate(-5.4 * Math.PI / 180);
    if (shear) context.transform(1, 0, shear, 1, 0, 0);
  }

  function drawNobleFeather(context, text, lineWidth, blur) {
    context.save();
    context.strokeStyle = "rgba(7, 7, 6, 0.78)";
    context.lineWidth = lineWidth;
    context.shadowColor = "rgba(0, 0, 0, 0.76)";
    context.shadowBlur = blur;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 1;
    context.strokeText(text, 0, 0);
    context.restore();
  }

  function drawStylizedNobleSubtitle(context, text, x, y, maxWidth) {
    const value = String(text || "");
    context.save();
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    const size = fitFont(context, value, maxWidth, 20, 12, '"FgoNobleText", serif');
    transformNobleText(context, x, y);
    context.font = `400 ${size}px "FgoNobleText", serif`;
    context.lineJoin = "round";
    drawNobleFeather(context, value, 5, 4.5);
    context.strokeStyle = "rgba(10, 10, 9, 0.94)";
    context.lineWidth = 3.2;
    context.strokeText(value, 0, 0);
    context.fillStyle = "#deddd6";
    context.fillText(value, 0, 0);
    context.restore();
  }

  function drawStylizedNobleName(context, text, x, y, maxWidth) {
    const value = String(text || "");
    context.save();
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    const size = fitFont(context, value, maxWidth - 18, 58, 27, '"FgoNobleText", serif');
    // The PSD baseline rises roughly 32px over 357px from left to right.
    transformNobleText(context, x, y, -0.06);
    context.font = `400 ${size}px "FgoNobleText", serif`;
    context.lineJoin = "round";
    context.miterLimit = 2;
    drawNobleFeather(context, value, 10, 6.5);
    context.strokeStyle = "rgba(9, 9, 7, 0.96)";
    context.lineWidth = 7.2;
    context.strokeText(value, 0, 0);
    const fill = context.createLinearGradient(0, -size, 0, 4);
    fill.addColorStop(0, "#c9a253");
    fill.addColorStop(0.38, "#dec77f");
    fill.addColorStop(0.52, "#eee5c2");
    fill.addColorStop(0.66, "#d9bd70");
    fill.addColorStop(1, "#b78538");
    context.fillStyle = fill;
    context.fillText(value, 0, 0);
    context.restore();
  }

  function drawNobleCard(context) {
    const layers = NOBLE_CARD_LAYERS;
    const treatment = NOBLE_CARD_TREATMENTS[state.nobleCardType] || NOBLE_CARD_TREATMENTS.Buster;
    const assetPrefix = `noble${treatment.asset}`;
    const anchor = NOBLE_CARD_TREATMENTS.Buster.base;
    restorePageRegion(context, state.assets.abilityPage, layers.clear);
    // Each color variant supplies its own card bottom, including the border
    // and background line treatment. Draw it first so imported art remains
    // clipped between the original card layers.
    drawTightPsdLayer(context, state.assets[`${assetPrefix}Base`], treatment.base, anchor, layers.base);
    if (state.nobleArtObjectUrl && state.nobleArt) {
      drawImportedCardArt(context, state.nobleArt, layers.model);
    } else {
      drawPsdCardLayer(context, state.assets.nobleCardModel, layers.model);
    }
    drawTightPsdLayer(context, state.assets[`${assetPrefix}Color`], treatment.color, anchor, layers.base);
    const usesOriginalName = state.nobleName === DEFAULT_NOBLE_NAME &&
      state.nobleSubtitle === DEFAULT_NOBLE_SUBTITLE;
    if (usesOriginalName) {
      drawPsdCardLayer(context, state.assets.nobleCardText, layers.text);
      return;
    }

    drawStylizedNobleSubtitle(context, state.nobleSubtitle, 204, 3086, 154);
    drawStylizedNobleName(context, state.nobleName, 204, 3148, 360);
  }

  function drawNobleHeader(context) {
    const usesOriginalName = state.nobleName === DEFAULT_NOBLE_NAME &&
      state.nobleSubtitle === DEFAULT_NOBLE_SUBTITLE;
    if (usesOriginalName) return;

    restorePageRegion(context, state.assets.abilityPage, {
      x: 380,
      y: 2795,
      width: 670,
      height: 125
    });
    drawPageText(context, state.nobleSubtitle, 389, 2838, 630, 27, 17);
    drawPageText(context, state.nobleName, 388, 2900, 650, 45, 26);
  }

  function drawNobleValue(context, text, x, y, maxWidth, preferredSize, minimumSize) {
    const value = String(text || "");
    context.save();
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    const size = fitFont(context, value, maxWidth, preferredSize, minimumSize, '"FgoCeText", sans-serif');
    context.font = `${size}px "FgoCeText", sans-serif`;
    drawSoftPageGlyph(context, value, x, y, size, "title");
    context.restore();
  }

  function drawNobleDetails(context) {
    restorePageRegion(context, state.assets.abilityPage, {
      x: 575,
      y: 2910,
      width: 480,
      height: 142
    });
    restorePageRegion(context, state.assets.abilityPage, {
      x: 380,
      y: 3140,
      width: 674,
      height: 178
    });
    drawNobleValue(context, state.nobleRank, 610, 2976, 410, 43, 26);
    drawNobleValue(context, state.nobleType, 610, 3036, 410, 43, 26);

    context.save();
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.font = '30px "FgoCeText", sans-serif';
    const lines = wrapLines(context, state.nobleDetail, 654, 4);
    lines.forEach((line, index) => {
      const y = 3186 + index * 35;
      drawSoftPageGlyph(context, line, 388, y, 30, "body");
    });
    context.restore();
  }

  function drawCommandCard(context, type, target) {
    const layers = COMMAND_CARD_LAYERS[type] || COMMAND_CARD_LAYERS.Buster;
    const asset = layers.asset;
    drawPsdCardLayer(context, state.assets[`command${asset}Base`], layers.base, layers.base, target);
    if (state.commandObjectUrl && state.commandArt) {
      drawImportedCardArt(context, state.commandArt, layers.model, layers.base, target);
    } else {
      drawPsdCardLayer(context, state.assets[`command${asset}Model`], layers.model, layers.base, target);
    }
    drawPsdCardLayer(context, state.assets[`command${asset}Color`], layers.color, layers.base, target);
    drawPsdCardLayer(context, state.assets[`command${asset}Text`], layers.text, layers.base, target);
  }

  function restoreSkillSlot(context, slot) {
    // ability-page-shell has the PSD's textured background and icon frame but
    // no editable skill text. Restore both pieces before drawing replacements.
    restorePageRegion(context, state.assets.abilityPage, {
      x: slot.icon.x - 7,
      y: slot.icon.y - 7,
      width: slot.icon.width + 14,
      height: slot.icon.height + 14
    });
    restorePageRegion(context, state.assets.abilityPage, {
      x: slot.text.x,
      y: slot.text.y,
      width: slot.text.width,
      height: slot.text.height
    });
  }

  function drawSkillRows(context, group, skills) {
    const slots = SKILL_SLOTS[group];
    skills.forEach((skill, index) => {
      const slot = slots[index];
      if (!slot) return;
      restoreSkillSlot(context, slot);
      context.save();
      roundedPath(context, slot.icon.x, slot.icon.y, slot.icon.width, slot.icon.height, 6);
      context.clip();
      if (skill.image) {
        context.fillStyle = "#1a2426";
        context.fill();
        drawCover(context, skill.image, slot.icon);
      }
      context.restore();
      drawPageText(context, skill.name || `技能 ${index + 1}`, slot.text.x + 2, slot.text.y + 42,
        slot.text.width - 12, 42, 24);
      drawPageParagraph(context, skill.detail, slot.text.x + 2, slot.text.y + 88,
        slot.text.width - 12, 3, 32, 36);
    });
  }

  function drawAbilityOverlay(context) {
    const artRect = ABILITY_ART_RECT;

    // Restore the complete original PSD metadata block. Level, stars, cost,
    // labels, reinforcement values and ornaments are not editable and should
    // therefore remain original artwork rather than Canvas approximations.
    context.drawImage(state.assets.abilityReference,
      350, 0, 724, 580,
      350, 0, 724, 580);

    if (state.abilityArtObjectUrl && state.abilityArt) {
      context.save();
      context.beginPath();
      context.rect(artRect.x, artRect.y, artRect.width, artRect.height);
      context.clip();
      drawFeatheredContain(context, state.abilityArt, artRect,
        state.abilityArtScale, state.abilityArtX, state.abilityArtY);
      context.restore();
    } else {
      // Keep the untouched PSD portrait and its matching dark page background
      // instead of painting the card's scenic JPG into this small panel.
      context.drawImage(state.assets.abilityReference,
        0, 0, 350, 580,
        0, 0, 350, 580);
    }

    // The shell contains exact blank versions of the editable HP/ATK areas.
    // Restore only the old glyph bounds before drawing replacements. Keeping
    // the clear patch tight prevents a visible rectangle in the textured page.
    context.drawImage(state.assets.abilityPage, 444, 180, 112, 42, 444, 180, 112, 42);
    context.drawImage(state.assets.abilityPage, 734, 180, 118, 42, 734, 180, 118, 42);
    drawAbilityStat(context, state.hp.toLocaleString(), 446, 214, 36);
    drawAbilityStat(context, state.atk.toLocaleString(), 736, 214, 36);

    drawSkillRows(context, "active", state.skills);

    // Passive skills, append skills and Noble Phantasm are not editable in
    // this editor. Copy their original PSD pixels as-is instead of attempting
    // to redraw or approximate their typography and ornaments.
    context.drawImage(state.assets.abilityReference,
      0, 1322, 1074, 2019,
      0, 1322, 1074, 2019);

    // 职介技能 and 追加技能 are independent editable groups. Their shell
    // backgrounds are restored per row before user content is drawn.
    drawSkillRows(context, "class", state.classSkills);
    drawSkillRows(context, "append", state.appendSkills);
    drawNobleCard(context);
    drawNobleHeader(context);
    drawNobleDetails(context);

    const commandSlots = [
      { x: 49, y: 3422, width: 144, height: 186 },
      { x: 253, y: 3423, width: 148, height: 188 },
      { x: 461, y: 3419, width: 149, height: 195 },
      { x: 669, y: 3419, width: 149, height: 195 },
      { x: 876, y: 3419, width: 149, height: 195 }
    ];
    commandSlots.forEach((slot, index) => {
      drawCommandCard(context, state.commandTypes[index], slot);
    });
  }

  function drawEditablePageContent(context, page) {
    if (page === "profile") return;
    drawPageOverlay(context, page, (pageContext) => {
      drawAbilityOverlay(pageContext);
    });
  }

  function revealFixedPageBackground(context, page) {
    if (page !== "ability") return;
    const scale = pageScale(page);
    const pageX = pageLeft(page);
    const offset = Math.min(pageMaxOffset(page), Math.max(0, state.pageOffsets[page] || 0));
    context.save();
    context.beginPath();
    context.rect(pageX, PAGE_TOP, RIGHT_PAGE_WIDTH, HEIGHT - PAGE_TOP);
    context.clip();
    ABILITY_SECTION_GAPS.forEach((gap) => {
      const y = PAGE_TOP + (gap.y - offset) * scale;
      context.save();
      context.beginPath();
      context.rect(pageX, y, RIGHT_PAGE_WIDTH, gap.height * scale);
      context.clip();
      // Copy only the visible background strip. Drawing the complete 1920x1080
      // backdrop for every gap made repeated slider renders unnecessarily
      // expensive on long ability pages.
      const stripHeight = gap.height * scale;
      context.drawImage(state.assets.background,
        0, y, WIDTH, stripHeight,
        0, y, WIDTH, stripHeight);
      context.restore();
    });
    context.restore();
  }

  function updatePageOffsetControl() {
    if (!dom.pageOffset) return;
    const maximum = pageMaxOffset(state.page);
    state.pageOffsets[state.page] = Math.min(maximum, Math.max(0, state.pageOffsets[state.page] || 0));
    dom.pageOffset.max = String(maximum);
    dom.pageOffset.value = String(Math.round(state.pageOffsets[state.page]));
    dom.pageOffset.disabled = maximum === 0;
    if (!maximum) dom.pageOffsetValue.textContent = "顶部";
    else if (state.pageOffsets[state.page] >= maximum) dom.pageOffsetValue.textContent = "底部";
    else dom.pageOffsetValue.textContent = `${Math.round(state.pageOffsets[state.page])} / ${maximum}`;
  }

  function getMetalVariant(image, metal) {
    if (!image) return null;
    const key = `${image.src}|${metal}`;
    const cached = state.metalVariants.get(key);
    if (cached) return cached;
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return image;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const variant = canvas.getContext("2d");
    if (metal === "silver") {
      // Keep the source highlights and edge detail while changing only its
      // metal treatment to the cooler silver used by three-star cards.
      variant.filter = "grayscale(1) brightness(1.16) contrast(.92)";
      variant.drawImage(image, 0, 0);
    } else {
      // Some special classes expose only a silver source icon. Tint that
      // source rather than redrawing the class symbol.
      variant.filter = "grayscale(1) brightness(1.04) contrast(1.04)";
      variant.drawImage(image, 0, 0);
      variant.filter = "none";
      variant.globalCompositeOperation = "source-atop";
      variant.globalAlpha = 0.78;
      const gradient = variant.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#fff2a0");
      gradient.addColorStop(0.45, "#e4af2b");
      gradient.addColorStop(1, "#9b6810");
      variant.fillStyle = gradient;
      variant.fillRect(0, 0, width, height);
    }
    state.metalVariants.set(key, canvas);
    return canvas;
  }

  function classIconForState() {
    const groups = CLASS_ICON_PATHS[state.className] || {};
    const requestedGroup = state.rarity >= 4 ? 3 : 2;
    const availableGroups = Object.keys(groups);
    const group = groups[requestedGroup] ? requestedGroup : Number(availableGroups[0]);
    if (!group) return state.assets.classIcon || null;
    const image = state.assets[`classIcon_${state.className}_${group}`] || state.assets.classIcon;
    if (!image || group === requestedGroup) return image;
    return getMetalVariant(image, requestedGroup === 3 ? "gold" : "silver");
  }

  function rarityStarsForState() {
    const rarity = Math.max(3, Math.min(5, Number(state.rarity) || 5));
    const image = state.assets[`stars${rarity}`];
    if (!image) return null;
    return rarity === 3 ? getMetalVariant(image, "silver") : image;
  }

  function drawServantCard(context) {
    context.save();
    roundedPath(context, ART_RECT.x, ART_RECT.y, ART_RECT.width, ART_RECT.height, 4);
    context.clip();
    context.fillStyle = "#151719";
    context.fillRect(ART_RECT.x, ART_RECT.y, ART_RECT.width, ART_RECT.height);
    drawCover(context, state.art, ART_RECT, state.artScale, state.artX, state.artY);
    context.restore();
    const rarity = Math.max(3, Math.min(5, Number(state.rarity) || 5));
    const frame = rarity === 3
      ? (state.assets.frameSilver || state.assets.frameBase || state.assets.frame)
      : (state.assets.frameBase || state.assets.frame);
    if (frame) context.drawImage(frame, 0, 0, WIDTH, HEIGHT);
    const stars = rarityStarsForState();
    if (stars) context.drawImage(stars, 0, 0, WIDTH, HEIGHT);
    const classIcon = classIconForState();
    // Match the PSD's Class-Pretender-Gold layer bounds. Atlas emblems are
    // 80x80 sources, so they are fitted into this exact 114x117 target box.
    if (classIcon) context.drawImage(classIcon, 370, 935, 114, 117);

    const classLabel = CLASS_LABELS[state.className] || "Servant";
    context.save();
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    const classSize = fitFont(context, classLabel, 390, 52, 26, 'Georgia, "Times New Roman", serif');
    setOutlined(context, `${classSize}px Georgia, "Times New Roman", serif`, 6);
    outlinedText(context, classLabel, 425, 918);
    context.fillStyle = "rgba(240, 204, 105, 0.92)";
    context.fillRect(232, 925, 386, 5);

    const nameSize = fitFont(context, state.name, 330, 30, 18, '"FgoCeText", sans-serif');
    setOutlined(context, `${nameSize}px "FgoCeText", sans-serif`, 4);
    outlinedText(context, state.name, 425, 962);

    context.restore();

    context.save();
    context.textBaseline = "alphabetic";
    setOutlined(context, '700 52px "FgoCeStat", Georgia, serif', 5, "#ffe546");
    context.textAlign = "center";
    outlinedText(context, String(state.atk), 262, 1053);
    outlinedText(context, String(state.hp), 590, 1053);
    context.restore();
  }

  function drawHeaderIdentity(context) {
    // Cover the template's sample identity with an untouched header fragment
    // from the same PSD before placing the editable name and title.
    context.drawImage(state.assets.reference, 936, 0, 550, 142, 1370, 0, 550, 142);
    context.save();
    context.textAlign = "right";
    context.textBaseline = "alphabetic";
    const nameSize = fitFont(context, state.name, 500, 66, 28, '"FgoCeStat", serif');
    setOutlined(context, `${nameSize}px "FgoCeStat", serif`, 5);
    outlinedText(context, state.name, 1870, 78);
    const titleSize = fitFont(context, state.title, 400, 29, 18, '"FgoCeText", sans-serif');
    setOutlined(context, `${titleSize}px "FgoCeText", sans-serif`, 4);
    outlinedText(context, state.title, 1870, 126);
    context.restore();
  }

  function render(page = state.page) {
    state.renderFrame = null;
    if (!state.ready || !dom.canvas) return;
    const context = dom.canvas.getContext("2d", { alpha: false });
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = PAGE_BACKGROUND_COLOR;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.drawImage(state.assets.background, 0, 0, WIDTH, HEIGHT);
    context.drawImage(state.assets.reference, 0, 0, 114, HEIGHT, 0, 0, 114, HEIGHT);
    drawServantCard(context);
    drawTemplateNavigation(context, page);
    drawRightPage(context, page);
    drawEditablePageContent(context, page);
    revealFixedPageBackground(context, page);
    drawHeaderIdentity(context);
  }

  function scheduleRender() {
    if (state.renderFrame !== null) return;
    state.renderFrame = requestAnimationFrame(() => render());
  }

  function updateRange(input, output) {
    output.value = `${input.value}%`;
    output.textContent = output.value;
  }

  function skillControl(collection, group, index) {
    return collection.find((control) =>
      (control.dataset.skillGroup || "active") === group &&
      Number(control.dataset.skillIndex) === index
    );
  }

  function updateFromControls() {
    state.name = dom.name.value;
    state.title = dom.title.value;
    state.className = dom.className.value;
    state.rarity = Math.max(3, Math.min(5, Number(dom.rarity.value) || 5));
    state.nobleName = dom.nobleCardName.value;
    state.nobleSubtitle = dom.nobleCardSubtitle.value;
    state.nobleCardType = dom.nobleCardType.value;
    state.nobleRank = dom.nobleRank.value;
    state.nobleType = dom.nobleType.value;
    state.nobleDetail = dom.nobleDetail.value;
    state.atk = Math.max(0, Math.min(99999, Number(dom.atk.value) || 0));
    state.hp = Math.max(0, Math.min(99999, Number(dom.hp.value) || 0));
    state.artScale = Number(dom.artScale.value) || 100;
    state.artX = Number(dom.artX.value) || 0;
    state.artY = Number(dom.artY.value) || 0;
    state.abilityArtScale = Number(dom.abilityArtScale.value) || 100;
    state.abilityArtX = Number(dom.abilityArtX.value) || 0;
    state.abilityArtY = Number(dom.abilityArtY.value) || 0;
    state.profileSections[state.activeProfileSection] = dom.profile.value;
    state.profile = state.profileSections.details;
    state.profileCanvas = null;
    dom.profileSectionSelect.value = state.activeProfileSection;
    dom.profileStats.forEach((control) => {
      state.profileStats[control.dataset.servantProfileStat] = control.value;
    });
    if (state.page === "profile") updatePageOffsetControl();
    ["active", "class", "append"].forEach((group) => {
      getSkillCollection(group).forEach((skill, index) => {
        const nameControl = skillControl(dom.skillNames, group, index);
        const detailControl = skillControl(dom.skillDetails, group, index);
        if (nameControl) skill.name = nameControl.value;
        if (detailControl) skill.detail = detailControl.value;
      });
    });
    state.commandTypes = dom.commandTypes.map((select) => select.value);
    updateRange(dom.artScale, dom.artScaleValue);
    updateRange(dom.artX, dom.artXValue);
    updateRange(dom.artY, dom.artYValue);
    updateRange(dom.abilityArtScale, dom.abilityArtScaleValue);
    updateRange(dom.abilityArtX, dom.abilityArtXValue);
    updateRange(dom.abilityArtY, dom.abilityArtYValue);
    scheduleRender();
  }

  function setPage(page) {
    state.page = page === "profile" ? "profile" : "ability";
    if (state.page === "profile") {
      if (!state.profileCanvas) buildProfileCanvas();
      selectProfileSection(state.activeProfileSection, false);
    }
    dom.pageButtons.forEach((button) => {
      const active = button.dataset.servantCardPage === state.page;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    dom.abilityTabs.hidden = state.page !== "ability";
    if (state.page === "profile" && state.controlTab !== "profile") setControlTab("profile");
    if (state.page === "ability" && state.controlTab === "profile") setControlTab("basic");
    updatePageOffsetControl();
    scheduleRender();
  }

  function selectProfileSection(sectionKey, syncCurrent = true) {
    const next = PROFILE_SECTION_TEMPLATES.some((template) => template.key === sectionKey)
      ? sectionKey : "details";
    if (syncCurrent && dom.profile && state.activeProfileSection) {
      state.profileSections[state.activeProfileSection] = dom.profile.value;
    }
    state.activeProfileSection = next;
    if (dom.profile) dom.profile.value = state.profileSections[next] || "";
    if (dom.profileSectionSelect) dom.profileSectionSelect.value = next;
    if (dom.profileSectionLabel) {
      const labels = {
        credits: "画师·声优内容",
        details: "角色详情内容"
      };
      dom.profileSectionLabel.textContent = labels[next] || `个人资料 ${next.replace("profile", "")} 内容`;
    }
    state.profileCanvas = null;
    updateFromControls();
  }

  function setControlTab(tab) {
    state.controlTab = tab;
    dom.controlTabButtons.forEach((button) => {
      const active = button.dataset.servantCardControlTab === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    dom.controlPanels.forEach((panel) => {
      panel.hidden = panel.dataset.servantCardControlPanel !== tab;
    });
  }

  function focusControlTab(tab) {
    const offsets = {
      basic: 0,
      activeSkills: 580,
      classSkills: 1300,
      appendSkills: 2000,
      nobleCard: 2660,
      commandCards: pageMaxOffset("ability")
    };
    if (!(tab in offsets) || state.page !== "ability") return;
    state.pageOffsets.ability = Math.min(pageMaxOffset("ability"), offsets[tab]);
    updatePageOffsetControl();
    scheduleRender();
  }

  async function importImage(file, target) {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setStatus("请选择 PNG、JPEG 或 WebP 图片", true);
      return;
    }
    const objectKeys = {
      art: "artObjectUrl",
      abilityArt: "abilityArtObjectUrl",
      commandArt: "commandObjectUrl",
      nobleArt: "nobleArtObjectUrl"
    };
    const objectKey = objectKeys[target];
    if (!objectKey) return;
    if (state[objectKey]) URL.revokeObjectURL(state[objectKey]);
    state[objectKey] = URL.createObjectURL(file);
    try {
      state[target] = await loadImage(state[objectKey]);
      const nameTargets = {
        art: dom.artName,
        abilityArt: dom.abilityArtName,
        commandArt: dom.commandName,
        nobleArt: dom.nobleName
      };
      nameTargets[target].textContent = file.name;
      const labels = {
        art: "从者卡面立绘",
        abilityArt: "能力页立绘",
        commandArt: "指令卡立绘",
        nobleArt: "宝具卡立绘"
      };
      setStatus(`${labels[target]}已导入`);
      scheduleRender();
    } catch (_error) {
      setStatus("无法读取这张图片", true);
    }
  }

  async function importSkillIcon(file, index, group = "active") {
    if (!file || !String(file.type || "").startsWith("image/")) return;
    const skill = getSkillCollection(group)[index];
    if (!skill) return;
    if (skill.objectUrl) URL.revokeObjectURL(skill.objectUrl);
    skill.objectUrl = URL.createObjectURL(file);
    try {
      skill.image = await loadImage(skill.objectUrl);
      updateSkillThumb(group, index);
      setStatus(`${skillGroupLabel(group)} ${index + 1} 图标已导入`);
      scheduleRender();
    } catch (_error) {
      setStatus("技能图标读取失败", true);
    }
  }

  function updateSkillThumb(group, index) {
    const skill = getSkillCollection(group)[index];
    const thumb = skillControl(dom.skillThumbs, group, index);
    if (!thumb) return;
    if (skill?.image) {
      thumb.src = skill.image.src;
      return;
    }
    // Show the untouched PSD icon in the control list when no replacement
    // has been selected. This avoids implying that the active-skill sample is
    // the default class-skill artwork.
    const slot = SKILL_SLOTS[group]?.[index];
    const source = state.assets.abilityPage;
    if ((group === "class" || group === "append") && slot && source?.naturalWidth) {
      const preview = document.createElement("canvas");
      preview.width = slot.icon.width;
      preview.height = slot.icon.height;
      preview.getContext("2d").drawImage(source,
        slot.icon.x, slot.icon.y, slot.icon.width, slot.icon.height,
        0, 0, slot.icon.width, slot.icon.height);
      thumb.src = preview.toDataURL("image/png");
      return;
    }
    thumb.removeAttribute("src");
  }

  function openSkillSearch(group, index) {
    // Keep the legacy numeric call shape working for integrations that used
    // openSkillSearch(index) before class skills were introduced.
    if (typeof group === "number") {
      index = group;
      group = "active";
    }
    state.activeSkillTarget = { group, index };
    state.activeSkillSearch = index;
    dom.searchInput.value = "";
    dom.searchResults.innerHTML = '<p class="servant-card-search-empty">正在加载技能图标目录...</p>';
    dom.searchTarget.textContent = `正在为${skillGroupLabel(group)} ${index + 1} 选择图标 · 正在加载目录`;
    dom.searchPanel.hidden = false;
    dom.searchInput.focus();
    loadSkillCatalog().then((items) => {
      if (dom.searchPanel.hidden) return;
      dom.searchTarget.textContent = `正在为${skillGroupLabel(group)} ${index + 1} 选择图标 · 共 ${items.length} 个图标`;
      renderSkillResults(filterSkillCatalog(dom.searchInput.value), true);
    }).catch(() => {
      if (!dom.searchPanel.hidden) {
        dom.searchTarget.textContent = `正在为${skillGroupLabel(group)} ${index + 1} 选择图标 · 目录读取失败，可使用在线搜索`;
        dom.searchResults.innerHTML = '<p class="servant-card-search-empty">图标目录读取失败，请输入名称后使用在线搜索，或导入本地图标。</p>';
      }
    });
  }

  function closeSkillSearch() {
    if (state.searchController) state.searchController.abort();
    state.searchController = null;
    dom.searchPanel.hidden = true;
  }

  function normalizeSkillCatalog(items) {
    const unique = [];
    const seen = new Set();
    for (const item of items || []) {
      if (!item?.icon || seen.has(item.icon)) continue;
      seen.add(item.icon);
      unique.push({
        id: item.id,
        name: item.name || "未命名技能",
        ruby: item.ruby || "",
        icon: item.icon
      });
    }
    return unique.sort((a, b) => String(a.name).localeCompare(String(b.name), "ja"));
  }

  async function loadSkillCatalog() {
    if (state.skillCatalog) return state.skillCatalog;
    if (state.skillCatalogPromise) return state.skillCatalogPromise;
    const requests = ["active", "passive"].flatMap((type) => [1, 2, 3].map((num) =>
      fetch(`${API_BASE}/basic/JP/skill/search?type=${type}&num=${num}`)
        .then((response) => {
          if (!response.ok) throw new Error(`技能目录读取返回 ${response.status}`);
          return response.json();
        })
    ));
    state.skillCatalogPromise = Promise.all(requests)
      .then((groups) => {
        state.skillCatalog = normalizeSkillCatalog(groups.flat());
        return state.skillCatalog;
      })
      .catch((error) => {
        state.skillCatalogPromise = null;
        throw error;
      });
    return state.skillCatalogPromise;
  }

  function filterSkillCatalog(query) {
    if (!state.skillCatalog) return [];
    const normalized = String(query || "").trim().toLocaleLowerCase();
    if (!normalized) return state.skillCatalog;
    return state.skillCatalog.filter((item) =>
      [item.name, item.ruby].some((value) => String(value || "").toLocaleLowerCase().includes(normalized))
    );
  }

  async function searchSkills() {
    const query = dom.searchInput.value.trim();
    if (query.length < 2) {
      loadSkillCatalog().then(() => renderSkillResults(filterSkillCatalog(query), true)).catch(() => {
        dom.searchResults.innerHTML = '<p class="servant-card-search-empty">图标目录读取失败，请检查网络或使用本地图标导入。</p>';
      });
      return;
    }
    if (state.searchController) state.searchController.abort();
    const controller = new AbortController();
    state.searchController = controller;
    dom.searchButton.disabled = true;
    dom.searchResults.innerHTML = '<p class="servant-card-search-empty">正在搜索阿特拉斯院数据库...</p>';
    try {
      const response = await fetch(`${API_BASE}/nice/JP/skill/search?name=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`技能搜索返回 ${response.status}`);
      const data = await response.json();
      const unique = [];
      const seen = new Set();
      for (const item of data) {
        const key = `${item.name}|${item.icon}`;
        if (!item.icon || seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
        if (unique.length >= 30) break;
      }
      renderSkillResults(unique, false);
    } catch (error) {
      if (error.name !== "AbortError") {
        dom.searchResults.innerHTML = '<p class="servant-card-search-empty">搜索失败，请检查网络；仍可使用本地图标导入。</p>';
      }
    } finally {
      if (state.searchController === controller) state.searchController = null;
      dom.searchButton.disabled = false;
    }
  }

  function renderSkillResults(items, fromCatalog = false) {
    dom.searchResults.replaceChildren();
    if (!items.length) {
      dom.searchResults.innerHTML = '<p class="servant-card-search-empty">未找到匹配技能。</p>';
      return;
    }
    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "servant-card-search-result";
      const image = document.createElement("img");
      image.src = item.icon;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = item.name;
      const detail = document.createElement("small");
      detail.textContent = item.detail || item.ruby || (fromCatalog ? "技能图标 · 点击选择" : "无技能说明");
      copy.append(name, detail);
      button.append(image, copy);
      button.addEventListener("click", () => selectSkillResult(item));
      dom.searchResults.append(button);
    });
  }

  async function selectSkillResult(item) {
    const { group, index } = state.activeSkillTarget || { group: "active", index: state.activeSkillSearch };
    const skill = getSkillCollection(group)[index];
    if (!skill) return;
    setStatus("正在读取技能图标");
    try {
      const image = await loadImage(item.icon, true);
      skill.image = image;
      skill.name = item.name || skill.name;
      skill.detail = item.detail || skill.detail;
      const nameControl = skillControl(dom.skillNames, group, index);
      const detailControl = skillControl(dom.skillDetails, group, index);
      if (nameControl) nameControl.value = skill.name;
      if (detailControl) detailControl.value = skill.detail;
      updateSkillThumb(group, index);
      closeSkillSearch();
      setStatus(`已选择${skillGroupLabel(group)}：${skill.name}`);
      scheduleRender();
    } catch (_error) {
      setStatus("技能图标读取失败，可改用本地导入", true);
    }
  }

  function resetTransform() {
    dom.artScale.value = "100";
    dom.artX.value = "0";
    dom.artY.value = "0";
    updateFromControls();
  }

  function resetAbilityTransform() {
    dom.abilityArtScale.value = "100";
    dom.abilityArtX.value = "0";
    dom.abilityArtY.value = "0";
    updateFromControls();
  }

  function resetAll() {
    state.name = "阿卡多";
    state.title = "身披角色者";
    state.className = "pretender";
    state.rarity = 5;
    state.nobleName = DEFAULT_NOBLE_NAME;
    state.nobleSubtitle = DEFAULT_NOBLE_SUBTITLE;
    state.nobleCardType = "Buster";
    state.nobleRank = DEFAULT_NOBLE_RANK;
    state.nobleType = DEFAULT_NOBLE_TYPE;
    state.nobleDetail = DEFAULT_NOBLE_DETAIL;
    state.atk = 12499;
    state.hp = 14770;
    state.level = 80;
    state.levelMax = 80;
    state.cost = 16;
    state.profileSections = { ...DEFAULT_PROFILE_SECTIONS };
    state.profileStats = { ...DEFAULT_PROFILE_STATS };
    state.profile = state.profileSections.details;
    state.activeProfileSection = "details";
    state.profileCanvas = null;
    state.art = state.assets.art;
    if (state.abilityArtObjectUrl) URL.revokeObjectURL(state.abilityArtObjectUrl);
    state.abilityArtObjectUrl = "";
    state.abilityArt = null;
    if (state.commandObjectUrl) URL.revokeObjectURL(state.commandObjectUrl);
    if (state.nobleArtObjectUrl) URL.revokeObjectURL(state.nobleArtObjectUrl);
    state.commandObjectUrl = "";
    state.nobleArtObjectUrl = "";
    state.commandArt = null;
    state.nobleArt = null;
    state.skills = DEFAULT_SKILLS.map((skill) => ({
      ...skill,
      image: state.assets[skill.asset],
      objectUrl: ""
    }));
    state.classSkills = DEFAULT_CLASS_SKILLS.map((skill) => ({
      ...skill,
      image: skill.asset ? state.assets[skill.asset] : null,
      objectUrl: ""
    }));
    state.appendSkills = DEFAULT_APPEND_SKILLS.map((skill) => ({
      ...skill,
      image: skill.asset ? state.assets[skill.asset] : null,
      objectUrl: ""
    }));
    state.commandTypes = ["Quick", "Arts", "Buster", "Buster", "Buster"];
    state.pageOffsets = { ability: 0, profile: 0 };
    dom.name.value = state.name;
    dom.title.value = state.title;
    dom.className.value = state.className;
    dom.rarity.value = String(state.rarity);
    dom.nobleCardName.value = state.nobleName;
    dom.nobleCardSubtitle.value = state.nobleSubtitle;
    dom.nobleCardType.value = state.nobleCardType;
    dom.nobleRank.value = state.nobleRank;
    dom.nobleType.value = state.nobleType;
    dom.nobleDetail.value = state.nobleDetail;
    dom.atk.value = String(state.atk);
    dom.hp.value = String(state.hp);
    dom.profile.value = state.profileSections[state.activeProfileSection];
    dom.profileSectionSelect.value = state.activeProfileSection;
    dom.profileStats.forEach((control) => {
      control.value = state.profileStats[control.dataset.servantProfileStat];
    });
    dom.profileSectionLabel.textContent = "角色详情内容";
    dom.artName.textContent = "PSD 模板示例";
    dom.abilityArtName.textContent = "默认使用 PSD 原始立绘";
    dom.commandName.textContent = "默认使用 PSD 原始立绘";
    dom.nobleName.textContent = "默认使用 PSD 原始立绘";
    ["active", "class", "append"].forEach((group) => {
      getSkillCollection(group).forEach((skill, index) => {
        const nameControl = skillControl(dom.skillNames, group, index);
        const detailControl = skillControl(dom.skillDetails, group, index);
        if (nameControl) nameControl.value = skill.name;
        if (detailControl) detailControl.value = skill.detail;
        updateSkillThumb(group, index);
      });
    });
    dom.commandTypes.forEach((select, index) => {
      select.value = state.commandTypes[index];
    });
    resetTransform();
    resetAbilityTransform();
    setPage("ability");
    setStatus("已恢复 PSD 模板示例");
  }

  function canvasBlob() {
    return new Promise((resolve, reject) => dom.canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG 生成失败"));
    }, "image/png"));
  }

  function sanitizedName() {
    return (state.name.trim() || "自制从者").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function exportCurrent() {
    if (!state.ready || dom.exportButton.disabled) return;
    dom.exportButton.disabled = true;
    const original = dom.exportButton.textContent;
    dom.exportButton.textContent = "正在生成";
    try {
      render(state.page);
      const blob = await canvasBlob();
      downloadBlob(blob, `${sanitizedName()}-${state.page === "profile" ? "资料" : "能力"}.png`);
      setStatus(`当前页面已生成 · ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
    } catch (error) {
      setStatus(error.message || "PNG 导出失败", true);
    } finally {
      dom.exportButton.disabled = false;
      dom.exportButton.textContent = original;
      render();
    }
  }

  async function exportAll() {
    if (!state.ready || dom.exportAllButton.disabled) return;
    dom.exportAllButton.disabled = true;
    const original = dom.exportAllButton.textContent;
    dom.exportAllButton.textContent = "正在打包";
    try {
      render("ability");
      const ability = await canvasBlob();
      render("profile");
      const profile = await canvasBlob();
      const base = sanitizedName();
      const zip = await createStoredZip([
        { filename: `${base}-能力.png`, blob: ability },
        { filename: `${base}-资料.png`, blob: profile }
      ]);
      downloadBlob(zip, `${base}-从者卡套图.zip`);
      setStatus(`两张页面已打包 · ${(zip.size / 1024 / 1024).toFixed(1)} MB`);
    } catch (error) {
      setStatus(error.message || "套图导出失败", true);
    } finally {
      dom.exportAllButton.disabled = false;
      dom.exportAllButton.textContent = original;
      render();
    }
  }

  const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
      table[index] = value >>> 0;
    }
    return table;
  })();

  function crc32(data) {
    let value = 0xffffffff;
    for (let index = 0; index < data.length; index += 1) {
      value = CRC32_TABLE[(value ^ data[index]) & 0xff] ^ (value >>> 8);
    }
    return (value ^ 0xffffffff) >>> 0;
  }

  function dosTimestamp(date) {
    const year = Math.max(1980, date.getFullYear());
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  async function createStoredZip(entries) {
    const localParts = [];
    const centralParts = [];
    const timestamp = dosTimestamp(new Date());
    let offset = 0;
    for (const entry of entries) {
      const data = new Uint8Array(await entry.blob.arrayBuffer());
      const name = new TextEncoder().encode(entry.filename);
      const checksum = crc32(data);
      const local = new Uint8Array(30 + name.length);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(10, timestamp.time, true);
      localView.setUint16(12, timestamp.date, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, name.length, true);
      local.set(name, 30);
      const central = new Uint8Array(46 + name.length);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(12, timestamp.time, true);
      centralView.setUint16(14, timestamp.date, true);
      centralView.setUint32(16, checksum, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, name.length, true);
      centralView.setUint32(42, offset, true);
      central.set(name, 46);
      localParts.push(local, data);
      centralParts.push(central);
      offset += local.length + data.length;
    }
    const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);
    return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
  }

  function bindEvents() {
    dom.pageButtons.forEach((button) => button.addEventListener("click", () => setPage(button.dataset.servantCardPage)));
    dom.controlTabButtons.forEach((button) => button.addEventListener("click", () => {
      const tab = button.dataset.servantCardControlTab;
      if (tab === "profile") setPage("profile");
      else if (state.page === "profile") setPage("ability");
      setControlTab(tab);
      focusControlTab(tab);
    }));
    [dom.name, dom.title, dom.className, dom.rarity, dom.atk, dom.hp, dom.artScale, dom.artX, dom.artY,
      dom.abilityArtScale, dom.abilityArtX, dom.abilityArtY, dom.nobleCardName,
      dom.nobleCardSubtitle, dom.nobleCardType, dom.nobleRank, dom.nobleType,
      dom.nobleDetail, dom.profile,
      ...dom.skillNames, ...dom.skillDetails, ...dom.commandTypes]
      .forEach((control) => control.addEventListener("input", updateFromControls));
    dom.profileSectionSelect.addEventListener("change", () => selectProfileSection(dom.profileSectionSelect.value));
    dom.profileStats.forEach((control) => {
      control.addEventListener("input", updateFromControls);
      control.addEventListener("change", updateFromControls);
    });
    dom.artButton.addEventListener("click", () => dom.artInput.click());
    dom.artInput.addEventListener("change", () => {
      importImage(dom.artInput.files?.[0], "art");
      dom.artInput.value = "";
    });
    dom.abilityArtButton.addEventListener("click", () => dom.abilityArtInput.click());
    dom.abilityArtInput.addEventListener("change", () => {
      importImage(dom.abilityArtInput.files?.[0], "abilityArt");
      dom.abilityArtInput.value = "";
    });
    dom.commandButton.addEventListener("click", () => dom.commandInput.click());
    dom.commandInput.addEventListener("change", () => {
      importImage(dom.commandInput.files?.[0], "commandArt");
      dom.commandInput.value = "";
    });
    dom.nobleButton.addEventListener("click", () => dom.nobleInput.click());
    dom.nobleInput.addEventListener("change", () => {
      importImage(dom.nobleInput.files?.[0], "nobleArt");
      dom.nobleInput.value = "";
    });
    dom.skillSearchButtons.forEach((button) => button.addEventListener("click", () => openSkillSearch(
      button.dataset.skillGroup || "active", Number(button.dataset.skillIndex)
    )));
    dom.skillImportButtons.forEach((button) => button.addEventListener("click", () => {
      const group = button.dataset.skillGroup || "active";
      const index = Number(button.dataset.skillIndex);
      skillControl(dom.skillInputs, group, index)?.click();
    }));
    dom.skillInputs.forEach((input) => input.addEventListener("change", () => {
      importSkillIcon(input.files?.[0], Number(input.dataset.skillIndex), input.dataset.skillGroup || "active");
      input.value = "";
    }));
    dom.searchButton.addEventListener("click", searchSkills);
    dom.searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchSkills();
      }
    });
    dom.searchInput.addEventListener("input", () => {
      if (!state.skillCatalog) return;
      renderSkillResults(filterSkillCatalog(dom.searchInput.value), true);
    });
    dom.searchClose.addEventListener("click", closeSkillSearch);
    dom.pageOffset.addEventListener("input", () => {
      state.pageOffsets[state.page] = Number(dom.pageOffset.value) || 0;
      updatePageOffsetControl();
      scheduleRender();
    });
    dom.artResetButton.addEventListener("click", resetTransform);
    dom.abilityArtResetButton.addEventListener("click", resetAbilityTransform);
    dom.resetButton.addEventListener("click", resetAll);
    dom.exportButton.addEventListener("click", exportCurrent);
    dom.exportAllButton.addEventListener("click", exportAll);
  }

  function init() {
    if (state.initialized) return;
    dom = {
      panel: document.getElementById("servantCardPanel"),
      canvas: document.getElementById("servantCardCanvas"),
      status: document.getElementById("servantCardStatus"),
      pageButtons: [...document.querySelectorAll("[data-servant-card-page]")],
      pageOffset: document.getElementById("servantCardPageOffset"),
      pageOffsetValue: document.getElementById("servantCardPageOffsetValue"),
      controlTabButtons: [...document.querySelectorAll("[data-servant-card-control-tab]")],
      controlPanels: [...document.querySelectorAll("[data-servant-card-control-panel]")],
      abilityTabs: document.getElementById("servantCardAbilityTabs"),
      name: document.getElementById("servantCardName"),
      title: document.getElementById("servantCardTitle"),
      className: document.getElementById("servantCardClass"),
      rarity: document.getElementById("servantCardRarity"),
      nobleCardName: document.getElementById("servantNobleCardName"),
      nobleCardSubtitle: document.getElementById("servantNobleCardSubtitle"),
      nobleCardType: document.getElementById("servantNobleCardType"),
      nobleRank: document.getElementById("servantNobleRank"),
      nobleType: document.getElementById("servantNobleType"),
      nobleDetail: document.getElementById("servantNobleDetail"),
      atk: document.getElementById("servantCardAtk"),
      hp: document.getElementById("servantCardHp"),
      artButton: document.getElementById("servantCardArtButton"),
      artInput: document.getElementById("servantCardArtInput"),
      artName: document.getElementById("servantCardArtName"),
      artScale: document.getElementById("servantCardArtScale"),
      artScaleValue: document.getElementById("servantCardArtScaleValue"),
      artX: document.getElementById("servantCardArtX"),
      artXValue: document.getElementById("servantCardArtXValue"),
      artY: document.getElementById("servantCardArtY"),
      artYValue: document.getElementById("servantCardArtYValue"),
      artResetButton: document.getElementById("servantCardArtReset"),
      abilityArtButton: document.getElementById("servantCardAbilityArtButton"),
      abilityArtInput: document.getElementById("servantCardAbilityArtInput"),
      abilityArtName: document.getElementById("servantCardAbilityArtName"),
      abilityArtScale: document.getElementById("servantCardAbilityArtScale"),
      abilityArtScaleValue: document.getElementById("servantCardAbilityArtScaleValue"),
      abilityArtX: document.getElementById("servantCardAbilityArtX"),
      abilityArtXValue: document.getElementById("servantCardAbilityArtXValue"),
      abilityArtY: document.getElementById("servantCardAbilityArtY"),
      abilityArtYValue: document.getElementById("servantCardAbilityArtYValue"),
      abilityArtResetButton: document.getElementById("servantCardAbilityArtReset"),
      skillNames: [...document.querySelectorAll("[data-servant-skill-name]")],
      skillDetails: [...document.querySelectorAll("[data-servant-skill-detail]")],
      skillThumbs: [...document.querySelectorAll("[data-servant-skill-thumb]")],
      skillSearchButtons: [...document.querySelectorAll("[data-servant-skill-search]")],
      skillImportButtons: [...document.querySelectorAll("[data-servant-skill-import]")],
      skillInputs: [...document.querySelectorAll("[data-servant-skill-input]")],
      commandButton: document.getElementById("servantCommandArtButton"),
      commandInput: document.getElementById("servantCommandArtInput"),
      commandName: document.getElementById("servantCommandArtName"),
      nobleButton: document.getElementById("servantNobleArtButton"),
      nobleInput: document.getElementById("servantNobleArtInput"),
      nobleName: document.getElementById("servantNobleArtName"),
      commandTypes: [...document.querySelectorAll("[data-servant-command-type]")],
      profile: document.getElementById("servantCardProfile"),
      profileSectionLabel: document.getElementById("servantCardProfileSectionLabel"),
      profileSectionSelect: document.getElementById("servantCardProfileSectionSelect"),
      profileStats: [...document.querySelectorAll("[data-servant-profile-stat]")],
      searchPanel: document.getElementById("servantSkillSearchPanel"),
      searchTarget: document.getElementById("servantSkillSearchTarget"),
      searchInput: document.getElementById("servantSkillSearchInput"),
      searchButton: document.getElementById("servantSkillSearchButton"),
      searchResults: document.getElementById("servantSkillSearchResults"),
      searchClose: document.getElementById("servantSkillSearchClose"),
      resetButton: document.getElementById("servantCardResetButton"),
      exportButton: document.getElementById("servantCardExportButton"),
      exportAllButton: document.getElementById("servantCardExportAllButton")
    };
    if (!dom.panel || !dom.canvas) return;
    state.initialized = true;
    bindEvents();
    setControlTab("basic");
    updateFromControls();
    updatePageOffsetControl();
  }

  function open() {
    init();
    dom.panel.hidden = false;
    document.querySelector(".app-shell").classList.add("is-servant-card-open");
    if (state.ready) {
      dom.canvas.removeAttribute("aria-busy");
      setStatus("从者卡模板已就绪");
      scheduleRender();
    } else {
      dom.canvas.setAttribute("aria-busy", "true");
      setStatus("正在读取从者卡模板");
    }
    ensureReady().catch(() => {});
  }

  function close() {
    if (!state.initialized) return;
    closeSkillSearch();
    dom.panel.hidden = true;
    document.querySelector(".app-shell").classList.remove("is-servant-card-open");
  }

  window.FgoServantCardEditor = { init, open, close, render };
})();
