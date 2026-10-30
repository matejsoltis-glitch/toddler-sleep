import { NatureSoundType, WhiteNoiseLevel } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentMode: 'none' | 'white-noise' | 'nature' = 'none';

  // White noise nodes
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;

  // Nature sound nodes
  private natureGain: GainNode | null = null;
  private natureNodes: {
    sources: AudioBufferSourceNode[];
    filters: BiquadFilterNode[];
    gains: GainNode[];
    lfos: OscillatorNode[];
    intervals: number[];
  } = { sources: [], filters: [], gains: [], lfos: [], intervals: [] };

  private isMuted: boolean = false;
  private userVolume: number = 0.7; // 0 to 1
  private fadeMultiplier: number = 1.0; // 0 to 1 during timer fade-out

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.userVolume * this.fadeMultiplier, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setVolume(vol: number): void {
    this.userVolume = Math.max(0, Math.min(1, vol));
    this.applyMasterGain();
  }

  public getVolume(): number {
    return this.userVolume;
  }

  public setFadeMultiplier(multiplier: number): void {
    this.fadeMultiplier = Math.max(0, Math.min(1, multiplier));
    this.applyMasterGain();
  }

  private applyMasterGain(): void {
    if (!this.masterGain || !this.ctx) return;
    const target = this.isMuted ? 0 : this.userVolume * this.fadeMultiplier;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(target, now + 0.1);
  }

  // --- Buffer Generators ---

  private createPinkNoiseBuffer(ctx: AudioContext, durationSeconds = 6): AudioBuffer {
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  private createBrownNoiseBuffer(ctx: AudioContext, durationSeconds = 6): AudioBuffer {
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Gain compensation
      }
    }
    return buffer;
  }

  private createWhiteNoiseBuffer(ctx: AudioContext, durationSeconds = 6): AudioBuffer {
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }
    }
    return buffer;
  }

  // --- WHITE NOISE MODE ---

  public playWhiteNoise(level: WhiteNoiseLevel): void {
    const ctx = this.getAudioContext();
    this.stopNatureSounds();

    // If already playing white noise, smoothly adjust filter and buffer
    if (this.noiseSource && this.noiseFilter && this.noiseGain) {
      this.updateWhiteNoiseSettings(level);
      return;
    }

    this.stopWhiteNoise();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.4);

    const filter = ctx.createBiquadFilter();
    let buffer: AudioBuffer;

    if (level === 'gentle') {
      // Soft gentle pink noise, warm low-pass cut off
      buffer = this.createPinkNoiseBuffer(ctx);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);
    } else if (level === 'balanced') {
      // Standard balanced white/pink noise
      buffer = this.createPinkNoiseBuffer(ctx);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);
    } else {
      // Deep womb brown noise
      buffer = this.createBrownNoiseBuffer(ctx);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    source.start();

    this.noiseSource = source;
    this.noiseFilter = filter;
    this.noiseGain = gain;
    this.currentMode = 'white-noise';
  }

  private updateWhiteNoiseSettings(level: WhiteNoiseLevel): void {
    if (!this.ctx || !this.noiseFilter) return;
    const now = this.ctx.currentTime;
    if (level === 'gentle') {
      this.noiseFilter.frequency.linearRampToValueAtTime(950, now + 0.5);
      this.noiseFilter.Q.linearRampToValueAtTime(0.7, now + 0.5);
    } else if (level === 'balanced') {
      this.noiseFilter.frequency.linearRampToValueAtTime(2400, now + 0.5);
      this.noiseFilter.Q.linearRampToValueAtTime(0.5, now + 0.5);
    } else {
      this.noiseFilter.frequency.linearRampToValueAtTime(450, now + 0.5);
      this.noiseFilter.Q.linearRampToValueAtTime(1.2, now + 0.5);
    }
  }

  public stopWhiteNoise(fadeTime = 0.4): void {
    if (this.noiseGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.noiseGain.gain.cancelScheduledValues(now);
      this.noiseGain.gain.linearRampToValueAtTime(0, now + fadeTime);
      const src = this.noiseSource;
      setTimeout(() => {
        try {
          src?.stop();
          src?.disconnect();
        } catch {
          // ignore
        }
      }, fadeTime * 1000 + 50);
    } else if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // ignore
      }
    }
    this.noiseSource = null;
    this.noiseFilter = null;
    this.noiseGain = null;
    if (this.currentMode === 'white-noise') {
      this.currentMode = 'none';
    }
  }

  // --- NATURE SOUNDS MODE ---

  public playNatureSound(type: NatureSoundType): void {
    const ctx = this.getAudioContext();
    this.stopWhiteNoise();
    this.stopNatureSounds();

    const natureGain = ctx.createGain();
    natureGain.gain.setValueAtTime(0, ctx.currentTime);
    natureGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5);
    natureGain.connect(this.masterGain!);
    this.natureGain = natureGain;

    if (type === 'forest') {
      this.setupForestAmbience(ctx, natureGain);
    } else if (type === 'rain') {
      this.setupRainAmbience(ctx, natureGain);
    } else if (type === 'ocean') {
      this.setupOceanAmbience(ctx, natureGain);
    } else if (type === 'night-birds') {
      this.setupNightBirdsAmbience(ctx, natureGain);
    } else if (type === 'heartbeat') {
      this.setupHeartbeatAmbience(ctx, natureGain);
    }

    this.currentMode = 'nature';
  }

  private setupForestAmbience(ctx: AudioContext, destination: GainNode): void {
    // 1. Wind through trees: Pink noise modulated by gentle LFO
    const pinkBuf = this.createPinkNoiseBuffer(ctx, 8);
    const windSource = ctx.createBufferSource();
    windSource.buffer = pinkBuf;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(550, ctx.currentTime);
    windFilter.Q.setValueAtTime(1.8, ctx.currentTime);

    // LFO to simulate gentle gusts through branches
    const windLfo = ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.09, ctx.currentTime); // ~11 sec wave
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.setValueAtTime(250, ctx.currentTime); // mod amplitude
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start();

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.5, ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(destination);
    windSource.start();

    // 2. Leaf rustle / ambient air
    const brownBuf = this.createBrownNoiseBuffer(ctx, 6);
    const leafSource = ctx.createBufferSource();
    leafSource.buffer = brownBuf;
    leafSource.loop = true;

    const leafFilter = ctx.createBiquadFilter();
    leafFilter.type = 'lowpass';
    leafFilter.frequency.setValueAtTime(350, ctx.currentTime);

    const leafGain = ctx.createGain();
    leafGain.gain.setValueAtTime(0.4, ctx.currentTime);

    leafSource.connect(leafFilter);
    leafFilter.connect(leafGain);
    leafGain.connect(destination);
    leafSource.start();

    this.natureNodes.sources.push(windSource, leafSource);
    this.natureNodes.filters.push(windFilter, leafFilter);
    this.natureNodes.gains.push(windGain, leafGain, windLfoGain);
    this.natureNodes.lfos.push(windLfo);
  }

  private setupRainAmbience(ctx: AudioContext, destination: GainNode): void {
    // 1. Warm soothing rain body: Brown + Pink noise bed filtered smoothly with gentle lowpass
    const pinkBuf = this.createPinkNoiseBuffer(ctx, 8);
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = pinkBuf;
    rainSource.loop = true;

    // Dual-stage soft lowpass eliminates any harsh static sizzle or sharp highs
    const rainFilter1 = ctx.createBiquadFilter();
    rainFilter1.type = 'lowpass';
    rainFilter1.frequency.setValueAtTime(1350, ctx.currentTime);
    rainFilter1.Q.setValueAtTime(0.5, ctx.currentTime);

    const rainFilter2 = ctx.createBiquadFilter();
    rainFilter2.type = 'lowpass';
    rainFilter2.frequency.setValueAtTime(1800, ctx.currentTime);
    rainFilter2.Q.setValueAtTime(0.5, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.48, ctx.currentTime);

    rainSource.connect(rainFilter1);
    rainFilter1.connect(rainFilter2);
    rainFilter2.connect(rainGain);
    rainGain.connect(destination);
    rainSource.start();

    // 2. Soft, natural foliage and window pane diffuse shower spray (wide non-resonant band)
    const sprayBuf = this.createPinkNoiseBuffer(ctx, 6);
    const spraySource = ctx.createBufferSource();
    spraySource.buffer = sprayBuf;
    spraySource.loop = true;

    const sprayFilter = ctx.createBiquadFilter();
    sprayFilter.type = 'bandpass';
    sprayFilter.frequency.setValueAtTime(1650, ctx.currentTime);
    sprayFilter.Q.setValueAtTime(0.85, ctx.currentTime); // Low Q avoids any whistling resonance

    // Gentle slow wave mimicking subtle natural breeze shifting the rain intensity
    const sprayLfo = ctx.createOscillator();
    sprayLfo.frequency.setValueAtTime(0.06, ctx.currentTime); // ~16s wave
    const sprayLfoGain = ctx.createGain();
    sprayLfoGain.gain.setValueAtTime(0.06, ctx.currentTime);
    sprayLfo.connect(sprayLfoGain);

    const sprayGain = ctx.createGain();
    sprayGain.gain.setValueAtTime(0.18, ctx.currentTime);
    sprayLfoGain.connect(sprayGain.gain);
    sprayLfo.start();

    spraySource.connect(sprayFilter);
    sprayFilter.connect(sprayGain);
    sprayGain.connect(destination);
    spraySource.start();

    // 3. Ultra-soft deep ground droplet bed (Brown noise through lowpass)
    const brownBuf = this.createBrownNoiseBuffer(ctx, 8);
    const groundSource = ctx.createBufferSource();
    groundSource.buffer = brownBuf;
    groundSource.loop = true;

    const groundFilter = ctx.createBiquadFilter();
    groundFilter.type = 'lowpass';
    groundFilter.frequency.setValueAtTime(420, ctx.currentTime);

    const groundGain = ctx.createGain();
    groundGain.gain.setValueAtTime(0.28, ctx.currentTime);

    groundSource.connect(groundFilter);
    groundFilter.connect(groundGain);
    groundGain.connect(destination);
    groundSource.start();

    this.natureNodes.sources.push(rainSource, spraySource, groundSource);
    this.natureNodes.filters.push(rainFilter1, rainFilter2, sprayFilter, groundFilter);
    this.natureNodes.gains.push(rainGain, sprayGain, sprayLfoGain, groundGain);
    this.natureNodes.lfos.push(sprayLfo);
  }

  private setupOceanAmbience(ctx: AudioContext, destination: GainNode): void {
    // Ocean surf: Pink noise + Brown noise modulated by slow rhythmic tidal wave cycle (~8 seconds)
    const oceanBuf = this.createBrownNoiseBuffer(ctx, 8);
    const oceanSource = ctx.createBufferSource();
    oceanSource.buffer = oceanBuf;
    oceanSource.loop = true;

    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(450, ctx.currentTime);
    waveFilter.Q.setValueAtTime(1.0, ctx.currentTime);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.3, ctx.currentTime);

    // LFO for rhythmic tide surge
    const tideLfo = ctx.createOscillator();
    tideLfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8.3 sec per tidal swell

    const tideFilterGain = ctx.createGain();
    tideFilterGain.gain.setValueAtTime(320, ctx.currentTime); // sweeps filter 130Hz -> 770Hz
    tideLfo.connect(tideFilterGain);
    tideFilterGain.connect(waveFilter.frequency);

    const tideAmpGain = ctx.createGain();
    tideAmpGain.gain.setValueAtTime(0.35, ctx.currentTime);
    tideLfo.connect(tideAmpGain);
    tideAmpGain.connect(waveGain.gain);

    tideLfo.start();

    oceanSource.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(destination);
    oceanSource.start();

    // Foam breaking on sand: Pink noise with soft hiss swelling during crest
    const foamBuf = this.createPinkNoiseBuffer(ctx, 6);
    const foamSource = ctx.createBufferSource();
    foamSource.buffer = foamBuf;
    foamSource.loop = true;

    const foamFilter = ctx.createBiquadFilter();
    foamFilter.type = 'bandpass';
    foamFilter.frequency.setValueAtTime(1100, ctx.currentTime);
    foamFilter.Q.setValueAtTime(1.4, ctx.currentTime);

    const foamGain = ctx.createGain();
    foamGain.gain.setValueAtTime(0.15, ctx.currentTime);

    foamSource.connect(foamFilter);
    foamFilter.connect(foamGain);
    foamGain.connect(destination);
    foamSource.start();

    this.natureNodes.sources.push(oceanSource, foamSource);
    this.natureNodes.filters.push(waveFilter, foamFilter);
    this.natureNodes.gains.push(waveGain, tideFilterGain, tideAmpGain, foamGain);
    this.natureNodes.lfos.push(tideLfo);
  }

  private setupNightBirdsAmbience(ctx: AudioContext, destination: GainNode): void {
    // 1. Nocturnal forest background atmosphere (gentle night air & deep rustle)
    const nightBuf = this.createBrownNoiseBuffer(ctx, 8);
    const nightSource = ctx.createBufferSource();
    nightSource.buffer = nightBuf;
    nightSource.loop = true;

    const nightFilter = ctx.createBiquadFilter();
    nightFilter.type = 'lowpass';
    nightFilter.frequency.setValueAtTime(320, ctx.currentTime);

    const nightGain = ctx.createGain();
    nightGain.gain.setValueAtTime(0.35, ctx.currentTime);

    nightSource.connect(nightFilter);
    nightFilter.connect(nightGain);
    nightGain.connect(destination);
    nightSource.start();

    // 2. Very quiet, distant night crickets texture (attenuated by 50% for maximum comfort)
    const cricketBuf = this.createPinkNoiseBuffer(ctx, 5);
    const cricketSource = ctx.createBufferSource();
    cricketSource.buffer = cricketBuf;
    cricketSource.loop = true;

    const cricketFilter = ctx.createBiquadFilter();
    cricketFilter.type = 'bandpass';
    cricketFilter.frequency.setValueAtTime(4200, ctx.currentTime);
    cricketFilter.Q.setValueAtTime(2.4, ctx.currentTime); // Soft Q prevents piercing peaks

    const cricketLfo = ctx.createOscillator();
    cricketLfo.frequency.setValueAtTime(5.8, ctx.currentTime); // Gentle natural cricket pulse
    const cricketLfoGain = ctx.createGain();
    cricketLfoGain.gain.setValueAtTime(0.02, ctx.currentTime); // Reduced by 50% (was 0.04)
    cricketLfo.connect(cricketLfoGain);

    const cricketGain = ctx.createGain();
    cricketGain.gain.setValueAtTime(0.02, ctx.currentTime); // Reduced by 50% (was 0.04)
    cricketLfoGain.connect(cricketGain.gain);
    cricketLfo.start();

    cricketSource.connect(cricketFilter);
    cricketFilter.connect(cricketGain);
    cricketGain.connect(destination);
    cricketSource.start();

    this.natureNodes.sources.push(nightSource, cricketSource);
    this.natureNodes.filters.push(nightFilter, cricketFilter);
    this.natureNodes.gains.push(nightGain, cricketGain, cricketLfoGain);
    this.natureNodes.lfos.push(cricketLfo);

    // 3. Periodic soft nocturnal forest bird / owl calls
    const birdInterval = window.setInterval(() => {
      if (!this.ctx || this.currentMode !== 'nature') return;
      try {
        const now = this.ctx.currentTime;
        const isOwl = Math.random() > 0.4;

        if (isOwl) {
          // Soft distant owl call: "Hoo... hu-hoooo"
          // Pulse 1
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          const filter1 = this.ctx.createBiquadFilter();

          filter1.type = 'lowpass';
          filter1.frequency.setValueAtTime(750, now);

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(490, now);
          osc1.frequency.exponentialRampToValueAtTime(470, now + 0.35);

          gain1.gain.setValueAtTime(0.001, now);
          gain1.gain.linearRampToValueAtTime(0.06, now + 0.08);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

          osc1.connect(filter1);
          filter1.connect(gain1);
          gain1.connect(destination);
          osc1.start(now);
          osc1.stop(now + 0.4);

          // Pulse 2 (0.45s later, slightly longer and softer)
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          const filter2 = this.ctx.createBiquadFilter();

          filter2.type = 'lowpass';
          filter2.frequency.setValueAtTime(750, now + 0.45);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(510, now + 0.45);
          osc2.frequency.exponentialRampToValueAtTime(455, now + 1.05);

          gain2.gain.setValueAtTime(0.001, now + 0.45);
          gain2.gain.linearRampToValueAtTime(0.07, now + 0.55);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

          osc2.connect(filter2);
          filter2.connect(gain2);
          gain2.connect(destination);
          osc2.start(now + 0.45);
          osc2.stop(now + 1.15);
        } else {
          // Soft nocturnal forest sweet chirp in the distance
          const chirpOsc = this.ctx.createOscillator();
          const chirpGain = this.ctx.createGain();
          const chirpFilter = this.ctx.createBiquadFilter();

          chirpFilter.type = 'bandpass';
          chirpFilter.frequency.setValueAtTime(1850, now);
          chirpFilter.Q.setValueAtTime(2.5, now);

          chirpOsc.type = 'sine';
          chirpOsc.frequency.setValueAtTime(1750, now);
          chirpOsc.frequency.linearRampToValueAtTime(2150, now + 0.07);
          chirpOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.16);

          chirpGain.gain.setValueAtTime(0.001, now);
          chirpGain.gain.linearRampToValueAtTime(0.03, now + 0.03);
          chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

          chirpOsc.connect(chirpFilter);
          chirpFilter.connect(chirpGain);
          chirpGain.connect(destination);
          chirpOsc.start(now);
          chirpOsc.stop(now + 0.18);
        }
      } catch {
        // ignore
      }
    }, 5500);

    this.natureNodes.intervals.push(birdInterval);
  }

  private setupHeartbeatAmbience(ctx: AudioContext, destination: GainNode): void {
    // Authentic intrauterine maternal heartbeat
    // Natural maternal resting tempo: ~68 BPM (cycle = 60 / 68 ≈ 0.88235s)
    const bpm = 68;
    const cycleDuration = 60 / bpm;
    const sampleRate = ctx.sampleRate;
    const numCycles = 4;
    const cycleSamples = Math.round(cycleDuration * sampleRate);
    const totalSamples = cycleSamples * numCycles;

    const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    for (let c = 0; c < numCycles; c++) {
      const cycleStart = c * cycleSamples;

      // 1. First heart sound (S1 - "lub", ventricular contraction, deeper resonant pulse)
      // Duration ~0.15s
      const s1Duration = 0.15;
      const s1Samples = Math.round(s1Duration * sampleRate);
      let s1Phase = 0;
      for (let i = 0; i < s1Samples; i++) {
        const t = i / sampleRate;
        const progress = t / s1Duration;
        // Pitch glide from 64 Hz down to 38 Hz
        const freq = 64 * Math.pow(38 / 64, progress);
        s1Phase += (2 * Math.PI * freq) / sampleRate;

        // Smooth cosine bell envelope without clicks
        let env = 0;
        if (t < 0.025) {
          env = Math.sin((Math.PI / 2) * (t / 0.025));
        } else {
          env = Math.cos((Math.PI / 2) * ((t - 0.025) / (s1Duration - 0.025)));
        }
        env = Math.max(0, env);
        // Deep acoustic tone with soft harmonic warmth
        const sample = (Math.sin(s1Phase) + 0.22 * Math.sin(s1Phase * 1.85)) * env * 0.85;

        const idx = cycleStart + i;
        if (idx < totalSamples) {
          leftChannel[idx] += sample * 0.98;
          rightChannel[idx] += sample * 1.02;
        }
      }

      // 2. Second heart sound (S2 - "dub", semilunar valve closure)
      // Occurs ~0.29s after S1
      const s2StartOffset = 0.29;
      const s2StartSample = cycleStart + Math.round(s2StartOffset * sampleRate);
      const s2Duration = 0.11;
      const s2Samples = Math.round(s2Duration * sampleRate);
      let s2Phase = 0;
      for (let i = 0; i < s2Samples; i++) {
        const t = i / sampleRate;
        const progress = t / s2Duration;
        // Pitch glide from 80 Hz down to 48 Hz
        const freq = 80 * Math.pow(48 / 80, progress);
        s2Phase += (2 * Math.PI * freq) / sampleRate;

        let env = 0;
        if (t < 0.018) {
          env = Math.sin((Math.PI / 2) * (t / 0.018));
        } else {
          env = Math.cos((Math.PI / 2) * ((t - 0.018) / (s2Duration - 0.018)));
        }
        env = Math.max(0, env);
        const sample = (Math.sin(s2Phase) + 0.18 * Math.sin(s2Phase * 1.9)) * env * 0.68;

        const idx = s2StartSample + i;
        if (idx < totalSamples) {
          leftChannel[idx] += sample * 1.02;
          rightChannel[idx] += sample * 0.98;
        }
      }
    }

    // Connect source through amniotic fluid muffling filter
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Fluid lowpass filter simulating intrauterine acoustics (~165 Hz cutoff)
    const fluidFilter = ctx.createBiquadFilter();
    fluidFilter.type = 'lowpass';
    fluidFilter.frequency.setValueAtTime(165, ctx.currentTime);
    fluidFilter.Q.setValueAtTime(1.4, ctx.currentTime);

    // Warm output gain (pure heartbeat, no extra hiss/noise)
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.15, ctx.currentTime);

    source.connect(fluidFilter);
    fluidFilter.connect(gainNode);
    gainNode.connect(destination);

    source.start();

    this.natureNodes.sources.push(source);
    this.natureNodes.filters.push(fluidFilter);
    this.natureNodes.gains.push(gainNode);
  }

  public stopNatureSounds(fadeTime = 0.4): void {
    this.natureNodes.intervals.forEach((id) => clearInterval(id));
    this.natureNodes.intervals = [];

    if (this.natureGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.natureGain.gain.cancelScheduledValues(now);
      this.natureGain.gain.linearRampToValueAtTime(0, now + fadeTime);
      const sourcesToStop = [...this.natureNodes.sources];
      const lfosToStop = [...this.natureNodes.lfos];
      setTimeout(() => {
        sourcesToStop.forEach((s) => {
          try {
            s.stop();
            s.disconnect();
          } catch {
            // ignore
          }
        });
        lfosToStop.forEach((l) => {
          try {
            l.stop();
            l.disconnect();
          } catch {
            // ignore
          }
        });
      }, fadeTime * 1000 + 50);
    } else {
      this.natureNodes.sources.forEach((s) => {
        try {
          s.stop();
          s.disconnect();
        } catch {
          // ignore
        }
      });
      this.natureNodes.lfos.forEach((l) => {
        try {
          l.stop();
          l.disconnect();
        } catch {
          // ignore
        }
      });
    }

    this.natureNodes = { sources: [], filters: [], gains: [], lfos: [], intervals: [] };
    this.natureGain = null;
    if (this.currentMode === 'nature') {
      this.currentMode = 'none';
    }
  }

  public stopAll(fadeTime = 0.5): void {
    this.stopWhiteNoise(fadeTime);
    this.stopNatureSounds(fadeTime);
    this.currentMode = 'none';
  }

  public getActiveMode(): 'none' | 'white-noise' | 'nature' {
    return this.currentMode;
  }
}

export const soundEngine = new SoundEngine();
