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
