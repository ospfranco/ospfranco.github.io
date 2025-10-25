---
layout: post
title: Mejores tasks y scripts con mise y bun shell
date: 2025-03-26
categories: post
permalink: /:title/
image: /assets/oscar.jpg
is_spanish_version: true
---

Recientemente estoy trabajando con repositorios con multiples lenguajes and sistemas de compilación. Para ser más especificos iOS/Android/Rust/Node/React Native/Flutter. Trabajar con diferentes y multiples sistemas, trae mucha complejidad, especialmente cuando uno trabaja en equipo, cuando todos necesitan correr los mismos comandos para construir, correr lost tests, lints y tener las versiones correctas instaladas.

# Herramientas Existentes

Cada lenguaje y ecosistema tiene su propia forma de hacer las cosas. Algunos de los patrones que he visto son:

- Cmake y patrones anticuados, creados para compilar proyectos C/C++. Esta mal utilizado para compilar programas en Rust, pero deja de ser útil cuando se tiene que tener variables, parsear parametros, etc.
- Escribir aún más Rust para tener un herramienta de CLI. Pero es muy engorroso y verboso. Uno tiene que escribir mucho código para hacer tasks sencillos funcionar. Hay un crate llamado [xtask](https://docs.rs/xtasks/latest/xtasks/) que permite automatizar algo de este dolor.
- Tasks de npm que corren scripts en bash
- Scripts en Node/JS que llaman commandos directamente
- Otras herramientas como `make`, `rake`, `ninja`, etc.

Es un salvaje oeste. Todas estos approachs funcionan pero necesitan mucho cuidado para que funcionen bien. Quería algo sencillo, fácil de leer y de escribir. Preferiblemente en un lenguaje y ecosistema que conozca bien. JavaScript se ajusta bien a todos estos requerimientos, el problema es tener las versiones correctas instaladas en las maquinas de los miembros del equipo, sin embargo, encontre un par de herramientas que solucionan el primer problema, con unos cuantos comandos.

# Mise

Soy un gran fan de los tool managers. El viaje empezo con `asdf` y ahora estoy usando `mise`. `mise` es un tool manager que permite instalar todo tipo de herramientas con un solo archivo. Hay que pensar que es un package manager pero para todo incluido como lenguajes, sdks, runtime,s, etc. Basicamente permite tener un solo archive `mise.toml` que define todas las herramientas necesarias para un proyecto.

Podemos definir la versión exacta de bun/node que el proyecto requiere, sin la necesidad de seguir diferentes pasos de instalación. No hay necesidar de instalar node, después nvm, después Rust, etc.

# Bun Shell

El Bun Shell es un objecto integrado en bun que permite correr commandos de la terminal dentro de archivos TypeScript. La belleza de este approach es la fácilidad de usar TypeScript para manipular, re-enviar, usar loops, etc. Permitiendo escapar de lo bobo de bash.

# Poniendolo todo junto

Para este proyecto mi `mise.toml` parece algo así:

```toml
[tools]
node = "14.18.1"
bun = "0.1.0"
rust = "1.58.0"

[hooks]
postinstall = "bun install"

[tasks]
build = "bun zx scripts/build.mts"
```

Luego existe un `script/build.mts` que se ve así:

```ts
import { $ } from "bun";

// You can do more things here, like parse the arguments, import other files, etc
await $`cargo build --release`;
await $`flutter build ios`;
```

En el README del repositorio tengo los siguiente commandos:

- `brew install mise`
- `mise settings experimental=true`, Necesario para habilitar los hooks, que son experimentales por ahora.
- `mise install`
- `mise build` Finalmente, compila el proyecto. En mi versión final, incluye parametros por ejemplo: `mise build ios debug` para compilar la versión para iOS en modo Debug

De esta manera ya no hay más conflictos de versiones, instalaciones incorrectas y todos los comandos siguen un solo patrón.
