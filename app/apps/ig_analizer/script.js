const inputZip = document.getElementById('inputZip');
const searchUser = document.getElementById('searchUser');
const noMeSiguenGrid = document.getElementById('noMeSiguenGrid');
const noLosSigoGrid = document.getElementById('noLosSigoGrid');
const tablaCompletaGrid = document.getElementById('tablaCompletaGrid');

let seguidores = new Set();
let seguidos = new Set();
let allUsers = new Set();

// Función para parsear JSON de los archivos indicados
function parseSeguidoresJSON(content) {
    let usuarios = [];
    try {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) return [];
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (
                item &&
                item.string_list_data &&
                Array.isArray(item.string_list_data) &&
                item.string_list_data.length > 0 &&
                item.string_list_data[0].value
            ) {
                usuarios.push(item.string_list_data[0].value.toLowerCase());
            }
        }
        return usuarios;
    } catch (e) {
        console.error("Error parseando JSON seguidores:", e);
        return [];
    }
}

function parseSeguidosJSON(content) {
    let usuarios = [];
    try {
        const data = JSON.parse(content);
        if (!data || !Array.isArray(data.relationships_following)) return [];
        const lista = data.relationships_following;
        for (let i = 0; i < lista.length; i++) {
            const item = lista[i];
            if (
                item &&
                item.string_list_data &&
                Array.isArray(item.string_list_data) &&
                item.string_list_data.length > 0 &&
                item.string_list_data[0].value
            ) {
                usuarios.push(item.string_list_data[0].value.toLowerCase());
            }
        }
        return usuarios;
    } catch (e) {
        console.error("Error parseando JSON seguidos:", e);
        return [];
    }
}

function llenarGridUsuarios(grid, usuarios) {
    grid.innerHTML = '<div class="grid-header">Usuario</div>';
    if (usuarios.length === 0) {
        const div = document.createElement('div');
        div.textContent = '(Ninguno)';
        grid.appendChild(div);
        return;
    }
    usuarios.forEach(u => {
        const div = document.createElement('div');
        const link = document.createElement('a');
        link.href = `https://instagram.com/${u}`;
        link.target = '_blank';
        link.textContent = u;

        div.classList.add('content');

        div.appendChild(link);
        grid.appendChild(div);
    });
}

function crearGridCompleto(usuariosFiltrados) {
    // Mantener headers
    tablaCompletaGrid.innerHTML = `
        <div class="grid-header">Usuario</div>
        <div class="grid-header">Me sigue</div>
        <div class="grid-header">Lo sigo</div>
    `;
    if (usuariosFiltrados.length === 0) {
        const div = document.createElement('div');
        div.textContent = '(No se encontraron usuarios)';
        div.style.gridColumn = "1 / span 3";
        tablaCompletaGrid.appendChild(div);
        return;
    }
    usuariosFiltrados.forEach(u => {
        // Usuario
        const divUser = document.createElement('div');
        const link = document.createElement('a');
        link.href = `https://instagram.com/${u}`;
        link.target = '_blank';
        link.textContent = u;
        divUser.appendChild(link);

        // Me sigue
        const divMeSigue = document.createElement('div');
        divMeSigue.textContent = seguidores.has(u) ? '✅' : '❌';

        // Lo sigo
        const divLoSigo = document.createElement('div');
        divLoSigo.textContent = seguidos.has(u) ? '✅' : '❌';

        divMeSigue.classList.add('content', seguidores.has(u) ? 'following' : 'not-following');
        divLoSigo.classList.add('content', seguidos.has(u) ? 'following' : 'not-following');

        tablaCompletaGrid.appendChild(divUser);
        tablaCompletaGrid.appendChild(divMeSigue);
        tablaCompletaGrid.appendChild(divLoSigo);
    });
}

function filtrarYMostrar() {
    searchUser.scrollIntoView({ behavior: 'smooth' });
    const filtro = searchUser.value.trim().toLowerCase();
    const usuariosFiltrados = Array.from(allUsers).filter(u => u.includes(filtro));
    crearGridCompleto(usuariosFiltrados);
}

inputZip.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Reiniciar datos
    seguidores.clear();
    seguidos.clear();
    allUsers.clear();
    noMeSiguenGrid.innerHTML = '<div class="grid-header">Usuario</div>';
    noLosSigoGrid.innerHTML = '<div class="grid-header">Usuario</div>';
    tablaCompletaGrid.innerHTML = `
        <div class="grid-header">Usuario</div>
        <div class="grid-header">Me sigue</div>
        <div class="grid-header">Lo sigo</div>
    `;
    searchUser.value = '';
    searchUser.disabled = true;

    try {
        const zip = await JSZip.loadAsync(file);
        let name

        for (let i in zip.files) {
            name = i.split("/")[0]
            break
        }

        // Rutas
        const rutaSeguidores = name + '/connections/followers_and_following/followers_1.json';
        const rutaSeguidos = name + '/connections/followers_and_following/following.json';

        // Leer archivos dentro del ZIP
        const seguidosFile = zip.file(rutaSeguidos);
        const seguidoresFile = zip.file(rutaSeguidores);

        if (!seguidosFile || !seguidoresFile) {
            alert('No se encontraron los archivos JSON en las rutas esperadas dentro del ZIP.');
            return;
        }

        const seguidosText = await seguidosFile.async('string');
        const seguidoresText = await seguidoresFile.async('string');

        const listaSeguidos = parseSeguidosJSON(seguidosText);
        const listaSeguidores = parseSeguidoresJSON(seguidoresText);

        // Guardar en sets para comparación rápida
        listaSeguidos.forEach(u => seguidos.add(u));
        listaSeguidores.forEach(u => seguidores.add(u));

        // Todos los usuarios combinados (sin duplicados)
        listaSeguidos.forEach(u => allUsers.add(u));
        listaSeguidores.forEach(u => allUsers.add(u));

        // Encontrar usuarios sin reciprocidad
        // 1. Yo sigo pero no me siguen
        const yoSigoNoMeSiguen = listaSeguidos.filter(u => !seguidores.has(u));
        // 2. Me siguen y yo no sigo
        const meSiguenYoNoSigo = listaSeguidores.filter(u => !seguidos.has(u));

        // Llenar tablas
        llenarGridUsuarios(noMeSiguenGrid, yoSigoNoMeSiguen);
        llenarGridUsuarios(noLosSigoGrid, meSiguenYoNoSigo);
        crearGridCompleto(Array.from(allUsers).sort());

        searchUser.disabled = false;

    } catch (err) {
        alert('Error procesando el archivo ZIP: ' + err.message);
        console.error(err);
    }
});

searchUser.addEventListener('input', filtrarYMostrar);

const fileInput = document.getElementById('inputZip');
const customButton = document.querySelector('.customInputZip');
customButton.addEventListener('click', () => {
  fileInput.click();
});