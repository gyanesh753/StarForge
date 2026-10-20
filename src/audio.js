// A deliberately quiet, synthesized score. No audio downloads or autoplay.
export class Soundscape {
  constructor() { this.enabled = false; this.context = null; this.environment = {earth:false,depth:0,night:false}; }
  async toggle() {
    if (!this.context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      this.context = new Audio();
      this.gain = this.context.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(this.context.destination);
      [65.406, 98, 130.812, 196.22].forEach((frequency, i) => {
        const oscillator = this.context.createOscillator();
        const voice = this.context.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        voice.gain.value = i === 0 ? 0.38 : 0.13;
        oscillator.connect(voice); voice.connect(this.gain); oscillator.start();
      });
      // Synthesized surf/water texture, not a recording of animal calls or a
      // claim to reproduce human underwater hearing.
      const buffer=this.context.createBuffer(1,this.context.sampleRate*3,this.context.sampleRate);
      const data=buffer.getChannelData(0);let smooth=0;
      for(let i=0;i<data.length;i++){smooth=(smooth+(Math.random()*2-1)*.035)/1.035;data[i]=smooth*4;}
      this.waterBuffer=buffer;
      const noise=this.context.createBufferSource();noise.buffer=buffer;noise.loop=true;
      this.waterFilter=this.context.createBiquadFilter();this.waterFilter.type='lowpass';this.waterFilter.frequency.value=1300;
      this.waterGain=this.context.createGain();this.waterGain.gain.value=0;
      const swell=this.context.createOscillator(),swellDepth=this.context.createGain(),swellGain=this.context.createGain();
      swell.frequency.value=.16;swellDepth.gain.value=.35;swellGain.gain.value=.65;
      swell.connect(swellDepth);swellDepth.connect(swellGain.gain);swell.start();
      noise.connect(this.waterFilter);this.waterFilter.connect(swellGain);swellGain.connect(this.waterGain);this.waterGain.connect(this.context.destination);noise.start();
    }
    await this.context.resume();
    this.enabled = !this.enabled;
    this.gain.gain.setTargetAtTime(this.enabled ? 0.09 : 0, this.context.currentTime, 0.7);
    this.setEnvironment(this.environment);
    return this.enabled;
  }
  setEnvironment(environment) {
    const wasUnderwater=this.environment.underwater;
    this.environment=environment;
    if(!this.context)return;
    const now=this.context.currentTime,under=environment.underwater;
    this.gain.gain.setTargetAtTime(this.enabled?(under?.045:.09):0,now,.65);
    const proximity=under?1:Math.exp(-(environment.waterClearance||0)/55);
    this.waterGain.gain.setTargetAtTime(this.enabled&&environment.earth?(under?.035:environment.night?.04:.055)*proximity:0,now,.6);
    this.waterFilter.frequency.setTargetAtTime(under?240:environment.night?950:1300,now,.5);
    if(this.enabled&&environment.earth&&typeof wasUnderwater==='boolean'&&wasUnderwater!==under)this.waterCrossing();
  }
  waterCrossing() {
    const now=this.context.currentTime,noise=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),gain=this.context.createGain();
    noise.buffer=this.waterBuffer;filter.type='bandpass';filter.frequency.value=650;filter.Q.value=.6;
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.1,now+.05);gain.gain.exponentialRampToValueAtTime(.0001,now+.7);
    noise.connect(filter);filter.connect(gain);gain.connect(this.context.destination);noise.start();noise.stop(now+.75);
    noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};
  }
  chime() {
    if (!this.enabled || !this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.exponentialRampToValueAtTime(783.99, now+0.3);
    gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(0.025,now+0.04); gain.gain.exponentialRampToValueAtTime(0.0001,now+1.5);
    oscillator.connect(gain); gain.connect(this.context.destination); oscillator.start(now); oscillator.stop(now+1.6);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  visibility(hidden) {
    if (!this.context) return;
    if (hidden) this.context.suspend();
    else if (this.enabled) this.context.resume();
  }
}
