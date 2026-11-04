
window.Recruitment = {
packs:{
bronze:{cost:100,weights:{C:70,B:23,A:6,S:1}},
silver:{cost:300,weights:{C:25,B:45,A:25,S:5}},
gold:{cost:700,weights:{C:5,B:25,A:50,S:20}},
legend:{cost:1500,weights:{C:0,B:5,A:35,S:60}}
},

chooseRarity(weights){
let number=Math.random()*100;
for(const rarity of ["S","A","B","C"]){
number-=weights[rarity]||0;
if(number<0)return rarity;
}
return "C";
},

open(type){
const pack=this.packs[type];
if(!pack)return;
if(Game.money<pack.cost){
alert("No tienes suficientes monedas.");
return;
}
if(Game.collection.length>=500){
alert("Tu colección está llena.");
return;
}
if(!confirm("¿Quieres abrir este sobre por "+pack.cost+" monedas?"))return;

Game.money-=pack.cost;
Game.refresh();

const result=document.getElementById("packResult");
result.innerHTML=`
<div class="figure rarity-S">
<span class="portrait">✨</span>
<h2>ABRIENDO SOBRE...</h2>
<p>Las figuras están llegando...</p>
</div>`;

let frames=0;
const animation=setInterval(()=>{
frames++;
result.querySelector(".portrait").textContent=
["⚡","🔥","✨","🌪️","⭐"][frames%5];
if(frames>=12){
clearInterval(animation);
this.reveal(pack);
}
},120);
},

reveal(pack){
const rarity=this.chooseRarity(pack.weights);
let choices=FigureDatabase.filter(p=>p.rarity===rarity);
if(!choices.length)choices=FigureDatabase;

const data=choices[Math.floor(Math.random()*choices.length)];
const figure=Game.addFigure(data);

const result=document.getElementById("packResult");
result.innerHTML=`
<div class="figure rarity-${figure.rarity}">
<h2>¡NUEVA FIGURA!</h2>
<span class="portrait">${figure.face}</span>
<h2>${figure.name}</h2>
<p>${figure.team}</p>
<p>${figure.pos} · ${figure.rating}</p>
<p>Rareza: ${figure.rarity}</p>
<p>⚡ ${figure.tech}</p>
</div>`;

document.getElementById("activity").textContent=
"Nuevo fichaje: "+figure.name;
Game.renderCollection();
Game.renderTeam();
}
};
