/* =====================================================
   VALERIA'S GARDEN · script.js
   ===================================================== */

/* ---------- DATOS GENERALES ---------- */

// Claves con las que se guarda la información en el navegador
const CLAVE_PUBLICACIONES = "valerias_garden_publicaciones";
const CLAVE_PERFIL = "valerias_garden_perfil";
const FOTO_PERFIL_DEFECTO = "../activos/imagenes/Navbar/perfil.png";

// Categorías: el valor interno y el texto que se muestra
const CATEGORIAS = {
  interior: "Plantas de interior",
  suculentas: "Suculentas y cactus",
  flores: "Flores",
  hierbas: "Hierbas y aromáticas",
  orquideas: "Orquídeas",
  arbustos: "Árboles y arbustos",
  frutales: "Frutales",
  otras: "Otras"
};

// Filtros de foto (los mismos del formulario de crear publicación)
const FILTROS_CSS = {
  normal: "none",
  sepia: "sepia(0.85)",
  blanco_negro: "grayscale(1)",
  calido: "sepia(0.35) saturate(1.3) hue-rotate(-10deg)",
  vivido: "saturate(1.6) contrast(1.1)",
  suave: "brightness(1.08) contrast(0.88) saturate(0.9)"
};


/* =====================================================
   UTILIDADES
   ===================================================== */

// Evita que un texto escrito por el usuario se interprete como código HTML
function escaparHTML(texto) {
  return String(texto).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Quita tildes y mayúsculas: "orquidea" encuentra "Orquídeas"
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Devuelve el arreglo de publicaciones guardado en el navegador
function leerPublicaciones() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PUBLICACIONES)) || [];
  } catch (error) {
    return [];
  }
}

// Guarda el arreglo de publicaciones. Devuelve false si no se pudo
function guardarPublicaciones(lista) {
  try {
    localStorage.setItem(CLAVE_PUBLICACIONES, JSON.stringify(lista));
    return true;
  } catch (error) {
    return false;
  }
}

function leerPerfil() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PERFIL));
  } catch (error) {
    return null;
  }
}

function nombreUsuario() {
  const perfil = leerPerfil();
  return (perfil && perfil.datos && perfil.datos.nombre) || "Usuario";
}

// La foto de perfil guardada solo se muestra para el usuario actual
function fotoDe(autor) {
  const perfil = leerPerfil();
  if (perfil && perfil.foto && autor === nombreUsuario()) return perfil.foto;
  return FOTO_PERFIL_DEFECTO;
}

// Busca una publicación por id, la modifica y guarda el arreglo
function actualizarPublicacion(id, cambiar) {
  if (!id) return; // las tarjetas escritas a mano en el HTML no se guardan
  const lista = leerPublicaciones();
  const publicacion = lista.find(function (p) { return p.id === id; });
  if (!publicacion) return;
  cambiar(publicacion);
  guardarPublicaciones(lista);
}


/* =====================================================
   MOSTRAR PUBLICACIONES GUARDADAS
   (páginas de Publicaciones y Buscar)
   ===================================================== */

// Crea el HTML de un comentario
function crearComentario(comentario) {
  return `
    <li class="comentario">
      <img src="${escaparHTML(fotoDe(comentario.autor))}" alt="Foto de perfil de ${escaparHTML(comentario.autor)}" class="comentario_foto">
      <div class="comentario_texto">
        <strong>${escaparHTML(comentario.autor)}</strong>
        <p>${escaparHTML(comentario.texto)}</p>
      </div>
    </li>`;
}

// Crea el HTML de una publicación completa
function crearTarjeta(pub) {
  const esMia = pub.propia || pub.autor === nombreUsuario();
  const fecha = new Date(pub.fecha).toLocaleDateString("es-CR", {
    day: "numeric", month: "long", year: "numeric"
  });
  const categoria = CATEGORIAS[pub.categoria] || "Otras";
  const filtro = FILTROS_CSS[pub.filtro] || "none";

  return `
    <article class="publicacion" data-id="${escaparHTML(pub.id)}" data-categoria="${escaparHTML(pub.categoria)}">
      <div class="publicacion_principal">

        <header class="publicacion_autor">
          <img src="${escaparHTML(fotoDe(pub.autor))}" alt="Foto de perfil de ${escaparHTML(pub.autor)}" class="autor_foto">
          <div>
            <strong class="autor_nombre">${escaparHTML(pub.autor)}</strong>
            <time class="publicacion_fecha" datetime="${escaparHTML(pub.fecha)}">${escaparHTML(fecha)}</time>
          </div>
          <span class="publicacion_categoria">${escaparHTML(categoria)}</span>
        </header>

        <img src="${escaparHTML(pub.foto)}" alt="${escaparHTML(pub.titulo)}" class="publicacion_imagen" style="filter: ${filtro}">

        <div class="publicacion_info">
          <div class="publicacion_acciones">
            <button type="button" class="btn_like${pub.meGusta ? " activo" : ""}" aria-label="Me gusta" aria-pressed="${pub.meGusta ? "true" : "false"}">
              ♥ <span class="likes_cantidad">${pub.likes || 0}</span>
            </button>
            ${esMia ? '<button type="button" class="btn_borrar">Eliminar</button>' : ""}
          </div>
          <h3 class="publicacion_titulo">${escaparHTML(pub.titulo)}</h3>
          <p class="publicacion_descripcion">
            <strong>${escaparHTML(pub.autor)}</strong>
            ${escaparHTML(pub.descripcion)}
          </p>
        </div>

      </div>

      <aside class="publicacion_comentarios">
        <h2>Comentarios</h2>
        <ul class="lista_comentarios">${(pub.comentarios || []).map(crearComentario).join("")}</ul>
        <form class="form_comentario">
          <input type="text" name="comentario" placeholder="Escribe un comentario..." aria-label="Escribe un comentario" required>
          <button type="submit" class="button">Enviar</button>
        </form>
      </aside>
    </article>`;
}

// Recorre el arreglo y muestra cada publicación en la página
function mostrarPublicacionesGuardadas() {
  let contenedor = document.getElementById("publicaciones");
  const busqueda = document.querySelector(".busqueda");

  // Si la página de búsqueda no tiene dónde mostrarlas, crea el espacio
  if (!contenedor && busqueda) {
    contenedor = document.createElement("section");
    contenedor.id = "publicaciones";
    (busqueda.closest("section") || busqueda).after(contenedor);
  }
  if (!contenedor) return;

  const lista = leerPublicaciones();
  if (lista.length === 0) return;

  const plantilla = document.createElement("template");
  plantilla.innerHTML = lista.map(crearTarjeta).join("");

  // Las más nuevas quedan debajo del título (si hay uno)
  const titulo = contenedor.querySelector(":scope > h1");
  if (titulo) titulo.after(plantilla.content);
  else contenedor.prepend(plantilla.content);
}

mostrarPublicacionesGuardadas();


/* =====================================================
   ME GUSTA
   ===================================================== */

document.addEventListener("click", function (evento) {
  const boton = evento.target.closest(".btn_like");
  if (!boton) return;

  const contador = boton.querySelector(".likes_cantidad");
  if (!contador) return;

  const activo = boton.classList.toggle("activo");
  const cantidad = parseInt(contador.textContent, 10) || 0;
  const nueva = activo ? cantidad + 1 : Math.max(0, cantidad - 1);

  contador.textContent = nueva;
  boton.setAttribute("aria-pressed", activo);

  // Guarda el nuevo número en el arreglo
  const tarjeta = boton.closest(".publicacion");
  actualizarPublicacion(tarjeta && tarjeta.dataset.id, function (p) {
    p.likes = nueva;
    p.meGusta = activo;
  });
});


/* =====================================================
   ELIMINAR PUBLICACIÓN
   ===================================================== */

document.addEventListener("click", function (evento) {
  const boton = evento.target.closest(".btn_borrar");
  if (!boton) return;

  const tarjeta = boton.closest(".publicacion");
  if (!tarjeta || !tarjeta.dataset.id) return;

  if (!confirm("¿Desea eliminar esta publicación? Esta acción no se puede deshacer.")) return;

  // Quita la publicación del arreglo y vuelve a guardarlo
  const lista = leerPublicaciones().filter(function (p) {
    return p.id !== tarjeta.dataset.id;
  });

  if (!guardarPublicaciones(lista)) return;

  tarjeta.remove(); // la quita de la página

  // Avisa a la búsqueda para que actualice el mensaje de "sin resultados"
  document.dispatchEvent(new Event("publicaciones:cambio"));
});


/* =====================================================
   COMENTARIOS
   ===================================================== */

document.addEventListener("submit", function (evento) {
  const formulario = evento.target.closest(".form_comentario");
  if (!formulario) return;

  evento.preventDefault(); // evita que la página se recargue

  const campo = formulario.querySelector("input[name='comentario']");
  const texto = campo.value.trim();
  if (texto === "") return;

  const autor = nombreUsuario();
  const lista = formulario
    .closest(".publicacion_comentarios")
    .querySelector(".lista_comentarios");

  lista.insertAdjacentHTML("beforeend", crearComentario({ autor: autor, texto: texto }));
  lista.scrollTop = lista.scrollHeight;
  campo.value = "";

  const tarjeta = formulario.closest(".publicacion");
  actualizarPublicacion(tarjeta && tarjeta.dataset.id, function (p) {
    p.comentarios = p.comentarios || [];
    p.comentarios.push({ autor: autor, texto: texto });
  });
});


/* =====================================================
   BÚSQUEDA Y CATEGORÍAS
   ===================================================== */

const buscador = document.getElementById("buscar");

if (buscador) {
  const botones = document.querySelectorAll(".categoria_btn");
  const mensaje = document.querySelector(".busqueda_resultado");
  let categoriaActiva = "todas";

  // Muestra u oculta cada publicación según el texto y la categoría
  function filtrar() {
    const texto = normalizar(buscador.value.trim());
    const tarjetas = document.querySelectorAll(".publicacion");
    let visibles = 0;

    tarjetas.forEach(function (tarjeta) {
      const coincideCategoria =
        categoriaActiva === "todas" || tarjeta.dataset.categoria === categoriaActiva;

      // Busca en autor, fecha, categoría, título y descripción (no en comentarios)
      const contenido = normalizar(
        tarjeta.querySelector(".publicacion_principal").textContent
      );

      const mostrar = coincideCategoria && contenido.includes(texto);
      tarjeta.hidden = !mostrar;
      if (mostrar) visibles++;
    });

    if (!mensaje) return;

    if (tarjetas.length === 0) {
      mensaje.textContent = "Todavía no hay publicaciones. ¡Sea la primera persona en compartir una!";
    } else if (visibles === 0 && texto === "" && categoriaActiva !== "todas") {
      mensaje.textContent = "Todavía no hay publicaciones en esta categoría.";
    } else if (visibles === 0) {
      mensaje.textContent = "No se encontraron publicaciones con esa búsqueda.";
    } else {
      mensaje.textContent = "";
    }
  }

  buscador.addEventListener("input", filtrar);
  document.addEventListener("publicaciones:cambio", filtrar);

  document.querySelector(".busqueda").addEventListener("submit", function (evento) {
    evento.preventDefault();
  });

  // Botones de categoría: marca el elegido y filtra
  botones.forEach(function (boton) {
    boton.addEventListener("click", function () {
      categoriaActiva = boton.dataset.categoria;

      botones.forEach(function (otro) {
        const esActivo = otro === boton;
        otro.classList.toggle("activo", esActivo);
        otro.setAttribute("aria-pressed", esActivo);
      });

      filtrar();
    });
  });

  filtrar();
}


/* =====================================================
   CREAR PUBLICACIÓN
   ===================================================== */

const formCrear = document.querySelector(".crear_publicacion");

if (formCrear) {
  const inputFoto = document.getElementById("foto");
  const vista = formCrear.querySelector(".vista_imagen");
  const campoUsuario = formCrear.elements.usuario; // campo "Nombre de usuario"
  let urlActual = null;

  // Rellena el nombre de usuario con el del perfil (se puede cambiar)
  function rellenarUsuario() {
    if (!campoUsuario) return;
    const nombre = nombreUsuario();
    campoUsuario.value = nombre === "Usuario" ? "" : nombre;
  }

  rellenarUsuario();

  function ocultarVista() {
    if (urlActual) URL.revokeObjectURL(urlActual);
    urlActual = null;
    vista.removeAttribute("src");
    vista.hidden = true;
  }

  // Muestra un mensaje debajo del formulario (esError lo pone en rojo)
  function mostrarAviso(texto, enlace, esError) {
    let aviso = formCrear.querySelector(".perfil_mensaje");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.className = "perfil_mensaje";
      aviso.setAttribute("role", "status");
      formCrear.querySelector(".crear_datos").appendChild(aviso);
    }

    aviso.classList.toggle("error", Boolean(esError));
    aviso.textContent = texto + " ";

    if (enlace) {
      const a = document.createElement("a");
      a.href = enlace.href;
      a.textContent = enlace.texto;
      aviso.appendChild(a);
    }
  }

  // Revisa los datos antes de publicar y devuelve la lista de errores
  function validarPublicacion(datos, archivo) {
    const errores = [];

    const usuario = (datos.get("usuario") || nombreUsuario()).trim();
    const titulo = (datos.get("titulo") || "").trim();
    const descripcion = (datos.get("descripcion") || "").trim();

    if (usuario.length < 2) {
      errores.push("El nombre de usuario debe tener al menos 2 caracteres.");
    }
    if (titulo.length < 3) {
      errores.push("El título debe tener al menos 3 caracteres.");
    }
    if (descripcion.length < 10) {
      errores.push("La descripción debe tener al menos 10 caracteres.");
    }
    if (!datos.get("categoria")) {
      errores.push("Seleccione una categoría.");
    }
    if (!archivo) {
      errores.push("Elija una foto para su publicación.");
    }

    return errores;
  }

  // Reduce la foto para que quepa en la memoria del navegador
  function comprimirImagen(archivo) {
    return new Promise(function (resolver, rechazar) {
      const lector = new FileReader();

      lector.addEventListener("error", rechazar);
      lector.addEventListener("load", function () {
        const imagen = new Image();

        imagen.addEventListener("error", rechazar);
        imagen.addEventListener("load", function () {
          const MAXIMO = 900;
          const escala = Math.min(1, MAXIMO / Math.max(imagen.width, imagen.height));
          const lienzo = document.createElement("canvas");
          lienzo.width = Math.round(imagen.width * escala);
          lienzo.height = Math.round(imagen.height * escala);

          const ctx = lienzo.getContext("2d");
          ctx.fillStyle = "#EBE0CA"; // fondo para PNG con transparencia
          ctx.fillRect(0, 0, lienzo.width, lienzo.height);
          ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

          resolver(lienzo.toDataURL("image/jpeg", 0.8));
        });

        imagen.src = lector.result;
      });

      lector.readAsDataURL(archivo);
    });
  }

  // Vista previa de la foto elegida (los filtros se ven sobre ella)
  inputFoto.addEventListener("change", function () {
    const archivo = inputFoto.files[0];

    if (!archivo) {
      ocultarVista();
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      inputFoto.value = "";
      ocultarVista();
      mostrarAviso("Elija un archivo de imagen (JPG, PNG o WEBP).", null, true);
      return;
    }

    if (urlActual) URL.revokeObjectURL(urlActual);
    urlActual = URL.createObjectURL(archivo);
    vista.src = urlActual;
    vista.hidden = false;
  });

  // Al publicar: valida, guarda la publicación y avisa
  formCrear.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const archivo = inputFoto.files[0];
    const datos = new FormData(formCrear);

    // 1. Validar los datos
    const errores = validarPublicacion(datos, archivo);
    if (errores.length > 0) {
      mostrarAviso(errores.join(" "), null, true);
      return;
    }

    try {
      // 2. Crear el objeto de la publicación
      const foto = await comprimirImagen(archivo);

      const nueva = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        autor: (datos.get("usuario") || nombreUsuario()).trim(),
        propia: true, // creada en este navegador: se podrá eliminar
        foto: foto,
        titulo: datos.get("titulo").trim(),
        descripcion: datos.get("descripcion").trim(),
        categoria: datos.get("categoria"),
        filtro: datos.get("filtro") || "normal",
        fecha: new Date().toISOString(),
        likes: 0,
        meGusta: false,
        comentarios: []
      };

      // 3. Agregarla al arreglo y guardarlo
      const lista = leerPublicaciones();
      lista.unshift(nueva); // la más nueva primero

      if (!guardarPublicaciones(lista)) {
        mostrarAviso("No se pudo guardar: la memoria del navegador está llena. Pruebe con una foto más pequeña.", null, true);
        return;
      }

      // 4. Limpiar el formulario y avisar
      formCrear.reset();
      rellenarUsuario();
      ocultarVista();
      mostrarAviso("Publicación creada.", { href: "Publicaciones.html", texto: "Verla en publicaciones" });
    } catch (error) {
      mostrarAviso("No se pudo procesar la foto. Pruebe con otra imagen.", null, true);
    }
  });
}


/* =====================================================
   PERFIL DE USUARIO
   ===================================================== */

const formPerfil = document.getElementById("form_perfil");

if (formPerfil) {
  const campos = document.getElementById("campos_perfil");
  const btnEditar = document.getElementById("btn_editar");
  const btnCancelar = document.getElementById("btn_cancelar");
  const acciones = document.getElementById("acciones_edicion");
  const mensaje = document.getElementById("perfil_mensaje");

  const nombreTitulo = document.getElementById("perfil_nombre");
  const foto = document.getElementById("perfil_foto");
  const cambiarFoto = document.getElementById("cambiar_foto");
  const inputFoto = document.getElementById("nueva_foto");

  const NOMBRES = ["nombre", "correo", "pais", "provincia", "descripcion"];

  let respaldoDatos = null; // datos antes de editar (para "Cancelar")
  let respaldoFoto = null;
  let temporizador = null;

  // Lee los valores actuales del formulario
  function leerDatos() {
    const datos = {};
    NOMBRES.forEach(function (nombre) {
      datos[nombre] = formPerfil.elements[nombre].value;
    });
    return datos;
  }

  // Escribe los datos en el formulario y en el título
  function escribirDatos(datos) {
    NOMBRES.forEach(function (nombre) {
      if (datos[nombre] !== undefined) {
        formPerfil.elements[nombre].value = datos[nombre];
      }
    });
    nombreTitulo.textContent = datos.nombre || nombreTitulo.textContent;
  }

  function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      mensaje.textContent = "";
    }, 4000);
  }

  // Activa o desactiva el modo de edición
  function modoEdicion(activo) {
    campos.disabled = !activo;
    acciones.hidden = !activo;
    cambiarFoto.hidden = !activo;
    btnEditar.hidden = activo;
  }

  // Al abrir la página: recupera lo guardado antes
  const guardado = leerPerfil();
  if (guardado) {
    escribirDatos(guardado.datos);
    if (guardado.foto) foto.src = guardado.foto;
  }

  // Botón "Editar datos"
  btnEditar.addEventListener("click", function () {
    respaldoDatos = leerDatos();
    respaldoFoto = foto.src;
    mensaje.textContent = "";
    modoEdicion(true);
    formPerfil.elements.nombre.focus();
  });

  // Botón "Cancelar": vuelve a lo que había antes
  btnCancelar.addEventListener("click", function () {
    escribirDatos(respaldoDatos);
    foto.src = respaldoFoto;
    inputFoto.value = "";
    modoEdicion(false);
    btnEditar.focus();
  });

  // Cambiar la foto de perfil (vista previa inmediata)
  inputFoto.addEventListener("change", function () {
    const archivo = inputFoto.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      mostrarMensaje("Elija un archivo de imagen (JPG, PNG o WEBP).");
      inputFoto.value = "";
      return;
    }

    const lector = new FileReader();
    lector.addEventListener("load", function () {
      foto.src = lector.result;
    });
    lector.readAsDataURL(archivo);
  });

  // Botón "Guardar cambios"
  formPerfil.addEventListener("submit", function (evento) {
    evento.preventDefault(); // evita que la página se recargue

    const datos = leerDatos();
    datos.nombre = datos.nombre.trim();
    formPerfil.elements.nombre.value = datos.nombre;
    nombreTitulo.textContent = datos.nombre;

    try {
      const fotoGuardar = foto.src.startsWith("data:") ? foto.src : null;
      localStorage.setItem(CLAVE_PERFIL, JSON.stringify({ datos: datos, foto: fotoGuardar }));
      mostrarMensaje("Cambios guardados.");
    } catch (error) {
      mostrarMensaje("Los cambios se aplicaron, pero no se pudieron guardar en este navegador.");
    }

    inputFoto.value = "";
    modoEdicion(false);
    btnEditar.focus();
  });
}