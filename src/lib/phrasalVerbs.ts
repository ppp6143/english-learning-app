/**
 * Phrasal verb dictionary — ~250 common phrasal verbs with Japanese translations.
 * Includes reverse index for finding related phrasal verbs by base verb.
 */

export interface PhrasalVerbEntry {
    phrase: string;
    translation: string;
    level?: string; // CEFR level hint
}

/** Phrasal verb dictionary keyed by normalized phrase (lowercase, single space) */
const PHRASAL_VERBS: Record<string, PhrasalVerbEntry> = {
    // --- A ---
    'act out': { phrase: 'act out', translation: '演じる、行動に表す', level: 'B2' },
    'act up': { phrase: 'act up', translation: '調子が悪くなる、行儀悪くする', level: 'B2' },
    'add up': { phrase: 'add up', translation: '合計する、つじつまが合う', level: 'B1' },
    'ask out': { phrase: 'ask out', translation: 'デートに誘う', level: 'B1' },

    // --- B ---
    'back down': { phrase: 'back down', translation: '引き下がる、撤回する', level: 'B2' },
    'back off': { phrase: 'back off', translation: '退く、手を引く', level: 'B2' },
    'back up': { phrase: 'back up', translation: '後退する、支持する、バックアップする', level: 'B1' },
    'blow out': { phrase: 'blow out', translation: '吹き消す、パンクする', level: 'B1' },
    'blow up': { phrase: 'blow up', translation: '爆発する、激怒する、拡大する', level: 'B1' },
    'break away': { phrase: 'break away', translation: '逃げ出す、離脱する', level: 'B2' },
    'break down': { phrase: 'break down', translation: '故障する、崩壊する、分解する', level: 'B1' },
    'break in': { phrase: 'break in', translation: '侵入する、慣らす', level: 'B2' },
    'break into': { phrase: 'break into', translation: '押し入る、急に始める', level: 'B2' },
    'break off': { phrase: 'break off', translation: '折れる、中断する、断絶する', level: 'B2' },
    'break out': { phrase: 'break out', translation: '勃発する、脱走する', level: 'B1' },
    'break through': { phrase: 'break through', translation: '突破する', level: 'B2' },
    'break up': { phrase: 'break up', translation: '別れる、分裂する、解散する', level: 'B1' },
    'bring about': { phrase: 'bring about', translation: '引き起こす、もたらす', level: 'B2' },
    'bring back': { phrase: 'bring back', translation: '持ち帰る、思い出させる', level: 'B1' },
    'bring down': { phrase: 'bring down', translation: '倒す、下げる、落胆させる', level: 'B2' },
    'bring in': { phrase: 'bring in', translation: '導入する、持ち込む、稼ぐ', level: 'B2' },
    'bring out': { phrase: 'bring out', translation: '発売する、引き出す', level: 'B2' },
    'bring up': { phrase: 'bring up', translation: '育てる、話題に出す', level: 'B1' },
    'build up': { phrase: 'build up', translation: '築き上げる、増大する', level: 'B1' },
    'burn down': { phrase: 'burn down', translation: '全焼する', level: 'B1' },
    'burn out': { phrase: 'burn out', translation: '燃え尽きる、疲れ果てる', level: 'B2' },

    // --- C ---
    'call back': { phrase: 'call back', translation: '折り返し電話する', level: 'B1' },
    'call for': { phrase: 'call for', translation: '要求する、迎えに行く', level: 'B2' },
    'call off': { phrase: 'call off', translation: '中止する、取り消す', level: 'B1' },
    'call on': { phrase: 'call on', translation: '訪問する、求める', level: 'B2' },
    'call out': { phrase: 'call out', translation: '大声で呼ぶ、非難する', level: 'B2' },
    'call up': { phrase: 'call up', translation: '電話する、召集する', level: 'B1' },
    'calm down': { phrase: 'calm down', translation: '落ち着く、落ち着かせる', level: 'A2' },
    'care for': { phrase: 'care for', translation: '世話をする、好む', level: 'B1' },
    'carry on': { phrase: 'carry on', translation: '続ける、続行する', level: 'B1' },
    'carry out': { phrase: 'carry out', translation: '実行する、遂行する', level: 'B1' },
    'catch on': { phrase: 'catch on', translation: '理解する、流行する', level: 'B2' },
    'catch up': { phrase: 'catch up', translation: '追いつく', level: 'B1' },
    'check in': { phrase: 'check in', translation: 'チェックインする', level: 'A2' },
    'check out': { phrase: 'check out', translation: 'チェックアウトする、調べる', level: 'A2' },
    'cheer up': { phrase: 'cheer up', translation: '元気づける、元気を出す', level: 'B1' },
    'clean up': { phrase: 'clean up', translation: '掃除する、片付ける', level: 'A2' },
    'clear up': { phrase: 'clear up', translation: '晴れる、片付ける、解決する', level: 'B1' },
    'close down': { phrase: 'close down', translation: '閉鎖する、廃業する', level: 'B1' },
    'come about': { phrase: 'come about', translation: '起こる、生じる', level: 'B2' },
    'come across': { phrase: 'come across', translation: '偶然出会う、印象を与える', level: 'B1' },
    'come along': { phrase: 'come along', translation: '一緒に来る、進展する', level: 'B1' },
    'come around': { phrase: 'come around', translation: '意識を取り戻す、考えを変える', level: 'B2' },
    'come back': { phrase: 'come back', translation: '戻る、思い出す', level: 'A2' },
    'come down': { phrase: 'come down', translation: '降りる、値下がりする', level: 'B1' },
    'come in': { phrase: 'come in', translation: '入る、届く', level: 'A1' },
    'come off': { phrase: 'come off', translation: '取れる、成功する', level: 'B2' },
    'come on': { phrase: 'come on', translation: 'さあ、頑張れ、進む', level: 'A2' },
    'come out': { phrase: 'come out', translation: '出る、発売される、明らかになる', level: 'B1' },
    'come over': { phrase: 'come over', translation: '訪ねて来る、感情に襲われる', level: 'B1' },
    'come up': { phrase: 'come up', translation: '近づく、話題に上がる、生じる', level: 'B1' },
    'come up with': { phrase: 'come up with', translation: '思いつく、考え出す', level: 'B1' },
    'cool down': { phrase: 'cool down', translation: '冷める、冷静になる', level: 'B1' },
    'count on': { phrase: 'count on', translation: '頼りにする、当てにする', level: 'B1' },
    'cross out': { phrase: 'cross out', translation: '線を引いて消す', level: 'B1' },
    'cut back': { phrase: 'cut back', translation: '削減する', level: 'B2' },
    'cut down': { phrase: 'cut down', translation: '切り倒す、減らす', level: 'B1' },
    'cut in': { phrase: 'cut in', translation: '割り込む', level: 'B2' },
    'cut off': { phrase: 'cut off', translation: '切断する、遮断する', level: 'B1' },
    'cut out': { phrase: 'cut out', translation: '切り取る、やめる', level: 'B1' },

    // --- D ---
    'deal with': { phrase: 'deal with', translation: '対処する、扱う', level: 'B1' },
    'do away with': { phrase: 'do away with', translation: '廃止する、なくす', level: 'B2' },
    'do over': { phrase: 'do over', translation: 'やり直す', level: 'B2' },
    'do without': { phrase: 'do without', translation: 'なしで済ませる', level: 'B2' },
    'dress up': { phrase: 'dress up', translation: '着飾る、正装する', level: 'B1' },
    'drop by': { phrase: 'drop by', translation: '立ち寄る', level: 'B1' },
    'drop off': { phrase: 'drop off', translation: '降ろす、届ける、減少する', level: 'B1' },
    'drop out': { phrase: 'drop out', translation: '中退する、脱落する', level: 'B2' },

    // --- E ---
    'eat out': { phrase: 'eat out', translation: '外食する', level: 'A2' },
    'end up': { phrase: 'end up', translation: '結局〜になる', level: 'B1' },

    // --- F ---
    'fall apart': { phrase: 'fall apart', translation: 'ばらばらになる、崩壊する', level: 'B2' },
    'fall behind': { phrase: 'fall behind', translation: '遅れをとる', level: 'B2' },
    'fall down': { phrase: 'fall down', translation: '倒れる、落ちる', level: 'A2' },
    'fall for': { phrase: 'fall for', translation: '惚れる、だまされる', level: 'B2' },
    'fall off': { phrase: 'fall off', translation: '落ちる、減少する', level: 'B1' },
    'fall out': { phrase: 'fall out', translation: '仲たがいする、抜け落ちる', level: 'B2' },
    'fall through': { phrase: 'fall through', translation: '失敗に終わる', level: 'B2' },
    'figure out': { phrase: 'figure out', translation: '理解する、解決する', level: 'B1' },
    'fill in': { phrase: 'fill in', translation: '記入する、代理をする', level: 'B1' },
    'fill out': { phrase: 'fill out', translation: '記入する', level: 'B1' },
    'fill up': { phrase: 'fill up', translation: '満たす、いっぱいにする', level: 'B1' },
    'find out': { phrase: 'find out', translation: '見つけ出す、発見する', level: 'A2' },
    'fit in': { phrase: 'fit in', translation: '適合する、溶け込む', level: 'B1' },
    'fix up': { phrase: 'fix up', translation: '修理する、手配する', level: 'B2' },

    // --- G ---
    'get along': { phrase: 'get along', translation: '仲良くやる、うまくいく', level: 'B1' },
    'get around': { phrase: 'get around', translation: '動き回る、回避する、広まる', level: 'B2' },
    'get away': { phrase: 'get away', translation: '逃げる、離れる', level: 'B1' },
    'get back': { phrase: 'get back', translation: '戻る、取り戻す', level: 'A2' },
    'get by': { phrase: 'get by', translation: 'なんとかやっていく', level: 'B2' },
    'get down': { phrase: 'get down', translation: '降りる、落ち込ませる', level: 'B1' },
    'get in': { phrase: 'get in', translation: '入る、到着する', level: 'A2' },
    'get into': { phrase: 'get into', translation: '入り込む、興味を持つ', level: 'B1' },
    'get off': { phrase: 'get off', translation: '降りる、出発する', level: 'A2' },
    'get on': { phrase: 'get on', translation: '乗る、仲良くする、進める', level: 'A2' },
    'get out': { phrase: 'get out', translation: '出る、逃げる', level: 'A2' },
    'get over': { phrase: 'get over', translation: '克服する、立ち直る', level: 'B1' },
    'get rid of': { phrase: 'get rid of', translation: '取り除く、処分する', level: 'B1' },
    'get through': { phrase: 'get through', translation: '通り抜ける、連絡がつく、乗り越える', level: 'B2' },
    'get together': { phrase: 'get together', translation: '集まる、会う', level: 'A2' },
    'get up': { phrase: 'get up', translation: '起きる、立ち上がる', level: 'A1' },
    'give away': { phrase: 'give away', translation: '無料で与える、秘密を漏らす', level: 'B1' },
    'give back': { phrase: 'give back', translation: '返す', level: 'A2' },
    'give in': { phrase: 'give in', translation: '屈服する、提出する', level: 'B1' },
    'give off': { phrase: 'give off', translation: '発する、放出する', level: 'B2' },
    'give out': { phrase: 'give out', translation: '配る、尽きる', level: 'B2' },
    'give up': { phrase: 'give up', translation: '諦める、やめる', level: 'A2' },
    'go about': { phrase: 'go about', translation: '取りかかる', level: 'B2' },
    'go after': { phrase: 'go after', translation: '追いかける、追求する', level: 'B2' },
    'go ahead': { phrase: 'go ahead', translation: '先に進む、どうぞ', level: 'A2' },
    'go along': { phrase: 'go along', translation: '進む、賛成する', level: 'B1' },
    'go around': { phrase: 'go around', translation: '回る、十分にある', level: 'B1' },
    'go away': { phrase: 'go away', translation: '去る、なくなる', level: 'A2' },
    'go back': { phrase: 'go back', translation: '戻る', level: 'A2' },
    'go by': { phrase: 'go by', translation: '通り過ぎる、経過する', level: 'B1' },
    'go down': { phrase: 'go down', translation: '下がる、沈む', level: 'B1' },
    'go for': { phrase: 'go for', translation: '選ぶ、挑戦する', level: 'B1' },
    'go off': { phrase: 'go off', translation: '爆発する、鳴る、腐る', level: 'B1' },
    'go on': { phrase: 'go on', translation: '続ける、起こる', level: 'A2' },
    'go out': { phrase: 'go out', translation: '外出する、消える、付き合う', level: 'A2' },
    'go over': { phrase: 'go over', translation: '復習する、見直す', level: 'B1' },
    'go through': { phrase: 'go through', translation: '経験する、通過する、調べる', level: 'B1' },
    'go up': { phrase: 'go up', translation: '上がる、増加する', level: 'A2' },
    'grow up': { phrase: 'grow up', translation: '成長する、大人になる', level: 'A2' },

    // --- H ---
    'hand in': { phrase: 'hand in', translation: '提出する', level: 'B1' },
    'hand out': { phrase: 'hand out', translation: '配る', level: 'B1' },
    'hand over': { phrase: 'hand over', translation: '引き渡す', level: 'B2' },
    'hang around': { phrase: 'hang around', translation: 'ぶらぶらする', level: 'B1' },
    'hang on': { phrase: 'hang on', translation: 'しがみつく、ちょっと待つ', level: 'B1' },
    'hang out': { phrase: 'hang out', translation: '遊ぶ、時間を過ごす', level: 'B1' },
    'hang up': { phrase: 'hang up', translation: '電話を切る、掛ける', level: 'A2' },
    'head for': { phrase: 'head for', translation: '〜に向かう', level: 'B1' },
    'hear from': { phrase: 'hear from', translation: '〜から連絡をもらう', level: 'B1' },
    'hold back': { phrase: 'hold back', translation: '抑える、ためらう', level: 'B2' },
    'hold on': { phrase: 'hold on', translation: 'つかまる、ちょっと待つ', level: 'A2' },
    'hold up': { phrase: 'hold up', translation: '持ちこたえる、遅らせる、強盗する', level: 'B2' },
    'hurry up': { phrase: 'hurry up', translation: '急ぐ', level: 'A2' },

    // --- K ---
    'keep away': { phrase: 'keep away', translation: '近づけない、避ける', level: 'B1' },
    'keep on': { phrase: 'keep on', translation: '続ける', level: 'B1' },
    'keep up': { phrase: 'keep up', translation: '維持する、ついていく', level: 'B1' },
    'keep up with': { phrase: 'keep up with', translation: '〜に遅れずについていく', level: 'B1' },
    'kick off': { phrase: 'kick off', translation: '開始する、キックオフする', level: 'B2' },
    'knock down': { phrase: 'knock down', translation: '倒す、取り壊す', level: 'B2' },
    'knock out': { phrase: 'knock out', translation: 'ノックアウトする、疲れさせる', level: 'B2' },

    // --- L ---
    'lay off': { phrase: 'lay off', translation: '解雇する、やめる', level: 'B2' },
    'leave behind': { phrase: 'leave behind', translation: '置き去りにする', level: 'B1' },
    'leave out': { phrase: 'leave out', translation: '省く、除外する', level: 'B1' },
    'let down': { phrase: 'let down', translation: '失望させる、がっかりさせる', level: 'B1' },
    'let in': { phrase: 'let in', translation: '中に入れる', level: 'B1' },
    'let off': { phrase: 'let off', translation: '許す、放免する', level: 'B2' },
    'let out': { phrase: 'let out', translation: '外に出す、漏らす', level: 'B1' },
    'lie down': { phrase: 'lie down', translation: '横になる', level: 'A2' },
    'line up': { phrase: 'line up', translation: '並ぶ、整列する', level: 'B1' },
    'live on': { phrase: 'live on', translation: '〜で生活する、生き続ける', level: 'B2' },
    'lock up': { phrase: 'lock up', translation: '鍵をかける、閉じ込める', level: 'B1' },
    'look after': { phrase: 'look after', translation: '世話をする、面倒を見る', level: 'A2' },
    'look ahead': { phrase: 'look ahead', translation: '先を見る、将来を考える', level: 'B2' },
    'look around': { phrase: 'look around', translation: '見回す、見て回る', level: 'A2' },
    'look back': { phrase: 'look back', translation: '振り返る', level: 'B1' },
    'look down on': { phrase: 'look down on', translation: '見下す', level: 'B2' },
    'look for': { phrase: 'look for', translation: '探す', level: 'A2' },
    'look forward to': { phrase: 'look forward to', translation: '楽しみにする', level: 'A2' },
    'look into': { phrase: 'look into', translation: '調査する', level: 'B1' },
    'look out': { phrase: 'look out', translation: '気をつける、注意する', level: 'A2' },
    'look over': { phrase: 'look over', translation: 'ざっと目を通す', level: 'B1' },
    'look through': { phrase: 'look through', translation: '目を通す、調べる', level: 'B1' },
    'look up': { phrase: 'look up', translation: '調べる、見上げる', level: 'A2' },
    'look up to': { phrase: 'look up to', translation: '尊敬する', level: 'B2' },

    // --- M ---
    'make out': { phrase: 'make out', translation: '理解する、見分ける', level: 'B2' },
    'make up': { phrase: 'make up', translation: '作り上げる、仲直りする、化粧する', level: 'B1' },
    'make up for': { phrase: 'make up for', translation: '埋め合わせる、償う', level: 'B2' },
    'mix up': { phrase: 'mix up', translation: '混同する、ごちゃ混ぜにする', level: 'B1' },
    'move in': { phrase: 'move in', translation: '引っ越してくる', level: 'B1' },
    'move on': { phrase: 'move on', translation: '先に進む、次に移る', level: 'B1' },
    'move out': { phrase: 'move out', translation: '引っ越す、退去する', level: 'B1' },

    // --- O ---
    'opt out': { phrase: 'opt out', translation: '脱退する、参加しない', level: 'B2' },

    // --- P ---
    'pass away': { phrase: 'pass away', translation: '亡くなる', level: 'B1' },
    'pass by': { phrase: 'pass by', translation: '通り過ぎる', level: 'B1' },
    'pass down': { phrase: 'pass down', translation: '伝える、受け継ぐ', level: 'B2' },
    'pass on': { phrase: 'pass on', translation: '伝える、亡くなる', level: 'B2' },
    'pass out': { phrase: 'pass out', translation: '気絶する、配る', level: 'B2' },
    'pay back': { phrase: 'pay back', translation: '返済する、仕返しする', level: 'B1' },
    'pay off': { phrase: 'pay off', translation: '完済する、報われる', level: 'B2' },
    'pick on': { phrase: 'pick on', translation: 'いじめる、からかう', level: 'B2' },
    'pick out': { phrase: 'pick out', translation: '選び出す', level: 'B1' },
    'pick up': { phrase: 'pick up', translation: '拾う、迎えに行く、習得する', level: 'A2' },
    'point out': { phrase: 'point out', translation: '指摘する', level: 'B1' },
    'pull down': { phrase: 'pull down', translation: '引き下ろす、取り壊す', level: 'B2' },
    'pull off': { phrase: 'pull off', translation: 'やり遂げる、脱ぐ', level: 'B2' },
    'pull out': { phrase: 'pull out', translation: '引き出す、撤退する', level: 'B1' },
    'pull over': { phrase: 'pull over', translation: '路肩に寄せる', level: 'B2' },
    'pull up': { phrase: 'pull up', translation: '引き上げる、停車する', level: 'B1' },
    'put away': { phrase: 'put away', translation: '片付ける、しまう', level: 'B1' },
    'put back': { phrase: 'put back', translation: '元に戻す、延期する', level: 'B1' },
    'put down': { phrase: 'put down', translation: '置く、けなす、記録する', level: 'B1' },
    'put forward': { phrase: 'put forward', translation: '提案する、推薦する', level: 'B2' },
    'put in': { phrase: 'put in', translation: '入れる、申し込む、費やす', level: 'B1' },
    'put off': { phrase: 'put off', translation: '延期する、嫌がらせる', level: 'B1' },
    'put on': { phrase: 'put on', translation: '着る、つける、上演する', level: 'A2' },
    'put out': { phrase: 'put out', translation: '消す、出す、困らせる', level: 'B1' },
    'put through': { phrase: 'put through', translation: '電話をつなぐ、経験させる', level: 'B2' },
    'put together': { phrase: 'put together', translation: '組み立てる、まとめる', level: 'B1' },
    'put up': { phrase: 'put up', translation: '掲げる、建てる、泊める', level: 'B1' },
    'put up with': { phrase: 'put up with', translation: '我慢する、耐える', level: 'B1' },

    // --- R ---
    'rely on': { phrase: 'rely on', translation: '頼る、依存する', level: 'B1' },
    'round up': { phrase: 'round up', translation: '切り上げる、集める', level: 'B2' },
    'rule out': { phrase: 'rule out', translation: '除外する、排除する', level: 'B2' },
    'run away': { phrase: 'run away', translation: '逃げる', level: 'A2' },
    'run into': { phrase: 'run into', translation: '偶然会う、衝突する', level: 'B1' },
    'run off': { phrase: 'run off', translation: '逃げ出す、コピーする', level: 'B2' },
    'run out': { phrase: 'run out', translation: 'なくなる、切れる', level: 'B1' },
    'run out of': { phrase: 'run out of', translation: '〜を使い果たす', level: 'B1' },
    'run over': { phrase: 'run over', translation: 'ひく、あふれる、見直す', level: 'B2' },

    // --- S ---
    'see off': { phrase: 'see off', translation: '見送る', level: 'B1' },
    'sell out': { phrase: 'sell out', translation: '売り切れる、裏切る', level: 'B2' },
    'send back': { phrase: 'send back', translation: '送り返す', level: 'B1' },
    'set off': { phrase: 'set off', translation: '出発する、引き起こす', level: 'B1' },
    'set out': { phrase: 'set out', translation: '出発する、着手する', level: 'B1' },
    'set up': { phrase: 'set up', translation: '設立する、準備する、設定する', level: 'B1' },
    'settle down': { phrase: 'settle down', translation: '落ち着く、定住する', level: 'B1' },
    'show off': { phrase: 'show off', translation: '見せびらかす、自慢する', level: 'B1' },
    'show up': { phrase: 'show up', translation: '現れる、目立つ', level: 'B1' },
    'shut down': { phrase: 'shut down', translation: '閉鎖する、停止する', level: 'B1' },
    'shut up': { phrase: 'shut up', translation: '黙る、閉じ込める', level: 'B1' },
    'sign in': { phrase: 'sign in', translation: 'サインインする', level: 'A2' },
    'sign out': { phrase: 'sign out', translation: 'サインアウトする', level: 'A2' },
    'sign up': { phrase: 'sign up', translation: '登録する、申し込む', level: 'A2' },
    'sit down': { phrase: 'sit down', translation: '座る', level: 'A1' },
    'slow down': { phrase: 'slow down', translation: '速度を落とす、減速する', level: 'A2' },
    'sort out': { phrase: 'sort out', translation: '整理する、解決する', level: 'B1' },
    'speak up': { phrase: 'speak up', translation: 'はっきり言う、声を上げる', level: 'B1' },
    'speed up': { phrase: 'speed up', translation: '加速する', level: 'B1' },
    'stand by': { phrase: 'stand by', translation: '待機する、支持する', level: 'B2' },
    'stand for': { phrase: 'stand for', translation: '表す、意味する、支持する', level: 'B1' },
    'stand out': { phrase: 'stand out', translation: '目立つ、際立つ', level: 'B1' },
    'stand up': { phrase: 'stand up', translation: '立ち上がる、すっぽかす', level: 'A2' },
    'stay up': { phrase: 'stay up', translation: '夜更かしする', level: 'A2' },
    'step back': { phrase: 'step back', translation: '一歩引く、冷静に考える', level: 'B2' },
    'step down': { phrase: 'step down', translation: '辞任する、降りる', level: 'B2' },
    'step in': { phrase: 'step in', translation: '介入する', level: 'B2' },
    'step up': { phrase: 'step up', translation: '強化する、名乗り出る', level: 'B2' },
    'stick out': { phrase: 'stick out', translation: '突き出る、目立つ', level: 'B2' },
    'stick to': { phrase: 'stick to', translation: '固執する、続ける', level: 'B1' },
    'stick with': { phrase: 'stick with', translation: '〜を続ける、離れない', level: 'B2' },

    // --- T ---
    'take after': { phrase: 'take after', translation: '似ている', level: 'B2' },
    'take apart': { phrase: 'take apart', translation: '分解する', level: 'B2' },
    'take away': { phrase: 'take away', translation: '持ち去る、取り上げる', level: 'A2' },
    'take back': { phrase: 'take back', translation: '返品する、撤回する', level: 'B1' },
    'take down': { phrase: 'take down', translation: '取り外す、書き留める', level: 'B1' },
    'take in': { phrase: 'take in', translation: '理解する、受け入れる、だます', level: 'B2' },
    'take off': { phrase: 'take off', translation: '離陸する、脱ぐ、急成長する', level: 'A2' },
    'take on': { phrase: 'take on', translation: '引き受ける、雇う、対戦する', level: 'B1' },
    'take out': { phrase: 'take out', translation: '取り出す、連れ出す', level: 'A2' },
    'take over': { phrase: 'take over', translation: '引き継ぐ、乗っ取る', level: 'B1' },
    'take up': { phrase: 'take up', translation: '始める、占める、取り上げる', level: 'B1' },
    'talk over': { phrase: 'talk over', translation: '話し合う、議論する', level: 'B2' },
    'tear down': { phrase: 'tear down', translation: '取り壊す、壊す', level: 'B2' },
    'tear up': { phrase: 'tear up', translation: '破り捨てる', level: 'B2' },
    'tell apart': { phrase: 'tell apart', translation: '見分ける', level: 'B2' },
    'tell off': { phrase: 'tell off', translation: '叱る、怒る', level: 'B2' },
    'think over': { phrase: 'think over', translation: 'よく考える、熟考する', level: 'B1' },
    'think through': { phrase: 'think through', translation: 'じっくり考える', level: 'B2' },
    'think up': { phrase: 'think up', translation: '考え出す、思いつく', level: 'B2' },
    'throw away': { phrase: 'throw away', translation: '捨てる', level: 'A2' },
    'throw out': { phrase: 'throw out', translation: '捨てる、追い出す', level: 'B1' },
    'throw up': { phrase: 'throw up', translation: '吐く、嘔吐する', level: 'B1' },
    'try on': { phrase: 'try on', translation: '試着する', level: 'A2' },
    'try out': { phrase: 'try out', translation: '試す、試してみる', level: 'B1' },
    'turn around': { phrase: 'turn around', translation: '振り返る、好転させる', level: 'B1' },
    'turn back': { phrase: 'turn back', translation: '引き返す', level: 'B1' },
    'turn down': { phrase: 'turn down', translation: '断る、音量を下げる', level: 'B1' },
    'turn in': { phrase: 'turn in', translation: '提出する、寝る', level: 'B2' },
    'turn into': { phrase: 'turn into', translation: '〜に変わる、変える', level: 'B1' },
    'turn off': { phrase: 'turn off', translation: '消す、止める', level: 'A2' },
    'turn on': { phrase: 'turn on', translation: 'つける、作動させる', level: 'A2' },
    'turn out': { phrase: 'turn out', translation: '〜であることがわかる、結局〜になる', level: 'B1' },
    'turn over': { phrase: 'turn over', translation: 'ひっくり返す、引き渡す', level: 'B2' },
    'turn up': { phrase: 'turn up', translation: '現れる、音量を上げる', level: 'B1' },

    // --- U ---
    'use up': { phrase: 'use up', translation: '使い果たす', level: 'B1' },

    // --- W ---
    'wait on': { phrase: 'wait on', translation: '給仕する、待つ', level: 'B2' },
    'wake up': { phrase: 'wake up', translation: '目覚める、起こす', level: 'A1' },
    'warm up': { phrase: 'warm up', translation: '温める、準備運動する', level: 'A2' },
    'wash up': { phrase: 'wash up', translation: '洗い物をする、手を洗う', level: 'B1' },
    'watch out': { phrase: 'watch out', translation: '気をつける、注意する', level: 'A2' },
    'wear off': { phrase: 'wear off', translation: '薄れる、効果がなくなる', level: 'B2' },
    'wear out': { phrase: 'wear out', translation: 'すり減る、疲れ果てさせる', level: 'B1' },
    'wind up': { phrase: 'wind up', translation: '結局〜になる、巻き上げる', level: 'B2' },
    'wipe out': { phrase: 'wipe out', translation: '全滅させる、拭き取る', level: 'B2' },
    'work on': { phrase: 'work on', translation: '取り組む', level: 'A2' },
    'work out': { phrase: 'work out', translation: '運動する、解決する、うまくいく', level: 'B1' },
    'work up': { phrase: 'work up', translation: '興奮させる、作り上げる', level: 'B2' },
    'write down': { phrase: 'write down', translation: '書き留める', level: 'A2' },
    'write off': { phrase: 'write off', translation: '帳消しにする、見限る', level: 'B2' },
    'write up': { phrase: 'write up', translation: '書き上げる、まとめる', level: 'B2' },

    // --- Z ---
    'zip up': { phrase: 'zip up', translation: 'ジッパーを閉める', level: 'B1' },
};

/** Reverse index: base verb → list of phrasal verb keys (lazy-built, cached) */
let reverseIndex: Record<string, string[]> | null = null;

function buildReverseIndex(): Record<string, string[]> {
    if (reverseIndex) return reverseIndex;
    reverseIndex = {};
    for (const key of Object.keys(PHRASAL_VERBS)) {
        const baseVerb = key.split(' ')[0];
        if (!reverseIndex[baseVerb]) reverseIndex[baseVerb] = [];
        reverseIndex[baseVerb].push(key);
    }
    return reverseIndex;
}

/**
 * Normalize a phrase for lookup: lowercase, collapse whitespace, trim.
 */
function normalizePhrase(phrase: string): string {
    return phrase.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Look up a phrasal verb by exact phrase.
 */
export function lookupPhrasalVerb(phrase: string): PhrasalVerbEntry | null {
    const key = normalizePhrase(phrase);
    return PHRASAL_VERBS[key] || null;
}

/**
 * Get related phrasal verbs for a given word (base verb lookup).
 */
export function getRelatedPhrasalVerbs(word: string): PhrasalVerbEntry[] {
    const idx = buildReverseIndex();
    const base = word.toLowerCase().trim();
    const keys = idx[base];
    if (!keys) return [];
    return keys.map(k => PHRASAL_VERBS[k]);
}
