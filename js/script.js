// === Coordenadas y estado del lienzo A y B ===
const canvasState = {
    A: {
        ctx: null,
        position: { x: 0, y: 0 },
        mouseStart: { x: 0, y: 0 },
        mouseEnd: { x: 0, y: 0 },
        percent: { x1: 0, y1: 0, x2: 0, y2: 0 },
        isDrawing: false,
        isDrawingMode: false // ← NUEVO: indica si estamos en modo dibujo

    },
    B: {
        ctx: null,
        position: { x: 0, y: 0 },
        mouseStart: { x: 0, y: 0 },
        mouseEnd: { x: 0, y: 0 },
        percent: { x1: 0, y1: 0, x2: 0, y2: 0 },
        isDrawing: false,
        isDrawingMode: false
    },
    mixto: {
        A: {
            ctx: null,
            position: { x: 0, y: 0 },
            mouseStart: { x: 0, y: 0 },
            mouseEnd: { x: 0, y: 0 },
            percent: { x1: 0, y1: 0, x2: 0, y2: 0 },
            isDrawing: false,
            isDrawingMode: false
        },
        B: {
            ctx: null,
            position: { x: 0, y: 0 },
            mouseStart: { x: 0, y: 0 },
            mouseEnd: { x: 0, y: 0 },
            percent: { x1: 0, y1: 0, x2: 0, y2: 0 },
            isDrawing: false,
            isDrawingMode: false
        }
    }
};

// === Secuencias de ID para áreas mapeadas ===
let AI_seq = parseInt(localStorage.getItem('seq') || "0", 10);
let AI_seq2 = parseInt(localStorage.getItem('seq2') || "0", 10);

// === Datos persistidos ===
let data_plano = JSON.parse(localStorage.getItem('mapped') || "[]");
let data_plano2 = JSON.parse(localStorage.getItem('mapped2') || "[]");

let d_storage = {};
let color = '';
let data_cd = [];

let activeZoomHandler = null;

function screenToCanvasCoords(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
}
/*iNICIO de la aplicación*/
$(function () {
    var tipo_plano = localStorage.getItem('tp_plano')

    show_plane(tipo_plano)
    /*Funcion para graficar cooordenadas  de acorde a los planos*/
    getPlanos();

    $("#fp-canvas-container").show();
    $("#fp-canvas-container2").hide();
    $("#pl_mixto").hide();
    // Acción cuando se hace clic en el botón Map Area tanto para plano A y B
    $('#map_area').click(function () {
        console.log(localStorage.getItem("tp_plano"));
        $(this).hide('slow')
        document.getElementById('secciones').style.visibility = "hidden";
        document.getElementById('secciones').style.position = "absolute";

        // $('#save,#cancel').show('slow')
        $('#cancel').show('slow')
        /*Validación para cuandop se cambia de opciones Diagrama - fotografia  y mixto*/
        if (localStorage.getItem('tp_plano') === "diagrama") {
            canvasState.A.isDrawingMode = true;// Activar modo dibujo
            /*Liena Obtiene las coordenadas de los planos A Y B*/
            const canvas = $('#fp-canvas')[0];
            canvasState.A.ctx = canvas.getContext('2d');
            canvasState.A.position.x = canvas.getBoundingClientRect().x;
            canvasState.A.position.y = canvas.getBoundingClientRect().y;



            $('#fp-canvas3').addClass('d-none')
            $('#fp-canvas4').addClass('d-none')
            $('#fp-canvas').removeClass('d-none')
            // $('#fp-canvas2').removeClass('d-none')

            canvasState.A.position.x = $('#fp-canvas')[0].getBoundingClientRect().x;
            canvasState.A.position.y = $('#fp-canvas')[0].getBoundingClientRect().y;

            // Event que recibe las coordenadas al momento de mover el mouse por encima sea  plano A o plano B
            $('.fp-canvas').on('mousedown', function (e) {
                const cs = canvasState.A;
                const canvas = $('#fp-canvas')[0];
                const coords = screenToCanvasCoords(canvas, e.clientX, e.clientY);
                cs.mouseStart.x = coords.x;
                cs.mouseStart.y = coords.y;
                cs.isDrawing = true;

                // Opcional: guardar también en porcentaje si lo necesitas
                cs.percent.x1 = coords.x / canvas.width;
                cs.percent.y1 = coords.y / canvas.height;
            });
            // Event Listener cuando el mouse se mueve en el área del lienzo. Para dibujar el área rectangular en plano A y B
            $('.fp-canvas').on('mousemove', function (e) {
                const cs = canvasState.A;
                if (!cs.isDrawing) return;
                const canvas = $('#fp-canvas')[0];
                const coords = screenToCanvasCoords(canvas, e.clientX, e.clientY);
                cs.mouseEnd.x = coords.x;
                cs.mouseEnd.y = coords.y;

                const width = cs.mouseEnd.x - cs.mouseStart.x;
                const height = cs.mouseEnd.y - cs.mouseStart.y;
                cs.ctx.clearRect(0, 0, canvas.width, canvas.height);
                cs.ctx.beginPath();
                cs.ctx.lineWidth = "1";
                cs.ctx.strokeStyle = "#FF0000";
                cs.ctx.rect(cs.mouseStart.x, cs.mouseStart.y, width, height);
                cs.ctx.stroke();
            });


            // Event Listener cuando el mouse está arriba en el área del lienzo. Fin del dibujo Plano A y B
            $('.fp-canvas').on('mouseup', function (e) {
                const cs = canvasState.A;
                const canvas = $('#fp-canvas')[0];
                const coords = screenToCanvasCoords(canvas, e.clientX, e.clientY);
                cs.mouseEnd.x = coords.x;
                cs.mouseEnd.y = coords.y;

                // Guardar porcentajes si los necesitas
                cs.percent.x2 = cs.mouseEnd.x / canvas.width;
                cs.percent.y2 = cs.mouseEnd.y / canvas.height;

                const width = cs.mouseEnd.x - cs.mouseStart.x;
                const height = cs.mouseEnd.y - cs.mouseStart.y;
                cs.ctx.clearRect(0, 0, canvas.width, canvas.height);
                cs.ctx.beginPath();
                cs.ctx.lineWidth = "1";
                cs.ctx.strokeStyle = "#FF0000";
                cs.ctx.rect(cs.mouseStart.x, cs.mouseStart.y, width, height);
                cs.ctx.stroke();
                cs.isDrawing = false;
                showConfirmation();
            });


        } else if (localStorage.getItem('tp_plano') === "mixto") {
            // Activar modo dibujo
            canvasState.A.isDrawingMode = true;
            canvasState.B.isDrawingMode = true;

            $('#fp-canvas').addClass('d-none');
            $('#fp-canvas3').removeClass('d-none');
            $('#fp-canvas4').removeClass('d-none');

            // === Canvas A (fp-canvas3) ===
            const canvasA = $('#fp-canvas3')[0];
            const csA = canvasState.A;
            csA.ctx = canvasA.getContext('2d');

            $('.fp-canvas3').off('mousedown mousemove mouseup').on('mousedown', function (e) {
                e.stopPropagation(); // Evita que el drag del wrapper lo intercepte

                const coords = screenToCanvasCoords(canvasA, e.clientX, e.clientY);
                csA.mouseStart.x = coords.x;
                csA.mouseStart.y = coords.y;
                csA.isDrawing = true;

                // Guardar porcentajes
                csA.percent.x1 = coords.x / canvasA.width;
                csA.percent.y1 = coords.y / canvasA.height;
            }).on('mousemove', function (e) {
                if (!csA.isDrawing) return;
                const coords = screenToCanvasCoords(canvasA, e.clientX, e.clientY);
                csA.mouseEnd.x = coords.x;
                csA.mouseEnd.y = coords.y;

                const width = csA.mouseEnd.x - csA.mouseStart.x;
                const height = csA.mouseEnd.y - csA.mouseStart.y;

                csA.ctx.clearRect(0, 0, canvasA.width, canvasA.height);
                csA.ctx.beginPath();
                csA.ctx.lineWidth = "1";
                csA.ctx.strokeStyle = "#FF0000";
                csA.ctx.rect(csA.mouseStart.x, csA.mouseStart.y, width, height);
                csA.ctx.stroke();
            }).on('mouseup', function (e) {
                if (!csA.isDrawing) return;
                const coords = screenToCanvasCoords(canvasA, e.clientX, e.clientY);
                csA.mouseEnd.x = coords.x;
                csA.mouseEnd.y = coords.y;

                csA.percent.x2 = csA.mouseEnd.x / canvasA.width;
                csA.percent.y2 = csA.mouseEnd.y / canvasA.height;

                const width = csA.mouseEnd.x - csA.mouseStart.x;
                const height = csA.mouseEnd.y - csA.mouseStart.y;

                csA.ctx.clearRect(0, 0, canvasA.width, canvasA.height);
                csA.ctx.beginPath();
                csA.ctx.lineWidth = "1";
                csA.ctx.strokeStyle = "#FF0000";
                csA.ctx.rect(csA.mouseStart.x, csA.mouseStart.y, width, height);
                csA.ctx.stroke();
                csA.isDrawing = false;

                // Si ambos canvas terminaron, muestra confirmación
                if (!canvasState.mixto.B.isDrawing) {
                    showConfirmation();
                }
            });

            // === Canvas B (fp-canvas4) ===
            const canvasB = $('#fp-canvas4')[0];
            const csB = canvasState.B;
            csB.ctx = canvasB.getContext('2d');

            $('.fp-canvas4').off('mousedown mousemove mouseup').on('mousedown', function (e) {
                e.stopPropagation(); // Evita que el drag del wrapper lo intercepte

                const coords = screenToCanvasCoords(canvasB, e.clientX, e.clientY);
                csB.mouseStart.x = coords.x;
                csB.mouseStart.y = coords.y;
                csB.isDrawing = true;

                // Guardar porcentajes
                csB.percent.x1 = coords.x / canvasB.width;
                csB.percent.y1 = coords.y / canvasB.height;
            }).on('mousemove', function (e) {
                if (!csB.isDrawing) return;
                const coords = screenToCanvasCoords(canvasB, e.clientX, e.clientY);
                csB.mouseEnd.x = coords.x;
                csB.mouseEnd.y = coords.y;

                const width = csB.mouseEnd.x - csB.mouseStart.x;
                const height = csB.mouseEnd.y - csB.mouseStart.y;

                csB.ctx.clearRect(0, 0, canvasB.width, canvasB.height);
                csB.ctx.beginPath();
                csB.ctx.lineWidth = "1";
                csB.ctx.strokeStyle = "#FF0000";
                csB.ctx.rect(csB.mouseStart.x, csB.mouseStart.y, width, height);
                csB.ctx.stroke();
            }).on('mouseup', function (e) {
                if (!csB.isDrawing) return;
                const coords = screenToCanvasCoords(canvasB, e.clientX, e.clientY);
                csB.mouseEnd.x = coords.x;
                csB.mouseEnd.y = coords.y;

                csB.percent.x2 = csB.mouseEnd.x / canvasB.width;
                csB.percent.y2 = csB.mouseEnd.y / canvasB.height;

                const width = csB.mouseEnd.x - csB.mouseStart.x;
                const height = csB.mouseEnd.y - csB.mouseStart.y;

                csB.ctx.clearRect(0, 0, canvasB.width, canvasB.height);
                csB.ctx.beginPath();
                csB.ctx.lineWidth = "1";
                csB.ctx.strokeStyle = "#FF0000";
                csB.ctx.rect(csB.mouseStart.x, csB.mouseStart.y, width, height);
                csB.ctx.stroke();
                csB.isDrawing = false;

                // Si ambos canvas terminaron, muestra confirmación
                if (!canvasState.mixto.A.isDrawing) {
                    showConfirmation();
                }
            });
        } else if (localStorage.getItem('tp_plano') === "fotografia") {
            canvasState.B.isDrawingMode = true;// Activar modo dibujo
            const canvas = $('#fp-canvas2')[0];
            canvasState.B.ctx = canvas.getContext('2d');
            canvasState.B.position.x = canvas.getBoundingClientRect().x;
            canvasState.B.position.y = canvas.getBoundingClientRect().y;

            $('#fp-canvas').addClass('d-none')
            $('#fp-canvas3').addClass('d-none')
            $('#fp-canvas4').addClass('d-none')
            $('#fp-canvas2').removeClass('d-none')

            canvasState.B.position.x = $('#fp-canvas2')[0].getBoundingClientRect().x
            canvasState.B.position.y = $('#fp-canvas2')[0].getBoundingClientRect().y



            $('.fp-canvas2').on('mousedown', function (e) {
                const cs = canvasState.B;
                const canvas = $('#fp-canvas2')[0];
                const coords = screenToCanvasCoords(canvas, e.clientX, e.clientY);
                cs.mouseStart.x = coords.x;
                cs.mouseStart.y = coords.y;
                cs.isDrawing = true;

                // Opcional: guardar también en porcentaje si lo necesitas
                cs.percent.x1 = coords.x / canvas.width;
                cs.percent.y1 = coords.y / canvas.height;
            });


            $('.fp-canvas2').on('mousemove', function (e) {
                const cs = canvasState.B;
                if (!cs.isDrawing) return;
                const canvas = $('#fp-canvas2')[0];
                const coords = screenToCanvasCoords(canvas, e.clientX, e.clientY);
                cs.mouseEnd.x = coords.x;
                cs.mouseEnd.y = coords.y;

                const width = cs.mouseEnd.x - cs.mouseStart.x;
                const height = cs.mouseEnd.y - cs.mouseStart.y;
                cs.ctx.clearRect(0, 0, canvas.width, canvas.height);
                cs.ctx.beginPath();
                cs.ctx.lineWidth = "1";
                cs.ctx.strokeStyle = "#FF0000";
                cs.ctx.rect(cs.mouseStart.x, cs.mouseStart.y, width, height);
                cs.ctx.stroke();
            });

            $('.fp-canvas2').on('mouseup', function (e) {
                const cs = canvasState.B;
                const canvas = $('#fp-canvas2')[0];
                const coords = screenToCanvasCoords(canvas, e.clientX, e.clientY);
                cs.mouseEnd.x = coords.x;
                cs.mouseEnd.y = coords.y;

                // Guardar porcentajes si los necesitas
                cs.percent.x2 = cs.mouseEnd.x / canvas.width;
                cs.percent.y2 = cs.mouseEnd.y / canvas.height;

                const width = cs.mouseEnd.x - cs.mouseStart.x;
                const height = cs.mouseEnd.y - cs.mouseStart.y;
                cs.ctx.clearRect(0, 0, canvas.width, canvas.height);
                cs.ctx.beginPath();
                cs.ctx.lineWidth = "1";
                cs.ctx.strokeStyle = "#FF0000";
                cs.ctx.rect(cs.mouseStart.x, cs.mouseStart.y, width, height);
                cs.ctx.stroke();
                cs.isDrawing = false;
                showConfirmation();
            });

        }

    })

    // Guardar los detalles del área mapeada en el almacenamiento local(lOCAL Storage-Compatibilidad en chrome) plano A y B
    $('#mapped-form').submit(function (e) {
        e.preventDefault();
        var data_p;
        var data_p2;
        var data_storage;

        var cP = canvasState.A.percent.x1 + ", " + canvasState.A.percent.y1 + ", " + canvasState.A.percent.x2 + ", " + canvasState.A.percent.y2
        var cP2 = canvasState.B.percent.x1 + ", " + canvasState.B.percent.y1 + ", " + canvasState.B.percent.x2 + ", " + canvasState.B.percent.y2
        var id = $(this).find('[name="id"]').val()
        var coolor_cor = $(this).find('[name="color"]').val()
        var coord_perc = cP
        var coord_perc2 = cP2
        var cod_ubi = localStorage.getItem('code_ubicacion')
        var id_corp = localStorage.getItem('id_corp');
        var id_suc = localStorage.getItem('id_suc');
        var tipo_plano = localStorage.getItem('plano');
        console.log("guardar en plano : " + tipo_plano);


        /*--------------------------------*/

        if (id == '') {
            id = AI_seq + 1;
            localStorage.setItem('seq', id)
        }
        /*--------------------------------*/

        /************* datos grafico 1  + coordenadasd ************************** */
        data_p = { id: id, cod_ubi: cod_ubi, coord_perc: coord_perc, color: coolor_cor, id_corp: id_corp, id_suc: id_suc, tipo_plano: tipo_plano }
        data_plano = data_p;

        data_storage = { cod_ubi: cod_ubi, coord_perc: coord_perc, coord_perc2: coord_perc2, id: id, tipo_plano: tipo_plano }
        d_storage = data_storage;


        /**************datos grafico 2 + coordenadas ***************************/
        data_p2 = { id: id, cod_ubi: cod_ubi, coord_perc2: coord_perc2, color: coolor_cor, id_corp: id_corp, id_suc: id_suc, tipo_plano: tipo_plano }
        data_plano2 = data_p2;
        console.log(tipo_plano);
        console.log(coord_perc);
        console.log(coord_perc2);



        $4d.fn_planograma("save_coordendas", cod_ubi, id_suc, id_corp, id.toString(), coord_perc, coord_perc2, localStorage.getItem('select'), function (data_resps) {
            // 1. Obtener y validar datos de localStorage  
            console.log(data_resps);

            const storedData = localStorage.getItem('data');
            let data_mba3;

            if (storedData) {
                try {
                    data_mba3 = JSON.parse(storedData);
                } catch (e) {
                    data_mba3 = [];
                }
            } else {
                data_mba3 = [];
            }

            // 2. Validar que data_mba3 sea un array
            if (!Array.isArray(data_mba3)) {
                data_mba3 = [];
            }

            // 3. Buscar si ya existe un elemento con el mismo tipo_plano (u otro criterio)
            const plano = data_mba3.find(item => item.tipo_plano === data_storage.tipo_plano);

            if (plano) {
                // Si existe Planograma, aseguramos que sea array y agregamos
                if (!Array.isArray(plano.Planograma)) {
                    plano.Planograma = [];
                }
                plano.Planograma.push(data_storage);
            } else {
                // Si no existe, creamos uno nuevo
                data_mba3.push({
                    tipo_plano: data_storage.tipo_plano,
                    Planograma: [data_storage]
                });
            }

            // 4. Guardar de vuelta en localStorage
            localStorage.setItem('data', JSON.stringify(data_mba3));
            // 5. Mostrar toast de éxito sin mixin
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
                // ✅ Reiniciar coordenadas de canvasState
                canvasState.A.percent = { x1: 0, y1: 0, x2: 0, y2: 0 };
                canvasState.B.percent = { x1: 0, y1: 0, x2: 0, y2: 0 };

                // ✅ Si usas AI_seq localmente, reinicialo si es necesario
                // AI_seq = 0; // si lo necesitas reiniciar (opcional)

                // ✅ Limpiar inputs del formulario si deseas
                $('#mapped-form')[0].reset();

                // ✅ Llamar tu función para redibujar o limpiar interfaz
                saveSeccionesCord1();

                // ✅ Ocultar canvas al final
                $('#fp-canvas, #fp-canvas2, #fp-canvas3, #fp-canvas4').addClass('d-none');
            });
        });


        $('#fp-canvas').addClass('d-none')
        $('#fp-canvas2').addClass('d-none')
        $('#fp-canvas3').addClass('d-none')
        $('#fp-canvas4').addClass('d-none')

    })

    // Edit Mapped Area Details
    $('#edit-area').click(function () {
        $('.modal').modal('hide')
        id = $(this).attr('data-id')
        data = stored[id] || {}
        $('#mapped-form').find('[name="id"]').val(data.id)
        $('#mapped-form').find('[name="coord_perc"]').val(data.coord_perc)
        $('#mapped-form').find('[name="description"]').val(data.description)
        $('#form_modal').modal('show')
    })
    // Delete Mapped Area
    $('#delete-area').click(function () {
        $('.modal').modal('hide')

        id = $(this).attr('data-id')
        data = []
        data2 = []

        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger'
            },
            buttonsStyling: true
        })

        swalWithBootstrapButtons.fire({
            text: "¿Estás seguro de eliminar el área asignada seleccionada?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',

            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed == true) {
                for (let i = 0; i < data_plano.length; i++) {
                    const plano_id = data_plano[i];
                    if (plano_id.id == id) {
                        delete data_plano[i];
                    } else {
                        data.push(data_plano[i])
                    }

                }


                for (let i = 0; i < data_plano2.length; i++) {
                    const plano_id2 = data_plano2[i];
                    if (plano_id2.id == id) {
                        delete data_plano2[i];

                    } else {
                        data2.push(data_plano2[i])
                    }

                }
                localStorage.setItem('mapped', JSON.stringify(data))
                localStorage.setItem('mapped2', JSON.stringify(data2))

                const id_SELECT = localStorage.getItem('select_id');
                var dato = JSON.parse(localStorage.getItem('data'))
                for (let index = 0; index < dato.length; index++) {
                    const element = dato[index];
                    if (id_SELECT == element.id) {
                        element.position.length + 1;
                        element.position = data


                        // saveSeccionesCord2();
                    }

                }
                for (let index = 0; index < dato.length; index++) {
                    const element = dato[index];
                    if (id_SELECT == element.id) {
                        element.position2.length + 1;
                        element.position2 = data2


                        // saveSeccionesCord2();
                    }

                }
                localStorage.setItem('data', JSON.stringify(dato))
                swalWithBootstrapButtons.fire({

                    title: 'Eliminado!',
                    text: 'El área fue eliminado exitosamente!',
                    icon: 'success',
                    timer: 1200,
                    confirmButtonColor: '#28a745',
                }).then((result) => {
                    location.reload();
                })
            } else if (
                /* Read more about handling dismissals below */
                result.dismiss === Swal.DismissReason.cancel
            ) {
                swalWithBootstrapButtons.fire(
                    'Cancelado',
                    'Tu área esta guardada!',
                    'error'
                )
            }
        })

    })
})

// Función que crea la etiqueta de área y la agrega a la etiqueta de mapa
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

        // Activar modal si se desea
        /*
        area.click(() => {
            $('#view_modal').find('#edit-area,#delete-area').attr('data-id', item.id);
            const cod_ubi = item.cod_ubi?.replace(/\n/gi, "<br>");
            $('#view_modal .modal-body').html(`Sección: ${cod_ubi} <br> Plano: ${item.tipo_plano}`);
            $('#view_modal').modal('show');
        });
        */
    });
}

/*Función para obtener colores aleatorios*/
function dame_color_aleatorio() {
    hexadecimal = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F")
    color_aleatorio = "#";
    for (i = 0; i < 6; i++) {
        posarray = aleatorio(0, hexadecimal.length)
        color_aleatorio += hexadecimal[posarray]
    }
    return color_aleatorio
}

function aleatorio(inferior, superior) {
    numPosibilidades = superior - inferior
    aleat = Math.random() * numPosibilidades
    aleat = Math.floor(aleat)
    return parseInt(inferior) + aleat
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

    // Limpiar mapas anteriores
    config.maps.forEach(selector => $(selector).empty());

    // Verificar si hay coordenadas válidas
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
    const area = $("<area shape='rect' class='ubic'>");
    area.attr('href', "javascript:void(0)");
    area.attr('coords', `${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}`);

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

    const ubic = `<a class="like" href="javascript:void(0)" title="Like"> <i class="fa fa-circle" style="color:${element.color}"></i> </a>`;

    area.click(function () {
        $('#view_modal').find('#edit-area,#delete-area').attr('data-id', element.id);
        const cod_ubi = element.cod_ubi.replace(/\n/gi, "<br>");
        $('#view_modal').find('.modal-body').html(`${cod_ubi} color: ${ubic}`);
        $('#view_modal').modal('show');
    });
}
/*Metodo para ubicar el punto en grafico segun las coordenadas*/
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

    const data_cd = [];

    datos.forEach(element => {
        // Guardar el tipo de plano seleccionado
        const tipoPlano = element.tipo_plano || element.name_plano || '';
        localStorage.setItem('select', tipoPlano);

        // Cargar imágenes base64 si existen
        setImage('.fp-img', element.img1);
        setImage('#fp-img2', element.img2);

        const planograma = element.Planograma;

        if (!planograma || Object.keys(planograma).length === 0) {
            Swal.fire({
                icon: 'info',
                html: 'Planograma sin ubicaciones mapeadas.',
                showCloseButton: true,
                confirmButtonColor: '#6B949D',
            });
            return;
        }

        // Guardar información en localStorage
        localStorage.setItem('seq', Object.keys(planograma).length);
        localStorage.setItem('mapped', JSON.stringify(planograma));

        // Extraer coordenadas
        Object.values(planograma).forEach(coord => data_cd.push(coord));
    });

    if (data_cd.length > 0) {
        mapped_area(data_cd);
        mapped_area2(data_cd);
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
    /*----------------GRabar en memoria------------------------*/
    $('#fp-canvas').addClass('d-none')
    $('#fp-canvas2').addClass('d-none')
    $('#fp-canvas3').addClass('d-none')
    $('#fp-canvas4').addClass('d-none')
    getPlanos()
}

function show_plane(tipo_plano) {

    if (tipo_plano === "diagrama") {
        $("#cancel").trigger("click");

        localStorage.setItem("tp_plano", tipo_plano)
        $('div#fp-canvas-container3 > img').remove();

        $('div#fp-canvas-container4 > img').remove();

        $("#fp-canvas-container").show();
        $("#fp-canvas-container2").hide();
        $("#pl_mixto").hide();
        getPlanos()
        getUbic();



    } else if (tipo_plano === "fotografia") {
        localStorage.setItem("tp_plano", tipo_plano)

        $('div#fp-canvas-container3 > img').remove();

        $('div#fp-canvas-container4 > img').remove();
        $("#fp-canvas-container").hide();
        $("#pl_mixto").hide();

        $("#fp-canvas-container2").show();
        getPlanos()
        getUbic2();

    } else if (tipo_plano === "mixto") {
        $("#fp-canvas-container").hide();
        $("#fp-canvas-container2").hide();
        localStorage.setItem("tp_plano", tipo_plano)

        const img = document.createElement("img");
        var imagen1 = JSON.parse(localStorage.getItem('data'))
        img.src = 'data:image/png;base64,' + imagen1[0].img1
        img.className = 'img-fluid fp-img3'
        img.alt = "Logo Javascript";
        img.id = "fp-img3"
        img.useMap = "#fp-map3"
        document.getElementById('fp-canvas-container3').appendChild(img);
        // $('div#fp-canvas-container3').append(' <canvas class="fp-canvas3 d-none" id="fp-canvas3"></canvas> ');

        const img2 = document.createElement("img");
        img2.src = 'data:image/png;base64,' + imagen1[0].img2
        img2.className = 'img-fluid fp-img4'
        img2.alt = "Logo 4";
        img2.id = "fp-img4"
        img2.useMap = "#fp-map2"
        document.getElementById('fp-canvas-container4').appendChild(img2);
        // $('div#fp-canvas-container4').append(' <canvas class="fp-canvas4 d-none" id="fp-canvas4"></canvas> ');

        $("#pl_mixto").show();

        // var mapped_ubic = localStorage.getItem('mapped_area');

        getPlanos()
        getUbic();
        getUbic2();
    }
    return tipo_plano;
}
function send_ubic(ubic_bod, tipo_plano) {
    for (let i = 0; i < ubic_bod.length; i++) {
        const dato = ubic_bod[i];
        if (dato.status == true) {
            localStorage.setItem('code_ubicacion', dato.cod_bodega)
            localStorage.setItem('plano', dato.plano)
            localStorage.setItem('id_corp', dato.id_corp)
            localStorage.setItem('id_suc', dato.id_suc)
            $("#map_area").trigger("click");
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: dato.msg,
            })
        }

    }
    return ubic_bod;
}


/*Metodo para guardar las coordenadas en MBA3 desde la web */
function showConfirmation(params) {
    Swal.fire({
        title: '¿Quieres guardar las coordenadas?',
        icon: 'question',
        iconColor: '#6B949D',
        color: '#333', // Color del texto
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
            // Acción: cancelar
            limpiarCanvasYEstado();
        }
    });
}
function limpiarCanvasYEstado() {
    // Ocultar canvas
    $('#fp-canvas, #fp-canvas2, #fp-canvas3, #fp-canvas4').addClass('d-none');

    // Limpiar dibujo
    if (canvasState.A.ctx) canvasState.A.ctx.clearRect(0, 0, $('#fp-canvas')[0].width, $('#fp-canvas')[0].height);
    if (canvasState.B.ctx) canvasState.B.ctx.clearRect(0, 0, $('#fp-canvas2')[0].width, $('#fp-canvas2')[0].height);

    const c3 = $('#fp-canvas3')[0], c4 = $('#fp-canvas4')[0];
    if (c3 && c3.getContext) c3.getContext('2d').clearRect(0, 0, c3.width, c3.height);
    if (c4 && c4.getContext) c4.getContext('2d').clearRect(0, 0, c4.width, c4.height);

    // Reset canvasState
    const reset = (cs) => {
        cs.percent = { x1: 0, y1: 0, x2: 0, y2: 0 };
        cs.mouseStart = { x: 0, y: 0 };
        cs.mouseEnd = { x: 0, y: 0 };
        cs.isDrawing = false;
    }

    reset(canvasState.A);
    reset(canvasState.B);
    reset(canvasState.mixto.A);
    reset(canvasState.mixto.B);
    // Resetear modo dibujo
    canvasState.A.isDrawingMode = false;
    canvasState.B.isDrawingMode = false;
    canvasState.mixto.A.isDrawingMode = false;
    canvasState.mixto.B.isDrawingMode = false;
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
        localStorage.setItem('data', '[]');
        getPlanos();
        getUbic();
        getUbic2();

        Swal.fire({
            toast: true,
            icon: 'warning',
            title: `Producto sin mapear`,
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

    for (const element of data_plano) {
        if (element.tipo_plano !== storage_plano) continue;

        const coord1 = cleanCoord(element.coord_perc);
        const coord2 = cleanCoord(element.coord_perc2);

        if (coord1 !== "0,0,0,0" && coord2 === "0,0,0,0") {
            show_plane("diagrama");
            activeZoomHandler = setupZoomAndDrag('#fp-wrapper', '#zoom-in', '#zoom-out', '#fp-img');
            getUbic2();
        } else if (coord2 !== "0,0,0,0" && coord1 === "0,0,0,0") {
            show_plane("fotografia");
            activeZoomHandler = setupZoomAndDrag('#fp-wrapper2', '#zoom-in2', '#zoom-out2', '#fp-img2');
            getUbic();
        } else if (coord1 !== "0,0,0,0" && coord2 !== "0,0,0,0") {
            show_plane("mixto");
            getUbic();
            getUbic2();
        }
    }
}

function cleanCoord(coord) {
    return typeof coord === 'string' ? coord.replace(/\s/g, '') : '';
}

/*Funcion envia datos desde MBA3 A web plano por defuat*/
function config_all(dataJson) {
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

    function updateTransform() {
        $wrapper.css({
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transformOrigin: 'center center'
        });
    }

    function fitToContainer() {
        const img = $img[0];
        if (!img || !img.naturalWidth || !img.naturalHeight) return;

        updateTransform();
    }

    const img = $img[0];
    if (img.complete && img.naturalWidth) {
        fitToContainer();
    } else {
        img.onload = fitToContainer;
    }

    $(zoomInSelector).on('click', () => zoomIn());
    $(zoomOutSelector).on('click', () => zoomOut());

    let isDragging = false;
    let lastX, lastY;

    $wrapper.on('mousedown', function (e) {
        // Verificar si el clic es en un canvas y si estamos en modo dibujo
        const target = e.target;
        if (
            (target.classList.contains('fp-canvas') ||
                target.classList.contains('fp-canvas3') ||
                target.classList.contains('fp-canvas4')) &&
            isAnyCanvasInDrawingMode()
        ) {
            return; // ← No iniciar drag, dejar que el canvas maneje el evento
        }

        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        $wrapper.css('cursor', 'grabbing');
        e.preventDefault();
    });

    $(document).on('mousemove', function (e) {
        if (!isDragging) return;

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        translateX += dx;
        translateY += dy;

        lastX = e.clientX;
        lastY = e.clientY;

        updateTransform();
    });

    $(document).on('mouseup', function () {
        isDragging = false;
        $wrapper.css('cursor', 'grab');
    });

    $wrapper.on('mouseenter', function () {
        $wrapper.css('cursor', 'grab');
    });

    $wrapper.on('mouseleave', function () {
        if (!isDragging) {
            $wrapper.css('cursor', 'default');
        }
    });

    $(window).on('resize', fitToContainer);

    function zoomIn() {
        const newScale = Math.min(3, scale + 0.1);
        const delta = newScale - scale;
        translateX -= (delta * $img[0].naturalWidth) / 2;
        translateY -= (delta * $img[0].naturalHeight) / 2;
        scale = newScale;
        updateTransform();
    }

    function zoomOut() {
        const newScale = Math.max(0.1, scale - 0.1);
        const delta = newScale - scale;
        translateX -= (delta * $img[0].naturalWidth) / 2;
        translateY -= (delta * $img[0].naturalHeight) / 2;
        scale = newScale;
        updateTransform();
    }

    return {
        zoomIn,
        zoomOut
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
function zoom_mas() {
    console.log("+");

    if (activeZoomHandler) {
        activeZoomHandler.zoomIn();
    } else {
        console.warn("No hay contenedor activo");
    }
}

function zoom_menos() {
    console.log("-");

    if (activeZoomHandler) {
        activeZoomHandler.zoomOut();
    } else {
        console.warn("No hay contenedor activo");
    }
}
