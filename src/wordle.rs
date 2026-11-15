//! Wordle Offline Engine
//! Zero-allocation compile-time embedded ASCII dictionary with binary search validation.
//! Two-pass duplicate-letter frequency evaluation algorithm.

use crate::rng::Rng;

pub const WORD_LEN: usize = 5;
pub const MAX_GUESSES: usize = 6;

// Alphabetically sorted for O(log N) binary search
pub const DICTIONARY: [&[u8; 5]; 1000] = [
    b"ABACK", b"ABASE", b"ABATE", b"ABBEY", b"ABBOT", b"ABHOR", b"ABIDE", b"ABODE", b"ABORT", b"ABOUT",
    b"ABOVE", b"ABUSE", b"ABYSS", b"ACORN", b"ACRID", b"ACTOR", b"ACUTE", b"ADAGE", b"ADAPT", b"ADDED",
    b"ADEPT", b"ADMIN", b"ADMIT", b"ADOBE", b"ADOPT", b"ADORE", b"ADORN", b"ADULT", b"AFFIX", b"AFIRE",
    b"AFOOT", b"AFOUL", b"AFTER", b"AGAIN", b"AGAPE", b"AGATE", b"AGENT", b"AGILE", b"AGING", b"AGLOW",
    b"AGONY", b"AGORA", b"AGREE", b"AHEAD", b"AIDER", b"AISLE", b"ALARM", b"ALBUM", b"ALERT", b"ALGAE",
    b"ALIAS", b"ALIBI", b"ALIEN", b"ALIGN", b"ALIKE", b"ALIVE", b"ALLAN", b"ALLAY", b"ALLEY", b"ALLOT",
    b"ALLOW", b"ALLOY", b"ALOFT", b"ALONE", b"ALONG", b"ALOOF", b"ALOUD", b"ALPHA", b"ALTAR", b"ALTER",
    b"AMASS", b"AMAZE", b"AMBER", b"AMBLE", b"AMEND", b"AMINO", b"AMISS", b"AMITY", b"AMONG", b"AMPLE",
    b"AMPLY", b"AMUSE", b"ANGEL", b"ANGER", b"ANGLE", b"ANGRY", b"ANGST", b"ANIME", b"ANKLE", b"ANNEX",
    b"ANNOY", b"ANNUL", b"ANODE", b"ANTIC", b"ANVIL", b"AORTA", b"APART", b"APHID", b"APING", b"APNEA",
    b"APPLE", b"APPLY", b"APRON", b"APTLY", b"ARBOR", b"ARDOR", b"ARENA", b"ARGUE", b"ARISE", b"ARMED",
    b"ARMOR", b"AROMA", b"AROSE", b"ARRAY", b"ARROW", b"ARSON", b"ASCOT", b"ASHEN", b"ASIDE", b"ASKEW",
    b"ASSAY", b"ASSET", b"ATLAS", b"ATOLL", b"ATONE", b"ATTIC", b"AUDIO", b"AUDIT", b"AUGUR", b"AVAIL",
    b"AVERT", b"AVIAN", b"AVOID", b"AWAIT", b"AWAKE", b"AWARD", b"AWARE", b"AWASH", b"AWFUL", b"AWOKE",
    b"AXIAL", b"AXIOM", b"BACON", b"BADGE", b"BADLY", b"BAKER", b"BARRY", b"BASED", b"BASES", b"BASIC",
    b"BASIN", b"BASIS", b"BATCH", b"BEACH", b"BEAST", b"BEGIN", b"BEGUN", b"BEING", b"BELLE", b"BELLY",
    b"BELOW", b"BENCH", b"BERRY", b"BETTY", b"BILLY", b"BINGO", b"BIRTH", b"BISON", b"BLACK", b"BLADE",
    b"BLAME", b"BLANK", b"BLAST", b"BLAZE", b"BLEND", b"BLESS", b"BLIND", b"BLINK", b"BLOCK", b"BLOOD",
    b"BLOOM", b"BLUES", b"BOARD", b"BOBBY", b"BONUS", b"BOOST", b"BOOTH", b"BOOTS", b"BOOTY", b"BOUND",
    b"BRAIN", b"BRAKE", b"BRAND", b"BRASS", b"BRAVE", b"BREAD", b"BREAK", b"BREED", b"BRICK", b"BRIDE",
    b"BRIEF", b"BRING", b"BROAD", b"BROKE", b"BROOK", b"BROWN", b"BRUSH", b"BUDDY", b"BUILD", b"BUILT",
    b"BUNCH", b"BUNNY", b"BURKE", b"BURST", b"BUYER", b"CABIN", b"CABLE", b"CACHE", b"CAMEL", b"CANAL",
    b"CANDY", b"CANON", b"CARGO", b"CAROL", b"CARRY", b"CATCH", b"CAUSE", b"CEDAR", b"CHAIN", b"CHAIR",
    b"CHAMP", b"CHAOS", b"CHARM", b"CHART", b"CHASE", b"CHEAP", b"CHEAT", b"CHECK", b"CHESS", b"CHEST",
    b"CHEVY", b"CHICK", b"CHIEF", b"CHILD", b"CHILE", b"CHINA", b"CHIPS", b"CHOIR", b"CHOSE", b"CHUCK",
    b"CISCO", b"CIVIC", b"CIVIL", b"CLAIM", b"CLASS", b"CLEAN", b"CLEAR", b"CLERK", b"CLICK", b"CLIFF",
    b"CLIMB", b"CLIPS", b"CLOCK", b"CLONE", b"CLOSE", b"CLOTH", b"CLOUD", b"COACH", b"COAST", b"COLIN",
    b"COLON", b"COLOR", b"COMES", b"COMIC", b"CORAL", b"CORPS", b"COSTA", b"COULD", b"COUNT", b"COURT",
    b"COVER", b"CRACK", b"CRAFT", b"CRANE", b"CRAPS", b"CRASH", b"CRAZY", b"CREAM", b"CREEK", b"CREST",
    b"CRIME", b"CROSS", b"CROWD", b"CROWN", b"CRUDE", b"CUBIC", b"CURVE", b"CYCLE", b"DADDY", b"DAILY",
    b"DAIRY", b"DAISY", b"DANCE", b"DEALT", b"DEATH", b"DEBUT", b"DELAY", b"DELTA", b"DENSE", b"DEPOT",
    b"DEPTH", b"DERBY", b"DEVIL", b"DIARY", b"DIGIT", b"DINGO", b"DIRTY", b"DODGE", b"DOING", b"DONNA",
    b"DONOR", b"DOUBT", b"DOVER", b"DOZEN", b"DRAFT", b"DRAIN", b"DRAMA", b"DRAWN", b"DREAM", b"DRESS",
    b"DRIED", b"DRIFT", b"DRILL", b"DRINK", b"DRIVE", b"DROVE", b"DRUNK", b"DUTCH", b"DYING", b"EAGLE",
    b"EARLY", b"EARTH", b"EBONY", b"EIGHT", b"ELDER", b"ELECT", b"ELFIN", b"ELITE", b"EMBER", b"EMPTY",
    b"ENDED", b"ENEMY", b"ENJOY", b"ENTER", b"ENTRY", b"EQUAL", b"ERROR", b"ESSAY", b"EVENT", b"EVERY",
    b"EXACT", b"EXCEL", b"EXIST", b"EXTRA", b"FACED", b"FAIRY", b"FAITH", b"FALSE", b"FANCY", b"FATAL",
    b"FATTY", b"FAULT", b"FAVOR", b"FENCE", b"FERRY", b"FEVER", b"FIBER", b"FIELD", b"FIFTH", b"FIFTY",
    b"FIGHT", b"FINAL", b"FIRED", b"FIRST", b"FIXED", b"FLAME", b"FLASH", b"FLEET", b"FLESH", b"FLOAT",
    b"FLOOD", b"FLOOR", b"FLOUR", b"FLUID", b"FLUSH", b"FLUTE", b"FLYER", b"FOCAL", b"FOCUS", b"FORCE",
    b"FORGE", b"FORTH", b"FORTY", b"FORUM", b"FOUND", b"FRAME", b"FRANK", b"FRAUD", b"FRESH", b"FRONT",
    b"FROST", b"FRUIT", b"FULLY", b"FUNDS", b"FUNKY", b"FUNNY", b"FUZZY", b"GAINS", b"GAMMA", b"GAUGE",
    b"GECKO", b"GENRE", b"GHOST", b"GIANT", b"GIVEN", b"GLASS", b"GLIDE", b"GLOBE", b"GLORY", b"GNOME",
    b"GOING", b"GOODS", b"GRACE", b"GRADE", b"GRAIN", b"GRAND", b"GRANT", b"GRAPE", b"GRAPH", b"GRASS",
    b"GRAVE", b"GREAT", b"GREEN", b"GRILL", b"GROSS", b"GROUP", b"GROVE", b"GROWN", b"GUARD", b"GUESS",
    b"GUEST", b"GUIDE", b"GUILD", b"HAIRY", b"HANDY", b"HAPPY", b"HARRY", b"HASTE", b"HAVEN", b"HEART",
    b"HEATH", b"HEAVY", b"HELLO", b"HENCE", b"HENRY", b"HIRED", b"HOBBY", b"HOLLY", b"HONDA", b"HONEY",
    b"HONOR", b"HOPED", b"HORSE", b"HOTEL", b"HOUSE", b"HUMAN", b"HUMOR", b"HYDRA", b"IDEAL", b"IGLOO",
    b"IMAGE", b"INDEX", b"INNER", b"INPUT", b"INTER", b"ISSUE", b"IVORY", b"JAPAN", b"JAZZY", b"JEANS",
    b"JENNY", b"JERRY", b"JEWEL", b"JIMMY", b"JOINT", b"JUDGE", b"JUICE", b"JUMBO", b"KARMA", b"KELLY",
    b"KERRY", b"KITTY", b"KNEEL", b"KNIFE", b"KNOCK", b"KNOWN", b"KOALA", b"LABEL", b"LABOR", b"LADEN",
    b"LANCE", b"LARGE", b"LASER", b"LATER", b"LATEX", b"LAUGH", b"LAURA", b"LAYER", b"LEARN", b"LEASE",
    b"LEAST", b"LEAVE", b"LEGAL", b"LEMON", b"LEVEL", b"LEWIS", b"LIGHT", b"LIMIT", b"LINED", b"LINKS",
    b"LIVED", b"LIVER", b"LOBBY", b"LOCAL", b"LODGE", b"LOGIC", b"LOGIN", b"LOGOS", b"LOOSE", b"LOTUS",
    b"LOVER", b"LOWER", b"LUCKY", b"LUNAR", b"LUNCH", b"LYING", b"LYRIC", b"MACRO", b"MAGIC", b"MAJOR",
    b"MAKER", b"MAMBO", b"MANGA", b"MANGO", b"MANOR", b"MAPLE", b"MARCH", b"MARIA", b"MARSH", b"MASON",
    b"MATCH", b"MAYBE", b"MAYOR", b"MEANT", b"MEDAL", b"MEDIA", b"MERCY", b"MERGE", b"MERIT", b"MERRY",
    b"METAL", b"METER", b"MICRO", b"MIGHT", b"MINES", b"MINOR", b"MINUS", b"MIRTH", b"MIXED", b"MIXER",
    b"MODEL", b"MONEY", b"MONTE", b"MONTH", b"MORAL", b"MOTEL", b"MOTOR", b"MOUNT", b"MOUSE", b"MOUTH",
    b"MOVIE", b"MUSIC", b"NAKED", b"NANCY", b"NASTY", b"NAVAL", b"NEEDS", b"NERVE", b"NEVER", b"NEWLY",
    b"NIGHT", b"NINJA", b"NOBLE", b"NOISE", b"NORTH", b"NOTED", b"NOVEL", b"NURSE", b"NYLON", b"NYMPH",
    b"OASIS", b"OCCUR", b"OCEAN", b"OFFER", b"OFTEN", b"OLDER", b"OLIVE", b"OMEGA", b"ONION", b"OPERA",
    b"ORBIT", b"ORDER", b"ORGAN", b"OTHER", b"OTTER", b"OUGHT", b"OUTER", b"OWNER", b"OXIDE", b"OZONE",
    b"PAINT", b"PANDA", b"PANEL", b"PANIC", b"PANTS", b"PAPER", b"PARTY", b"PASTE", b"PATCH", b"PATIO",
    b"PEACE", b"PEACH", b"PEARL", b"PENNY", b"PERRY", b"PETER", b"PHASE", b"PHONE", b"PHOTO", b"PIANO",
    b"PIECE", b"PILOT", b"PITCH", b"PIXEL", b"PIZZA", b"PLACE", b"PLAIN", b"PLANE", b"PLANT", b"PLATE",
    b"PLAZA", b"POINT", b"POKER", b"POLAR", b"POUND", b"POWER", b"PRESS", b"PRICE", b"PRIDE", b"PRIME",
    b"PRINT", b"PRIOR", b"PRISM", b"PRIZE", b"PROBE", b"PROOF", b"PROVE", b"PROXY", b"PULSE", b"PUNCH",
    b"PUPPY", b"PURSE", b"QUARK", b"QUEEN", b"QUERY", b"QUEST", b"QUEUE", b"QUICK", b"QUIET", b"QUILT",
    b"QUITE", b"QUOTA", b"QUOTE", b"RADAR", b"RADIO", b"RAISE", b"RALLY", b"RALPH", b"RANCH", b"RANDY",
    b"RANGE", b"RAPID", b"RATED", b"RATIO", b"RAVEN", b"REACH", b"READY", b"REALM", b"REBEL", b"REFER",
    b"RELAX", b"RELAY", b"REMIX", b"RENEW", b"REPLY", b"RESET", b"RHINO", b"RIDER", b"RIDGE", b"RIGHT",
    b"RIVER", b"ROAST", b"ROBIN", b"ROBOT", b"ROCKY", b"ROGER", b"ROUGE", b"ROUGH", b"ROUND", b"ROUTE",
    b"ROVER", b"ROYAL", b"RURAL", b"SAINT", b"SALAD", b"SALLY", b"SALON", b"SAMBA", b"SANDY", b"SATIN",
    b"SAUCE", b"SAVED", b"SAVER", b"SCALE", b"SCARY", b"SCENE", b"SCOOP", b"SCOPE", b"SCORE", b"SCOUT",
    b"SCREW", b"SENSE", b"SERUM", b"SERVE", b"SETUP", b"SEVEN", b"SHADE", b"SHAFT", b"SHAKE", b"SHALL",
    b"SHAME", b"SHAPE", b"SHARE", b"SHARK", b"SHARP", b"SHEEP", b"SHEER", b"SHEET", b"SHELF", b"SHELL",
    b"SHIFT", b"SHINE", b"SHIRT", b"SHOCK", b"SHOOT", b"SHORE", b"SHORT", b"SHOWN", b"SIDES", b"SIGHT",
    b"SIGMA", b"SILLY", b"SINCE", b"SIXTH", b"SIZED", b"SIZES", b"SKILL", b"SKIRT", b"SLATE", b"SLAVE",
    b"SLEEP", b"SLIDE", b"SLOPE", b"SMALL", b"SMART", b"SMELL", b"SMILE", b"SMITH", b"SMOKE", b"SNAKE",
    b"SOLAR", b"SOLID", b"SOLVE", b"SONIC", b"SORRY", b"SOUND", b"SOUTH", b"SPACE", b"SPANK", b"SPARE",
    b"SPARK", b"SPEAK", b"SPECS", b"SPEED", b"SPELL", b"SPEND", b"SPENT", b"SPERM", b"SPICE", b"SPINE",
    b"SPLIT", b"SPOKE", b"SPORT", b"SPRAY", b"SQUAD", b"STACK", b"STAFF", b"STAGE", b"STAKE", b"STAMP",
    b"STAND", b"STARE", b"START", b"STATE", b"STAYS", b"STEAL", b"STEAM", b"STEEL", b"STICK", b"STILL",
    b"STOCK", b"STONE", b"STOOD", b"STORE", b"STORM", b"STORY", b"STRAP", b"STRIP", b"STUCK", b"STUDY",
    b"STUFF", b"STYLE", b"SUGAR", b"SUITE", b"SUNNY", b"SUPER", b"SURGE", b"SWEET", b"SWIFT", b"SWING",
    b"SWISS", b"SWORD", b"TABLE", b"TAKEN", b"TALES", b"TASTE", b"TEACH", b"TEENS", b"TEETH", b"TEMPO",
    b"TERRY", b"THANK", b"THEFT", b"THEIR", b"THEME", b"THERE", b"THESE", b"THETA", b"THICK", b"THING",
    b"THINK", b"THIRD", b"THONG", b"THOSE", b"THREE", b"THROW", b"THUMB", b"TIGER", b"TIGHT", b"TIMER",
    b"TIMES", b"TIRED", b"TITAN", b"TITLE", b"TODAY", b"TOKEN", b"TOMMY", b"TONER", b"TOOTH", b"TOPAZ",
    b"TOPIC", b"TOTAL", b"TOUCH", b"TOUGH", b"TOWER", b"TOXIC", b"TRACE", b"TRACK", b"TRACT", b"TRADE",
    b"TRAIL", b"TRAIN", b"TRASH", b"TREAT", b"TREND", b"TRIAL", b"TRIBE", b"TRICK", b"TRIED", b"TROUT",
    b"TRUCK", b"TRULY", b"TRUNK", b"TRUST", b"TRUTH", b"TUMOR", b"TUNER", b"TURBO", b"TURNS", b"TWICE",
    b"TWIST", b"ULTRA", b"UNCLE", b"UNDER", b"UNION", b"UNITY", b"UNTIL", b"UPPER", b"UPSET", b"URBAN",
    b"USAGE", b"USUAL", b"VALID", b"VALOR", b"VALUE", b"VALVE", b"VAPOR", b"VAULT", b"VENUE", b"VERSE",
    b"VIDEO", b"VILLA", b"VINYL", b"VIPER", b"VIRAL", b"VIRUS", b"VISIT", b"VISTA", b"VITAL", b"VOCAL",
    b"VOICE", b"WAGES", b"WAGON", b"WASTE", b"WATCH", b"WATER", b"WEIRD", b"WELSH", b"WHALE", b"WHATS",
    b"WHEAT", b"WHEEL", b"WHERE", b"WHICH", b"WHILE", b"WHITE", b"WHOLE", b"WHOSE", b"WIDTH", b"WIRED",
    b"WITCH", b"WOMAN", b"WORKS", b"WORLD", b"WORRY", b"WORSE", b"WORST", b"WORTH", b"WOULD", b"WOUND",
    b"WRIST", b"WRITE", b"WRONG", b"WROTE", b"YACHT", b"YEAST", b"YIELD", b"YOUNG", b"YOURS", b"YOUTH",
];

pub struct Wordle {
    pub target: [u8; WORD_LEN],
    pub guesses: [[u8; WORD_LEN]; MAX_GUESSES],
    pub evals: [[u8; WORD_LEN]; MAX_GUESSES], // 0: Absent, 1: Present, 2: Correct
    pub guess_count: usize,
    pub key_states: [u8; 26], // 0: Untested, 1: Absent, 2: Present, 3: Correct
    pub state: u8,            // 0: Playing, 1: Won, 2: Lost
    rng: Rng,
}

impl Wordle {
    pub const fn new(seed: u64) -> Self {
        Self {
            target: *DICTIONARY[0],
            guesses: [[0; WORD_LEN]; MAX_GUESSES],
            evals: [[0; WORD_LEN]; MAX_GUESSES],
            guess_count: 0,
            key_states: [0; 26],
            state: 0,
            rng: Rng::new(seed),
        }
    }

    pub fn reset(&mut self, seed: u64) {
        self.rng.seed(seed);
        let idx = self.rng.next_bounded(DICTIONARY.len() as u32) as usize;
        self.target = *DICTIONARY[idx];
        self.guesses = [[0; WORD_LEN]; MAX_GUESSES];
        self.evals = [[0; WORD_LEN]; MAX_GUESSES];
        self.guess_count = 0;
        self.key_states = [0; 26];
        self.state = 0;
    }

    pub fn is_valid_word(word: &[u8; WORD_LEN]) -> bool {
        DICTIONARY.binary_search(&word).is_ok()
    }

    /// Evaluates a 5-letter guess with two-pass duplicate letter accounting
    pub fn submit_guess(&mut self, guess: &[u8; WORD_LEN]) -> bool {
        if self.state != 0 || self.guess_count >= MAX_GUESSES {
            return false;
        }

        let mut evaluation = [0u8; WORD_LEN];
        let mut target_counts = [0u8; 26];

        for &b in &self.target {
            if b >= b'A' && b <= b'Z' {
                target_counts[(b - b'A') as usize] += 1;
            }
        }

        // Pass 1: Match Exact Greens (Correct spot)
        for i in 0..WORD_LEN {
            if guess[i] == self.target[i] {
                evaluation[i] = 2; // Correct
                let letter_idx = (guess[i] - b'A') as usize;
                target_counts[letter_idx] -= 1;
                self.key_states[letter_idx] = 3; // Correct on keyboard
            }
        }

        // Pass 2: Match Yellows (Present) and Grays (Absent)
        for i in 0..WORD_LEN {
            if evaluation[i] == 2 {
                continue;
            }
            let letter_idx = (guess[i] - b'A') as usize;
            if target_counts[letter_idx] > 0 {
                evaluation[i] = 1; // Present
                target_counts[letter_idx] -= 1;
                if self.key_states[letter_idx] < 2 {
                    self.key_states[letter_idx] = 2; // Present on keyboard
                }
            } else {
                evaluation[i] = 0; // Absent
                if self.key_states[letter_idx] == 0 {
                    self.key_states[letter_idx] = 1; // Absent on keyboard
                }
            }
        }

        self.guesses[self.guess_count] = *guess;
        self.evals[self.guess_count] = evaluation;
        self.guess_count += 1;

        if evaluation == [2, 2, 2, 2, 2] {
            self.state = 1; // Won
        } else if self.guess_count >= MAX_GUESSES {
            self.state = 2; // Lost
        }

        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wordle_evaluation() {
        let mut w = Wordle::new(1);
        w.target = *b"APPLE";

        // Guess with duplicate P: 'PAPER'
        // P -> yellow (target has P at 1,2), A -> yellow, P -> yellow, E -> yellow, R -> gray
        assert!(w.submit_guess(b"CRANE"));
        assert_eq!(w.guess_count, 1);
        assert_eq!(w.state, 0);

        // Exact match
        assert!(w.submit_guess(b"APPLE"));
        assert_eq!(w.state, 1); // Won
        assert_eq!(w.evals[1], [2, 2, 2, 2, 2]);
    }

    #[test]
    fn test_dictionary_is_sorted() {
        for i in 0..DICTIONARY.len() - 1 {
            assert!(DICTIONARY[i] < DICTIONARY[i + 1], "Dictionary not sorted at index {}", i);
        }
    }

    #[test]
    fn test_wordle_expanded_common_words() {
        assert!(Wordle::is_valid_word(b"SLATE"));
        assert!(Wordle::is_valid_word(b"ROAST"));
        assert!(Wordle::is_valid_word(b"AUDIO"));
        assert!(Wordle::is_valid_word(b"CRANE"));
        assert!(Wordle::is_valid_word(b"LIGHT"));
    }
}
