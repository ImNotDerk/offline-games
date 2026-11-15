#![allow(static_mut_refs)]

//! Procedural Audio DSP Engine
//! Synthesizes ambient noise and crisp 8-bit sound effects directly into 32-bit PCM buffers.
//! Zero external audio files, pure DSP math.

use crate::rng::Rng;

pub const SAMPLE_RATE: usize = 44100;
pub const AMBIENT_SAMPLES: usize = 44100 * 2; // 2 seconds stereo interleaved
pub const SFX_SAMPLES: usize = 32768;

pub static mut AMBIENT_BUFFER: [f32; AMBIENT_SAMPLES] = [0.0; AMBIENT_SAMPLES];
pub static mut SFX_BUFFER: [f32; SFX_SAMPLES] = [0.0; SFX_SAMPLES];

pub struct Dsp {
    rng: Rng,
}

impl Dsp {
    pub const fn new(seed: u64) -> Self {
        Self {
            rng: Rng::new(seed),
        }
    }

    /// Synthesizes 2 seconds of looping stereo ambient audio
    /// 0: Gentle Rain, 1: Ocean Waves, 2: Pink Noise, 3: 10Hz Alpha Binaural
    pub fn render_ambient(&mut self, ambient_type: u8, vol: f32) -> usize {
        let buf = unsafe { &mut AMBIENT_BUFFER };
        let mut b0 = 0.0f32;
        let mut b1 = 0.0f32;
        let mut b2 = 0.0f32;

        let total_frames = AMBIENT_SAMPLES / 2;

        for i in 0..total_frames {
            let left_idx = i * 2;
            let right_idx = i * 2 + 1;

            match ambient_type {
                0 => {
                    // Rain: Paul Kellet's 3-pole Pink Noise + gentle drops
                    let white = self.rng.next_f32() * 2.0 - 1.0;
                    b0 = 0.99765 * b0 + white * 0.0990460;
                    b1 = 0.96300 * b1 + white * 0.2965164;
                    b2 = 0.57000 * b2 + white * 1.0526913;
                    let pink = (b0 + b1 + b2 + white * 0.1848) * 0.06;

                    // Occasional rain droplet
                    let drop = if self.rng.next_bounded(1200) == 0 {
                        (self.rng.next_f32() * 2.0 - 1.0) * 0.15
                    } else {
                        0.0
                    };

                    let sample = (pink + drop) * vol;
                    buf[left_idx] = sample;
                    buf[right_idx] = sample * 0.95;
                }
                1 => {
                    // Ocean Waves: Pink noise modulated by a 0.12 Hz sinusoidal swell
                    let white = self.rng.next_f32() * 2.0 - 1.0;
                    b0 = 0.99765 * b0 + white * 0.0990460;
                    b1 = 0.96300 * b1 + white * 0.2965164;
                    let pink = (b0 + b1) * 0.08;

                    // 0.12 Hz LFO envelope
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let swell = 0.3 + 0.7 * (0.5 * (1.0 + (t * 0.12 * 2.0 * std::f32::consts::PI).sin()));
                    let sample = pink * swell * vol;

                    buf[left_idx] = sample;
                    buf[right_idx] = sample;
                }
                2 => {
                    // White / Flat Noise
                    let white = (self.rng.next_f32() * 2.0 - 1.0) * 0.08 * vol;
                    buf[left_idx] = white;
                    buf[right_idx] = white;
                }
                _ => {
                    // Binaural 10Hz Alpha Tone (210 Hz left, 220 Hz right)
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let left_sine = (2.0 * std::f32::consts::PI * 210.0 * t).sin();
                    let right_sine = (2.0 * std::f32::consts::PI * 220.0 * t).sin();

                    buf[left_idx] = left_sine * 0.12 * vol;
                    buf[right_idx] = right_sine * 0.12 * vol;
                }
            }
        }

        AMBIENT_SAMPLES
    }

    /// Synthesizes short sound effect PCM into SFX_BUFFER
    /// 0: Click, 1: Move, 2: Rotate, 3: Drop, 4: Coin/Match, 5: LineClear, 6: Explode, 7: GameOver, 8: Victory
    pub fn render_sfx(&mut self, sfx_type: u8) -> usize {
        let buf = unsafe { &mut SFX_BUFFER };
        for sample in buf.iter_mut() {
            *sample = 0.0;
        }

        let num_samples = match sfx_type {
            0 => {
                // Click (short 40ms 800Hz decay)
                let len = (SAMPLE_RATE as f32 * 0.04) as usize;
                for i in 0..len {
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let env = 1.0 - (i as f32 / len as f32);
                    buf[i] = (2.0 * std::f32::consts::PI * 800.0 * t).sin() * env * 0.2;
                }
                len
            }
            1 => {
                // Move (60ms 350Hz)
                let len = (SAMPLE_RATE as f32 * 0.06) as usize;
                for i in 0..len {
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let env = 1.0 - (i as f32 / len as f32);
                    buf[i] = (2.0 * std::f32::consts::PI * 350.0 * t).sin() * env * 0.25;
                }
                len
            }
            2 => {
                // Rotate / Chirp (80ms chirp 400Hz -> 650Hz)
                let len = (SAMPLE_RATE as f32 * 0.08) as usize;
                for i in 0..len {
                    let progress = i as f32 / len as f32;
                    let freq = 400.0 + progress * 250.0;
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let env = 1.0 - progress;
                    buf[i] = (2.0 * std::f32::consts::PI * freq * t).sin() * env * 0.3;
                }
                len
            }
            3 => {
                // Drop (100ms 180Hz)
                let len = (SAMPLE_RATE as f32 * 0.10) as usize;
                for i in 0..len {
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let env = 1.0 - (i as f32 / len as f32);
                    buf[i] = (2.0 * std::f32::consts::PI * 180.0 * t).sin() * env * 0.35;
                }
                len
            }
            4 => {
                // Coin / Match (B5 987Hz -> E6 1318Hz arpeggio)
                let len = (SAMPLE_RATE as f32 * 0.25) as usize;
                let half = len / 2;
                for i in 0..len {
                    let freq = if i < half { 987.77 } else { 1318.51 };
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let env = 1.0 - (i as f32 / len as f32);
                    buf[i] = (2.0 * std::f32::consts::PI * freq * t).sin() * env * 0.3;
                }
                len
            }
            5 => {
                // Line Clear (C-E-G-C major sweep 300ms)
                let len = (SAMPLE_RATE as f32 * 0.30) as usize;
                let freqs = [523.25, 659.25, 783.99, 1046.50];
                let quarter = len / 4;
                for i in 0..len {
                    let note_idx = (i / quarter).min(3);
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let env = 1.0 - (i as f32 / len as f32);
                    buf[i] = (2.0 * std::f32::consts::PI * freqs[note_idx] * t).sin() * env * 0.3;
                }
                len
            }
            6 => {
                // Explode (decaying filtered noise)
                let len = (SAMPLE_RATE as f32 * 0.35) as usize;
                let mut filter = 0.0f32;
                for i in 0..len {
                    let raw = self.rng.next_f32() * 2.0 - 1.0;
                    filter = filter * 0.92 + raw * 0.08;
                    let env = (1.0 - (i as f32 / len as f32)).powi(2);
                    buf[i] = filter * env * 0.45;
                }
                len
            }
            7 => {
                // Game Over (descending minor chord 400ms)
                let len = (SAMPLE_RATE as f32 * 0.40) as usize;
                let freqs = [440.0, 392.0, 349.23, 293.66];
                let quarter = len / 4;
                for i in 0..len {
                    let note_idx = (i / quarter).min(3);
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let env = 1.0 - (i as f32 / len as f32);
                    buf[i] = (2.0 * std::f32::consts::PI * freqs[note_idx] * t).sin() * env * 0.3;
                }
                len
            }
            _ => {
                // Victory Fanfare (500ms)
                let len = (SAMPLE_RATE as f32 * 0.50) as usize;
                let freqs = [523.25, 659.25, 783.99, 1046.50];
                let quarter = len / 4;
                for i in 0..len {
                    let note_idx = (i / quarter).min(3);
                    let t = i as f32 / SAMPLE_RATE as f32;
                    let env = 1.0 - (i as f32 / len as f32);
                    buf[i] = (2.0 * std::f32::consts::PI * freqs[note_idx] * t).sin() * env * 0.35;
                }
                len
            }
        };

        num_samples
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ambient_synthesis() {
        let mut dsp = Dsp::new(1234);
        let samples = dsp.render_ambient(0, 0.5);
        assert_eq!(samples, AMBIENT_SAMPLES);
        unsafe {
            assert!(AMBIENT_BUFFER[0] != 0.0 || AMBIENT_BUFFER[10] != 0.0);
        }
    }

    #[test]
    fn test_sfx_synthesis() {
        let mut dsp = Dsp::new(5678);
        for sfx in 0..=8 {
            let count = dsp.render_sfx(sfx);
            assert!(count > 0 && count <= SFX_SAMPLES);
        }
    }
}
