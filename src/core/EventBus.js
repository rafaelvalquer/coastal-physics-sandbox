export class EventBus {
  constructor(){ this.listeners=new Map(); this.emitted=0; }
  on(type,handler){ if(!this.listeners.has(type)) this.listeners.set(type,new Set()); this.listeners.get(type).add(handler); return ()=>this.off(type,handler); }
  off(type,handler){ this.listeners.get(type)?.delete(handler); }
  emit(type,payload={}){ this.emitted++; for(const h of this.listeners.get(type)||[]) h(payload); for(const h of this.listeners.get("*")||[]) h({type,payload}); }
  clear(){ this.listeners.clear(); }
}
