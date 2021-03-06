PP64.ns("adapters");

PP64.adapters.SpaceEventTable = class SpaceEventTable {
  constructor() {
    this._entries = {};
  }

  /*
   * Populates this SpaceEventTable from an event table existing in the buffer.
   */
  parse(buffer, offset) {
    let dataView = new DataView(buffer, offset);
    let currentOffset = 0;
    let spaceIndex, address;
    while ((spaceIndex = dataView.getUint16(currentOffset)) !== 0xFFFF) {
      address = dataView.getUint32(currentOffset + 4);
      this.add(spaceIndex, address);
      currentOffset += 8;
    }
  }

  /*
   * Writes the current entries back to the buffer at an offset.
   * Returns length of bytes written (equal to calling byteLength())
   */
  write(buffer, offset) {
    let dataView = new DataView(buffer, offset);
    let currentOffset = 0;
    for (let spaceIndex in this._entries) {
      this._writeEntry(dataView, currentOffset, spaceIndex, this._entries[spaceIndex]);
      currentOffset += 8;
    }
    this._writeEntry(dataView, currentOffset, 0xFFFF, 0);
    currentOffset += 8;

    return currentOffset;
  }

  _writeEntry(dataView, currentOffset, spaceIndex, address) {
    dataView.setUint16(currentOffset, spaceIndex);
    dataView.setUint16(currentOffset + 2, 0); // Just to be sure
    if (!address && spaceIndex !== 0xFFFF)
      throw `Tried to write null address from SpaceEventTable at space index ${spaceIndex}.`;
    dataView.setUint32(currentOffset + 4, address);
  }

  add(spaceIndex, address = 0) {
    this._entries[spaceIndex] = address;
  }

  forEach(fn) {
    for (let spaceIndex in this._entries) {
      let entry = {
        spaceIndex: Number(spaceIndex),
        address: this._entries[spaceIndex]
      };
      fn(entry);
    }
  }

  byteLength() {
    // Each entry is 8 bytes, plus the last 0xFFFF entry.
    return (Object.keys(this._entries).length * 8) + 8;
  }
}
