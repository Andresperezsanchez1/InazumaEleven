class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.image(400, 300, 'bg_field');

        // Título del juego
        this.add.text(400, 180, 'INAZUMA ROGUE', {
            fontSize: '52px',
            fill: '#00f0ff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Subtítulo
        this.add.text(400, 240, 'Demuestra tu poder en el campo', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Botón de Inicio interactivo
        const startBtn = this.add.text(400, 380, ' TAP TO START ', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#ff0055',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#00f0ff' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ fill: '#ffffff' }));

        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}