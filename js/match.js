
window.Match = {
canvas:null,
ctx:null,
running:false,
paused:false,
time:0,
score:[0,0],
players:[],
opponents:[],
ball:{x:450,y:280,owner:null,vx:0,vy:0},
timer:null,
lastLog:0,

init(){
this.canvas=document.getElementById("stadium");
this.ctx=this.canvas.getContext("2d");
this.draw();
},

log(message){
const el=document.getElementById("matchLog");
el.innerHTML=message+"<br>"+el.innerHTML;
},

prepare(){
if(Game.team.length!==11){
alert("Necesitas exactamente once titulares.");
return false;
}

const team=Game.team.map(id=>Game.collection.find(p=>p.id===id));
if(team.some(p=>!p)){
alert("Hay jugadores que ya no están en tu colección.");
return false;
}

if(!team.some(p=>p.pos==="POR")){
alert("Tu equipo necesita un portero.");
return false;
}

this.players=team.map((p,i)=>{
const positions=[
[100,280],[210,100],[210,220],[210,340],[210,460],
[370,100],[370,220],[370,340],[370,460],
[510,210],[510,350]
];
const pos=positions[i];
return{
...p,team:0,x:pos[0],y:pos[1],
homeX:pos[0],homeY:pos[1],cd:0
};
});

this.opponents=Array.from({length:11},(_,i)=>{
const positions=[
[800,280],[690,100],[690,220],[690,340],[690,460],
[530,100],[530,220],[530,340],[530,460],
[390,210],[390,350]
];
const pos=positions[i];
return{
name:"Rival "+(i+1),
face:"👾",
rating:Math.floor(65+Math.random()*20),
pos:i===0?"POR":i<5?"DEF":i<9?"MC":"DEL",
team:1,x:pos[0],y:pos[1],
homeX:pos[0],homeY:pos[1],cd:0
};
});

return true;
},

start(){
if(this.running)return;
if(!this.prepare())return;

this.running=true;
this.paused=false;
this.time=0;
this.score=[0,0];
this.ball={x:450,y:280,owner:null,vx:0,vy:0};
document.getElementById("startMatch").disabled=true;
document.getElementById("specialMove").disabled=false;
document.getElementById("matchStatus").textContent="¡En juego!";
this.log("⚽ ¡Comienza el partido!");
this.timer=setInterval(()=>this.step(),1000/30);
},

pause(){
if(!this.running)return;
this.paused=!this.paused;
document.getElementById("pauseMatch").textContent=
this.paused?"▶ Continuar":"Ⅱ Pausar";
},

step(){
if(!this.running||this.paused)return;
this.time++;
const all=this.players.concat(this.opponents);

if(this.ball.owner){
const holder=all.find(p=>p.name===this.ball.owner);
if(holder){
const target=holder.team===0?840:60;
holder.x+=(target-holder.x)*0.018;
holder.y+=(280-holder.y)*0.012;
this.ball.x=holder.x+(holder.team===0?18:-18);
this.ball.y=holder.y;
this.checkDuels(holder);
if(holder.x>870&&holder.team===0)this.goal(0,holder);
if(holder.x<30&&holder.team===1)this.goal(1,holder);
}
}else{
this.ball.x+=this.ball.vx;
this.ball.y+=this.ball.vy;
this.ball.vx*=0.98;
this.ball.vy*=0.98;
if(this.ball.y<30||this.ball.y>530)this.ball.vy*=-0.7;
if(Math.hypot(this.ball.vx,this.ball.vy)<0.3){
const candidates=all.filter(p=>
Math.hypot(p.x-this.ball.x,p.y-this.ball.y)<65
);
if(candidates.length){
const winner=candidates[Math.floor(Math.random()*candidates.length)];
this.ball.owner=winner.name;
}
}
}

all.forEach(p=>{
if(p.name===this.ball.owner)return;
const dx=this.ball.x-p.x;
const dy=this.ball.y-p.y;
const distance=Math.hypot(dx,dy)||1;
const speed=p.rating/85;
const chase=distance<180?0.8*speed:0;
p.x+=(p.homeX-p.x)*0.015+dx/distance*chase;
p.y+=(p.homeY-p.y)*0.015+dy/distance*chase;
p.x=Math.max(35,Math.min(865,p.x));
p.y=Math.max(35,Math.min(525,p.y));
});

document.getElementById("score").textContent=
this.score[0]+" - "+this.score[1];

const seconds=Math.floor(this.time/30);
document.getElementById("matchClock").textContent=
String(Math.floor(seconds/60)).padStart(2,"0")+":"+
String(seconds%60).padStart(2,"0");

this.draw();

if(this.time>=1800)this.finish();
},

checkDuels(holder){
if(this.time-this.lastLog<30)return;
const rivals=holder.team===0?this.opponents:this.players;
const nearest=rivals.reduce((best,p)=>{
const d=Math.hypot(p.x-holder.x,p.y-holder.y);
return !best||d<best.d?{p,d}:best;
},null);

if(nearest&&nearest.d<48){
this.lastLog=this.time;
const attacker=holder.rating;
const defender=nearest.p.rating;
const chance=attacker/(attacker+defender);
if(Math.random()<chance){
this.log("⚔️ "+holder.name+" gana el duelo.");
}else{
this.ball.owner=nearest.p.name;
this.log("🛡️ "+nearest.p.name+" recupera el balón.");
}
}
},

goal(team,scorer){
this.score[team]++;
this.log("⚽ ¡GOL de "+scorer.name+"!");
this.ball={x:450,y:280,owner:null,vx:0,vy:0};
this.players.forEach(p=>{p.x=p.homeX;p.y=p.homeY});
this.opponents.forEach(p=>{p.x=p.homeX;p.y=p.homeY});
document.getElementById("score").textContent=
this.score[0]+" - "+this.score[1];
},

special(){
if(!this.running||this.paused)return;
const p=this.players.find(x=>x.name===this.ball.owner);
if(!p){
this.log("Necesitas tener el balón para usar una técnica.");
return;
}
const defenders=this.opponents.filter(x=>
Math.abs(x.x-p.x)<160
);
const power=p.rating+(Math.random()*20);
const defense=defenders.length?
Math.max(...defenders.map(x=>x.rating)):60;
this.log("⚡ "+p.name+" utiliza "+p.tech+".");

if(power>defense+15){
this.goal(0,p);
}else{
this.log("🧤 ¡El rival detiene la técnica!");
this.ball.owner=this.opponents[0].name;
}
},

finish(){
this.running=false;
clearInterval(this.timer);
const result=this.score[0]>this.score[1]?"victory":
this.score[0]===this.score[1]?"draw":"defeat";
const reward=result==="victory"?50:result==="draw"?30:20;
Game.money+=reward;
Game.gainXP(result==="victory"?60:result==="draw"?35:20);
if(result==="victory")Game.wins++;
Game.refresh();

this.log("🏁 FINAL: "+this.score[0]+" - "+this.score[1]);
this.log("💰 Recompensa: "+reward+" monedas.");
document.getElementById("matchStatus").textContent="Finalizado";
document.getElementById("startMatch").disabled=false;
document.getElementById("specialMove").disabled=true;
},

draw(){
const c=this.ctx;
if(!c)return;
c.clearRect(0,0,900,560);

for(let i=0;i<10;i++){
c.fillStyle=i%2?"#18874d":"#1b9656";
c.fillRect(i*90,0,90,560);
}

c.strokeStyle="white";
c.lineWidth=4;
c.strokeRect(15,15,870,530);
c.beginPath();
c.moveTo(450,15);c.lineTo(450,545);
c.stroke();
c.beginPath();c.arc(450,280,75,0,Math.PI*2);c.stroke();
c.strokeRect(15,170,110,220);
c.strokeRect(775,170,110,220);
c.strokeRect(15,220,45,120);
c.strokeRect(840,220,45,120);

this.players.forEach(p=>this.drawFigure(p));
this.opponents.forEach(p=>this.drawFigure(p));

c.fillStyle="white";
c.beginPath();
c.arc(this.ball.x,this.ball.y,9,0,Math.PI*2);
c.fill();
c.strokeStyle="#222";
c.stroke();
},

drawFigure(p){
const c=this.ctx;
c.save();
c.translate(p.x,p.y);
c.fillStyle=p.team===0?"#e84d57":"#4775ec";
c.beginPath();
c.ellipse(0,12,17,8,0,0,Math.PI*2);
c.fill();
c.fillStyle="#ffe1a7";
c.beginPath();
c.arc(0,0,16,0,Math.PI*2);
c.fill();
c.strokeStyle="#15243c";
c.lineWidth=3;
c.stroke();
c.font="21px Arial";
c.textAlign="center";
c.fillText(p.face,0,7);
c.fillStyle="white";
c.font="11px Arial";
c.fillText(p.name.split(" ")[0],0,32);
c.restore();
}
};
