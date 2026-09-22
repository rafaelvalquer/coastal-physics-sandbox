export class SpraySystem{
 constructor({particles}){this.particles=particles;}
 structureImpact(x,y,{energy=0,normal=-1}={}){const velocity=Math.min(220,35+Math.sqrt(Math.max(0,energy))*.8);this.particles?.spawnDirectedSpray?.(x,y,{count:Math.min(28,4+Math.floor(Math.sqrt(Math.max(0,energy))/35)),speed:velocity,direction:normal<0?-Math.PI*.75:-Math.PI*.25,spread:.55});}
}
