"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Play, Pause, Info, ChevronDown } from "lucide-react"

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

type BlinkPattern = {
  name: string
  description: string
  sequence: Array<"open" | "halfOpen" | "closed">
  timingRatio: number[]
}

type EmotionPreset = {
  name: string
  description: string
  blinkSpeed: number
  blinkDuration: number
  blinkPattern: string
  randomness: number
}

type LoopMode = "once" | "infinite" | "count"
type ExportFormat = "apng" | "webp" | "gif"

const blinkPatterns: Record<string, BlinkPattern> = {
  regular: {
    name: "通常",
    description: "標準的なまばたきパターン",
    sequence: ["open", "halfOpen", "closed", "halfOpen", "open"],
    timingRatio: [1, 0.3, 0.2, 0.3, 1],
  },
  double: {
    name: "二重",
    description: "連続2回のまばたき",
    sequence: ["open", "halfOpen", "closed", "halfOpen", "open", "halfOpen", "closed", "halfOpen", "open"],
    timingRatio: [1, 0.3, 0.2, 0.3, 0.5, 0.3, 0.2, 0.3, 1],
  },
  sleepy: {
    name: "眠そう",
    description: "ゆっくり閉じて少し閉じたまま",
    sequence: ["open", "halfOpen", "closed", "closed", "halfOpen", "open"],
    timingRatio: [1, 0.5, 0.3, 0.8, 0.5, 1],
  },
  surprised: {
    name: "驚き",
    description: "素早い連続まばたき",
    sequence: ["open", "closed", "open", "closed", "open"],
    timingRatio: [0.5, 0.2, 0.3, 0.2, 0.5],
  },
  slow: {
    name: "ゆっくり",
    description: "ゆっくりとしたまばたき",
    sequence: ["open", "halfOpen", "closed", "halfOpen", "open"],
    timingRatio: [1.5, 0.8, 0.5, 0.8, 1.5],
  },
  quick: {
    name: "素早い",
    description: "素早いまばたき",
    sequence: ["open", "closed", "open"],
    timingRatio: [0.5, 0.15, 0.5],
  },
}

const emotionPresets: Record<string, EmotionPreset> = {
  normal: {
    name: "通常",
    description: "普通の状態のまばたき",
    blinkSpeed: 3000,
    blinkDuration: 300,
    blinkPattern: "regular",
    randomness: 20,
  },
  sleepy: {
    name: "眠い",
    description: "眠そうなまばたき",
    blinkSpeed: 2000,
    blinkDuration: 600,
    blinkPattern: "sleepy",
    randomness: 30,
  },
  surprised: {
    name: "驚き",
    description: "驚いた時のまばたき",
    blinkSpeed: 500,
    blinkDuration: 200,
    blinkPattern: "surprised",
    randomness: 10,
  },
  focused: {
    name: "集中",
    description: "集中している時のまばたき",
    blinkSpeed: 5000,
    blinkDuration: 250,
    blinkPattern: "regular",
    randomness: 15,
  },
  nervous: {
    name: "緊張",
    description: "緊張している時のまばたき",
    blinkSpeed: 1500,
    blinkDuration: 250,
    blinkPattern: "double",
    randomness: 40,
  },
  relaxed: {
    name: "リラックス",
    description: "リラックスしている時のまばたき",
    blinkSpeed: 4000,
    blinkDuration: 400,
    blinkPattern: "slow",
    randomness: 25,
  },
}

export function BlinkAnimationTool() {
  const [images, setImages] = useState<ImageState>({
    open: null,
    halfOpen: null,
    closed: null,
  })
  const [previewReady, setPreviewReady] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState<string>("normal")
  const [useCustomSettings, setUseCustomSettings] = useState(false)
  const [blinkSpeed, setBlinkSpeed] = useState(3000)
  const [blinkDuration, setBlinkDuration] = useState(300)
  const [selectedPattern, setSelectedPattern] = useState("regular")
  const [randomnessEnabled, setRandomnessEnabled] = useState(true)
  const [randomness, setRandomness] = useState(20)
  const [loopMode, setLoopMode] = useState<LoopMode>("infinite")
  const [maxLoops, setMaxLoops] = useState(3)
  const [isPlaying, setIsPlaying] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("apng")
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [compressionLevel, setCompressionLevel] = useState(5)
  const [imageQuality, setImageQuality] = useState(85)
  const [showDescription, setShowDescription] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentFrameRef = useRef(0)
  const loopCountRef = useRef(0)
  const upngLoadedRef = useRef(false)

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
    if (images.open && images.halfOpen && images.closed) {
      setPreviewReady(true)
    } else {
      setPreviewReady(false)
    }
  }, [images])

  useEffect(() => {
    if (!useCustomSettings && selectedEmotion) {
      const preset = emotionPresets[selectedEmotion]
      setBlinkSpeed(preset.blinkSpeed)
      setBlinkDuration(preset.blinkDuration)
      setSelectedPattern(preset.blinkPattern)
      setRandomness(preset.randomness)
    }
  }, [selectedEmotion, useCustomSettings])

  // Canvas animation effect
  useEffect(() => {
    if (!previewReady || !isPlaying || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Load images
    const loadedImages: Record<string, HTMLImageElement> = {}
    const imageKeys: Array<"open" | "halfOpen" | "closed"> = ["open", "halfOpen", "closed"]

    const loadImages = async () => {
      await Promise.all(
        imageKeys.map(
          (key) =>
            new Promise<void>((resolve) => {
              const img = new Image()
              img.crossOrigin = "anonymous"
              img.onload = () => {
                loadedImages[key] = img
                resolve()
              }
              img.onerror = () => resolve()
              img.src = images[key]!
            })
        )
      )
    }

    let animationStartTime = Date.now()
    let lastBlinkTime = Date.now()
    let currentBlinkIndex = 0
    let isBlinking = false
    let blinkStartTime = 0

    const pattern = blinkPatterns[selectedPattern]

    const drawImage = (imageKey: "open" | "halfOpen" | "closed") => {
      const img = loadedImages[imageKey]
      if (!img) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate aspect ratio
      const canvasAspect = canvas.width / canvas.height
      const imgAspect = img.width / img.height

      let drawWidth, drawHeight, drawX, drawY

      if (imgAspect > canvasAspect) {
        drawWidth = canvas.width
        drawHeight = canvas.width / imgAspect
        drawX = 0
        drawY = (canvas.height - drawHeight) / 2
      } else {
        drawHeight = canvas.height
        drawWidth = canvas.height * imgAspect
        drawX = (canvas.width - drawWidth) / 2
        drawY = 0
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    }

    const animate = () => {
      const now = Date.now()

      if (!isBlinking) {
        // Check if it's time to blink
        const timeSinceLastBlink = now - lastBlinkTime
        let effectiveBlinkSpeed = blinkSpeed

        // Apply randomness
        if (randomnessEnabled) {
          const randomFactor = 1 + ((Math.random() - 0.5) * 2 * randomness) / 100
          effectiveBlinkSpeed *= randomFactor
        }

        if (timeSinceLastBlink >= effectiveBlinkSpeed) {
          // Check if we've reached max loops
          if (loopMode === "count" && loopCountRef.current >= maxLoops) {
            setIsPlaying(false)
            drawImage("open")
            return
          }

          // Start blinking
          isBlinking = true
          blinkStartTime = now
          currentBlinkIndex = 0
          lastBlinkTime = now

          if (loopMode === "count") {
            loopCountRef.current++
          }
        } else {
          drawImage("open")
        }
      }

      if (isBlinking) {
        const blinkElapsed = now - blinkStartTime
        const totalBlinkDuration = pattern.timingRatio.reduce((sum, ratio) => sum + ratio, 0)
        const normalizedTime = blinkElapsed / blinkDuration

        // Find current frame
        let accumulatedRatio = 0
        let frameIndex = 0

        for (let i = 0; i < pattern.timingRatio.length; i++) {
          accumulatedRatio += pattern.timingRatio[i] / totalBlinkDuration
          if (normalizedTime <= accumulatedRatio) {
            frameIndex = i
            break
          }
        }

        if (frameIndex >= pattern.sequence.length || normalizedTime >= 1) {
          // Blink finished
          isBlinking = false
          drawImage("open")
        } else {
          const imageKey = pattern.sequence[frameIndex]
          drawImage(imageKey)
        }
      }

      if (loopMode === "once" && loopCountRef.current >= 1) {
        setIsPlaying(false)
        return
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    loadImages().then(() => {
      // Set canvas size based on first image
      if (loadedImages.open) {
        const img = loadedImages.open
        const maxWidth = 500
        const maxHeight = 300
        const aspectRatio = img.width / img.height

        if (img.width > maxWidth || img.height > maxHeight) {
          if (aspectRatio > maxWidth / maxHeight) {
            canvas.width = maxWidth
            canvas.height = maxWidth / aspectRatio
          } else {
            canvas.height = maxHeight
            canvas.width = maxHeight * aspectRatio
          }
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }
      }

      animate()
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
    selectedPattern,
    blinkSpeed,
    blinkDuration,
    randomnessEnabled,
    randomness,
    loopMode,
    maxLoops,
  ])

  const exportAsAPNG = async () => {
    if (!canvasRef.current) {
      throw new Error("Canvas not ready")
    }

    console.log("Starting APNG export...")
    setExportProgress(5)

    try {
      // Check if UPNG is loaded
      if (!window.UPNG) {
        throw new Error("UPNG.js is not loaded. Please refresh the page and try again.")
      }

      console.log("UPNG.js is ready")
      setExportProgress(10)

      // Create temporary canvas for frame capture
      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) throw new Error("Failed to get canvas context")

      // Load images
      const loadedImages: Record<string, HTMLImageElement> = {}
      const imageKeys: Array<"open" | "halfOpen" | "closed"> = ["open", "halfOpen", "closed"]

      await Promise.all(
        imageKeys.map(
          (key) =>
            new Promise<void>((resolve) => {
              const img = new Image()
              img.crossOrigin = "anonymous"
              img.onload = () => {
                loadedImages[key] = img
                resolve()
              }
              img.onerror = () => resolve()
              img.src = images[key]!
            })
        )
      )

      console.log("Images loaded for export")
      setExportProgress(20)

      // Set canvas size
      const firstImg = loadedImages.open
      if (!firstImg) throw new Error("First image not loaded")

      tempCanvas.width = firstImg.width
      tempCanvas.height = firstImg.height

      console.log(`Canvas size: ${tempCanvas.width}x${tempCanvas.height}`)

      // Capture frames
      const pattern = blinkPatterns[selectedPattern]
      const frames: Blob[] = []
      const delays: number[] = []

      const totalBlinkDuration = pattern.timingRatio.reduce((sum, ratio) => sum + ratio, 0)

      for (let i = 0; i < pattern.sequence.length; i++) {
        const imageKey = pattern.sequence[i]
        const img = loadedImages[imageKey]

        if (img) {
          // Clear and draw
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)

          // Convert to blob
          const blob = await new Promise<Blob>((resolve, reject) => {
            tempCanvas.toBlob(
              (blob) => {
                if (blob) resolve(blob)
                else reject(new Error("Failed to create blob"))
              },
              "image/png",
              imageQuality / 100
            )
          })

          frames.push(blob)

          // Calculate delay for this frame
          const frameDelay = Math.round((pattern.timingRatio[i] / totalBlinkDuration) * blinkDuration)
          delays.push(frameDelay)

          setExportProgress(20 + (i / pattern.sequence.length) * 60)
        }
      }

      console.log(`Captured ${frames.length} frames`)
      console.log("Delays:", delays)

      // Add inter-blink delay (open eye state)
      const openImg = loadedImages.open
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
      tempCtx.drawImage(openImg, 0, 0, tempCanvas.width, tempCanvas.height)

      const openBlob = await new Promise<Blob>((resolve, reject) => {
        tempCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Failed to create blob"))
          },
          "image/png",
          imageQuality / 100
        )
      })

      frames.push(openBlob)
      delays.push(blinkSpeed)

      setExportProgress(80)

      // Convert blobs to ImageData
      const imageDataArray: ImageData[] = []

      for (const blob of frames) {
        const img = new Image()
        const url = URL.createObjectURL(blob)
        img.src = url

        await new Promise((resolve) => {
          img.onload = resolve
        })

        const canvas = document.createElement("canvas")
        canvas.width = tempCanvas.width
        canvas.height = tempCanvas.height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        imageDataArray.push(imageData)

        URL.revokeObjectURL(url)
      }

      console.log(`Prepared ${imageDataArray.length} ImageData objects`)
      setExportProgress(85)

      // APNG encoding using UPNG.encode
      console.log("Attempting UPNG.encode...")

      const buffers = imageDataArray.map((imageData) => imageData.data.buffer)

      console.log(`Encoding ${buffers.length} frames...`)
      console.log(`Frame size: ${tempCanvas.width}x${tempCanvas.height}`)
      console.log(`Delays:`, delays)

      const apngBuffer = window.UPNG.encode(buffers, tempCanvas.width, tempCanvas.height, 0, delays)

      if (!apngBuffer) {
        throw new Error("APNG generation failed - no buffer returned")
      }

      console.log(`APNG generated successfully: ${apngBuffer.byteLength} bytes`)

      // Validate file size
      const fileSizeKB = apngBuffer.byteLength / 1024
      console.log(`Final file size: ${fileSizeKB.toFixed(2)} KB`)

      if (fileSizeKB < 1) {
        console.warn("Warning: File size is suspiciously small")
      }

      setExportProgress(95)

      // Download
      const blob = new Blob([apngBuffer], { type: "image/png" })
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

      alert(`エクスポートが完了しました！\nファイルサイズ: ${fileSizeKB.toFixed(2)} KB`)
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

  const renderImageUpload = (type: ImageType, label: string, icon: React.ReactNode) => {
    const image = images[type]

    return (
      <div className="flex-1">
        <Label className="text-sm font-medium mb-2 block">{label}</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            image ? "border-gray-300 bg-gray-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          }`}
          onDrop={(e) => handleDrop(e, type)}
          onDragOver={handleDragOver}
          onClick={() => {
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
          {image ? (
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
    <div className="space-y-6">
      {/* ツール説明セクション */}
      <Collapsible open={showDescription} onOpenChange={setShowDescription}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  <CardTitle>ツールの使い方</CardTitle>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${showDescription ? "rotate-180" : ""}`} />
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <p>
                  このツールは、3枚の画像（開いた目、半開き、閉じた目）から自然な瞬きアニメーションを生成します。
                </p>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">主な機能:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>6種類の感情プリセット（通常、眠い、驚き、集中、緊張、リラックス）</li>
                    <li>6種類のまばたきパターン（通常、二重、眠そう、驚き、ゆっくり、素早い）</li>
                    <li>ループ再生機能（1回、無限、指定回数）</li>
                    <li>ランダム性設定で自然なまばたきを再現</li>
                    <li>APNG、WebP、GIF形式でエクスポート</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 画像アップロードセクション */}
      <Card>
        <CardHeader>
          <CardTitle>1. 画像をアップロード</CardTitle>
          <CardDescription>3枚の画像（開いた目、半開き、閉じた目）をアップロードしてください</CardDescription>
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
                <path d="M12 14c-1.5 0-2.5-1-2.5-2s1-2 2.5-2 2.5 1 2.5 2-1 2-2.5 2z" strokeWidth="2" />
                <path d="M2 12s3 5 10 5 10-5 10-5" strokeWidth="2" />
              </svg>
            )}
            {renderImageUpload("closed", "閉じた目",
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M2 12s3 3 10 3 10-3 10-3" strokeWidth="2" />
              </svg>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 設定セクション */}
      {previewReady && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2. アニメーション設定</CardTitle>
              <CardDescription>感情プリセットまたはカスタム設定を選択</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 感情プリセット */}
              <div className="space-y-3">
                <Label>感情プリセット</Label>
                <Select value={selectedEmotion} onValueChange={setSelectedEmotion} disabled={useCustomSettings}>
                  <SelectTrigger>
                    <SelectValue placeholder="プリセットを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(emotionPresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.name} - {preset.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* カスタム設定スイッチ */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom-settings"
                  checked={useCustomSettings}
                  onCheckedChange={(checked) => setUseCustomSettings(checked as boolean)}
                />
                <Label htmlFor="custom-settings" className="cursor-pointer">
                  カスタム設定を使用
                </Label>
              </div>

              {/* 詳細設定（カスタム時のみ） */}
              {useCustomSettings && (
                <Collapsible defaultOpen>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      詳細設定
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 左カラム */}
                      <div className="space-y-4">
                        {/* まばたきパターン */}
                        <div className="space-y-2">
                          <Label>まばたきパターン</Label>
                          <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(blinkPatterns).map(([key, pattern]) => (
                                <SelectItem key={key} value={key}>
                                  {pattern.name} - {pattern.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* まばたき間隔 */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>まばたき間隔</Label>
                            <span className="text-sm text-gray-500">{blinkSpeed}ms</span>
                          </div>
                          <Slider
                            value={[blinkSpeed]}
                            onValueChange={([value]) => setBlinkSpeed(value)}
                            min={500}
                            max={5000}
                            step={100}
                          />
                          <p className="text-xs text-gray-500">まばたきの間隔（500-5000ms）</p>
                        </div>

                        {/* まばたき速度 */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>まばたき速度</Label>
                            <span className="text-sm text-gray-500">{blinkDuration}ms</span>
                          </div>
                          <Slider
                            value={[blinkDuration]}
                            onValueChange={([value]) => setBlinkDuration(value)}
                            min={100}
                            max={1000}
                            step={50}
                          />
                          <p className="text-xs text-gray-500">まばたきの速度（100-1000ms）</p>
                        </div>
                      </div>

                      {/* 右カラム */}
                      <div className="space-y-4">
                        {/* ランダム性 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>ランダム性</Label>
                            <Switch
                              checked={randomnessEnabled}
                              onCheckedChange={setRandomnessEnabled}
                            />
                          </div>
                          {randomnessEnabled && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">{randomness}%</span>
                              </div>
                              <Slider
                                value={[randomness]}
                                onValueChange={([value]) => setRandomness(value)}
                                min={0}
                                max={100}
                                step={5}
                              />
                              <p className="text-xs text-gray-500">タイミングのランダム性（0-100%）</p>
                            </>
                          )}
                        </div>

                        {/* ループモード */}
                        <div className="space-y-2">
                          <Label>ループモード</Label>
                          <RadioGroup value={loopMode} onValueChange={(value) => setLoopMode(value as LoopMode)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="once" id="once" />
                              <Label htmlFor="once" className="cursor-pointer">1回のみ</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="infinite" id="infinite" />
                              <Label htmlFor="infinite" className="cursor-pointer">無限ループ</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="count" id="count" />
                              <Label htmlFor="count" className="cursor-pointer">指定回数</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* ループ回数 */}
                        {loopMode === "count" && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>ループ回数</Label>
                              <span className="text-sm text-gray-500">{maxLoops}回</span>
                            </div>
                            <Slider
                              value={[maxLoops]}
                              onValueChange={([value]) => setMaxLoops(value)}
                              min={1}
                              max={10}
                              step={1}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>

          {/* プレビューセクション */}
          <Card>
            <CardHeader>
              <CardTitle>3. プレビュー</CardTitle>
              <CardDescription>アニメーションをプレビュー</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      loopCountRef.current = 0
                      currentFrameRef.current = 0
                    }
                  }}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      一時停止
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      再生
                    </>
                  )}
                </Button>
              </div>

              {/* 設定サマリー */}
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">現在の設定:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>パターン: {blinkPatterns[selectedPattern].name}</li>
                  <li>間隔: {blinkSpeed}ms</li>
                  <li>速度: {blinkDuration}ms</li>
                  <li>ランダム性: {randomnessEnabled ? `${randomness}%` : "無効"}</li>
                  <li>ループ: {loopMode === "once" ? "1回" : loopMode === "infinite" ? "無限" : `${maxLoops}回`}</li>
                  {loopMode === "count" && (
                    <li>進捗: {loopCountRef.current} / {maxLoops}回</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* エクスポートセクション */}
          <Card>
            <CardHeader>
              <CardTitle>4. エクスポート</CardTitle>
              <CardDescription>アニメーションをエクスポート</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ファイルサイズ予測 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">推定ファイルサイズ</span>
                  <span className="text-gray-600">
                    {(() => {
                      const pattern = blinkPatterns[selectedPattern]
                      const frameCount = Math.min(pattern.sequence.length * 4, 24)
                      const loopFactor = loopMode === "once" ? 1 : loopMode === "count" ? maxLoops : 3
                      const compressionFactor = 1 - compressionLevel / 10
                      const qualityFactor = imageQuality / 100
                      const formatFactor = exportFormat === "webp" ? 0.7 : exportFormat === "apng" ? 1.0 : 0.9

                      // 仮の計算（実際の画像サイズに基づく）
                      const baseSize = 50 // KB
                      const estimatedSize = baseSize * frameCount * loopFactor * compressionFactor * qualityFactor * formatFactor

                      return `${Math.round(estimatedSize)} KB`
                    })()}
                  </span>
                </div>
                <Progress value={30} className="h-2" />
                <p className="text-xs text-gray-500">制限: 1024 KB (1 MB)</p>
              </div>

              {/* フォーマット選択 */}
              <Tabs value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="apng">APNG</TabsTrigger>
                  <TabsTrigger value="webp">WebP</TabsTrigger>
                  <TabsTrigger value="gif">GIF</TabsTrigger>
                </TabsList>
                <TabsContent value="apng" className="text-sm text-gray-600">
                  透明度対応、高品質、Firefoxで確実に動作
                </TabsContent>
                <TabsContent value="webp" className="text-sm text-gray-600">
                  ファイルサイズが小さい、モダンブラウザ対応
                </TabsContent>
                <TabsContent value="gif" className="text-sm text-gray-600">
                  互換性が高い、256色制限
                </TabsContent>
              </Tabs>

              {/* 圧縮設定 */}
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

              {/* エクスポートボタン */}
              <Button
                className="w-full"
                size="lg"
                disabled={isExporting || !previewReady}
                onClick={async () => {
                  setIsExporting(true)
                  setExportProgress(0)

                  try {
                    if (exportFormat === "apng") {
                      await exportAsAPNG()
                    } else {
                      alert(`${exportFormat.toUpperCase()}形式のエクスポートは今後実装予定です`)
                    }
                  } catch (error) {
                    console.error("Export error:", error)
                    alert(`エクスポート中にエラーが発生しました: ${error}`)
                  } finally {
                    setIsExporting(false)
                    setExportProgress(0)
                  }
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isExporting ? "エクスポート中..." : "エクスポート"}
              </Button>

              {/* 進捗表示 */}
              {isExporting && (
                <div className="space-y-2">
                  <Progress value={exportProgress} />
                  <p className="text-sm text-center text-gray-600">{exportProgress}%</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
