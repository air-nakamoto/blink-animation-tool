"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Play, Pause, ChevronDown, Download, Plus, Trash2, Loader2, HelpCircle, ExternalLink } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { encodeAPNGWithWorker, isWorkerSupported } from "@/lib/apng-worker-utils"

// UPNG type definition
declare global {
  interface Window {
    UPNG: {
      encode: (buffers: ArrayBuffer[], width: number, height: number, cnum: number, delays: number[]) => ArrayBuffer
    }
  }
}

type ImageState = {
  open: string | null
  halfOpen: string | null
  closed: string | null
}

type ImageType = "open" | "halfOpen" | "closed"


type LoopStep = {
  id: string
  blinkCount: number
  blinkSpeed: number
  blinkInterval: number
  pauseDuration: number
  closedHold: number
}

interface LoopPattern {
  steps: LoopStep[]
}

type EmotionCategory = "basic" | "negative" | "high-energy"

type PresetStep = Omit<LoopStep, "id" | "closedHold"> & {
  closedHold?: number
}

interface EmotionPreset {
  id: string
  emoji: string
  name: string
  description: string
  category: EmotionCategory
  steps: PresetStep[]
}

const CUSTOM_PRESET_ID = "custom"
const DEFAULT_PRESET_ID = "heijo"

const createLoopSteps = (steps: PresetStep[]): LoopStep[] =>
  steps.map((step) => ({
    id: crypto.randomUUID(),
    blinkCount: step.blinkCount,
    blinkSpeed: step.blinkSpeed,
    blinkInterval: step.blinkInterval,
    pauseDuration: step.pauseDuration,
    closedHold: step.closedHold ?? 0,
  }))

const SIZE_WARNING_THRESHOLD_MB = 5

const computeColorCount = (quality: number, compressionLevel: number) => {
  const qualityFactor = Math.max(0.3, quality / 100)
  const compressionFactor = Math.max(0.35, 1 - (compressionLevel - 1) * 0.05)
  const count = Math.round(256 * qualityFactor * compressionFactor)
  return Math.max(16, Math.min(256, count))
}

const EMOTION_PRESETS: EmotionPreset[] = [
  {
    id: "heijo",
    emoji: "😐",
    name: "平常",
    description: "基本の状態",
    category: "basic",
    steps: [
      {
        blinkCount: 1,
        blinkSpeed: 0.15,
        blinkInterval: 0.2,
        pauseDuration: 3.0,
      },
    ],
  },
  {
    id: "odayaka",
    emoji: "😌",
    name: "穏やか",
    description: "リラックス",
    category: "basic",
    steps: [
      {
        blinkCount: 1,
        blinkSpeed: 0.2,
        blinkInterval: 0.2,
        pauseDuration: 2.8,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.25,
        blinkInterval: 0.2,
        pauseDuration: 4.0,
      },
    ],
  },
  {
    id: "gokigen",
    emoji: "😊",
    name: "ご機嫌",
    description: "楽しい気分",
    category: "basic",
    steps: [
      {
        blinkCount: 1,
        blinkSpeed: 0.15,
        blinkInterval: 0.2,
        pauseDuration: 2.5,
      },
      {
        blinkCount: 2,
        blinkSpeed: 0.12,
        blinkInterval: 0.2,
        pauseDuration: 3.0,
      },
    ],
  },
  {
    id: "shuchu",
    emoji: "🤔",
    name: "集中",
    description: "瞬き少ない",
    category: "basic",
    steps: [
      {
        blinkCount: 1,
        blinkSpeed: 0.15,
        blinkInterval: 0.2,
        pauseDuration: 8.0,
      },
    ],
  },
  {
    id: "kincho",
    emoji: "😰",
    name: "緊張",
    description: "落ち着かない",
    category: "negative",
    steps: [
      {
        blinkCount: 2,
        blinkSpeed: 0.1,
        blinkInterval: 0.2,
        pauseDuration: 1.5,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.12,
        blinkInterval: 0.2,
        pauseDuration: 1.8,
      },
    ],
  },
  {
    id: "nemuke",
    emoji: "😪",
    name: "眠気",
    description: "眠たい",
    category: "negative",
    steps: [
      {
        blinkCount: 1,
        blinkSpeed: 0.6,
        blinkInterval: 0.2,
        pauseDuration: 4.0,
        closedHold: 0.8,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.65,
        blinkInterval: 0.2,
        pauseDuration: 6.0,
        closedHold: 1.2,
      },
    ],
  },
  {
    id: "kanashimi",
    emoji: "😔",
    name: "悲しみ",
    description: "落ち込んでいる",
    category: "negative",
    steps: [
      {
        blinkCount: 1,
        blinkSpeed: 0.25,
        blinkInterval: 0.2,
        pauseDuration: 3.5,
        closedHold: 0.4,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.3,
        blinkInterval: 0.2,
        pauseDuration: 5.0,
        closedHold: 0.6,
      },
    ],
  },
  {
    id: "fuan",
    emoji: "😟",
    name: "不安",
    description: "そわそわ",
    category: "negative",
    steps: [
      {
        blinkCount: 1,
        blinkSpeed: 0.13,
        blinkInterval: 0.2,
        pauseDuration: 2.2,
      },
      {
        blinkCount: 2,
        blinkSpeed: 0.11,
        blinkInterval: 0.15,
        pauseDuration: 2.5,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.14,
        blinkInterval: 0.2,
        pauseDuration: 3.0,
      },
    ],
  },
  {
    id: "odoroki",
    emoji: "😲",
    name: "驚き",
    description: "びっくり",
    category: "high-energy",
    steps: [
      {
        blinkCount: 3,
        blinkSpeed: 0.08,
        blinkInterval: 0.15,
        pauseDuration: 1.0,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.1,
        blinkInterval: 0.2,
        pauseDuration: 2.0,
      },
      {
        blinkCount: 2,
        blinkSpeed: 0.11,
        blinkInterval: 0.18,
        pauseDuration: 2.5,
      },
    ],
  },
  {
    id: "kofun",
    emoji: "😤",
    name: "興奮",
    description: "ハイテンション",
    category: "high-energy",
    steps: [
      {
        blinkCount: 2,
        blinkSpeed: 0.1,
        blinkInterval: 0.15,
        pauseDuration: 1.8,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.12,
        blinkInterval: 0.2,
        pauseDuration: 2.0,
      },
      {
        blinkCount: 2,
        blinkSpeed: 0.11,
        blinkInterval: 0.18,
        pauseDuration: 1.5,
      },
    ],
  },
  {
    id: "tere",
    emoji: "😳",
    name: "照れ",
    description: "恥ずかしい",
    category: "high-energy",
    steps: [
      {
        blinkCount: 2,
        blinkSpeed: 0.13,
        blinkInterval: 0.25,
        pauseDuration: 1.2,
        closedHold: 0.25,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.18,
        blinkInterval: 0.2,
        pauseDuration: 2.0,
        closedHold: 0.3,
      },
      {
        blinkCount: 3,
        blinkSpeed: 0.11,
        blinkInterval: 0.2,
        pauseDuration: 1.5,
        closedHold: 0.2,
      },
    ],
  },
  {
    id: "taikutsu",
    emoji: "😑",
    name: "退屈",
    description: "やる気なし",
    category: "high-energy",
    steps: [
      {
        blinkCount: 1,
        blinkSpeed: 0.35,
        blinkInterval: 0.2,
        pauseDuration: 4.5,
        closedHold: 0.5,
      },
      {
        blinkCount: 1,
        blinkSpeed: 0.4,
        blinkInterval: 0.2,
        pauseDuration: 5.5,
        closedHold: 0.7,
      },
    ],
  },
]

const EMOTION_CATEGORY_TABS: Array<{ value: EmotionCategory; label: string }> = [
  { value: "basic", label: "基本" },
  { value: "negative", label: "ネガティブ" },
  { value: "high-energy", label: "ハイエナジー" },
]

const getPresetById = (id: string) => EMOTION_PRESETS.find((preset) => preset.id === id)

function generateLoopPatternFrames(
  loopPattern: LoopPattern, 
  settings: BlinkSettings
): Frame[] {
  const allFrames: Frame[] = []
  const fps = settings.fps
  const totalDuration = settings.animationLength
  let currentTime = 0

  // アニメーション長さまでループパターンを繰り返す
  while (currentTime < totalDuration) {
    for (const step of loopPattern.steps) {
      const stepFrames = generateStepFrames(step, fps)
      allFrames.push(...stepFrames)
      
      currentTime += calculateStepDuration(step)
      
      if (currentTime >= totalDuration) break
    }
  }

  return allFrames
}

function generateStepFrames(step: LoopStep, fps: number): Frame[] {
  const frames: Frame[] = []
  
  // 指定回数の瞬きを生成
  for (let i = 0; i < step.blinkCount; i++) {
    const holdDuration = i === step.blinkCount - 1 ? step.closedHold : 0
    frames.push(...generateSingleBlink(step.blinkSpeed, fps, holdDuration))
    
    // 最後の瞬きでなければ間隔を追加
    if (i < step.blinkCount - 1) {
      const intervalFrames = Math.round(step.blinkInterval * fps)
      for (let j = 0; j < intervalFrames; j++) {
        frames.push({ imageType: 'open', duration: 1000 / fps })
      }
    }
  }
  
  // 待機時間（開いた目）
  const pauseFrames = Math.round(step.pauseDuration * fps)
  for (let i = 0; i < pauseFrames; i++) {
    frames.push({ imageType: 'open', duration: 1000 / fps })
  }
  
  return frames
}

function generateSingleBlink(speed: number, fps: number, closedHoldSeconds = 0): Frame[] {
  const blinkFrames = Math.max(6, Math.round(speed * fps))

  // より自然な瞬きのために各段階のフレーム数を調整
  const halfFrames = Math.max(1, Math.floor(blinkFrames * 0.25))  // 25%を半開きに
  const closedFrames = Math.max(2, Math.floor(blinkFrames * 0.35)) // 35%を閉じた目に（最小2フレーム）
  const holdFrames = Math.max(0, Math.round(closedHoldSeconds * fps))

  const frames: Frame[] = []

  // 開 → 半開き
  for (let i = 0; i < halfFrames; i++) {
    frames.push({ imageType: 'half', duration: 1000 / fps })
  }

  // 半開き → 閉
  for (let i = 0; i < closedFrames; i++) {
    frames.push({ imageType: 'closed', duration: 1000 / fps })
  }

  // 閉じた状態を維持
  for (let i = 0; i < holdFrames; i++) {
    frames.push({ imageType: 'closed', duration: 1000 / fps })
  }

  // 閉 → 半開き
  for (let i = 0; i < halfFrames; i++) {
    frames.push({ imageType: 'half', duration: 1000 / fps })
  }

  // 半開き → 開
  frames.push({ imageType: 'open', duration: 1000 / fps })

  return frames
}

function calculateStepDuration(step: LoopStep): number {
  return (
    step.blinkSpeed * step.blinkCount +
    step.blinkInterval * (step.blinkCount - 1) +
    step.pauseDuration +
    step.closedHold
  )
}

const reduceFrameDensity = (frames: Frame[]): Frame[] => {
  if (frames.length <= 2) return frames
  const reduced: Frame[] = []
  for (let i = 0; i < frames.length; i += 2) {
    const first = frames[i]
    const second = frames[i + 1]
    if (second) {
      reduced.push({
        imageType: first.imageType,
        duration: first.duration + second.duration,
      })
    } else {
      reduced.push(first)
    }
  }
  return reduced
}


type Frame = {
  imageType: "open" | "half" | "closed"
  duration: number
}

type BlinkSettings = {
  fps: number
  animationLength: number
}




export function BlinkAnimationTool() {
  const [images, setImages] = useState<ImageState>({
    open: null,
    halfOpen: null,
    closed: null,
  })
  const [previewReady, setPreviewReady] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [compressionLevel, setCompressionLevel] = useState(5)
  const [imageQuality, setImageQuality] = useState(85)
  const [animationLength, setAnimationLength] = useState(10)
  const [useTwoImageMode, setUseTwoImageMode] = useState(false)
  const [fps, setFps] = useState(24)
  const defaultPreset = getPresetById(DEFAULT_PRESET_ID)
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    defaultPreset ? defaultPreset.id : CUSTOM_PRESET_ID
  )
  const [loopPattern, setLoopPattern] = useState<LoopPattern>(() => {
    if (defaultPreset) {
      return { steps: createLoopSteps(defaultPreset.steps) }
    }
    return {
      steps: [
        {
          id: crypto.randomUUID(),
          blinkCount: 1,
          blinkSpeed: 0.12,
          blinkInterval: 0.2,
          pauseDuration: 3.0,
          closedHold: 0,
        },
      ],
    }
  })
  const selectedPreset =
    selectedPresetId === CUSTOM_PRESET_ID ? undefined : getPresetById(selectedPresetId)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentFrameRef = useRef(0)
  const upngLoadedRef = useRef(false)
  const [estimatedSizeMB, setEstimatedSizeMB] = useState<number | null>(null)
  const [downloadedFileSizeMB, setDownloadedFileSizeMB] = useState<number | null>(null)
  const [showPostDownloadMessage, setShowPostDownloadMessage] = useState(false)

  const handlePresetSelect = (preset: EmotionPreset) => {
    setLoopPattern({ steps: createLoopSteps(preset.steps) })
    setSelectedPresetId(preset.id)
  }

  const addLoopStep = () => {
    setLoopPattern((prev) => ({
      steps: [
        ...prev.steps,
        {
          id: crypto.randomUUID(),
          blinkCount: 1,
          blinkSpeed: 0.12,
          blinkInterval: 0.2,
          pauseDuration: 3.0,
          closedHold: 0,
        },
      ],
    }))
    setSelectedPresetId(CUSTOM_PRESET_ID)
  }

  const removeLoopStep = (id: string) => {
    let removed = false
    setLoopPattern((prev) => {
      if (prev.steps.length <= 1) {
        return prev
      }
      const filtered = prev.steps.filter((step) => {
        if (step.id === id) {
          removed = true
          return false
        }
        return true
      })
      if (!removed) {
        return prev
      }
      return { steps: filtered }
    })
    if (removed) {
      setSelectedPresetId(CUSTOM_PRESET_ID)
    }
  }

  const updateLoopStep = (id: string, field: keyof Omit<LoopStep, "id">, value: number) => {
    let hasChanged = false
    setLoopPattern((prev) => {
      const updatedSteps = prev.steps.map((step) => {
        if (step.id === id && step[field] !== value) {
          hasChanged = true
          return { ...step, [field]: value }
        }
        return step
      })

      if (!hasChanged) {
        return prev
      }

      return { steps: updatedSteps }
    })
    if (hasChanged) {
      setSelectedPresetId(CUSTOM_PRESET_ID)
    }
  }

  // Load pako and UPNG.js scripts
  useEffect(() => {
    if (typeof window !== "undefined" && !window.UPNG && !upngLoadedRef.current) {
      upngLoadedRef.current = true

      // First load pako (dependency)
      const pakoScript = document.createElement("script")
      pakoScript.src = "/pako.min.js"
      pakoScript.async = true
      pakoScript.onload = () => {
        console.log("pako.js loaded successfully")

        // Then load UPNG.js
        const upngScript = document.createElement("script")
        upngScript.src = "/upng.js"
        upngScript.async = true
        upngScript.onload = () => {
          console.log("UPNG.js loaded successfully")
        }
        upngScript.onerror = () => {
          console.error("Failed to load UPNG.js")
          upngLoadedRef.current = false
        }
        document.body.appendChild(upngScript)
      }
      pakoScript.onerror = () => {
        console.error("Failed to load pako.js")
        upngLoadedRef.current = false
      }
      document.body.appendChild(pakoScript)

      return () => {
        // Cleanup scripts if component unmounts
        const scripts = document.querySelectorAll('script[src="/pako.min.js"], script[src="/upng.js"]')
        scripts.forEach(script => {
          if (script.parentNode) {
            script.parentNode.removeChild(script)
          }
        })
      }
    }
  }, [])

  useEffect(() => {
    if (useTwoImageMode && images.halfOpen) {
      setImages(prev => ({ ...prev, halfOpen: null }))
    }
  }, [useTwoImageMode, images.halfOpen])

  useEffect(() => {
    const hasRequiredImages = useTwoImageMode
      ? Boolean(images.open && images.closed)
      : Boolean(images.open && images.halfOpen && images.closed)

    if (hasRequiredImages) {
      setPreviewReady(true)
      setIsPlaying(true)
    } else {
      setPreviewReady(false)
      setIsPlaying(false)
    }
  }, [images, useTwoImageMode])

  // Canvas animation effect
  useEffect(() => {
    if (!previewReady || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const resolvedImages: Record<"open" | "halfOpen" | "closed", string | null> = {
      open: images.open,
      halfOpen: useTwoImageMode ? images.open : images.halfOpen,
      closed: images.closed,
    }

    const loadedImages: Record<string, HTMLImageElement> = {}
    const imageKeys: Array<"open" | "halfOpen" | "closed"> = ["open", "halfOpen", "closed"]
    const keysToLoad = imageKeys.filter((key) => resolvedImages[key])

    const loadImages = async () => {
      await Promise.all(
        keysToLoad.map(
          (key) =>
            new Promise<void>((resolve) => {
              const img = new Image()
              img.crossOrigin = "anonymous"
              img.onload = () => {
                loadedImages[key] = img
                resolve()
              }
              img.onerror = () => resolve()
              const src = resolvedImages[key]
              if (src) {
                img.src = src
              } else {
                resolve()
              }
            })
        )
      )
    }

    const drawImage = (imageKey: "open" | "half" | "closed") => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const actualKey = imageKey === "half" ? "halfOpen" : imageKey
      const img = loadedImages[actualKey]
      if (!img) return

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }

    let frameIndex = 0
    let frames: Frame[] = []
    let exportWidth = 0
    let exportHeight = 0

    const animate = () => {
      if (frameIndex >= frames.length) {
        frameIndex = 0
      }

      const frame = frames[frameIndex]
      drawImage(frame.imageType)
      frameIndex++

      timeoutRef.current = setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate)
      }, frame.duration)
    }

    loadImages().then(() => {
      const referenceImage =
        loadedImages.open || loadedImages.halfOpen || loadedImages.closed

      if (referenceImage) {
        exportWidth = referenceImage.width
        exportHeight = referenceImage.height

        const aspectRatio = referenceImage.width / referenceImage.height
        const maxPreviewWidth = 500
        const previewWidth = Math.min(referenceImage.width, maxPreviewWidth)
        const previewHeight = Math.max(1, Math.round(previewWidth / aspectRatio))

        canvas.width = previewWidth
        canvas.height = previewHeight
      }

      const settings: BlinkSettings = { fps, animationLength }
      frames = generateLoopPatternFrames(loopPattern, settings)

      if (frames.length > 0 && exportWidth > 0 && exportHeight > 0) {
        // より正確なAPNGファイルサイズの推定
        const pixelsPerFrame = exportWidth * exportHeight
        const totalPixels = pixelsPerFrame * frames.length

        // PNG圧縮率の推定（品質と圧縮レベルから）
        const qualityFactor = imageQuality / 100
        const compressionFactor = compressionLevel / 10

        // 典型的なPNG圧縮率: 20-50%（画像内容に依存）
        // 品質が高いほど、圧縮レベルが低いほどファイルサイズが大きい
        const pngCompressionRatio = 0.15 + (qualityFactor * 0.25) - (compressionFactor * 0.08)

        // RGBA 4バイト/ピクセル × 圧縮率
        const frameDataSize = totalPixels * 4 * pngCompressionRatio

        // APNGのオーバーヘッド（ヘッダー + 各フレームのメタデータ）
        const overhead = 2048 + (frames.length * 150)

        const estimatedBytes = frameDataSize + overhead
        const estimatedMB = estimatedBytes / (1024 * 1024)
        setEstimatedSizeMB(Number.isFinite(estimatedMB) ? estimatedMB : null)
      } else {
        setEstimatedSizeMB(null)
      }

      if (!isPlaying && frames.length > 0) {
        drawImage(frames[0].imageType)
        return
      }

      if (isPlaying) {
        animate()
      }
    })

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [
    previewReady,
    isPlaying,
    images,
    loopPattern,
    animationLength,
    useTwoImageMode,
    fps,
    compressionLevel,
    imageQuality,
  ])

  const exportAsAPNG = async () => {
    if (!canvasRef.current) {
      throw new Error("Canvas not ready")
    }

    console.log("Starting APNG export...")
    setExportProgress(5)

    // 処理開始直後にrequestAnimationFrameで2フレーム待つ
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    try {
      if (!window.UPNG) {
        throw new Error("UPNG.js is not loaded. Please refresh the page and try again.")
      }

      console.log("UPNG.js is ready")
      setExportProgress(10)

      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true })
      if (!tempCtx) throw new Error("Failed to get canvas context")

      const loadedImages: Record<string, HTMLImageElement> = {}
      const resolvedImages: Record<"open" | "halfOpen" | "closed", string | null> = {
        open: images.open,
        halfOpen: useTwoImageMode ? images.closed : images.halfOpen,
        closed: images.closed,
      }
      const imageKeys: Array<"open" | "halfOpen" | "closed"> = ["open", "halfOpen", "closed"]
      const keysToLoad = imageKeys.filter((key) => resolvedImages[key])

      await Promise.all(
        keysToLoad.map(
          (key) =>
            new Promise<void>((resolve) => {
              const img = new Image()
              img.crossOrigin = "anonymous"
              img.onload = () => {
                loadedImages[key] = img
                resolve()
              }
              img.onerror = () => resolve()
              const src = resolvedImages[key]
              if (src) {
                img.src = src
              } else {
                resolve()
              }
            })
        )
      )

      // メインスレッドを開放
      await new Promise(resolve => setTimeout(resolve, 10))

      console.log("Images loaded for export")
      setExportProgress(20)

      const referenceImage =
        loadedImages.open || loadedImages.halfOpen || loadedImages.closed
      if (!referenceImage) {
        throw new Error("参照画像が読み込めませんでした。")
      }

      tempCanvas.width = referenceImage.width
      tempCanvas.height = referenceImage.height

      console.log(`Canvas size: ${tempCanvas.width}x${tempCanvas.height}`)

      const settings: BlinkSettings = { fps, animationLength }
      let frames = generateLoopPatternFrames(loopPattern, settings)

      // メモリ使用量の推定とフレーム数の制限
      const pixelsPerFrame = tempCanvas.width * tempCanvas.height
      const bytesPerFrame = pixelsPerFrame * 4 // RGBA
      const maxMemoryMB = 800 // 最大メモリ使用量（MB）
      const maxFrames = Math.floor((maxMemoryMB * 1024 * 1024) / bytesPerFrame)

      console.log(`Initial frames: ${frames.length}, Max safe frames: ${maxFrames}`)

      // フレーム数が多すぎる場合は積極的に削減
      while (frames.length > maxFrames && frames.length > 10) {
        frames = reduceFrameDensity(frames)
        console.log(`Reduced frames to: ${frames.length}`)
      }

      // それでもフレーム数が多すぎる場合はエラー
      if (frames.length > maxFrames) {
        throw new Error(
          `画像サイズが大きすぎるため生成できません。\n` +
          `推奨：画像サイズを縮小するか、アニメーション長さを ${Math.floor(animationLength / 2)} 秒以下に設定してください。\n` +
          `現在：${tempCanvas.width}×${tempCanvas.height}px、${frames.length}フレーム`
        )
      }

      const currentColorCount = computeColorCount(imageQuality, compressionLevel)

      const getImageForFrame = (type: Frame["imageType"]) => {
        if (type === "half") {
          return loadedImages.halfOpen || loadedImages.open || loadedImages.closed || null
        }
        if (type === "open") {
          return loadedImages.open || loadedImages.halfOpen || loadedImages.closed || null
        }
        return loadedImages.closed || loadedImages.open || loadedImages.halfOpen || null
      }

      // フレームバッファと遅延配列を準備（メインスレッドで実行）
      console.log("Preparing frame buffers...")
      setExportProgress(30)

      const delays: number[] = []
      const buffers: ArrayBuffer[] = []
      let lastYieldTime = performance.now()

      for (let index = 0; index < frames.length; index++) {
        const frame = frames[index]
        const img = getImageForFrame(frame.imageType)
        if (!img) continue

        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)

        // バッファのコピーを作成（Transferable objects用）
        buffers.push(imageData.data.buffer.slice(0))
        delays.push(Math.max(1, Math.round(frame.duration)))

        setExportProgress(30 + (index / frames.length) * 25)

        const currentTime = performance.now()
        const elapsedTime = currentTime - lastYieldTime

        // 3フレームごと、または30ms以上経過したらメインスレッドを開放
        if (index % 3 === 0 || elapsedTime > 30) {
          await new Promise(resolve => setTimeout(resolve, 10))
          lastYieldTime = performance.now()
        }
      }

      if (!buffers.length) {
        throw new Error("フレームの描画に失敗しました。")
      }

      console.log(`Frame buffers prepared: ${buffers.length} frames`)
      setExportProgress(55)

      // Web Worker を使用してエンコード
      let result
      const useWorker = isWorkerSupported()

      if (useWorker) {
        console.log("Using Web Worker for encoding...")
        try {
          result = await encodeAPNGWithWorker({
            buffers,
            width: tempCanvas.width,
            height: tempCanvas.height,
            delays,
            initialColorCount: currentColorCount,
            targetSizeMB: SIZE_WARNING_THRESHOLD_MB,
            maxAttempts: 8,
            onProgress: (progress, message) => {
              setExportProgress(progress)
              if (message) {
                console.log(`[Worker] ${message}`)
              }
            },
          })
        } catch (error) {
          console.error("Worker encoding failed:", error)
          throw error
        }
      } else {
        // Web Worker がサポートされていない場合のフォールバック
        console.log("Web Worker not supported, using main thread encoding...")
        if (!window.UPNG) {
          throw new Error("UPNG.js is not loaded")
        }

        setExportProgress(60)
        const encoded = window.UPNG.encode(buffers, tempCanvas.width, tempCanvas.height, currentColorCount, delays)
        result = {
          buffer: encoded,
          sizeMB: encoded.byteLength / (1024 * 1024),
          attempts: 1,
          finalColorCount: currentColorCount,
        }
        setExportProgress(90)
      }

      const bestBuffer = result.buffer
      const bestSizeMB = result.sizeMB

      console.log(`Encoding completed: ${bestSizeMB.toFixed(2)}MB in ${result.attempts} attempts`)
      setEstimatedSizeMB(bestSizeMB)
      setExportProgress(95)

      // ダウンロード前にメインスレッドを開放
      await new Promise(resolve => setTimeout(resolve, 10))

      const blob = new Blob([bestBuffer], { type: "image/png" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "blink-animation.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportProgress(100)
      console.log("Export completed successfully!")

      // 5MB以上の場合のみメッセージを表示
      if (bestSizeMB > SIZE_WARNING_THRESHOLD_MB) {
        setDownloadedFileSizeMB(bestSizeMB)
        setShowPostDownloadMessage(true)
      }
    } catch (error) {
      console.error("Export error:", error)
      throw error
    }
  }

  const handleImageUpload = (type: ImageType, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImages(prev => ({
        ...prev,
        [type]: e.target?.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent, type: ImageType) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(type, file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const renderImageUpload = (
    type: ImageType,
    label: string,
    icon: React.ReactNode,
    disabled = false
  ) => {
    const image = images[type]

    return (
      <div className="flex-1">
        <Label className="text-sm font-medium mb-2 block">{label}</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            image ? "border-gray-300 bg-gray-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          onDrop={disabled ? undefined : (e) => handleDrop(e, type)}
          onDragOver={disabled ? undefined : handleDragOver}
          onClick={() => {
            if (disabled) return
            const input = document.createElement("input")
            input.type = "file"
            input.accept = "image/*"
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) {
                handleImageUpload(type, file)
              }
            }
            input.click()
          }}
        >
          {disabled ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-center text-gray-300">{icon}</div>
              <p>2枚モードでは不要です</p>
            </div>
          ) : image ? (
            <div className="space-y-2">
              <img src={image} alt={label} className="w-full h-32 object-contain mx-auto" />
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation()
                setImages(prev => ({ ...prev, [type]: null }))
              }}>
                変更
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center text-gray-400">{icon}</div>
              <div className="text-sm text-gray-600">
                クリックまたはドラッグ&ドロップ
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 画像アップロードセクション */}
      <div className="space-y-2">
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 px-[100px]">
                <HelpCircle className="w-4 h-4" />
                使い方
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ツールの使い方</DialogTitle>
                <DialogDescription>
                  3枚の画像から自然な瞬きアニメーション（APNG形式）を作成できます
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="space-y-2.5">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-medium text-gray-900">画像をアップロード</p>
                      <p className="text-xs mt-0.5">開いた目・半開き・閉じた目の3枚（または開いた目・閉じた目の2枚）</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-medium text-gray-900">感情プリセットを選択</p>
                      <p className="text-xs mt-0.5">平常・眠気・驚きなど12種類から選択、または詳細設定でカスタマイズ</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-medium text-gray-900">ダウンロード</p>
                      <p className="text-xs mt-0.5">プレビューで確認後、ボタンを押してダウンロード</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 mt-4">
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors list-none flex items-center gap-2">
                      <span className="text-blue-500">💡</span>
                      <span>ファイルサイズが5MBを超える場合</span>
                      <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-2 text-xs space-y-1.5 pl-6">
                      <p>ココフォリア等のTRPGツールでは、アップロードできる画像サイズに制限があります。</p>
                      <p className="font-medium text-gray-900">対処法：</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>アップロードする画像サイズを圧縮する</li>
                        <li>「詳細設定」でアニメーション長さを短くする</li>
                        <li>フレームレートを下げる（24fps→12fps等）</li>
                        <li>画質を下げる（85→70等）</li>
                        <li>作成されたAPNGを圧縮する</li>
                        <li>
                          <a
                            href="https://minify.ccfolia.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            ココフォリアの圧縮ツール
                          </a>
                          を使用する
                        </li>
                      </ul>
                    </div>
                  </details>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Link
                    href="/manual"
                    target="_blank"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                  >
                    📖 さらに詳しい使い方マニュアルはこちら
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>1. 画像をアップロード</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-gray-600">
                  3枚の画像（開いた目、半開き、閉じた目）をアップロードしてください
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Sample button clicked");
                    const confirmed = confirm(
                      "サンプル画像（バストアップ版・3枚セット）をダウンロードします\n\n" +
                      "【内容】\n" +
                      "・開いた目の画像\n" +
                      "・半開きの画像\n" +
                      "・閉じた目の画像\n" +
                      "・README.txt\n\n" +
                      "ZIP形式でダウンロードされます。\n" +
                      "ダウンロードしますか？"
                    );
                    console.log("Confirm result:", confirmed);
                    if (confirmed) {
                      console.log("Starting download...");
                      const link = document.createElement('a');
                      link.href = '/samples/sample-images-bust.zip';
                      link.download = 'sample-images-bust.zip';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      console.log("Download triggered");
                    }
                  }}
                  className="text-xs bg-blue-50 text-blue-700 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer hover:shadow-sm"
                  type="button"
                >
                  💡 動作チェック用のサンプル画像
                </button>
              </div>
            </CardDescription>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderImageUpload("open", "開いた目",
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
                <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z" strokeWidth="2" />
              </svg>
            )}
            {renderImageUpload("halfOpen", "半開き",
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 10.5Q12 8.5 21 10.5" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 13.5Q12 15.5 21 13.5" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
              </svg>,
              useTwoImageMode
            )}
            {renderImageUpload("closed", "閉じた目",
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M2 12s3 3 10 3 10-3 10-3" strokeWidth="2" />
              </svg>
            )}
          </div>
          <div className="mt-3 px-1">
            <p className="text-xs text-gray-500">
              💡 推奨：縦横2000px以下、各画像5MB以下｜生成されるAPNGは設定により変動します（目安：1〜10MB）
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-dashed border-gray-300 space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="two-image-mode"
                checked={useTwoImageMode}
                onCheckedChange={(checked) => {
                  const value = checked === true
                  setUseTwoImageMode(value)
                }}
              />
              <Label htmlFor="two-image-mode" className="text-sm">
                2枚で生成する（開いた目と閉じた目のみを使用）
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              半開き画像がない場合でも自然な瞬きを生成します。
            </p>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* 設定とプレビューセクション（横並び） */}
      {previewReady && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: プレビュー */}
          <Card>
            <CardHeader>
              <CardTitle>プレビュー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border-2 border-gray-300 rounded-lg max-w-full"
                  style={{ maxWidth: "500px", height: "300px" }}
                />
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => {
                    if (isPlaying) {
                      setIsPlaying(false)
                      if (animationRef.current) {
                        cancelAnimationFrame(animationRef.current)
                      }
                      if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current)
                      }
                    } else {
                      setIsPlaying(true)
                      currentFrameRef.current = 0
                    }
                  }}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      停止
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      再生
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">3. アニメーションPNGをダウンロード</h4>
                    <p className="text-xs text-muted-foreground">
                      設定した瞬きパターンをAPNG形式で書き出します。
                    </p>
                  </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>圧縮レベル</Label>
                      <span className="text-sm text-gray-500">{compressionLevel}</span>
                    </div>
                    <Slider
                      value={[compressionLevel]}
                      onValueChange={([value]) => setCompressionLevel(value)}
                      min={1}
                      max={10}
                      step={1}
                      disabled={isExporting}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>画像品質</Label>
                      <span className="text-sm text-gray-500">{imageQuality}%</span>
                    </div>
                    <Slider
                      value={[imageQuality]}
                      onValueChange={([value]) => setImageQuality(value)}
                      min={30}
                      max={100}
                      step={5}
                      disabled={isExporting}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={isExporting || !previewReady}
                  onClick={async () => {
                    setIsExporting(true)
                    setExportProgress(0)

                    try {
                      await exportAsAPNG()
                    } catch (error) {
                      console.error("Export error:", error)
                      alert(`ダウンロード中にエラーが発生しました: ${error}`)
                    } finally {
                      setIsExporting(false)
                      setExportProgress(0)
                    }
                  }}
                >
                  {isExporting ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </div>
                      <div className="text-xs">
                        10秒〜1分程度お待ちください
                      </div>
                    </div>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      ダウンロード
                    </>
                  )}
                </Button>

                {showPostDownloadMessage && downloadedFileSizeMB !== null && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2 text-sm">
                        <p className="font-semibold text-amber-900">
                          ℹ️ ファイルサイズが {downloadedFileSizeMB.toFixed(2)} MB です
                        </p>
                        <p className="text-xs text-amber-800">
                          ココフォリア等のツールでは5MB以上のファイルが動作しない場合があります。
                        </p>
                        <div className="pt-1">
                          <a
                            href="https://minify.ccfolia.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-900 hover:text-amber-950 underline font-semibold inline-flex items-center gap-1 text-xs"
                          >
                            ココフォリアの圧縮ツールで圧縮する
                            <span>↗</span>
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPostDownloadMessage(false)}
                        className="text-amber-700 hover:text-amber-900 transition-colors"
                        aria-label="メッセージを閉じる"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 右側: アニメーション設定 */}
          <Card>
            <CardHeader>
              <CardTitle>2. アニメーション設定</CardTitle>
              <CardDescription>感情プリセットまたはカスタム設定を選択</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">感情プリセット</Label>
                  <p className="text-xs text-muted-foreground">
                    {selectedPresetId === CUSTOM_PRESET_ID
                      ? "プリセットを基に編集したカスタム設定です。"
                      : selectedPreset
                      ? `${selectedPreset.emoji} ${selectedPreset.name}（${selectedPreset.description}）を適用中`
                      : "プリセットを選択してください。"}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {EMOTION_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id
                    return (
                      <Button
                        key={preset.id}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handlePresetSelect(preset)}
                        className="h-auto py-2 flex flex-col items-center text-center transition-transform hover:-translate-y-0.5 gap-1.5"
                      >
                        <span className="text-base">{preset.emoji}</span>
                        <span className="text-sm font-medium leading-tight">{preset.name}</span>
                        <span className="text-xs text-muted-foreground leading-tight">
                          {preset.description}
                        </span>
                      </Button>
                    )
                  })}
                </div>

                {selectedPresetId === CUSTOM_PRESET_ID && (
                  <p className="text-xs text-blue-600">
                    カスタム設定を編集中です。プリセットに戻す場合は上のボタンから再選択してください。
                  </p>
                )}
              </div>


              {/* 詳細設定（カスタム時のみ） */}
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    詳細設定
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 mt-4">
                                    <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>アニメーションの長さ: {animationLength}秒</Label>
                      <Slider
                        value={[animationLength]}
                        onValueChange={(v) => setAnimationLength(v[0])}
                        min={1}
                        max={60}
                        step={1}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>フレームレート: {fps}fps</Label>
                      <Slider
                        value={[fps]}
                        onValueChange={(v) => setFps(v[0])}
                        min={10}
                        max={30}
                        step={1}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">ループパターン設定</Label>
                      <Button size="sm" variant="outline" onClick={addLoopStep}>
                        <Plus className="h-4 w-4 mr-1" />
                        ループ追加
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      設定したループパターンが、アニメーション長さ分繰り返されます。
                    </div>

                    {loopPattern.steps.map((step, index) => (
                      <Card key={step.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">ループ {index + 1}</h4>
                          {loopPattern.steps.length > 1 && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removeLoopStep(step.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* 瞬き回数 */}
                          <div>
                            <Label>瞬き回数: {step.blinkCount}回</Label>
                            <Slider
                              value={[step.blinkCount]}
                              onValueChange={(v) => updateLoopStep(step.id, 'blinkCount', v[0])}
                              min={1}
                              max={10}
                              step={1}
                            />
                          </div>

                          {/* 瞬き速度 */}
                          <div>
                            <Label>瞬き速度: {step.blinkSpeed.toFixed(2)}秒</Label>
                            <Slider
                              value={[step.blinkSpeed]}
                              onValueChange={(v) => updateLoopStep(step.id, 'blinkSpeed', v[0])}
                              min={0.05}
                              max={0.7}
                              step={0.01}
                            />
                          </div>

                          {/* 連続瞬きの間隔（2回以上の場合のみ表示） */}
                          {step.blinkCount > 1 && (
                            <div>
                              <Label>瞬き間隔: {step.blinkInterval.toFixed(2)}秒</Label>
                              <Slider
                                value={[step.blinkInterval]}
                                onValueChange={(v) => updateLoopStep(step.id, 'blinkInterval', v[0])}
                                min={0.05}
                                max={1.0}
                                step={0.05}
                              />
                            </div>
                          )}

                          {/* 閉じた状態の維持時間 */}
                          <div>
                            <Label>閉じた状態の維持: {step.closedHold.toFixed(2)}秒</Label>
                            <Slider
                              value={[step.closedHold]}
                              onValueChange={(v) => updateLoopStep(step.id, 'closedHold', v[0])}
                              min={0}
                              max={2}
                              step={0.05}
                            />
                          </div>

                          {/* 待機時間 */}
                          <div>
                            <Label>待機時間: {step.pauseDuration.toFixed(1)}秒</Label>
                            <Slider
                              value={[step.pauseDuration]}
                              onValueChange={(v) => updateLoopStep(step.id, 'pauseDuration', v[0])}
                              min={0.1}
                              max={30}
                              step={0.1}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
          </div>
        </>
      )}
    </div>
  )
}
