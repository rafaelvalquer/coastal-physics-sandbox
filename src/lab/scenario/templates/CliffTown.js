import { ScenarioTemplate } from "../ScenarioTemplate.js";
export const CLIFF_TOWN=new ScenarioTemplate({id:"cliff-town",name:"Cliff Town",description:"Cidade elevada sobre costa sujeita a erosão.",terrainPreset:"CLIFF",buildings:[...Array.from({length:12},(_,i)=>({id:"cliff-house-"+(i+1),type:"HOUSE",x:720+(i%6)*55})),{id:"hospital",type:"HOSPITAL",x:940}]});
