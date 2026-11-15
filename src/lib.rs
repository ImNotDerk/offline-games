#![allow(static_mut_refs)]

//! Zenith Core WebAssembly Engine
//! Pure Rust C-ABI exports with zero-allocation linear memory buffers.

pub mod dsp;
pub mod game2048;
pub mod minesweeper;
pub mod rng;
pub mod sudoku;
pub mod tetris;
pub mod wordle;

use dsp::{Dsp, AMBIENT_BUFFER, SFX_BUFFER};
use game2048::Game2048;
use minesweeper::Minesweeper;
use sudoku::Sudoku;
use tetris::Tetris;
use wordle::Wordle;

// Static instances
static mut G2048: Game2048 = Game2048::new(1337);
static mut G2048_EXPORT_BUF: [u32; 16] = [0; 16];

static mut SUDOKU: Sudoku = Sudoku::new(1337);
static mut MINESWEEPER: Minesweeper = Minesweeper::new(1337);
static mut TETRIS: Tetris = Tetris::new(1337);
static mut WORDLE: Wordle = Wordle::new(1337);
static mut DSP_ENGINE: Dsp = Dsp::new(1337);

// --- 2048 EXPORTS ---

#[no_mangle]
pub extern "C" fn g2048_reset(seed: u64) {
    unsafe { G2048.reset(seed) };
}

#[no_mangle]
pub extern "C" fn g2048_move(dir: u8) -> bool {
    unsafe { G2048.move_dir(dir) }
}

#[no_mangle]
pub extern "C" fn g2048_get_score() -> u32 {
    unsafe { G2048.score }
}

#[no_mangle]
pub extern "C" fn g2048_get_moves() -> u32 {
    unsafe { G2048.moves }
}

#[no_mangle]
pub extern "C" fn g2048_is_game_over() -> bool {
    unsafe { G2048.game_over }
}

#[no_mangle]
pub extern "C" fn g2048_is_won() -> bool {
    unsafe { G2048.won }
}

#[no_mangle]
pub extern "C" fn g2048_get_board_ptr() -> *const u32 {
    unsafe {
        G2048.export_board(&mut G2048_EXPORT_BUF);
        G2048_EXPORT_BUF.as_ptr()
    }
}

// --- SUDOKU EXPORTS ---

#[no_mangle]
pub extern "C" fn sudoku_generate(difficulty: u8, seed: u64) {
    unsafe { SUDOKU.generate(difficulty, seed) };
}

#[no_mangle]
pub extern "C" fn sudoku_enter(r: usize, c: usize, val: u8) -> bool {
    unsafe { SUDOKU.enter_number(r, c, val) }
}

#[no_mangle]
pub extern "C" fn sudoku_toggle_note(r: usize, c: usize, val: u8) {
    unsafe { SUDOKU.toggle_note(r, c, val) };
}

#[no_mangle]
pub extern "C" fn sudoku_hint() -> u32 {
    // Encodes (r << 16) | (c << 8) | val, or 0xFFFFFFFF if none
    unsafe {
        match SUDOKU.hint() {
            Some((r, c, val)) => ((r as u32) << 16) | ((c as u32) << 8) | (val as u32),
            None => 0xFFFF_FFFF,
        }
    }
}

#[no_mangle]
pub extern "C" fn sudoku_get_board_ptr() -> *const u8 {
    unsafe { SUDOKU.board.as_ptr() }
}

#[no_mangle]
pub extern "C" fn sudoku_get_initial_ptr() -> *const u8 {
    unsafe { SUDOKU.initial.as_ptr() }
}

#[no_mangle]
pub extern "C" fn sudoku_get_notes_ptr() -> *const u16 {
    unsafe { SUDOKU.notes.as_ptr() }
}

#[no_mangle]
pub extern "C" fn sudoku_get_mistakes() -> u8 {
    unsafe { SUDOKU.mistakes }
}

#[no_mangle]
pub extern "C" fn sudoku_is_won() -> bool {
    unsafe { SUDOKU.is_won }
}

#[no_mangle]
pub extern "C" fn sudoku_is_game_over() -> bool {
    unsafe { SUDOKU.is_game_over }
}

// --- MINESWEEPER EXPORTS ---

#[no_mangle]
pub extern "C" fn ms_reset(difficulty: u8, seed: u64) {
    unsafe { MINESWEEPER.reset(difficulty, seed) };
}

#[no_mangle]
pub extern "C" fn ms_reveal(r: usize, c: usize) -> u8 {
    unsafe { MINESWEEPER.reveal(r, c) }
}

#[no_mangle]
pub extern "C" fn ms_toggle_flag(r: usize, c: usize) {
    unsafe { MINESWEEPER.toggle_flag(r, c) };
}

#[no_mangle]
pub extern "C" fn ms_chord(r: usize, c: usize) -> u8 {
    unsafe { MINESWEEPER.chord(r, c) }
}

#[no_mangle]
pub extern "C" fn ms_get_cells_ptr() -> *const u8 {
    unsafe { MINESWEEPER.cells.as_ptr() }
}

#[no_mangle]
pub extern "C" fn ms_get_width() -> usize {
    unsafe { MINESWEEPER.width }
}

#[no_mangle]
pub extern "C" fn ms_get_height() -> usize {
    unsafe { MINESWEEPER.height }
}

#[no_mangle]
pub extern "C" fn ms_get_mine_count() -> usize {
    unsafe { MINESWEEPER.mine_count }
}

#[no_mangle]
pub extern "C" fn ms_get_flags_count() -> usize {
    unsafe { MINESWEEPER.flags_count }
}

#[no_mangle]
pub extern "C" fn ms_get_state() -> u8 {
    unsafe { MINESWEEPER.state }
}

// --- TETRIS EXPORTS ---

#[no_mangle]
pub extern "C" fn tetris_reset(seed: u64) {
    unsafe { TETRIS.reset(seed) };
}

#[no_mangle]
pub extern "C" fn tetris_move_h(dx: i32) -> bool {
    unsafe { TETRIS.move_h(dx) }
}

#[no_mangle]
pub extern "C" fn tetris_rotate_cw() -> bool {
    unsafe { TETRIS.rotate_cw() }
}

#[no_mangle]
pub extern "C" fn tetris_rotate_ccw() -> bool {
    unsafe { TETRIS.rotate_ccw() }
}

#[no_mangle]
pub extern "C" fn tetris_soft_drop() -> bool {
    unsafe { TETRIS.soft_drop() }
}

#[no_mangle]
pub extern "C" fn tetris_hard_drop() -> u32 {
    unsafe { TETRIS.hard_drop() }
}

#[no_mangle]
pub extern "C" fn tetris_hold() -> bool {
    unsafe { TETRIS.hold_piece() }
}

#[no_mangle]
pub extern "C" fn tetris_ghost_y() -> i32 {
    unsafe { TETRIS.ghost_y() }
}

#[no_mangle]
pub extern "C" fn tetris_get_grid_ptr() -> *const u8 {
    unsafe { TETRIS.grid.as_ptr() }
}

#[no_mangle]
pub extern "C" fn tetris_get_current_type() -> u8 {
    unsafe { TETRIS.current.p_type }
}

#[no_mangle]
pub extern "C" fn tetris_get_current_rot() -> u8 {
    unsafe { TETRIS.current.rot }
}

#[no_mangle]
pub extern "C" fn tetris_get_current_x() -> i32 {
    unsafe { TETRIS.current.x }
}

#[no_mangle]
pub extern "C" fn tetris_get_current_y() -> i32 {
    unsafe { TETRIS.current.y }
}

#[no_mangle]
pub extern "C" fn tetris_get_hold() -> u8 {
    unsafe { TETRIS.hold }
}

#[no_mangle]
pub extern "C" fn tetris_get_next_queue_ptr() -> *const u8 {
    unsafe { TETRIS.next_queue.as_ptr() }
}

#[no_mangle]
pub extern "C" fn tetris_get_score() -> u32 {
    unsafe { TETRIS.score }
}

#[no_mangle]
pub extern "C" fn tetris_get_lines() -> u32 {
    unsafe { TETRIS.lines }
}

#[no_mangle]
pub extern "C" fn tetris_get_level() -> u32 {
    unsafe { TETRIS.level }
}

#[no_mangle]
pub extern "C" fn tetris_is_game_over() -> bool {
    unsafe { TETRIS.game_over }
}

// --- WORDLE EXPORTS ---

#[no_mangle]
pub extern "C" fn wordle_reset(seed: u64) {
    unsafe { WORDLE.reset(seed) };
}

#[no_mangle]
pub extern "C" fn wordle_submit(c0: u8, c1: u8, c2: u8, c3: u8, c4: u8) -> bool {
    let guess = [c0, c1, c2, c3, c4];
    unsafe { WORDLE.submit_guess(&guess) }
}

#[no_mangle]
pub extern "C" fn wordle_is_valid(c0: u8, c1: u8, c2: u8, c3: u8, c4: u8) -> bool {
    Wordle::is_valid_word(&[c0, c1, c2, c3, c4])
}

#[no_mangle]
pub extern "C" fn wordle_get_guesses_ptr() -> *const u8 {
    unsafe { WORDLE.guesses.as_ptr() as *const u8 }
}

#[no_mangle]
pub extern "C" fn wordle_get_evals_ptr() -> *const u8 {
    unsafe { WORDLE.evals.as_ptr() as *const u8 }
}

#[no_mangle]
pub extern "C" fn wordle_get_key_states_ptr() -> *const u8 {
    unsafe { WORDLE.key_states.as_ptr() }
}

#[no_mangle]
pub extern "C" fn wordle_get_guess_count() -> usize {
    unsafe { WORDLE.guess_count }
}

#[no_mangle]
pub extern "C" fn wordle_get_state() -> u8 {
    unsafe { WORDLE.state }
}

#[no_mangle]
pub extern "C" fn wordle_get_target_char(idx: usize) -> u8 {
    unsafe {
        if idx < 5 {
            WORDLE.target[idx]
        } else {
            0
        }
    }
}

// --- DSP AUDIO EXPORTS ---

#[no_mangle]
pub extern "C" fn dsp_render_ambient(ambient_type: u8, vol: f32) -> usize {
    unsafe { DSP_ENGINE.render_ambient(ambient_type, vol) }
}

#[no_mangle]
pub extern "C" fn dsp_get_ambient_ptr() -> *const f32 {
    unsafe { AMBIENT_BUFFER.as_ptr() }
}

#[no_mangle]
pub extern "C" fn dsp_render_sfx(sfx_type: u8) -> usize {
    unsafe { DSP_ENGINE.render_sfx(sfx_type) }
}

#[no_mangle]
pub extern "C" fn dsp_get_sfx_ptr() -> *const f32 {
    unsafe { SFX_BUFFER.as_ptr() }
}
