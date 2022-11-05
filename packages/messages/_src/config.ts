import dotenv from "dotenv"

const envFile = "./.env.local"

const { error } = dotenv.config({ path: envFile })
if (error) {
  console.log("did not load .env.local")
} else {
  console.log("loading env from: " + envFile)
}

const {
  API_VERSION = "local-dev",
  ENV = "local-dev",
  LOG,
  QUEUE_URL = "mem://",
  REAL_MAIL: PROVIDED_REAL_MAIL,
  SENDGRID_API_KEY: PROVIDED_SENDGRID_API_KEY
} = process.env

const FAKE_MAIL = PROVIDED_REAL_MAIL !== "true"
// TODO
const FROM = {
  name: ReasonableString("@effect-ts-app/boilerplate"),
  email: Email("noreply@example.com")
}

const SENDGRID_API_KEY = PROVIDED_SENDGRID_API_KEY ?
  ReasonableString(PROVIDED_SENDGRID_API_KEY) :
  null

export const serviceName = "@effect-ts-app/boilerplate-api"

export { API_VERSION, ENV, FAKE_MAIL, FROM, LOG, QUEUE_URL, SENDGRID_API_KEY }
