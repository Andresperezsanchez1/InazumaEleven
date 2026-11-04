
window.Game = {
money:1000,
wins:0,
level:1,
xp:0,
collection:[],
team:[],
nextId:1,

save(){
try{
localStorage.setItem("inazumaSD",JSON.stringify({
money:this.money,wins:this.wins,level:this.level,
xp:this.xp,collection:this.collection,
team:this.team,nextId:this.nextId
}));
}catch(e){console.warn("No se pudo guardar",e)}
},

load(){
try{
const d=JSON.parse(localStorage.getItem("inazumaSD"));
if(d){
Object.assign(this,d);
return true;
}
}catch(e){}
return false;
},

addFigure(data){
const figure={
...data,
id:this.nextId++,
xp:0,
level:1
};
this.collection.push(figure);
if(this.team.length<11)this.team.push(figure.id);
this.save();
this.refresh();
return figure;
},

refresh(){
document.getElementById("currency").textContent="💰 "+this.money;
document.getElementById("totalFigures").textContent=this.collection.length;
document.getElementById("wins").textContent=this.wins;
document.getElementById("level").textContent=this.level;
},

renderCollection(){
const grid=document.getElementById("collectionGrid");
const rarity=document.getElementById("rarityFilter").value;
const search=document.getElementById("searchFigure").value.toLowerCase();

grid.innerHTML="";
this.collection.filter(p=>
(rarity==="all"||p.rarity===rarity)&&
p.name.toLowerCase().includes(search)
).forEach(p=>{
const div=document.createElement("div");
div.className="figure rarity-"+p.rarity;
div.innerHTML=`
<span class="portrait">${p.face}</span>
<h3>${p.name}</h3>
<p>${p.team}</p>
<p>${p.pos} · ${p.rating} puntos</p>
<p>Rareza ${p.rarity}</p>
<p>⚡ ${p.tech}</p>
<button>${this.team.includes(p.id)?"Quitar del equipo":"Añadir al equipo"}</button>
`;
div.querySelector("button").onclick=()=>this.toggleTeam(p.id);
grid.appendChild(div);
});
},

toggleTeam(id){
if(this.team.includes(id)){
this.team=this.team.filter(x=>x!==id);
}else{
if(this.team.length>=11){
alert("Ya tienes once titulares.");
return;
}
this.team.push(id);
}
this.renderCollection();
this.renderTeam();
this.save();
},

renderTeam(){
const grid=document.getElementById("teamGrid");
grid.innerHTML="";
for(let i=0;i<11;i++){
const p=this.collection.find(x=>x.id===this.team[i]);
const div=document.createElement("div");
div.className="figure";
div.innerHTML=p?
`<span class="portrait">${p.face}</span>
<h3>${i+1}. ${p.name}</h3>
<p>${p.pos} · ${p.rating}</p>
<button>Quitar</button>`:
`<h3>${i+1}. Vacante</h3><p>Sin jugador</p>`;
if(p)div.querySelector("button").onclick=()=>this.toggleTeam(p.id);
grid.appendChild(div);
}
const players=this.team.map(id=>this.collection.find(p=>p.id===id)).filter(Boolean);
const avg=players.length?Math.round(players.reduce((a,p)=>a+p.rating,0)/players.length):0;
document.getElementById("teamPower").textContent=
"Fuerza media: "+avg+" · "+players.length+"/11 jugadores";
},

gainXP(amount){
this.xp+=amount;
while(this.xp>=100){
this.xp-=100;
this.level++;
this.money+=100;
}
this.save();
this.refresh();
}
};
