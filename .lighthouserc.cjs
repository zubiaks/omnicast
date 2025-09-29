module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5500/',
        'http://localhost:5500/iptv',
        'http://localhost:5500/vod',
        'http://localhost:5500/radio',
        'http://localhost:5500/webcams'
      ],
      numberOfRuns:           3,
      startServerCommand:     'npm run build && npm run preview -- --port 5500',
      startServerReadyPattern: 'Local:',
      startServerTimeout:      120000,
      launchOptions: {
        chromeFlags: ['--no-sandbox','--headless']
      }
    },
    assert: {
      budgetsFile: './lhci-budgets.json'
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
