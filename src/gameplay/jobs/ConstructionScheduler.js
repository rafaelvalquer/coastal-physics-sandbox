export class ConstructionScheduler {
 constructor({queue,workforce,inventory,eventBus,onComplete,onProgress}){Object.assign(this,{queue,workforce,inventory,eventBus,onComplete,onProgress});}
 update(gameHours){this.workforce.beginCycle();for(const job of this.queue.orderedActive()){job.assignedWorkers=this.workforce.assign(job.id,job.desiredWorkers);const done=job.update(gameHours);this.onProgress?.(job);if(done){this.inventory.complete(job.id);this.onComplete?.(job);this.eventBus?.emit("job:completed",{job});}}}
 setWorkers(id,count){const j=this.queue.get(id);if(!j)return false;j.desiredWorkers=Math.max(1,Math.floor(count));return true;}
 setPriority(id,p){const j=this.queue.get(id);if(!j)return false;j.priority=p;return true;}
 cancel(id){const j=this.queue.get(id);if(!j||["COMPLETED","CANCELLED"].includes(j.state))return false;j.state="CANCELLED";this.inventory.cancel(id);return true;}
}
