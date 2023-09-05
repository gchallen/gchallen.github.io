import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react"
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

  const [restartWorker, setRestartWorker] = useState(false)

  useEffect(() => {
    workerRef.current = new Worker(new URL("../workers/runpython.ts", import.meta.url))
  }, [restartWorker])

  const run = useCallback(async (code: string) => {
    if (!workerRef.current) {
      return Promise.reject(`Python worker not ready`)
    }

    return new Promise<string>((resolve, reject) => {
      const channel = new MessageChannel()

      let timer: ReturnType<typeof setTimeout>

      channel.port1.onmessage = (message) => {
        channel.port1.close()
        clearTimeout(timer)

        const response = RunPythonResponse.check(message.data)
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response.result!)
        }
      }

      workerRef.current!.postMessage(RunPythonRequest.check({ code }), [channel.port2])
      timer = setTimeout(() => {
        workerRef.current?.terminate()
        setRestartWorker((r) => !r)
        reject(new Error("Timeout"))
      }, 1000)
    })
  }, [])

  return <RunPythonContext.Provider value={{ run }}>{children}</RunPythonContext.Provider>
}

export const useRunPython = (): RunPythonContext => {
  return useContext(RunPythonContext)
}

export default RunPythonProvider
