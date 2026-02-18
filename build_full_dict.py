import re
import os

output_file = r'c:\Users\yoshi\Desktop\english-learning-app\src\lib\localDictionary.ts'
input_dir = r'c:\Users\yoshi\Desktop\english-learning-app'

# Regex for tags like <U>, <C>
tag_pattern = re.compile(r'〈[^〉]+〉')

def clean_definition(def_str):
    # Remove tags
    cleaned = tag_pattern.sub('', def_str)
    # Split by /
    parts = cleaned.split('/')
    # Trim and filter empty
    parts = [p.strip() for p in parts if p.strip()]
    return parts

def clean_key(key_str):
    # Remove [xxx] to get base word?
    # e.g. dollar[s] -> dollar
    # color[our] -> color
    base = re.sub(r'\[[^\]]+\]', '', key_str)
    return base.strip()

all_entries = {}

# Process a-z
for char_code in range(97, 123):
    char = chr(char_code)
    fname = os.path.join(input_dir, f'dict_{char}.txt')
    if not os.path.exists(fname):
        print(f"Skipping {fname}")
        continue
    
    with open(fname, 'r', encoding='utf-8') as f:
        for line in f:
            if '\t' not in line:
                continue
            key_part, def_part = line.split('\t', 1)
            
            # Key handling
            # Keys can be comma separated: "A,a"
            # Remove [s] etc?
            keys = [k.strip() for k in key_part.split(',')]
            
            definitions = clean_definition(def_part)
            if not definitions:
                continue
            
            for k in keys:
                # Clean key
                clean_k = clean_key(k)
                if not clean_k:
                    continue
                
                # Deduplicate? Overwrite?
                # EJDict order is alphabetical.
                # Just add.
                # If existing, maybe merge?
                # Let's just overwrite for now.
                all_entries[clean_k] = definitions

# Generate TS
print(f"Total words: {len(all_entries)}")

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('const DICT: Record<string, string[]> = {\n')
    
    # Sort keys for stable output
    for k in sorted(all_entries.keys()):
        # Escape quotes in key and values
        key_str = k.replace('"', '\\"')
        # Values
        vals = []
        for v in all_entries.get(k, []):
            vals.append('"' + v.replace('"', '\\"') + '"')
        
        val_str = ', '.join(vals)
        f.write(f'  "{key_str}": [{val_str}],\n')
        
    f.write('};\n\nexport default DICT;\n')

print("Done.")
