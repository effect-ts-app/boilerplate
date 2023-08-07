interface alertData {
  title: string | undefined
  body: string | undefined
}

interface alertBtn<T> {
  name: string
  color: string
  returnValue: T
}

interface alertList {
  promiseResolve: (val: any) => void
  show: boolean
  title: string
  body: string | undefined
  buttons: Array<any>
}

const alertsList = ref<Array<alertList>>([])

function alertAdd<Buttons extends alertBtn<any>>(data: alertData): Promise<true>
function alertAdd<Buttons extends alertBtn<any>[]>(
  data: alertData,
  ...buttons: Buttons
): Promise<Buttons[number]["returnValue"]>
function alertAdd(data: alertData, ...buttons: any[]) {
  if (!buttons.length) {
    buttons = [
      {
        name: "OK",
        color: "green",
        returnValue: true,
      },
    ]
  }
  return new Promise(promiseResolve => {
    alertsList.value.push({
      promiseResolve,
      show: true,
      title: data?.title || "",
      body: data?.body ?? data.body,
      buttons,
    })
  })
}

document.onkeydown = function (evt) {
  if (alertsList.value.length) {
    evt = evt || window.event
    if ("key" in evt) {
      if (evt.key === "Escape" || evt.key === "Esc") {
        alertRemove(alertsList.value.length, false)
      }
      if (evt.key === "Enter") {
        alertRemove(alertsList.value.length, true)
      }
    }
  }
}

function alertRemove(index: number, returnValue: any) {
  const removeData = alertsList.value[index]
  removeData.promiseResolve(returnValue)
  alertsList.value.splice(index, 1)
}

export { alertRemove, alertsList, alertAdd }

export default alertAdd
