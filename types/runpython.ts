import { Boolean, Literal, Partial, Record, Static, String, Unknown } from "runtypes"

export const RunPythonRequest = Record({
  type: Literal("run"),
  code: String,
})
export type RunPythonRequest = Static<typeof RunPythonRequest>

export const StartRunResponse = Record({
  type: Literal("startrun"),
})
export type StartRunResponse = Static<typeof StartRunResponse>

export const RunPythonResponse = Record({
  type: Literal("runresponse"),
}).And(
  Partial({
    result: String,
    error: Unknown,
  }),
)
export type RunPythonResponse = Static<typeof RunPythonResponse>

export const LoadPyodideRequest = Record({
  type: Literal("load"),
})
export type LoadPyodideRequest = Static<typeof LoadPyodideRequest>

export const LoadPyodideResponse = Record({
  type: Literal("loadresponse"),
  ok: Boolean,
})
export type LoadPyodideResponse = Static<typeof LoadPyodideResponse>
