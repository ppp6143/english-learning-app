
# Candidate dictionary (Basic A1-B1 words)
candidates = {
    "several": ["いくつかの", "数人の"], "various": ["様々な"], "numerous": ["多数の"],
    "certain": ["確かな", "ある〜"], "particular": ["特定の", "特別の"],
    "specific": ["具体的な", "特定の"], "single": ["たった一つの", "独身の"],
    "entire": ["全体の"], "complete": ["完全な"], "whole": ["全体の"],
    "general": ["一般的な"], "public": ["公共の"], "common": ["共通の", "普通の"],
    "similar": ["似ている"], "likely": ["ありそうな"], "possible": ["可能な"],
    "able": ["〜できる", "有能な"], "available": ["利用可能な"],
    "necessary": ["必要な"], "clear": ["明確な", "晴れた"],
    "final": ["最終的な"], "recent": ["最近の"], "current": ["現在の"],
    "past": ["過去の"], "future": ["未来の"],
    "main": ["主な"], "major": ["主要な"], "key": ["重要な", "鍵"],
    "significant": ["重要な", "著しい"], "serious": ["深刻な", "真面目な"],
    "simple": ["単純な"], "beautiful": ["美しい"],
    "different": ["異なる"], "important": ["重要な"],
    "difficult": ["難しい"], "traditional": ["伝統的な"],
    "cultural": ["文化的な"], "social": ["社会的な"],
    "political": ["政治的な"], "economic": ["経済の"],
    "financial": ["財政的な"], "international": ["国際的な"],
    "national": ["国家の"], "local": ["地元の"],
    "federal": ["連邦の"], "individual": ["個人の"],
    "personal": ["個人的な"], "physical": ["身体的な", "物理的な"],
    "medical": ["医学の"], "natural": ["自然な"], "human": ["人間の"],
    "too": ["〜もまた", "あまりに"], "very": ["とても"],
    "quite": ["かなり"], "rather": ["むしろ"], "almost": ["ほとんど"],
    "enough": ["十分な"], "perhaps": ["おそらく"], "maybe": ["たぶん"],
    "unlikely": ["ありそうもない"], "indeed": ["実に", "確かに"],
    "instead": ["その代わりに"], "actually": ["実は"],
    "exactly": ["正確に"], "really": ["本当に"],
    "especially": ["特に"], "particularly": ["特に"],
    "probably": ["おそらく"], "certainly": ["確かに"],
    "obviously": ["明らかに"], "clearly": ["明らかに"],
    "eventually": ["結局"], "finally": ["ついに"],
    "recently": ["最近"], "currently": ["現在"],
    "already": ["すでに"], "yet": ["まだ"], "still": ["まだ"],
    "soon": ["すぐに"], "early": ["早く"], "late": ["遅く"],
    "now": ["今"], "then": ["その時", "それから"],
    "here": ["ここ"], "there": ["そこ"],
    "away": ["離れて"], "back": ["戻って"],
    "forward": ["前方へ"], "ahead": ["前方に"],
    "behind": ["後ろに"], "together": ["一緒に"],
    "alone": ["一人で"], "also": ["〜もまた"],
    "so": ["だから", "とても"], "such": ["そのような"],
    "therefore": ["したがって"], "thus": ["したがって"],
    "hence": ["それゆえに"], "however": ["しかしながら"],
    "although": ["〜だけれども"], "though": ["〜だけれども"],
    "even": ["〜さえ"], "despite": ["〜にもかかわらず"],
    "because": ["なぜなら"], "unless": ["〜でない限り"],
    "if": ["もし"], "whether": ["〜かどうか"],
    "while": ["〜の間", "一方で"], "when": ["いつ"],
    "where": ["どこ"], "why": ["なぜ"], "how": ["どのように"],
    "fact": ["事実"], "idea": ["考え"], "reason": ["理由"],
    "way": ["方法", "道"], "thing": ["もの", "こと"],
    "something": ["何か"], "anything": ["何か"],
    "everything": ["すべて"], "nothing": ["何もない"],
    "part": ["部分"], "side": ["側", "側面"],
    "kind": ["種類", "親切な"], "type": ["タイプ", "種類"],
    "sort": ["種類"], "form": ["形", "用紙"],
    "level": ["レベル", "水準"], "point": ["点", "要点"],
    "case": ["場合", "事件"], "example": ["例"],
    "problem": ["問題"], "issue": ["問題", "発行"],
    "question": ["質問"], "answer": ["答え"],
    "solution": ["解決策"], "decision": ["決定"],
    "change": ["変化", "お釣り"], "chance": ["機会", "可能性"],
    "opportunity": ["機会"], "moment": ["瞬間"],
    "time": ["時間"], "day": ["日"], "year": ["年"],
    "life": ["生活", "人生"], "world": ["世界"],
    "people": ["人々"], "man": ["男"], "woman": ["女"],
    "child": ["子供"], "person": ["人"], "group": ["グループ"],
    "place": ["場所"], "area": ["地域"], "country": ["国"],
    "government": ["政府"], "system": ["システム"],
    "program": ["プログラム"], "number": ["数"],
    "money": ["お金"], "story": ["物語"], "book": ["本"],
    "word": ["単語"], "work": ["仕事"], "job": ["仕事"],
    "lot": ["たくさん"], "plenty": ["たくさん"],
    "much": ["たくさんの"], "many": ["たくさんの"],
    "few": ["ほとんどない"], "little": ["小さい", "少し"],
    "less": ["より少ない"], "least": ["最小の"],
    "more": ["より多くの"], "most": ["最も"],
    "some": ["いくらかの"], "any": ["どんな"],
    "no": ["いいえ", "ない"], "none": ["何も〜ない"],
    "all": ["すべて"], "each": ["それぞれの"],
    "every": ["すべての"], "both": ["両方の"],
    "either": ["どちらか"], "neither": ["どちらも〜ない"],
    "another": ["もう一つの"], "other": ["他の"],
    "others": ["他人", "他のもの"], "own": ["自身の"],
}

import re

file_path = r'c:\Users\yoshi\Desktop\english-learning-app\src\lib\localDictionary.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Naive check: if key is present in content
missing = []
for k, v in candidates.items():
    # Simple check for "key:" or 'key:' or key:
    if not re.search(fr'[\'"]?{k}[\'"]?\s*:', content):
        val_str = str(v).replace("'", '"') # Use double quotes for JSON-like TS
        missing.append(f'  {k}: {val_str},')

if missing:
    print(f"Adding {len(missing)} missing words.")
    # Append to file before closing brace
    # Replace last }; with ... };
    new_content = re.sub(r'(\};\s*export default DICT;.*)$', '\n' + '\n'.join(missing) + '\n\\1', content, flags=re.DOTALL)
    if new_content == content:
        # Fallback if regex failed to match footer exactly
         new_content = re.sub(r'(\};\s*)$', '\n' + '\n'.join(missing) + '\n\\1', content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
else:
    print("No missing words found.")
