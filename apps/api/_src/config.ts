const {
  API_VERSION = "local-dev",
  ENV = "local-dev",
  HOST = "0.0.0.0",
  PORT: PROVIDED_PORT = "3540"
} = process.env

const PORT = parseInt(PROVIDED_PORT)

export { API_VERSION, ENV, HOST, PORT }
