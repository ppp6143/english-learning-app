/**
 * Pure JavaScript lemmatizer — no external dependencies.
 * Handles English word inflections via comprehensive suffix rules
 * and an irregular forms dictionary.
 */

// Common irregular verb forms → base form
const IRREGULAR_VERBS: Record<string, string> = {
    // be
    am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
    // have
    has: 'have', had: 'have', having: 'have',
    // do
    does: 'do', did: 'do', done: 'do', doing: 'do',
    // go
    goes: 'go', went: 'go', gone: 'go', going: 'go',
    // say
    says: 'say', said: 'say',
    // get
    gets: 'get', got: 'get', gotten: 'get', getting: 'get',
    // make
    makes: 'make', made: 'make', making: 'make',
    // know
    knows: 'know', knew: 'know', known: 'know',
    // think
    thinks: 'think', thought: 'think', thinking: 'think',
    // take
    takes: 'take', took: 'take', taken: 'take', taking: 'take',
    // see
    sees: 'see', saw: 'see', seen: 'see', seeing: 'see',
    // come
    comes: 'come', came: 'come', coming: 'come',
    // give
    gives: 'give', gave: 'give', given: 'give', giving: 'give',
    // find
    finds: 'find', found: 'find', finding: 'find',
    // tell
    tells: 'tell', told: 'tell', telling: 'tell',
    // become
    becomes: 'become', became: 'become', becoming: 'become',
    // leave
    leaves: 'leave', left: 'leave', leaving: 'leave',
    // feel
    feels: 'feel', felt: 'feel', feeling: 'feel',
    // put
    puts: 'put', putting: 'put',
    // bring
    brings: 'bring', brought: 'bring', bringing: 'bring',
    // begin
    begins: 'begin', began: 'begin', begun: 'begin', beginning: 'begin',
    // keep
    keeps: 'keep', kept: 'keep', keeping: 'keep',
    // hold
    holds: 'hold', held: 'hold', holding: 'hold',
    // write
    writes: 'write', wrote: 'write', written: 'write', writing: 'write',
    // stand
    stands: 'stand', stood: 'stand', standing: 'stand',
    // hear
    hears: 'hear', heard: 'hear', hearing: 'hear',
    // let
    lets: 'let', letting: 'let',
    // mean
    means: 'mean', meant: 'mean', meaning: 'mean',
    // set
    sets: 'set', setting: 'set',
    // meet
    meets: 'meet', met: 'meet', meeting: 'meet',
    // run
    runs: 'run', ran: 'run', running: 'run',
    // pay
    pays: 'pay', paid: 'pay', paying: 'pay',
    // sit
    sits: 'sit', sat: 'sit', sitting: 'sit',
    // speak
    speaks: 'speak', spoke: 'speak', spoken: 'speak', speaking: 'speak',
    // read
    reads: 'read', reading: 'read',
    // grow
    grows: 'grow', grew: 'grow', grown: 'grow', growing: 'grow',
    // lose
    loses: 'lose', lost: 'lose', losing: 'lose',
    // fall
    falls: 'fall', fell: 'fall', fallen: 'fall', falling: 'fall',
    // send
    sends: 'send', sent: 'send', sending: 'send',
    // build
    builds: 'build', built: 'build', building: 'build',
    // understand
    understands: 'understand', understood: 'understand', understanding: 'understand',
    // draw
    draws: 'draw', drew: 'draw', drawn: 'draw', drawing: 'draw',
    // break
    breaks: 'break', broke: 'break', broken: 'break', breaking: 'break',
    // spend
    spends: 'spend', spent: 'spend', spending: 'spend',
    // cut
    cuts: 'cut', cutting: 'cut',
    // rise
    rises: 'rise', rose: 'rise', risen: 'rise', rising: 'rise',
    // drive
    drives: 'drive', drove: 'drive', driven: 'drive', driving: 'drive',
    // buy
    buys: 'buy', bought: 'buy', buying: 'buy',
    // wear
    wears: 'wear', wore: 'wear', worn: 'wear', wearing: 'wear',
    // choose
    chooses: 'choose', chose: 'choose', chosen: 'choose', choosing: 'choose',
    // seek
    seeks: 'seek', sought: 'seek', seeking: 'seek',
    // throw
    throws: 'throw', threw: 'throw', thrown: 'throw', throwing: 'throw',
    // catch
    catches: 'catch', caught: 'catch', catching: 'catch',
    // deal
    deals: 'deal', dealt: 'deal', dealing: 'deal',
    // win
    wins: 'win', won: 'win', winning: 'win',
    // teach
    teaches: 'teach', taught: 'teach', teaching: 'teach',
    // show
    shows: 'show', showed: 'show', shown: 'show', showing: 'show',
    // sing
    sings: 'sing', sang: 'sing', sung: 'sing', singing: 'sing',
    // eat
    eats: 'eat', ate: 'eat', eaten: 'eat', eating: 'eat',
    // fly
    flies: 'fly', flew: 'fly', flown: 'fly', flying: 'fly',
    // lie
    lies: 'lie', lay: 'lie', lain: 'lie', lying: 'lie',
    // lead
    leads: 'lead', led: 'lead', leading: 'lead',
    // fight
    fights: 'fight', fought: 'fight', fighting: 'fight',
    // sell
    sells: 'sell', sold: 'sell', selling: 'sell',
    // forget
    forgets: 'forget', forgot: 'forget', forgotten: 'forget', forgetting: 'forget',
    // sleep
    sleeps: 'sleep', slept: 'sleep', sleeping: 'sleep',
    // drink
    drinks: 'drink', drank: 'drink', drunk: 'drink', drinking: 'drink',
    // swim
    swims: 'swim', swam: 'swim', swum: 'swim', swimming: 'swim',
    // wake
    wakes: 'wake', woke: 'wake', woken: 'wake', waking: 'wake',
    // bite
    bites: 'bite', bit: 'bite', bitten: 'bite', biting: 'bite',
    // hide
    hides: 'hide', hid: 'hide', hidden: 'hide', hiding: 'hide',
    // shake
    shakes: 'shake', shook: 'shake', shaken: 'shake', shaking: 'shake',
    // shut
    shuts: 'shut', shutting: 'shut',
    // ring
    rings: 'ring', rang: 'ring', rung: 'ring', ringing: 'ring',
    // steal
    steals: 'steal', stole: 'steal', stolen: 'steal', stealing: 'steal',
    // blow
    blows: 'blow', blew: 'blow', blown: 'blow', blowing: 'blow',
    // dig
    digs: 'dig', dug: 'dig', digging: 'dig',
    // hang
    hangs: 'hang', hung: 'hang', hanging: 'hang',
    // strike
    strikes: 'strike', struck: 'strike', striking: 'strike',
    // freeze
    freezes: 'freeze', froze: 'freeze', frozen: 'freeze', freezing: 'freeze',
    // tear
    tears: 'tear', tore: 'tear', torn: 'tear', tearing: 'tear',
    // feed
    feeds: 'feed', fed: 'feed', feeding: 'feed',
    // swear
    swears: 'swear', swore: 'swear', sworn: 'swear', swearing: 'swear',
    // spread
    spreads: 'spread', spreading: 'spread',
    // bet
    bets: 'bet', betting: 'bet',
    // quit
    quits: 'quit', quitting: 'quit',
    // hurt
    hurts: 'hurt', hurting: 'hurt',
};

// Common irregular noun plurals → singular
const IRREGULAR_NOUNS: Record<string, string> = {
    children: 'child', men: 'man', women: 'woman', people: 'person',
    teeth: 'tooth', feet: 'foot', mice: 'mouse', geese: 'goose',
    oxen: 'ox', dice: 'die', lives: 'life', wives: 'wife',
    knives: 'knife', halves: 'half', shelves: 'shelf', thieves: 'thief',
    loaves: 'loaf', leaves: 'leaf', wolves: 'wolf', selves: 'self',
    calves: 'calf', elves: 'elf',
    phenomena: 'phenomenon', criteria: 'criterion', analyses: 'analysis',
    diagnoses: 'diagnosis', theses: 'thesis', hypotheses: 'hypothesis',
    cacti: 'cactus', fungi: 'fungus', alumni: 'alumnus',
    stimuli: 'stimulus', syllabi: 'syllabus', nuclei: 'nucleus',
    indices: 'index', appendices: 'appendix', matrices: 'matrix',
    vertices: 'vertex',
};

// Irregular adjective/adverb comparatives and superlatives
const IRREGULAR_ADJECTIVES: Record<string, string> = {
    better: 'good', best: 'good',
    worse: 'bad', worst: 'bad',
    more: 'much', most: 'much',
    less: 'little', least: 'little',
    further: 'far', furthest: 'far',
    farther: 'far', farthest: 'far',
    elder: 'old', eldest: 'old',
    bigger: 'big', biggest: 'big',
    larger: 'large', largest: 'large',
};

/**
 * Apply suffix-based stemming rules to get candidate base forms.
 */
function applySuffixRules(word: string): string[] {
    const candidates: string[] = [];
    const w = word.toLowerCase();

    // -ing forms
    if (w.endsWith('ing') && w.length > 4) {
        // running → run (double consonant)
        if (w.length > 5 && w[w.length - 4] === w[w.length - 5]) {
            candidates.push(w.slice(0, -4));
        }
        // making → make (drop e)
        candidates.push(w.slice(0, -3) + 'e');
        // walking → walk
        candidates.push(w.slice(0, -3));
        // lying → lie (y→ie)
        if (w.endsWith('ying')) {
            candidates.push(w.slice(0, -4) + 'ie');
        }
    }

    // -ed forms
    if (w.endsWith('ed') && w.length > 3) {
        // stopped → stop (double consonant)
        if (w.length > 4 && w[w.length - 3] === w[w.length - 4]) {
            candidates.push(w.slice(0, -3));
        }
        // loved → love (just remove d)
        candidates.push(w.slice(0, -1));
        // walked → walk (remove ed)
        candidates.push(w.slice(0, -2));
        // tried → try (ied → y)
        if (w.endsWith('ied')) {
            candidates.push(w.slice(0, -3) + 'y');
        }
    }

    // -s / -es plurals and 3rd person
    if (w.endsWith('ies') && w.length > 4) {
        candidates.push(w.slice(0, -3) + 'y'); // cities → city
    }
    if (w.endsWith('ves') && w.length > 4) {
        candidates.push(w.slice(0, -3) + 'f');  // knives → knif (→ knife handled by -fe)
        candidates.push(w.slice(0, -3) + 'fe'); // knives → knife
    }
    if (w.endsWith('ses') || w.endsWith('xes') || w.endsWith('zes') ||
        w.endsWith('ches') || w.endsWith('shes')) {
        candidates.push(w.slice(0, -2)); // boxes → box, watches → watch
    }
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
        candidates.push(w.slice(0, -1)); // cats → cat
    }

    // -er / -est (comparatives/superlatives)
    if (w.endsWith('er') && w.length > 3) {
        candidates.push(w.slice(0, -2)); // taller → tall
        candidates.push(w.slice(0, -1)); // nicer → nice
        if (w.length > 4 && w[w.length - 3] === w[w.length - 4]) {
            candidates.push(w.slice(0, -3)); // bigger → big
        }
    }
    if (w.endsWith('est') && w.length > 4) {
        candidates.push(w.slice(0, -3)); // tallest → tall
        candidates.push(w.slice(0, -2)); // nicest → nice
        if (w.length > 5 && w[w.length - 4] === w[w.length - 5]) {
            candidates.push(w.slice(0, -4)); // biggest → big
        }
    }

    // -ly (adverbs)
    if (w.endsWith('ly') && w.length > 4) {
        candidates.push(w.slice(0, -2)); // quickly → quick
        if (w.endsWith('ily')) {
            candidates.push(w.slice(0, -3) + 'y'); // happily → happy
        }
        if (w.endsWith('ally')) {
            candidates.push(w.slice(0, -4) + 'al'); // basically → basic (no: basal→basic)
            candidates.push(w.slice(0, -2)); // basically → basical (then try -al)
        }
    }

    // -ment, -tion, -sion, -ness (nominalization)
    if (w.endsWith('ment') && w.length > 5) {
        candidates.push(w.slice(0, -4)); // government → govern
    }
    if (w.endsWith('tion') && w.length > 5) {
        candidates.push(w.slice(0, -4)); // action → act
        candidates.push(w.slice(0, -4) + 'e'); // decoration → decorate
        candidates.push(w.slice(0, -5) + 'e'); // decision → decide (→ decis → N/A)
    }
    if (w.endsWith('sion') && w.length > 5) {
        candidates.push(w.slice(0, -4) + 'd'); // decision → decided? 
        candidates.push(w.slice(0, -4) + 'de'); // decision → decide
        candidates.push(w.slice(0, -4) + 't'); // permission → permit
    }
    if (w.endsWith('ness') && w.length > 5) {
        candidates.push(w.slice(0, -4)); // darkness → dark
        if (w.endsWith('iness')) {
            candidates.push(w.slice(0, -5) + 'y'); // happiness → happy
        }
    }

    // -able / -ible
    if (w.endsWith('able') && w.length > 5) {
        candidates.push(w.slice(0, -4)); // comfortable → comfort
        candidates.push(w.slice(0, -4) + 'e'); // lovable → love
    }
    if (w.endsWith('ible') && w.length > 5) {
        candidates.push(w.slice(0, -4)); // possible → poss
        candidates.push(w.slice(0, -4) + 'e');
    }

    // -ful / -less
    if (w.endsWith('ful') && w.length > 4) {
        candidates.push(w.slice(0, -3)); // beautiful → beauti
        if (w.endsWith('iful')) {
            candidates.push(w.slice(0, -4) + 'y'); // beautiful → beauty
        }
    }
    if (w.endsWith('less') && w.length > 5) {
        candidates.push(w.slice(0, -4)); // homeless → home
    }

    // -ous
    if (w.endsWith('ous') && w.length > 4) {
        candidates.push(w.slice(0, -3)); // famous → fam
        candidates.push(w.slice(0, -3) + 'e'); // adventurous → adventure
        if (w.endsWith('ious')) {
            candidates.push(w.slice(0, -4) + 'y'); // mysterious → mystery
        }
    }

    // -ive
    if (w.endsWith('ive') && w.length > 4) {
        candidates.push(w.slice(0, -3)); // creative → creat
        candidates.push(w.slice(0, -3) + 'e'); // creative → create
    }

    return candidates;
}

/**
 * Get lemmatized candidates for a word (synchronous, pure JS).
 * Returns an array of possible base forms.
 */
export function getLemmatizedCandidates(word: string): string[] {
    const w = word.toLowerCase();
    const candidates: string[] = [w];

    // Check irregular forms first
    if (IRREGULAR_VERBS[w]) candidates.push(IRREGULAR_VERBS[w]);
    if (IRREGULAR_NOUNS[w]) candidates.push(IRREGULAR_NOUNS[w]);
    if (IRREGULAR_ADJECTIVES[w]) candidates.push(IRREGULAR_ADJECTIVES[w]);

    // Apply suffix rules
    candidates.push(...applySuffixRules(w));

    // Deduplicate and filter empties
    return [...new Set(candidates.filter(c => c.length > 1))];
}

/**
 * Async version — same as sync since we no longer use compromise.
 * Kept for API compatibility.
 */
export async function getLemmatizedCandidatesAsync(word: string): Promise<string[]> {
    return getLemmatizedCandidates(word);
}
