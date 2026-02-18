
import os

input_file = 'google_10k.txt'
output_file = r'c:\Users\yoshi\Desktop\english-learning-app\src\lib\generatedWordLevels.ts'

# CEFR Mapping Logic (Approximate based on NGSL/standard corpus analysis)
# Rank 1-1000: A1
# Rank 1001-2000: A2
# Rank 2001-4000: B1
# Rank 4001-7000: B2
# Rank 7001-10000: C1

levels = []
try:
    with open(input_file, 'r', encoding='utf-8') as f:
        words = [line.strip() for line in f if line.strip()]

    print(f"Loaded {len(words)} words.")

    for i, word in enumerate(words):
        rank = i + 1
        level = 'C2' # Fallback
        if rank <= 1000:
            level = 'A1'
        elif rank <= 2000:
            level = 'A2'
        elif rank <= 4000:
            level = 'B1'
        elif rank <= 7000:
            level = 'B2'
        elif rank <= 10000:
            level = 'C1'
        
        # Escape word just in case
        word_esc = word.replace("'", "\\'")
        # Using string literal to avoid import dependency
        levels.append(f"    '{word_esc}': '{level}',")

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("// Auto-generated from google-10000-english frequency list\n")
        f.write("// Used to provide reasonable defaults for common words not in manual lists\n")
        f.write("export const FREQ_LEVELS = {\n")
        f.write('\n'.join(levels))
        f.write("\n} as const;\n")

    print(f"Generated {output_file} with {len(levels)} entries.")

except Exception as e:
    print(f"Error: {e}")
