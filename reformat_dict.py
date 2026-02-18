import re

file_path = r'c:\Users\yoshi\Desktop\english-learning-app\src\lib\localDictionary.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the header (everything before the object start)
header_match = re.search(r'^(.*const DICT: Record<string, string\[\]> = \{)', content, re.DOTALL)
if not header_match:
    print("Could not find start of DICT object")
    exit(1)

header = header_match.group(1)
rest = content[len(header):]

# Find the end of the object
# Assuming the file ends with "export default DICT;" or similar, and the object ends with "};"
# We'll just look for the last "};"
end_match = re.search(r'(\};\s*export default DICT;.*)$', rest, re.DOTALL)
if not end_match:
    # Try simpler end
    end_match = re.search(r'(\};\s*)$', rest, re.DOTALL)

if end_match:
    footer = end_match.group(1)
    body = rest[:-len(footer)]
else:
    print("Could not find end of DICT object")
    # Fallback: assume everything until explicit export default is body
    footer = "};\n\nexport default DICT;"
    body = rest.split('};')[0] 

# Parse entries
# Regex to find key: value pairs. Handles quoted keys.
# Value is assumed to be [...]
entries = []
seen_keys = set()
reserved_words = {'function', 'delete', 'in', 'instanceof', 'typeof', 'void', 'yield', 'class', 'enum', 'interface', 'package', 'private', 'protected', 'public', 'static', 'extends', 'implements', 'import', 'export', 'default', 'return', 'if', 'else', 'switch', 'case', 'break', 'continue', 'do', 'while', 'for', 'try', 'catch', 'finally', 'throw', 'with', 'debugger'}

# Allow comments? This approach strips comments inside the object. That's fine for now.
# Splitting by comma might be safer if regex is fragile, but regex for `key: [...]` is robust enough for this data.
entry_pattern = re.compile(r'(?:(?P<q>"?)(?P<key>[\w-]+)(?P=q))\s*:\s*(?P<val>\[[^\]]*\])')

matches = entry_pattern.findall(body)

clean_lines = []
for quote, key, val in matches:
    if key in seen_keys:
        continue
    seen_keys.add(key)
    
    # Quote if reserved or already quoted (though we stripped quotes in group 2 unless we use group 0)
    # Actually logic: if key in reserved_words, quote it.
    final_key = f'"{key}"' if key in reserved_words or quote else key
    # Or just always simplify: quote only if needed? 
    # The source had "function".
    if key == "function":
        final_key = '"function"'

    clean_lines.append(f'  {final_key}: {val},')

# Reconstruct
new_content = header + "\n" + "\n".join(clean_lines) + "\n" + footer

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Reformatted dictionary. {len(clean_lines)} unique entries.")
