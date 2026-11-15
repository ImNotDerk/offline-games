//! Bit-Packed Minesweeper Engine
//! Max grid size 30x16 = 480 cells. Each cell packed into a single byte.
//! Zero-allocation fixed-array BFS flood fill.

use crate::rng::Rng;

pub const MAX_CELLS: usize = 480;

pub struct Minesweeper {
    pub cells: [u8; MAX_CELLS],
    pub width: usize,
    pub height: usize,
    pub mine_count: usize,
    pub flags_count: usize,
    pub state: u8, // 0: Ready, 1: Playing, 2: Won, 3: Lost
    pub first_click: bool,
    rng: Rng,
}

impl Minesweeper {
    pub const MINE: u8 = 0x01;
    pub const REVEALED: u8 = 0x02;
    pub const FLAGGED: u8 = 0x04;
    pub const EXPLODED: u8 = 0x08;

    pub const fn new(seed: u64) -> Self {
        Self {
            cells: [0; MAX_CELLS],
            width: 9,
            height: 9,
            mine_count: 10,
            flags_count: 0,
            state: 0,
            first_click: true,
            rng: Rng::new(seed),
        }
    }

    pub fn reset(&mut self, difficulty: u8, seed: u64) {
        let (w, h, m) = match difficulty {
            0 => (9, 9, 10),    // Easy
            1 => (16, 16, 40),  // Medium
            _ => (30, 16, 99),  // Hard
        };

        self.width = w;
        self.height = h;
        self.mine_count = m;
        self.flags_count = 0;
        self.state = 0;
        self.first_click = true;
        self.rng.seed(seed);
        self.cells = [0; MAX_CELLS];
    }

    #[inline]
    fn idx(&self, r: usize, c: usize) -> usize {
        r * self.width + c
    }

    #[inline]
    pub fn get_neighbor_count(&self, idx: usize) -> u8 {
        (self.cells[idx] >> 4) & 0x0F
    }

    #[inline]
    fn set_neighbor_count(&mut self, idx: usize, count: u8) {
        self.cells[idx] = (self.cells[idx] & 0x0F) | ((count & 0x0F) << 4);
    }

    #[inline]
    pub fn neighbor_indices(width: usize, height: usize, r: usize, c: usize, out: &mut [usize; 8]) -> usize {
        let mut count = 0;
        let min_r = if r > 0 { r - 1 } else { 0 };
        let max_r = if r + 1 < height { r + 1 } else { height - 1 };
        let min_c = if c > 0 { c - 1 } else { 0 };
        let max_c = if c + 1 < width { c + 1 } else { width - 1 };

        for nr in min_r..=max_r {
            for nc in min_c..=max_c {
                if nr != r || nc != c {
                    out[count] = nr * width + nc;
                    count += 1;
                }
            }
        }
        count
    }

    fn place_mines(&mut self, safe_r: usize, safe_c: usize) {
        let mut placed = 0;

        while placed < self.mine_count {
            let r = self.rng.next_bounded(self.height as u32) as usize;
            let c = self.rng.next_bounded(self.width as u32) as usize;

            // Safe 3x3 radius around initial click
            let dr = (r as isize - safe_r as isize).abs();
            let dc = (c as isize - safe_c as isize).abs();
            if dr <= 1 && dc <= 1 {
                continue;
            }

            let idx = self.idx(r, c);
            if (self.cells[idx] & Self::MINE) == 0 {
                self.cells[idx] |= Self::MINE;
                placed += 1;
            }
        }

        // Calculate neighbor numbers
        let mut neighbors = [0usize; 8];
        for r in 0..self.height {
            for c in 0..self.width {
                let idx = self.idx(r, c);
                if (self.cells[idx] & Self::MINE) == 0 {
                    let n_count = Self::neighbor_indices(self.width, self.height, r, c, &mut neighbors);
                    let mut count = 0u8;
                    for i in 0..n_count {
                        if (self.cells[neighbors[i]] & Self::MINE) != 0 {
                            count += 1;
                        }
                    }
                    self.set_neighbor_count(idx, count);
                }
            }
        }
    }

    pub fn reveal(&mut self, r: usize, c: usize) -> u8 {
        if self.state == 2 || self.state == 3 || r >= self.height || c >= self.width {
            return self.state;
        }

        let idx = self.idx(r, c);
        if (self.cells[idx] & (Self::REVEALED | Self::FLAGGED)) != 0 {
            return self.state;
        }

        if self.first_click {
            self.first_click = false;
            self.state = 1; // Playing
            self.place_mines(r, c);
        }

        if (self.cells[idx] & Self::MINE) != 0 {
            // Detonate
            self.cells[idx] |= Self::EXPLODED | Self::REVEALED;
            self.state = 3; // Lost
            // Reveal all mines
            let total = self.width * self.height;
            for i in 0..total {
                if (self.cells[i] & Self::MINE) != 0 {
                    self.cells[i] |= Self::REVEALED;
                }
            }
            return self.state;
        }

        // BFS flood fill using fixed-size stack (allocation free)
        let mut queue = [0u16; MAX_CELLS];
        let mut q_head = 0;
        let mut q_tail = 0;

        self.cells[idx] |= Self::REVEALED;
        queue[q_tail] = idx as u16;
        q_tail += 1;

        let mut neighbors = [0usize; 8];

        while q_head < q_tail {
            let curr = queue[q_head] as usize;
            q_head += 1;

            if self.get_neighbor_count(curr) == 0 {
                let cr = curr / self.width;
                let cc = curr % self.width;
                let n_count = Self::neighbor_indices(self.width, self.height, cr, cc, &mut neighbors);
                for i in 0..n_count {
                    let n_idx = neighbors[i];
                    if (self.cells[n_idx] & (Self::REVEALED | Self::FLAGGED | Self::MINE)) == 0 {
                        self.cells[n_idx] |= Self::REVEALED;
                        queue[q_tail] = n_idx as u16;
                        q_tail += 1;
                    }
                }
            }
        }

        self.check_win();
        self.state
    }

    pub fn toggle_flag(&mut self, r: usize, c: usize) {
        if self.state == 2 || self.state == 3 || r >= self.height || c >= self.width {
            return;
        }
        let idx = self.idx(r, c);
        if (self.cells[idx] & Self::REVEALED) != 0 {
            return;
        }

        if (self.cells[idx] & Self::FLAGGED) != 0 {
            self.cells[idx] &= !Self::FLAGGED;
            if self.flags_count > 0 {
                self.flags_count -= 1;
            }
        } else {
            self.cells[idx] |= Self::FLAGGED;
            self.flags_count += 1;
        }
    }

    pub fn chord(&mut self, r: usize, c: usize) -> u8 {
        if self.state != 1 || r >= self.height || c >= self.width {
            return self.state;
        }
        let idx = self.idx(r, c);
        if (self.cells[idx] & Self::REVEALED) == 0 {
            return self.state;
        }

        let required = self.get_neighbor_count(idx);
        if required == 0 {
            return self.state;
        }

        let mut neighbors = [0usize; 8];
        let n_count = Self::neighbor_indices(self.width, self.height, r, c, &mut neighbors);

        let mut flags = 0u8;
        for i in 0..n_count {
            if (self.cells[neighbors[i]] & Self::FLAGGED) != 0 {
                flags += 1;
            }
        }

        if flags == required {
            let mut to_reveal = [0usize; 8];
            let mut tr_count = 0;

            for i in 0..n_count {
                let n_idx = neighbors[i];
                if (self.cells[n_idx] & (Self::REVEALED | Self::FLAGGED)) == 0 {
                    to_reveal[tr_count] = n_idx;
                    tr_count += 1;
                }
            }

            for i in 0..tr_count {
                let n_idx = to_reveal[i];
                let nr = n_idx / self.width;
                let nc = n_idx % self.width;
                self.reveal(nr, nc);
                if self.state == 3 {
                    break;
                }
            }
        }

        self.state
    }

    fn check_win(&mut self) {
        let total = self.width * self.height;
        let mut unrevealed_safe = 0;
        for i in 0..total {
            if (self.cells[i] & (Self::MINE | Self::REVEALED)) == 0 {
                unrevealed_safe += 1;
            }
        }
        if unrevealed_safe == 0 {
            self.state = 2; // Won
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_minesweeper_safe_first_click() {
        let mut ms = Minesweeper::new(777);
        ms.reset(0, 777); // 9x9, 10 mines
        ms.reveal(4, 4);

        let center = ms.idx(4, 4);
        assert_eq!(ms.cells[center] & Minesweeper::MINE, 0);
        assert_eq!(ms.cells[center] & Minesweeper::REVEALED, Minesweeper::REVEALED);
        assert_eq!(ms.state, 1);
    }

    #[test]
    fn test_flagging() {
        let mut ms = Minesweeper::new(888);
        ms.reset(0, 888);
        ms.toggle_flag(0, 0);
        assert_eq!(ms.flags_count, 1);
        assert_ne!(ms.cells[0] & Minesweeper::FLAGGED, 0);

        ms.toggle_flag(0, 0);
        assert_eq!(ms.flags_count, 0);
        assert_eq!(ms.cells[0] & Minesweeper::FLAGGED, 0);
    }
}
