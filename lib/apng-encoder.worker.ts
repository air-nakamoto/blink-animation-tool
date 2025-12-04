/// <reference lib="webworker" />

import type {
  WorkerRequest,
  WorkerResponse,
  EncodeRequest,
  ProgressResponse,
  CompleteResponse,
  ErrorResponse,
  UPNG,
} from './apng-worker-types'

// UPNG.js と pako.js をロード
declare const self: DedicatedWorkerGlobalScope
declare let UPNG: UPNG

// 進捗を送信するヘルパー（先に定義）
function sendProgress(value: number, message?: string) {
  const response: ProgressResponse = {
    type: 'progress',
    value,
    message,
  }
  self.postMessage(response)
}

// エラーを送信するヘルパー
function sendError(message: string) {
  const response: ErrorResponse = {
    type: 'error',
    message,
  }
  self.postMessage(response)
}

// 完了を送信するヘルパー
function sendComplete(buffer: ArrayBuffer, sizeMB: number, attempts: number, finalColorCount: number) {
  const response: CompleteResponse = {
    type: 'complete',
    buffer,
    sizeMB,
    attempts,
    finalColorCount,
  }
  // Transferable objects を使用してメモリ効率を向上
  self.postMessage(response, [buffer])
}

// Worker 初期化時に UPNG.js をロード
console.log('[Worker] Initializing APNG encoder worker...')
console.log('[Worker] Worker location:', self.location.href)

try {
  // 絶対URLを使用してスクリプトをロード
  const baseURL = self.location.origin
  console.log('[Worker] Base URL:', baseURL)

  const pakoURL = `${baseURL}/pako.min.js`
  const upngURL = `${baseURL}/upng.js`

  console.log('[Worker] Loading pako from:', pakoURL)
  importScripts(pakoURL)

  console.log('[Worker] Loading UPNG from:', upngURL)
  importScripts(upngURL)

  console.log('[Worker] Libraries loaded successfully')
} catch (error) {
  console.error('[Worker] Failed to load libraries:', error)
  const errorMsg = `ライブラリの読み込みに失敗: ${error instanceof Error ? error.message : String(error)}`
  console.error('[Worker]', errorMsg)
  sendError(errorMsg)
}

// エンコード処理のメインロジック
async function encodeAPNG(request: EncodeRequest) {
  const {
    buffers,
    width,
    height,
    delays,
    initialColorCount,
    targetSizeMB,
    maxAttempts,
  } = request

  if (!UPNG) {
    sendError('UPNG.js is not loaded in worker')
    return
  }

  if (!buffers || buffers.length === 0) {
    sendError('No image buffers provided')
    return
  }

  let currentColorCount = initialColorCount
  let bestBuffer: ArrayBuffer | null = null
  let bestSizeMB = Infinity
  let attemptCount = 0

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      attemptCount = attempt + 1

      const progressValue = 60 + (attempt / maxAttempts) * 35
      sendProgress(
        progressValue,
        `エンコード中 (試行 ${attemptCount}/${maxAttempts}, 色数: ${currentColorCount})`
      )

      // UPNG.encode を実行
      const encoded = UPNG.encode(buffers, width, height, currentColorCount, delays)
      const sizeMB = encoded.byteLength / (1024 * 1024)

      console.log(`[Worker] Attempt ${attemptCount}: colorCount=${currentColorCount}, size=${sizeMB.toFixed(2)}MB`)

      // ベストな結果を保存
      if (sizeMB < bestSizeMB) {
        bestBuffer = encoded
        bestSizeMB = sizeMB
      }

      // 目標サイズ以下なら終了
      if (sizeMB <= targetSizeMB) {
        console.log(`[Worker] Target size achieved: ${sizeMB.toFixed(2)}MB <= ${targetSizeMB}MB`)
        break
      }

      // 色数を減らして再試行
      if (currentColorCount > 32) {
        currentColorCount = Math.max(16, Math.floor(currentColorCount / 2))
        continue
      }

      // これ以上色数を減らせない場合は終了
      console.log(`[Worker] Cannot reduce color count further (current: ${currentColorCount})`)
      break
    }

    if (!bestBuffer) {
      sendError('APNGの生成に失敗しました')
      return
    }

    // 成功時の最終色数を計算（最後の試行の色数）
    const finalColorCount = currentColorCount

    sendComplete(bestBuffer, bestSizeMB, attemptCount, finalColorCount)

  } catch (error) {
    console.error('[Worker] Encoding error:', error)

    // メモリ不足エラーの場合は詳細なメッセージ
    if (error instanceof RangeError && error.message.includes('allocation')) {
      const estimatedMemoryMB = (buffers.length * width * height * 4) / (1024 * 1024)
      sendError(
        `メモリ不足のため生成できません。\n\n` +
        `推奨される対処法：\n` +
        `1. 画像サイズを縮小する（現在：${width}×${height}px）\n` +
        `2. アニメーション長さを短くする\n` +
        `3. フレームレートを下げる\n\n` +
        `必要メモリ：約${estimatedMemoryMB.toFixed(0)}MB`
      )
    } else {
      sendError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }
}

// メッセージハンドラ
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  console.log('[Worker] Message received:', event.data.type)
  const request = event.data

  if (request.type === 'encode') {
    console.log(`[Worker] Starting encoding: ${request.buffers.length} frames, ${request.width}x${request.height}px`)
    await encodeAPNG(request)
  } else {
    console.warn('[Worker] Unknown request type:', request)
  }
})

// Worker 準備完了を通知
console.log('[Worker] Worker ready and waiting for messages')
sendProgress(0, 'Worker initialized')
