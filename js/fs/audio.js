PP64.ns("fs");

PP64.fs.audio = (function() {
  const _audioOffsets = {};
  _audioOffsets[$gameType.MP1_USA] = [ // Length 0x7B3DF0
    // 15396A0
    {
      relative: 0,
      offsets: [
        { upper: 0x00061746, lower: 0x0006174A },
        { upper: 0x002DA3D2, lower: 0x002DA3D6 },
      ]
    },

    // 1778BC0
    {
      relative: 0x23F520,
      offsets: [
        { upper: 0x0001AF2A, lower: 0x0001AF2E },
        { upper: 0x0006174E, lower: 0x00061752 },
        { upper: 0x0006177E, lower: 0x00061782 },
        { upper: 0x002DA3DA, lower: 0x002DA3DE },
        { upper: 0x002DA402, lower: 0x002DA406 },
      ]
    },

    // 1832AE0
    {
      relative: 0x2F9440,
      offsets: [
        { upper: 0x0001AF32, lower: 0x0001AF36 },
        { upper: 0x0006172E, lower: 0x00061732 },
        { upper: 0x00061786, lower: 0x0006178A },
        { upper: 0x002DA3BE, lower: 0x002DA3C2 },
        { upper: 0x002DA40A, lower: 0x002DA40E },
      ]
    },

    // 1BB8460
    {
      relative: 0x67EDC0,
      offsets: [
        { upper: 0x0001AF0E, lower: 0x0001AF12 },
        { upper: 0x00061762, lower: 0x00061766 },
        { upper: 0x002DA3EA, lower: 0x002DA3EE },
      ]
    },

    // 1CECC60, FXD0
    {
      relative: 0x7B35C0,
      offsets: [
        { upper: 0x0001AF5A, lower: 0x0001AF5E },
      ]
    },

    // 1CED490, 0xffffffffs EOF
    {
      relative: 0x7B3DF0,
      offsets: [
        { upper: 0x0001AF66, lower: 0x0001AF6A },
      ]
    },
  ];

  _audioOffsets[$gameType.MP1_JPN] = [ // Length ?
  ];

  _audioOffsets[$gameType.MP2_USA] = [ // Length 0x6DAB50
    // 0x1750450
    {
      relative: 0, // MBF0
      offsets: [
        { upper: 0x0001D342, lower: 0x0001D346 },
        { upper: 0x0007A9EE, lower: 0x0007A9F2 },
        { upper: 0x0007AA12, lower: 0x0007AA16 },
      ]
    },
    // 0x190A090
    {
      relative: 0x1B9C40, // SBF0
      offsets: [
        { upper: 0x0007A9FA, lower: 0x0007A9FE },
      ]
    },
    // 0x1CBF410
    {
      relative: 0x56EFC0, // SBF0
      offsets: [
        { upper: 0x0001D34E, lower: 0x0001D352 },
        { upper: 0x0007AA1E, lower: 0x0007AA22 },
      ]
    },
    // 0x1E2A560
    {
      relative: 0x6DA110, // FXD0
      offsets: [
        { upper: 0x0001D382, lower: 0x0001D386 },
      ]
    },
  ];
  _audioOffsets[$gameType.MP3_USA] = [ // Length 0x67be40
    // 0x1881C40
    {
      relative: 0, // MBF0
      offsets: [
        { upper: 0x0000F26A, lower: 0x0000F26E },
        { upper: 0x0004BEF2, lower: 0x0004BEF6 },
      ]
    },
    // 0x1A56870
    {
      relative: 0x1D4C30, // SBF0
      offsets: [
        { upper: 0x0000F276, lower: 0x0000F27A },
        { upper: 0x0004BEFE, lower: 0x0004BF02 },
      ]
    },
    // 0x1EFD040
    {
      relative: 0x67B400, // FXD0
      offsets: [
        { upper: 0x0000F29E, lower: 0x0000F2A2 },
      ]
    },
    // E0F 0x1EFDA80
  ];

  function getROMOffset(subsection = 0) {
    let romView = PP64.romhandler.getDataView();
    let patchInfo = getPatchInfo()[subsection];
    if (!patchInfo)
      return null;
    let romOffset = patchInfo.offsets[0];
    let upper = romView.getUint16(romOffset.upper) << 16;
    let lower = romView.getUint16(romOffset.lower);
    let offset = upper | lower;
    if (offset & 0x00008000)
      offset = offset - 0x00010000; // Need adjustment because of the signed addition workaround.
    $$log(`Audio.getROMOffset -> ${$$hex(offset)}`);
    return offset;
  }

  function setROMOffset(newOffset, buffer) {
    $$log(`Audio.setROMOffset(${$$hex(newOffset)})`);
    let romView = new DataView(buffer);
    let patchSubsections = getPatchInfo();
    for (let i = 0; i < patchSubsections.length; i++) {
      let subsection = patchSubsections[i];
      let subsectionaddr = newOffset + subsection.relative;
      let upper = (subsectionaddr & 0xFFFF0000) >>> 16;
      let lower = subsectionaddr & 0x0000FFFF;
      if (lower & 0x8000)
        upper += 1; // Need adjustment because of the signed addition workaround.
      for (let j = 0; j < subsection.offsets.length; j++) {
        romView.setUint16(subsection.offsets[j].upper, upper);
        romView.setUint16(subsection.offsets[j].lower, lower);
      }
    }
  }

  function getPatchInfo() {
    return _audioOffsets[PP64.romhandler.getROMGame()];
  }

  function read(index) {
    throw "audio.read not implemented";
  }

  function write(index, value) {
    throw "audio.write not implemented";
  }

  let _audioCache;

  function clearCache() {
    _audioCache = null;
  }

  function extract() {
    let buffer = PP64.romhandler.getROMBuffer();
    let offset = getROMOffset();
    if (offset === null)
      return;
    let len = getByteLength();
    _audioCache = buffer.slice(offset, offset + len);
  }

  function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  function pack(buffer, offset = 0) {
    PP64.utils.arrays.copyRange(buffer, _audioCache, offset, 0, _audioCache.byteLength);
    return _audioCache.byteLength;
  }

  // Gets the full byte length of the audio section of the ROM.
  function getByteLength() {
    // Who knows how to interpret the audio section? Hard code for now.
    let gameID = PP64.romhandler.getROMGame();
    switch(gameID) {
      case $gameType.MP1_USA:
        return 0x7B3DF0; // 0x1CED490 - 0x15396A0
      case $gameType.MP1_JPN:
        return 0x10; // FIXME
      case $gameType.MP2_USA:
        return 0x6DAB50; // 0x1E2AFA0 - 0x1750450
      case $gameType.MP3_USA:
        return 0x67BE40; // 0x1EFDA80 - 0x1881C40
    }

    throw "Figure out the audio section length for " + gameID;
  }

  class S2 {
    constructor(dataView) {
      this.__type = "S2";
      if (dataView.getUint16(0) !== 0x5332) // "S2"
        throw "S2 constructor encountered non-S2 structure";

      this._extract(dataView);
    }

    _extract(view) {
      let midiCount = view.getUint16(2);
      let extendedS2TableOffset = 4 + (midiCount * 8);

      // Extract midi buffers
      this.midis = [];
      for (let i = 0; i < midiCount; i++) {
        let midiOffset = view.getUint32(4 + (i * 4 * 2));
        let midiSize = view.getUint32(8 + (i * 4 * 2));

        let midiStart = view.byteOffset + midiOffset;
        this.midis.push({
          buffer: view.buffer.slice(midiStart, midiStart + midiSize),
          soundbankIndex: view.getUint8(extendedS2TableOffset + (i * 16))
        });
      }

      // Extract tbl buffer
      // Assumption: we know where it begins, and will assume it ends at the first midi offset.
      let tblOffsetStart = view.getUint32(extendedS2TableOffset + 12);
      let tblOffsetEnd = view.getUint32(4); // First midi offset
      this.tbl = view.buffer.slice(view.byteOffset + tblOffsetStart, view.byteOffset + tblOffsetEnd);

      // Extract B1 structure
      // Assumption: extra S2 table entries all point to same B1
      let B1offset = view.getUint32(extendedS2TableOffset + 4);
      let B1view = new DataView(view.buffer, view.byteOffset + B1offset);
      this.soundbanks = new B1(B1view);
    }
  }

  class B1 {
    constructor(dataView) {
      this.__type = "B1";
      if (dataView.getUint16(0) !== 0x4231) // "B1"
        throw "B1 constructor encountered non-B1 structure";

      this._extract(dataView);
    }

    _extract(view) {
      let bankCount = view.getUint16(2);
      this.banks = [];
      for (let i = 0; i < bankCount; i++) {
        let bankOffset = view.getUint32(4 + (i * 4));
        this.banks.push(new ALBank(view, bankOffset));
      }
    }
  }

  class ALBank {
    constructor(B1view, bankOffset) {
      this.__type = "ALBank";
      this._extract(B1view, bankOffset);
    }

    _extract(B1view, bankOffset) {
      this.flags = B1view.getUint16(bankOffset + 2);
      this.pad = B1view.getUint16(bankOffset + 4);
      this.sampleRate = B1view.getUint16(bankOffset + 6);

      let percussionOffset = B1view.getUint32(bankOffset + 8);
      if (percussionOffset)
        throw `Need to parse percussion at bank offset ${$$hex(B1view.byteOffset + bankOffset)}`;

      let instrumentCount = B1view.getUint16(bankOffset);
      this.instruments = [];
      for (let i = 0; i < instrumentCount; i++) {
        let instrumentOffset = B1view.getUint32(bankOffset + 12 + (i * 4));
        this.instruments.push(new ALInst(B1view, instrumentOffset));
      }
    }
  }

  class ALInst {
    constructor(B1view, instOffset) {
      this.__type = "ALInst";
      this._extract(B1view, instOffset);
    }

    _extract(B1view, instOffset) {
      this.volume = B1view.getUint8(instOffset);
      this.pan = B1view.getUint8(instOffset + 1);
      this.priority = B1view.getUint8(instOffset + 2);
      this.flags = B1view.getUint8(instOffset + 3);
      this.tremType = B1view.getUint8(instOffset + 4);
      this.tremRate = B1view.getUint8(instOffset + 5);
      this.tremDepth = B1view.getUint8(instOffset + 6);
      this.tremDelay = B1view.getUint8(instOffset + 7);
      this.vibType = B1view.getUint8(instOffset + 8);
      this.vibRate = B1view.getUint8(instOffset + 9);
      this.vibDepth = B1view.getUint8(instOffset + 10);
      this.vibDelay = B1view.getUint8(instOffset + 11);
      this.bendRange = B1view.getUint16(instOffset + 12);

      let soundCount = B1view.getUint16(instOffset + 14);
      this.sounds = [];
      for (let i = 0; i < soundCount; i++) {
        let soundOffset = B1view.getUint32(instOffset + 16 + (i * 4));
        this.sounds.push(new ALSound(B1view, soundOffset));
      }
    }
  }

  class ALSound {
    constructor(B1view, soundOffset) {
      this.__type = "ALSound";
      this._extract(B1view, soundOffset);
    }

    _extract(B1view, soundOffset) {
      let envOffset = B1view.getUint32(soundOffset);
      this.env = new ALEnv(B1view, envOffset);

      let keymapOffset = B1view.getUint32(soundOffset + 4);
      this.keymap = new ALKey(B1view, keymapOffset);

      let waveOffset = B1view.getUint32(soundOffset + 8);
      this.wave = new ALWave(B1view, waveOffset);

      this.samplePan = B1view.getUint8(soundOffset + 12);
      this.sampleVolume = B1view.getUint8(soundOffset + 13);
      this.flags = B1view.getUint8(soundOffset + 14);
    }
  }

  class ALEnv {
    constructor(B1view, envOffset) {
      this.__type = "ALEnv";
      this._extract(B1view, envOffset);
    }

    _extract(B1view, envOffset) {
      this.attackTime = B1view.getUint32(envOffset);
      this.decayTime = B1view.getUint32(envOffset + 4);
      this.releaseTime = B1view.getUint32(envOffset + 8);
      this.attackVolume = B1view.getUint8(envOffset + 12);
      this.decayVolume = B1view.getUint8(envOffset + 13);
      this.zeroPad = B1view.getUint16(envOffset + 14);
    }
  }

  class ALKey {
    constructor(B1view, keymapOffset) {
      this.__type = "ALKey";
      this._extract(B1view, keymapOffset);
    }

    _extract(B1view, keymapOffset) {
      this.velocityMin = B1view.getUint8(keymapOffset);
      this.velocityMax = B1view.getUint8(keymapOffset + 1);
      this.keyMin = B1view.getUint8(keymapOffset + 2);
      this.keyMax = B1view.getUint8(keymapOffset + 3);
      this.keyBase = B1view.getUint8(keymapOffset + 4);
      this.detune = B1view.getUint8(keymapOffset + 5);
    }
  }

  class ALWave {
    constructor(B1view, waveOffset) {
      this.__type = "ALWave";
      this._extract(B1view, waveOffset);
    }

    _extract(B1view, waveOffset) {
      this.waveBase = B1view.getUint32(waveOffset); // Offset into TBL
      this.waveLen = B1view.getUint32(waveOffset + 4);
      this.type = B1view.getUint8(waveOffset + 8); // ALWaveType
      this.flags = B1view.getUint8(waveOffset + 9);
      this.zeroes = B1view.getUint16(waveOffset + 10);
      this.loopOffset = B1view.getUint32(waveOffset + 12);
      this.predictorOffset = B1view.getUint32(waveOffset + 16);
    }
  }

  const ALWaveType = {
    AL_ADPCM_WAVE: 0,
    AL_RAW16_WAVE: 1,
    AL_VOX_WAVE: 2,
    AL_MUSYX_WAVE: 3,
    // AL_SIGNED_RAW8,
    // AL_SIGNED_RAW16
  };

  class ALADPCMLoop {
    constructor(B1view, loopOffset) {
      this.__type = "ALADPCMLoop";
      this._extract(B1view, loopOffset);
    }

    _extract(B1view, loopOffset) {
      // TODO
    }
  }

  class ALADPCMBook {
    constructor(B1view, loopOffset) {
      this.__type = "ALADPCMBook";
      this._extract(B1view, loopOffset);
    }

    _extract(B1view, loopOffset) {
      // TODO
    }
  }

  return {
    read,
    write,
    extract,
    extractAsync,
    pack,
    clearCache,
    getByteLength,
    getROMOffset,
    setROMOffset,
    getPatchInfo,
  };
})();
