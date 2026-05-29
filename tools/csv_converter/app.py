import re
import io
import unicodedata
import pandas as pd
import streamlit as st

st.set_page_config(page_title="Google フォーム CSV 変換ツール", page_icon="⛪", layout="centered")

st.title("⛪ Google フォーム CSV 変換ツール")
st.caption("Googleフォームのスプレッドシートから取得したCSVを、地図システム用フォーマットに変換します。")

# ─── Google Drive URL 変換 ───────────────────────────────────────
def convert_drive_url(url: str) -> str:
    if not isinstance(url, str) or not url.strip():
        return ""
    url = url.strip()
    # https://drive.google.com/file/d/{ID}/view
    m = re.search(r"/file/d/([^/?#]+)", url)
    if m:
        return f"https://drive.google.com/uc?export=view&id={m.group(1)}"
    # https://drive.google.com/open?id={ID}
    m = re.search(r"[?&]id=([^&]+)", url)
    if m:
        return f"https://drive.google.com/uc?export=view&id={m.group(1)}"
    return url

# ─── 住所の正規化 ────────────────────────────────────────────────
def normalize_address(address: str) -> str:
    address = re.sub(r'[\n\r\t]', ' ', address)
    address = re.sub(r'^〒?\s*\d{3}-?\d{4}\s*', '', address)
    address = unicodedata.normalize('NFKC', address)
    address = re.sub(r'[－ーｰ−–—━～]', '-', address)
    address = address.replace('　', ' ')
    address = re.sub(r'\s+', ' ', address)
    return address.strip()

# ─── 趣味の区切り変換（カンマ → パイプ）───────────────────────────
def normalize_hobbies(val: str) -> str:
    if not isinstance(val, str) or not val.strip():
        return ""
    if "|" in val:
        return val.strip()
    parts = [h.strip() for h in val.split(",") if h.strip()]
    return "|".join(parts)

# ─── 区分のバリデーション ────────────────────────────────────────
VALID_CATEGORIES = {"小中高生", "青年", "家庭青年", "壮年", "壮婦", "教会長"}

def normalize_category(val: str) -> str:
    v = str(val).strip() if isinstance(val, str) else ""
    return v if v in VALID_CATEGORIES else "青年"

# ─── 自動列推定 ──────────────────────────────────────────────────
GUESSES = {
    "氏名":   ["お名前", "名前", "氏名", "姓名", "フルネーム", "full name", "name"],
    "住所":   ["ご住所", "住所", "現住所", "お住まい", "address"],
    "区分":   ["所属区分", "区分", "グループ", "カテゴリ", "category"],
    "趣味":   ["趣味・特技", "趣味", "特技", "hobby", "hobbies"],
    "写真URL": ["写真", "photo", "画像", "image", "写真url"],
}

def guess_column(headers: list[str], field: str) -> str:
    candidates = GUESSES.get(field, [])
    for h in headers:
        for c in candidates:
            if c.lower() in h.lower():
                return h
    return ""

# ─── UI ─────────────────────────────────────────────────────────
uploaded = st.file_uploader("Google スプレッドシートからエクスポートした CSV を選択", type=["csv"])

if uploaded:
    try:
        df_raw = pd.read_csv(uploaded, dtype=str).fillna("")
    except Exception as e:
        st.error(f"CSV の読み込みに失敗しました: {e}")
        st.stop()

    headers = list(df_raw.columns)
    st.success(f"✓ {len(df_raw)} 行 / {len(headers)} 列 を読み込みました")

    with st.expander("元データプレビュー（先頭3行）"):
        st.dataframe(df_raw.head(3), use_container_width=True)

    st.divider()
    st.subheader("列の対応付け")
    st.caption("どの列がどの項目に対応するかを選択してください。自動で推定しています。")

    col_options = ["（使用しない）"] + headers

    c1, c2 = st.columns(2)
    with c1:
        col_name = st.selectbox(
            "氏名 ★必須", col_options,
            index=col_options.index(guess_column(headers, "氏名")) if guess_column(headers, "氏名") in col_options else 0,
        )
        col_address = st.selectbox(
            "ご住所 ★必須", col_options,
            index=col_options.index(guess_column(headers, "住所")) if guess_column(headers, "住所") in col_options else 0,
        )
        col_category = st.selectbox(
            "所属区分", col_options,
            index=col_options.index(guess_column(headers, "区分")) if guess_column(headers, "区分") in col_options else 0,
        )
    with c2:
        col_hobby = st.selectbox(
            "趣味・特技", col_options,
            index=col_options.index(guess_column(headers, "趣味")) if guess_column(headers, "趣味") in col_options else 0,
        )
        col_photo = st.selectbox(
            "写真（Drive URL を自動変換）", col_options,
            index=col_options.index(guess_column(headers, "写真URL")) if guess_column(headers, "写真URL") in col_options else 0,
        )

    if col_name == "（使用しない）" or col_address == "（使用しない）":
        st.warning("「氏名」と「ご住所」は必須です。列を選択してください。")
        st.stop()

    st.divider()

    if st.button("▶ 変換してダウンロード", type="primary", use_container_width=True):
        rows = []
        errors = []
        for i, row in df_raw.iterrows():
            name = str(row.get(col_name, "")).strip()
            address = normalize_address(str(row.get(col_address, "")))
            if not name or not address:
                errors.append(f"行 {i+2}: 氏名または住所が空のためスキップ")
                continue

            category = normalize_category(row.get(col_category, "") if col_category != "（使用しない）" else "")
            hobby_raw = str(row.get(col_hobby, "")) if col_hobby != "（使用しない）" else ""
            hobbies = normalize_hobbies(hobby_raw)
            photo_raw = str(row.get(col_photo, "")) if col_photo != "（使用しない）" else ""
            photo_url = convert_drive_url(photo_raw)

            rows.append({
                "氏名": name,
                "住所": address,
                "区分": category,
                "写真URL": photo_url,
                "趣味": hobbies,
                "世帯ID": "",
            })

        if errors:
            with st.expander(f"スキップされた行: {len(errors)} 件"):
                for e in errors:
                    st.text(e)

        if not rows:
            st.error("変換できる行がありませんでした。")
            st.stop()

        df_out = pd.DataFrame(rows, columns=["氏名", "住所", "区分", "写真URL", "趣味", "世帯ID"])

        st.success(f"✓ {len(df_out)} 件を変換しました")
        st.dataframe(df_out.head(5), use_container_width=True)

        csv_bytes = df_out.to_csv(index=False, encoding="utf-8-sig").encode("utf-8-sig")
        st.download_button(
            label="📥 変換済み CSV をダウンロード",
            data=csv_bytes,
            file_name="seijo_members_converted.csv",
            mime="text/csv",
            use_container_width=True,
            type="primary",
        )

        st.info("ダウンロードしたCSVを seijo-mapping の「CSVインポート」からアップロードしてください。")
