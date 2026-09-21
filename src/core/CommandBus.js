export class CommandBus {
  constructor(){ this.handlers=new Map(); }
  register(type,handler){ this.handlers.set(type,handler); return ()=>this.handlers.delete(type); }
  execute(type,payload={}){ const handler=this.handlers.get(type); if(!handler) return {ok:false,error:"UNKNOWN_COMMAND",type}; return handler(payload); }
}
