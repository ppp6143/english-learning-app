import re
import os

file_path = r'c:\Users\yoshi\Desktop\english-learning-app\src\lib\localDictionary.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

seen = set()
new_lines = []
pattern = re.compile(r'^\s*(?:"?([\w-]+)"?)\s*:\s*\[')

for line in lines:
    match = pattern.match(line)
    if match:
        key = match.group(1)
        if key in seen:
            # Duplicate found, skip or comment out
            # print(f"Removing duplicate: {key}")
            pass
        else:
            seen.add(key)
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Processed {len(lines)} lines, removed {len(lines) - len(new_lines)} duplicates.")
