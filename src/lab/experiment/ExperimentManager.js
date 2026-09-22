import { ExperimentDefinition } from "./ExperimentDefinition.js";import { EXPERIMENT_STATES,canTransition } from "./ExperimentState.js";import { ExperimentSerializer } from "./ExperimentSerializer.js";
export class ExperimentManager{
 constructor(e=new ExperimentDefinition()){this.current=e;this.state=EXPERIMENT_STATES.EDIT;this.dirty=true;this.runHistory=[];}
 transition(n){if(n===this.state)return true;if(!canTransition(this.state,n))return false;this.state=n;return true;}
 edit(fn){if(![EXPERIMENT_STATES.EDIT,EXPERIMENT_STATES.READY,EXPERIMENT_STATES.COMPLETED].includes(this.state))return false;fn?.(this.current);this.dirty=true;this.state=EXPERIMENT_STATES.EDIT;return true;}
 replace(e){this.current=e instanceof ExperimentDefinition?e:new ExperimentDefinition(e);this.state=EXPERIMENT_STATES.EDIT;this.dirty=true;}
 addRun(r){this.runHistory.unshift(r);this.runHistory=this.runHistory.slice(0,8);this.state=EXPERIMENT_STATES.COMPLETED;}
 snapshot(){return {state:this.state,dirty:this.dirty,code:ExperimentSerializer.code(this.current),experiment:this.current.serialize(),runs:this.runHistory.map(r=>r.serialize?.()||r)};}
}
