//! Bitmask MRV Sudoku Solver & Generator
//! Uses 9-bit bitmask constraint sets (u16) and hardware POPCNT for fast solving.
//! Generates strictly unique-solution puzzles with zero heap allocation.

use crate::rng::Rng;

pub struct Sudoku {
    pub initial: [u8; 81],
    pub board: [u8; 81],
    pub solution: [u8; 81],
    pub notes: [u16; 81],
    pub mistakes: u8,
    pub is_won: bool,
    pub is_game_over: bool,
    rng: Rng,
}

impl Sudoku {
    pub const fn new(seed: u64) -> Self {
        Self {
            initial: [0; 81],
            board: [0; 81],
            solution: [0; 81],
            notes: [0; 81],
            mistakes: 0,
            is_won: false,
            is_game_over: false,
            rng: Rng::new(seed),
        }
    }

    #[inline]
    pub fn box_idx(r: usize, c: usize) -> usize {
        (r / 3) * 3 + (c / 3)
    }

    #[inline]
    pub fn get_candidates(board: &[u8; 81], r: usize, c: usize) -> u16 {
        let mut used = 0u16;
        let b_idx = Self::box_idx(r, c);

        for i in 0..9 {
            let row_val = board[r * 9 + i];
            if row_val > 0 {
                used |= 1 << row_val;
            }
            let col_val = board[i * 9 + c];
            if col_val > 0 {
                used |= 1 << col_val;
            }
            let box_r = (b_idx / 3) * 3 + (i / 3);
            let box_c = (b_idx % 3) * 3 + (i % 3);
            let box_val = board[box_r * 9 + box_c];
            if box_val > 0 {
                used |= 1 << box_val;
            }
        }

        // Bits 1..=9 are valid
        0x03FE & !used
    }

    /// Solves the board using MRV (Minimum Remaining Values). Returns number of solutions (up to limit).
    pub fn count_solutions(board: &mut [u8; 81], limit: u32) -> u32 {
        let mut min_candidates = 10;
        let mut best_cell = None;

        for r in 0..9 {
            for c in 0..9 {
                let idx = r * 9 + c;
                if board[idx] == 0 {
                    let cand = Self::get_candidates(board, r, c);
                    let count = cand.count_ones();
                    if count == 0 {
                        return 0; // Dead end
                    }
                    if count < min_candidates {
                        min_candidates = count;
                        best_cell = Some((idx, cand));
                        if count == 1 {
                            break;
                        }
                    }
                }
            }
            if min_candidates == 1 {
                break;
            }
        }

        let (idx, cand) = match best_cell {
            Some(v) => v,
            None => return 1, // Board is full and valid
        };

        let mut solutions = 0;
        for num in 1..=9 {
            if (cand & (1 << num)) != 0 {
                board[idx] = num;
                solutions += Self::count_solutions(board, limit - solutions);
                board[idx] = 0;
                if solutions >= limit {
                    break;
                }
            }
        }

        solutions
    }

    /// Solves a board in-place with randomized candidate order
    pub fn solve_random(board: &mut [u8; 81], rng: &mut Rng) -> bool {
        let mut min_candidates = 10;
        let mut best_cell = None;

        for r in 0..9 {
            for c in 0..9 {
                let idx = r * 9 + c;
                if board[idx] == 0 {
                    let cand = Self::get_candidates(board, r, c);
                    let count = cand.count_ones();
                    if count == 0 {
                        return false;
                    }
                    if count < min_candidates {
                        min_candidates = count;
                        best_cell = Some((idx, cand));
                        if count == 1 {
                            break;
                        }
                    }
                }
            }
            if min_candidates == 1 {
                break;
            }
        }

        let (idx, cand) = match best_cell {
            Some(v) => v,
            None => return true,
        };

        let mut nums = [0u8; 9];
        let mut n_count = 0;
        for num in 1..=9 {
            if (cand & (1 << num)) != 0 {
                nums[n_count] = num;
                n_count += 1;
            }
        }
        rng.shuffle(&mut nums[..n_count]);

        for i in 0..n_count {
            board[idx] = nums[i];
            if Self::solve_random(board, rng) {
                return true;
            }
            board[idx] = 0;
        }

        false
    }

    pub fn generate(&mut self, difficulty: u8, seed: u64) {
        self.rng.seed(seed);
        self.mistakes = 0;
        self.is_won = false;
        self.is_game_over = false;
        self.notes = [0; 81];

        // 1. Generate full valid board
        let mut full = [0u8; 81];
        // Fill 3 diagonal boxes randomly (they are independent)
        for b in 0..3 {
            let mut digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            self.rng.shuffle(&mut digits);
            let mut d_idx = 0;
            let start_r = b * 3;
            let start_c = b * 3;
            for r in 0..3 {
                for c in 0..3 {
                    full[(start_r + r) * 9 + (start_c + c)] = digits[d_idx];
                    d_idx += 1;
                }
            }
        }

        Self::solve_random(&mut full, &mut self.rng);
        self.solution = full;

        // 2. Punch holes while preserving unique solution
        let mut puzzle = full;
        let mut indices: [usize; 81] = [0; 81];
        for i in 0..81 {
            indices[i] = i;
        }
        self.rng.shuffle(&mut indices);

        // Clue target: 0: Easy (38), 1: Medium (32), 2: Hard (27)
        let target_clues = match difficulty {
            0 => 38,
            1 => 32,
            _ => 27,
        };
        let mut clues_left = 81;

        for &idx in &indices {
            if clues_left <= target_clues {
                break;
            }
            let backup = puzzle[idx];
            puzzle[idx] = 0;

            let mut test_board = puzzle;
            if Self::count_solutions(&mut test_board, 2) == 1 {
                clues_left -= 1;
            } else {
                puzzle[idx] = backup; // Restore if ambiguous
            }
        }

        self.initial = puzzle;
        self.board = puzzle;
    }

    pub fn enter_number(&mut self, r: usize, c: usize, num: u8) -> bool {
        if self.is_game_over || self.is_won {
            return false;
        }
        let idx = r * 9 + c;
        if self.initial[idx] != 0 {
            return false; // Can't edit clue
        }

        if num == 0 {
            self.board[idx] = 0;
            self.notes[idx] = 0;
            return true;
        }

        if num == self.solution[idx] {
            self.board[idx] = num;
            self.notes[idx] = 0;
            self.check_win();
            true
        } else {
            self.mistakes += 1;
            if self.mistakes >= 3 {
                self.is_game_over = true;
            }
            false
        }
    }

    pub fn toggle_note(&mut self, r: usize, c: usize, num: u8) {
        if self.is_game_over || self.is_won || num == 0 || num > 9 {
            return;
        }
        let idx = r * 9 + c;
        if self.initial[idx] != 0 || self.board[idx] != 0 {
            return;
        }
        self.notes[idx] ^= 1 << num;
    }

    pub fn hint(&mut self) -> Option<(usize, usize, u8)> {
        if self.is_game_over || self.is_won {
            return None;
        }
        for idx in 0..81 {
            if self.board[idx] == 0 {
                let r = idx / 9;
                let c = idx % 9;
                let val = self.solution[idx];
                self.board[idx] = val;
                self.notes[idx] = 0;
                self.check_win();
                return Some((r, c, val));
            }
        }
        None
    }

    pub fn check_win(&mut self) {
        for i in 0..81 {
            if self.board[i] != self.solution[i] {
                return;
            }
        }
        self.is_won = true;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sudoku_generation() {
        let mut s = Sudoku::new(42);
        s.generate(0, 42); // Easy
        let clues = s.initial.iter().filter(|&&x| x != 0).count();
        assert!(clues <= 40);

        let mut test = s.initial;
        let solutions = Sudoku::count_solutions(&mut test, 2);
        assert_eq!(solutions, 1); // Strictly unique
    }

    #[test]
    fn test_sudoku_gameplay() {
        let mut s = Sudoku::new(100);
        s.generate(0, 100);

        // Find empty cell
        let mut empty = None;
        for i in 0..81 {
            if s.initial[i] == 0 {
                empty = Some((i / 9, i % 9, s.solution[i]));
                break;
            }
        }

        if let Some((r, c, val)) = empty {
            assert!(s.enter_number(r, c, val));
            assert_eq!(s.board[r * 9 + c], val);
        }
    }
}
