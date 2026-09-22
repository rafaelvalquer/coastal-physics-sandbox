import { ScenarioTemplate } from "../ScenarioTemplate.js";

export const PROCEDURAL_COAST=new ScenarioTemplate({
 id:"procedural-coast",
 name:"Costa Procedural",
 description:"Sandbox principal: costa regenerada pela seed, cidade compacta e laboratório completo.",
 terrainPreset:"COASTAL",
 buildings:[
  ...Array.from({length:10},(_,i)=>({id:"sandbox-house-"+(i+1),type:"HOUSE",x:700+i*48})),
  {id:"sandbox-school",type:"SCHOOL",x:790},
  {id:"hospital",type:"HOSPITAL",x:980},
  {id:"power-plant",type:"POWER_PLANT",x:1080}
 ],
 roads:[]
});
