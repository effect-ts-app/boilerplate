module.exports = {
  cacheDirectory: "./.jest-cache",
  projects: ["<rootDir>/apps/api", "<rootDir>/apps/frontend-nuxt", "<rootDir>/packages/*"].concat(!process.env.GITHUB_ACTIONS ? ["<rootDir>/apps/api/_test"] : [])
}
