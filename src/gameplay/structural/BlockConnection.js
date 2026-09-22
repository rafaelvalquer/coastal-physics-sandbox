export const CONNECTION_TYPES = {
  CONTACT: { strength: 0.2, shear: 0.18 },
  MORTAR: { strength: 0.72, shear: 0.62 },
  REINFORCED: { strength: 0.92, shear: 0.9 },
  ANCHOR: { strength: 1, shear: 1 },
  PILE: { strength: 1, shear: 1 },
  TIEBACK: { strength: 0.95, shear: 0.85 },
  INTERLOCK: { strength: 0.68, shear: 0.82 }
};

export class BlockConnection {
  constructor({ id, a, b, type = "CONTACT", integrity = 1 }) {
    this.id = id || a + ":" + b;
    this.a = a;
    this.b = b;
    this.type = type;
    this.integrity = integrity;
    Object.assign(this, CONNECTION_TYPES[type] || CONNECTION_TYPES.CONTACT);
  }

  serialize() {
    return {
      id: this.id,
      a: this.a,
      b: this.b,
      type: this.type,
      integrity: this.integrity
    };
  }
}
