import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              ツールに戻る
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              瞬きアニメーションPNG作成ツール - 使い方マニュアル
            </h1>
            <p className="text-base text-muted-foreground">
              このツールの詳しい使い方を説明します
            </p>
          </div>

          <div className="space-y-6">
            <nav className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">目次</h2>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>
                  <a href="#basic-usage" className="hover:underline">
                    基本的な使い方
                  </a>
                </li>
                <li>
                  <a href="#advanced-settings" className="hover:underline">
                    詳細設定
                  </a>
                </li>
                <li>
                  <a href="#optimization" className="hover:underline">
                    ファイルサイズの最適化
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:underline">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#technical-info" className="hover:underline">
                    技術情報
                  </a>
                </li>
              </ul>
            </nav>

            <section id="basic-usage" className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">基本的な使い方</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">1. 画像をアップロード</h3>
                  <p className="text-gray-700 mb-2">
                    瞬きアニメーションを作成するには、以下の画像が必要です：
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>開いた目</strong>: 通常の状態の画像</li>
                    <li><strong>半開き</strong>: 目を半分閉じた状態の画像（オプション）</li>
                    <li><strong>閉じた目</strong>: 目を完全に閉じた状態の画像</li>
                  </ul>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">実際の画面</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      画像をアップロードすると以下のように表示されます：
                    </p>
                    <Image
                      src="/manual/step1-upload.png"
                      alt="画像アップロード画面"
                      width={1200}
                      height={600}
                      className="rounded-lg border border-gray-300 w-full"
                    />
                  </div>

                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      💡 <strong>ヒント：</strong> 半開きの画像がない場合は「2枚で生成する」にチェックを入れてください。
                    </p>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">2枚で生成する場合の注意事項</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      「2枚で生成する（開いた目と閉じた目のみを使用）」にチェックを入れると、半開き画像がない場合でも自然な瞬きアニメーションを生成できます：
                    </p>
                    <Image
                      src="/manual/step1-twoframe.png"
                      alt="2枚モードの画面"
                      width={1200}
                      height={600}
                      className="rounded-lg border border-gray-300 w-full"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2. 感情プリセットを選択</h3>
                  <p className="text-gray-700 mb-3">
                    キャラクターの感情や状態に合わせて、12種類のプリセットから選択できます：
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1">基本カテゴリー</h4>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700">
                          <li><strong>平常</strong>: 基本の瞬き（3秒に1回程度）</li>
                          <li><strong>穏やか</strong>: リラックスした状態（少しゆっくり）</li>
                          <li><strong>ご機嫌</strong>: 楽しい気分（時々2回瞬き）</li>
                          <li><strong>集中</strong>: 何かに集中している（瞬き少なめ）</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1">ネガティブカテゴリー</h4>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700">
                          <li><strong>緊張</strong>: 落ち着かない状態（瞬き多め）</li>
                          <li><strong>眠気</strong>: 眠たい状態（ゆっくり長めの瞬き）</li>
                          <li><strong>悲しみ</strong>: 落ち込んでいる（目を閉じる時間が長い）</li>
                          <li><strong>不安</strong>: そわそわしている（不規則な瞬き）</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1">ハイエナジーカテゴリー</h4>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700">
                          <li><strong>驚き</strong>: びっくりしている（最初に3回連続瞬き）</li>
                          <li><strong>興奮</strong>: ハイテンション（速めの連続瞬き）</li>
                          <li><strong>照れ</strong>: 恥ずかしい（不規則な瞬き）</li>
                          <li><strong>退屈</strong>: やる気なし（たまにゆっくり長い瞬き）</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">実際の画面</h4>
                      <Image
                        src="/manual/step2-preset12.png"
                        alt="感情プリセット選択画面"
                        width={1200}
                        height={800}
                        className="rounded-lg border border-gray-300 w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">3. ダウンロード</h3>
                  <p className="text-gray-700 mb-2">
                    プレビューで動作を確認したら、「ダウンロード」ボタンを押してAPNG形式で保存できます。
                  </p>
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      💡 <strong>ヒント：</strong> エンコード中も画面は操作可能です。処理が完了するまでお待ちください（通常10秒〜1分程度）。
                    </p>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">実際の画面</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      ダウンロード中の画面（重要な警告メッセージが表示されます）：
                    </p>
                    <Image
                      src="/manual/step3-download.png"
                      alt="ダウンロード画面"
                      width={800}
                      height={900}
                      className="rounded-lg border border-gray-300 w-full max-w-2xl"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section id="advanced-settings" className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">詳細設定</h2>

              <p className="text-gray-700">
                さらに細かく瞬きのタイミングを設定したい場合は、「詳細設定」を開くことでアニメーションをカスタマイズできます：
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800">アニメーションの長さ</h4>
                  <p className="text-gray-700 text-sm">
                    生成されるアニメーションの長さを1〜60秒で設定できます。ループパターンがこの長さ分繰り返されます。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">フレームレート</h4>
                  <p className="text-gray-700 text-sm">
                    1秒あたりのフレーム数を10〜30fpsで設定できます。高いほど滑らかですが、ファイルサイズが大きくなります。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">ループパターン設定</h4>
                  <p className="text-gray-700 text-sm mb-2">
                    瞬きのパターンを細かく設定できます。「ループ1」で基本的な瞬きパターンを設定し、「ループを追加」ボタンで異なるパターンを追加することで、より複雑な瞬きの組み合わせを作成できます。
                  </p>

                  <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 mb-2">
                      <strong>例：</strong> 「ループ1」で1回だけ瞬きする設定をし、「ループ2」で2回連続で瞬きする設定をすると、「1回瞬き → 2回連続瞬き → 1回瞬き...」というパターンを繰り返すアニメーションを作成できます。
                    </p>
                  </div>

                  <p className="text-gray-700 text-sm font-semibold mb-1">各ループで設定できる項目：</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm mb-3">
                    <li><strong>瞬き回数</strong>: 1回のループで何回瞬くか（1〜10回）</li>
                    <li><strong>瞬き速度</strong>: 1回の瞬きにかける時間（0.05〜0.7秒）</li>
                    <li><strong>瞬き間隔</strong>: 連続瞬きの間隔（0.05〜1.0秒）</li>
                    <li><strong>閉じた状態の維持</strong>: 目を閉じたまま保持する時間（0〜2秒）</li>
                    <li><strong>待機時間</strong>: 次のループまでの待ち時間（0.1〜30秒）</li>
                  </ul>

                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">詳細設定の画面例</h4>
                    <Image
                      src="/manual/step2-detail.png"
                      alt="詳細設定画面"
                      width={1000}
                      height={900}
                      className="rounded-lg border border-gray-300 w-full"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">圧縮レベル・画像品質</h4>
                  <p className="text-gray-700 text-sm">
                    ファイルサイズを調整するための設定です。値を下げるとファイルサイズが小さくなりますが、画質が低下します。
                  </p>
                </div>
              </div>
            </section>

            <section id="optimization" className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">ファイルサイズの最適化</h2>

              <p className="text-gray-700 mb-3">
                ココフォリアなどのTRPGツールでは、アップロードできる画像サイズに制限があります（多くの場合5MB以下）。
                ファイルサイズが大きい場合は、以下の方法で小さくできます：
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800">1. アップロードする画像を圧縮する</h4>
                  <p className="text-gray-700 text-sm">
                    元画像のサイズや解像度を小さくすることで、最終的なAPNGのサイズも小さくなります。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">2. アニメーション長さを短くする</h4>
                  <p className="text-gray-700 text-sm">
                    詳細設定でアニメーション長さを短く（例：10秒→5秒）することで、フレーム数が減りファイルサイズが小さくなります。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">3. フレームレートを下げる</h4>
                  <p className="text-gray-700 text-sm">
                    24fps → 12fps などに下げることで、フレーム数が半分になりファイルサイズも大幅に削減できます。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">4. 画質・圧縮レベルを調整する</h4>
                  <p className="text-gray-700 text-sm">
                    画質を85→70、圧縮レベルを上げることでファイルサイズを削減できます。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">5. 生成後に圧縮ツールを使用する</h4>
                  <p className="text-gray-700 text-sm mb-2">
                    生成されたAPNGファイルを専用の圧縮ツールで更に圧縮できます：
                  </p>
                  <a
                    href="https://minify.ccfolia.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                  >
                    ココフォリアの圧縮ツール
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </section>

            <section id="faq" className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">FAQ</h2>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800">Q. ひとまず使い方を試したいが、画像がない</h4>
                  <div className="text-gray-700 text-sm">
                    <p className="mb-2">
                      A. サンプル画像3枚（目を開いた状態・半開き・目を閉じた状態）をダウンロードし、お試しいただくことができます。
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>
                        <a
                          href="/samples/sample-images-bust.zip"
                          download
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          サンプル画像セットをダウンロード（バストアップVer）
                        </a>
                      </li>
                      <li>
                        <a
                          href="/samples/sample-images-fullbody.zip"
                          download
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          サンプル画像セットをダウンロード（全身Ver）
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">Q. 半開きの画像がない場合はどうすればいいですか？</h4>
                  <p className="text-gray-700 text-sm">
                    A. 「2枚で生成する」にチェックを入れてください。開いた目と閉じた目の2枚だけで自然な瞬きアニメーションを生成できます。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">Q. ダウンロードに時間がかかりすぎます</h4>
                  <p className="text-gray-700 text-sm">
                    A. 画像サイズやアニメーション長さによっては数十秒〜数分かかる場合があります。処理が完了するまでお待ちください。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">Q. どのくらいのサイズの画像をアップロードすべきですか？</h4>
                  <p className="text-gray-700 text-sm">
                    A. 推奨サイズは縦横2000px以下、各画像5MB以下です。生成されるAPNGファイルは設定により変動しますが、目安として1〜10MBになります。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">Q. 生成されたファイルが大きすぎます</h4>
                  <p className="text-gray-700 text-sm">
                    A. 「ファイルサイズの最適化」セクションを参照してください。特に元画像のサイズを小さくすることが最も効果的です。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">Q. どこで使えますか？</h4>
                  <p className="text-gray-700 text-sm">
                    A. 生成されるAPNG形式は、ココフォリアなどのTRPGツール、各種ゲーム制作ツールなど、APNGに対応している多くのサービスで使用できます。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">Q. 商用利用できますか？</h4>
                  <p className="text-gray-700 text-sm">
                    A. このツールは無料でご利用いただけます。ただし、元画像の権利は作成者に帰属しますので、元画像の利用規約に従ってください。
                  </p>
                </div>
              </div>
            </section>

            <section id="technical-info" className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">技術情報</h2>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800">出力形式</h4>
                  <p className="text-gray-700 text-sm">
                    APNG（Animated Portable Network Graphics）形式で出力されます。透過情報を保持したまま、アニメーションを実現できます。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">ブラウザ対応</h4>
                  <p className="text-gray-700 text-sm">
                    モダンブラウザ（Chrome, Firefox, Safari, Edge）に対応しています。処理はすべてブラウザ内で完結し、サーバーに画像がアップロードされることはありません。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800">プライバシー</h4>
                  <p className="text-gray-700 text-sm">
                    アップロードされた画像はブラウザ内でのみ処理され、外部に送信されることはありません。
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="pt-6 border-t">
            <Link href="/">
              <Button className="w-full sm:w-auto" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ツールに戻る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
