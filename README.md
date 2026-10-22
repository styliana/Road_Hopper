# Road Hopper 3D – Laboratorium 4 / Three.js

Projekt pokazuje etap laboratorium 4: renderowanie w Three.js, modele samochodu i drzewa wczytywane z GLB oraz planszę i gracza zsynchronizowanych z dotychczasową logiką gry.

## Uruchomienie

1. Sprawdź w terminalu: `node --version` oraz `npm --version`. Jeśli Node.js nie jest zainstalowany, pobierz wersję LTS z https://nodejs.org/en/download.
2. Otwórz katalog `games_programming` w Visual Studio Code.
3. W terminalu w tym katalogu wykonaj `npm install`.
4. Uruchom `npm run dev` i otwórz adres podany przez Vite, zwykle `http://localhost:5173/`.

Three.js jest zależnością projektu. Potrzebna jest przeglądarka obsługująca WebGL.
Jeżeli PowerShell blokuje `npm.ps1`, uruchom `npm.cmd install` i `npm.cmd run dev` lub skorzystaj z terminala CMD.

## Organizacja

- `src/three/modelLoader.js` – wczytywanie modeli GLB, dopasowanie ich rozmiaru i zliczanie trójkątów.
- `src/three/objects.js` – plansza, postać, modele aut i drzew oraz synchronizacja z logiką gry.
- `public/models/car.glb` – oryginalny model low-poly samochodu.
- `public/models/tree.glb` – oryginalny model low-poly drzewa.
- `public/models/kociak.glb` – model kociaka używany jako postać gracza.
- `src/main.js` – scena, kamera, renderer Three.js i dotychczasowa logika gry.
- `src/game/` – logika gry zachowana z poprzedniego etapu.

Modele samochodu i drzewa w `public/models/` są prostymi, oryginalnymi modelami low-poly. `kociak.glb` jest modelem gracza; dotychczasowe sterowanie i wykrywanie kolizji pozostają bez zmian.

## Oddanie

Zadania domowe znajdują się na końcu instrukcji PDF. Projekt oddaj jako archiwum ZIP **bez katalogu `node_modules`**, a sprawozdanie jako osobny PDF.
