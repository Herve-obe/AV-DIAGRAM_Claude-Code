"""Génère le manuel hors ligne HTML/PDF depuis le Markdown (Python + ReportLab)."""
from pathlib import Path
from html import escape
import re
import json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf8"))["version"]
blocks = (ROOT / "docs/manuel-utilisateur.md").read_text(encoding="utf8").split("\n\n")
chapters = [b[3:].strip() for b in blocks if b.startswith("## ")]
assert len(chapters) == 22
public = ROOT / "public"
public.mkdir(exist_ok=True)
html = [f'<header><p>AV Diagram · {escape(VERSION)}</p><h1>Manuel utilisateur</h1><p>Windows et macOS · Version de développement</p></header><nav aria-label="Sommaire"><h2>Sommaire</h2><ol>']
html += [f'<li><a href="#chapitre-{i}">{escape(t)}</a></li>' for i, t in enumerate(chapters, 1)]
html.append('</ol></nav><main>')

styles = getSampleStyleSheet()
font = next((p for p in [Path("C:/Windows/Fonts/arial.ttf"), Path("/System/Library/Fonts/Supplemental/Arial.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")] if p.exists()), Path("C:/Windows/Fonts/arial.ttf"))
normal, bold = "Helvetica", "Helvetica-Bold"
if font.exists():
    pdfmetrics.registerFont(TTFont("Manual", str(font)))
    bold_file = font.with_name("DejaVuSans-Bold.ttf" if font.name == "DejaVuSans.ttf" else "Arial Bold.ttf" if font.name == "Arial.ttf" else "arialbd.ttf")
    pdfmetrics.registerFont(TTFont("ManualBold", str(bold_file)))
    normal, bold = "Manual", "ManualBold"
styles.add(ParagraphStyle("BodyManual", fontName=normal, fontSize=10.2, leading=15, spaceAfter=10))
styles.add(ParagraphStyle("Chapter", fontName=bold, fontSize=15, leading=20, spaceBefore=18, spaceAfter=10, keepWithNext=True))
styles.add(ParagraphStyle("CoverManual", fontName=bold, fontSize=30, leading=38, alignment=TA_CENTER, spaceAfter=25))
styles.add(ParagraphStyle("SmallManual", fontName=normal, fontSize=9, leading=13, spaceAfter=5))
styles.add(ParagraphStyle("CaptionManual", fontName=bold, fontSize=9, leading=13, spaceBefore=7, spaceAfter=5))
toc = TableOfContents()
toc.levelStyles = [ParagraphStyle("TOCManual", fontName=normal, fontSize=10, leading=15, spaceBefore=5)]
story = [Spacer(1, 100), Paragraph("AV Diagram", styles["CoverManual"]), Paragraph("Manuel utilisateur", styles["CoverManual"]), Paragraph(f"Version {VERSION} · 25 octobre 2026", styles["BodyManual"]), Paragraph("Projets · Synoptiques · Collaboration · Baies · Plans · Réseau · Électricité · Intercom · Synchronisation · Échanges et exports", styles["BodyManual"]), Paragraph("Application en développement. Vérifier les documents produits et conserver les fichiers de référence.", styles["BodyManual"]), PageBreak(), Paragraph("Sommaire", styles["Chapter"]), toc, PageBreak()]

chapter = 0
figures = 0
for index, block in enumerate(blocks):
    block = block.strip()
    if not block or block.startswith("# "):
        continue
    if block.startswith("## "):
        chapter += 1
        title = block[3:].strip()
        html.append(f'<h2 id="chapitre-{chapter}">{escape(title)}</h2>')
        story.append(Paragraph(escape(title), styles["Chapter"]))
    elif block.startswith("!["):
        match = re.fullmatch(r"!\[([^\]]+)\]\(([^)]+)\)", block)
        assert match, f"Capture mal formée : {block}"
        caption, source = match.groups()
        asset = (ROOT / "docs" / source).resolve()
        assert asset.is_relative_to((public / "manual-assets").resolve()) and asset.is_file()
        legend = blocks[index + 1].strip()
        assert legend.startswith("Repères : "), f"Légende manquante : {source}"
        figure = Image(str(asset))
        ratio = min(480 / figure.imageWidth, 430 / figure.imageHeight, .5)
        figure.drawWidth, figure.drawHeight = figure.imageWidth * ratio, figure.imageHeight * ratio
        html.append(f'<figure><img src="{escape(asset.relative_to(public).as_posix())}" alt="{escape(caption)}" width="{figure.imageWidth}" height="{figure.imageHeight}" loading="lazy"><figcaption>{escape(caption)}</figcaption><p>{escape(legend)}</p></figure>')
        story.append(KeepTogether([figure, Paragraph(escape(caption), styles["CaptionManual"]), Paragraph(escape(legend), styles["SmallManual"]), Spacer(1, 12)]))
        figures += 1
    elif block.startswith("Repères : "):
        assert blocks[index - 1].strip().startswith("!["), "Légende sans capture"
    elif block.startswith("|"):
        rows = [[s.strip() for s in line.strip().strip("|").split("|")] for line in block.splitlines() if not re.match(r"^\|[\s:|-]+\|$", line)]
        html.append('<table><thead><tr>' + ''.join('<th>'+escape(s)+'</th>' for s in rows[0]) + '</tr></thead><tbody>')
        html += ['<tr>'+''.join('<td>'+escape(s)+'</td>' for s in row)+'</tr>' for row in rows[1:]]
        html.append('</tbody></table>')
        table = Table([[Paragraph(escape(s), styles["SmallManual"]) for s in row] for row in rows], colWidths=[170, 155, 155], repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#e8edf2")), ("BOX", (0,0), (-1,-1), .5, colors.HexColor("#aab6c2")), ("INNERGRID", (0,0), (-1,-1), .3, colors.HexColor("#c8d0d8")), ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7), ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 5)]))
        story += [table, Spacer(1, 12)]
    else:
        text = escape(' '.join(block.splitlines()))
        html.append(f'<p>{text}</p>')
        story.append(Paragraph(text, styles["BodyManual"]))

# Le dernier chapitre court reste entier, au lieu de laisser deux lignes seules en dernière page.
last_chapter = next(i for i, flow in enumerate(story) if isinstance(flow, Paragraph) and flow.style.name == 'Chapter' and flow.getPlainText().startswith('22.'))
story = story[:last_chapter] + [KeepTogether(story[last_chapter:])]

html.append('</main><footer>AV Diagram — conserver le .avd et les sauvegardes de chaque projet.</footer>')
css = "body{font:17px/1.65 Arial,sans-serif;color:#243344;margin:0 auto;max-width:920px;padding:36px 40px;background:#fff}header{border-bottom:4px solid #d95b12;padding-bottom:22px}h1{font-size:38px;line-height:1.2}h2{line-height:1.35;margin-top:40px;scroll-margin-top:20px}nav{background:#f2f5f8;padding:15px 28px;margin:30px 0}a{color:#175d98}li{margin:7px 0}table{border-collapse:collapse;width:100%;font-size:15px}td,th{border:1px solid #c8d0d8;padding:9px;text-align:left}th{background:#e8edf2}figure{margin:28px 0;padding:12px;border:1px solid #c8d0d8;border-radius:6px;break-inside:avoid}figure img{display:block;max-width:100%;width:auto;height:auto;margin:auto}figcaption{font-weight:bold;margin-top:12px;font-size:15px}figure p{font-size:15px;margin:6px 0 0}footer{border-top:1px solid #c8d0d8;margin-top:40px;padding-top:20px;font-size:14px}@media print{body{max-width:none;padding:0;font-size:11pt}nav{break-after:page}h2{break-after:avoid}table,tr{break-inside:avoid}a{color:inherit}}"
(public / "manuel.html").write_text('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AV Diagram — Manuel utilisateur</title><style>'+css+'</style></head><body>'+''.join(html)+'</body></html>', encoding="utf8")

class Manual(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "Chapter" and flowable.getPlainText() != "Sommaire":
            text = flowable.getPlainText()
            key = "chapter-" + text.split(".", 1)[0]
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, 0, False)
            self.notify("TOCEntry", (0, text, self.page, key))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(normal, 8)
    canvas.setFillColor(colors.HexColor("#536273"))
    canvas.drawString(48, 28, f"AV Diagram {VERSION} · Manuel utilisateur")
    canvas.drawRightString(A4[0]-48, 28, str(doc.page))
    canvas.restoreState()

doc = Manual(str(public / "manuel.pdf"), pagesize=A4, rightMargin=48, leftMargin=48, topMargin=45, bottomMargin=46, title="AV Diagram — Manuel utilisateur", author="AV Diagram")
doc.multiBuild(story, onFirstPage=footer, onLaterPages=footer)
print(f"Manuel {VERSION} : HTML et PDF générés, 22 chapitres, {figures} captures")
