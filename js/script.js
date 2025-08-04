// === Estado de canvas unificado ===
const canvasState = {
    A: createCanvasSubstate(),
    B: createCanvasSubstate(),
    mixto: {
        A: createCanvasSubstate(),
        B: createCanvasSubstate()
    }
};

function createCanvasSubstate() {
    return {
        ctx: null,
        position: { x: 0, y: 0 },
        mouseStart: { x: 0, y: 0 },
        mouseEnd: { x: 0, y: 0 },
        percent: { x1: 0, y1: 0, x2: 0, y2: 0 },
        isDrawing: false,
        isDrawingMode: false
    };
}

// === Secuencias y datos persistidos ===
let AI_seq = parseInt(localStorage.getItem('seq') || "0", 10);
let AI_seq2 = parseInt(localStorage.getItem('seq2') || "0", 10);
let data_plano = JSON.parse(localStorage.getItem('mapped') || "[]");
let data_plano2 = JSON.parse(localStorage.getItem('mapped2') || "[]");

let d_storage = {};
let data_cd = [];
let activeZoomHandler = null;


const zoomHandlers = {
    diagrama: null,
    fotografia: null,
    mixtoA: null,
    mixtoB: null
};



function screenToCanvasCoords(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
}

// ===== Helpers de dibujo =====
function attachDrawingHandlers(options) {
    const { canvasEl, state, selector, onComplete } = options;
    if (!canvasEl) return;
    const $el = $(selector);

    function startDrawing(e) {
        const coords = screenToCanvasCoords(canvasEl, e.clientX, e.clientY);
        state.mouseStart.x = coords.x;
        state.mouseStart.y = coords.y;
        state.isDrawing = true;
        state.percent.x1 = coords.x / canvasEl.width;
        state.percent.y1 = coords.y / canvasEl.height;
    }

    function moveDrawing(e) {
        if (!state.isDrawing) return;
        const coords = screenToCanvasCoords(canvasEl, e.clientX, e.clientY);
        state.mouseEnd.x = coords.x;
        state.mouseEnd.y = coords.y;

        const width = state.mouseEnd.x - state.mouseStart.x;
        const height = state.mouseEnd.y - state.mouseStart.y;

        state.ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        state.ctx.beginPath();
        state.ctx.lineWidth = "1";
        state.ctx.strokeStyle = "#FF0000";
        state.ctx.rect(state.mouseStart.x, state.mouseStart.y, width, height);
        state.ctx.stroke();
    }

    function endDrawing(e) {
        if (!state.isDrawing) return;
        const coords = screenToCanvasCoords(canvasEl, e.clientX, e.clientY);
        state.mouseEnd.x = coords.x;
        state.mouseEnd.y = coords.y;

        state.percent.x2 = state.mouseEnd.x / canvasEl.width;
        state.percent.y2 = state.mouseEnd.y / canvasEl.height;

        const width = state.mouseEnd.x - state.mouseStart.x;
        const height = state.mouseEnd.y - state.mouseStart.y;

        state.ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        state.ctx.beginPath();
        state.ctx.lineWidth = "1";
        state.ctx.strokeStyle = "#FF0000";
        state.ctx.rect(state.mouseStart.x, state.mouseStart.y, width, height);
        state.ctx.stroke();

        state.isDrawing = false;
        if (typeof onComplete === 'function') onComplete();
    }

    // Desactivar previos y asignar nuevos
    $el.off('mousedown mousemove mouseup')
        .on('mousedown', function (e) {
            e.stopPropagation();
            startDrawing(e);
        })
        .on('mousemove', function (e) {
            moveDrawing(e);
        })
        .on('mouseup', function (e) {
            endDrawing(e);
        });
}

// === Inicio de la aplicación ===
$(function () {
    // Para diagrama
    zoomHandlers.diagrama = setupZoomAndDrag('#fp-wrapper', '#zoom-in', '#zoom-out', '#fp-img');

    // Para fotografía
    zoomHandlers.fotografia = setupZoomAndDrag('#fp-wrapper2', '#zoom-in2', '#zoom-out2', '#fp-img2');

    const tipo_plano = localStorage.getItem('tp_plano');
    show_plane(tipo_plano);
    getPlanos();

    $('#map_area').click(function () {
        $(this).hide('slow');
        $('#secciones')[0].style.visibility = "hidden";
        $('#secciones')[0].style.position = "absolute";
        $('#cancel').show('slow');

        const tp = localStorage.getItem('tp_plano');
        if (tp === "diagrama") {
            canvasState.A.isDrawingMode = true;
            const canvas = $('#fp-canvas')[0];
            if (!canvas) return;
            const cs = canvasState.A;
            cs.ctx = canvas.getContext('2d');
            cs.position.x = canvas.getBoundingClientRect().x;
            cs.position.y = canvas.getBoundingClientRect().y;

            $('#fp-canvas3, #fp-canvas4').addClass('d-none');
            $('#fp-canvas').removeClass('d-none');

            attachDrawingHandlers({
                canvasEl: canvas,
                state: cs,
                selector: '.fp-canvas',
                onComplete: showConfirmation
            });
        } else if (tp === "mixto") {
            $('#fp-canvas').addClass('d-none');
            $('#fp-canvas3, #fp-canvas4').removeClass('d-none');

            // Canvas A
            const canvasA = $('#fp-canvas3')[0];
            const csA = canvasState.mixto.A;
            if (canvasA) {
                csA.ctx = canvasA.getContext('2d');
                attachDrawingHandlers({
                    canvasEl: canvasA,
                    state: csA,
                    selector: '.fp-canvas3',
                    onComplete: () => {
                        if (!canvasState.mixto.B.isDrawing) showConfirmation();
                    }
                });
            }

            // Canvas B
            const canvasB = $('#fp-canvas4')[0];
            const csB = canvasState.mixto.B;
            if (canvasB) {
                csB.ctx = canvasB.getContext('2d');
                attachDrawingHandlers({
                    canvasEl: canvasB,
                    state: csB,
                    selector: '.fp-canvas4',
                    onComplete: () => {
                        if (!canvasState.mixto.A.isDrawing) showConfirmation();
                    }
                });
            }
        } else if (tp === "fotografia") {
            canvasState.B.isDrawingMode = true;
            const canvas = $('#fp-canvas2')[0];
            if (!canvas) return;
            const cs = canvasState.B;
            cs.ctx = canvas.getContext('2d');
            cs.position.x = canvas.getBoundingClientRect().x;
            cs.position.y = canvas.getBoundingClientRect().y;

            $('#fp-canvas, #fp-canvas3, #fp-canvas4').addClass('d-none');
            $('#fp-canvas2').removeClass('d-none');

            attachDrawingHandlers({
                canvasEl: canvas,
                state: cs,
                selector: '.fp-canvas2',
                onComplete: showConfirmation
            });
        }
    });

    $('#mapped-form').submit(function (e) {
        e.preventDefault();

        let coord_perc = "0, 0, 0, 0";
        let coord_perc2 = "0, 0, 0, 0";
        const tipo_plano = localStorage.getItem('tp_plano');

        if (tipo_plano === "diagrama") {
            coord_perc = `${canvasState.A.percent.x1}, ${canvasState.A.percent.y1}, ${canvasState.A.percent.x2}, ${canvasState.A.percent.y2}`;
        } else if (tipo_plano === "fotografia") {
            coord_perc2 = `${canvasState.B.percent.x1}, ${canvasState.B.percent.y1}, ${canvasState.B.percent.x2}, ${canvasState.B.percent.y2}`;
        } else if (tipo_plano === "mixto") {
            coord_perc = `${canvasState.mixto.A.percent.x1}, ${canvasState.mixto.A.percent.y1}, ${canvasState.mixto.A.percent.x2}, ${canvasState.mixto.A.percent.y2}`;
            coord_perc2 = `${canvasState.mixto.B.percent.x1}, ${canvasState.mixto.B.percent.y1}, ${canvasState.mixto.B.percent.x2}, ${canvasState.mixto.B.percent.y2}`;
        }

        let id = $(this).find('[name="id"]').val();
        const coolor_cor = $(this).find('[name="color"]').val();
        const cod_ubi = localStorage.getItem('code_ubicacion');
        const id_corp = localStorage.getItem('id_corp');
        const id_suc = localStorage.getItem('id_suc');

        if (!id) {
            id = AI_seq + 1;
            localStorage.setItem('seq', id);
        }

        const data_storage = {
            cod_ubi,
            coord_perc,
            coord_perc2,
            id,
            tipo_plano
        };
        d_storage = data_storage;

        data_plano = { id, cod_ubi, coord_perc, color: coolor_cor, id_corp, id_suc, tipo_plano };
        data_plano2 = { id, cod_ubi, coord_perc2, color: coolor_cor, id_corp, id_suc, tipo_plano };

        $4d.fn_planograma("save_coordendas", cod_ubi, id_suc, id_corp, id.toString(), coord_perc, coord_perc2, localStorage.getItem('select'), function (data_resps) {
            console.log(data_resps);

            // Cargar/validar array previo
            let data_mba3;
            try {
                const storedData = localStorage.getItem('data');
                data_mba3 = storedData ? JSON.parse(storedData) : [];
            } catch (e) {
                data_mba3 = [];
            }
            if (!Array.isArray(data_mba3)) data_mba3 = [];

            const planoExistente = data_mba3.find(item => item.tipo_plano === data_storage.tipo_plano);
            if (planoExistente) {
                if (!Array.isArray(planoExistente.Planograma)) {
                    planoExistente.Planograma = [];
                }
                planoExistente.Planograma.push(data_storage);
            } else {
                data_mba3.push({
                    tipo_plano: data_storage.tipo_plano,
                    Planograma: [data_storage]
                });
            }

            localStorage.setItem('data', JSON.stringify(data_mba3));

            Swal.fire({
                toast: true,
                icon: 'success',
                title: `Área mapeada "${data_storage.tipo_plano}" guardada con éxito`,
                position: 'top',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            }).then(() => {
                $('#mapped-form')[0].reset();

                // Reiniciar zoomes
                // Para diagrama
                zoomHandlers.diagrama = setupZoomAndDrag('#fp-wrapper', '#zoom-in', '#zoom-out', '#fp-img');

                // Para fotografía
                zoomHandlers.fotografia = setupZoomAndDrag('#fp-wrapper2', '#zoom-in2', '#zoom-out2', '#fp-img2');

                location.reload();
                saveSeccionesCord1();
                resetAllCanvasState();

            });
        });

        $('#fp-canvas, #fp-canvas2, #fp-canvas3, #fp-canvas4').addClass('d-none');
    });
});

function mapped_area(data) {
    const isValid = Array.isArray(data) && data.length > 0;
    drawAreas(data, '#fp-img', '#fp-map', 'coord_perc', isValid);
    drawAreas(data, '#fp-img3', '#fp-map3', 'coord_perc', isValid);
}

function mapped_area2(data) {
    const isValid = Array.isArray(data) && data.length > 0;
    drawAreas(data, '#fp-img2', '#fp-map2', 'coord_perc2', isValid);
    drawAreas(data, '#fp-img4', '#fp-map4', 'coord_perc2', isValid);
}

function drawAreas(dataArray, imgSelector, mapSelector, coordField, isValid) {
    $(mapSelector).empty();
    if (!isValid) return;

    dataArray.forEach(item => {
        const rawCoord = item[coordField];
        if (!rawCoord || rawCoord.replace(/\s/g, '') === "0,0,0,0") return;

        const perc = rawCoord.replace(/\s/g, '').split(",");
        if (perc.length < 4) return;

        const $img = $(imgSelector);
        const imgW = $img.width();
        const imgH = $img.height();

        let x = imgW * parseFloat(perc[0]);
        let y = imgH * parseFloat(perc[1]);
        const w = Math.abs((imgW * parseFloat(perc[2])) - x);
        const h = Math.abs((imgH * parseFloat(perc[3])) - y);

        if ((imgW * perc[2]) - x < 0) x -= w;
        if ((imgH * perc[3]) - y < 0) y -= h;

        const area = $("<area shape='rect' class='ubic'>")
            .attr('href', 'javascript:void(0)')
            .attr('coords', `${x},${y},${x + w},${y + h}`)
            .css({
                height: h + 'px',
                width: w + 'px',
                top: y + 'px',
                left: x + 'px',
                border: '2.5px solid #144474'
            });

        $(mapSelector).append(area);
    });
}

function dame_color_aleatorio() {
    const hexadecimal = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
    let color_aleatorio = "#";
    for (let i = 0; i < 6; i++) {
        const posarray = aleatorio(0, hexadecimal.length);
        color_aleatorio += hexadecimal[posarray];
    }
    return color_aleatorio;
}

function aleatorio(inferior, superior) {
    const numPosibilidades = superior - inferior;
    let aleat = Math.random() * numPosibilidades;
    aleat = Math.floor(aleat);
    return parseInt(inferior, 10) + aleat;
}

function getUbicaciones(config) {
    const stored = localStorage.getItem('mapped_ubic_press');
    let draw_data;

    try {
        draw_data = stored ? JSON.parse(stored) : { Planograma: [] };
    } catch (e) {
        draw_data = { Planograma: [] };
    }

    const data_ubic = Array.isArray(draw_data.Planograma) ? draw_data.Planograma : [];

    config.maps.forEach(selector => $(selector).empty());

    const tieneDatos = data_ubic.some(p =>
        p[config.coordKey] && p[config.coordKey].replace(/\s/g, '') !== "0,0,0,0"
    );

    if (!tieneDatos) {
        console.warn(`🚫 No hay coordenadas válidas en ${config.coordKey}. Solo se mostrará la imagen.`);
        return;
    }

    for (const element of data_ubic) {
        const rawPerc = element[config.coordKey];
        if (!rawPerc) continue;

        const perc = rawPerc.replace(/\s/g, '').split(",");

        const coordsA = calcularCoordenadas(config.imageSelectors[0], perc);
        crearArea(coordsA, element, config.maps[0]);

        const coordsB = calcularCoordenadas(config.imageSelectors[1], perc);
        crearArea(coordsB, element, config.maps[1]);
    }
}

function getUbic() {
    getUbicaciones({
        coordKey: 'coord_perc',
        imageSelectors: ['#fp-img', '#fp-img3'],
        maps: ['#fp-map', '#fp-map3']
    });
}

function getUbic2() {
    getUbicaciones({
        coordKey: 'coord_perc2',
        imageSelectors: ['#fp-img2', '#fp-img4'],
        maps: ['#fp-map2', '#fp-map4']
    });
}

function calcularCoordenadas(selector, perc) {
    const imgW = $(selector).width();
    const imgH = $(selector).height();

    let x = imgW * perc[0];
    let y = imgH * perc[1];
    let width = Math.abs((imgW * perc[2]) - x);
    let height = Math.abs((imgH * perc[3]) - y);

    if ((imgW * perc[2]) - x < 0) x = x - width;
    if ((imgH * perc[3]) - y < 0) y = y - height;

    return { x, y, width, height };
}

function crearArea(coords, element, mapSelector) {
    const area = $("<area shape='rect' class='ubic'>")
        .attr('href', "javascript:void(0)")
        .attr('coords', `${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}`);

    const color = dame_color_aleatorio();

    area.css({
        'height': coords.height + 'px',
        'width': coords.width + 'px',
        'top': coords.y + 'px',
        'left': coords.x + 'px',
        'border': '2px solid rgba(0,0,255,0.7)',
        'background-image': "url('https://flyclipart.com/thumb2/dot-dots-lines-icon-png-and-vector-for-free-download-832062.png')",
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'background-size': 'cover'
    });

    $(mapSelector).append(area);
}

function getPlanos(params) {
    const dataString = localStorage.getItem('data');
    if (!dataString) {
        console.warn('No hay datos en localStorage con la clave "data"');
        return;
    }

    let datos;
    try {
        datos = JSON.parse(dataString);
    } catch (e) {
        console.error('Error al parsear JSON de localStorage:', e);
        return;
    }

    if (!Array.isArray(datos)) {
        console.error('El valor de "data" en localStorage no es un array:', datos);
        return;
    }

    const data_cd_local = [];

    datos.forEach(element => {
        const tipoPlano = element.tipo_plano || element.name_plano || '';
        localStorage.setItem('select', tipoPlano);
        setImage('.fp-img', element.img1);
        setImage('#fp-img2', element.img2);

        const planograma = element.Planograma;
        if (!planograma || Object.keys(planograma).length === 0) {
            Swal.fire({
                icon: 'info',
                html: 'Planograma sin ubicaciones mapeadas.',
                showCloseButton: true,
                confirmButtonColor: '#6B949D'
            });
            return;
        }

        localStorage.setItem('seq', Object.keys(planograma).length);
        localStorage.setItem('mapped', JSON.stringify(planograma));

        Object.values(planograma).forEach(coord => data_cd_local.push(coord));
    });

    if (data_cd_local.length > 0) {
        mapped_area(data_cd_local);
        mapped_area2(data_cd_local);
    } else {
        console.warn('No se encontraron coordenadas para mapear.');
    }
}

function setImage(selector, base64Data) {
    if (base64Data) {
        const imgSrc = 'data:image/png;base64,' + base64Data;
        const imgEl = document.querySelector(selector);
        if (imgEl) imgEl.setAttribute('src', imgSrc);
    }
}

function saveSeccionesCord1() {
    $('#fp-canvas, #fp-canvas2, #fp-canvas3, #fp-canvas4').addClass('d-none');
    getPlanos();
}

function show_plane(tipo_plano) {
    if (tipo_plano === "diagrama") {
        $("#cancel").trigger("click");
        localStorage.setItem("tp_plano", tipo_plano);
        $('div#fp-canvas-container3 > img, div#fp-canvas-container4 > img').remove();
        $("#fp-canvas-container").show();
        $("#fp-canvas-container2").hide();
        $("#pl_mixto").hide();

        // Inicializar / ajustar zoom para diagrama
        if (!zoomHandlers.diagrama) {
            zoomHandlers.diagrama = setupZoomAndDrag('#fp-wrapper', '#zoom-in', '#zoom-out', '#fp-img');
        } else {
            // Asegurarse de que el contenedor esté visible antes de ajustar
            setTimeout(() => zoomHandlers.diagrama.fitToContainer(), 0);
        }

        getPlanos();
        getUbic();
    } else if (tipo_plano === "fotografia") {
        localStorage.setItem("tp_plano", tipo_plano);
        $('div#fp-canvas-container3 > img, div#fp-canvas-container4 > img').remove();
        $("#fp-canvas-container").hide();
        $("#pl_mixto").hide();
        $("#fp-canvas-container2").show();

        // Inicializar / ajustar zoom para fotografía
        if (!zoomHandlers.fotografia) {
            zoomHandlers.fotografia = setupZoomAndDrag('#fp-wrapper2', '#zoom-in2', '#zoom-out2', '#fp-img2');
        } else {
            setTimeout(() => zoomHandlers.fotografia.fitToContainer(), 0);
        }

        // Si el src de la imagen cambia dinámicamente, asegurar re-fit al cargar
        const img2 = document.getElementById('fp-img2');
        if (img2) {
            img2.onload = () => {
                if (zoomHandlers.fotografia) zoomHandlers.fotografia.fitToContainer();
            };
        }

        getPlanos();
        getUbic2();
    } else if (tipo_plano === "mixto") {
        $("#fp-canvas-container, #fp-canvas-container2").hide();
        localStorage.setItem("tp_plano", tipo_plano);

        const imgData = JSON.parse(localStorage.getItem('data') || '[]')[0] || {};
        const img1 = imgData.img1 || '';
        const img2 = imgData.img2 || '';

        // Limpiar y recrear imágenes mixtas
        $('div#fp-canvas-container3 > img, div#fp-canvas-container4 > img').remove();

        // Plano A
        const imgA = document.createElement("img");
        imgA.src = 'data:image/png;base64,' + img1;
        imgA.className = 'img-fluid fp-img3';
        imgA.alt = "Plano A";
        imgA.id = "fp-img3";
        imgA.useMap = "#fp-map3";
        document.getElementById('fp-canvas-container3').appendChild(imgA);

        // Plano B
        const imgB = document.createElement("img");
        imgB.src = 'data:image/png;base64,' + img2;
        imgB.className = 'img-fluid fp-img4';
        imgB.alt = "Plano B";
        imgB.id = "fp-img4";
        imgB.useMap = "#fp-map4";
        document.getElementById('fp-canvas-container4').appendChild(imgB);

        $("#pl_mixto").show();

        // Inicializar / ajustar ambos zooms (puedes tener handlers separados si los necesitas)
        if (!zoomHandlers.diagrama) {
            zoomHandlers.diagrama = setupZoomAndDrag('#fp-wrapper3', '#zoom-in3', '#zoom-out3', '#fp-img3');
        } else {
            setTimeout(() => zoomHandlers.diagrama.fitToContainer(), 0);
        }
        if (!zoomHandlers.fotografia) {
            zoomHandlers.fotografia = setupZoomAndDrag('#fp-wrapper4', '#zoom-in4', '#zoom-out4', '#fp-img4');
        } else {
            setTimeout(() => zoomHandlers.fotografia.fitToContainer(), 0);
        }

        getPlanos();
        getUbic();
        getUbic2();
    }

    return tipo_plano;
}


function send_ubic(ubic_bod, tipo_plano) {
    for (const dato of ubic_bod) {
        if (dato.status === true) {
            localStorage.setItem('code_ubicacion', dato.cod_bodega);
            localStorage.setItem('plano', dato.plano);
            localStorage.setItem('id_corp', dato.id_corp);
            localStorage.setItem('id_suc', dato.id_suc);
            $("#map_area").trigger("click");
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: dato.msg
            });
        }
    }
    return ubic_bod;
}

function showConfirmation(params) {
    Swal.fire({
        title: '¿Quieres guardar las coordenadas?',
        icon: 'question',
        iconColor: '#6B949D',
        color: '#333',
        background: '#fafafa',
        html: `
            <p style="margin: 0; font-size: 16px; color: #333;">
                Se guardarán los cambios realizados en las ubicaciones.
            </p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#6B949D',
        cancelButtonColor: '#B5BCC3',
        buttonsStyling: true
    }).then((result) => {
        if (result.isConfirmed) {
            $("#mapped-form").trigger("submit");
            Swal.fire({
                icon: 'success',
                iconColor: '#6B949D',
                color: '#6B949D',
                background: '#f8f9fa',
                html: '<p style="margin: 0; font-weight: bold;">Coordenadas guardadas</p><p style="margin: 0;">exitosamente</p>',
                showConfirmButton: true,
                confirmButtonColor: '#6B949D',
                timer: 2000,
                timerProgressBar: true
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            limpiarCanvasYEstado();
        }
    });
}

function limpiarCanvasYEstado() {
    $('#fp-canvas, #fp-canvas2, #fp-canvas3, #fp-canvas4').addClass('d-none');

    if (canvasState.A.ctx) canvasState.A.ctx.clearRect(0, 0, $('#fp-canvas')[0].width, $('#fp-canvas')[0].height);
    if (canvasState.B.ctx) canvasState.B.ctx.clearRect(0, 0, $('#fp-canvas2')[0].width, $('#fp-canvas2')[0].height);

    const c3 = $('#fp-canvas3')[0], c4 = $('#fp-canvas4')[0];
    if (c3 && c3.getContext) c3.getContext('2d').clearRect(0, 0, c3.width, c3.height);
    if (c4 && c4.getContext) c4.getContext('2d').clearRect(0, 0, c4.width, c4.height);

    const reset = (cs) => {
        cs.percent = { x1: 0, y1: 0, x2: 0, y2: 0 };
        cs.mouseStart = { x: 0, y: 0 };
        cs.mouseEnd = { x: 0, y: 0 };
        cs.isDrawing = false;
    };
    reset(canvasState.A);
    reset(canvasState.B);
    reset(canvasState.mixto.A);
    reset(canvasState.mixto.B);

    canvasState.A.isDrawingMode = false;
    canvasState.B.isDrawingMode = false;
    canvasState.mixto.A.isDrawingMode = false;
    canvasState.mixto.B.isDrawingMode = false;
}

function resetAllCanvasState() {
    limpiarCanvasYEstado();
}

/*metodo al precionar el grip desde mba3 nos devuelve los datos para graficar las coordenadas en los planos*/
function draw_coord(dataJson) {
    console.log(dataJson);

    localStorage.setItem('mapped_ubic_press', JSON.stringify(dataJson));

    const isInvalid =
        !dataJson ||
        typeof dataJson !== 'object' ||
        !Array.isArray(dataJson.Planograma) ||
        dataJson.Planograma.length === 0 ||
        !dataJson.Planograma[0];

    if (isInvalid) {
        //localStorage.setItem('data', '[]');
        getPlanos();
        getUbic();
        getUbic2();

        Swal.fire({
            toast: true,
            icon: 'warning',
            title: `Producto sin ubicación en el planograma`,
            position: 'top',
            showConfirmButton: false,
            confirmButtonColor: '#6B949D',
            timer: 1500,
            timerProgressBar: true
        });
        return;
    }

    const planoBase = dataJson.Planograma[0];
    const datos = [{
        cod_ubi: planoBase.cod_ubi,
        coord_perc: planoBase.coord_perc,
        coord_perc2: planoBase.coord_perc2,
        id: planoBase.id,
        color: planoBase.color,
        tipo_plano: planoBase.tipo_plano
    }];

    // Agrega ubicaciones adicionales del subplanograma
    const subPlanos = Array.isArray(planoBase.Planograma) ? planoBase.Planograma : [];
    subPlanos.forEach(p => {
        datos.push({
            cod_ubi: p.cod_ubi,
            coord_perc: p.coord_perc,
            coord_perc2: p.coord_perc2,
            id: p.id,
            color: p.color,
            tipo_plano: planoBase.tipo_plano
        });
    });

    const dataGrid = [{
        Planograma: datos,
        codigo: planoBase.id,
        img1: planoBase.imagen1,
        img2: planoBase.imagen2,
        name_plano: planoBase.tipo_plano
    }];

    localStorage.setItem('data', JSON.stringify(dataGrid));
    getPlanos();

    const storage_plano = localStorage.getItem('select');
    const data_plano = dataJson.Planograma;
    function isZeroCoord(coord) {
        return coord === "0,0,0,0";
    }

    function isZeroCoord(coord) {
        return coord === "0,0,0,0";
    }

    let coincidencia = null;
    let mensaje_coincidencia = "";

    const tipoSeleccionado = localStorage.getItem("tp_plano");

    for (const element of data_plano) {
        if (element.tipo_plano !== storage_plano) continue;

        const coord1 = cleanCoord(element.coord_perc);
        const coord2 = cleanCoord(element.coord_perc2);

        const coord1EsCero = isZeroCoord(coord1);
        const coord2EsCero = isZeroCoord(coord2);

        if (tipoSeleccionado === "diagrama") {
            if (!coord1EsCero && coord2EsCero) {
                coincidencia = true;
            } else if (coord1EsCero && !coord2EsCero) {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación pertenece a Fotografía";
            } else if (!coord1EsCero && !coord2EsCero) {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación pertenece a Mixto";
            } else {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación inválida para Diagrama";
            }

            if (!zoomHandlers.diagrama) {
                zoomHandlers.diagrama = setupZoomAndDrag('#fp-wrapper', '#zoom-in', '#zoom-out', '#fp-img');
            } else {
                // opcional: re-fit si la imagen cambió
                zoomHandlers.diagrama.fitToContainer();
            } show_plane("diagrama");
            getUbic2();

        } else if (tipoSeleccionado === "fotografia") {
            if (!coord2EsCero && coord1EsCero) {
                coincidencia = true;
            } else if (!coord1EsCero && coord2EsCero) {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación pertenece a Plano";
            } else if (!coord1EsCero && !coord2EsCero) {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación pertenece a Mixto";
            } else {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación inválida para Fotografía";
            }

            if (!zoomHandlers.fotografia) {
                zoomHandlers.fotografia = setupZoomAndDrag('#fp-wrapper2', '#zoom-in2', '#zoom-out2', '#fp-img2');
            } else {
                // opcional: re-fit si la imagen cambió
                zoomHandlers.fotografia.fitToContainer();
            } show_plane("fotografia");
            getUbic();

        } else if (tipoSeleccionado === "mixto") {
            if (!coord1EsCero && !coord2EsCero) {
                coincidencia = true;
                show_plane("mixto");
                getUbic();
                getUbic2();
            } else if (!coord1EsCero && coord2EsCero) {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación pertenece a Plano";
            } else if (coord1EsCero && !coord2EsCero) {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación pertenece a Fotografía";
            } else {
                coincidencia = false;
                mensaje_coincidencia = "Ubicación inválida para Mixto";
            }

        }

        // Si ya determinaste que es no válido, puedes salir del loop para no sobreescribir ni repetir lógicas.
        if (coincidencia === false) {
            break;
        }
    }

    console.log(coincidencia);

    // SweetAlert2 en vez de alert, solo una vez:
    if (coincidencia === false) {
        Swal.fire({
            title: 'Advertencia',
            iconColor: '#6B949D',
            text: mensaje_coincidencia,
            icon: 'warning',
            timer: 2500, // milisegundos: 2.5 segundos
            showConfirmButton: false,
            position: 'top',
            toast: true,
            timerProgressBar: true
        });
    }


}

function cleanCoord(coord) {
    return typeof coord === 'string' ? coord.replace(/\s/g, '') : '';
}

/*Funcion envia datos desde MBA3 A web plano por defuat*/
function config_all(dataJson) {
    console.log(dataJson);

    zoomHandlers.diagrama = setupZoomAndDrag('#fp-wrapper', '#zoom-in', '#zoom-out', '#fp-img');

    localStorage.setItem('press', false);
    for (let index = 0; index < dataJson.length; index++) {
        const datos_json = dataJson[index];
        if (datos_json.img1 === '') {
            Swal.fire({
                icon: 'info',
                html: 'No existen Planos configurados ',
                showCloseButton: true,
                showCancelButton: false,
                focusConfirm: false,
                cancelButtonColor: '#6B949D',
            })
        } else if (datos_json.img2 === '') {
            Swal.fire({
                icon: 'info',
                html: 'No existen Planos configurados ',
                showCloseButton: true,
                showCancelButton: false,
                focusConfirm: false,
                cancelButtonColor: '#6B949D',

            })


        } else {
            if (datos_json.Planograma === '') {
                dataJson[index].Planograma = [];
            }

            localStorage.setItem('data', JSON.stringify(dataJson));
            var tipo_plano = "diagrama";
            show_plane(tipo_plano);
            getPlanos()

        }

    }
}

function setupZoomAndDrag(wrapperSelector, zoomInSelector, zoomOutSelector, imgSelector) {
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    const $wrapper = $(wrapperSelector);
    const $img = $(imgSelector);

    // Usar un namespace único para esta instancia para evitar conflictos
    const instanceNamespace = `.${wrapperSelector.replace(/[#.\s]/g, '_')}_${Date.now()}`;

    function updateTransform() {
        $wrapper.css({
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: '0 0'
        });

        // Actualiza el indicador de zoom si existe
        const zoomPercentage = Math.round(scale * 100);
        // Determinar el ID del indicador basado en el selector del wrapper
        let indicatorId = 'zoom-indicator-diagrama';
        if (wrapperSelector.includes('wrapper2') || wrapperSelector.includes('wrapper4')) {
            indicatorId = 'zoom-indicator-fotografia';
        }
        const $indicator = $(`#${indicatorId}`);
        if ($indicator.length) {
            $indicator.text(`Zoom: ${zoomPercentage}%`);
        }

        $(window).trigger('zoom:updated');
    }

    function fitToContainer() {
        const img = $img[0];
        if (!img || !img.naturalWidth || !img.naturalHeight) {
            // console.warn("fitToContainer: Imagen no cargada o sin dimensiones naturales", img);
            return; // Salir si la imagen no está lista
        }

        const container = $wrapper.parent()[0]; // .fp-canvas-container
        if (!container) {
            console.warn("fitToContainer: Contenedor no encontrado para", wrapperSelector);
            return;
        }

        // === USAR getBoundingClientRect para dimensiones más precisas ===
        // Esto puede ayudar con problemas de zoom del navegador
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        // ================================================

        // Verificar si el contenedor tiene dimensiones válidas
        if (containerWidth <= 0 || containerHeight <= 0) {
            // console.warn("fitToContainer: Contenedor tiene dimensiones 0 o inválidas", container, containerWidth, containerHeight);
            // Podría intentar reintentar más tarde si es un problema persistente
            return;
        }

        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;
        const imgRatio = imgNaturalWidth / imgNaturalHeight;
        const containerRatio = containerWidth / containerHeight;

        // === LÓGICA 'CONTAIN': Ajustar completamente dentro del contenedor ===
        // Esta opción asegura que toda la imagen sea visible.
        if (imgRatio > containerRatio) {
            // La imagen es más ancha en proporción que el contenedor
            scale = containerWidth / imgNaturalWidth; // Escalar por la anchura
        } else {
            // La imagen es más alta en proporción que el contenedor o tiene la misma proporción
            scale = containerHeight / imgNaturalHeight; // Escalar por la altura
        }

        // Centrar la imagen después del escalado 'contain'
        const scaledImgWidth = imgNaturalWidth * scale;
        const scaledImgHeight = imgNaturalHeight * scale;
        translateX = (containerWidth - scaledImgWidth) / 2;
        translateY = (containerHeight - scaledImgHeight) / 2;

        updateTransform();
        // console.log(`fitToContainer (${wrapperSelector}): Scale=${scale}, Translate=(${translateX}, ${translateY})`);
    }

    // --- Manejo de la carga de la imagen y ajuste inicial ---
    const imgElement = $img[0];

    // Función auxiliar para intentar ajustar con reintentos si el contenedor aún no tiene tamaño
    function attemptFit(maxAttempts = 5, attempt = 1) {
        fitToContainer();
        // Si el contenedor aún no tiene tamaño y no hemos agotado los intentos, reintentar
        const container = $wrapper.parent()[0];
        if (container) {
            const containerRect = container.getBoundingClientRect();
            if ((containerRect.width <= 0 || containerRect.height <= 0) && attempt < maxAttempts) {
                // console.log(`Reintentando fitToContainer (${attempt + 1}) para ${wrapperSelector}`);
                setTimeout(() => attemptFit(maxAttempts, attempt + 1), 50); // Esperar 50ms antes de reintentar
            }
        }
    }

    if (imgElement.complete && imgElement.naturalWidth) {
        setTimeout(attemptFit, 0); // Ejecutar en el siguiente ciclo para asegurar renderizado
    } else {
        // Esperar a que la imagen se cargue
        $img.off(`load${instanceNamespace}`).one(`load${instanceNamespace}`, function () {
            setTimeout(attemptFit, 0); // Pequeño retraso para asegurar dimensiones del contenedor
        });
    }

    // Botones de zoom
    if (zoomInSelector) {
        $(zoomInSelector).off(`click${instanceNamespace}`).on(`click${instanceNamespace}`, zoomIn);
    }
    if (zoomOutSelector) {
        $(zoomOutSelector).off(`click${instanceNamespace}`).on(`click${instanceNamespace}`, zoomOut);
    }

    // --- Manejo del Arrastre (Drag) ---
    let isDragging = false;
    let lastX, lastY;

    // Funciones para manejar el arrastre
    function handleMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        translateX += dx;
        translateY += dy;
        lastX = e.clientX;
        lastY = e.clientY;
        updateTransform();
    }

    function handleMouseUp() {
        isDragging = false;
        $wrapper.css('cursor', 'grab');
        // Desasociar los eventos globales al soltar
        $(document).off(`mousemove${instanceNamespace} mouseup${instanceNamespace}`);
    }

    // Asociar evento mousedown al wrapper
    $wrapper.off(`mousedown${instanceNamespace}`).on(`mousedown${instanceNamespace}`, function (e) {
        if (isAnyCanvasInDrawingMode()) return;
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        $wrapper.css('cursor', 'grabbing');
        e.preventDefault();

        // Asociar eventos globales solo cuando se inicia el arrastre
        $(document).off(`mousemove${instanceNamespace} mouseup${instanceNamespace}`)
            .on(`mousemove${instanceNamespace}`, handleMouseMove)
            .on(`mouseup${instanceNamespace}`, handleMouseUp);
    });

    // Manejo del cursor al entrar/salir del área
    $wrapper.off(`mouseenter${instanceNamespace} mouseleave${instanceNamespace}`)
        .on(`mouseenter${instanceNamespace}`, function () {
            if (!isAnyCanvasInDrawingMode()) {
                $wrapper.css('cursor', isDragging ? 'grabbing' : 'grab');
            }
        })
        .on(`mouseleave${instanceNamespace}`, function () {
            if (!isDragging && !isAnyCanvasInDrawingMode()) {
                $wrapper.css('cursor', 'default');
            }
        });

    // Zoom: mantiene el centro del contenedor fijo
    function zoomIn() {
        const container = $wrapper.parent()[0];
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        const newScale = Math.min(3, scale + 0.1);
        const deltaScale = newScale - scale;

        // Ajustar la traslación para mantener el punto central del contenedor fijo
        translateX -= (deltaScale * centerX);
        translateY -= (deltaScale * centerY);

        scale = newScale;
        updateTransform();
    }

    function zoomOut() {
        const container = $wrapper.parent()[0];
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        const newScale = Math.max(0.1, scale - 0.1);
        const deltaScale = newScale - scale;

        // Ajustar la traslación para mantener el punto central del contenedor fijo
        translateX -= (deltaScale * centerX);
        translateY -= (deltaScale * centerY);

        scale = newScale;
        updateTransform();
    }

    // Ajustar al redimensionar la ventana
    $(window).off(`resize${instanceNamespace}`).on(`resize${instanceNamespace}`, function () {
        // console.log("Ventana redimensionada, ajustando a contenedor:", imgSelector);
        // Usar setTimeout para asegurar que el layout se ha recalculado
        setTimeout(fitToContainer, 100);
    });

    // Devolver el objeto con métodos públicos
    return {
        zoomIn,
        zoomOut,
        fitToContainer
    };
}
function isAnyCanvasInDrawingMode() {
    return (
        canvasState.A.isDrawingMode ||
        canvasState.B.isDrawingMode ||
        canvasState.mixto.A.isDrawingMode ||
        canvasState.mixto.B.isDrawingMode
    );
}

function getActivePlano() {
    return localStorage.getItem('tp_plano'); // "diagrama" | "fotografia" | "mixto"
}

function zoom_mas() {
    const plano = getActivePlano();
    if (plano === 'diagrama' && zoomHandlers.diagrama) {
        zoomHandlers.diagrama.zoomIn();
    } else if (plano === 'fotografia' && zoomHandlers.fotografia) {
        zoomHandlers.fotografia.zoomIn();
    } else {
        console.warn("No hay handler de zoom activo para", plano);
    }
}

function zoom_menos() {
    const plano = getActivePlano();
    if (plano === 'diagrama' && zoomHandlers.diagrama) {
        zoomHandlers.diagrama.zoomOut();
    } else if (plano === 'fotografia' && zoomHandlers.fotografia) {
        zoomHandlers.fotografia.zoomOut();
    } else {
        console.warn("No hay handler de zoom activo para", plano);
    }
}
