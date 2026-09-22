import { DisasterPreset } from "../DisasterPreset.js";
export const DISASTER_PRESETS=[
 new DisasterPreset({id:"moderate-storm",name:"Ressaca moderada",description:"Ondas de 2 m e elevação costeira discreta.",disaster:{waveHeight:2,wavePeriod:7,stormSurge:.4,tide:.2,windSpeed:45,rainfall:12,duration:120}}),
 new DisasterPreset({id:"severe-storm",name:"Ressaca severa",description:"Ondas de 4 m, surge de 1 m e vento forte.",disaster:{waveHeight:4,wavePeriod:10,stormSurge:1,tide:.5,windSpeed:90,rainfall:35,duration:180}}),
 new DisasterPreset({id:"extreme-storm",name:"Tempestade extrema",description:"Evento costeiro de alta energia.",disaster:{waveHeight:6,wavePeriod:12,stormSurge:1.8,tide:.7,windSpeed:130,rainfall:80,duration:210}}),
 new DisasterPreset({id:"extreme-rain",name:"Chuva extrema",description:"Solo saturado e precipitação concentrada.",disaster:{waveHeight:.8,wavePeriod:6,stormSurge:0,tide:.1,windSpeed:25,rainfall:130,duration:90}}),
 new DisasterPreset({id:"extreme-tide",name:"Maré extrema",description:"Nível do mar elevado com ondas moderadas.",disaster:{waveHeight:1.5,wavePeriod:8,stormSurge:.8,tide:1.4,windSpeed:40,rainfall:8,duration:150}})
];
export function getDisasterPreset(id){return DISASTER_PRESETS.find(p=>p.id===id)||null;}
