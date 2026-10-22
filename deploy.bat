@echo off
cd /d "D:\react-native\media-downloader\website"
echo deploying to Vercel...
rem Try installing vercel via npm
npm install -g vercel 2>&1
vercel --help >nul 2>&1
if %errorlevel% neq 0 (
    echo "Vercel CLI not available, providing manual deployment instructions:"
    echo.
    echo "1. Go to vercel.com and sign in"
    echo "2. Create new project"
    echo "3. Import GitHub repository: suhail-ahmed-lakho/social-downloading-apk"
    echo "4. Set root directory to: website/"
    echo "5. Deploy"
)
echo Done