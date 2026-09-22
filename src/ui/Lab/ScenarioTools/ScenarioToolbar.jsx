import { useState } from "react";
import { TerrainTools } from "./TerrainTools.jsx";
import { BuildingTools } from "./BuildingTools.jsx";
import { DefenseTools } from "./DefenseTools.jsx";

const CATEGORIES=[["TERRAIN","Terreno","⛏"],["CITY","Cidade","▦"],["DEFENSE","Defesa","▮"],["WATER","Água","⇣"],["INSPECT","Inspecionar","⌖"]];

export function ScenarioToolbar({engine,snapshot}){
 const [category,setCategory]=useState("TERRAIN");
 const editor=snapshot?.editor||{};
 const templates=snapshot?.templates||[];
 const simulator=snapshot?.experienceMode!=="CAMPAIGN";
 const select=(cat,tool)=>engine?.game?.commandBus?.execute("lab:set-tool",{category:cat,tool});
 const chooseCategory=(cat)=>{setCategory(cat);if(cat==="INSPECT")select("INSPECT","INSPECT");};
 const loadTemplate=(id)=>engine?.game?.commandBus?.execute("lab:set-template",{id});
 return <aside className="lab-scenario-toolbar">
  <div className="lab-panel-heading"><div><small>SCENARIO EDITOR</small><strong>Cenário</strong></div><span>{editor.template||"—"}</span></div>
  {simulator
   ? <div className="lab-simulator-map"><span>Mapa</span><b>Costa procedural</b><small>Altere a seed para regenerar a costa.</small></div>
   : <label className="lab-field"><span>Mapa base</span><select value={editor.template||"procedural-coast"} onChange={e=>loadTemplate(e.target.value)}>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
  <label className="lab-field"><span>Seed determinística</span><input type="number" min="1" value={editor.seed||48212} onChange={e=>engine?.game?.commandBus?.execute("lab:set-seed",{seed:Number(e.target.value)})}/></label>
  <div className="lab-category-tabs">{CATEGORIES.map(([id,label,icon])=><button key={id} className={category===id?"active":""} onClick={()=>chooseCategory(id)}><b>{icon}</b><span>{label}</span></button>)}</div>
  <div className="lab-tools-scroll">
   {category==="TERRAIN"&&<TerrainTools selected={editor.tool} onSelect={tool=>select("TERRAIN",tool)}/>}
   {category==="CITY"&&<BuildingTools selected={editor.tool} onSelect={tool=>select("CITY",tool)}/>}
   {category==="DEFENSE"&&<DefenseTools selected={editor.tool} onSelect={tool=>select("DEFENSE",tool)}/>}
   {category==="WATER"&&<DefenseTools water selected={editor.tool} onSelect={tool=>select("WATER",tool)}/>}
   {category==="INSPECT"&&<p className="lab-help">Clique em terreno, prédio ou defesa para inspecionar.</p>}
  </div>
  {editor.budgetLimit!=null&&<div className="lab-budget"><span>Orçamento do desafio</span><b>R$ {Math.max(0,editor.budgetLimit-editor.spent).toLocaleString("pt-BR")}</b><small>gasto R$ {Math.round(editor.spent||0).toLocaleString("pt-BR")}</small></div>}
 </aside>;
}
