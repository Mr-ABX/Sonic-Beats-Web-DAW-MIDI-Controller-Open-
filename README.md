# Sonic Beats 🎹✨
**Your Digital MIDI Controller & Lightweight Web DAW (Open Source)**

Welcome to **Sonic Beats**! 👋 Whether you're a professional music producer looking for a quick scratchpad, an independent artist capturing a sudden spark of inspiration, or someone just starting their musical journey, this tool is built for you. 

Sonic Beats is a completely open-source, beautifully designed web-based synthesizer, drum machine, and sequencer. It runs entirely in your browser—no massive downloads, no heavy CPU taxes, just pure creative flow.

## 🌟 Why Sonic Beats?
I wanted to build something that feels **professional yet approachable**. A lot of DAWs (Digital Audio Workstations) can be intimidating and cluttered. Sonic Beats is stripped down to the essentials but packed with advanced features underneath. You can use it to quickly sketch out a beat or bassline, and then easily export it for use in your main DAW!

**Is it good for professionals and artists?**
Absolutely! The audio engine uses the Web Audio API with near-zero latency, meaning it's incredibly responsive for live playing and recording dubs. The sounds are synthesized mathematically in real-time, giving you analog-style warmth without any sampled overhead.

## ✨ Features
* **Modular Synth Engine:** 4 waveforms (Sine, Square, Sawtooth, Triangle) with customizable ADSR envelopes and octave pitch adjustments.
* **16-Step Live Sequencer:** With visual dubbing and real-time quantization (snap to 16th notes or go completely off-grid).
* **Built-in Mixer & FX:** Individual volume control for Synths, Bass, and Drums, plus Delay, Reverb, and global Pitch Bending.
* **Arpeggiator (ARP):** Hold down chords and let the built-in Arp engine work its rhythmic magic.
* **Physical MIDI Support:** Easily interface with your physical MIDI hardware (like keyboards and drum triggers) directly over USB!
* **Keyboard Mapper:** Drag, click, and assign your computer keyboard to map perfectly to the drum pads and piano keys for fluent laptop tracking.
* **Export Your Ideas:** Export your sequences quickly to JSON, or simply sketch an idea and bring it to your main DAW of choice.
* **Theme Engine:** Interchangeable aesthetics including Neon Cyber, Classic Gold, and Industrial Green.

## 🚀 Installation & Setup Guide
Because Sonic Beats runs on the web, there are no complicated installers!

**To run locally for development:**
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/sonic-beats.git
   ```
2. Enter the directory:
   ```bash
   cd sonic-beats
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`

## 💻 System Requirements
Sonic Beats is highly optimized, ultra-lightweight, and runs right in your browser. It doesn't rely on huge, memory-hogging sample libraries.
* **OS:** Any modern operating system (Windows, macOS, Linux).
* **Browser:** Chrome, Firefox, Safari, or Edge (Google Chrome is recommended for the best Web Audio & Web MIDI API support).
* **CPU:** Extremely low overhead. Any standard consumer computer or laptop made within the last decade can run it beautifully.
* **RAM:** Incredible efficiency, requiring under 100MB of memory while actively playing loops.

## 🤝 Contributing
This is an open-source project, and I'd love your help to make it better! Feel free to open bug issues, submit pull requests with cool new features, or just share the music you've made with it.

Happy beat making! 🎧
