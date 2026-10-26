// Automated test suite for all video downloader engines
// Tests YouTube, TikTok, Instagram, Twitter/X, and Facebook

const BASE_URL = "http://localhost:3000";

const TEST_URLS = [
  {
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    name: "Big Buck Bunny 4K (YouTube)",
  },
  {
    platform: "TikTok",
    url: "https://www.tiktok.com/@scout2015/video/6718335390845095173",
    name: "Scout Pet Reel (TikTok)",
  },
  {
    platform: "Instagram",
    url: "https://www.instagram.com/reel/C32sVwrrf5z/",
    name: "Instagram Reel",
  },
  {
    platform: "Twitter / X",
    url: "https://x.com/NASA/status/1784987625123984128",
    name: "NASA Launch Tweet (Twitter/X)",
  },
  {
    platform: "Facebook",
    url: "https://www.facebook.com/watch/?v=10153231379946729",
    name: "Facebook Public Video",
  },
];

async function checkMediaUrlLive(mediaUrl) {
  if (!mediaUrl || !mediaUrl.startsWith("http")) return { ok: false, error: "Invalid URL" };
  try {
    const res = await fetch(mediaUrl, {
      method: "GET",
      headers: {
        "Range": "bytes=0-1024",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      signal: AbortSignal.timeout(6000),
    });
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      contentType: res.headers.get("content-type") || "unknown",
      contentLength: res.headers.get("content-length") || "stream",
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING AUTOMATED MEDIA DOWNLOADER TEST SUITE");
  console.log("Testing against:", BASE_URL);
  console.log("=================================================\n");

  const results = [];

  for (const item of TEST_URLS) {
    console.log(`[TESTING] ${item.platform.toUpperCase()}: ${item.name}`);
    console.log(`Target URL: ${item.url}`);

    const startTime = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/video/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (!res.ok) {
        console.log(`❌ ${item.platform} FAILED (${res.status}):`, data.error || "Unknown error");
        results.push({
          platform: item.platform,
          success: false,
          error: data.error || `HTTP ${res.status}`,
          latencyMs,
        });
        console.log("-------------------------------------------------\n");
        continue;
      }

      console.log(`✅ ${item.platform} Info Extracted in ${latencyMs}ms!`);
      console.log(`   Title: ${data.title}`);
      console.log(`   Author: ${data.author}`);
      console.log(`   Formats Count: ${data.qualityOptions?.length || 0}`);

      // Verify the downloadable stream/file
      let mediaCheck = { ok: false };
      const firstOpt = data.qualityOptions?.[0];

      if (firstOpt?.directUrl) {
        console.log(`   Direct Stream URL: ${firstOpt.directUrl.slice(0, 70)}...`);
        console.log("   Checking if stream is alive & playable...");
        mediaCheck = await checkMediaUrlLive(firstOpt.directUrl);
        console.log(`   Stream Status: HTTP ${mediaCheck.status} (${mediaCheck.contentType})`);
      } else if (data.videoId) {
        console.log(`   YouTube Video ID: ${data.videoId} - Testing Conversion Gateway...`);
        const convRes = await fetch(`${BASE_URL}/api/video/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: data.videoId, format: "720", action: "init" }),
        });
        const convData = await convRes.json();
        console.log(`   Conversion Init: ${convData.status} (Download ready / Progress URL: ${convData.progressUrl ? "YES" : "NO"})`);
        mediaCheck = { ok: convRes.ok && (convData.status === "done" || convData.status === "processing" || convData.downloadUrl) };
      }

      results.push({
        platform: item.platform,
        success: true,
        title: data.title,
        formats: data.qualityOptions?.length,
        mediaLive: mediaCheck.ok,
        latencyMs,
      });

    } catch (err) {
      console.log(`❌ Error testing ${item.platform}:`, err.message);
      results.push({
        platform: item.platform,
        success: false,
        error: err.message,
      });
    }

    console.log("-------------------------------------------------\n");
  }

  console.log("=================================================");
  console.log("📊 FINAL TEST SUMMARY REPORT");
  console.log("=================================================");
  console.table(results);
}

runTests();
