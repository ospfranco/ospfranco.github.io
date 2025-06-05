---
layout: post
title: Rust tips de un noob
date: 2025-06-05
categories: post
permalink: /:title/
image: /assets/oscar.jpg
is_spanish_version: true
---

Soy un novato en Rust. Aprendí porque algunos clientes querían ejecutar Rust en React-Native. Por eso he estado aprendiendo sobre la marcha y confiando en copilot para enseñarme los conceptos básicos. Pero los LLMs son máquinas de regurgitar y no siempre dan el código más idiomático. Aquí algunos consejos que he aprendido. Con sus matices, claro: asume que puedes usar `std`, etc.

- Al menos en mi experiencia, es mejor apuntar a arquitecturas sin estado o te arriesgas a tener muchos mutexes, send+sync y código difícil de entender/fácil de bloquear. Si puedes evitar el estado global, el siguiente punto te será útil ↓
- No uses los crates `lazy_static` o `once_cell`, su funcionalidad ya está incorporada en la librería estándar (`std`) y ahora puedes usar `OnceLock` y `LazyLock` para inicializar variables globales.

  ```rust
    // ❌ No hagas esto
    lazy_static! {
      // tus variables globales
    }

    // ✅ Haz esto
    static MY_GLOBAL_STRING: LazyLock<RwLock<String>> =
      LazyLock::new(|| RwLock::new("Hello World!".into()));
  ```

- Generalmente, `RwLock` es lo que quieres en vez de `Mutex`. Permite múltiples lectores sin bloquear completamente tu proceso. Eso sí, si vas a leer y escribir en la misma función, ¡es muy importante liberar cualquier lock de lectura!

  ```rust
  let my_read_var = MY_VAR.read().unwrap()
  // Si no haces drop
  drop(my_read_var)
  // Este writer se bloqueará
  let mut my_write_var = MY_VAR.write().unwrap();
  ```

- Agregar WASM después puede ser doloroso, ya que WASM no es multi-hilo. El código async podría necesitar ser refactorizado o compilado con `cfg`s para evitar traits async, uso de send+sync, etc.
- Si expones una API en C y devuelves `std::ffi::Cstring`, las cadenas deben ser devueltas a Rust para ser liberadas de forma segura.

  ```rust
  #[no_mangle]
  unsafe extern "C" fn get_a_string() -> *mut c_char {
    let data = CString::new("Hello World!".into()).unwrap();
    data.into_raw() as *mut c_char
  }

  // El puntero debe ser devuelto a Rust para su liberación segura
  #[no_mangle]
  unsafe extern "C" fn free_string(ptr: *mut c_char) {
      if ptr.is_null() {
          return;
      }

      let _ = CString::from_raw(ptr);
      // Se libera automáticamente al final de la función
  }
  ```

- Puede que tu equipo no esté acostumbrado a ciertos patrones tipo mónada, como `Result` y `Option`. Permiten un código Rust muy idiomático y conciso. Fomenta su uso.
- Aunque Rust es cross-platform, hay muchas trampas no obvias.
  - Una que me afectó mucho fue la falta de acceso a los certificados TLS nativos en Android, lo que llevó a que OpenSSL se compilara e incluyera en mi crate. Esto lleva a un lío entre los crates `nativetls` y `rustls`. Si apuntas a multiplataforma, usa `rustls` si es posible.
- `Ring` está siendo deprecado/abandonado, muchas librerías están migrando a `aws-lc-rs`, tú también deberías.
  - La migración de los crates de la comunidad hacia aws-lc-rs está ocurriendo poco a poco. Puede que necesites activar features o subir versiones para aprovechar esto.
- Los feature flags son geniales, pero su uso y comportamiento real no siempre es claro. Revisar el código fuente puede ser la única forma de entender qué features hay y qué hacen. Si asumes que los features por defecto son correctos, podrías estar agregando mucho código inútil a tu proyecto. Esto puede ser eliminado en la compilación o no. Peligroso. No hay una forma fácil de detectar esto, salvo leer la documentación y ver el código fuente para ver qué puedes desactivar y seguir teniendo un crate funcional.
- La compilación condicional es muy poderosa pero también peligrosa. Para facilitar pruebas puede ser tentador compilar condicionalmente mucho código con `#[cfg(test)]` o `#[cfg(debug)]`, pero esto puede causar problemas a futuro con errores ocultos que no se detectan durante el desarrollo. He visto que usar `if cfg!(test)` a veces es mejor, ya que todas las ramas del código se compilan y se evitan zonas muertas de compilación que pueden esconder problemas más profundos.
- Por alguna razón la comunidad de Rust parece estar enamorada de la documentación auto-generada desde el código fuente. Esta documentación es muy mala. Básicamente solo muestra las firmas de las funciones sin un flujo claro de cómo usar las APIs de los crates. Lamentablemente, revisar el código fuente en busca de ejemplos es la mejor forma de entender cómo usar cada crate.
- Propagar errores con `?` parece ser la forma recomendada, pero ¿se pierde la línea exacta donde ocurrió el error? No estoy seguro si lo estoy haciendo mal. En todo caso, es mejor usarlo con tipos de error muy específicos.
- El crate `assert2` es genial y hará que tus tests sean más fáciles de depurar mostrando los valores con colores, en vez de solo errores opacos.
