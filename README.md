<h1 align="center">UE Application Web - L3 MIAGE</h1>

<div align="center">
<img src="https://img.shields.io/badge/status-development-blue" />
</div>

This repository contains the practical coursework for the UE Application Web at Université Côte d'Azur. The objective of this project was to design and develop a suite of three distinct web-based games, each utilizing a different rendering technology (Canvas, DOM, and BabylonJS), unified by a common backend architecture.

This project was developed by:
- BOUTRIK Alexandre
- MANILIUC David
- LANDOULSI Aziz

## Project Architecture

The repository is divided into a shared backend and a frontend housing the three game implementations and a main menu.

```
.
├── backend/                # Node.js + Express + MongoDB Server
│   ├── models/             # Database Schemas (e.g. Score.js)
│   ├── routes/             # API Routes
│   └── server.js           # Entry point
├── frontend/
│   ├── babylonjs/          # 3D Game Source
│   ├── canvas/             # 2D Artillery Game Source
│   ├── dom/                # DOM-based Game Source
│   └── menu/               # Main navigation hub (Home, About, Game Selection)
```

## Documentation

Each game is located in its respective directory within `frontend/` and includes its own dedicated `README.md` and detailed `documentation/` subfolder (architecture diagrams, design patterns, etc).

## LICENSE

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the code as needed. See the [LICENSE](LICENSE) file for more information.
