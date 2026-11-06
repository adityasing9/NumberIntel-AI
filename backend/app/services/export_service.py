import io
import csv
import json
from typing import List, Dict, Any
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side


class ExportService:
    @staticmethod
    def export_to_csv(rows: List[Dict[str, Any]]) -> bytes:
        if not rows:
            return b"No records found"
        
        output = io.StringIO()
        # Add UTF-8 BOM for Excel compatibility
        output.write('\ufeff')
        
        fieldnames = list(rows[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
        
        return output.getvalue().encode('utf-8')

    @staticmethod
    def export_to_excel(rows: List[Dict[str, Any]], title: str = "Investigation Results") -> bytes:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "NumberIntel Report"

        if not rows:
            ws.append(["No records available"])
            stream = io.BytesIO()
            wb.save(stream)
            return stream.getvalue()

        headers = list(rows[0].keys())
        # Clean headers for display
        display_headers = [h.replace("_", " ").title() for h in headers]
        ws.append(display_headers)

        # Style header row
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Dark slate
        header_align = Alignment(horizontal="center", vertical="center")

        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_align

        # Add data rows
        for row_idx, r in enumerate(rows, start=2):
            row_vals = [r.get(h, "") for h in headers]
            ws.append(row_vals)
            # Alternate row striping
            if row_idx % 2 == 1:
                stripe_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
                for col_num in range(1, len(headers) + 1):
                    ws.cell(row=row_idx, column=col_num).fill = stripe_fill

        # Auto-adjust column widths
        for col in ws.columns:
            max_len = 0
            col_letter = col[0].column_letter
            for cell in col:
                val_str = str(cell.value or "")
                max_len = max(max_len, len(val_str))
            ws.column_dimensions[col_letter].width = min(50, max(max_len + 4, 12))

        stream = io.BytesIO()
        wb.save(stream)
        return stream.getvalue()

    @staticmethod
    def export_to_json(rows: List[Dict[str, Any]]) -> bytes:
        return json.dumps(rows, indent=2, default=str).encode('utf-8')


export_service = ExportService()
