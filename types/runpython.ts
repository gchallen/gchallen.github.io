import { Partial, Record, String, Unknown } from "runtypes"

export const RunPythonRequest = Record({
  code: String,
})

export const RunPythonResponse = Partial({
  result: String,
  error: Unknown,
})
