<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
=======
# 🤖 Yoko AI - Frontend

Bienvenido al repositorio frontend de **Yoko**, un asistente académico impulsado por Inteligencia Artificial diseñado específicamente para la comunidad estudiantil de la Universidad Nacional Experimental de Guayana (UNEG). 

Este proyecto implementa una interfaz de usuario conversacional fluida, intuitiva y responsiva, diseñada para interactuar con el motor de IA de Yoko. La aplicación permite a los estudiantes consultar información académica, gestionar dudas y acceder a recursos institucionales de manera eficiente.

## ✨ Características Principales

* **Autenticación Institucional:** Flujo de registro e inicio de sesión seguro, orientado a correos académicos.
* **Chat en Tiempo Real:** Interfaz de mensajería optimizada con indicadores de carga ("Yoko is processing...") y animaciones fluidas para una experiencia de usuario natural.
* **Gestión de Sesiones:** Historial de conversaciones accesible a través de un panel lateral dinámico.
* **Diseño Responsivo:** Adaptabilidad total a dispositivos móviles mediante menús colapsables (Drawers) y un sistema de cuadrícula flexible.
* **UI/UX Moderna:** Implementación de un sistema de diseño limpio utilizando Tailwind CSS y transiciones con Framer Motion.

## 🛠️ Stack Tecnológico

* **Core:** React, React Router Dom
* **Estilos:** Tailwind CSS
* **Animaciones:** Framer Motion
* **Iconografía:** Lucide React
* **Gestión de Estado:** Context API / Zustand (Dependiendo de la implementación final)
>>>>>>> 048b6df1e6365f317b0e171f6d198064306c1d0d
