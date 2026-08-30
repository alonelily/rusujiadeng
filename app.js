(function () {
  "use strict";

  const API_BASE = "https://api.atlasacademy.io";
  const STATIC_ASSET_BASE = "https://static.atlasacademy.io";
  const PAGE_SIZE = 60;
  const STORY_FIGURE_PAGE_SIZE = 24;
  const REGIONS = ["JP", "NA", "CN", "KR", "TW"];
  const EXPRESSION_TILE_SIZE = 256;
  const EXPRESSION_BASE_ROWS = 3;
  const STORY_PROJECT_STORAGE_KEY = "atlas-asset-index:story-project:v1";
  const STORY_PROJECT_ACTIVE_KEY = "atlas-asset-index:active-project:v1";
  const STORY_ASSET_DATABASE_NAME = "atlas-story-assets";
  const STORY_ASSET_STORE_NAME = "generated-images";
  const STORY_PROJECT_STORE_NAME = "story-projects";
  const STORY_DATABASE_VERSION = 2;
  const STORY_PROJECT_AUTOSAVE_DELAY = 350;
  const STORY_VARIANT_CACHE_VERSION = 2;
  const STORY_BGM_PAGE_SIZE = 80;
  const STORY_ACTOR_ENTRY_DURATION = 0.7;
  // Exporting is an offline batch job. Prefer the encoder's low-latency path
  // and let the platform use hardware when it has a suitable implementation.
  // Both values are accepted by WebCodecs and are probed before encoding.
  const STORY_EXPORT_LATENCY_MODE = "realtime";
  const STORY_EXPORT_HARDWARE_ACCELERATION = "prefer-hardware";
  const STORY_EXPORT_YIELD_INTERVAL = 60;
  const STORY_EXPORT_KEYFRAME_INTERVAL = 5;
  const STORY_TYPEWRITER_CHARACTERS_PER_SECOND = 20;
  const STORY_DIALOGUE_FONT_SCALE_SETTING = "story-dialogue-font-scale-v1";
  const STORY_DIALOGUE_FONT_SCALE_DEFAULT = 1;
  const STORY_DIALOGUE_FONT_SCALE_MIN = 0.8;
  const STORY_DIALOGUE_FONT_SCALE_MAX = 1.4;
  const STORY_DIALOGUE_RANGE_FONT_SCALE_DEFAULT = 1;
  const STORY_DIALOGUE_RANGE_FONT_SCALE_MIN = 0.6;
  const STORY_DIALOGUE_RANGE_FONT_SCALE_MAX = 1.8;

  const DIALOGUE_ASSET_SOURCES = [
    { key: "charaFigure", label: "常规立绘" },
    { key: "charaFigureForm", label: "Form 形态" },
    { key: "charaFigureMulti", label: "多人立绘" },
    { key: "charaFigureMultiCombine", label: "组合立绘" },
    { key: "charaFigureMultiLimitUp", label: "突破立绘" }
  ];

  const LIBRARIES = {
    equip: {
      label: "礼装",
      exportFile: "basic_equip.json",
      detailEndpoint: "equip",
      subtypeField: "flag",
      subtypeLabel: "礼装类型",
      assetTypes: [
        { key: "charaGraph", label: "礼装原图" },
        { key: "equipFace", label: "礼装卡面" },
        { key: "faces", label: "缩略图" }
      ]
    },
    servant: {
      label: "从者",
      exportFile: "basic_servant.json",
      detailEndpoint: "servant",
      subtypeField: "className",
      subtypeLabel: "职阶",
      assetTypes: [
        { key: "charaGraph", label: "卡面立绘" },
        { key: "dialogueExpressions", label: "表情差分", kind: "expressions" },
        { key: "figureVariants", label: "立绘差分", kind: "figures" },
        { key: "dialogueSheets", label: "对话图集", kind: "dialogueSheets" },
        { key: "image", label: "剧情插图", kind: "storyImages" },
        { key: "narrowFigure", label: "窄版立绘" },
        { key: "faces", label: "头像" }
      ]
    },
    backgrounds: {
      label: "剧情背景",
      exportFile: "asset_storage.json",
      kind: "backgrounds",
      staticAsset: true,
      previewAssetKey: "background",
      subtypeField: "backgroundType",
      subtypeLabel: "背景分类",
      assetTypes: [
        { key: "background", label: "背景原图" }
      ]
    },
    storyFigures: {
      label: "剧情立绘",
      exportFile: "asset_storage.json",
      kind: "storyFigures",
      staticAsset: true,
      previewAssetKey: "storyFigure",
      subtypeField: "figureType",
      subtypeLabel: "立绘分类",
      assetTypes: [
        { key: "dialogueSheets", label: "对话图集", kind: "dialogueSheets" },
        { key: "dialogueExpressions", label: "表情差分", kind: "expressions" },
        { key: "figureVariants", label: "立绘差分", kind: "figures" }
      ]
    },
    bgm: {
      label: "BGM 音频",
      exportFile: "nice_bgm.json",
      kind: "bgm",
      staticAsset: true,
      subtypeField: "availability",
      subtypeLabel: "曲目状态",
      assetTypes: []
    }
  };

  const EQUIP_TYPE_LABELS = {
    normal: "普通礼装",
    svtEquipCampaign: "纪念礼装",
    svtEquipEvent: "活动礼装",
    svtEquipChocolate: "情人节礼装",
    svtEquipFriendShip: "羁绊礼装",
    svtEquipEventReward: "活动奖励",
    svtEquipManaExchange: "商店兑换",
    svtEquipExp: "经验礼装",
    unknown: "其他"
  };

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

  const BACKGROUND_TYPE_LABELS = {
    standard: "标准背景",
    fullScreen: "全屏背景",
    variant: "背景变体"
  };

  const STORY_FIGURE_TYPE_LABELS = {
    standard: "常规立绘",
    form: "特殊形态"
  };

  const ASSET_GROUP_LABELS = {
    ascension: "灵基阶段",
    costume: "灵衣",
    equip: "礼装",
    story: "剧情",
    transformGroup: "变身组",
    imagePartsGroup: "部件组",
    unknown: "其他"
  };

  const dom = {
    sourceIntro: document.getElementById("sourceIntro"),
    enterAppButton: document.getElementById("enterAppButton"),
    enterStoryAppButton: document.getElementById("enterStoryAppButton"),
    introMoreButton: document.getElementById("introMoreButton"),
    homeButton: document.getElementById("homeButton"),
    gallery: document.getElementById("galleryGrid"),
    loadSentinel: document.getElementById("loadSentinel"),
    statePanel: document.getElementById("statePanel"),
    stateMark: document.getElementById("stateMark"),
    stateTitle: document.getElementById("stateTitle"),
    stateMessage: document.getElementById("stateMessage"),
    stateAction: document.getElementById("stateAction"),
    searchInput: document.getElementById("searchInput"),
    clearSearchButton: document.getElementById("clearSearchButton"),
    raritySelect: document.getElementById("raritySelect"),
    subtypeSelect: document.getElementById("subtypeSelect"),
    subtypeLabel: document.getElementById("subtypeLabel"),
    sortSelect: document.getElementById("sortSelect"),
    newOnlyInput: document.getElementById("newOnlyInput"),
    newToggleLabel: document.getElementById("newToggleLabel"),
    newCount: document.getElementById("newCount"),
    resultCount: document.getElementById("resultCount"),
    resultLabel: document.getElementById("resultLabel"),
    sourceStatusText: document.getElementById("sourceStatusText"),
    statusDot: document.getElementById("statusDot"),
    versionTime: document.getElementById("versionTime"),
    versionHash: document.getElementById("versionHash"),
    refreshButton: document.getElementById("refreshButton"),
    storyGeneratorPanel: document.getElementById("storyGeneratorPanel"),
    storyGeneratorBackButton: document.getElementById("storyGeneratorBackButton"),
    introSupportButton: document.getElementById("introSupportButton"),
    supportPanel: document.getElementById("supportPanel"),
    supportBackHomeButton: document.getElementById("supportBackHomeButton"),
    morePanel: document.getElementById("morePanel"),
    moreBackHomeButton: document.getElementById("moreBackHomeButton"),
    storyExportButton: document.getElementById("storyExportButton"),
    storyVideoExportButton: document.getElementById("storyVideoExportButton"),
    storyExportStatus: document.getElementById("storyExportStatus"),
    storyExportStatusText: document.getElementById("storyExportStatusText"),
    storyExportProgress: document.getElementById("storyExportProgress"),
    storyProjectName: document.getElementById("storyProjectName"),
    storyProjectLibraryButton: document.getElementById("storyProjectLibraryButton"),
    storyNewProjectButton: document.getElementById("storyNewProjectButton"),
    storyBackupButton: document.getElementById("storyBackupButton"),
    storyImportButton: document.getElementById("storyImportButton"),
    storyImportInput: document.getElementById("storyImportInput"),
    storyProjectSaveStatus: document.getElementById("storyProjectSaveStatus"),
    storyProjectLibrary: document.getElementById("storyProjectLibrary"),
    storyProjectLibraryBackdrop: document.getElementById("storyProjectLibraryBackdrop"),
    storyProjectLibraryCloseButton: document.getElementById("storyProjectLibraryCloseButton"),
    storyProjectLibraryStatus: document.getElementById("storyProjectLibraryStatus"),
    storyProjectLibraryList: document.getElementById("storyProjectLibraryList"),
    storyProjectLibraryTabBar: document.getElementById("storyProjectLibraryTabBar"),
    storyAspectSelect: document.getElementById("storyAspectSelect"),
    storyFontSelect: document.getElementById("storyFontSelect"),
    storyDialogueFontSizeInput: document.getElementById("storyDialogueFontSizeInput"),
    storyDialogueFontSizeValue: document.getElementById("storyDialogueFontSizeValue"),
    storyAddSceneButton: document.getElementById("storyAddSceneButton"),
    storySceneCount: document.getElementById("storySceneCount"),
    storySceneList: document.getElementById("storySceneList"),
    storySidebarTabs: document.getElementById("storySidebarTabs"),
    storySidebarDialogueCount: document.getElementById("storySidebarDialogueCount"),
    storyActiveSceneLabel: document.getElementById("storyActiveSceneLabel"),
    storyPlayButton: document.getElementById("storyPlayButton"),
    storyDuplicateSceneButton: document.getElementById("storyDuplicateSceneButton"),
    storyDeleteSceneButton: document.getElementById("storyDeleteSceneButton"),
    storyCanvas: document.getElementById("storyCanvas"),
    storyPreviewEmpty: document.getElementById("storyPreviewEmpty"),
    storyToolTabs: document.getElementById("storyToolTabs"),
    storyActorToolCount: document.getElementById("storyActorToolCount"),
    storyDialogueToolCount: document.getElementById("storyDialogueToolCount"),
    storyAnimationToolCount: document.getElementById("storyAnimationToolCount"),
    storyChooseBackgroundButton: document.getElementById("storyChooseBackgroundButton"),
    storyChooseActorButton: document.getElementById("storyChooseActorButton"),
    storyResourceHint: document.getElementById("storyResourceHint"),
    storyResourceSummary: document.getElementById("storyResourceSummary"),
    storySpeakerActorSelect: document.getElementById("storySpeakerActorSelect"),
    storyActorSummary: document.getElementById("storyActorSummary"),
    storyActorOptionsPanel: document.getElementById("storyActorOptionsPanel"),
    storyActorOptionsList: document.getElementById("storyActorOptionsList"),
    storyActorOptionsSelect: document.getElementById("storyActorOptionsSelect"),
    storyActorOptionsSummary: document.getElementById("storyActorOptionsSummary"),
    storyActorTransformPanel: document.getElementById("storyActorTransformPanel"),
    storyActorTransformName: document.getElementById("storyActorTransformName"),
    storyActorNameInput: document.getElementById("storyActorNameInput"),
    storyActorScaleInput: document.getElementById("storyActorScaleInput"),
    storyActorScaleValue: document.getElementById("storyActorScaleValue"),
    storyActorOffsetXInput: document.getElementById("storyActorOffsetXInput"),
    storyActorOffsetXValue: document.getElementById("storyActorOffsetXValue"),
    storyActorOffsetYInput: document.getElementById("storyActorOffsetYInput"),
    storyActorOffsetYValue: document.getElementById("storyActorOffsetYValue"),
    storyActorTransformResetButton: document.getElementById("storyActorTransformResetButton"),
    storyActorRemoveSelectedButton: document.getElementById("storyActorRemoveSelectedButton"),
    storyActorUniformPanel: document.getElementById("storyActorUniformPanel"),
    storyActorUniformSummary: document.getElementById("storyActorUniformSummary"),
    storyActorUniformScaleInput: document.getElementById("storyActorUniformScaleInput"),
    storyActorUniformScaleValue: document.getElementById("storyActorUniformScaleValue"),
    storyActorUniformOffsetXInput: document.getElementById("storyActorUniformOffsetXInput"),
    storyActorUniformOffsetXValue: document.getElementById("storyActorUniformOffsetXValue"),
    storyActorUniformOffsetYInput: document.getElementById("storyActorUniformOffsetYInput"),
    storyActorUniformOffsetYValue: document.getElementById("storyActorUniformOffsetYValue"),
    storyActorUniformResetButton: document.getElementById("storyActorUniformResetButton"),
    storyAnimationActorSelect: document.getElementById("storyAnimationActorSelect"),
    storyAnimationActorList: document.getElementById("storyAnimationActorList"),
    storyAnimationSummary: document.getElementById("storyAnimationSummary"),
    storyActorAnimationPanel: document.getElementById("storyActorAnimationPanel"),
    storyActorAnimationName: document.getElementById("storyActorAnimationName"),
    storyActorEntryAnimationSelect: document.getElementById("storyActorEntryAnimationSelect"),
    storyPreviewActorAnimationButton: document.getElementById("storyPreviewActorAnimationButton"),
    storyDialogueList: document.getElementById("storyDialogueList"),
    storyDialogueSummary: document.getElementById("storyDialogueSummary"),
    storyAddDialogueButton: document.getElementById("storyAddDialogueButton"),
    storyDialogueVariantsPanel: document.getElementById("storyDialogueVariantsPanel"),
    storyDialogueVariantsSummary: document.getElementById("storyDialogueVariantsSummary"),
    storyDialogueVariantList: document.getElementById("storyDialogueVariantList"),
    storySpeakerInput: document.getElementById("storySpeakerInput"),
    storyDurationInput: document.getElementById("storyDurationInput"),
    storyDialogueInput: document.getElementById("storyDialogueInput"),
    storyDialogueStyleEditor: document.getElementById("storyDialogueStyleEditor"),
    storyDialogueStyleSelectionValue: document.getElementById("storyDialogueStyleSelectionValue"),
    storyDialogueStyleTabs: document.getElementById("storyDialogueStyleTabs"),
    storyDialogueStyleTrack: document.getElementById("storyDialogueStyleTrack"),
    storyDialogueColorSelectionValue: document.getElementById("storyDialogueColorSelectionValue"),
    storyDialogueColorInput: document.getElementById("storyDialogueColorInput"),
    storyDialogueColorApplyButton: document.getElementById("storyDialogueColorApplyButton"),
    storyDialogueColorClearSelectionButton: document.getElementById("storyDialogueColorClearSelectionButton"),
    storyDialogueColorResetButton: document.getElementById("storyDialogueColorResetButton"),
    storyDialogueColorRangeList: document.getElementById("storyDialogueColorRangeList"),
    storyDialogueFontSizeSelectionValue: document.getElementById("storyDialogueFontSizeSelectionValue"),
    storyDialogueRangeFontSizeInput: document.getElementById("storyDialogueRangeFontSizeInput"),
    storyDialogueRangeFontSizeValue: document.getElementById("storyDialogueRangeFontSizeValue"),
    storyDialogueFontSizeApplyButton: document.getElementById("storyDialogueFontSizeApplyButton"),
    storyDialogueFontSizeClearSelectionButton: document.getElementById("storyDialogueFontSizeClearSelectionButton"),
    storyDialogueFontSizeResetButton: document.getElementById("storyDialogueFontSizeResetButton"),
    storyDialogueFontSizeRangeList: document.getElementById("storyDialogueFontSizeRangeList"),
    storyDialogueRubySelectionValue: document.getElementById("storyDialogueRubySelectionValue"),
    storyDialogueRubyInput: document.getElementById("storyDialogueRubyInput"),
    storyDialogueRubyApplyButton: document.getElementById("storyDialogueRubyApplyButton"),
    storyDialogueRubyClearSelectionButton: document.getElementById("storyDialogueRubyClearSelectionButton"),
    storyDialogueRubyResetButton: document.getElementById("storyDialogueRubyResetButton"),
    storyDialogueRubyList: document.getElementById("storyDialogueRubyList"),
    storyBgmStatus: document.getElementById("storyBgmStatus"),
    storyBgmFileInput: document.getElementById("storyBgmFileInput"),
    storyChooseBgmButton: document.getElementById("storyChooseBgmButton"),
    storyClearBgmButton: document.getElementById("storyClearBgmButton"),
    storyBgmPicker: document.getElementById("storyBgmPicker"),
    storyBgmPickerBackdrop: document.getElementById("storyBgmPickerBackdrop"),
    storyBgmPickerCloseButton: document.getElementById("storyBgmPickerCloseButton"),
    storyBgmSearchInput: document.getElementById("storyBgmSearchInput"),
    storyBgmPickerRegion: document.getElementById("storyBgmPickerRegion"),
    storyBgmPickerStatus: document.getElementById("storyBgmPickerStatus"),
    storyBgmList: document.getElementById("storyBgmList"),
    storyBgmPreviewAudio: document.getElementById("storyBgmPreviewAudio"),
    storyBgmPreviewLabel: document.getElementById("storyBgmPreviewLabel"),
    storyCharacterPicker: document.getElementById("storyCharacterPicker"),
    storyCharacterPickerTitle: document.getElementById("storyCharacterPickerTitle"),
    storyPickerBackdrop: document.getElementById("storyPickerBackdrop"),
    storyPickerCloseButton: document.getElementById("storyPickerCloseButton"),
    storyPickerDescription: document.getElementById("storyPickerDescription"),
    storyPickerServantTab: document.getElementById("storyPickerServantTab"),
    storyPickerFigureTab: document.getElementById("storyPickerFigureTab"),
    storyPickerBackgroundTab: document.getElementById("storyPickerBackgroundTab"),
    storyPickerSearchInput: document.getElementById("storyPickerSearchInput"),
    storyPickerImportButton: document.getElementById("storyPickerImportButton"),
    storyPickerImportInput: document.getElementById("storyPickerImportInput"),
    storyPickerFilters: document.getElementById("storyPickerFilters"),
    storyPickerClassSelect: document.getElementById("storyPickerClassSelect"),
    storyPickerRaritySelect: document.getElementById("storyPickerRaritySelect"),
    storyPickerStatus: document.getElementById("storyPickerStatus"),
    storyPickerProgress: document.getElementById("storyPickerProgress"),
    storyPickerProgressTitle: document.getElementById("storyPickerProgressTitle"),
    storyPickerProgressCount: document.getElementById("storyPickerProgressCount"),
    storyPickerProgressBar: document.getElementById("storyPickerProgressBar"),
    storyPickerProgressPhase: document.getElementById("storyPickerProgressPhase"),
    storyPickerCharacterStep: document.getElementById("storyPickerCharacterStep"),
    storyPickerCharacterList: document.getElementById("storyPickerCharacterList"),
    storyPickerCharacterMore: document.getElementById("storyPickerCharacterMore"),
    storyPickerSourceStep: document.getElementById("storyPickerSourceStep"),
    storyPickerBackToCharactersButton: document.getElementById("storyPickerBackToCharactersButton"),
    storyPickerSelectedCharacter: document.getElementById("storyPickerSelectedCharacter"),
    storyPickerSourceList: document.getElementById("storyPickerSourceList"),
    storyPickerVariantStep: document.getElementById("storyPickerVariantStep"),
    storyPickerBackToSourcesButton: document.getElementById("storyPickerBackToSourcesButton"),
    storyPickerSelectedSource: document.getElementById("storyPickerSelectedSource"),
    storyPickerRefreshVariantsButton: document.getElementById("storyPickerRefreshVariantsButton"),
    storyPickerVariantList: document.getElementById("storyPickerVariantList"),
    mobileRegionSelect: document.getElementById("mobileRegionSelect"),
    mobileFilterButton: document.getElementById("mobileFilterButton"),
    advancedFilters: document.getElementById("advancedFilters"),
    filterCount: document.getElementById("filterCount"),
    equipCount: document.getElementById("equipCount"),
    servantCount: document.getElementById("servantCount"),
    backgroundCount: document.getElementById("backgroundCount"),
    storyFigureCount: document.getElementById("storyFigureCount"),
    bgmCount: document.getElementById("bgmCount"),
    modal: document.getElementById("assetModal"),
    modalPanel: document.querySelector(".modal-panel"),
    modalBody: document.querySelector(".modal-body"),
    modalEyebrow: document.getElementById("modalEyebrow"),
    modalTitle: document.getElementById("modalTitle"),
    assetTypeTabs: document.getElementById("assetTypeTabs"),
    previewStage: document.getElementById("previewStage"),
    previewImage: document.getElementById("previewImage"),
    previewLoading: document.getElementById("previewLoading"),
    previewError: document.getElementById("previewError"),
    assetPosition: document.getElementById("assetPosition"),
    assetGroupLabel: document.getElementById("assetGroupLabel"),
    assetThumbnails: document.getElementById("assetThumbnails"),
    expressionToolbar: document.getElementById("expressionToolbar"),
    expressionSummary: document.getElementById("expressionSummary"),
    expressionStatus: document.getElementById("expressionStatus"),
    expressionProgress: document.getElementById("expressionProgress"),
    extractExpressionsButton: document.getElementById("extractExpressionsButton"),
    linkedFigureButton: document.getElementById("linkedFigureButton"),
    inspectorFace: document.getElementById("inspectorFace"),
    inspectorMeta: document.getElementById("inspectorMeta"),
    inspectorName: document.getElementById("inspectorName"),
    inspectorOriginalName: document.getElementById("inspectorOriginalName"),
    factType: document.getElementById("factType"),
    factDimensions: document.getElementById("factDimensions"),
    factFilename: document.getElementById("factFilename"),
    factRegion: document.getElementById("factRegion"),
    expressionQuickButton: document.getElementById("expressionQuickButton"),
    figureQuickButton: document.getElementById("figureQuickButton"),
    currentSheetExpressionButton: document.getElementById("currentSheetExpressionButton"),
    currentSheetFigureButton: document.getElementById("currentSheetFigureButton"),
    downloadAllExpressionsButton: document.getElementById("downloadAllExpressionsButton"),
    downloadButton: document.getElementById("downloadButton"),
    copyButton: document.getElementById("copyButton"),
    openOriginalLink: document.getElementById("openOriginalLink"),
    previousRecordButton: document.getElementById("previousRecordButton"),
    nextRecordButton: document.getElementById("nextRecordButton"),
    toast: document.getElementById("toast")
  };

  const state = {
    region: REGIONS.includes(readSetting("region", "JP")) ? readSetting("region", "JP") : "JP",
    library: Object.prototype.hasOwnProperty.call(LIBRARIES, readSetting("library", "equip"))
      ? readSetting("library", "equip")
      : "equip",
    items: [],
    filtered: [],
    visibleCount: PAGE_SIZE,
    newIds: new Set(),
    loading: false,
    density: "comfortable",
    dataInfo: null,
    lastModified: null,
    loadController: null,
    detailController: null,
    detailCache: new Map(),
    modalItem: null,
    modalAssets: new Map(),
    modalAssetType: null,
    modalAssetIndex: 0,
    extractionController: null,
    lastFocusedElement: null,
    story: createStoryState()
  };

  const countFormatter = new Intl.NumberFormat("zh-CN");
  const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  let toastTimer = null;
  let searchTimer = null;
  let viewportUpdateFrame = null;
  let introTransitionTimer = null;
  let storyCharacterBrowser = null;
  let storyPickerSourceImageLoader = null;
  let storyPickerVariantImageLoader = null;
  let storyProjectAutosaveTimer = null;
  let pendingStoryProjectSave = null;
  let storyProjectWriteQueue = Promise.resolve();
  let activeStoryDialogueStyleTab = "color";

  function updateViewportMetrics() {
    const viewport = window.visualViewport;
    const height = Math.round(viewport ? viewport.height : window.innerHeight);
    const offsetTop = Math.round(viewport ? viewport.offsetTop : 0);
    document.documentElement.style.setProperty("--app-viewport-height", `${height}px`);
    document.documentElement.style.setProperty("--app-viewport-top", `${offsetTop}px`);

    if (!dom.modal.hidden) {
      resetModalScroll();
    }
  }

  function scheduleViewportUpdate() {
    if (viewportUpdateFrame !== null) {
      cancelAnimationFrame(viewportUpdateFrame);
    }
    viewportUpdateFrame = requestAnimationFrame(() => {
      viewportUpdateFrame = null;
      updateViewportMetrics();
    });
  }

  function resetModalScroll() {
    dom.modalBody.scrollTop = 0;
    const inspector = dom.modalPanel.querySelector(".asset-inspector");
    if (inspector) {
      inspector.scrollTop = 0;
    }
  }

  function readSetting(key, fallback) {
    try {
      const value = localStorage.getItem(`atlas-asset-index:setting:${key}`);
      return value || fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function saveSetting(key, value) {
    try {
      localStorage.setItem(`atlas-asset-index:setting:${key}`, value);
    } catch (_error) {
      // The current session remains usable when storage is disabled.
    }
  }

  function setStatus(kind, text) {
    dom.statusDot.classList.toggle("is-loading", kind === "loading");
    dom.statusDot.classList.toggle("is-error", kind === "error");
    dom.sourceStatusText.textContent = text;
  }

  function showSkeletons() {
    dom.gallery.replaceChildren();
    const fragment = document.createDocumentFragment();
    const skeletonCount = window.innerWidth < 720 ? 12 : 18;

    for (let index = 0; index < skeletonCount; index += 1) {
      const card = document.createElement("div");
      card.className = "skeleton-card";
      const image = document.createElement("div");
      image.className = "skeleton-image";
      const copy = document.createElement("div");
      copy.className = "skeleton-copy";
      copy.innerHTML = '<div class="skeleton-line"></div><div class="skeleton-line"></div>';
      card.append(image, copy);
      fragment.append(card);
    }

    dom.gallery.append(fragment);
    dom.statePanel.hidden = true;
    dom.loadSentinel.hidden = true;
  }

  function showState(title, message, actionText) {
    dom.gallery.replaceChildren();
    dom.stateTitle.textContent = title;
    dom.stateMessage.textContent = message;
    dom.stateAction.hidden = !actionText;
    dom.stateAction.textContent = actionText || "";
    dom.statePanel.hidden = false;
    dom.loadSentinel.hidden = true;
  }

  function getSnapshotKey() {
    return `atlas-asset-index:v1:${state.region}:${state.library}`;
  }

  function readSnapshot() {
    try {
      const raw = localStorage.getItem(getSnapshotKey());
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function saveSnapshot(items, info) {
    try {
      localStorage.setItem(getSnapshotKey(), JSON.stringify({
        ids: items.map((item) => item.id),
        hash: info && info.hash ? info.hash : null,
        savedAt: Date.now()
      }));
    } catch (_error) {
      // Browsing still works when storage is disabled.
    }
  }

  function calculateNewIds(items, snapshot) {
    if (!snapshot || !Array.isArray(snapshot.ids)) {
      return new Set();
    }

    const previousIds = new Set(snapshot.ids);
    return new Set(items.filter((item) => !previousIds.has(item.id)).map((item) => item.id));
  }

  function getPageSize() {
    return state.library === "storyFigures" ? STORY_FIGURE_PAGE_SIZE : PAGE_SIZE;
  }

  async function loadLibrary(options) {
    const force = Boolean(options && options.force);
    if (state.loadController) {
      state.loadController.abort();
    }

    const controller = new AbortController();
    state.loadController = controller;
    state.loading = true;
    dom.refreshButton.disabled = true;
    dom.refreshButton.classList.add("is-spinning");
    setStatus("loading", `正在读取 ${state.region} ${LIBRARIES[state.library].label}数据`);
    showSkeletons();
    updateActiveControls();

    const currentRegion = state.region;
    const currentLibrary = state.library;
    const config = LIBRARIES[currentLibrary];
    const exportUrl = `${API_BASE}/export/${currentRegion}/${config.exportFile}`;

    try {
      const infoPromise = fetch(`${API_BASE}/info`, {
        signal: controller.signal,
        cache: force ? "reload" : "default"
      }).then((response) => response.ok ? response.json() : null).catch(() => null);

      const response = await fetch(exportUrl, {
        signal: controller.signal,
        cache: force ? "reload" : "default"
      });

      if (!response.ok) {
        throw new Error(`Atlas API 返回 ${response.status}`);
      }

      const lastModified = response.headers.get("Last-Modified");
      const items = await response.json();
      const allInfo = await infoPromise;

      if (currentRegion !== state.region || currentLibrary !== state.library) {
        return;
      }

      if (!Array.isArray(items)) {
        throw new Error("数据格式不正确");
      }

      const snapshot = readSnapshot();
      state.items = normalizeLibraryItems(items, config, currentRegion);
      state.newIds = calculateNewIds(state.items, snapshot);
      state.dataInfo = allInfo && allInfo[currentRegion] ? allInfo[currentRegion] : null;
      state.lastModified = lastModified;
      state.visibleCount = getPageSize();
      state.loading = false;

      saveSnapshot(state.items, state.dataInfo);
      populateFilters();
      updateLibraryCount(currentLibrary, state.items.length);
      updateVersionMeta();
      applyFilters();
      setStatus("ready", `${currentRegion} 数据已同步`);
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }

      state.items = [];
      state.filtered = [];
      state.loading = false;
      setStatus("error", "连接 Atlas Academy 失败");
      showState("无法载入资源", error.message || "请检查网络连接后重试。", "重新载入");
      dom.resultCount.textContent = "0";
      updateVersionMeta();
    } finally {
      if (state.loadController === controller) {
        state.loadController = null;
        dom.refreshButton.disabled = false;
        dom.refreshButton.classList.remove("is-spinning");
      }
    }
  }

  function updateLibraryCount(library, count) {
    const targets = {
      equip: dom.equipCount,
      servant: dom.servantCount,
      backgrounds: dom.backgroundCount,
      storyFigures: dom.storyFigureCount,
      bgm: dom.bgmCount
    };
    if (targets[library]) {
      targets[library].textContent = countFormatter.format(count);
    }
  }

  function normalizeLibraryItems(items, config, region) {
    if (config.kind === "bgm") {
      return items
        .filter((item) => item && (item.audioAsset || item.url || item.audioUrl || item.fileName))
        .map((item) => {
          const audioAsset = normalizeBgmAudioUrl(
            item.audioAsset || item.url || item.audioUrl,
            region
          );
          const fileName = String(item.fileName || getFilename(audioAsset) || `BGM_${item.id || "track"}`);
          const name = String(item.name || item.originalName || fileName).trim();
          const notReleased = Boolean(item.notReleased);
          return {
            id: String(item.id == null ? fileName : item.id),
            name,
            originalName: String(item.originalName || name),
            fileName,
            audioAsset,
            audioUrl: audioAsset,
            collectionNo: Number(item.id) || extractAssetNumber(fileName),
            rarity: 0,
            priority: Number(item.priority) || 0,
            notReleased,
            availability: notReleased ? "unreleased" : "released",
            availabilityLabel: notReleased ? "未公开曲目" : "已公开曲目",
            searchText: `${name} ${item.originalName || ""} ${fileName} ${item.id || ""}`.toLocaleLowerCase()
          };
        });
    }

    if (config.kind === "storyFigures") {
      return items
        .filter((item) => item && item.fileName && item.path && (
          item.folder === "CharaFigure" || /^CharaFigure\/Form\/\d+$/.test(item.folder)
        ))
        .map((item) => {
          const fileName = String(item.fileName);
          const formMatch = String(item.folder).match(/^CharaFigure\/Form\/(\d+)$/);
          const figureType = formMatch ? "form" : "standard";
          const formIndex = formMatch ? Number(formMatch[1]) : null;
          return {
            id: String(item.path),
            name: formIndex
              ? `人物立绘 ${fileName} · Form ${formIndex}`
              : `人物立绘 ${fileName}`,
            originalName: `${fileName}_merged.png`,
            fileName,
            path: item.path,
            face: `${STATIC_ASSET_BASE}/${region}/${item.path}/${fileName}_merged.png`,
            collectionNo: extractAssetNumber(fileName),
            rarity: 0,
            figureType,
            figureTypeLabel: STORY_FIGURE_TYPE_LABELS[figureType],
            formIndex,
            required: item.required,
            size: item.size,
            crc32: item.crc32
          };
        });
    }

    if (config.kind !== "backgrounds") {
      return items.filter((item) => item && item.id && item.face);
    }

    return items
      .filter((item) => item && item.folder === "Back" && item.fileName)
      .map((item) => {
        const fileName = String(item.fileName);
        const backgroundType = fileName.endsWith("_1344_626")
          ? "fullScreen"
          : /^back\d+$/.test(fileName) ? "standard" : "variant";
        const path = item.path || `Back/${fileName}`;
        return {
          id: fileName,
          name: fileName.replace(/^back/, "背景 "),
          originalName: fileName,
          face: `${STATIC_ASSET_BASE}/${region}/${path}.png`,
          collectionNo: extractAssetNumber(fileName),
          rarity: 0,
          backgroundType,
          backgroundTypeLabel: BACKGROUND_TYPE_LABELS[backgroundType],
          required: item.required,
          size: item.size,
          crc32: item.crc32
        };
      });
  }

  function normalizeBgmAudioUrl(value, region) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }
    if (raw.startsWith("//")) {
      return `https:${raw}`;
    }
    return `${STATIC_ASSET_BASE}/${region}/${raw.replace(/^\/+/, "")}`;
  }

  function extractAssetNumber(fileName) {
    const match = String(fileName).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function updateVersionMeta() {
    let timestamp = null;
    if (state.dataInfo && state.dataInfo.timestamp) {
      timestamp = new Date(state.dataInfo.timestamp * 1000);
    } else if (state.lastModified) {
      timestamp = new Date(state.lastModified);
    }

    dom.versionTime.textContent = timestamp && !Number.isNaN(timestamp.getTime())
      ? `更新时间 ${dateFormatter.format(timestamp)}`
      : "更新时间 --";
    dom.versionHash.textContent = state.dataInfo && state.dataInfo.hash
      ? `版本 ${state.dataInfo.hash}`
      : "版本 --";
  }

  function updateActiveControls() {
    document.querySelectorAll(".region-button").forEach((button) => {
      const active = button.dataset.region === state.region;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll(".library-tab").forEach((button) => {
      const active = button.dataset.library === state.library;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    document.querySelectorAll(".density-button").forEach((button) => {
      const active = button.dataset.density === state.density;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    dom.gallery.classList.toggle("is-compact", state.density === "compact");
    const config = LIBRARIES[state.library];
    dom.gallery.classList.toggle("is-background-library", config.kind === "backgrounds");
    dom.gallery.classList.toggle("is-story-figure-library", config.kind === "storyFigures");
    dom.gallery.classList.toggle("is-bgm-library", config.kind === "bgm");
    dom.subtypeLabel.textContent = config.subtypeLabel;
    dom.raritySelect.closest(".select-control").hidden = Boolean(config.staticAsset);
    dom.sortSelect.querySelector('option[value="rarity"]').hidden = Boolean(config.staticAsset);
    dom.mobileRegionSelect.value = state.region;
  }

  function populateFilters() {
    const previousRarity = dom.raritySelect.value;
    const rarities = [...new Set(state.items.map((item) => item.rarity).filter(Number.isFinite))]
      .sort((a, b) => b - a);
    dom.raritySelect.replaceChildren(new Option("全部星级", "all"));
    rarities.forEach((rarity) => {
      dom.raritySelect.add(new Option(`${rarity} 星`, String(rarity)));
    });
    dom.raritySelect.value = rarities.includes(Number(previousRarity)) ? previousRarity : "all";

    const previousSubtype = dom.subtypeSelect.value;
    const config = LIBRARIES[state.library];
    const subtypeCounts = new Map();
    state.items.forEach((item) => {
      const subtype = item[config.subtypeField] || "unknown";
      subtypeCounts.set(subtype, (subtypeCounts.get(subtype) || 0) + 1);
    });

    const entries = [...subtypeCounts.entries()].sort((a, b) => b[1] - a[1]);
    let allSubtypeLabel = state.library === "equip"
      ? "全部类型"
      : state.library === "servant" ? "全部职阶" : "全部分类";
    if (state.library === "bgm") {
      allSubtypeLabel = "All tracks";
    }
    dom.subtypeSelect.replaceChildren(new Option(allSubtypeLabel, "all"));
    entries.forEach(([value, count]) => {
      const label = getSubtypeLabel(value);
      dom.subtypeSelect.add(new Option(`${label} (${countFormatter.format(count)})`, value));
    });
    dom.subtypeSelect.value = subtypeCounts.has(previousSubtype) ? previousSubtype : "all";

    dom.newCount.textContent = countFormatter.format(state.newIds.size);
    dom.newOnlyInput.disabled = state.newIds.size === 0;
    dom.newToggleLabel.classList.toggle("is-disabled", state.newIds.size === 0);
    if (state.newIds.size === 0) {
      dom.newOnlyInput.checked = false;
    }
    updateFilterIndicator();
  }

  function updateFilterIndicator() {
    const activeCount = [
      Boolean(dom.searchInput.value),
      dom.raritySelect.value !== "all",
      dom.subtypeSelect.value !== "all",
      dom.sortSelect.value !== "newest",
      dom.newOnlyInput.checked
    ].filter(Boolean).length;
    dom.filterCount.textContent = String(activeCount);
  }

  function getSubtypeLabel(value) {
    if (state.library === "equip") {
      return EQUIP_TYPE_LABELS[value] || value;
    }
    if (state.library === "backgrounds") {
      return BACKGROUND_TYPE_LABELS[value] || value;
    }
    if (state.library === "storyFigures") {
      return STORY_FIGURE_TYPE_LABELS[value] || value;
    }
    if (state.library === "bgm") {
      return value === "released" ? "\u5df2\u516c\u5f00\u66f2\u76ee" : value === "unreleased" ? "\u672a\u516c\u5f00\u66f2\u76ee" : value;
    }
    return CLASS_LABELS[value] || value;
  }

  function normalizedText(value) {
    return String(value || "").trim().toLocaleLowerCase();
  }

  function formatFileSize(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) {
      return "原始资源";
    }
    if (value < 1024 * 1024) {
      return `${Math.round(value / 1024)} KB`;
    }
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  function applyFilters() {
    const query = normalizedText(dom.searchInput.value);
    const rarity = dom.raritySelect.value;
    const subtype = dom.subtypeSelect.value;
    const config = LIBRARIES[state.library];

    state.filtered = state.items.filter((item) => {
      if (rarity !== "all" && String(item.rarity) !== rarity) {
        return false;
      }
      if (subtype !== "all" && String(item[config.subtypeField] || "unknown") !== subtype) {
        return false;
      }
      if (dom.newOnlyInput.checked && !state.newIds.has(item.id)) {
        return false;
      }
      if (!query) {
        return true;
      }

      const haystack = [
        item.name,
        item.originalName,
        item.id,
        item.collectionNo,
        item.className,
        item.flag,
        item.path,
        item.figureTypeLabel,
        item.formIndex,
        item.audioAsset
      ].map(normalizedText).join(" ");
      return haystack.includes(query);
    });

    const sort = dom.sortSelect.value;
    state.filtered.sort((a, b) => {
      if (sort === "oldest") {
        return (a.collectionNo || 0) - (b.collectionNo || 0) || a.id - b.id;
      }
      if (sort === "rarity") {
        return (b.rarity || 0) - (a.rarity || 0) || (b.collectionNo || 0) - (a.collectionNo || 0);
      }
      if (sort === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
      }
      return (b.collectionNo || 0) - (a.collectionNo || 0) || b.id - a.id;
    });

    state.visibleCount = getPageSize();
    renderGallery();
    updateFilterIndicator();
  }

  function renderGallery() {
    dom.statePanel.hidden = true;
    dom.gallery.replaceChildren();
    dom.resultCount.textContent = countFormatter.format(state.filtered.length);
    dom.resultLabel.textContent = state.library === "equip"
      ? "张礼装"
      : state.library === "servant"
        ? "名从者"
        : state.library === "backgrounds" ? "张背景" : "张立绘";

    if (state.library === "bgm") {
      dom.resultLabel.textContent = "\u9996\u66f2\u76ee";
    }
    if (!state.filtered.length) {
      const hasFilters = Boolean(dom.searchInput.value) || dom.raritySelect.value !== "all" ||
        dom.subtypeSelect.value !== "all" || dom.newOnlyInput.checked;
      showState(
        hasFilters ? "没有匹配结果" : "暂无资源",
        hasFilters ? "调整搜索词或筛选条件后再试。" : "当前区域没有可显示的数据。",
        ""
      );
      return;
    }

    const fragment = document.createDocumentFragment();
    const visibleItems = state.filtered.slice(0, state.visibleCount);
    visibleItems.forEach((item, index) => fragment.append(createCard(item, index)));
    dom.gallery.append(fragment);
    dom.loadSentinel.hidden = state.visibleCount >= state.filtered.length;
  }

  function createCard(item, index) {
    if (state.library === "bgm") {
      return createBgmCard(item, index);
    }
    const card = document.createElement("button");
    card.className = "asset-card";
    card.type = "button";
    card.classList.toggle("is-background-card", state.library === "backgrounds");
    card.classList.toggle("is-story-figure-card", state.library === "storyFigures");
    card.setAttribute("aria-label", `查看 ${item.name || item.originalName || item.id} 的图片资源`);
    card.addEventListener("click", () => openModal(item));

    const imageFrame = document.createElement("div");
    imageFrame.className = "card-image-frame";
    const fallback = document.createElement("span");
    fallback.className = "image-fallback";
    fallback.textContent = "A";
    fallback.hidden = true;
    const image = document.createElement("img");
    image.alt = "";
    const isPriorityStoryFigure = state.library === "storyFigures" && index < 4;
    image.loading = isPriorityStoryFigure ? "eager" : "lazy";
    image.fetchPriority = isPriorityStoryFigure ? "high" : "low";
    image.decoding = "async";
    image.addEventListener("load", () => image.classList.add("is-loaded"));
    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    });
    image.src = item.face;
    imageFrame.append(fallback, image);

    const badges = document.createElement("div");
    badges.className = "card-badges";
    if (state.newIds.has(item.id)) {
      badges.append(createBadge("新增", "is-new"));
    } else if (dom.sortSelect.value === "newest" && index < 12) {
      badges.append(createBadge("最新", "is-latest"));
    }

    const copy = document.createElement("div");
    copy.className = "card-copy";
    const title = document.createElement("strong");
    title.className = "card-title";
    title.textContent = item.name || item.originalName || `ID ${item.id}`;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    const rarity = document.createElement("span");
    rarity.className = "card-rarity";
    rarity.textContent = state.library === "servant"
      ? `${"★".repeat(Math.max(0, Math.min(5, item.rarity || 0)))} ${getSubtypeLabel(item.className || "unknown")}`
      : state.library === "backgrounds"
        ? item.backgroundTypeLabel
        : state.library === "storyFigures"
          ? item.figureTypeLabel
          : "★".repeat(Math.max(0, Math.min(5, item.rarity || 0)));
    const number = document.createElement("span");
    number.textContent = state.library === "storyFigures"
      ? `ID ${item.fileName}`
      : `No.${item.collectionNo || "--"}`;
    meta.append(rarity, number);
    copy.append(title, meta);

    card.append(imageFrame, badges, copy);
    return card;
  }

  function createBgmCard(item, index) {
    const card = document.createElement("article");
    card.className = "asset-card is-bgm-card";
    const art = document.createElement("div");
    art.className = "bgm-card-art";
    art.textContent = "♪";
    const badges = document.createElement("div");
    badges.className = "card-badges";
    if (state.newIds.has(item.id)) badges.append(createBadge("新增", "is-new"));
    if (item.notReleased) badges.append(createBadge("未公开", "is-unreleased"));
    const copy = document.createElement("div");
    copy.className = "card-copy bgm-card-copy";
    const title = document.createElement("strong");
    title.className = "card-title";
    title.textContent = item.name || item.fileName || `BGM ${item.id}`;
    const meta = document.createElement("div");
    meta.className = "card-meta";
    const status = document.createElement("span");
    status.className = "card-rarity";
    status.textContent = item.availabilityLabel;
    const number = document.createElement("span");
    number.textContent = `ID ${item.id}`;
    meta.append(status, number);
    copy.append(title, meta);
    const audio = document.createElement("audio");
    audio.className = "bgm-card-audio";
    audio.controls = true;
    audio.preload = "none";
    audio.src = item.audioAsset;
    const actions = document.createElement("div");
    actions.className = "bgm-card-actions";
    const download = document.createElement("button");
    download.className = "secondary-button";
    download.type = "button";
    download.textContent = "下载 BGM";
    download.addEventListener("click", () => downloadBgm(item, download));
    const open = document.createElement("a");
    open.className = "secondary-button";
    open.href = item.audioAsset;
    open.target = "_blank";
    open.rel = "noreferrer";
    open.textContent = "打开音频";
    actions.append(download, open);
    card.append(art, badges, copy, audio, actions);
    return card;
  }

  async function downloadBgm(item, button) {
    if (!item || !item.audioAsset || button.disabled) return;
    const label = button.textContent;
    button.disabled = true;
    button.textContent = "准备中";
    try {
      const response = await fetch(item.audioAsset);
      if (!response.ok) throw new Error(`BGM 返回 ${response.status}`);
      const blob = await response.blob();
      const filename = sanitizeFilename(item.fileName || getFilename(item.audioAsset) || `BGM_${item.id}`);
      await saveBlob(blob, /\.[a-z0-9]{2,5}$/i.test(filename) ? filename : `${filename}.mp3`, "保存或分享 BGM");
      showToast(isNativeDirectFileSaverAvailable() ? "BGM 已保存到下载/如数迦贞" : isNativeApp() ? "BGM 已打开系统保存面板" : "BGM 已开始下载");
    } catch (_error) {
      window.open(item.audioAsset, "_blank", "noopener,noreferrer");
      showToast("无法直接读取音频，已打开原始音频链接");
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  }

  function createBadge(text, className) {
    const badge = document.createElement("span");
    badge.className = `card-badge ${className}`;
    badge.textContent = text;
    return badge;
  }

  function loadMore() {
    if (state.loading || state.visibleCount >= state.filtered.length) {
      return;
    }
    state.visibleCount = Math.min(state.visibleCount + getPageSize(), state.filtered.length);
    renderGallery();
  }

  async function openModal(item) {
    clearExtractionResources();
    state.lastFocusedElement = document.activeElement;
    state.modalItem = item;
    state.modalAssets = new Map();
    state.modalAssetType = null;
    state.modalAssetIndex = 0;
    dom.modal.hidden = false;
    updateViewportMetrics();
    resetModalScroll();
    document.body.classList.add("is-modal-open");
    renderModalIdentity(item);
    renderModalLoading();
    updateRecordNavigation();
    document.querySelector("[data-close-modal].close-button").focus();

    const config = LIBRARIES[state.library];
    if (config.staticAsset) {
      const staticAsset = state.library === "storyFigures"
        ? { [item.figureType]: { [item.fileName]: item.face } }
        : item.face;
      renderDetail({ extraAssets: { [config.previewAssetKey]: staticAsset } });
      return;
    }

    const cacheKey = `${state.region}:${state.library}:${item.id}`;
    if (state.detailCache.has(cacheKey)) {
      renderDetail(state.detailCache.get(cacheKey));
      return;
    }

    if (state.detailController) {
      state.detailController.abort();
    }
    const controller = new AbortController();
    state.detailController = controller;
    const endpoint = LIBRARIES[state.library].detailEndpoint;

    try {
      const response = await fetch(`${API_BASE}/nice/${state.region}/${endpoint}/${item.id}`, {
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`详情接口返回 ${response.status}`);
      }
      const detail = await response.json();
      state.detailCache.set(cacheKey, detail);
      if (state.modalItem && state.modalItem.id === item.id) {
        renderDetail(detail);
      }
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
      renderModalError(error.message || "无法读取图片详情");
    } finally {
      if (state.detailController === controller) {
        state.detailController = null;
      }
    }
  }

  function renderModalIdentity(item) {
    const libraryLabel = LIBRARIES[state.library].label;
    const recordLabel = state.library === "storyFigures"
      ? `ID ${item.fileName}`
      : `No.${item.collectionNo || "--"}`;
    dom.modalEyebrow.textContent = `${state.region} / ${libraryLabel} / ${recordLabel}`;
    dom.modalTitle.textContent = item.name || item.originalName || `ID ${item.id}`;
    dom.inspectorFace.hidden = state.library === "storyFigures";
    dom.inspectorFace.src = item.face;
    dom.inspectorFace.alt = "";
    dom.inspectorMeta.textContent = state.library === "equip"
      ? `${item.rarity || 0} 星 · ${getSubtypeLabel(item.flag || "unknown")}`
      : state.library === "backgrounds"
        ? `${item.backgroundTypeLabel} · ${formatFileSize(item.size)}`
        : state.library === "storyFigures"
          ? `${item.figureTypeLabel}${item.formIndex ? ` · Form ${item.formIndex}` : ""}`
          : `${item.rarity || 0} 星 · ${getSubtypeLabel(item.className || "unknown")}`;
    dom.inspectorName.textContent = item.name || item.originalName || `ID ${item.id}`;
    dom.inspectorOriginalName.textContent = item.originalName && item.originalName !== item.name ? item.originalName : `ID ${item.id}`;
    dom.factRegion.textContent = state.region;
  }

    function renderModalLoading() {
    dom.assetTypeTabs.replaceChildren();
    dom.assetThumbnails.replaceChildren();
    dom.expressionToolbar.hidden = true;
    dom.linkedFigureButton.hidden = true;
    dom.expressionQuickButton.hidden = true;
    dom.figureQuickButton.hidden = true;
    dom.currentSheetExpressionButton.hidden = true;
    dom.currentSheetFigureButton.hidden = true;
    dom.downloadAllExpressionsButton.hidden = true;
    dom.previewImage.removeAttribute("src");
    dom.previewImage.classList.remove("is-loaded");
    dom.previewLoading.hidden = false;
    dom.previewError.hidden = true;
    dom.assetPosition.textContent = "-- / --";
    dom.assetGroupLabel.textContent = "正在读取资源";
    dom.factType.textContent = "--";
    dom.factDimensions.textContent = "--";
    dom.factFilename.textContent = "--";
    setAssetActionsDisabled(true);
  }

  function renderModalError(message) {
    dom.expressionToolbar.hidden = true;
    dom.linkedFigureButton.hidden = true;
    dom.expressionQuickButton.hidden = true;
    dom.figureQuickButton.hidden = true;
    dom.currentSheetExpressionButton.hidden = true;
    dom.currentSheetFigureButton.hidden = true;
    dom.downloadAllExpressionsButton.hidden = true;
    dom.previewLoading.hidden = true;
    dom.previewImage.removeAttribute("src");
    dom.previewError.hidden = false;
    dom.previewError.textContent = message;
    dom.assetGroupLabel.textContent = "";
    setAssetActionsDisabled(true);
  }

  function renderDetail(detail) {
    const extraAssets = detail && detail.extraAssets ? detail.extraAssets : {};
    const config = LIBRARIES[state.library];
    const assetMap = new Map();
    const dialogueAssets = state.library === "servant"
      ? collectDialogueAssets(extraAssets)
      : state.library === "storyFigures" ? collectStoryFigureAssets(extraAssets) : [];

    config.assetTypes.forEach((type) => {
      const assets = type.kind === "dialogueSheets" ? dialogueAssets : flattenAssetUrls(extraAssets[type.key]);
      if ((type.kind === "expressions" || type.kind === "figures") && dialogueAssets.length) {
        assetMap.set(type.key, { ...type, assets: [], sourceAssets: dialogueAssets });
        return;
      }
      if (assets.length) {
        assetMap.set(type.key, { ...type, assets });
      }
    });

    state.modalAssets = assetMap;
    dom.assetTypeTabs.replaceChildren();

    if (!assetMap.size) {
      renderModalError("该条目没有可用图片资源");
      return;
    }

    assetMap.forEach((group, key) => {
      const button = document.createElement("button");
      button.className = "asset-type-tab";
      button.type = "button";
      button.role = "tab";
      button.dataset.assetType = key;
      button.textContent = `${group.label} ${group.assets.length}`;
      button.addEventListener("click", () => selectAssetType(key));
      dom.assetTypeTabs.append(button);
    });

    const expressionGroup = assetMap.get("dialogueExpressions");
    dom.expressionQuickButton.hidden = !expressionGroup;
    if (expressionGroup) {
      dom.expressionQuickButton.textContent = `一键获取表情差分 · ${expressionGroup.sourceAssets.length} 图集`;
    }
    dom.linkedFigureButton.hidden = !expressionGroup;
    if (expressionGroup) {
      dom.linkedFigureButton.textContent = "获取当前图集立绘";
    }
    const figureGroup = assetMap.get("figureVariants");
    dom.figureQuickButton.hidden = !figureGroup;
    if (figureGroup) {
      dom.figureQuickButton.textContent = `一键获取立绘差分 · ${figureGroup.sourceAssets.length} 图集`;
    }
    selectAssetType(assetMap.keys().next().value);
  }

  function collectDialogueAssets(extraAssets) {
    const output = [];
    const seen = new Set();

    DIALOGUE_ASSET_SOURCES.forEach((source) => {
      flattenAssetUrls(extraAssets[source.key]).forEach((asset) => {
        if (seen.has(asset.url)) {
          return;
        }
        seen.add(asset.url);
        output.push({
          ...asset,
          sourceIndex: output.length,
          sourceKey: source.key,
          sourceLabel: source.label,
          label: `${source.label} · ${asset.label}`
        });
      });
    });

    return output;
  }

  function collectStoryFigureAssets(extraAssets) {
    return flattenAssetUrls(extraAssets.storyFigure).map((asset, sourceIndex) => ({
      ...asset,
      sourceIndex,
      sourceKey: "storyFigure",
      sourceLabel: "剧情立绘",
      label: `剧情立绘 · ${asset.label}`
    }));
  }

  function flattenAssetUrls(value) {
    const output = [];
    const seen = new Set();

    function visit(node, path) {
      if (typeof node === "string") {
        if (/^https?:\/\//i.test(node) && !seen.has(node)) {
          seen.add(node);
          const pathName = path
            .map((part) => String(part).replace(/[^a-zA-Z0-9_-]/g, "-"))
            .join("_");
          output.push({
            url: node,
            path,
            label: formatAssetPath(path),
            filename: sanitizeFilename(`${pathName ? `${pathName}_` : ""}${getFilename(node)}`)
          });
        }
        return;
      }

      if (!node || typeof node !== "object") {
        return;
      }

      Object.entries(node).forEach(([key, child]) => visit(child, path.concat(key)));
    }

    visit(value, []);
    return output;
  }

  function formatAssetPath(path) {
    return path.map((part) => ASSET_GROUP_LABELS[part] || part).join(" · ") || "默认";
  }

  function selectAssetType(key) {
    const group = state.modalAssets.get(key);
    if (!group) {
      return;
    }

    state.modalAssetType = key;
    state.modalAssetIndex = 0;
    [...dom.assetTypeTabs.children].forEach((button, index) => {
      const active = [...state.modalAssets.keys()][index] === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    const isExtraction = isExtractionGroup(group);
    dom.expressionToolbar.hidden = !isExtraction;
    dom.linkedFigureButton.hidden = group.kind !== "expressions" || !group.assets.length;
    dom.currentSheetExpressionButton.hidden = true;
    dom.currentSheetFigureButton.hidden = true;
    dom.downloadAllExpressionsButton.hidden = !isDownloadableGroup(group) || !group.assets.length;
    if (isExtraction) {
      updateExtractionToolbar(group);
    } else if (isDownloadableGroup(group)) {
      updateDownloadToolbar(group);
    }

    if (!group.assets.length) {
      renderEmptyExtractionGroup(group);
      return;
    }

    renderAssetThumbnails(group.assets);
    selectAsset(0);
  }

  function isExtractionGroup(group) {
    return group && (group.kind === "expressions" || group.kind === "figures");
  }

  function isDownloadableGroup(group) {
    return Boolean(group && (isExtractionGroup(group) || group.kind === "storyImages"));
  }

  function getAssetLabels(group) {
    if (group.kind === "figures") {
      return { noun: "立绘", full: "立绘差分", unit: "张" };
    }
    if (group.kind === "expressions") {
      return { noun: "表情", full: "表情差分", unit: "张" };
    }
    return { noun: "插图", full: "剧情插图", unit: "张" };
  }

  function getExtractionLabels(group) {
    return getAssetLabels(group);
  }

  function renderEmptyExtractionGroup(group) {
    const labels = getExtractionLabels(group);
    const sourceUnit = "图集";
    const sourceCount = group.extractionSourceCount || group.sourceAssets.length;
    dom.assetThumbnails.replaceChildren();
    dom.previewImage.removeAttribute("src");
    dom.previewImage.classList.remove("is-loaded");
    dom.previewLoading.hidden = true;
    dom.previewError.hidden = false;
    dom.previewError.textContent = group.extractionState === "running"
      ? `正在提取${labels.full}`
      : `尚未提取${labels.full}`;
    dom.assetPosition.textContent = `0 / ${sourceCount} ${sourceUnit}`;
    dom.assetGroupLabel.textContent = "";
    dom.factType.textContent = labels.full;
    dom.factDimensions.textContent = group.kind === "figures" ? "自动裁切" : "256 × 256 px";
    dom.factFilename.textContent = "--";
    setAssetActionsDisabled(true);
  }

  function updateExtractionToolbar(group) {
    const labels = getExtractionLabels(group);
    const sourceCount = group.extractionSourceCount || group.sourceAssets.length;
    const extractedCount = group.assets.length;
    const completed = group.completedSources || 0;
    const sourceUnit = "图集";
    const isCurrentSource = group.extractionScope === "current";
    dom.expressionProgress.max = Math.max(1, sourceCount);
    dom.expressionProgress.value = Math.min(completed, sourceCount);
    dom.expressionSummary.textContent = extractedCount
      ? `${isCurrentSource ? "当前图集 · " : ""}已提取 ${extractedCount} ${labels.unit}${labels.full}`
      : isCurrentSource ? "已选择当前对话图集" : `已发现 ${sourceCount} 个对话图集`;
    if (group.extractionState === "running") {
      dom.expressionStatus.textContent = `${completed} / ${sourceCount} ${sourceUnit}`;
    } else if (group.extractionState === "done") {
      dom.expressionStatus.textContent = group.failedSources
        ? `${group.failedSources} 个${sourceUnit}读取失败`
        : "提取完成";
    } else {
      dom.expressionStatus.textContent = "等待提取";
    }
    dom.extractExpressionsButton.textContent = group.extractionState === "done"
      ? `重新提取${labels.noun}${isCurrentSource ? " · 当前图集" : ""}`
      : `一键提取全部${labels.noun}`;
    dom.extractExpressionsButton.disabled = group.extractionState === "running" || Boolean(state.extractionController);
    dom.downloadAllExpressionsButton.textContent = `保存全部${labels.noun} ZIP`;
  }

  function updateDownloadToolbar(group) {
    const labels = getAssetLabels(group);
    dom.downloadAllExpressionsButton.textContent = `保存全部${labels.noun} ZIP`;
  }

  function renderAssetThumbnails(assets) {
    dom.assetThumbnails.replaceChildren();
    const fragment = document.createDocumentFragment();
    assets.forEach((asset, index) => {
      const button = document.createElement("button");
      button.className = "asset-thumbnail";
      button.type = "button";
      button.title = asset.label;
      button.setAttribute("aria-label", `查看第 ${index + 1} 张：${asset.label}`);
      button.addEventListener("click", () => selectAsset(index));
      const image = document.createElement("img");
      image.src = asset.url;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      const count = document.createElement("span");
      count.textContent = String(index + 1);
      button.append(image, count);
      fragment.append(button);
    });
    dom.assetThumbnails.append(fragment);
  }

  function selectAsset(index) {
    const group = state.modalAssets.get(state.modalAssetType);
    if (!group || !group.assets[index]) {
      return;
    }

    state.modalAssetIndex = index;
    const asset = group.assets[index];
    updateLinkedFigureButton(group, asset);
    updateCurrentSheetButtons(group, asset);
    [...dom.assetThumbnails.children].forEach((button, buttonIndex) => {
      button.classList.toggle("is-active", buttonIndex === index);
    });
    const activeThumbnail = dom.assetThumbnails.children[index];
    if (activeThumbnail) {
      scrollThumbnailIntoView(activeThumbnail);
    }

    dom.previewImage.classList.remove("is-loaded");
    dom.previewImage.alt = `${dom.modalTitle.textContent} - ${asset.label}`;
    dom.previewLoading.hidden = false;
    dom.previewError.hidden = true;
    dom.factDimensions.textContent = "读取中";
    dom.factType.textContent = asset.typeLabel || group.label;
    dom.factFilename.textContent = asset.filename || getFilename(asset.url);
    dom.assetPosition.textContent = `${index + 1} / ${group.assets.length}`;
    dom.assetGroupLabel.textContent = asset.label;
    dom.openOriginalLink.href = asset.url;
    dom.previewImage.src = asset.url;
    setAssetActionsDisabled(false);
  }

  function updateLinkedFigureButton(group, asset) {
    const visible = group && group.kind === "expressions" && asset && Number.isInteger(asset.sourceIndex);
    dom.linkedFigureButton.hidden = !visible;
    if (visible) {
      dom.linkedFigureButton.textContent = `获取当前图集立绘 · ${asset.sourceLabel}`;
      dom.linkedFigureButton.disabled = Boolean(state.extractionController);
    } else {
      dom.linkedFigureButton.disabled = false;
    }
  }

  function updateCurrentSheetButtons(group, asset) {
    const sourceSelected = group && group.kind === "dialogueSheets" && asset &&
      Number.isInteger(asset.sourceIndex);
    const hasExpressionGroup = state.modalAssets.has("dialogueExpressions");
    const hasFigureGroup = state.modalAssets.has("figureVariants");
    dom.currentSheetExpressionButton.hidden = !sourceSelected || !hasExpressionGroup;
    dom.currentSheetFigureButton.hidden = !sourceSelected || !hasFigureGroup;
    if (sourceSelected) {
      dom.currentSheetExpressionButton.textContent = "仅提取当前图集表情";
      dom.currentSheetFigureButton.textContent = "仅提取当前图集立绘";
      const disabled = Boolean(state.extractionController);
      dom.currentSheetExpressionButton.disabled = disabled;
      dom.currentSheetFigureButton.disabled = disabled;
    }
  }

  function scrollThumbnailIntoView(thumbnail) {
    const container = dom.assetThumbnails;
    const thumbnailLeft = thumbnail.offsetLeft;
    const thumbnailRight = thumbnailLeft + thumbnail.offsetWidth;
    const visibleLeft = container.scrollLeft;
    const visibleRight = visibleLeft + container.clientWidth;

    if (thumbnailLeft < visibleLeft) {
      container.scrollLeft = Math.max(0, thumbnailLeft - 4);
    } else if (thumbnailRight > visibleRight) {
      container.scrollLeft = thumbnailRight - container.clientWidth + 4;
    }
  }

  function getCurrentAsset() {
    const group = state.modalAssets.get(state.modalAssetType);
    return group && group.assets[state.modalAssetIndex] ? group.assets[state.modalAssetIndex] : null;
  }

  function getFilename(url) {
    try {
      const pathname = new URL(url).pathname;
      return decodeURIComponent(pathname.slice(pathname.lastIndexOf("/") + 1)) || "fgo-asset.png";
    } catch (_error) {
      return "fgo-asset.png";
    }
  }

  function setAssetActionsDisabled(disabled) {
    dom.downloadButton.disabled = disabled;
    dom.copyButton.disabled = disabled;
    dom.openOriginalLink.toggleAttribute("aria-disabled", disabled);
    dom.openOriginalLink.style.pointerEvents = disabled ? "none" : "";
  }

  function closeModal() {
    if (state.detailController) {
      state.detailController.abort();
      state.detailController = null;
    }
    clearExtractionResources();
    dom.modal.hidden = true;
    document.body.classList.remove("is-modal-open");
    state.modalItem = null;
    state.modalAssets = new Map();
    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
      state.lastFocusedElement.focus();
    }
  }

  function clearExtractionResources() {
    if (state.extractionController) {
      state.extractionController.abort();
      state.extractionController = null;
    }
    state.modalAssets.forEach((group) => revokeGeneratedAssets(group));
  }

  function revokeGeneratedAssets(group) {
    if (!group || !Array.isArray(group.assets)) {
      return;
    }
    group.assets.forEach((asset) => {
      if (asset.generated && asset.url) {
        URL.revokeObjectURL(asset.url);
      }
    });
    if (isExtractionGroup(group)) {
      group.assets = [];
    }
  }

  function updateRecordNavigation() {
    const index = state.filtered.findIndex((item) => state.modalItem && item.id === state.modalItem.id);
    dom.previousRecordButton.disabled = index <= 0;
    dom.nextRecordButton.disabled = index < 0 || index >= state.filtered.length - 1;
  }

  function moveRecord(direction) {
    if (!state.modalItem) {
      return;
    }
    const index = state.filtered.findIndex((item) => item.id === state.modalItem.id);
    const next = state.filtered[index + direction];
    if (next) {
      openModal(next);
    }
  }

  async function quickExtractExpressions() {
    await quickExtractGroup("dialogueExpressions");
  }

  async function quickExtractFigures() {
    await quickExtractGroup("figureVariants");
  }

  async function extractLinkedFigures() {
    const expressionGroup = state.modalAssets.get("dialogueExpressions");
    const expressionAsset = expressionGroup && expressionGroup.assets[state.modalAssetIndex];
    if (!expressionGroup || !expressionAsset || !Number.isInteger(expressionAsset.sourceIndex)) {
      return;
    }
    const figureGroup = state.modalAssets.get("figureVariants");
    if (!figureGroup) {
      return;
    }
    const targetExpressionIndex = expressionAsset.expressionIndex;
    const targetSourceIndex = expressionAsset.sourceIndex;
    selectAssetType("figureVariants");
    resetModalScroll();
    await extractAllGeneratedAssets("figureVariants", [targetSourceIndex]);
    const targetIndex = figureGroup.assets.findIndex((asset) =>
      asset.sourceIndex === targetSourceIndex && asset.expressionIndex === targetExpressionIndex
    );
    if (targetIndex >= 0 && state.modalAssetType === "figureVariants") {
      selectAsset(targetIndex);
    }
  }

  async function extractCurrentSheetGroup(key) {
    const sourceGroup = state.modalAssets.get(state.modalAssetType);
    const sourceAsset = sourceGroup && sourceGroup.assets[state.modalAssetIndex];
    if (!sourceGroup || sourceGroup.kind !== "dialogueSheets" ||
        !sourceAsset || !Number.isInteger(sourceAsset.sourceIndex) || !state.modalAssets.has(key)) {
      return;
    }
    const sourceIndex = sourceAsset.sourceIndex;
    selectAssetType(key);
    resetModalScroll();
    await extractAllGeneratedAssets(key, [sourceIndex]);
  }

  async function extractCurrentSheetExpressions() {
    await extractCurrentSheetGroup("dialogueExpressions");
  }

  async function extractCurrentSheetFigures() {
    await extractCurrentSheetGroup("figureVariants");
  }

  async function quickExtractGroup(key) {
    if (!state.modalAssets.has(key)) {
      return;
    }
    selectAssetType(key);
    resetModalScroll();
    await extractAllGeneratedAssets(key);
  }

  async function extractSelectedAssets() {
    const group = state.modalAssets.get(state.modalAssetType);
    if (isExtractionGroup(group)) {
      const requestedSourceIndexes = group.extractionScope === "current"
        ? group.requestedSourceIndexes
        : undefined;
      await extractAllGeneratedAssets(state.modalAssetType, requestedSourceIndexes);
    }
  }

  async function extractAllGeneratedAssets(key, requestedSourceIndexes) {
    const group = state.modalAssets.get(key);
    if (!group || group.extractionState === "running") {
      return;
    }

    if (state.extractionController) {
      state.extractionController.abort();
    }
    revokeGeneratedAssets(group);
    const controller = new AbortController();
    state.extractionController = controller;
    const sourceIndexes = Array.isArray(requestedSourceIndexes)
      ? [...new Set(requestedSourceIndexes.filter((index) => index >= 0 && index < group.sourceAssets.length))]
      : group.sourceAssets.map((_source, index) => index);
    if (!sourceIndexes.length) {
      return;
    }
    const sourceResults = new Array(group.sourceAssets.length);
    const seenHashes = new Set();
    let nextSourceIndex = 0;
    const labels = getExtractionLabels(group);

    group.completedSources = 0;
    group.failedSources = 0;
    group.extractionScope = Array.isArray(requestedSourceIndexes) ? "current" : "all";
    group.requestedSourceIndexes = group.extractionScope === "current" ? [...sourceIndexes] : null;
    group.extractionSourceCount = sourceIndexes.length;
    group.extractionState = "running";
    dom.expressionQuickButton.disabled = true;
    dom.figureQuickButton.disabled = true;
    dom.linkedFigureButton.disabled = true;
    updateExtractionToolbar(group);
    renderEmptyExtractionGroup(group);

    async function worker() {
      while (!controller.signal.aborted) {
        const sourceIndex = nextSourceIndex;
        nextSourceIndex += 1;
        if (sourceIndex >= sourceIndexes.length) {
          return;
        }

        const actualSourceIndex = sourceIndexes[sourceIndex];

        try {
          if (group.kind === "figures") {
            sourceResults[sourceIndex] = await extractFigureVariants(
              group.sourceAssets[actualSourceIndex],
              actualSourceIndex,
              seenHashes,
              controller.signal
            );
          } else {
            sourceResults[sourceIndex] = await extractExpressionTiles(
              group.sourceAssets[actualSourceIndex],
              actualSourceIndex,
              seenHashes,
              controller.signal
            );
          }
        } catch (error) {
          if (error && error.name === "AbortError") {
            return;
          }
          sourceResults[sourceIndex] = [];
          group.failedSources += 1;
        } finally {
          if (!controller.signal.aborted) {
            group.completedSources += 1;
            group.assets = sourceResults.flatMap((assets) => assets || []);
            updateExtractionToolbar(group);
          }
        }
      }
    }

    try {
      const workerCount = Math.min(2, sourceIndexes.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
      if (controller.signal.aborted) {
        return;
      }

      group.assets = sourceResults.flatMap((assets) => assets || []);
      group.extractionState = "done";
      updateExtractionToolbar(group);
      updateAssetTypeTab(key, group.assets.length);
      if (state.modalAssetType === key) {
        dom.downloadAllExpressionsButton.hidden = !group.assets.length;
        if (group.assets.length) {
          renderAssetThumbnails(group.assets);
          selectAsset(0);
          resetModalScroll();
        } else {
          renderEmptyExtractionGroup(group);
        }
      }
      showToast(group.assets.length
        ? `已提取 ${group.assets.length} ${labels.unit}${labels.full}`
        : `没有检测到可提取的${labels.full}`);
    } finally {
      if (state.extractionController === controller) {
        state.extractionController = null;
        dom.expressionQuickButton.disabled = false;
        dom.figureQuickButton.disabled = false;
        dom.linkedFigureButton.disabled = false;
        const currentGroup = state.modalAssets.get(state.modalAssetType);
        if (isExtractionGroup(currentGroup)) {
          updateExtractionToolbar(currentGroup);
        }
      }
    }
  }

  function updateAssetTypeTab(key, count) {
    const button = dom.assetTypeTabs.querySelector(`[data-asset-type="${key}"]`);
    const group = state.modalAssets.get(key);
    if (button && group) {
      button.textContent = `${group.label} ${count}`;
    }
  }

  function detectDialogueSheetLayout(bitmap, width, height) {
    const baseHeight = EXPRESSION_TILE_SIZE * EXPRESSION_BASE_ROWS;
    const probeHeight = Math.min(Math.max(0, height - baseHeight), 1280);
    if (probeHeight <= 0) {
      return {
        baseHeight,
        expressionStart: baseHeight,
        tileWidth: EXPRESSION_TILE_SIZE,
        tileHeight: EXPRESSION_TILE_SIZE,
        paged: false
      };
    }

    const probeCanvas = document.createElement("canvas");
    probeCanvas.width = width;
    probeCanvas.height = probeHeight;
    const probeContext = probeCanvas.getContext("2d", { willReadFrequently: true });
    probeContext.drawImage(bitmap, 0, baseHeight, width, probeHeight, 0, 0, width, probeHeight);
    const probeData = probeContext.getImageData(0, 0, width, probeHeight).data;
    let firstVisibleOffset = 0;

    for (; firstVisibleOffset < probeHeight; firstVisibleOffset += 1) {
      let visibleCount = 0;
      for (let x = 0; x < width; x += 2) {
        if (probeData[(firstVisibleOffset * width + x) * 4 + 3] > 8) {
          visibleCount += 1;
          if (visibleCount >= 32) {
            break;
          }
        }
      }
      if (visibleCount >= 32) {
        break;
      }
    }

    const expressionStart = baseHeight + firstVisibleOffset;
    if (firstVisibleOffset < EXPRESSION_TILE_SIZE / 2) {
      return {
        baseHeight,
        expressionStart: baseHeight,
        tileWidth: EXPRESSION_TILE_SIZE,
        tileHeight: EXPRESSION_TILE_SIZE,
        paged: false
      };
    }

    const pageSize = 1024;
    const pageWidth = Math.min(pageSize, width);
    const pageHeight = Math.min(pageSize, height - expressionStart);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = pageWidth;
    pageCanvas.height = pageHeight;
    const pageContext = pageCanvas.getContext("2d", { willReadFrequently: true });
    pageContext.drawImage(
      bitmap,
      0,
      expressionStart,
      pageWidth,
      pageHeight,
      0,
      0,
      pageWidth,
      pageHeight
    );
    const pageData = pageContext.getImageData(0, 0, pageWidth, pageHeight).data;
    const columnProfile = new Array(pageWidth).fill(0);
    const rowProfile = new Array(pageHeight).fill(0);

    for (let x = 0; x < pageWidth; x += 1) {
      for (let y = 0; y < pageHeight; y += 2) {
        if (pageData[(y * pageWidth + x) * 4 + 3] > 8) {
          columnProfile[x] += 1;
        }
      }
    }
    for (let y = 0; y < pageHeight; y += 1) {
      for (let x = 0; x < pageWidth; x += 2) {
        if (pageData[(y * pageWidth + x) * 4 + 3] > 8) {
          rowProfile[y] += 1;
        }
      }
    }

    const widthPeriod = findRepeatedProfilePeriod(columnProfile, 128, Math.min(512, Math.floor(pageWidth / 2)));
    const heightPeriod = findRepeatedProfilePeriod(rowProfile, 128, Math.min(512, Math.floor(pageHeight / 2)));
    if (!widthPeriod || !heightPeriod || widthPeriod.score > 0.08 || heightPeriod.score > 0.08) {
      return {
        baseHeight,
        expressionStart: baseHeight,
        tileWidth: EXPRESSION_TILE_SIZE,
        tileHeight: EXPRESSION_TILE_SIZE,
        paged: false
      };
    }

    return {
      baseHeight,
      expressionStart,
      tileWidth: widthPeriod.period,
      tileHeight: heightPeriod.period,
      pageSize,
      columnsPerPage: Math.max(1, Math.floor(pageSize / widthPeriod.period)),
      rowsPerPage: Math.max(1, Math.floor(pageSize / heightPeriod.period)),
      paged: true
    };
  }

  function findRepeatedProfilePeriod(profile, minimum, maximum) {
    let best = null;
    for (let period = minimum; period <= maximum; period += 1) {
      let difference = 0;
      let samples = 0;
      for (let index = 0; index < period && index + period < profile.length; index += 2) {
        const first = profile[index];
        const second = profile[index + period];
        difference += Math.abs(first - second) / Math.max(16, first + second);
        samples += 1;
      }
      const score = samples ? difference / samples : Number.POSITIVE_INFINITY;
      if (!best || score < best.score) {
        best = { period, score };
      }
    }
    return best;
  }

  function getDialogueTilePositions(width, height, layout) {
    const positions = [];
    if (!layout.paged) {
      const columnCount = Math.floor(width / layout.tileWidth);
      for (let y = layout.expressionStart; y + layout.tileHeight <= height; y += layout.tileHeight) {
        for (let column = 0; column < columnCount; column += 1) {
          positions.push({ x: column * layout.tileWidth, y });
        }
      }
      return positions;
    }

    for (let pageStart = layout.expressionStart; pageStart < height; pageStart += layout.pageSize) {
      for (let row = 0; row < layout.rowsPerPage; row += 1) {
        const y = pageStart + row * layout.tileHeight;
        if (y + layout.tileHeight > height) {
          continue;
        }
        for (let column = 0; column < layout.columnsPerPage; column += 1) {
          const x = column * layout.tileWidth;
          if (x + layout.tileWidth <= width) {
            positions.push({ x, y });
          }
        }
      }
    }
    return positions;
  }

  async function extractExpressionTiles(source, sourceIndex, seenHashes, signal) {
    const response = await fetch(source.url, { signal });
    if (!response.ok) {
      throw new Error(`图集返回 ${response.status}`);
    }
    const sourceBlob = await response.blob();
    const bitmap = await decodeImageBlob(sourceBlob);
    const width = bitmap.width || bitmap.naturalWidth;
    const height = bitmap.height || bitmap.naturalHeight;
    const layout = detectDialogueSheetLayout(bitmap, width, height);
    const tileWidth = layout.tileWidth;
    const tileHeight = layout.tileHeight;
    const tilePositions = getDialogueTilePositions(width, height, layout);

    if (!tilePositions.length) {
      closeDecodedImage(bitmap);
      throw new Error("无法识别表情图集布局");
    }

    const canvas = document.createElement("canvas");
    canvas.width = tileWidth;
    canvas.height = tileHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const assets = [];
    let expressionIndex = 0;

    try {
      for (const position of tilePositions) {
        if (signal.aborted) {
          throw new DOMException("已取消", "AbortError");
        }
        context.clearRect(0, 0, tileWidth, tileHeight);
        context.drawImage(
          bitmap,
          position.x,
          position.y,
          tileWidth,
          tileHeight,
          0,
          0,
          tileWidth,
          tileHeight
        );
        const pixels = context.getImageData(0, 0, tileWidth, tileHeight);
        if (!hasVisiblePixels(pixels.data)) {
          continue;
        }

        expressionIndex += 1;
        const hash = hashPixels(pixels.data);
        if (seenHashes.has(hash)) {
          continue;
        }
        seenHashes.add(hash);

        const blob = await canvasToBlob(canvas);
        const objectUrl = URL.createObjectURL(blob);
        const sourceId = getFilename(source.url).replace(/_merged\.png$/i, "").replace(/\.png$/i, "");
        const sourcePath = source.path.map((part) => String(part).replace(/[^a-zA-Z0-9_-]/g, "-")).join("_");
        const filename = sanitizeFilename(
          `${state.modalItem.id}_${source.sourceKey}_${sourcePath}_${sourceId}_face_${String(expressionIndex).padStart(2, "0")}.png`
        );
        assets.push({
          url: objectUrl,
          blob,
          generated: true,
          filename,
          sourceUrl: source.url,
          sourceIndex,
          expressionIndex,
          sourceLabel: source.sourceLabel,
          typeLabel: `表情差分 · ${source.sourceLabel}`,
          path: source.path.concat(`表情 ${expressionIndex}`),
          label: `${source.label} · 表情 ${expressionIndex}`
        });
      }
    } catch (error) {
      assets.forEach((asset) => {
        URL.revokeObjectURL(asset.url);
        if (asset.thumbnailUrl) {
          URL.revokeObjectURL(asset.thumbnailUrl);
        }
      });
      throw error;
    } finally {
      closeDecodedImage(bitmap);
    }

    return assets;
  }

  async function extractFigureVariants(source, sourceIndex, seenHashes, signal, onProgress) {
    if (onProgress) {
      onProgress({ phase: "正在下载整体立绘图集", completed: 0, total: 0, extracted: 0 });
    }
    const response = await fetch(source.url, { signal });
    if (!response.ok) {
      throw new Error(`图集返回 ${response.status}`);
    }
    const sourceBlob = await response.blob();
    if (onProgress) {
      onProgress({ phase: "正在解码立绘图集", completed: 0, total: 0, extracted: 0 });
    }
    const bitmap = await decodeImageBlob(sourceBlob);
    const width = bitmap.width || bitmap.naturalWidth;
    const height = bitmap.height || bitmap.naturalHeight;
    const layout = detectDialogueSheetLayout(bitmap, width, height);
    const tileWidth = layout.tileWidth;
    const tileHeight = layout.tileHeight;
    const baseHeight = layout.baseHeight;
    const tilePositions = getDialogueTilePositions(width, height, layout);

    if (!tilePositions.length) {
      closeDecodedImage(bitmap);
      throw new Error("无法识别立绘图集布局");
    }

    if (onProgress) {
      onProgress({
        phase: `已识别 ${tilePositions.length} 个候选差分，正在定位表情区域`,
        completed: 0,
        total: tilePositions.length,
        extracted: 0
      });
    }

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = width;
    sourceCanvas.height = baseHeight;
    const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = tileWidth;
    tileCanvas.height = tileHeight;
    const tileContext = tileCanvas.getContext("2d", { willReadFrequently: true });
    const assets = [];

    try {
      if (signal.aborted) {
        throw new DOMException("已取消", "AbortError");
      }
      sourceContext.drawImage(bitmap, 0, 0, width, baseHeight, 0, 0, width, baseHeight);
      const basePixels = sourceContext.getImageData(0, 0, width, baseHeight);
      const bounds = getVisiblePixelBounds(basePixels.data, width, baseHeight);
      if (!bounds) {
        return [];
      }

      let referenceTile = null;
      for (const position of tilePositions) {
        tileContext.clearRect(0, 0, tileWidth, tileHeight);
        tileContext.drawImage(
          bitmap,
          position.x,
          position.y,
          tileWidth,
          tileHeight,
          0,
          0,
          tileWidth,
          tileHeight
        );
        const pixels = tileContext.getImageData(0, 0, tileWidth, tileHeight);
        if (hasVisiblePixels(pixels.data)) {
          referenceTile = pixels;
          break;
        }
      }
      if (!referenceTile) {
        return [];
      }

      const placement = findExpressionPlacement(
        basePixels.data,
        width,
        baseHeight,
        referenceTile.data,
        tileWidth,
        tileHeight
      );
      if (onProgress) {
        onProgress({
          phase: "定位完成，正在逐张合成立绘差分",
          completed: 0,
          total: tilePositions.length,
          extracted: 0
        });
      }
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = bounds.width;
      croppedCanvas.height = bounds.height;
      const croppedContext = croppedCanvas.getContext("2d", { willReadFrequently: true });
      const faceCanvas = document.createElement("canvas");
      faceCanvas.width = 256;
      faceCanvas.height = 256;
      const faceContext = faceCanvas.getContext("2d");
      const faceCropSize = Math.min(
        width,
        baseHeight,
        Math.round(Math.max(tileWidth, tileHeight) * 1.2)
      );
      const sourceId = getFilename(source.url).replace(/_merged\.png$/i, "").replace(/\.png$/i, "");
      const sourcePath = source.path.map((part) => String(part).replace(/[^a-zA-Z0-9_-]/g, "-")).join("_");
      let expressionIndex = 0;

      for (let positionIndex = 0; positionIndex < tilePositions.length; positionIndex += 1) {
        const position = tilePositions[positionIndex];
        if (signal.aborted) {
          throw new DOMException("已取消", "AbortError");
        }
        tileContext.clearRect(0, 0, tileWidth, tileHeight);
        tileContext.drawImage(
          bitmap,
          position.x,
          position.y,
          tileWidth,
          tileHeight,
          0,
          0,
          tileWidth,
          tileHeight
        );
        const tilePixels = tileContext.getImageData(0, 0, tileWidth, tileHeight);
        if (!hasVisiblePixels(tilePixels.data)) {
          if (onProgress) {
            onProgress({
              phase: "正在扫描有效表情并合成立绘",
              completed: positionIndex + 1,
              total: tilePositions.length,
              extracted: assets.length
            });
          }
          continue;
        }

        expressionIndex += 1;
        sourceContext.clearRect(0, 0, width, baseHeight);
        sourceContext.putImageData(basePixels, 0, 0);
        sourceContext.clearRect(placement.x, placement.y, tileWidth, tileHeight);
        sourceContext.drawImage(
          bitmap,
          position.x,
          position.y,
          tileWidth,
          tileHeight,
          placement.x,
          placement.y,
          tileWidth,
          tileHeight
        );
        croppedContext.clearRect(0, 0, bounds.width, bounds.height);
        croppedContext.drawImage(
          sourceCanvas,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height,
          0,
          0,
          bounds.width,
          bounds.height
        );
        const croppedPixels = croppedContext.getImageData(0, 0, bounds.width, bounds.height);
        const hash = `${bounds.width}x${bounds.height}:${hashPixels(croppedPixels.data)}`;
        if (seenHashes.has(hash)) {
          if (onProgress) {
            onProgress({
              phase: "正在排除重复差分",
              completed: positionIndex + 1,
              total: tilePositions.length,
              extracted: assets.length
            });
          }
          continue;
        }
        seenHashes.add(hash);

        const blob = await canvasToBlob(croppedCanvas);
        const faceCropX = Math.max(0, Math.min(
          width - faceCropSize,
          Math.round(placement.x + tileWidth / 2 - faceCropSize / 2)
        ));
        const faceCropY = Math.max(0, Math.min(
          baseHeight - faceCropSize,
          Math.round(placement.y + tileHeight / 2 - faceCropSize / 2)
        ));
        faceContext.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
        faceContext.drawImage(
          sourceCanvas,
          faceCropX,
          faceCropY,
          faceCropSize,
          faceCropSize,
          0,
          0,
          faceCanvas.width,
          faceCanvas.height
        );
        const thumbnailBlob = await canvasToBlob(faceCanvas);
        if (signal.aborted) {
          throw new DOMException("已取消", "AbortError");
        }
        const objectUrl = URL.createObjectURL(blob);
        const filename = sanitizeFilename(
          `${state.modalItem.id}_${source.sourceKey}_${sourcePath}_${sourceId}_figure_${String(expressionIndex).padStart(2, "0")}.png`
        );
        assets.push({
          url: objectUrl,
          blob,
          thumbnailUrl: URL.createObjectURL(thumbnailBlob),
          thumbnailBlob,
          generated: true,
          filename,
          sourceUrl: source.url,
          sourceIndex,
          expressionIndex,
          sourceLabel: source.sourceLabel,
          typeLabel: `立绘差分 · ${source.sourceLabel}`,
          path: source.path.concat(`立绘表情 ${expressionIndex}`),
          label: `${source.label} · 立绘表情 ${expressionIndex}`
        });
        if (onProgress) {
          onProgress({
            phase: "正在扫描有效表情并合成立绘",
            completed: positionIndex + 1,
            total: tilePositions.length,
            extracted: assets.length
          });
        }
      }
      if (onProgress) {
        onProgress({
          phase: "可以选择差分加入当前分镜",
          completed: tilePositions.length,
          total: tilePositions.length,
          extracted: assets.length,
          done: true
        });
      }
    } catch (error) {
      assets.forEach((asset) => {
        URL.revokeObjectURL(asset.url);
        if (asset.thumbnailUrl) {
          URL.revokeObjectURL(asset.thumbnailUrl);
        }
      });
      throw error;
    } finally {
      closeDecodedImage(bitmap);
    }

    return assets;
  }

  function findExpressionPlacement(baseData, baseWidth, baseHeight, tileData, tileWidth, tileHeight) {
    const maxX = baseWidth - tileWidth;
    const maxY = baseHeight - tileHeight;
    const coarseStep = Math.max(4, Math.round(Math.min(tileWidth, tileHeight) / 32));
    const refineSampleStep = Math.max(1, Math.round(Math.min(tileWidth, tileHeight) / 128));

    function score(candidateX, candidateY, sampleStep) {
      let difference = 0;
      let samples = 0;
      for (let y = 0; y < tileHeight; y += sampleStep) {
        for (let x = 0; x < tileWidth; x += sampleStep) {
          const baseAlpha = baseData[((candidateY + y) * baseWidth + candidateX + x) * 4 + 3];
          const tileAlpha = tileData[(y * tileWidth + x) * 4 + 3];
          difference += Math.abs(baseAlpha - tileAlpha);
          samples += 1;
        }
      }
      return difference / samples;
    }

    let coarseBest = { x: 0, y: 0, score: Number.POSITIVE_INFINITY };
    for (let y = 0; y <= maxY; y += coarseStep) {
      for (let x = 0; x <= maxX; x += coarseStep) {
        const candidateScore = score(x, y, coarseStep);
        if (candidateScore < coarseBest.score) {
          coarseBest = { x, y, score: candidateScore };
        }
      }
    }

    const radius = coarseStep + 2;
    const startX = Math.max(0, coarseBest.x - radius);
    const endX = Math.min(maxX, coarseBest.x + radius);
    const startY = Math.max(0, coarseBest.y - radius);
    const endY = Math.min(maxY, coarseBest.y + radius);
    let best = {
      x: coarseBest.x,
      y: coarseBest.y,
      score: score(coarseBest.x, coarseBest.y, refineSampleStep)
    };

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const candidateScore = score(x, y, refineSampleStep);
        if (candidateScore < best.score) {
          best = { x, y, score: candidateScore };
        }
      }
    }

    if (best.score > 24) {
      throw new Error("无法定位表情替换区域");
    }
    return best;
  }

  function getVisiblePixelBounds(data, width, height) {
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] <= 8) {
          continue;
        }
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }

    return right < left || bottom < top
      ? null
      : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
  }

  async function decodeImageBlob(blob) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(blob);
    }

    const objectUrl = URL.createObjectURL(blob);
    try {
      return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("图集解码失败"));
        image.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function closeDecodedImage(image) {
    if (image && typeof image.close === "function") {
      image.close();
    }
  }

  function hasVisiblePixels(data) {
    let visibleCount = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] > 8) {
        visibleCount += 1;
        if (visibleCount >= 64) {
          return true;
        }
      }
    }
    return false;
  }

  function hashPixels(data) {
    let first = 2166136261;
    let second = 2246822519;
    for (let index = 0; index < data.length; index += 1) {
      first = Math.imul(first ^ data[index], 16777619);
      second = Math.imul(second ^ data[index], 3266489917);
    }
    return `${first >>> 0}:${second >>> 0}:${data.length}`;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("无法生成差分图片"));
        }
      }, "image/png");
    });
  }

  function sanitizeFilename(value) {
    return String(value).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/\s+/g, "_");
  }

  async function downloadCurrentAsset() {
    const asset = getCurrentAsset();
    if (!asset) {
      return;
    }

    dom.downloadButton.disabled = true;
    dom.downloadButton.textContent = "正在准备";
    try {
      let blob = asset.blob;
      if (!blob) {
        const response = await fetch(asset.url);
        if (!response.ok) {
          throw new Error(`图片返回 ${response.status}`);
        }
        blob = await response.blob();
      }
      await saveBlob(blob, asset.filename || getFilename(asset.url), "保存或分享图片");
      showToast(isNativeDirectFileSaverAvailable() ? "图片已保存到下载/如数迦贞" : isNativeApp() ? "已打开系统保存面板" : "图片已开始下载");
    } catch (_error) {
      if (!asset.blob) {
        window.open(asset.url, "_blank", "noopener,noreferrer");
        showToast("已打开原图，可从原图页面保存");
      } else {
        showToast("图片保存失败，请稍后重试");
      }
    } finally {
      dom.downloadButton.disabled = false;
      dom.downloadButton.textContent = "保存当前图片";
    }
  }

  async function downloadAllAssets() {
    const group = state.modalAssets.get(state.modalAssetType);
    if (!isDownloadableGroup(group) || !group.assets.length) {
      return;
    }

    const labels = getAssetLabels(group);
    dom.downloadAllExpressionsButton.disabled = true;
    dom.downloadAllExpressionsButton.textContent = "正在打包 0%";
    try {
      const zipBlob = await createStoredZip(group.assets, (completed, total) => {
        const percent = Math.round((completed / total) * 100);
        dom.downloadAllExpressionsButton.textContent = `正在打包 ${percent}%`;
      });
      const servantName = sanitizeFilename(state.modalItem.name || `servant_${state.modalItem.id}`);
      const filename = `${servantName}_${state.region}_${labels.full}_${group.assets.length}张.zip`;
      await saveBlob(zipBlob, filename, `保存或分享${labels.full}包`);
      showToast(isNativeDirectFileSaverAvailable() ? `${labels.full}包已保存到下载/如数迦贞` : isNativeApp() ? `${labels.full}包已交给系统保存` : `${labels.full}包已开始下载`);
    } catch (_error) {
      showToast(`${labels.full}包生成失败，请稍后重试`);
    } finally {
      dom.downloadAllExpressionsButton.disabled = false;
      const currentGroup = state.modalAssets.get(state.modalAssetType);
      if (isExtractionGroup(currentGroup)) {
        updateExtractionToolbar(currentGroup);
      } else if (isDownloadableGroup(currentGroup)) {
        updateDownloadToolbar(currentGroup);
      }
    }
  }

  async function createStoredZip(assets, onProgress) {
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;
    const timestamp = getDosTimestamp(new Date());

    for (let index = 0; index < assets.length; index += 1) {
      const asset = assets[index];
      const blob = asset.blob || await fetchAssetBlob(asset);
      const data = new Uint8Array(await blob.arrayBuffer());
      const name = new TextEncoder().encode(asset.filename || getFilename(asset.url));
      const checksum = crc32(data);
      const localHeader = new Uint8Array(30 + name.length);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, timestamp.time, true);
      localView.setUint16(12, timestamp.date, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, name.length, true);
      localHeader.set(name, 30);

      const centralHeader = new Uint8Array(46 + name.length);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, timestamp.time, true);
      centralView.setUint16(14, timestamp.date, true);
      centralView.setUint32(16, checksum, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, name.length, true);
      centralView.setUint32(42, localOffset, true);
      centralHeader.set(name, 46);

      localParts.push(localHeader, data);
      centralParts.push(centralHeader);
      localOffset += localHeader.length + data.length;
      onProgress(index + 1, assets.length);
    }

    const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, assets.length, true);
    endView.setUint16(10, assets.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, localOffset, true);
    return new Blob(localParts.concat(centralParts, endRecord), { type: "application/zip" });
  }

  async function fetchAssetBlob(asset) {
    const response = await fetch(asset.url);
    if (!response.ok) {
      throw new Error(`图片返回 ${response.status}`);
    }
    return response.blob();
  }

  const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
      }
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

  function getDosTimestamp(date) {
    const year = Math.max(1980, date.getFullYear());
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  function isNativeApp() {
    return Boolean(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function"
      && window.Capacitor.isNativePlatform());
  }

  function isNativeDirectFileSaverAvailable() {
    if (!isNativeApp() || typeof window.Capacitor.nativePromise !== "function") {
      return false;
    }
    // DirectFileSaver is registered by MainActivity rather than a JS plugin
    // package, so it may not appear in Capacitor's generated plugin headers.
    if (typeof window.Capacitor.isPluginAvailable === "function"
      && window.Capacitor.isPluginAvailable("DirectFileSaver")) {
      return true;
    }
    return typeof window.Capacitor.getPlatform === "function"
      && window.Capacitor.getPlatform() === "android";
  }

  const NATIVE_SAVE_CHUNK_SIZE = 2 * 1024 * 1024;

  // MediaRecorder may return a Blob from another realm in Android WebView;
  // `instanceof Blob` is not reliable there. Keep binary checks structural so
  // large exports always use the streaming path.
  function getBlobLikeSize(value) {
    const size = Number(value && value.size);
    return Number.isFinite(size) && size > 0 ? size : 0;
  }

  async function getWritableChunkBytes(chunk) {
    const data = chunk && Object.prototype.hasOwnProperty.call(chunk, "data")
      ? chunk.data
      : chunk;
    if (!data) return null;
    if (data instanceof Uint8Array) return data;
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (typeof data.byteLength === "number") {
      try { return new Uint8Array(data); } catch (_error) { return null; }
    }
    if (typeof data.length === "number") {
      try { return Uint8Array.from(data); } catch (_error) { return null; }
    }
    if (typeof data.arrayBuffer === "function") {
      try {
        const buffer = await data.arrayBuffer();
        return buffer ? new Uint8Array(buffer) : null;
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  async function saveBlob(blob, filename, dialogTitle) {
    if (isNativeDirectFileSaverAvailable()) {
      if (!getBlobLikeSize(blob)) {
        throw new Error("无法保存空文件");
      }
      let uri = null;
      for (let offset = 0; offset < blob.size; offset += NATIVE_SAVE_CHUNK_SIZE) {
        const chunk = blob.slice(offset, Math.min(blob.size, offset + NATIVE_SAVE_CHUNK_SIZE));
        const result = await window.Capacitor.nativePromise("DirectFileSaver", "saveToDownloads", {
          filename,
          mimeType: blob.type || "application/octet-stream",
          data: await blobToBase64(chunk),
          uri,
          append: Boolean(uri),
          complete: offset + chunk.size >= blob.size
        });
        uri = result && result.uri ? result.uri : uri;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      return { uri };
    }
    if (isNativeApp() && typeof window.Capacitor.nativePromise === "function") {
      if (!getBlobLikeSize(blob)) {
        throw new Error("无法保存空文件");
      }
      let writeResult = null;
      // Filesystem accepts base64, so keep each bridge request small. A single
      // whole-video conversion can temporarily require several times the Blob
      // size and causes low-memory Android WebViews to be killed.
      for (let offset = 0; offset < blob.size; offset += NATIVE_SAVE_CHUNK_SIZE) {
        const chunk = blob.slice(offset, Math.min(blob.size, offset + NATIVE_SAVE_CHUNK_SIZE));
        const base64 = await blobToBase64(chunk);
        const method = offset === 0 ? "writeFile" : "appendFile";
        const result = await window.Capacitor.nativePromise("Filesystem", method, {
          path: filename,
          data: base64,
          directory: "CACHE"
        });
        if (offset === 0) {
          writeResult = result;
        }
        // Let the WebView release the previous base64 string before the next
        // bridge call when exporting a large video.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const fileUri = writeResult && writeResult.uri || (await window.Capacitor.nativePromise("Filesystem", "getUri", {
        path: filename,
        directory: "CACHE"
      })).uri;
      await window.Capacitor.nativePromise("Share", "share", {
        title: filename,
        dialogTitle,
        url: fileUri
      });
      return;
    }

    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  }

  function createNativeVideoChunkWriter(filename, mimeType) {
    if (!isNativeDirectFileSaverAvailable()) {
      return null;
    }
    let uri = null;
    let pending = null;
    let queue = Promise.resolve();
    const enqueue = (blob, complete) => {
      if (!getBlobLikeSize(blob)) {
        return;
      }
      queue = queue.then(async () => {
        const result = await window.Capacitor.nativePromise("DirectFileSaver", "saveToDownloads", {
          filename,
          mimeType,
          data: await blobToBase64(blob),
          uri,
          append: Boolean(uri),
          complete
        });
        uri = result && result.uri ? result.uri : uri;
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    };
    return {
      append(blob) {
        const size = getBlobLikeSize(blob);
        if (!size || typeof blob.slice !== "function") {
          return;
        }
        for (let offset = 0; offset < size; offset += NATIVE_SAVE_CHUNK_SIZE) {
          const chunk = blob.slice(offset, Math.min(size, offset + NATIVE_SAVE_CHUNK_SIZE));
          if (pending) {
            enqueue(pending, false);
          }
          pending = chunk;
        }
      },
      async close() {
        if (pending) {
          enqueue(pending, true);
          pending = null;
        }
        await queue;
        if (!uri) {
          throw new Error("视频文件未写入下载目录");
        }
        return { uri, filename };
      }
    };
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(reader.error || new Error("文件编码失败"));
      reader.readAsDataURL(blob);
    });
  }

  async function copyCurrentAsset() {
    const asset = getCurrentAsset();
    if (!asset) {
      return;
    }

    const copyValue = asset.sourceUrl || asset.url;
    try {
      await navigator.clipboard.writeText(copyValue);
      showToast(asset.sourceUrl ? "来源图集链接已复制" : "图片链接已复制");
    } catch (_error) {
      const textarea = document.createElement("textarea");
      textarea.value = copyValue;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast(asset.sourceUrl ? "来源图集链接已复制" : "图片链接已复制");
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    toastTimer = setTimeout(() => {
      dom.toast.hidden = true;
    }, 2600);
  }

  let storyAssetDatabasePromise = null;
  let storyBgmSearchTimer = null;

  function createStoryState() {
    const fallback = {
      version: 1,
      title: "未命名剧情",
      region: "JP",
      aspect: "16:9",
      scenes: [createStoryScene()],
      bgm: null,
      localBackgrounds: [],
      localCharacters: []
    };
    let project = fallback;
    try {
      const saved = localStorage.getItem(STORY_PROJECT_STORAGE_KEY);
      if (saved) {
        project = normalizeStoryProject(JSON.parse(saved));
      }
    } catch (_error) {
      project = fallback;
    }
    return {
      open: false,
      projectId: readSetting(STORY_PROJECT_ACTIVE_KEY, "") || createStoryProjectId(),
      storageReady: false,
      projectLibraryOpen: false,
      projectLibraryTab: "projects",
      projectRecords: [],
      activeSceneId: project.scenes[0].id,
      selectedActorByScene: new Map(),
      activeTool: "dialogue",
      activeSidebar: "scenes",
      actorOptionsMode: "individual",
      selectedAnimationActorByScene: new Map(),
      uniformTransformSessionByScene: new Map(),
      project,
      imageCache: new Map(),
      objectUrls: new Set(),
      picker: {
        open: false,
        mode: "addActor",
        kind: "servant",
        servantClass: "all",
        servantRarity: "all",
        targetActorId: null,
        targetDialogueId: null,
        items: [],
        filteredItems: [],
        selectedCharacter: null,
        selectedSources: [],
        selectedSource: null,
        sourceAssets: [],
        loadController: null,
        detailController: null,
        extractionController: null,
        cache: new Map(),
        variantCache: new Map()
      },
      bgmPicker: {
        open: false,
        items: [],
        filteredItems: [],
        visibleCount: STORY_BGM_PAGE_SIZE,
        previewId: null,
        loadController: null,
        cache: new Map()
      },
      playbackFrame: null,
      playbackEnd: 0,
      videoExporting: false,
      videoExportFrame: null
    };
  }

  function createStoryProjectId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `project-${window.crypto.randomUUID()}`;
    }
    return `project-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createStoryActorInstanceId(scene) {
    let actorId;
    do {
      const suffix = window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      actorId = `actor-${suffix}`;
    } while (scene && scene.actors.some((actor) => actor.assetId === actorId));
    return actorId;
  }

  function createStoryScene() {
    const dialogue = createStoryDialogue();
    return {
      id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      duration: 4,
      background: null,
      actors: [],
      selectedActorId: null,
      dialogue,
      dialogues: [dialogue],
      activeDialogueId: dialogue.id,
      transition: "cut"
    };
  }

  function createStoryDialogue(value = {}) {
    const text = String(value.text || "").slice(0, 500);
    return {
      id: value.id || `dialogue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: value.actorId || null,
      speaker: String(value.speaker || "").slice(0, 40),
      text,
      typewriter: value.typewriter !== false,
      duration: Math.max(1, Math.min(120, Number(value.duration) || 4)),
      textColorRanges: normalizeStoryTextColorRanges(
        value.textColorRanges,
        text,
        value.textColorStart,
        value.textColor
      ),
      textFontSizeRanges: normalizeStoryTextFontSizeRanges(value.textFontSizeRanges, text),
      textRubyRanges: normalizeStoryTextRubyRanges(value.textRubyRanges, text),
      actorVariants: normalizeStoryDialogueVariants(value.actorVariants),
      actorColorModes: normalizeStoryDialogueColorModes(value.actorColorModes)
    };
  }

  function normalizeStoryTextColor(value, fallback = "#f3c86b") {
    const color = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
  }

  function compactStoryTextColors(colors) {
    const ranges = [];
    let start = 0;
    while (start < colors.length) {
      const color = normalizeStoryTextColor(colors[start], null);
      if (!color) {
        start += 1;
        continue;
      }
      let end = start + 1;
      while (end < colors.length && normalizeStoryTextColor(colors[end], null) === color) {
        end += 1;
      }
      ranges.push({ start, end, color });
      start = end;
    }
    return ranges;
  }

  function getStoryTextColorMap(ranges, textLength) {
    const colors = Array(Math.max(0, textLength)).fill(null);
    if (!Array.isArray(ranges)) {
      return colors;
    }
    ranges.forEach((range) => {
      if (!range || typeof range !== "object") {
        return;
      }
      const start = Math.max(0, Math.min(colors.length, Math.floor(Number(range.start) || 0)));
      const end = Math.max(start, Math.min(colors.length, Math.floor(Number(range.end) || 0)));
      const color = normalizeStoryTextColor(range.color, null);
      if (!color || end <= start) {
        return;
      }
      colors.fill(color, start, end);
    });
    return colors;
  }

  function normalizeStoryTextColorRanges(value, text, legacyStart = 0, legacyColor = "#f3c86b") {
    const textLength = Array.from(String(text || "")).length;
    if (Array.isArray(value)) {
      return compactStoryTextColors(getStoryTextColorMap(value, textLength));
    }
    const start = Math.max(0, Math.min(textLength, Math.floor(Number(legacyStart) || 0)));
    const color = normalizeStoryTextColor(legacyColor, null);
    return start > 0 && start < textLength && color
      ? [{ start, end: textLength, color }]
      : [];
  }

  function normalizeStoryTextFontScale(value, fallback = STORY_DIALOGUE_RANGE_FONT_SCALE_DEFAULT) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return fallback;
    }
    const scale = numericValue > 3 ? numericValue / 100 : numericValue;
    return Math.max(
      STORY_DIALOGUE_RANGE_FONT_SCALE_MIN,
      Math.min(STORY_DIALOGUE_RANGE_FONT_SCALE_MAX, scale)
    );
  }

  function compactStoryTextFontSizeRanges(sizes) {
    const ranges = [];
    let start = 0;
    while (start < sizes.length) {
      const scale = sizes[start];
      if (!Number.isFinite(scale)) {
        start += 1;
        continue;
      }
      let end = start + 1;
      while (end < sizes.length && sizes[end] === scale) {
        end += 1;
      }
      ranges.push({ start, end, scale });
      start = end;
    }
    return ranges;
  }

  function getStoryTextFontSizeMap(ranges, textLength) {
    const sizes = Array(Math.max(0, textLength)).fill(null);
    if (!Array.isArray(ranges)) {
      return sizes;
    }
    ranges.forEach((range) => {
      if (!range || typeof range !== "object") {
        return;
      }
      const start = Math.max(0, Math.min(sizes.length, Math.floor(Number(range.start) || 0)));
      const end = Math.max(start, Math.min(sizes.length, Math.floor(Number(range.end) || 0)));
      const scale = normalizeStoryTextFontScale(range.scale ?? range.fontSize, NaN);
      if (!Number.isFinite(scale) || end <= start) {
        return;
      }
      sizes.fill(scale, start, end);
    });
    return sizes;
  }

  function normalizeStoryTextFontSizeRanges(value, text) {
    const textLength = Array.from(String(text || "")).length;
    if (!Array.isArray(value)) {
      return [];
    }
    return compactStoryTextFontSizeRanges(
      getStoryTextFontSizeMap(value, textLength)
    );
  }

  function updateStoryTextFontSizeRangesForEdit(oldText, newText, ranges) {
    const oldCharacters = Array.from(String(oldText || ""));
    const newCharacters = Array.from(String(newText || ""));
    const oldSizes = getStoryTextFontSizeMap(ranges, oldCharacters.length);
    let prefixLength = 0;
    while (
      prefixLength < oldCharacters.length &&
      prefixLength < newCharacters.length &&
      oldCharacters[prefixLength] === newCharacters[prefixLength]
    ) {
      prefixLength += 1;
    }
    let suffixLength = 0;
    while (
      suffixLength < oldCharacters.length - prefixLength &&
      suffixLength < newCharacters.length - prefixLength &&
      oldCharacters[oldCharacters.length - suffixLength - 1] === newCharacters[newCharacters.length - suffixLength - 1]
    ) {
      suffixLength += 1;
    }
    const oldChangeEnd = oldCharacters.length - suffixLength;
    const newChangeEnd = newCharacters.length - suffixLength;
    let inheritedScale = null;
    if (oldChangeEnd > prefixLength) {
      const firstScale = oldSizes[prefixLength] ?? null;
      if (firstScale !== null && oldSizes.slice(prefixLength, oldChangeEnd).every((scale) => scale === firstScale)) {
        inheritedScale = firstScale;
      }
    } else {
      const beforeScale = oldSizes[prefixLength - 1] ?? null;
      const afterScale = oldSizes[prefixLength] ?? null;
      if (beforeScale !== null && beforeScale === afterScale) {
        inheritedScale = beforeScale;
      }
    }
    const nextSizes = [
      ...oldSizes.slice(0, prefixLength),
      ...Array(Math.max(0, newChangeEnd - prefixLength)).fill(inheritedScale),
      ...oldSizes.slice(oldChangeEnd)
    ];
    return compactStoryTextFontSizeRanges(nextSizes.slice(0, newCharacters.length));
  }

  function updateStoryTextColorRangesForEdit(oldText, newText, ranges) {
    const oldCharacters = Array.from(String(oldText || ""));
    const newCharacters = Array.from(String(newText || ""));
    const oldColors = getStoryTextColorMap(ranges, oldCharacters.length);
    let prefixLength = 0;
    while (
      prefixLength < oldCharacters.length &&
      prefixLength < newCharacters.length &&
      oldCharacters[prefixLength] === newCharacters[prefixLength]
    ) {
      prefixLength += 1;
    }
    let suffixLength = 0;
    while (
      suffixLength < oldCharacters.length - prefixLength &&
      suffixLength < newCharacters.length - prefixLength &&
      oldCharacters[oldCharacters.length - suffixLength - 1] === newCharacters[newCharacters.length - suffixLength - 1]
    ) {
      suffixLength += 1;
    }
    const oldChangeEnd = oldCharacters.length - suffixLength;
    const newChangeEnd = newCharacters.length - suffixLength;
    let inheritedColor = null;
    if (oldChangeEnd > prefixLength) {
      const firstColor = oldColors[prefixLength] || null;
      if (firstColor && oldColors.slice(prefixLength, oldChangeEnd).every((color) => color === firstColor)) {
        inheritedColor = firstColor;
      }
    } else {
      const beforeColor = oldColors[prefixLength - 1] || null;
      const afterColor = oldColors[prefixLength] || null;
      if (beforeColor && beforeColor === afterColor) {
        inheritedColor = beforeColor;
      }
    }
    const nextColors = [
      ...oldColors.slice(0, prefixLength),
      ...Array(Math.max(0, newChangeEnd - prefixLength)).fill(inheritedColor),
      ...oldColors.slice(oldChangeEnd)
    ];
    return compactStoryTextColors(nextColors.slice(0, newCharacters.length));
  }

  function normalizeStoryTextRubyRanges(value, text) {
    const textLength = Array.from(String(text || "")).length;
    if (!Array.isArray(value)) {
      return [];
    }
    const ranges = value.flatMap((range) => {
      if (!range || typeof range !== "object") {
        return [];
      }
      const start = Math.max(0, Math.min(textLength, Math.floor(Number(range.start) || 0)));
      const end = Math.max(start, Math.min(textLength, Math.floor(Number(range.end) || 0)));
      const ruby = String(range.ruby || range.text || "").trim().slice(0, 40);
      return end > start && ruby ? [{ start, end, ruby }] : [];
    });
    ranges.sort((left, right) => left.start - right.start || left.end - right.end);
    const normalized = [];
    ranges.forEach((range) => {
      const previous = normalized[normalized.length - 1];
      if (previous && range.start < previous.end) {
        return;
      }
      normalized.push(range);
    });
    return normalized;
  }

  function getStoryTextEditBounds(oldText, newText) {
    const oldCharacters = Array.from(String(oldText || ""));
    const newCharacters = Array.from(String(newText || ""));
    let prefixLength = 0;
    while (
      prefixLength < oldCharacters.length &&
      prefixLength < newCharacters.length &&
      oldCharacters[prefixLength] === newCharacters[prefixLength]
    ) {
      prefixLength += 1;
    }
    let suffixLength = 0;
    while (
      suffixLength < oldCharacters.length - prefixLength &&
      suffixLength < newCharacters.length - prefixLength &&
      oldCharacters[oldCharacters.length - suffixLength - 1] === newCharacters[newCharacters.length - suffixLength - 1]
    ) {
      suffixLength += 1;
    }
    return {
      oldLength: oldCharacters.length,
      newLength: newCharacters.length,
      oldStart: prefixLength,
      oldEnd: oldCharacters.length - suffixLength,
      newEnd: newCharacters.length - suffixLength
    };
  }

  function updateStoryTextRubyRangesForEdit(oldText, newText, ranges) {
    const edit = getStoryTextEditBounds(oldText, newText);
    const delta = edit.newLength - edit.oldLength;
    const nextRanges = normalizeStoryTextRubyRanges(ranges, oldText).flatMap((range) => {
      if (range.end <= edit.oldStart) {
        return [range];
      }
      if (range.start >= edit.oldEnd) {
        return [{ ...range, start: range.start + delta, end: range.end + delta }];
      }
      if (edit.oldStart === edit.oldEnd && range.start < edit.oldStart && range.end > edit.oldStart) {
        return [{ ...range, end: range.end + delta }];
      }
      return [];
    });
    return normalizeStoryTextRubyRanges(nextRanges, newText);
  }

  function normalizeStoryDialogueColorModes(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }
    return Object.fromEntries(Object.entries(value).flatMap(([actorId, mode]) => (
      actorId && ["auto", "color", "dim"].includes(mode)
        ? [[String(actorId), mode]]
        : []
    )));
  }

  function normalizeStoryDialogueVariants(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }
    return Object.fromEntries(Object.entries(value).flatMap(([actorId, variant]) => {
      if (!actorId || !variant || typeof variant !== "object") {
        return [];
      }
      return [[String(actorId), {
        ...variant,
        url: variant.generated && /^blob:/i.test(String(variant.url || "")) ? null : variant.url,
        thumbnailUrl: variant.generated && /^blob:/i.test(String(variant.thumbnailUrl || ""))
          ? null
          : variant.thumbnailUrl
      }]];
    }));
  }

  function normalizeLocalStoryVariant(value, index = 0) {
    if (!value || typeof value !== "object" || !value.cacheKey) {
      return null;
    }
    return {
      ...value,
      cacheKey: String(value.cacheKey),
      filename: String(value.filename || value.label || `差分-${index + 1}.png`),
      label: String(value.label || value.filename || `差分 ${index + 1}`),
      expressionIndex: Math.max(1, Number(value.expressionIndex) || index + 1),
      sourceIndex: Math.max(0, Number(value.sourceIndex) || 0),
      sourceUrl: String(value.sourceUrl || ""),
      mimeType: String(value.mimeType || "image/png"),
      generated: true,
      local: true,
      url: null,
      thumbnailUrl: null
    };
  }

  function normalizeLocalStoryCharacter(value, index = 0) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const variants = (Array.isArray(value.variants) ? value.variants : [])
      .map(normalizeLocalStoryVariant)
      .filter(Boolean);
    if (!variants.length) {
      return null;
    }
    const id = String(value.id || `local-character-${index + 1}`);
    return {
      ...value,
      id,
      name: String(value.name || value.originalName || `导入人物 ${index + 1}`).slice(0, 80),
      originalName: String(value.originalName || "本地导入"),
      local: true,
      variants,
      previewUrl: null,
      face: null
    };
  }

  function normalizeLocalStoryBackground(value, index = 0) {
    if (!value || typeof value !== "object" || !value.cacheKey) {
      return null;
    }
    return {
      ...value,
      id: String(value.id || `local-background-${index + 1}`),
      cacheKey: String(value.cacheKey),
      name: String(value.name || value.filename || `导入背景 ${index + 1}`).slice(0, 80),
      filename: String(value.filename || value.name || `background-${index + 1}.png`),
      mimeType: String(value.mimeType || "image/png"),
      backgroundTypeLabel: "本地图片",
      local: true,
      generated: true,
      face: null,
      url: null
    };
  }

  function normalizeStoryProject(value) {
    const project = value && typeof value === "object" ? value : {};
    const scenes = Array.isArray(project.scenes) && project.scenes.length
      ? project.scenes.map((scene) => {
        const legacyDialogue = createStoryDialogue({
          ...(scene.dialogue || {}),
          duration: scene.dialogue && scene.dialogue.duration != null
            ? scene.dialogue.duration
            : scene.duration
        });
        const dialogues = Array.isArray(scene.dialogues) && scene.dialogues.length
          ? scene.dialogues.map((dialogue) => createStoryDialogue(dialogue))
          : [legacyDialogue];
        const activeDialogue = dialogues.find((dialogue) => dialogue.id === scene.activeDialogueId) || dialogues[0];
        return {
          ...createStoryScene(),
          ...scene,
          id: scene.id || `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          duration: dialogues.reduce((total, dialogue) => total + dialogue.duration, 0),
          background: scene.background ? {
            ...scene.background,
            url: scene.background.local && /^blob:/i.test(String(scene.background.url || ""))
              ? null
              : scene.background.url
          } : null,
          selectedActorId: scene.selectedActorId || activeDialogue.actorId || null,
          actors: Array.isArray(scene.actors) ? scene.actors.map((actor) => ({
            ...actor,
            assetId: String(actor && (actor.assetId || actor.id) || createStoryActorInstanceId()),
            sourceCharacterId: String(actor && (
              actor.sourceCharacterId || actor.characterId || actor.assetId || actor.id
            ) || "unknown"),
            characterName: actor && (actor.characterName || actor.name) ? String(actor.characterName || actor.name).trim() : null,
            sourceCharacterName: actor && (actor.sourceCharacterName || actor.characterName || actor.name)
              ? String(actor.sourceCharacterName || actor.characterName || actor.name).trim()
              : null,
            url: actor && actor.generated && /^blob:/i.test(String(actor.url || "")) ? null : actor.url,
            thumbnailUrl: actor && actor.generated && /^blob:/i.test(String(actor.thumbnailUrl || ""))
              ? null
              : actor.thumbnailUrl,
            importedVariants: Array.isArray(actor && actor.importedVariants)
              ? actor.importedVariants.map((variant, index) => normalizeLocalStoryVariant(variant, index)).filter(Boolean)
              : null,
            scale: normalizeStoryActorTransform(actor && actor.scale, 1, 0.5, 2),
            offsetX: normalizeStoryActorTransform(actor && actor.offsetX, 0, -0.5, 0.5),
            offsetY: normalizeStoryActorTransform(actor && actor.offsetY, 0, -0.5, 0.5),
            colorMode: normalizeStoryActorColorMode(actor),
            entryAnimation: normalizeStoryActorEntryAnimation(
              actor && actor.entryAnimation != null ? actor.entryAnimation : scene.transition
            )
          })) : [],
          dialogue: activeDialogue,
          dialogues,
          activeDialogueId: activeDialogue.id
        };
      })
      : [createStoryScene()];
    return {
      version: 1,
      title: String(project.title || "未命名剧情").slice(0, 80),
      region: REGIONS.includes(project.region) ? project.region : "JP",
      aspect: project.aspect === "9:16" ? "9:16" : "16:9",
      scenes,
      bgm: normalizeStoryBgm(project.bgm),
      localBackgrounds: (Array.isArray(project.localBackgrounds) ? project.localBackgrounds : [])
        .map(normalizeLocalStoryBackground)
        .filter(Boolean),
      localCharacters: (Array.isArray(project.localCharacters) ? project.localCharacters : [])
        .map(normalizeLocalStoryCharacter)
        .filter(Boolean)
    };
  }

  function normalizeStoryBgm(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const local = Boolean(value.local);
    const url = String(value.url || value.audioAsset || "").trim();
    if (!url && !local) {
      return null;
    }
    return {
      ...value,
      id: value.id == null ? null : String(value.id),
      name: String(value.name || value.fileName || "本地音频").trim(),
      url,
      audioAsset: String(value.audioAsset || url).trim(),
      local,
      source: local ? "local" : String(value.source || "atlas"),
      cacheKey: value.cacheKey ? String(value.cacheKey) : null
    };
  }

  function getActiveStoryScene() {
    const scenes = state.story.project.scenes;
    return scenes.find((scene) => scene.id === state.story.activeSceneId) || scenes[0];
  }

  function normalizeStoryActorTransform(value, fallback, minimum, maximum) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
  }

  function normalizeStoryActorColorMode(actor) {
    if (actor && ["auto", "color", "dim"].includes(actor.colorMode)) {
      return actor.colorMode;
    }
    return actor && actor.dimWhenInactive === false ? "color" : "auto";
  }

  function normalizeStoryActorEntryAnimation(value) {
    return ["cut", "fade", "slide-left", "slide-right", "flash"].includes(value) ? value : "cut";
  }

  function getStoryDialogues(scene) {
    if (!Array.isArray(scene.dialogues) || !scene.dialogues.length) {
      const dialogue = createStoryDialogue({ ...(scene.dialogue || {}), duration: scene.duration });
      scene.dialogues = [dialogue];
      scene.activeDialogueId = dialogue.id;
      scene.dialogue = dialogue;
    }
    return scene.dialogues;
  }

  function getActiveStoryDialogue(scene) {
    const dialogues = getStoryDialogues(scene);
    const dialogue = dialogues.find((item) => item.id === scene.activeDialogueId) || dialogues[0];
    scene.activeDialogueId = dialogue.id;
    scene.dialogue = dialogue;
    return dialogue;
  }

  function getStoryDialogueActorVariant(dialogue, actorId) {
    return dialogue && dialogue.actorVariants && dialogue.actorVariants[actorId]
      ? dialogue.actorVariants[actorId]
      : null;
  }

  function getStoryDialogueActorColorMode(dialogue, actor) {
    const override = dialogue && dialogue.actorColorModes && dialogue.actorColorModes[actor.assetId];
    return ["auto", "color", "dim"].includes(override)
      ? override
      : normalizeStoryActorColorMode(actor);
  }

  function getStoryActorsForDialogue(scene, dialogue) {
    return scene.actors.map((actor) => {
      const variant = getStoryDialogueActorVariant(dialogue, actor.assetId);
      const colorMode = getStoryDialogueActorColorMode(dialogue, actor);
      if (!variant) {
        return { ...actor, colorMode };
      }
      // A persisted/generated variant can temporarily have no URL while its
      // cached blob is being restored. Keep the base actor visible meanwhile.
      const variantUrl = typeof variant.url === "string" && variant.url.trim()
        ? variant.url
        : actor.url;
      const variantThumbnailUrl = typeof variant.thumbnailUrl === "string" && variant.thumbnailUrl.trim()
        ? variant.thumbnailUrl
        : actor.thumbnailUrl;
      return {
        ...actor,
        colorMode,
        url: variantUrl,
        thumbnailUrl: variantThumbnailUrl,
        sourceUrl: variant.sourceUrl || actor.sourceUrl,
        sourceIndex: variant.sourceIndex ?? actor.sourceIndex,
        expressionIndex: variant.expressionIndex ?? actor.expressionIndex,
        cacheKey: variant.cacheKey || actor.cacheKey,
        thumbnailCacheKey: variant.thumbnailCacheKey || actor.thumbnailCacheKey,
        label: variant.label || actor.label,
        filename: variant.filename || actor.filename,
        generated: Boolean(variant.generated || actor.generated)
      };
    });
  }

  function createStoryRenderScene(
    scene,
    dialogue = getActiveStoryDialogue(scene),
    animateActors = false,
    actorAnimationProgress = 1
  ) {
    return {
      ...scene,
      actors: getStoryActorsForDialogue(scene, dialogue),
      dialogue,
      animateActors: Boolean(animateActors),
      actorAnimationProgress: Math.max(0, Math.min(1, Number(actorAnimationProgress) || 0))
    };
  }

  function syncStorySceneDuration(scene) {
    scene.duration = getStoryDialogues(scene).reduce((total, dialogue) => total + dialogue.duration, 0);
  }

  function serializeStoryProject(source = state.story.project) {
    const project = JSON.parse(JSON.stringify(source));
    if (project.bgm && project.bgm.local) {
      project.bgm.url = null;
      project.bgm.audioAsset = null;
    }
    project.scenes.forEach((scene) => {
      if (scene.background && scene.background.local) {
        scene.background.url = null;
      }
      scene.actors.forEach((actor) => {
        if (actor.generated) {
          actor.url = null;
          actor.thumbnailUrl = null;
        }
      });
      (scene.dialogues || []).forEach((dialogue) => {
        Object.values(dialogue.actorVariants || {}).forEach((variant) => {
          if (variant && variant.generated) {
            variant.url = null;
            variant.thumbnailUrl = null;
          }
        });
      });
    });
    (project.localBackgrounds || []).forEach((background) => {
      background.url = null;
      background.face = null;
    });
    (project.localCharacters || []).forEach((character) => {
      character.previewUrl = null;
      character.face = null;
      (character.variants || []).forEach((variant) => {
        variant.url = null;
        variant.thumbnailUrl = null;
      });
    });
    return project;
  }

  function updateStoryProjectSaveStatus(label, stateName = "saved") {
    if (!dom.storyProjectSaveStatus) {
      return;
    }
    dom.storyProjectSaveStatus.textContent = label;
    dom.storyProjectSaveStatus.dataset.state = stateName;
  }

  function saveStoryProject(options = {}) {
    if (options.deferred) {
      scheduleStoryProjectAutosave();
      return;
    }
    try {
      const project = serializeStoryProject();
      localStorage.setItem(STORY_PROJECT_STORAGE_KEY, JSON.stringify(project));
      localStorage.setItem(STORY_PROJECT_ACTIVE_KEY, state.story.projectId);
      scheduleStoryProjectAutosave(project);
    } catch (_error) {
      updateStoryProjectSaveStatus("本地保存不可用", "error");
    }
  }

  function setStoryGeneratorOpen(open) {
    if (!open && state.story.playbackFrame) {
      cancelAnimationFrame(state.story.playbackFrame);
      state.story.playbackFrame = null;
      dom.storyPlayButton.textContent = "▶";
    }
    if (!open && storyRenderer && typeof storyRenderer.clearImageCache === "function") {
      storyRenderer.clearImageCache();
    }
    state.story.open = Boolean(open);
    dom.storyGeneratorPanel.hidden = !state.story.open;
    const shell = document.querySelector(".app-shell");
    shell.classList.toggle("is-story-generator-open", state.story.open);
    if (state.story.open) {
      renderStoryEditor();
      hydrateStoryAssetUrls();
    }
  }

  function setMorePanelOpen(open) {
    const isOpen = Boolean(open);
    dom.morePanel.hidden = !isOpen;
    document.querySelector(".app-shell").classList.toggle("is-more-open", isOpen);
  }

  function setSupportPanelOpen(open) {
    const isOpen = Boolean(open);
    dom.supportPanel.hidden = !isOpen;
    document.querySelector(".app-shell").classList.toggle("is-support-open", isOpen);
  }

  function openStoryAssetDatabase() {
    if (!window.indexedDB) {
      return Promise.reject(new Error("IndexedDB unavailable"));
    }
    if (!storyAssetDatabasePromise) {
      storyAssetDatabasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(STORY_ASSET_DATABASE_NAME, STORY_DATABASE_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORY_ASSET_STORE_NAME)) {
            database.createObjectStore(STORY_ASSET_STORE_NAME);
          }
          if (!database.objectStoreNames.contains(STORY_PROJECT_STORE_NAME)) {
            const store = database.createObjectStore(STORY_PROJECT_STORE_NAME, { keyPath: "id" });
            store.createIndex("updatedAt", "updatedAt");
            store.createIndex("deletedAt", "deletedAt");
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Unable to open story asset database"));
      });
    }
    return storyAssetDatabasePromise;
  }

  async function writeStoryAssetBlob(key, blob) {
    const database = await openStoryAssetDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORY_ASSET_STORE_NAME, "readwrite");
      transaction.objectStore(STORY_ASSET_STORE_NAME).put(blob, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Unable to cache story asset"));
    });
  }

  async function deleteStoryAssetBlob(key) {
    if (!key) {
      return;
    }
    const database = await openStoryAssetDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORY_ASSET_STORE_NAME, "readwrite");
      transaction.objectStore(STORY_ASSET_STORE_NAME).delete(key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Unable to remove story asset"));
    });
  }

  async function readStoryAssetBlob(key) {
    const database = await openStoryAssetDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORY_ASSET_STORE_NAME, "readonly");
      const request = transaction.objectStore(STORY_ASSET_STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Unable to read story asset"));
    });
  }

  function runStoryProjectStore(mode, callback) {
    return openStoryAssetDatabase().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction(STORY_PROJECT_STORE_NAME, mode);
      const store = transaction.objectStore(STORY_PROJECT_STORE_NAME);
      let result;
      try {
        result = callback(store, transaction);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || new Error("Unable to access story projects"));
      transaction.onabort = () => reject(transaction.error || new Error("Story project transaction aborted"));
    }));
  }

  async function readStoryProjectRecord(projectId) {
    const database = await openStoryAssetDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORY_PROJECT_STORE_NAME, "readonly");
      const request = transaction.objectStore(STORY_PROJECT_STORE_NAME).get(projectId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Unable to read story project"));
    });
  }

  async function readAllStoryProjectRecords() {
    const database = await openStoryAssetDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORY_PROJECT_STORE_NAME, "readonly");
      const request = transaction.objectStore(STORY_PROJECT_STORE_NAME).getAll();
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => reject(request.error || new Error("Unable to list story projects"));
    });
  }

  function writeStoryProjectRecord(record) {
    return runStoryProjectStore("readwrite", (store) => store.put(record));
  }

  function deleteStoryProjectRecord(projectId) {
    return runStoryProjectStore("readwrite", (store) => store.delete(projectId));
  }

  function createStoryProjectRecord(projectId, project, existing = null) {
    const now = new Date().toISOString();
    return {
      id: projectId,
      title: String(project.title || "未命名剧情").slice(0, 80),
      createdAt: existing && existing.createdAt ? existing.createdAt : now,
      updatedAt: now,
      deletedAt: null,
      project: serializeStoryProject(project)
    };
  }

  function scheduleStoryProjectAutosave(project = null) {
    pendingStoryProjectSave = {
      projectId: state.story.projectId,
      // Deferred edits are serialized only when the idle save actually runs.
      project
    };
    updateStoryProjectSaveStatus("正在自动保存", "saving");
    window.clearTimeout(storyProjectAutosaveTimer);
    storyProjectAutosaveTimer = window.setTimeout(() => {
      storyProjectAutosaveTimer = null;
      flushStoryProjectSave().catch(() => {});
    }, STORY_PROJECT_AUTOSAVE_DELAY);
  }

  function flushStoryProjectSave() {
    window.clearTimeout(storyProjectAutosaveTimer);
    storyProjectAutosaveTimer = null;
    const pending = pendingStoryProjectSave;
    if (!pending) {
      return storyProjectWriteQueue;
    }
    const serializedProject = pending.project || serializeStoryProject();
    try {
      localStorage.setItem(STORY_PROJECT_STORAGE_KEY, JSON.stringify(serializedProject));
      localStorage.setItem(STORY_PROJECT_ACTIVE_KEY, pending.projectId);
    } catch (_error) {
      // IndexedDB remains the durable fallback when localStorage is full.
    }
    if (!state.story.storageReady) {
      return storyProjectWriteQueue;
    }
    pendingStoryProjectSave = null;
    storyProjectWriteQueue = storyProjectWriteQueue.catch(() => {}).then(async () => {
      const existing = await readStoryProjectRecord(pending.projectId);
      if (existing && existing.deletedAt) {
        return;
      }
      const record = createStoryProjectRecord(pending.projectId, serializedProject, existing);
      await writeStoryProjectRecord(record);
      if (state.story.projectId === pending.projectId) {
        updateStoryProjectSaveStatus("已自动保存到本机", "saved");
      }
    }).catch((error) => {
      if (state.story.projectId === pending.projectId) {
        updateStoryProjectSaveStatus("本地保存失败", "error");
      }
      throw error;
    });
    return storyProjectWriteQueue;
  }

  async function refreshStoryProjectRecords() {
    const records = await readAllStoryProjectRecords();
    state.story.projectRecords = records.sort((left, right) =>
      String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""))
    );
    return state.story.projectRecords;
  }

  function releaseStoryProjectObjectUrls() {
    state.story.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.story.objectUrls.clear();
    const bgm = state.story.project && state.story.project.bgm;
    if (bgm && bgm.local && /^blob:/i.test(String(bgm.url || ""))) {
      URL.revokeObjectURL(bgm.url);
    }
  }

  function applyStoryProject(projectId, project) {
    releaseStoryProjectObjectUrls();
    state.story.projectId = projectId;
    state.story.project = normalizeStoryProject(project);
    state.story.activeSceneId = state.story.project.scenes[0].id;
    state.story.selectedActorByScene.clear();
    state.story.selectedAnimationActorByScene.clear();
    state.story.uniformTransformSessionByScene.clear();
    localStorage.setItem(STORY_PROJECT_ACTIVE_KEY, projectId);
    localStorage.setItem(STORY_PROJECT_STORAGE_KEY, JSON.stringify(serializeStoryProject()));
    if (state.story.open) {
      renderStoryEditor();
    }
    hydrateStoryAssetUrls().catch(() => {});
  }

  async function initializeStoryProjectStorage() {
    try {
      await openStoryAssetDatabase();
      const records = await refreshStoryProjectRecords();
      const activeRecords = records.filter((record) => !record.deletedAt);
      let localProject = null;
      try {
        const raw = localStorage.getItem(STORY_PROJECT_STORAGE_KEY);
        localProject = raw ? normalizeStoryProject(JSON.parse(raw)) : null;
      } catch (_error) {
        localProject = null;
      }
      let activeRecord = activeRecords.find((record) => record.id === state.story.projectId) || null;
      if (!activeRecord && !localProject) {
        activeRecord = activeRecords[0] || null;
      }
      if (localProject) {
        state.story.project = localProject;
        await writeStoryProjectRecord(createStoryProjectRecord(
          state.story.projectId,
          localProject,
          activeRecord
        ));
      } else if (activeRecord) {
        applyStoryProject(activeRecord.id, activeRecord.project);
      } else {
        await writeStoryProjectRecord(createStoryProjectRecord(
          state.story.projectId,
          state.story.project
        ));
      }
      state.story.storageReady = true;
      await refreshStoryProjectRecords();
      updateStoryProjectSaveStatus("已自动保存到本机", "saved");
      if (pendingStoryProjectSave) {
        await flushStoryProjectSave();
      }
    } catch (_error) {
      state.story.storageReady = false;
      updateStoryProjectSaveStatus("作品库不可用，仅保留临时记录", "error");
    }
  }

  function getStoryVariantCacheKey(picker, source) {
    const characterId = picker.selectedCharacter && picker.selectedCharacter.id
      ? picker.selectedCharacter.id
      : "unknown";
    return `variant-set:v${STORY_VARIANT_CACHE_VERSION}:${state.region}:${characterId}:${source.url}`;
  }

  async function writeStoryVariantSetCache(cacheKey, assets) {
    const database = await openStoryAssetDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORY_ASSET_STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORY_ASSET_STORE_NAME);
      const records = assets.filter((asset) => asset && asset.blob).map((asset, index) => {
        const blobKey = `${cacheKey}:image:${index}`;
        const thumbnailBlobKey = asset.thumbnailBlob ? `${cacheKey}:face:${index}` : null;
        store.put(asset.blob, blobKey);
        if (thumbnailBlobKey) {
          store.put(asset.thumbnailBlob, thumbnailBlobKey);
        }
        const {
          url: _url,
          blob: _blob,
          thumbnailUrl: _thumbnailUrl,
          thumbnailBlob: _thumbnailBlob,
          ...metadata
        } = asset;
        return { ...metadata, blobKey, thumbnailBlobKey };
      });
      store.put({
        version: STORY_VARIANT_CACHE_VERSION,
        createdAt: Date.now(),
        assets: records
      }, `${cacheKey}:manifest`);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Unable to cache figure variants"));
      transaction.onabort = () => reject(transaction.error || new Error("Unable to cache figure variants"));
    });
  }

  async function readStoryVariantSetCache(cacheKey) {
    const manifest = await readStoryAssetBlob(`${cacheKey}:manifest`);
    if (!manifest || manifest.version !== STORY_VARIANT_CACHE_VERSION || !Array.isArray(manifest.assets)) {
      return [];
    }
    const assets = await Promise.all(manifest.assets.map(async (record) => {
      const [blob, thumbnailBlob] = await Promise.all([
        readStoryAssetBlob(record.blobKey),
        record.thumbnailBlobKey ? readStoryAssetBlob(record.thumbnailBlobKey) : Promise.resolve(null)
      ]);
      if (!blob) {
        return null;
      }
      const { blobKey: _blobKey, thumbnailBlobKey: _thumbnailBlobKey, ...metadata } = record;
      return { ...metadata, blob, thumbnailBlob };
    }));
    return assets.filter(Boolean);
  }

  function createStoryPickerAssetUrls(asset) {
    return {
      ...asset,
      url: URL.createObjectURL(asset.blob),
      thumbnailUrl: asset.thumbnailBlob ? URL.createObjectURL(asset.thumbnailBlob) : null
    };
  }

  async function hydrateStoryAssetUrls() {
    const resources = state.story.project.scenes.flatMap((scene) => [
      scene.background,
      ...scene.actors,
      ...getStoryDialogues(scene).flatMap((dialogue) => Object.values(dialogue.actorVariants || {}))
    ])
      .filter((actor) => actor && (actor.generated || actor.local) && actor.cacheKey && (
        !actor.url || (actor.thumbnailCacheKey && !actor.thumbnailUrl)
      ));
    await Promise.all(resources.map(async (actor) => {
      try {
        if (!actor.url) {
          const blob = await readStoryAssetBlob(actor.cacheKey);
          if (blob) {
            actor.url = URL.createObjectURL(blob);
            state.story.objectUrls.add(actor.url);
          }
        }
        if (!actor.thumbnailUrl && actor.thumbnailCacheKey) {
          const thumbnailBlob = await readStoryAssetBlob(actor.thumbnailCacheKey);
          if (thumbnailBlob) {
            actor.thumbnailUrl = URL.createObjectURL(thumbnailBlob);
            state.story.objectUrls.add(actor.thumbnailUrl);
          }
        }
      } catch (_error) {
        // The source metadata remains available for a later re-extraction flow.
      }
    }));
    const bgm = state.story.project.bgm;
    if (bgm && bgm.local && bgm.cacheKey && !bgm.url) {
      try {
        const blob = await readStoryAssetBlob(bgm.cacheKey);
        if (blob instanceof Blob && blob.size) {
          bgm.url = URL.createObjectURL(blob);
          bgm.audioAsset = bgm.url;
          state.story.objectUrls.add(bgm.url);
        }
      } catch (_error) {
        // The project remains editable even if a local audio file was removed.
      }
    }
    if (state.story.open) {
      renderStoryEditor();
    }
  }

  function renderStoryEditor() {
    const project = state.story.project;
    dom.storyProjectName.value = project.title;
    dom.storyAspectSelect.value = project.aspect;
    updateStoryDialogueFontSizeControl();
    dom.storySceneCount.textContent = `${project.scenes.length} 张`;
    renderStorySceneList();
    updateStorySceneControls();
    updateStoryBgmStatus();
  }

  function renderStorySceneList() {
    const activeScene = getActiveStoryScene();
    dom.storySceneList.replaceChildren();
    state.story.project.scenes.forEach((scene, index) => {
      const button = document.createElement("button");
      button.className = "story-scene-card";
      button.type = "button";
      button.dataset.sceneId = scene.id;
      button.classList.toggle("is-active", scene.id === activeScene.id);
      button.addEventListener("click", () => {
        state.story.activeSceneId = scene.id;
        renderStoryEditor();
      });
      const thumb = document.createElement("span");
      thumb.className = "story-scene-thumb";
      if (scene.background && scene.background.url) {
        const image = document.createElement("img");
        image.src = scene.background.url;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        thumb.append(image);
      } else {
        thumb.textContent = String(index + 1).padStart(2, "0");
      }
      const copy = document.createElement("span");
      copy.className = "story-scene-copy";
      const title = document.createElement("strong");
      title.textContent = `分镜 ${index + 1}`;
      const meta = document.createElement("span");
      const dialogues = getStoryDialogues(scene);
      const firstText = dialogues.find((dialogue) => dialogue.text)?.text || "";
      meta.textContent = `${scene.duration} 秒 · ${dialogues.length} 段${firstText ? ` · ${firstText}` : " · 空白画面"}`;
      copy.append(title, meta);
      button.append(thumb, copy);
      dom.storySceneList.append(button);
    });
  }

  function updateStorySceneListItem(scene) {
    if (!scene || !dom.storySceneList) {
      return;
    }
    const item = Array.from(dom.storySceneList.children).find((node) => node.dataset.sceneId === scene.id);
    if (!item) {
      return;
    }
    const dialogues = getStoryDialogues(scene);
    const firstText = dialogues.find((dialogue) => dialogue.text)?.text || "";
    const meta = item.querySelector(".story-scene-copy span");
    if (meta) {
      meta.textContent = `${scene.duration} 秒 · ${dialogues.length} 段${firstText ? ` · ${firstText}` : " · 空白画面"}`;
    }
  }

  function setStoryTool(tool) {
    const validTools = new Set(["resources", "dialogue", "animation"]);
    const activeTool = validTools.has(tool) ? tool : "dialogue";
    state.story.activeTool = activeTool;
    dom.storyToolTabs.querySelectorAll("[data-story-tool]").forEach((button) => {
      const active = button.dataset.storyTool === activeTool;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-story-tool-panel]").forEach((panel) => {
      const active = panel.dataset.storyToolPanel === activeTool;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  }

  function setStorySidebar(sidebar) {
    const activeSidebar = sidebar === "dialogues" ? "dialogues" : "scenes";
    state.story.activeSidebar = activeSidebar;
    dom.storySidebarTabs.querySelectorAll("[data-story-sidebar]").forEach((button) => {
      const active = button.dataset.storySidebar === activeSidebar;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-story-sidebar-panel]").forEach((panel) => {
      const active = panel.dataset.storySidebarPanel === activeSidebar;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  }

  function updateStorySceneControls() {
    const scene = getActiveStoryScene();
    if (!scene) {
      return;
    }
    const index = state.story.project.scenes.indexOf(scene);
    const dialogue = getActiveStoryDialogue(scene);
    dom.storyActiveSceneLabel.textContent = `分镜 ${index + 1} / ${state.story.project.scenes.length}`;
    dom.storySpeakerInput.value = dialogue.speaker || "";
    dom.storySpeakerInput.readOnly = Boolean(dialogue.actorId);
    dom.storySpeakerInput.title = dialogue.actorId
      ? "人物名称请在人物通用选项中修改"
      : "旁白名称可选，留空时不显示姓名栏";
    dom.storyDialogueInput.value = dialogue.text || "";
    updateStoryDialogueColorControls(dialogue);
    dom.storyDurationInput.value = String(dialogue.duration);
    dom.storyDeleteSceneButton.disabled = state.story.project.scenes.length <= 1;
    dom.storyActorToolCount.textContent = String(scene.actors.length);
    dom.storyDialogueToolCount.textContent = String(getStoryDialogues(scene).length);
    dom.storyAnimationToolCount.textContent = String(scene.actors.length);
    dom.storySidebarDialogueCount.textContent = String(getStoryDialogues(scene).length);
    renderStoryDialogueList(scene);
    renderStoryActorList(scene);
    renderStoryAnimationOptions(scene);
    renderStoryDialogueVariantControls(scene);
    renderStoryResourceSummary(scene);
    setStoryTool(state.story.activeTool);
    setStorySidebar(state.story.activeSidebar);
    const hasVisual = Boolean(scene.background || scene.actors.length || getStoryDialogues(scene).some((item) => item.text));
    dom.storyPreviewEmpty.hidden = hasVisual;
    renderStoryCanvas(scene, 1);
  }

  function renderStoryResourceSummary(scene) {
    dom.storyResourceSummary.replaceChildren();
    const resources = [];
    const background = document.createElement("div");
    background.className = "story-resource-summary-item";
    const backgroundTitle = document.createElement("strong");
    backgroundTitle.textContent = "剧情背景";
    const backgroundValue = document.createElement("span");
    backgroundValue.textContent = scene.background
      ? (scene.background.label || scene.background.filename || "已选择背景")
      : "尚未选择";
    background.append(backgroundTitle, backgroundValue);
    resources.push(background);

    const actors = document.createElement("div");
    actors.className = "story-resource-summary-item";
    const actorsTitle = document.createElement("strong");
    actorsTitle.textContent = "剧情人物";
    const actorsValue = document.createElement("span");
    actorsValue.textContent = scene.actors.length
      ? scene.actors.map((actor, index) => getStoryActorSelectionLabel(scene, actor, index)).join("、")
      : "尚未选择";
    actors.append(actorsTitle, actorsValue);
    resources.push(actors);

    const bgm = document.createElement("div");
    bgm.className = "story-resource-summary-item";
    const bgmTitle = document.createElement("strong");
    bgmTitle.textContent = "BGM";
    const bgmValue = document.createElement("span");
    bgmValue.textContent = state.story.project.bgm
      ? (state.story.project.bgm.name || "已导入音频")
      : "未设置";
    bgm.append(bgmTitle, bgmValue);
    resources.push(bgm);
    dom.storyResourceSummary.append(...resources);
  }

  function renderStoryDialogueList(scene) {
    const dialogues = getStoryDialogues(scene);
    const activeDialogue = getActiveStoryDialogue(scene);
    dom.storyDialogueSummary.textContent = `${dialogues.length} 段 · 共 ${scene.duration} 秒`;
    dom.storyDialogueList.replaceChildren();
    dialogues.forEach((dialogue, index) => {
      const item = document.createElement("div");
      item.className = "story-dialogue-item";
      item.dataset.dialogueId = dialogue.id;
      item.classList.toggle("is-active", dialogue.id === activeDialogue.id);

      const select = document.createElement("button");
      select.className = "story-dialogue-select";
      select.type = "button";
      select.setAttribute("aria-pressed", String(dialogue.id === activeDialogue.id));
      select.addEventListener("click", () => selectStoryDialogue(scene, dialogue.id));
      const number = document.createElement("span");
      number.className = "story-dialogue-number";
      number.textContent = String(index + 1).padStart(2, "0");
      const copy = document.createElement("span");
      copy.className = "story-dialogue-copy";
      const speaker = document.createElement("strong");
      speaker.textContent = dialogue.speaker || "旁白";
      const excerpt = document.createElement("small");
      excerpt.textContent = dialogue.text || "尚未填写台词";
      copy.append(speaker, excerpt);
      const duration = document.createElement("small");
      duration.className = "story-dialogue-duration";
      const variantCount = Object.keys(dialogue.actorVariants || {}).length;
      duration.textContent = variantCount ? `${dialogue.duration}s · ${variantCount}差分` : `${dialogue.duration}s`;
      select.append(number, copy, duration);

      const remove = document.createElement("button");
      remove.className = "story-dialogue-remove";
      remove.type = "button";
      remove.disabled = dialogues.length <= 1;
      remove.title = dialogues.length <= 1 ? "至少保留一段对话" : `删除对话 ${index + 1}`;
      remove.setAttribute("aria-label", remove.title);
      remove.textContent = "×";
      remove.addEventListener("click", () => removeStoryDialogue(scene, dialogue.id));
      item.append(select, remove);
      dom.storyDialogueList.append(item);
    });
  }

  function updateStoryDialogueListItem(scene, dialogue) {
    if (!scene || !dialogue || !dom.storyDialogueList) {
      return;
    }
    const item = Array.from(dom.storyDialogueList.children).find((node) => node.dataset.dialogueId === dialogue.id);
    if (!item) {
      return;
    }
    const speaker = item.querySelector(".story-dialogue-copy strong");
    const excerpt = item.querySelector(".story-dialogue-copy small");
    const duration = item.querySelector(".story-dialogue-duration");
    const variantCount = Object.keys(dialogue.actorVariants || {}).length;
    if (speaker) {
      speaker.textContent = dialogue.speaker || "旁白";
    }
    if (excerpt) {
      excerpt.textContent = dialogue.text || "尚未填写台词";
    }
    if (duration) {
      duration.textContent = variantCount ? `${dialogue.duration}s · ${variantCount}差分` : `${dialogue.duration}s`;
    }
    dom.storyDialogueSummary.textContent = `${getStoryDialogues(scene).length} 段 · 共 ${scene.duration} 秒`;
  }

  function renderStoryDialogueVariantControls(scene) {
    const dialogue = getActiveStoryDialogue(scene);
    dom.storyDialogueVariantList.replaceChildren();
    dom.storyDialogueVariantsPanel.hidden = !scene.actors.length;
    if (!scene.actors.length) {
      return;
    }
    const dialogueIndex = getStoryDialogues(scene).indexOf(dialogue);
    dom.storyDialogueVariantsSummary.textContent = `对话 ${String(dialogueIndex + 1).padStart(2, "0")}`;
    scene.actors.forEach((actor, actorIndex) => {
      const variant = getStoryDialogueActorVariant(dialogue, actor.assetId);
      const activeAsset = variant || actor;
      const item = document.createElement("div");
      item.className = "story-dialogue-variant-item";
      item.classList.toggle("is-overridden", Boolean(variant));

      const thumb = document.createElement("span");
      thumb.className = "story-dialogue-variant-thumb";
      if (activeAsset.thumbnailUrl || activeAsset.url) {
        const image = document.createElement("img");
        image.src = activeAsset.thumbnailUrl || activeAsset.url;
        image.className = activeAsset.thumbnailUrl ? "is-face-thumbnail" : "is-figure-thumbnail";
        image.alt = "";
        thumb.append(image);
      }
      const copy = document.createElement("span");
      copy.className = "story-dialogue-variant-copy";
      const name = document.createElement("strong");
      name.textContent = getStoryActorSelectionLabel(scene, actor, actorIndex);
      const detail = document.createElement("small");
      detail.textContent = variant
        ? `本段：立绘差分 ${variant.expressionIndex || "--"}`
        : `本段：沿用默认立绘 ${actor.expressionIndex || "--"}`;
      copy.append(name, detail);

      const colorMode = document.createElement("select");
      colorMode.className = "story-dialogue-variant-color-mode";
      colorMode.dataset.actorId = actor.assetId;
      colorMode.setAttribute("aria-label", `${name.textContent}本段明暗`);
      [
        ["auto", "自动随发言"],
        ["color", "保持彩色"],
        ["dim", "变灰" ]
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        colorMode.append(option);
      });
      colorMode.value = getStoryDialogueActorColorMode(dialogue, actor);
      colorMode.addEventListener("change", () => updateStoryDialogueActorColorMode(actor.assetId, colorMode.value));

      const actions = document.createElement("span");
      actions.className = "story-dialogue-variant-actions";
      const choose = document.createElement("button");
      choose.className = "secondary-button story-dialogue-variant-choose";
      choose.type = "button";
      choose.textContent = "选择差分";
      choose.addEventListener("click", () => openStoryDialogueVariantPicker(actor.assetId));
      actions.append(choose);
      if (variant) {
        const reset = document.createElement("button");
        reset.className = "secondary-button story-dialogue-variant-reset";
        reset.type = "button";
        reset.textContent = "恢复默认";
        reset.addEventListener("click", () => resetStoryDialogueActorVariant(actor.assetId));
        actions.append(reset);
      }
      item.append(thumb, copy, colorMode, actions);
      dom.storyDialogueVariantList.append(item);
    });
  }

  function updateStoryDialogueActorColorMode(actorId, value) {
    const scene = getActiveStoryScene();
    const dialogue = scene && getActiveStoryDialogue(scene);
    if (!scene || !dialogue || !scene.actors.some((actor) => actor.assetId === actorId)) {
      return;
    }
    dialogue.actorColorModes ||= {};
    dialogue.actorColorModes[actorId] = ["auto", "color", "dim"].includes(value) ? value : "auto";
    saveStoryProject();
    renderStoryDialogueVariantControls(scene);
    renderStoryCanvas(scene, 1);
  }

  function selectStoryDialogue(scene, dialogueId) {
    const dialogue = getStoryDialogues(scene).find((item) => item.id === dialogueId);
    if (!dialogue) {
      return;
    }
    scene.activeDialogueId = dialogue.id;
    scene.dialogue = dialogue;
    state.story.activeTool = "dialogue";
    state.story.activeSidebar = "dialogues";
    saveStoryProject();
    updateStorySceneControls();
  }

  function addStoryDialogue() {
    const scene = getActiveStoryScene();
    if (!scene) {
      return;
    }
    const current = getActiveStoryDialogue(scene);
    const actor = scene.actors.find((item) => item.assetId === current.actorId) || scene.actors[0] || null;
    const actorIndex = actor ? scene.actors.indexOf(actor) : -1;
    const dialogue = createStoryDialogue({
      actorId: actor ? actor.assetId : null,
      speaker: actor ? getStoryActorDisplayName(actor, actorIndex) : "",
      duration: current.duration,
      textColorRanges: current.textColorRanges,
      textFontSizeRanges: current.textFontSizeRanges,
      textRubyRanges: current.textRubyRanges,
      actorVariants: current.actorVariants,
      actorColorModes: current.actorColorModes
    });
    getStoryDialogues(scene).push(dialogue);
    scene.activeDialogueId = dialogue.id;
    scene.dialogue = dialogue;
    syncStorySceneDuration(scene);
    saveStoryProject();
    renderStoryEditor();
    dom.storyDialogueInput.focus();
  }

  function removeStoryDialogue(scene, dialogueId) {
    const dialogues = getStoryDialogues(scene);
    if (dialogues.length <= 1) {
      return;
    }
    const index = dialogues.findIndex((dialogue) => dialogue.id === dialogueId);
    if (index < 0) {
      return;
    }
    dialogues.splice(index, 1);
    const next = dialogues[Math.min(index, dialogues.length - 1)];
    scene.activeDialogueId = next.id;
    scene.dialogue = next;
    syncStorySceneDuration(scene);
    saveStoryProject();
    renderStoryEditor();
  }

  function renderStoryActorList(scene) {
    const dialogue = getActiveStoryDialogue(scene);
    dom.storySpeakerActorSelect.replaceChildren();
    dom.storyActorOptionsList.replaceChildren();
    dom.storyActorOptionsSelect.replaceChildren();
    if (!scene.actors.length) {
      // A scene without visual characters is an intentional narration scene.
      // Clear stale actor references from older project backups so the speaker
      // field remains editable as an optional narrator name.
      dialogue.actorId = null;
      dom.storySpeakerActorSelect.disabled = false;
      const narratorOption = document.createElement("option");
      narratorOption.value = "";
      narratorOption.textContent = "旁白（无发言人物）";
      dom.storySpeakerActorSelect.append(narratorOption);
      dom.storySpeakerActorSelect.value = "";
      dom.storyActorSummary.textContent = "本段：旁白";
      dom.storyActorOptionsSummary.textContent = "请选择要调整的人物";
      updateStoryActorTransformControls(scene, null, -1);
      updateStoryActorUniformControls(scene);
      return;
    }
    dom.storySpeakerActorSelect.disabled = false;
    const activeActorIndex = scene.actors.findIndex((actor) => dialogue.actorId === actor.assetId);
    const activeActor = activeActorIndex >= 0 ? scene.actors[activeActorIndex] : null;
    if (activeActor && activeActor.characterName) {
      const legacySpeaker = dialogue.speaker === activeActor.label ||
        dialogue.speaker === activeActor.filename;
      if (legacySpeaker) {
        dialogue.speaker = activeActor.characterName;
        dom.storySpeakerInput.value = activeActor.characterName;
        saveStoryProject();
      }
    }
    dom.storyActorSummary.textContent = activeActor
      ? `本段：${getStoryActorSelectionLabel(scene, activeActor, activeActorIndex)}`
      : "本段：旁白";
    const narratorOption = document.createElement("option");
    narratorOption.value = "";
    narratorOption.textContent = "旁白（无发言人物）";
    dom.storySpeakerActorSelect.append(narratorOption);
    scene.actors.forEach((actor, index) => {
      const option = document.createElement("option");
      option.value = actor.assetId;
      option.textContent = getStoryActorSelectionLabel(scene, actor, index);
      dom.storySpeakerActorSelect.append(option);
    });
    dom.storySpeakerActorSelect.value = activeActor ? activeActor.assetId : "";
    renderStoryActorOptions(scene);
  }

  function getStoryActorSelectionLabel(scene, actor, index) {
    const actorName = getStoryActorDisplayName(actor, index);
    const sameNameCount = scene.actors.filter((item, itemIndex) => (
      getStoryActorDisplayName(item, itemIndex) === actorName
    )).length;
    return sameNameCount > 1 ? `${actorName} · 人物 ${index + 1}` : actorName;
  }

  function updateStorySpeakerActor() {
    const scene = getActiveStoryScene();
    if (!scene) {
      return;
    }
    const dialogue = getActiveStoryDialogue(scene);
    const actor = scene.actors.find((item) => item.assetId === dom.storySpeakerActorSelect.value) || null;
    dialogue.actorId = actor ? actor.assetId : null;
    dialogue.speaker = actor ? getStoryActorDisplayName(actor, scene.actors.indexOf(actor)) : "";
    dom.storySpeakerInput.value = dialogue.speaker;
    dom.storySpeakerInput.readOnly = Boolean(actor);
    dom.storySpeakerInput.title = actor
      ? "人物名称请在人物通用选项中修改"
      : "旁白名称可选，留空时不显示姓名栏";
    saveStoryProject();
    renderStoryActorList(scene);
    renderStoryDialogueList(scene);
    renderStorySceneList();
    renderStoryCanvas(scene, 1);
  }

  function getStorySelectedActor(scene) {
    if (!scene || !scene.actors.length) {
      return null;
    }
    const selectedActorId = state.story.selectedActorByScene.has(scene.id)
      ? state.story.selectedActorByScene.get(scene.id)
      : scene.selectedActorId;
    let actor = scene.actors.find((item) => item.assetId === selectedActorId) || null;
    if (!actor) {
      const dialogue = getActiveStoryDialogue(scene);
      actor = scene.actors.find((item) => item.assetId === dialogue.actorId) || scene.actors[0];
      state.story.selectedActorByScene.set(scene.id, actor.assetId);
      scene.selectedActorId = actor.assetId;
    }
    return actor;
  }

  function renderStoryActorOptions(scene) {
    dom.storyActorOptionsList.replaceChildren();
    dom.storyActorOptionsSelect.replaceChildren();
    const uniformMode = state.story.actorOptionsMode === "uniform";
    document.querySelectorAll("[data-actor-adjust-mode]").forEach((button) => {
      const active = button.dataset.actorAdjustMode === state.story.actorOptionsMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    const selectedActor = getStorySelectedActor(scene);
    if (!selectedActor) {
      dom.storyActorOptionsSummary.textContent = "请选择要调整的人物";
      updateStoryActorTransformControls(scene, null, -1);
      updateStoryActorUniformControls(scene);
      return;
    }
    const selectedIndex = scene.actors.indexOf(selectedActor);
    dom.storyActorOptionsSummary.textContent = `正在调整：${getStoryActorSelectionLabel(scene, selectedActor, selectedIndex)}`;
    scene.actors.forEach((actor, index) => {
      const isSelected = actor.assetId === selectedActor.assetId;
      const actorName = getStoryActorSelectionLabel(scene, actor, index);
      const mobileOption = document.createElement("option");
      mobileOption.value = actor.assetId;
      mobileOption.textContent = actorName;
      dom.storyActorOptionsSelect.append(mobileOption);
      const item = document.createElement("div");
      item.className = "story-actor-chip story-actor-option";
      item.classList.toggle("is-selected", isSelected);

      const select = document.createElement("button");
      select.className = "story-actor-select";
      select.type = "button";
      select.title = isSelected ? `正在调整：${actorName}` : `调整人物通用选项：${actorName}`;
      select.setAttribute("aria-pressed", String(isSelected));
      select.addEventListener("click", () => {
        state.story.selectedActorByScene.set(scene.id, actor.assetId);
        scene.selectedActorId = actor.assetId;
        saveStoryProject();
        renderStoryActorOptions(scene);
      });

      const image = document.createElement("img");
      image.alt = "";
      if (actor.thumbnailUrl || actor.url) {
        image.src = actor.thumbnailUrl || actor.url;
        image.className = actor.thumbnailUrl ? "is-face-thumbnail" : "is-figure-thumbnail";
      }
      const copy = document.createElement("span");
      copy.className = "story-actor-copy";
      const name = document.createElement("strong");
      name.textContent = actorName;
      const stateLabel = document.createElement("small");
      stateLabel.textContent = isSelected ? "正在调整位置与名称" : "点击调整大小和位置";
      copy.append(name, stateLabel);
      const radio = document.createElement("span");
      radio.className = "story-actor-radio";
      radio.setAttribute("aria-hidden", "true");
      select.append(image, copy, radio);
      const remove = document.createElement("button");
      remove.className = "story-actor-remove";
      remove.type = "button";
      remove.title = `移除${actorName}`;
      remove.setAttribute("aria-label", remove.title);
      remove.textContent = "×";
      remove.addEventListener("click", () => removeStoryActor(scene, actor.assetId));
      item.append(select, remove);
      dom.storyActorOptionsList.append(item);
    });
    dom.storyActorOptionsSelect.value = selectedActor.assetId;
    updateStoryActorTransformControls(scene, selectedActor, selectedIndex);
    updateStoryActorUniformControls(scene);
  }

  function updateStoryOptionsActor() {
    const scene = getActiveStoryScene();
    const actor = scene && scene.actors.find((item) => item.assetId === dom.storyActorOptionsSelect.value);
    if (!scene || !actor) {
      return;
    }
    state.story.selectedActorByScene.set(scene.id, actor.assetId);
    scene.selectedActorId = actor.assetId;
    saveStoryProject();
    renderStoryActorOptions(scene);
  }

  function removeSelectedStoryActor() {
    const scene = getActiveStoryScene();
    const actor = getStorySelectedActor(scene);
    if (scene && actor) {
      removeStoryActor(scene, actor.assetId);
    }
  }

  function formatStoryActorOffset(value) {
    const percentage = Math.round(normalizeStoryActorTransform(value, 0, -0.5, 0.5) * 100);
    return `${percentage > 0 ? "+" : ""}${percentage}%`;
  }

  function updateStoryActorTransformControls(scene, actor, actorIndex) {
    const hasActor = Boolean(scene && actor) && state.story.actorOptionsMode === "individual";
    dom.storyActorTransformPanel.hidden = !hasActor;
    if (!hasActor) {
      return;
    }
    const scale = normalizeStoryActorTransform(actor.scale, 1, 0.5, 2);
    const offsetX = normalizeStoryActorTransform(actor.offsetX, 0, -0.5, 0.5);
    const offsetY = normalizeStoryActorTransform(actor.offsetY, 0, -0.5, 0.5);
    actor.scale = scale;
    actor.offsetX = offsetX;
    actor.offsetY = offsetY;
    dom.storyActorTransformName.textContent = getStoryActorDisplayName(actor, actorIndex);
    dom.storyActorNameInput.value = getStoryActorDisplayName(actor, actorIndex);
    dom.storyActorScaleInput.value = String(scale);
    dom.storyActorOffsetXInput.value = String(offsetX);
    dom.storyActorOffsetYInput.value = String(offsetY);
    dom.storyActorScaleValue.value = `${Math.round(scale * 100)}%`;
    dom.storyActorOffsetXValue.value = formatStoryActorOffset(offsetX);
    dom.storyActorOffsetYValue.value = formatStoryActorOffset(offsetY);
  }

  function updateStoryActorUniformControls(scene) {
    const uniformMode = state.story.actorOptionsMode === "uniform";
    const actors = scene && Array.isArray(scene.actors) ? scene.actors : [];
    const hasActors = actors.length > 0;
    dom.storyActorUniformPanel.hidden = !uniformMode || !hasActors;
    dom.storyActorUniformSummary.textContent = `${actors.length} 位人物`;
    [
      dom.storyActorUniformScaleInput,
      dom.storyActorUniformOffsetXInput,
      dom.storyActorUniformOffsetYInput,
      dom.storyActorUniformResetButton
    ].forEach((control) => {
      control.disabled = !hasActors;
    });
    if (!uniformMode || !hasActors) {
      return;
    }
    const session = getStoryUniformTransformSession(scene);
    dom.storyActorUniformScaleInput.value = String(session.scale);
    dom.storyActorUniformOffsetXInput.value = String(session.offsetX);
    dom.storyActorUniformOffsetYInput.value = String(session.offsetY);
    dom.storyActorUniformScaleValue.value = `${Math.round(session.scale * 100)}%`;
    dom.storyActorUniformOffsetXValue.value = formatStoryActorOffset(session.offsetX);
    dom.storyActorUniformOffsetYValue.value = formatStoryActorOffset(session.offsetY);
  }

  function createStoryUniformTransformSession(scene) {
    const session = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      actors: new Map(scene.actors.map((actor) => [actor.assetId, {
        scale: normalizeStoryActorTransform(actor.scale, 1, 0.5, 2),
        offsetX: normalizeStoryActorTransform(actor.offsetX, 0, -0.5, 0.5),
        offsetY: normalizeStoryActorTransform(actor.offsetY, 0, -0.5, 0.5)
      }]))
    };
    state.story.uniformTransformSessionByScene.set(scene.id, session);
    return session;
  }

  function getStoryUniformTransformSession(scene) {
    const current = state.story.uniformTransformSessionByScene.get(scene.id);
    const matchesActors = current && current.actors.size === scene.actors.length &&
      scene.actors.every((actor) => current.actors.has(actor.assetId));
    return matchesActors ? current : createStoryUniformTransformSession(scene);
  }

  function setStoryActorOptionsMode(mode) {
    if (!["individual", "uniform"].includes(mode)) {
      return;
    }
    state.story.actorOptionsMode = mode;
    const scene = getActiveStoryScene();
    if (scene) {
      if (mode === "uniform") {
        createStoryUniformTransformSession(scene);
      } else {
        state.story.uniformTransformSessionByScene.delete(scene.id);
      }
    }
    renderStoryActorOptions(scene);
  }

  function updateUniformStoryActorTransform(field, value) {
    const scene = getActiveStoryScene();
    if (!scene || !scene.actors.length) {
      return;
    }
    const session = getStoryUniformTransformSession(scene);
    const nextValue = field === "scale"
      ? normalizeStoryActorTransform(value, 1, 0.5, 2)
      : normalizeStoryActorTransform(value, 0, -0.5, 0.5);
    session[field] = nextValue;
    scene.actors.forEach((actor) => {
      const baseline = session.actors.get(actor.assetId);
      actor.scale = normalizeStoryActorTransform(baseline.scale * session.scale, baseline.scale, 0.5, 2);
      actor.offsetX = normalizeStoryActorTransform(baseline.offsetX + session.offsetX, baseline.offsetX, -0.5, 0.5);
      actor.offsetY = normalizeStoryActorTransform(baseline.offsetY + session.offsetY, baseline.offsetY, -0.5, 0.5);
    });
    updateStoryActorUniformControls(scene);
    saveStoryProject();
    renderStoryCanvas(scene, 1);
  }

  function resetUniformStoryActorTransform() {
    const scene = getActiveStoryScene();
    if (!scene) {
      return;
    }
    const session = getStoryUniformTransformSession(scene);
    scene.actors.forEach((actor) => {
      const baseline = session.actors.get(actor.assetId);
      actor.scale = baseline.scale;
      actor.offsetX = baseline.offsetX;
      actor.offsetY = baseline.offsetY;
    });
    session.scale = 1;
    session.offsetX = 0;
    session.offsetY = 0;
    updateStoryActorUniformControls(scene);
    saveStoryProject();
    renderStoryCanvas(scene, 1);
  }

  function updateActiveStoryActorTransform(field, value) {
    const scene = getActiveStoryScene();
    const actor = getStorySelectedActor(scene);
    if (!scene || !actor) {
      return;
    }
    const settings = field === "scale"
      ? { fallback: 1, minimum: 0.5, maximum: 2 }
      : { fallback: 0, minimum: -0.5, maximum: 0.5 };
    actor[field] = normalizeStoryActorTransform(value, settings.fallback, settings.minimum, settings.maximum);
    updateStoryActorTransformControls(scene, actor, scene.actors.indexOf(actor));
    saveStoryProject();
    renderStoryCanvas(scene, 1);
  }

  function resetActiveStoryActorTransform() {
    const scene = getActiveStoryScene();
    const actor = getStorySelectedActor(scene);
    if (!scene || !actor) {
      return;
    }
    actor.scale = 1;
    actor.offsetX = 0;
    actor.offsetY = 0;
    updateStoryActorTransformControls(scene, actor, scene.actors.indexOf(actor));
    saveStoryProject();
    renderStoryCanvas(scene, 1);
  }

  function getStorySelectedAnimationActor(scene) {
    if (!scene || !scene.actors.length) {
      return null;
    }
    const selectedId = state.story.selectedAnimationActorByScene.get(scene.id);
    const actor = scene.actors.find((item) => item.assetId === selectedId) || scene.actors[0];
    state.story.selectedAnimationActorByScene.set(scene.id, actor.assetId);
    return actor;
  }

  function renderStoryAnimationOptions(scene) {
    dom.storyAnimationActorList.replaceChildren();
    dom.storyAnimationActorSelect.replaceChildren();
    const selectedActor = getStorySelectedAnimationActor(scene);
    dom.storyActorAnimationPanel.hidden = !selectedActor;
    if (!selectedActor) {
      dom.storyAnimationActorSelect.disabled = true;
      dom.storyAnimationSummary.textContent = "请先在画面素材中选择人物";
      return;
    }
    dom.storyAnimationActorSelect.disabled = false;
    scene.actors.forEach((actor, index) => {
      const actorName = getStoryActorSelectionLabel(scene, actor, index);
      const isSelected = actor.assetId === selectedActor.assetId;
      const option = document.createElement("option");
      option.value = actor.assetId;
      option.textContent = actorName;
      dom.storyAnimationActorSelect.append(option);

      const item = document.createElement("div");
      item.className = "story-actor-chip story-animation-actor-item";
      item.classList.toggle("is-selected", isSelected);
      const select = document.createElement("button");
      select.className = "story-actor-select";
      select.type = "button";
      select.setAttribute("aria-pressed", String(isSelected));
      select.addEventListener("click", () => selectStoryAnimationActor(scene, actor.assetId));
      const image = document.createElement("img");
      image.alt = "";
      if (actor.thumbnailUrl || actor.url) {
        image.src = actor.thumbnailUrl || actor.url;
        image.className = actor.thumbnailUrl ? "is-face-thumbnail" : "is-figure-thumbnail";
      }
      const copy = document.createElement("span");
      copy.className = "story-actor-copy";
      const name = document.createElement("strong");
      name.textContent = actorName;
      const animation = document.createElement("small");
      animation.textContent = getStoryActorAnimationLabel(actor.entryAnimation);
      copy.append(name, animation);
      const radio = document.createElement("span");
      radio.className = "story-actor-radio";
      radio.setAttribute("aria-hidden", "true");
      select.append(image, copy, radio);
      item.append(select);
      dom.storyAnimationActorList.append(item);
    });
    const selectedIndex = scene.actors.indexOf(selectedActor);
    dom.storyAnimationActorSelect.value = selectedActor.assetId;
    dom.storyAnimationSummary.textContent = `正在设置：${getStoryActorSelectionLabel(scene, selectedActor, selectedIndex)}`;
    dom.storyActorAnimationName.textContent = getStoryActorDisplayName(selectedActor, selectedIndex);
    dom.storyActorEntryAnimationSelect.value = normalizeStoryActorEntryAnimation(selectedActor.entryAnimation);
  }

  function getStoryActorAnimationLabel(value) {
    return {
      cut: "直接出现",
      fade: "人物淡入",
      "slide-left": "从左滑入",
      "slide-right": "从右滑入",
      flash: "人物闪白"
    }[normalizeStoryActorEntryAnimation(value)];
  }

  function selectStoryAnimationActor(scene, actorId) {
    if (!scene || !scene.actors.some((actor) => actor.assetId === actorId)) {
      return;
    }
    state.story.selectedAnimationActorByScene.set(scene.id, actorId);
    renderStoryAnimationOptions(scene);
  }

  function updateStoryActorEntryAnimation() {
    const scene = getActiveStoryScene();
    const actor = getStorySelectedAnimationActor(scene);
    if (!scene || !actor) {
      return;
    }
    actor.entryAnimation = normalizeStoryActorEntryAnimation(dom.storyActorEntryAnimationSelect.value);
    saveStoryProject();
    renderStoryAnimationOptions(scene);
    renderStoryCanvas(scene, 1);
  }

  function previewStoryActorAnimations() {
    const scene = getActiveStoryScene();
    if (!scene || !scene.actors.length) {
      return;
    }
    if (state.story.playbackFrame) {
      cancelAnimationFrame(state.story.playbackFrame);
    }
    const dialogue = getActiveStoryDialogue(scene);
    const startedAt = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / (STORY_ACTOR_ENTRY_DURATION * 1000)));
      renderStoryCanvas(scene, 1, dialogue, true, progress);
      if (progress < 1 && state.story.open) {
        state.story.playbackFrame = requestAnimationFrame(frame);
      } else {
        state.story.playbackFrame = null;
        renderStoryCanvas(scene, 1, dialogue, false);
      }
    };
    state.story.playbackFrame = requestAnimationFrame(frame);
  }

  function updateActiveStoryActorName(finalize = false) {
    const scene = getActiveStoryScene();
    const actor = getStorySelectedActor(scene);
    if (!scene || !actor) {
      return;
    }
    const actorIndex = scene.actors.indexOf(actor);
    const typedName = dom.storyActorNameInput.value.slice(0, 40);
    const nextName = finalize
      ? typedName.trim() || actor.sourceCharacterName || `人物 ${actorIndex + 1}`
      : typedName;
    actor.characterName = nextName;
    getStoryDialogues(scene).forEach((dialogue) => {
      if (dialogue.actorId === actor.assetId) {
        dialogue.speaker = nextName;
      }
    });
    const activeDialogue = getActiveStoryDialogue(scene);
    if (activeDialogue.actorId === actor.assetId) {
      dom.storySpeakerInput.value = nextName;
    }
    dom.storyActorTransformName.textContent = nextName || "未命名人物";
    saveStoryProject();
    renderStoryCanvas(scene, 1);
    if (finalize) {
      dom.storyActorNameInput.value = nextName;
      renderStoryActorList(scene);
      renderStoryDialogueList(scene);
      renderStorySceneList();
    }
  }

  function getStoryActorDisplayName(actor, index) {
    return String(actor.characterName || actor.name || `人物 ${index + 1}`).trim();
  }

  function getStoryCharacterName(character, characterId) {
    return String(
      character && (character.characterName || character.name || character.originalName || character.displayName)
        ? character.characterName || character.name || character.originalName || character.displayName
        : `人物 ${characterId}`
    ).trim();
  }

  function isGeneratedStoryActorName(name) {
    return /^人物\s*\d*$/u.test(String(name || "").trim());
  }

  function resetStoryDialogueActorVariant(actorId) {
    const scene = getActiveStoryScene();
    if (!scene) {
      return;
    }
    const dialogue = getActiveStoryDialogue(scene);
    if (dialogue.actorVariants) {
      delete dialogue.actorVariants[actorId];
    }
    saveStoryProject();
    renderStoryDialogueList(scene);
    renderStoryDialogueVariantControls(scene);
    renderStoryCanvas(scene, 1);
  }

  function removeStoryActor(scene, assetId) {
    scene.actors = scene.actors.filter((actor) => actor.assetId !== assetId);
    if (state.story.selectedActorByScene.get(scene.id) === assetId) {
      state.story.selectedActorByScene.delete(scene.id);
    }
    if (state.story.selectedAnimationActorByScene.get(scene.id) === assetId) {
      state.story.selectedAnimationActorByScene.delete(scene.id);
    }
    state.story.uniformTransformSessionByScene.delete(scene.id);
    if (scene.selectedActorId === assetId) {
      scene.selectedActorId = null;
    }
    getStoryDialogues(scene).forEach((dialogue) => {
      if (dialogue.actorVariants) {
        delete dialogue.actorVariants[assetId];
      }
      if (dialogue.actorColorModes) {
        delete dialogue.actorColorModes[assetId];
      }
      if (dialogue.actorId === assetId) {
        dialogue.actorId = scene.actors[0] ? scene.actors[0].assetId : null;
        dialogue.speaker = scene.actors[0] ? getStoryActorDisplayName(scene.actors[0], 0) : "";
      }
    });
    saveStoryProject();
    renderStoryEditor();
  }

  function updateStoryBgmStatus() {
    const bgm = state.story.project.bgm;
    dom.storyBgmStatus.textContent = bgm
      ? `已选择 ${bgm.name || "本地音频"}${bgm.local
        ? bgm.cacheKey ? " · 已保存到本机" : " · 当前会话缓存"
        : bgm.cached ? " · 已缓存到设备" : " · Atlas 在线曲目"}`
      : "可从 Atlas 在线曲目中试听选择，也可以导入本地音频。";
    dom.storyClearBgmButton.disabled = !bgm;
  }

  async function cacheStoryOnlineBgm(bgm) {
    if (!bgm || bgm.local || !bgm.url || !bgm.cacheKey) {
      return;
    }
    try {
      const response = await fetch(bgm.url, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`BGM ${response.status}`);
      }
      const blob = await response.blob();
      if (!blob.size) {
        throw new Error("Empty BGM resource");
      }
      await writeStoryAssetBlob(bgm.cacheKey, blob);
      if (state.story.project.bgm && state.story.project.bgm.cacheKey === bgm.cacheKey) {
        state.story.project.bgm.cached = true;
        saveStoryProject();
        updateStoryBgmStatus();
      }
    } catch (_error) {
      if (state.story.project.bgm && state.story.project.bgm.cacheKey === bgm.cacheKey) {
        state.story.project.bgm.cached = false;
        updateStoryBgmStatus();
      }
    }
  }

  function getStoryBgmDisplayName(item) {
    return String(item && (item.name || item.originalName || item.fileName)
      || `BGM ${item && item.id != null ? item.id : ""}`).replace(/\s+/g, " ").trim();
  }

  function normalizeStoryBgmItems(items, region) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.flatMap((item) => {
      if (!item || (!item.audioAsset && !item.fileName)) {
        return [];
      }
      const name = getStoryBgmDisplayName(item);
      return [{
        id: String(item.id == null ? item.fileName : item.id),
        name,
        originalName: String(item.originalName || name),
        fileName: String(item.fileName || name),
        audioAsset: item.audioAsset || null,
        notReleased: Boolean(item.notReleased),
        priority: Number(item.priority) || 0,
        region,
        searchText: `${name} ${item.originalName || ""} ${item.fileName || ""} ${item.id || ""}`.toLocaleLowerCase()
      }];
    });
  }

  function closeStoryBgmPicker() {
    const picker = state.story.bgmPicker;
    picker.open = false;
    if (picker.loadController) {
      picker.loadController.abort();
      picker.loadController = null;
    }
    dom.storyBgmPicker.hidden = true;
    if (dom.storyBgmPreviewAudio) {
      dom.storyBgmPreviewAudio.pause();
      dom.storyBgmPreviewAudio.removeAttribute("src");
      dom.storyBgmPreviewAudio.load();
    }
    picker.previewId = null;
  }

  function renderStoryBgmList() {
    const picker = state.story.bgmPicker;
    const items = picker.filteredItems.slice(0, picker.visibleCount);
    dom.storyBgmList.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "story-bgm-picker-status";
      empty.textContent = picker.items.length ? "没有匹配的曲目" : "暂无可用 BGM";
      dom.storyBgmList.append(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const row = document.createElement("article");
      row.className = "story-bgm-item";
      if (state.story.project.bgm && String(state.story.project.bgm.id) === item.id) {
        row.classList.add("is-selected");
      }
      const copy = document.createElement("div");
      copy.className = "story-bgm-item-copy";
      const title = document.createElement("strong");
      title.textContent = item.name;
      const meta = document.createElement("small");
      meta.textContent = `${item.fileName}${item.notReleased ? " · 未公开条目" : ""}`;
      copy.append(title, meta);
      const preview = document.createElement("button");
      preview.className = "secondary-button";
      preview.type = "button";
      preview.dataset.bgmAction = "preview";
      preview.textContent = picker.previewId === item.id ? "停止试听" : "试听";
      preview.addEventListener("click", () => previewStoryBgm(item));
      const select = document.createElement("button");
      select.className = "secondary-button";
      select.type = "button";
      select.dataset.bgmAction = "select";
      select.textContent = "选择";
      select.addEventListener("click", () => selectStoryOnlineBgm(item));
      row.append(copy, preview, select);
      fragment.append(row);
    });
    dom.storyBgmList.append(fragment);
  }

  function applyStoryBgmFilter() {
    const query = String(dom.storyBgmSearchInput.value || "").trim().toLocaleLowerCase();
    const picker = state.story.bgmPicker;
    picker.filteredItems = query
      ? picker.items.filter((item) => item.searchText.includes(query))
      : picker.items.slice();
    picker.visibleCount = STORY_BGM_PAGE_SIZE;
    dom.storyBgmPickerStatus.textContent = `${picker.filteredItems.length} 首曲目 · 可试听后选择`;
    renderStoryBgmList();
  }

  async function loadStoryBgmCatalog() {
    const picker = state.story.bgmPicker;
    const region = state.region;
    const cached = picker.cache.get(region);
    if (cached) {
      picker.items = cached;
      applyStoryBgmFilter();
      return;
    }
    if (picker.loadController) {
      picker.loadController.abort();
    }
    const controller = new AbortController();
    picker.loadController = controller;
    dom.storyBgmPickerStatus.textContent = `正在读取 ${region} BGM 目录`;
    dom.storyBgmList.replaceChildren();
    try {
      const response = await fetch(`${API_BASE}/export/${region}/nice_bgm.json`, {
        signal: controller.signal,
        cache: "default"
      });
      if (!response.ok) {
        throw new Error(`Atlas API ${response.status}`);
      }
      const items = normalizeStoryBgmItems(await response.json(), region)
        .sort((left, right) => (right.priority - left.priority) || left.id.localeCompare(right.id, undefined, { numeric: true }));
      picker.cache.set(region, items);
      picker.items = items;
      applyStoryBgmFilter();
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
      picker.items = [];
      picker.filteredItems = [];
      dom.storyBgmPickerStatus.textContent = "BGM 目录读取失败，请检查网络后重试";
      renderStoryBgmList();
    } finally {
      if (picker.loadController === controller) {
        picker.loadController = null;
      }
    }
  }

  async function openStoryBgmPicker() {
    const picker = state.story.bgmPicker;
    picker.open = true;
    dom.storyBgmPicker.hidden = false;
    dom.storyBgmPickerRegion.textContent = state.region;
    dom.storyBgmSearchInput.value = "";
    dom.storyBgmPickerStatus.textContent = `正在读取 ${state.region} BGM 目录`;
    await loadStoryBgmCatalog();
    window.requestAnimationFrame(() => dom.storyBgmSearchInput.focus({ preventScroll: true }));
  }

  async function previewStoryBgm(item) {
    const audio = dom.storyBgmPreviewAudio;
    if (!audio || !item.audioAsset) {
      return;
    }
    if (state.story.bgmPicker.previewId === item.id && !audio.paused) {
      audio.pause();
      state.story.bgmPicker.previewId = null;
      dom.storyBgmPreviewLabel.textContent = "试听已暂停";
      renderStoryBgmList();
      return;
    }
    state.story.bgmPicker.previewId = item.id;
    audio.src = item.audioAsset;
    audio.load();
    dom.storyBgmPreviewLabel.textContent = `正在试听：${item.name}`;
    renderStoryBgmList();
    try {
      await audio.play();
    } catch (_error) {
      dom.storyBgmPreviewLabel.textContent = "请点击播放器开始试听";
    }
  }

  function selectStoryOnlineBgm(item) {
    if (!item || !item.audioAsset) {
      showToast("该曲目没有可播放的音频资源");
      return;
    }
    const previousBgm = state.story.project.bgm;
    if (previousBgm && previousBgm.local && previousBgm.url) {
      URL.revokeObjectURL(previousBgm.url);
      state.story.objectUrls.delete(previousBgm.url);
    }
    state.story.project.bgm = {
      id: item.id,
      name: item.name,
      originalName: item.originalName,
      fileName: item.fileName,
      url: item.audioAsset,
      audioAsset: item.audioAsset,
      local: false,
      source: "atlas",
      region: item.region,
      cacheKey: `bgm:${item.region}:${item.id}`,
      cached: false
    };
    saveStoryProject();
    updateStoryBgmStatus();
    const scene = getActiveStoryScene();
    if (scene) {
      renderStoryResourceSummary(scene);
    }
    closeStoryBgmPicker();
    showToast(`已选择 BGM：${item.name}`);
    cacheStoryOnlineBgm(state.story.project.bgm);
  }

  function addStoryScene() {
    const scene = createStoryScene();
    state.story.project.scenes.push(scene);
    state.story.activeSceneId = scene.id;
    saveStoryProject();
    renderStoryEditor();
  }

  function duplicateStoryScene() {
    const source = getActiveStoryScene();
    if (!source) {
      return;
    }
    const scene = JSON.parse(JSON.stringify(source));
    scene.id = `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const index = state.story.project.scenes.indexOf(source);
    state.story.project.scenes.splice(index + 1, 0, scene);
    state.story.activeSceneId = scene.id;
    saveStoryProject();
    renderStoryEditor();
  }

  function deleteStoryScene() {
    if (state.story.project.scenes.length <= 1) {
      return;
    }
    const index = state.story.project.scenes.findIndex((scene) => scene.id === state.story.activeSceneId);
    state.story.project.scenes.splice(index, 1);
    const next = state.story.project.scenes[Math.max(0, index - 1)];
    state.story.activeSceneId = next.id;
    saveStoryProject();
    renderStoryEditor();
  }

  function updateStorySceneField(field, value) {
    const scene = getActiveStoryScene();
    if (!scene) {
      return;
    }
    const dialogue = getActiveStoryDialogue(scene);
    if (field === "speaker" && dialogue.actorId) {
      const actor = scene.actors.find((item) => item.assetId === dialogue.actorId);
      dialogue.speaker = actor ? getStoryActorDisplayName(actor, scene.actors.indexOf(actor)) : value;
      dom.storySpeakerInput.value = dialogue.speaker;
    } else if (field === "speaker") {
      dialogue.speaker = value;
    } else if (field === "text") {
      dialogue.textColorRanges = updateStoryTextColorRangesForEdit(
        dialogue.text,
        value,
        dialogue.textColorRanges
      );
      dialogue.textFontSizeRanges = updateStoryTextFontSizeRangesForEdit(
        dialogue.text,
        value,
        dialogue.textFontSizeRanges
      );
      dialogue.textRubyRanges = updateStoryTextRubyRangesForEdit(
        dialogue.text,
        value,
        dialogue.textRubyRanges
      );
      dialogue.text = value;
      updateStoryDialogueColorControls(dialogue);
    } else if (field === "duration") {
      dialogue.duration = Math.max(1, Math.min(120, Number(value) || 4));
      syncStorySceneDuration(scene);
    }
    saveStoryProject({ deferred: true });
    updateStoryDialogueListItem(scene, dialogue);
    updateStorySceneListItem(scene);
    renderStoryCanvas(scene, 1);
  }

  function getStoryDialogueTextSelection() {
    const value = dom.storyDialogueInput.value || "";
    const startOffset = Math.max(0, Number(dom.storyDialogueInput.selectionStart) || 0);
    const endOffset = Math.max(startOffset, Number(dom.storyDialogueInput.selectionEnd) || startOffset);
    return {
      start: Array.from(value.slice(0, startOffset)).length,
      end: Array.from(value.slice(0, endOffset)).length
    };
  }

  function selectStoryDialogueTextRange(start, end) {
    const characters = Array.from(dom.storyDialogueInput.value || "");
    const safeStart = Math.max(0, Math.min(characters.length, start));
    const safeEnd = Math.max(safeStart, Math.min(characters.length, end));
    const startOffset = characters.slice(0, safeStart).join("").length;
    const endOffset = characters.slice(0, safeEnd).join("").length;
    dom.storyDialogueInput.focus();
    dom.storyDialogueInput.setSelectionRange(startOffset, endOffset);
    updateStoryDialogueColorControls(getActiveStoryDialogue(getActiveStoryScene()));
  }

  function renderStoryDialogueColorRanges(dialogue) {
    dom.storyDialogueColorRangeList.replaceChildren();
    const characters = Array.from(dialogue.text || "");
    dialogue.textColorRanges.forEach((range) => {
      const item = document.createElement("div");
      item.className = "story-dialogue-color-range";
      item.title = `第 ${range.start + 1}–${range.end} 字`;
      const swatch = document.createElement("span");
      swatch.className = "story-dialogue-color-swatch";
      swatch.style.backgroundColor = range.color;
      const text = document.createElement("span");
      text.className = "story-dialogue-color-range-text";
      text.textContent = `「${characters.slice(range.start, range.end).join("") || "空白"}」`;
      const remove = document.createElement("button");
      remove.className = "story-dialogue-color-range-remove";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `恢复${text.textContent}的默认颜色`);
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        applyStoryDialogueTextColor(range.start, range.end, null);
      });
      item.addEventListener("click", () => selectStoryDialogueTextRange(range.start, range.end));
      item.append(swatch, text, remove);
      dom.storyDialogueColorRangeList.append(item);
    });
  }

  function renderStoryDialogueFontSizeRanges(dialogue) {
    dom.storyDialogueFontSizeRangeList.replaceChildren();
    const characters = Array.from(dialogue.text || "");
    dialogue.textFontSizeRanges.forEach((range) => {
      const item = document.createElement("div");
      item.className = "story-dialogue-font-size-range";
      item.title = `第 ${range.start + 1}–${range.end} 字`;
      const text = document.createElement("span");
      text.className = "story-dialogue-font-size-range-text";
      text.textContent = `「${characters.slice(range.start, range.end).join("") || "空白"}」`;
      const size = document.createElement("span");
      size.className = "story-dialogue-font-size-range-value";
      size.textContent = `${Math.round(range.scale * 100)}%`;
      const remove = document.createElement("button");
      remove.className = "story-dialogue-font-size-range-remove";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `恢复${text.textContent}的默认字号`);
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        applyStoryDialogueTextFontSize(range.start, range.end, null);
      });
      item.addEventListener("click", () => {
        selectStoryDialogueTextRange(range.start, range.end);
        dom.storyDialogueRangeFontSizeInput.value = String(Math.round(range.scale * 100));
        updateStoryDialogueRangeFontSizeControls(dialogue);
      });
      item.append(text, size, remove);
      dom.storyDialogueFontSizeRangeList.append(item);
    });
  }

  function renderStoryDialogueRubyRanges(dialogue) {
    dom.storyDialogueRubyList.replaceChildren();
    const characters = Array.from(dialogue.text || "");
    dialogue.textRubyRanges.forEach((range) => {
      const item = document.createElement("div");
      item.className = "story-dialogue-ruby-item";
      item.title = `第 ${range.start + 1}–${range.end} 字`;
      const text = document.createElement("span");
      text.className = "story-dialogue-ruby-item-text";
      text.textContent = `「${characters.slice(range.start, range.end).join("")}」上方：${range.ruby}`;
      const remove = document.createElement("button");
      remove.className = "story-dialogue-ruby-item-remove";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `清除${text.textContent}`);
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        applyStoryDialogueRuby(range.start, range.end, "");
      });
      item.addEventListener("click", () => {
        selectStoryDialogueTextRange(range.start, range.end);
        dom.storyDialogueRubyInput.value = range.ruby;
      });
      item.append(text, remove);
      dom.storyDialogueRubyList.append(item);
    });
  }

  function getStoryDialogueSelectionLabel(dialogue) {
    if (!dialogue) {
      return "尚未选择文字";
    }
    const selection = getStoryDialogueTextSelection();
    if (selection.end <= selection.start) {
      return "尚未选择文字";
    }
    const selectedText = Array.from(dialogue.text || "").slice(selection.start, selection.end).join("");
    return `已选择「${selectedText.length > 18 ? `${Array.from(selectedText).slice(0, 18).join("")}…` : selectedText}」`;
  }

  function setStoryDialogueStyleTab(tab) {
    const allowedTabs = ["color", "font-size", "ruby"];
    activeStoryDialogueStyleTab = allowedTabs.includes(tab) ? tab : "color";
    if (!dom.storyDialogueStyleTabs || !dom.storyDialogueStyleTrack) {
      return;
    }
    const tabIndex = allowedTabs.indexOf(activeStoryDialogueStyleTab);
    dom.storyDialogueStyleTabs.querySelectorAll("[data-dialogue-style-tab]").forEach((button) => {
      const active = button.dataset.dialogueStyleTab === activeStoryDialogueStyleTab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    dom.storyDialogueStyleTrack.style.transform = `translate3d(-${tabIndex * (100 / allowedTabs.length)}%, 0, 0)`;
    dom.storyDialogueStyleTrack.querySelectorAll("[data-dialogue-style-panel]").forEach((panel) => {
      const active = panel.dataset.dialogueStylePanel === activeStoryDialogueStyleTab;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", String(!active));
    });
  }

  function updateStoryDialogueStyleSelection(dialogue) {
    if (dom.storyDialogueStyleSelectionValue) {
      dom.storyDialogueStyleSelectionValue.textContent = getStoryDialogueSelectionLabel(dialogue);
    }
  }

  function updateStoryDialogueColorControls(dialogue) {
    if (!dialogue || !dom.storyDialogueColorInput) {
      return;
    }
    dialogue.textColorRanges = normalizeStoryTextColorRanges(dialogue.textColorRanges, dialogue.text);
    const selection = getStoryDialogueTextSelection();
    const characters = Array.from(dialogue.text || "");
    const hasSelection = selection.end > selection.start;
    const selectedText = characters.slice(selection.start, selection.end).join("");
    updateStoryDialogueStyleSelection(dialogue);
    dom.storyDialogueColorSelectionValue.textContent = hasSelection
      ? `已选择「${selectedText.length > 18 ? `${Array.from(selectedText).slice(0, 18).join("")}…` : selectedText}」`
      : "尚未选择文字";
    dom.storyDialogueColorApplyButton.disabled = !hasSelection;
    dom.storyDialogueColorClearSelectionButton.disabled = !hasSelection;
    dom.storyDialogueColorResetButton.disabled = dialogue.textColorRanges.length === 0;
    renderStoryDialogueColorRanges(dialogue);
    updateStoryDialogueRangeFontSizeControls(dialogue);
    updateStoryDialogueRubyControls(dialogue);
  }

  function updateStoryDialogueRangeFontSizeControls(dialogue) {
    if (!dialogue || !dom.storyDialogueRangeFontSizeInput) {
      return;
    }
    dialogue.textFontSizeRanges = normalizeStoryTextFontSizeRanges(dialogue.textFontSizeRanges, dialogue.text);
    const selection = getStoryDialogueTextSelection();
    const characters = Array.from(dialogue.text || "");
    const hasSelection = selection.end > selection.start;
    const selectedText = characters.slice(selection.start, selection.end).join("");
    updateStoryDialogueStyleSelection(dialogue);
    const selectedRange = dialogue.textFontSizeRanges.find((range) => (
      range.start === selection.start && range.end === selection.end
    ));
    dom.storyDialogueFontSizeSelectionValue.textContent = hasSelection
      ? `已选择「${selectedText.length > 18 ? `${Array.from(selectedText).slice(0, 18).join("")}…` : selectedText}」`
      : "尚未选择文字";
    dom.storyDialogueFontSizeApplyButton.disabled = !hasSelection;
    dom.storyDialogueFontSizeClearSelectionButton.disabled = !hasSelection;
    dom.storyDialogueFontSizeResetButton.disabled = dialogue.textFontSizeRanges.length === 0;
    if (document.activeElement !== dom.storyDialogueRangeFontSizeInput) {
      dom.storyDialogueRangeFontSizeInput.value = String(Math.round((selectedRange?.scale || 1) * 100));
    }
    dom.storyDialogueRangeFontSizeValue.textContent = `${Math.round(Number(dom.storyDialogueRangeFontSizeInput.value) || 100)}%`;
    renderStoryDialogueFontSizeRanges(dialogue);
  }

  function updateStoryDialogueRubyControls(dialogue) {
    if (!dialogue || !dom.storyDialogueRubyInput) {
      return;
    }
    dialogue.textRubyRanges = normalizeStoryTextRubyRanges(dialogue.textRubyRanges, dialogue.text);
    const selection = getStoryDialogueTextSelection();
    const characters = Array.from(dialogue.text || "");
    const hasSelection = selection.end > selection.start;
    const selectedText = characters.slice(selection.start, selection.end).join("");
    updateStoryDialogueStyleSelection(dialogue);
    const selectedRange = dialogue.textRubyRanges.find((range) => (
      range.start === selection.start && range.end === selection.end
    ));
    dom.storyDialogueRubySelectionValue.textContent = hasSelection
      ? `已选择「${selectedText.length > 18 ? `${Array.from(selectedText).slice(0, 18).join("")}…` : selectedText}」`
      : "尚未选择文字";
    dom.storyDialogueRubyApplyButton.disabled = !hasSelection || !dom.storyDialogueRubyInput.value.trim();
    dom.storyDialogueRubyClearSelectionButton.disabled = !hasSelection;
    dom.storyDialogueRubyResetButton.disabled = dialogue.textRubyRanges.length === 0;
    if (document.activeElement !== dom.storyDialogueRubyInput) {
      dom.storyDialogueRubyInput.value = selectedRange ? selectedRange.ruby : "";
    }
    renderStoryDialogueRubyRanges(dialogue);
  }

  function updateStoryDialogueRubyRangesForSelection(dialogue, start, end, ruby) {
    const nextRanges = dialogue.textRubyRanges.flatMap((range) => {
      if (range.end <= start || range.start >= end) {
        return [range];
      }
      const pieces = [];
      if (range.start < start) {
        pieces.push({ ...range, end: start });
      }
      if (range.end > end) {
        pieces.push({ ...range, start: end });
      }
      return pieces;
    });
    if (ruby) {
      nextRanges.push({ start, end, ruby });
    }
    return normalizeStoryTextRubyRanges(nextRanges, dialogue.text);
  }

  function applyStoryDialogueRuby(start, end, ruby) {
    const scene = getActiveStoryScene();
    const dialogue = scene && getActiveStoryDialogue(scene);
    if (!dialogue) {
      return;
    }
    const textLength = Array.from(dialogue.text || "").length;
    const safeStart = Math.max(0, Math.min(textLength, Math.floor(Number(start) || 0)));
    const safeEnd = Math.max(safeStart, Math.min(textLength, Math.floor(Number(end) || 0)));
    if (safeEnd <= safeStart) {
      return;
    }
    dialogue.textRubyRanges = normalizeStoryTextRubyRanges(dialogue.textRubyRanges, dialogue.text);
    dialogue.textRubyRanges = updateStoryDialogueRubyRangesForSelection(
      dialogue,
      safeStart,
      safeEnd,
      String(ruby || "").trim().slice(0, 40)
    );
    updateStoryDialogueRubyControls(dialogue);
    saveStoryProject();
    renderStoryDialogueList(scene);
    renderStorySceneList();
    renderStoryCanvas(scene, 1);
  }

  function applySelectedStoryDialogueRuby() {
    const selection = getStoryDialogueTextSelection();
    const ruby = dom.storyDialogueRubyInput.value.trim();
    if (selection.end <= selection.start) {
      showToast("请先在对话内容中选择文字");
      return;
    }
    if (!ruby) {
      showToast("请输入要显示的小字内容");
      return;
    }
    applyStoryDialogueRuby(selection.start, selection.end, ruby);
  }

  function clearSelectedStoryDialogueRuby() {
    const selection = getStoryDialogueTextSelection();
    if (selection.end <= selection.start) {
      showToast("请先在对话内容中选择文字");
      return;
    }
    applyStoryDialogueRuby(selection.start, selection.end, "");
  }

  function resetStoryDialogueRuby() {
    const scene = getActiveStoryScene();
    const dialogue = scene && getActiveStoryDialogue(scene);
    if (!dialogue) {
      return;
    }
    dialogue.textRubyRanges = [];
    dom.storyDialogueRubyInput.value = "";
    updateStoryDialogueRubyControls(dialogue);
    saveStoryProject();
    renderStoryDialogueList(scene);
    renderStorySceneList();
    renderStoryCanvas(scene, 1);
  }

  function applyStoryDialogueTextColor(start, end, color) {
    const scene = getActiveStoryScene();
    const dialogue = scene && getActiveStoryDialogue(scene);
    if (!dialogue) {
      return;
    }
    const textLength = Array.from(dialogue.text || "").length;
    const safeStart = Math.max(0, Math.min(textLength, Math.floor(Number(start) || 0)));
    const safeEnd = Math.max(safeStart, Math.min(textLength, Math.floor(Number(end) || 0)));
    if (safeEnd <= safeStart) {
      return;
    }
    const colors = getStoryTextColorMap(dialogue.textColorRanges, textLength);
    colors.fill(normalizeStoryTextColor(color, null), safeStart, safeEnd);
    dialogue.textColorRanges = compactStoryTextColors(colors);
    updateStoryDialogueColorControls(dialogue);
    saveStoryProject();
    renderStoryDialogueList(scene);
    renderStorySceneList();
    renderStoryCanvas(scene, 1);
  }

  function applySelectedStoryDialogueColor() {
    const selection = getStoryDialogueTextSelection();
    if (selection.end <= selection.start) {
      showToast("请先在对话内容中选择文字");
      return;
    }
    applyStoryDialogueTextColor(
      selection.start,
      selection.end,
      normalizeStoryTextColor(dom.storyDialogueColorInput.value)
    );
  }

  function clearSelectedStoryDialogueColor() {
    const selection = getStoryDialogueTextSelection();
    if (selection.end <= selection.start) {
      showToast("请先在对话内容中选择文字");
      return;
    }
    applyStoryDialogueTextColor(selection.start, selection.end, null);
  }

  function resetStoryDialogueColor() {
    const scene = getActiveStoryScene();
    const dialogue = scene && getActiveStoryDialogue(scene);
    if (!dialogue) {
      return;
    }
    dialogue.textColorRanges = [];
    updateStoryDialogueColorControls(dialogue);
    saveStoryProject();
    renderStoryDialogueList(scene);
    renderStorySceneList();
    renderStoryCanvas(scene, 1);
  }

  function applyStoryDialogueTextFontSize(start, end, scale) {
    const scene = getActiveStoryScene();
    const dialogue = scene && getActiveStoryDialogue(scene);
    if (!dialogue) {
      return;
    }
    const textLength = Array.from(dialogue.text || "").length;
    const safeStart = Math.max(0, Math.min(textLength, Math.floor(Number(start) || 0)));
    const safeEnd = Math.max(safeStart, Math.min(textLength, Math.floor(Number(end) || 0)));
    if (safeEnd <= safeStart) {
      return;
    }
    const sizes = getStoryTextFontSizeMap(dialogue.textFontSizeRanges, textLength);
    const normalizedScale = scale === null
      ? null
      : normalizeStoryTextFontScale(scale, STORY_DIALOGUE_RANGE_FONT_SCALE_DEFAULT);
    sizes.fill(normalizedScale, safeStart, safeEnd);
    dialogue.textFontSizeRanges = compactStoryTextFontSizeRanges(sizes);
    updateStoryDialogueRangeFontSizeControls(dialogue);
    saveStoryProject();
    renderStoryDialogueList(scene);
    renderStorySceneList();
    renderStoryCanvas(scene, 1);
  }

  function applySelectedStoryDialogueFontSize() {
    const selection = getStoryDialogueTextSelection();
    if (selection.end <= selection.start) {
      showToast("请先在对话内容中选择文字");
      return;
    }
    applyStoryDialogueTextFontSize(
      selection.start,
      selection.end,
      Number(dom.storyDialogueRangeFontSizeInput.value) / 100
    );
  }

  function clearSelectedStoryDialogueFontSize() {
    const selection = getStoryDialogueTextSelection();
    if (selection.end <= selection.start) {
      showToast("请先在对话内容中选择文字");
      return;
    }
    applyStoryDialogueTextFontSize(selection.start, selection.end, null);
  }

  function resetStoryDialogueFontSize() {
    const scene = getActiveStoryScene();
    const dialogue = scene && getActiveStoryDialogue(scene);
    if (!dialogue) {
      return;
    }
    dialogue.textFontSizeRanges = [];
    updateStoryDialogueRangeFontSizeControls(dialogue);
    saveStoryProject();
    renderStoryDialogueList(scene);
    renderStorySceneList();
    renderStoryCanvas(scene, 1);
  }

  function chooseStoryResource(role) {
    if (role === "actor") {
      openStoryCharacterPicker("servant");
      return;
    }
    openStoryCharacterPicker("backgrounds");
  }

  function openStoryCharacterPicker(kind = "servant") {
    const picker = state.story.picker;
    picker.open = true;
    picker.mode = "addActor";
    picker.targetActorId = null;
    picker.targetDialogueId = null;
    picker.kind = ["servant", "storyFigures", "backgrounds"].includes(kind) ? kind : "servant";
    picker.servantClass = "all";
    picker.servantRarity = "all";
    dom.storyCharacterPickerTitle.textContent = picker.kind === "backgrounds" ? "选择剧情图片" : "选择剧情人物";
    picker.selectedCharacter = null;
    picker.selectedSources = [];
    picker.selectedSource = null;
    picker.sourceAssets = [];
    dom.storyCharacterPicker.hidden = false;
    dom.storyPickerSearchInput.value = "";
    setStoryPickerNavigationVisible(true);
    dom.storyPickerBackToCharactersButton.textContent = "返回人物列表";
    updateStoryPickerTabs();
    resetStoryPickerProgress();
    showStoryPickerStep("characters");
    ensureStoryPickerRenderers();
    loadStoryPickerItems().catch((error) => {
      dom.storyPickerStatus.textContent = error.message || "人物数据读取失败";
    });
  }

  function setStoryPickerNavigationVisible(visible) {
    const tabs = dom.storyPickerServantTab.parentElement;
    const search = dom.storyPickerSearchInput.closest("label");
    if (tabs) {
      tabs.hidden = !visible;
    }
    if (search) {
      search.hidden = !visible;
    }
    dom.storyPickerImportButton.hidden = !visible;
  }

  function openStoryDialogueVariantPicker(actorId) {
    const scene = getActiveStoryScene();
    const dialogue = scene && getActiveStoryDialogue(scene);
    const actor = scene && scene.actors.find((item) => item.assetId === actorId);
    if (!scene || !dialogue || !actor) {
      return;
    }
    const currentVariant = getStoryDialogueActorVariant(dialogue, actor.assetId);
    const importedVariants = Array.isArray(actor.importedVariants) && actor.importedVariants.length
      ? actor.importedVariants
      : Array.isArray(currentVariant && currentVariant.importedVariants)
        ? currentVariant.importedVariants
        : [];
    const sourceUrl = actor.sourceUrl || (importedVariants.length ? `local-variant-set:${actor.assetId}` : actor.url);
    if (!sourceUrl) {
      showToast("这个人物缺少原始立绘图集，请重新选择人物立绘");
      return;
    }
    const picker = state.story.picker;
    const sourceCharacterId = String(actor.sourceCharacterId || actor.assetId);
    picker.open = true;
    picker.mode = "dialogueVariant";
    picker.targetActorId = actor.assetId;
    picker.targetDialogueId = dialogue.id;
    picker.kind = actor.pickerKind || (actor.sourceKey === "storyFigure" ? "storyFigures" : "servant");
    picker.selectedCharacter = {
      id: sourceCharacterId,
      fileName: sourceCharacterId,
      name: actor.characterName || actor.sourceCharacterName || actor.label,
      originalName: actor.sourceCharacterName || actor.characterName,
      face: actor.url
    };
    const source = {
      url: sourceUrl,
      path: Array.isArray(actor.sourcePath) && actor.sourcePath.length
        ? actor.sourcePath
        : [getFilename(sourceUrl)],
      label: actor.sourceLabel || actor.characterName || actor.label || "整体立绘",
      sourceKey: actor.sourceKey || "storyFigure",
      sourceLabel: actor.sourceLabel || "人物立绘",
      sourceIndex: Number.isInteger(actor.sourceIndex) ? actor.sourceIndex : 0,
      filename: importedVariants[0] ? importedVariants[0].filename : getFilename(sourceUrl),
      importedVariants
    };
    picker.selectedSources = [source];
    picker.selectedSource = source;
    revokeStoryPickerAssets(picker);
    picker.sourceAssets = [];
    dom.storyCharacterPickerTitle.textContent = `选择${getStoryActorDisplayName(actor, scene.actors.indexOf(actor))}的立绘差分`;
    dom.storyCharacterPicker.hidden = false;
    dom.storyPickerSearchInput.value = "";
    setStoryPickerNavigationVisible(false);
    dom.storyPickerBackToCharactersButton.textContent = "返回当前分镜";
    updateStoryPickerTabs();
    ensureStoryPickerRenderers();
    dom.storyPickerSelectedSource.textContent = source.label;
    extractStoryPickerSource(source);
  }

  function closeStoryCharacterPicker() {
    const picker = state.story.picker;
    picker.open = false;
    if (picker.loadController) {
      picker.loadController.abort();
      picker.loadController = null;
    }
    if (picker.detailController) {
      picker.detailController.abort();
      picker.detailController = null;
    }
    cancelStoryPickerExtraction(picker);
    revokeStoryPickerAssets(picker);
    picker.sourceAssets = [];
    dom.storyCharacterPicker.hidden = true;
  }

  function revokeStoryPickerAssets(picker) {
    picker.sourceAssets.forEach((asset) => {
      if ((asset.generated || asset.local) && asset.url) {
        URL.revokeObjectURL(asset.url);
      }
      if ((asset.generated || asset.local) && asset.thumbnailUrl) {
        URL.revokeObjectURL(asset.thumbnailUrl);
      }
    });
  }

  function ensureStoryPickerRenderers() {
    if (!window.FgoStoryPicker) {
      throw new Error("人物选择器模块未载入");
    }
    if (!storyCharacterBrowser) {
      storyCharacterBrowser = window.FgoStoryPicker.createCharacterBrowser({
        container: dom.storyPickerCharacterList,
        moreContainer: dom.storyPickerCharacterMore,
        scrollRoot: dom.storyPickerCharacterStep,
        pageSize: window.matchMedia("(max-width: 640px)").matches ? 32 : 48,
        imageConcurrency: 4,
        getImage: (item) => item.face,
        getTitle: (item) => item.name || item.originalName || `ID ${item.id}`,
        getMeta: (item) => item.local && Array.isArray(item.variants)
          ? `本地差分集 · ${item.variants.length} 张`
          : state.story.picker.kind === "servant"
            ? `No.${item.collectionNo || "--"} · ${CLASS_LABELS[item.className] || item.className || "unknown"}`
          : state.story.picker.kind === "backgrounds"
            ? `${item.backgroundTypeLabel || "剧情图片"} · ${formatFileSize(item.size)}`
            : `ID ${item.fileName || item.id}`,
        getSearchText: (item) => [
          item.name,
          item.originalName,
          item.id,
          item.fileName,
          item.collectionNo,
          item.className
        ].join(" "),
        onSelect: selectStoryPickerCharacter,
        onResults: (visibleCount, totalCount) => {
          const noun = getStoryPickerNoun();
          dom.storyPickerStatus.textContent = totalCount
            ? `显示 ${visibleCount} / ${totalCount} ${noun}`
            : `没有匹配的${noun}`;
        }
      });
    }
    if (!storyPickerSourceImageLoader) {
      storyPickerSourceImageLoader = window.FgoStoryPicker.createQueuedImageLoader({
        root: dom.storyPickerSourceStep,
        maxConcurrent: 2,
        rootMargin: "180px"
      });
    }
    if (!storyPickerVariantImageLoader) {
      storyPickerVariantImageLoader = window.FgoStoryPicker.createQueuedImageLoader({
        root: dom.storyPickerVariantStep,
        maxConcurrent: 4,
        rootMargin: "260px"
      });
    }
  }

  function cancelStoryPickerExtraction(picker) {
    if (picker.extractionController) {
      picker.extractionController.abort();
      picker.extractionController = null;
    }
  }

  function resetStoryPickerProgress() {
    dom.storyPickerProgress.hidden = true;
    dom.storyPickerProgress.classList.remove("is-error");
    dom.storyPickerProgressTitle.textContent = "正在准备提取";
    dom.storyPickerProgressCount.textContent = "--";
    dom.storyPickerProgressPhase.textContent = "正在准备图集";
    dom.storyPickerProgressBar.removeAttribute("value");
    dom.storyPickerProgressBar.max = 1;
  }

  function updateStoryPickerProgress(progress = {}) {
    const completed = Math.max(0, Number(progress.completed) || 0);
    const total = Math.max(0, Number(progress.total) || 0);
    const extracted = Math.max(0, Number(progress.extracted) || 0);
    const done = Boolean(progress.done);
    const error = Boolean(progress.error);
    dom.storyPickerProgress.hidden = false;
    dom.storyPickerProgress.classList.toggle("is-error", error);
    dom.storyPickerProgressTitle.textContent = error
      ? "立绘差分提取失败"
      : done ? "立绘差分提取完成" : "正在自动提取立绘差分";
    dom.storyPickerProgressCount.textContent = total
      ? `${completed} / ${total} · 已生成 ${extracted} 张`
      : "正在准备...";
    dom.storyPickerProgressPhase.textContent = progress.phase || (done ? "可以选择差分加入当前分镜" : "正在处理图集");
    if (total) {
      dom.storyPickerProgressBar.max = total;
      dom.storyPickerProgressBar.value = Math.min(completed, total);
    } else {
      dom.storyPickerProgressBar.removeAttribute("value");
    }
  }

  function showStoryPickerStep(step) {
    if (step !== "variants") {
      resetStoryPickerProgress();
    }
    dom.storyPickerCharacterStep.hidden = step !== "characters";
    dom.storyPickerCharacterStep.classList.toggle("is-background-picker", state.story.picker.kind === "backgrounds");
    dom.storyPickerSourceStep.hidden = step !== "sources";
    dom.storyPickerVariantStep.hidden = step !== "variants";
    if (step !== "variants") {
      dom.storyPickerRefreshVariantsButton.hidden = false;
    }
    if (state.story.picker.mode === "dialogueVariant") {
      dom.storyPickerDescription.textContent = "选择一个立绘差分，仅应用到当前对话段。";
    } else if (step === "characters") {
      dom.storyPickerDescription.textContent = state.story.picker.kind === "backgrounds"
        ? "搜索或浏览剧情图片，点击即可将背景加入当前分镜。"
        : "先搜索或浏览人物，再选择对应的整体立绘；同一角色可重复加入不同形态。";
    } else if (step === "sources") {
      dom.storyPickerDescription.textContent = "选择一个人物立绘图集，工具会自动提取其中的立绘差分。";
    } else {
      dom.storyPickerDescription.textContent = "选择一个表情立绘加入当前分镜。";
    }
  }

  function updateStoryPickerTabs() {
    const kind = state.story.picker.kind;
    if (state.story.picker.mode !== "dialogueVariant") {
      dom.storyCharacterPickerTitle.textContent = kind === "backgrounds" ? "选择剧情图片" : "选择剧情人物";
    }
    [[dom.storyPickerServantTab, "servant"], [dom.storyPickerFigureTab, "storyFigures"],
      [dom.storyPickerBackgroundTab, "backgrounds"]].forEach(([tab, value]) => {
      const active = kind === value;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    const showFilters = kind === "servant" && state.story.picker.mode !== "dialogueVariant";
    dom.storyPickerFilters.hidden = !showFilters;
    const canImport = state.story.picker.mode !== "dialogueVariant";
    dom.storyPickerImportButton.hidden = !canImport;
    dom.storyPickerImportButton.textContent = kind === "backgrounds"
      ? "导入外部背景"
      : "导入人物差分集";
    dom.storyPickerImportInput.multiple = true;
  }

  function getStoryPickerNoun(kind = state.story.picker.kind) {
    return kind === "backgrounds" ? "剧情图片" : kind === "servant" ? "从者" : "剧情人物";
  }

  function updateStoryPickerFilters() {
    const picker = state.story.picker;
    const isServant = picker.kind === "servant" && picker.mode !== "dialogueVariant";
    dom.storyPickerFilters.hidden = !isServant;
    if (!isServant) {
      return;
    }
    const classes = [...new Set(picker.items
      .map((item) => String(item.className || "").trim())
      .filter(Boolean))].sort((a, b) => (CLASS_LABELS[a] || a).localeCompare(CLASS_LABELS[b] || b));
    const rarities = [...new Set(picker.items
      .map((item) => Number(item.rarity))
      .filter(Number.isFinite))].sort((a, b) => b - a);
    const previousClass = picker.servantClass;
    const previousRarity = picker.servantRarity;
    dom.storyPickerClassSelect.replaceChildren(new Option("全部职介", "all"));
    classes.forEach((className) => dom.storyPickerClassSelect.add(
      new Option(CLASS_LABELS[className] || className, className)
    ));
    dom.storyPickerRaritySelect.replaceChildren(new Option("全部星级", "all"));
    rarities.forEach((rarity) => dom.storyPickerRaritySelect.add(new Option(`${rarity} 星`, String(rarity))));
    picker.servantClass = classes.includes(previousClass) ? previousClass : "all";
    picker.servantRarity = rarities.includes(Number(previousRarity)) ? previousRarity : "all";
    dom.storyPickerClassSelect.value = picker.servantClass;
    dom.storyPickerRaritySelect.value = String(picker.servantRarity);
  }

  function createLocalStoryResourceId(prefix) {
    const suffix = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${suffix}`;
  }

  function getImportedStoryCharacterName(files) {
    const firstName = files[0] ? String(files[0].name || "") : "";
    const stem = firstName.replace(/\.[^.]+$/, "").trim();
    const withoutVariantNumber = stem
      .replace(/[\s_.-]*(?:差分|表情|variant|expression)?[\s_.-]*\d+$/i, "")
      .trim();
    return (withoutVariantNumber || stem || "导入人物").slice(0, 80);
  }

  async function hydrateLocalStoryPickerItem(item, cacheKey, targetProperty) {
    if (item[targetProperty]) {
      return item;
    }
    const blob = await readStoryAssetBlob(cacheKey);
    if (!(blob instanceof Blob) || !blob.size) {
      return item;
    }
    const url = URL.createObjectURL(blob);
    state.story.objectUrls.add(url);
    item[targetProperty] = url;
    return item;
  }

  async function getLocalStoryPickerItems(kind) {
    const project = state.story.project;
    if (kind === "backgrounds") {
      const backgrounds = Array.isArray(project.localBackgrounds) ? project.localBackgrounds : [];
      await Promise.all(backgrounds.map(async (background) => {
        try {
          await hydrateLocalStoryPickerItem(background, background.cacheKey, "face");
          background.url = background.face;
        } catch (_error) {
          background.face = null;
          background.url = null;
        }
      }));
      return backgrounds.filter((background) => background.face);
    }
    if (kind !== "servant") {
      return [];
    }
    const characters = Array.isArray(project.localCharacters) ? project.localCharacters : [];
    await Promise.all(characters.map(async (character) => {
      const firstVariant = character.variants && character.variants[0];
      if (!firstVariant) {
        return;
      }
      try {
        await hydrateLocalStoryPickerItem(character, firstVariant.cacheKey, "previewUrl");
        character.face = character.previewUrl;
      } catch (_error) {
        character.face = null;
      }
    }));
    return characters.filter((character) => character.face);
  }

  async function readImportedStoryVariants(source) {
    const descriptors = Array.isArray(source.importedVariants) ? source.importedVariants : [];
    const assets = await Promise.all(descriptors.map(async (descriptor, index) => {
      const blob = await readStoryAssetBlob(descriptor.cacheKey);
      if (!(blob instanceof Blob) || !blob.size) {
        return null;
      }
      return {
        ...descriptor,
        blob,
        url: URL.createObjectURL(blob),
        thumbnailUrl: null,
        sourceUrl: source.sourceUrl || `local-variant-set:${source.id || "unknown"}`,
        sourceIndex: Number.isInteger(descriptor.sourceIndex) ? descriptor.sourceIndex : 0,
        expressionIndex: Number(descriptor.expressionIndex) || index + 1,
        generated: true,
        local: true
      };
    }));
    return assets.filter(Boolean);
  }

  async function importLocalStoryBackgrounds(files) {
    const imported = [];
    try {
      for (const file of files) {
        const id = createLocalStoryResourceId("local-background");
        const cacheKey = `${id}:image`;
        await writeStoryAssetBlob(cacheKey, file);
        const background = normalizeLocalStoryBackground({
          id,
          cacheKey,
          name: file.name.replace(/\.[^.]+$/, "") || "导入背景",
          filename: file.name,
          mimeType: file.type || "image/png"
        });
        const url = URL.createObjectURL(file);
        state.story.objectUrls.add(url);
        background.face = url;
        background.url = url;
        imported.push(background);
      }
    } catch (error) {
      await Promise.all(imported.map((background) => deleteStoryAssetBlob(background.cacheKey).catch(() => {})));
      throw error;
    }
    state.story.project.localBackgrounds ||= [];
    state.story.project.localBackgrounds.unshift(...imported);
    const scene = getActiveStoryScene();
    if (scene && imported[0]) {
      scene.background = {
        ...imported[0],
        assetId: imported[0].id,
        kind: "background",
        label: imported[0].name
      };
    }
    saveStoryProject();
    renderStoryEditor();
    closeStoryCharacterPicker();
    showToast(`已导入 ${imported.length} 张背景，当前使用 ${imported[0].name}`);
  }

  async function importLocalStoryCharacter(files) {
    const sortedFiles = [...files].sort((left, right) =>
      String(left.name).localeCompare(String(right.name), undefined, { numeric: true, sensitivity: "base" })
    );
    const id = createLocalStoryResourceId("local-character");
    const sourceUrl = `local-variant-set:${id}`;
    const variants = [];
    try {
      for (let index = 0; index < sortedFiles.length; index += 1) {
        const file = sortedFiles[index];
        const cacheKey = `${id}:variant:${String(index + 1).padStart(3, "0")}`;
        await writeStoryAssetBlob(cacheKey, file);
        variants.push(normalizeLocalStoryVariant({
          cacheKey,
          filename: file.name,
          label: file.name.replace(/\.[^.]+$/, "") || `差分 ${index + 1}`,
          expressionIndex: index + 1,
          sourceIndex: 0,
          sourceUrl,
          mimeType: file.type || "image/png"
        }, index));
      }
    } catch (error) {
      await Promise.all(variants.map((variant) => deleteStoryAssetBlob(variant.cacheKey).catch(() => {})));
      throw error;
    }
    const character = normalizeLocalStoryCharacter({
      id,
      name: getImportedStoryCharacterName(sortedFiles),
      originalName: "本地导入",
      variants
    });
    const previewUrl = URL.createObjectURL(sortedFiles[0]);
    state.story.objectUrls.add(previewUrl);
    character.previewUrl = previewUrl;
    character.face = previewUrl;
    state.story.project.localCharacters ||= [];
    state.story.project.localCharacters.unshift(character);
    saveStoryProject();

    const picker = state.story.picker;
    picker.selectedCharacter = character;
    const source = {
      id,
      url: previewUrl,
      sourceUrl,
      path: [id],
      label: `${character.name}差分集`,
      sourceKey: "localVariantSet",
      sourceLabel: `本地差分集 · ${variants.length} 张`,
      sourceIndex: 0,
      filename: variants[0].filename,
      importedVariants: variants
    };
    picker.selectedSources = [source];
    picker.selectedSource = source;
    dom.storyPickerSelectedCharacter.textContent = character.name;
    await extractStoryPickerSource(source);
    showToast(`已导入人物差分集 · ${character.name} · ${variants.length} 张`);
  }

  async function importStoryPickerImages(fileList) {
    const files = Array.from(fileList || []).filter((file) => /^image\//i.test(String(file.type || "")));
    dom.storyPickerImportInput.value = "";
    if (!files.length) {
      showToast("请选择 PNG、JPEG 或 WebP 图片");
      return;
    }
    dom.storyPickerImportButton.disabled = true;
    dom.storyPickerStatus.textContent = state.story.picker.kind === "backgrounds"
      ? `正在保存 ${files.length} 张外部背景`
      : `正在保存 ${files.length} 张人物差分`;
    try {
      if (state.story.picker.kind === "backgrounds") {
        await importLocalStoryBackgrounds(files);
      } else {
        await importLocalStoryCharacter(files);
      }
    } catch (_error) {
      dom.storyPickerStatus.textContent = "外部图片导入失败，请检查文件或设备存储空间";
      showToast("外部图片导入失败");
    } finally {
      dom.storyPickerImportButton.disabled = false;
    }
  }

  async function loadStoryPickerItems() {
    const picker = state.story.picker;
    ensureStoryPickerRenderers();
    if (picker.loadController) {
      picker.loadController.abort();
      picker.loadController = null;
    }
    const kind = picker.kind;
    const cacheKey = `${state.region}:${kind}`;
    const localItems = await getLocalStoryPickerItems(kind);
    if (picker.cache.has(cacheKey)) {
      picker.items = [...localItems, ...picker.cache.get(cacheKey)];
      renderStoryPickerCharacters();
      return;
    }
    const controller = new AbortController();
    picker.loadController = controller;
    const config = kind === "servant"
      ? LIBRARIES.servant
      : kind === "backgrounds" ? LIBRARIES.backgrounds : LIBRARIES.storyFigures;
    dom.storyPickerStatus.textContent = `正在读取 ${getStoryPickerNoun(kind)}数据`;
    storyCharacterBrowser.showLoading(window.matchMedia("(max-width: 640px)").matches ? 8 : 12);
    let items;
    try {
      const response = await fetch(`${API_BASE}/export/${state.region}/${config.exportFile}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`${kind === "backgrounds" ? "剧情图片" : "人物"}数据返回 ${response.status}`);
      }
      items = await response.json();
    } catch (error) {
      if (!localItems.length || (error && error.name === "AbortError")) {
        throw error;
      }
      picker.items = localItems;
      picker.loadController = null;
      renderStoryPickerCharacters();
      dom.storyPickerStatus.textContent = `在线数据读取失败，当前显示 ${localItems.length} 个本地素材`;
      return;
    }
    if (picker.kind !== kind) {
      return;
    }
    const remoteItems = normalizeLibraryItems(items, config, state.region);
    picker.items = [...localItems, ...remoteItems];
    picker.cache.set(cacheKey, remoteItems);
    if (picker.loadController === controller) {
      picker.loadController = null;
    }
    renderStoryPickerCharacters();
  }

  function renderStoryPickerCharacters() {
    const picker = state.story.picker;
    ensureStoryPickerRenderers();
    updateStoryPickerFilters();
    const filtered = picker.kind === "servant"
      ? picker.items.filter((item) => (
        (picker.servantClass === "all" || String(item.className || "") === picker.servantClass) &&
        (picker.servantRarity === "all" || String(item.rarity) === String(picker.servantRarity))
      ))
      : picker.items;
    picker.filteredItems = storyCharacterBrowser.setItems(filtered, dom.storyPickerSearchInput.value);
  }

  async function selectStoryPickerCharacter(item) {
    const picker = state.story.picker;
    if (picker.kind === "backgrounds") {
      const scene = getActiveStoryScene();
      if (scene) {
        scene.background = {
          assetId: String(item.id),
          kind: "background",
          url: item.face,
          sourceUrl: item.face,
          label: item.name || item.originalName || `背景 ${item.id}`,
          filename: item.filename || item.originalName || getFilename(item.face),
          cacheKey: item.cacheKey || null,
          local: Boolean(item.local),
          generated: Boolean(item.generated)
        };
        saveStoryProject();
        renderStoryEditor();
        dom.storyResourceHint.textContent = "已选择剧情图片，可继续选择人物或编辑当前分镜。";
        closeStoryCharacterPicker();
        showToast(`已加入当前分镜背景 · ${item.name || item.id}`);
      }
      return;
    }
    if (item.local && Array.isArray(item.variants) && item.variants.length) {
      picker.selectedCharacter = item;
      const source = {
        id: item.id,
        url: item.face,
        sourceUrl: `local-variant-set:${item.id}`,
        path: [item.id],
        label: `${item.name}差分集`,
        sourceKey: "localVariantSet",
        sourceLabel: `本地差分集 · ${item.variants.length} 张`,
        sourceIndex: 0,
        filename: item.variants[0].filename,
        importedVariants: item.variants
      };
      picker.selectedSources = [source];
      picker.selectedSource = source;
      dom.storyPickerSelectedCharacter.textContent = item.name;
      await extractStoryPickerSource(source);
      return;
    }
    if (picker.detailController) {
      picker.detailController.abort();
    }
    picker.selectedCharacter = item;
    picker.selectedSource = null;
    revokeStoryPickerAssets(picker);
    picker.sourceAssets = [];
    dom.storyPickerSelectedCharacter.textContent = item.name || item.originalName || `ID ${item.id}`;
    showStoryPickerStep("sources");
    dom.storyPickerSourceList.replaceChildren();
    dom.storyPickerStatus.textContent = "正在读取人物立绘图集";
    const controller = new AbortController();
    picker.detailController = controller;
    try {
      if (picker.kind === "storyFigures") {
        picker.selectedSources = [{
          ...item,
          url: item.face,
          path: [item.path || item.fileName],
          label: item.name || item.fileName,
          sourceKey: "storyFigure",
          sourceLabel: "剧情立绘",
          sourceIndex: 0,
          filename: item.originalName || getFilename(item.face)
        }];
      } else {
        const response = await fetch(`${API_BASE}/nice/${state.region}/servant/${item.id}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`人物详情返回 ${response.status}`);
        }
        const detail = await response.json();
        picker.selectedSources = collectDialogueAssets(detail.extraAssets || {});
      }
      if (picker.selectedCharacter === item && picker.detailController === controller) {
        renderStoryPickerSources();
      }
    } catch (error) {
      if (error && error.name !== "AbortError") {
        dom.storyPickerStatus.textContent = error.message || "立绘图集读取失败";
      }
    } finally {
      if (picker.detailController === controller) {
        picker.detailController = null;
      }
    }
  }

  function renderStoryPickerSources() {
    const picker = state.story.picker;
    resetStoryPickerProgress();
    dom.storyPickerSourceList.replaceChildren();
    storyPickerSourceImageLoader.clear();
    picker.selectedSources.forEach((source) => {
      const button = document.createElement("button");
      button.className = "story-picker-card story-picker-source-card";
      button.type = "button";
      button.addEventListener("click", () => extractStoryPickerSource(source));
      const image = document.createElement("img");
      storyPickerSourceImageLoader.watch(image, source.url, false);
      const copy = document.createElement("span");
      copy.className = "story-picker-card-copy";
      const title = document.createElement("strong");
      title.textContent = source.label || source.filename || "立绘图集";
      const meta = document.createElement("small");
      meta.textContent = source.sourceLabel || "整体立绘";
      copy.append(title, meta);
      button.append(image, copy);
      dom.storyPickerSourceList.append(button);
    });
    dom.storyPickerStatus.textContent = picker.selectedSources.length
      ? `找到 ${picker.selectedSources.length} 个立绘图集`
      : "没有找到可用的立绘图集";
  }

  async function extractStoryPickerSource(source, options = {}) {
    const picker = state.story.picker;
    if (picker.extractionController) {
      picker.extractionController.abort();
    }
    picker.selectedSource = source;
    revokeStoryPickerAssets(picker);
    picker.sourceAssets = [];
    dom.storyPickerSelectedSource.textContent = source.label || source.filename || "立绘图集";
    showStoryPickerStep("variants");
    dom.storyPickerVariantList.replaceChildren();
    dom.storyPickerStatus.textContent = "正在自动提取立绘差分";
    updateStoryPickerProgress({ phase: "正在准备图集" });
    const isImportedSet = Array.isArray(source.importedVariants) && source.importedVariants.length > 0;
    dom.storyPickerRefreshVariantsButton.hidden = isImportedSet;
    if (isImportedSet) {
      try {
        picker.sourceAssets = await readImportedStoryVariants(source);
        picker.sourceAssets.forEach((asset) => {
          if (asset.url) {
            state.story.objectUrls.add(asset.url);
          }
        });
        if (picker.open && picker.selectedSource === source) {
          renderStoryPickerVariants({ cached: true, imported: true });
        }
      } catch (_error) {
        dom.storyPickerStatus.textContent = "本地人物差分集读取失败，请重新导入";
        updateStoryPickerProgress({ error: true, phase: "本地差分图片不存在或设备存储不可用" });
      }
      return;
    }
    const variantCacheKey = getStoryVariantCacheKey(picker, source);
    if (!options.force) {
      let cachedAssets = picker.variantCache.get(variantCacheKey);
      if (!cachedAssets || !cachedAssets.length) {
        try {
          cachedAssets = await readStoryVariantSetCache(variantCacheKey);
          if (cachedAssets.length) {
            picker.variantCache.set(variantCacheKey, cachedAssets);
          }
        } catch (_error) {
          cachedAssets = [];
        }
      }
      if (cachedAssets && cachedAssets.length && picker.open && picker.selectedSource === source) {
        picker.sourceAssets = cachedAssets.map(createStoryPickerAssetUrls);
        renderStoryPickerVariants({ cached: true });
        return;
      }
    }
    if (!picker.open || picker.selectedSource !== source) {
      return;
    }
    const controller = new AbortController();
    picker.extractionController = controller;
    const previousModalItem = state.modalItem;
    state.modalItem = picker.selectedCharacter;
    try {
      picker.sourceAssets = await extractFigureVariants(
        source,
        source.sourceIndex || 0,
        new Set(),
        controller.signal,
        (progress) => {
          if (picker.extractionController === controller && picker.open) {
            updateStoryPickerProgress(progress);
          }
        }
      );
      const cacheableAssets = picker.sourceAssets
        .filter((asset) => asset.blob)
        .map(({ url: _url, thumbnailUrl: _thumbnailUrl, ...asset }) => ({ ...asset }));
      picker.variantCache.set(variantCacheKey, cacheableAssets);
      try {
        await writeStoryVariantSetCache(variantCacheKey, cacheableAssets);
      } catch (_error) {
        showToast("差分已提取，但设备缓存空间不足");
      }
      renderStoryPickerVariants();
    } catch (error) {
      if (!error || error.name !== "AbortError") {
        dom.storyPickerStatus.textContent = error.message || "立绘差分提取失败";
        updateStoryPickerProgress({ error: true, phase: error.message || "请返回立绘图集后重试" });
      }
    } finally {
      state.modalItem = previousModalItem;
      if (picker.extractionController === controller) {
        picker.extractionController = null;
      }
    }
  }

  function renderStoryPickerVariants(options = {}) {
    const picker = state.story.picker;
    dom.storyPickerVariantList.replaceChildren();
    storyPickerVariantImageLoader.clear();
    picker.sourceAssets.forEach((asset, index) => {
      const button = document.createElement("button");
      button.className = "story-picker-card story-picker-variant-card";
      button.type = "button";
      button.addEventListener("click", () => useStoryPickerVariant(asset));
      const image = document.createElement("img");
      // Generated previews are local blob URLs. Queue every one explicitly so
      // Android WebViews do not depend on an unreliable nested IntersectionObserver.
      storyPickerVariantImageLoader.watch(image, asset.thumbnailUrl || asset.url, true);
      image.className = asset.thumbnailUrl ? "is-face-thumbnail" : "is-figure-thumbnail";
      const copy = document.createElement("span");
      copy.className = "story-picker-card-copy";
      const title = document.createElement("strong");
      title.textContent = asset.local
        ? asset.label || `差分 ${asset.expressionIndex || index + 1}`
        : `表情 ${asset.expressionIndex || index + 1}`;
      const meta = document.createElement("small");
      meta.textContent = picker.selectedCharacter.name || "人物立绘";
      copy.append(title, meta);
      button.append(image, copy);
      dom.storyPickerVariantList.append(button);
    });
    dom.storyPickerStatus.textContent = picker.sourceAssets.length
      ? `${options.cached ? "已从本地缓存读取" : "已提取"} ${picker.sourceAssets.length} 个立绘表情，点击即可${picker.mode === "dialogueVariant" ? "应用到当前对话" : "加入分镜"}`
      : "没有提取到立绘差分";
    const total = Math.max(Number(dom.storyPickerProgressBar.max) || 0, picker.sourceAssets.length);
    updateStoryPickerProgress({
      completed: total,
      total,
      extracted: picker.sourceAssets.length,
      done: true,
      phase: picker.sourceAssets.length
        ? options.cached
          ? "已读取本地缓存，无需重新提取"
          : "提取完成，可以选择差分加入当前分镜"
        : "处理完成，但没有识别到可用的立绘差分"
    });
  }

  async function useStoryPickerVariant(asset) {
    if (state.story.picker.mode === "dialogueVariant") {
      await applyStoryDialogueActorVariant(asset);
      closeStoryCharacterPicker();
      return;
    }
    await addStoryActorToScene(asset, state.story.picker.selectedCharacter);
    closeStoryCharacterPicker();
  }

  async function applyStoryDialogueActorVariant(asset) {
    const picker = state.story.picker;
    const scene = getActiveStoryScene();
    const dialogue = scene && getStoryDialogues(scene).find((item) => item.id === picker.targetDialogueId);
    const actor = scene && scene.actors.find((item) => item.assetId === picker.targetActorId);
    if (!scene || !dialogue || !actor || !asset) {
      return;
    }
    const generatedCacheKey = asset.cacheKey || (asset.generated
      ? `actor:${state.region}:${actor.assetId}:${sanitizeFilename(getFilename(asset.sourceUrl || actor.sourceUrl || "figure"))}:${asset.sourceIndex}:${asset.expressionIndex}`
      : null);
    const thumbnailCacheKey = generatedCacheKey && asset.thumbnailBlob ? `${generatedCacheKey}:face` : null;
    const importedVariants = Array.isArray(actor.importedVariants)
      ? actor.importedVariants.map((variant) => ({ ...variant, url: null, thumbnailUrl: null }))
      : null;
    let variantUrl = asset.url;
    let variantThumbnailUrl = asset.thumbnailUrl || null;
    if (generatedCacheKey && asset.blob) {
      variantUrl = URL.createObjectURL(asset.blob);
      state.story.objectUrls.add(variantUrl);
      if (asset.thumbnailBlob) {
        variantThumbnailUrl = URL.createObjectURL(asset.thumbnailBlob);
        state.story.objectUrls.add(variantThumbnailUrl);
      }
      try {
        await writeStoryAssetBlob(generatedCacheKey, asset.blob);
        if (thumbnailCacheKey) {
          await writeStoryAssetBlob(thumbnailCacheKey, asset.thumbnailBlob);
        }
      } catch (_error) {
        // Keep the object URL available for the current editing session.
      }
    }
    dialogue.actorVariants ||= {};
    dialogue.actorVariants[actor.assetId] = {
      url: variantUrl,
      sourceUrl: asset.sourceUrl || actor.sourceUrl,
      sourceIndex: asset.sourceIndex,
      expressionIndex: asset.expressionIndex,
      cacheKey: generatedCacheKey,
      thumbnailUrl: variantThumbnailUrl,
      thumbnailCacheKey,
      label: asset.label || asset.filename || actor.label,
      filename: asset.filename || getFilename(asset.url),
      generated: Boolean(asset.generated),
      local: Boolean(asset.local),
      importedVariants
    };
    saveStoryProject();
    renderStoryDialogueList(scene);
    renderStoryDialogueVariantControls(scene);
    renderStoryCanvas(scene, 1);
    showToast(`已更新当前对话 · ${getStoryActorDisplayName(actor, scene.actors.indexOf(actor))} 表情 ${asset.expressionIndex || ""}`.trim());
  }

  async function addStoryActorToScene(asset, character) {
    const scene = getActiveStoryScene();
    if (!scene || !asset || !character) {
      return;
    }
    const characterId = String(character.id || character.fileName || "unknown");
    const generatedCacheKey = asset.cacheKey || (asset.generated
      ? `actor:${state.region}:${characterId}:${sanitizeFilename(getFilename(asset.sourceUrl || asset.url || "figure"))}:${asset.sourceIndex}:${asset.expressionIndex}`
      : null);
    const thumbnailCacheKey = generatedCacheKey && asset.thumbnailBlob ? `${generatedCacheKey}:face` : null;
    let storyAssetUrl = asset.url;
    let storyThumbnailUrl = asset.thumbnailUrl || null;
    if (generatedCacheKey && asset.blob) {
      storyAssetUrl = URL.createObjectURL(asset.blob);
      state.story.objectUrls.add(storyAssetUrl);
      if (asset.thumbnailBlob) {
        storyThumbnailUrl = URL.createObjectURL(asset.thumbnailBlob);
        state.story.objectUrls.add(storyThumbnailUrl);
      }
      try {
        await writeStoryAssetBlob(generatedCacheKey, asset.blob);
        if (thumbnailCacheKey) {
          await writeStoryAssetBlob(thumbnailCacheKey, asset.thumbnailBlob);
        }
      } catch (_error) {
        // The separate object URL keeps the current editing session usable.
      }
    }
    const sourceCharacterName = getStoryCharacterName(character, characterId);
    const selectedSource = state.story.picker.selectedSource;
    const actor = {
      assetId: createStoryActorInstanceId(scene),
      sourceCharacterId: characterId,
      url: storyAssetUrl,
      sourceUrl: asset.sourceUrl || asset.url,
      sourceIndex: asset.sourceIndex,
      expressionIndex: asset.expressionIndex,
      sourceKey: selectedSource && selectedSource.sourceKey,
      sourcePath: selectedSource && Array.isArray(selectedSource.path) ? [...selectedSource.path] : null,
      sourceLabel: selectedSource && (selectedSource.label || selectedSource.sourceLabel),
      pickerKind: state.story.picker.kind,
      cacheKey: generatedCacheKey,
      thumbnailUrl: storyThumbnailUrl,
      thumbnailCacheKey,
      characterName: sourceCharacterName,
      sourceCharacterName,
      label: asset.label || asset.filename || character.name || "人物",
      filename: asset.filename || getFilename(asset.url),
      generated: Boolean(asset.generated),
      local: Boolean(asset.local),
      importedVariants: selectedSource && Array.isArray(selectedSource.importedVariants)
        ? selectedSource.importedVariants.map((variant) => ({ ...variant, url: null, thumbnailUrl: null }))
        : null,
      kind: "storyFigure",
      layout: "auto",
      opacity: 1,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      colorMode: "auto",
      entryAnimation: "cut"
    };
    scene.actors.push(actor);
    state.story.uniformTransformSessionByScene.delete(scene.id);
    state.story.selectedActorByScene.set(scene.id, actor.assetId);
    scene.selectedActorId = actor.assetId;
    const dialogue = getActiveStoryDialogue(scene);
    dialogue.actorId = actor.assetId;
    dialogue.speaker = actor.characterName;
    saveStoryProject();
    renderStoryEditor();
    const sameCharacterCount = scene.actors.filter((item) => item.sourceCharacterId === characterId).length;
    showToast(`已加入当前分镜人物 · ${character.name || character.fileName || characterId}${
      sameCharacterCount > 1 ? ` · 同角色第 ${sameCharacterCount} 个形态` : ""
    }`);
  }

  let storyRenderer = null;

  function getStoryFontSetting() {
    return readSetting("story-font-preview-v2", "font-fzzhengzhong");
  }

  function normalizeStoryDialogueFontScale(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return STORY_DIALOGUE_FONT_SCALE_DEFAULT;
    }
    return Math.max(
      STORY_DIALOGUE_FONT_SCALE_MIN,
      Math.min(STORY_DIALOGUE_FONT_SCALE_MAX, numericValue)
    );
  }

  function getStoryDialogueFontScale() {
    return normalizeStoryDialogueFontScale(
      readSetting(STORY_DIALOGUE_FONT_SCALE_SETTING, STORY_DIALOGUE_FONT_SCALE_DEFAULT)
    );
  }

  function updateStoryDialogueFontSizeControl() {
    if (!dom.storyDialogueFontSizeInput) {
      return;
    }
    const scale = getStoryDialogueFontScale();
    const percentage = Math.round(scale * 100);
    dom.storyDialogueFontSizeInput.value = String(percentage);
    if (dom.storyDialogueFontSizeValue) {
      dom.storyDialogueFontSizeValue.value = `${percentage}%`;
      dom.storyDialogueFontSizeValue.textContent = `${percentage}%`;
    }
  }

  function updateStoryDialogueFontSize() {
    if (!dom.storyDialogueFontSizeInput) {
      return;
    }
    const scale = normalizeStoryDialogueFontScale(
      Number(dom.storyDialogueFontSizeInput.value) / 100
    );
    saveSetting(STORY_DIALOGUE_FONT_SCALE_SETTING, String(scale));
    updateStoryDialogueFontSizeControl();
    const scene = getActiveStoryScene();
    if (scene) {
      renderStoryCanvas(scene, 1);
    }
  }

  function updateStoryFont() {
    if (!storyRenderer || !dom.storyFontSelect) {
      return;
    }
    const selectedKey = dom.storyFontSelect.value || "system";
    const previousKey = storyRenderer.getFont().key;
    dom.storyFontSelect.disabled = true;
    storyRenderer.setFont(selectedKey).then((font) => {
      saveSetting("story-font-preview-v2", font.key);
      dom.storyFontSelect.value = font.key;
      showToast(`已切换预览字体：${font.label}`);
    }).catch(() => {
      dom.storyFontSelect.value = previousKey;
      showToast("字体载入失败，已保留原字体");
    }).finally(() => {
      dom.storyFontSelect.disabled = false;
    });
  }

  function renderStoryCanvas(
    scene,
    progress,
    dialogue = null,
    animateActors = false,
    actorAnimationProgress = 1
  ) {
    if (!dom.storyCanvas || !scene || !window.FgoStoryRenderer) {
      return;
    }
    if (!storyRenderer) {
      storyRenderer = window.FgoStoryRenderer.createRenderer({
        canvas: dom.storyCanvas,
        imageCache: state.story.imageCache,
        getAspect: () => state.story.project.aspect,
        getFontScale: getStoryDialogueFontScale,
        shouldRender: () => state.story.open
      });
      if (dom.storyFontSelect) {
        const savedFont = getStoryFontSetting();
        dom.storyFontSelect.value = Object.prototype.hasOwnProperty.call(window.FgoStoryRenderer.fontOptions, savedFont)
          ? savedFont
          : "font-fzzhengzhong";
        storyRenderer.setFont(dom.storyFontSelect.value).catch(() => {
          dom.storyFontSelect.value = "font-fzzhengzhong";
        });
      }
    }
    const activeDialogue = dialogue || getActiveStoryDialogue(scene);
    const renderScene = createStoryRenderScene(
      scene,
      activeDialogue,
      animateActors,
      actorAnimationProgress
    );
    if (typeof storyRenderer.requestRender === "function") {
      // Interactive edits are coalesced into one paint per animation frame.
      storyRenderer.requestRender(renderScene, progress);
    } else {
      storyRenderer.render(renderScene, progress);
    }
  }

  function playStoryScene() {
    const scene = getActiveStoryScene();
    if (!scene) {
      return;
    }
    if (state.story.playbackFrame) {
      cancelAnimationFrame(state.story.playbackFrame);
      state.story.playbackFrame = null;
      dom.storyPlayButton.textContent = "▶";
      renderStoryCanvas(scene, 1);
      return;
    }
    const dialogues = getStoryDialogues(scene);
    const totalDuration = dialogues.reduce((total, dialogue) => total + dialogue.duration, 0);
    const startedAt = performance.now();
    let playbackDialogueId = null;
    let playbackDialogueIndex = 0;
    let playbackDialogueStart = 0;
    state.story.playbackEnd = startedAt + totalDuration * 1000;
    dom.storyPlayButton.textContent = "■";
    const frame = (now) => {
      const elapsed = Math.max(0, (now - startedAt) / 1000);
      while (
        playbackDialogueIndex < dialogues.length - 1 &&
        elapsed >= playbackDialogueStart + dialogues[playbackDialogueIndex].duration
      ) {
        playbackDialogueStart += dialogues[playbackDialogueIndex].duration;
        playbackDialogueIndex += 1;
      }
      const dialogueIndex = playbackDialogueIndex;
      const dialogueStart = playbackDialogueStart;
      const dialogue = dialogues[dialogueIndex];
      const dialogueProgress = Math.min(1, Math.max(0, (elapsed - dialogueStart) / dialogue.duration));
      if (playbackDialogueId !== dialogue.id) {
        playbackDialogueId = dialogue.id;
        scene.activeDialogueId = dialogue.id;
        scene.dialogue = dialogue;
        dom.storySpeakerInput.value = dialogue.speaker || "";
        dom.storySpeakerInput.readOnly = Boolean(dialogue.actorId);
        dom.storySpeakerInput.title = dialogue.actorId
          ? "人物名称请在人物通用选项中修改"
          : "旁白名称可选，留空时不显示姓名栏";
        dom.storyDialogueInput.value = dialogue.text || "";
        updateStoryDialogueColorControls(dialogue);
        dom.storyDurationInput.value = String(dialogue.duration);
        renderStoryDialogueList(scene);
        renderStoryActorList(scene);
      }
      const actorAnimationProgress = Math.min(1, Math.max(0, (elapsed - dialogueStart) / STORY_ACTOR_ENTRY_DURATION));
      renderStoryCanvas(scene, dialogueProgress, dialogue, dialogueIndex === 0, actorAnimationProgress);
      if (elapsed < totalDuration && state.story.open) {
        state.story.playbackFrame = requestAnimationFrame(frame);
      } else {
        state.story.playbackFrame = null;
        dom.storyPlayButton.textContent = "▶";
        renderStoryCanvas(scene, 1, dialogue, false);
      }
    };
    state.story.playbackFrame = requestAnimationFrame(frame);
  }

  function updateStoryAspect() {
    state.story.project.aspect = dom.storyAspectSelect.value === "9:16" ? "9:16" : "16:9";
    saveStoryProject();
    updateStorySceneControls();
  }

  function findIncompleteStoryScene(options = {}) {
    const requireAssetUrls = Boolean(options.requireAssetUrls);
    return state.story.project.scenes.findIndex((scene) => {
      return !scene.background || (requireAssetUrls && !scene.background.url) ||
        (requireAssetUrls && scene.actors.some((actor) => !actor.url)) ||
        getStoryDialogues(scene).some((dialogue) => !String(dialogue.text || "").trim() ||
          (requireAssetUrls && Object.values(dialogue.actorVariants || {}).some((variant) => !variant.url)));
    });
  }

  function focusIncompleteStoryScene(incompleteIndex, options = {}) {
    const requireAssetUrls = Boolean(options.requireAssetUrls);
    const scene = state.story.project.scenes[incompleteIndex];
    const missing = [
      !scene.background || (requireAssetUrls && !scene.background.url) ? "剧情背景" : null,
      (requireAssetUrls && scene.actors.some((actor) => !actor.url)) ? "剧情人物和表情" : null,
      getStoryDialogues(scene).some((dialogue) => !String(dialogue.text || "").trim()) ? "完整对话内容" : null
    ].filter(Boolean);
    state.story.activeSceneId = scene.id;
    renderStoryEditor();
    showToast(`分镜 ${incompleteIndex + 1} 还缺少：${missing.join("、")}`);
  }

  function updateStoryExportProgress(value, text) {
    const numericValue = Math.max(0, Math.min(1, Number(value) || 0));
    const now = performance.now();
    const lastPaint = Number(updateStoryExportProgress.lastPaintAt) || 0;
    const lastValue = Number(updateStoryExportProgress.lastValue);
    if (numericValue < 1 && now - lastPaint < 100 && Number.isFinite(lastValue) && Math.abs(numericValue - lastValue) < 0.02) {
      return;
    }
    updateStoryExportProgress.lastPaintAt = now;
    updateStoryExportProgress.lastValue = numericValue;
    dom.storyExportStatus.hidden = false;
    dom.storyExportProgress.value = numericValue;
    dom.storyExportStatusText.textContent = text;
  }

  function getStoryVideoMimeType() {
    if (typeof MediaRecorder !== "function") {
      return null;
    }
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4"
    ];
    return candidates.find((type) => !MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(type)) || null;
  }

  function getStoryVideoExtension(mimeType) {
    return String(mimeType || "").toLowerCase().includes("mp4") ? "mp4" : "webm";
  }

  function getStoryAssetUrls(project) {
    return project.scenes.flatMap((scene) => [
      scene.background && scene.background.url,
      ...scene.actors.map((actor) => actor && actor.url),
      ...getStoryDialogues(scene).flatMap((dialogue) =>
        Object.values(dialogue.actorVariants || {}).map((variant) => variant && variant.url)
      )
    ]).filter(Boolean);
  }

  function getStorySceneAssetUrls(scene) {
    if (!scene) {
      return [];
    }
    return [
      scene.background && scene.background.url,
      ...(scene.actors || []).map((actor) => actor && actor.url),
      ...getStoryDialogues(scene).flatMap((dialogue) =>
        Object.values(dialogue.actorVariants || {}).map((variant) => variant && variant.url)
      )
    ].filter(Boolean);
  }

  function getStoryDialogueAssetUrls(scene, dialogue) {
    if (!scene) {
      return [];
    }
    return [
      scene.background && scene.background.url,
      ...(scene.actors || []).map((actor) => actor && actor.url),
      ...Object.values(dialogue && dialogue.actorVariants || {})
        .map((variant) => variant && variant.url)
    ].filter(Boolean);
  }

  function appendStoryOutputPart(parts, data, position) {
    const start = Math.max(0, Number(position) || 0);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    parts.push({ start, end: start + bytes.byteLength, data: bytes });
  }

  function getStoryOutputBlob(parts, mimeType) {
    const ordered = parts.slice().sort((left, right) => left.start - right.start);
    if (!ordered.length) {
      return null;
    }
    let contiguous = ordered[0].start === 0;
    let end = ordered[0].end;
    for (let index = 1; index < ordered.length; index += 1) {
      const part = ordered[index];
      if (part.start !== end) {
        contiguous = false;
        break;
      }
      end = part.end;
    }
    if (contiguous) {
      const blob = new Blob(ordered.map((part) => part.data), { type: mimeType });
      parts.length = 0;
      return blob;
    }

    // Some older muxers may emit overlapping or sparse writes. Keep that
    // compatibility path, but only pay the merge cost when it is required.
    const merged = new Uint8Array(Math.max(...ordered.map((part) => part.end)));
    ordered.forEach((part) => merged.set(part.data, part.start));
    const blob = new Blob([merged], { type: mimeType });
    parts.length = 0;
    return blob;
  }

  function createStoryOutputTarget(media, mimeType, options = {}) {
    const nativeFilename = String(options.nativeFilename || "").trim();
    if (nativeFilename && isNativeDirectFileSaverAvailable() &&
        typeof media.StreamTarget === "function" && typeof WritableStream === "function") {
      let uri = null;
      let pendingChunk = null;
      let writeQueue = Promise.resolve();
      const enqueueChunk = (bytes, complete) => {
        // Build the Blob once, then split the resulting object. This matters
        // for WebView Blob implementations that materialize/copy data during
        // construction; no bridge call is ever allowed to exceed our limit.
        const blob = bytes && typeof bytes.slice === "function" && getBlobLikeSize(bytes)
          ? bytes
          : new Blob([bytes], { type: mimeType });
        const size = getBlobLikeSize(blob);
        if (!size || typeof blob.slice !== "function") return writeQueue;
        for (let offset = 0; offset < size; offset += NATIVE_SAVE_CHUNK_SIZE) {
          const part = blob.slice(offset, Math.min(size, offset + NATIVE_SAVE_CHUNK_SIZE));
          const partComplete = Boolean(complete && offset + getBlobLikeSize(part) >= size);
          writeQueue = writeQueue.then(async () => {
            const result = await window.Capacitor.nativePromise("DirectFileSaver", "saveToDownloads", {
              filename: nativeFilename,
              mimeType,
              data: await blobToBase64(part),
              uri,
              append: Boolean(uri),
              complete: partComplete
            });
            uri = result && result.uri ? result.uri : uri;
            await new Promise((resolve) => setTimeout(resolve, 0));
          });
        }
        return writeQueue;
      };
      const writable = new WritableStream({
        async write(chunk) {
          const source = await getWritableChunkBytes(chunk);
          if (!source || !source.byteLength) {
            return writeQueue;
          }
          for (let offset = 0; offset < source.byteLength; offset += NATIVE_SAVE_CHUNK_SIZE) {
            const next = source.slice(offset, Math.min(source.byteLength, offset + NATIVE_SAVE_CHUNK_SIZE));
            if (pendingChunk) {
              enqueueChunk(pendingChunk, false);
            }
            pendingChunk = next;
          }
          return writeQueue;
        },
        close: () => {
          if (pendingChunk) {
            enqueueChunk(pendingChunk, true);
            pendingChunk = null;
          }
          return writeQueue;
        }
      });
      const target = new media.StreamTarget(writable, {
        chunked: true,
        chunkSize: NATIVE_SAVE_CHUNK_SIZE
      });
      return {
        target,
        flush: async () => {
          await writeQueue;
          if (!uri) {
            throw new Error("视频文件未写入下载目录");
          }
          return { uri, filename: nativeFilename };
        },
        getBlob: () => null
      };
    }
    if (typeof media.StreamTarget !== "function" || typeof WritableStream !== "function") {
      const target = new media.BufferTarget();
      return {
        target,
        getBlob: () => target.buffer && new Blob([target.buffer], { type: mimeType })
      };
    }
    const parts = [];
    const writable = new WritableStream({
      write: (chunk) => {
        appendStoryOutputPart(parts, chunk.data, chunk.position);
      }
    });
    const target = new media.StreamTarget(writable, {
      chunked: true,
      chunkSize: 4 * 1024 * 1024
    });
    return {
      target,
      getBlob: () => getStoryOutputBlob(parts, mimeType)
    };
  }

  let storyMediaModulePromise = null;

  function loadStoryMediaModule() {
    if (!storyMediaModulePromise) {
      storyMediaModulePromise = import("./assets/vendor/mediabunny.min.mjs").catch((error) => {
        storyMediaModulePromise = null;
        throw error;
      });
    }
    return storyMediaModulePromise;
  }

  function hasStoryWebCodecsApis(hasAudio) {
    return typeof VideoEncoder === "function" && typeof VideoFrame === "function" &&
      (!hasAudio || (typeof AudioEncoder === "function" && typeof AudioData === "function"));
  }

  async function getStoryWebCodecsProfiles(media, width, height, hasAudio) {
    const nativeProfiles = [
      {
        codec: "avc",
        audioCodec: "aac",
        container: "mp4",
        formatLabel: "MP4",
        extension: "mp4",
        mimeType: "video/mp4",
        bitrate: 12_000_000
      },
      {
        codec: "vp8",
        audioCodec: "opus",
        container: "webm",
        formatLabel: "WebM",
        extension: "webm",
        mimeType: "video/webm",
        bitrate: 12_000_000
      },
      {
        codec: "vp9",
        audioCodec: "opus",
        container: "webm",
        formatLabel: "WebM",
        extension: "webm",
        mimeType: "video/webm",
        bitrate: 16_000_000,
        quantizer: 18
      }
    ];
    // AVC is broadly hardware-accelerated on desktop and mobile. Try it first
    // for batch exports; VP8/VP9 remain available when the device cannot use it.
    const desktopProfiles = nativeProfiles;
    const candidates = isNativeApp() ? nativeProfiles : desktopProfiles;
    const supported = [];

    for (const candidate of candidates) {
      const videoQuality = new media.Quality({
        ...(candidate.quantizer == null ? {} : { quantizer: candidate.quantizer }),
        bitrate: candidate.bitrate,
        bitrateMode: "variable"
      });
      let videoSupported = false;
      try {
        videoSupported = await media.canEncodeVideo(candidate.codec, {
          width,
          height,
          quality: videoQuality,
          latencyMode: STORY_EXPORT_LATENCY_MODE,
          hardwareAcceleration: STORY_EXPORT_HARDWARE_ACCELERATION,
          alpha: "discard"
        });
      } catch (_error) {
        videoSupported = false;
      }
      if (!videoSupported) {
        continue;
      }

      let audioQuality = null;
      if (hasAudio) {
        audioQuality = new media.Quality({ bitrate: 192_000, bitrateMode: "variable" });
        let audioSupported = false;
        try {
          audioSupported = await media.canEncodeAudio(candidate.audioCodec, {
            numberOfChannels: 2,
            sampleRate: 48_000,
            quality: audioQuality
          });
        } catch (_error) {
          audioSupported = false;
        }
        if (!audioSupported) {
          continue;
        }
      }

      supported.push({ ...candidate, videoQuality, audioQuality });
    }
    return supported;
  }

  function isStoryCodecCapabilityError(error) {
    const name = String(error && error.name || "");
    const message = String(error && error.message || "");
    return ["EncodingError", "NetworkError", "NotSupportedError", "OperationError"].includes(name) ||
      /codec|encoder|encoding|configuration|not supported|network error/i.test(message);
  }

  function getStoryExportErrorMessage(error, stage) {
    const message = String(error && error.message || "").trim();
    const name = String(error && error.name || "");
    if (stage === "encoding" && isStoryCodecCapabilityError(error)) {
      return isNativeApp()
        ? "此设备无法启动 1080p 视频编码器，请更新 Android System WebView 后重试"
        : "浏览器无法启动 1080p 视频编码器，请更新浏览器后重试";
    }
    if (stage === "saving" && name === "NetworkError") {
      return "视频已生成，但系统保存面板启动失败，请释放存储空间后重试";
    }
    if (name === "NetworkError" || /^A network error occurred\.?$/i.test(message)) {
      const stageLabels = {
        "restoring-assets": "恢复立绘资源",
        "font-loading": "读取导出字体",
        "codec-detection": "检测视频编码器",
        "image-preload": "读取背景或人物图片",
        "audio-decoding": "读取 BGM"
      };
      return `${stageLabels[stage] || "读取导出资源"}失败，请重试`;
    }
    return message || "视频导出失败";
  }

  function setStoryExportStage(stage) {
    dom.storyExportStatus.dataset.stage = stage;
    return stage;
  }

  async function loadStoryExportFont(renderer, requestedKey) {
    try {
      const font = await renderer.setFont(requestedKey);
      return { ...font, requestedKey, fallback: false };
    } catch (error) {
      console.warn("Story export font unavailable; using the system font.", error);
      const font = await renderer.setFont("system");
      return { ...font, requestedKey, fallback: true };
    }
  }

  function updateStoryVideoExportButtonLabel() {
    dom.storyVideoExportButton.textContent = "导出剧情视频 · 1080p";
  }

  async function fetchStoryBgmData(bgm) {
    if (bgm && bgm.cacheKey) {
      try {
        const cached = await readStoryAssetBlob(bgm.cacheKey);
        if (cached instanceof Blob && cached.size) {
          return cached.arrayBuffer();
        }
      } catch (_error) {
        // Continue with the online resource when device cache is unavailable.
      }
    }
    const response = await fetch(bgm.url);
    if (!response.ok) {
      throw new Error("BGM 读取失败");
    }
    const blob = await response.blob();
    if (bgm && bgm.cacheKey && blob.size) {
      writeStoryAssetBlob(bgm.cacheKey, blob).catch(() => {});
    }
    return blob.arrayBuffer();
  }

  async function decodeStoryBgm(bgm) {
    if (!bgm || !bgm.url || typeof AudioContext !== "function") {
      return null;
    }
    const audioContext = new AudioContext();
    try {
      return await audioContext.decodeAudioData(await fetchStoryBgmData(bgm));
    } finally {
      await audioContext.close();
    }
  }

  async function createStoryExportAudio(bgm) {
    if (!bgm || !bgm.url || typeof AudioContext !== "function") {
      return null;
    }
    const audioContext = new AudioContext();
    await audioContext.resume();
    const audioBuffer = await audioContext.decodeAudioData(await fetchStoryBgmData(bgm));
    const source = audioContext.createBufferSource();
    const destination = audioContext.createMediaStreamDestination();
    source.buffer = audioBuffer;
    source.loop = true;
    source.connect(destination);
    return { context: audioContext, source, stream: destination.stream };
  }

  function getStoryTimelineSegments(project) {
    let cursor = 0;
    return project.scenes.flatMap((scene) => getStoryDialogues(scene).map((dialogue, index) => {
      const duration = Math.max(0.001, Number(dialogue.duration) || 0.001);
      const segment = {
        scene,
        dialogue,
        animateActors: index === 0,
        duration,
        start: cursor,
        end: cursor + duration
      };
      cursor += duration;
      return segment;
    }));
  }

  function findStoryTimelineSegment(segments, elapsed) {
    if (!segments.length) {
      return { segment: null, index: -1 };
    }
    const target = Math.max(0, Number(elapsed) || 0);
    let low = 0;
    let high = segments.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (target < segments[middle].end) {
        high = middle - 1;
      } else {
        low = middle;
      }
    }
    const index = target < segments[low].end ? low : Math.min(segments.length - 1, low + 1);
    return { segment: segments[index], index };
  }

  function renderStoryTimelineFrame(renderer, segments, elapsed, renderState = null) {
    const match = findStoryTimelineSegment(segments, elapsed);
    if (!match.segment) {
      return false;
    }
    const active = match.segment;
    const segmentProgress = Math.min(1, Math.max(0, (elapsed - active.start) / active.duration));
    const actorAnimationProgress = Math.min(1, Math.max(0, (elapsed - active.start) / STORY_ACTOR_ENTRY_DURATION));
    // Most export frames are visually identical. Keep the existing canvas when
    // neither typewriter text nor an actor entry animation is changing.
    const visibleCharacterCount = active.dialogue.typewriter
      ? Math.min(
        Array.from(String(active.dialogue.text || "")).length,
        Math.floor(Math.max(0, elapsed - active.start) * STORY_TYPEWRITER_CHARACTERS_PER_SECOND)
      )
      : -1;
    const actorProgressKey = active.animateActors
      ? Math.round(actorAnimationProgress * 1000)
      : 1;
    const renderKey = `${match.index}:${visibleCharacterCount}:${actorProgressKey}`;
    if (renderState && renderState.key === renderKey) {
      return false;
    }
    renderer.render(createStoryRenderScene(
      active.scene,
      active.dialogue,
      active.animateActors,
      actorAnimationProgress
    ), segmentProgress);
    if (renderState) {
      renderState.key = renderKey;
    }
    return true;
  }

  async function preloadStoryTimelineSegment(renderer, activeSegment, loadedState) {
    if (!activeSegment || activeSegment === loadedState.segment) {
      return;
    }
    if (activeSegment.scene !== loadedState.scene && typeof renderer.clearImageCache === "function") {
      renderer.clearImageCache();
    }
    const preloaded = await renderer.preload(
      getStoryDialogueAssetUrls(activeSegment.scene, activeSegment.dialogue)
    );
    if (preloaded.some((entry) => entry.failed)) {
      throw new Error("部分分镜图片加载失败，无法完整导出视频");
    }
    loadedState.scene = activeSegment.scene;
    loadedState.segment = activeSegment;
  }

  function waitForStoryVideoTimeline(renderer, project, totalDuration, options = {}) {
    const segments = getStoryTimelineSegments(project);
    const startedAt = performance.now();
    const loadedState = {
      scene: options.initialSegment ? options.initialSegment.scene : null,
      segment: options.initialSegment || null
    };
    return new Promise((resolve, reject) => {
      let settled = false;
      const drawFrame = async (now) => {
        if (settled) return;
        try {
          const elapsed = Math.min(totalDuration, Math.max(0, (now - startedAt) / 1000));
          const activeSegment = findStoryTimelineSegment(segments, elapsed).segment;
          await preloadStoryTimelineSegment(renderer, activeSegment, loadedState);
          renderStoryTimelineFrame(renderer, segments, elapsed);
          updateStoryExportProgress(elapsed / totalDuration, `正在导出视频 ${Math.round(elapsed / totalDuration * 100)}%`);
          if (elapsed < totalDuration) {
            state.story.videoExportFrame = requestAnimationFrame(drawFrame);
          } else {
            settled = true;
            state.story.videoExportFrame = null;
            resolve();
          }
        } catch (error) {
          settled = true;
          state.story.videoExportFrame = null;
          reject(error);
        }
      };
      state.story.videoExportFrame = requestAnimationFrame(drawFrame);
    });
  }

  function createLoopedStoryAudioChunk(sourceBuffer, startFrame, frameCount) {
    const output = new AudioBuffer({
      length: frameCount,
      numberOfChannels: sourceBuffer.numberOfChannels,
      sampleRate: sourceBuffer.sampleRate
    });
    for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel += 1) {
      const source = sourceBuffer.getChannelData(channel);
      let outputOffset = 0;
      while (outputOffset < frameCount) {
        const sourceOffset = (startFrame + outputOffset) % sourceBuffer.length;
        const copyCount = Math.min(frameCount - outputOffset, sourceBuffer.length - sourceOffset);
        output.copyToChannel(source.subarray(sourceOffset, sourceOffset + copyCount), channel, outputOffset);
        outputOffset += copyCount;
      }
    }
    return output;
  }

  async function addLoopedStoryAudio(audioSource, sourceBuffer, totalDuration) {
    if (!sourceBuffer || !sourceBuffer.length) {
      return;
    }
    const totalFrames = Math.ceil(totalDuration * sourceBuffer.sampleRate);
    const chunkFrames = Math.max(1, Math.round(sourceBuffer.sampleRate * 10));
    for (let startFrame = 0; startFrame < totalFrames; startFrame += chunkFrames) {
      const frameCount = Math.min(chunkFrames, totalFrames - startFrame);
      await audioSource.add(createLoopedStoryAudioChunk(sourceBuffer, startFrame, frameCount));
    }
    audioSource.close();
  }

  async function encodeStoryWithWebCodecs(renderer, canvas, project, totalDuration, bgmBuffer, profile, options = {}) {
    const media = await loadStoryMediaModule();
    const frameRate = 30;
    const frameDuration = 1 / frameRate;
    const totalFrames = Math.max(1, Math.ceil(totalDuration * frameRate));
    const outputTarget = createStoryOutputTarget(media, profile.mimeType, options);
    const target = outputTarget.target;
    const output = new media.Output({
      format: profile.container === "mp4"
        ? new media.Mp4OutputFormat({ fastStart: "fragmented" })
        : new media.WebMOutputFormat(),
      target
    });
    let encoderConfig = null;
    const videoSource = new media.CanvasSource(canvas, {
      codec: profile.codec,
      quality: profile.videoQuality,
      keyFrameInterval: STORY_EXPORT_KEYFRAME_INTERVAL,
      latencyMode: STORY_EXPORT_LATENCY_MODE,
      hardwareAcceleration: STORY_EXPORT_HARDWARE_ACCELERATION,
      contentHint: "detail",
      alpha: "discard",
      onEncoderConfig: (config) => {
        encoderConfig = { ...config };
      }
    });
    output.addVideoTrack(videoSource, {
      frameRate,
      maximumPacketCount: totalFrames
    });

    let audioSource = null;
    if (bgmBuffer) {
      audioSource = new media.AudioBufferSource({
        codec: profile.audioCodec,
        quality: profile.audioQuality,
        transform: {
          numberOfChannels: 2,
          sampleRate: 48_000
        }
      });
      output.addAudioTrack(audioSource);
    }

    try {
      await output.start();
      const segments = getStoryTimelineSegments(project);
      let loadedScene = null;
      let loadedSegment = null;
      const renderState = { key: null };
      const encodeVideo = async () => {
        let timestamp = 0;
        let frameIndex = 0;
        let previousScene = null;
        while (timestamp < totalDuration - 0.000001) {
          const activeSegment = findStoryTimelineSegment(segments, timestamp).segment;
          if (!activeSegment) {
            break;
          }
          if (activeSegment !== loadedSegment) {
            if (activeSegment.scene !== loadedScene && typeof renderer.clearImageCache === "function") {
              renderer.clearImageCache();
            }
            const preloaded = await renderer.preload(
              getStoryDialogueAssetUrls(activeSegment.scene, activeSegment.dialogue)
            );
            if (preloaded.some((entry) => entry.failed)) {
              throw new Error("部分分镜图片加载失败，无法完整导出视频");
            }
            loadedScene = activeSegment.scene;
            loadedSegment = activeSegment;
          }
          renderStoryTimelineFrame(renderer, segments, timestamp, renderState);
          const segmentElapsed = Math.max(0, timestamp - activeSegment.start);
          const segmentDuration = Math.max(0.000001, activeSegment.duration);
          const textLength = activeSegment.dialogue.typewriter
            ? Array.from(String(activeSegment.dialogue.text || "")).length
            : 0;
          const visibleCharacters = activeSegment.dialogue.typewriter
            ? Math.min(textLength, Math.floor(segmentElapsed * STORY_TYPEWRITER_CHARACTERS_PER_SECOND))
            : textLength;
          const actorAnimating = activeSegment.animateActors &&
            segmentElapsed < STORY_ACTOR_ENTRY_DURATION;
          const typewriterAnimating = activeSegment.dialogue.typewriter && visibleCharacters < textLength &&
            segmentElapsed < segmentDuration;
          // A static dialogue can be represented by one long-duration frame.
          // This avoids encoding 30 identical frames per second while keeping
          // the exact timeline and output frame rate metadata.
          const duration = actorAnimating || typewriterAnimating
            ? Math.min(
              frameDuration,
              Math.max(0.000001, activeSegment.end - timestamp),
              Math.max(0.000001, totalDuration - timestamp)
            )
            : Math.min(
              Math.max(0.000001, activeSegment.end - timestamp),
              Math.max(0.000001, totalDuration - timestamp)
            );
          const forceKeyFrame = activeSegment.scene !== previousScene;
          await videoSource.add(timestamp, duration, forceKeyFrame ? { keyFrame: true } : undefined);
          previousScene = activeSegment.scene;
          timestamp += duration;
          frameIndex += 1;
          if (frameIndex % 5 === 0 || timestamp >= totalDuration - 0.000001) {
            const progress = Math.min(1, timestamp / Math.max(0.000001, totalDuration));
            updateStoryExportProgress(progress * 0.96, `正在编码视频 ${Math.round(progress * 100)}%`);
          }
          // Avoid waiting for a display refresh during a batch export. A short
          // timer still yields to WebView/Chrome so long exports do not starve
          // native bridge work or progress updates, without adding ~16 ms per
          // 15 frames as requestAnimationFrame did.
          if (frameIndex > 0 && frameIndex % STORY_EXPORT_YIELD_INTERVAL === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }
        videoSource.close();
      };
      const encodeAudio = audioSource
        ? addLoopedStoryAudio(audioSource, bgmBuffer, totalDuration)
        : Promise.resolve();
      await Promise.all([encodeVideo(), encodeAudio]);
      updateStoryExportProgress(0.98, `正在生成 ${profile.formatLabel}`);
      await output.finalize();
    } catch (error) {
      if (output.state !== "finalized" && output.state !== "canceled") {
        await output.cancel().catch(() => {});
      }
      throw error;
    }
    const nativeFile = typeof outputTarget.flush === "function" ? await outputTarget.flush() : null;
    const blob = nativeFile ? null : outputTarget.getBlob();
    if (!nativeFile && (!blob || !blob.size)) {
      throw new Error("视频编码器未生成有效数据");
    }
    return {
      blob,
      nativeFile,
      info: {
        encoder: "webcodecs",
        codec: profile.codec,
        audioCodec: audioSource ? profile.audioCodec : "",
        container: profile.container,
        formatLabel: profile.formatLabel,
        extension: profile.extension,
        mimeType: profile.mimeType,
        width: canvas.width,
        height: canvas.height,
        frameRate,
        hasAudio: Boolean(audioSource),
        bitrate: encoderConfig && encoderConfig.bitrate,
        bitrateMode: encoderConfig && encoderConfig.bitrateMode
      }
    };
  }

  async function exportStoryVideo() {
    if (state.story.videoExporting) {
      return;
    }
    state.story.videoExporting = true;
    dom.storyVideoExportButton.disabled = true;
    ["encoder", "codec", "audioCodec", "container", "mimeType", "width", "height", "frameRate", "hasAudio", "bitrate", "bitrateMode", "font", "fontFallback", "stage", "errorName"].forEach((key) => {
      delete dom.storyExportStatus.dataset[key];
    });
    let canvasStream = null;
    let exportAudio = null;
    let recorder = null;
    let exportRenderer = null;
    let exportStage = setStoryExportStage("restoring-assets");
    try {
      updateStoryExportProgress(0, "正在恢复立绘资源");
      await hydrateStoryAssetUrls();
      const incompleteIndex = findIncompleteStoryScene({ requireAssetUrls: true });
      if (incompleteIndex >= 0) {
        dom.storyExportStatus.hidden = true;
        focusIncompleteStoryScene(incompleteIndex, { requireAssetUrls: true });
        return;
      }
      const project = state.story.project;
      if (project.bgm && !project.bgm.url) {
        throw new Error("本地 BGM 已失效，请重新导入音频后再导出");
      }
      const hasAudio = Boolean(project.bgm && project.bgm.url);
      const totalDuration = project.scenes.reduce((projectTotal, scene) => {
        return projectTotal + getStoryDialogues(scene).reduce((sceneTotal, dialogue) => sceneTotal + dialogue.duration, 0);
      }, 0);
      const exportCanvas = document.createElement("canvas");
      exportRenderer = window.FgoStoryRenderer.createRenderer({
        canvas: exportCanvas,
        imageCache: new Map(),
        // Keep only the assets needed by the current dialogue. This prevents
        // dozens of expression images from remaining decoded in WebView RAM.
        maxImageCacheEntries: 8,
        getAspect: () => project.aspect,
        getFontScale: getStoryDialogueFontScale,
        getSize: () => project.aspect === "9:16"
          ? { width: 1080, height: 1920 }
          : { width: 1920, height: 1080 },
        shouldRender: () => false
      });
      exportStage = setStoryExportStage("font-loading");
      updateStoryExportProgress(0, "正在读取导出字体");
      const exportFont = await loadStoryExportFont(
        exportRenderer,
        dom.storyFontSelect.value || getStoryFontSetting()
      );
      dom.storyExportStatus.dataset.font = exportFont.key;
      dom.storyExportStatus.dataset.fontFallback = String(exportFont.fallback);
      let webCodecsProfiles = [];
      if (hasStoryWebCodecsApis(hasAudio)) {
        exportStage = setStoryExportStage("codec-detection");
        updateStoryExportProgress(0, "正在检测设备视频编码能力");
        try {
          const media = await loadStoryMediaModule();
          const exportSize = project.aspect === "9:16"
            ? { width: 1080, height: 1920 }
            : { width: 1920, height: 1080 };
          webCodecsProfiles = await getStoryWebCodecsProfiles(
            media,
            exportSize.width,
            exportSize.height,
            hasAudio
          );
        } catch (_error) {
          webCodecsProfiles = [];
        }
      }
      const useWebCodecs = webCodecsProfiles.length > 0;
      if (typeof exportRenderer.setImageCacheLimit === "function") {
        exportRenderer.setImageCacheLimit(useWebCodecs ? 12 : 8);
      }
      const mimeType = useWebCodecs ? null : getStoryVideoMimeType();
      if (!useWebCodecs && (!mimeType || typeof HTMLCanvasElement.prototype.captureStream !== "function")) {
        throw new Error(isNativeApp()
          ? /iPad|iPhone|iPod/.test(navigator.userAgent)
            ? "此设备暂不支持 1080p 视频导出，请更新 iOS 后重试"
            : "此设备暂不支持 1080p 视频导出，请更新 Android System WebView 后重试"
          : "当前浏览器不支持视频导出，请使用最新版 Chrome 或 Edge");
      }
      exportStage = setStoryExportStage("image-preload");
      updateStoryExportProgress(0, useWebCodecs
        ? "将按分镜加载图片，降低内存占用"
        : "将按对话加载图片，降低内存占用");
      if (useWebCodecs) {
        let bgmBuffer = null;
        if (project.bgm && project.bgm.url) {
          exportStage = setStoryExportStage("audio-decoding");
          updateStoryExportProgress(0, "正在解码 BGM");
          try {
            bgmBuffer = await decodeStoryBgm(project.bgm);
          } catch (_error) {
            throw new Error("BGM 无法解码，请更换为 MP3、M4A 或 WAV 后重试");
          }
        }
        exportStage = setStoryExportStage("encoding");
        let result = null;
        let lastCodecError = null;
        for (let profileIndex = 0; profileIndex < webCodecsProfiles.length; profileIndex += 1) {
          const profile = webCodecsProfiles[profileIndex];
          updateStoryExportProgress(0, "正在启动视频编码器");
          try {
            result = await encodeStoryWithWebCodecs(
              exportRenderer,
              exportCanvas,
              project,
              totalDuration,
              bgmBuffer,
              profile,
              { nativeFilename: `${sanitizeFilename(project.title || "story")}.${profile.extension}` }
            );
            break;
          } catch (error) {
            lastCodecError = error;
            const canRetry = isStoryCodecCapabilityError(error) && profileIndex < webCodecsProfiles.length - 1;
            if (!canRetry) {
              throw error;
            }
            updateStoryExportProgress(0, "当前编码器不可用，正在切换兼容模式");
          }
        }
        if (!result) {
          throw lastCodecError || new Error("设备未生成有效视频数据");
        }
        dom.storyExportStatus.dataset.encoder = result.info.encoder;
        dom.storyExportStatus.dataset.codec = result.info.codec;
        dom.storyExportStatus.dataset.audioCodec = result.info.audioCodec;
        dom.storyExportStatus.dataset.container = result.info.container;
        dom.storyExportStatus.dataset.mimeType = result.info.mimeType;
        dom.storyExportStatus.dataset.width = String(result.info.width);
        dom.storyExportStatus.dataset.height = String(result.info.height);
        dom.storyExportStatus.dataset.frameRate = String(result.info.frameRate);
        dom.storyExportStatus.dataset.hasAudio = String(result.info.hasAudio);
        dom.storyExportStatus.dataset.bitrate = String(result.info.bitrate || "");
        dom.storyExportStatus.dataset.bitrateMode = String(result.info.bitrateMode || "");
        updateStoryExportProgress(0.99, "正在保存视频文件");
        exportStage = setStoryExportStage("saving");
        if (result.nativeFile) {
          updateStoryExportProgress(1, "视频已导出");
          showToast("视频已导出到下载目录");
          return;
        }
        const filename = `${sanitizeFilename(project.title || "未命名剧情")}.${result.info.extension}`;
        await saveBlob(result.blob, filename, "保存剧情视频");
        updateStoryExportProgress(1, "视频已导出");
        showToast(isNativeDirectFileSaverAvailable() ? "剧情视频已导出到下载/如数迦贞" : "剧情视频已导出");
        return;
      }
      exportStage = setStoryExportStage("encoding");
      dom.storyExportStatus.dataset.encoder = "media-recorder";
      if (project.bgm && project.bgm.url) {
        updateStoryExportProgress(0, "正在处理 BGM");
        try {
          exportAudio = await createStoryExportAudio(project.bgm);
        } catch (_error) {
          throw new Error("BGM 无法解码，请更换为 MP3、M4A 或 WAV 后重试");
        }
      }
      const firstScene = project.scenes[0];
      const firstDialogue = getStoryDialogues(firstScene)[0];
      const fallbackSegments = getStoryTimelineSegments(project);
      const initialSegment = fallbackSegments[0];
      const initialLoadedState = { scene: null, segment: null };
      await preloadStoryTimelineSegment(exportRenderer, initialSegment, initialLoadedState);
      const fallbackFilename = `${sanitizeFilename(project.title || "story")}.${getStoryVideoExtension(mimeType)}`;
      const nativeVideoWriter = createNativeVideoChunkWriter(fallbackFilename, mimeType);
      exportRenderer.render(createStoryRenderScene(firstScene, firstDialogue, false), 0);
      canvasStream = exportCanvas.captureStream(30);
      const tracks = [...canvasStream.getVideoTracks()];
      if (exportAudio) {
        tracks.push(...exportAudio.stream.getAudioTracks());
      }
      const recordingStream = new MediaStream(tracks);
      const chunks = [];
      recorder = new MediaRecorder(recordingStream, {
        mimeType,
        videoBitsPerSecond: 20_000_000,
        audioBitsPerSecond: 192_000
      });
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size) {
          if (nativeVideoWriter) {
            nativeVideoWriter.append(event.data);
          } else {
            chunks.push(event.data);
          }
        }
      });
      const stopped = new Promise((resolve, reject) => {
        recorder.addEventListener("stop", resolve, { once: true });
        recorder.addEventListener("error", () => reject(recorder.error || new Error("视频编码失败")), { once: true });
      });
      recorder.start(1000);
      if (exportAudio) {
        exportAudio.source.start();
      }
      await waitForStoryVideoTimeline(exportRenderer, project, totalDuration, {
        initialSegment
      });
      recorder.stop();
      await stopped;
      if (nativeVideoWriter) {
        await nativeVideoWriter.close();
        /*
        updateStoryExportProgress(1, "视频已导出");
        showToast("视频已导出到下载目录");
        */
        updateStoryExportProgress(1, "视频已导出");
        showToast("视频已导出到下载目录");
        return;
      }
      if (!chunks.length) {
        throw new Error("浏览器未生成有效的视频数据");
      }
      updateStoryExportProgress(1, "正在保存视频文件");
      const outputMimeType = recorder.mimeType || mimeType || "video/webm";
      const blob = new Blob(chunks, { type: outputMimeType });
      const filename = `${sanitizeFilename(project.title || "未命名剧情")}.${getStoryVideoExtension(outputMimeType)}`;
      exportStage = setStoryExportStage("saving");
      await saveBlob(blob, filename, "保存剧情视频");
      updateStoryExportProgress(1, "视频已导出");
      showToast(isNativeDirectFileSaverAvailable() ? "剧情视频已导出到下载/如数迦贞" : "剧情视频已导出");
    } catch (error) {
      dom.storyExportStatus.dataset.errorName = String(error && error.name || "Error");
      const message = getStoryExportErrorMessage(error, exportStage);
      updateStoryExportProgress(0, message);
      showToast(message);
    } finally {
      if (exportRenderer && typeof exportRenderer.clearImageCache === "function") {
        exportRenderer.clearImageCache();
      }
      if (state.story.videoExportFrame) {
        cancelAnimationFrame(state.story.videoExportFrame);
        state.story.videoExportFrame = null;
      }
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      if (canvasStream) {
        canvasStream.getTracks().forEach((track) => track.stop());
      }
      if (exportAudio) {
        try {
          exportAudio.source.stop();
        } catch (_error) {
          // The source may already have stopped with the recording.
        }
        exportAudio.stream.getTracks().forEach((track) => track.stop());
        exportAudio.context.close();
      }
      state.story.videoExporting = false;
      dom.storyVideoExportButton.disabled = false;
    }
  }

  async function exportStoryProject() {
    const incompleteIndex = findIncompleteStoryScene();
    if (incompleteIndex >= 0) {
      focusIncompleteStoryScene(incompleteIndex);
      return;
    }
    const project = JSON.parse(JSON.stringify(state.story.project));
    if (project.bgm && project.bgm.local) {
      project.bgm.url = null;
      project.bgm.note = "本地音频未写入 JSON，请在导出后重新选择";
    }
    project.scenes.forEach((scene) => {
      scene.actors.forEach((actor) => {
        if (actor.generated) {
          actor.url = null;
          actor.thumbnailUrl = null;
        }
      });
      (scene.dialogues || []).forEach((dialogue) => {
        Object.values(dialogue.actorVariants || {}).forEach((variant) => {
          if (variant && variant.generated) {
            variant.url = null;
            variant.thumbnailUrl = null;
          }
        });
      });
    });
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const filename = `${sanitizeFilename(project.title || "未命名剧情")}.story.json`;
    await saveBlob(blob, filename, "保存剧情项目");
    showToast(isNativeDirectFileSaverAvailable() ? "剧情项目已保存到下载/如数迦贞" : "剧情 JSON 已导出");
  }

  function createBlankStoryProject(title = "未命名剧情") {
    return normalizeStoryProject({
      version: 1,
      title,
      region: state.region,
      aspect: state.story.project && state.story.project.aspect === "9:16" ? "9:16" : "16:9",
      scenes: [createStoryScene()],
      bgm: null
    });
  }

  function getStoryProjectRecordSummary(record) {
    const project = normalizeStoryProject(record.project);
    const dialogueCount = project.scenes.reduce((total, scene) => total + getStoryDialogues(scene).length, 0);
    return {
      title: record.title || project.title || "未命名剧情",
      sceneCount: project.scenes.length,
      dialogueCount,
      updatedAt: record.updatedAt ? dateFormatter.format(new Date(record.updatedAt)) : "未知时间"
    };
  }

  function renderStoryProjectLibrary() {
    if (!dom.storyProjectLibraryList) {
      return;
    }
    const showingTrash = state.story.projectLibraryTab === "trash";
    const records = state.story.projectRecords.filter((record) =>
      showingTrash ? Boolean(record.deletedAt) : !record.deletedAt
    );
    dom.storyProjectLibraryTabBar.querySelectorAll("[data-project-library-tab]").forEach((button) => {
      const active = button.dataset.projectLibraryTab === state.story.projectLibraryTab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    dom.storyProjectLibraryStatus.textContent = records.length
      ? showingTrash ? `最近删除 ${records.length} 个作品` : `本机保存了 ${records.length} 个作品`
      : showingTrash ? "最近删除中没有作品" : "本机还没有保存作品";
    dom.storyProjectLibraryList.replaceChildren();
    records.forEach((record) => {
      const summary = getStoryProjectRecordSummary(record);
      const item = document.createElement("article");
      item.className = "story-project-library-item";
      item.classList.toggle("is-active", !showingTrash && record.id === state.story.projectId);
      const copy = document.createElement("div");
      copy.className = "story-project-library-copy";
      const title = document.createElement("strong");
      title.textContent = summary.title;
      const meta = document.createElement("span");
      meta.textContent = `${summary.sceneCount} 个分镜 · ${summary.dialogueCount} 段对话 · ${summary.updatedAt}`;
      copy.append(title, meta);
      const actions = document.createElement("div");
      actions.className = "story-project-library-actions";
      if (showingTrash) {
        const restore = document.createElement("button");
        restore.className = "secondary-button";
        restore.type = "button";
        restore.textContent = "恢复";
        restore.addEventListener("click", () => restoreStoryProject(record.id));
        const erase = document.createElement("button");
        erase.className = "secondary-button is-danger";
        erase.type = "button";
        erase.textContent = "永久删除";
        erase.addEventListener("click", () => eraseStoryProject(record.id));
        actions.append(restore, erase);
      } else {
        const open = document.createElement("button");
        open.className = record.id === state.story.projectId ? "secondary-button" : "primary-button";
        open.type = "button";
        open.disabled = record.id === state.story.projectId;
        open.textContent = record.id === state.story.projectId ? "当前作品" : "打开";
        open.addEventListener("click", () => openStoredStoryProject(record.id));
        const duplicate = document.createElement("button");
        duplicate.className = "secondary-button";
        duplicate.type = "button";
        duplicate.textContent = "复制";
        duplicate.addEventListener("click", () => duplicateStoredStoryProject(record.id));
        const remove = document.createElement("button");
        remove.className = "secondary-button is-danger";
        remove.type = "button";
        remove.textContent = "删除";
        remove.addEventListener("click", () => trashStoryProject(record.id));
        actions.append(open, duplicate, remove);
      }
      item.append(copy, actions);
      dom.storyProjectLibraryList.append(item);
    });
  }

  async function refreshAndRenderStoryProjectLibrary() {
    try {
      await refreshStoryProjectRecords();
      renderStoryProjectLibrary();
    } catch (_error) {
      dom.storyProjectLibraryStatus.textContent = "无法读取本地作品库";
    }
  }

  function setStoryProjectLibraryOpen(open) {
    state.story.projectLibraryOpen = Boolean(open);
    dom.storyProjectLibrary.hidden = !state.story.projectLibraryOpen;
    document.body.classList.toggle("is-story-project-library-open", state.story.projectLibraryOpen);
    if (state.story.projectLibraryOpen) {
      state.story.projectLibraryTab = "projects";
      refreshAndRenderStoryProjectLibrary();
      window.requestAnimationFrame(() => dom.storyProjectLibraryCloseButton.focus({ preventScroll: true }));
    }
  }

  async function createNewStoryProject() {
    await flushStoryProjectSave();
    const title = window.prompt("新作品名称", "未命名剧情");
    if (title === null) {
      return;
    }
    const projectId = createStoryProjectId();
    const project = createBlankStoryProject(String(title).trim().slice(0, 80) || "未命名剧情");
    await writeStoryProjectRecord(createStoryProjectRecord(projectId, project));
    await refreshStoryProjectRecords();
    applyStoryProject(projectId, project);
    setStoryProjectLibraryOpen(false);
    showToast("已创建新剧情作品");
  }

  async function openStoredStoryProject(projectId) {
    saveStoryProject();
    await flushStoryProjectSave();
    const record = await readStoryProjectRecord(projectId);
    if (!record || record.deletedAt) {
      showToast("该作品已不存在");
      return;
    }
    applyStoryProject(record.id, record.project);
    setStoryProjectLibraryOpen(false);
    showToast(`已打开：${record.title || "未命名剧情"}`);
  }

  async function duplicateStoredStoryProject(projectId) {
    const record = await readStoryProjectRecord(projectId);
    if (!record || record.deletedAt) {
      return;
    }
    const project = normalizeStoryProject(JSON.parse(JSON.stringify(record.project)));
    project.title = `${project.title || "未命名剧情"} 副本`.slice(0, 80);
    const duplicateId = createStoryProjectId();
    await writeStoryProjectRecord(createStoryProjectRecord(duplicateId, project));
    await refreshAndRenderStoryProjectLibrary();
    showToast("已复制剧情作品");
  }

  async function trashStoryProject(projectId) {
    const record = await readStoryProjectRecord(projectId);
    if (!record || record.deletedAt || !window.confirm(`删除“${record.title || "未命名剧情"}”？可在最近删除中恢复。`)) {
      return;
    }
    record.deletedAt = new Date().toISOString();
    record.updatedAt = record.deletedAt;
    await writeStoryProjectRecord(record);
    if (projectId === state.story.projectId) {
      const remaining = (await readAllStoryProjectRecords()).filter((item) => !item.deletedAt);
      if (remaining.length) {
        const next = remaining.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))[0];
        applyStoryProject(next.id, next.project);
      } else {
        const nextId = createStoryProjectId();
        const nextProject = createBlankStoryProject();
        await writeStoryProjectRecord(createStoryProjectRecord(nextId, nextProject));
        applyStoryProject(nextId, nextProject);
      }
    }
    await refreshAndRenderStoryProjectLibrary();
    showToast("作品已移到最近删除");
  }

  async function restoreStoryProject(projectId) {
    const record = await readStoryProjectRecord(projectId);
    if (!record || !record.deletedAt) {
      return;
    }
    record.deletedAt = null;
    record.updatedAt = new Date().toISOString();
    await writeStoryProjectRecord(record);
    await refreshAndRenderStoryProjectLibrary();
    showToast("作品已恢复");
  }

  async function eraseStoryProject(projectId) {
    const record = await readStoryProjectRecord(projectId);
    if (!record || !record.deletedAt || !window.confirm(`永久删除“${record.title || "未命名剧情"}”？此操作无法恢复。`)) {
      return;
    }
    await deleteStoryProjectRecord(projectId);
    await refreshAndRenderStoryProjectLibrary();
    showToast("作品已永久删除");
  }

  function getStoryProjectAssetKeys(project) {
    const keys = new Set();
    if (project.bgm && project.bgm.cacheKey) {
      keys.add(project.bgm.cacheKey);
    }
    (project.localBackgrounds || []).forEach((background) => {
      if (background && background.cacheKey) {
        keys.add(background.cacheKey);
      }
    });
    (project.localCharacters || []).forEach((character) => {
      (character && character.variants || []).forEach((variant) => {
        if (variant && variant.cacheKey) {
          keys.add(variant.cacheKey);
        }
      });
    });
    project.scenes.forEach((scene) => {
      const resources = [
        scene.background,
        ...(scene.actors || []),
        ...(scene.actors || []).flatMap((actor) => actor && actor.importedVariants || []),
        ...(scene.dialogues || []).flatMap((dialogue) => Object.values(dialogue.actorVariants || {}))
      ];
      resources.forEach((resource) => {
        if (resource && resource.cacheKey) {
          keys.add(resource.cacheKey);
        }
        if (resource && resource.thumbnailCacheKey) {
          keys.add(resource.thumbnailCacheKey);
        }
      });
    });
    return Array.from(keys);
  }

  async function exportStoryBackup() {
    saveStoryProject();
    await flushStoryProjectSave();
    const project = serializeStoryProject();
    updateStoryProjectSaveStatus("正在生成备份", "saving");
    const assetManifest = [];
    const entries = [];
    for (const key of getStoryProjectAssetKeys(project)) {
      try {
        const blob = await readStoryAssetBlob(key);
        if (blob instanceof Blob && blob.size) {
          const path = `assets/${String(assetManifest.length + 1).padStart(4, "0")}.bin`;
          assetManifest.push({
            key,
            type: blob.type || "application/octet-stream",
            path
          });
          entries.push({ filename: path, blob });
        }
      } catch (_error) {
        // Missing optional cache files do not block the project backup.
      }
    }
    const manifest = {
      format: "rusu-story-project",
      version: 1,
      exportedAt: new Date().toISOString(),
      assets: assetManifest
    };
    entries.unshift(
      {
        filename: "manifest.json",
        blob: new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" })
      },
      {
        filename: "project.json",
        blob: new Blob([JSON.stringify(project, null, 2)], { type: "application/json" })
      }
    );
    const blob = await createStoredZip(entries, () => {});
    await saveBlob(blob, `${sanitizeFilename(project.title || "未命名剧情")}.zip`, "备份剧情工程");
    updateStoryProjectSaveStatus("已自动保存到本机", "saved");
    const backupMessage = `剧情备份已生成${assetManifest.length ? `，包含 ${assetManifest.length} 个本地素材` : ""}`;
    showToast(isNativeDirectFileSaverAvailable() ? `${backupMessage}，已保存到下载/如数迦贞` : backupMessage);
  }

  function base64ToBlob(data, type) {
    const binary = window.atob(String(data || ""));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: type || "application/octet-stream" });
  }

  async function readStoryBackup(file) {
    const signature = new DataView(await file.slice(0, 4).arrayBuffer()).getUint32(0, true);
    if (signature !== 0x04034b50) {
      const value = JSON.parse(await file.text());
      return value && value.format === "rusu-story-project"
        ? value
        : { version: 0, project: value, assets: [] };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer);
    const entries = new Map();
    let offset = 0;
    while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
      const flags = view.getUint16(offset + 6, true);
      const compression = view.getUint16(offset + 8, true);
      const size = view.getUint32(offset + 18, true);
      const nameLength = view.getUint16(offset + 26, true);
      const extraLength = view.getUint16(offset + 28, true);
      if ((flags & 0x0008) || compression !== 0) {
        throw new Error("Unsupported compressed backup");
      }
      const nameStart = offset + 30;
      const dataStart = nameStart + nameLength + extraLength;
      const dataEnd = dataStart + size;
      if (dataEnd > bytes.length) {
        throw new Error("Incomplete backup file");
      }
      const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLength));
      entries.set(name, new Blob([bytes.slice(dataStart, dataEnd)]));
      offset = dataEnd;
    }
    const manifestEntry = entries.get("manifest.json");
    const projectEntry = entries.get("project.json");
    if (!manifestEntry || !projectEntry) {
      throw new Error("Missing project metadata");
    }
    const manifest = JSON.parse(await manifestEntry.text());
    const project = JSON.parse(await projectEntry.text());
    return {
      ...manifest,
      project,
      assets: (Array.isArray(manifest.assets) ? manifest.assets : []).map((asset) => ({
        ...asset,
        blob: entries.get(asset.path) || null
      }))
    };
  }

  async function importStoryBackup(file) {
    if (!file) {
      return;
    }
    try {
      const backup = await readStoryBackup(file);
      if (!backup.project || typeof backup.project !== "object") {
        throw new Error("工程内容无效");
      }
      updateStoryProjectSaveStatus("正在恢复备份", "saving");
      for (const asset of Array.isArray(backup.assets) ? backup.assets : []) {
        if (!asset || !asset.key || (!asset.blob && !asset.data)) {
          continue;
        }
        const blob = asset.blob
          ? new Blob([await asset.blob.arrayBuffer()], { type: asset.type || "application/octet-stream" })
          : base64ToBlob(asset.data, asset.type);
        await writeStoryAssetBlob(String(asset.key), blob);
      }
      const project = normalizeStoryProject(backup.project);
      const projectId = createStoryProjectId();
      await writeStoryProjectRecord(createStoryProjectRecord(projectId, project));
      await refreshStoryProjectRecords();
      applyStoryProject(projectId, project);
      updateStoryProjectSaveStatus("已自动保存到本机", "saved");
      setStoryProjectLibraryOpen(false);
      showToast("剧情备份已恢复为新作品");
    } catch (_error) {
      updateStoryProjectSaveStatus("备份恢复失败", "error");
      showToast("无法读取该剧情备份");
    } finally {
      dom.storyImportInput.value = "";
    }
  }

  async function updateStoryBgm(file) {
    const previousBgm = state.story.project.bgm;
    if (previousBgm && previousBgm.local && previousBgm.url) {
      URL.revokeObjectURL(previousBgm.url);
      state.story.objectUrls.delete(previousBgm.url);
    }
    if (file) {
      const cacheKey = `local-bgm:${state.story.projectId}:${Date.now()}`;
      let cached = false;
      try {
        await writeStoryAssetBlob(cacheKey, file);
        cached = true;
      } catch (_error) {
        // Keep the audio available for the current session when storage is full.
      }
      const url = URL.createObjectURL(file);
      state.story.objectUrls.add(url);
      state.story.project.bgm = {
        name: file.name,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        url,
        audioAsset: url,
        cacheKey: cached ? cacheKey : null,
        local: true,
        source: "local"
      };
    } else {
      state.story.project.bgm = null;
    }
    saveStoryProject();
    updateStoryBgmStatus();
    const scene = getActiveStoryScene();
    if (scene) {
      renderStoryResourceSummary(scene);
    }
    if (file) {
      showToast(`已加入 BGM：${file.name}`);
    }
  }

  function resetFiltersForLibrary() {
    dom.searchInput.value = "";
    dom.clearSearchButton.hidden = true;
    dom.raritySelect.value = "all";
    dom.subtypeSelect.value = "all";
    dom.sortSelect.value = "newest";
    dom.newOnlyInput.checked = false;
    dom.advancedFilters.classList.remove("is-open");
    dom.mobileFilterButton.setAttribute("aria-expanded", "false");
    updateFilterIndicator();
  }

  function changeRegion(region) {
    if (!REGIONS.includes(region) || region === state.region) {
      return;
    }
    state.region = region;
    saveSetting("region", region);
    closeModalIfOpen();
    loadLibrary();
  }

  function bindEvents() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && pendingStoryProjectSave) {
        flushStoryProjectSave().catch(() => {});
      }
    });
    window.addEventListener("pagehide", () => {
      if (pendingStoryProjectSave) {
        flushStoryProjectSave().catch(() => {});
      }
    });
    window.addEventListener("resize", scheduleViewportUpdate);
    window.addEventListener("orientationchange", scheduleViewportUpdate);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleViewportUpdate);
      window.visualViewport.addEventListener("scroll", scheduleViewportUpdate);
    }
    document.querySelectorAll(".region-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (!REGIONS.includes(button.dataset.region) || button.dataset.region === state.region) {
          return;
        }
        changeRegion(button.dataset.region);
      });
    });

    dom.mobileRegionSelect.addEventListener("change", () => changeRegion(dom.mobileRegionSelect.value));
    dom.enterAppButton.addEventListener("click", enterApp);
    dom.enterStoryAppButton.addEventListener("click", enterStoryApp);
    dom.storyGeneratorBackButton.addEventListener("click", goHome);
    dom.introSupportButton.addEventListener("click", enterSupportApp);
    dom.supportBackHomeButton.addEventListener("click", goHome);
    dom.storyProjectLibraryButton.addEventListener("click", () => setStoryProjectLibraryOpen(true));
    dom.storyNewProjectButton.addEventListener("click", () => createNewStoryProject().catch(() => showToast("新建作品失败")));
    dom.storyBackupButton.addEventListener("click", () => exportStoryBackup().catch(() => showToast("剧情备份失败")));
    dom.storyImportButton.addEventListener("click", () => dom.storyImportInput.click());
    dom.storyImportInput.addEventListener("change", () => importStoryBackup(dom.storyImportInput.files[0] || null));
    dom.storyProjectLibraryBackdrop.addEventListener("click", () => setStoryProjectLibraryOpen(false));
    dom.storyProjectLibraryCloseButton.addEventListener("click", () => setStoryProjectLibraryOpen(false));
    dom.storyProjectLibraryTabBar.querySelectorAll("[data-project-library-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.story.projectLibraryTab = button.dataset.projectLibraryTab === "trash" ? "trash" : "projects";
        renderStoryProjectLibrary();
      });
    });
    document.querySelectorAll("[data-project-library-action]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.projectLibraryAction === "create") {
          createNewStoryProject().catch(() => showToast("新建作品失败"));
        } else {
          dom.storyImportInput.click();
        }
      });
    });
    dom.homeButton.addEventListener("click", goHome);
    dom.moreBackHomeButton.addEventListener("click", goHome);
    dom.introMoreButton.addEventListener("click", enterMoreApp);
    dom.storyExportButton.addEventListener("click", () => exportStoryProject().catch(() => showToast("剧情 JSON 导出失败")));
    dom.storyVideoExportButton.addEventListener("click", exportStoryVideo);
    dom.storyAddSceneButton.addEventListener("click", addStoryScene);
    dom.storyDuplicateSceneButton.addEventListener("click", duplicateStoryScene);
    dom.storyDeleteSceneButton.addEventListener("click", deleteStoryScene);
    dom.storyPlayButton.addEventListener("click", playStoryScene);
    dom.storyAddDialogueButton.addEventListener("click", addStoryDialogue);
    dom.storyAspectSelect.addEventListener("change", updateStoryAspect);
    dom.storyFontSelect.addEventListener("change", updateStoryFont);
    dom.storyDialogueFontSizeInput.addEventListener("input", updateStoryDialogueFontSize);
    dom.storyDialogueRangeFontSizeInput.addEventListener("input", () => {
      dom.storyDialogueRangeFontSizeValue.textContent = `${Math.round(Number(dom.storyDialogueRangeFontSizeInput.value) || 100)}%`;
    });
    dom.storyProjectName.addEventListener("input", () => {
      state.story.project.title = dom.storyProjectName.value.slice(0, 80) || "未命名剧情";
      saveStoryProject();
    });
    dom.storySpeakerInput.addEventListener("input", () => updateStorySceneField("speaker", dom.storySpeakerInput.value));
    dom.storyDialogueInput.addEventListener("input", () => updateStorySceneField("text", dom.storyDialogueInput.value));
    ["select", "keyup", "pointerup"].forEach((eventName) => {
      dom.storyDialogueInput.addEventListener(eventName, () => {
        const scene = getActiveStoryScene();
        const dialogue = scene && getActiveStoryDialogue(scene);
        if (dialogue) {
          updateStoryDialogueColorControls(dialogue);
        }
      });
    });
    dom.storyDialogueRubyInput.addEventListener("input", () => {
      const scene = getActiveStoryScene();
      const dialogue = scene && getActiveStoryDialogue(scene);
      if (dialogue) {
        updateStoryDialogueRubyControls(dialogue);
      }
    });
    dom.storyDialogueStyleTabs.querySelectorAll("[data-dialogue-style-tab]").forEach((button) => {
      button.addEventListener("click", () => setStoryDialogueStyleTab(button.dataset.dialogueStyleTab));
    });
    setStoryDialogueStyleTab(activeStoryDialogueStyleTab);
    dom.storyDurationInput.addEventListener("input", () => updateStorySceneField("duration", dom.storyDurationInput.value));
    dom.storyDialogueColorApplyButton.addEventListener("click", applySelectedStoryDialogueColor);
    dom.storyDialogueColorClearSelectionButton.addEventListener("click", clearSelectedStoryDialogueColor);
    dom.storyDialogueColorResetButton.addEventListener("click", resetStoryDialogueColor);
    dom.storyDialogueFontSizeApplyButton.addEventListener("click", applySelectedStoryDialogueFontSize);
    dom.storyDialogueFontSizeClearSelectionButton.addEventListener("click", clearSelectedStoryDialogueFontSize);
    dom.storyDialogueFontSizeResetButton.addEventListener("click", resetStoryDialogueFontSize);
    dom.storyDialogueRubyApplyButton.addEventListener("click", applySelectedStoryDialogueRuby);
    dom.storyDialogueRubyClearSelectionButton.addEventListener("click", clearSelectedStoryDialogueRuby);
    dom.storyDialogueRubyResetButton.addEventListener("click", resetStoryDialogueRuby);
    dom.storyChooseBackgroundButton.addEventListener("click", () => chooseStoryResource("background"));
    dom.storyChooseActorButton.addEventListener("click", () => chooseStoryResource("actor"));
    dom.storyToolTabs.querySelectorAll("[data-story-tool]").forEach((button) => {
      button.addEventListener("click", () => setStoryTool(button.dataset.storyTool));
    });
    dom.storySidebarTabs.querySelectorAll("[data-story-sidebar]").forEach((button) => {
      button.addEventListener("click", () => setStorySidebar(button.dataset.storySidebar));
    });
    dom.storySpeakerActorSelect.addEventListener("change", updateStorySpeakerActor);
    dom.storyActorOptionsSelect.addEventListener("change", updateStoryOptionsActor);
    dom.storyActorNameInput.addEventListener("input", () => updateActiveStoryActorName(false));
    dom.storyActorNameInput.addEventListener("change", () => updateActiveStoryActorName(true));
    dom.storyActorScaleInput.addEventListener("input", () => updateActiveStoryActorTransform("scale", dom.storyActorScaleInput.value));
    dom.storyActorOffsetXInput.addEventListener("input", () => updateActiveStoryActorTransform("offsetX", dom.storyActorOffsetXInput.value));
    dom.storyActorOffsetYInput.addEventListener("input", () => updateActiveStoryActorTransform("offsetY", dom.storyActorOffsetYInput.value));
    dom.storyActorTransformResetButton.addEventListener("click", resetActiveStoryActorTransform);
    dom.storyActorRemoveSelectedButton.addEventListener("click", removeSelectedStoryActor);
    document.querySelectorAll("[data-actor-adjust-mode]").forEach((button) => {
      button.addEventListener("click", () => setStoryActorOptionsMode(button.dataset.actorAdjustMode));
    });
    dom.storyActorUniformScaleInput.addEventListener("input", () => updateUniformStoryActorTransform("scale", dom.storyActorUniformScaleInput.value));
    dom.storyActorUniformOffsetXInput.addEventListener("input", () => updateUniformStoryActorTransform("offsetX", dom.storyActorUniformOffsetXInput.value));
    dom.storyActorUniformOffsetYInput.addEventListener("input", () => updateUniformStoryActorTransform("offsetY", dom.storyActorUniformOffsetYInput.value));
    dom.storyActorUniformResetButton.addEventListener("click", resetUniformStoryActorTransform);
    dom.storyAnimationActorSelect.addEventListener("change", () => {
      selectStoryAnimationActor(getActiveStoryScene(), dom.storyAnimationActorSelect.value);
    });
    dom.storyActorEntryAnimationSelect.addEventListener("change", updateStoryActorEntryAnimation);
    dom.storyPreviewActorAnimationButton.addEventListener("click", previewStoryActorAnimations);
    dom.storyBgmFileInput.addEventListener("change", () => updateStoryBgm(dom.storyBgmFileInput.files[0] || null).catch(() => showToast("保存本地 BGM 失败")));
    dom.storyChooseBgmButton.addEventListener("click", () => openStoryBgmPicker());
    dom.storyClearBgmButton.addEventListener("click", () => {
      dom.storyBgmFileInput.value = "";
      updateStoryBgm(null).catch(() => showToast("清除 BGM 失败"));
    });
    dom.storyBgmPickerBackdrop.addEventListener("click", closeStoryBgmPicker);
    dom.storyBgmPickerCloseButton.addEventListener("click", closeStoryBgmPicker);
    dom.storyBgmSearchInput.addEventListener("input", () => {
      clearTimeout(storyBgmSearchTimer);
      storyBgmSearchTimer = setTimeout(applyStoryBgmFilter, 120);
    });
    dom.storyBgmList.addEventListener("scroll", () => {
      const picker = state.story.bgmPicker;
      if (picker.visibleCount >= picker.filteredItems.length ||
          dom.storyBgmList.scrollTop + dom.storyBgmList.clientHeight < dom.storyBgmList.scrollHeight - 160) {
        return;
      }
      picker.visibleCount = Math.min(picker.filteredItems.length, picker.visibleCount + STORY_BGM_PAGE_SIZE);
      renderStoryBgmList();
    });
    dom.storyBgmPreviewAudio.addEventListener("ended", () => {
      state.story.bgmPicker.previewId = null;
      dom.storyBgmPreviewLabel.textContent = "试听结束";
      renderStoryBgmList();
    });
    dom.storyPickerBackdrop.addEventListener("click", closeStoryCharacterPicker);
    dom.storyPickerCloseButton.addEventListener("click", closeStoryCharacterPicker);
    dom.storyPickerImportButton.addEventListener("click", () => dom.storyPickerImportInput.click());
    dom.storyPickerImportInput.addEventListener("change", () => {
      importStoryPickerImages(dom.storyPickerImportInput.files).catch(() => {
        dom.storyPickerStatus.textContent = "外部图片导入失败";
      });
    });
    dom.storyPickerBackToCharactersButton.addEventListener("click", () => {
      const picker = state.story.picker;
      if (picker.mode === "dialogueVariant") {
        closeStoryCharacterPicker();
        return;
      }
      cancelStoryPickerExtraction(picker);
      if (picker.detailController) {
        picker.detailController.abort();
        picker.detailController = null;
      }
      picker.selectedCharacter = null;
      picker.selectedSource = null;
      revokeStoryPickerAssets(picker);
      picker.sourceAssets = [];
      showStoryPickerStep("characters");
      renderStoryPickerCharacters();
    });
    dom.storyPickerBackToSourcesButton.addEventListener("click", () => {
      const picker = state.story.picker;
      cancelStoryPickerExtraction(picker);
      revokeStoryPickerAssets(picker);
      picker.sourceAssets = [];
      picker.selectedSource = null;
      showStoryPickerStep("sources");
      renderStoryPickerSources();
    });
    dom.storyPickerRefreshVariantsButton.addEventListener("click", () => {
      const picker = state.story.picker;
      if (picker.selectedSource) {
        extractStoryPickerSource(picker.selectedSource, { force: true });
      }
    });
    dom.storyPickerServantTab.addEventListener("click", () => {
      if (state.story.picker.kind === "servant") {
        return;
      }
      state.story.picker.kind = "servant";
      state.story.picker.servantClass = "all";
      state.story.picker.servantRarity = "all";
      cancelStoryPickerExtraction(state.story.picker);
      if (state.story.picker.detailController) {
        state.story.picker.detailController.abort();
        state.story.picker.detailController = null;
      }
      state.story.picker.selectedCharacter = null;
      state.story.picker.selectedSources = [];
      state.story.picker.selectedSource = null;
      revokeStoryPickerAssets(state.story.picker);
      state.story.picker.sourceAssets = [];
      updateStoryPickerTabs();
      showStoryPickerStep("characters");
      loadStoryPickerItems().catch((error) => {
        dom.storyPickerStatus.textContent = error.message || "人物数据读取失败";
      });
    });
    dom.storyPickerFigureTab.addEventListener("click", () => {
      if (state.story.picker.kind === "storyFigures") {
        return;
      }
      state.story.picker.kind = "storyFigures";
      state.story.picker.servantClass = "all";
      state.story.picker.servantRarity = "all";
      cancelStoryPickerExtraction(state.story.picker);
      if (state.story.picker.detailController) {
        state.story.picker.detailController.abort();
        state.story.picker.detailController = null;
      }
      state.story.picker.selectedCharacter = null;
      state.story.picker.selectedSources = [];
      state.story.picker.selectedSource = null;
      revokeStoryPickerAssets(state.story.picker);
      state.story.picker.sourceAssets = [];
      updateStoryPickerTabs();
      showStoryPickerStep("characters");
      loadStoryPickerItems().catch((error) => {
        dom.storyPickerStatus.textContent = error.message || "人物数据读取失败";
      });
    });
    dom.storyPickerBackgroundTab.addEventListener("click", () => {
      if (state.story.picker.kind === "backgrounds") {
        return;
      }
      cancelStoryPickerExtraction(state.story.picker);
      if (state.story.picker.detailController) {
        state.story.picker.detailController.abort();
        state.story.picker.detailController = null;
      }
      state.story.picker.kind = "backgrounds";
      state.story.picker.servantClass = "all";
      state.story.picker.servantRarity = "all";
      state.story.picker.selectedCharacter = null;
      state.story.picker.selectedSources = [];
      state.story.picker.selectedSource = null;
      revokeStoryPickerAssets(state.story.picker);
      state.story.picker.sourceAssets = [];
      updateStoryPickerTabs();
      showStoryPickerStep("characters");
      loadStoryPickerItems().catch((error) => {
        dom.storyPickerStatus.textContent = error.message || "剧情图片读取失败";
      });
    });
    dom.storyPickerSearchInput.addEventListener("input", () => {
      if (!state.story.picker.open || !dom.storyPickerCharacterStep.hidden) {
        ensureStoryPickerRenderers();
        storyCharacterBrowser.setQuery(dom.storyPickerSearchInput.value);
      }
    });
    dom.storyPickerClassSelect.addEventListener("change", () => {
      state.story.picker.servantClass = dom.storyPickerClassSelect.value;
      renderStoryPickerCharacters();
    });
    dom.storyPickerRaritySelect.addEventListener("change", () => {
      state.story.picker.servantRarity = dom.storyPickerRaritySelect.value;
      renderStoryPickerCharacters();
    });

    document.querySelectorAll(".library-tab").forEach((button) => {
      button.addEventListener("click", () => {
        if (!LIBRARIES[button.dataset.library] || button.dataset.library === state.library) {
          return;
        }
        state.library = button.dataset.library;
        saveSetting("library", state.library);
        resetFiltersForLibrary();
        closeModalIfOpen();
        loadLibrary();
      });
    });

    document.querySelectorAll(".density-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.density = button.dataset.density;
        updateActiveControls();
      });
    });

    dom.searchInput.addEventListener("input", () => {
      dom.clearSearchButton.hidden = !dom.searchInput.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilters, 120);
    });
    dom.clearSearchButton.addEventListener("click", () => {
      dom.searchInput.value = "";
      dom.clearSearchButton.hidden = true;
      dom.searchInput.focus();
      applyFilters();
    });
    dom.raritySelect.addEventListener("change", applyFilters);
    dom.subtypeSelect.addEventListener("change", applyFilters);
    dom.sortSelect.addEventListener("change", applyFilters);
    dom.newOnlyInput.addEventListener("change", applyFilters);
    dom.mobileFilterButton.addEventListener("click", () => {
      const isOpen = !dom.advancedFilters.classList.contains("is-open");
      dom.advancedFilters.classList.toggle("is-open", isOpen);
      dom.mobileFilterButton.setAttribute("aria-expanded", String(isOpen));
    });
    dom.refreshButton.addEventListener("click", () => loadLibrary({ force: true }));
    dom.stateAction.addEventListener("click", () => loadLibrary({ force: true }));

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", closeModal);
    });
    dom.previewImage.addEventListener("load", () => {
      dom.previewLoading.hidden = true;
      dom.previewError.hidden = true;
      dom.previewImage.classList.add("is-loaded");
      dom.factDimensions.textContent = `${dom.previewImage.naturalWidth} × ${dom.previewImage.naturalHeight} px`;
    });
    dom.previewImage.addEventListener("error", () => {
      dom.previewLoading.hidden = true;
      dom.previewError.hidden = false;
      dom.previewError.textContent = "图片载入失败";
      dom.factDimensions.textContent = "载入失败";
    });
    dom.downloadButton.addEventListener("click", downloadCurrentAsset);
    dom.expressionQuickButton.addEventListener("click", quickExtractExpressions);
    dom.figureQuickButton.addEventListener("click", quickExtractFigures);
    dom.currentSheetExpressionButton.addEventListener("click", extractCurrentSheetExpressions);
    dom.currentSheetFigureButton.addEventListener("click", extractCurrentSheetFigures);
    dom.linkedFigureButton.addEventListener("click", extractLinkedFigures);
    dom.extractExpressionsButton.addEventListener("click", extractSelectedAssets);
    dom.downloadAllExpressionsButton.addEventListener("click", downloadAllAssets);
    dom.copyButton.addEventListener("click", copyCurrentAsset);
    dom.previousRecordButton.addEventListener("click", () => moveRecord(-1));
    dom.nextRecordButton.addEventListener("click", () => moveRecord(1));

    document.addEventListener("keydown", (event) => {
      if (state.story.projectLibraryOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setStoryProjectLibraryOpen(false);
        }
        return;
      }
      if (state.story.picker.open) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeStoryCharacterPicker();
        }
        return;
      }
      if (dom.modal.hidden) {
        return;
      }
      if (event.key === "Escape") {
        closeModal();
      } else if (event.key === "ArrowLeft") {
        selectAdjacentAsset(-1);
      } else if (event.key === "ArrowRight") {
        selectAdjacentAsset(1);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore();
      }
    }, { rootMargin: "500px" });
    observer.observe(dom.loadSentinel);
  }

  function selectAdjacentAsset(direction) {
    const group = state.modalAssets.get(state.modalAssetType);
    if (!group || group.assets.length < 2) {
      return;
    }
    const nextIndex = (state.modalAssetIndex + direction + group.assets.length) % group.assets.length;
    selectAsset(nextIndex);
  }

  function closeModalIfOpen() {
    if (!dom.modal.hidden) {
      closeModal();
    }
  }

  function hideSourceIntro(onComplete) {
    if (introTransitionTimer !== null) {
      window.clearTimeout(introTransitionTimer);
      introTransitionTimer = null;
    }
    if (dom.sourceIntro.hidden) {
      if (typeof onComplete === "function") {
        onComplete();
      }
      return;
    }
    dom.sourceIntro.classList.add("is-leaving");
    introTransitionTimer = window.setTimeout(() => {
      introTransitionTimer = null;
      dom.sourceIntro.hidden = true;
      dom.sourceIntro.classList.remove("is-leaving");
      document.body.classList.remove("is-intro-open");
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, 520);
  }

  function showSourceIntro() {
    if (introTransitionTimer !== null) {
      window.clearTimeout(introTransitionTimer);
      introTransitionTimer = null;
    }
    dom.sourceIntro.hidden = false;
    dom.sourceIntro.classList.remove("is-leaving");
    document.body.classList.add("is-intro-open");
    window.requestAnimationFrame(() => dom.enterAppButton.focus({ preventScroll: true }));
  }

  function goHome() {
    closeModalIfOpen();
    setStoryProjectLibraryOpen(false);
    if (state.story.picker.open) {
      closeStoryCharacterPicker();
    }
    if (state.story.bgmPicker.open) {
      closeStoryBgmPicker();
    }
    setStoryGeneratorOpen(false);
    setMorePanelOpen(false);
    setSupportPanelOpen(false);
    showSourceIntro();
  }

  function enterApp() {
    if (dom.sourceIntro.hidden || dom.sourceIntro.classList.contains("is-leaving")) {
      return;
    }
    setStoryGeneratorOpen(false);
    setMorePanelOpen(false);
    setSupportPanelOpen(false);
    hideSourceIntro();
  }

  function enterStoryApp() {
    if (dom.sourceIntro.hidden || dom.sourceIntro.classList.contains("is-leaving")) {
      return;
    }
    setMorePanelOpen(false);
    setSupportPanelOpen(false);
    setStoryGeneratorOpen(true);
    hideSourceIntro();
  }

  function enterMoreApp() {
    if (dom.sourceIntro.hidden || dom.sourceIntro.classList.contains("is-leaving")) {
      return;
    }
    setStoryGeneratorOpen(false);
    setSupportPanelOpen(false);
    setMorePanelOpen(true);
    hideSourceIntro();
  }

  function enterSupportApp() {
    if (dom.sourceIntro.hidden || dom.sourceIntro.classList.contains("is-leaving")) {
      return;
    }
    setStoryGeneratorOpen(false);
    setMorePanelOpen(false);
    setSupportPanelOpen(true);
    hideSourceIntro();
  }

  function init() {
    updateViewportMetrics();
    updateStoryVideoExportButtonLabel();
    bindEvents();
    updateActiveControls();
    initializeStoryProjectStorage().catch(() => {});
    loadLibrary();
    window.requestAnimationFrame(() => dom.enterAppButton.focus({ preventScroll: true }));
  }

  init();
})();
