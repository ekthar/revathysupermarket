module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      url: [
        "http://127.0.0.1:3000/",
        "http://127.0.0.1:3000/products",
        "http://127.0.0.1:3000/login",
        "http://127.0.0.1:3000/category/fruits",
        "http://127.0.0.1:3000/cart",
        "http://127.0.0.1:3000/products/robusta-banana"
      ],
      numberOfRuns: 2
    },
    assert: {
      assertions: {
        // Performance budgets enforced by CI (Phase 0)
        "categories:performance": ["error", { minScore: 0.90 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "total-byte-weight": ["error", { maxNumericValue: 1600000 }]
      }
    },
    upload: { target: "temporary-public-storage" }
  }
};
