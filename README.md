# 🎬 OmniSaver - All-in-One Video Downloader (React Native & Expo)

A mobile application built with React Native and Expo to download videos from **TikTok (No Watermark)**, **Instagram (Reels & Posts)**, and **YouTube (Shorts & HD Videos)** directly into your device's photo gallery / Camera Roll.

---

## 🚀 Features

- **TikTok Downloader**: Clean, HD downloads with **no watermark** (powered by TikWM engine).
- **Instagram Downloader**: Fetch public Reels, Videos, and Posts directly to device storage.
- **YouTube Downloader**: Download YouTube Shorts and Videos in HD or extract audio (MP3).
- **Automatic Clipboard Detection**: Detects copied video links from TikTok, Instagram, or YouTube as soon as you open the app.
- **Direct Gallery Integration**: Automatically saves downloaded videos into your phone's Gallery / Photos app (`OmniSaver` album).
- **Persistent Download History**: Revisit previously downloaded media, re-share to WhatsApp / Telegram, or delete.
- **Modern Dark UI**: Glassmorphic theme with glowing brand badges and real-time download progress bar.

---

## 🛠️ How to Run the App

### Option 1: Run on Your Physical Phone (Recommended)
1. Install **Expo Go** from Google Play Store (Android) or App Store (iOS).
2. Open terminal in `d:\react-native\media-downloader`:
   ```bash
   npm start
   ```
3. Scan the QR code displayed in the terminal with:
   - **Android**: Expo Go app camera scanner.
   - **iOS**: Default iPhone Camera app.

### Option 2: Run in Android Emulator
```bash
npm run android
```

### Option 3: Run on Web Browser (Preview)
```bash
npm run web
```

---

## 📱 Supported Platforms & Copy Instructions

| Platform | Instructions | Features |
|---|---|---|
| **TikTok** | Open TikTok -> Tap **Share** -> **Copy Link** | Clean HD video **Without Watermark** |
| **Instagram** | Open Instagram -> Tap **Share** / `•••` -> **Copy Link** | Direct Reel & Video MP4 |
| **YouTube** | Open YouTube -> Tap **Share** -> **Copy Link** | Shorts & Full Videos |

---

## 📂 Project Architecture

```
media-downloader/
├── App.tsx                     # Main application container & state orchestration
├── app.json                    # Expo configuration & native permissions (MediaLibrary)
├── package.json                # Dependencies and scripts
└── src/
    ├── components/
    │   ├── Header.tsx           # Glowing branding, tab switcher, help trigger
    │   ├── PlatformPills.tsx    # Filter chips (All, TikTok, Instagram, YouTube)
    │   ├── UrlInputBar.tsx      # Smart input with 1-tap paste & platform detection
    │   ├── MediaPreviewCard.tsx # Video thumbnail, resolution options & progress bar
    │   ├── HistoryList.tsx      # Saved files list with 1-tap share & delete
    │   └── HowToUseModal.tsx    # Interactive visual guide for copying links
    ├── services/
    │   ├── api/
    │   │   └── extractor.ts     # Multi-engine extractor (TikWM, Cobalt, Invidious)
    │   ├── download/
    │   │   └── downloadManager.ts # FileSystem downloader & MediaLibrary gallery saver
    │   ├── storage/
    │   │   └── history.ts       # AsyncStorage persistence for downloaded media
    │   └── clipboard.ts         # Smart clipboard URL inspector
    ├── theme/
    │   └── colors.ts            # Curated color tokens & brand accents
    └── types/
        └── index.ts             # TypeScript interfaces
```
