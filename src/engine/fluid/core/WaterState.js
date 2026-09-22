export class WaterState {
  constructor(size) {
    this.h = new Float32Array(size);
    this.hu = new Float32Array(size);
    this.bed = new Float32Array(size);
    this.eta = new Float32Array(size);
    this.pressure = new Float32Array(size);
    this.dynamicPressure = new Float32Array(size);
    this.bedShear = new Float32Array(size);
    this.breaking = new Float32Array(size);
    this.foam = new Float32Array(size);
  }

  velocity(i, dryDepth = 0.05) {
    return this.h[i] > dryDepth ? this.hu[i] / this.h[i] : 0;
  }
}
