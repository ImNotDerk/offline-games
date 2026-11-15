//! 64-bit Bitboard 2048 Engine
//! Entire 4x4 board packed into a single 64-bit integer (4 bits per tile).
//! Zero heap allocations, O(1) row operations.

use crate::rng::Rng;

pub struct Game2048 {
    pub board: u64,
    pub score: u32,
    pub moves: u32,
    pub game_over: bool,
    pub won: bool,
    rng: Rng,
}

impl Game2048 {
    pub const fn new(seed: u64) -> Self {
        Self {
            board: 0,
            score: 0,
            moves: 0,
            game_over: false,
            won: false,
            rng: Rng::new(seed),
        }
    }

    pub fn reset(&mut self, seed: u64) {
        self.board = 0;
        self.score = 0;
        self.moves = 0;
        self.game_over = false;
        self.won = false;
        self.rng.seed(seed);
        self.spawn_random_tile();
        self.spawn_random_tile();
    }

    #[inline]
    pub fn get_tile(&self, r: usize, c: usize) -> u8 {
        let shift = (r * 4 + c) * 4;
        ((self.board >> shift) & 0xF) as u8
    }

    pub fn spawn_random_tile(&mut self) -> bool {
        let mut empty_cells = [0usize; 16];
        let mut count = 0;

        for i in 0..16 {
            if ((self.board >> (i * 4)) & 0xF) == 0 {
                empty_cells[count] = i;
                count += 1;
            }
        }

        if count == 0 {
            return false;
        }

        let pick = empty_cells[self.rng.next_bounded(count as u32) as usize];
        let val: u64 = if self.rng.next_bounded(10) == 0 { 2 } else { 1 }; // 1 = 2^1 (2), 2 = 2^2 (4)
        self.board |= val << (pick * 4);
        true
    }

    /// Shifts a 16-bit row left, returns (shifted_row, score_gained)
    #[inline]
    pub fn shift_row_left(row: u16) -> (u16, u32) {
        let tiles = [
            (row & 0xF) as u8,
            ((row >> 4) & 0xF) as u8,
            ((row >> 8) & 0xF) as u8,
            ((row >> 12) & 0xF) as u8,
        ];

        // Compress non-zeros
        let mut filtered = [0u8; 4];
        let mut f_len = 0;
        for &t in &tiles {
            if t != 0 {
                filtered[f_len] = t;
                f_len += 1;
            }
        }

        let mut score = 0u32;
        let mut result = [0u8; 4];
        let mut r_len = 0;
        let mut i = 0;

        while i < f_len {
            if i + 1 < f_len && filtered[i] == filtered[i + 1] {
                let merged = filtered[i] + 1;
                result[r_len] = merged;
                score += 1 << merged;
                r_len += 1;
                i += 2;
            } else {
                result[r_len] = filtered[i];
                r_len += 1;
                i += 1;
            }
        }

        let packed = (result[0] as u16)
            | ((result[1] as u16) << 4)
            | ((result[2] as u16) << 8)
            | ((result[3] as u16) << 12);

        (packed, score)
    }

    #[inline]
    fn reverse_row(row: u16) -> u16 {
        ((row & 0xF) << 12)
            | (((row >> 4) & 0xF) << 8)
            | (((row >> 8) & 0xF) << 4)
            | ((row >> 12) & 0xF)
    }

    #[inline]
    fn transpose(b: u64) -> u64 {
        let mut res = 0u64;
        let mut r = 0;
        while r < 4 {
            let mut c = 0;
            while c < 4 {
                let val = (b >> ((r * 4 + c) * 4)) & 0xF;
                res |= val << ((c * 4 + r) * 4);
                c += 1;
            }
            r += 1;
        }
        res
    }

    pub fn move_dir(&mut self, dir: u8) -> bool {
        // 0: Left, 1: Right, 2: Up, 3: Down
        if self.game_over {
            return false;
        }

        let old_board = self.board;
        let mut gained_score = 0u32;

        match dir {
            0 => {
                // Left
                let mut new_board = 0u64;
                for r in 0..4 {
                    let row = ((self.board >> (r * 16)) & 0xFFFF) as u16;
                    let (shifted, score) = Self::shift_row_left(row);
                    gained_score += score;
                    new_board |= (shifted as u64) << (r * 16);
                }
                self.board = new_board;
            }
            1 => {
                // Right
                let mut new_board = 0u64;
                for r in 0..4 {
                    let row = ((self.board >> (r * 16)) & 0xFFFF) as u16;
                    let rev = Self::reverse_row(row);
                    let (shifted, score) = Self::shift_row_left(rev);
                    gained_score += score;
                    let res = Self::reverse_row(shifted);
                    new_board |= (res as u64) << (r * 16);
                }
                self.board = new_board;
            }
            2 => {
                // Up = Transpose -> Left -> Transpose
                let transposed = Self::transpose(self.board);
                let mut new_board = 0u64;
                for r in 0..4 {
                    let row = ((transposed >> (r * 16)) & 0xFFFF) as u16;
                    let (shifted, score) = Self::shift_row_left(row);
                    gained_score += score;
                    new_board |= (shifted as u64) << (r * 16);
                }
                self.board = Self::transpose(new_board);
            }
            3 => {
                // Down = Transpose -> Right -> Transpose
                let transposed = Self::transpose(self.board);
                let mut new_board = 0u64;
                for r in 0..4 {
                    let row = ((transposed >> (r * 16)) & 0xFFFF) as u16;
                    let rev = Self::reverse_row(row);
                    let (shifted, score) = Self::shift_row_left(rev);
                    gained_score += score;
                    let res = Self::reverse_row(shifted);
                    new_board |= (res as u64) << (r * 16);
                }
                self.board = Self::transpose(new_board);
            }
            _ => return false,
        }

        if self.board != old_board {
            self.score += gained_score;
            self.moves += 1;
            self.spawn_random_tile();

            // Check win condition (tile 11 = 2048)
            if !self.won {
                for i in 0..16 {
                    if ((self.board >> (i * 4)) & 0xF) >= 11 {
                        self.won = true;
                        break;
                    }
                }
            }

            if !self.can_move() {
                self.game_over = true;
            }
            true
        } else {
            false
        }
    }

    pub fn can_move(&self) -> bool {
        // Any empty cell?
        for i in 0..16 {
            if ((self.board >> (i * 4)) & 0xF) == 0 {
                return true;
            }
        }

        // Horizontal neighbors equal?
        for r in 0..4 {
            for c in 0..3 {
                let t1 = self.get_tile(r, c);
                let t2 = self.get_tile(r, c + 1);
                if t1 == t2 {
                    return true;
                }
            }
        }

        // Vertical neighbors equal?
        for c in 0..4 {
            for r in 0..3 {
                let t1 = self.get_tile(r, c);
                let t2 = self.get_tile(r + 1, c);
                if t1 == t2 {
                    return true;
                }
            }
        }

        false
    }

    /// Exports board values as concrete powers of 2 (0, 2, 4, 8, ...) into out slice
    pub fn export_board(&self, out: &mut [u32; 16]) {
        for i in 0..16 {
            let exp = (self.board >> (i * 4)) & 0xF;
            out[i] = if exp == 0 { 0 } else { 1 << exp };
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_row_merge() {
        // [2, 2, 0, 0] in exponents = [1, 1, 0, 0] = 0x0011
        let (shifted, score) = Game2048::shift_row_left(0x0011);
        // Expect [4, 0, 0, 0] = exponent [2, 0, 0, 0] = 0x0002
        assert_eq!(shifted, 0x0002);
        assert_eq!(score, 4);

        // [2, 2, 4, 4] = 0x2211 -> [4, 8, 0, 0] = exponent [2, 3, 0, 0] = 0x0032
        let (shifted2, score2) = Game2048::shift_row_left(0x2211);
        assert_eq!(shifted2, 0x0032);
        assert_eq!(score2, 4 + 8);
    }

    #[test]
    fn test_transpose() {
        // Put distinct values in (0, 1) and (1, 0)
        let mut b = 0u64;
        b |= 1 << (1 * 4); // (0, 1) = 1
        b |= 2 << (4 * 4); // (1, 0) = 2

        let t = Game2048::transpose(b);
        assert_eq!((t >> (1 * 4)) & 0xF, 2);
        assert_eq!((t >> (4 * 4)) & 0xF, 1);
    }

    #[test]
    fn test_game_flow() {
        let mut g = Game2048::new(12345);
        g.reset(12345);
        let mut tiles = 0;
        for i in 0..16 {
            if ((g.board >> (i * 4)) & 0xF) != 0 {
                tiles += 1;
            }
        }
        assert_eq!(tiles, 2);
    }
}
