// Web Worker と メインスレッド間の通信用型定義

export interface EncodeRequest {
  type: 'encode'
  buffers: ArrayBuffer[]
  width: number
  height: number
  delays: number[]
  initialColorCount: number
  targetSizeMB: number
  maxAttempts: number
}

export interface ProgressResponse {
  type: 'progress'
  value: number
  message?: string
}

export interface CompleteResponse {
  type: 'complete'
  buffer: ArrayBuffer
  sizeMB: number
  attempts: number
  finalColorCount: number
}

export interface ErrorResponse {
  type: 'error'
  message: string
}

export type WorkerRequest = EncodeRequest

export type WorkerResponse = ProgressResponse | CompleteResponse | ErrorResponse

// Frame 型（reduceFrameDensity用）
export type Frame = {
  imageType: "open" | "half" | "closed"
  duration: number
}

// UPNG型定義（Worker内で使用）
export interface UPNG {
  encode: (buffers: ArrayBuffer[], width: number, height: number, cnum: number, delays: number[]) => ArrayBuffer
}
