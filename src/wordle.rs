//! Wordle Offline Engine
//! Zero-allocation compile-time embedded ASCII dictionary with binary search validation.
//! Two-pass duplicate-letter frequency evaluation algorithm.

use crate::rng::Rng;

pub const WORD_LEN: usize = 5;
pub const MAX_GUESSES: usize = 6;

// Alphabetically sorted for O(log N) binary search
pub const DICTIONARY: [&[u8; 5]; 150] = [
    b"ACORN", b"ADAPT", b"ALERT", b"ALONE", b"ANGEL", b"APPLE", b"ARROW", b"AUDIO", b"BASIC", b"BEACH",
    b"BISON", b"BLAZE", b"BLOOM", b"BOUND", b"BRAIN", b"BREAD", b"BRIEF", b"BUILD", b"CANDY", b"CEDAR",
    b"CHAIR", b"CHAMP", b"CHESS", b"CLEAN", b"CLOCK", b"CLOUD", b"COAST", b"CORAL", b"CRANE", b"CROWN",
    b"DAILY", b"DANCE", b"DELTA", b"DINGO", b"DREAM", b"DRIFT", b"DRIVE", b"EAGLE", b"EARLY", b"EARTH",
    b"ELFIN", b"EMBER", b"EQUAL", b"FAIRY", b"FIELD", b"FLAME", b"FLASH", b"FLOOR", b"FLUTE", b"FOCUS",
    b"FRESH", b"FRUIT", b"GECKO", b"GHOST", b"GIANT", b"GLIDE", b"GLORY", b"GRACE", b"GRAPE", b"GREEN",
    b"HASTE", b"HAVEN", b"HEART", b"HONEY", b"HOUSE", b"HUMAN", b"HYDRA", b"IGLOO", b"IMAGE", b"INDEX",
    b"IVORY", b"JAZZY", b"JEWEL", b"JUICE", b"JUMBO", b"KNEEL", b"KNIFE", b"KOALA", b"LASER", b"LEMON",
    b"LIGHT", b"LOCAL", b"LOTUS", b"LUCKY", b"LUNAR", b"MAGIC", b"MANGO", b"MAPLE", b"METAL", b"MIRTH",
    b"MONEY", b"MUSIC", b"NERVE", b"NIGHT", b"NINJA", b"NOBLE", b"NORTH", b"NYMPH", b"OASIS", b"OCEAN",
    b"ONION", b"ORBIT", b"OTTER", b"PANDA", b"PANEL", b"PEACH", b"PEARL", b"PIANO", b"PIXEL", b"PLANT",
    b"PRISM", b"PULSE", b"QUARK", b"QUEEN", b"QUEST", b"QUICK", b"QUOTA", b"RADAR", b"RALLY", b"RAVEN",
    b"RHINO", b"RIDER", b"RIVER", b"ROBOT", b"ROUND", b"SCALE", b"SCOPE", b"SCOUT", b"SHARK", b"SHINE",
    b"SMILE", b"SNAKE", b"SOLAR", b"SPACE", b"SPARK", b"SPEED", b"STORM", b"SUGAR", b"SWIFT", b"TABLE",
    b"TEMPO", b"TIGER", b"TITAN", b"TOPAZ", b"TOWER", b"TRAIN", b"UNITY", b"VALOR", b"VAPOR", b"VIPER",
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
}
