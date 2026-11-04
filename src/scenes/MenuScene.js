class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Fondo azul oscuro
        this.cameras.main.setBackgroundColor('#0a0a1a');

        // Título del juego
        this.add.text(400, 180, 'INAZUMA ROGUE', {
            fontSize: '48px',
            fill: '#00fff0',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 250, 'Edición Roguelike', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Botón Tap to Start
        const startBtn = this.add.text(400, 380, ' TAP TO START ', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#ff0055',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Evento al hacer clic en el botón
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Efecto parpadeante en el botón
        this.tweens.add({
            targets: startBtn,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            loop: -1
        });
    }
}