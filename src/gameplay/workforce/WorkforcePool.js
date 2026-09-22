export class WorkforcePool {
  constructor(total=0){this.total=total;this.essential=0;this.emergencyReserve=0;this.assignments=new Map();}
  beginCycle(){this.assignments.clear();}
  get allocatable(){return Math.max(0,this.total-this.essential-this.emergencyReserve);}
  get assigned(){return [...this.assignments.values()].reduce((s,v)=>s+v,0);}
  get available(){return Math.max(0,this.allocatable-this.assigned);}
  assign(id,requested){const amount=Math.max(0,Math.min(this.available,Math.floor(requested)));this.assignments.set(id,amount);return amount;}
  snapshot(){return {total:this.total,essential:this.essential,emergencyReserve:this.emergencyReserve,construction:this.assigned,available:this.available};}
}
