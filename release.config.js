// release.config.js
module.exports = {
  branches: ["main"],
  repositoryUrl: "https://github.com/zubiaks/omnicast.git",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): v${nextRelease.version} [skip ci]"
      }
    ],
    "@semantic-release/github"
  ]
}
