import { Budget } from "./Budget.js"; import { RevenueSystem } from "./RevenueSystem.js"; import { MaintenanceSystem } from "./MaintenanceSystem.js";
export class EconomyManager {
 constructor({initialBalance=0,eventBus}){this.budget=new Budget(initialBalance,eventBus);this.revenue=new RevenueSystem();this.maintenance=new MaintenanceSystem({budget:this.budget,eventBus});this.lastMonthKey=null;this.income=0;this.expenses=0;this.disasterCosts=0;}
 update(clock,{population,portOperational,maintenanceItems}){const d=clock.getDate();const key=d.getUTCFullYear()+"-"+d.getUTCMonth();if(this.lastMonthKey===null){this.lastMonthKey=key;return;}if(key!==this.lastMonthKey){const inc=this.revenue.monthly({population,portOperational});this.budget.credit(inc,"MONTHLY_REVENUE","Receita mensal");const m=this.maintenance.run(maintenanceItems);this.income+=inc;this.expenses+=m.paid;this.lastMonthKey=key;}}
 snapshot(){return {balance:this.budget.balance,income:this.income,expenses:this.expenses,maintenanceDebt:0,disasterCosts:this.disasterCosts};}
 serialize(){return {...this.snapshot(),budget:this.budget.serialize(),lastMonthKey:this.lastMonthKey};}
 hydrate(v={}){this.income=v.income||0;this.expenses=v.expenses||0;this.disasterCosts=v.disasterCosts||0;this.lastMonthKey=v.lastMonthKey??null;this.budget.hydrate(v.budget||{});}
}
