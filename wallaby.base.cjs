module.exports = () => {
  return {
    autoDetect: true,
    // right now a limitation
    // as it runs out of memory, probably from running their own compiler instance
    runMode: 'onsave'
  }
}