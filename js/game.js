
document.addEventListener("DOMContentLoaded",()=>{
const loaded=Game.load();

if(!loaded){
FigureDatabase.slice(0,11).forEach(p=>Game.addFigure(p));
Game.money=1000;
Game.wins=0;
Game.level=1;
Game.xp=0;
Game.save();
}

document.querySelectorAll("nav button").forEach(button=>{
button.addEventListener("click",()=>{
document.querySelectorAll(".page").forEach(page=>
page.classList.remove("active")
);
document.querySelectorAll("nav button").forEach(b=>
b.classList.remove("active")
);
document.getElementById(button.dataset.page).classList.add("active");
button.classList.add("active");

if(button.dataset.page==="collection")Game.renderCollection();
if(button.dataset.page==="team")Game.renderTeam();
if(button.dataset.page==="match")Match.draw();
});
});

document.getElementById("rarityFilter").addEventListener("change",()=>{
Game.renderCollection();
});

document.getElementById("searchFigure").addEventListener("input",()=>{
Game.renderCollection();
});

document.getElementById("startMatch").addEventListener("click",()=>{
Match.start();
});

document.getElementById("pauseMatch").addEventListener("click",()=>{
Match.pause();
});

document.getElementById("specialMove").addEventListener("click",()=>{
Match.special();
});

Game.refresh();
Game.renderCollection();
Game.renderTeam();
Match.init();
});
