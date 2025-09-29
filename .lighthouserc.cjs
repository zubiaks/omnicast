// .lighthouserc.cjs
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
      numberOfRuns: 3,
      startServerCommand: 'npm run build && npm run preview -- --port 5500',
      startServerReadyPattern: 'Local:',
      startServerTimeout: 120000,
      launchOptions: {
        chromeFlags: ['--no-sandbox', '--headless']
      }
    },
    assert: {
      assertions: {
        'categories:performance':             ['error', { minScore: 0.90 }],
        'metrics:largest-contentful-paint':   ['error', { maxNumericValue: 2500 }],
        'metrics:cumulative-layout-shift':    ['error', { maxNumericValue: 0.10 }],
        'metrics:total-blocking-time':        ['error', { maxNumericValue: 300 }],
        'metrics': 'off'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
