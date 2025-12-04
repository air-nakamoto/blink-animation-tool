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
    console.log('[Worker Utils] Creating Web Worker...')
    let worker: Worker

    try {
      worker = new Worker(
        new URL('./apng-encoder.worker.ts', import.meta.url),
        { type: 'module' }
      )
      console.log('[Worker Utils] Web Worker created successfully')
    } catch (error) {
      console.error('[Worker Utils] Failed to create Worker:', error)
      reject(new Error(`Worker作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`))
      return
    }

    // タイムアウト設定（180秒 = 3分）
    const timeout = setTimeout(() => {
      console.warn('[Worker Utils] Encoding timeout (180s)')
      worker.terminate()
      reject(new Error('エンコード処理がタイムアウトしました（180秒）。画像サイズやフレーム数を減らしてください。'))
    }, 180000)

    // Worker からのメッセージを処理
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const response = event.data

      switch (response.type) {
        case 'progress':
          console.log(`[Worker Utils] Progress: ${response.value}% - ${response.message || ''}`)
          if (onProgress) {
            onProgress(response.value, response.message)
          }
          break

        case 'complete':
          console.log(`[Worker Utils] Encoding completed: ${response.sizeMB.toFixed(2)}MB in ${response.attempts} attempts`)
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
          console.error('[Worker Utils] Worker error:', response.message)
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
      console.error('[Worker Utils] Worker runtime error:', error)
      clearTimeout(timeout)
      worker.terminate()
      reject(new Error(`Worker実行エラー: ${error.message}`))
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

    console.log(`[Worker Utils] Sending encode request: ${buffers.length} frames, ${width}x${height}px`)

    // Transferable objects を使用してメモリ効率を向上
    // 注意: buffers は転送後に元のコンテキストでは使用不可になる
    try {
      worker.postMessage(request, buffers)
      console.log('[Worker Utils] Request sent to worker')
    } catch (error) {
      console.error('[Worker Utils] Failed to send message to worker:', error)
      clearTimeout(timeout)
      worker.terminate()
      reject(new Error(`Workerへのメッセージ送信に失敗: ${error instanceof Error ? error.message : String(error)}`))
    }
  })
}

/**
 * ブラウザが Web Worker をサポートしているかチェック
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined'
}
