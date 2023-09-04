import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef } from "react"
import { RunPythonRequest, RunPythonResponse } from "../types/runpython"

export interface RunPythonContext {
  run: (code: string) => Promise<string>
}
export const RunPythonContext = createContext<RunPythonContext>({
  run: () => {
    throw "RunPythonContext not available"
  },
})

export const RunPythonProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const workerRef = useRef<Worker>()

  useEffect(() => {
    workerRef.current = new Worker(new URL("../workers/runpython.ts", import.meta.url))
  }, [])

  const run = useCallback(async (code: string) => {
    if (!workerRef.current) {
      return Promise.reject(`Python worker not ready`)
    }

    return new Promise<string>((resolve, reject) => {
      const channel = new MessageChannel()

      channel.port1.onmessage = (message) => {
        channel.port1.close()

        const response = RunPythonResponse.check(message.data)
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response.result!)
        }
      }

      workerRef.current!.postMessage(RunPythonRequest.check({ code }), [channel.port2])
    })
  }, [])

  return <RunPythonContext.Provider value={{ run }}>{children}</RunPythonContext.Provider>
}

export const useRunPython = (): RunPythonContext => {
  return useContext(RunPythonContext)
}

export default RunPythonProvider
