# Jarvis Companion

仕事の整理、資料のレビュー、次に試す一歩について相談する、日本語の個人向けワークスペース。

[Jarvis を開く](https://kentaro-oishi-c3creators.github.io/jarvis-companion/)

## 使い方

1. ポータルで版を選び、相談を書いて送信します。初回から使える整理機能は、端末内のルールで動作します。
2. 自由なAI対話には対応するWebGPU環境でモデルを読み込んでください。初回はモデルデータをダウンロードします。
3. 前提や目的を文脈メモに書けます。記録を次回も使う場合は、利用中のブラウザへの保存を選びます。
4. 表示テーマはLight、Dark、Autoから選べます。

## ローカル起動

Python 3 のある環境でリポジトリのルートから次を実行し、ブラウザで http://localhost:8000 を開きます。

```sh
python -m http.server 8000 --directory site
```

サイト本体は site 配下、仕様と公開手順は [実装計画](docs/実装計画.md) にあります。GitHub Pagesは gh-pages ブランチのルートを配信します。

## ORIGAMI版の判断ノート

[初版](https://kentaro-oishi-c3creators.github.io/jarvis-companion/v1/) と [ORIGAMI版](https://kentaro-oishi-c3creators.github.io/jarvis-companion/v2/) をポータルから選べます。ORIGAMI版では「判断ノートを開く」から事実と仮説を入力し、保留か小さな試行を記録します。見直した理由を追記すると過去の判断も読み返せます。「最新の判断を会話に持ち込む」で下書きに転記できます。判断ノートの端末保存は会話の保存設定とは別に選べます。

端末内AIは WebLLM と Qwen2.5 0.5B を利用します。初回はモデルの重み約266 MBに加えて実行用ファイルを取得します。AIへの入力は1回1,200文字までです。公開アプリが個人DriveやCodexのメモリにアクセスする機能はありません。
