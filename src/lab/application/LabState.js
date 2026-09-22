export class LabState{
 constructor(){this.selectedInspection=null;this.photoMode=false;this.analysisOpen=false;this.analysisView="AFTER";this.experienceMode="SIMULATOR";this.messages=[];}
 inspect(value){this.selectedInspection=value;return value;}
 message(text,severity="info",extra={}){this.messages.unshift({id:"lab-msg-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),text,severity,...extra});this.messages=this.messages.slice(0,12);}
 snapshot(){return {selectedInspection:this.selectedInspection,photoMode:this.photoMode,analysisOpen:this.analysisOpen,analysisView:this.analysisView,experienceMode:this.experienceMode,messages:this.messages.slice()};}
}
