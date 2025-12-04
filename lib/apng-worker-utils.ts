import type {
  EncodeRequest,
  WorkerResponse,
  ProgressResponse,
  CompleteResponse,
  ErrorResponse,
} from './apng-worker-types'

export interface EncodeOptions {
  buffers: ArrayBuffer[]
  width: number
  height: number
  delays: number[]
  initialColorCount: number
  targetSizeMB?: number
  maxAttempts?: number
  onProgress?: (progress: number, message?: string) => void
}

export interface EncodeResult {
  buffer: ArrayBuffer
  sizeMB: number
  attempts: number
  finalColorCount: number
}

/**
 * Web Worker を使用して APNG をエンコードする
 * @param options エンコードオプション
 * @returns エンコード結果の Promise
 */
export async function encodeAPNGWithWorker(
  options: EncodeOptions
): Promise<EncodeResult> {
  const {
    buffers,
    width,
    height,
    delays,
    initialColorCount,
    targetSizeMB = 5,
    maxAttempts = 8,
    onProgress,
  } = options

  return new Promise((resolve, reject) => {
    // Worker を作成
    const worker = new Worker(
      new URL('./apng-encoder.worker.ts', import.meta.url),
      { type: 'module' }
    )

    // タイムアウト設定（60秒）
    const timeout = setTimeout(() => {
      worker.terminate()
      reject(new Error('エンコード処理がタイムアウトしました（60秒）'))
    }, 60000)

    // Worker からのメッセージを処理
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const response = event.data

      switch (response.type) {
        case 'progress':
          if (onProgress) {
            onProgress(response.value, response.message)
          }
          break

        case 'complete':
          clearTimeout(timeout)
          worker.terminate()
          resolve({
            buffer: response.buffer,
            sizeMB: response.sizeMB,
            attempts: response.attempts,
            finalColorCount: response.finalColorCount,
          })
          break

        case 'error':
          clearTimeout(timeout)
          worker.terminate()
          reject(new Error(response.message))
          break

        default:
          console.warn('[Worker Utils] Unknown response type:', response)
      }
    })

    // Worker エラーハンドリング
    worker.addEventListener('error', (error) => {
      clearTimeout(timeout)
      worker.terminate()
      reject(new Error(`Worker error: ${error.message}`))
    })

    // エンコードリクエストを送信
    const request: EncodeRequest = {
      type: 'encode',
      buffers,
      width,
      height,
      delays,
      initialColorCount,
      targetSizeMB,
      maxAttempts,
    }

    // Transferable objects を使用してメモリ効率を向上
    // 注意: buffers は転送後に元のコンテキストでは使用不可になる
    worker.postMessage(request, buffers)
  })
}

/**
 * ブラウザが Web Worker をサポートしているかチェック
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined'
}
