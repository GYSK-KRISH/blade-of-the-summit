import Phaser from "phaser";
import { GameConfig } from "./config";

window.addEventListener("DOMContentLoaded", () => {
    new Phaser.Game(GameConfig);
});

