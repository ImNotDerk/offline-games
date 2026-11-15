//! Guideline Tetris Engine
//! 200-byte flat grid, SRS (Super Rotation System) wall kicks, 7-bag randomizer.
//! Zero heap allocations, tick-driven state machine.

use crate::rng::Rng;

pub const WIDTH: usize = 10;
pub const HEIGHT: usize = 20;

#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Piece {
    pub p_type: u8, // 1: I, 2: J, 3: L, 4: O, 5: S, 6: T, 7: Z
    pub rot: u8,    // 0..4
    pub x: i32,
    pub y: i32,
}

pub struct Tetris {
    pub grid: [u8; WIDTH * HEIGHT],
    pub current: Piece,
    pub hold: u8,
    pub can_hold: bool,
    pub next_queue: [u8; 5],
    pub bag: [u8; 7],
    pub bag_idx: usize,
    pub score: u32,
    pub lines: u32,
    pub level: u32,
    pub game_over: bool,
    rng: Rng,
}

impl Tetris {
    pub const fn new(seed: u64) -> Self {
        Self {
            grid: [0; WIDTH * HEIGHT],
            current: Piece { p_type: 0, rot: 0, x: 0, y: 0 },
            hold: 0,
            can_hold: true,
            next_queue: [0; 5],
            bag: [1, 2, 3, 4, 5, 6, 7],
            bag_idx: 7,
            score: 0,
            lines: 0,
            level: 1,
            game_over: false,
            rng: Rng::new(seed),
        }
    }

    pub fn reset(&mut self, seed: u64) {
        self.grid = [0; WIDTH * HEIGHT];
        self.hold = 0;
        self.can_hold = true;
        self.score = 0;
        self.lines = 0;
        self.level = 1;
        self.game_over = false;
        self.rng.seed(seed);
        self.bag = [1, 2, 3, 4, 5, 6, 7];
        self.bag_idx = 7;

        for i in 0..5 {
            self.next_queue[i] = self.draw_from_bag();
        }
        self.spawn_piece();
    }

    fn draw_from_bag(&mut self) -> u8 {
        if self.bag_idx >= 7 {
            self.bag = [1, 2, 3, 4, 5, 6, 7];
            self.rng.shuffle(&mut self.bag);
            self.bag_idx = 0;
        }
        let piece = self.bag[self.bag_idx];
        self.bag_idx += 1;
        piece
    }

    pub fn spawn_piece(&mut self) {
        let p_type = self.next_queue[0];
        for i in 0..4 {
            self.next_queue[i] = self.next_queue[i + 1];
        }
        self.next_queue[4] = self.draw_from_bag();

        self.current = Piece {
            p_type,
            rot: 0,
            x: 3,
            y: if p_type == 1 { -1 } else { 0 },
        };
        self.can_hold = true;

        if self.check_collision(self.current) {
            self.game_over = true;
        }
    }

    /// Returns 4 cell offsets `[(x, y); 4]` for a given piece and rotation
    pub fn get_blocks(p_type: u8, rot: u8) -> [(i32, i32); 4] {
        match p_type {
            1 => {
                // I
                match rot % 4 {
                    0 => [(0, 1), (1, 1), (2, 1), (3, 1)],
                    1 => [(2, 0), (2, 1), (2, 2), (2, 3)],
                    2 => [(0, 2), (1, 2), (2, 2), (3, 2)],
                    _ => [(1, 0), (1, 1), (1, 2), (1, 3)],
                }
            }
            2 => {
                // J
                match rot % 4 {
                    0 => [(0, 0), (0, 1), (1, 1), (2, 1)],
                    1 => [(1, 0), (2, 0), (1, 1), (1, 2)],
                    2 => [(0, 1), (1, 1), (2, 1), (2, 2)],
                    _ => [(1, 0), (1, 1), (0, 2), (1, 2)],
                }
            }
            3 => {
                // L
                match rot % 4 {
                    0 => [(2, 0), (0, 1), (1, 1), (2, 1)],
                    1 => [(1, 0), (1, 1), (1, 2), (2, 2)],
                    2 => [(0, 1), (1, 1), (2, 1), (0, 2)],
                    _ => [(0, 0), (1, 0), (1, 1), (1, 2)],
                }
            }
            4 => {
                // O
                [(1, 0), (2, 0), (1, 1), (2, 1)]
            }
            5 => {
                // S
                match rot % 4 {
                    0 => [(1, 0), (2, 0), (0, 1), (1, 1)],
                    1 => [(1, 0), (1, 1), (2, 1), (2, 2)],
                    2 => [(1, 1), (2, 1), (0, 2), (1, 2)],
                    _ => [(0, 0), (0, 1), (1, 1), (1, 2)],
                }
            }
            6 => {
                // T
                match rot % 4 {
                    0 => [(1, 0), (0, 1), (1, 1), (2, 1)],
                    1 => [(1, 0), (1, 1), (2, 1), (1, 2)],
                    2 => [(0, 1), (1, 1), (2, 1), (1, 2)],
                    _ => [(1, 0), (0, 1), (1, 1), (1, 2)],
                }
            }
            7 => {
                // Z
                match rot % 4 {
                    0 => [(0, 0), (1, 0), (1, 1), (2, 1)],
                    1 => [(2, 0), (1, 1), (2, 1), (1, 2)],
                    2 => [(0, 1), (1, 1), (1, 2), (2, 2)],
                    _ => [(1, 0), (0, 1), (1, 1), (0, 2)],
                }
            }
            _ => [(0, 0), (0, 0), (0, 0), (0, 0)],
        }
    }

    pub fn check_collision(&self, p: Piece) -> bool {
        let blocks = Self::get_blocks(p.p_type, p.rot);
        for &(bx, by) in &blocks {
            let gx = p.x + bx;
            let gy = p.y + by;

            if gx < 0 || gx >= WIDTH as i32 || gy >= HEIGHT as i32 {
                return true;
            }
            if gy >= 0 && self.grid[(gy as usize) * WIDTH + (gx as usize)] != 0 {
                return true;
            }
        }
        false
    }

    pub fn move_h(&mut self, dx: i32) -> bool {
        if self.game_over {
            return false;
        }
        let mut test = self.current;
        test.x += dx;
        if !self.check_collision(test) {
            self.current = test;
            true
        } else {
            false
        }
    }

    pub fn rotate_cw(&mut self) -> bool {
        if self.game_over || self.current.p_type == 4 {
            return false; // O does not rotate
        }
        let from_rot = self.current.rot;
        let to_rot = (from_rot + 1) % 4;
        self.try_wall_kicks(from_rot, to_rot)
    }

    pub fn rotate_ccw(&mut self) -> bool {
        if self.game_over || self.current.p_type == 4 {
            return false;
        }
        let from_rot = self.current.rot;
        let to_rot = (from_rot + 3) % 4;
        self.try_wall_kicks(from_rot, to_rot)
    }

    fn try_wall_kicks(&mut self, from_rot: u8, to_rot: u8) -> bool {
        // Standard Guideline SRS kick table
        let kicks = if self.current.p_type == 1 {
            // I piece kicks
            match (from_rot, to_rot) {
                (0, 1) => [(0, 0), (-2, 0), (1, 0), (-2, -1), (1, 2)],
                (1, 0) => [(0, 0), (2, 0), (-1, 0), (2, 1), (-1, -2)],
                (1, 2) => [(0, 0), (-1, 0), (2, 0), (-1, 2), (2, -1)],
                (2, 1) => [(0, 0), (1, 0), (-2, 0), (1, -2), (-2, 1)],
                (2, 3) => [(0, 0), (2, 0), (-1, 0), (2, 1), (-1, -2)],
                (3, 2) => [(0, 0), (-2, 0), (1, 0), (-2, -1), (1, 2)],
                (3, 0) => [(0, 0), (1, 0), (-2, 0), (1, -2), (-2, 1)],
                _ => [(0, 0), (-1, 0), (2, 0), (-1, 2), (2, -1)],
            }
        } else {
            // J, L, S, T, Z kicks
            match (from_rot, to_rot) {
                (0, 1) => [(0, 0), (-1, 0), (-1, 1), (0, -2), (-1, -2)],
                (1, 0) => [(0, 0), (1, 0), (1, -1), (0, 2), (1, 2)],
                (1, 2) => [(0, 0), (1, 0), (1, -1), (0, 2), (1, 2)],
                (2, 1) => [(0, 0), (-1, 0), (-1, 1), (0, -2), (-1, -2)],
                (2, 3) => [(0, 0), (1, 0), (1, 1), (0, -2), (1, -2)],
                (3, 2) => [(0, 0), (-1, 0), (-1, -1), (0, 2), (-1, 2)],
                (3, 0) => [(0, 0), (-1, 0), (-1, -1), (0, 2), (-1, 2)],
                _ => [(0, 0), (1, 0), (1, 1), (0, -2), (1, -2)],
            }
        };

        for &(kx, ky) in &kicks {
            let mut test = self.current;
            test.rot = to_rot;
            test.x += kx;
            test.y -= ky; // SRS y-axis inverted
            if !self.check_collision(test) {
                self.current = test;
                return true;
            }
        }

        false
    }

    pub fn soft_drop(&mut self) -> bool {
        if self.game_over {
            return false;
        }
        let mut test = self.current;
        test.y += 1;
        if !self.check_collision(test) {
            self.current = test;
            self.score += 1;
            true
        } else {
            self.lock_piece();
            false
        }
    }

    pub fn hard_drop(&mut self) -> u32 {
        if self.game_over {
            return 0;
        }
        let mut dropped = 0;
        while !self.check_collision(Piece { y: self.current.y + 1, ..self.current }) {
            self.current.y += 1;
            dropped += 1;
        }
        self.score += dropped * 2;
        self.lock_piece();
        dropped
    }

    pub fn ghost_y(&self) -> i32 {
        let mut gy = self.current.y;
        while !self.check_collision(Piece { y: gy + 1, ..self.current }) {
            gy += 1;
        }
        gy
    }

    pub fn hold_piece(&mut self) -> bool {
        if self.game_over || !self.can_hold {
            return false;
        }
        let current_type = self.current.p_type;
        if self.hold == 0 {
            self.hold = current_type;
            self.spawn_piece();
        } else {
            let swap = self.hold;
            self.hold = current_type;
            self.current = Piece {
                p_type: swap,
                rot: 0,
                x: 3,
                y: if swap == 1 { -1 } else { 0 },
            };
        }
        self.can_hold = false;
        true
    }

    fn lock_piece(&mut self) {
        let blocks = Self::get_blocks(self.current.p_type, self.current.rot);
        for &(bx, by) in &blocks {
            let gx = self.current.x + bx;
            let gy = self.current.y + by;
            if gy >= 0 && gy < HEIGHT as i32 && gx >= 0 && gx < WIDTH as i32 {
                self.grid[(gy as usize) * WIDTH + (gx as usize)] = self.current.p_type;
            }
        }

        self.clear_lines();
        self.spawn_piece();
    }

    fn clear_lines(&mut self) {
        let mut cleared = 0u32;
        let mut r = HEIGHT as i32 - 1;

        while r >= 0 {
            let row_start = (r as usize) * WIDTH;
            let mut full = true;
            for c in 0..WIDTH {
                if self.grid[row_start + c] == 0 {
                    full = false;
                    break;
                }
            }

            if full {
                cleared += 1;
                // Shift rows above down
                for above in (1..=r as usize).rev() {
                    for c in 0..WIDTH {
                        self.grid[above * WIDTH + c] = self.grid[(above - 1) * WIDTH + c];
                    }
                }
                for c in 0..WIDTH {
                    self.grid[c] = 0;
                }
            } else {
                r -= 1;
            }
        }

        if cleared > 0 {
            self.lines += cleared;
            let pts = match cleared {
                1 => 100,
                2 => 300,
                3 => 500,
                _ => 800,
            };
            self.score += pts * self.level;
            self.level = (self.lines / 10) + 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tetris_flow() {
        let mut t = Tetris::new(42);
        t.reset(42);
        assert_ne!(t.current.p_type, 0);
        assert!(!t.game_over);

        // Move right
        let orig_x = t.current.x;
        t.move_h(1);
        assert_eq!(t.current.x, orig_x + 1);

        // Hard drop
        t.hard_drop();
        // A piece is locked, grid must contain blocks
        let has_blocks = t.grid.iter().any(|&b| b != 0);
        assert!(has_blocks);
    }
}
