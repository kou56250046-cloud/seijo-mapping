# Google フォーム CSV 変換ツール

Google フォームの回答スプレッドシートから取得した CSV を
seijo-mapping 地図システム用フォーマットに変換するツールです。

## セットアップ

```bash
cd tools/csv_converter
pip install -r requirements.txt
streamlit run app.py
```

## 使い方

1. **Google フォームの回答を収集**
   - フォーム管理画面 → 「回答」タブ → スプレッドシートアイコン → スプレッドシートを開く
   - ファイル → ダウンロード → CSV (.csv)

2. **Streamlit アプリを起動**
   ```bash
   streamlit run app.py
   ```

3. **CSV をアップロード** → 列の対応付けを確認 → 「変換してダウンロード」

4. **変換済み CSV を地図システムにインポート**
   - seijo-mapping にログイン → 「インポート」ボタン → CSV をアップロード

## Google フォームの列と地図システムの対応

| Google フォームの質問 | 地図システムのフィールド |
|---|---|
| お名前 | 氏名（必須）|
| ご住所（市区町村・番地まで）| 住所（必須）|
| 所属区分 | 区分（青年/家庭青年/壮年/壮婦/教会長）|
| 趣味・特技 | 趣味（パイプ区切りに自動変換）|
| 写真 | 写真URL（Google Drive URLを直接表示URLに自動変換）|

## 写真について

Google フォームでアップロードされた写真は Google Drive に保存されます。
地図システムで表示するには、Drive のフォルダを「リンクを知っている全員が閲覧可能」に設定してください。

- Drive URL 形式: `https://drive.google.com/file/d/{ID}/view`
- 自動変換後: `https://drive.google.com/uc?export=view&id={ID}`
