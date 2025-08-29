# quick_remove_console_logs.py
import sys, re
from pathlib import Path

def remove_console_logs(code: str) -> str:
    i, n = 0, len(code)
    out = []
    while i < n:
        j = code.find('console', i)
        if j == -1:
            out.append(code[i:]); break
        out.append(code[i:j])
        k = j
        # باید console . log ( را با فاصله‌های احتمالی تشخیص بدیم
        m = re.match(r'console\s*\.\s*error\s*\(', code[k:])
        if not m:
            out.append('console'); i = j + len('console'); continue
        k += m.end()  # الان بعد از '(' هستیم

        # حالا تا پرانتز بسته متناظر رو رد می‌کنیم (با مدیریت استرینگ/بک‌تیک/کامنت)
        depth = 1
        in_s = None   # "'", '"' یا '`'
        esc = False
        in_line_c = False
        in_block_c = False
        tpl_depth = 0  # برای `${}` داخل بک‌تیک

        while k < n:
            ch = code[k]

            if in_line_c:
                if ch == '\n': in_line_c = False
                k += 1; continue
            if in_block_c:
                if ch == '*' and k+1 < n and code[k+1] == '/':
                    k += 2; in_block_c = False; continue
                k += 1; continue

            if in_s:
                if esc:
                    esc = False; k += 1; continue
                if ch == '\\':
                    esc = True; k += 1; continue
                if in_s == '`':
                    # مدیریت template literal و ${ }
                    if ch == '`' and tpl_depth == 0:
                        in_s = None; k += 1; continue
                    if ch == '$' and k+1 < n and code[k+1] == '{':
                        tpl_depth += 1; k += 2; continue
                    if ch == '}' and tpl_depth > 0:
                        tpl_depth -= 1; k += 1; continue
                    k += 1; continue
                else:
                    if ch == in_s:
                        in_s = None
                    k += 1; continue

            # خارج از استرینگ/کامنت
            if ch in ("'", '"', '`'):
                in_s = ch; k += 1; continue
            if ch == '/' and k+1 < n and code[k+1] == '/':
                in_line_c = True; k += 2; continue
            if ch == '/' and k+1 < n and code[k+1] == '*':
                in_block_c = True; k += 2; continue

            if ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
                if depth == 0:
                    k += 1  # از ')' عبور کن
                    break
            k += 1

        # خوردن فاصله/سِمی‌کالن و یک \n احتمالی بعدش
        while k < n and code[k] in ' \t':
            k += 1
        if k < n and code[k] == ';':
            k += 1
        after = k
        while after < n and code[after] in ' \t':
            after += 1
        if after < n and code[after] == '\n':
            k = after + 1

        # چیزی اضافه نمی‌کنیم → این تکه حذف شد
        i = k

    return ''.join(out)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python quick_remove_console_logs.py app.js [--inplace|-o output.js]")
        sys.exit(1)
    path = Path(sys.argv[1])
    code = path.read_text(encoding="utf-8")
    cleaned = remove_console_logs(code)
    if "--inplace" in sys.argv:
        path.write_text(cleaned, encoding="utf-8")
        print(f"Cleaned in place: {path}")
    else:
        out = Path(sys.argv[sys.argv.index("-o")+1]) if "-o" in sys.argv else path.with_suffix(".cleaned.js")
        out.write_text(cleaned, encoding="utf-8")
        print(f"Wrote: {out}")
