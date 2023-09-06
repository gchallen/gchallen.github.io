import { Literal, Partial, Record, Static, String, Unknown } from "runtypes"

export const RunPythonRequest = Record({
  type: Literal("request"),
  code: String,
})
export type RunPythonRequest = Static<typeof RunPythonRequest>

export const StartRunResponse = Record({
  type: Literal("startrun"),
})
export type StartRunResponse = Static<typeof StartRunResponse>

export const RunPythonResponse = Partial({
  type: Literal("response"),
  result: String,
  error: Unknown,
})
export type RunPythonResponse = Static<typeof RunPythonResponse>
