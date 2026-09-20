"""지원서 사본에 앱 화면 그림, 유스케이스 다이어그램과 설명 글을 넣는다. 원본은 건드리지 않는다."""
import copy
import io
import sys
from pathlib import Path

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from docx.table import Table
from docx.text.paragraph import Paragraph
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "docs" / "assets"
FIGURE_WIDTH = Cm(15.0)
DIAGRAM_WIDTH = Cm(11.4)
MAX_PIXELS = 2200
CAPTION_COLOR = RGBColor(0x5B, 0x6B, 0x66)

LAST = None  # 칸의 마지막 문단 뒤

# (본문 표 번호, 이 글로 시작하는 문단 뒤에, 차례로 넣을 것들)
# 글과 불릿은 그 칸에 이미 있는 문단의 서식을 그대로 본뜬다
PLAN = [
    (33, "이에 사운즈펀 브릿지는", [
        ("text", "이러한 구상을 확인하기 위해 1주차 ‘Colors’ 주제로 앱 시제품을 먼저 제작했습니다. 아동은 그림 1과 같이 오늘의 루틴을 순서대로 따라가며 앱 화면 안에서 노래와 챈트 영상을 보고 듣고, 들은 단어를 그림에서 찾은 뒤, 직접 말하면 그림에 색이 입혀지는 말하기 게임 ‘색깔 마법’으로 활동을 마무리합니다. 틀렸다는 표시 대신 다시 들려주고 함께 말해 보도록 하여, 아동이 부담 없이 소리를 내 보는 경험을 쌓도록 했습니다."),
    ]),
    (33, LAST, [
        ("figure", "application/fig-child.png", "<그림 1. SoundsFun Bridge 앱 시제품(1주차 ‘Colors’)의 아동 화면>", FIGURE_WIDTH),
    ]),
    (39, " 접근성", [
        ("text", "위 기능 가운데 아동과 보호자가 매일 사용하는 핵심 흐름은 1주차 시제품으로 먼저 구현하여 실제 휴대폰에서 확인하고 있습니다. 그림 2는 48주 과정을 12주 단위의 네 단계로 보여 주는 ‘소리 여행’ 화면으로, 아동과 보호자가 지금 어디쯤 와 있는지, 이번 주에 무엇을 하는지를 한눈에 알 수 있도록 했습니다."),
        ("figure", "application/fig-journey.png", "<그림 2. 48주 소리 여행과 이번 주 소리 활동>", Cm(14.0)),
        ("figure", "uml/usecase.png", "<그림 3. MVP 유스케이스 다이어그램>", DIAGRAM_WIDTH),
        ("text", "그림 3은 MVP에서 각 사용자가 앱으로 하는 일을 정리한 것입니다."),
        ("bullet", "아동: 오늘의 루틴 확인 → 영상 듣기 → 단어 맞추기·말하기 게임 → 스티커 받기"),
        ("bullet", "보호자: 아이 등록, 알림 시간 설정, 학습 기록과 어려워한 말 확인, 이번 주 대화 가이드"),
        ("bullet", "외부 서비스: 유튜브(검수된 영상을 앱 안에서 재생), 기기 음성 인식(말하기 확인), 휴대폰 알림(루틴 시작 안내)"),
        ("text", "교사용 여러 아동 보기와 운영자용 콘텐츠 점검 도구는 같은 구조 위에 다음 단계로 더할 수 있도록 설계해 두었습니다. 보호자 화면(그림 4)은 오늘의 소리 노출 시간과 연속 학습 일수, 주간·월간 기록을 보여 주고, 아동이 어려워한 말과 가정에서 나눌 수 있는 이번 주 대화 가이드를 함께 제시합니다. 정해 둔 시간에는 휴대폰 알림이 루틴의 시작을 알려 주어, 보호자가 매번 학습을 계획하고 챙겨야 하는 부담을 덜어 줍니다."),
        ("figure", "application/fig-parent.png", "<그림 4. 보호자 화면: 학습 기록, 어려워한 말과 대화 가이드, 휴대폰 알림>", Cm(14.0)),
    ]),
]


def shrunk(path: Path) -> io.BytesIO:
    source = Image.open(path).convert("RGBA")
    image = Image.new("RGB", source.size, "white")
    image.paste(source, mask=source.getchannel("A"))
    if image.width > MAX_PIXELS:
        image = image.resize((MAX_PIXELS, round(image.height * MAX_PIXELS / image.width)), Image.LANCZOS)
    out = io.BytesIO()
    image.save(out, "PNG", optimize=True)
    out.seek(0)
    return out


def clone_after(anchor: Paragraph, model: Paragraph, keep_runs: int) -> Paragraph:
    """model 문단의 서식(과 앞쪽 run 몇 개)을 본떠 anchor 바로 뒤에 새 문단을 만든다."""
    element = copy.deepcopy(model._p)
    kept = 0
    for child in list(element):
        if child.tag == qn("w:pPr"):
            continue
        if child.tag == qn("w:r") and kept < keep_runs:
            kept += 1
            continue
        element.remove(child)
    anchor._p.addnext(element)
    return Paragraph(element, anchor._parent)


def add_text(anchor: Paragraph, model: Paragraph, text: str) -> Paragraph:
    paragraph = clone_after(anchor, model, keep_runs=1)
    paragraph.runs[0].text = text
    return paragraph


def add_bullet(anchor: Paragraph, model: Paragraph, text: str) -> Paragraph:
    # 지원서의 불릿은 ‘빈칸 run + 글 run’ 꼴이다
    paragraph = clone_after(anchor, model, keep_runs=2)
    paragraph.runs[0].text = " "
    paragraph.runs[1].text = text
    return paragraph


def add_figure(anchor: Paragraph, model: Paragraph, image: Path, caption: str, width) -> Paragraph:
    def centered(after: Paragraph) -> Paragraph:
        paragraph = clone_after(after, model, keep_runs=0)
        paragraph.paragraph_format.first_line_indent = Cm(0)
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        return paragraph

    picture = centered(anchor)
    picture.paragraph_format.space_before = Pt(10)
    picture.paragraph_format.space_after = Pt(4)
    picture.paragraph_format.keep_with_next = True
    picture.add_run().add_picture(shrunk(image), width=width)

    text = centered(picture)
    text.paragraph_format.space_after = Pt(12)
    run = text.add_run(caption)
    run.font.size = Pt(9)
    run.font.color.rgb = CAPTION_COLOR
    return text


def main(source: str, target: str) -> None:
    document = docx.Document(source)
    body = list(document.element.body)
    for table_index, starts_with, blocks in PLAN:
        cell = Table(body[table_index], document).rows[0].cells[0]
        matches = [cell.paragraphs[-1]] if starts_with is LAST else [p for p in cell.paragraphs if p.text.startswith(starts_with)]
        if len(matches) != 1:
            raise SystemExit(f"문단을 찾지 못했습니다: {starts_with!r} ({len(matches)}개)")
        body_model = next(p for p in cell.paragraphs if p.style.name == "Normal" and len(p.text) > 40)
        bullet_model = next((p for p in cell.paragraphs if p.style.name == "List Bullet"), None)
        last = matches[0]
        for kind, *args in blocks:
            if kind == "text":
                last = add_text(last, body_model, *args)
            elif kind == "bullet":
                last = add_bullet(last, bullet_model, *args)
            else:
                path, caption, width = args
                last = add_figure(last, body_model, ASSETS / path, caption, width)
    document.save(target)
    print("saved", target)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
