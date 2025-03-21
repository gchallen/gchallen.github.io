import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react"
import {
  LoadPyodideRequest,
  LoadPyodideResponse,
  RunPythonOptions,
  RunPythonRequest,
  RunPythonResponse,
  StartRunResponse,
} from "../types/runpython"

export interface RunPythonContext {
  available: boolean
  run: (code: string, options?: RunPythonOptions) => Promise<string>
  load: () => Promise<boolean>
}
export const RunPythonContext = createContext<RunPythonContext>({
  available: false,
  run: () => {
    throw "RunPythonContext not available"
  },
  load: () => {
    throw "RunPythonContext not available"
  },
})

const BIG_TIMEOUT = process.env.NODE_ENV === "development" ? 10 : 60

export const RunPythonProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const workerRef = useRef<Worker | null>(null)

  const previouslyStarted = useRef(false)
  const [restartWorker, setRestartWorker] = useState(false)

  const run = useCallback(async (code: string, options?: RunPythonOptions) => {
    if (!workerRef.current) {
      return Promise.reject(`Python worker not ready`)
    }

    return new Promise<string>((resolve, reject) => {
      const channel = new MessageChannel()

      let timer: ReturnType<typeof setTimeout>

      channel.port1.onmessage = (message) => {
        if (StartRunResponse.guard(message.data)) {
          clearTimeout(timer)
          timer = setTimeout(() => {
            workerRef.current?.terminate()
            setRestartWorker((r) => !r)
            reject(new Error("Timeout"))
          }, 1000)
          return
        }

        channel.port1.close()
        clearTimeout(timer)

        const response = RunPythonResponse.check(message.data)
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response.result!)
        }
      }

      workerRef.current!.postMessage(RunPythonRequest.check({ type: "run", code, options }), [channel.port2])
      timer = setTimeout(() => {
        workerRef.current?.terminate()
        setRestartWorker((r) => !r)
        reject(new Error("Timeout"))
      }, BIG_TIMEOUT * 1000)
    })
  }, [])

  const load = useCallback(async () => {
    if (!workerRef.current) {
      return Promise.reject(`Python worker not ready`)
    }

    return new Promise<boolean>((resolve, reject) => {
      const channel = new MessageChannel()

      let timer: ReturnType<typeof setTimeout>

      channel.port1.onmessage = (message) => {
        const response = LoadPyodideResponse.check(message.data)
        channel.port1.close()
        clearTimeout(timer)
        resolve(response.ok)
      }

      workerRef.current!.postMessage(LoadPyodideRequest.check({ type: "load" }), [channel.port2])
      timer = setTimeout(() => {
        workerRef.current?.terminate()
        setRestartWorker((r) => !r)
        reject(new Error("Timeout"))
      }, BIG_TIMEOUT * 1000)
    })
  }, [])

  useEffect(() => {
    workerRef.current = new Worker(new URL("../workers/runpython.ts", import.meta.url))
    if (previouslyStarted.current) {
      load()
    }
    previouslyStarted.current = true
  }, [restartWorker, load])

  return <RunPythonContext.Provider value={{ run, load, available: true }}>{children}</RunPythonContext.Provider>
}

export const useRunPython = (): RunPythonContext => {
  return useContext(RunPythonContext)
}

export default RunPythonProvider
