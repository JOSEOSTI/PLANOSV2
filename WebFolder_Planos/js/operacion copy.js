function setupZoomAndDrag(wrapperSelector, zoomInSelector, zoomOutSelector, imgSelector) {
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    const $wrapper = $(wrapperSelector);
    const $img = $(imgSelector); // Referencia a la imagen para obtener dimensiones

    function updateTransform() {
        $wrapper.css({
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transformOrigin: 'center center'
        });
    }

    // Ajustar imagen al cargar
    function fitToContainer() {
        const img = $img[0];
        if (!img || !img.naturalWidth || !img.naturalHeight) return;

        const container = $wrapper.parent()[0]; // El contenedor visible
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = containerWidth / containerHeight;

        // Calcular escala para que la imagen quepa completamente
        if (imgRatio > containerRatio) {
            scale = containerWidth / img.naturalWidth;
        } else {
            scale = containerHeight / img.naturalHeight;
        }

        // Asegurar que no sobre-escalamos más del 100% si es pequeña
        scale = Math.min(scale, 1);

        // Centrar
        translateX = (containerWidth - img.naturalWidth * scale) / 2;
        translateY = (containerHeight - img.naturalHeight * scale) / 2;

        updateTransform();
    }

    // Inicializar al cargar
    const img = $img[0];
    if (img.complete && img.naturalWidth) {
        fitToContainer();
    } else {
        img.onload = fitToContainer;
    }

    // Zoom In
    $(zoomInSelector).on('click', function () {
        const newScale = Math.min(3, scale + 0.1);
        const delta = newScale - scale;

        // Ajustar translate para hacer zoom hacia el centro
        translateX -= (delta * $img[0].naturalWidth) / 2;
        translateY -= (delta * $img[0].naturalHeight) / 2;

        scale = newScale;
        updateTransform();
    });

    // Zoom Out
    $(zoomOutSelector).on('click', function () {
        const newScale = Math.max(0.1, scale - 0.1); // 0.1 para no desaparecer
        const delta = newScale - scale;

        // Ajustar translate para hacer zoom hacia el centro
        translateX -= (delta * $img[0].naturalWidth) / 2;
        translateY -= (delta * $img[0].naturalHeight) / 2;

        scale = newScale;
        updateTransform();
    });

    // --- Drag ---
    let isDragging = false;
    let lastX, lastY;

    $wrapper.on('mousedown', function (e) {
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

    // Cambiar cursor al hacer hover
    $wrapper.on('mouseenter', function () {
        $wrapper.css('cursor', 'grab');
    });

    $wrapper.on('mouseleave', function () {
        if (!isDragging) {
            $wrapper.css('cursor', 'default');
        }
    });

    // Ajustar al redimensionar ventana
    $(window).on('resize', fitToContainer);
}

// Inicializar
$(function () {
    setupZoomAndDrag('#fp-wrapper', '#zoom-in', '#zoom-out', '#fp-img');
    setupZoomAndDrag('#fp-wrapper2', '#zoom-in2', '#zoom-out2', '#fp-img2');
    setupZoomAndDrag('#fp-wrapper3', '#zoom-in3', '#zoom-out3', '#fp-img3');
    setupZoomAndDrag('#fp-wrapper4', '#zoom-in4', '#zoom-out4', '#fp-img4');
});