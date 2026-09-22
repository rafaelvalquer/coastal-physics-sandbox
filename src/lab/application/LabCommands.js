export function bindLabCommands(app){
 const c=app.commandBus;
 c.register("lab:experience-mode",({mode})=>app.setExperienceMode(mode));
 c.register("lab:set-tool",({category,tool})=>{app.editor.select(category,tool);return {ok:true};});
 c.register("lab:set-brush",({size})=>{app.editor.brush=Math.max(1,Math.min(7,Number(size)||2));return {ok:true};});
 c.register("lab:set-template",({id})=>app.loadTemplate(id));
 c.register("lab:set-seed",({seed})=>{const value=Math.max(1,Math.floor(Number(seed)||1));app.experiments.edit(e=>{e.map.seed=value;});app.editor.seed=value;app.loadTemplate(app.experiments.current.map.template);return {ok:true,seed:value};});
 c.register("lab:disaster",({partial})=>{app.experiments.edit(e=>Object.assign(e.disaster,partial));app.disasterController.configure(partial);return {ok:true};});
 c.register("lab:preset",({id})=>{const d=app.disasterController.applyPreset(id);if(!d)return {ok:false};app.experiments.current.disaster=d;app.experiments.dirty=true;return {ok:true};});
 c.register("lab:environment",({partial})=>{app.experiments.edit(e=>Object.assign(e.environment,partial||{}));return {ok:true};});
 c.register("lab:set-timeline",({keyframes})=>{app.experiments.current.disaster.timeline=structuredClone(keyframes||[]);app.disasterController.rebuild();app.experiments.dirty=true;return {ok:true};});
 c.register("lab:run",()=>({ok:app.runner.start()}));
 c.register("lab:pause",()=>({ok:app.runner.pause()}));
 c.register("lab:resume",()=>({ok:app.runner.resume()}));
 c.register("lab:reset",()=>({ok:app.runner.reset()}));
 c.register("lab:speed",({speed})=>{app.runner.setSpeed(speed);return {ok:true};});
 c.register("lab:step",()=>({ok:app.runner.step()}));
 c.register("lab:overlay",({overlay})=>{app.overlay=app.overlay===overlay?null:overlay;return {ok:true,overlay:app.overlay};});
 c.register("lab:photo",()=>{app.state.photoMode=!app.state.photoMode;return {ok:true,value:app.state.photoMode};});
 c.register("lab:analysis",({open=true,view=null})=>{app.state.analysisOpen=open;if(view)app.showAnalysisView(view);return {ok:true};});
 c.register("lab:start-challenge",({id})=>app.startChallenge(id));
 c.register("lab:sandbox",()=>app.startSandbox());
 c.register("lab:compare",({aId,bId})=>({ok:true,comparison:app.compareRuns(aId,bId)}));
 c.register("lab:replay",()=>{app.engine.setRunning(false);app.replayPlayer.load(app.replay.serialize());app.runner.state="REPLAY";app.experiments.state="REPLAY";return {ok:true};});
 c.register("lab:replay-seek",({time})=>({ok:true,checkpoint:app.replayPlayer.seek(time)}));
}
