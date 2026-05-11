module.exports = {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'echo "v${nextRelease.version}" > VERSION'
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['VERSION'],
        message: 'chore(release): v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    '@semantic-release/github'
  ],
};
