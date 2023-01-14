export default defineEventHandler(event => {
  const config = useRuntimeConfig()
  return {
    version: config.public.feVersion,
  }
})
