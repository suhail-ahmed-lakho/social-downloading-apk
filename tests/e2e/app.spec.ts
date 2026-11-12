import { test, expect, Page } from '@playwright/test';

async function waitForAppReady(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('bottom-nav-bar')).toBeVisible({ timeout: 15_000 });
  // Wait for splash screen fade-out (~1.1s max) so inputs are unobstructed
  await page.waitForTimeout(1300);
}

async function mockTikTokExtraction(page: Page, streamUrl: string) {
  await page.route('https://www.tikwm.com/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        msg: 'success',
        data: {
          id: '739000111222333444',
          title: 'Sunset Mountains Cinematic 4K Clip',
          author: { nickname: 'NatureCreator', unique_id: 'naturecreator' },
          cover: '',
          play: streamUrl,
          hdplay: streamUrl,
          wmplay: streamUrl,
          duration: 18,
          size: 3145728,
        },
      }),
    });
  });
}

test.describe('OmniSaver Mobile Navigation, Live Downloads & Alerts', () => {
  test('renders dedicated 4-tab bottom navigation bar and switches all screens cleanly', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await waitForAppReady(page);

    await expect(page.getByTestId('nav-tab-download')).toBeVisible();
    await expect(page.getByTestId('nav-tab-queue')).toBeVisible();
    await expect(page.getByTestId('nav-tab-history')).toBeVisible();
    await expect(page.getByTestId('nav-tab-alerts')).toBeVisible();

    // Active navbar indicator must be a wide rounded pill capsule (never a muddy square box)
    const activeCapsule = page.getByTestId('nav-active-capsule');
    await expect(activeCapsule).toBeVisible();
    const capsuleBox = await activeCapsule.boundingBox();
    expect(capsuleBox).not.toBeNull();
    expect(capsuleBox!.width).toBeGreaterThanOrEqual(capsuleBox!.height * 1.75);

    // Switch to Downloads tab
    await page.getByTestId('nav-tab-queue').click();
    await expect(page.getByTestId('screen-downloads')).toBeVisible();
    await expect(page.getByTestId('nav-tab-queue').getByTestId('nav-active-capsule')).toBeVisible();
    await expect(page.getByTestId('downloads-empty-state')).toBeVisible();
    await expect(page.getByTestId('downloads-total-speed')).toContainText('KB/s');

    // Return via empty CTA back to Home
    await page.getByTestId('downloads-go-home-btn').click();
    await expect(page.getByTestId('url-input')).toBeVisible();

    // Switch to Saved tab
    await page.getByTestId('nav-tab-history').click();
    await expect(page.getByTestId('screen-history')).toBeVisible();
    await expect(page.getByText('No Downloaded Media Yet')).toBeVisible();

    // Switch to Alerts tab
    await page.getByTestId('nav-tab-alerts').click();
    await expect(page.getByTestId('screen-alerts')).toBeVisible();
    await expect(page.getByText('Background Downloads Enabled')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('streams download in dedicated Downloads tab with live speed, %, downloaded MB, remaining MB, pause/resume & completion alerts', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await mockTikTokExtraction(page, 'http://127.0.0.1:4173/e2e-media/sample-video.mp4?slow=1');
    await waitForAppReady(page);

    // 1. Extract a video link on Home tab
    await page.getByTestId('url-input').fill('https://www.tiktok.com/@naturecreator/video/739000111222333444');
    await page.getByTestId('get-download-link-btn').click();

    await expect(page.getByTestId('start-download-btn')).toBeVisible({ timeout: 10_000 });

    // 2. Start download -> hands off cleanly into dedicated Downloads tab (NOT cramped inside Home card)
    await page.getByTestId('start-download-btn').click();
    await expect(page.getByTestId('screen-downloads')).toBeVisible();

    // 3. Verify live telemetry labels render: %, speed (MB/s or KB/s), downloaded MB, remaining MB
    const percentEl = page.getByTestId('telemetry-percent').first();
    const speedEl = page.getByTestId('telemetry-speed').first();
    const downloadedEl = page.getByTestId('telemetry-downloaded').first();
    const remainingEl = page.getByTestId('telemetry-remaining').first();

    await expect(percentEl).toBeVisible();
    await expect(percentEl).toContainText('%');
    await expect(speedEl).toContainText(/MB\/s|KB\/s/);
    await expect(downloadedEl).toContainText('MB');
    await expect(remainingEl).toContainText(/MB left/);

    // 4. Test Pause & Resume controls mid-transfer
    await page.getByTestId('btn-pause-download').first().click();
    await expect(page.getByTestId('btn-resume-download').first()).toBeVisible();
    await expect(speedEl).toContainText('Paused');

    await page.getByTestId('btn-resume-download').first().click();
    await expect(page.getByTestId('btn-pause-download').first()).toBeVisible();

    // 5. Wait for download completion (100%, 0.00 MB left, Share/Open button)
    await expect(page.getByTestId('btn-share-download').first()).toBeVisible({ timeout: 20_000 });
    await expect(percentEl).toContainText('100%');
    await expect(remainingEl).toContainText('0.00 MB left');

    // 6. Verify Saved Files tab badge & entry
    await expect(page.getByTestId('nav-badge-history')).toHaveText('1');
    await page.getByTestId('nav-tab-history').click();
    await expect(page.getByText('Sunset Mountains Cinematic 4K Clip')).toBeVisible();

    // 7. Verify Alerts tab received download complete alert
    await page.getByTestId('nav-tab-alerts').click();
    await expect(page.getByText('HD Video Saved!')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('cancels an active download cleanly', async ({ page }) => {
    await mockTikTokExtraction(page, 'http://127.0.0.1:4173/e2e-media/sample-video.mp4?slow=1');
    await waitForAppReady(page);

    await page.getByTestId('url-input').fill('https://www.tiktok.com/@naturecreator/video/739000111222333444');
    await page.getByTestId('get-download-link-btn').click();
    await page.getByTestId('start-download-btn').click();

    await expect(page.getByTestId('btn-cancel-download').first()).toBeVisible();
    await page.getByTestId('btn-cancel-download').first().click();

    await expect(page.getByTestId('btn-retry-download').first()).toBeVisible();
    await expect(page.getByTestId('downloads-active-count')).toHaveText('0');
  });

  test('handles denied OS notifications gracefully with Settings guidance and working in-app inbox', async ({ page }) => {
    // Emulate browser notification permission denied before app loads
    await page.addInitScript(() => {
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        value: class MockDeniedNotification {
          static permission = 'denied';
          static requestPermission = async () => 'denied';
        },
      });
    });

    await waitForAppReady(page);

    // Nav tab shows warning dot cleanly when notifications denied
    await page.getByTestId('nav-tab-alerts').click();
    await expect(page.getByTestId('alerts-status-denied')).toBeVisible();
    await expect(page.getByTestId('alerts-open-settings-btn')).toBeVisible();

    // Verify Push & Remote Broadcast setup instructions toggle cleanly
    await expect(page.getByTestId('alerts-push-setup-panel')).not.toBeVisible();
    await page.getByTestId('alerts-push-info-btn').click();
    await expect(page.getByTestId('alerts-push-setup-panel')).toBeVisible();

    // Even when OS permission is denied, in-app alert delivery works cleanly
    await page.getByTestId('alerts-test-btn').click();
    await expect(page.getByText('OmniSaver Alerts Active')).toBeVisible();

    // Mark all read clears unread badge
    await page.getByTestId('alerts-mark-read-btn').click();
    await expect(page.getByTestId('nav-badge-alerts')).not.toBeVisible();
  });

  test('YouTube extraction defaults to 1080p H.264, M4A song tab & tracks estimated % and remaining MB without Content-Length', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.route('https://www.youtube.com/oembed*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Endless Love Chillout Lo-Fi Test',
          author_name: 'LofiChannel',
          thumbnail_url: '',
        }),
      });
    });

    await page.route('**/youtubei/v1/player*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          playabilityStatus: { status: 'OK' },
          videoDetails: {
            videoId: 'dtwc9W5l5lA',
            title: 'Endless Love Chillout Lo-Fi Test',
            author: 'LofiChannel',
            lengthSeconds: '300',
          },
          streamingData: {
            adaptiveFormats: [
              { qualityLabel: '2160p', mimeType: 'video/mp4; codecs="av01.0.12M.08"', contentLength: '90000000' },
              { qualityLabel: '1080p', mimeType: 'video/mp4; codecs="avc1.640028"', contentLength: '5800000' },
              { mimeType: 'audio/mp4; codecs="mp4a.40.2"', contentLength: '480000' },
            ],
          },
        }),
      });
    });

    await page.route('https://loader.to/ajax/download.php*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          id: 'e2e_job_1',
          progress_url: 'https://loader.to/ajax/progress.php?id=e2e_job_1',
        }),
      });
    });

    await page.route('https://loader.to/ajax/progress.php*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: 1,
          progress: 1000,
          download_url: 'http://127.0.0.1:4173/e2e-media/sample-video.mp4?chunked=1&slow=1',
        }),
      });
    });

    await waitForAppReady(page);
    await page.getByTestId('url-input').fill('https://www.youtube.com/watch?v=dtwc9W5l5lA');
    await page.getByTestId('get-download-link-btn').click();

    await expect(page.getByTestId('start-download-btn')).toBeVisible({ timeout: 10_000 });
    // Default selected quality should be compatible 1080p Full HD (NOT 4K AV1)
    await expect(page.getByText('1080p Full HD')).toBeVisible();
    await expect(page.getByText('Songs / Audio')).toBeVisible();

    await page.getByTestId('start-download-btn').click();
    await expect(page.getByTestId('screen-downloads')).toBeVisible();

    const percentEl = page.getByTestId('telemetry-percent').first();
    const remainingEl = page.getByTestId('telemetry-remaining').first();

    // Even when Content-Length is omitted (?chunked=1), estimated % & remaining MB update live
    await expect(percentEl).toContainText(/^~[1-9]\d*%$/, { timeout: 12_000 });
    await expect(remainingEl).toContainText(/^~.*MB left$/, { timeout: 12_000 });

    // Completes cleanly at 100%
    await expect(page.getByTestId('btn-share-download').first()).toBeVisible({ timeout: 25_000 });
    await expect(percentEl).toContainText('100%');
    await expect(remainingEl).toContainText('0.00 MB left');
    expect(pageErrors).toEqual([]);
  });
});
