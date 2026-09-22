export class CheckpointManager{
 constructor({intervalSeconds=30,max=80}={}){this.intervalSeconds=intervalSeconds;this.max=max;this.items=[];this.nextAt=intervalSeconds;}
 reset(){this.items=[];this.nextAt=this.intervalSeconds;}
 maybeCapture(t,capture){if(t+1e-6<this.nextAt)return null;const item={time:t,state:capture()};this.items.push(item);if(this.items.length>this.max)this.items.shift();this.nextAt+=this.intervalSeconds;return item;}
 nearest(t){let best=null;for(const item of this.items)if(item.time<=t&&(!best||item.time>best.time))best=item;return best||this.items[0]||null;}
 serialize(){return structuredClone(this.items);}
}
