import { RunPythonRequest, RunPythonResponse } from "../types/runpython"

addEventListener(
  "message",
  (event) => {
    const request = RunPythonRequest.check(event.data)
    event.ports[0].postMessage(RunPythonResponse.check({ result: "Hello" }))
  },
  false,
)
