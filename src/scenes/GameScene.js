class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.add.image(400, 300, 'bg_field');

        // Balón de fútbol con física Arcade
        this.ball = this.physics.add.image(400, 300, 'ball');
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(0.85, 0.85);
        this.ball.setVelocity(250, 180);

        // Marcador e Interfaz
        this.scoreText = this.add.text(400, 40, 'YOU 0 - 0 RIVAL', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 80, 'Tiempo: 3:00', {
            fontSize: '20px',
            fill: '#ffcc00'
        }).setOrigin(0.5);

        this.add.text(400, 550, '¡Haz clic para hacer un pase rápido / tiro!', {
            fontSize: '16px',
            fill: '#94a3b8'
        }).setOrigin(0.5);

        // Controles táctiles / Ratón
        this.input.on('pointerdown', (pointer) => {
            this.physics.moveTo(this.ball, pointer.x, pointer.y, 500);
        });
    }

    update() {
        // Rozamiento del balón
        this.ball.body.velocity.x *= 0.99;
        this.ball.body.velocity.y *= 0.99;
    }
}