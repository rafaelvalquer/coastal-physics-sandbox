export class DisasterDefinition{
 constructor(v={}){this.waveHeight=Number(v.waveHeight??2);this.wavePeriod=Number(v.wavePeriod??7);this.waveDirection=Number(v.waveDirection??90);this.tide=Number(v.tide??.2);this.stormSurge=Number(v.stormSurge??.4);this.windSpeed=Number(v.windSpeed??45);this.windDirection=Number(v.windDirection??90);this.rainfall=Number(v.rainfall??10);this.duration=Number(v.duration??180);this.timeline=structuredClone(v.timeline||[]);}
 serialize(){return {waveHeight:this.waveHeight,wavePeriod:this.wavePeriod,waveDirection:this.waveDirection,tide:this.tide,stormSurge:this.stormSurge,windSpeed:this.windSpeed,windDirection:this.windDirection,rainfall:this.rainfall,duration:this.duration,timeline:structuredClone(this.timeline)};}
}
