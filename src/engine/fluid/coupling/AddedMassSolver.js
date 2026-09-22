const RHO_WATER=1000;
export class AddedMassSolver{
 static mass({submergedVolume=0,coefficient=.8}={}){return Math.max(0,coefficient*RHO_WATER*submergedVolume);}
 static force({submergedVolume=0,relativeAcceleration=0,coefficient=.8}={}){return -this.mass({submergedVolume,coefficient})*relativeAcceleration;}
}
