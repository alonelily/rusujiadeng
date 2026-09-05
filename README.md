# 如数迦贞

如数迦贞是一个面向个人创作的 FGO 素材浏览与剧情生成网页工具。网页版本与 Android、iOS 原生工程分开维护，作品数据保存在使用者自己的浏览器中，不需要账号或云服务器。

## 在线使用

打开 [如数迦贞](https://alonelily.github.io/rusujiadeng/) 即可使用。苹果用户可以在 Safari 中点击“分享”→“添加到主屏幕”，之后像普通应用一样从主屏幕启动。

素材和 BGM 会按需从 Atlas Academy 在线加载，因此浏览素材时需要网络连接。剧情编辑、图片导入、差分提取和视频导出均在本地浏览器中完成。

## Android 下载

Android 最新正式版为 `3.3.7`（versionCode 33），可通过[稳定下载链接](https://github.com/alonelily/rusujiadeng/releases/latest/download/rusujiadeng-android.apk)安装。安装包 SHA-256：`14E22DE92FFC2003423C1B0B9ABB2A4A9B73F50F94BC556D269336214EF2F814`。

## 本地作品与备份

剧情作品、生成差分和本地 BGM 默认保存在当前浏览器的 IndexedDB 中，不会上传到本项目的服务器。更换设备、清理 Safari 数据或移除主屏网页前，请在剧情生成器中导出 `.zip` 备份文件；需要继续编辑时再导入该文件。旧版 `.rusu` 备份仍可直接导入。

## 开发说明

这是一个持续开发中的公益项目。GitHub Pages 发布的是静态前端代码，浏览器可以查看这些代码；项目不包含 Android、iOS 工程或 APK 文件。
