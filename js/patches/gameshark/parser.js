PP64.ns("patches.gameshark");

PP64.patches.gameshark.Opcodes = {
  WRITE8: 0x80,
  WRITE16: 0x81,
  IF8: 0xD0,
  IF16: 0xD1,
  IFNOT8: 0xD2,
  IFNOT16: 0xD3,
};

// Takes a string of gameshark codes and produces an array of objects representing them.
PP64.patches.gameshark.Parser = class Parser {
  static parse(codeString) {
    const pieces = PP64.patches.gameshark.Parser.splitInput(codeString);
    if (!pieces.length) {
      $$log("Gameshark code string was empty");
      return null;
    }

    if (pieces.length % 2) {
      $$log("Gameshark code string was malformed");
      return null;
    }

    const codes = [];
    for (let i = 0; i < pieces.length; i += 2) {
      let inst = parseInt(pieces[i], 16);
      let value = parseInt(pieces[i + 1], 16);

      if (!inst) {
        $$log(`Invalid code instruction: ${pieces[i]}`);
        return null;
      }

      const code = PP64.patches.gameshark.Parser.getCode(inst, value);
      if (!code) {
        $$log(`Could not parse code: ${$$hex(inst)} ${$$hex(value)}`);
        return null;
      }

      codes.push(code);
    }

    return codes;
  }

  static getCode(inst, value) {
    const opcode = PP64.patches.gameshark.Parser.getOpcode(inst);
    if (opcode === null) {
      return null;
    }

    const addr = inst & 0x00FFFFFF;

    if (PP64.patches.gameshark.Parser.opcodeHas8BitValue(opcode)) {
      value = value & 0x00FF;
    }

    return {
      opcode,
      addr,
      value
    };
  }

  static getOpcode(inst) {
    const upper8 = (inst & 0xFF000000) >>> 24;
    if (!upper8) {
      return null;
    }

    const types = PP64.patches.gameshark.Opcodes;
    for (let type in types) {
      if (!types.hasOwnProperty(type)) {
        continue;
      }
      if (types[type] === upper8) {
        return type;
      }
    }

    return null;
  }

  static opcodeHas8BitValue(opcode) {
    const types = PP64.patches.gameshark.Opcodes;
    if (opcode === types.WRITE8 ||
      opcode === types.IF8 ||
      opcode === types.IFNOT8) {
      return true;
    }

    return false;
  }

  static splitInput(codeString) {
    if (!codeString) {
      return [];
    }
    return codeString.match(/\S+/g) || [];
  }

  static printCodes(codes) {
    for (let i = 0; i < codes.length; i++) {
      console.log(`${codes[i].opcode} ${$$hex(codes[i].addr)} ${$$hex(codes[i].value)}`);
    }
  }
}
