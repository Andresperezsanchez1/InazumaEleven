class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#111d28');

        // Dibujar campo de fútbol simplificado en el centro
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 0.3);
        graphics.strokeRect(50, 50, 700, 500); // Línea de campo
        graphics.strokeCircle(400, 300, 800); // Círculo central

        // Marcador superior (You 0 - 0 Rival)
        this.scoreText = this.add.text(400, 30, 'You  0 – 0  Rival', {
            fontSize: '26px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Temporizador de partido (3:00)
        this.timeText = this.add.text(400, 65, '3:00', {
            fontSize: '20px',
            fill: '#ffcc00'
        }).setOrigin(0.5);

        // Crear el balón (un círculo brillante generado por código)
        const ballGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        ballGraphics.fillStyle(0x00fff0);
        ballGraphics.fillCircle(15, 15, 15);
        ballGraphics.generateTexture('ball_tex', 30, 30);

        // Física del balón
        this.ball = this.physics.add.image(400, 300, 'ball_tex');
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(0.9, 0.9);

        // Controles e instrucciones visuales
        this.add.text(400, 540, 'Haz clic para pasar/chutar | Presiona ESPACIO para Técnica Especial', {
            fontSize: '15px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // Click / Tap para impulsar el balón hacia el cursor
        this.input.on('pointerdown', (pointer) => {
            this.physics.moveTo(this.ball, pointer.x, pointer.y, 500);
        });

        // Tecla Espacio para activar la técnica
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            // Efecto visual de Técnica Especial
            this.cameras.main.flash(300, 0, 255, 240);
            this.ball.setVelocity(0, -600); // Chut especial hacia arriba
        }
    }
}