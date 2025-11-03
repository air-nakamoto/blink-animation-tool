"use client"

import { BlinkAnimationTool } from "@/components/blink-animation-tool"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HelpCircle, ChevronDown } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            瞬きアニメーションPNG作成ツール
          </h1>
          <p className="text-lg text-gray-600">
            3枚の画像から自然な瞬きアニメーションを生成
          </p>

          {/* 右上にヘルプボタン */}
          <div className="absolute top-0 right-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
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
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <BlinkAnimationTool />
      </div>
    </div>
  )
}
