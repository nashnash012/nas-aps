#!/usr/bin/env python3
"""
Update DOCUMENTATION .docx:
- Replace React.js -> Vanilla JavaScript
- Replace Tailwind CSS -> custom CSS
- Remove Postman/Jest references
- Remove migrate-db.js reference
- Update file paths from client/src/ to public/
- Add maroon page border
- Verify formatting
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document
from docx.shared import Pt, Inches, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml
import copy
import re

SRC = r"C:\Users\Admin\Pictures\RCC-APS SYSTEM\DOCUMENTATION .docx"
DST = r"C:\Users\Admin\Pictures\RCC-APS SYSTEM\DOCUMENTATION .docx"

# ─── Text replacements ───────────────────────────────────────────────
# Order matters: longer strings first to avoid partial replacements
TEXT_REPLACEMENTS = [
    # React.js + Tailwind CSS combos (longest first)
    ("React.js with HTML5, CSS3, and Tailwind CSS", "Vanilla JavaScript with HTML5, CSS3, and custom CSS"),
    ("React.js (HTML5, CSS3, and Tailwind CSS)", "Vanilla JavaScript (HTML5, CSS3, and custom CSS)"),
    ("React.js, HTML5, CSS3, Tailwind CSS", "Vanilla JavaScript, HTML5, CSS3, custom CSS"),
    ("React.js / Tailwind CSS", "Vanilla JavaScript / custom CSS"),
    ("React.js for the frontend user interface", "Vanilla JavaScript for the frontend user interface"),
    ("React.js for the frontend", "Vanilla JavaScript for the frontend"),
    ("React.js single-page application", "Vanilla JavaScript single-page application"),
    ("React.js and the backend", "Vanilla JavaScript and the backend"),
    ("frontend built using React.js", "frontend built using Vanilla JavaScript"),
    ("built using React.js", "built using Vanilla JavaScript"),
    ("using React.js", "using Vanilla JavaScript"),
    ("with React.js", "with Vanilla JavaScript"),
    ("React.js", "Vanilla JavaScript"),
    # Tailwind (catch remaining)
    ("Tailwind CSS", "custom CSS"),
    # Postman + Jest
    ("Postman was used for API testing, while Jest was used for unit testing of payroll computation functions",
     "API testing and unit testing of payroll computation functions were conducted"),
    ("Postman was used for API testing, while Jest was used for unit testing",
     "API testing and unit testing were conducted"),
    ("using Postman to confirm", "to confirm"),
    ("using Postman", ""),
    ("using Jest confirmed", "confirmed"),
    ("using Jest", ""),
    ("Postman to confirm", "to confirm"),
    ("Postman", ""),
    ("Jest test suite", "unit test suite"),
    ("Jest", ""),
    # migrate-db.js
    ("server/migrate-db.js - Database migration/setup script\n", ""),
    ("server/migrate-db.js - Database migration/setup script", ""),
]

# File path replacements (for Appendix B and Relevant Source Code sections)
PATH_REPLACEMENTS = [
    ("client/src/main.jsx - React application entry point", "public/index.html - Single-page application entry point"),
    ("client/src/App.jsx - Route definitions", "public/js/core.js - Core SPA routing and initialization"),
    ("client/src/api/ - API client for backend endpoints", "public/js/api.js - API client for backend endpoints"),
    ("client/src/hooks/useAuth.jsx - JWT authentication hook", "public/js/auth.js - JWT authentication and login logic"),
    ("client/src/pages/LoginPage.jsx - Login screen", "public/js/auth.js - Login and authentication"),
    ("client/src/pages/finance/ - Finance Officer dashboard, payroll calculator, bonus management, reports",
     "public/js/payroll.js - Payroll calculator and dynamic computation\n    public/js/finance.js - Finance dashboard, bonus management, reports"),
    ("client/src/pages/admin/ - System Administrator user management, deduction tables",
     "public/js/admin.js - System Administrator user management, deduction tables"),
    ("client/src/pages/employee/ - Employee dashboard and payslip viewer",
     "public/js/employee.js - Employee dashboard and payslip viewer"),
    ("client/src/components/ - Layout, navbar, sidebar, protected route, stat cards",
     "public/css/style.css - Layout, navbar, sidebar, and component styling"),
    ("client/package.json - Frontend dependencies and scripts",
     "public/index.html - Frontend entry point (no build step required)"),
    # Appendix B Phase 3 paths
    ("client/src/pages/LoginPage.jsx, client/src/hooks/useAuth.jsx, server/auth-router.js, server/server.js, client/package.json",
     "public/index.html, public/js/auth.js, server/auth-router.js, server/server.js"),
    ("client/src/pages/admin/UserManagement.jsx, server/hris-mock.js, server/db.js, HRIS API endpoint (/api/hris/sync)",
     "public/js/admin.js, server/hris-mock.js, server/db.js, HRIS API endpoint (/api/hris/sync)"),
    ("client/src/pages/finance/PayrollCalculator.jsx, government deduction tables (SSS brackets, PhilHealth 5%, Pag-IBIG cap, TRAIN brackets)",
     "public/js/payroll.js, government deduction tables (SSS brackets, PhilHealth 5%, Pag-IBIG cap, TRAIN brackets)"),
    ("client/src/pages/employee/EmployeeDashboard.jsx, client/src/pages/employee/PayslipViewer.jsx, payslip rendering, print/PDF",
     "public/js/employee.js, payslip rendering, print/PDF"),
    ("client/src/pages/finance/Reports.jsx, client/src/pages/finance/FinanceDashboard.jsx, chart rendering, export logic",
     "public/js/finance.js, chart rendering, export logic"),
    ("client/src/pages/finance/BonusManagement.jsx, client/src/pages/admin/DeductionTables.jsx, RA 8515 rules",
     "public/js/finance.js, public/js/admin.js, RA 8515 rules"),
]


def replace_in_runs(paragraph, old, new):
    """
    Replace text that may span multiple runs.
    Returns True if replacement was made.
    """
    # Get full paragraph text
    full = paragraph.text
    if old not in full:
        return False

    # Find the position of old text in full paragraph
    start_idx = full.index(old)

    # Collect all runs and map character positions
    runs = paragraph.runs
    if not runs:
        return False

    # Build mapping: which run contains which character
    run_map = []  # (run_index, char_index_in_run)
    for ri, run in enumerate(runs):
        for ci in range(len(run.text)):
            run_map.append((ri, ci))

    if start_idx >= len(run_map):
        return False

    end_idx = start_idx + len(old) - 1
    if end_idx >= len(run_map):
        return False

    start_run, start_char = run_map[start_idx]
    end_run, end_char = run_map[end_idx]

    if start_run == end_run:
        # Simple case: old text is within a single run
        run = runs[start_run]
        run.text = run.text[:start_char] + new + run.text[end_char + 1:]
    else:
        # Complex case: old text spans multiple runs
        # Put new text in the first run, clear middle runs, truncate last run
        first_run = runs[start_run]
        last_run = runs[end_run]

        first_run.text = first_run.text[:start_char] + new

        # Clear middle runs
        for ri in range(start_run + 1, end_run):
            runs[ri].text = ""

        # Truncate last run
        last_run.text = last_run.text[end_char + 1:]

    return True


def replace_text_in_paragraph(paragraph, old, new):
    """Replace all occurrences of old with new in a paragraph."""
    count = 0
    # Loop to handle multiple occurrences
    max_iter = 50
    while max_iter > 0:
        if replace_in_runs(paragraph, old, new):
            count += 1
            max_iter -= 1
        else:
            break
    return count


def add_maroon_border(doc):
    """Add a visible maroon solid page border to the document."""
    sect = doc.sections[0]
    sect_pr = sect._sectPr

    # Check if pgbdr already exists
    existing = sect_pr.find(qn('w:pgBdr'))
    if existing is not None:
        sect_pr.remove(existing)

    # Create page border element
    pgbdr = parse_xml(
        f'<w:pgBdr {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="12" w:space="24" w:color="800000"/>'
        f'  <w:left w:val="single" w:sz="12" w:space="24" w:color="800000"/>'
        f'  <w:bottom w:val="single" w:sz="12" w:space="24" w:color="800000"/>'
        f'  <w:right w:val="single" w:sz="12" w:space="24" w:color="800000"/>'
        f'</w:pgBdr>'
    )
    sect_pr.append(pgbdr)
    print("  [OK] Added maroon page border")


def verify_formatting(doc):
    """Verify and report formatting properties."""
    issues = []

    for i, section in enumerate(doc.sections):
        w = section.page_width
        h = section.page_height
        # Letter size: 8.5" x 11" = 7920000 x 10080000 EMU
        if abs(w - 7920000) > 10000 or abs(h - 10080000) > 10000:
            issues.append(f"Section {i}: page size is {w/914400:.2f}\" x {h/914400:.2f}\" (expected 8.5\" x 11\")")
        else:
            print(f"  [OK] Section {i}: page size = 8.5\" x 11\"")

        ml = section.left_margin
        mr = section.right_margin
        mt = section.top_margin
        mb = section.bottom_margin
        # 1 inch = 914400 EMU
        for name, val in [("left", ml), ("right", mr), ("top", mt), ("bottom", mb)]:
            if abs(val - 914400) > 50000:
                issues.append(f"Section {i}: {name} margin = {val/914400:.2f}\" (expected ~1\")")

        if not issues or all(f"Section {i}" not in x for x in issues):
            print(f"  [OK] Section {i}: margins ~1\" all sides")

    # Check fonts in first few paragraphs
    font_issues = []
    for pi, para in enumerate(doc.paragraphs[:20]):
        for run in para.runs:
            if run.font.name and run.font.name != "Times New Roman":
                font_issues.append(f"Para {pi}: font = {run.font.name}")
            if run.font.size and run.font.size != Pt(12):
                # Some may be headings
                pass

    if font_issues:
        print(f"  [WARN] Non-Times New Roman fonts found: {len(font_issues)} runs")
        for fi in font_issues[:5]:
            print(f"    {fi}")
    else:
        print("  [OK] Fonts: Times New Roman (checked first 20 paragraphs)")

    return issues


def main():
    print(f"Loading: {SRC}")
    doc = Document(SRC)

    # ─── Text replacements ───────────────────────────────────────────
    print("\n=== TEXT REPLACEMENTS ===")
    total_replacements = 0

    # Process all paragraphs in body
    for pi, para in enumerate(doc.paragraphs):
        for old, new in TEXT_REPLACEMENTS:
            if old in para.text:
                count = replace_text_in_paragraph(para, old, new)
                if count > 0:
                    total_replacements += count
                    print(f"  Para {pi}: '{old[:50]}...' -> '{new[:50]}...' ({count}x)")

    # Process tables
    for ti, table in enumerate(doc.tables):
        for ri, row in enumerate(table.rows):
            for ci, cell in enumerate(row.cells):
                for para in cell.paragraphs:
                    for old, new in TEXT_REPLACEMENTS:
                        if old in para.text:
                            count = replace_text_in_paragraph(para, old, new)
                            if count > 0:
                                total_replacements += count
                                print(f"  Table {ti}, Row {ri}, Cell {ci}: '{old[:50]}...' ({count}x)")

    print(f"\n  Total text replacements: {total_replacements}")

    # ─── Path replacements ───────────────────────────────────────────
    print("\n=== PATH REPLACEMENTS ===")
    path_replacements = 0

    for pi, para in enumerate(doc.paragraphs):
        for old, new in PATH_REPLACEMENTS:
            if old in para.text:
                count = replace_text_in_paragraph(para, old, new)
                if count > 0:
                    path_replacements += count
                    print(f"  Para {pi}: path updated ({count}x)")

    for ti, table in enumerate(doc.tables):
        for ri, row in enumerate(table.rows):
            for ci, cell in enumerate(row.cells):
                for para in cell.paragraphs:
                    for old, new in PATH_REPLACEMENTS:
                        if old in para.text:
                            count = replace_text_in_paragraph(para, old, new)
                            if count > 0:
                                path_replacements += count
                                print(f"  Table {ti}: path updated ({count}x)")

    print(f"\n  Total path replacements: {path_replacements}")

    # ─── Maroon border ───────────────────────────────────────────────
    print("\n=== PAGE BORDER ===")
    add_maroon_border(doc)

    # ─── Verify formatting ───────────────────────────────────────────
    print("\n=== FORMATTING VERIFICATION ===")
    issues = verify_formatting(doc)
    if issues:
        print("\n  Formatting issues found:")
        for issue in issues:
            print(f"    - {issue}")
    else:
        print("  All formatting checks passed!")

    # ─── Save ────────────────────────────────────────────────────────
    print(f"\nSaving: {DST}")
    doc.save(DST)
    print("Done!")


if __name__ == "__main__":
    main()
