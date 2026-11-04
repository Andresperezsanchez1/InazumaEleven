class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Fondo generado por código
        const bgGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        bgGraphics.fillStyle(0x0f172a);
        bgGraphics.fillRect(0, 0, 800, 600);
        bgGraphics.generateTexture('bg_field', 800, 600);

        // Balón de fútbol brillante generado por código
        const ballGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        ballGraphics.fillStyle(0x00f0ff);
        ballGraphics.fillCircle(16, 16, 16);
        ballGraphics.lineStyle(2, 0xffffff);
        ballGraphics.strokeCircle(16, 16, 16);
        ballGraphics.generateTexture('ball', 32, 32);

        // Pasamos directamente al menú
        this.scene.start('MenuScene');
    }
}