import pdfplumber

with pdfplumber.open("sample_rfp_1.pdf") as pdf:
    for idx in [21, 22, 23, 24]: # Pages 22 to 25 (0-indexed 21 to 24)
        print(f"--- Page {idx+1} ---")
        print(pdf.pages[idx].extract_text())
        print("-" * 50)
