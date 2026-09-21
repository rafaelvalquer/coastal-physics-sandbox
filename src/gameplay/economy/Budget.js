import { TransactionLedger } from "./TransactionLedger.js";
export class Budget {
 constructor(balance=0,eventBus=null,ledger=new TransactionLedger()){this.balance=Number(balance)||0;this.eventBus=eventBus;this.ledger=ledger;}
 canAfford(amount){return this.balance>=Number(amount||0);}
 spend(amount,category="GENERAL",description=""){amount=Number(amount)||0;if(amount<0||!this.canAfford(amount))return false;this.balance-=amount;const tx=this.ledger.add({type:"EXPENSE",category,amount:-amount,description,balance:this.balance});this.eventBus?.emit("economy:transaction",tx);return true;}
 credit(amount,category="REVENUE",description=""){amount=Math.max(0,Number(amount)||0);this.balance+=amount;const tx=this.ledger.add({type:"INCOME",category,amount,description,balance:this.balance});this.eventBus?.emit("economy:transaction",tx);return true;}
 serialize(){return {balance:this.balance,ledger:this.ledger.serialize()};} hydrate(v={}){this.balance=Number(v.balance||0);this.ledger.hydrate(v.ledger||[]);}
}
