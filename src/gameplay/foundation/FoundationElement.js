let sequence = 1;
export class FoundationElement {
  constructor({id,type,kind,assemblyId=null,x=0,y=0,integrity=1,constructionState="COMPLETED",progress=1,...rest}={}) {
    this.id=id||"foundation-"+sequence++; this.type=type; this.kind=kind; this.assemblyId=assemblyId;
    this.x=x; this.y=y; this.integrity=integrity; this.constructionState=constructionState; this.progress=progress; Object.assign(this,rest);
  }
  serialize(){return JSON.parse(JSON.stringify(this));}
}
