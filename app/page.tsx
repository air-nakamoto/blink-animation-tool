import { BlinkAnimationTool } from "@/components/blink-animation-tool"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            瞬きアニメーションPNG作成ツール
          </h1>
          <p className="text-lg text-gray-600">
            3枚の画像から自然な瞬きアニメーションを生成
          </p>
        </div>
        <BlinkAnimationTool />
      </div>
    </div>
  )
}
