<h1 align="center">JEU CANVAS</h1>

<div align="center">
<img src="https://img.shields.io/badge/status-development-blue" />
</div>

`Jeu Canvas` is a web-based artillery strategy game inspired by classics like Worms and DDTank.

Engineered using native HTML5 Canvas and JavaScript, the project features a custom physics engine, turn-based combat, and modular entity architecture. It supports distinct character classes (Mage, Archer) and AI-driven adversaries, separating core logic from rendering to ensure performance and maintainability.

## Running the Game

Because the project utilizes ES6 Modules (`import`/`export`), it cannot be run directly from the file system. It requires a local web server to handle CORS and MIME types correctly.

Navigate to the project root `frontend` (where `canvas` and `common` are located) and start the server:

```bash
$ cd frontend
$ python -m http.server
```

Once running, the game should be accessible in your browser at [http://localhost:8000/canvas/jeu.html](http://localhost:8000/canvas/jeu.html).

## Gameplay

Once the game is loaded, select your class (Archer or Mage) via the on-screen menu to begin.

### Keyboard controls

| Key | Description |
|:-:|:-:|
| Arrow Keys | Move character / Adjust aim angle |
| Space | Jump |
| X | Fire projectile or use Instant ability |
| T | Toggle aiming mode |
| 1-9 | Switch active abilities/projectiles |

## Project structure

```
. # canvas
├── assets
│   └── maps                # CSV maps
├── css
├── documentation           # Documentation (e.g. reports)
│   └── latex-src
└── js
    ├── abilities           # Skill logic definitions
    │   ├── combat          # Projectiles
    │   └── instant         # Immediate effects (e.g. heal)
    ├── ai
    ├── core
    ├── players             # Entity classes
    ├── projectiles         # Physical objects (e.g. arrows)
    └── services            # Backend communication
```

## Documentation

Full documentation, including architecture diagrams and design patterns, can be found in the PDF located [HERE](documentation/latex-src/Jeu\_Canvas\_BOUTRIK\_MANILIUC\_LANDOULSI.pdf).

## LICENSE

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the code as needed. See the [LICENSE](LICENSE) file for more information.
