#!/usr/bin/env python3
"""src/의 HTML, CSS, JS를 파일 하나로 합쳐 dist/index.html을 만듭니다.

개발할 때는 src/index.html을 브라우저로 바로 열면 되고,
카톡 등으로 보내거나 올릴 때는 이 스크립트로 만든 dist/index.html 한 파일만 쓰면 됩니다.

    python build.py
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

# (src/index.html 안의 연결 태그, 파일 이름, 합칠 때 감쌀 태그)
PARTS = [
    ('<link rel="stylesheet" href="style.css">', "style.css", "<style>\n{}\n</style>"),
    ('<link rel="stylesheet" href="theme.css">', "theme.css", "<style>\n{}\n</style>"),
    ('<script src="data.js"></script>', "data.js", "<script>\n{}\n</script>"),
    ('<script src="logic.js"></script>', "logic.js", "<script>\n{}\n</script>"),
    ('<script src="locales.js"></script>', "locales.js", "<script>\n{}\n</script>"),
    ('<script src="reminders.js"></script>', "reminders.js", "<script>\n{}\n</script>"),
    ('<script src="detail-locales.js"></script>', "detail-locales.js", "<script>\n{}\n</script>"),
    ('<script src="pick-data.js"></script>', "pick-data.js", "<script>\n{}\n</script>"),
    ('<script src="pick-art.js"></script>', "pick-art.js", "<script>\n{}\n</script>"),
    ('<script src="pick-scene.js"></script>', "pick-scene.js", "<script>\n{}\n</script>"),
    ('<script src="quiz-data.js"></script>', "quiz-data.js", "<script>\n{}\n</script>"),
    ('<script src="quiz-art.js"></script>', "quiz-art.js", "<script>\n{}\n</script>"),
    ('<script src="app.js"></script>', "app.js", "<script>\n{}\n</script>"),
]


def main():
    html = (SRC / "index.html").read_text(encoding="utf-8")
    for tag, name, wrap in PARTS:
        body = (SRC / name).read_text(encoding="utf-8").rstrip("\n")
        lowered = body.lower()
        assert "</script" not in lowered and "</style" not in lowered, f"{name}: 닫는 태그 글자가 들어 있어 합칠 수 없음"
        assert html.count(tag) == 1, f"src/index.html에 {tag} 가 정확히 한 번 있어야 함"
        html = html.replace(tag, wrap.format(body))

    DIST.mkdir(exist_ok=True)
    out = DIST / "index.html"
    out.write_text(html, encoding="utf-8")
    print("만들었어요:", out.relative_to(ROOT), f"({len(html.encode('utf-8')):,} bytes)")


if __name__ == "__main__":
    main()
