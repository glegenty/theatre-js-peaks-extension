import WaveformData from 'waveform-data';
import Peaks from 'peaks.js';
import { onChange, val } from '@theatre/core'


export default class WaveformViewer {
    constructor() {
        this.initialized = false
        this.options = null
        this.visible = false

        this.$el = document.createElement('div')
        this.$overView = document.createElement('div')
        this.$zoomView = document.createElement('div')
        this.$waitingView = document.createElement('div')
        this.$overView.style.width = '1000px'
        this.$overView.style.height = '100px'
        this.$waitingView.innerHTML = 'Waiting for audio data'
        this.$waitingView.style.position = 'absolute'
        this.$waitingView.style.top = '50%';
        this.$waitingView.style.left = 0;
        this.$waitingView.style.width = '100%';
        this.$waitingView.style.textAlign = 'center';
        this.$zoomView.style.width = '1000px'
        this.$zoomView.style.height = '100px'
        this.$el.appendChild(this.$zoomView)
        this.$el.appendChild(this.$overView)
        this.$el.appendChild(this.$waitingView)
    }

    getPlayer(sequence) {
        const player = {
            init: function (eventEmitter) {
                this.eventEmitter = eventEmitter
                this.state = 'paused';
                this.interval = null;
                this.intervalTime = 250
                onChange(sequence.pointer.playing, (playing => {
                    playing ? this.play() : this.pause()
                }))
                onChange(sequence.pointer.position, (position) => {
                    this.eventEmitter.emit('player.timeupdate', position);
                })
                return Promise.resolve()
            },
            destroy: function () {
                this._stopInterval()
            },
            _stopInterval: function () {
                if (this.interval !== null) {
                    clearInterval(this.interval);
                    this.interval = null;
                }
            },
            _startInterval: function () {
                if (this.interval === null) {
                    this.interval = setInterval(() => {
                        this.eventEmitter.emit('player.timeupdate', this.getCurrentTime());
                    }, this.intervalTime)
                }
            },
            play: function () {
                this.state = 'playing';
                this.eventEmitter.emit('player.playing', this.getCurrentTime());
            },
            pause: function () {
                this.state = 'paused';
                this.eventEmitter.emit('player.pause', this.getCurrentTime());
            },
            seek: function (time) {
                this.previousState = this.state; // 'paused' or 'playing'
                this.state = 'seeking';

                sequence.position = time;
                this.state = this.previousState;
                this.eventEmitter.emit('player.seeked', this.getCurrentTime());
                this.eventEmitter.emit('player.timeupdate', this.getCurrentTime());
            },
            isPlaying: function () {
                return val(sequence.pointer.playing);
            },
            isSeeking: function () {
                return false;
            },
            getCurrentTime: function () {                
                return val(sequence.pointer.position);
            },
            getDuration: function () {
                return val(sequence.pointer.length);
            },
        };
        return player
    }

    addAudio ({audioGraph, sequence}) {
        const player = this.getPlayer(sequence)
        this.options = {
            zoomview: {
                container: this.$zoomView
            },
            overview: {
                container: this.$overView
            },
            
            webAudio: {
                audioBuffer: this.cloneAudioBuffer(audioGraph.decodedBuffer)
            },
            player
        };
        if (this.visible) this.init();
    }

    async init () {
        if (this.initialized || !this.options) return
        this.initialized = true;
        Peaks.init(this.options, (err, peaks) => {
            console.log('err: ', err);
            console.log('peaks: ', peaks);
            this.$waitingView.style.display = 'none'

        });
    }

    cloneAudioBuffer(fromAudioBuffer) {
        const audioBuffer = new AudioBuffer({
          length:fromAudioBuffer.length, 
          numberOfChannels:fromAudioBuffer.numberOfChannels, 
          sampleRate:fromAudioBuffer.sampleRate
        });
        for(let channelI = 0; channelI < audioBuffer.numberOfChannels; ++channelI) {
          const samples = fromAudioBuffer.getChannelData(channelI);
          audioBuffer.copyToChannel(samples, channelI);
        }
        return audioBuffer;
      }
}