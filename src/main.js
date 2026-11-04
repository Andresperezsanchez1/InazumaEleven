// Configuración principal de Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    // Aquí se declaran las escenas en el orden en que se ejecutarán
    scene: [BootScene, MenuScene, GameScene]
};

// Se arranca el juego con la configuración
const game = new Phaser.Game(config);