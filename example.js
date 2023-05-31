studio.extend(waveformViewerExtension); // Add extension to studio

sheet.sequence.attachAudio({
    source: require('./music.mp3'),
})
.then((audioGraph) => {
      if (studio) { // If studio "view"
        waveformViewerExtension.addAudio({audioGraph, sequence: this.sheet.sequence}) // Pass the audioGraph and the sequence to the extension
      }
})