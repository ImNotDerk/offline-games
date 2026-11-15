//! Fast deterministic PRNG (Xorshift64*)
//! Zero allocations, state is a single 64-bit integer.

pub struct Rng {
    state: u64,
}

impl Rng {
    pub const fn new(seed: u64) -> Self {
        let s = if seed == 0 { 0x853c49e6748fea9b } else { seed };
        Self { state: s }
    }

    #[inline]
    pub fn seed(&mut self, seed: u64) {
        self.state = if seed == 0 { 0x853c49e6748fea9b } else { seed };
    }

    #[inline]
    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.state = x;
        x.wrapping_mul(0x2545F4914F6CDD1D)
    }

    #[inline]
    pub fn next_u32(&mut self) -> u32 {
        (self.next_u64() >> 32) as u32
    }

    #[inline]
    pub fn next_bounded(&mut self, bound: u32) -> u32 {
        if bound <= 1 {
            return 0;
        }
        // Lemire's fast alternative to modulo without division
        let rand = self.next_u32() as u64;
        let multi = rand.wrapping_mul(bound as u64);
        (multi >> 32) as u32
    }

    #[inline]
    pub fn next_f32(&mut self) -> f32 {
        (self.next_u32() >> 8) as f32 / (1 << 24) as f32
    }

    pub fn shuffle<T>(&mut self, slice: &mut [T]) {
        let len = slice.len();
        if len <= 1 {
            return;
        }
        for i in (1..len).rev() {
            let j = self.next_bounded((i + 1) as u32) as usize;
            slice.swap(i, j);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rng_determinism() {
        let mut r1 = Rng::new(1337);
        let mut r2 = Rng::new(1337);
        for _ in 0..100 {
            assert_eq!(r1.next_u64(), r2.next_u64());
        }
    }

    #[test]
    fn test_rng_bounds() {
        let mut r = Rng::new(42);
        for _ in 0..1000 {
            let val = r.next_bounded(10);
            assert!(val < 10);
        }
    }

    #[test]
    fn test_shuffle() {
        let mut r = Rng::new(999);
        let mut items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        r.shuffle(&mut items);
        // Verify permutation integrity
        let mut sum: u32 = 0;
        for &x in &items {
            sum += x;
        }
        assert_eq!(sum, 45);
    }
}
