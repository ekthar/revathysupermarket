module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      url: [
        "http://127.0.0.1:3000/",
        "http://127.0.0.1:3000/products",
        "http://127.0.0.1:3000/login"
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        throttling: { cpuSlowdownMultiplier: 2 }
      }
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1.0 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 1.0 }],
        "categories:pwa": ["error", { minScore: 1.0 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.01 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        "total-byte-weight": ["error", { maxNumericValue: 1400000 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 1500 }],
        "speed-index": ["warn", { maxNumericValue: 2500 }]
      }
    },
    upload: { target: "temporary-public-storage" }
  }
};
